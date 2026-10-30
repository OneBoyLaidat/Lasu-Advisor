import { User } from '@supabase/supabase-js';
import { AcademicAnalytics, Adviser, CourseResult, MessageContact, StudentConversation, UserProfile, UserRole, StaffMember, ManualStaffRegistrationPayload, AdministratorProfile, AdministratorRegistrationPayload } from '../types';
import { AuthResult, authenticateUser, registerNewUser, registerStaffManually, resetAccountPassword, getStaffDirectory, updateStaffMember, deleteStaffMember, clearMustChangePassword } from './authService';
import { describeSupabaseConnectionError, getSupabaseClient, isSupabaseConfigured, supabaseConfigurationError } from './supabaseClient';
import { getCurrentSemesterKey } from './academicUtils';

type ProfileRow = {
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  faculty: string;
};

type StudentRow = { matric_no?: string | null; level?: string | null; admission_session?: string | null; avatar_url?: string | null; phone?: string | null; has_uploaded_transcript?: boolean | null; transcript_file_name?: string | null; result_prompt_dismissed_semester?: string | null };
type StaffProfileRow = { staff_id?: string | null; level?: string | null; admission_session?: string | null; avatar_url?: string | null; phone?: string | null; must_change_password?: boolean | null };

const profileFromRow = (row: ProfileRow, details: StudentRow | StaffProfileRow = {}): UserProfile => ({
  id: row.user_id,
  name: row.full_name,
  email: row.email,
  role: row.role,
  department: row.department,
  faculty: row.faculty,
  matricNo: 'matric_no' in details ? details.matric_no || undefined : undefined,
  staffId: 'staff_id' in details ? details.staff_id || undefined : undefined,
  level: details.level || undefined,
  admissionSession: details.admission_session || undefined,
  avatarUrl: details.avatar_url || '',
  phone: details.phone || undefined,
  hasUploadedTranscript: 'has_uploaded_transcript' in details ? details.has_uploaded_transcript || false : false,
  resultPromptDismissedSemester: 'result_prompt_dismissed_semester' in details ? details.result_prompt_dismissed_semester || undefined : undefined,
  transcriptFileName: 'transcript_file_name' in details ? details.transcript_file_name || undefined : undefined,
  mustChangePassword: 'must_change_password' in details ? details.must_change_password || false : false,
});

const identityToRow = (profile: UserProfile) => ({
  full_name: profile.name,
  email: profile.email,
  role: profile.role,
  department: profile.department,
  faculty: profile.faculty,
});

const detailsToRow = (profile: UserProfile) => profile.role === 'student' ? ({
  matric_no: profile.matricNo || null,
  has_uploaded_transcript: profile.hasUploadedTranscript || false,
  transcript_file_name: profile.transcriptFileName || null,
  result_prompt_dismissed_semester: profile.resultPromptDismissedSemester || null,
  level: profile.level || null,
  admission_session: profile.admissionSession || null,
  avatar_url: profile.avatarUrl || null,
  phone: profile.phone || null,
}) : ({
  staff_id: profile.staffId || null,
  level: profile.level || null,
  admission_session: profile.admissionSession || null,
  avatar_url: profile.avatarUrl || null,
  phone: profile.phone || null,
});

