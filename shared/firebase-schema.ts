import { z } from "zod";

// User schema for Firebase
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().optional(),
  googleId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  role: z.enum(['employee', 'admin']).default('employee'),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  hireDate: z.date().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Employee invitation schema
export const employeeInvitationSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['employee', 'admin']).default('employee'),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  hireDate: z.date().optional(),
  invitedBy: z.string().optional(),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
});

// Attendance record schema
export const attendanceRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  checkInTime: z.date().optional(),
  checkOutTime: z.date().optional(),
  checkInLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).optional(),
  checkOutLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).optional(),
  checkInPhoto: z.string().optional(),
  checkOutPhoto: z.string().optional(),
  status: z.enum(['checked_in', 'checked_out']),
  hoursWorked: z.number().optional(),
  date: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Work location schema
export const workLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().default(100), // radius in meters
  isActive: z.boolean().default(true),
  createdAt: z.date(),
});

// Password reset token schema
export const passwordResetTokenSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.date(),
  used: z.boolean().default(false),
  createdAt: z.date(),
});

// Session schema for Firebase
export const sessionSchema = z.object({
  sid: z.string(),
  sess: z.record(z.any()),
  expire: z.date(),
});

// Export types
export type User = z.infer<typeof userSchema>;
export type EmployeeInvitation = z.infer<typeof employeeInvitationSchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export type WorkLocation = z.infer<typeof workLocationSchema>;
export type PasswordResetToken = z.infer<typeof passwordResetTokenSchema>;
export type Session = z.infer<typeof sessionSchema>;

// Insert schemas (without id and timestamps)
export const insertUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeInvitationSchema = employeeInvitationSchema.omit({
  id: true,
  createdAt: true,
  expiresAt: true,
});

export const insertAttendanceRecordSchema = attendanceRecordSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkLocationSchema = workLocationSchema.omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = passwordResetTokenSchema.omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEmployeeInvitation = z.infer<typeof insertEmployeeInvitationSchema>;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type InsertWorkLocation = z.infer<typeof insertWorkLocationSchema>;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;