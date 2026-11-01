import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Save,
  RotateCcw,
  CheckCheck,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { AttendanceRecord, AttendanceStatus } from '../../types';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';
import { UserAvatar } from '../../components/ui/UserAvatar';

interface AttendanceViewProps {
  initialClassId?: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ initialClassId = 'cls_10a1' }) => {
  const { user } = useAuth();
  const { success, info } = useToast();
  const classes = StorageService.getClasses();
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const list = StorageService.getAttendance(selectedClassId, selectedDate);
    setRecords(list);
    setHasUnsavedChanges(false);
  }, [selectedClassId, selectedDate]);

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status: newStatus } : r))
    );
    setHasUnsavedChanges(true);
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, note } : r))
    );
    setHasUnsavedChanges(true);
  };

  const handleMarkAllPresent = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, status: 'present' })));
    setHasUnsavedChanges(true);
    info('Đã đánh dấu tất cả học sinh có mặt. Nhấn "Lưu điểm danh" để cập nhật.');
  };

  const handleSave = () => {
    if (!user) return;
    StorageService.saveAttendance(records, user);
    setHasUnsavedChanges(false);
    success(`Đã lưu điểm danh thành công cho ${records.length} học sinh!`);
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const presentCount = records.filter((r) => r.status === 'present').length;
  const excusedCount = records.filter((r) => r.status === 'excused').length;
  const unexcusedCount = records.filter((r) => r.status === 'unexcused').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const earlyCount = records.filter((r) => r.status === 'early_leave').length;

  const statusOptions: { value: AttendanceStatus; label: string; activeColor: string }[] = [
    { value: 'present', label: 'Có mặt', activeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' },
    { value: 'excused', label: 'Có phép', activeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
    { value: 'unexcused', label: 'Không phép', activeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50' },
    { value: 'late', label: 'Đi trễ', activeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50' },
    { value: 'early_leave', label: 'Về sớm', activeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/50' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & BREADCRUMB: 🏠 > Lớp học > Điểm danh • Sổ Điểm Danh Điện Tử */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <ModuleBreadcrumb
          section="Lớp học"
          moduleName="Điểm danh"
          title="Sổ Điểm Danh Điện Tử"
        />

        {/* Date and Class Selector + Fast mark icon + Save button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Màu xanh dương đổi thành Module: Module Lớp Học */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/15 hover:border-cyan-500/40 text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer shadow-sm select-none"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>
                Module: {classes.find((c) => c.id === selectedClassId)?.name || 'Lớp học'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isClassDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isClassDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-48 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Chọn Module Lớp
                </div>
                {classes.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassId(c.id);
                      setIsClassDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      selectedClassId === c.id
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="font-mono text-[11px] text-slate-400">({c.studentCount} HS)</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-white focus:outline-none font-mono cursor-pointer"
            />
          </div>

          {/* Màu xanh: Chỉ 1 icon nhỏ, đưa chuột vào thì hiện chữ, không bị vướng */}
          <div className="relative group">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="w-8 h-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 active:scale-95 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 cursor-pointer transition-all shadow-sm flex items-center justify-center"
              title="Đánh dấu tất cả có mặt"
              aria-label="Đánh dấu tất cả có mặt"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
            </button>
            {/* Tooltip nổi lên phía trên, chữ ngắn gọn, không bị vướng phần tử phía dưới */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/95 border border-emerald-500/40 text-emerald-200 text-[11px] font-semibold rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-none backdrop-blur-md">
              <CheckCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Đánh dấu tất cả có mặt</span>
            </div>
          </div>

          {/* Nút Lưu điểm danh (Màu vàng dịch chuyển vị trí từ thanh dưới đáy lên đây) */}
          <Button
            variant="primary"
            size="sm"
            icon={Save}
            onClick={handleSave}
            className={hasUnsavedChanges ? 'ring-2 ring-amber-400/70 shadow-lg shadow-amber-500/20' : ''}
          >
            Lưu điểm danh
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip: Màu vàng - Chữ và số trên 1 dòng theo yêu cầu ảnh 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="py-2 px-3 rounded-xl bg-slate-900/70 border border-white/10 flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span className="text-xs font-semibold text-slate-400">Sĩ số:</span>
          <span className="text-xs sm:text-sm font-extrabold text-white font-mono tabular-nums">{records.length}</span>
        </div>
        <div className="py-2 px-3 rounded-xl bg-emerald-950/25 border border-emerald-500/30 flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span className="text-xs font-semibold text-emerald-400">Có mặt:</span>
          <span className="text-xs sm:text-sm font-extrabold text-emerald-300 font-mono tabular-nums">{presentCount}</span>
        </div>
        <div className="py-2 px-3 rounded-xl bg-blue-950/25 border border-blue-500/30 flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span className="text-xs font-semibold text-blue-400">Có phép:</span>
          <span className="text-xs sm:text-sm font-extrabold text-blue-300 font-mono tabular-nums">{excusedCount}</span>
        </div>
        <div className="py-2 px-3 rounded-xl bg-rose-950/25 border border-rose-500/30 flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span className="text-xs font-semibold text-rose-400">Không phép:</span>
          <span className="text-xs sm:text-sm font-extrabold text-rose-300 font-mono tabular-nums">{unexcusedCount}</span>
        </div>
        <div className="py-2 px-3 rounded-xl bg-amber-950/25 border border-amber-500/30 col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span className="text-xs font-semibold text-amber-400">Đi trễ/Về sớm:</span>
          <span className="text-xs sm:text-sm font-extrabold text-amber-300 font-mono tabular-nums">{lateCount + earlyCount}</span>
        </div>
      </div>

      {/* Attendance Table / Cards */}
      <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
        {/* Table Header */}
        <div className="px-4 py-3 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Danh sách học sinh ({records.length})
            </span>
            {/* Quick action icon in table header with tooltip */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="w-5 h-5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 flex items-center justify-center cursor-pointer transition-all"
                title="Đánh dấu tất cả có mặt"
              >
                <CheckCheck className="w-3 h-3 text-emerald-400" />
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex items-center px-2 py-0.5 bg-slate-900 border border-emerald-500/40 text-emerald-200 text-[10px] font-semibold rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
                Đánh dấu tất cả có mặt
              </div>
            </div>
          </div>
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Chưa lưu thay đổi
            </span>
          )}
        </div>

        <div className="divide-y divide-white/5">
          {records.map((r, index) => (
            <div
              key={r.id}
              className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                r.status === 'unexcused'
                  ? 'bg-rose-950/15'
                  : r.status === 'late'
                  ? 'bg-amber-950/15'
                  : 'hover:bg-white/5'
              }`}
            >
              {/* Student info */}
              <div className="flex items-center gap-3 min-w-[220px]">
                <span className="text-xs text-slate-500 font-mono w-6 text-center">{index + 1}</span>
                <UserAvatar
                  src={r.avatar}
                  name={r.studentName}
                  role="STUDENT"
                  size="md"
                />
                <div>
                  <div className="text-sm font-bold text-white tracking-tight">{r.studentName}</div>
                  <div className="text-xs text-slate-400 font-mono">{r.studentCode}</div>
                </div>
              </div>

              {/* Status Buttons Segment */}
              <div className="flex flex-wrap items-center gap-1.5">
                {statusOptions.map((opt) => {
                  const isCurrent = r.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleStatusChange(r.studentId, opt.value)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer transition-all duration-150 select-none ${
                        isCurrent
                          ? opt.activeColor
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Reason / Note input */}
              <div className="md:w-64">
                <input
                  type="text"
                  placeholder="Lý do / Ghi chú (VD: ốm, kẹt xe...)"
                  value={r.note || ''}
                  onChange={(e) => handleNoteChange(r.studentId, e.target.value)}
                  className="w-full bg-slate-900/70 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
