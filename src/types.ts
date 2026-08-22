export type UserRole = 'student' | 'lecturer' | 'hod' | 'dean' | 'admin';
export type ThemeMode = 'light' | 'dark' | 'system';

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
  level?: string;
  avatarUrl: string;
  phone?: string;
  hasUploadedTranscript?: boolean;
  transcriptUploadDate?: string;
  transcriptFileName?: string;
}

export interface CourseResult {
  code: string;
  title: string;
  units: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '-';
  score: number | string;
  status: 'Passed' | 'Failed' | 'In Progress';
  semester: 'Fall 2024' | 'Spring 2024' | 'Fall 2023' | 'Spring 2023';
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

export interface Adviser {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  avatarUrl: string;
  assignedLevel: string;
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
  text: string;
  timestamp: string;
  isUrgent?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  urgent: boolean;
  type: 'nudge' | 'alert' | 'system' | 'deadline';
}