async function getProfileForUser(user: User): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('profiles').select('user_id,full_name,email,role,department,faculty').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const detailTable = (data as ProfileRow).role === 'student' ? 'students' : 'staff_profiles';
  const { data: details, error: detailsError } = await client.from(detailTable).select('*').eq('user_id', user.id).maybeSingle();
  if (detailsError) throw detailsError;
  const profile = profileFromRow(data as ProfileRow, details || {});
  if (profile.role === 'student' && profile.admissionSession && profile.level) {
    const { data: assignment, error: assignmentError } = await client.from('adviser_assignments').select('adviser_id').eq('department', profile.department).eq('admission_session', profile.admissionSession).eq('level', profile.level).maybeSingle();
    if (assignmentError) throw assignmentError;
    if (assignment) {
      const [{ data: adviser, error: adviserError }, { data: adviserDetails, error: adviserDetailsError }] = await Promise.all([
        client.from('profiles').select('full_name,email,department').eq('user_id', assignment.adviser_id).maybeSingle(),
        client.from('staff_profiles').select('avatar_url').eq('user_id', assignment.adviser_id).maybeSingle(),
      ]);
      if (adviserError) throw adviserError;
      if (adviserDetailsError) throw adviserDetailsError;
      if (adviser) {
        profile.assignedAdviserId = assignment.adviser_id;
        profile.assignedAdviserName = adviser.full_name;
        profile.assignedAdviserEmail = adviser.email;
        profile.assignedAdviserAvatar = adviserDetails?.avatar_url || undefined;
        profile.assignedAdviserTitle = `Level Adviser, ${adviser.department}`;
      }
    }
  }
  return profile;
}

export async function signInAccount(identifier: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    if (import.meta.env.PROD) return { success: false, error: supabaseConfigurationError || 'Live authentication is not configured.' };
    return authenticateUser(identifier, password);
  }
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Authentication service is unavailable.' };
  if (!identifier.includes('@')) return { success: false, error: 'Use the email address on your LASU Advisor account to sign in.' };
  let signInResponse: Awaited<ReturnType<typeof client.auth.signInWithPassword>>;
  try {
    signInResponse = await client.auth.signInWithPassword({ email: identifier.trim().toLowerCase(), password });
  } catch (connectionError) {
    return { success: false, error: describeSupabaseConnectionError(connectionError) };
  }
  const { data, error } = signInResponse;
  if (error) {
    if (error.code === 'email_not_confirmed') {
      return { success: false, error: 'Your email address is not confirmed yet. Open the latest LASU Advisor confirmation email, then try signing in again.' };
    }
    if (error.code === 'invalid_credentials') {
      return { success: false, error: 'Email or password is incorrect. If you just registered, confirm your email from the latest verification message before signing in.' };
    }
    return { success: false, error: error.message };
  }
  try {
    const profile = await getProfileForUser(data.user);
    if (!profile) {
      await client.auth.signOut();
      return { success: false, error: 'Your email is confirmed, but the student profile was not created. Apply the LASU Advisor Supabase migration and check the on_auth_user_created_lasu_profile trigger, then try again.' };
    }
    return { success: true, profile };
  } catch (profileError) {
    await client.auth.signOut();
    return { success: false, error: profileError instanceof Error ? profileError.message : 'Could not load your profile.' };
  }
}

export async function signUpAccount(data: Parameters<typeof registerNewUser>[0]): Promise<AuthResult & { confirmationRequired?: boolean }> {
  if (!isSupabaseConfigured) {
    // Keep the local demo mode available during development, but never let a
    // malformed/partially configured Supabase setup silently create a demo user.
    if (import.meta.env.PROD) return { success: false, error: supabaseConfigurationError || 'Live authentication is not configured.' };
    return registerNewUser(data);
  }
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Authentication service is unavailable.' };
  if (data.role !== 'student') return { success: false, error: 'Staff accounts are provisioned by faculty administrators. Please request an invitation.' };
  const emailRedirectTo = typeof window === 'undefined' ? undefined : new URL('/', window.location.origin).toString();
  let signupResponse: Awaited<ReturnType<typeof client.auth.signUp>>;
  try {
    signupResponse = await client.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        emailRedirectTo,
        data: {
          account_type: 'student',
          full_name: data.name.trim(),
          department: data.department,
          faculty: data.faculty,
          matric_no: data.matricNo,
          level: data.level,
          admission_session: data.admissionSession,
        },
      },
    });
  } catch (connectionError) {
    return { success: false, error: describeSupabaseConnectionError(connectionError) };
  }
  const { data: result, error } = signupResponse;
  if (error) return { success: false, error: error.message };
  if (!result.session) return { success: true, confirmationRequired: true };
  if (!result.user) return { success: false, error: 'Account was created, but its identity could not be loaded. Please sign in.' };
  try {
    const profile = await getProfileForUser(result.user);
    return profile ? { success: true, profile } : { success: false, error: 'Account created, but profile setup has not completed. Try signing in again shortly.' };
  } catch (profileError) {
    return { success: false, error: profileError instanceof Error ? profileError.message : 'Could not create your profile.' };
  }
}

