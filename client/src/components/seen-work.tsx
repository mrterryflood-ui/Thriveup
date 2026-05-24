import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface SeenMember {
  id: string;
  displayName: string;
  roles: string[];
  region: string | null;
  zipCode: string | null;
  quote: string | null;
  seenSince: string;
}

interface SeenWorkProps {
  surface: string;
  title?: string;
  description?: string;
  limit?: number;
  className?: string;
}

/**
 * Public-site primitive — surfaces community members who have explicitly consented
 * to be NAMED publicly (Iron Rule #8: nameMePublicly=true). Shows quotes only when
 * quoteMe=true. Anti-extraction by construction: members who haven't consented are
 * not in the response from /api/iti/seen.
 */
export function SeenWork({ surface, title, description, limit = 20, className }: SeenWorkProps) {
  const { data, isLoading } = useQuery<{ surface: string; members: SeenMember[] }>({
    queryKey: ["/api/iti/seen", { surface, limit }],
    queryFn: async () => {
      const r = await fetch(`/api/iti/seen?surface=${encodeURIComponent(surface)}&limit=${limit}`);
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
  });

  const members = data?.members ?? [];

  return (
    <Card className={className} data-testid={`seen-work-${surface}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title ?? "People holding this together"}
        </CardTitle>
        <CardDescription>
          {description ?? "Community members who self-identified as doing this work and asked to be named publicly. Listed by their consent, not our outreach."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : members.length === 0 ? (
          <div className="text-sm text-muted-foreground" data-testid="seen-work-empty">
            No one has asked to be named publicly here yet. That's a feature, not a bug — we never name anyone without their explicit consent.
          </div>
        ) : (
          <ul className="space-y-3">
            {members.map((m) => (
              <li key={m.id} className="border-l-2 border-primary/40 pl-3 py-1" data-testid={`seen-member-${m.id}`}>
                <div className="font-medium" data-testid={`text-seen-name-${m.id}`}>{m.displayName}</div>
                {m.roles.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.roles.map((r) => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
                  </div>
                )}
                {(m.region || m.zipCode) && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[m.region, m.zipCode].filter(Boolean).join(" · ")}
                  </div>
                )}
                {m.quote && (
                  <blockquote className="mt-2 text-sm italic text-muted-foreground" data-testid={`text-seen-quote-${m.id}`}>
                    "{m.quote}"
                  </blockquote>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
