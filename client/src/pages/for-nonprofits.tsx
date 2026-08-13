/**
 * /for-nonprofits — Public landing page for nonprofit partners.
 * No auth required. Shows the Agency Connector → key → dashboard pipeline
 * and drives orgs to get started immediately.
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, CheckCircle2, LayoutDashboard, Key, Globe,
  Shield, BarChart3, FileText, MapPin, Users, TrendingUp,
  Building2, Handshake as HandshakeIcon, ChevronRight, Star,
} from "lucide-react";

const STEPS = [
  {
    n: "1",
    icon: Globe,
    title: "Describe your organization",
    body: "Tell us your mission, service area, and the endpoints you need. Takes under 60 seconds.",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    n: "2",
    icon: Key,
    title: "Get your partner key instantly",
    body: "A secure tcaf_* key is generated, stored, and emailed to you — no approval queue, no waiting.",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  {
    n: "3",
    icon: LayoutDashboard,
    title: "Open your live dashboard",
    body: "Paste the key at /partner-dashboard. Your community data, benefits catalog, and impact numbers load immediately.",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
];

const FEATURES = [
  {
    icon: MapPin,
    title: "Community Intelligence",
    body: "Live Census demographics and Social Determinants of Health grades for your service area — poverty rate, unemployment, uninsured rate, education gaps.",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    icon: Shield,
    title: "Benefits Catalog",
    body: "Every program your clients can apply for right now — WIOA, housing, nutrition, healthcare, childcare — with eligibility, status, and methodology.",
    color: "text-green-700 bg-green-50 border-green-200",
  },
  {
    icon: BarChart3,
    title: "Impact Numbers",
    body: "Participants served, employment outcomes, and credentials attained. The numbers funders ask for, always current, no spreadsheet required.",
    color: "text-orange-700 bg-orange-50 border-orange-200",
  },
  {
    icon: FileText,
    title: "Grant-Ready Reports",
    body: "One click generates a funder PDF — demographics, SDOH data, matched funding opportunities, and a Statement of Need paragraph you can paste directly into any proposal.",
    color: "text-purple-700 bg-purple-50 border-purple-200",
  },
];

const PROOF_STATS = [
  { value: "107", label: "Languages supported" },
  { value: "50", label: "States covered" },
  { value: "15", label: "Service platforms" },
  { value: "Free", label: "No cost to partners" },
];

const WHO = [
  "Direct service nonprofits",
  "Community health worker orgs",
  "Reentry and justice-involved services",
  "Housing and shelter providers",
  "Churches and faith-based orgs",
  "School districts and afterschool programs",
  "Food banks and nutrition services",
  "Workforce development agencies",
];

export default function ForNonprofitsPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-blue-200 font-medium mb-6">
            <Building2 className="h-4 w-4" />
            For Nonprofits &amp; Community Organizations
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Your community's data.<br />
            Your org's dashboard.<br />
            <span className="text-emerald-400">Free.</span>
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            In 60 seconds you can have a live dashboard showing Census demographics, 
            a benefits catalog, impact numbers, and a grant-ready PDF — 
            all scoped to your exact service area. No developer needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/agency-connector">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8">
                Get my dashboard — it's free <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/partner-dashboard">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                I already have a key →
              </Button>
            </Link>
          </div>
          <p className="text-blue-300 text-sm mt-4">No account. No credit card. No approval queue.</p>
        </div>
      </div>

      {/* ── Proof bar ── */}
      <div className="bg-blue-900 border-y border-blue-800 px-6 py-5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {PROOF_STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-emerald-400">{s.value}</div>
              <div className="text-blue-300 text-sm mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="px-6 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Three steps. Under a minute.</h2>
          <p className="text-gray-500 mt-2 text-sm">No IT team, no developer, no waiting for approval.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map(s => (
            <div key={s.n} className="relative">
              <Card className="border h-full">
                <CardContent className="pt-6 pb-5">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-3 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Step {s.n}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
                </CardContent>
              </Card>
              {s.n !== "3" && (
                <div className="hidden sm:flex absolute top-1/2 -right-4 z-10 w-8 h-8 items-center justify-center">
                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/agency-connector">
            <Button className="bg-blue-700 hover:bg-blue-800 px-8">
              Start now — takes 60 seconds <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── What's in the dashboard ── */}
      <div className="bg-gray-50 border-y px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">What your dashboard includes</h2>
            <p className="text-gray-500 mt-2 text-sm">Five tabs. All live. All scoped to your service area.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map(f => (
              <Card key={f.title} className="border">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${f.color}`}>
                      <f.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.body}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sample community data ── */}
      <div className="px-6 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Real data. Your county. Right now.</h2>
          <p className="text-gray-500 mt-2 text-sm">This is what a partner org in Columbus County, NC sees when they log in.</p>
        </div>
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          {/* Simulated dashboard header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-300 font-medium mb-0.5">ThriveUp Partner Dashboard</div>
              <div className="text-white font-bold">Emergency Charitable Services of NC</div>
              <div className="text-blue-200 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> Columbus County, NC
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {["benefits:read", "community:read", "impact:read"].map(s => (
                <span key={s} className="bg-white/20 text-white text-xs font-mono px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
          {/* Simulated stat cards */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b">
            {[
              { icon: MapPin,    label: "Service area",      value: "Columbus Co.", color: "bg-blue-50 border-blue-200 text-blue-700" },
              { icon: Users,     label: "Population",        value: "50,000",        color: "bg-purple-50 border-purple-200 text-purple-700" },
              { icon: TrendingUp, label: "Poverty rate",     value: "21.1%",         color: "bg-red-50 border-red-200 text-red-700" },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded border flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-3 w-3" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{stat.value}</div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-3 text-xs text-gray-400 text-center">
            Live data from Census ACS · Updated continuously
          </div>
        </div>
      </div>

      {/* ── Who it's for ── */}
      <div className="bg-emerald-50 border-y border-emerald-100 px-6 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Built for organizations like yours</h2>
          <p className="text-gray-500 text-sm mb-8">If you're doing the work in a community, you qualify.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            {WHO.map(w => (
              <div key={w} className="flex items-start gap-2 bg-white rounded-lg border border-emerald-200 px-3 py-2.5 text-sm text-gray-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                {w}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Share feature callout ── */}
      <div className="px-6 py-14 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-1.5 text-sm text-purple-700 font-medium mb-4">
          <Star className="h-4 w-4" />
          New — Public share links
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Send your board a live view — no key required</h2>
        <p className="text-gray-500 leading-relaxed mb-6 max-w-xl mx-auto">
          Once you're in your dashboard, generate a read-only share link from the Reports tab.
          Anyone with the link can see your community data and impact numbers — without ever seeing your partner key.
          Perfect for board decks, funder presentations, and coalition partners.
        </p>
        <Link href="/agency-connector">
          <Button className="bg-purple-700 hover:bg-purple-800 px-8">
            Get started — it's free <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* ── Final CTA ── */}
      <div className="bg-blue-900 px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <HandshakeIcon className="h-10 w-10 text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">Ready to see your community's data?</h2>
          <p className="text-blue-200 mb-8 leading-relaxed">
            Complete the Agency Connector, get your key, and your dashboard is live instantly.
            No approval. No cost. No implementation work on your end.
          </p>
          <Link href="/agency-connector">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-10">
              Get my partner dashboard <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          <p className="text-blue-400 text-sm mt-4">Takes 60 seconds · Already have a key? <a href="/partner-dashboard" className="underline hover:text-blue-200">Sign in here →</a></p>
        </div>
      </div>
    </div>
  );
}
