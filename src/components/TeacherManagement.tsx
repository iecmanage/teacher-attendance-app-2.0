import React, { useState } from 'react';
import { Teacher, AdminSettings } from '../types';
import { formatTime12Hour } from '../utils/timeUtils';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  Clock,
  KeyRound,
  UserCheck,
  X,
  Plus,
  ExternalLink,
} from 'lucide-react';

interface TeacherManagementProps {
  teachers: Teacher[];
  settings: AdminSettings;
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  settings,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [targetArrivalTime, setTargetArrivalTime] = useState<string>(
    settings.defaultTargetArrivalTime
  );
  const [accessCode, setAccessCode] = useState<string>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const openAddModal = () => {
    setEditingTeacher(null);
    setName('');
    const newEmpNum = 101 + teachers.length;
    setEmployeeId(`IEC-${newEmpNum}`);
    setDesignation('Islamic Studies Instructor');
    setPhone('+92 300 0000000');
    setEmail(`teacher${newEmpNum}@iec.edu`);
    setTargetArrivalTime(settings.defaultTargetArrivalTime);
    setAccessCode(`IEC-${Math.floor(1000 + Math.random() * 9000)}`);
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setName(t.name);
    setEmployeeId(t.employeeId);
    setDesignation(t.designation);
    setPhone(t.phone);
    setEmail(t.email);
    setTargetArrivalTime(t.targetArrivalTime || settings.defaultTargetArrivalTime);
    setAccessCode(t.accessCode);
    setStatus(t.status);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTeacher) {
      const updated: Teacher = {
        ...editingTeacher,
        name: name.trim(),
        employeeId: employeeId.trim(),
        designation: designation.trim(),
        phone: phone.trim(),
        email: email.trim(),
        targetArrivalTime: targetArrivalTime,
        accessCode: accessCode.trim(),
        status: status,
      };
      onUpdateTeacher(updated);
    } else {
      const newTeacher: Teacher = {
        id: `t-${Date.now()}`,
        employeeId: employeeId.trim() || `IEC-${Math.floor(100 + Math.random() * 900)}`,
        name: name.trim(),
        designation: designation.trim(),
        phone: phone.trim(),
        email: email.trim(),
        targetArrivalTime: targetArrivalTime || settings.defaultTargetArrivalTime,
        accessCode: accessCode.trim() || `IEC-${Math.floor(1000 + Math.random() * 9000)}`,
        status: status,
        joinedDate: new Date().toISOString().split('T')[0],
      };
      onAddTeacher(newTeacher);
    }

    setIsModalOpen(false);
  };

  const handleCopyAccessUrl = (accessCodeStr: string, tId: string) => {
    const origin = window.location.origin + window.location.pathname;
    const fullUrl = `${origin}?code=${encodeURIComponent(accessCodeStr)}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(tId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.accessCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <span>Faculty & Teacher Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage teacher profiles, assign individual target arrival times, and generate access URLs/codes.
          </p>
        </div>

        <button
          id="add-new-teacher-btn"
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all text-xs flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Teacher</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          id="teacher-search-input"
          type="text"
          placeholder="Search teachers by Name, Employee ID, Designation or Access Code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
      </div>

      {/* Teachers Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((teacher) => (
          <div
            key={teacher.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-amber-600 overflow-hidden shrink-0">
                    {teacher.avatarUrl ? (
                      <img
                        src={teacher.avatarUrl}
                        alt={teacher.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      teacher.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white font-serif text-sm">
                      {teacher.name}
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {teacher.designation}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    teacher.status === 'ACTIVE'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {teacher.status}
                </span>
              </div>

              {/* Attributes list */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee ID:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {teacher.employeeId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" /> Target Arrival:
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatTime12Hour(
                      teacher.targetArrivalTime || settings.defaultTargetArrivalTime
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-emerald-500" /> Access Code:
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {teacher.accessCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
              <button
                id={`copy-url-teacher-${teacher.id}`}
                onClick={() => handleCopyAccessUrl(teacher.accessCode, teacher.id)}
                className="flex items-center gap-1.5 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-300 font-medium px-2.5 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                title="Copy Quick Access URL"
              >
                {copiedId === teacher.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 font-bold">URL Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1">
                <button
                  id={`edit-teacher-${teacher.id}`}
                  onClick={() => openEditModal(teacher)}
                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit Teacher Record"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  id={`delete-teacher-${teacher.id}`}
                  onClick={() => {
                    if (
                      confirm(
                        `Are you sure you want to remove teacher ${teacher.name} (${teacher.employeeId})?`
                      )
                    ) {
                      onDeleteTeacher(teacher.id);
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Delete Teacher Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              id="teacher-modal-close-btn"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-serif text-white mb-4">
              {editingTeacher ? 'Edit Teacher Record' : 'Add New Faculty Member'}
            </h3>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  id="teacher-form-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Qari Muhammad Hassan"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Employee ID *
                  </label>
                  <input
                    id="teacher-form-employee-id"
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. IEC-107"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Arrival Time
                  </label>
                  <input
                    id="teacher-form-target-time"
                    type="time"
                    value={targetArrivalTime}
                    onChange={(e) => setTargetArrivalTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Designation / Department
                </label>
                <input
                  id="teacher-form-designation"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Tajweed & Quranic Studies"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="teacher-form-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Access Code / PIN
                  </label>
                  <input
                    id="teacher-form-access-code"
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="e.g. IEC-8842"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  id="teacher-form-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@iec.edu"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Status
                </label>
                <select
                  id="teacher-form-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  id="teacher-form-cancel"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="teacher-form-submit"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  {editingTeacher ? 'Update Teacher' : 'Create Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