export async function resendSignupConfirmation(email: string): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) {
    return { success: false, error: supabaseConfigurationError || 'Email confirmation is available for live accounts only.' };
  }
  const emailRedirectTo = typeof window === 'undefined' ? undefined : new URL('/', window.location.origin).toString();
  try {
    const { error } = await client.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo },
    });
    return error ? { success: false, error: error.message } : { success: true };
  } catch (connectionError) {
    return { success: false, error: describeSupabaseConnectionError(connectionError) };
  }
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session ? getProfileForUser(data.session.user) : null;
}

export async function signOutAccount(): Promise<void> {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured) {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session?.access_token || null;
}

export async function persistUserProfile(profile: UserProfile): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return;
  const detailTable = profile.role === 'student' ? 'students' : 'staff_profiles';
  const [{ error: identityError }, { error: detailsError }] = await Promise.all([
    client.from('profiles').update(identityToRow(profile)).eq('user_id', profile.id),
    client.from(detailTable).update(detailsToRow(profile)).eq('user_id', profile.id),
  ]);
  if (identityError) throw identityError;
  if (detailsError) throw detailsError;
}

export async function persistResultPromptDismissal(userId: string, semesterKey: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return;
  const { error } = await client.from('students')
    .update({ result_prompt_dismissed_semester: semesterKey })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function loadStudentAdvisers(profile: UserProfile): Promise<Adviser[]> {
  const fallback: Adviser[] = profile.assignedAdviserEmail ? [{
    id: profile.assignedAdviserId || profile.assignedAdviserEmail,
    name: profile.assignedAdviserName || 'Level Adviser',
    title: profile.assignedAdviserTitle || 'Level Adviser',
    department: profile.department,
    email: profile.assignedAdviserEmail,
    avatarUrl: profile.assignedAdviserAvatar || '',
    assignedLevel: profile.level || '',
    assignedSession: profile.admissionSession,
    studentLoad: 0,
    maxLoad: 0,
    status: 'Available',
    avgAdviseeCgpa: 0,
    initials: (profile.assignedAdviserName || 'A').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
  }] : [];
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured || !profile.admissionSession || !profile.level) return fallback;

  const currentLevel = Number(profile.level.match(/^\d+/)?.[0] || 0);
  const levels = [100, 200, 300, 400, 500].filter((level) => level <= currentLevel).map((level) => `${level} Level`);
  const { data: assignments, error: assignmentError } = await client.from('adviser_assignments')
    .select('adviser_id,level,admission_session,department')
    .eq('department', profile.department)
    .eq('admission_session', profile.admissionSession)
    .in('level', levels);
  if (assignmentError) throw assignmentError;
  if (!assignments?.length) return fallback;

  const adviserIds = [...new Set(assignments.map((assignment) => assignment.adviser_id))];
  const [{ data: adviserProfiles, error: adviserError }, { data: staffDetails, error: staffDetailsError }] = await Promise.all([
    client.from('profiles').select('user_id,full_name,email,department').in('user_id', adviserIds),
    client.from('staff_profiles').select('user_id,avatar_url').in('user_id', adviserIds),
  ]);
  if (adviserError) throw adviserError;
  if (staffDetailsError) throw staffDetailsError;
  const byId = new Map((adviserProfiles || []).map((adviser) => [adviser.user_id, adviser]));
  const avatarById = new Map((staffDetails || []).map((row) => [row.user_id, row.avatar_url]));
  const orderedAssignments = [...assignments].sort((a, b) => Number(b.level.match(/^\d+/)?.[0] || 0) - Number(a.level.match(/^\d+/)?.[0] || 0));
  const advisers = orderedAssignments.flatMap((assignment) => {
    const adviser = byId.get(assignment.adviser_id);
    if (!adviser) return [];
    return [{
      id: adviser.user_id,
      name: adviser.full_name,
      title: `Level Adviser, ${adviser.department}`,
      department: adviser.department,
      email: adviser.email,
      avatarUrl: avatarById.get(adviser.user_id) || '',
      assignedLevel: assignment.level,
      assignedSession: assignment.admission_session,
      studentLoad: 0,
      maxLoad: 0,
      status: 'Available' as const,
      avgAdviseeCgpa: 0,
      initials: adviser.full_name.split(/\s+/).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase(),
    }];
  });
  return advisers.sort((a, b) => Number(b.assignedLevel.match(/^\d+/)?.[0] || 0) - Number(a.assignedLevel.match(/^\d+/)?.[0] || 0));
}

