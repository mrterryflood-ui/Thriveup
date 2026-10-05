/**
 * Routes rendered outside the app shell (decks, embeds, full-screen presentations).
 * They carry no PageFrame and therefore no R8a example panel by design — they are
 * presentation surfaces, not doors. Keep in lockstep with the pre-shell <Route>s in client/src/App.tsx.
 */
export const SHELL_LESS_ROUTES = ["/presentation", "/childinc-deck", "/ecosystem/embed", "/ecosystem/lifebridge"] as const;
export function isShellLessRoute(path: string): boolean {
  return SHELL_LESS_ROUTES.some((p) => path === p || path.startsWith(`${p}/`));
}
