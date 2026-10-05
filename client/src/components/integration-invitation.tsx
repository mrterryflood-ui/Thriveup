// Integration through Invitation (ITI) — dignity primitive component.
// Drop into any surface (Voice project, Foster-Youth intake, LifeBridge, Justice Hub,
// Trade Sims, WPH, public site) by passing surface + surfaceContext.
//
// Contract: anti-extraction by default. All consent toggles start OFF.
// Witness loop is always on. Read/edit access is tab-scoped and time-bounded;
// withdrawal-only access is browser-site storage so revocation survives expiry.

import { useState, useEffect, useCallback, useRef } from "react";
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
import { clearItiSessionValue, readItiSessionEntry, writeItiSessionValue, ITI_TOKEN_MAX_AGE_MS } from "@/lib/iti-session-storage";
import { containsItiWithdrawalCapability, getItiWithdrawalStorageKey, getItiWithdrawalToken, readItiWithdrawalCapabilities, removeItiWithdrawalCapability, saveItiWithdrawalCapability } from "@/lib/iti-withdrawal-storage";

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
  | "shadow-worker-hub"
  | "community-gravity";

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
  onInvitationReady?: (link: { invitationId: string; token: string } | null) => void;
}

const DEFAULT_PROMPT = "Are you doing this work in your community?";
const DEFAULT_DESCRIPTION =
  "If you're already holding people up — caring for kids that aren't yours, walking neighbors through paperwork, picking folks up from a hard place — we want to hear you. No license needed. No proof asked. You decide what we do with what you share.";

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
  const [restoreStatus, setRestoreStatus] = useState<"checking" | "ready" | "loading" | "error">("checking");
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [recognitionLoadFailed, setRecognitionLoadFailed] = useState(false);
  const [recognitionLoading, setRecognitionLoading] = useState(false);
  const [recognitionAttempt, setRecognitionAttempt] = useState(0);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [tokenStored, setTokenStored] = useState<boolean | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [accessExpired, setAccessExpired] = useState(false);
  const [withdrawalIds, setWithdrawalIds] = useState<string[]>([]);
  const [withdrawalStorageAvailable, setWithdrawalStorageAvailable] = useState(true);
  const [withdrawalTokenStored, setWithdrawalTokenStored] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const activeInvitationIdRef = useRef<string | null>(null);
  const withdrawnRef = useRef(false);
  const consentPendingIdRef = useRef<string | null>(null);
  const withdrawalTokensRef = useRef<Record<string, string>>({});
  const withdrawalTokenStoredRef = useRef(false);
  const suppressedWithdrawalPersistenceKeyRef = useRef<string | null>(null);
  const updateWithdrawalTokenStored = useCallback((stored: boolean) => {
    withdrawalTokenStoredRef.current = stored;
    setWithdrawalTokenStored(stored);
  }, []);

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

  useEffect(() => {
    const stored = readItiWithdrawalCapabilities(surface, surfaceContext);
    setWithdrawalIds(stored.entries.map((entry) => entry.invitationId));
    setWithdrawalStorageAvailable(stored.available);
  }, [surface, surfaceContext]);

  // Restore prior session (if invitee saved a token last time)
  useEffect(() => {
    onInvitationReady?.(null);
    const tokenRead = readItiSessionEntry("token", surface, surfaceContext);
    const idRead = readItiSessionEntry("id", surface, surfaceContext);
    const tokenEntry = tokenRead.entry;
    const idEntry = idRead.entry;
    const tk = tokenEntry?.value ?? null;
    const id = idEntry?.value ?? null;
    const restoringSameInvitation = Boolean(tk && id && activeInvitationIdRef.current === id);
    if (!restoringSameInvitation) withdrawnRef.current = false;
    activeInvitationIdRef.current = tk && id ? id : null;
    if (!tk || !id) {
      clearItiSessionValue("token", surface, surfaceContext);
      clearItiSessionValue("id", surface, surfaceContext);
      onInvitationReady?.(null);
    }
    setInvitation(null);
    setConsents(null);
    setEvents([]);
    setRecognitionLoadFailed(false);
    setRestoreError(null);
    setRecognitionLoading(false);
    updateWithdrawalTokenStored(false);
    setAccessExpired(tokenRead.expired || idRead.expired);
    setTokenStored(Boolean(tk && id));
    setTokenExpiresAt(tk && id && tokenEntry && idEntry
      ? Math.min(tokenEntry.storedAt, idEntry.storedAt) + ITI_TOKEN_MAX_AGE_MS
      : null);
    setToken(tk && id ? tk : null);
    setInvitationId(tk && id ? id : null);
    setRestoreStatus(tk && id ? "loading" : "ready");
  }, [surface, surfaceContext, onInvitationReady, updateWithdrawalTokenStored]);

  // Load record + recognition loop if we have a token
  useEffect(() => {
    if (!token || !invitationId) return;
    let cancelled = false;
    const controller = new AbortController();
    setRestoreStatus("loading");
    setRestoreError(null);
    (async () => {
      try {
        const res = await fetch(`/api/iti/invitations/${invitationId}`, { headers: { "x-iti-token": token }, signal: controller.signal, cache: "no-store" });
        if (!res.ok) {
          if (res.status === 404) {
            if (cancelled) return;
            clearItiSessionValue("token", surface, surfaceContext);
            clearItiSessionValue("id", surface, surfaceContext);
            activeInvitationIdRef.current = null;
            withdrawnRef.current = false;
            setToken(null);
            setInvitationId(null);
            setInvitation(null);
            setConsents(null);
            setEvents([]);
            setTokenStored(false);
            setTokenExpiresAt(null);
            setAccessExpired(true);
            onInvitationReady?.(null);
            setRestoreError("Private profile and recognition history are no longer available. If this invitation still exists, the saved withdrawal-only key can still turn all consents off.");
            setRestoreStatus("error");
            return;
          }
          throw new Error(`Saved invitation could not be loaded (HTTP ${res.status}).`);
        }
        const data = await res.json();
        if (!data.invitation || !data.consents) throw new Error("The saved invitation response was incomplete.");
        if (cancelled) return;
        const createdAt = Date.parse(data.invitation.createdAt);
        if (!Number.isFinite(createdAt)) throw new Error("The saved invitation has no valid creation time.");
        if (activeInvitationIdRef.current !== invitationId) return;
        withdrawnRef.current = data.invitation.status === "withdrawn";
        if (data.invitation.status === "withdrawn") {
          removeItiWithdrawalCapability(surface, surfaceContext, invitationId);
          delete withdrawalTokensRef.current[invitationId];
          setWithdrawalIds((ids) => ids.filter((id) => id !== invitationId));
          updateWithdrawalTokenStored(false);
        } else if (typeof data.withdrawalToken === "string") {
          withdrawalTokensRef.current[invitationId] = data.withdrawalToken;
          const recoveryKey = getItiWithdrawalStorageKey(surface, surfaceContext);
          const persistenceSuppressed = suppressedWithdrawalPersistenceKeyRef.current === recoveryKey;
          const saved = !persistenceSuppressed && saveItiWithdrawalCapability(surface, surfaceContext, {
            invitationId,
            token: data.withdrawalToken,
          });
          const stored = readItiWithdrawalCapabilities(surface, surfaceContext);
          setWithdrawalIds([...new Set([
            ...stored.entries.map((entry) => entry.invitationId),
            ...(!persistenceSuppressed ? [invitationId] : []),
          ])]);
          setWithdrawalStorageAvailable(saved && stored.available);
          updateWithdrawalTokenStored(saved);
        } else {
          setWithdrawalStorageAvailable(false);
          updateWithdrawalTokenStored(false);
        }
        const storedToken = readItiSessionEntry("token", surface, surfaceContext).entry;
        const storedId = readItiSessionEntry("id", surface, surfaceContext).entry;
        setInvitation(data.invitation);
        setConsents(data.consents);
        setTokenExpiresAt(createdAt + ITI_TOKEN_MAX_AGE_MS);
        setTokenStored(storedToken?.value === token && storedId?.value === invitationId);
        onInvitationReady?.({ invitationId, token });
        setRestoreStatus("ready");
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        onInvitationReady?.(null);
        const message = err instanceof Error ? err.message : "The saved invitation could not be loaded.";
        setRestoreError(message);
        setRestoreStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, invitationId, onInvitationReady, restoreAttempt, surface, surfaceContext]);

  useEffect(() => {
    if (!token || !invitationId || !invitation) return;
    let cancelled = false;
    const controller = new AbortController();
    setRecognitionLoading(true);
    setRecognitionLoadFailed(false);
    (async () => {
      try {
        const response = await fetch(`/api/iti/invitations/${invitationId}/recognition`, {
          headers: { "x-iti-token": token },
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Recognition history could not be loaded (HTTP ${response.status}).`);
        const result = await response.json();
        if (!cancelled) setEvents(result.events ?? []);
      } catch (error) {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) {
          setRecognitionLoadFailed(true);
        }
      } finally {
        if (!cancelled) setRecognitionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, invitationId, invitation?.id, recognitionAttempt]);

  useEffect(() => {
    if (!token || !invitationId || tokenExpiresAt === null) return;
    const expireAccess = () => {
      clearItiSessionValue("token", surface, surfaceContext);
      clearItiSessionValue("id", surface, surfaceContext);
      activeInvitationIdRef.current = null;
      withdrawnRef.current = false;
      setToken(null);
      setInvitationId(null);
      setInvitation(null);
      setConsents(null);
      setEvents([]);
      setTokenStored(false);
      setTokenExpiresAt(null);
      setAccessExpired(true);
      setRestoreStatus("ready");
      onInvitationReady?.(null);
    };
    const remaining = tokenExpiresAt - Date.now();
    if (remaining <= 0) {
      expireAccess();
      return;
    }
    const timer = window.setTimeout(expireAccess, remaining);
    return () => window.clearTimeout(timer);
  }, [token, invitationId, tokenExpiresAt, surface, surfaceContext, onInvitationReady]);

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
      return res.json() as Promise<{ invitation: InvitationRow; accessToken: string; withdrawalToken: string }>;
    },
    onSuccess: (data) => {
        suppressedWithdrawalPersistenceKeyRef.current = null;
      const tokenSaved = writeItiSessionValue("token", surface, surfaceContext, data.accessToken);
      const idSaved = writeItiSessionValue("id", surface, surfaceContext, data.invitation.id);
      const returnAccessSaved = tokenSaved && idSaved;
      if (!returnAccessSaved) {
        clearItiSessionValue("token", surface, surfaceContext);
        clearItiSessionValue("id", surface, surfaceContext);
      }
      withdrawalTokensRef.current[data.invitation.id] = data.withdrawalToken;
      const withdrawalSaved = saveItiWithdrawalCapability(surface, surfaceContext, {
        invitationId: data.invitation.id,
        token: data.withdrawalToken,
      });
      const storedWithdrawal = readItiWithdrawalCapabilities(surface, surfaceContext);
      setWithdrawalIds([...new Set([...storedWithdrawal.entries.map((entry) => entry.invitationId), data.invitation.id])]);
      setWithdrawalStorageAvailable(withdrawalSaved && storedWithdrawal.available);
        updateWithdrawalTokenStored(withdrawalSaved);
      activeInvitationIdRef.current = data.invitation.id;
      withdrawnRef.current = false;
      setToken(data.accessToken);
      setInvitationId(data.invitation.id);
      setInvitation(data.invitation);
      setConsents({ quoteMe: false, aggregateMyData: false, nameMePublicly: false, routeMyInfoToService: false, shareWithFunder: false, inviteToConvening: false, acceptStipend: false, routeToCredentialing: false });
      setTokenStored(returnAccessSaved);
      const createdAt = Date.parse(data.invitation.createdAt);
      setTokenExpiresAt(Number.isFinite(createdAt) ? createdAt + ITI_TOKEN_MAX_AGE_MS : Date.now());
      setAccessExpired(false);
      setRestoreStatus("ready");
      setShowForm(false);
      toast({
        title: "Thank you for being seen.",
        description: !returnAccessSaved
          ? "The invitation was created, but private return access could not be saved in this tab. Keep it open; refreshing or closing may lose access."
          : !withdrawalSaved
            ? "Private access is saved for 24 hours, but this browser could not save withdrawal-only access. New consents will stay off."
            : "Private return access is saved in this tab for up to 24 hours. Separate withdrawal-only access is saved in this browser.",
        variant: returnAccessSaved && withdrawalSaved ? undefined : "destructive",
      });
    },
    onError: (err) => {
      toast({ title: "Couldn't save right now", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    },
  });

  const consentMutation = useMutation({
    mutationFn: async ({ invitationId, token, patch }: { invitationId: string; token: string; patch: Partial<ConsentsRow> }) => {
      const res = await fetch(`/api/iti/invitations/${invitationId}/consents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-iti-token": token },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        throw Object.assign(new Error(payload.error || "Update failed"), { status: res.status });
      }
      const result = await res.json() as { consents: ConsentsRow };
      return { invitationId, consents: result.consents };
    },
    onSuccess: (data) => {
      if (activeInvitationIdRef.current !== data.invitationId || withdrawnRef.current) return;
      setConsents(data.consents);
      toast({ title: "Saved." });
    },
    onError: (err) => {
      if ((err as { status?: number })?.status === 409) setRestoreAttempt((attempt) => attempt + 1);
      toast({ title: "Couldn't update", description: err instanceof Error ? err.message : "", variant: "destructive" });
    },
    onSettled: (_data, _error, variables) => {
      if (consentPendingIdRef.current === variables.invitationId) consentPendingIdRef.current = null;
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ invitationId, token, invitation, events }: {
      invitationId: string;
      token: string;
      invitation: InvitationRow;
      events: RecognitionEvent[];
    }) => {
      const recoveryToken = getItiWithdrawalToken(surface, surfaceContext, invitationId) ?? withdrawalTokensRef.current[invitationId];
      const headers: Record<string, string> = { "x-iti-token": token };
      if (recoveryToken) headers["x-iti-withdrawal-token"] = recoveryToken;
      const res = await fetch(`/api/iti/invitations/${invitationId}/withdraw`, {
        method: "POST",
        headers,
      });
      if (!res.ok) throw new Error((await res.json()).error || "Withdrawal failed");
      return {
        invitationId,
        invitation: { ...invitation, status: "withdrawn" },
        consents: { quoteMe: false, aggregateMyData: false, nameMePublicly: false, routeMyInfoToService: false, shareWithFunder: false, inviteToConvening: false, acceptStipend: false, routeToCredentialing: false },
        events,
      };
    },
    onSuccess: (data) => {
      if (activeInvitationIdRef.current !== data.invitationId) return;
      const recoveryKeyRemoved = removeItiWithdrawalCapability(surface, surfaceContext, data.invitationId);
      delete withdrawalTokensRef.current[data.invitationId];
      setWithdrawalIds((ids) => ids.filter((id) => id !== data.invitationId));
      updateWithdrawalTokenStored(false);
      setWithdrawalStorageAvailable(recoveryKeyRemoved && readItiWithdrawalCapabilities(surface, surfaceContext).available);
      withdrawnRef.current = true;
      setInvitation(data.invitation);
      setConsents(data.consents);
      setEvents(data.events);
      setRecognitionAttempt(attempt => attempt + 1);
      toast({
        title: "Withdrawn.",
        description: recoveryKeyRemoved
          ? "Your invitation is still visible to you, but all consents are now off."
          : "All consents are off, but this browser could not clear its saved withdrawal-only key.",
      });
    },
    onError: (err, variables) => {
      if (activeInvitationIdRef.current !== variables.invitationId) return;
      toast({ title: "Couldn't withdraw right now", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    },
  });

  const expiredWithdrawalMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const withdrawalToken = getItiWithdrawalToken(surface, surfaceContext, invitationId) ??
        withdrawalTokensRef.current[invitationId];
      if (!withdrawalToken) throw new Error("Withdrawal-only access is not available in this browser.");
      const response = await fetch(`/api/iti/invitations/${encodeURIComponent(invitationId)}/withdraw`, {
        method: "POST",
        headers: { "x-iti-withdrawal-token": withdrawalToken },
      });
      if (!response.ok) throw new Error((await response.json()).error || "Consent could not be withdrawn.");
      return invitationId;
    },
    onSuccess: (invitationId) => {
      const recoveryKeyRemoved = removeItiWithdrawalCapability(surface, surfaceContext, invitationId);
      delete withdrawalTokensRef.current[invitationId];
      setWithdrawalIds((ids) => ids.filter((id) => id !== invitationId));
      const stored = readItiWithdrawalCapabilities(surface, surfaceContext);
      setWithdrawalStorageAvailable(recoveryKeyRemoved && stored.available);
      toast({
        title: "All consents are off.",
        description: recoveryKeyRemoved
          ? "Private access and recognition history remain locked."
          : "Private access and recognition history remain locked, but this browser could not clear its saved withdrawal-only key.",
      });
    },
    onError: (error) => {
      toast({
        title: "Couldn't turn off consent",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const refreshSavedState = () => {
      const stored = readItiWithdrawalCapabilities(surface, surfaceContext);
      setWithdrawalIds(stored.entries.map((entry) => entry.invitationId));
      setWithdrawalStorageAvailable(stored.available);
      updateWithdrawalTokenStored(Boolean(
        invitationId &&
        stored.available &&
        stored.entries.some((entry) => entry.invitationId === invitationId),
      ));
      if (token && invitationId) setRestoreAttempt((attempt) => attempt + 1);
    };
    const onStorage = (event: StorageEvent) => {
      const recoveryKey = getItiWithdrawalStorageKey(surface, surfaceContext);
      if (event.key === null) {
        suppressedWithdrawalPersistenceKeyRef.current = recoveryKey;
        refreshSavedState();
        return;
      }
      if (event.key === recoveryKey) {
        const hadActiveCapability = invitationId && containsItiWithdrawalCapability(event.oldValue, invitationId);
        const hasActiveCapability = invitationId && containsItiWithdrawalCapability(event.newValue, invitationId);
        if (invitationId && hadActiveCapability && !hasActiveCapability) {
          suppressedWithdrawalPersistenceKeyRef.current = recoveryKey;
          updateWithdrawalTokenStored(false);
        } else if (invitationId && hasActiveCapability) {
          suppressedWithdrawalPersistenceKeyRef.current = null;
        }
        refreshSavedState();
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && token && invitationId) {
        setRestoreAttempt((attempt) => attempt + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [surface, surfaceContext, token, invitationId, updateWithdrawalTokenStored]);

  const toggleConsent = useCallback((key: keyof ConsentsRow) => {
    if (!consents || !token || !invitationId || invitation?.status === "withdrawn" || withdrawnRef.current ||
        consentMutation.isPending || withdrawMutation.isPending || consentPendingIdRef.current === invitationId) return;
    if (!consents[key] && !withdrawalTokenStoredRef.current) {
      toast({
        title: "Withdrawal access could not be saved",
        description: "This consent stays off until this browser can save its separate withdrawal-only key.",
        variant: "destructive",
      });
      return;
    }
    consentPendingIdRef.current = invitationId;
    consentMutation.mutate({ invitationId, token, patch: { [key]: !consents[key] } });
  }, [consents, token, invitationId, invitation?.status, consentMutation, withdrawMutation, toast]);

  const toggleTag = (t: string) => setSelectedTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  const recoverableWithdrawalIds = invitation && consents
    ? withdrawalIds.filter((id) => id !== invitationId)
    : withdrawalIds;
  const withdrawalRecoveryPanel = (
    <div className="space-y-2" data-testid="iti-withdrawal-recovery">
      <div className="rounded-md border p-3 text-sm">
        <p className="font-medium">Withdrawal-only access</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This can turn all consents off. It cannot reopen your profile or recognition history. The key is saved in this browser; clearing site data removes it. Invitation endings distinguish saved records.
        </p>
      </div>
      {recoverableWithdrawalIds.map((id) => {
        const shortId = id.slice(-6);
        return (
        <Button
          key={id}
          type="button"
          variant="outline"
          className="min-h-11 w-full max-w-full justify-start whitespace-normal break-words text-left text-destructive"
          disabled={expiredWithdrawalMutation.isPending}
          onClick={() => expiredWithdrawalMutation.mutate(id)}
          aria-label={`Turn off all consents for invitation ending ${shortId}`}
          data-testid={`button-iti-expired-withdraw-${id}`}
        >
          {expiredWithdrawalMutation.isPending
            ? "Turning off consents…"
            : `Turn off all consents · invitation …${shortId}`}
        </Button>
        );
      })}
      {!withdrawalStorageAvailable && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" data-testid="iti-withdrawal-storage-warning">
          This browser could not read its saved withdrawal-only access. No new consents can be enabled until it can be saved.
        </p>
      )}
    </div>
  );

  // === STATE 1: invitee already exists — show witness loop dashboard ===
  if (invitation && consents) {
    const consentControlsDisabled = invitation.status === "withdrawn" || consentMutation.isPending || withdrawMutation.isPending;
    const consentToggleDisabled = (value: boolean) => consentControlsDisabled || (!withdrawalTokenStored && !value);
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
          {restoreStatus === "loading" && <p role="status" className="rounded-md border p-3 text-sm" data-testid="iti-refresh-pending">Checking for invitation updates…</p>}
          {restoreStatus === "error" && <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" data-testid="iti-refresh-error">
            <p>{restoreError ? `${restoreError} The displayed details may be out of date.` : "The latest invitation state could not be checked. The displayed details may be out of date."}</p>
            <Button type="button" variant="outline" className="mt-2 min-h-11" onClick={() => setRestoreAttempt((attempt) => attempt + 1)} data-testid="button-iti-retry-refresh">Retry refresh</Button>
          </div>}
          {tokenStored === false && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" data-testid="iti-storage-warning">The invitation was saved, but this browser could not save private return access. Keep this tab open; refreshing or closing it may lose access.</p>}
          {!withdrawalTokenStored && invitation.status !== "withdrawn" && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" data-testid="iti-withdrawal-storage-warning">
              This browser could not save the separate withdrawal-only key. Any consents already on remain active, but can be turned off now. New consents stay off until the key is saved.
            </p>
          )}
          {recoverableWithdrawalIds.length > 0 && <div>{withdrawalRecoveryPanel}</div>}
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
            <p className="text-xs text-muted-foreground mt-1 mb-3">Each one is your call. All start off. Switch any off at any time. After private access expires, the separate withdrawal-only key can still turn them all off without opening your profile or history.</p>
            <div className="space-y-2.5">
              <ConsentToggle disabled={consentToggleDisabled(consents.quoteMe)} label="Quote my words" hint="Use your exact words anywhere — reports, insights, public site." value={consents.quoteMe} onToggle={() => toggleConsent("quoteMe")} testId="iti-consent-quote" />
              <ConsentToggle disabled={consentToggleDisabled(consents.aggregateMyData)} label="Include me in patterns" hint="Combine your input with others' to find themes. Your identity stays separate." value={consents.aggregateMyData} onToggle={() => toggleConsent("aggregateMyData")} testId="iti-consent-aggregate" />
              <ConsentToggle disabled={consentToggleDisabled(consents.nameMePublicly)} label="Credit me by name" hint="Without this, your contribution shows up as anonymous." value={consents.nameMePublicly} onToggle={() => toggleConsent("nameMePublicly")} testId="iti-consent-name" />
              <ConsentToggle disabled={consentToggleDisabled(consents.shareWithFunder)} label="Cite me in grant proposals" hint="Funders see what you said. Your name only appears if 'credit me by name' is also on." value={consents.shareWithFunder} onToggle={() => toggleConsent("shareWithFunder")} testId="iti-consent-funder" />
              <ConsentToggle disabled={consentToggleDisabled(consents.inviteToConvening)} label="Invite me to the room" hint="When funders or partners meet about this work, you get a seat at the table." value={consents.inviteToConvening} onToggle={() => toggleConsent("inviteToConvening")} testId="iti-consent-convening" />
              <ConsentToggle disabled={consentToggleDisabled(consents.acceptStipend)} label="Pay me for my time" hint="If you say yes, we'll work out a stipend for what you contribute." value={consents.acceptStipend} onToggle={() => toggleConsent("acceptStipend")} testId="iti-consent-stipend" />
              <ConsentToggle disabled={consentToggleDisabled(consents.routeToCredentialing)} label="Route me toward credentialing" hint="If you want it: pathways to CHW, family home daycare license, peer-recovery cert, apprenticeship. Optional — your work counts either way." value={consents.routeToCredentialing} onToggle={() => toggleConsent("routeToCredentialing")} testId="iti-consent-credentialing" />
              <ConsentToggle disabled={consentToggleDisabled(consents.routeMyInfoToService)} label="Connect me to services" hint="Route you to LifeBridge benefits, Whole-Person Health, or another support." value={consents.routeMyInfoToService} onToggle={() => toggleConsent("routeMyInfoToService")} testId="iti-consent-route" />
            </div>
            <div className="border-t pt-3 mt-3">
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                disabled={invitation.status === "withdrawn" || withdrawMutation.isPending || consentMutation.isPending}
                onClick={() => {
                  if (token && invitationId && window.confirm("Withdraw your invitation? Your record will remain visible to you, and every consent will be turned off.")) {
                    withdrawMutation.mutate({ invitationId, token, invitation, events });
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
            {recognitionLoadFailed && <p role="alert" className="mt-2 text-sm text-destructive">Recognition history could not be loaded. The empty state may not reflect your latest activity. <Button type="button" variant="outline" className="ml-2 min-h-11" disabled={recognitionLoading} onClick={() => setRecognitionAttempt(attempt => attempt + 1)} data-testid="button-iti-retry-recognition">Try again</Button></p>}
            {recognitionLoading && events.length === 0 && <p role="status" className="mt-2 text-xs text-muted-foreground">Loading recognition history…</p>}
            {!recognitionLoading && !recognitionLoadFailed && events.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-2">No recognition events yet. As soon as your input shapes anything — an insight, a proposal, a meeting — you'll see it here.</p>
            ) : events.length > 0 ? (
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
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (restoreStatus === "checking" || restoreStatus === "loading") {
    return <Card className={className} role="status" data-testid="card-iti-restoring">
      <CardContent className="flex items-center gap-2 p-5"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Checking for your saved invitation…</CardContent>
    </Card>;
  }

  if (restoreStatus === "error") {
    return <Card className={className} data-testid="card-iti-restore-error">
      <CardHeader>
        <CardTitle className="text-base">Your saved invitation was not replaced</CardTitle>
        <CardDescription role="alert">{accessExpired ? restoreError ?? "Private profile and history are no longer available. A separate withdrawal-only key can still turn all consents off without reopening that record." : restoreError ?? "We could not load the saved record."} {accessExpired ? "Choose explicitly to start a separate invitation." : "Retry, or choose explicitly to start a separate invitation."}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {(recoverableWithdrawalIds.length > 0 || !withdrawalStorageAvailable) && <div className="w-full">{withdrawalRecoveryPanel}</div>}
        {!accessExpired && token && invitationId && <Button type="button" variant="outline" className="min-h-11" onClick={() => setRestoreAttempt(attempt => attempt + 1)} data-testid="button-iti-retry-restore">Try again</Button>}
        <Button type="button" className="min-h-11" onClick={() => {
          clearItiSessionValue("token", surface, surfaceContext);
          clearItiSessionValue("id", surface, surfaceContext);
          setToken(null);
          setInvitationId(null);
          setInvitation(null);
          setConsents(null);
          setEvents([]);
          onInvitationReady?.(null);
          setTokenStored(null);
          setTokenExpiresAt(null);
          setAccessExpired(false);
          setRestoreError(null);
          suppressedWithdrawalPersistenceKeyRef.current = null;
          setRestoreStatus("ready");
        }} data-testid="button-iti-new-after-restore">Start a new invitation</Button>
      </CardContent>
    </Card>;
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
        {accessExpired && <p role="alert" className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" data-testid="iti-return-access-expired">Private profile and recognition-history access expired after 24 hours. The separate withdrawal-only key can still turn all consents off, but cannot reopen the previous record. Starting another invitation creates a separate record.</p>}
        {(recoverableWithdrawalIds.length > 0 || !withdrawalStorageAvailable) && <div className="mb-4">{withdrawalRecoveryPanel}</div>}
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
                <li>Private profile and history access stays in this tab's session storage for at most 24 hours. A separate key that can only turn consents off is saved in this browser's site storage; it cannot reopen your record. Clearing site data removes that key, and we'll keep consents off if it cannot be saved. We do not email or text either key.</li>
                <li>We do nothing with your information until you switch on what we're allowed to do. Everything starts off.</li>
                <li>You can turn off all consents at any time. After 24 hours, the separate key still works for withdrawal only.</li>
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
