import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Receipt, Shield, ArrowRight, Loader2, CheckCircle2, XCircle, Lock,
  FileText, Hash, Sparkles, ExternalLink, Copy, AlertTriangle,
} from "lucide-react";

type ChainLink = {
  position: number;
  eventType: string;
  eventDomain: string;
  eventTitle: string;
  occurredAt: string;
  hash: string;
  hashShort: string;
  prevHashShort: string;
};

type DemoReceipt = {
  receiptId: string;
  issuedAt: string;
  issuer: string;
  issuerVersion: string;
  gift: { giftId: string; amountUsd: number; funder: string; giftDate: string; programCategory: string };
  resident: { alias: string; county: string; anonymized: boolean; pii: boolean };
  outcome: { eventType: string; eventDomain: string; eventTitle: string; occurredAt: string };
  proof: { chainPosition: number; chainTotalEvents: number; eventHash: string; prevHash: string; chainHead: string };
  verify: { method: string; endpoint: string; bodyExample: any };
};

type DemoResponse = {
  ok: boolean;
  resident: { alias: string; county: string; anonymized: boolean };
  chain: ChainLink[];
  chainHead: string;
  totalEvents: number;
  receipts: DemoReceipt[];
  disclosure: string;
};

type VerifyResponse = {
  ok: boolean;
  verified: boolean;
  receiptId: string | null;
  chainPosition: number;
  suppliedHash: string;
  derivedHash: string;
  chainHeadDerived: string;
  chainTotalEvents: number;
  verifiedAt: string;
  message: string;
};

const DOMAIN_COLORS: Record<string, string> = {
  reentry: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  workforce: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
  ai_training: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
  benefits: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  community: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30",
  geography: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
};

