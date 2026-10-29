import { UserProfile, UserRole, EntryMode } from '../types';
import { getStudentCohortSession } from './academicUtils';
import {
  STUDENT_AVATAR,
  ADVISER_AVATAR,
  LECTURER_AVATAR,
  DEAN_AVATAR,
  ADVISEES_LIST,
} from '../data/mockData';

export interface RegisteredAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  faculty: string;
  matricNo?: string;
  staffId?: string;
  level?: string;
  session?: string;
  admissionSession?: string;
  entryMode?: EntryMode;
  assignedAdviserId?: string;
  assignedAdviserName?: string;
  assignedAdviserEmail?: string;
  assignedAdviserAvatar?: string;
  assignedAdviserTitle?: string;
  avatarUrl: string;
  phone?: string;
  hasUploadedTranscript?: boolean;
}

const STORAGE_KEY = 'lasu_registered_accounts_v2';

// Seed authentic registered accounts for all LASU faculties, staff, and students
const DEFAULT_REGISTERED_ACCOUNTS: RegisteredAccount[] = [
  {
    id: 'usr_student_01',
    name: 'Michael Adebayo',
    email: 'm.adebayo@lasu.edu.ng',
    password: 'password123',
    role: 'student',
    department: 'Computer Science',
    faculty: 'Computing & Information Technology',
    matricNo: 'CSC/21/0045',
    level: '300 Level',
    admissionSession: '2021/2022',
    entryMode: 'utme',
    assignedAdviserId: 'adv_sarah',
    assignedAdviserName: 'Dr. Sarah Jenkins',
    assignedAdviserEmail: 's.jenkins@lasu.edu.ng',
    assignedAdviserAvatar: ADVISER_AVATAR,
    assignedAdviserTitle: 'Assoc. Prof, Computer Science',
    avatarUrl: STUDENT_AVATAR,
    phone: '+234 803 456 7890',
    hasUploadedTranscript: true,
  },
  {
    id: 'usr_lecturer_01',
    name: 'Dr. Sarah Jenkins',
    email: 's.jenkins@lasu.edu.ng',
    password: 'password123',
    role: 'lecturer',
    department: 'Computer Science',
    faculty: 'Computing & Information Technology',
    staffId: 'STAFF/CSC/088',
    level: '300 Level',
    avatarUrl: ADVISER_AVATAR,
    phone: '+234 802 111 2233',
  },
  {
    id: 'usr_hod_01',
    name: 'Dr. James Miller',
    email: 'j.miller@lasu.edu.ng',
    password: 'password123',
    role: 'hod',
    department: 'Computer Science',
    faculty: 'Computing & Information Technology',
    staffId: 'HOD/CSC/012',
    avatarUrl: LECTURER_AVATAR,
  },
  {
    id: 'usr_dean_01',
    name: 'Prof. A. Chen',
    email: 'a.chen@lasu.edu.ng',
    password: 'password123',
    role: 'dean',
    department: 'Computer Science',
    faculty: 'Faculty of Computing & Information Technology',
    staffId: 'DEAN/CIT/001',
    avatarUrl: DEAN_AVATAR,
  },
  // Additional registered advisees with Direct Entry and UTME profiles
  {
    id: 'usr_student_02',
    name: 'David Okafor',
    email: 'd.okafor@lasu.edu.ng',
    password: 'password123',
    role: 'student',
    department: 'Computer Science',
    faculty: 'Computing & Information Technology',
    matricNo: 'CSC/21/0082',
    level: '300 Level',
    admissionSession: '2021/2022',
    entryMode: 'utme',
    assignedAdviserId: 'adv_sarah',
    assignedAdviserName: 'Dr. Sarah Jenkins',
    assignedAdviserEmail: 's.jenkins@lasu.edu.ng',
    assignedAdviserAvatar: ADVISER_AVATAR,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    hasUploadedTranscript: true,
  },
  {
    id: 'usr_student_03',
    name: 'Amina Bello',
    email: 'a.bello@lasu.edu.ng',
    password: 'password123',
    role: 'student',
    department: 'Computer Science',
    faculty: 'Computing & Information Technology',
    matricNo: 'CSC/22/0114',
    level: '300 Level',
    admissionSession: '2022/2023',
    entryMode: 'direct_entry', // DE admitted in 2022/2023 starts at 200L, reaches 300L in 2023/24
    assignedAdviserId: 'adv_sarah',
    assignedAdviserName: 'Dr. Sarah Jenkins',
    assignedAdviserEmail: 's.jenkins@lasu.edu.ng',
    assignedAdviserAvatar: ADVISER_AVATAR,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    hasUploadedTranscript: true,
  },
];

