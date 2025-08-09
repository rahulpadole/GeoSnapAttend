import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

if (!process.env.REPL_ID) {
  throw new Error("Environment variable REPL_ID not provided");
}

const getOidcConfig = memoize(
  async () => {
    const issuerUrl = process.env.ISSUER_URL || "https://replit.com/oidc";
    console.log("Discovering OIDC config for:", issuerUrl, "with client ID:", process.env.REPL_ID);
    try {
      const config = await client.discovery(
        new URL(issuerUrl),
        process.env.REPL_ID!
      );
      console.log("OIDC config discovered successfully");
      return config;
    } catch (error) {
      console.error("OIDC discovery failed:", error);
      throw error;
    }
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionSecret = process.env.SESSION_SECRET || 'replit-attendance-tracker-default-secret-key-change-in-production';
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const email = claims["email"];
  
  // Check if user already exists
  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    // Update existing user
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
    });
    return;
  }
  
  // Check if user has an invitation
  const invitation = await storage.getEmployeeInvitationByEmail(email);
  if (!invitation) {
    throw new Error("User not authorized. Please contact your administrator.");
  }
  
  // Create user from invitation
  await storage.upsertUser({
    id: claims["sub"],
    email: invitation.email,
    firstName: invitation.firstName,
    lastName: invitation.lastName,
    profileImageUrl: claims["profile_image_url"],
    role: invitation.role,
    department: invitation.department,
    position: invitation.position,
    phone: invitation.phone,
    hireDate: invitation.hireDate,
  });
  
  // Remove the invitation after successful registration
  await storage.deleteEmployeeInvitation(invitation.id);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      console.log("Verifying user tokens...");
      const user = {};
      updateUserSession(user, tokens);
      const claims = tokens.claims();
      if (!claims) {
        throw new Error("No claims found in token");
      }
      console.log("User claims:", { email: claims.email, sub: claims.sub });
      await upsertUser(claims);
      console.log("User verification successful");
      verified(null, user);
    } catch (error) {
      console.error("User verification failed:", error);
      verified(error, null);
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // Development login endpoint for testing
  app.post("/api/dev-login", async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ message: "Not found" });
    }
    
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists or has invitation
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Check if user has invitation
        const invitation = await storage.getEmployeeInvitationByEmail(email);
        if (!invitation) {
          return res.status(401).json({ message: "No invitation found for this email" });
        }
        
        // Create user from invitation
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await storage.upsertUser({
          id: userId,
          email: invitation.email,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          profileImageUrl: null,
          role: invitation.role,
          department: invitation.department,
          position: invitation.position,
          phone: invitation.phone,
          hireDate: invitation.hireDate,
        });
        
        user = await storage.getUserByEmail(email);
        await storage.deleteEmployeeInvitation(invitation.id);
      }

      if (user) {
        // Clear the logged out flag
        delete (req.session as any).loggedOut;
        
        // Create session
        (req as any).user = {
          claims: {
            sub: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
          },
          expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        };
        
        req.login(user, (err) => {
          if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ message: "Login failed" });
          }
          res.json({ message: "Login successful", user });
        });
      } else {
        res.status(401).json({ message: "User not found" });
      }
    } catch (error) {
      console.error('Dev login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
      failureFlash: false,
    }, (err: any, user: any, info: any) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.redirect("/api/login");
      }
      if (!user) {
        console.error("Authentication failed:", info);
        return res.redirect("/api/login");
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect("/api/login");
        }
        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    // Mark as explicitly logged out
    (req.session as any).loggedOut = true;
    
    req.logout(() => {
      // Destroy the session to ensure complete logout
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
        
        if (process.env.NODE_ENV === 'development') {
          // In development, redirect to root to show login page
          res.redirect("/");
        } else {
          res.redirect(
            client.buildEndSessionUrl(config, {
              client_id: process.env.REPL_ID!,
              post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
            }).href
          );
        }
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // For development - only auto-login admin if no session exists and not explicitly logged out
  if (process.env.NODE_ENV === 'development') {
    // Check if user explicitly logged out (stored in session)
    const hasLoggedOut = (req.session as any)?.loggedOut;
    
    if (!hasLoggedOut && !req.isAuthenticated()) {
      try {
        // Auto-login admin user only if no session exists
        const adminUser = await storage.getUserByEmail('parahul270@gmail.com');
        if (adminUser) {
          (req as any).user = {
            claims: {
              sub: adminUser.id,
              email: adminUser.email,
              first_name: adminUser.firstName,
              last_name: adminUser.lastName,
            },
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
          };
          return next();
        }
      } catch (error) {
        console.error('Error in development auth bypass:', error);
      }
    }
  }

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
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
