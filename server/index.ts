import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic } from "./vite.js";
import session from "express-session";
import passport from "passport";
import { initializeFirestore, createDefaultWorkLocations } from "./initialize-firestore.js";
import { FirebaseSessionStore } from "./firebase-session-store.js";
import { storage } from "./firebase-storage.js";
import { createDefaultAdmin } from "./create-admin.js";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// Trust proxy for secure cookies in production
app.set('trust proxy', 1);

// Session configuration with Firebase store
const sessionStore = new FirebaseSessionStore();
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "geosnapattend-secure-session-key-2025",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  name: 'geosnapattend.sid'
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware for session checking (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.log('Session check:', {
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        user: req.user ? 'exists' : 'none',
        session: req.session ? 'exists' : 'none'
      });
    }
    next();
  });
}

async function startServer() {
  try {
    // Initialize Firebase Firestore
    const firestoreReady = await initializeFirestore();
    if (!firestoreReady) {
      console.error('❌ Failed to initialize Firestore. Exiting...');
      process.exit(1);
    }

    console.log('🔥 Firebase Firestore is ready!');

    // Create default admin user and work locations
    await createDefaultAdmin();
    await createDefaultWorkLocations();

    // Register API routes
    registerRoutes(app);

    // Setup Vite for development
    if (app.get("env") === "development") {
      await setupVite(app);
    } else {
      serveStatic(app);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Application ready at: http://localhost:${PORT}`);
      console.log(`👤 Admin login: parahul270@gmail.com / Rahul@2004`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();