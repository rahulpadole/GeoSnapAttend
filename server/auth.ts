import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./firebase-storage.js";
import { auth } from "./firebase.js";
import { FirebaseSessionStore } from "./firebase-session-store.js";
import { sendPasswordResetEmail, sendEmail, generatePasswordResetEmail } from "./email.js";
import type { SelectUser } from "../shared/schema.js";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function getSession() {
  const sessionSecret = process.env.SESSION_SECRET || 'attendance-tracker-secret-key-change-in-production';
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const sessionStore = new FirebaseSessionStore({
    ttl: sessionTtl,
  });
  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Extend session on each request
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development, true for production
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          console.log('Local strategy - login attempt for:', email);
          const user = await storage.getUserByEmail(email);
          console.log('User found:', user ? 'yes' : 'no');

          if (!user || !user.isActive) {
            console.log('User not found or inactive');
            return done(null, false, { message: "Invalid email or password" });
          }

          if (!user.password) {
            console.log('User has no password set');
            return done(null, false, { message: "Please use Google login or reset your password" });
          }

          console.log('Comparing passwords...');
          const isValid = await comparePasswords(password, user.password);
          console.log('Password valid:', isValid);

          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }

          console.log('Login successful for user:', user.email);
          return done(null, user);
        } catch (error) {
          console.error('Local strategy error:', error);
          return done(error);
        }
      }
    )
  );

  

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error" });
        }
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Register route (for creating new employees from invitations)
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Check if user has an invitation
      const invitation = await storage.getEmployeeInvitationByEmail(email);
      if (!invitation) {
        return res.status(401).json({ message: "No invitation found for this email" });
      }

      // Create user from invitation
      const hashedPassword = await hashPassword(password);
      const user = await storage.upsertUser({
        email: invitation.email,
        password: hashedPassword,
        firstName: firstName || invitation.firstName,
        lastName: lastName || invitation.lastName,
        role: invitation.role,
        department: invitation.department,
        position: invitation.position,
        phone: invitation.phone,
        hireDate: invitation.hireDate,
        isActive: true,
      });

      // Remove the invitation after successful registration
      await storage.deleteEmployeeInvitation(invitation.id);

      // Auto-login the user
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // Firebase Authentication endpoint for Google sign-in
  app.post("/api/auth/firebase-google", async (req, res) => {
    try {
      console.log('Firebase Google auth request received');
      const { idToken } = req.body;

      if (!idToken) {
        console.log('No ID token provided');
        return res.status(400).json({ message: "ID token is required" });
      }

      // Verify the Firebase ID token
      console.log('Verifying Firebase ID token...');
      const decodedToken = await auth.verifyIdToken(idToken);
      const { email, name, picture, uid } = decodedToken;
      console.log('Token verified for email:', email);

      if (!email) {
        console.log('No email in token');
        return res.status(400).json({ message: "No email provided by Google" });
      }

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      console.log('User lookup result:', user ? 'found' : 'not found');

      if (user) {
        // Update Firebase UID if not set
        if (!user.firebaseUid) {
          console.log('Updating user with Firebase UID');
          user = await storage.updateUser(user.id, { firebaseUid: uid }) || user;
        }
        
        if (!user.isActive) {
          console.log('User account is inactive');
          return res.status(401).json({ message: "Account is inactive" });
        }
      } else {
        // Check if there's an employee invitation for this email
        console.log('Checking for employee invitation...');
        const invitation = await storage.getEmployeeInvitationByEmail(email);
        if (!invitation) {
          console.log('No invitation found for email:', email);
          return res.status(401).json({ message: "No invitation found for this email address" });
        }

        // Create new user with Firebase Authentication
        console.log('Creating new user from invitation');
        const nameParts = (name || "").split(" ");
        user = await storage.upsertUser({
          email,
          firebaseUid: uid,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          profileImageUrl: picture,
          role: invitation.role,
          department: invitation.department,
          position: invitation.position,
          phone: invitation.phone,
          hireDate: invitation.hireDate,
          isActive: true,
        });

        // Remove the invitation
        await storage.deleteEmployeeInvitation(invitation.id);
        console.log('User created and invitation removed');
      }

      // Log the user in with Passport
      console.log('Logging in user...');
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: "Login error" });
        }
        console.log('User logged in successfully');
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Firebase Google authentication error:", error);
      res.status(401).json({ message: "Invalid ID token" });
    }
  });

  // Password reset request
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists for security
        return res.json({ message: "If this email exists, you will receive a password reset link." });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false,
      });

      // Send email
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      const emailContent = generatePasswordResetEmail(resetLink, user.firstName || 'User');

      const emailSent = await sendEmail({
        to: email,
        from: process.env.FROM_EMAIL || 'noreply@attendancetracker.com',
        subject: 'Reset Your AttendanceTracker Pro Password',
        ...emailContent,
      });

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send reset email" });
      }

      res.json({ message: "If this email exists, you will receive a password reset link." });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Password reset form
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      // Find and validate token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(resetToken.id);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  

  // Get current user route
  app.get("/api/user", (req, res) => {
    console.log('Session check:', {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      user: req.user ? 'exists' : 'none',
      session: req.session ? 'exists' : 'none'
    });

    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export { hashPassword, comparePasswords };