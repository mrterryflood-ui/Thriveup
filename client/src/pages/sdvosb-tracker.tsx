import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Shield, CheckCircle2, Clock, AlertTriangle, ExternalLink,
  FileText, Building2, Star, Target, Calendar, ArrowRight, Award,
} from "lucide-react";

const ACTION_ITEMS = [
  { id: "sam-active", category: "SAM.gov", title: "SAM.gov registration active", desc: "UEI KDDVD1FGLW35 — verify annually. Expires if not renewed.", status: "complete", deadline: "Active", link: "https://sam.gov" },
  { id: "vetcert-apply", category: "VetCert", title: "Submit SBA VetCert application", desc: "SDVOSB certification through SBA VetCert portal — prerequisite for sole-source contracts.", status: "in_progress", deadline: "Priority", link: "https://veterans.certify.sba.gov/" },
  { id: "vetcert-docs", category: "VetCert", title: "Upload ownership & control docs", desc: "DD-214, operating agreement, org chart showing veteran control >51%. Must document Dr. Flood's operational control.", status: "in_progress", deadline: "With application" },
  { id: "cage-verify", category: "SAM.gov", title: "CAGE code linked to SDVOSB status", desc: "CAGE 209N1 — verify SDVOSB self-certification is active in SAM.gov profile.", status: "action_needed", deadline: "ASAP", link: "https://sam.gov" },
  { id: "far-19-14", category: "Contracting", title: "Review FAR 19.14 set-aside opportunities", desc: "Sole-source up to $4.5M (services) / $7M (manufacturing). Pipeline should include at least 3 active SDVOSB set-asides.", status: "pending", deadline: "Ongoing" },
  { id: "navoba", category: "Certification", title: "Consider NaVOBA certification (corporate buyers)", desc: "National Veteran-Owned Business Association — opens corporate procurement channels alongside federal.", status: "pending", deadline: "Q3 2026", link: "https://navoba.org" },
  { id: "sbir-cip", category: "SBIR", title: "CIP LLC Phase I SBIR — Army submission", desc: "EIN 41-4996540 (veteran-owned SBC). TCAF as subcontractor. Phase I: $250K/6 months. Army expected to reopen post-reauthorization. Submit via DSIP portal.", status: "tracking", deadline: "Watch Army SBIR reopening", link: "https://dodsbirsttr.mil" },
  { id: "subcontract", category: "Contracting", title: "Register as SDVOSB subcontractor with prime contractors", desc: "FAR 52.219-8 requires primes to maximize SDVOSB subcontracting. Register on SBA SubNet and reach out to prime contractors in Austin area.", status: "pending", deadline: "Q3 2026", link: "https://eweb.sba.gov/subnet/client/dsp_Landing.cfm" },
];

const STATUS_CONFIG = {
  complete:      { label: "Complete",      color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2, iconColor: "text-emerald-500" },
  in_progress:   { label: "In Progress",   color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",           icon: Clock,         iconColor: "text-blue-500" },
  action_needed: { label: "Action Needed", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",               icon: AlertTriangle,  iconColor: "text-red-500" },
  tracking:      { label: "Tracking",      color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",   icon: Target,         iconColor: "text-violet-500" },
  pending:       { label: "Pending",       color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",          icon: Calendar,       iconColor: "text-slate-400" },
};

const IDENTITY_CREDS = [
  { label: "Entity",        value: "The Collaborative Advocate Foundation" },
  { label: "Type",          value: "501(c)(3) Public Charity" },
  { label: "EIN",           value: "41-3618003" },
  { label: "SAM.gov UEI",   value: "KDDVD1FGLW35" },
  { label: "CAGE Code",     value: "209N1" },
  { label: "SAM Status",    value: "Active" },
  { label: "Founder",       value: "Dr. Terry Flood, DHA/DBA — Veteran" },
  { label: "Est.",          value: "IRS Determination Effective Jan 14, 2026" },
];

export default function SdvosbTrackerPage() {
  const [filter, setFilter] = useState<string>("all");

  const complete = ACTION_ITEMS.filter(i => i.status === "complete").length;
  const total = ACTION_ITEMS.length;
  const pct = Math.round((complete / total) * 100);

  const categories = ["all", ...Array.from(new Set(ACTION_ITEMS.map(i => i.category)))];
  const filtered = filter === "all" ? ACTION_ITEMS : ACTION_ITEMS.filter(i => i.category === filter);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6" data-testid="page-sdvosb-tracker">
      <PageHeader
        title="SDVOSB Action Tracker"
        description="Service-Disabled Veteran-Owned Small Business — certification, contracting & SBIR pipeline"
        icon={<Shield className="h-7 w-7" />}
        breadcrumbs={[{ label: "SDVOSB Tracker" }]}
      />

      {/* Identity card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/10" data-testid="card-sdvosb-identity">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-sm">Entity Identity</span>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-[10px]">Primary Applicant</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {IDENTITY_CREDS.map(c => (
              <div key={c.label} className="p-2 rounded bg-white/60 dark:bg-black/20 border" data-testid={`cred-${c.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className="text-xs font-semibold font-mono leading-tight">{c.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card data-testid="card-sdvosb-progress">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">Overall Readiness</span>
            <span className="text-2xl font-bold" data-testid="text-sdvosb-pct">{pct}%</span>
          </div>
          <Progress value={pct} className="h-3 mb-3" />
          <div className="grid grid-cols-5 gap-2 text-center">
            {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
              const count = ACTION_ITEMS.filter(i => i.status === key).length;
              return (
                <div key={key} className="p-2 rounded bg-muted/30" data-testid={`count-${key}`}>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{cfg.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action items */}
      <div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm font-semibold">Filter by category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === cat ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        <div className="space-y-3" data-testid="section-action-items">
          {filtered.map(item => {
            const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
            const Icon = cfg.icon;
            return (
              <Card key={item.id} className="p-4" data-testid={`card-action-${item.id}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${cfg.iconColor}`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm leading-snug" data-testid={`text-action-title-${item.id}`}>{item.title}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{item.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        {item.deadline && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{item.deadline}</span>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground" data-testid={`text-action-desc-${item.id}`}>{item.desc}</p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5" data-testid={`link-action-${item.id}`}>
                        Open resource <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Key resources */}
      <Card data-testid="card-sdvosb-resources">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Key Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: "SBA VetCert Portal", url: "https://veterans.certify.sba.gov/", desc: "Official SBA SDVOSB/VOSB certification application" },
            { label: "SAM.gov Entity Registration", url: "https://sam.gov", desc: "Verify SDVOSB self-certification in entity profile" },
            { label: "FAR 19.14 — SDVOSB Set-Asides", url: "https://www.acquisition.gov/far/19.14", desc: "Sole-source and set-aside authority for SDVOSBs" },
            { label: "DoD SBIR/STTR Portal (DSIP)", url: "https://dodsbirsttr.mil", desc: "Submit SBIR Phase I via CIP LLC (veteran-owned SBC)" },
            { label: "NaVOBA Certification", url: "https://navoba.org", desc: "Corporate buyer access for veteran-owned businesses" },
            { label: "SBA SubNet (Subcontracting)", url: "https://eweb.sba.gov/subnet/client/dsp_Landing.cfm", desc: "Register as SDVOSB subcontractor for large primes" },
          ].map(r => (
            <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 p-2 rounded hover:bg-muted/50 transition-colors group" data-testid={`link-resource-${r.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
