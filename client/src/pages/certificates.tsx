import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Printer, ArrowLeft, GraduationCap, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Certificate } from "@shared/schema";

export default function CertificatesPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-6 w-72 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Award className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold mb-2" data-testid="text-login-prompt-title">
            Sign in to view your certificates
          </h1>
          <p className="text-muted-foreground mb-6">
            Log in to see the certificates you've earned.
          </p>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Log In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-6 w-72 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-certificates-heading">
          My Certificates
        </h1>
        <p className="text-muted-foreground">
          Certificates earned by completing all module quizzes in a level.
        </p>
      </div>

      {!certificates || certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GraduationCap className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2" data-testid="text-empty-state">
            No certificates yet
          </h2>
          <p className="text-muted-foreground max-w-md">
            Complete all module quizzes in a level to earn your certificate!
          </p>
          <Link href="/curriculum">
            <Button variant="outline" className="mt-6" data-testid="button-browse-curriculum">
              Browse Curriculum
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <Card
              key={cert.id}
              className="p-6"
              data-testid={`card-certificate-${cert.id}`}
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Award className="h-7 w-7 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-center mb-1" data-testid={`text-cert-level-${cert.id}`}>
                {cert.levelTitle}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-1" data-testid={`text-cert-name-${cert.id}`}>
                {cert.userName}
              </p>
              <p className="text-xs text-muted-foreground text-center mb-4" data-testid={`text-cert-date-${cert.id}`}>
                {cert.issuedAt
                  ? new Date(cert.issuedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Date not available"}
              </p>
              <Link href={`/certificates/${cert.id}`}>
                <Button variant="outline" className="w-full" data-testid={`button-view-cert-${cert.id}`}>
                  <Award className="h-4 w-4 mr-2" />
                  View & Print
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function CertificateViewPage() {
  const params = useParams<{ id: string }>();

  const { data: cert, isLoading } = useQuery<Certificate>({
    queryKey: ["/api/certificates", params.id],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-20">
        <Award className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2" data-testid="text-cert-not-found">
          Certificate not found
        </h1>
        <p className="text-muted-foreground mb-6">
          This certificate may have been removed or the link is invalid.
        </p>
        <Link href="/certificates">
          <Button variant="outline" data-testid="button-back-certificates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Certificates
          </Button>
        </Link>
      </div>
    );
  }

  const formattedDate = cert.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date not available";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <style>{`
        @media print {
          header, nav, aside, [data-testid="button-sidebar-toggle"],
          .print-hide {
            display: none !important;
          }
          main {
            padding: 0 !important;
            overflow: visible !important;
          }
          .certificate-container {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="print-hide mb-6">
        <Link href="/certificates">
          <Button variant="ghost" data-testid="button-back-certificates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Certificates
          </Button>
        </Link>
      </div>

      <div
        className="certificate-container mx-auto max-w-3xl p-1 rounded-md"
        style={{
          background: "linear-gradient(135deg, #d4a017 0%, #f5d98e 25%, #d4a017 50%, #f5d98e 75%, #d4a017 100%)",
          boxShadow: "0 8px 32px rgba(180, 140, 40, 0.3), 0 2px 8px rgba(0,0,0,0.1)",
        }}
        data-testid="certificate-frame"
      >
        <div
          className="bg-white dark:bg-zinc-950 rounded-sm p-2"
        >
          <div
            className="rounded-sm p-8 sm:p-12 text-center"
            style={{
              border: "2px solid #c9a84c",
              background: "linear-gradient(to bottom, rgba(253, 244, 220, 0.3) 0%, rgba(255,255,255,0) 100%)",
            }}
          >
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-amber-500 text-amber-500"
                />
              ))}
            </div>

            <h1
              className="text-3xl sm:text-4xl font-bold tracking-wide mb-2"
              style={{ color: "#8b6914", fontFamily: "Georgia, 'Times New Roman', serif" }}
              data-testid="text-certificate-title"
            >
              Certificate of Achievement
            </h1>

            <p
              className="text-sm sm:text-base tracking-widest uppercase mb-6"
              style={{ color: "#b8942e" }}
              data-testid="text-certificate-subtitle"
            >
              Learning Academy
            </p>

            <hr
              className="mx-auto mb-8"
              style={{
                border: "none",
                height: "2px",
                maxWidth: "200px",
                background: "linear-gradient(to right, transparent, #c9a84c, transparent)",
              }}
            />

            <p className="text-muted-foreground mb-2 text-sm">This certifies that</p>

            <p
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: "#5a4510", fontFamily: "Georgia, 'Times New Roman', serif" }}
              data-testid="text-certificate-student"
            >
              {cert.userName}
            </p>

            <p className="text-muted-foreground mb-6 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              has successfully completed all requirements for{" "}
              <span className="font-semibold" data-testid="text-certificate-level">
                {cert.levelTitle}
              </span>{" "}
              in the Learning Academy AI Curriculum.
            </p>

            <hr
              className="mx-auto mb-6"
              style={{
                border: "none",
                height: "2px",
                maxWidth: "200px",
                background: "linear-gradient(to right, transparent, #c9a84c, transparent)",
              }}
            />

            <div className="flex justify-center mb-8">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6" data-testid="text-certificate-date">
              Completed on {formattedDate}
            </p>

            <div className="mx-auto max-w-[200px] mb-2">
              <div
                className="border-b-2 mb-2"
                style={{ borderColor: "#c9a84c" }}
              />
              <p className="text-sm font-medium" style={{ color: "#8b6914" }}>
                Learning Academy Faculty
              </p>
            </div>

            <p
              className="text-xs text-muted-foreground mt-8"
              data-testid="text-certificate-id"
            >
              Certificate ID: {cert.id}
            </p>
          </div>
        </div>
      </div>

      <div className="print-hide flex justify-center mt-8">
        <Button
          onClick={() => window.print()}
          data-testid="button-print-certificate"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Certificate
        </Button>
      </div>
    </div>
  );
}
