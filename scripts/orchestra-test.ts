// Direct engine test — exercises the exact same phases as /api/orchestra/run
// without HTTP auth, so the run can be verified from the shell.
import { getProviderInfo, isPerplexityAvailable, perplexityResearch } from "../server/ai-provider";
import { buildCommunityAIContext } from "../server/rplice-intelligence";
import { runWithCommunityContext } from "../server/community-context";
import { collaborativeResponse, getCollaborativeStatus } from "../server/collaborative-ai";

const zip = process.argv[2] || "78653";

async function main() {
  const t0 = Date.now();
  console.log(`\n=== ORCHESTRA TEST — ZIP ${zip} ===\n`);

  // Phase 1: providers
  const providers = getProviderInfo();
  const collab = getCollaborativeStatus();
  console.log("[1/4] Providers:", providers.allProviders.map(p => `${p.name}(${p.model})`).join(", "));
  console.log("      Collaborative engines:", collab.enginesAvailable.map(e => e.id).join(", "));
  console.log("      Perplexity available:", isPerplexityAvailable());

  // Phase 2: community intelligence
  let t = Date.now();
  const community = await buildCommunityAIContext({ zip });
  console.log(`\n[2/4] Community intelligence: ${community.length} chars in ${Date.now() - t}ms`);
  console.log(community.slice(0, 600).replace(/^/gm, "      "));

  // Phase 3: Perplexity live research
  let research = { text: "", citations: [] as string[] };
  if (isPerplexityAvailable()) {
    t = Date.now();
    research = await perplexityResearch(
      `For ZIP code ${zip} (identify city/county/state), what are the most significant CURRENT community needs and open public funding opportunities? Be specific and cite sources.`,
      "You are a community-infrastructure research analyst. Only state facts you can cite.",
      800,
    );
    console.log(`\n[3/4] Perplexity research: ${research.text.length} chars, ${research.citations.length} citations in ${Date.now() - t}ms`);
    console.log(research.text.slice(0, 500).replace(/^/gm, "      "));
    console.log("      Citations:", research.citations.slice(0, 5).join(" | "));
  } else {
    console.log("\n[3/4] Perplexity unavailable — skipped");
  }

  // Phase 4: collaborative synthesis inside community context
  t = Date.now();
  const result = await runWithCommunityContext(community, () =>
    collaborativeResponse(
      `What are the three highest-leverage community-infrastructure investments for ZIP ${zip} right now?\n\n=== LIVE WEB RESEARCH ===\n${research.text}`,
      {
        systemPrompt: "You are the ThriveUp orchestration conductor. Synthesize live community data, web research, RAG, and RPLICE into a prioritized answer. Cite data sources. Plain language.",
        maxTokens: 900,
        topic: `community infrastructure ZIP ${zip}`,
      },
    ),
  );
  console.log(`\n[4/4] Collaborative synthesis in ${Date.now() - t}ms`);
  console.log("      Engines:", result.engines.map(e => `${e.engine}${e.error ? "(FAILED)" : `(${e.responseTimeMs}ms)`}`).join(", "));
  console.log("      Consensus:", result.consensusMethod, "| RAG chunks:", result.ragContext.chunkCount, "| RPLICE:", result.frameworks.rplice, "| MAP-GAP:", result.frameworks.mapGap);
  console.log("\n" + result.synthesis.slice(0, 1200).replace(/^/gm, "      "));

  console.log(`\n=== TOTAL: ${((Date.now() - t0) / 1000).toFixed(1)}s — ALL PHASES COMPLETE ===`);
  process.exit(0);
}

main().catch(err => { console.error("ORCHESTRA TEST FAILED:", err); process.exit(1); });
