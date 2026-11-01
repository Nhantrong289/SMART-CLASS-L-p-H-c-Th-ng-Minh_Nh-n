import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  FileText,
  BarChart2,
  CalendarDays,
  ArrowLeft,
  Copy,
  DoorOpen,
  Award
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StorageService } from '../../services/storage';
import { useToast } from '../../contexts/ToastContext';
import { AttendanceView } from './AttendanceView';
import { StudentsList } from './StudentsList';
import { AssignmentsView } from './AssignmentsView';
import { GradebookView } from './GradebookView';
import { ScheduleView } from './ScheduleView';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';
import { db, doc, onSnapshot } from '../../services/firebase';
import { ClassRoom } from '../../types';

interface ClassDetailProps {
  classId: string;
  onBack: () => void;
}

export const ClassDetail: React.FC<ClassDetailProps> = ({ classId, onBack }) => {
  const { success } = useToast();
  const [classItem, setClassItem] = useState<ClassRoom>(
    () => StorageService.getClassById(classId) || StorageService.getClasses()[0]
  );
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'students' | 'attendance' | 'assignments' | 'grades' | 'schedule'>('overview');

  React.useEffect(() => {
    const local = StorageService.getClassById(classId);
    if (local) setClassItem(local);

    try {
      const unsub = onSnapshot(
        doc(db, 'classes', classId),
        (snap) => {
          if (snap.exists()) {
            setClassItem({ ...(snap.data() as ClassRoom), id: snap.id });
          }
        },
        (err) => console.warn('ClassDetail Firestore notice:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('ClassDetail listener:', e);
    }
  }, [classId]);

  const copyCode = () => {
    navigator.clipboard.writeText(classItem.code);
    success(`Đã sao chép mã tham gia lớp: ${classItem.code}`);
  };

  return (
    <div className="space-y-6">
      {/* Module Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <ModuleBreadcrumb
          section="Lớp học"
          moduleName={classItem.name}
          title="Không Gian Làm Việc Lớp Học"
        />
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
          Quay lại danh sách lớp
        </Button>
      </div>

      {/* Class Context Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0b1026] via-[#101538] to-[#080b1f] border border-cyan-500/20 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {classItem.name}
                </h1>
                <Badge variant="cyan" size="sm">Đang giảng dạy</Badge>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-200">
                  <span className="text-cyan-400 font-medium">GVCN:</span>
                  <strong className="text-white font-bold">{classItem.homeroomTeacherName || 'Chưa phân công'}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-slate-200">
                    {classItem.room.toLowerCase().startsWith('phòng')
                      ? classItem.room
                      : `Phòng ${classItem.room}`}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>Năm học: <strong className="font-mono text-slate-200">{classItem.academicYear}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 px-3 py-1.5 rounded-xl border border-cyan-500/30 cursor-pointer"
            >
              <span>Mã: {classItem.code}</span>
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto">
          {[
            { id: 'overview', label: 'Tổng quan', icon: GraduationCap },
            { id: 'students', label: 'Học sinh', icon: Users },
            { id: 'attendance', label: 'Điểm danh', icon: CalendarCheck },
            { id: 'assignments', label: 'Bài tập', icon: FileText },
            { id: 'grades', label: 'Bảng điểm', icon: BarChart2 },
            { id: 'schedule', label: 'Thời khóa biểu', icon: CalendarDays },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-[#0b1026]/75 border border-white/10 text-center">
            <div className="text-xs text-slate-400">Sĩ số lớp</div>
            <div className="text-3xl font-extrabold text-white font-mono mt-1">{classItem.studentCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">100% tài khoản đã kích hoạt</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#0b1026]/75 border border-white/10 text-center">
            <div className="text-xs text-slate-400">Chuyên cần trung bình</div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">{classItem.attendanceRate}%</div>
            <div className="text-[11px] text-slate-500 mt-1">Xếp hạng A cấp trường</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#0b1026]/75 border border-white/10 text-center">
            <div className="text-xs text-slate-400">Bài tập chờ chấm</div>
            <div className="text-3xl font-extrabold text-fuchsia-400 font-mono mt-1">{classItem.pendingAssignments}</div>
            <div className="text-[11px] text-slate-500 mt-1">Cần chấm trước ngày mai</div>
          </div>
        </div>
      )}

      {activeSubTab === 'students' && <StudentsList />}
      {activeSubTab === 'attendance' && <AttendanceView initialClassId={classItem.id} />}
      {activeSubTab === 'assignments' && <AssignmentsView />}
      {activeSubTab === 'grades' && <GradebookView />}
      {activeSubTab === 'schedule' && <ScheduleView onGoToAttendance={() => setActiveSubTab('attendance')} />}
    </div>
  );
};
