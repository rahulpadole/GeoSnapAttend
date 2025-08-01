import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAttendanceRecordSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Attendance routes
  app.post('/api/attendance/checkin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { location, photo } = req.body;

      // Check if user already checked in today
      const existingRecord = await storage.getTodayAttendanceRecord(userId);
      if (existingRecord && existingRecord.status === 'checked_in') {
        return res.status(400).json({ message: "Already checked in today" });
      }

      const attendanceRecord = await storage.createAttendanceRecord({
        userId,
        checkInTime: new Date(),
        checkInLocation: location,
        checkInPhoto: photo,
        status: 'checked_in',
        date: new Date(),
      });

      res.json(attendanceRecord);
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  app.post('/api/attendance/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { location, photo } = req.body;

      // Get today's attendance record
      const todayRecord = await storage.getTodayAttendanceRecord(userId);
      if (!todayRecord || todayRecord.status !== 'checked_in') {
        return res.status(400).json({ message: "Not checked in today" });
      }

      // Calculate hours worked
      const checkOutTime = new Date();
      const checkInTime = new Date(todayRecord.checkInTime!);
      const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      const updatedRecord = await storage.updateAttendanceRecord(todayRecord.id, {
        checkOutTime,
        checkOutLocation: location,
        checkOutPhoto: photo,
        status: 'checked_out',
        hoursWorked: hoursWorked.toFixed(2),
      });

      res.json(updatedRecord);
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(500).json({ message: "Failed to check out" });
    }
  });

  app.get('/api/attendance/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const todayRecord = await storage.getTodayAttendanceRecord(userId);
      res.json(todayRecord);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get('/api/attendance/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const records = await storage.getUserAttendanceRecords(userId, 10);
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // Admin routes
  app.get('/api/admin/attendance/all', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const records = await storage.getAllAttendanceRecords();
      
      // Join with user data
      const recordsWithUsers = await Promise.all(
        records.map(async (record) => {
          const user = await storage.getUser(record.userId);
          return { ...record, user };
        })
      );

      res.json(recordsWithUsers);
    } catch (error) {
      console.error("Error fetching all attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance data" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getAttendanceStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Work locations
  app.get('/api/locations', isAuthenticated, async (req, res) => {
    try {
      const locations = await storage.getWorkLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching work locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