export async function loadAcademicAnalytics(): Promise<AcademicAnalytics | null> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return null;
  const { data, error } = await client.rpc('get_academic_analytics');
  if (error) throw error;
  return data as AcademicAnalytics;
}

export async function persistAdviserAssignment(adviserId: string, department: string, admissionSession: string, level: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return;
  const { data: adviser, error: profileError } = await client.from('profiles').select('user_id').eq('email', adviserId).eq('role', 'lecturer').eq('department', department).maybeSingle();
  if (profileError) throw profileError;
  if (!adviser) throw new Error('Select an active lecturer in your department.');
  const { error } = await client.from('adviser_assignments').upsert({ adviser_id: adviser.user_id, department, admission_session: admissionSession, level }, { onConflict: 'department,admission_session,level' });
  if (error) throw error;
}

export async function persistTranscript(
  profile: UserProfile,
  courses: CourseResult[],
  cgpa: number,
  fileName: string,
  file?: File
): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return;
  let filePath: string | null = null;
  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    filePath = `${profile.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await client.storage.from('result-documents').upload(filePath, file, { contentType: 'application/pdf', upsert: false });
    if (uploadError) throw uploadError;
  }
  const { error } = await client.from('student_results').insert({
    user_id: profile.id,
    file_name: fileName,
    file_path: filePath,
    document_student_name: profile.name,
    courses,
    cgpa,
    semester_key: getCurrentSemesterKey(),
  });
  if (error) {
    if (filePath) await client.storage.from('result-documents').remove([filePath]);
    throw error;
  }
}

export async function loadLatestTranscript(userId: string): Promise<{ courses: CourseResult[]; cgpa: number; fileName: string; semesterKey?: string } | null> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return null;
  const { data, error } = await client.from('student_results').select('courses,cgpa,file_name,semester_key').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? { courses: data.courses as CourseResult[], cgpa: Number(data.cgpa), fileName: String(data.file_name), semesterKey: data.semester_key || undefined } : null;
}

export async function persistDirectMessage(input: {
  senderId: string;
  recipientEmail: string;
  body: string;
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return;
  const { data: recipient, error: recipientError } = await client.from('profiles').select('user_id').eq('email', input.recipientEmail).maybeSingle();
  if (recipientError) throw recipientError;
  if (!recipient) throw new Error('This adviser does not have an active messaging account yet.');
  const threadKey = [input.senderId, recipient.user_id].sort().join(':');
  const { error } = await client.from('messages').insert({
    sender_id: input.senderId,
    recipient_id: recipient.user_id,
    body: input.body,
    thread_key: threadKey,
  });
  if (error) throw error;
}

export async function loadDirectMessages(userId: string, role: UserRole = 'student'): Promise<Array<{ email: string; message: { id: string; sender: 'student' | 'adviser'; senderName: string; text: string; timestamp: string; isRead?: boolean }; threadKey: string }>> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return [];
  const { data: rows, error } = await client.from('messages').select('id,sender_id,recipient_id,body,thread_key,created_at,read_at').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at', { ascending: true });
  if (error) throw error;
  if (!rows?.length) return [];
  const otherIds = [...new Set(rows.map((row) => row.sender_id === userId ? row.recipient_id : row.sender_id))];
  const { data: profiles, error: profileError } = await client.from('profiles').select('user_id,email,full_name').in('user_id', otherIds);
  if (profileError) throw profileError;
  const byId = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
  return rows.flatMap((row) => {
    const otherId = row.sender_id === userId ? row.recipient_id : row.sender_id;
    const contact = byId.get(otherId);
    if (!contact) return [];
    return [{
      email: contact.email,
      threadKey: row.thread_key,
      message: {
        id: String(row.id),
        sender: row.sender_id === userId ? (role === 'student' ? 'student' as const : 'adviser' as const) : (role === 'student' ? 'adviser' as const : 'student' as const),
        senderName: row.sender_id === userId ? 'You' : contact.full_name,
        text: row.body,
        timestamp: new Date(row.created_at).toLocaleString(),
        isRead: Boolean(row.read_at),
      },
    }];
  });
}

export async function loadStaffMessageContacts(profile: UserProfile): Promise<MessageContact[]> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured || !['hod', 'dean'].includes(profile.role)) return [];
  const roles = profile.role === 'hod' ? ['lecturer', 'dean'] : ['hod'];
  let query = client.from('profiles').select('user_id,full_name,email,role,department,faculty').in('role', roles);
  if (profile.role === 'hod') query = query.or(`department.eq.${profile.department},faculty.eq.${profile.faculty}`);
  else query = query.eq('faculty', profile.faculty);
  const { data, error } = await query.order('full_name');
  if (error) throw error;
  const ids = (data || []).map((row) => row.user_id);
  const { data: details, error: detailsError } = await client.from('staff_profiles').select('user_id,avatar_url').in('user_id', ids);
  if (detailsError) throw detailsError;
  const avatarById = new Map((details || []).map((row) => [row.user_id, row.avatar_url]));
  return (data || []).map((row) => ({
    id: row.user_id,
    name: row.full_name,
    email: row.email,
    role: row.role as UserRole,
    department: row.department,
    avatarUrl: avatarById.get(row.user_id) || undefined,
  }));
}

export async function loadLecturerConversations(userId: string): Promise<StudentConversation[]> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return [];
  const { data: studentProfiles, error: studentError } = await client.from('profiles')
    .select('user_id,full_name,email,department')
    .eq('role', 'student');
  if (studentError) throw studentError;
  const studentIdsForDetails = (studentProfiles || []).map((student) => student.user_id);
  if (!studentIdsForDetails.length) return [];
  const { data: details, error: detailsError } = await client.from('students')
    .select('user_id,matric_no,level,admission_session,has_uploaded_transcript').in('user_id', studentIdsForDetails);
  if (detailsError) throw detailsError;
  const detailById = new Map((details || []).map((row) => [row.user_id, row]));
  const students = (studentProfiles || []).flatMap((student) => {
    const detail = detailById.get(student.user_id);
    return detail ? [{ ...student, ...detail }] : [];
  });
  if (!students?.length) return [];
  const studentIds = students.map((student) => student.user_id);
  const [{ data: results, error: resultsError }, { data: messageRows, error: messagesError }] = await Promise.all([
    client.from('student_results').select('user_id,cgpa').in('user_id', studentIds).order('created_at', { ascending: false }),
    client.from('messages').select('id,sender_id,recipient_id,body,created_at,read_at').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at', { ascending: true }),
  ]);
  if (resultsError) throw resultsError;
  if (messagesError) throw messagesError;
  const resultByStudent = new Map<string, number>();
  for (const result of results || []) if (!resultByStudent.has(result.user_id)) resultByStudent.set(result.user_id, Number(result.cgpa));
  const studentById = new Map(students.map((student) => [student.user_id, student]));
  const messagesByStudent = new Map<string, StudentConversation['messages']>();
  for (const row of messageRows || []) {
    const studentId = row.sender_id === userId ? row.recipient_id : row.sender_id;
    if (!studentById.has(studentId)) continue;
    const student = studentById.get(studentId)!;
    const thread = messagesByStudent.get(studentId) || [];
    thread.push({
      id: String(row.id),
      sender: row.sender_id === userId ? 'adviser' : 'student',
      senderName: row.sender_id === userId ? 'You' : student.full_name,
      studentId,
      studentName: student.full_name,
      studentMatric: student.matric_no || undefined,
      text: row.body,
      timestamp: new Date(row.created_at).toLocaleString(),
      isRead: Boolean(row.read_at),
    });
    messagesByStudent.set(studentId, thread);
  }
  return students.map((student) => {
    const cgpa = resultByStudent.get(student.user_id) || 0;
    const messages = messagesByStudent.get(student.user_id) || [];
    const latest = messages[messages.length - 1];
    return {
      id: `student-${student.user_id}`,
      studentId: student.user_id,
      studentEmail: student.email,
      studentName: student.full_name,
      matricNo: student.matric_no || '',
      level: student.level || '',
      admissionSession: student.admission_session || undefined,
      department: student.department,
      avatarUrl: '',
      cgpa,
      status: (cgpa < 2.5 ? 'At Risk' : cgpa >= 3.5 ? 'Good Standing' : 'Average') as StudentConversation['status'],
      hasUploadedResult: Boolean(student.has_uploaded_transcript),
      lastMessage: latest?.text || '',
      lastMessageTime: latest?.timestamp || '',
      unreadCount: messages.filter((message) => message.sender === 'student' && !message.isRead).length,
      studentUnreadCount: messages.filter((message) => message.sender === 'adviser' && !message.isRead).length,
      messages,
    };
  });
}

export async function markDirectMessagesRead(userId: string, senderEmail: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return;
  const { data: sender, error: profileError } = await client.from('profiles').select('user_id').eq('email', senderEmail).maybeSingle();
  if (profileError) throw profileError;
  if (!sender) return;
  const { error } = await client.from('messages').update({ read_at: new Date().toISOString() }).eq('sender_id', sender.user_id).eq('recipient_id', userId).is('read_at', null);
  if (error) throw error;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) throw new Error('Password recovery is available for live accounts only. Contact an administrator for demo credentials.');
  if (!email.includes('@')) throw new Error('Enter the email address associated with your account first.');
  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/#login` });
  if (error) throw error;
}


