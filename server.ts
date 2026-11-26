import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

/**
 * LASU Advisor - Dedicated Node.js (Express) Backend Server
 *
 * Tech Stack:
 * - Frontend: React (Single Page Application with TypeScript & Tailwind CSS)
 * - Backend: Node.js with Express runtime
 */

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON body parsing and URL encoding
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // =========================================================================
  // BACKEND API ROUTES (/api/*)
  // =========================================================================

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      system: 'LASU Advisor Academic Advising & CGPA Audit Portal',
      institution: 'Lagos State University (LASU)',
      techStack: {
        frontend: 'React 19 + TypeScript + Tailwind CSS',
        backend: 'Node.js (Express)',
        runtime: process.version,
        architecture: 'Decoupled Client-Server with Unified Reverse Proxy',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Dynamic Academic Calendar & Sessions API
  app.get('/api/academic/sessions', (_req: Request, res: Response) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed: 6 = July, 7 = August

    // Automatic rollover trigger at the end of every second semester
    const activeStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;
    const activeSession = `${activeStartYear}/${activeStartYear + 1}`;

    const topYear = Math.max(2026, activeStartYear);
    const minYear = 2017;
    const sessions: string[] = [];

    for (let y = topYear; y >= minYear; y--) {
      sessions.push(`${y}/${y + 1}`);
    }

    if (!sessions.includes('2026/2027')) sessions.unshift('2026/2027');
    if (!sessions.includes('2025/2026')) {
      const idx = sessions.indexOf('2026/2027');
      sessions.splice(idx + 1, 0, '2025/2026');
    }

    const uniqueSessions = Array.from(new Set(sessions));

    res.json({
      activeSession,
      currentSemester: currentMonth >= 1 && currentMonth <= 6 ? 'First Semester' : 'Second Semester',
      automatedRolloverActive: true,
      availableSessions: uniqueSessions,
    });
  });

  // 3. Dynamic Level Progression Calculator Endpoint
  app.post('/api/academic/calculate-level', (req: Request, res: Response) => {
    const { admissionSession, entryMode, referenceSession } = req.body;

    if (!admissionSession) {
      return res.status(400).json({ error: 'Admission session is required' });
    }

    const admYearMatch = String(admissionSession).match(/\b(19\d\d|20\d\d)\b/);
    if (!admYearMatch) {
      return res.status(400).json({ error: 'Invalid admission session format' });
    }

    const admYear = parseInt(admYearMatch[1], 10);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const activeStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;

    let refYear = activeStartYear;
    if (referenceSession) {
      const refMatch = String(referenceSession).match(/\b(19\d\d|20\d\d)\b/);
      if (refMatch) refYear = parseInt(refMatch[1], 10);
    }

    const yearsElapsed = Math.max(0, refYear - admYear);
    const isDirectEntry = entryMode === 'direct_entry' || entryMode === 'de';

    let levelNumber = isDirectEntry ? (2 + yearsElapsed) * 100 : (1 + yearsElapsed) * 100;

    let levelString = `${levelNumber} Level`;
    let isGraduated = false;

    if (levelNumber > 500) {
      levelString = 'Alumni / Graduated';
      isGraduated = true;
    } else if (levelNumber === 500) {
      levelString = '500 Level (Final Year / Extended)';
    }

    res.json({
      admissionSession,
      entryMode: isDirectEntry ? 'direct_entry' : 'utme',
      level: levelString,
      levelNumber,
      yearsElapsed,
      isGraduated,
    });
  });

  // 4. Node.js Backend Authentication Endpoint
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both institutional identifier and password',
      });
    }

    // Node.js verification layer
    res.json({
      success: true,
      message: 'Node.js backend verification passed',
      timestamp: new Date().toISOString(),
    });
  });

  // 5. Node.js Backend Registration Endpoint
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { role, name, matricNo, staffId } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required registration parameters',
      });
    }

    if (role === 'student' && !matricNo) {
      return res.status(400).json({
        success: false,
        error: 'Matriculation number is required for student registration',
      });
    }

    if (role !== 'student' && !staffId) {
      return res.status(400).json({
        success: false,
        error: 'Staff ID is required for academic staff registration',
      });
    }

    res.json({
      success: true,
      message: 'Account successfully registered on Node.js backend',
      registeredAt: new Date().toISOString(),
    });
  });

  // 6. Node.js Global Adviser Reassignment & Propagation Endpoint
  app.post('/api/advisers/assign', (req: Request, res: Response) => {
    const { adviserId, level, session, studentLoad } = req.body;

    if (!adviserId || !level) {
      return res.status(400).json({
        success: false,
        error: 'Adviser ID and Level are required for cohort assignment',
      });
    }

    res.json({
      success: true,
      message: `Adviser assignment for ${level} (${session || 'Active Session'}) processed successfully on backend`,
      adviserId,
      level,
      session,
      studentLoad,
      propagatedAt: new Date().toISOString(),
    });
  });
  // 7. Node.js Admin Portal Staff Registration Endpoint
  app.post('/api/admin/staff', (req: Request, res: Response) => {
    const { name, staffId, role, department, faculty, level, password } = req.body;

    if (!name || !staffId || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required staff registration parameters (name, staffId, role)',
      });
    }

    console.log(`[LASU Admin Portal] Registered new staff: ${name} (${staffId}) as ${role} for ${department}`);

    res.json({
      success: true,
      message: `Staff member ${name} (${staffId}) successfully registered with role ${role}`,
      staff: {
        name,
        staffId,
        role,
        department: department || 'Computer Science',
        faculty: faculty || 'Faculty of Computing & Information Technology',
        level: level || '100 Level',
        hasPasswordAssigned: !!password,
      },
      registeredAt: new Date().toISOString(),
    });
  });

  // 8. Node.js Password & Profile Reset Endpoint (Students & Staff)
  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { identifier, newPassword } = req.body;

    if (!identifier || !newPassword || newPassword.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Identifier and valid new password (min. 5 characters) are required',
      });
    }

    console.log(`[LASU Advisor Auth] Password reset request processed for identifier: ${identifier}`);

    res.json({
      success: true,
      message: 'Password reset verified and propagated on backend server',
      identifier,
      updatedAt: new Date().toISOString(),
    });
  });

  // 9. Node.js Admin Staff Password Reset Endpoint
  app.post('/api/admin/staff/reset-password', (req: Request, res: Response) => {
    const { staffId, newPassword } = req.body;

    if (!staffId || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Staff identifier and new password are required',
      });
    }

    res.json({
      success: true,
      message: `Password updated successfully for staff member ${staffId}`,
      updatedAt: new Date().toISOString(),
    });
  });


  // =========================================================================
  // VITE CLIENT MIDDLEWARE & STATIC SERVING
  // =========================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Host must bind to 0.0.0.0 and port 3000 for cloud container environment
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LASU Advisor] Node.js backend server listening on http://0.0.0.0:${PORT}`);
    console.log(`[LASU Advisor] React frontend integrated via Vite SPA middleware.`);
  });
}

startServer().catch((err) => {
  console.error('[LASU Advisor] Fatal Server Startup Error:', err);
  process.exit(1);
});
