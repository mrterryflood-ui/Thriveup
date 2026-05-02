import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Users, Building2, Heart, Scale, Microscope, Shield, MapPin, FileText, MessageSquare } from "lucide-react";
import { PartnershipStatus, PartnershipStatusLegend, type PartnershipStage } from "@/components/partnership-status";

interface Stakeholder {
  name: string;
  role: string;
  category: "funder" | "clinical" | "corrections" | "research" | "community" | "government";
  stage: PartnershipStage;
  notes?: string;
}

const STAKEHOLDERS: Stakeholder[] = [
  // Funders
  { name: "St. David's Foundation", role: "Foundation funder — WAB2 5-county benefits enrollment", category: "funder", stage: "discovery", notes: "WAB2 LOI v7 submitted 4/27/2026; St. David's actively evaluating." },
  { name: "Centene Foundation", role: "Foundation funder — behavioral health alignment", category: "funder", stage: "outreach" },
  { name: "VA Office of Mental Health and Suicide Prevention (OMHSP)", role: "Federal funder — SSG Fox Veterans Suicide Prevention Grant", category: "funder", stage: "aspirational", notes: "FY27 application in preparation." },
  { name: "BJA — Bureau of Justice Assistance", role: "Federal funder — Second Chance Act Reentry programs", category: "funder", stage: "aspirational", notes: "FY26 SCA application in preparation." },
  { name: "NSF — National Science Foundation", role: "Federal funder — research / implementation science", category: "funder", stage: "aspirational", notes: "Awaiting university co-PI partnership for lead-applicant eligibility." },
  { name: "SAMHSA", role: "Federal funder — CCBHC, suicide prevention", category: "funder", stage: "aspirational" },
  { name: "HRSA", role: "Federal funder — community health workforce, maternal & child health", category: "funder", stage: "aspirational" },
  { name: "Hogg Foundation for Mental Health", role: "Texas foundation — mental health", category: "funder", stage: "aspirational" },

  // Clinical
  { name: "Integral Care (Travis County LMHA)", role: "Local Mental Health Authority — primary clinical referral and crisis response", category: "clinical", stage: "outreach" },
  { name: "Central Texas Veterans Health Care System (Temple)", role: "VA medical center — coordinated care for VA-enrolled Veterans", category: "clinical", stage: "outreach" },
  { name: "CommUnityCare Health Centers", role: "Federally Qualified Health Center — primary care + behavioral health integration", category: "clinical", stage: "discovery" },
  { name: "People's Community Clinic", role: "Federally Qualified Health Center — East Austin and Manor service area", category: "clinical", stage: "aspirational" },
  { name: "Austin VA Outpatient Clinic", role: "VA outpatient mental health and primary care", category: "clinical", stage: "aspirational" },

  // Corrections / justice
  { name: "Texas Department of Criminal Justice — Reentry & Integration Division", role: "State corrections — pre-release coordination, TRAS data sharing", category: "corrections", stage: "outreach" },
  { name: "Travis County Correctional Complex", role: "County jail — pre-release coordination", category: "corrections", stage: "aspirational" },
  { name: "Travis County Adult Probation", role: "Community supervision coordination", category: "corrections", stage: "discovery" },
  { name: "Travis County District Attorney — Reentry & Restorative Justice", role: "DA office reentry initiatives", category: "corrections", stage: "aspirational" },

  // Research
  { name: "The University of Texas at Austin — Dell Medical School", role: "Health-services research and implementation science co-PI candidate", category: "research", stage: "aspirational" },
  { name: "Huston-Tillotson University", role: "Historically Black University — co-investigator and broader-impacts partner", category: "research", stage: "aspirational" },
  { name: "Austin Community College — Center for Public Policy & Political Studies", role: "Workforce / community engagement research partner", category: "research", stage: "aspirational" },
  { name: "Texas State University — School of Social Work", role: "Implementation research and outcome measurement partner", category: "research", stage: "aspirational" },

  // Community / coalitions
  { name: "Abundant Life Church", role: "501(c)(3) fiscal sponsor and community delivery partner", category: "community", stage: "active" },
  { name: "Goodwill Central Texas", role: "Workforce development and employer pipeline (reentry)", category: "community", stage: "discovery" },
  { name: "Faith-network host families", role: "Transitional housing pathway for returning citizens", category: "community", stage: "outreach" },

  // Government / MCO
  { name: "Superior HealthPlan (Centene)", role: "Texas Medicaid STAR + STAR+PLUS MCO", category: "government", stage: "aspirational" },
  { name: "Dell Children's Health Plan", role: "Texas Medicaid STAR Kids MCO", category: "government", stage: "aspirational" },
  { name: "Sendero Health Plans", role: "Travis County local Medicaid MCO", category: "government", stage: "aspirational" },
  { name: "Texas Health and Human Services Commission (HHSC)", role: "State Medicaid administrator", category: "government", stage: "aspirational" },
  { name: "Travis County Commissioners Court", role: "County government — pilot host jurisdiction", category: "government", stage: "aspirational" },
  { name: "City of Austin", role: "Municipal government — pilot host jurisdiction", category: "government", stage: "aspirational" },
];

