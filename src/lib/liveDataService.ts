import { User } from '@supabase/supabase-js';
import { CourseResult, MessageContact, StudentConversation, UserProfile, UserRole } from '../types';
import { AuthResult, authenticateUser, registerNewUser } from './authService';
import { describeSupabaseConnectionError, getSupabaseClient, isSupabaseConfigured, supabaseConfigurationError } from './supabaseClient';

type ProfileRow = {
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  faculty: string;
  matric_no?: string | null;
  staff_id?: string | null;
  level?: string | null;
  admission_session?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  has_uploaded_transcript?: boolean | null;
  transcript_file_name?: string | null;
};

const profileFromRow = (row: ProfileRow): UserProfile => ({
  id: row.user_id,
  name: row.full_name,
  email: row.email,
  role: row.role,
  department: row.department,
  faculty: row.faculty,
  matricNo: row.matric_no || undefined,
  staffId: row.staff_id || undefined,
  level: row.level || undefined,
  admissionSession: row.admission_session || undefined,
  avatarUrl: row.avatar_url || '',
  phone: row.phone || undefined,
  hasUploadedTranscript: row.has_uploaded_transcript || false,
  transcriptFileName: row.transcript_file_name || undefined,
});

const profileToRow = (profile: UserProfile) => ({
  user_id: profile.id,
  full_name: profile.name,
  email: profile.email,
  role: profile.role,
  department: profile.department,
  faculty: profile.faculty,
  matric_no: profile.matricNo || null,
  staff_id: profile.staffId || null,
  level: profile.level || null,
  admission_session: profile.admissionSession || null,
  avatar_url: profile.avatarUrl || null,
  phone: profile.phone || null,
});

async function getProfileForUser(user: User): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const profile = profileFromRow(data as ProfileRow);
  if (profile.role === 'student' && profile.admissionSession && profile.level) {
    const { data: assignment, error: assignmentError } = await client.from('adviser_assignments').select('adviser_id').eq('department', profile.department).eq('admission_session', profile.admissionSession).eq('level', profile.level).maybeSingle();
    if (assignmentError) throw assignmentError;
    if (assignment) {
      const { data: adviser, error: adviserError } = await client.from('profiles').select('full_name,email,avatar_url,department').eq('user_id', assignment.adviser_id).maybeSingle();
      if (adviserError) throw adviserError;
      if (adviser) {
        profile.assignedAdviserId = assignment.adviser_id;
        profile.assignedAdviserName = adviser.full_name;
        profile.assignedAdviserEmail = adviser.email;
        profile.assignedAdviserAvatar = adviser.avatar_url || undefined;
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
  const { error } = await client.from('profiles').update(profileToRow(profile)).eq('user_id', profile.id);
  if (error) throw error;
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
  });
  if (error) {
    if (filePath) await client.storage.from('result-documents').remove([filePath]);
    throw error;
  }
}

export async function loadLatestTranscript(userId: string): Promise<{ courses: CourseResult[]; cgpa: number; fileName: string } | null> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return null;
  const { data, error } = await client.from('student_results').select('courses,cgpa,file_name').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? { courses: data.courses as CourseResult[], cgpa: Number(data.cgpa), fileName: String(data.file_name) } : null;
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
  let query = client.from('profiles').select('user_id,full_name,email,role,department,avatar_url').in('role', roles);
  if (profile.role === 'hod') query = query.or(`department.eq.${profile.department},faculty.eq.${profile.faculty}`);
  else query = query.eq('faculty', profile.faculty);
  const { data, error } = await query.order('full_name');
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.user_id,
    name: row.full_name,
    email: row.email,
    role: row.role as UserRole,
    department: row.department,
    avatarUrl: row.avatar_url || undefined,
  }));
}

export async function loadLecturerConversations(userId: string): Promise<StudentConversation[]> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) return [];
  const { data: students, error: studentError } = await client.from('profiles')
    .select('user_id,full_name,email,department,matric_no,level,admission_session,has_uploaded_transcript')
    .eq('role', 'student');
  if (studentError) throw studentError;
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
