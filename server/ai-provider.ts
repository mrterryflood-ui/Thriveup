import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import OpenAI from "openai";

type Provider = "gemini" | "openai" | "replit-ai-integrations";

interface StreamAIResponseParams {
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  onChunk: (content: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

function detectProvider(): Provider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) return "replit-ai-integrations";
  throw new Error(
    "No AI provider configured. Set one of: GEMINI_API_KEY (free), OPENAI_API_KEY, or AI_INTEGRATIONS_OPENAI_API_KEY + AI_INTEGRATIONS_OPENAI_BASE_URL"
  );
}

const PROVIDER_CONFIG: Record<Provider, { model: string; isFree: boolean }> = {
  gemini: { model: "gemini-2.0-flash", isFree: true },
  openai: { model: "gpt-4o-mini", isFree: false },
  "replit-ai-integrations": { model: "gpt-5-nano", isFree: false },
};

export function getActiveProvider(): string {
  return detectProvider();
}

export function getProviderInfo(): { name: string; model: string; isFree: boolean } {
  const provider = detectProvider();
  const config = PROVIDER_CONFIG[provider];
  return { name: provider, model: config.model, isFree: config.isFree };
}

async function streamGemini(params: StreamAIResponseParams): Promise<void> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  let systemInstruction: string | undefined;
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of params.messages) {
    if (msg.role === "system") {
      systemInstruction = msg.content;
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
    generationConfig: {
      maxOutputTokens: params.maxTokens || 2000,
    },
  });

  const result = await model.generateContentStream({ contents });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      params.onChunk(text);
    }
  }

  params.onDone();
}

async function streamOpenAI(params: StreamAIResponseParams, provider: "openai" | "replit-ai-integrations"): Promise<void> {
  let client: OpenAI;
  let model: string;

  if (provider === "openai") {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    model = "gpt-4o-mini";
  } else {
    client = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    model = "gpt-5-nano";
  }

  const stream = await client.chat.completions.create({
    model,
    messages: params.messages as Array<{ role: "system" | "user" | "assistant"; content: string }>,
    stream: true,
    max_completion_tokens: params.maxTokens || 2000,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      params.onChunk(content);
    }
  }

  params.onDone();
}

export async function streamAIResponse(params: StreamAIResponseParams): Promise<void> {
  const provider = detectProvider();

  try {
    if (provider === "gemini") {
      await streamGemini(params);
    } else {
      await streamOpenAI(params, provider);
    }
  } catch (error) {
    params.onError(error instanceof Error ? error : new Error(String(error)));
  }
}