/**
 * Reset password directly for students or staff members
 */
export async function resetPasswordDirectly(
  identifier: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return resetAccountPassword(identifier, newPassword);
  }
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Database service is unavailable.' };

  try {
    const { data: sessionData } = await client.auth.getSession();
    if (sessionData?.session) {
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      resetAccountPassword(identifier, newPassword);
      return { success: true, message: 'Password updated successfully!' };
    }
  } catch (err) {
    // If not authenticated, proceed to reset via email or local accounts
  }

  if (identifier.includes('@')) {
    try {
      await sendPasswordReset(identifier);
      resetAccountPassword(identifier, newPassword);
      return { success: true, message: 'Password reset link sent to your email, and credentials updated.' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not send reset email.';
      // Fallback to local reset if email failed
      const local = resetAccountPassword(identifier, newPassword);
      if (local.success) return local;
      return { success: false, error: msg };
    }
  }

  return resetAccountPassword(identifier, newPassword);
}

/**
 * Register a staff account manually from Admin Portal
 */
export async function registerStaffAccount(
  data: ManualStaffRegistrationPayload
): Promise<AuthResult & { generatedPassword?: string }> {
  if (isSupabaseConfigured) {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Authentication service is unavailable.' };
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData.session?.access_token) return { success: false, error: 'Sign in with an authorized administrator account before registering staff.' };
    try {
      const response = await fetch('/.netlify/functions/admin-create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionData.session.access_token}` },
        body: JSON.stringify({ ...data, password: data.password || '' }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) return { success: false, error: result.error || 'Staff registration failed.' };
      const profileRow = result.staff;
      const profile: UserProfile = {
        id: profileRow.id, name: profileRow.full_name, email: profileRow.email, role: profileRow.role,
        department: profileRow.department, faculty: profileRow.faculty, staffId: profileRow.staff_id,
        level: profileRow.level || undefined, phone: profileRow.phone || undefined, avatarUrl: '', mustChangePassword: true,
      };
      return { success: true, profile, generatedPassword: data.password };
    } catch (error) {
      return { success: false, error: describeSupabaseConnectionError(error) };
    }
  }
  return registerStaffManually(data);
}

