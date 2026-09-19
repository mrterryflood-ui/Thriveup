/**
 * /status/:token — Public, token-gated referral status page.
 * No login required. Client visits this link to see where their referral stands.
 */

import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, AlertCircle, Heart } from "lucide-react";

interface ReferralStatus {
  orgName: string;
  programCode: string;
  status: string;
}

type StatusError = Error & { status?: number; retryAfter?: number };

const PROGRAM_LABELS: Record<string, string> = {
  SNAP: "SNAP (Food Benefits)",
  Medicaid: "Medicaid",
  CHIP: "CHIP (Children's Health Insurance)",
  WIC: "WIC (Women, Infants & Children)",
  EITC: "Earned Income Tax Credit",
  CTC: "Child Tax Credit",
  SSI: "SSI (Supplemental Security Income)",
  SSDI: "SSDI (Social Security Disability)",
  Marketplace: "Health Insurance Marketplace",
};

function StatusDisplay({ status }: { status: string }) {
  if (status === "enrolled") {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
        <Badge className="text-base px-4 py-1 bg-green-600">Enrolled</Badge>
        <p className="text-muted-foreground text-center max-w-sm">
          Great news — you have been enrolled in this program. If you have questions about next steps,
          contact the organization directly.
        </p>
      </div>
    );
  }
  if (status === "sent" || status === "accepted") {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <Clock className="h-16 w-16 text-amber-500" />
        <Badge variant="secondary" className="text-base px-4 py-1">In Progress</Badge>
        <p className="text-muted-foreground text-center max-w-sm">
          Your referral has been sent and is being reviewed. The organization will follow up with you soon.
          No action needed from you right now.
        </p>
      </div>
    );
  }
  if (status === "ineligible") {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <AlertCircle className="h-16 w-16 text-orange-500" />
        <Badge variant="outline" className="text-base px-4 py-1">Not Eligible</Badge>
        <p className="text-muted-foreground text-center max-w-sm">
          After reviewing your application, the program determined you do not qualify at this time.
          A navigator can help you find other options — call <strong>2-1-1</strong> for free assistance.
        </p>
      </div>
    );
  }
  if (status === "withdrew") {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <XCircle className="h-16 w-16 text-muted-foreground" />
        <Badge variant="outline" className="text-base px-4 py-1">Withdrawn</Badge>
        <p className="text-muted-foreground text-center max-w-sm">
          This referral was marked as withdrawn. If you still need help, call <strong>2-1-1</strong> to
          connect with a navigator.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <Clock className="h-16 w-16 text-blue-500" />
      <Badge variant="secondary" className="text-base px-4 py-1">Pending</Badge>
      <p className="text-muted-foreground text-center max-w-sm">
        Your referral is being processed. You don't need to do anything right now — the organization
        will reach out to you.
      </p>
    </div>
  );
}

export default function ReferralStatusPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error, refetch } = useQuery<ReferralStatus>({
    queryKey: ["/api/referrals/status", token],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/referrals/status/${encodeURIComponent(token ?? "")}`, {
        signal: AbortSignal.any([signal!, AbortSignal.timeout(15_000)]),
      });
      if (!res.ok) {
        const error = new Error(
          res.status === 404 ? "This referral link is invalid or has expired." :
          res.status === 429 ? "Too many checks. Please wait before trying again." :
          res.status >= 500 ? "The referral status service is temporarily unavailable." :
          "We could not look up this referral.",
        ) as StatusError;
        error.status = res.status;
        const retryAfter = Number(res.headers.get("Retry-After"));
        if (Number.isFinite(retryAfter) && retryAfter > 0) error.retryAfter = retryAfter;
        throw error;
      }
      return res.json();
    },
    enabled: !!token,
    // This page is often left open by a client waiting on a partner org's
    // decision. Poll and refetch aggressively so a status change (partner
    // confirms/updates the referral) shows up without the client needing to
    // manually reload — a stale badge here is the exact failure this page
    // exists to prevent.
    staleTime: 15 * 1000,
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const currentStatus = query.state.data?.status;
      return currentStatus === "accepted" || currentStatus === "enrolled" || currentStatus === "withdrew" || currentStatus === "ineligible"
        ? false
        : 15 * 1000;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const statusError = error as StatusError | null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2 mb-6">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            <h1 className="text-xl font-bold">Referral Status</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            The Collaborative Advocate Foundation · Free · Confidential
          </p>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Looking up your referral…
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center space-y-2" role="alert" aria-live="assertive">
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="font-medium">
                {statusError?.status === 404 ? "Referral not found" :
                 statusError?.status === 429 ? "Please wait before trying again" :
                 statusError?.status && statusError.status >= 500 ? "Status temporarily unavailable" :
                 "Unable to check referral status"}
              </p>
              <p className="text-sm text-muted-foreground">
                {statusError?.status === 404
                  ? <>This link may have expired or be incorrect. Call <strong>2-1-1</strong> for free navigation help.</>
                  : statusError?.status === 429
                    ? <>Please wait {statusError.retryAfter ? `${statusError.retryAfter} seconds ` : ""}and try again.</>
                    : <>Please try again shortly. If the problem continues, call <strong>2-1-1</strong> for free navigation help.</>}
              </p>
               {statusError?.status !== 404 && (
                 <Button variant="outline" size="sm" onClick={() => void refetch()}>
                   Try again
                 </Button>
               )}
            </CardContent>
          </Card>
        )}

        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-muted-foreground">
                {PROGRAM_LABELS[data.programCode] ?? data.programCode}
              </CardTitle>
              <p className="text-sm font-semibold">{data.orgName}</p>
            </CardHeader>
            <CardContent>
              <StatusDisplay status={data.status} />
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/30">
          <CardContent className="pt-4 text-center text-xs text-muted-foreground space-y-1">
            <p>Need more help? Call <strong>2-1-1</strong> — free, 24/7, 170+ languages.</p>
            <p>The Collaborative Advocate Foundation · 501(c)(3) · EIN 41-3618003</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
