/**
 * Widget Install Guide
 *
 * Shows any org how to embed the TCAF community portal on their website.
 * Includes a live preview, code snippets, and the iframe option.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Globe, Code, ExternalLink, Sparkles, CheckCircle2, Monitor } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function CodeBlock({ code }: { code: string }) {
  const { toast } = useToast();
  return (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs leading-relaxed overflow-x-auto whitespace-pre">
        {code}
      </pre>
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-2 right-2 h-7 text-xs"
        onClick={() => navigator.clipboard.writeText(code).then(() => toast({ title: "Copied!" }))}
      >
        <Copy className="h-3 w-3 mr-1" /> Copy
      </Button>
    </div>
  );
}

export default function WidgetInstallPage() {
  const [location, setLocation] = useState("28472");
  const [org, setOrg]           = useState("Emergency Charitable Services (NC)");
  const [label, setLabel]       = useState("Tell My Community Story");
  const [color, setColor]       = useState("#1a365d");

  // Build the snippet dynamically from form inputs
  const safeColor = /^#[0-9a-f]{3,6}$/i.test(color) ? color : "#1a365d";
  const portalUrl = `/embed/community-portal?location=${encodeURIComponent(location)}&org=${encodeURIComponent(org)}&color=${encodeURIComponent(safeColor)}`;

  const buttonSnippet = `<div data-tcaf-portal
     data-location="${location}"
     data-org="${org}"
     data-label="${label}"
     data-color="${safeColor}"></div>

<script src="https://thrivingcommunitiesforall.com/embed/tcaf-widget.js" async></script>`;

  const floatingSnippet = `<div data-tcaf-portal
     data-location="${location}"
     data-org="${org}"
     data-label="${label}"
     data-color="${safeColor}"
     data-button-style="floating"></div>

<script src="https://thrivingcommunitiesforall.com/embed/tcaf-widget.js" async></script>`;

  const iframeSnippet = `<iframe
  src="https://thrivingcommunitiesforall.com${portalUrl}"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius:12px; border:1px solid #e2e8f0;"
  title="${org} Community Portal">
</iframe>`;

  const features = [
    "📊 Community Story — live Census demographics, SDOH scores, AI narrative",
    "🔍 Get Help — benefits screener, resource finder, emergency help, 8 tools",
    "💰 Grants — matched funding opportunities for your community",
    "🤖 Navigator AI — ask any question about the community",
    "⬇ Downloads — PDF report and presentation slides from within the portal",
    "📍 Location-aware — pre-set your community or let visitors enter their own",
  ];

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Globe className="h-4 w-4" />
          <span>TCAF · Embed Community Portal</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Install on Any Website</h1>
        <p className="text-muted-foreground max-w-2xl">
          One line of code gives any website — ECS, a county health department, a faith organization,
          a coalition — a full community portal with every ThriveUp tool, pre-loaded for their geography.
          No login. No build step. Works on any site.
        </p>
      </div>

      {/* What's included */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
            <Sparkles className="h-4 w-4" /> What visitors get when they click the button
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Configurator */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Configure your embed</h2>

          <div className="space-y-1.5">
            <Label>Your community (ZIP, city, or county)</Label>
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. 28472  or  Columbus County, NC"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Organization name</Label>
            <Input
              value={org}
              onChange={e => setOrg(e.target.value)}
              placeholder="e.g. Emergency Charitable Services (NC)"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Button label</Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Tell My Community Story"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Brand color</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={safeColor}
                onChange={e => setColor(e.target.value)}
                className="h-9 w-14 rounded border cursor-pointer"
              />
              <Input
                value={color}
                onChange={e => setColor(e.target.value)}
                className="flex-1"
                placeholder="#1a365d"
              />
            </div>
          </div>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => window.open("/embed/demo", "_blank")}
          >
            <Monitor className="h-4 w-4 mr-2" /> Preview live demo
          </Button>
        </div>

        {/* Live preview */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Live preview</h2>
          <div className="rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: 500 }}>
            <iframe
              src={portalUrl}
              width="100%"
              height="500"
              frameBorder="0"
              title="Community Portal Preview"
              style={{ display: "block" }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            This is exactly what visitors will see when they click the button on your website.
          </p>
        </div>
      </div>

      {/* Code snippets */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" /> Copy and paste into your website
        </h2>

        <Tabs defaultValue="button">
          <TabsList>
            <TabsTrigger value="button">Inline button</TabsTrigger>
            <TabsTrigger value="floating">Floating button</TabsTrigger>
            <TabsTrigger value="iframe">Always-visible portal</TabsTrigger>
          </TabsList>

          <TabsContent value="button" className="space-y-3 mt-3">
            <p className="text-sm text-muted-foreground">
              Paste this anywhere on your page. A branded button appears.
              Clicking it opens the full community portal in a modal overlay.
            </p>
            <CodeBlock code={buttonSnippet} />
          </TabsContent>

          <TabsContent value="floating" className="space-y-3 mt-3">
            <p className="text-sm text-muted-foreground">
              Creates a floating button fixed to the bottom-right corner of every page
              on your site — always accessible, never in the way.
            </p>
            <CodeBlock code={floatingSnippet} />
          </TabsContent>

          <TabsContent value="iframe" className="space-y-3 mt-3">
            <p className="text-sm text-muted-foreground">
              Embed the portal directly on a page without any button click — the full
              interactive portal is always visible. Good for dedicated community pages.
            </p>
            <CodeBlock code={iframeSnippet} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Partner API */}
      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Need the data in your own systems? Use the Partner API.</p>
              <p className="text-xs text-muted-foreground">
                Organizations with a TCAF partner key can call{" "}
                <code className="bg-muted px-1 rounded">GET /api/partner/v1/community-story?location=28472</code>{" "}
                to get the full community story JSON — demographics, SDOH scores, grant matches, and narratives —
                for use in your own grant applications, reports, or internal dashboards.
              </p>
              <p className="text-xs text-muted-foreground">
                Contact TCAF at{" "}
                <a href="mailto:terryflood@thrivingcommunitiesforall.com" className="underline">
                  terryflood@thrivingcommunitiesforall.com
                </a>{" "}
                to request a partner key.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick install steps */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Install in 60 seconds</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {[
              { step: "1", text: "Configure your embed above — enter your ZIP, org name, button label, and brand color." },
              { step: "2", text: 'Copy the code snippet from the "Inline button" tab.' },
              { step: "3", text: "Paste it into any page on your website — a WordPress page, a Squarespace block, a plain HTML file, anywhere." },
              { step: "4", text: "Save and publish. The button appears immediately. No approval, no API key, no login required." },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3">
                <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0 shrink-0 rounded-full font-bold">
                  {step}
                </Badge>
                <span className="text-sm text-muted-foreground">{text}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
