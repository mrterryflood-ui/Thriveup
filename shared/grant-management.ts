import { z } from "zod";

export const grantBulkSchema = z.object({
  ids: z.array(z.string().trim().min(1).max(100)).min(1).max(100)
    .refine(ids => new Set(ids).size === ids.length, "Select each opportunity only once"),
  action: z.enum(["dismiss", "restore", "archive", "purge"]),
  confirmation: z.string().max(100).optional(),
}).strict();

export interface GrantManagementResponse {
  scope: "entity" | "corpus";
  canManageEntity: boolean;
  isAdmin: boolean;
  organizationName: string | null;
  summary: {
    corpus: number; activeCorpus: number; archived: number;
    added7Days: number; added30Days: number; lastCorpusWrite: string | null;
    legacyPipelineEntries: number; notInAnyEntityPipeline: number;
    entityTracked: number | null; entityDismissed: number | null;
    cachedResearchQueries: number;
  };
  page: number; pageSize: number; total: number;
  rows: Array<{ id: string; title: string; agency: string | null; source: string | null;
    status: string | null; createdAt: string | null; entityStatus: string | null }>;
  refresh: { status: "idle" | "running" | "complete" | "failed";
    startedAt?: string; finishedAt?: string; imported?: number; skipped?: number; error?: string };
}