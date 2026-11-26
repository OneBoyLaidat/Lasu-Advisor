import { UserProfile, UserRole } from '../types';
import {
  STUDENT_AVATAR,
  ADVISER_AVATAR,
  LECTURER_AVATAR,
  DEAN_AVATAR,
} from './assets';

export const DEFAULT_PROFILES: Record<UserRole, UserProfile> = {
  student: {
    id: 'usr_student_01',
    name: 'Michael Adebayo',
    role: 'student',
    department: 'Computer Science',
    faculty: 'Faculty of Computing & Information Technology',
    matricNo: 'CSC/21/0045',
    session: '2025/2026',
    admissionSession: '2021/2022',
    level: '300 Level',
    avatarUrl: STUDENT_AVATAR,
    phone: '+234 803 456 7890',
    hasUploadedTranscript: false,
  },
  lecturer: {
    id: 'usr_lecturer_01',
    name: 'Dr. Sarah Jenkins',
    role: 'lecturer',
    department: 'Computer Science',
    faculty: 'Faculty of Computing & Information Technology',
    staffId: 'STAFF/CSC/088',
    avatarUrl: ADVISER_AVATAR,
    level: '300 Level',
    phone: '+234 802 111 2233',
  },
  hod: {
    id: 'usr_hod_01',
    name: 'Dr. James Miller',
    role: 'hod',
    department: 'Computer Science',
    faculty: 'Faculty of Computing & Information Technology',
    staffId: 'HOD/CSC/012',
    avatarUrl: LECTURER_AVATAR,
  },
  dean: {
    id: 'usr_dean_01',
    name: 'Prof. A. Chen',
    role: 'dean',
    department: 'Computer Science',
    faculty: 'Faculty of Computing & Information Technology',
    staffId: 'DEAN/CIT/001',
    avatarUrl: DEAN_AVATAR,
  },
  admin: {
    id: 'usr_admin_01',
    name: 'LASU System Admin',
    role: 'admin',
    department: 'Computer Science',
    faculty: 'Faculty of Computing & Information Technology',
    staffId: 'ADMIN/SYS/001',
    avatarUrl: LECTURER_AVATAR,
    hasLoggedInBefore: true,
  },
};

