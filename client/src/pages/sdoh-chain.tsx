import { SDOHImpactChain } from "@/components/sdoh-impact-chain";
import { DFCCrossNav } from "@/components/dfc-cross-nav";

export default function SDOHChainPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 via-white to-purple-50/30 dark:from-red-950/10 dark:via-background dark:to-purple-950/10" data-testid="sdoh-chain-page">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <SDOHImpactChain />
        <DFCCrossNav currentPage="sdoh-chain" />
      </div>
    </div>
  );
}
