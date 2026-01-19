import type { Express, Request } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import createMemoryStore from "memorystore";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { OpenAI } from "openai";
import nodemailer from "nodemailer";
import axios from "axios";
import { extractPassportData } from "./lib/ocr";

const MemoryStore = createMemoryStore(session);

// --- Mailer Logic ---
async function getTransporter() {
  const settings = await storage.getEmailSettings();
  if (!settings) return null;

  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    auth: {
      user: settings.user,
      pass: settings.password,
    },
  });
}

async function sendEmail(to: string, subject: string, text: string) {
  try {
    const transporter = await getTransporter();
    const settings = await storage.getEmailSettings();
    if (!transporter || !settings) {
      console.log(`[MAIL SKIP] No SMTP settings. Content: ${text}`);
      return;
    }

    await transporter.sendMail({
      from: settings.fromEmail,
      to,
      subject,
      text,
    });
    console.log(`[MAIL SENT] To ${to}: ${subject}`);
  } catch (error) {
    console.error("[MAIL ERROR]", error);
  }
}

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
      const existing = await storage.getRequestByUserId(req.session.userId!);
      if (existing) {
        return res.status(400).json({ message: "Request already submitted" });
      }

      const input = api.requests.create.input.parse(req.body);
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });

      // Apply rules for past participants
      const pastParticipant = await storage.getPastParticipantByEmployeeId(user.employeeId);
      let requestStatus = 'pending';
      let adminComments = '';

      if (pastParticipant) {
        // Rule 1: Already accepted last time -> Auto Reject
        requestStatus = 'rejected';
        adminComments = "تم رفض الطلب تلقائياً لأنك كنت من ضمن المقبولين في العمرة الماضية.";
      } else if (user.jobTitle.toLowerCase().includes('full time') || true) { 
        // Rule 2 placeholder logic
      }

      const request = await storage.createRequest(req.session.userId!, { ...input, status: requestStatus, adminComments } as any);
      
      if (requestStatus === 'rejected') {
        await sendEmail(user.email, "Request Status Updated", adminComments);
      }
      const id = request.id;
      const triggerAi = async (url: string, field: string) => {
        try {
          const extractedData = await extractPassportData(url);
          await storage.updateRequest(id, { [field]: extractedData });
        } catch (e) {
          console.error(`Initial OCR Error for ${field}:`, e);
          await storage.updateRequest(id, { [field]: "خطأ في استخراج البيانات برمجياً." });
        }
      };

      if (input.passportUrl) triggerAi(input.passportUrl, 'passportData');
      if (input.companion1PassportUrl) triggerAi(input.companion1PassportUrl, 'companion1PassportData');
      if (input.companion2PassportUrl) triggerAi(input.companion2PassportUrl, 'companion2PassportData');
      
      // Send Email Notification
      const user = await storage.getUser(req.session.userId!);
      if (user) {
        await sendEmail(user.email, "Registration Received", "Thank you for registering for the Umrah program. We will review your request shortly.");
      }

      res.status(201).json(request);
    } catch (err) {
      console.error("Error creating request:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.requests.list.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (user?.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    const requests = await storage.getAllRequests();
    res.json(requests);
  });

  app.get(api.requests.myRequest.path, requireAuth, async (req, res) => {
    const request = await storage.getRequestByUserId(req.session.userId!);
    res.json(request || null);
  });

  app.patch(api.requests.update.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(req.session.userId!);
    const updates = req.body;

    // Security check: only admin can approve/reject
    if ((updates.status || updates.visaUrl || updates.ticketUrl || updates.assignedColleagueIds) && user?.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can update status/documents/colleagues" });
    }

    const updated = await storage.updateRequest(id, updates);

    // AI Data Extraction for Passports
    const triggerAi = async (url: string, field: string) => {
      try {
        console.log(`Starting OCR Extraction for ${field} (URL: ${url})`);
        const extractedData = await extractPassportData(url);
        console.log(`OCR Extraction Result for ${field}:`, extractedData);
        await storage.updateRequest(id, { [field]: extractedData });
        console.log(`OCR Extraction updated in DB for ${field}`);
      } catch (e) {
        console.error(`Failed to extract data for ${field}:`, e);
        await storage.updateRequest(id, { [field]: "خطأ في استخراج البيانات برمجياً: يرجى مراجعة الجواز يدوياً." });
      }
    };

    if (updates.passportUrl) triggerAi(updates.passportUrl, 'passportData');
    if (updates.companion1PassportUrl) triggerAi(updates.companion1PassportUrl, 'companion1PassportData');
    if (updates.companion2PassportUrl) triggerAi(updates.companion2PassportUrl, 'companion2PassportData');

    // Send Email on status change
    if (updates.status) {
       const owner = await storage.getUser(updated.userId);
       if (owner) {
         await sendEmail(owner.email, "Request Status Updated", `Your Umrah request status has been updated to ${updates.status}.`);
       }
    }

    res.json(updated);
  });

  // --- Users, Materials & Colleagues ---

  app.get("/api/users", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get("/api/past-participants", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (user?.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    const participants = await storage.getPastParticipants();
    res.json(participants);
  });

  app.post("/api/past-participants", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (user?.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    const participants = req.body;
    await storage.upsertPastParticipants(participants);
    res.sendStatus(200);
  });

  app.get(api.materials.list.path, requireAuth, async (req, res) => {
    const materials = await storage.getMaterials();
    res.json(materials);
  });

  app.get(api.colleagues.list.path, requireAuth, async (req, res) => {
    const request = await storage.getRequestByUserId(req.session.userId!);
    if (!request || !request.assignedColleagueIds?.length) {
      return res.json([]);
    }
    const colleagues = await storage.getUsersByIds(request.assignedColleagueIds);
    res.json(colleagues);
  });

  // --- Email Settings Routes ---
  app.get(api.email.getSettings.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (user?.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    const settings = await storage.getEmailSettings();
    res.json(settings || null);
  });

  app.post(api.email.updateSettings.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (user?.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    const input = api.email.updateSettings.input.parse(req.body);
    const updated = await storage.updateEmailSettings(input);
    res.json(updated);
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

    // Create 3 Employee accounts as requested
    const employees = [
      { id: "1000", name: "Employee 1000", email: "emp1000@zain.com" },
      { id: "1001", name: "Employee 1001", email: "emp1001@zain.com" },
      { id: "1002", name: "Employee 1002", email: "emp1002@zain.com" },
      { id: "1003", name: "Employee 1003", email: "emp1003@zain.com" }
    ];

    for (const emp of employees) {
      await storage.createUser({
        employeeId: emp.id,
        password: "123456",
        fullName: emp.name,
        email: emp.email,
        phone: "0790000000",
        jobTitle: "Employee",
        department: "General",
        role: "employee",
        gender: "male"
      });
    }

    console.log("Database seeded with Admin and 4 Employees.");
  }
}
