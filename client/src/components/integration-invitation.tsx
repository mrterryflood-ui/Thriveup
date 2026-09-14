// Integration through Invitation (ITI) — dignity primitive component.
// Drop into any surface (Voice project, Foster-Youth intake, LifeBridge, Justice Hub,
// Trade Sims, WPH, public site) by passing surface + surfaceContext.
//
// Contract: anti-extraction by default. All consent toggles start OFF.
// Witness loop is always on. Capability-token persisted to localStorage so the
// invitee can come back and update without creating an account.

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HandHeart, Eye, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import type { CommunityContext } from "@shared/community-context";

export type ItiSurface =
  | "voice-project"
  | "foster-intake"
  | "lifebridge"
  | "justice-hub"
  | "trade-sims"
  | "wph"
  | "workforce-readiness"
  | "public-site"
  | "direct"
  | "shadow-worker-hub";

interface InvitationRow {
  id: string;
  displayName: string | null;
  workDescription: string;
  workRolesSelfIdentified: string[] | null;
  region: string | null;
  preferredLanguage: string;
  communityContext: CommunityContext | null;
  yearsDoingWork: string | null;
  surface: string;
  surfaceContext: string | null;
  status: string;
  createdAt: string;
}

interface ConsentsRow {
  quoteMe: boolean; aggregateMyData: boolean; nameMePublicly: boolean;
  routeMyInfoToService: boolean; shareWithFunder: boolean; inviteToConvening: boolean;
  acceptStipend: boolean; routeToCredentialing: boolean;
}

interface RecognitionEvent {
  id: string; eventType: string; description: string;
  actorRole: string | null; createdAt: string;
}

interface Props {
  surface: ItiSurface;
  surfaceContext?: string;
  /** Heading shown above the invitation form. Use the surface's language. */
  prompt?: string;
  /** Sub-text below the heading. Honor the community; don't credential-check. */
  description?: string;
  /** Optional default placeholder list of role tags the person can opt into (they can also write their own). */
  suggestedRoleTags?: string[];
  className?: string;
  /** Broad, non-address place context supplied by the hosting surface. */
  communityContext?: CommunityContext;
  /** Lets a host link later contributions to this invitee's consent record. */
  onInvitationReady?: (link: { invitationId: string; token: string }) => void;
}

const DEFAULT_PROMPT = "Are you doing this work in your community?";
const DEFAULT_DESCRIPTION =
  "If you're already holding people up — caring for kids that aren't yours, walking neighbors through paperwork, picking folks up from a hard place — we want to hear you. No license needed. No proof asked. You decide what we do with what you share.";

function tokenStorageKey(surface: string, ctx: string | undefined) {
  return `iti-token:${surface}:${ctx ?? "default"}`;
}
function idStorageKey(surface: string, ctx: string | undefined) {
  return `iti-id:${surface}:${ctx ?? "default"}`;
}

function formatCommunityContext(context?: CommunityContext | null) {
  if (!context) return null;
  return [
    context.localLabel,
    context.district,
    context.region,
    context.serviceArea,
    context.countryCode,
  ].filter(Boolean).join(", ");
}

