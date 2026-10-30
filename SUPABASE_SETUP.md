# Supabase setup for LASU Advisor

This repository already contains the schema and RLS migration at `supabase/migrations/202610290001_lasu_advisor_live_data.sql`. Use that migration as the source of truth; do not create parallel tables with different column names.

## 1. Create and configure a Supabase project

1. Create a Supabase project and save its database password somewhere secure.
2. In **Project Settings → API**, copy the **Project URL** and the **anon/public key**.
3. In **Authentication → URL Configuration**, set **Site URL** to the production origin, for example `https://YOUR-SITE.netlify.app/` (do not leave it at localhost). Add the exact production origin to **Redirect URLs**, plus `http://localhost:3000/**` for local work and a Netlify preview pattern such as `https://**--YOUR-SITE.netlify.app/**` if previews are used. Signup passes the current app origin as `emailRedirectTo`, so Supabase must allow the production URL. If you customized the confirmation email template, use `{{ .RedirectTo }}` for the app return URL or keep the standard `{{ .ConfirmationURL }}` link.
4. In **Authentication → Providers → Email**, enable email/password sign-in. Choose whether new students must confirm their email. When confirmation is enabled, signup shows a check-your-email message and the student signs in after confirming.
5. Keep staff roles administrator-provisioned. Public signup deliberately creates student profiles only; allowing self-selected HOD/Dean roles would be an authorization vulnerability.

## 2. Environment variables

Create a root-level `.env` beside `package.json` for local development (copy `.env.example`). Set:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
GEMINI_API_KEY=YOUR_SERVER_SIDE_GEMINI_KEY
APP_URL=http://localhost:3000
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the frontend host's build/runtime environment too. They are read in `src/lib/supabaseClient.ts`; the Vite `VITE_` prefix means they are public browser configuration. The anon key is safe to expose only because RLS is enabled. **Never put a Supabase service-role/secret key in a `VITE_` variable or browser code.** On Netlify, configure these variables for the build and redeploy after changing them. For scanned-PDF OCR, add `GEMINI_API_KEY` in Netlify's function environment.

`GEMINI_API_KEY` is server-only and is used by `/api/ocr/transcript` in `server.ts` locally and `netlify/functions/ocr-transcript.mjs` on Netlify when a PDF has no extractable text. Never prefix it with `VITE_`. Scanned PDFs sent through the Netlify function must be 4 MB or smaller because the function request includes base64 expansion. It is not needed for ordinary text-based PDFs. `APP_URL` is for deployment configuration and is not used by the browser Supabase client.

For Netlify staff provisioning, also set these **function environment variables** in Site configuration → Environment variables: `SUPABASE_URL` (the Project URL), `SUPABASE_ANON_KEY` (the anon/publishable key), and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → service_role/secret key). These are read only by the server-side staff/admin provisioning and password functions under `netlify/functions/`. Keep the service role key server-side; never add a `VITE_` prefix. Netlify's live environment is outside this repository, so verify this key is configured in the Netlify UI. Functions fail with a configuration error if it is missing; a successful admin operation confirms it can access Supabase Auth and Postgres. Deploy after setting the variables.

Restart the dev server after editing `.env`. Local development falls back to demo authentication/data when either Supabase frontend variable is missing. Production builds fail closed with a setup message instead of silently creating demo accounts. An empty `.env.example` does not connect a project.

## 3. Apply the database schema

Open **SQL Editor → New query** and run the migration files in timestamp order: `202610290001_lasu_advisor_live_data.sql`, `202610300001_backfill_student_profiles.sql`, `202610300002_student_semester_results_and_advisers.sql`, `202610300003_admin_staff_management.sql`, `202610300004_staff_credentials.sql`, `202610300005_admin_portal_management.sql`, `202610300006_admin_account_provisioning.sql`, `202610300007_split_student_staff_profiles.sql`, then `202610300008_super_admin_bootstrap.sql`. Migration 007 backfills student/staff records before dropping role-specific columns from `profiles`; shared identity and access role stay in `profiles`.