export function getRegisteredAccounts(): RegisteredAccount[] {
  if (typeof window === 'undefined') return DEFAULT_REGISTERED_ACCOUNTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_REGISTERED_ACCOUNTS));
      return DEFAULT_REGISTERED_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load registered accounts from storage', e);
  }
  return DEFAULT_REGISTERED_ACCOUNTS;
}

export function saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save registered accounts', e);
  }
}

/**
 * Propagates a newly assigned adviser to all registered student accounts in that session or level.
 */
export function propagateAdviserAssignmentToStoredAccounts(
  cohort: { session: string; level: string; department: string },
  newAdviser: { id: string; name: string; email: string; avatarUrl: string; title?: string }
): number {
  const accounts = getRegisteredAccounts();
  let updatedCount = 0;

  const updated = accounts.map((acc) => {
    if (acc.role !== 'student') return acc;

    const matchesLevel = acc.level === cohort.level;
    const matchesSession = acc.admissionSession === cohort.session;
    const matchesDepartment = acc.department === cohort.department;

    if (matchesLevel && matchesSession && matchesDepartment) {
      updatedCount++;
      return {
        ...acc,
        assignedAdviserId: newAdviser.id,
        assignedAdviserName: newAdviser.name,
        assignedAdviserEmail: newAdviser.email,
        assignedAdviserAvatar: newAdviser.avatarUrl,
        assignedAdviserTitle: newAdviser.title || 'Academic Level Adviser',
      };
    }
    return acc;
  });

  if (updatedCount > 0) {
    saveRegisteredAccounts(updated);
    // Background notification to Node.js backend
    if (typeof window !== 'undefined') {
      fetch('/api/advisers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adviserId: newAdviser.id,
          level: cohort.level,
          session: cohort.session,
          department: cohort.department,
          studentLoad: updatedCount,
        }),
      }).catch(() => {
        // Fallback gracefully to client-side persistence
      });
    }
  }
  return updatedCount;
}

export interface AuthResult {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}

export function authenticateUser(
  identifier: string,
  passwordAttempt: string,
  expectedRole?: UserRole
): AuthResult {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = passwordAttempt.trim();

  if (!cleanId) {
    return {
      success: false,
      error: 'Please enter your registered Email address, Matric Number, or Staff ID.',
    };
  }

  if (!cleanPass) {
    return {
      success: false,
      error: 'Please enter your account password.',
    };
  }

  const accounts = getRegisteredAccounts();

  // Match by email, matricNo, staffId (case insensitive)
  const matched = accounts.find((acc) => {
    const emailMatch = acc.email.toLowerCase() === cleanId;
    const matricMatch = acc.matricNo && acc.matricNo.toLowerCase() === cleanId;
    const staffMatch = acc.staffId && acc.staffId.toLowerCase() === cleanId;
    return emailMatch || matricMatch || staffMatch;
  });

  if (!matched) {
    return {
      success: false,
      error: `Access Denied: No registered account found for "${identifier}". Only pre-registered LASU students and authorized staff can sign in. Please verify your details or create a new account.`,
    };
  }

  // Verify password (in client storage)
  if (matched.password !== cleanPass) {
    return {
      success: false,
      error: 'Authentication Failed: Incorrect password for this account. Please verify your credentials.',
    };
  }

  const finalRole = matched.role;

  const profile: UserProfile = {
    id: matched.id,
    name: matched.name,
    email: matched.email,
    role: finalRole,
    department: matched.department,
    faculty: matched.faculty,
    matricNo: matched.matricNo,
    staffId: matched.staffId,
    level: matched.level,
    admissionSession: matched.admissionSession,
    entryMode: matched.entryMode,
    assignedAdviserId: matched.assignedAdviserId,
    assignedAdviserName: matched.assignedAdviserName,
    assignedAdviserEmail: matched.assignedAdviserEmail,
    assignedAdviserAvatar: matched.assignedAdviserAvatar,
    assignedAdviserTitle: matched.assignedAdviserTitle,
    avatarUrl: matched.avatarUrl,
    phone: matched.phone,
    hasUploadedTranscript: matched.hasUploadedTranscript ?? false,
  };

  return {
    success: true,
    profile,
  };
}

