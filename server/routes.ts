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
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      // Remove sensitive fields that shouldn't be updated via profile
      delete updates.id;
      delete updates.role;
      delete updates.createdAt;
      delete updates.updatedAt;
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
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

  // Employee management routes (admin only)
  app.get('/api/admin/employees', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const employees = await storage.getAllUsers();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post('/api/admin/employees/invite', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const invitationData = req.body;
      invitationData.invitedBy = user.id;

      const invitation = await storage.createEmployeeInvitation(invitationData);
      res.json(invitation);
    } catch (error) {
      console.error("Error creating employee invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.get('/api/admin/employees/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const invitations = await storage.getEmployeeInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.delete('/api/admin/employees/invitations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteEmployeeInvitation(req.params.id);
      res.json({ message: "Invitation deleted successfully" });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  app.put('/api/admin/employees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = req.body;
      delete updates.id; // Prevent ID modification
      
      const updatedEmployee = await storage.updateUser(req.params.id, updates);
      res.json(updatedEmployee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
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
