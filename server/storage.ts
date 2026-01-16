import { db } from "./db";
import {
  users, umrahRequests, tripMaterials, emailSettings,
  type User, type InsertUser,
  type UmrahRequest, type InsertUmrahRequest,
  type TripMaterial, type EmailSettings, type InsertEmailSettings
} from "@shared/schema";
import { eq, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // User Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByEmployeeId(employeeId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getUsersByIds(ids: number[]): Promise<User[]>;
  
  // Requests
  createRequest(userId: number, request: Partial<InsertUmrahRequest>): Promise<UmrahRequest>;
  getRequestByUserId(userId: number): Promise<UmrahRequest | undefined>;
  getAllRequests(): Promise<any>;
  updateRequest(id: number, updates: Partial<UmrahRequest>): Promise<UmrahRequest>;
  
  // Materials
  getMaterials(): Promise<TripMaterial[]>;
  createMaterial(material: typeof tripMaterials.$inferInsert): Promise<TripMaterial>;

  // Colleagues
  getApprovedColleagues(): Promise<User[]>;

  // Email Settings
  getEmailSettings(): Promise<EmailSettings | undefined>;
  updateEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmployeeId(employeeId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.employeeId, employeeId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByIds(ids: number[]): Promise<User[]> {
    if (!ids.length) return [];
    return await db.select().from(users).where(inArray(users.id, ids));
  }

  async createRequest(userId: number, request: Partial<InsertUmrahRequest>): Promise<UmrahRequest> {
    const [newRequest] = await db.insert(umrahRequests).values({ 
      userId, 
      checklistCompleted: request.checklistCompleted || false,
      status: 'pending'
    }).returning();
    return newRequest;
  }

  async getRequestByUserId(userId: number): Promise<UmrahRequest | undefined> {
    const [request] = await db.select().from(umrahRequests).where(eq(umrahRequests.userId, userId));
    return request;
  }

  async getAllRequests(): Promise<any> {
    return await db.select({
      id: umrahRequests.id,
      userId: umrahRequests.userId,
      status: umrahRequests.status,
      checklistCompleted: umrahRequests.checklistCompleted,
      paymentMethod: umrahRequests.paymentMethod,
      passportUrl: umrahRequests.passportUrl,
      militaryServiceUrl: umrahRequests.militaryServiceUrl,
      visaUrl: umrahRequests.visaUrl,
      ticketUrl: umrahRequests.ticketUrl,
      adminComments: umrahRequests.adminComments,
      needsCompanion: umrahRequests.needsCompanion,
      companion1Name: umrahRequests.companion1Name,
      companion1PassportUrl: umrahRequests.companion1PassportUrl,
      companion2Name: umrahRequests.companion2Name,
      companion2PassportUrl: umrahRequests.companion2PassportUrl,
      assignedColleagueIds: umrahRequests.assignedColleagueIds,
      createdAt: umrahRequests.createdAt,
      user: users
    })
    .from(umrahRequests)
    .innerJoin(users, eq(umrahRequests.userId, users.id))
    .orderBy(desc(umrahRequests.createdAt));
  }

  async updateRequest(id: number, updates: Partial<UmrahRequest>): Promise<UmrahRequest> {
    const [updated] = await db.update(umrahRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(umrahRequests.id, id))
      .returning();
    return updated;
  }

  async getMaterials(): Promise<TripMaterial[]> {
    return await db.select().from(tripMaterials).orderBy(tripMaterials.order);
  }

  async createMaterial(material: typeof tripMaterials.$inferInsert): Promise<TripMaterial> {
    const [newMat] = await db.insert(tripMaterials).values(material).returning();
    return newMat;
  }

  async getApprovedColleagues(): Promise<User[]> {
    const results = await db.select({
      user: users
    })
    .from(umrahRequests)
    .innerJoin(users, eq(umrahRequests.userId, users.id))
    .where(eq(umrahRequests.status, 'approved'));
    
    return results.map(r => r.user);
  }

  async getEmailSettings(): Promise<EmailSettings | undefined> {
    const [settings] = await db.select().from(emailSettings);
    return settings;
  }

  async updateEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const existing = await this.getEmailSettings();
    if (existing) {
      const [updated] = await db.update(emailSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(emailSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(emailSettings).values(settings).returning();
      return inserted;
    }
  }
}

export const storage = new DatabaseStorage();
