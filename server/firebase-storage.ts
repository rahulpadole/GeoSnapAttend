import { db, COLLECTIONS } from "./firebase.js";
import {
  type User,
  type InsertUser,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type EmployeeInvitation,
  type InsertEmployeeInvitation,
  type WorkLocation,
  type InsertWorkLocation,
  type PasswordResetToken,
  type InsertPasswordResetToken,
} from "@shared/firebase-schema.js";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
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
  
  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(id: string): Promise<void>;
  
  // Admin statistics
  getAttendanceStats(): Promise<{
    totalEmployees: number;
    presentToday: number;
    lateArrivals: number;
    absent: number;
  }>;
}

export class FirebaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const doc = await db.collection(COLLECTIONS.USERS).doc(id).get();
      if (!doc.exists) return undefined;
      
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
        hireDate: data?.hireDate?.toDate(),
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const snapshot = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
        hireDate: data?.hireDate?.toDate(),
      } as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    try {
      const now = new Date();
      const id = nanoid();
      
      const userWithTimestamps = {
        ...userData,
        createdAt: now,
        updatedAt: now,
        hireDate: userData.hireDate || now,
      };

      await db.collection(COLLECTIONS.USERS).doc(id).set(userWithTimestamps);
      
      return {
        id,
        ...userWithTimestamps,
      } as User;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const snapshot = await db.collection(COLLECTIONS.USERS).get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate(),
          updatedAt: data?.updatedAt?.toDate(),
          hireDate: data?.hireDate?.toDate(),
        } as User;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      await db.collection(COLLECTIONS.USERS).doc(id).update(updateData);
      return await this.getUser(id);
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Employee invitation operations
  async createEmployeeInvitation(invitation: InsertEmployeeInvitation): Promise<EmployeeInvitation> {
    try {
      const id = nanoid();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const invitationData = {
        ...invitation,
        createdAt: now,
        expiresAt,
      };

      await db.collection(COLLECTIONS.EMPLOYEE_INVITATIONS).doc(id).set(invitationData);
      
      return {
        id,
        ...invitationData,
      } as EmployeeInvitation;
    } catch (error) {
      console.error('Error creating employee invitation:', error);
      throw error;
    }
  }

  async getEmployeeInvitations(): Promise<EmployeeInvitation[]> {
    try {
      const snapshot = await db.collection(COLLECTIONS.EMPLOYEE_INVITATIONS).get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate(),
          expiresAt: data?.expiresAt?.toDate(),
          hireDate: data?.hireDate?.toDate(),
        } as EmployeeInvitation;
      });
    } catch (error) {
      console.error('Error getting employee invitations:', error);
      return [];
    }
  }

  async getEmployeeInvitationByEmail(email: string): Promise<EmployeeInvitation | undefined> {
    try {
      const snapshot = await db.collection(COLLECTIONS.EMPLOYEE_INVITATIONS)
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        expiresAt: data?.expiresAt?.toDate(),
        hireDate: data?.hireDate?.toDate(),
      } as EmployeeInvitation;
    } catch (error) {
      console.error('Error getting employee invitation by email:', error);
      return undefined;
    }
  }

  async deleteEmployeeInvitation(id: string): Promise<void> {
    try {
      await db.collection(COLLECTIONS.EMPLOYEE_INVITATIONS).doc(id).delete();
    } catch (error) {
      console.error('Error deleting employee invitation:', error);
    }
  }

  // Attendance operations
  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    try {
      const id = nanoid();
      const now = new Date();
      
      const recordData = {
        ...record,
        createdAt: now,
        updatedAt: now,
        date: record.date || now,
      };

      await db.collection(COLLECTIONS.ATTENDANCE_RECORDS).doc(id).set(recordData);
      
      return {
        id,
        ...recordData,
      } as AttendanceRecord;
    } catch (error) {
      console.error('Error creating attendance record:', error);
      throw error;
    }
  }

  async updateAttendanceRecord(id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    try {
      const updateData = {
        ...record,
        updatedAt: new Date(),
      };
      
      await db.collection(COLLECTIONS.ATTENDANCE_RECORDS).doc(id).update(updateData);
      return await this.getAttendanceRecordById(id);
    } catch (error) {
      console.error('Error updating attendance record:', error);
      return undefined;
    }
  }

  async getAttendanceRecordById(id: string): Promise<AttendanceRecord | undefined> {
    try {
      const doc = await db.collection(COLLECTIONS.ATTENDANCE_RECORDS).doc(id).get();
      if (!doc.exists) return undefined;
      
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        checkInTime: data?.checkInTime?.toDate(),
        checkOutTime: data?.checkOutTime?.toDate(),
        date: data?.date?.toDate(),
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
      } as AttendanceRecord;
    } catch (error) {
      console.error('Error getting attendance record:', error);
      return undefined;
    }
  }

  async getUserAttendanceRecords(userId: string, limit?: number): Promise<AttendanceRecord[]> {
    try {
      let query = db.collection(COLLECTIONS.ATTENDANCE_RECORDS)
        .where('userId', '==', userId)
        .orderBy('date', 'desc');
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          checkInTime: data?.checkInTime?.toDate(),
          checkOutTime: data?.checkOutTime?.toDate(),
          date: data?.date?.toDate(),
          createdAt: data?.createdAt?.toDate(),
          updatedAt: data?.updatedAt?.toDate(),
        } as AttendanceRecord;
      });
    } catch (error) {
      console.error('Error getting user attendance records:', error);
      return [];
    }
  }

  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    try {
      const snapshot = await db.collection(COLLECTIONS.ATTENDANCE_RECORDS)
        .orderBy('date', 'desc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          checkInTime: data?.checkInTime?.toDate(),
          checkOutTime: data?.checkOutTime?.toDate(),
          date: data?.date?.toDate(),
          createdAt: data?.createdAt?.toDate(),
          updatedAt: data?.updatedAt?.toDate(),
        } as AttendanceRecord;
      });
    } catch (error) {
      console.error('Error getting all attendance records:', error);
      return [];
    }
  }

  async getTodayAttendanceRecord(userId: string): Promise<AttendanceRecord | undefined> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const snapshot = await db.collection(COLLECTIONS.ATTENDANCE_RECORDS)
        .where('userId', '==', userId)
        .where('date', '>=', today)
        .where('date', '<', tomorrow)
        .limit(1)
        .get();
      
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        checkInTime: data?.checkInTime?.toDate(),
        checkOutTime: data?.checkOutTime?.toDate(),
        date: data?.date?.toDate(),
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
      } as AttendanceRecord;
    } catch (error) {
      console.error('Error getting today attendance record:', error);
      return undefined;
    }
  }

  async getAttendanceByDateRange(startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    try {
      const snapshot = await db.collection(COLLECTIONS.ATTENDANCE_RECORDS)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'desc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          checkInTime: data?.checkInTime?.toDate(),
          checkOutTime: data?.checkOutTime?.toDate(),
          date: data?.date?.toDate(),
          createdAt: data?.createdAt?.toDate(),
          updatedAt: data?.updatedAt?.toDate(),
        } as AttendanceRecord;
      });
    } catch (error) {
      console.error('Error getting attendance by date range:', error);
      return [];
    }
  }

  // Work location operations
  async getWorkLocations(): Promise<WorkLocation[]> {
    try {
      const snapshot = await db.collection(COLLECTIONS.WORK_LOCATIONS)
        .where('isActive', '==', true)
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate(),
        } as WorkLocation;
      });
    } catch (error) {
      console.error('Error getting work locations:', error);
      return [];
    }
  }

  async createWorkLocation(location: InsertWorkLocation): Promise<WorkLocation> {
    try {
      const id = nanoid();
      const now = new Date();
      
      const locationData = {
        ...location,
        createdAt: now,
      };

      await db.collection(COLLECTIONS.WORK_LOCATIONS).doc(id).set(locationData);
      
      return {
        id,
        ...locationData,
      } as WorkLocation;
    } catch (error) {
      console.error('Error creating work location:', error);
      throw error;
    }
  }

  // Password reset operations
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    try {
      const id = nanoid();
      const now = new Date();
      
      const tokenData = {
        ...token,
        createdAt: now,
      };

      await db.collection(COLLECTIONS.PASSWORD_RESET_TOKENS).doc(id).set(tokenData);
      
      return {
        id,
        ...tokenData,
      } as PasswordResetToken;
    } catch (error) {
      console.error('Error creating password reset token:', error);
      throw error;
    }
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    try {
      const snapshot = await db.collection(COLLECTIONS.PASSWORD_RESET_TOKENS)
        .where('token', '==', token)
        .where('used', '==', false)
        .limit(1)
        .get();
      
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        expiresAt: data?.expiresAt?.toDate(),
        createdAt: data?.createdAt?.toDate(),
      } as PasswordResetToken;
    } catch (error) {
      console.error('Error getting password reset token:', error);
      return undefined;
    }
  }

  async markPasswordResetTokenAsUsed(id: string): Promise<void> {
    try {
      await db.collection(COLLECTIONS.PASSWORD_RESET_TOKENS).doc(id).update({
        used: true,
      });
    } catch (error) {
      console.error('Error marking password reset token as used:', error);
    }
  }

  // Admin statistics
  async getAttendanceStats(): Promise<{
    totalEmployees: number;
    presentToday: number;
    lateArrivals: number;
    absent: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get total employees
      const usersSnapshot = await db.collection(COLLECTIONS.USERS)
        .where('role', '==', 'employee')
        .where('isActive', '==', true)
        .get();
      const totalEmployees = usersSnapshot.size;

      // Get today's attendance
      const attendanceSnapshot = await db.collection(COLLECTIONS.ATTENDANCE_RECORDS)
        .where('date', '>=', today)
        .where('date', '<', tomorrow)
        .get();
      
      const presentToday = attendanceSnapshot.size;
      const lateArrivals = attendanceSnapshot.docs.filter(doc => {
        const data = doc.data();
        const checkInTime = data?.checkInTime?.toDate();
        if (!checkInTime) return false;
        
        // Consider late if check-in after 9 AM
        const nineAM = new Date(checkInTime);
        nineAM.setHours(9, 0, 0, 0);
        return checkInTime > nineAM;
      }).length;

      const absent = totalEmployees - presentToday;

      return {
        totalEmployees,
        presentToday,
        lateArrivals,
        absent,
      };
    } catch (error) {
      console.error('Error getting attendance stats:', error);
      return {
        totalEmployees: 0,
        presentToday: 0,
        lateArrivals: 0,
        absent: 0,
      };
    }
  }
}

// Export the storage instance
export const storage = new FirebaseStorage();