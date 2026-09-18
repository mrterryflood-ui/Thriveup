import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentOrgId } from "@/hooks/use-current-org";
import jsPDF from "jspdf";

const SkylineMap         = lazy(() => import("@/components/viz3d/SkylineMap"));
const CascadeWaterfall   = lazy(() => import("@/components/viz3d/CascadeWaterfall"));
const HistoricalTimeline = lazy(() => import("@/components/viz3d/HistoricalTimeline"));
const GisNeedHeatMap     = lazy(() => import("@/components/gis/GisNeedHeatMap"));
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CommunityEvidencePanel } from "@/components/community-evidence-panel";
import { EvidenceSummary } from "@/components/evidence-label";
import { AIAugmentationDisclosure } from "@/components/ai-augmentation-disclosure";
import { VisualIntelligenceShell } from "@/components/gis/VisualIntelligenceShell";
import {
  Heart, Brain, Shield, Home, Baby, GraduationCap, Scale, Briefcase,
  Users, MapPin, Globe, Search, AlertTriangle, TrendingDown, TrendingUp,
  ArrowRight, DollarSign, Clock, Zap, ChevronRight, Download, Building2,
  Target, Lightbulb, FileText, UserCheck, Accessibility, TreePine,
  Send, CheckCircle2, Loader2, Lock, FlaskConical, BookOpen,
} from "lucide-react";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, any> = {
  Heart, Brain, Shield, Home, Baby, GraduationCap, Scale, Briefcase,
  Users, MapPin, Globe, UserCheck, Accessibility, TreePine, Building2,
};

function DomainIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Target;
  return <Icon className={className} />;
}

// ─── Urgency styling ──────────────────────────────────────────────────────────

const URGENCY_CONFIG: Record<string, { bg: string; text: string; border: string; badge: string; dot: string }> = {
  stable:  { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  watch:   { bg: "bg-amber-50 dark:bg-amber-950/30",   text: "text-amber-700 dark:text-amber-400",   border: "border-amber-200 dark:border-amber-800",   badge: "bg-amber-100 text-amber-800",   dot: "bg-amber-500"   },
  concern: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500" },
  crisis:  { bg: "bg-red-50 dark:bg-red-950/30",       text: "text-red-700 dark:text-red-400",       border: "border-red-200 dark:border-red-800",       badge: "bg-red-100 text-red-800",       dot: "bg-red-500"   },
};
const POP_URGENCY: Record<string, string> = {
  moderate: "border-l-amber-400",
  high:     "border-l-orange-500",
  critical: "border-l-red-600",
};

function fmt$(n: number | null | undefined) {
  if (!Number.isFinite(n as number)) return "—";
  const v = n as number;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

// ─── Community Invoice PDF ────────────────────────────────────────────────────

function generateInvoicePDF(data: any, locationQuery: string) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxW = W - margin * 2;
  let y = 0;

  const fmtD = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const geo = data.geography ?? {};
  const hist = data.historicalCascade ?? {};
  const casc = data.cascade ?? {};
  const displayName = geo.displayName || locationQuery;

  // ── Header band ─────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 36, "F");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("COMMUNITY INVOICE", margin, 14);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("TCAF scenario and historical model summary · ThriveUp Academy / TCAF", margin, 22);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, margin, 29);
  y = 46;

  // ── Location & grade ────────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(displayName, margin, y);
  if (data.overallGrade) {
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(`Systems grade: ${data.overallGrade}  (${data.overallScore ?? "—"}/100)`, margin + 2, y + 8);
  }
  y += 20;

  // ── Three-box verdict ───────────────────────────────────────────────────────
  const boxes = [
    ...(hist.totalAccumulatedCost != null ? [{ label: "HISTORICAL MODEL (2013–2022)", value: fmtD(hist.totalAccumulatedCost), sub: `${hist.trendDirection ?? "trend unavailable"} trend`, r: 180, g: 83, b: 9 }] : []),
    ...(casc.counterfactualCost != null ? [{ label: "TCAF SCENARIO (25yr)", value: fmtD(casc.counterfactualCost), sub: "forward model, not an observed cost", r: 185, g: 28, b: 28 }] : []),
    ...(casc.netSavings != null ? [{ label: "TCAF SCENARIO SAVINGS", value: fmtD(casc.netSavings), sub: `${casc.roi ?? "—"}× modeled return`, r: 5, g: 120, b: 85 }] : []),
  ];
  const bw = (maxW - 8) / 3;
  boxes.forEach((box, i) => {
    const bx = margin + i * (bw + 4);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(bx, y, bw, 28, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(bx, y, bw, 28, 2, 2, "S");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.text(box.label, bx + 4, y + 7);
    doc.setFontSize(14);
    doc.setTextColor(box.r, box.g, box.b);
    doc.setFont("helvetica", "bold");
    doc.text(box.value, bx + 4, y + 18);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(box.sub, bx + 4, y + 25);
  });
  y += 36;

  // ── Historical modeled estimate table ────────────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Historical Modeled Estimate", margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Per Census ACS 5-Year Estimates — evidence-based chain model (ECE gap → dropout → incarceration; MH → homelessness)", margin, y, { maxWidth: maxW });
  y += 10;

  const colW = [30, 38, 38, 50];
  const colX = [margin, margin + colW[0], margin + colW[0] + colW[1], margin + colW[0] + colW[1] + colW[2]];
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 4, maxW, 8, "F");
  ["Census Year", "Poverty Rate", "Unemployment", "Est. Cohort Cost"].forEach((h, i) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(h, colX[i] + 2, y + 1);
  });
  y += 8;

  (hist.vintages ?? []).forEach((v: any, idx: number) => {
    if (idx % 2 === 1) { doc.setFillColor(248, 250, 252); doc.rect(margin, y - 4, maxW, 8, "F"); }
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`${v.year} ACS`, colX[0] + 2, y + 1);
    doc.setTextColor(v.povertyRate >= 20 ? 185 : v.povertyRate >= 15 ? 234 : 5, v.povertyRate >= 20 ? 28 : v.povertyRate >= 15 ? 88 : 120, v.povertyRate >= 20 ? 28 : v.povertyRate >= 15 ? 12 : 85);
    doc.text(`${v.povertyRate.toFixed(1)}%`, colX[1] + 2, y + 1);
    doc.setTextColor(100, 116, 139);
    doc.text(`${v.unemploymentRate.toFixed(1)}%`, colX[2] + 2, y + 1);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(fmtD(v.cohortCost), colX[3] + 2, y + 1);
    y += 8;
  });
  doc.setDrawColor(180, 83, 9);
  doc.line(margin, y - 1, margin + maxW, y - 1);
  y += 4;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 83, 9);
    doc.text("TOTAL HISTORICAL MODEL OUTPUT", colX[0] + 2, y + 1);
    doc.text(hist.totalAccumulatedCost != null ? fmtD(hist.totalAccumulatedCost) : "Unavailable", colX[3] + 2, y + 1);
  y += 14;

  // ── Forward projection ───────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Forward Projection (Next 25 Years)", margin, y);
  y += 8;
  const fwRows = [
    ["TCAF scenario: cost of inaction", casc.counterfactualCost != null ? fmtD(casc.counterfactualCost) : "Unavailable", [185, 28, 28]],
    ["TCAF scenario: investment", casc.interventionCost != null ? fmtD(casc.interventionCost) : "Unavailable", [5, 120, 85]],
    ["TCAF scenario: net savings", casc.netSavings != null ? fmtD(casc.netSavings) : "Unavailable", [5, 120, 85]],
    ["Return on investment", `${casc.roi ?? "—"}×`, [5, 120, 85]],
  ];
  fwRows.forEach(([label, val, col]: any) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(label as string, margin + 2, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(col[0], col[1], col[2]);
    doc.text(val as string, W - margin - 2, y, { align: "right" });
    y += 7;
  });
  y += 6;

  // ── Key chains ───────────────────────────────────────────────────────────────
  if ((casc.keyChains ?? []).length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Evidence Chains Driving These Costs", margin, y);
    y += 8;
    (casc.keyChains as any[]).forEach((chain: any) => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const chainText = `• ${chain.chain ?? chain.name ?? ""}`;
      doc.text(chainText, margin + 2, y);
      if (chain.annualCost) {
        doc.setTextColor(185, 28, 28);
        doc.text(fmtD(chain.annualCost) + "/yr", W - margin - 2, y, { align: "right" });
      }
      y += 6;
      if (chain.description) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        const descLines = doc.splitTextToSize(`  ${chain.description}`, maxW - 8);
        doc.text(descLines, margin + 6, y);
        y += descLines.length * 5 + 2;
      }
    });
    y += 4;
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setFillColor(241, 245, 249);
  doc.rect(0, footerY - 4, W, 18, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Observed inputs: Census ACS at the disclosed geography. Costs are TCAF model/scenario outputs, not Census-verified expenditures.", margin, footerY + 2, { maxWidth: maxW - 30 });
  doc.text("thriveupacademy.com", W - margin, footerY + 2, { align: "right" });

  doc.save(`community-invoice-${(displayName || locationQuery).replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`);
}

// ─── Verdict Hero ─────────────────────────────────────────────────────────────

