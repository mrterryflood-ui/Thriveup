// Sidebar workspace switcher for the conglomerate / open-collaboration model.
// Lists every workspace the signed-in user belongs to + every open workspace
// they could self-join. Switching writes localStorage and forces all
// org-scoped queries to refetch under the new x-org-id header.

import { useQuery, useMutation } from "@tanstack/react-query";
import { Building2, Check, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useCurrentOrgId } from "@/hooks/use-current-org";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Organization, OrganizationMember } from "@shared/schema";

type MembershipRow = { organization: Organization; role: string; joinedAt: string | null };
type ListResponse = { memberships: MembershipRow[]; joinable: Organization[] };

export function OrgSwitcher({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { orgId, setOrgId } = useCurrentOrgId();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["/api/me/organizations"],
    enabled: isAuthenticated,
  });

  const join = useMutation({
    mutationFn: async (joinOrgId: string) => {
      const res = await apiRequest("POST", `/api/me/organizations/${joinOrgId}/join`);
      return (await res.json()) as { organization: Organization; membership: OrganizationMember };
    },
    onSuccess: (result) => {
      toast({ title: "Joined workspace", description: `You're now collaborating in ${result.organization.name}.` });
      setOrgId(result.organization.id); // switches + clears cache
      queryClient.invalidateQueries({ queryKey: ["/api/me/organizations"] });
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't join workspace", description: err.message, variant: "destructive" });
    },
  });

  if (!isAuthenticated || isLoading || !data) return null;
  const memberships = data.memberships ?? [];
  const joinable = data.joinable ?? [];
  if (memberships.length === 0 && joinable.length === 0) return null;

  const current = memberships.find((m) => m.organization.id === orgId)?.organization
    ?? memberships[0]?.organization;
  const currentName = current?.name ?? "Select workspace";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between mt-2"
          data-testid="button-org-switcher"
          aria-label="Switch workspace"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-xs">{currentName}</span>
          </span>
          <Users className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {memberships.length > 0 && (
          <>
            <DropdownMenuLabel>Your workspaces</DropdownMenuLabel>
            {memberships.map((m) => {
              const isCurrent = m.organization.id === (current?.id);
              return (
                <DropdownMenuItem
                  key={m.organization.id}
                  data-testid={`menuitem-switch-org-${m.organization.id}`}
                  onClick={() => setOrgId(m.organization.id)}
                  className="flex items-start gap-2"
                >
                  <Check className={`h-4 w-4 mt-0.5 ${isCurrent ? "opacity-100" : "opacity-0"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.organization.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.role}{m.organization.isTcafOrg ? " · TCAF" : ""}
                      {m.organization.acceptsCollaborators ? " · open" : ""}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
        {joinable.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Open workspaces you can join</DropdownMenuLabel>
            {joinable.map((o) => (
              <DropdownMenuItem
                key={o.id}
                data-testid={`menuitem-join-org-${o.id}`}
                onSelect={(e) => { e.preventDefault(); join.mutate(o.id); }}
                disabled={join.isPending}
                className="flex items-start gap-2"
              >
                <Plus className="h-4 w-4 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{o.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Self-join as collaborator{o.isTcafOrg ? " · TCAF" : ""}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
