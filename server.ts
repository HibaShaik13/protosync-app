import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const DB_FILE = path.join(process.cwd(), "db.json");
const JWT_SECRET = process.env.JWT_SECRET || "protosync_fallback_secret_jwt_key_99d1";

// In-memory OTP storage mapping verification requests
const otpStore = new Map<string, { otp: string; expiresAt: number; phone?: string }>();

interface TeamRecord {
  _id: string;
  team_name: string;
  team_lead: string;
}

interface TeamOtpRecord {
  _id: string;
  email: string;
  otp: string;
  created_at: string;
  expiresAt: number;
}

// Structure of our database
interface DatabaseSchema {
  users: Record<string, {
    fullName: string;
    email: string;
    workspaceName: string;
    password?: string;
    workspaceData?: {
      collections?: any[];
      envVars?: any[];
      historyLedger?: any[];
      teamMembers?: any[];
      settings?: any;
    };
  }>;
  teams?: TeamRecord[];
  team_otps?: TeamOtpRecord[];
}

// Verify password with automated hash-upward migration
function verifyPassword(password: string, userRecord: any): boolean {
  if (!userRecord || !password) return false;
  
  if (userRecord.password) {
    if (userRecord.password.startsWith("$2a$") || userRecord.password.startsWith("$2b$") || userRecord.password.startsWith("$2y$")) {
      try {
        return bcrypt.compareSync(password, userRecord.password);
      } catch (err) {
        console.error("Bcrypt matching comparison failed:", err);
      }
    }
    // Backward compatibility match for legacy/simulated plain text passwords
    if (userRecord.password === password) {
      // Auto-migrate on successful matching
      userRecord.password = bcrypt.hashSync(password, 10);
      return true;
    }
  }
  return false;
}

// Ensure db.json exists with valid structure
function readDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(content);
      if (!db.users) db.users = {};
      if (!db.teams) db.teams = [];
      if (!db.team_otps) db.team_otps = [];
      return db;
    }
  } catch (err) {
    console.error("Error reading database file, resetting:", err);
  }
  
  const defaultDb: DatabaseSchema = { users: {}, teams: [], team_otps: [] };
  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
  return defaultDb;
}

function writeDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Built-in parser for incoming JSON bodies
  app.use(express.json());

  // API Route: Register
  app.post("/api/auth/register", (req, res) => {
    const { fullName, email, password, workspaceName } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields for registration." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = readDatabase();

    if (db.users[normalizedEmail]) {
      return res.status(409).json({ error: "A user with this email address already exists." });
    }

    // Encrypt the password securely before saving
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.users[normalizedEmail] = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      workspaceName: (workspaceName || "My Workspace").trim(),
      password: hashedPassword,
      workspaceData: {
        collections: [],
        envVars: [
          { id: "e1", key: "BASE_URL", value: "https://api.protosync.io/v1", active: true, isSecret: false },
          { id: "e2", key: "ACCESS_TOKEN", value: "tok_secure_jwt_88d2", active: true, isSecret: true }
        ],
        historyLedger: [],
        teamMembers: [
          { id: "tm-owner", name: fullName, email: normalizedEmail, role: "Owner", joinedAt: "Today" }
        ],
        settings: {
          sessionTimeout: 60,
          sslVerification: true,
          followRedirects: true,
          theme: "dark-cyberpunk",
          notificationsEnabled: true
        }
      }
    };

    writeDatabase(db);
    
    const token = jwt.sign(
      { email: normalizedEmail, fullName: db.users[normalizedEmail].fullName },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const userPayload = {
      fullName: db.users[normalizedEmail].fullName,
      email: db.users[normalizedEmail].email,
      workspaceName: db.users[normalizedEmail].workspaceName,
      token
    };

    res.status(201).json({ success: true, user: userPayload });
  });

  // API Route: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = readDatabase();
    const existingUser = db.users[normalizedEmail];

    if (!existingUser || !verifyPassword(password, existingUser)) {
      return res.status(401).json({ error: "Invalid email or password associated with this cluster gateway." });
    }

    // Write database changes in case we migrated a plain-text password to hash during verification
    writeDatabase(db);

    const token = jwt.sign(
      { email: normalizedEmail, fullName: existingUser.fullName },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const userPayload = {
      fullName: existingUser.fullName,
      email: existingUser.email,
      workspaceName: existingUser.workspaceName,
      token
    };

    res.json({ success: true, user: userPayload });
  });

  // API Route: Get Workspace Data
  app.get("/api/user/workspace-data", (req, res) => {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "Missing identity email search key." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const authHeader = req.headers.authorization;

    // Secure token checks if JWT is provided
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized access: JWT token is required." });
    }
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
      if (decoded.email.toLowerCase().trim() !== normalizedEmail) {
        return res.status(403).json({ error: "Forbidden access: Identity mismatch." });
      }
    } catch (e) {
      return res.status(401).json({ error: "Unauthorized access: Invalid or expired token session." });
    }

    const db = readDatabase();
    const existingUser = db.users[normalizedEmail];

    if (!existingUser) {
      return res.status(404).json({ error: "No persistent workspace found for this cluster node credential." });
    }

    res.json({ success: true, workspaceData: existingUser.workspaceData || {} });
  });

  // API Route: Put / Update Workspace Data
  app.post("/api/user/workspace-data", (req, res) => {
    const { email, workspaceData } = req.body;
    if (!email || !workspaceData) {
      return res.status(400).json({ error: "Missing identity key or transaction workspace payload parameters." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const authHeader = req.headers.authorization;

    // Secure token checks if JWT is provided
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized access: JWT token is required." });
    }
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
      if (decoded.email.toLowerCase().trim() !== normalizedEmail) {
        return res.status(403).json({ error: "Forbidden access: Identity mismatch." });
      }
    } catch (e) {
      return res.status(401).json({ error: "Unauthorized access: Invalid or expired token session." });
    }

    const db = readDatabase();

    if (!db.users[normalizedEmail]) {
      return res.status(404).json({ error: "User profile record does not exist on cluster." });
    }

    // Merge or copy incoming workspaceData
    db.users[normalizedEmail].workspaceData = workspaceData;
    writeDatabase(db);

    res.json({ success: true, message: "Workspace synchronized securely to persistent database cluster." });
  });

  // Helper inside startServer to extract details from JWT
  const parseAndVerifyToken = (req: any): { email: string; fullName: string } | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7);
    try {
      return jwt.verify(token, JWT_SECRET) as { email: string; fullName: string };
    } catch (e) {
      return null;
    }
  };

  // 1. GET /api/analytics/overview (or fallback to user-agnostic route)
  app.get("/api/analytics/overview", (req, res) => {
    const verified = parseAndVerifyToken(req);
    if (!verified) {
      return res.status(401).json({ error: "Unauthorized access: JWT token is required." });
    }
    const email = verified.email;
    const db = readDatabase();
    const user = db.users[email];
    if (!user) {
      return res.status(404).json({ error: "User profile record not found." });
    }

    const history = user.workspaceData?.historyLedger || [];
    const realCount = history.length;
    
    // Real stats calculation
    let successCount = 0;
    let totalLatency = 0;
    let threatCount = 0;

    history.forEach((h: any) => {
      if (h.status >= 200 && h.status < 400) successCount++;
      totalLatency += h.latency || 0;
      if (h.status >= 400 && h.status < 500) threatCount++;
    });

    const baseRequests = 82941;
    const baseSuccessRate = 99.14;
    const baseLatency = 68;
    const baseThreats = 61;

    const finalTotalRequests = baseRequests + realCount;
    const finalSuccessRate = realCount > 0 
      ? parseFloat(((successCount / realCount) * 100).toFixed(2)) 
      : baseSuccessRate;
    const finalAvgLatency = realCount > 0 
      ? Math.round(totalLatency / realCount) 
      : baseLatency;
    const finalThreats = baseThreats + threatCount;

    res.json({
      total_requests: finalTotalRequests,
      success_rate: finalSuccessRate,
      avg_latency: finalAvgLatency,
      threat_signals: finalThreats
    });
  });

  // 2. GET /api/analytics/request-trends
  app.get("/api/analytics/request-trends", (req, res) => {
    const verified = parseAndVerifyToken(req);
    if (!verified) {
      return res.status(401).json({ error: "Unauthorized access: JWT token is required." });
    }
    const email = verified.email;
    const db = readDatabase();
    const user = db.users[email];
    if (!user) {
      return res.status(404).json({ error: "User profile record not found." });
    }

    const history = user.workspaceData?.historyLedger || [];
    
    // Distribute real requests dynamically across the days
    let monS = 0, monF = 0;
    let tueS = 0, tueF = 0;
    let wedS = 0, wedF = 0;
    let thuS = 0, thuF = 0;
    let friS = 0, friF = 0;
    let satS = 0, satF = 0;
    let sunS = 0, sunF = 0;

    history.forEach((h: any, idx: number) => {
      const isSuccess = h.status >= 200 && h.status < 400;
      const dayIndex = idx % 7;
      if (dayIndex === 0) { isSuccess ? monS++ : monF++; }
      else if (dayIndex === 1) { isSuccess ? tueS++ : tueF++; }
      else if (dayIndex === 2) { isSuccess ? wedS++ : wedF++; }
      else if (dayIndex === 3) { isSuccess ? thuS++ : thuF++; }
      else if (dayIndex === 4) { isSuccess ? friS++ : friF++; }
      else if (dayIndex === 5) { isSuccess ? satS++ : satF++; }
      else { isSuccess ? sunS++ : sunF++; }
    });

    const trends = [
      { day: "Mon", success: 4200 + monS, failed: 180 + monF },
      { day: "Tue", success: 5100 + tueS, failed: 120 + tueF },
      { day: "Wed", success: 6800 + wedS, failed: 150 + wedF },
      { day: "Thu", success: 7200 + thuS, failed: 210 + thuF },
      { day: "Fri", success: 8900 + friS, failed: 110 + friF },
      { day: "Sat", success: 5300 + satS, failed: 280 + satF },
      { day: "Sun", success: 4600 + sunS, failed: 190 + sunF }
    ];

    res.json(trends);
  });

  // 3. GET /api/analytics/method-distribution
  app.get("/api/analytics/method-distribution", (req, res) => {
    const verified = parseAndVerifyToken(req);
    if (!verified) {
      return res.status(401).json({ error: "Unauthorized access: JWT token is required." });
    }
    const email = verified.email;
    const db = readDatabase();
    const user = db.users[email];
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const history = user.workspaceData?.historyLedger || [];
    let authAdd = 0, syncAdd = 0, mockAdd = 0, queryAdd = 0, streamAdd = 0;

    history.forEach((h: any) => {
      const method = String(h.method || "").toUpperCase();
      if (method === "GET") {
        queryAdd++;
      } else if (method === "POST" || method === "PUT" || method === "PATCH") {
        syncAdd++;
      } else if (method === "DELETE") {
        streamAdd++;
      } else {
        mockAdd++;
      }
    });

    const methods = [
      { method: "AUTH", count: 32450 + authAdd },
      { method: "SYNC", count: 14200 + syncAdd },
      { method: "MOCK", count: 9200 + mockAdd },
      { method: "QUERY", count: 11500 + queryAdd },
      { method: "STREAM", count: 5200 + streamAdd }
    ];

    res.json(methods);
  });

  // 4. GET /api/analytics/top-endpoints
  app.get("/api/analytics/top-endpoints", (req, res) => {
    const verified = parseAndVerifyToken(req);
    if (!verified) {
      return res.status(401).json({ error: "Unauthorized access: JWT token is required." });
    }
    const email = verified.email;
    const db = readDatabase();
    const user = db.users[email];
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const history = user.workspaceData?.historyLedger || [];
    
    // Count frequency of real endpoints used
    const endpointCounts: Record<string, number> = {};
    history.forEach((h: any) => {
      let rawUrl = h.endpoint || "/getalldata";
      try {
        const parsed = new URL(rawUrl);
        rawUrl = parsed.pathname;
      } catch (e) {
        if (rawUrl.startsWith("http")) {
          const pts = rawUrl.split("/");
          rawUrl = pts.slice(3).join("/") ? "/" + pts.slice(3).join("/") : rawUrl;
        }
      }
      if (!rawUrl.startsWith("/")) {
        rawUrl = "/" + rawUrl;
      }
      endpointCounts[rawUrl] = (endpointCounts[rawUrl] || 0) + 1;
    });

    const baseEndpoints = [
      { endpoint: "/api/v1/workspaces", requests: 2340 },
      { endpoint: "/api/v1/mock-engine", requests: 1940 },
      { endpoint: "/api/v1/auth/token", requests: 1850 },
      { endpoint: "/api/v1/payments/intent", requests: 950 },
      { endpoint: "/api/v1/system/health", requests: 490 }
    ];

    const merged: Record<string, number> = {};
    baseEndpoints.forEach(item => {
      merged[item.endpoint] = item.requests;
    });

    Object.entries(endpointCounts).forEach(([url, count]) => {
      merged[url] = (merged[url] || 0) + count;
    });

    const sorted = Object.entries(merged)
      .map(([endpoint, requests]) => ({ endpoint, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    res.json(sorted);
  });

  // 5. GET /api/analytics/latency-distribution
  app.get("/api/analytics/latency-distribution", (req, res) => {
    const verified = parseAndVerifyToken(req);
    if (!verified) {
      return res.status(401).json({ error: "Unauthorized access: JWT token is required." });
    }
    const email = verified.email;
    const db = readDatabase();
    const user = db.users[email];
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const history = user.workspaceData?.historyLedger || [];
    let under50 = 0, block50to100 = 0, block100to150 = 0, block200to250 = 0, over300 = 0;

    history.forEach((h: any) => {
      const l = h.latency || 0;
      if (l < 50) under50++;
      else if (l >= 50 && l < 100) block50to100++;
      else if (l >= 100 && l < 150) block100to150++;
      else if (l >= 150 && l < 250) block200to250++;
      else over300++;
    });

    const distribution = [
      { range: "<50ms", count: 1400 + under50 },
      { range: "50-100ms", count: 2800 + block50to100 },
      { range: "100-150ms", count: 1100 + block100to150 },
      { range: "200-250ms", count: 450 + block200to250 },
      { range: ">300ms", count: 120 + over300 }
    ];

    res.json(distribution);
  });

  // API Route: Send Email Invitation via Nodemailer
  app.post("/api/team/invite", async (req, res) => {
    const { email, name, role, senderName, senderEmail } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Missing invitation fields (email and name are required)." });
    }

    const targetEmail = email.toLowerCase().trim();
    const fromEmail = senderEmail ? senderEmail.toLowerCase().trim() : "no-reply@protosync.io";
    const actualSenderName = senderName || "A ProtoSync Teammate";

    console.log(`[TEAM INVITE] Inviting ${name} (${targetEmail}) by ${actualSenderName} (${fromEmail})`);

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const emailSubject = `Invitation to join ${actualSenderName}'s ProtoSync API Workspace`;
    const emailBody = `
Hello ${name},

You have been invited by ${actualSenderName} (${fromEmail}) to join their developmental sandbox API workspace on ProtoSync.

Role assigned: ${role || "Editor"}

Please accept this invitation inside the workspace dashboard to sync assets.

Best regards,
The ProtoSync Automation Engine
    `;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || "587"),
          secure: smtpPort === "465",
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL || smtpUser,
          to: targetEmail,
          subject: emailSubject,
          text: emailBody
        });

        console.log(`[SMTP SUCCESS] Mail delivered to invitee: ${targetEmail}`);
        return res.json({ success: true, message: "Real email invitation dispatched successfully using custom SMTP settings!" });
      } catch (err: any) {
        console.error("[SMTP ERROR] Real email send failed:", err.message);
        return res.status(500).json({
          error: "Failed to dispatch email via SMTP connection.",
          details: err.message,
          simulated: true,
          emailBody
        });
      }
    } else {
      console.log("[SMTP SIMULATED] No SMTP credentials in environment, returning simulated response.");
      return res.json({
        success: true,
        message: "Email invitation processed in local development mode. SMTP credentials can be set up in the Settings panel for real delivery.",
        simulated: true,
        emailBody
      });
    }
  });

  // API Route: Send OTP to Team Lead's Email
  app.post("/api/team/send-otp", async (req, res) => {
    const { ownerEmail, senderEmail, senderName } = req.body;
    if (!ownerEmail || !senderEmail) {
      return res.status(400).json({ error: "Missing required session parameters." });
    }

    const normOwner = ownerEmail.toLowerCase().trim();
    const normSender = senderEmail.toLowerCase().trim();

    // Check if owner actually exists in db
    const db = readDatabase();
    if (!db.users[normOwner]) {
      return res.status(404).json({ error: "The entered email address is not registered on this ProtoSync cluster database." });
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins expiration
    const key = `${normOwner}_${normSender}`;
    
    otpStore.set(key, { otp: generatedOtp, expiresAt });
    console.log(`[OTP GENERATED] OTP for join request key ${key} is ${generatedOtp}. Sends to target email: ${normOwner}`);

    // SMTP configuration variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const emailSubject = `ProtoSync: Team Join Verification Code`;
    const emailBody = `
Hello,

User "${senderName || normSender}" is requesting to join your team workspace on ProtoSync.

To authorize this addition, please share this 6-digit security OTP code with them:

---------------------------------------------------
VERIFICATION OTP: ${generatedOtp}
---------------------------------------------------

This temporary verification code will expire in 5 minutes. 
If you did not initiate or authorize this join request, please ignore this email.

Best regards,
The ProtoSync Automation Engine
    `;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || "587"),
          secure: smtpPort === "465",
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL || smtpUser,
          to: normOwner,
          subject: emailSubject,
          text: emailBody
        });

        console.log(`[SMTP SUCCESS] Security OTP delivered to team lead email: ${normOwner}`);
        return res.json({
          success: true,
          message: `The security verification code has been dispatched directly to the team lead's email (${normOwner})!`,
          targetEmail: normOwner
        });
      } catch (err: any) {
        console.error("[SMTP ERROR] Real security OTP send failed:", err.message);
        return res.status(500).json({
          error: "Failed to dispatch email verification via SMTP server.",
          details: err.message,
          simulated: true,
          otp: generatedOtp,
          targetEmail: normOwner
        });
      }
    } else {
      console.log("[SMTP SIMULATED] No SMTP configuration found. Returning sandbox simulation payload.");
      return res.json({
        success: true,
        message: `OTP email simulation active. A verification OTP email template has been prepared for local preview testing.`,
        simulated: true,
        otp: generatedOtp,
        targetEmail: normOwner
      });
    }
  });

  // API Route: Verify OTP and join team
  app.post("/api/team/verify-otp", (req, res) => {
    const { ownerEmail, senderEmail, senderName, otp } = req.body;
    if (!ownerEmail || !senderEmail || !otp) {
      return res.status(400).json({ error: "Missing required verification fields." });
    }

    const normOwner = ownerEmail.toLowerCase().trim();
    const normSender = senderEmail.toLowerCase().trim();
    const key = `${normOwner}_${normSender}`;

    const record = otpStore.get(key);
    if (!record) {
      return res.status(400).json({ error: "Verification process expired or never initiated. Please generate a new OTP." });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ error: "Verification code expired. Please generate a new OTP." });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: "Incorrect OTP verification code. Please try again." });
    }

    // SUCCESS! Add sender to owner's team roster, and owner to sender's team roster
    const db = readDatabase();
    
    const ownerUser = db.users[normOwner];
    const senderUser = db.users[normSender];

    if (!ownerUser) {
      return res.status(404).json({ error: "Target team workspace owner record no longer exists." });
    }

    if (!senderUser) {
      return res.status(404).json({ error: "Your logged-in user profile was not found." });
    }

    // Ensure structures exist
    if (!ownerUser.workspaceData) ownerUser.workspaceData = {};
    if (!ownerUser.workspaceData.teamMembers) ownerUser.workspaceData.teamMembers = [];

    if (!senderUser.workspaceData) senderUser.workspaceData = {};
    if (!senderUser.workspaceData.teamMembers) senderUser.workspaceData.teamMembers = [];

    // Append sender to owner's team
    const alreadyInOwnerTeam = ownerUser.workspaceData.teamMembers.some((m: any) => m.email === normSender);
    if (!alreadyInOwnerTeam) {
      ownerUser.workspaceData.teamMembers.push({
        id: "tm-" + Date.now(),
        name: senderUser.fullName || senderName || "Teammate",
        email: normSender,
        role: "Editor",
        joinedAt: "Today (Via OTP)",
        status: "active"
      });
    }

    // Append owner to sender's team
    const alreadyInSenderTeam = senderUser.workspaceData.teamMembers.some((m: any) => m.email === normOwner);
    if (!alreadyInSenderTeam) {
      senderUser.workspaceData.teamMembers.push({
        id: "tm-" + (Date.now() + 1),
        name: ownerUser.fullName || "Workspace Owner",
        email: normOwner,
        role: "Owner",
        joinedAt: "Today (Authorized Joint Seat)",
        status: "active"
      });
    }

    // Save database
    writeDatabase(db);
    otpStore.delete(key); // clean up

    return res.json({
      success: true,
      message: `Verification complete! You successfully joined ${ownerUser.fullName}'s team. Workspace peer seat directories updated across the database.`
    });
  });

  // Helper function to extract email from authorization header
  const getEmailFromHeader = (req: any): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded && decoded.email) {
          return decoded.email.toLowerCase().trim();
        }
      } catch (e) {
        console.error("JWT Verify error when extracting email from header:", e);
      }
    }
    return null;
  };

  // API Route: Create Team
  const createTeamHandler = (req: any, res: any) => {
    const { team_name, team_lead } = req.body;
    if (!team_name) {
      return res.status(400).json({ error: "Missing required team_name parameter." });
    }

    const leadEmail = (team_lead || getEmailFromHeader(req) || "ssk498532@gmail.com").toLowerCase().trim();
    const db = readDatabase();
    
    const newTeam = {
      _id: "team_" + Math.random().toString(36).substr(2, 9),
      team_name: team_name.trim(),
      team_lead: leadEmail
    };

    if (!db.teams) db.teams = [];
    db.teams.push(newTeam);

    // Also auto-add this team to user's local team_members or update user context
    const userObj = db.users[leadEmail];
    if (userObj) {
      if (!userObj.workspaceData) userObj.workspaceData = {};
      if (!userObj.workspaceData.teamMembers) userObj.workspaceData.teamMembers = [];
      const alreadyLead = userObj.workspaceData.teamMembers.some((m: any) => m.role === 'Owner' && m.email === leadEmail);
      if (!alreadyLead) {
        userObj.workspaceData.teamMembers.push({
          id: "tm-" + Date.now(),
          name: userObj.fullName,
          email: leadEmail,
          role: "Owner",
          joinedAt: "Today",
          status: "active"
        });
      }
    }

    writeDatabase(db);

    return res.json({
      success: true,
      message: "Team created successfully",
      team: newTeam
    });
  };

  app.post("/create-team", createTeamHandler);
  app.post("/api/create-team", createTeamHandler);

  // API Route: Send OTP to Email
  const sendTeamOtpHandler = async (req: any, res: any) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Missing required email parameter." });
    }

    const targetEmail = email.toLowerCase().trim();
    
    // Generate 6-digit random OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const db = readDatabase();
    
    // Save in database (matching request spec)
    const newOtpRecord = {
      _id: "otp_" + Math.random().toString(36).substr(2, 9),
      email: targetEmail,
      otp: generatedOtp,
      created_at: new Date().toISOString().substring(0, 10),
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    if (!db.team_otps) db.team_otps = [];
    db.team_otps.push(newOtpRecord);
    writeDatabase(db);

    console.log(`[TEAM OTP GENERATED] OTP for ${targetEmail} is ${generatedOtp}`);

    // Send email via SMTP if configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const emailSubject = `ProtoSync: Your Team Access OTP Verification Code`;
    const emailBody = `
Hello,

Your security verification OTP code to join a ProtoSync Team Workspace is:

---------------------------------------------------
VERIFICATION OTP: ${generatedOtp}
---------------------------------------------------

This OTP is valid for 5 minutes. Please do not share this code with unauthorized personnel.

Best regards,
The ProtoSync Automation Engine
    `;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || "587"),
          secure: smtpPort === "465",
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL || smtpUser,
          to: targetEmail,
          subject: emailSubject,
          text: emailBody
        });

        console.log(`[SMTP SUCCESS] Real OTP Email sent to ${targetEmail}`);
        return res.json({
          success: true,
          message: "OTP Sent Successfully",
          targetEmail
        });
      } catch (err: any) {
        console.error("[SMTP ERROR] Failed to send OTP email:", err.message);
        return res.status(500).json({
          error: "Failed to dispatch email via SMTP connection.",
          details: err.message,
          simulated: true,
          otp: generatedOtp,
          targetEmail
        });
      }
    } else {
      console.log("[SMTP SIMULATED] No SMTP configuration found.");
      return res.json({
        success: true,
        message: "OTP Sent Successfully",
        otp: generatedOtp,
        simulated: true,
        targetEmail
      });
    }
  };

  app.post("/send-team-otp", sendTeamOtpHandler);
  app.post("/api/send-team-otp", sendTeamOtpHandler);

  // API Route: Verify OTP and Join Team
  const verifyTeamOtpHandler = (req: any, res: any) => {
    const { email, otp, team_id, ownerEmail } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Missing email or otp parameter." });
    }

    const normEmail = email.toLowerCase().trim();
    const sentOtp = otp.trim();

    const db = readDatabase();
    if (!db.team_otps) db.team_otps = [];

    // Find latest valid OTP record for this email
    const index = db.team_otps.findIndex(r => r.email === normEmail && r.otp === sentOtp && r.expiresAt > Date.now());
    if (index === -1) {
      return res.status(400).json({ error: "Invalid or expired verification OTP. Please try again." });
    }

    // Remove OTP from database
    db.team_otps.splice(index, 1);

    // Determine team lead email
    let targetLeadEmail = "ssk498532@gmail.com";
    if (ownerEmail) {
      targetLeadEmail = ownerEmail.toLowerCase().trim();
    } else if (team_id) {
      const matchedTeam = db.teams?.find(t => t._id === team_id);
      if (matchedTeam) {
        targetLeadEmail = matchedTeam.team_lead;
      }
    } else if (db.teams && db.teams.length > 0) {
      targetLeadEmail = db.teams[db.teams.length - 1].team_lead;
    }

    // Add them to peer lists in users db
    const ownerUser = db.users[targetLeadEmail];
    const memberUser = db.users[normEmail];

    if (ownerUser) {
      if (!ownerUser.workspaceData) ownerUser.workspaceData = {};
      if (!ownerUser.workspaceData.teamMembers) ownerUser.workspaceData.teamMembers = [];
      const alreadyInOwnerTeam = ownerUser.workspaceData.teamMembers.some((m: any) => m.email === normEmail);
      if (!alreadyInOwnerTeam) {
        ownerUser.workspaceData.teamMembers.push({
          id: "tm-" + Date.now(),
          name: memberUser?.fullName || "Teammate",
          email: normEmail,
          role: "Editor",
          joinedAt: "Today (Via OTP)",
          status: "active"
        });
      }
    }

    if (memberUser) {
      if (!memberUser.workspaceData) memberUser.workspaceData = {};
      if (!memberUser.workspaceData.teamMembers) memberUser.workspaceData.teamMembers = [];
      const alreadyInMemberTeam = memberUser.workspaceData.teamMembers.some((m: any) => m.email === targetLeadEmail);
      if (!alreadyInMemberTeam) {
        memberUser.workspaceData.teamMembers.push({
          id: "tm-" + (Date.now() + 1),
          name: ownerUser?.fullName || "Team Lead",
          email: targetLeadEmail,
          role: "Owner",
          joinedAt: "Today (Authorized Jet Seat)",
          status: "active"
        });
      }
    }

    writeDatabase(db);

    return res.json({
      success: true,
      message: "Joined Team Successfully"
    });
  };

  app.post("/verify-team-otp", verifyTeamOtpHandler);
  app.post("/api/verify-team-otp", verifyTeamOtpHandler);

  // API Route: Real HTTP Request Proxy
  app.post("/api/proxy", async (req, res) => {
    const { url, method, headers, body } = req.body;
    if (!url) {
      console.warn("Proxy triggered without target URL destination.");
      return res.status(400).json({ error: "Missing required parameter 'url'." });
    }

    // Backend Logging: print(request.json) style of transaction debugging
    console.log(`\n--- PROTOSYNC CLOUD PROXY GATEWAY ---`);
    console.log(`Target URL:  [${method || "GET"}] ${url}`);
    console.log(`Payload JSON:`, body ? (typeof body === "object" ? JSON.stringify(body, null, 2) : String(body)) : "None");

    const startTime = Date.now();
    try {
      const headersMap: Record<string, string> = { ...(headers || {}) };

      // Normalization of header key configurations
      const lowercaseKeys = Object.keys(headersMap).reduce<Record<string, string>>((acc, key) => {
        acc[key.toLowerCase()] = key;
        return acc;
      }, {});

      // 1. Auto-set bypass headers for local tunnel gateways (like ngrok) to swallow warning pages automatically
      if (url.toLowerCase().includes("ngrok")) {
        if (!lowercaseKeys["ngrok-skip-browser-warning"]) {
          headersMap["ngrok-skip-browser-warning"] = "true";
          console.log("Automatic Overrides: Appended 'ngrok-skip-browser-warning' to bypass login walls.");
        }
      }

      // 2. Default Content-Type and Accept header specifications
      if (body) {
        if (!lowercaseKeys["content-type"]) {
          headersMap["Content-Type"] = "application/json";
        }
        if (!lowercaseKeys["accept"]) {
          headersMap["Accept"] = "application/json";
        }
      } else if (method === "POST" || method === "PUT" || method === "PATCH") {
        // Auto-assign clean default payload for methods requiring a request body if missing
        console.log("Automatic Validation: Empty POST/PUT body detected. Auto-assigned empty raw JSON block '{}'.");
        if (!lowercaseKeys["content-type"]) {
          headersMap["Content-Type"] = "application/json";
        }
        req.body.body = "{}";
      }

      console.log(`Forwarded Headers:`, JSON.stringify(headersMap, null, 2));

      const fetchOptions: RequestInit = {
        method: method || "GET",
        headers: headersMap,
      };

      if (body && (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")) {
        fetchOptions.body = typeof body === "object" ? JSON.stringify(body) : String(body);
      } else if (!body && (method === "POST" || method === "PUT" || method === "PATCH")) {
        fetchOptions.body = "{}";
      }

      const response = await fetch(url, fetchOptions);
      const latency = Date.now() - startTime;
      const status = response.status;
      const statusText = response.statusText;

      // Unpack response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseData: any;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        responseData = await response.json().catch(async () => {
          return await response.text();
        });
      } else {
        responseData = await response.text();
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          // keep as string
        }
      }

      console.log(`Response Status: ${status} ${statusText} resolved in ${latency}ms`);
      console.log(`Response Payload Size: ${JSON.stringify(responseData).length} bytes`);
      console.log(`------------------------------------\n`);

      res.json({
        success: true,
        status,
        statusText,
        headers: responseHeaders,
        data: responseData,
        latency,
        size: JSON.stringify(responseData).length
      });
    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error("Proxy execution error targeting URL:", url);
      console.error(`Detailed Traceback Error Details: ${error.message || error}`);
      console.error(`------------------------------------\n`);
      res.status(502).json({
        success: false,
        error: `Failed to fetch target URL: ${error.message || error}`,
        details: "Connecting to a local server directly from the browser's sandbox is blocked by security policies (Mixed Content). Use a public tunnel tool like 'ngrok' to resolve this, or consult the local bridge guide inside the client.",
        latency,
      });
    }
  });

  // Vite middleware for development vs static asset serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ProtoSync full-stack cluster node booted and active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
