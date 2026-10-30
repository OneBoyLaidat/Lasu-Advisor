import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, StaffMember, ManualStaffRegistrationPayload, LASU_DEPARTMENTS } from '../types';
import { loadStaffDirectory, loadDepartmentHodAssignments, setDepartmentHod, updateStaffProfile, registerStaffAccount, resetPasswordDirectly, resetStaffCredentials, updateStaffMember, deleteStaffMember, StaffProfileUpdate } from '../lib/liveDataService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface AdminPortalViewProps {
  userProfile: UserProfile;
  userRole: UserRole;
  onNavigateToTab?: (tab: string) => void;
}

const generateStaffPassword = (): string => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$!&*';
  const all = upper + lower + digits + symbols;
  const pick = (chars: string) => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length];
  const password = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (password.length < 12) password.push(pick(all));
  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }
  return password.join('');
};

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  userProfile,
  userRole,
  onNavigateToTab,
}) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [departmentHods, setDepartmentHods] = useState<Record<string, StaffMember>>({});
  const [hodSelections, setHodSelections] = useState<Record<string, string>>({});
  const [savingDepartment, setSavingDepartment] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState<StaffProfileUpdate | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  
  // Registration Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formStaffId, setFormStaffId] = useState<string>('');
  const [formRole, setFormRole] = useState<'lecturer' | 'hod' | 'dean'>('lecturer');
  const [formDept, setFormDept] = useState<string>(userProfile.department || 'Computer Science');
  const [formFaculty, setFormFaculty] = useState<string>(userProfile.faculty || 'Faculty of Computing & Information Technology');
  const [formLevel, setFormLevel] = useState<string>('100 Level (1AD)');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>(generateStaffPassword);
  
  // Form submission feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    staffId: string;
    password: string;
    role: string;
  } | null>(null);

  // Password Reset for Staff Modal state
  const [resetTargetStaff, setResetTargetStaff] = useState<StaffMember | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState<string>('');
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [isResettingStaff, setIsResettingStaff] = useState<boolean>(false);

  // Success toast notification
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Load staff data on mount
  const refreshStaffList = async () => {
    try {
      const [staff, hods] = await Promise.all([loadStaffDirectory(), loadDepartmentHodAssignments()]);
      setStaffList(staff);
      setDepartmentHods(hods);
      setHodSelections(LASU_DEPARTMENTS.reduce<Record<string, string>>((selection, department) => {
        selection[department] = hods[department]?.id || '';
        return selection;
      }, {}));
      setPortalError(null);
    }
    catch (error) { setPortalError(error instanceof Error ? error.message : 'Could not load staff directory.'); }
  };

  useEffect(() => {
    void refreshStaffList();
  }, []);

  // Filtered staff list
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.staffId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      selectedRoleFilter === 'All' ||
      (selectedRoleFilter === 'hod' && staff.role === 'hod') ||
      (selectedRoleFilter === 'lecturer' && staff.role === 'lecturer') ||
      (selectedRoleFilter === 'dean' && staff.role === 'dean');
    const matchesDept =
      selectedDeptFilter === 'All' || staff.department === selectedDeptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  // Calculate statistics
  const totalStaffCount = staffList.length;
  const assignedDepartmentHodCount = LASU_DEPARTMENTS.filter((department) => Boolean(departmentHods[department])).length;
  const lecturerCount = staffList.filter((s) => s.role === 'lecturer').length;
  const deanCount = staffList.filter((s) => s.role === 'dean').length;

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    try {
      const payload: ManualStaffRegistrationPayload = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        staffId: formStaffId.trim().toUpperCase(),
        role: formRole,
        department: formDept,
        faculty: formFaculty,
        assignedLevel: formLevel,
        phone: formPhone.trim(),
        password: formPassword.trim() || undefined,
      };

      const result = await registerStaffAccount(payload);

      if (!result.success) {
        setModalError(result.error || 'Failed to register staff member.');
        setIsSubmitting(false);
        return;
      }

      await refreshStaffList();
      setCreatedCredentials({
        name: payload.name,
        email: payload.email,
        staffId: payload.staffId,
        password: result.generatedPassword || formPassword,
        role: payload.role === 'hod' ? 'Head of Department' : payload.role === 'dean' ? 'Dean of Faculty' : 'Lecturer / Adviser',
      });

      setSuccessBanner(`Staff member "${payload.name}" successfully registered and authorized to sign in!`);
      setTimeout(() => setSuccessBanner(null), 5000);

      // Reset form fields
      setFormName('');
      setFormEmail('');
      setFormStaffId('');
      setFormPhone('');
      // regenerate secure password for next registration
      setFormPassword(generateStaffPassword());
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error registering staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetStaffPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetStaff || newStaffPassword.length < 8 || !/[A-Z]/.test(newStaffPassword) || !/[a-z]/.test(newStaffPassword) || !/[0-9]/.test(newStaffPassword) || !/[^A-Za-z0-9\s]/.test(newStaffPassword)) {
      setResetFeedback('Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.');
      return;
    }

    setIsResettingStaff(true);
    setResetFeedback(null);

    try {
      const res = isSupabaseConfigured
        ? await resetStaffCredentials(resetTargetStaff.id, newStaffPassword)
        : await resetPasswordDirectly(resetTargetStaff.email, newStaffPassword);
      if (res.success) {
        setSuccessBanner(`Password updated successfully for ${resetTargetStaff.name}. They can now sign in with the new password.`);
        setTimeout(() => setSuccessBanner(null), 5000);
        setResetTargetStaff(null);
        setNewStaffPassword('');
      } else {
        setResetFeedback(res.error || 'Failed to reset password.');
      }
    } catch (err) {
      setResetFeedback(err instanceof Error ? err.message : 'Error resetting password.');
    } finally {
      setIsResettingStaff(false);
    }
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    if (window.confirm(`Are you sure you want to deactivate and remove ${staff.name} (${staff.staffId}) from the staff registry?`)) {
      const res = deleteStaffMember(staff.id);
      if (res.success) {
        refreshStaffList();
        setSuccessBanner(`Staff record for ${staff.name} deactivated.`);
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    }
  };

  const handleSaveDepartmentHod = async (department: string) => {
    setSavingDepartment(department);
    try {
      const result = await setDepartmentHod(department, hodSelections[department] || null);
      if (!result.success) setPortalError(result.error || 'Could not update this department HOD.');
      else {
        setPortalError(null);
        setSuccessBanner(`${department} HOD assignment updated.`);
        await refreshStaffList();
      }
    } catch (error) {
      setPortalError(error instanceof Error ? error.message : 'Could not update this department HOD.');
    } finally { setSavingDepartment(null); }
  };

  const openStaffEditor = (staff: StaffMember) => {
    setModalError(null);
    setEditTarget(staff);
    setEditForm({
      name: staff.name, staffId: staff.staffId, role: staff.role,
      department: staff.department, faculty: staff.faculty,
      assignedLevel: staff.assignedLevel || '', assignedSession: staff.assignedSession || '', phone: staff.phone || '',
    });
  };

  const handleSaveStaffProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editTarget || !editForm) return;
    setIsSavingProfile(true);
    try {
      const result = await updateStaffProfile(editTarget.id, editForm);
      if (!result.success) setModalError(result.error || 'Could not update staff profile.');
      else {
        setEditTarget(null);
        setEditForm(null);
        setModalError(null);
        setPortalError(null);
        setSuccessBanner(`Profile updated for ${editForm.name}.`);
        await refreshStaffList();
      }
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Could not update staff profile.');
    } finally { setIsSavingProfile(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Management Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span> Staff management
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {userProfile.department} • 1AD Oversight Management
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Admin Portal &amp; Staff User Management
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            id="admin-refresh-btn"
            onClick={refreshStaffList}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">refresh</span>
            Refresh Directory
          </button>
          <button
            type="button"
            id="admin-open-register-modal-btn"
            onClick={() => {
              setCreatedCredentials(null);
              setModalError(null);
              setIsRegisterModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Register Staff Member
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {portalError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{portalError}</div>}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Top Bento Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Registered Staff</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalStaffCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Current staff accounts
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">HOD assignments</span>
            <span className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{assignedDepartmentHodCount}/5</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Distinct department slots filled</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lecturers &amp; Advisers (1AD)</span>
            <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">badge</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{lecturerCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Registered lecturer accounts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Faculty Leadership</span>
            <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{deanCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Executive Oversight</p>
        </div>
      </div>

      {/* Five department HOD assignments */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">domain</span>
            Department HOD assignments
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">One distinct HOD per department</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {LASU_DEPARTMENTS.map((department) => {
            const assignedHod = departmentHods[department];
            const candidates = staffList.filter((staff) => staff.role === 'hod');
            return (
              <div key={department} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{department}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${assignedHod ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                    {assignedHod ? 'Assigned' : 'Vacant'}
                  </span>
                </div>
                <p className="min-h-5 text-xs text-slate-500 dark:text-slate-400">{assignedHod?.name || 'No HOD assigned'}</p>
                <div className="flex gap-2">
                  <select value={hodSelections[department] || ''} onChange={(event) => setHodSelections((current) => ({ ...current, [department]: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <option value="">Unassign HOD</option>
                    {candidates.map((hod) => <option key={hod.id} value={hod.id}>{hod.name} · {hod.department}</option>)}
                  </select>
                  <button type="button" disabled={savingDepartment === department} onClick={() => void handleSaveDepartmentHod(department)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                    {savingDepartment === department ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Directory & Management Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        {/* Table Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">badge</span>
              Academic Staff Roster &amp; Credentials
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Authorized personnel records for HOD, faculty leadership, and lecturers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, ID, or email..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>

            {/* Role filter */}
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-600 shadow-2xs"
            >
              <option value="All">All Roles</option>
              <option value="hod">HODs Only</option>
              <option value="lecturer">Lecturers / Advisers</option>
              <option value="dean">Deans Only</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3 px-3">Staff member</th>
                <th className="py-3 px-3">Staff ID &amp; Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Assigned 1AD Level</th>
                <th className="py-3 px-3">Advisees</th>
                <th className="py-3 px-3 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No staff records match the current filters. Click &ldquo;Register Staff Member&rdquo; to add new personnel.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-white ${staff.role === 'dean' ? 'bg-indigo-600' : staff.role === 'hod' ? 'bg-teal-600' : 'bg-emerald-600'}`} title={`${staff.role} account`}>
                          <span className="material-symbols-outlined text-[18px]">{staff.role === 'dean' ? 'account_balance' : staff.role === 'hod' ? 'domain' : 'school'}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{staff.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 block">
                        {staff.staffId}
                      </span>
                      <span className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                        staff.role === 'hod'
                          ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                          : staff.role === 'dean'
                          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {staff.role === 'hod' ? 'HOD' : staff.role === 'dean' ? 'Dean' : 'Lecturer / Adviser'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{staff.department}</span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">{staff.faculty}</span>
                    </td>
                    <td className="py-3 px-3">
                      {staff.assignedLevel ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded text-[11px] border border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="material-symbols-outlined text-[13px]">school</span>
                          {staff.assignedLevel}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">General Faculty</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {staff.adviseeCount ? (
                        <span className="font-bold text-slate-900 dark:text-slate-100">{staff.adviseeCount} students</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => openStaffEditor(staff)} className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300" title={`Edit ${staff.name} profile`} aria-label={`Edit ${staff.name} profile`}>
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetTargetStaff(staff);
                            setNewStaffPassword('');
                            setResetFeedback(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          title="Reset staff member password"
                        >
                          <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                          <span>Reset Pass</span>
                        </button>
                        {!isSupabaseConfigured && <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff)}
                          className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Deactivate staff record"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && editForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <form onSubmit={handleSaveStaffProfile} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Edit staff profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{editTarget.email}</p>
              </div>
              <button type="button" onClick={() => { setEditTarget(null); setEditForm(null); }} aria-label="Close profile editor" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full name
                <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800" />
              </label>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Staff ID
                <input required value={editForm.staffId} onChange={(e) => setEditForm({ ...editForm, staffId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800" />
              </label>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as StaffProfileUpdate['role'] })} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                  <option value="lecturer">Lecturer</option><option value="hod">HOD</option><option value="dean">Dean</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department
                <select value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                  {LASU_DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Faculty
                <input required value={editForm.faculty} onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800" />
              </label>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Advising level
                <select value={editForm.assignedLevel || ''} onChange={(e) => setEditForm({ ...editForm, assignedLevel: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                  <option value="">No level assigned</option><option>100 Level (1AD)</option><option>200 Level (2AD)</option><option>300 Level (3AD)</option><option>400 Level (4AD)</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Session
                <input value={editForm.assignedSession || ''} onChange={(e) => setEditForm({ ...editForm, assignedSession: e.target.value })} placeholder="e.g. 2025/2026" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800" />
              </label>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone
                <input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800" />
              </label>
            </div>
            {modalError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{modalError}</p>}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button type="button" onClick={() => { setEditTarget(null); setEditForm(null); }} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-slate-700">Cancel</button>
              <button type="submit" disabled={isSavingProfile} className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{isSavingProfile ? 'Saving…' : 'Save profile'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MANUAL STAFF REGISTRATION MODAL                                  */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setIsRegisterModalOpen(false);
                setCreatedCredentials(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {createdCredentials ? (
              /* Success View showing newly created staff credentials */
              <div className="space-y-4 text-center py-2">
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center">
                    <span className="material-symbols-outlined text-[30px]">check_circle</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    <span className="material-symbols-outlined text-[15px]">
                      {createdCredentials.role === 'Head of Department' ? 'corporate_fare' : createdCredentials.role === 'Dean of Faculty' ? 'verified' : 'school'}
                    </span>
                    {createdCredentials.role}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Staff Account Successfully Registered!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  The staff member is now authorized. Share these login credentials so they can immediately sign in to their portal.
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 text-left border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Full Name:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{createdCredentials.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Assigned Role:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{createdCredentials.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Staff ID:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{createdCredentials.staffId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Email Address:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{createdCredentials.email}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Login Password:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                      {createdCredentials.password}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `LASU Advisor Staff Credentials:\nStaff: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nStaff ID: ${createdCredentials.staffId}\nPassword: ${createdCredentials.password}\nPortal: ${window.location.origin}/#login`
                      );
                      alert('Credentials copied to clipboard!');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    Copy Credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterModalOpen(false);
                      setCreatedCredentials(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Done &amp; Close
                  </button>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleManualRegister} className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">person_add</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Register Staff Member Manually
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Onboard HOD, Dean, or Lecturer / Level Adviser with login access.
                    </p>
                  </div>
                </div>

                {modalError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Academic Name &amp; Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Olumide Adeleke"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Institutional Email */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Institutional Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="o.adeleke@lasu.edu.ng"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Staff ID */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Staff ID Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="STAFF/CSC/105"
                      value={formStaffId}
                      onChange={(e) => setFormStaffId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 uppercase"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Staff Role Category
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as 'lecturer' | 'hod' | 'dean')}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="lecturer">Lecturer / Level Adviser</option>
                      {userRole !== 'hod' && <option value="hod">Head of Department (HOD)</option>}
                      {userRole === 'admin' && <option value="dean">Dean of Faculty</option>}
                    </select>
                  </div>

                  {/* Level Assignment (1AD structure) */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      1AD Level Cohort Assignment
                    </label>
                    <select
                      value={formLevel}
                      onChange={(e) => setFormLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="100 Level (1AD)">100 Level (1AD)</option>
                      <option value="200 Level (2AD)">200 Level (2AD)</option>
                      <option value="300 Level (3AD)">300 Level (3AD)</option>
                      <option value="400 Level (4AD)">400 Level (4AD)</option>
                      <option value="Departmental General">Departmental General</option>
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <select
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      disabled={userRole === 'hod'}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                    >
                      {LASU_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Contact
                    </label>
                    <input
                      type="text"
                      placeholder="+234 802 000 0000"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Temporary Password */}
                  <div className="sm:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Assigned Login Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormPassword(generateStaffPassword())}
                        className="text-[11px] text-emerald-600 hover:underline cursor-pointer"
                      >
                        Generate Random
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      The staff member will use this initial password to sign in and will be prompted to update it on their first login. Must be minimum 8 characters with upper, lower, numbers and symbols.
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESET PASSWORD FOR STAFF MEMBER MODAL                            */}
      {/* ========================================================================= */}
      {resetTargetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setResetTargetStaff(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <form onSubmit={handleResetStaffPasswordSubmit} className="space-y-4 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">lock_reset</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Reset Staff Password
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Assign new login credentials for {resetTargetStaff.name}.
                  </p>
                </div>
              </div>

              {resetFeedback && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
                  {resetFeedback}
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{resetTargetStaff.name}</p>
                <p className="font-mono text-slate-500 text-[11px]">{resetTargetStaff.staffId} • {resetTargetStaff.email}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  placeholder="Min. 8 chars: Aa, 0-9, and !@#$..."
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setResetTargetStaff(null)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingStaff}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isResettingStaff ? (
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