export async function loadStaffDirectory(): Promise<StaffMember[]> {
  if (!isSupabaseConfigured) return getStaffDirectory();
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('profiles')
    .select('user_id,full_name,email,role,department,faculty,created_at')
    .in('role', ['lecturer', 'hod', 'dean']);
  if (error) throw error;
  const ids = (data || []).map((row) => row.user_id);
  const { data: details, error: detailsError } = ids.length ? await client.from('staff_profiles').select('user_id,staff_id,level,admission_session,phone').in('user_id', ids) : { data: [], error: null };
  if (detailsError) throw detailsError;
  const detailById = new Map((details || []).map((row) => [row.user_id, row]));
  return (data || []).map((row) => ({
    id: row.user_id, name: row.full_name, email: row.email, staffId: detailById.get(row.user_id)?.staff_id || '',
    role: row.role, department: row.department, faculty: row.faculty,
    assignedLevel: detailById.get(row.user_id)?.level || undefined, assignedSession: detailById.get(row.user_id)?.admission_session || undefined,
    phone: detailById.get(row.user_id)?.phone || undefined, avatarUrl: '', status: 'Active',
    dateRegistered: row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
  }));
}

export async function loadAdministrators(): Promise<AdministratorProfile[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('profiles')
    .select('user_id,full_name,email,department,faculty')
    .eq('role', 'admin').order('full_name');
  if (error) throw error;
  const ids = (data || []).map((row) => row.user_id);
  const { data: details, error: detailsError } = ids.length ? await client.from('staff_profiles').select('user_id,staff_id,phone').in('user_id', ids) : { data: [], error: null };
  if (detailsError) throw detailsError;
  const detailById = new Map((details || []).map((row) => [row.user_id, row]));
  return (data || []).map((row) => ({
    id: row.user_id, name: row.full_name, email: row.email, staffId: detailById.get(row.user_id)?.staff_id || '',
    department: row.department, faculty: row.faculty, phone: detailById.get(row.user_id)?.phone || undefined,
  }));
}

