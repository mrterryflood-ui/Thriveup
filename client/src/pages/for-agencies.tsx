/**
 * For Other Agencies — funding available to bring this platform (or similar
 * multi-agency technology) to your own community.
 *
 * Public page. Surfaces open, real grant opportunities that match
 * capacity-building / multi-agency coordination / technology-transfer
 * language, then routes the visitor to GrantPathPro to act on one.
 */
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, ExternalLink, Sparkles, Globe, ArrowRight } from "lucide-react";

interface AgencyOpportunity {
  id: string;
  title: string;
  agency: string | null;
  description: string | null;
  fundingAmount: string | null;
  deadline: string | null;
  fitScore: number | null;
  source: string | null;
  sourceUrl: string | null;
  status: string | null;
  matchedThemes: string[];
  matchedKeywords: string[];
  fitReason: string | null;
  proposalAngle: string | null;
}

function fmtDeadline(d: string | null) {
  if (!d) return "Rolling / no fixed deadline";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ForAgenciesPage() {
  const { data, isLoading, isError, refetch } = useQuery<{ note: string; total: number; opportunities: AgencyOpportunity[] }>({
    queryKey: ["/api/grants/for-agencies"],
  });
  const { data: gppStatus, isLoading: isGppStatusLoading, isError: isGppStatusError, refetch: refetchGppStatus } = useQuery<{ configured: boolean; url: string | null }>({
    queryKey: ["/api/consortium/gpp-status"],
  });
  const grantPathProUrl = gppStatus?.url || null;

  return (
    <div className="container max-w-4xl py-8 px-4 space-y-8" data-testid="page-for-agencies">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Globe className="h-4 w-4" />
          <span>For Other Agencies</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Funding to bring this to your community</h1>
        <p className="text-muted-foreground max-w-2xl">
          If your agency, nonprofit, government office, or coalition wants to adopt a platform like this one —
          multi-service coordination, AI-assisted navigation, cross-agency referrals — here are real, currently
          open funding opportunities whose language matches that kind of technology and capacity-building work.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <p>Couldn't load current opportunities.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {data && (
        <>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5 text-sm text-muted-foreground">
              {data.note}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {data.opportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open matches right now — check back soon, this list refreshes as new grants are discovered.</p>
            ) : (
              data.opportunities.map(g => (
                <Card key={g.id} data-testid={`card-agency-opportunity-${g.id}`}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">{g.title}</p>
                        {g.agency && <p className="text-xs text-muted-foreground">{g.agency}</p>}
                      </div>
                      {typeof g.fitScore === "number" && g.fitScore > 0 && (
                        <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-primary/20">
                          <Sparkles className="h-3 w-3 mr-1" />{g.fitScore} fit
                        </Badge>
                      )}
                    </div>
                    {g.description && <p className="text-xs text-muted-foreground line-clamp-2">{g.description}</p>}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {g.fundingAmount && <span>{g.fundingAmount}</span>}
                      <span>Deadline: {fmtDeadline(g.deadline)}</span>
                    </div>
                    {g.matchedThemes?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {g.matchedThemes.map(theme => (
                          <Badge key={theme} variant="secondary" className="text-[10px]">{theme}</Badge>
                        ))}
                      </div>
                    )}
                    {g.fitReason && (
                      <div className="rounded-md bg-muted/60 p-2.5 text-xs space-y-1">
                        <p><span className="font-medium text-foreground">Why this fits:</span> <span className="text-muted-foreground">{g.fitReason}</span></p>
                        {g.proposalAngle && (
                          <p><span className="font-medium text-foreground">How to angle your proposal:</span> <span className="text-muted-foreground">{g.proposalAngle}</span></p>
                        )}
                      </div>
                    )}
                    {g.sourceUrl && (
                      <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer"
                        aria-label={`View source for ${g.title} (opens in a new tab)`}
                        className="text-xs text-primary flex items-center gap-1 hover:underline">
                        View opportunity <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Ready to pursue one of these?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            GrantPathPro helps you turn a matched opportunity into an actual, submittable application —
            proposal drafting, budget building, and compliance review.
          </p>
          {isGppStatusLoading ? (
            <p className="text-sm text-muted-foreground" data-testid="grantpathpro-link-loading">
              Checking the GrantPathPro destination…
            </p>
          ) : isGppStatusError ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground" data-testid="grantpathpro-link-error">
                The GrantPathPro destination could not be checked.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => refetchGppStatus()}>
                Retry
              </Button>
            </div>
          ) : grantPathProUrl ? (
            <Button asChild data-testid="button-go-to-grantpathpro">
              <a href={grantPathProUrl} target="_blank" rel="noopener noreferrer" aria-label="Go to GrantPathPro (opens in a new tab)">
                Go to GrantPathPro <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="grantpathpro-link-unavailable">
              The GrantPathPro destination is not configured on this deployment. No link is being guessed.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
