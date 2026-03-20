import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { videoRenderJobs, insertVideoRenderJobSchema, ecosystemEvents } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

function generateMrssEntry(job: { title: string; id: number; duration: number | null; renderUrl: string | null; thumbnailUrl: string | null }) {
  const videoId = `thriveup-video-${job.id}`;
  const dur = job.duration || 300;
  const midTime = Math.floor(dur / 2);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>ThriveUp Academy Channel</title>
    <description>AI-Powered Workforce Development &amp; Community Impact</description>
    <item>
      <title>${job.title}</title>
      <link>https://thrivingcommunitiesforall.com/watch/${videoId}</link>
      <media:content url="${job.renderUrl || `https://cdn.thriveup.org/video/${videoId}.mp4`}"
        type="video/mp4" duration="${dur}" />
      <media:thumbnail url="${job.thumbnailUrl || `https://cdn.thriveup.org/thumbs/${videoId}.jpg`}" />
      <media:category>Education</media:category>
      <media:rating scheme="urn:v-chip">TV-G</media:rating>
      <roku:adBreaks>
        <roku:adBreak time="0" type="preroll" />
        <roku:adBreak time="${midTime}" type="midroll" />
        <roku:adBreak time="${dur}" type="postroll" />
      </roku:adBreaks>
    </item>
  </channel>
</rss>`;
}

function generateVastTag(job: { title: string; id: number }) {
  const adId = `thriveup-ad-${job.id}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.2" xmlns="http://www.iab.com/VAST">
  <Ad id="${adId}" sequence="1">
    <InLine>
      <AdSystem>ThriveUp Ad Server</AdSystem>
      <AdTitle>${job.title}</AdTitle>
      <Impression><![CDATA[https://track.thriveup.org/imp?id=${adId}]]></Impression>
      <Creatives>
        <Creative>
          <Linear>
            <Duration>00:00:30</Duration>
            <MediaFiles>
              <MediaFile delivery="progressive" type="video/mp4"
                width="1920" height="1080" bitrate="5000">
                <![CDATA[https://cdn.thriveup.org/ads/${adId}.mp4]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>`;
}

async function emitEcosystemEvent(eventType: string, data: Record<string, unknown>, targetPlatformId?: string) {
  try {
    await db.insert(ecosystemEvents).values({
      sourcePlatformId: "ecosystem-nexus",
      targetPlatformId: targetPlatformId || null,
      eventType,
      eventData: data,
      status: "pending",
    });
  } catch (e) {
    console.error("[VideoPipeline] Failed to emit ecosystem event:", e);
  }
}

export function registerVideoPipelineRoutes(app: Express) {
  app.get("/api/video-pipeline/jobs", async (_req: Request, res: Response) => {
    try {
      const jobs = await db.select().from(videoRenderJobs).orderBy(desc(videoRenderJobs.createdAt));
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch jobs" });
    }
  });

  app.get("/api/video-pipeline/stats", async (_req: Request, res: Response) => {
    try {
      const allJobs = await db.select().from(videoRenderJobs);
      const stats = {
        total: allJobs.length,
        queued: allJobs.filter(j => j.status === "queued").length,
        rendering: allJobs.filter(j => j.status === "rendering").length,
        complete: allJobs.filter(j => j.status === "complete").length,
        distributed: allJobs.filter(j => j.status === "distributed").length,
        failed: allJobs.filter(j => j.status === "failed").length,
      };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch stats" });
    }
  });

  app.post("/api/video-pipeline/render", async (req: Request, res: Response) => {
    try {
      const body = insertVideoRenderJobSchema.parse(req.body);
      const [job] = await db.insert(videoRenderJobs).values({
        ...body,
        status: "queued",
      }).returning();

      const mrss = generateMrssEntry(job);
      const vast = generateVastTag(job);
      const [updated] = await db.update(videoRenderJobs)
        .set({ mrssEntry: mrss, vastTag: vast, status: "rendering", updatedAt: new Date() })
        .where(eq(videoRenderJobs.id, job.id))
        .returning();

      setTimeout(async () => {
        try {
          const renderUrl = `https://cdn.thriveup.org/video/thriveup-video-${job.id}.mp4`;
          const thumbnailUrl = `https://cdn.thriveup.org/thumbs/thriveup-video-${job.id}.jpg`;
          const finalMrss = generateMrssEntry({ ...job, renderUrl, thumbnailUrl });
          await db.update(videoRenderJobs)
            .set({ status: "complete", renderUrl, thumbnailUrl, mrssEntry: finalMrss, updatedAt: new Date() })
            .where(eq(videoRenderJobs.id, job.id));

          await emitEcosystemEvent("video_rendered", {
            jobId: job.id,
            title: job.title,
            renderUrl,
            thumbnailUrl,
          });
        } catch (e) {
          await db.update(videoRenderJobs)
            .set({ status: "failed", updatedAt: new Date() })
            .where(eq(videoRenderJobs.id, job.id));
        }
      }, 3000);

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  app.post("/api/video-pipeline/distribute/:jobId", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId as string);
      const [job] = await db.select().from(videoRenderJobs).where(eq(videoRenderJobs.id, jobId));
      if (!job) return res.status(404).json({ error: "Job not found" });

      const platforms = job.targetPlatforms.length > 0 ? job.targetPlatforms : [
        "whole-person-health", "isss", "sankofa", "wholemind", "lifebridge",
        "mce", "betterscience", "m2c", "safereport", "perfectly-different",
        "shield-atlas", "safecognicare", "pillscheduler", "collaborative-advocate",
        "video-creator-ai", "ecosystem-nexus", "ad-targeting",
        "sankofa-feminine-health", "sankofa-maternal-health", "sankofa-mens-health",
      ];

      const distStatus: Record<string, string> = {};
      for (const platform of platforms) {
        distStatus[platform] = "pending";
        await emitEcosystemEvent("video_distributed", {
          jobId: job.id,
          title: job.title,
          renderUrl: job.renderUrl,
          thumbnailUrl: job.thumbnailUrl,
          mrssEntry: job.mrssEntry,
        }, platform);
        distStatus[platform] = "delivered";
      }

      const [updated] = await db.update(videoRenderJobs)
        .set({ status: "distributed", distributionStatus: distStatus, updatedAt: new Date() })
        .where(eq(videoRenderJobs.id, jobId))
        .returning();

      await emitEcosystemEvent("video_produced", {
        jobId: job.id,
        title: job.title,
        renderUrl: job.renderUrl,
        distributedTo: platforms,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Distribution failed" });
    }
  });

  app.patch("/api/video-pipeline/jobs/:jobId", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId as string);
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status required" });

      const [updated] = await db.update(videoRenderJobs)
        .set({ status, updatedAt: new Date() })
        .where(eq(videoRenderJobs.id, jobId))
        .returning();

      if (!updated) return res.status(404).json({ error: "Job not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Update failed" });
    }
  });
}
