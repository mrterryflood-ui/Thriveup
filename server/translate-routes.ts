import type { Express, Request, Response } from "express";
import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (_openai) return _openai;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  _openai = new OpenAI({
    apiKey,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
  return _openai;
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  vi: "Vietnamese",
  zh: "Simplified Chinese",
  ar: "Arabic",
  ko: "Korean",
  fr: "French",
  tl: "Tagalog (Filipino)",
  hi: "Hindi",
  my: "Burmese",
};

// Process-local cache. Key: `${target}::${text}` -> translation
const cache = new Map<string, string>();
const MAX_CACHE = 5000;

// Per-IP rate limit (in-memory, sliding 60s window).
const RATE_LIMIT_PER_MIN = 30;
const MAX_TEXTS_PER_REQ = 100;
const MAX_CHARS_PER_REQ = 20000;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

// Purge expired entries every 5 minutes to bound memory growth under high-IP
// churn (e.g., scanning traffic with rotating addresses).
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits) {
    if (entry.resetAt < now) rateLimits.delete(key);
  }
}, 5 * 60_000).unref();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_MIN) return false;
  entry.count++;
  return true;
}

function getCached(target: string, text: string): string | undefined {
  return cache.get(`${target}::${text}`);
}
function setCached(target: string, text: string, translation: string) {
  if (cache.size >= MAX_CACHE) {
    // simple FIFO eviction: drop the oldest 500
    const keys = Array.from(cache.keys()).slice(0, 500);
    for (const k of keys) cache.delete(k);
  }
  cache.set(`${target}::${text}`, translation);
}

export function registerTranslateRoutes(app: Express) {
  app.post("/api/translate", async (req: Request, res: Response) => {
    try {
      // Use req.ip — Express populates this from X-Forwarded-For only when
      // `trust proxy` is set (replitAuth.ts sets it to 1), so it reflects the
      // real client address via the trusted reverse proxy rather than a
      // caller-supplied header value that could be forged.
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
      }

      const { texts, target } = req.body as { texts?: unknown; target?: unknown };

      if (!Array.isArray(texts) || typeof target !== "string" || !LANG_NAMES[target]) {
        return res.status(400).json({
          error: "Bad request. Expected: { texts: string[], target: 'en'|'es'|'vi'|'zh'|'ar'|'ko'|'fr'|'tl'|'hi'|'my' }",
        });
      }

      const cleanTexts: string[] = texts
        .filter((t): t is string => typeof t === "string" && t.length > 0 && t.length <= 2000)
        .slice(0, MAX_TEXTS_PER_REQ);

      const totalChars = cleanTexts.reduce((sum, t) => sum + t.length, 0);
      if (totalChars > MAX_CHARS_PER_REQ) {
        return res.status(413).json({ error: `Payload too large: ${totalChars} chars exceeds ${MAX_CHARS_PER_REQ}.` });
      }

      if (cleanTexts.length === 0) {
        return res.json({ translations: [] });
      }

      // Identity for English
      if (target === "en") {
        return res.json({ translations: cleanTexts });
      }

      const results: string[] = new Array(cleanTexts.length);
      const toTranslate: { idx: number; text: string }[] = [];

      cleanTexts.forEach((text, idx) => {
        const cached = getCached(target, text);
        if (cached !== undefined) {
          results[idx] = cached;
        } else {
          toTranslate.push({ idx, text });
        }
      });

      if (toTranslate.length > 0) {
        const openai = getOpenAI();
        if (!openai) {
          return res.status(503).json({ error: "Translation service unavailable: OPENAI_API_KEY not configured" });
        }

        const targetName = LANG_NAMES[target];
        const numbered = toTranslate.map((t, i) => `${i + 1}. ${t.text}`).join("\n");

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a professional translator producing UI strings in ${targetName}. Reply with ONLY the translated numbered list — same numbering, one item per line, no commentary, no markdown, no explanations. Keep proper nouns (ThriveUp, Sankofa, LifeBridge, LexiBridge, Talk Your Talk, MAP-GAP, CFIR, RE-AIM, SAM.gov, FAFSA, GI Bill, VA, etc.) untranslated.`,
            },
            {
              role: "user",
              content: `Translate each numbered line into ${targetName}. Preserve the numbering format exactly.\n\n${numbered}`,
            },
          ],
          temperature: 0.2,
        });

        const reply = completion.choices[0]?.message?.content || "";
        // Parse by extracting the explicit line number, not by array position —
        // if the model skips/merges a line, position-based mapping would corrupt every subsequent translation.
        const lineMap = new Map<number, string>();
        for (const raw of reply.split("\n")) {
          const m = raw.match(/^\s*(\d+)[\.\)]\s*(.*)$/);
          if (m) {
            const n = parseInt(m[1], 10);
            const text = m[2].trim();
            if (n > 0 && text) lineMap.set(n, text);
          }
        }

        toTranslate.forEach((t, i) => {
          const translated = lineMap.get(i + 1);
          // Fall back to original text on parse failure — caching the identity prevents
          // the client from re-requesting this string in a tight loop.
          const final = translated || t.text;
          results[t.idx] = final;
          setCached(target, t.text, final);
        });
      }

      res.json({ translations: results });
    } catch (err: any) {
      console.error("[translate]", err?.message || err);
      res.status(500).json({ error: err?.message || "Translation failed" });
    }
  });

  // Health/status — handy for the LanguageSelector UI to know if translation is wired up
  app.get("/api/translate/status", (_req: Request, res: Response) => {
    res.json({
      available: Boolean(process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY),
      cacheSize: cache.size,
      supportedLanguages: Object.keys(LANG_NAMES),
    });
  });
}
