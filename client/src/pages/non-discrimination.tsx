import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Heart, Scale, Mail, FileText, ExternalLink } from "lucide-react";
import { useEffect } from "react";

export default function NonDiscriminationPage() {
  useEffect(() => {
    document.title = "Non-Discrimination & Equal Opportunity | The Collaborative Advocate Foundation";
  }, []);

  return (
    <div className="container max-w-4xl py-8 px-4 space-y-6">
      <div className="space-y-3">
        <Badge variant="outline" className="gap-1.5">
          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
          Federal Compliance
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Non-Discrimination & Equal Opportunity Statement
        </h1>
        <p className="text-muted-foreground">
          Our binding commitment to serve all participants equitably, regardless of background or belief.
        </p>
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" aria-hidden="true" />
            Our Commitment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p data-testid="text-commitment">
            The Collaborative Advocate Foundation (TCAF) and Abundant Life Church (ALC), operating jointly
            as fiscal sponsor and program partner, do not discriminate on the basis of race, color, national
            origin, ethnicity, ancestry, religion, creed, sex, gender identity or expression, sexual
            orientation, age, marital status, parental status, military or veteran status, disability,
            genetic information, citizenship status, or any other characteristic protected by federal,
            state, or local law.
          </p>
          <p>
            This commitment applies to every program, service, employment decision, contracting
            opportunity, and participant interaction across our entire ecosystem. Faith-based identity is
            part of our heritage; faith-based discrimination is not part of our practice.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
            Federal Statutes We Operate Under
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ComplianceRow
            statute="Title VI, Civil Rights Act of 1964"
            scope="Race, color, national origin in federally-funded programs"
          />
          <ComplianceRow
            statute="Title IX, Education Amendments of 1972"
            scope="Sex-based discrimination in education programs"
          />
          <ComplianceRow
            statute="Section 504, Rehabilitation Act of 1973"
            scope="Disability discrimination in federally-funded programs"
          />
          <ComplianceRow
            statute="Age Discrimination Act of 1975"
            scope="Age-based discrimination in federally-funded programs"
          />
          <ComplianceRow
            statute="Americans with Disabilities Act (ADA), 1990"
            scope="Disability access and reasonable accommodations"
          />
          <ComplianceRow
            statute="Equal Employment Opportunity (Title VII)"
            scope="Workplace non-discrimination and equal opportunity employment"
          />
          <ComplianceRow
            statute="Faith-Based & Community Initiatives — DOJ/HHS/VA Equal Treatment Regulations (2024 Final Rule)"
            scope="Beneficiaries may not be required to participate in religious activities; alternative providers identified on request; no discrimination on the basis of religion or refusal to participate in religious activity"
          />
          <ComplianceRow
            statute="VA SSG Fox Suicide Prevention Grant — Non-Discrimination Conditions"
            scope="Services provided to all eligible Veterans regardless of religion, sexual orientation, gender identity, or character of discharge"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
            What This Means in Practice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <div>
            <p className="font-semibold mb-1">For program participants</p>
            <p className="text-muted-foreground">
              You are welcome in every TCAF/ALC program regardless of your faith, beliefs, or background.
              You will never be required to participate in a religious activity to receive benefits or
              services. If you prefer a non-faith-based alternative provider for any service we offer, we
              will help you find one in our partner network at no cost to you.
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-semibold mb-1">For Veterans</p>
            <p className="text-muted-foreground">
              All Veteran services are provided regardless of religion, sexual orientation, gender
              identity, or character of discharge. Crisis resources are available 24/7 through the Veterans
              Crisis Line (Dial 988, then Press 1) and are referenced in every Veteran-facing program.
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-semibold mb-1">For employees and contractors</p>
            <p className="text-muted-foreground">
              Hiring, compensation, promotion, and contracting decisions are made on the basis of
              qualifications and ability to do the work. Reasonable accommodations are provided on request
              for applicants and employees with disabilities.
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-semibold mb-1">For partners and sub-recipients</p>
            <p className="text-muted-foreground">
              Every partner and sub-recipient is required to certify compliance with these same standards
              as a condition of receiving sub-awards or being listed as a coalition member.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            Filing a Complaint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>
            If you believe you have experienced discrimination by a TCAF/ALC program, you may file a
            complaint with us directly or with the relevant federal agency.
          </p>
          <div>
            <p className="font-semibold mb-1">Internal complaint</p>
            <p className="text-muted-foreground">
              Email{" "}
              <a
                href="mailto:civilrights@thecollaborativeadvocate.org"
                className="text-primary hover:underline"
                data-testid="link-internal-complaint"
              >
                civilrights@thecollaborativeadvocate.org
              </a>
              . Complaints are reviewed within 10 business days and investigated within 30 days. No
              retaliation will occur for filing in good faith.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Federal agency complaint</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>
                U.S. Department of Justice — Office for Civil Rights:{" "}
                <a
                  href="https://civilrights.justice.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                  data-testid="link-doj-ocr"
                >
                  civilrights.justice.gov <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li>
                U.S. Department of Health and Human Services — OCR:{" "}
                <a
                  href="https://www.hhs.gov/ocr/complaints/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                  data-testid="link-hhs-ocr"
                >
                  hhs.gov/ocr <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li>
                U.S. Department of Veterans Affairs — Office of Resolution Management:{" "}
                <a
                  href="https://www.va.gov/ORM/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                  data-testid="link-va-orm"
                >
                  va.gov/ORM <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 text-xs text-muted-foreground space-y-2">
          <p>
            <span className="font-semibold text-foreground">Accessibility:</span> This site is designed to
            meet WCAG 2.1 AA and Section 508 standards. To request an accommodation or alternative format,
            email{" "}
            <a
              href="mailto:accessibility@thecollaborativeadvocate.org"
              className="text-primary hover:underline"
              data-testid="link-accessibility"
            >
              accessibility@thecollaborativeadvocate.org
            </a>
            .
          </p>
          <p>
            <span className="font-semibold text-foreground">Language access:</span> We provide language
            assistance services free of charge. Contact us for translation or interpretation in any
            language you need.
          </p>
          <p className="pt-2 border-t">
            Statement effective: 2026 · Reviewed annually · Last reviewed April 2026
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ComplianceRow({ statute, scope }: { statute: string; scope: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b last:border-0">
      <p className="font-medium text-sm">{statute}</p>
      <p className="sm:col-span-2 text-sm text-muted-foreground">{scope}</p>
    </div>
  );
}