export async function registerAdministratorAccount(payload: AdministratorRegistrationPayload): Promise<{ success: boolean; error?: string; generatedPassword?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Administrator registration requires the live Supabase service.' };
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Authentication service is unavailable.' };
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) return { success: false, error: 'Sign in as a system administrator before registering another administrator.' };
  try {
    const response = await fetch('/.netlify/functions/admin-register-administrator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return response.ok && result.success
      ? { success: true, generatedPassword: payload.password }
      : { success: false, error: result.error || 'Administrator registration failed.' };
  } catch (error) {
    return { success: false, error: describeSupabaseConnectionError(error) };
  }
}

export type AdministratorProfileUpdate = Omit<AdministratorProfile, 'id' | 'email'>;

export async function updateAdministratorProfile(id: string, updates: AdministratorProfileUpdate): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return { success: false, error: 'Administrator profiles require the live Supabase service.' };
  const [{ error }, { error: detailError }] = await Promise.all([
    client.from('profiles').update({ full_name: updates.name.trim(), department: updates.department, faculty: updates.faculty }).eq('user_id', id).eq('role', 'admin'),
    client.from('staff_profiles').update({ staff_id: updates.staffId.trim().toUpperCase(), phone: updates.phone?.trim() || null }).eq('user_id', id),
  ]);
  return error || detailError ? { success: false, error: error?.message || detailError?.message } : { success: true };
}

export type StaffProfileUpdate = Pick<ManualStaffRegistrationPayload, 'name' | 'staffId' | 'role' | 'department' | 'faculty'>
  & Pick<ManualStaffRegistrationPayload, 'assignedLevel' | 'assignedSession' | 'phone'>;

