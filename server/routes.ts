import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import createMemoryStore from "memorystore";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

const MemoryStore = createMemoryStore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Session setup
  app.use(session({
    secret: process.env.SESSION_SECRET || 'zain-umrah-secret',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Register Object Storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Authentication Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // --- Auth Routes ---

  app.post(api.auth.login.path, async (req, res) => {
    const { employeeId, password } = req.body;
    const user = await storage.getUserByEmployeeId(employeeId);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.userId = user.id;
    res.json(user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json(user);
  });

  // --- Requests Routes ---

  app.post(api.requests.create.path, requireAuth, async (req, res) => {
    try {
      // Check if request already exists
      const existing = await storage.getRequestByUserId(req.session.userId);
      if (existing) {
        return res.status(400).json({ message: "Request already submitted" });
      }

      const input = api.requests.create.input.parse(req.body);
      const request = await storage.createRequest(req.session.userId, input);
      
      // Simulate Email Notification
      console.log(`[EMAIL] To User ${req.session.userId}: Thank you for registering for the Umrah program.`);

      res.status(201).json(request);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.requests.list.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId);
    if (user?.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    const requests = await storage.getAllRequests();
    res.json(requests);
  });

  app.get(api.requests.myRequest.path, requireAuth, async (req, res) => {
    const request = await storage.getRequestByUserId(req.session.userId);
    res.json(request || null);
  });

  app.patch(api.requests.update.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(req.session.userId);
    const updates = req.body;

    // Security check: only admin can approve/reject
    if ((updates.status || updates.visaUrl || updates.ticketUrl) && user?.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can update status/documents" });
    }

    const updated = await storage.updateRequest(id, updates);

    // Simulate Email on status change
    if (updates.status) {
       console.log(`[EMAIL] To Request Owner: Your Umrah request status has been updated to ${updates.status}.`);
    }

    res.json(updated);
  });

  // --- Materials & Colleagues ---

  app.get(api.materials.list.path, requireAuth, async (req, res) => {
    const materials = await storage.getMaterials();
    res.json(materials);
  });

  app.get(api.colleagues.list.path, requireAuth, async (req, res) => {
    const colleagues = await storage.getApprovedColleagues();
    res.json(colleagues.map(u => ({
      fullName: u.fullName,
      department: u.department,
      gender: u.gender
    })));
  });

  // --- Seed Data ---
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const adminUser = await storage.getUserByEmployeeId("9999");
  if (!adminUser) {
    console.log("Seeding Database...");
    
    // Create Admin
    await storage.createUser({
      employeeId: "9999",
      password: "admin123",
      fullName: "Admin User",
      email: "admin@zain.com",
      phone: "0790000000",
      jobTitle: "HR Manager",
      department: "Human Resources",
      role: "admin",
      gender: "male"
    });

    // Create Employee 1
    const emp1 = await storage.createUser({
      employeeId: "1001",
      password: "123456",
      fullName: "Ahmad Al-Zain",
      email: "ahmad@zain.com",
      phone: "0791111111",
      jobTitle: "Software Engineer",
      department: "IT",
      role: "employee",
      gender: "male"
    });

    // Create Employee 2
    await storage.createUser({
      employeeId: "1002",
      password: "123456",
      fullName: "Sara Jordan",
      email: "sara@zain.com",
      phone: "0792222222",
      jobTitle: "Marketing Specialist",
      department: "Marketing",
      role: "employee",
      gender: "female"
    });

    // Seed Materials
    await storage.createMaterial({ title: "Umrah Guide - Preparation", type: "booklet_page", url: "/assets/page1.png", order: 1 });
    await storage.createMaterial({ title: "Umrah Guide - Ihram", type: "booklet_page", url: "/assets/page2.png", order: 2 });
    await storage.createMaterial({ title: "Umrah Guide - Tawaf", type: "booklet_page", url: "/assets/page3.png", order: 3 });
    
    console.log("Database seeded successfully.");
  }
}