| Table | Column | Type | Purpose |
|---|---|---|---|
| `profiles` | `user_id` | `uuid` PK, FK to `auth.users.id` | Supabase Auth identity |
| | `full_name` | `text` | Display name; compared with the OCR result name |
| | `email` | `text` unique | Account email |
| | `role` | `text` (`student`, `lecturer`, `hod`, `dean`, `admin`) | Authorization role |
| | `department`, `faculty` | `text` | Scope for academic access |
| | `created_at` | `timestamptz` default `now()` | Creation timestamp |
| `students` | `user_id` | `uuid` PK, FK to `profiles.user_id` | Student identity link |
| | `matric_no` | `text` unique | Student matriculation number |
| | `level`, `admission_session` | `text` nullable | Student cohort, e.g. `300 Level`, `2023/2024` |
| | `avatar_url`, `phone` | `text` nullable | Student profile details |
| | `has_uploaded_transcript` | `boolean` default `false` | Whether a result has been uploaded |
| | `transcript_file_name` | `text` nullable | Latest uploaded result filename |
| | `result_prompt_dismissed_semester` | `text` nullable | Student's “I don't have results yet” semester key |
| `staff_profiles` | `user_id` | `uuid` PK, FK to `profiles.user_id` | Staff identity link |
| | `staff_id` | `text` unique | Staff identifier |
| | `level`, `admission_session` | `text` nullable | Adviser cohort, if applicable |
| | `avatar_url`, `phone` | `text` nullable | Staff profile details |
| | `must_change_password` | `boolean` default `false` | Staff must set a personal password at first sign-in |
| `adviser_assignments` | `adviser_id` | `uuid` FK to `profiles.user_id` | Assigned lecturer/adviser |
| | `department`, `admission_session`, `level` | `text` | Cohort key; the three columns form the primary key |
| `student_results` | `id` | `bigint` identity PK | Result row identifier |
| | `user_id` | `uuid` FK to `profiles.user_id` | Student owner |
| | `file_name` | `text` | Uploaded PDF filename |
| | `file_path` | `text` nullable | Object path in private `result-documents` bucket |
| | `document_student_name` | `text` | OCR-read name checked against `profiles.full_name` |
| | `courses` | `jsonb` | Array of course objects described below |
| | `cgpa` | `numeric(4,2)` | Calculated CGPA |
| | `semester_key` | `text` nullable | Key used to show a new result prompt once each semester |
| | `created_at` | `timestamptz` default `now()` | Upload time |
| `messages` | `id` | `bigint` identity PK | Message identifier |
| | `sender_id`, `recipient_id` | `uuid` FK to `profiles.user_id` | Conversation participants |
| | `body` | `text` (1–10,000 characters) | Message text |
| | `thread_key` | `text` | Stable conversation grouping key |
| | `created_at` | `timestamptz` default `now()` | Send time |
| | `read_at` | `timestamptz` nullable | Null means unread; set when recipient opens the conversation |
| `department_hod_assignments` | `department` | `text` PK | One of the five LASU departments; one HOD slot per department |
| | `hod_id` | `uuid` unique FK to `profiles.user_id` | HOD assigned to that department; an HOD can occupy one slot |
| | `assigned_at` | `timestamptz` default `now()` | Last assignment time |
| | `assigned_by` | `uuid` FK to `profiles.user_id` | Admin who made the assignment |

Each `student_results.courses` array item follows the frontend `CourseResult` shape: `code` (string), `title` (string), `units` (number), `grade` (string), `score` (number), `status` (string), `semester` (string), `academicYear` (string), and `gpPoints` (number). Example: `[{"code":"CSC301","title":"Data Structures","units":3,"grade":"A","score":78,"status":"Passed","semester":"First Semester","academicYear":"2024/2025","gpPoints":15}]`.