function useSendToGrantPathPro(data: any, locationQuery: string) {
  const [gppState, setGppState] = useState<"idle" | "sending" | "delivered" | "preview" | "error" | "accessDenied">("idle");
  const resetTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);
  const resetAfter = (delay: number) => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setGppState("idle"), delay);
  };

  const sendToGPP = async () => {
    if (gppState === "sending" || gppState === "delivered") return;
    setGppState("sending");
    try {
      const res = await apiRequest("POST", "/api/conductor/export-to-grantpathpro", {
        brief: data,
        geography: data.geography ?? { zip: locationQuery },
      });
      const result = await res.json();
      if (result.success && result.mode === "live") {
        setGppState("delivered");
        resetAfter(6000);
      } else if (result.success && result.mode === "preview") {
        setGppState("preview");
        resetAfter(6000);
      } else {
        setGppState("error");
        resetAfter(4000);
      }
    } catch (err) {
      setGppState(/^(401|403):/.test(err instanceof Error ? err.message : "") ? "accessDenied" : "error");
      resetAfter(4000);
    }
  };

  return { gppState, sendToGPP };
}

function StripPdfButton({ data, submitted }: { data: any; submitted: string }) {
  const [pdfState, setPdfState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const resetTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);
  const handleClick = async () => {
    if (pdfState === "loading") return;
    setPdfState("loading");
    try {
      await downloadCommunityBriefPdf(submitted);
      setPdfState("done");
      resetTimer.current = window.setTimeout(() => setPdfState("idle"), 4000);
    } catch {
      setPdfState("error");
      resetTimer.current = window.setTimeout(() => setPdfState("idle"), 4000);
    }
  };
  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleClick} disabled={pdfState === "loading"} aria-live="polite" data-testid="button-download-brief-pdf-strip">
      {pdfState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
      {pdfState === "loading" ? "Generating…" : pdfState === "done" ? "Downloaded!" : pdfState === "error" ? "PDF Error" : "Download PDF"}
    </Button>
  );
}

function StripShareButton({ data }: { data: any }) {
  const { shareState, shareBrief } = useShareBrief();
  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => shareBrief(data)} disabled={shareState === "sharing"} data-testid="button-share-brief-strip">
      {shareState === "sharing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      {shareState === "sharing" ? "Creating link…" : shareState === "done" ? "Link ready" : shareState === "error" ? "Share failed" : "Share link"}
    </Button>
  );
}

