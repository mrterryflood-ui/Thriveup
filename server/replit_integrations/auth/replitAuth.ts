import passport from "passport";
import session from "express-session";
import type { Express, Request, Response, RequestHandler } from "express";
import { randomBytes } from "crypto";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
import { authStorage } from "./storage";

// `openid-client` is ESM-only. Load it only when Replit OIDC is actually
// configured so Vercel can boot public routes during the staged migration.
let oidcClientPromise: Promise<typeof import("openid-client")> | undefined;
async function getOidcClient() {
  oidcClientPromise ??= import("openid-client");
  return oidcClientPromise;
}

const getOidcConfig = memoize(
  async () => {
    const client = await getOidcClient();
    return client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

function positiveTimeout(name: string, fallbackMs: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallbackMs;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const connectionTimeoutMs = positiveTimeout("DB_CONNECTION_TIMEOUT_MS", 5_000);
  const queryTimeoutMs = positiveTimeout("DB_QUERY_TIMEOUT_MS", 20_000);
  const sessionSecret = process.env.SESSION_SECRET?.trim();
  let sessionStore: session.Store;
  if (process.env.DATABASE_URL?.trim()) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        max: 5,
        connectionTimeoutMillis: connectionTimeoutMs,
        query_timeout: queryTimeoutMs,
        statement_timeout: queryTimeoutMs,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10_000,
      },
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  } else {
    // No database configured (e.g. a fresh Vercel deployment before Neon is
    // wired). Sessions fall back to process memory — lost on cold starts —
    // but public pages and partner-key API routes keep working instead of
    // every request failing when the pg store has no connection string.
    console.warn(
      "[Auth] DATABASE_URL not set — sessions use in-memory storage and will " +
        "not survive restarts or cold starts. Set DATABASE_URL to fix.",
    );
    const MemoryStore = memorystore(session);
    sessionStore = new MemoryStore({ checkPeriod: sessionTtl });
  }
  if (!sessionSecret) {
    // No hardcoded default secret, ever. An ephemeral random secret keeps the
    // server bootable off-Replit (public pages, partner-key API routes) while
    // making the degraded state visible: logged-in sessions do not survive a
    // restart until SESSION_SECRET is provisioned for this host.
    console.warn(
      "[Auth] SESSION_SECRET not set — using an ephemeral secret. " +
        "Sessions will not survive restarts. Set SESSION_SECRET to fix.",
    );
  }
  return session({
    secret: sessionSecret || randomBytes(32).toString("hex"),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(user: any, tokens: any) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Replit OIDC sign-in requires REPL_ID, which Replit injects on its own
  // deployments. On any other host (local sandbox, Vercel) the server must not
  // crash at boot: public pages and partner-key API routes stay available, and
  // sign-in endpoints report a visible 503 instead of taking the app down.
  if (!process.env.REPL_ID?.trim()) {
    console.warn(
      "[Auth] REPL_ID not set — Replit OIDC sign-in disabled on this host. " +
        "Sign-in endpoints will return 503; session-authenticated endpoints 401. " +
        "Partner-key API routes (e.g. county-metrics ingest) are unaffected.",
    );
    const signInUnavailable = (_req: Request, res: Response) => {
      res.status(503).json({ message: "Sign-in unavailable on this deployment: REPL_ID not configured" });
    };
    app.get("/api/login", signInUnavailable);
    app.get("/api/callback", signInUnavailable);
    app.get("/api/logout", (_req: Request, res: Response) => {
      res.redirect("/");
    });
    return;
  }

  const config = await getOidcConfig();
  const { Strategy } = await import("openid-client/passport");

  const verify = async (tokens: any, verified: passport.AuthenticateCallback) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Only accept relative same-origin paths. Reject protocol-relative ("//evil"),
  // backslash tricks ("/\\evil"), absolute URLs, and anything that isn't a path.
  // Defense against open-redirect via crafted returnTo on /api/login.
  const safeReturnTo = (raw: unknown): string | null => {
    if (typeof raw !== "string") return null;
    if (raw.length === 0 || raw.length > 512) return null;
    if (!raw.startsWith("/")) return null;
    if (raw.startsWith("//") || raw.startsWith("/\\")) return null;
    return raw;
  };

  app.get("/api/login", (req, res, next) => {
    const rt = safeReturnTo(req.query.returnTo);
    if (rt) {
      (req.session as any).returnTo = rt;
    }
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, (err: any, user: any, info: any) => {
      if (err || !user) {
        console.error("[Auth] Callback error:", err?.message || info?.message || "Unknown auth error");
        return res.redirect("/?auth_error=login_failed");
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("[Auth] Login session error:", loginErr.message);
          return res.redirect("/?auth_error=session_failed");
        }
        const stored = safeReturnTo((req.session as any)?.returnTo);
        if ((req.session as any)?.returnTo) delete (req.session as any).returnTo;
        return res.redirect(stored || "/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      getOidcClient().then((client) => res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      )).catch(() => res.redirect("/"));
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const client = await getOidcClient();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