export function registerNewUser(data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  faculty: string;
  matricNo?: string;
  staffId?: string;
  level?: string;
  admissionSession?: string;
  entryMode?: EntryMode;
  assignedAdviserId?: string;
  assignedAdviserName?: string;
  assignedAdviserEmail?: string;
  assignedAdviserAvatar?: string;
  hasUploadedTranscript?: boolean;
  transcriptFileName?: string;
}): AuthResult {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();
  const cleanPass = data.password.trim();
  const cleanId = (data.matricNo || data.staffId || '').trim();

  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'Please enter a valid full name.' };
  }

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid institutional or personal email address.' };
  }

  if (!cleanPass || cleanPass.length < 5) {
    return { success: false, error: 'Password must be at least 5 characters in length.' };
  }

  if (!cleanId) {
    return {
      success: false,
      error: data.role === 'student' ? 'Matriculation Number is required.' : 'Staff ID is required.',
    };
  }

  const accounts = getRegisteredAccounts();

  // Check duplicate
  const exists = accounts.some(
    (acc) =>
      acc.email.toLowerCase() === cleanEmail ||
      (acc.matricNo && acc.matricNo.toLowerCase() === cleanId.toLowerCase()) ||
      (acc.staffId && acc.staffId.toLowerCase() === cleanId.toLowerCase())
  );

  if (exists) {
    return {
      success: false,
      error: 'An account with this email address or Matric/Staff ID is already registered. Please sign in.',
    };
  }

  const computedCohortSession =
    data.role === 'student'
      ? getStudentCohortSession(data.admissionSession || '2024/2025', data.entryMode || 'utme')
      : undefined;

  const newAccount: RegisteredAccount = {
    id: `usr_${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    password: cleanPass,
    role: data.role,
    department: data.department,
    faculty: data.faculty,
    matricNo: data.role === 'student' ? cleanId : undefined,
    staffId: data.role !== 'student' ? cleanId : undefined,
    level: data.role === 'student' ? (data.level || '100 Level') : undefined,
    session: computedCohortSession,
    admissionSession: data.admissionSession || '2024/2025',
    entryMode: data.entryMode || 'utme',
    assignedAdviserId: data.assignedAdviserId || 'adv_sarah',
    assignedAdviserName: data.assignedAdviserName || 'Dr. Sarah Jenkins',
    assignedAdviserEmail: data.assignedAdviserEmail || 's.jenkins@lasu.edu.ng',
    assignedAdviserAvatar: data.assignedAdviserAvatar || ADVISER_AVATAR,
    assignedAdviserTitle: 'Assoc. Prof, Level Adviser',
    avatarUrl:
      data.role === 'student'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : data.role === 'dean'
        ? DEAN_AVATAR
        : data.role === 'hod'
        ? LECTURER_AVATAR
        : ADVISER_AVATAR,
    hasUploadedTranscript: !!data.hasUploadedTranscript,
  };

  accounts.unshift(newAccount);
  saveRegisteredAccounts(accounts);

  // Background registration to Node.js backend
  if (typeof window !== 'undefined') {
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: newAccount.role,
        name: newAccount.name,
        email: newAccount.email,
        matricNo: newAccount.matricNo,
        staffId: newAccount.staffId,
        department: newAccount.department,
        faculty: newAccount.faculty,
        level: newAccount.level,
        admissionSession: newAccount.admissionSession,
        entryMode: newAccount.entryMode,
      }),
    }).catch(() => {
      // Fallback gracefully
    });
  }

  const profile: UserProfile = {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    role: newAccount.role,
    department: newAccount.department,
    faculty: newAccount.faculty,
    matricNo: newAccount.matricNo,
    staffId: newAccount.staffId,
    level: newAccount.level,
    session: newAccount.session,
    admissionSession: newAccount.admissionSession,
    entryMode: newAccount.entryMode,
    assignedAdviserId: newAccount.assignedAdviserId,
    assignedAdviserName: newAccount.assignedAdviserName,
    assignedAdviserEmail: newAccount.assignedAdviserEmail,
    assignedAdviserAvatar: newAccount.assignedAdviserAvatar,
    assignedAdviserTitle: newAccount.assignedAdviserTitle,
    avatarUrl: newAccount.avatarUrl,
    hasUploadedTranscript: newAccount.hasUploadedTranscript ?? false,
    transcriptFileName: data.transcriptFileName,
  };

  return {
    success: true,
    profile,
  };
}
