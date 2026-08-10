/**
 * /for-partners — Public landing page for the embeddable TCAF widget.
 * No auth required. Showcases the widget, copy-paste snippets, and customization options.
 */

import { useEffect } from "react";
import { Code, Globe, Zap, Mail, ExternalLink, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const WIDGET_SNIPPET = `<!-- Step 1: Add this div where you want the widget -->
<div data-tcaf-widget="community-brief"
     data-org-name="Your Org Name"
     data-org-color="#2563EB"
     data-org-logo-url="https://yoursite.com/logo.png"
     data-placeholder-zip="78753"></div>

<!-- Step 2: Drop this script tag anywhere on the page -->
<script
  src="https://thrivingcommunitiesforall.com/embed/tcaf-widget.js"
  async>
</script>`;

const ATTRIBUTES = [
  {
    name: "data-org-name",
    type: "string",
    required: false,
    description: "Your organization's display name, shown above the widget input.",
    example: 'data-org-name="Austin Travis County"',
  },
  {
    name: "data-org-color",
    type: "hex color",
    required: false,
    description: "Brand accent color for the button and highlights. Defaults to TCAF indigo (#4F46E5).",
    example: 'data-org-color="#2563EB"',
  },
  {
    name: "data-org-logo-url",
    type: "URL",
    required: false,
    description: "URL of your org's logo image (PNG or SVG recommended). Shown in the widget header.",
    example: 'data-org-logo-url="https://yoursite.com/logo.png"',
  },
  {
    name: "data-placeholder-zip",
    type: "string",
    required: false,
    description: "Pre-filled placeholder text in the ZIP input. Use your service area ZIP to guide users.",
    example: 'data-placeholder-zip="78741"',
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TCAF Community Brief Widget",
  applicationCategory: "WebApplication",
  operatingSystem: "Any",
  description:
    "Embeddable community health and equity brief widget powered by TCAF. Any organization can drop it on their site with one script tag — no account required.",
  url: "https://thrivingcommunitiesforall.com/for-partners",
  provider: {
    "@type": "Organization",
    name: "Thriving Communities for All (TCAF)",
    url: "https://thrivingcommunitiesforall.com",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Community health grade (A–F)",
    "At-risk population identification",
    "Equity narrative summary",
    "Full report deep-link",
    "Brand customization (color, logo, org name)",
    "Mobile responsive",
    "Shadow DOM — no CSS conflicts",
    "No account required",
  ],
};

export default function ForPartnersPage() {
  // Inject JSON-LD on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(JSON_LD);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Inject the TCAF widget script once (idempotent)
  useEffect(() => {
    const existing = document.querySelector('script[src*="tcaf-widget.js"]');
    if (existing) {
      // Already loaded — re-initialize for any new divs on this page
      if ((window as any).TCAFWidget) {
        (window as any).TCAFWidget.init();
      }
      return;
    }
    const script = document.createElement("script");
    script.src = "/embed/tcaf-widget.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24 text-center max-w-3xl mx-auto">
        <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
          Free for all organizations
        </Badge>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
          Embed TCAF intelligence<br />on your site — free,<br />
          <span className="text-indigo-600">no account required</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Give your community the power to instantly understand their neighborhood's health,
          equity, and at-risk population data — powered by TCAF's nationwide platform.
          One script tag. Zero setup.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
            <a href="#get-started">
              Get the widget <ChevronRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/embed/demo" target="_blank" rel="noopener noreferrer">
              See live demo <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* ── Live Demo ────────────────────────────────────────────────────── */}
      <section className="px-4 pb-16 max-w-xl mx-auto text-center">
        <p className="text-sm text-gray-500 mb-4 uppercase tracking-wider font-semibold">
          Live Widget Preview
        </p>
        <div
          data-tcaf-widget="community-brief"
          data-org-name="Your Organization"
          data-org-color="#4F46E5"
          data-placeholder-zip="78753"
        />
      </section>

      {/* ── Steps ────────────────────────────────────────────────────────── */}
      <section id="get-started" className="px-4 py-16 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            Up and running in 3 steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Copy the snippet</h3>
              <p className="text-sm text-gray-600">
                Grab the two-line code block below and paste it anywhere in your HTML — no build tools needed.
              </p>
            </div>
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Customize (optional)</h3>
              <p className="text-sm text-gray-600">
                Add your org name, brand color, and logo via HTML attributes. The widget auto-adapts with no extra code.
              </p>
            </div>
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Publish</h3>
              <p className="text-sm text-gray-600">
                Deploy your site. Your visitors can immediately analyze any ZIP code — no sign-in, no API key, no quota.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Code Block ───────────────────────────────────────────────────── */}
      <section className="px-4 py-16 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Code className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Copy-paste snippet</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Replace the attribute values with your org's details, or leave them out for a plain TCAF-branded widget.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 rounded-xl p-5 text-sm leading-relaxed overflow-x-auto font-mono whitespace-pre-wrap">
            {WIDGET_SNIPPET}
          </pre>
        </div>
      </section>

      {/* ── Customization Table ──────────────────────────────────────────── */}
      <section className="px-4 py-8 pb-16 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Customization options</h2>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Attribute</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {ATTRIBUTES.map((attr, i) => (
                    <tr key={attr.name} className={i < ATTRIBUTES.length - 1 ? "border-b" : ""}>
                      <td className="px-4 py-3 align-top">
                        <code className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-xs">
                          {attr.name}
                        </code>
                        {!attr.required && (
                          <span className="ml-1.5 text-xs text-gray-400">optional</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-500 hidden md:table-cell">
                        <code className="text-xs">{attr.type}</code>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-600">
                        <p>{attr.description}</p>
                        <code className="block mt-1.5 text-xs text-gray-400 font-mono">{attr.example}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── What's Included ──────────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What the widget shows</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Community health & equity grade (A–F)",
              "Overall equity score (0–100)",
              "Top 3 at-risk population segments",
              "2-sentence AI narrative summary",
              "Deep-link to full TCAF report",
              "Mobile-responsive layout",
              "Your brand colors, logo & org name",
              "Shadow DOM — never breaks your CSS",
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner API CTA ──────────────────────────────────────────────── */}
      <section className="px-4 py-16 max-w-3xl mx-auto">
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Globe className="h-5 w-5" />
              Need more? Apply for Partner API access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-indigo-800 text-sm mb-5">
              The public widget covers the essentials. TCAF Partner API gives you full JSON access to
              community briefs, population analytics, SDOH chain data, and more — with a dedicated
              API key, rate limits, and partner onboarding support.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="default" className="bg-indigo-600 hover:bg-indigo-700">
                <a href="mailto:partnerships@thrivingcommunitiesforall.com?subject=Partner API Access Request">
                  <Mail className="mr-2 h-4 w-4" /> Email Us
                </a>
              </Button>
              <Button asChild variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-100">
                <a href="/ops-center">
                  Ops Center (staff) <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <div className="text-center pb-12 text-xs text-gray-400">
        <p>
          TCAF is an IRS-determined 501(c)(3) · SAM.gov Active (UEI KDDVD1FGLW35) · CAGE 209N1
        </p>
        <p className="mt-1">
          <a
            href="https://thrivingcommunitiesforall.com"
            className="underline hover:text-gray-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            thrivingcommunitiesforall.com
          </a>
        </p>
      </div>
    </div>
  );
}