function ReceiptCard({ receipt, onVerify, verifyState }: {
  receipt: DemoReceipt;
  onVerify: (r: DemoReceipt) => void;
  verifyState?: { isPending: boolean; data?: VerifyResponse };
}) {
  const { toast } = useToast();
  const verified = verifyState?.data?.verified;
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5" data-testid={`card-receipt-${receipt.gift.giftId}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="outline" className="font-mono text-[10px] mb-1" data-testid={`text-receipt-id-${receipt.gift.giftId}`}>{receipt.receiptId}</Badge>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              ${receipt.gift.amountUsd.toLocaleString()} · {receipt.gift.programCategory}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {receipt.gift.funder} · gifted {receipt.gift.giftDate}
            </CardDescription>
          </div>
          {verifyState?.data && (
            <Badge variant={verified ? "default" : "destructive"} className="shrink-0" data-testid={`badge-verified-${receipt.gift.giftId}`}>
              {verified ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {verified ? "Verified" : "Failed"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border bg-card p-3 space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Outcome reached</div>
          <div className="font-medium text-sm" data-testid={`text-outcome-title-${receipt.gift.giftId}`}>{receipt.outcome.eventTitle}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className={`text-[10px] ${DOMAIN_COLORS[receipt.outcome.eventDomain] || ""}`}>{receipt.outcome.eventDomain}</Badge>
            <span>{new Date(receipt.outcome.occurredAt).toLocaleDateString()}</span>
            <span>·</span>
            <span>{receipt.resident.alias}</span>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
            <Hash className="h-3 w-3" /> Cryptographic proof
          </div>
          <div className="font-mono break-all" data-testid={`text-event-hash-${receipt.gift.giftId}`}>
            <span className="text-muted-foreground">event_hash:</span> {receipt.proof.eventHash}
          </div>
          <div className="text-muted-foreground">
            chain position {receipt.proof.chainPosition} of {receipt.proof.chainTotalEvents}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => onVerify(receipt)}
            disabled={verifyState?.isPending}
            data-testid={`button-verify-${receipt.gift.giftId}`}
          >
            {verifyState?.isPending ? (
              <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Verifying…</>
            ) : (
              <><Shield className="h-3 w-3 mr-1.5" /> Verify this receipt</>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
              toast({ title: "Receipt JSON copied", description: "Send this to a third-party verifier." });
            }}
            data-testid={`button-copy-${receipt.gift.giftId}`}
          >
            <Copy className="h-3 w-3 mr-1.5" /> Copy JSON
          </Button>
        </div>

        {verifyState?.data && (
          <div className={`text-xs rounded-md border p-2 ${verified ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"}`} data-testid={`text-verify-result-${receipt.gift.giftId}`}>
            {verifyState.data.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DonorReceiptDemoPage() {
  const { toast } = useToast();
  const [verifyResults, setVerifyResults] = useState<Record<string, { isPending: boolean; data?: VerifyResponse }>>({});

  const demoQuery = useQuery<DemoResponse>({
    queryKey: ["/api/donor/receipt-demo"],
  });

  const verifyMutation = useMutation({
    mutationFn: async (receipt: DemoReceipt) => {
      setVerifyResults((prev) => ({ ...prev, [receipt.gift.giftId]: { isPending: true } }));
      const res = await apiRequest("POST", "/api/donor/verify", {
        receiptId: receipt.receiptId,
        eventHash: receipt.proof.eventHash,
        chainPosition: receipt.proof.chainPosition,
      });
      return { receipt, data: (await res.json()) as VerifyResponse };
    },
    onSuccess: ({ receipt, data }) => {
      setVerifyResults((prev) => ({ ...prev, [receipt.gift.giftId]: { isPending: false, data } }));
      toast({
        title: data.verified ? "Receipt verified" : "Verification failed",
        description: data.message,
        variant: data.verified ? "default" : "destructive",
      });
    },
    onError: (err: any, receipt) => {
      setVerifyResults((prev) => ({ ...prev, [receipt.gift.giftId]: { isPending: false } }));
      toast({ title: "Verify request failed", description: String(err?.message || err), variant: "destructive" });
    },
  });

  const data = demoQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-amber-50/30 dark:from-blue-950/10 dark:via-background dark:to-amber-950/10" data-testid="page-donor-receipt-demo">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 space-y-8">

        {/* HEADER --------------------------------------------------------- */}
        <header className="space-y-3 max-w-3xl">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" /> Live demo · real journey · anonymized
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-page-title">
            Outcome Receipts — see one for yourself
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Below is a real resident journey running in production, with PII stripped. Every service event is hashed into a tamper-evident chain. Three example gifts are bound to specific events. Click "Verify" on any receipt — the server re-derives the chain from current data and confirms the hash still matches.
          </p>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Button variant="outline" size="sm" asChild data-testid="link-back-to-donors">
              <Link href="/donors">
                <ArrowRight className="h-3 w-3 mr-1.5 rotate-180" /> Back to /donors
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild data-testid="link-st-davids">
              <Link href="/st-davids">
                See the underlying enrollment engine
                <ExternalLink className="h-3 w-3 ml-1.5" />
              </Link>
            </Button>
          </div>
        </header>

        {/* LOADING / ERROR ------------------------------------------------ */}
        {demoQuery.isLoading && (
          <Card className="p-8 flex items-center justify-center" data-testid="state-loading">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading live chain…
          </Card>
        )}
        {demoQuery.isError && (
          <Card className="p-6 border-rose-500/30 bg-rose-500/5" data-testid="state-error">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Could not load the demo chain.</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {String((demoQuery.error as any)?.message || demoQuery.error || "Unknown error")}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  If this is a fresh environment, the demo cohort may need seeding. Try POSTing to <span className="font-mono">/api/resident/seed-demo</span> first.
                </div>
              </div>
            </div>
          </Card>
        )}

        {data && (
          <>
            {/* RESIDENT SUMMARY ------------------------------------------- */}
            <Card data-testid="card-resident-summary">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" /> Resident — fully anonymized
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Alias</div>
                    <div className="font-mono mt-0.5" data-testid="text-resident-alias">{data.resident.alias}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Region</div>
                    <div className="mt-0.5" data-testid="text-resident-county">{data.resident.county}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Events in chain</div>
                    <div className="font-semibold mt-0.5" data-testid="text-total-events">{data.totalEvents}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">PII exposed</div>
                    <div className="mt-0.5 text-emerald-600 dark:text-emerald-400 font-medium">None</div>
                  </div>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  <span className="font-mono text-foreground/80">chain_head</span> ·{" "}
                  <span className="font-mono break-all" data-testid="text-chain-head">{data.chainHead}</span>
                </div>
              </CardContent>
            </Card>

            {/* RECEIPTS --------------------------------------------------- */}
            <section className="space-y-3" data-testid="section-receipts">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold">Three live receipts bound to this resident's chain</h2>
                <span className="text-xs text-muted-foreground">Click "Verify" to re-derive from current data</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {data.receipts.map((r) => (
                  <ReceiptCard
                    key={r.gift.giftId}
                    receipt={r}
                    onVerify={(rec) => verifyMutation.mutate(rec)}
                    verifyState={verifyResults[r.gift.giftId]}
                  />
                ))}
              </div>
            </section>

            {/* CHAIN VIEW ------------------------------------------------- */}
            <section className="space-y-3" data-testid="section-chain">
              <h2 className="text-xl font-bold">The full event chain</h2>
              <p className="text-sm text-muted-foreground">
                Each row's hash incorporates the previous row's hash. Modify any past event in the underlying data and every hash from that point forward changes — no silent edits possible.
              </p>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold w-12">#</th>
                          <th className="text-left p-3 font-semibold">Event</th>
                          <th className="text-left p-3 font-semibold">Domain</th>
                          <th className="text-left p-3 font-semibold">When</th>
                          <th className="text-left p-3 font-semibold">Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.chain.map((link) => (
                          <tr key={link.position} className="border-b last:border-0 hover:bg-muted/20" data-testid={`row-chain-${link.position}`}>
                            <td className="p-3 font-mono text-muted-foreground">{link.position}</td>
                            <td className="p-3" data-testid={`text-chain-title-${link.position}`}>{link.eventTitle}</td>
                            <td className="p-3">
                              <Badge variant="outline" className={`text-[10px] ${DOMAIN_COLORS[link.eventDomain] || ""}`}>{link.eventDomain}</Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">{new Date(link.occurredAt).toLocaleDateString()}</td>
                            <td className="p-3 font-mono text-[10px] text-muted-foreground" data-testid={`text-chain-hash-${link.position}`}>{link.hashShort}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* DISCLOSURE ------------------------------------------------- */}
            <Card className="border-amber-500/30 bg-amber-500/5" data-testid="card-disclosure">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" /> Disclosure
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                {data.disclosure}
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </div>
  );
}