The final migration creates `public.get_academic_analytics()`, an aggregate-only function scoped to the signed-in lecturer's assigned cohorts, HOD's department, or Dean's faculty. It does not return individual student profiles to a Dean.

### Provision staff and the first adviser assignment

Open the unique Admin Portal at `https://YOUR-SITE.netlify.app/admin-portal` and sign in with a system administrator account. The same LASU-branded login is used at that URL; authorization is checked after sign-in. Only system administrators can create or reset staff accounts. The form generates an initial credential; the endpoint creates the Supabase Auth user and profile and sets `must_change_password`. The portal displays the credential once for the admin to share. Staff must change it on first sign-in. Passwords require at least 8 characters, uppercase, lowercase, a number, and a symbol.

The function is `netlify/functions/admin-create-staff.mjs`; it verifies the caller's access token and database scope before using the server-only service key. Administrator provisioning uses `netlify/functions/admin-register-administrator.mjs`, which checks that the signed-in caller has `profiles.role='admin'`. The one-time bootstrap function is `netlify/functions/bootstrap-super-admin.mjs`; it requires the service key, an allowlisted email and an atomic one-time database claim. It is not an authentication bypass and cannot be called from the frontend.

To bootstrap the first super-admin:

1. Apply all migrations through `202610300008_super_admin_bootstrap.sql` and deploy the Netlify functions.
2. Generate a token with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. In Netlify Site configuration → Environment variables, set `SUPER_ADMIN_BOOTSTRAP_TOKEN` to that value and `SUPER_ADMIN_EMAIL_ALLOWLIST` to the single address that will own the initial admin account. Also set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Send a one-time `POST` to `https://YOUR-SITE.netlify.app/.netlify/functions/bootstrap-super-admin` with header `x-bootstrap-token: YOUR_TOKEN`, `Content-Type: application/json`, and JSON body `{"name":"Your Name","email":"you@example.edu","password":"StrongPass1!"}`. The password must be at least 8 characters and include uppercase, lowercase, a number and a symbol.
4. Sign in at `https://YOUR-SITE.netlify.app/admin-portal` using the allowlisted email and the password supplied in the POST body. No default password is created.
5. Remove `SUPER_ADMIN_BOOTSTRAP_TOKEN` and `SUPER_ADMIN_EMAIL_ALLOWLIST` from Netlify and redeploy. The database claim prevents another bootstrap after the first succeeds.

If the function fails before creating an admin, it releases the claim for retry. If an unexpected partial failure requires recovery, inspect `super_admin_bootstrap_claims` in the SQL editor and remove the row only after verifying no admin profile exists.

Create a student-facing adviser assignment using the lecturer UUID and exactly matching cohort strings:

```sql
insert into public.adviser_assignments (adviser_id, department, admission_session, level)
values ('LECTURER_PROFILE_UUID', 'Computer Science', '2023/2024', '300 Level');
```

The primary key permits one adviser for each department/session/level cohort. HODs can change the assignment only within their own department, and the selected adviser must be a lecturer in that department.

## 4. RLS and permissions installed by the migration

The migrations enable RLS on the application tables and install these policies (the policy names are also visible in the Supabase dashboard):

