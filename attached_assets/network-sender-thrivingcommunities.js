// Drop-in sender for thrivingcommunitiesforall.com → Data Stories Repository.
// Single self-contained file. Hand to the agent on thrivingcommunitiesforall.com.
//
// Setup (one time):
//   1. In Replit Tools → Secrets on thrivingcommunitiesforall.com, add:
//        NETWORK_SECRET_THRIVINGCOMMUNITIES = (the shared secret Terry already generated)
//        NETWORK_STORIES_INGEST_URL         = (the Repository's full ingest URL,
//                                              e.g. https://<repo-domain>/api/network/stories/ingest)
//   2. Drop this file into the project (e.g. server/network-sender.js).
//   3. Wire the publish hook (see USAGE block at bottom) and run the backfill once.

import crypto from "node:crypto";

const PLATFORM = "thrivingcommunities";

const ALLOWED_TAGS = new Set([
  "gun-violence",
  "social-determinants",
  "mental-health",
  "policy",
  "youth-violence",
  "community-impact",
  "evidence",
  "rplice-aligned",
]);

// A story is sent only if it carries at least one Repository-aligned tag.
export function shouldSendStory(story) {
  if (!story || !Array.isArray(story.tags)) return false;
  return story.tags.some((t) => ALLOWED_TAGS.has(t));
}

function buildSignedHeaders(rawBody) {
  const secret = process.env.NETWORK_SECRET_THRIVINGCOMMUNITIES;
  if (!secret) throw new Error("NETWORK_SECRET_THRIVINGCOMMUNITIES is not set");
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = crypto
    .createHmac("sha256", secret)
    .update(ts + "." + rawBody)
    .digest("hex");
  return {
    "Content-Type": "application/json",
    "X-Network-Platform": PLATFORM,
    "X-Network-Timestamp": ts,
    "X-Network-Signature": "sha256=" + sig,
  };
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function safeJson(t) { try { return JSON.parse(t); } catch { return t; } }

// Send one or many stories. Filters via tag-gate, batches up to 100, retries 5xx
// up to 3 times with exponential backoff. Never retries 4xx (deterministic errors).
export async function sendStories(input, opts = {}) {
  const url = process.env.NETWORK_STORIES_INGEST_URL;
  if (!url) throw new Error("NETWORK_STORIES_INGEST_URL is not set");

  const { maxRetries = 3, baseDelayMs = 500, batchSize = 100 } = opts;
  const arr = Array.isArray(input) ? input : [input];
  const stories = arr.filter(shouldSendStory);
  if (stories.length === 0) {
    return { sent: 0, skipped: arr.length, batches: [] };
  }

  const batches = [];
  for (let i = 0; i < stories.length; i += batchSize) {
    batches.push(stories.slice(i, i + batchSize));
  }

  const results = [];
  for (const batch of batches) {
    // CRITICAL: stringify exactly once. Sign these bytes. Send these bytes.
    // Do NOT re-serialize between sign and send — the signature would break.
    const rawBody = JSON.stringify(batch.length === 1 ? batch[0] : { stories: batch });

    let attempt = 0;
    while (true) {
      try {
        const headers = buildSignedHeaders(rawBody);
        const r = await fetch(url, { method: "POST", headers, body: rawBody });
        const text = await r.text();
        const body = safeJson(text);

        if (r.ok) {
          results.push({ ok: true, status: r.status, response: body, batchSize: batch.length });
          break;
        }
        // 4xx: deterministic (bad signature, bad payload). Do not retry.
        if (r.status >= 400 && r.status < 500) {
          console.error("[network-sender] 4xx, not retrying:", r.status, body);
          results.push({ ok: false, status: r.status, response: body, batchSize: batch.length });
          break;
        }
        // 5xx: retry with exponential backoff
        if (attempt >= maxRetries) {
          console.error("[network-sender] 5xx, retries exhausted:", r.status, body);
          results.push({ ok: false, status: r.status, response: body, batchSize: batch.length });
          break;
        }
        await sleep(baseDelayMs * Math.pow(2, attempt));
        attempt++;
      } catch (err) {
        // Network error (DNS, connection refused, etc.) — retry like a 5xx
        if (attempt >= maxRetries) {
          console.error("[network-sender] network error, retries exhausted:", err);
          results.push({ ok: false, error: String(err), batchSize: batch.length });
          break;
        }
        await sleep(baseDelayMs * Math.pow(2, attempt));
        attempt++;
      }
    }
  }

  return { sent: stories.length, skipped: arr.length - stories.length, batches: results };
}

// One-time backfill of the existing post archive.
//   loadAllPosts:    () => Promise<Array<Post>>     — your CMS read function
//   mapPostToStory:  (post) => Story                — adapter to the Repository shape
export async function backfillFromArchive(loadAllPosts, mapPostToStory) {
  const posts = await loadAllPosts();
  const stories = posts.map(mapPostToStory);
  const eligible = stories.filter(shouldSendStory);
  console.log(
    `[backfill] ${eligible.length} of ${posts.length} posts match the tag filter`
  );
  const result = await sendStories(eligible);
  console.log("[backfill] result:", JSON.stringify(result, null, 2));
  return result;
}

/* ------------------------------------------------------------------ *
 * USAGE — copy these snippets into your app, adjust to your CMS.
 * ------------------------------------------------------------------ *

// 1) Map your CMS post to the Repository's story shape.
function mapPostToStory(post) {
  return {
    externalId:  post.slug || String(post.id),                        // stable, unique per post
    title:       post.title,                                          // 1–500 chars
    url:         `https://thrivingcommunitiesforall.com/posts/${post.slug}`,
    excerpt:     post.excerpt || null,                                // ≤2000 chars
    body:        post.body    || null,                                // ≤100000 chars
    author:      post.author?.name || null,                           // ≤200 chars
    publishedAt: post.publishedAt?.toISOString?.() || post.publishedAt,
    tags:        post.tags || [],                                     // must include ≥1 ALLOWED_TAGS
    geographies: post.locations || [],                                // [{state, county?, city?}]
    topics:      post.topics    || [],                                // ≤50 items
  };
}

// 2) Wire the publish hook. Fire-and-forget so the user response is not blocked.
import { sendStories } from "./network-sender.js";

app.post("/admin/posts/:id/publish", async (req, res) => {
  const post = await db.publishPost(req.params.id);
  const story = mapPostToStory(post);
  sendStories(story).catch((err) =>
    console.error("[network-sender] publish hook failed", err)
  );
  res.json({ ok: true, post });
});

// Same call on update so edits propagate (idempotent thanks to externalId).
app.post("/admin/posts/:id/update", async (req, res) => {
  const post = await db.updatePost(req.params.id, req.body);
  sendStories(mapPostToStory(post)).catch((err) =>
    console.error("[network-sender] update hook failed", err)
  );
  res.json({ ok: true, post });
});

// 3) One-time backfill. Run from a script or an admin-only route.
import { backfillFromArchive } from "./network-sender.js";

await backfillFromArchive(
  () => db.posts.findAll(),    // loadAllPosts
  mapPostToStory               // your mapper from step 1
);

* ------------------------------------------------------------------ */
