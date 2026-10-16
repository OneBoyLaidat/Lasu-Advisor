# LASU Advisor Architecture & Comprehensive Fixes Plan

A comprehensive architectural overhaul of the LASU Advisor platform transitioning the advising chat to a dedicated full-page workspace, refining dark mode contrast and accessibility, pruning redundant early-warning/agenda widgets, empowering HODs with session-level cohort assignment and DE logic, enhancing instant PDF transcript OCR extraction, and restricting student search to academic staff.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were aligned via interactive clarification and will guide the implementation:

- **Confirmed Decision 1 (Advising Chat)**: The advising chat interface is promoted from a pop-up modal to a dedicated primary sidebar navigation item and full-page workspace (`Messages` tab) for all roles, featuring real-time conversation threading, instant replies, and historical session archives.
- **Confirmed Decision 2 (Document Scanner)**: The PDF transcript scanner implements instant automatic extraction directly populating the student's Course Results table and recalculating semester GPA, cumulative CGPA, and degree classification upon document upload.
- **Confirmed Decision 3 (Academic Oversight & Result Audit)**: The separate "Adviser Oversight" and "Result Audit" views are consolidated into a unified "Academic Oversight & Result Audit" portal for Lecturers and HODs.
- **Confirmed Decision 4 (Cohort & Direct Entry (DE) Rules)**: Cohorts are strictly identified by session name (e.g. `2025/2026 Session`, `2026/2027 Session`). Direct Entry students entering in `2026/2027` are automatically mapped to the `2025/2026` cohort set (one year prior) to align with their 200 Level matriculating peers.
- **Confirmed Decision 5 (Advisor Transfer Archival)**: When an HOD reassigns an advisor mid-session, all prior communication threads between the affected student cohort and previous advisor are archived and preserved in an accessible "Archived Advising Transcripts" archive.
- **Confirmed Decision 6 (Student Record Search RBAC)**: Student search by full name and matriculation number is strictly restricted to Lecturers and HODs; students have no access to student search bars.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades LASU Advisor to an institutional-grade academic advisement ecosystem supporting undergraduate students, level advisers (lecturers), heads of department (HODs), and faculty deans with session-accurate cohort tracking, instant PDF OCR grade intake, accessible dark mode ergonomics, and role-enforced interfaces.
- **Target Audience / Persona**:
  - *Undergraduate Students (UTME & Direct Entry)*: View validated course grades, calculate target GPAs, communicate with their assigned session adviser, and scan PDF result slips.
  - *Level Advisers / Lecturers*: Manage advisee rosters, conduct session audits, search students by matric/name, and communicate via full-page chat.
  - *Heads of Department (HOD)*: Manage department-wide performance, assign advisers per academic session cohort with automatic thread archiving, and track pass rates without clutter.
- **Key Value**: Delivers frictionless academic administration adhering to LASU NUC 5.0 grading standards, clear role boundaries, and zero UI clutter.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Full-Page Advising Messages**:
   - Students click the "Messages" nav item in the sidebar or "Message Adviser" on their dashboard.
   - The view renders as a full-page workspace with active conversation threads, live input, attachment actions, and an expandable "Archived Advising Transcripts" accordion containing past sessions.
   - Advisers/HODs view a two-pane layout: on the left, an advisee conversation list sorted by recent messages with status chips; on the right, the active message transcript and student academic summary panel.
2. **Instant PDF Result Extraction**:
   - Student uploads an official LASU PDF result slip.
   - The extractor parses course codes (`CSC301`, `MTH301`), titles, credit units, scores, and grades directly into the active Course Results table, instantly updating GPA and CGPA.
3. **Session-Based Adviser Assignment & Archival**:
   - HOD opens the assignment modal, selects an academic session (e.g., `2025/2026`) and chooses a faculty member.
   - Existing messages for advisees in that session are cleanly archived with timestamps; all advisees in that cohort update to the new adviser immediately.