const CATEGORY_META: Record<Stakeholder["category"], { label: string; icon: any }> = {
  funder: { label: "Funders", icon: Building2 },
  clinical: { label: "Clinical Partners", icon: Heart },
  corrections: { label: "Corrections & Justice System", icon: Scale },
  research: { label: "Research Institutions", icon: Microscope },
  community: { label: "Community & Coalition Partners", icon: Users },
  government: { label: "Government & Medicaid MCOs", icon: Shield },
};

export default function StakeholderMapPage() {
  useEffect(() => {
    document.title = "Stakeholder Engagement Map | TCAF & ALC";
  }, []);

  const categories = Object.keys(CATEGORY_META) as Stakeholder["category"][];

  return (
    <div className="container max-w-6xl py-8 px-4 space-y-8">
      <div className="space-y-3">
        <Badge variant="outline" className="gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Honest by default</Badge>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Stakeholder Engagement Map</h1>
        <p className="text-lg text-muted-foreground">
          Every named external party that TCAF/ALC's program model depends on, with the honest
          status of our relationship today. Reviewers can verify any entry by emailing the
          partnerships address below.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partnership Stage Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <PartnershipStatusLegend />
          <p className="text-xs text-muted-foreground italic mt-3">
            We do not claim partnerships we do not have. "Aspirational" means we have identified the
            partner and the role we want them to play; "Outreach" means we have made first contact;
            "Discovery" means we are in active dialogue; "LOI Drafted" or "LOI Signed" indicates
            written intent; "MOU Executed" indicates a binding written agreement; "Active" indicates
            an operating partnership.
          </p>
        </CardContent>
      </Card>

      {categories.map((cat) => {
        const meta = CATEGORY_META[cat];
        const Icon = meta.icon;
        const items = STAKEHOLDERS.filter((s) => s.category === cat);
        return (
          <Card key={cat} data-testid={`group-stakeholder-${cat}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" aria-hidden="true" /> {meta.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((s) => (
                <div key={s.name} className="p-3 rounded-md border bg-background" data-testid={`stakeholder-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 40)}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-[260px]">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.role}</p>
                      {s.notes && <p className="text-xs text-foreground/80 italic mt-1">{s.notes}</p>}
                    </div>
                    <PartnershipStatus stage={s.stage} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card className="bg-muted/30">
        <CardContent className="pt-6 space-y-3 text-sm">
          <p className="font-semibold">Verify or partner with us:</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default" data-testid="button-partnerships-contact">
              <a href="mailto:president@thecollaborativeadvocate.org">
                <MessageSquare className="mr-2 h-4 w-4" /> president@thecollaborativeadvocate.org
              </a>
            </Button>
            <Button asChild variant="outline" data-testid="button-tm-link">
              <Link href="/transparency-matrix"><FileText className="mr-2 h-4 w-4" /> Transparency Matrix</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
