import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { isWorkspaceId, workspaceForPath, type WorkspaceId, type ViewerAccess } from "@shared/workspace-catalog";

const WorkspaceContext = createContext<{
  workspace: WorkspaceId | null;
  setWorkspace: (workspace: WorkspaceId | null) => void;
  storageUnavailable: boolean;
  viewer: ViewerAccess;
}>({ workspace: null, setWorkspace: () => {}, storageUnavailable: false, viewer: { authenticated: false, staff: false, admin: false, loading: true } });

// Tab-local display preference only. No intake, identity, or free text stored.
const KEY = "thriveup.workspace.v1";
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const viewer = useViewerAccess();
  const [location] = useLocation();
  const [saved, setSaved] = useState<WorkspaceId | null>(null);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  useEffect(() => {
    try {
      const value = sessionStorage.getItem(KEY);
      setSaved(isWorkspaceId(value) ? value : null);
    } catch { setStorageUnavailable(true); }
  }, []);
  const setWorkspace = useCallback((value: WorkspaceId | null) => {
    setSaved(value);
    try {
      if (value) sessionStorage.setItem(KEY, value);
      else sessionStorage.removeItem(KEY);
    } catch { setStorageUnavailable(true); }
  }, []);
  const routeWorkspace = workspaceForPath(location);
  return <WorkspaceContext.Provider value={{ workspace: routeWorkspace ?? saved, setWorkspace, storageUnavailable, viewer }}>{children}</WorkspaceContext.Provider>;
}
export const useWorkspace = () => useContext(WorkspaceContext);
export const useWorkspaceAccess = (): ViewerAccess => useContext(WorkspaceContext).viewer;

// Resolve once per shell, rather than mounting useAuth's account effects and
// role queries separately for every task card.
function useViewerAccess(): ViewerAccess {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { data, isLoading: roleLoading } = useQuery<{ role?: string }>({ queryKey: ["/api/academy/avatar"], enabled: isAuthenticated });
  // The current-user endpoint enriches its DB row with the resolved role.
  const role = (user as (typeof user & { role?: string }))?.role ?? data?.role;
  const admin = isAuthenticated && (role === "admin" || user?.isTcafAdmin === true);
  return { authenticated: isAuthenticated, admin, staff: admin || (isAuthenticated && ["teacher", "case_manager", "facilitator", "staff"].includes(role ?? "")), loading: isLoading || (isAuthenticated && !role && roleLoading) };
}