4. **Restricted Staff Search**:
   - Lecturers and HODs have a quick search bar in the top navigation to look up students by full name or matric number (`CSC/2024/001`), opening student profiles directly. Students see a clean header without search affordances.

### Visual Identity & Theme
- **Aesthetic Direction**: High-utility institutional academic dashboard, authoritative, clear, and restrained. Anti-slop layout avoiding decorative pulsing dots, candy pills, or mechanical code comments.
- **Dark Mode Ergonomics & Contrast**:
  - Soft neutral background canvas: `#0b0f19` (Slate 950) with subtle `#1e293b` (Slate 800) container surfaces.
  - Text contrast: Dominant headlines in high-clarity `#f8fafc` (Slate 50) and `#e2e8f0` (Slate 200), with sub-labels in `#94a3b8` (Slate 400).
  - Accents: Deep emerald `#10b981` (primary active state), subtle amber `#f59e0b` (alerts), and soft sky `#38bdf8` (secondary metrics).
  - Header brightness on Analytics & Projections upgraded from dark muted text to bright `#f1f5f9` with readable contrast ratios exceeding 6.5:1.
- **60-30-10 Color Discipline**:
  - 60% Canvas: Light `#f8fafc` / Dark `#090d16`
  - 30% Structural: Light `#ffffff` with hairline `#e2e8f0` borders / Dark `#111827` with `#1f2937` borders
  - 10% Intentional Accents: LASU institutional emerald (`#059669` light, `#10b981` dark).
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` or system geometric sans, tracking tight, balanced headlines.
  - Tabular Data & Codes: `font-mono tabular-nums` for GPAs, scores, matric numbers, and units.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Full-Page Chat vs. Modal Overlay
- **Chosen Approach**: Full-page view rendered as a dedicated tab (`messages`) integrated into main sidebar routing.
- **Why**: Multi-line advising conversations, transcript reviews, and archived thread histories require ample horizontal and vertical viewport real estate that cramped 380px popups cannot accommodate.

### Decision 2: Pruning 'Early Warning Systems', 'Today's Agenda', and Clutter
- **Chosen Approach**:
  - Completely eliminate 'Early Warning Systems' and 'Today's Agenda' cards and reminders from Lecturer, Student, and Executive dashboards.
  - Remove 'Result Compliance' and 'Transcript Compliance' from the HOD page.
  - Remove 'Load Factor' multiplier from the HOD 'Advisor Allocation' model.
  - Remove 'Database State', 'Assessment Done', and 'Semester Progress' from Settings.
  - Remove 'CGPA Target Calculator' from Lecturer and HOD analytics views (reserved strictly for students).
- **Why**: Eliminates redundant or misleading mock telemetry, allowing users to focus on primary academic advisement workflows.

### Decision 3: Direct Entry (DE) Cohort Alignment
- **Chosen Approach**: When a Direct Entry student registers for session `2026/2027`, their cohort set is automatically assigned to `2025/2026` (one session before entry), recognizing that they matriculate at 200 Level with students who started in 2025/2026.
- **Why**: Standard Nigerian university graduation tracking ties DE students to the graduating set of their respective level, ensuring roster and adviser queries match institutional reality.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LASU Advisor Web Client                         │
│                                                                        │
│  ┌──────────────────┐    ┌──────────────────────────────────────────┐  │
│  │   Sidebar Nav    │    │              Header Bar                  │  │
│  │  - Overview      │    │  - Role Indicator                        │  │
│  │  - Messages      │    │  - Staff Search (Lecturer/HOD Only)     │  │
│  │  - Dept Control  │    │  - Dark Mode Toggle                      │  │
│  │  - Analytics     │    │  - Profile Menu & Sign Out               │  │
│  │  - Settings      │    └──────────────────────────────────────────┘  │
│  └─────────┬────────┘                          │                       │
│            │                                   │                       │
│            ▼                                   ▼                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Active Main Workspace                        │  │
│  │                                                                  │  │
│  │  [Student View]            [Lecturer View]      [HOD View]       │  │
│  │  - Academic Overview       - Academic Oversight - Dept Control   │  │
│  │  - Course Results Table      & Result Audit     - Session-based  │  │
│  │  - Instant PDF Scanner     - Advisee Roster       Adviser Matrix │  │
│  │  - GPA Calculator          - Full-page Messages - Pass Rates     │  │
│  │                                                                  │  │
│  │  [Full-Page Advising Messages]                                   │  │
│  │  - Active Real-Time Messages                                     │  │
│  │  - Archived Advising Transcripts (Mid-session Handover History) │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Local & Express Backend Synchronization               │
│                                                                        │
│   ┌───────────────────────────┐      ┌──────────────────────────────┐  │
│   │ Client Local Persistence  │      │ Node.js Express REST API     │  │
│   │ - Accounts & Profiles     │◄────►│ - POST /api/auth/register    │  │
│   │ - Cohort Assignments      │      │ - POST /api/advisers/assign  │  │
│   │ - Archived Chat Threads   │      │ - POST /api/academic/calc    │  │
│   │ - Stored Course Results   │      │ - GET  /api/health           │  │
│   └───────────────────────────┘      └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & State Mapping

1. **`src/components/Header.tsx`**:
   - Conditionally render search input strictly when `userRole === 'lecturer' || userRole === 'hod' || userRole === 'dean'`.
   - Implement live student name and matriculation number filtering with quick navigation to advisee records.
2. **`src/components/AnalyticsView.tsx`**:
   - Accept `userRole` prop.
   - Render CGPA Target Calculator strictly if `userRole === 'student'`.
   - For Lecturer and HOD, render cohort distribution, credit completion trajectories, and course pass rates.
   - Refactor all colors with accessible high-contrast dark mode classes (`dark:text-slate-100`, `dark:bg-slate-900`, `dark:border-slate-800`).
   - Remove any 'Early Warning' headers.
3. **`src/components/LecturerDashboard.tsx`**:
   - Rename to "Academic Oversight & Result Audit".
   - Completely remove `Early Warning System` card and `Today's Agenda` widget.
   - Expand the Advisee Roster table to full width with rich filtering (by session, status, upload state).
