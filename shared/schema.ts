import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Past Umrah participants for validation
export const pastUmrahParticipants = pgTable("past_umrah_participants", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  yearsOfExperience: integer("years_of_experience").notNull(),
  contractType: text("contract_type").notNull(), // 'full_time' | 'part_time' etc
  lastUmrahDate: text("last_umrah_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPastParticipantSchema = createInsertSchema(pastUmrahParticipants).omit({ id: true, createdAt: true });
export type PastParticipant = typeof pastUmrahParticipants.$inferSelect;
export type InsertPastParticipant = z.infer<typeof insertPastParticipantSchema>;

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
  militaryServiceUrl: text("military_service_url"),
  visaUrl: text("visa_url"),
  ticketUrl: text("ticket_url"),
  adminComments: text("admin_comments"),
  needsCompanion: boolean("needs_companion").default(false),
  companion1Name: text("companion1_name"),
  companion1PassportUrl: text("companion1_passport_url"),
  companion2Name: text("companion2_name"),
  companion2PassportUrl: text("companion2_passport_url"),
  passportData: text("passport_data"),
  companion1PassportData: text("companion1_passport_data"),
  companion2PassportData: text("companion2_passport_data"),
  assignedColleagueIds: integer("assigned_colleague_ids").array(),
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

// Email settings table for GUI configuration
export const emailSettings = pgTable("email_settings", {
  id: serial("id").primaryKey(),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  user: text("user").notNull(),
  password: text("password").notNull(),
  fromEmail: text("from_email").notNull(),
  competitionLink: text("competition_link"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prayers and Duas
export const prayers = pgTable("prayers", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  icon: text("icon"),
  order: integer("order").default(0),
});

// Contact info for Zain team
export const contactInfo = pgTable("contact_info", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'leader', 'admin', 'doctor'
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactInfoSchema = createInsertSchema(contactInfo).omit({ id: true, updatedAt: true });
export type ContactInfo = typeof contactInfo.$inferSelect;

export const insertPrayerSchema = createInsertSchema(prayers).omit({ id: true });
export type Prayer = typeof prayers.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUmrahRequestSchema = createInsertSchema(umrahRequests).omit({ 
  id: true, 
  userId: true, 
  createdAt: true, 
  updatedAt: true,
  status: true // Status is managed by admin
});
export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({ id: true, updatedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UmrahRequest = typeof umrahRequests.$inferSelect;
export type InsertUmrahRequest = z.infer<typeof insertUmrahRequestSchema>;
export type TripMaterial = typeof tripMaterials.$inferSelect;
export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;
