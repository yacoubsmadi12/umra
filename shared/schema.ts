import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  jobTitle: text("job_title").notNull(),
  department: text("department").notNull(),
  role: text("role").notNull().default("employee"), // 'admin' | 'employee'
  gender: text("gender").notNull().default("male"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const umrahRequests = pgTable("umrah_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  checklistCompleted: boolean("checklist_completed").default(false),
  paymentMethod: text("payment_method"), // salary_deduction, entertainment_allowance, cash, cliQ
  passportUrl: text("passport_url"),
  visaUrl: text("visa_url"),
  ticketUrl: text("ticket_url"),
  adminComments: text("admin_comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trip materials (Booklet pages, instructions)
export const tripMaterials = pgTable("trip_materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'booklet_page', 'instruction', 'announcement'
  url: text("url").notNull(),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUmrahRequestSchema = createInsertSchema(umrahRequests).omit({ 
  id: true, 
  userId: true, 
  createdAt: true, 
  updatedAt: true,
  status: true // Status is managed by admin
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UmrahRequest = typeof umrahRequests.$inferSelect;
export type InsertUmrahRequest = z.infer<typeof insertUmrahRequestSchema>;
export type TripMaterial = typeof tripMaterials.$inferSelect;