export function IntegrationInvitation({ surface, surfaceContext, prompt, description, suggestedRoleTags, className, communityContext: defaultCommunityContext, onInvitationReady }: Props) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [token, setToken] = useState<string | null>(null);
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationRow | null>(null);
  const [consents, setConsents] = useState<ConsentsRow | null>(null);
  const [events, setEvents] = useState<RecognitionEvent[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [region, setRegion] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [administrativeLevel, setAdministrativeLevel] = useState<CommunityContext["administrativeLevel"]>("community");
  const [locality, setLocality] = useState("");
  const [yearsDoingWork, setYearsDoingWork] = useState("");
  const [preferredContact, setPreferredContact] = useState("");

  // Restore prior session (if invitee saved a token last time)
  useEffect(() => {
    const tk = localStorage.getItem(tokenStorageKey(surface, surfaceContext));
    const id = localStorage.getItem(idStorageKey(surface, surfaceContext));
    if (tk && id) { setToken(tk); setInvitationId(id); }
  }, [surface, surfaceContext]);

  // Load record + recognition loop if we have a token
  useEffect(() => {
    if (!token || !invitationId) return;
    onInvitationReady?.({ invitationId, token });
    (async () => {
      try {
        const res = await fetch(`/api/iti/invitations/${invitationId}`, { headers: { "x-iti-token": token } });
        if (!res.ok) return;
        const data = await res.json();
        setInvitation(data.invitation);
        setConsents(data.consents);
        const recRes = await fetch(`/api/iti/invitations/${invitationId}/recognition`, { headers: { "x-iti-token": token } });
        if (recRes.ok) { const r = await recRes.json(); setEvents(r.events ?? []); }
      } catch (err) {
        console.error("[ITI] load failed", err);
      }
    })();
  }, [token, invitationId, onInvitationReady]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const submittedCommunityContext: CommunityContext = {
        countryCode: countryCode.trim().toUpperCase() || undefined,
        administrativeLevel,
        region: region.trim() || undefined,
        localLabel: locality.trim() || undefined,
        locale: language,
        source: "self_reported",
        confidence: "reported",
      };
      const hasBroadPlace = Boolean(
        submittedCommunityContext.countryCode ||
        submittedCommunityContext.region ||
        submittedCommunityContext.district ||
        submittedCommunityContext.localLabel ||
        submittedCommunityContext.serviceArea ||
        submittedCommunityContext.usFips,
      );
      const res = await apiRequest("POST", "/api/iti/invitations", {
        surface,
        surfaceContext,
        displayName: displayName || undefined,
        workDescription,
        workRolesSelfIdentified: [...selectedTags, ...(customTag.trim() ? [customTag.trim()] : [])],
        region: region || undefined,
        preferredLanguage: language,
        communityContext: hasBroadPlace ? submittedCommunityContext : undefined,
        yearsDoingWork: yearsDoingWork || undefined,
        preferredContact: preferredContact || undefined,
      });
      return res.json() as Promise<{ invitation: InvitationRow; accessToken: string }>;
    },
    onSuccess: (data) => {
      localStorage.setItem(tokenStorageKey(surface, surfaceContext), data.accessToken);
      localStorage.setItem(idStorageKey(surface, surfaceContext), data.invitation.id);
      setToken(data.accessToken);
      setInvitationId(data.invitation.id);
      setInvitation(data.invitation);
      setConsents({ quoteMe: false, aggregateMyData: false, nameMePublicly: false, routeMyInfoToService: false, shareWithFunder: false, inviteToConvening: false, acceptStipend: false, routeToCredentialing: false });
      setShowForm(false);
      toast({ title: "Thank you for being seen.", description: "You're in the fold. We'll show you everything we do with what you shared." });
    },
    onError: (err) => {
      toast({ title: "Couldn't save right now", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    },
  });

  const consentMutation = useMutation({
    mutationFn: async (patch: Partial<ConsentsRow>) => {
      if (!token || !invitationId) throw new Error("Not invited yet");
      const res = await fetch(`/api/iti/invitations/${invitationId}/consents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-iti-token": token },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      return res.json() as Promise<{ consents: ConsentsRow }>;
    },
    onSuccess: (data) => { setConsents(data.consents); toast({ title: "Saved." }); },
    onError: (err) => { toast({ title: "Couldn't update", description: err instanceof Error ? err.message : "", variant: "destructive" }); },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!token || !invitationId) throw new Error("Not invited yet");
      const res = await fetch(`/api/iti/invitations/${invitationId}/withdraw`, {
        method: "POST",
        headers: { "x-iti-token": token },
      });
      if (!res.ok) throw new Error((await res.json()).error || "Withdrawal failed");
      const recordRes = await fetch(`/api/iti/invitations/${invitationId}`, { headers: { "x-iti-token": token } });
      const record = await recordRes.json();
      const recognitionRes = await fetch(`/api/iti/invitations/${invitationId}/recognition`, { headers: { "x-iti-token": token } });
      const recognition = recognitionRes.ok ? await recognitionRes.json() : { events: [] };
      return { invitation: record.invitation as InvitationRow, consents: record.consents as ConsentsRow, events: recognition.events as RecognitionEvent[] };
    },
    onSuccess: (data) => {
      setInvitation(data.invitation);
      setConsents(data.consents);
      setEvents(data.events);
      toast({ title: "Withdrawn.", description: "Your invitation is still visible to you, but all consents are now off." });
    },
    onError: (err) => {
      toast({ title: "Couldn't withdraw right now", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    },
  });

  const toggleConsent = useCallback((key: keyof ConsentsRow) => {
    if (!consents) return;
    consentMutation.mutate({ [key]: !consents[key] });
  }, [consents, consentMutation]);

  const toggleTag = (t: string) => setSelectedTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  // === STATE 1: invitee already exists — show witness loop dashboard ===
  if (invitation && consents) {
    return (
      <Card className={className} data-testid="card-iti-witness-loop">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                You're in the fold
              </CardTitle>
              <CardDescription className="mt-1">
                {invitation.displayName ? `Welcome back, ${invitation.displayName}.` : "Welcome back."} Here's everything that's happened with what you shared. You can change what we're allowed to do — anytime, any toggle, no questions asked.
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1"><ShieldCheck className="h-3 w-3" /> Witness loop</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-sm font-semibold">Your work, in your words</Label>
            <p className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground" data-testid="text-iti-work-description">{invitation.workDescription}</p>
            {invitation.workRolesSelfIdentified && invitation.workRolesSelfIdentified.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {invitation.workRolesSelfIdentified.map((r) => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
              </div>
            )}
            {formatCommunityContext(invitation.communityContext) && (
              <p className="text-xs text-muted-foreground mt-2">Your reported place context: {formatCommunityContext(invitation.communityContext)}</p>
            )}
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold">What we can do with what you shared</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Each one is your call. All start off. Switch any of them off at any time and we stop.</p>
            <div className="space-y-2.5">
              <ConsentToggle disabled={invitation.status === "withdrawn"} label="Quote my words" hint="Use your exact words anywhere — reports, insights, public site." value={consents.quoteMe} onToggle={() => toggleConsent("quoteMe")} testId="iti-consent-quote" />
              <ConsentToggle disabled={invitation.status === "withdrawn"} label="Include me in patterns" hint="Combine your input with others' to find themes. Your identity stays separate." value={consents.aggregateMyData} onToggle={() => toggleConsent("aggregateMyData")} testId="iti-consent-aggregate" />
              <ConsentToggle disabled={invitation.status === "withdrawn"} label="Credit me by name" hint="Without this, your contribution shows up as anonymous." value={consents.nameMePublicly} onToggle={() => toggleConsent("nameMePublicly")} testId="iti-consent-name" />
              <ConsentToggle disabled={invitation.status === "withdrawn"} label="Cite me in grant proposals" hint="Funders see what you said. Your name only appears if 'credit me by name' is also on." value={consents.shareWithFunder} onToggle={() => toggleConsent("shareWithFunder")} testId="iti-consent-funder" />
              <ConsentToggle disabled={invitation.status === "withdrawn"} label="Invite me to the room" hint="When funders or partners meet about this work, you get a seat at the table." value={consents.inviteToConvening} onToggle={() => toggleConsent("inviteToConvening")} testId="iti-consent-convening" />
              <ConsentToggle disabled={invitation.status === "withdrawn"} label="Pay me for my time" hint="If you say yes, we'll work out a stipend for what you contribute." value={consents.acceptStipend} onToggle={() => toggleConsent("acceptStipend")} testId="iti-consent-stipend" />
              <ConsentToggle disabled={invitation.status === "withdrawn"} label="Route me toward credentialing" hint="If you want it: pathways to CHW, family home daycare license, peer-recovery cert, apprenticeship. Optional — your work counts either way." value={consents.routeToCredentialing} onToggle={() => toggleConsent("routeToCredentialing")} testId="iti-consent-credentialing" />
              <ConsentToggle disabled={invitation.status === "withdrawn"} label="Connect me to services" hint="Route you to LifeBridge benefits, Whole-Person Health, or another support." value={consents.routeMyInfoToService} onToggle={() => toggleConsent("routeMyInfoToService")} testId="iti-consent-route" />
            </div>
            <div className="border-t pt-3 mt-3">
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                disabled={invitation.status === "withdrawn" || withdrawMutation.isPending}
                onClick={() => {
                  if (window.confirm("Withdraw your invitation? Your record will remain visible to you, and every consent will be turned off.")) {
                    withdrawMutation.mutate();
                  }
                }}
                data-testid="button-iti-withdraw"
              >
                {invitation.status === "withdrawn" ? "Invitation withdrawn" : withdrawMutation.isPending ? "Withdrawing…" : "Withdraw my invitation"}
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold flex items-center gap-2"><Eye className="h-4 w-4" /> Who has heard you, and what was done</Label>
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-2">No recognition events yet. As soon as your input shapes anything — an insight, a proposal, a meeting — you'll see it here.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {events.map((e) => (
                  <li key={e.id} className="text-sm border-l-2 border-emerald-300 pl-3" data-testid={`iti-event-${e.id}`}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">{e.eventType}</Badge>
                       <span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(e.createdAt))}</span>
                    </div>
                    <p className="mt-0.5">{e.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // === STATE 2: not invited yet — show invitation prompt + form ===
  return (
    <Card className={className} data-testid="card-iti-invitation">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HandHeart className="h-5 w-5 text-amber-600" />
          {prompt || DEFAULT_PROMPT}
        </CardTitle>
        <CardDescription>{description || DEFAULT_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent>
        {!showForm ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowForm(true)} data-testid="button-iti-open-form" className="gap-2">
              <HandHeart className="h-4 w-4" /> Yes, I do this work
            </Button>
            <p className="text-xs text-muted-foreground self-center">No account. No license. Your call what we do with what you share.</p>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); if (!workDescription.trim()) { toast({ title: "Please describe your work", variant: "destructive" }); return; } createMutation.mutate(); }}
          >
            <div>
              <Label htmlFor="iti-work">What work are you doing? In your own words.</Label>
              <Textarea id="iti-work" required value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} rows={4}
                placeholder="e.g. I watch my daughter's two kids and my neighbor's baby while they work the night shift at the warehouse. Been doing it for three years."
                data-testid="textarea-iti-work" />
            </div>

            {suggestedRoleTags && suggestedRoleTags.length > 0 && (
              <div>
                <Label className="text-sm">Does any of this fit? (Optional — pick none, some, or write your own below.)</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {suggestedRoleTags.map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={selectedTags.includes(t) ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => toggleTag(t)}
                      data-testid={`tag-iti-${t}`}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
                <Input className="mt-2" placeholder="Or describe your role in your own words…" value={customTag} onChange={(e) => setCustomTag(e.target.value)} data-testid="input-iti-custom-tag" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="iti-name">Your name (or what to call you) — optional</Label>
                <Input id="iti-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="First name, nickname, or leave blank" data-testid="input-iti-name" />
              </div>
              <div>
                <Label htmlFor="iti-region">Broad area (not an address) — optional</Label>
                <Input id="iti-region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. district, town, neighborhood, or service area" data-testid="input-iti-region" />
                {formatCommunityContext(defaultCommunityContext ?? null) && (
                  <p className="text-xs text-muted-foreground mt-1">Project context: {formatCommunityContext(defaultCommunityContext ?? null)}. This is not added to your record unless you enter a place below.</p>
                )}
              </div>
              <div>
                <Label htmlFor="iti-country">Country or territory code — optional</Label>
                <Input id="iti-country" value={countryCode} onChange={(e) => setCountryCode(e.target.value.slice(0, 2).toUpperCase())} placeholder="e.g. US, MX, GH" maxLength={2} data-testid="input-iti-country" />
              </div>
              <div>
                <Label htmlFor="iti-locality">Locality or community — optional</Label>
                <Input id="iti-locality" value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="Use the broadest safe name" data-testid="input-iti-locality" />
              </div>
              <div>
                <Label htmlFor="iti-place-level">Place type</Label>
                <select
                  id="iti-place-level"
                  value={administrativeLevel}
                  onChange={(e) => setAdministrativeLevel(e.target.value as CommunityContext["administrativeLevel"])}
                  className="mt-1 flex min-h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  data-testid="select-iti-place-level"
                >
                  <option value="community">Community</option>
                  <option value="locality">Locality or town</option>
                  <option value="district">District</option>
                  <option value="region">Region or province</option>
                  <option value="service_area">Service area</option>
                  <option value="country">Country</option>
                </select>
              </div>
              <div>
                <Label htmlFor="iti-years">How long? — optional</Label>
                <Input id="iti-years" value={yearsDoingWork} onChange={(e) => setYearsDoingWork(e.target.value)} placeholder="e.g. since 2019, or 'since my grandbaby was born'" data-testid="input-iti-years" />
              </div>
              <div>
                <Label htmlFor="iti-contact">Best way to reach you (if you want) — optional</Label>
                <Input id="iti-contact" value={preferredContact} onChange={(e) => setPreferredContact(e.target.value)} placeholder="Phone, email, WhatsApp — or leave blank" data-testid="input-iti-contact" />
              </div>
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
              <p className="font-semibold">What happens next:</p>
              <ul className="list-disc ml-4 space-y-0.5">
                <li>You'll get a private link to come back and see who heard you, what was done with it, and to change your mind anytime.</li>
                <li>We do nothing with your information until you switch on what we're allowed to do. Everything starts off.</li>
                <li>You can withdraw at any moment. All consents go back to off, immediately.</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-iti-submit">
                {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</> : "I'm in"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} data-testid="button-iti-cancel">Cancel</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function ConsentToggle({ label, hint, value, onToggle, testId, disabled = false }: { label: string; hint: string; value: boolean; onToggle: () => void; testId: string; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="flex-1 min-w-0">
        <Label htmlFor={`switch-${testId}`} className="text-sm font-medium cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      </div>
      <Switch id={`switch-${testId}`} checked={value} onCheckedChange={onToggle} disabled={disabled} data-testid={`switch-${testId}`} />
    </div>
  );
}
