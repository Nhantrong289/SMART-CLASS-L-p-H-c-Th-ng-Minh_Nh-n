import React, { useState } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  CalendarCheck,
  PlusCircle,
  FileSpreadsheet,
  Shuffle,
  Bell,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Camera
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { AvatarPicker } from '../../components/ui/AvatarPicker';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';
import { UserAvatar } from '../../components/ui/UserAvatar';

interface TeacherOverviewProps {
  onNavigate: (tabId: string) => void;
}

export const TeacherOverview: React.FC<TeacherOverviewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { success } = useToast();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const schedule = StorageService.getSchedule();
  const students = StorageService.getStudents('cls_10a1');
  const assignments = StorageService.getAssignments('cls_10a1');
  const pendingSubmissions = assignments.reduce((acc, a) => acc + (a.submissionCount - a.gradedCount), 0);
  const auditLogs = StorageService.getAuditLogs().slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Module Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <ModuleBreadcrumb
            section="Tổng quan"
            moduleName="Bảng điều khiển"
            title="Trung Tâm Điều Hành Giáo Viên"
          />
          <p className="text-xs text-slate-400 mt-1 pl-1">
            Theo dõi tiến độ lớp học, lịch dạy trong ngày, nhiệm vụ cần chấm và hoạt động hệ thống
          </p>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b1026] via-[#11113a] to-[#080b1f] border border-cyan-500/20 p-6 lg:p-8 shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Teacher Portrait with Quick Change trigger */}
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => setIsAvatarModalOpen(true)}
              title="Bấm để đổi ảnh chân dung giáo viên"
            >
              <UserAvatar
                src={user?.avatar}
                name={user?.name || 'Giáo viên'}
                role="TEACHER"
                size="xl"
                imgClassName="!rounded-2xl border-2 border-cyan-400 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-all"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1 backdrop-blur-[1px] pointer-events-none">
                <Camera className="w-5 h-5 text-cyan-300" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
                  Lớp Chủ Nhiệm 10A1 · Học kỳ I (2025 - 2026)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Xin chào, {user?.name || 'Cô Nguyễn Mai Anh'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                Hôm nay là Thứ Hai, có <strong className="text-cyan-300 font-semibold">5 tiết học</strong>. Tỷ lệ chuyên cần sáng nay đạt <strong className="text-emerald-400 font-semibold">95%</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              icon={CalendarCheck}
              onClick={() => onNavigate('teacher-attendance')}
            >
              Điểm danh ngay
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={PlusCircle}
              onClick={() => onNavigate('teacher-assignments')}
            >
              Giao bài tập
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Shuffle}
              onClick={() => onNavigate('teacher-tools-random')}
            >
              Gọi ngẫu nhiên
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng học sinh"
          value={students.length}
          subtext="Lớp 10A1 chuyên Toán"
          icon={Users}
          accent="cyan"
        />
        <StatCard
          title="Có mặt sáng nay"
          value={19}
          subtext="Đạt 95% sĩ số"
          icon={CheckCircle}
          trend={{ value: '100% tiết 1', isPositive: true }}
          accent="emerald"
        />
        <StatCard
          title="Đi học trễ"
          value={1}
          subtext="HS: Đặng Tuấn Anh"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="Bài cần chấm"
          value={pendingSubmissions}
          subtext="Bài tập hình học & code"
          icon={AlertCircle}
          accent="magenta"
        />
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Schedule Today & Need Attention */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lịch dạy hôm nay */}
          <div className="rounded-2xl bg-[#0b1026]/75 backdrop-blur-md border border-white/10 p-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Lịch dạy & Tiết học hôm nay</h2>
                <p className="text-xs text-slate-400 mt-0.5">Thời khóa biểu thực tế theo buổi sáng</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => onNavigate('teacher-schedule')}
              >
                Xem tuần
              </Button>
            </div>

            <div className="mt-4 space-y-2.5">
              {schedule.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                    item.status === 'ongoing'
                      ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                      : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">Tiết</span>
                      <span className="text-sm font-bold text-white font-mono">{item.period}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{item.subject}</span>
                        {item.status === 'ongoing' && (
                          <Badge variant="cyan" size="sm" dot>
                            Đang diễn ra
                          </Badge>
                        )}
                        {item.status === 'completed' && (
                          <Badge variant="slate" size="sm">
                            Đã kết thúc
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="font-mono text-cyan-300">{item.time}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.room}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.className}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-0 flex items-center gap-2">
                    <Button
                      variant={item.status === 'ongoing' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => onNavigate('teacher-attendance')}
                    >
                      Điểm danh
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigate('teacher-attendance')}
              className="p-4 rounded-xl bg-[#0b1026]/60 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white">Điểm danh lớp</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tiết 1 - Tiết 5</div>
            </button>

            <button
              onClick={() => onNavigate('teacher-assignments')}
              className="p-4 rounded-xl bg-[#0b1026]/60 hover:bg-fuchsia-500/10 border border-white/10 hover:border-fuchsia-500/30 text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white">Giao bài tập</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Đính kèm tài liệu</div>
            </button>

            <button
              onClick={() => onNavigate('teacher-grades')}
              className="p-4 rounded-xl bg-[#0b1026]/60 hover:bg-violet-500/10 border border-white/10 hover:border-violet-500/30 text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white">Nhập điểm số</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Spreadsheet GPA</div>
            </button>

            <button
              onClick={() => onNavigate('teacher-tools-wheel')}
              className="p-4 rounded-xl bg-[#0b1026]/60 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Shuffle className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white">Vòng quay lớp</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Gọi trả lời bài</div>
            </button>
          </div>
        </div>

        {/* Right Column: Việc cần xử lý & Recent Audit Logs */}
        <div className="space-y-6">
          {/* Việc cần xử lý */}
          <div className="rounded-2xl bg-[#0b1026]/75 backdrop-blur-md border border-white/10 p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-fuchsia-400" />
                Việc cần xử lý
              </h2>
              <span className="text-xs font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-full border border-fuchsia-500/20">
                {pendingSubmissions + 1} mục
              </span>
            </div>

            <div className="mt-3.5 space-y-3">
              <div
                onClick={() => onNavigate('teacher-assignments')}
                className="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-fuchsia-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">4 bài nộp mới chưa chấm</span>
                  <Badge variant="magenta" size="sm">Cần chấm</Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Bài tập 03: Khảo sát Hàm số bậc hai</p>
              </div>

              <div
                onClick={() => onNavigate('teacher-students')}
                className="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Học sinh cần nhắc nhở</span>
                  <Badge variant="amber" size="sm">Cảnh báo</Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Đặng Tuấn Anh (Tổ 2) vắng 2 buổi & đi trễ sáng nay.</p>
              </div>

              <div
                onClick={() => onNavigate('teacher-announcements')}
                className="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Gửi thông báo họp phụ huynh</span>
                  <Badge variant="cyan" size="sm">Nhắc việc</Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Xác nhận lịch họp phụ huynh trực tuyến thứ Bảy.</p>
              </div>
            </div>
          </div>

          {/* Nhật ký hoạt động gần đây */}
          <div className="rounded-2xl bg-[#0b1026]/75 backdrop-blur-md border border-white/10 p-5 shadow-xl">
            <h2 className="text-sm font-bold text-white tracking-tight pb-3 border-b border-white/10 uppercase">
              Hoạt động gần đây
            </h2>
            <div className="mt-3 space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-cyan-500/50 pl-3 py-0.5">
                  <div className="font-semibold text-slate-200">{log.action.replace(/_/g, ' ')}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{log.entityName}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">{log.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ĐỔI ẢNH CHÂN DUNG GIÁO VIÊN */}
      {isAvatarModalOpen && (
        <Modal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          title={`Chọn Ảnh Chân Dung Giáo Viên: ${user?.name || 'Cô Nguyễn Mai Anh'}`}
          subtitle="Tải ảnh chân dung từ thiết bị hoặc chọn ảnh mẫu giáo viên thanh lịch, áo dài hoặc âu phục"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <AvatarPicker
              value={user?.avatar || ''}
              onChange={(newUrl) => {
                if (user) {
                  StorageService.updateUserAvatar(user.id, newUrl);
                  success('Đã cập nhật ảnh chân dung giáo viên thành công!');
                }
              }}
              label="Ảnh chân dung giáo viên"
              category="teacher"
            />
            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer font-bold"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
