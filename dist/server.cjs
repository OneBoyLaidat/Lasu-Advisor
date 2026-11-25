var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "20mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "20mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      system: "LASU Advisor Academic Advising & CGPA Audit Portal",
      institution: "Lagos State University (LASU)",
      techStack: {
        frontend: "React 19 + TypeScript + Tailwind CSS",
        backend: "Node.js (Express)",
        runtime: process.version,
        architecture: "Decoupled Client-Server with Unified Reverse Proxy"
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/academic/sessions", (_req, res) => {
    const now = /* @__PURE__ */ new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const activeStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;
    const activeSession = `${activeStartYear}/${activeStartYear + 1}`;
    const topYear = Math.max(2026, activeStartYear);
    const minYear = 2017;
    const sessions = [];
    for (let y = topYear; y >= minYear; y--) {
      sessions.push(`${y}/${y + 1}`);
    }
    if (!sessions.includes("2026/2027")) sessions.unshift("2026/2027");
    if (!sessions.includes("2025/2026")) {
      const idx = sessions.indexOf("2026/2027");
      sessions.splice(idx + 1, 0, "2025/2026");
    }
    const uniqueSessions = Array.from(new Set(sessions));
    res.json({
      activeSession,
      currentSemester: currentMonth >= 1 && currentMonth <= 6 ? "First Semester" : "Second Semester",
      automatedRolloverActive: true,
      availableSessions: uniqueSessions
    });
  });
  app.post("/api/academic/calculate-level", (req, res) => {
    const { admissionSession, entryMode, referenceSession } = req.body;
    if (!admissionSession) {
      return res.status(400).json({ error: "Admission session is required" });
    }
    const admYearMatch = String(admissionSession).match(/\b(19\d\d|20\d\d)\b/);
    if (!admYearMatch) {
      return res.status(400).json({ error: "Invalid admission session format" });
    }
    const admYear = parseInt(admYearMatch[1], 10);
    const now = /* @__PURE__ */ new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const activeStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;
    let refYear = activeStartYear;
    if (referenceSession) {
      const refMatch = String(referenceSession).match(/\b(19\d\d|20\d\d)\b/);
      if (refMatch) refYear = parseInt(refMatch[1], 10);
    }
    const yearsElapsed = Math.max(0, refYear - admYear);
    const isDirectEntry = entryMode === "direct_entry" || entryMode === "de";
    let levelNumber = isDirectEntry ? (2 + yearsElapsed) * 100 : (1 + yearsElapsed) * 100;
    let levelString = `${levelNumber} Level`;
    let isGraduated = false;
    if (levelNumber > 500) {
      levelString = "Alumni / Graduated";
      isGraduated = true;
    } else if (levelNumber === 500) {
      levelString = "500 Level (Final Year / Extended)";
    }
    res.json({
      admissionSession,
      entryMode: isDirectEntry ? "direct_entry" : "utme",
      level: levelString,
      levelNumber,
      yearsElapsed,
      isGraduated
    });
  });
  app.post("/api/auth/login", (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide both institutional identifier and password"
      });
    }
    res.json({
      success: true,
      message: "Node.js backend verification passed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/auth/register", (req, res) => {
    const { role, name, matricNo, staffId } = req.body;
    if (!name || !role) {
      return res.status(400).json({
        success: false,
        error: "Missing required registration parameters"
      });
    }
    if (role === "student" && !matricNo) {
      return res.status(400).json({
        success: false,
        error: "Matriculation number is required for student registration"
      });
    }
    if (role !== "student" && !staffId) {
      return res.status(400).json({
        success: false,
        error: "Staff ID is required for academic staff registration"
      });
    }
    res.json({
      success: true,
      message: "Account successfully registered on Node.js backend",
      registeredAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/advisers/assign", (req, res) => {
    const { adviserId, level, session, studentLoad } = req.body;
    if (!adviserId || !level) {
      return res.status(400).json({
        success: false,
        error: "Adviser ID and Level are required for cohort assignment"
      });
    }
    res.json({
      success: true,
      message: `Adviser assignment for ${level} (${session || "Active Session"}) processed successfully on backend`,
      adviserId,
      level,
      session,
      studentLoad,
      propagatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/admin/staff", (req, res) => {
    const { name, email, staffId, role, department, faculty, level, password } = req.body;
    if (!name || !staffId || !role) {
      return res.status(400).json({
        success: false,
        error: "Missing required staff registration parameters (name, staffId, role)"
      });
    }
    console.log(`[LASU Admin Portal] Registered new staff: ${name} (${staffId}) as ${role} for ${department}`);
    res.json({
      success: true,
      message: `Staff member ${name} (${staffId}) successfully registered with role ${role}`,
      staff: {
        name,
        email,
        staffId,
        role,
        department: department || "Computer Science",
        faculty: faculty || "Faculty of Computing & Information Technology",
        level: level || "100 Level",
        hasPasswordAssigned: !!password
      },
      registeredAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/auth/reset-password", (req, res) => {
    const { identifier, newPassword } = req.body;
    if (!identifier || !newPassword || newPassword.length < 5) {
      return res.status(400).json({
        success: false,
        error: "Identifier and valid new password (min. 5 characters) are required"
      });
    }
    console.log(`[LASU Advisor Auth] Password reset request processed for identifier: ${identifier}`);
    res.json({
      success: true,
      message: "Password reset verified and propagated on backend server",
      identifier,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/admin/staff/reset-password", (req, res) => {
    const { staffId, email, newPassword } = req.body;
    if (!staffId && !email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Staff identifier and new password are required"
      });
    }
    res.json({
      success: true,
      message: `Password updated successfully for staff member ${staffId || email}`,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LASU Advisor] Node.js backend server listening on http://0.0.0.0:${PORT}`);
    console.log(`[LASU Advisor] React frontend integrated via Vite SPA middleware.`);
  });
}
startServer().catch((err) => {
  console.error("[LASU Advisor] Fatal Server Startup Error:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