function GppExportButton({ data, submitted, canRequestExport }: { data: any; submitted: string; canRequestExport: boolean }) {
  const { gppState, sendToGPP } = useSendToGrantPathPro(data, submitted);
  if (!canRequestExport) {
    return <span className="self-center text-xs text-muted-foreground">Staff sign-in is required to send a brief to GrantPathPro.</span>;
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={sendToGPP}
      disabled={gppState === "sending"}
      className={`gap-1.5 ${
        gppState === "delivered"
          ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
          : gppState === "preview"
          ? "border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/20"
          : gppState === "error"
          ? "border-red-400 text-red-600"
          : "border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
      }`}
      data-testid="button-export-grantpathpro"
    >
      {gppState === "sending" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {gppState === "delivered" && <CheckCircle2 className="w-3.5 h-3.5" />}
      {gppState === "error" && <AlertTriangle className="w-3.5 h-3.5" />}
      {gppState === "idle" && <Send className="w-3.5 h-3.5" />}
      {gppState === "sending" ? "Sending…" : gppState === "delivered" ? "Delivered to GrantPathPro" : gppState === "preview" ? "Preview only — not delivered" : gppState === "accessDenied" ? "Staff access required" : gppState === "error" ? "Retry GPP" : "Send to GrantPathPro"}
    </Button>
  );
}

// ─── Server-side PDF Download ─────────────────────────────────────────────────

async function downloadCommunityBriefPdf(locationQuery: string, orgName?: string) {
  const res = await fetch("/api/export/community-brief-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location: locationQuery, populationSize: 10000, timeHorizon: 25, orgName }),
  });
  if (!res.ok) {
    let msg = "PDF generation failed";
    try { msg = (await res.json()).error ?? msg; } catch {}
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `community-brief-${locationQuery.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function useShareBrief() {
  const { toast } = useToast();
  const [shareState, setShareState] = useState<"idle" | "sharing" | "done" | "error">("idle");
  const resetTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  const shareBrief = async (brief: any) => {
    if (shareState === "sharing") return;
    setShareState("sharing");
    try {
      const res = await apiRequest("POST", "/api/conductor/community-brief/share", brief);
      const { shareUrl } = await res.json() as { shareUrl: string };
      let copied = false;
      try {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } catch {
        // The link remains visible in the toast for manual copy in blocked contexts.
      }
      toast({
        title: copied ? "Share link copied" : "Share link ready",
        description: copied ? shareUrl : `Copy this link: ${shareUrl}`,
        duration: 8000,
      });
      setShareState("done");
      resetTimer.current = window.setTimeout(() => setShareState("idle"), 6000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create share link";
      toast({ title: "Share failed", description: msg, variant: "destructive" });
      setShareState("error");
      resetTimer.current = window.setTimeout(() => setShareState("idle"), 4000);
    }
  };

  return { shareState, shareBrief };
}

function VerdictHero({ data, locationQuery, canRequestExport }: { data: any; locationQuery: string; canRequestExport: boolean }) {
  const geo = data.geography ?? {};
  const hist = data.historicalCascade ?? {};
  const casc = data.cascade ?? {};
  const histTotal = hist.totalAccumulatedCost;
  const forwardCost = casc.counterfactualCost;
  const savings = casc.netSavings;
  const roi = casc.roi ?? "—";
  const trend = hist.trendDirection ?? "stagnant";
  const trendIcon = trend === "improving" ? "↗" : trend === "worsening" ? "↘" : "→";
  const trendColor = trend === "improving" ? "text-emerald-400" : trend === "worsening" ? "text-red-400" : "text-amber-400";

  const { gppState, sendToGPP } = useSendToGrantPathPro(data, locationQuery);
  const { shareState, shareBrief } = useShareBrief();
  const { toast } = useToast();
  const [pdfState, setPdfState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const resetTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);
  const handleDownloadModelSummary = () => {
    try {
      generateInvoicePDF(data, locationQuery);
    } catch (error) {
      console.error("[community-impact] model summary download failed", error);
      toast({ title: "Download failed", description: "The model summary could not be generated. Please try again.", variant: "destructive" });
    }
  };

  const handleDownloadPdf = async () => {
    if (pdfState === "loading") return;
    setPdfState("loading");
    try {
      await downloadCommunityBriefPdf(locationQuery);
      setPdfState("done");
      resetTimer.current = window.setTimeout(() => setPdfState("idle"), 4000);
    } catch {
      setPdfState("error");
      resetTimer.current = window.setTimeout(() => setPdfState("idle"), 4000);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 text-white" data-testid="section-verdict-hero">
      <div className="px-6 py-5 border-b border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-semibold">Community Verdict</div>
          <h2 className="text-xl font-black text-white">{geo.displayName || locationQuery}</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(histTotal != null || forwardCost != null || savings != null) && (
            <button
              onClick={handleDownloadModelSummary}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-semibold px-3 py-2 rounded-lg border border-white/20"
              data-testid="button-download-invoice"
            >
              <Download className="w-3.5 h-3.5" />Download Model Summary
            </button>
          )}
          <button
            onClick={handleDownloadPdf}
            disabled={pdfState === "loading"}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-semibold px-3 py-2 rounded-lg border border-white/20 disabled:opacity-60"
            data-testid="button-download-brief-pdf"
          >
            {pdfState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
             {pdfState === "loading" ? "Generating…" : pdfState === "done" ? "Downloaded!" : pdfState === "error" ? "PDF generation failed — retry" : "Download PDF"}
          </button>
          <button
            onClick={() => shareBrief(data)}
            disabled={shareState === "sharing"}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-semibold px-3 py-2 rounded-lg border border-white/20 disabled:opacity-60"
            data-testid="button-share-brief"
          >
            {shareState === "sharing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {shareState === "sharing" ? "Creating link…" : shareState === "done" ? "Link ready" : shareState === "error" ? "Share failed" : "Share link"}
          </button>
          <a href={`/community-compare?a=${encodeURIComponent(locationQuery)}`}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-semibold px-3 py-2 rounded-lg border border-white/20"
            data-testid="link-compare-from-verdict">
            <ArrowRight className="w-3.5 h-3.5" />Compare
          </a>
          {canRequestExport ? <button
            onClick={sendToGPP}
            disabled={gppState === "sending"}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
              gppState === "delivered"
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : gppState === "preview"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
                : gppState === "error"
                ? "bg-red-500/20 border-red-500/40 text-red-300"
                : "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300"
            }`}
            data-testid="button-send-to-grantpathpro"
          >
            {gppState === "sending" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {gppState === "delivered" && <CheckCircle2 className="w-3.5 h-3.5" />}
            {gppState === "error" && <AlertTriangle className="w-3.5 h-3.5" />}
            {gppState === "idle" && <Send className="w-3.5 h-3.5" />}
            {gppState === "sending" ? "Sending…" : gppState === "delivered" ? "Delivered to GrantPathPro" : gppState === "preview" ? "Preview only — not delivered" : gppState === "accessDenied" ? "Staff access required" : gppState === "error" ? "Retry" : "Send to GrantPathPro"}
          </button> : <span className="self-center text-xs text-amber-200">Staff sign-in required for GrantPathPro delivery.</span>}
        </div>
      </div>
      {histTotal == null && forwardCost == null && savings == null ? (
        <div className="px-6 py-5 text-sm text-slate-300">TCAF scenario and historical model outputs are unavailable because the required observed inputs were not returned. No values were substituted.</div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60">
        {histTotal != null && (
        <div className="px-6 py-5 flex flex-col gap-1">
          <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Historical model · 2013–2022</div>
          <div className="text-4xl font-black text-amber-400 tabular-nums" data-testid="verdict-historical-total">
            {histTotal >= 1e9 ? `$${(histTotal/1e9).toFixed(1)}B` : histTotal >= 1e6 ? `$${(histTotal/1e6).toFixed(1)}M` : histTotal >= 1e3 ? `$${(histTotal/1e3).toFixed(0)}K` : `$${histTotal}`}
          </div>
          <div className={`text-xs font-semibold mt-1 ${trendColor}`}>{trendIcon} Poverty trend {trend}</div>
          <div className="text-xs text-slate-400 mt-0.5">TCAF historical model, not Census-verified expenditure</div>
        </div>
        )}
        {forwardCost != null && (
        <div className="px-6 py-5 flex flex-col gap-1">
          <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Next 25 Years · No Action</div>
          <div className="text-4xl font-black text-red-400 tabular-nums" data-testid="verdict-forward-cost">
            {forwardCost >= 1e9 ? `$${(forwardCost/1e9).toFixed(1)}B` : forwardCost >= 1e6 ? `$${(forwardCost/1e6).toFixed(1)}M` : forwardCost >= 1e3 ? `$${(forwardCost/1e3).toFixed(0)}K` : `$${forwardCost}`}
          </div>
          <div className="text-xs text-red-400 font-semibold mt-1">TCAF scenario if nothing changes</div>
          <div className="text-xs text-slate-400 mt-0.5">Model output · ECE gap → dropout → incarceration</div>
        </div>
        )}
        {savings != null && (
        <div className="px-6 py-5 flex flex-col gap-1">
          <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Savings · With Investment</div>
          <div className="text-4xl font-black text-emerald-400 tabular-nums" data-testid="verdict-savings">
            {savings >= 1e9 ? `$${(savings/1e9).toFixed(1)}B` : savings >= 1e6 ? `$${(savings/1e6).toFixed(1)}M` : savings >= 1e3 ? `$${(savings/1e3).toFixed(0)}K` : `$${savings}`}
          </div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">TCAF scenario · {roi}× modeled return</div>
          <div className="text-xs text-slate-400 mt-0.5">Not an observed or Census-verified savings figure</div>
        </div>
        )}
      </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreRing({ score, grade, urgency }: { score: number; grade: string; urgency: string }) {
  const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.watch;
  const color = urgency === "stable" ? "#10b981" : urgency === "watch" ? "#f59e0b" : urgency === "concern" ? "#f97316" : "#ef4444";
  const r = 26; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold leading-none">{grade}</div>
        <div className="text-[10px] text-muted-foreground">{score}</div>
      </div>
    </div>
  );
}

function SystemsVitals({ scores }: { scores: Record<string, any> }) {
  return (
    <section data-testid="section-systems-vitals">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" />Systems Vitals</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(scores).map(([key, d]: [string, any]) => {
          const cfg = URGENCY_CONFIG[d.urgency] || URGENCY_CONFIG.watch;
          return (
            <Card key={key} className={`p-3 border ${cfg.border} ${cfg.bg} flex flex-col gap-2`} data-testid={`card-domain-${key}`}>
              <div className="flex items-start justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg} ${cfg.text}`}>
                  <DomainIcon name={d.icon} className="w-4 h-4" />
                </div>
                <ScoreRing score={d.score} grade={d.grade} urgency={d.urgency} />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">{d.label}</div>
                <div className={`text-[11px] mt-1 leading-snug ${cfg.text}`}>{d.keyGap}</div>
              </div>
              <Badge className={`text-[10px] px-1.5 py-0.5 w-fit ${cfg.badge}`}>{d.urgency.toUpperCase()}</Badge>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function PopulationSnapshot({ populations }: { populations: any[] }) {
  return (
    <section data-testid="section-population-snapshot">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" />Who Is Falling Through the Gaps</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {populations.map((p: any) => (
          <Card key={p.id} className={`p-4 border-l-4 ${POP_URGENCY[p.urgency] || "border-l-amber-400"}`} data-testid={`card-pop-${p.id}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-2xl font-bold mt-0.5">{Number.isFinite(p.estimated) ? p.estimated.toLocaleString() : "—"} <span className="text-sm font-normal text-muted-foreground">{p.unit}</span></div>
              </div>
              <Badge variant={p.urgency === "critical" ? "destructive" : "outline"} className="text-[10px]">{p.urgency}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{p.primaryGap}</p>
            <div className="flex flex-wrap gap-1">
              {(p.interventions || []).slice(0, 3).map((iv: string, i: number) => (
                <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{iv}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function LifeArcTimeline({ timeline }: { timeline: any[] }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <section data-testid="section-life-arc">
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-500" />The 25-Year Story — Two Paths
      </h2>
      <p className="text-sm text-muted-foreground mb-5">Click any stage to see what changes with — and without — early investment.</p>

      <div className="relative overflow-x-auto pb-2">
        {/* WITHOUT row */}
        <div className="flex items-stretch gap-0 mb-1">
          <div className="flex-none w-28 flex items-center justify-end pr-3">
            <span className="text-xs font-semibold text-red-600 flex items-center gap-1"><TrendingDown className="w-3 h-3" />Without</span>
          </div>
          <div className="flex gap-0 flex-1">
            {timeline.map((node: any, i: number) => (
              <button
                key={i}
                onClick={() => setActive(active === i ? null : i)}
                className={`flex-1 min-w-[90px] text-left p-2 rounded-t-lg border border-b-0 text-[11px] leading-snug transition-all
                  ${active === i ? "bg-red-100 dark:bg-red-950 border-red-400" : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/60"}`}
                data-testid={`timeline-without-${i}`}
              >
                <span className="line-clamp-3 text-red-800 dark:text-red-300">{node.without}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Age axis */}
        <div className="flex gap-0">
          <div className="flex-none w-28" />
          <div className="flex flex-1">
            {timeline.map((node: any, i: number) => (
              <div key={i}
                onClick={() => setActive(active === i ? null : i)}
                className={`flex-1 min-w-[90px] flex flex-col items-center justify-center py-2 cursor-pointer border-x border-gray-200 dark:border-gray-700 transition-all
                  ${active === i ? "bg-purple-100 dark:bg-purple-950" : "bg-muted/60"}`}
              >
                <div className={`w-3 h-3 rounded-full mb-1 ${active === i ? "bg-purple-500" : "bg-gray-400"}`} />
                <span className="text-[11px] font-bold text-center leading-none">{node.age}</span>
                <span className="text-[10px] text-muted-foreground text-center mt-0.5 leading-none line-clamp-1">{node.milestone}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WITH row */}
        <div className="flex items-stretch gap-0 mt-1">
          <div className="flex-none w-28 flex items-center justify-end pr-3">
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" />With</span>
          </div>
          <div className="flex gap-0 flex-1">
            {timeline.map((node: any, i: number) => (
              <button
                key={i}
                onClick={() => setActive(active === i ? null : i)}
                className={`flex-1 min-w-[90px] text-left p-2 rounded-b-lg border border-t-0 text-[11px] leading-snug transition-all
                  ${active === i ? "bg-emerald-100 dark:bg-emerald-950 border-emerald-400" : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"}`}
                data-testid={`timeline-with-${i}`}
              >
                <span className="line-clamp-3 text-emerald-800 dark:text-emerald-300">{node.with}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {active !== null && timeline[active] && (
        <Card className="mt-4 p-4 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30" data-testid="panel-timeline-detail">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-none">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-purple-900 dark:text-purple-200">{timeline[active].age} — {timeline[active].milestone}</div>
              {timeline[active].interventionWindow && (
                <div className="mt-1 text-xs text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" />{timeline[active].interventionWindow}
                </div>
              )}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-red-50 dark:bg-red-950/50 rounded-lg p-3 border border-red-200 dark:border-red-800">
                  <div className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" />Without Intervention</div>
                  <p className="text-xs text-red-800 dark:text-red-300">{timeline[active].without}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/50 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />With Evidence-Based Investment</div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">{timeline[active].with}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </section>
  );
}

function CounterfactualPanel({ cascade }: { cascade: any }) {
  if (!cascade) return null;
  return (
    <section data-testid="section-counterfactual">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" />The Cost of Inaction vs. Investment</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 text-center border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30" data-testid="card-cost-inaction">
          <TrendingDown className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-3xl font-bold text-red-700 dark:text-red-400">{fmt$(cascade.counterfactualCost)}</div>
          <div className="text-sm text-red-600 dark:text-red-500 mt-1">Cost of doing nothing</div>
          <div className="text-xs text-muted-foreground mt-1">over {cascade.timeHorizonYears} years</div>
        </Card>
        <Card className="p-5 text-center border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30" data-testid="card-cost-intervention">
          <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{fmt$(cascade.interventionCost)}</div>
          <div className="text-sm text-blue-600 dark:text-blue-500 mt-1">Evidence-based investment</div>
          <div className="text-xs text-muted-foreground mt-1">pre-K · Medicaid · Housing First · NFP</div>
        </Card>
        <Card className="p-5 text-center border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30" data-testid="card-net-savings">
          <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{fmt$(cascade.netSavings)}</div>
          <div className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">Net savings to taxpayers</div>
          <div className="text-xs text-muted-foreground mt-1">{cascade.roi}× return on investment</div>
        </Card>
      </div>

      <div className="space-y-3">
        {(cascade.keyChains || []).map((chain: any, i: number) => (
          <Card key={i} className="p-4" data-testid={`card-chain-${i}`}>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-none text-xs font-bold">{i + 1}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  {chain.chain}
                  <Badge variant="outline" className="text-[10px] text-red-600 border-red-300">{fmt$(chain.costDelta)} cost</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="bg-red-50 dark:bg-red-950/40 rounded p-2 text-red-700 dark:text-red-400"><span className="font-medium">Without:</span> {chain.without}</div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded p-2 text-emerald-700 dark:text-emerald-400"><span className="font-medium">With:</span> {chain.with}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function SolutionsLayer({ solutions, policyContext }: { solutions: any; policyContext: any }) {
  const [tab, setTab] = useState<"interventions" | "grants" | "policy">("interventions");

  return (
    <section data-testid="section-solutions">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500" />Evidence-Based Solutions</h2>
      <div className="flex gap-2 mb-4">
        {(["interventions", "grants", "policy"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
            data-testid={`tab-${t}`}
          >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === "interventions" && (
        <div className="space-y-3">
          {(solutions.topInterventions || []).length === 0
            ? <p className="text-muted-foreground text-sm">Run a community brief to load evidence-based programs.</p>
            : (solutions.topInterventions || []).map((prog: any, i: number) => (
              <Card key={i} className="p-4" data-testid={`card-intervention-${i}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{prog.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{prog.targetPopulation}</div>
                    <div className="text-xs mt-1">{prog.evidenceSummary || prog.description}</div>
                    {prog.roiPerDollar && (
                      <Badge className="mt-2 bg-emerald-100 text-emerald-800 text-[10px]">
                        ${prog.roiPerDollar.toFixed(2)} returned per $1 invested
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] flex-none">{prog.evidenceTier || "Evidence-based"}</Badge>
                </div>
              </Card>
            ))}
        </div>
      )}

      {tab === "grants" && (
        <div className="space-y-3">
          {(solutions.grants || []).length === 0
            ? <p className="text-muted-foreground text-sm">No grant matches found. Run an AI Grant Hunt in Grant Hub for this community's profile.</p>
            : (solutions.grants || []).map((g: any, i: number) => (
              <Card key={i} className="p-4" data-testid={`card-grant-${i}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{g.title}</div>
                    <div className="text-xs text-muted-foreground">{g.agency}</div>
                    {g.fundingAmount && <div className="text-xs mt-1 font-medium text-emerald-700">{g.fundingAmount}</div>}
                    {g.deadline && <div className="text-xs text-muted-foreground">Deadline: {g.deadline}</div>}
                  </div>
                  {g.fitScore && (
                    <Badge className={`flex-none text-[10px] ${g.fitScore >= 70 ? "bg-emerald-100 text-emerald-800" : g.fitScore >= 40 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"}`}>
                      {g.fitScore}% fit
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          <div className="text-center pt-2">
            <a href="/this-week" className="text-sm text-primary hover:underline flex items-center gap-1 justify-center" data-testid="link-grant-hub">
              Find more grants in This Week <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {tab === "policy" && (
        <div className="space-y-4">
          {policyContext?.strengths?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">State Policy Strengths</h3>
              <ul className="space-y-1">
                {policyContext.strengths.map((s: string, i: number) => (
                  <li key={i} className="text-sm flex gap-2 items-start">
                    <TrendingUp className="w-4 h-4 text-emerald-500 flex-none mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {policyContext?.gaps?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Policy Gaps to Address</h3>
              <ul className="space-y-1">
                {policyContext.gaps.map((g: string, i: number) => (
                  <li key={i} className="text-sm flex gap-2 items-start">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-none mt-0.5" />{g}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold mb-2">Recommended Policy Actions</h3>
            <ul className="space-y-1">
              {(solutions.policyActions || []).map((action: string, i: number) => (
                <li key={i} className="text-sm flex gap-2 items-start">
                  <ArrowRight className="w-4 h-4 text-blue-500 flex-none mt-0.5" />{action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function DemographicsStrip({ geo, demographics, overallScore, overallGrade }: { geo: any; demographics: any; overallScore: number; overallGrade: string }) {
  const items = [
    { label: "Poverty Rate", value: demographics.povertyRate != null ? `${demographics.povertyRate.toFixed(1)}%` : "—", warn: demographics.povertyRate > 15 },
    { label: "Uninsured", value: demographics.uninsuredRate != null ? `${demographics.uninsuredRate.toFixed(1)}%` : "—", warn: demographics.uninsuredRate > 10 },
    { label: "Housing Burden", value: demographics.housingCostBurden != null ? `${demographics.housingCostBurden.toFixed(0)}%` : "—", warn: demographics.housingCostBurden > 30 },
    { label: "Unemployment", value: demographics.unemploymentRate != null ? `${demographics.unemploymentRate.toFixed(1)}%` : "—", warn: demographics.unemploymentRate > 6 },
    { label: "No HS Diploma", value: demographics.noHighSchoolDiploma != null ? `${demographics.noHighSchoolDiploma.toFixed(1)}%` : "—", warn: demographics.noHighSchoolDiploma > 12 },
    { label: "Single Parent", value: demographics.singleParentRate != null ? `${demographics.singleParentRate.toFixed(0)}%` : "—", warn: demographics.singleParentRate > 25 },
  ];
  return (
    <Card className="p-4" data-testid="card-demographics-strip">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold">{geo.displayName}</h1>
          <p className="text-sm text-muted-foreground">{geo.countyName} · ZIP {geo.zip}</p>
        </div>
        <div className="text-center">
          <div className={`text-5xl font-black ${overallGrade === "A" ? "text-emerald-600" : overallGrade === "B" ? "text-amber-600" : overallGrade === "C" ? "text-orange-600" : "text-red-600"}`}>{overallGrade}</div>
          <div className="text-xs text-muted-foreground">overall systems grade</div>
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {items.map((item) => (
          <div key={item.label} className={`rounded-lg p-2 text-center ${item.warn ? "bg-red-50 dark:bg-red-950/40" : "bg-muted/50"}`} data-testid={`stat-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className={`text-lg font-bold ${item.warn ? "text-red-700 dark:text-red-400" : ""}`}>{item.value}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{item.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const VIZ_TABS = [
  { id: "skyline",    label: "🏙 Skyline Map",        desc: "Real ZIP scores — height = cost of inaction" },
  { id: "map",        label: "🗺 Geographic Map",      desc: "Need-heat circles by ZIP — size and color show where the crisis is concentrated" },
  { id: "cascade",    label: "🌊 Cascade Waterfall",   desc: "25-year cost chain by life stage" },
  { id: "web",        label: "🕸 Domain Web",           desc: "Unavailable: this workspace does not render synthetic 3D views" },
  { id: "particles",  label: "✨ Particle Flow",        desc: "Unavailable: this workspace does not render synthetic 3D views" },
  { id: "historical", label: "📜 Historical Modeled Estimate",   desc: "Modeled historical estimate using ACS multi-vintage inputs, 2013–2022" },
] as const;

type VizTab = typeof VIZ_TABS[number]["id"];

interface NeighborZipComparisonRow {
  zip: string;
  grade: string;
  urgency: string;
  costOfInaction: number;
  isCenter?: boolean;
}

function NeighborZipComparison({
  zips,
  isLoading,
  isError,
}: {
  zips?: NeighborZipComparisonRow[];
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <p className="px-1 pt-2 text-xs text-muted-foreground" role="status">Loading neighboring ZIP comparison data from Census…</p>;
  }

  if (isError) {
    return <p className="px-1 pt-2 text-xs text-muted-foreground">Neighbor ZIP comparison data is unavailable. No comparison values were substituted.</p>;
  }

  if (!zips) {
    return <p className="px-1 pt-2 text-xs text-muted-foreground">Neighbor ZIP comparison data has not been returned for this brief.</p>;
  }

  if (zips.length === 0) {
    return <p className="px-1 pt-2 text-xs text-muted-foreground">No neighboring ZIP comparison values were returned for this brief.</p>;
  }

  return (
    <details className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700" data-testid="neighbor-zip-comparison">
      <summary className="cursor-pointer font-medium text-foreground">
        Neighbor ZIP comparison data ({zips.length} ZIPs)
      </summary>
      <p className="mt-1 text-muted-foreground">
        ZIP, grade, urgency, and estimated cost of inaction. This is the same data represented by the Skyline Map.
      </p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left" aria-label="Neighbor ZIP comparison: ZIP, grade, urgency, and estimated cost of inaction">
          <caption className="sr-only">Neighbor ZIP comparison data represented by the Skyline Map</caption>
          <thead className="border-b border-slate-200 text-muted-foreground dark:border-slate-700">
            <tr>
              <th scope="col" className="pb-1 pr-3 font-medium">ZIP</th>
              <th scope="col" className="pb-1 pr-3 font-medium">Grade</th>
              <th scope="col" className="pb-1 pr-3 font-medium">Urgency</th>
              <th scope="col" className="pb-1 text-right font-medium">Cost of inaction</th>
            </tr>
          </thead>
          <tbody>
            {zips.map((zip) => (
              <tr key={zip.zip} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <th scope="row" className="py-1 pr-3 font-medium">{zip.zip}{zip.isCenter ? " (selected)" : ""}</th>
                <td className="py-1 pr-3">{zip.grade}</td>
                <td className="py-1 pr-3 capitalize">{zip.urgency}</td>
                <td className="py-1 text-right tabular-nums">${zip.costOfInaction.toLocaleString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// apiRequest throws Error("<status>: <body>") on a non-2xx response, where body
// is the server's JSON like {"error":"..."}. Surface the server's real message
// (404 unknown location vs 429 rate limit vs 502 Census down) instead of one
// generic card, so anonymous visitors know exactly what happened and what to do.
function parseConductorError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  // Shape: "<status>: <text>". Split once so the body (which may contain ": ")
  // is preserved intact.
  const m = raw.match(/^(\d{3}):\s*([\s\S]*)$/);
  const body = m ? m[2] : raw;
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error.trim();
    }
  } catch {
    // body wasn't JSON — fall through to the trimmed raw text.
  }
  const trimmed = (body || raw).trim();
  return trimmed || "Something went wrong analyzing this location. Please try again.";
}

// ─── Research Intelligence (authed-only RPLICE block) ────────────────────────

function ResearchIntelligenceSection({ rplice, isAuthenticated }: { rplice: any; isAuthenticated: boolean }) {
  // Anonymous visitor: the server strips the research block — show a tasteful upsell.
  if (!isAuthenticated) {
    return (
      <Card className="p-6 border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/20" data-testid="card-research-upsell">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-violet-500 flex-none mt-0.5" />
          <div className="flex-1">
            <h2 className="font-bold text-violet-900 dark:text-violet-200 mb-1">Research-Grade Detail Available</h2>
            <p className="text-sm text-violet-800 dark:text-violet-300 leading-relaxed mb-3">
              Signed-in analysts see the full RPLICE research &amp; intelligence layer for this brief:
              live implementation-science studies, structured frameworks, matched grant profiles,
              active intervention assignments, and outcome baselines.
            </p>
            <Button asChild size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white" data-testid="button-research-signin">
              <a href="/api/login">
                <Lock className="w-3.5 h-3.5" /> Sign in for research-grade detail
              </a>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Authed but block missing (e.g. RPLICE upstream unavailable): stay quiet.
  if (!rplice) return null;

  const studies: any[] = rplice.liveResearch?.studies ?? [];
  const frameworks: any[] = rplice.liveResearch?.frameworks ?? [];
  const grantProfiles: any[] = rplice.matchedGrantProfiles ?? [];
  const counts = rplice.assessmentCounts ?? {};
  const countItems: Array<[string, number]> = [
    ["CFIR assessments", counts.cfir],
    ["RE-AIM scorecards", counts.reaim],
    ["Fidelity checklists", counts.fidelity],
    ["Three Realities analyses", counts.threeRealities],
    ["Community analyses", counts.communityAnalyses],
    ["Grant narratives", counts.grantNarratives],
    ["Active action plans", counts.activeActionPlans],
    ["Active baselines", counts.activeBaselines],
  ];

  return (
    <section data-testid="section-research-intelligence" className="space-y-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-5 h-5 text-violet-500" />
        <h2 className="text-xl font-bold">Research &amp; Intelligence</h2>
        <Badge className="bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/30 text-xs">Analysts only</Badge>
        {rplice.inboundEvidenceFeedActive && (
          <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/40">Live evidence feed</Badge>
        )}
      </div>

      {rplice.reasoning && (
        <Card className="p-5 border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/20" data-testid="card-rplice-reasoning">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-violet-500 flex-none mt-0.5" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-violet-900 dark:text-violet-200">RPLICE relevance</span>
                {typeof rplice.relevanceScore === "number" && (
                  <Badge variant="outline" className="text-xs" data-testid="badge-relevance-score">{rplice.relevanceScore}/100</Badge>
                )}
              </div>
              <p className="text-sm text-violet-800 dark:text-violet-300 leading-relaxed">{rplice.reasoning}</p>
            </div>
          </div>
        </Card>
      )}

      {studies.length > 0 && (
        <Card className="p-5" data-testid="card-rplice-studies">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-sm">Live Implementation-Science Studies</h3>
            <Badge variant="outline" className="text-xs">{studies.length}</Badge>
          </div>
          <ul className="space-y-2">
            {studies.map((s: any, i: number) => (
              <li key={i} className="text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0" data-testid={`row-study-${i}`}>
                <span className="font-medium">{s.title ?? "Untitled study"}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {[s.authors, s.year, s.domain].filter(Boolean).join(" · ")}
                </span>
                {Array.isArray(s.frameworks) && s.frameworks.length > 0 && (
                  <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                    {s.frameworks.slice(0, 4).map((f: string) => (
                      <Badge key={f} variant="secondary" className="text-[10px] px-1.5 py-0">{f}</Badge>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {frameworks.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Frameworks in play: {frameworks.map((f: any) => (typeof f === "string" ? f : f?.name)).filter(Boolean).join(", ")}
            </p>
          )}
        </Card>
      )}

      {grantProfiles.length > 0 && (
        <Card className="p-5" data-testid="card-rplice-grants">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-sm">Matched Grant Profiles</h3>
            <Badge variant="outline" className="text-xs">{grantProfiles.length}</Badge>
          </div>
          <ul className="space-y-2">
            {grantProfiles.map((g: any, i: number) => (
              <li key={i} className="flex items-start justify-between gap-3 text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0" data-testid={`row-grant-profile-${i}`}>
                <div>
                  <span className="font-medium">{g.name}</span>
                  {g.funder && <span className="text-xs text-muted-foreground ml-2">{g.funder}</span>}
                  {Array.isArray(g.matchedDomains) && g.matchedDomains.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">Domains: {g.matchedDomains.join(", ")}</div>
                  )}
                </div>
                {typeof g.alignmentScore === "number" && (
                  <Badge variant="secondary" className="text-xs flex-none">{g.alignmentScore}% aligned</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5" data-testid="card-rplice-counts">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-sm">Internal Evidence Base</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {countItems.map(([label, n]) => (
            <div key={label} className="rounded-lg bg-muted/50 px-3 py-2" data-testid={`stat-${label.replace(/\s+/g, "-").toLowerCase()}`}>
              <div className="text-lg font-bold">{n ?? 0}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

export default function CommunityImpactPage() {
  const { isAuthenticated } = useAuth();
  const { orgId } = useCurrentOrgId();
  const { toast } = useToast();
  // The session intentionally does not carry a role. Ask the server for only
  // this narrow capability; the export POST still independently authorizes it.
  const exportCapability = useQuery({
    queryKey: ["/api/conductor/capabilities"],
    enabled: isAuthenticated,
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/conductor/capabilities", { credentials: "include" });
      if (!response.ok) throw new Error("Export capability unavailable");
      return response.json() as Promise<{ canRequestCommunityBriefExport: boolean }>;
    },
  });
  const canRequestExport = exportCapability.data?.canRequestCommunityBriefExport === true;
  const [location, setLocation] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [activeViz, setActiveViz] = useState<VizTab>("skyline");
  const latestBriefRequest = useRef(0);
  const [searchState, setSearchState] = useState<{ pending: boolean; error: Error | null; data: any | null }>({ pending: false, error: null, data: null });
  const lastNeighborPayload = useRef<{ zip: string; centerScore: number; centerGrade: string; centerUrgency: string; centerCost: number } | null>(null);

  const coverage = useQuery({
    queryKey: ["/api/conductor/community-brief/coverage"],
    queryFn: async () => {
      const response = await fetch("/api/conductor/community-brief/coverage");
      if (!response.ok) throw new Error("Coverage unavailable");
      return response.json() as Promise<{
        coverage: {
          zctaCount: number;
          statesAndDistrictCovered: number;
          completeStateCoverage: boolean;
        };
        geography: { analyticalUnit: string; disclosure: string };
      }>;
    },
    staleTime: 10 * 60 * 1000,
  });

  const brief = useMutation({
    mutationFn: async (loc: string) => {
      try {
        const r = await apiRequest("POST", "/api/conductor/community-brief", { location: loc, populationSize: 10000, timeHorizon: 25 });
        return r.json();
      } catch (err) {
        throw new Error(parseConductorError(err));
      }
    },
  });

  const evidenceHandoff = useMutation({
    mutationFn: async ({ payload, orgId: targetOrgId }: { payload: Record<string, unknown>; orgId: string; location: string }) => (await apiRequest("POST", "/api/nonprofit-events/handoffs", payload, { "x-org-id": targetOrgId })).json(),
    onSuccess: (_result, variables) => {
      if (variables.orgId === orgId) toast({ title: "Evidence sent for partner review", description: "An authorized organization staff member can now accept it into a private event and action." });
    },
    onError: (error: Error) => toast({ title: "Could not send evidence", description: error.message, variant: "destructive" }),
  });
  const handoffAccess = useQuery({
    queryKey: ["/api/nonprofit-events/access", orgId],
    enabled: isAuthenticated && Boolean(orgId),
    retry: false,
    queryFn: async () => (await apiRequest("GET", "/api/nonprofit-events/access", undefined, { "x-org-id": orgId! })).json() as Promise<{ authorized: boolean }>,
  });

  function sendEvidenceToPartnerWorkspace() {
    if (!data || !orgId) return;
    const displayName = data.geography?.displayName || submitted;
    const evidenceRefs = [
      ...(Array.isArray(data.evidence?.sources) ? data.evidence.sources.map((source: any) => source?.url) : []),
      ...(Array.isArray(data.evidence?.citations) ? data.evidence.citations : []),
    ].filter((value): value is string => typeof value === "string" && /^https?:\/\//.test(value)).slice(0, 20);
    const claimTypes = new Set<string>(["observed", "derived", "modeled"]);
    const claims = data.evidence?.claims;
    if (claims && typeof claims === "object") {
      Object.values(claims).forEach((claim: any) => {
        if (claim?.status === "unavailable") claimTypes.add("unavailable");
        if (claim?.sourceType === "partner_reported" || claim?.claimType === "partner_reported") claimTypes.add("partner_reported");
        if (claim?.sourceType === "self_reported" || claim?.claimType === "self_reported") claimTypes.add("self_reported");
      });
    }
    evidenceHandoff.mutate({ payload: {
      sourceKind: "community_brief",
      sourceVersion: "community-brief/v1",
      issue: data.evidence?.primaryNeed || data.atRiskPopulations?.[0]?.label || `Evidence review for ${displayName}`,
      geography: displayName,
      evidenceRefs,
      freshnessAt: new Date().toISOString(),
      claimTypes: [...claimTypes],
      resourceVerification: "source-listed-unverified",
      consentBoundary: "This handoff contains aggregate evidence only. No participant identities, contact details, stories, or inferred demographics are included.",
      unresolvedGaps: [
        ...(Array.isArray(data.evidence?.gaps) ? data.evidence.gaps : []),
        ...(Array.isArray(data.evidence?.warnings) ? data.evidence.warnings : []),
      ].filter((value): value is string => typeof value === "string").slice(0, 20),
      sourceSnapshot: {
        geography: {
          displayName,
          analyticalUnit: typeof data.geography?.analyticalUnit === "string" ? data.geography.analyticalUnit : undefined,
        },
        sourceCount: evidenceRefs.length,
        disclosure: "Public aggregate community brief submitted for human review; modeled values are not outcomes.",
      },
    }, location: submitted, orgId });
  }

  const neighborsMut = useMutation({
    mutationFn: async (payload: { zip: string; centerScore: number; centerGrade: string; centerUrgency: string; centerCost: number }) => ({
      requestKey: JSON.stringify(payload),
      result: await apiRequest("POST", "/api/conductor/neighbor-zips", payload).then((r) => r.json()),
    }),
  });
  const neighborResult = neighborsMut.data?.requestKey === JSON.stringify(lastNeighborPayload.current)
    ? neighborsMut.data.result
    : undefined;

  function submitLocation(value: string) {
    const nextLocation = value.trim();
    if (!nextLocation) return;
    const requestId = ++latestBriefRequest.current;
    brief.reset();
    neighborsMut.reset();
    lastNeighborPayload.current = null;
    setSearchState({ pending: true, error: null, data: null });
    setSubmitted(nextLocation);
    brief.mutate(nextLocation, {
      onSuccess: (result) => {
        if (requestId !== latestBriefRequest.current) return;
        setSearchState({ pending: false, error: null, data: result });
      },
      onError: (error) => {
        if (requestId !== latestBriefRequest.current) return;
        setSearchState({ pending: false, error: error instanceof Error ? error : new Error("Could not analyze this location.") , data: null });
      },
    });
  }

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    submitLocation(location);
  }

  function handleVizTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, currentTab: VizTab) {
    const currentIndex = VIZ_TABS.findIndex((tab) => tab.id === currentTab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % VIZ_TABS.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + VIZ_TABS.length) % VIZ_TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = VIZ_TABS.length - 1;
    else return;

    event.preventDefault();
    const nextTab = VIZ_TABS[nextIndex];
    setActiveViz(nextTab.id);
    document.getElementById(`viz-tab-${nextTab.id}`)?.focus();
  }

  const data = useMemo(() => searchState.data ? {
    ...searchState.data,
    geography: searchState.data.geography ?? {},
    evidence: {
      ...(searchState.data.evidence ?? {}),
      sources: Array.isArray(searchState.data.evidence?.sources) ? searchState.data.evidence.sources : [],
      citations: Array.isArray(searchState.data.evidence?.citations) ? searchState.data.evidence.citations : [],
      claims: searchState.data.evidence?.claims && typeof searchState.data.evidence.claims === "object" ? searchState.data.evidence.claims : {},
      gaps: Array.isArray(searchState.data.evidence?.gaps) ? searchState.data.evidence.gaps : [],
      warnings: Array.isArray(searchState.data.evidence?.warnings) ? searchState.data.evidence.warnings : [],
    },
    systemsScores: searchState.data.systemsScores && typeof searchState.data.systemsScores === "object" ? searchState.data.systemsScores : {},
    atRiskPopulations: Array.isArray(searchState.data.atRiskPopulations) ? searchState.data.atRiskPopulations : [],
    cascade: searchState.data.cascade ?? {},
    historicalCascade: searchState.data.historicalCascade,
    demographics: searchState.data.demographics ?? {},
    solutions: {
      ...(searchState.data.solutions ?? {}),
      topInterventions: Array.isArray(searchState.data.solutions?.topInterventions) ? searchState.data.solutions.topInterventions : [],
    },
  } : null, [searchState.data]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryLocation = (params.get("q") || params.get("geo"))?.trim();
    if (!queryLocation) return;
    setLocation(queryLocation);
    const view = params.get("view");
    if (view === "story") setActiveViz("historical");
    if (view === "impact") setActiveViz("skyline");
    submitLocation(queryLocation);
    return () => {
      latestBriefRequest.current += 1;
    };
  // The query string is read once when this route mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger neighbor-zips fetch when a brief comes back
  useEffect(() => {
    lastNeighborPayload.current = null;
    neighborsMut.reset();
    if (!data?.geography?.zip && !data?.geography?.displayName) return;
    const zip = data.geography.zip || data.geography.displayName?.match(/\d{5}/)?.[0];
    if (!zip) return;
    const centerUrgency = ["crisis", "concern", "watch", "stable"].find((urgency) =>
      Object.values(data.systemsScores || {}).some((score: any) => score.urgency === urgency)
    );
    // The selected ZIP is part of the comparison response. Do not invent its
    // grade, urgency, score, or modeled cost when a brief omits an input.
    if (
      !Number.isFinite(data.overallScore) ||
      !data.overallGrade ||
      !centerUrgency ||
      !Number.isFinite(data.cascade?.counterfactualCost)
    ) return;
    const neighborPayload = {
      zip,
      centerScore: data.overallScore,
      centerGrade: data.overallGrade,
      centerUrgency,
      centerCost: data.cascade.counterfactualCost,
    };
    lastNeighborPayload.current = neighborPayload;
    neighborsMut.mutate(neighborPayload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, submitted]);

  return (
    <div className="min-h-screen bg-background">
      <VisualIntelligenceShell
        activeLens={new URLSearchParams(window.location.search).get("view") === "story" ? "story" : "impact"}
        geography={submitted}
        geographyGrain={data?.evidence?.geography?.resolved?.type?.toUpperCase() || "Source-defined geography"}
        title="Visual Intelligence · Story and Impact"
        description="Keep the historical record, current observations, and forward scenarios in one disclosed evidence chain."
        observations={[
          {
            id: "impact-observed",
            label: "Observed indicators",
            evidenceClass: data?.evidence?.claims?.observed?.status === "available" ? "observed" : "unavailable",
            geography: data?.evidence?.geography?.resolved?.type || "Resolved source geography",
            source: data?.evidence?.sources?.map((source: any) => `${source.publisher} ${source.dataset}`).join("; ") || "Community brief source contract",
            vintage: data?.evidence?.sources?.map((source: any) => source.vintage).join(", ") || "Source vintage unavailable",
            status: data?.evidence?.claims?.observed?.status === "available" ? "available" : "unavailable",
            disclosure: data?.evidence?.geography?.resolved?.coverageWarning || "Observed indicators are aggregate geography estimates.",
          },
          {
            id: "impact-historical",
            label: "Historical snapshots",
            evidenceClass: data?.historicalCascade ? "derived" : "unavailable",
            geography: data?.evidence?.geography?.resolved?.type || "Source-defined geography",
            source: "ACS vintages are displayed only when the source returned enough distinct years.",
            vintage: data?.historicalCascade?.vintages?.map((v: any) => v.year).join(", ") || "Unavailable",
            status: data?.historicalCascade ? "available" : "unavailable",
            uncertainty: "No interpolation is used to fill unsupported years or geographies.",
          },
          {
            id: "impact-scenario",
            label: "Forward impact scenario",
            evidenceClass: data?.cascade ? "modeled" : "unavailable",
            geography: "Scenario follows the resolved brief geography",
            source: "TCAF/Chainweb scenario model using disclosed observed inputs",
            vintage: data?.generatedAt ? `Generated ${new Date(data.generatedAt).toLocaleDateString()}` : "Generated on request",
            status: data?.cascade ? "available" : "unavailable",
            disclosure: "Cost, savings, and ROI are model outputs, not Census-verified expenditures.",
          },
          {
            id: "impact-refresh",
            label: "Refresh state",
            evidenceClass: data ? "observed" : "unavailable",
            geography: "Brief request",
            source: "A source outage is shown as unavailable rather than as zero need.",
            vintage: data ? "Current response" : "Not loaded",
            status: data ? "available" : "unavailable",
          },
        ]}
      />
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-xs">Community Impact Conductor</Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
            Every Community Has a Story.<br />
            <span className="text-blue-300">Let's Tell the Truth About It.</span>
          </h1>
          <p className="text-blue-100/80 text-lg mb-8 max-w-2xl">
            Enter any ZIP code, city, or county. See the real data — health, mental health, benefits, housing, education, justice, foster care — and the 25-year cascade of what happens when we invest, and when we don't.
          </p>
          {coverage.data?.coverage.completeStateCoverage && (
            <div
              className="mb-6 max-w-2xl rounded-lg border border-blue-300/20 bg-white/10 px-4 py-3 text-sm text-blue-100"
              data-testid="national-coverage-proof"
              aria-label={`Nationwide coverage: ${coverage.data.coverage.zctaCount.toLocaleString()} Census ZCTAs across all 50 states and DC`}
            >
              <div className="font-semibold text-white">
                Nationwide geography coverage: {coverage.data.coverage.zctaCount.toLocaleString()} Census ZCTAs
              </div>
              <div className="mt-1 text-blue-100/70">
                {coverage.data.coverage.statesAndDistrictCovered} states and districts represented. {coverage.data.geography.disclosure}
              </div>
            </div>
          )}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl" data-testid="form-community-search">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                aria-label="Location to analyze"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="78741, Austin TX, Waco TX, Williamson County..."
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15"
                data-testid="input-location"
              />
            </div>
            <Button type="submit" disabled={searchState.pending || !location.trim()} className="bg-blue-500 hover:bg-blue-400 text-white px-6" data-testid="button-search">
              {searchState.pending ? "Analyzing…" : "Analyze"}
            </Button>
          </form>
          {coverage.isError && <p className="mb-6 max-w-2xl text-xs text-blue-100/80" role="status">Coverage details are temporarily unavailable; the brief can still be reviewed.</p>}
          {!submitted && (
            <div className="mt-4 flex flex-wrap gap-2">
              {["Austin, TX", "Waco, TX", "Williamson County, TX", "78741", "Rural Texas"].map((loc) => (
                <button type="button" key={loc} onClick={() => { setLocation(loc); submitLocation(loc); }} className="text-xs text-blue-200/60 hover:text-blue-200 transition-colors underline underline-offset-2" data-testid={`quick-${loc.replace(/,?\s+/g, "-").toLowerCase()}`}>
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {searchState.pending && <LoadingSkeleton />}

        {searchState.error && (
          <Card role="alert" className="p-6 border-red-200 bg-red-50 dark:bg-red-950/30" data-testid="card-error">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-none mt-0.5" />
              <div>
                <div className="font-semibold text-red-700">Could not analyze this location</div>
                <div className="text-sm text-red-600 mt-1" data-testid="text-error-detail">
                  {searchState.error.message
                    ? searchState.error.message
                    : 'Try a specific ZIP code (e.g. 78741) or "City, State" format.'}
                </div>
                  <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => submitted && submitLocation(submitted)} disabled={!submitted || searchState.pending}>Try again</Button>
              </div>
            </div>
          </Card>
        )}

        {data && !searchState.pending && !searchState.error && (
          <div className="space-y-10">
            <EvidenceSummary claims={[{
              value: data.outcomes?.total ?? null, unit: "recorded outcomes", source: "TCAF Outcome Measurement System",
              sourceId: "tcaf-outcomes", asOfDate: null, geographyKey: null, confidence: "verified",
              decisionCaption: "Use verified outcome records with local evidence when planning community investments.",
            }]} />
            {/* Verdict Hero — the F-22 first look */}
            <VerdictHero data={data} locationQuery={submitted} canRequestExport={canRequestExport} />

            <CommunityEvidencePanel evidence={data.evidence} />

            {/* Demographics strip */}
            <DemographicsStrip geo={data.geography} demographics={data.demographics} overallScore={data.overallScore} overallGrade={data.overallGrade} />

            {/* AI Narrative */}
            {data.narrative && (
              <>
              <Card className="p-6 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30" data-testid="card-narrative">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-indigo-500 flex-none mt-0.5" />
                  <div>
                     <h2 className="font-bold text-indigo-900 dark:text-indigo-200 mb-3">The Community Story <span className="text-xs font-normal">(AI-generated decision-support draft)</span></h2>
                    <p className="text-sm text-indigo-800 dark:text-indigo-300 whitespace-pre-line leading-relaxed">{data.narrative}</p>
                  </div>
                </div>
              </Card>
              <AIAugmentationDisclosure
                compact
                drewFrom={["Community impact indicators", "program outcome records", "local service context"]}
                doesNotKnow={["future outcomes", "individual resident circumstances"]}
                verifyWith="Current local data and community partners"
              />
              </>
            )}

            {/* Systems Vitals */}
            <SystemsVitals scores={data.systemsScores} />

            {/* Population Snapshot */}
            <PopulationSnapshot populations={data.atRiskPopulations} />

            {/* Life Arc Timeline */}
            {data.cascade?.timeline?.length > 0 && <LifeArcTimeline timeline={data.cascade.timeline} />}

            {/* ── Historical Modeled Estimate ─────────────────────────────── */}
            {/* County-level note: show a clear disclosure when historical estimates are unavailable */}
            {!data.historicalCascade && data.evidence?.claims?.historicalCascade?.status === "unavailable" && (
              <section data-testid="section-historical-receipt-unavailable">
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/10 px-6 py-5 flex items-start gap-3">
                  <span className="text-2xl mt-0.5 flex-none">🧾</span>
                  <div>
                    <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">Historical Modeled Estimate — Not Available for This Search Type</h2>
                    <p className="text-sm text-amber-800/80 dark:text-amber-300/70 mt-1">
                      {data.evidence.claims.historicalCascade.disclosure
                            ?? "Multi-vintage historical data is only available for ZIP/ZCTA lookups. Search by ZIP code to see the year-by-year modeled estimate."}
                    </p>
                  </div>
                </div>
              </section>
            )}
            {data.historicalCascade?.vintages?.length > 0 && (
              <section data-testid="section-historical-receipt">
                <div className="rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-6 py-5 border-b border-amber-200 dark:border-amber-800/40">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl mt-0.5">🧾</span>
                      <div>
                        <h2 className="text-lg font-black text-amber-900 dark:text-amber-200">
                           Modeled Historical Cohort Cost
                        </h2>
                        <p className="text-sm text-amber-800/70 dark:text-amber-300/70 mt-0.5">
                          Accumulated cost from {data.historicalCascade?.vintages[0]?.year}–{data.historicalCascade?.vintages[data.historicalCascade?.vintages.length - 1]?.year} · ACS 5-Year Estimates · per-cohort chain model
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-3xl font-black text-amber-700 dark:text-amber-300" data-testid="text-historical-total">
                        {fmt$(data.historicalCascade?.totalAccumulatedCost)}
                      </div>
                         <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium uppercase tracking-wide">
                         modeled estimate, not observed spending
                      </div>
                    </div>
                  </div>

                  {/* Trend callout */}
                  <div className="px-6 py-3 border-b border-amber-200 dark:border-amber-800/30 flex items-center gap-2 text-sm">
                    {data.historicalCascade?.trendDirection === "worsening" && (
                      <><TrendingDown className="w-4 h-4 text-red-500 flex-none" /><span className="text-red-700 dark:text-red-400 font-medium">Conditions worsened</span></>
                    )}
                    {data.historicalCascade?.trendDirection === "stagnant" && (
                      <><Clock className="w-4 h-4 text-amber-500 flex-none" /><span className="text-amber-700 dark:text-amber-300 font-medium">Conditions stagnant</span></>
                    )}
                    {data.historicalCascade?.trendDirection === "improving" && (
                      <><TrendingUp className="w-4 h-4 text-emerald-500 flex-none" /><span className="text-emerald-700 dark:text-emerald-400 font-medium">Conditions improving</span></>
                    )}
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{data.historicalCascade?.keyInsight}</span>
                  </div>

                  {/* Vintage table */}
                  <div className="px-6 py-4 overflow-x-auto">
                    <table className="w-full text-sm" data-testid="table-historical-vintages">
                      <thead>
                        <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-amber-200 dark:border-amber-800/30">
                          <th className="text-left pb-2 pr-4">Census Year</th>
                          <th className="text-right pb-2 pr-4">Poverty Rate</th>
                          <th className="text-right pb-2 pr-4">Unemployment</th>
                          <th className="text-right pb-2">Est. Cohort Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.historicalCascade?.vintages ?? []).map((v: any, i: number) => (
                          <tr key={v.year} className={`border-b border-amber-100 dark:border-amber-900/20 ${i % 2 === 0 ? "" : "bg-amber-50/40 dark:bg-amber-900/10"}`} data-testid={`row-vintage-${v.year}`}>
                            <td className="py-2 pr-4 font-semibold text-amber-900 dark:text-amber-200">{v.year} ACS</td>
                            <td className={`py-2 pr-4 text-right font-mono ${v.povertyRate >= 20 ? "text-red-600 dark:text-red-400 font-bold" : v.povertyRate >= 15 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {v.povertyRate.toFixed(1)}%
                            </td>
                            <td className="py-2 pr-4 text-right font-mono text-muted-foreground">
                              {v.unemploymentRate.toFixed(1)}%
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-amber-800 dark:text-amber-300">
                              {fmt$(v.cohortCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-amber-300 dark:border-amber-700">
                          <td colSpan={3} className="pt-2 pr-4 font-bold text-amber-900 dark:text-amber-200 text-sm">Total accumulated (documented cohorts)</td>
                          <td className="pt-2 text-right font-black text-amber-700 dark:text-amber-300">{fmt$(data.historicalCascade?.totalAccumulatedCost)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Framing callout */}
                  <div className="px-6 py-4 bg-amber-100/60 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800/40">
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed max-w-3xl">
                       <span className="font-bold">How to read this:</span> For each Census vintage, the evidence-based chain model estimates a cohort cost from modeled pathways (ECE gap → 3rd grade failure → dropout → incarceration; untreated mental illness → homelessness). This is not Census-verified spending, an individual prediction, or a participant outcome. Forward projection for the next 25 years: <span className="font-bold">{fmt$(data.cascade?.counterfactualCost)}</span> if nothing changes.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Counterfactual */}
            {data.cascade && <CounterfactualPanel cascade={data.cascade} />}

            {/* Solutions */}
            <SolutionsLayer solutions={data.solutions} policyContext={data.policyContext} />

            {/* Research & Intelligence (authed) / sign-in upsell (anon) */}
            <ResearchIntelligenceSection rplice={data.rplice} isAuthenticated={isAuthenticated} />

            {/* Source-backed visual evidence. Synthetic 3D views remain deliberately unavailable. */}
            <section data-testid="section-3d-viz" className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-violet-500" />
                <h2 className="text-xl font-bold">Evidence Views</h2>
                <Badge variant="outline" className="text-xs">Source-backed</Badge>
              </div>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 overflow-x-auto" data-testid="viz-tab-bar" role="tablist" aria-label="Community evidence views">
                {VIZ_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    id={`viz-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={activeViz === tab.id}
                    aria-controls="viz-tab-panel"
                    onClick={() => setActiveViz(tab.id)}
                    onKeyDown={(event) => handleVizTabKeyDown(event, tab.id)}
                    data-testid={`viz-tab-${tab.id}`}
                    className={`flex-shrink-0 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap ${
                      activeViz === tab.id ? "bg-white dark:bg-slate-700 shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <p id="viz-tab-description" className="text-xs text-muted-foreground px-1">
                {VIZ_TABS.find((tab) => tab.id === activeViz)?.desc}
              </p>
              <Card
                id="viz-tab-panel"
                role="tabpanel"
                aria-labelledby={`viz-tab-${activeViz}`}
                className="overflow-hidden border-slate-200 dark:border-slate-700"
                style={{ height: 480 }}
              >
                <Suspense fallback={<div className="flex h-full items-center justify-center bg-slate-900 text-slate-400 text-sm">Loading evidence view…</div>}>
                  {activeViz === "skyline" && (
                    neighborsMut.isPending
                      ? <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-900 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /><span className="text-sm">Fetching neighboring ZIP evidence…</span></div>
                      : neighborsMut.isError
                      ? <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-900 px-6 text-center text-slate-300"><AlertTriangle className="h-7 w-7 text-amber-400" /><span className="text-sm font-semibold">Neighbor map unavailable</span><Button type="button" size="sm" variant="outline" onClick={() => lastNeighborPayload.current && neighborsMut.mutate(lastNeighborPayload.current)}>Try map again</Button></div>
                      : !neighborResult?.zips?.length
                      ? <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-900 px-6 text-center text-slate-300" data-testid="skyline-map-fallback"><span className="text-sm">Neighbor comparison is unavailable for this geography.</span><Button type="button" size="sm" variant="outline" onClick={() => lastNeighborPayload.current ? neighborsMut.mutate(lastNeighborPayload.current) : submitted && submitLocation(submitted)}>Try again</Button></div>
                      : <SkylineMap zips={neighborResult.zips ?? []} centerLat={neighborResult.centerLat} centerLng={neighborResult.centerLng} />
                  )}
                  {activeViz === "map" && (() => {
                    const geoPoints = (neighborResult?.zips ?? [])
                      .filter((z: { lat?: number; lon?: number }) => z.lat != null && z.lon != null)
                      .map((z: { zip: string; lat: number; lon: number; score: number }) => ({
                        id: z.zip, label: `ZIP ${z.zip}`, lat: z.lat, lon: z.lon, needScore: z.score,
                        metrics: { score: { value: z.score, label: "SDOH Need Score", unit: "/100" } },
                      }));
                    return geoPoints.length > 0
                      ? <GisNeedHeatMap points={geoPoints} height="100%" />
                      : <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-900 px-6 text-center text-slate-300"><MapPin className="h-7 w-7" /><span>Geographic evidence is unavailable for this brief.</span></div>;
                  })()}
                  {activeViz === "cascade" && (
                    data.cascade?.counterfactualCost != null && data.cascade?.interventionCost != null
                      ? <CascadeWaterfall timeline={data.cascade?.timeline ?? []} totalWithout={data.cascade.counterfactualCost} totalWith={data.cascade.interventionCost} geography={data.geography?.displayName ?? submitted} />
                      : <div className="flex h-full items-center justify-center bg-slate-900 px-6 text-center text-sm text-slate-300" data-testid="cascade-waterfall-fallback">No cascade data available for this brief.</div>
                  )}
                  {(activeViz === "web" || activeViz === "particles") && (
                    <div className="flex h-full items-center justify-center bg-slate-900 px-6 text-center text-sm text-slate-300" data-testid={activeViz === "web" ? "domain-web-fallback" : "particle-flow-fallback"}>
                      This workspace does not render synthetic 3D views. Use the source-backed map, cascade, or historical evidence tabs.
                    </div>
                  )}
                  {activeViz === "historical" && (
                    data.historicalCascade?.vintages?.length > 0 && data.historicalCascade.totalAccumulatedCost != null && data.cascade?.counterfactualCost != null && data.cascade?.interventionCost != null
                      ? <HistoricalTimeline vintages={data.historicalCascade.vintages} totalAccumulatedCost={data.historicalCascade.totalAccumulatedCost} trendDirection={data.historicalCascade.trendDirection ?? "stagnant"} forwardCost={data.cascade.counterfactualCost} interventionCost={data.cascade.interventionCost} geography={data.geography?.displayName ?? submitted} />
                      : <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center" data-testid="historical-timeline-fallback"><FileText className="h-7 w-7" /><div className="text-base font-semibold text-muted-foreground">Historical modeled estimate not available</div><p className="max-w-md text-sm text-muted-foreground">{data.evidence?.claims?.historicalCascade?.disclosure ?? "Multi-vintage source data is unavailable for this geography."}</p></div>
                  )}
                </Suspense>
              </Card>
              <NeighborZipComparison zips={neighborResult?.zips} isLoading={neighborsMut.isPending} isError={neighborsMut.isError} />
            </section>

            {/* Export strip */}
            <Card className="p-4" data-testid="card-export">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <div className="font-semibold text-sm">Export this community brief</div>
                  <div className="text-xs text-muted-foreground">Use as a funder pitch, council briefing, or grant narrative</div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button asChild variant="outline" size="sm" className="gap-1.5"><a href="/this-week" data-testid="link-export-grant-hub"><Building2 className="w-3.5 h-3.5" />This Week grants</a></Button>
                <Button asChild variant="outline" size="sm" className="gap-1.5"><a href="/chainweb" data-testid="link-export-chainweb"><Target className="w-3.5 h-3.5" />Chainweb</a></Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                  try {
                    generateInvoicePDF(data, submitted);
                  } catch (error) {
                    console.error("[community-impact] model summary download failed", error);
                    toast({ title: "Download failed", description: "The model summary could not be generated. Please try again.", variant: "destructive" });
                  }
                }} data-testid="button-download-invoice-strip">
                  <Download className="w-3.5 h-3.5" />Download Invoice
                </Button>
                <StripPdfButton data={data} submitted={submitted} />
                <StripShareButton data={data} />
                <Button asChild variant="outline" size="sm" className="gap-1.5" data-testid="link-compare-strip">
                  <a href={`/community-compare?a=${encodeURIComponent(submitted)}`}>
                    <ArrowRight className="w-3.5 h-3.5" />Compare Communities
                  </a>
                </Button>
                <GppExportButton data={data} submitted={submitted} canRequestExport={canRequestExport} />
              </div>
            </Card>
            <Card className="p-5 border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20" data-testid="card-evidence-handoff">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                 <div>
                   <div className="font-semibold text-sm">Carry this evidence into an organization action</div>
                   <p className="mt-1 text-xs text-muted-foreground">Send an aggregate, provenance-labeled snapshot to an authorized organization for review. This creates no external referral or participant outcome automatically.</p>
                </div>
                 {isAuthenticated && orgId && handoffAccess.data?.authorized ? (
                   <Button type="button" size="sm" onClick={sendEvidenceToPartnerWorkspace} disabled={evidenceHandoff.isPending} data-testid="button-send-evidence-handoff">
                     {evidenceHandoff.isPending ? "Sending…" : evidenceHandoff.isError ? "Retry send" : "Send for review"}
                  </Button>
                 ) : isAuthenticated && orgId && handoffAccess.isLoading ? (
                   <span className="text-xs text-muted-foreground" aria-live="polite">Checking partner-staff access…</span>
                 ) : isAuthenticated && orgId && handoffAccess.isError ? (
                   <span className="text-xs text-destructive" role="alert">Partner access could not be checked. <button type="button" className="font-semibold underline" onClick={() => void handoffAccess.refetch()}>Retry</button></span>
                 ) : isAuthenticated && orgId ? (
                   <span className="text-xs text-muted-foreground">Ask an organization owner for private Community Events & Impact staff access.</span>
                ) : (
                   <Button asChild size="sm" variant="outline" data-testid="button-sign-in-evidence-handoff"><a href="/api/login?returnTo=%2Fcommunity-impact">Sign in to send</a></Button>
                )}
              </div>
               {evidenceHandoff.isError && evidenceHandoff.variables?.orgId === orgId && evidenceHandoff.variables?.location === submitted && <p className="mt-3 text-xs text-destructive" role="alert">The evidence snapshot was not sent. You can retry without creating a duplicate accepted action.</p>}
               {evidenceHandoff.isSuccess && evidenceHandoff.variables?.orgId === orgId && evidenceHandoff.variables?.location === submitted && <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-300" aria-live="polite">Sent to the active organization. <a className="font-semibold underline" href="/organization/events">Open Community Events & Impact</a> to review it.</p>}
              {isAuthenticated && !orgId && <p className="mt-3 text-xs text-muted-foreground">Choose an active organization before sending evidence for review.</p>}
            </Card>
          </div>
        )}

        {/* Empty state */}
        {!searchState.pending && !data && !searchState.error && (
          <div className="text-center py-16 text-muted-foreground" data-testid="state-empty">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Enter any community above</p>
            <p className="text-sm max-w-md mx-auto">
              ZIP code, city name, or county — we'll pull real Census data and show the full systems picture: health, mental health, benefits, housing, education, justice, foster care, and what it all costs over 25 years.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              {[
                { icon: "🗺️", title: "Any Geography", desc: "ZIP, city, county, or state — nationwide" },
                { icon: "🔗", title: "Connected Systems", desc: "Health · Mental health · Benefits · Housing · ECE · Justice · Workforce" },
                { icon: "📊", title: "25-Year Cascade", desc: "The cost of inaction vs. the ROI of evidence-based investment" },
              ].map((f) => (
                <Card key={f.title} className="p-4">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="font-semibold text-sm mb-1">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
