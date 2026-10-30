export type UserRole = 'student' | 'lecturer' | 'hod' | 'dean' | 'admin';
export type ThemeMode = 'light' | 'dark' | 'system';
export type EntryMode = 'utme' | 'direct_entry';

export const LASU_DEPARTMENTS = [
  'Software Engineering',
  'Cybersecurity',
  'Data Science',
  'Information and Communication Technology',
  'Computer Science',
] as const;

export type LasuDepartment = (typeof LASU_DEPARTMENTS)[number];

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  faculty: string;
  matricNo?: string;
  staffId?: string;
  session?: string;
  admissionSession?: string;
  entryMode?: EntryMode;
  level?: string;
  avatarUrl: string;
  phone?: string;
  hasUploadedTranscript?: boolean;
  resultPromptDismissedSemester?: string;
  transcriptUploadDate?: string;
  transcriptFileName?: string;
  assignedAdviserId?: string;
  assignedAdviserName?: string;
  assignedAdviserEmail?: string;
  assignedAdviserAvatar?: string;
  assignedAdviserTitle?: string;
  archivedChats?: ArchivedChatThread[];
}

export interface CourseResult {
  code: string;
  title: string;
  units: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '-';
  score: number | string;
  status: 'Passed' | 'Failed' | 'In Progress';
  semester: string;
  academicYear: string;
  gpPoints: number;
}

export interface StudentStats {
  cgpa: number;
  cgpaDelta: number;
  currentGpa: number;
  projGpa: number;
  totalUnits: number;
  passedUnits: number;
  carryoverUnits: number;
  cohortPercentile: string;
  weeksCompleted: number;
  totalWeeks: number;
  assessmentsDone: number;
  totalAssessments: number;
}

export interface AcademicAnalytics {
  studentCount: number;
  studentsWithResults: number;
  meanCgpa: number | null;
  classifications: Array<{ name: string; count: number }>;
  courses: Array<{ code: string; title: string; attempts: number; passRate: number }>;
}

export interface Adviser {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  avatarUrl: string;
  assignedLevel: string;
  assignedSession?: string;
  studentLoad: number;
  maxLoad: number;
  status: 'Optimal' | 'Overloaded' | 'Available';
  avgAdviseeCgpa: number;
  initials: string;
}

export interface Advisee {
  id: string;
  name: string;
  matricNo: string;
  department: string;
  level: string;
  admissionSession?: string;
  entryMode?: EntryMode;
  assignedAdviserId?: string;
  assignedAdviserName?: string;
  cgpa: number;
  status: 'Good Standing' | 'At Risk' | 'Average';
  carryovers: number;
  avatarUrl?: string;
  initials: string;
  gpa: number;
  failedCourses?: string[];
  lastReviewDate?: string;
  notes?: string;
  hasUploadedResult?: boolean;
  resultUploadedDate?: string;
  uploadedFileName?: string;
  lastNudgedAt?: string;
  nudgeCount?: number;
  parsedCoursesCount?: number;
}

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  time: string;
  date: string;
  attendees: string[];
  reminder: boolean;
  isUrgent?: boolean;
  studentName?: string;
  studentAvatar?: string;
}

export interface CourseSuccessRate {
  code: string;
  title: string;
  passRate: number;
  rating: 'High' | 'Avg' | 'Low';
}

export interface FacultyPerformance {
  faculty: string;
  dean: string;
  studentCount: number;
  targetVariance: string;
  isPositiveVariance: boolean;
  status: 'Exceeding' | 'On Track' | 'Review Required';
  icon: string;
  bgColor: string;
  textColor: string;
}

export interface DepartmentPerformance {
  department: string;
  hod: string;
  avgCgpa: number;
  studentCount: number;
  faculty: string;
}

export interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  adviserName: string;
  date: string;
  time: string;
  topic: string;
  format: 'In-person' | 'Virtual (Google Meet)' | 'Phone Call';
  status: 'Confirmed' | 'Pending' | 'Completed';
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'adviser' | 'system';
  senderName: string;
  senderRole?: string;
  studentId?: string;
  studentName?: string;
  studentMatric?: string;
  recipientName?: string;
  adviserId?: string;
  adviserName?: string;
  text: string;
  timestamp: string;
  isUrgent?: boolean;
  isRead?: boolean;
  isArchived?: boolean;
  archivedNotice?: string;
}

export interface ArchivedChatThread {
  id: string;
  adviserId: string;
  adviserName: string;
  adviserTitle?: string;
  adviserAvatar?: string;
  archivedAt: string;
  cohortLevel: string;
  reason: string;
  messages: ChatMessage[];
}

export interface StudentConversation {
  id: string;
  studentId: string;
  studentEmail?: string;
  studentName: string;
  matricNo: string;
  level: string;
  admissionSession?: string;
  entryMode?: EntryMode;
  department: string;
  avatarUrl: string;
  cgpa: number;
  status: 'Good Standing' | 'At Risk' | 'Average';
  hasUploadedResult: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  studentUnreadCount?: number;
  messages: ChatMessage[];
  archivedThreads?: ArchivedChatThread[];
  currentAdviserId?: string;
  currentAdviserName?: string;
}

export interface MessageContact {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  urgent: boolean;
  type: 'nudge' | 'alert' | 'system' | 'deadline';
}