| Policy | Effect |
|---|---|
| `profile self and authorized staff read` | Users read their own profile. Lecturers see only assigned-cohort students and their own assignment; HODs see students/lecturers in their department and the dean; a dean can see HOD profiles in the same faculty. A dean does not get student profiles. |
| `profile self update` | Users may update editable shared identity fields on their own `profiles` row. Authenticated users cannot change their own role, department, or faculty. |
| `students` policies | Students can read/update their own role-specific row. HODs see students in their department; lecturers see only assigned department/session/level cohorts. The Dean receives no individual student rows. Student matriculation number, level/session, and transcript status are protected from browser edits. |
| `staff_profiles` policies | Staff can read/update their own editable profile details. HODs see staff in their department, Deans see staff in their faculty, and admins manage all staff detail rows. Staff IDs, adviser cohorts, and first-login password flags are protected. |
| `adviser assignments visible to their adviser` | An adviser can read their assignment rows. |
| `students read assigned adviser` | A student can read current and earlier level assignments only within their own department and admission session, so the inbox can list current and past advisers. |
| `hod manages own department assignments` | HODs manage assignment rows in their department only; checks require the adviser profile to be a lecturer in that same department. |
| `student results scoped read` | Students read their own results; lecturers read only results for assigned cohorts; HODs read their department's results. Dean receives no individual results. |
| `student results own insert` | Students insert their own result only, `document_student_name` must equal the current profile's name, and `file_path` must identify a PDF object in their own private storage folder. An insert trigger sets the profile's verified-upload flag and filename. |
| `hod scoped result update` | HODs update result rows only for students in their own department. |
| `participants read messages` | A message is visible only to its sender and recipient. |
| `allowed direct message insert` | The sender must be the signed-in user and `can_message` must approve the role pairing: student ↔ assigned lecturer, lecturer ↔ assigned student, HOD ↔ department lecturers/dean, or dean ↔ HOD in the same faculty. |
| `recipient marks messages read` | Only the recipient may update their received message. A trigger makes message content and participants immutable and allows only an unread-to-read receipt change. |
| `student owns result files` (Storage) | Files in `result-documents` must be stored under the signed-in student's UUID folder. The bucket is private. |
| `system administrators read department HOD assignments` | Only system administrators can view the five department assignment slots; changes are made through the `set_department_hod` permission-checked function. |
| `system administrators update staff profiles` | Only system administrators can edit staff records from the portal. |

After running the migration, open **Database → Publications** and make sure `public.messages` is enabled in the `supabase_realtime` publication. The app subscribes to incoming message inserts so an open inbox can refresh without a reload.

## 5. How the React components use these tables

- `src/lib/supabaseClient.ts` reads the two `VITE_SUPABASE_*` values and creates the browser client. It uses only the anon/public key.
- `src/components/AuthView.tsx` calls `signInAccount`, `signUpAccount`, and `sendPasswordReset` from `src/lib/liveDataService.ts`. Student signup passes the name, email, matric number, department, faculty, level, and admission session as Auth metadata. The SQL Auth trigger inserts the matching `profiles` row with role `student`. Staff signup is intentionally replaced by approved staff provisioning when Supabase is configured.
- `src/App.tsx` restores a Supabase session, loads the profile/results, sends unread receipts, and subscribes to incoming messages. It passes contact, thread, and send/read callbacks into message views.
- `src/components/StudentMessagingView.tsx` is presentation-only. It renders the assigned adviser contact and selected thread, and calls `onSelectAdviser` / `onSendMessage`. In `App.tsx`, these callbacks mark the thread read and call `persistDirectMessage`; inserts are stored in `messages`.
- `src/components/AdviserMessagingView.tsx` renders lecturer conversation rows. `loadLecturerConversations` reads only students/results/messages allowed by RLS, and adviser replies call `persistDirectMessage`. Selecting a conversation writes `read_at` for unread messages addressed to that adviser.
- `src/components/DirectMessagingView.tsx` is the HOD/Dean contact-list and chat view. `loadStaffMessageContacts` only returns lecturers in the HOD's department plus the same-faculty dean, or HODs in the dean's faculty. Messages use the same `messages` table and RLS-approved `persistDirectMessage` / read-receipt flow.
- `persistTranscript` uploads the PDF to `result-documents/<student UUID>/...` and inserts `student_results`. The database trigger then updates the profile's uploaded flag and filename. PDF names must be detected from the document; the modal compares the normalized extracted name with the signed-in profile before invoking this save.

The frontend performs no direct table writes outside `src/lib/liveDataService.ts`. If a query returns an RLS error, verify the signed-in user's `profiles.role`, department and cohort values, then check the assignment row and exact case-sensitive strings before weakening a policy.