export async function updateStaffProfile(userId: string, updates: StaffProfileUpdate): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return updateStaffMember(userId, updates);
  }
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Database service is unavailable.' };
  const [{ error }, { error: detailError }] = await Promise.all([
    client.from('profiles').update({ full_name: updates.name.trim(), role: updates.role, department: updates.department, faculty: updates.faculty }).eq('user_id', userId),
    client.from('staff_profiles').update({ staff_id: updates.staffId.trim().toUpperCase() || null, level: updates.assignedLevel || null, admission_session: updates.assignedSession || null, phone: updates.phone?.trim() || null }).eq('user_id', userId),
  ]);
  return error || detailError ? { success: false, error: error?.message || detailError?.message } : { success: true };
}

const DEPARTMENT_HOD_STORAGE_KEY = 'lasu_department_hod_assignments';

export async function loadDepartmentHodAssignments(): Promise<Record<string, StaffMember>> {
  if (!isSupabaseConfigured) {
    try {
      const ids = JSON.parse(localStorage.getItem(DEPARTMENT_HOD_STORAGE_KEY) || '{}') as Record<string, string>;
      const staff = getStaffDirectory();
      return Object.entries(ids).reduce<Record<string, StaffMember>>((result, [department, id]) => {
        const hod = staff.find((item) => item.id === id && item.role === 'hod');
        if (hod) result[department] = hod;
        return result;
      }, {});
    } catch { return {}; }
  }
  const client = getSupabaseClient();
  if (!client) return {};
  const { data: assignments, error } = await client.from('department_hod_assignments').select('department,hod_id');
  if (error) throw error;
  if (!assignments?.length) return {};
  const staff = await loadStaffDirectory();
  const byId = new Map(staff.map((member) => [member.id, member]));
  return assignments.reduce<Record<string, StaffMember>>((result, assignment) => {
    const hod = byId.get(assignment.hod_id);
    if (hod) result[assignment.department] = hod;
    return result;
  }, {});
}

export async function setDepartmentHod(department: string, hodId: string | null): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    try {
      const assignments = JSON.parse(localStorage.getItem(DEPARTMENT_HOD_STORAGE_KEY) || '{}') as Record<string, string>;
      Object.entries(assignments).forEach(([currentDepartment, currentHod]) => {
        if (currentHod === hodId) delete assignments[currentDepartment];
      });
      if (hodId) assignments[department] = hodId;
      else delete assignments[department];
      localStorage.setItem(DEPARTMENT_HOD_STORAGE_KEY, JSON.stringify(assignments));
      return { success: true };
    } catch { return { success: false, error: 'Could not save the department HOD assignment.' }; }
  }
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Database service is unavailable.' };
  const { error } = await client.rpc('set_department_hod', { target_department: department, target_hod_id: hodId });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function updateOwnPassword(password: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Authentication service is unavailable.' };
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) return { success: false, error: 'Sign in again to update your password.' };
  try {
    const response = await fetch('/.netlify/functions/staff-complete-password-change', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify({ password }),
    });
    const result = await response.json();
    return response.ok && result.success ? { success: true } : { success: false, error: result.error || 'Could not update your password.' };
  } catch (error) { return { success: false, error: describeSupabaseConnectionError(error) }; }
}

export async function resetStaffCredentials(staffId: string, password: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Authentication service is unavailable.' };
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) return { success: false, error: 'Sign in again before resetting staff credentials.' };
  try {
    const response = await fetch('/.netlify/functions/admin-reset-staff-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify({ staffId, password }),
    });
    const result = await response.json();
    return response.ok && result.success ? { success: true } : { success: false, error: result.error || 'Could not reset staff password.' };
  } catch (error) { return { success: false, error: describeSupabaseConnectionError(error) }; }
}

export { getStaffDirectory, updateStaffMember, deleteStaffMember, resetAccountPassword, clearMustChangePassword };
