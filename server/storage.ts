import {
  users,
  employeeInvitations,
  attendanceRecords,
  workLocations,
  type User,
  type UpsertUser,
  type EmployeeInvitation,
  type InsertEmployeeInvitation,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type WorkLocation,
  type InsertWorkLocation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Employee invitation operations
  createEmployeeInvitation(invitation: InsertEmployeeInvitation): Promise<EmployeeInvitation>;
  getEmployeeInvitations(): Promise<EmployeeInvitation[]>;
  getEmployeeInvitationByEmail(email: string): Promise<EmployeeInvitation | undefined>;
  deleteEmployeeInvitation(id: string): Promise<void>;
  
  // Attendance operations
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined>;
  getAttendanceRecordById(id: string): Promise<AttendanceRecord | undefined>;
  getUserAttendanceRecords(userId: string, limit?: number): Promise<AttendanceRecord[]>;
  getAllAttendanceRecords(): Promise<AttendanceRecord[]>;
  getTodayAttendanceRecord(userId: string): Promise<AttendanceRecord | undefined>;
  getAttendanceByDateRange(startDate: Date, endDate: Date): Promise<AttendanceRecord[]>;
  
  // Work location operations
  getWorkLocations(): Promise<WorkLocation[]>;
  createWorkLocation(location: InsertWorkLocation): Promise<WorkLocation>;
  
  // Admin statistics
  getAttendanceStats(): Promise<{
    totalEmployees: number;
    presentToday: number;
    lateArrivals: number;
    absent: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Employee invitation operations
  async createEmployeeInvitation(invitation: InsertEmployeeInvitation): Promise<EmployeeInvitation> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
    
    const [created] = await db
      .insert(employeeInvitations)
      .values({ ...invitation, expiresAt })
      .returning();
    return created;
  }

  async getEmployeeInvitations(): Promise<EmployeeInvitation[]> {
    return await db.select().from(employeeInvitations);
  }

  async getEmployeeInvitationByEmail(email: string): Promise<EmployeeInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(employeeInvitations)
      .where(eq(employeeInvitations.email, email));
    return invitation;
  }

  async deleteEmployeeInvitation(id: string): Promise<void> {
    await db.delete(employeeInvitations).where(eq(employeeInvitations.id, id));
  }

  // Attendance operations
  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [attendanceRecord] = await db
      .insert(attendanceRecords)
      .values(record)
      .returning();
    return attendanceRecord;
  }

  async updateAttendanceRecord(id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const [updated] = await db
      .update(attendanceRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(attendanceRecords.id, id))
      .returning();
    return updated;
  }

  async getAttendanceRecordById(id: string): Promise<AttendanceRecord | undefined> {
    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.id, id));
    return record;
  }

  async getUserAttendanceRecords(userId: string, limit = 10): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.userId, userId))
      .orderBy(desc(attendanceRecords.date))
      .limit(limit);
  }

  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .orderBy(desc(attendanceRecords.date));
  }

  async getTodayAttendanceRecord(userId: string): Promise<AttendanceRecord | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, today),
          lte(attendanceRecords.date, tomorrow)
        )
      )
      .orderBy(desc(attendanceRecords.createdAt))
      .limit(1);
    
    return record;
  }

  async getAttendanceByDateRange(startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          gte(attendanceRecords.date, startDate),
          lte(attendanceRecords.date, endDate)
        )
      )
      .orderBy(desc(attendanceRecords.date));
  }

  // Work location operations
  async getWorkLocations(): Promise<WorkLocation[]> {
    return await db
      .select()
      .from(workLocations)
      .where(eq(workLocations.isActive, true));
  }

  async createWorkLocation(location: InsertWorkLocation): Promise<WorkLocation> {
    const [workLocation] = await db
      .insert(workLocations)
      .values(location)
      .returning();
    return workLocation;
  }

  // Admin statistics
  async getAttendanceStats(): Promise<{
    totalEmployees: number;
    presentToday: number;
    lateArrivals: number;
    absent: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total employees
    const [totalEmployeesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'employee'));
    
    const totalEmployees = totalEmployeesResult?.count || 0;

    // Present today (checked in)
    const [presentTodayResult] = await db
      .select({ count: sql<number>`count(distinct ${attendanceRecords.userId})` })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.status, 'checked_in'),
          gte(attendanceRecords.date, today),
          lte(attendanceRecords.date, tomorrow)
        )
      );
    
    const presentToday = presentTodayResult?.count || 0;

    // Late arrivals (checked in after 9:30 AM)
    const lateTime = new Date(today);
    lateTime.setHours(9, 30, 0, 0);
    
    const [lateArrivalsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendanceRecords)
      .where(
        and(
          gte(attendanceRecords.checkInTime, lateTime),
          gte(attendanceRecords.date, today),
          lte(attendanceRecords.date, tomorrow)
        )
      );
    
    const lateArrivals = lateArrivalsResult?.count || 0;

    const absent = totalEmployees - presentToday;

    return {
      totalEmployees,
      presentToday,
      lateArrivals,
      absent,
    };
  }
}

export const storage = new DatabaseStorage();
