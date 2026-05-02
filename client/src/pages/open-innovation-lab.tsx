import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { FlaskConical, BookOpen, GitBranch, FileText, Microscope, Brain, Cpu, Sparkles, MessageSquare } from "lucide-react";

export default function OpenInnovationLabPage() {
  useEffect(() => {
    document.title = "Open Innovation Lab | TCAF";
  }, []);

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-8">
      <div className="space-y-3">
        <Badge variant="outline" className="gap-1.5 border-violet-500 text-violet-700 dark:text-violet-300">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> Open Methodology · Open Evidence
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Open Innovation Lab
        </h1>
        <p className="text-lg text-muted-foreground">
          The Open Innovation Lab is TCAF's applied research and methodology development surface.
          It is where new methodologies, AI-augmented service-delivery patterns, and evidence
          translations are designed, documented, and released as open methodology before they
          enter the operational program portfolio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" aria-hidden="true" /> What the Lab does</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Item title="Methodology development" desc="Documents, versions, and releases the proprietary methodologies (RPLICE, MAP-GAP, SALP, MG-PATR, ACOS, Three Realities) under open methodology terms so that other community-based organizations can adopt and adapt them." />
          <Item title="AI-augmented service delivery research" desc="Designs and tests AI-augmented patterns for case-management, screening, navigation, and outcome measurement — always with human-in-the-loop and HIPAA-aware boundaries." />
          <Item title="Evidence translation" desc="Translates published peer-reviewed research into community-deployable program protocols using the RPLICE protocol — preserving fidelity to the underlying evidence while adapting for community context." />
          <Item title="Cross-platform exchange" desc="Operates the bilateral exchange engine across our 24-platform ecosystem so that lessons learned in one program inform improvements in another." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-primary" aria-hidden="true" /> What the Lab is not</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p className="text-muted-foreground">
            The Lab is not a sandbox for unverified claims. Anything that graduates from the Lab into
            an operational program is subject to the same evidence, partnership, and outcome standards
            documented on the <Link href="/transparency-matrix" className="text-primary hover:underline">Transparency Matrix</Link>.
          </p>
          <p className="text-muted-foreground">
            The Lab is not a research-grade peer-reviewed laboratory. We are an applied implementation
            science organization. Peer-reviewed publication is pursued in partnership with university
            co-PIs (see <Link href="/research" className="text-primary hover:underline">Research & Methodology</Link>).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" aria-hidden="true" /> Active Lab streams</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <Stream icon={Brain} title="AI Literacy Curriculum" desc="Curriculum design for the AI Literacy track inside ThriveUp Academy. Anchored to age-appropriate AI literacy standards and ethics." href="/curriculum" />
          <Stream icon={FlaskConical} title="RPLICE protocol refinement" desc="Iterating the Research-to-Practice Lifecycle Implementation & Community Evidence protocol against live program implementations." href="/rplice-tools" />
          <Stream icon={Microscope} title="MAP-GAP framework" desc="Continuous-improvement protocol for community programs, validated against pilot operations." href="/mapgap-framework" />
          <Stream icon={Sparkles} title="Spark companion" desc="AI companion experimentation surface — focused on AI-as-coach for staff and community-facing roles." href="/ai-companion" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" aria-hidden="true" /> Open methodology terms</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            Methodology documentation, frameworks, and protocols developed by the Open Innovation
            Lab are released under permissive open-methodology terms. Other organizations are
            encouraged to adopt, adapt, and extend them — with attribution to TCAF.
          </p>
          <p className="text-xs text-muted-foreground italic">
            Software code in our 24-platform ecosystem is owned by TCAF and licensed selectively.
            Methodology documentation (RPLICE, MAP-GAP, SALP, MG-PATR, ACOS, Three Realities) is
            open. The Hub Adoption Kit is the documented implementation-ready package for
            replicating the model in another jurisdiction.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 space-y-3">
          <p className="font-semibold">Collaborate with the Lab:</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default" data-testid="button-lab-contact">
              <a href="mailto:research@thecollaborativeadvocate.org">
                <MessageSquare className="mr-2 h-4 w-4" /> research@thecollaborativeadvocate.org
              </a>
            </Button>
            <Button asChild variant="outline" data-testid="button-lab-research">
              <Link href="/research"><Microscope className="mr-2 h-4 w-4" /> Research & Methodology</Link>
            </Button>
            <Button asChild variant="outline" data-testid="button-lab-tm">
              <Link href="/transparency-matrix"><FileText className="mr-2 h-4 w-4" /> Transparency Matrix</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Item({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-3 rounded-md border bg-background">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}
function Stream({ icon: Icon, title, desc, href }: { icon: any; title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="block p-3 rounded-md border bg-background hover:bg-muted/40 transition" data-testid={`stream-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <div className="flex items-center gap-2 mb-1"><Icon className="h-4 w-4 text-primary" aria-hidden="true" /><p className="font-semibold text-sm">{title}</p></div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}
