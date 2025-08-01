import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default('employee'), // 'employee' or 'admin'
  department: varchar("department"),
  position: varchar("position"),
  phone: varchar("phone"),
  hireDate: timestamp("hire_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee invitations table for pre-registering employees
export const employeeInvitations = pgTable("employee_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  role: varchar("role").notNull().default('employee'),
  department: varchar("department"),
  position: varchar("position"),
  phone: varchar("phone"),
  hireDate: timestamp("hire_date"),
  invitedBy: varchar("invited_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Attendance status enum
export const attendanceStatusEnum = pgEnum('attendance_status', ['checked_in', 'checked_out']);

// Attendance records table
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  checkInLocation: jsonb("check_in_location"), // {lat, lng, address}
  checkOutLocation: jsonb("check_out_location"),
  checkInPhoto: text("check_in_photo"), // base64 encoded image
  checkOutPhoto: text("check_out_photo"),
  status: attendanceStatusEnum("status").notNull(),
  hoursWorked: decimal("hours_worked", { precision: 4, scale: 2 }),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Work locations table (for geofencing)
export const workLocations = pgTable("work_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  radius: decimal("radius").notNull().default('100'), // radius in meters
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertEmployeeInvitation = typeof employeeInvitations.$inferInsert;
export type EmployeeInvitation = typeof employeeInvitations.$inferSelect;

export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

export type InsertWorkLocation = typeof workLocations.$inferInsert;
export type WorkLocation = typeof workLocations.$inferSelect;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeInvitationSchema = createInsertSchema(employeeInvitations).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkLocationSchema = createInsertSchema(workLocations).omit({
  id: true,
  createdAt: true,
});

export type InsertUserType = z.infer<typeof insertUserSchema>;
export type InsertEmployeeInvitationType = z.infer<typeof insertEmployeeInvitationSchema>;
export type InsertAttendanceRecordType = z.infer<typeof insertAttendanceRecordSchema>;
export type InsertWorkLocationType = z.infer<typeof insertWorkLocationSchema>;