4. **`src/components/DepartmentalControl.tsx` & `AssignAdvisorModal.tsx`**:
   - Remove 'Result Compliance' and 'Transcript Compliance' metrics.
   - Remove 'Load Factor' multiplier from the allocation model.
   - Rename cohort groupings from 'Year One Cohort' to academic sessions (e.g. `2025/2026 Session`, `2026/2027 Session`).
   - Reassigning an advisor archives previous advisee chat threads with the old advisor and re-points the cohort to the new advisor.
5. **`src/components/StudentMessagingView.tsx` & `AdviserMessagingView.tsx`**:
   - Elevate into complete full-page interfaces with message inputs, quick questions, and an "Archived Advising Transcripts" section showing past advisor interactions.
6. **`src/components/TranscriptParserModal.tsx` & `src/lib/ocrTranscriptParser.ts`**:
   - Provide direct extraction that reads PDF text streams, parses course codes (`[A-Z]{3}\s?[0-9]{3}`), titles, credit units, scores, and grades, and immediately commits them to the student's `courseResults` state without blocking.
7. **`src/components/SettingsView.tsx`**:
   - Remove 'Database State', 'Assessment Done', and 'Semester Progress' rows and indicators.
8. **`src/components/AuthView.tsx` & `src/lib/academicUtils.ts`**:
   - Direct Entry (DE) selection: explicitly prompts "Are you a Direct Entry (DE) student?". If yes, joining session `2026/2027` automatically binds the student to the `2025/2026` cohort set and 200 Level.
   - Verify robust login and account creation across student and staff accounts.
