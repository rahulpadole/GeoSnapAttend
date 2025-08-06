import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAttendanceRecordSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;

      delete updates.id;
      delete updates.role;
      delete updates.createdAt;
      delete updates.updatedAt;

      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser)
        return res.status(404).json({ message: "User not found" });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Attendance routes
  app.post(
    "/api/attendance/checkin",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { location, photo } = req.body;

        const existing = await storage.getTodayAttendanceRecord(userId);
        if (existing && existing.status === "checked_in")
          return res.status(400).json({ message: "Already checked in today" });

        const attendance = await storage.createAttendanceRecord({
          userId,
          checkInTime: new Date(),
          checkInLocation: location,
          checkInPhoto: photo,
          status: "checked_in",
          date: new Date(),
        });

        res.json(attendance);
      } catch (error) {
        console.error("Error checking in:", error);
        res.status(500).json({ message: "Failed to check in" });
      }
    },
  );

  app.post(
    "/api/attendance/checkout",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { location, photo } = req.body;

        const today = await storage.getTodayAttendanceRecord(userId);
        if (!today || today.status !== "checked_in")
          return res.status(400).json({ message: "Not checked in today" });

        const checkOutTime = new Date();
        const checkInTime = new Date(today.checkInTime!);
        const hoursWorked = (
          (checkOutTime.getTime() - checkInTime.getTime()) /
          (1000 * 60 * 60)
        ).toFixed(2);

        const updated = await storage.updateAttendanceRecord(today.id, {
          checkOutTime,
          checkOutLocation: location,
          checkOutPhoto: photo,
          status: "checked_out",
          hoursWorked,
        });

        res.json(updated);
      } catch (error) {
        console.error("Error checking out:", error);
        res.status(500).json({ message: "Failed to check out" });
      }
    },
  );

  app.get("/api/attendance/today", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = await storage.getTodayAttendanceRecord(userId);
      res.json(today);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getUserAttendanceRecords(userId, 10);
      res.json(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // Admin routes
  app.get(
    "/api/admin/attendance/all",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const user = await storage.getUser(req.user.claims.sub);
        if (user?.role !== "admin")
          return res.status(403).json({ message: "Access denied" });

        const records = await storage.getAllAttendanceRecords();
        const result = await Promise.all(
          records.map(async (rec) => {
            const u = await storage.getUser(rec.userId);
            return { ...rec, user: u };
          }),
        );

        res.json(result);
      } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ message: "Failed to fetch attendance data" });
      }
    },
  );

  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin")
        return res.status(403).json({ message: "Access denied" });

      const stats = await storage.getAttendanceStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get("/api/admin/employees", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin")
        return res.status(403).json({ message: "Access denied" });

      const employees = await storage.getAllUsers();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post(
    "/api/admin/employees/invite",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const user = await storage.getUser(req.user.claims.sub);
        if (user?.role !== "admin")
          return res.status(403).json({ message: "Access denied" });

        const invitationData = req.body;
        invitationData.invitedBy = user.id;

        console.log("Invitation data:", invitationData);

        const invitation =
          await storage.createEmployeeInvitation(invitationData);
        res.json(invitation);
      } catch (error) {
        console.error("Error creating employee invitation:", error);
        res.status(500).json({ message: "Failed to create invitation" });
      }
    },
  );

  app.get(
    "/api/admin/employees/invitations",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const user = await storage.getUser(req.user.claims.sub);
        if (user?.role !== "admin")
          return res.status(403).json({ message: "Access denied" });

        const invites = await storage.getEmployeeInvitations();
        res.json(invites);
      } catch (error) {
        console.error("Error fetching invitations:", error);
        res.status(500).json({ message: "Failed to fetch invitations" });
      }
    },
  );

  app.delete(
    "/api/admin/employees/invitations/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const user = await storage.getUser(req.user.claims.sub);
        if (user?.role !== "admin")
          return res.status(403).json({ message: "Access denied" });

        await storage.deleteEmployeeInvitation(req.params.id);
        res.json({ message: "Invitation deleted" });
      } catch (error) {
        console.error("Error deleting invitation:", error);
        res.status(500).json({ message: "Failed to delete invitation" });
      }
    },
  );

  app.put(
    "/api/admin/employees/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const user = await storage.getUser(req.user.claims.sub);
        if (user?.role !== "admin")
          return res.status(403).json({ message: "Access denied" });

        const updates = req.body;
        delete updates.id;

        const updated = await storage.updateUser(req.params.id, updates);
        res.json(updated);
      } catch (error) {
        console.error("Error updating employee:", error);
        res.status(500).json({ message: "Failed to update employee" });
      }
    },
  );



  app.get("/api/locations", isAuthenticated, async (req: any, res) => {
    try {
      const locations = await storage.getWorkLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
