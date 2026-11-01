import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  CalendarDays,
  FileText,
  HelpCircle,
  FolderOpen,
  Sparkles,
  BarChart2,
  Clock,
  Award,
  AlertTriangle,
  RotateCw,
  Shuffle,
  UsersRound,
  Timer,
  Zap,
  Megaphone,
  Settings,
  BookOpen,
  CheckSquare,
  Shield,
  History,
  Database,
  Building,
  MessageSquare,
  UserCircle,
  ChevronDown,
  ChevronsUpDown,
  PlusCircle,
  X,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onGoToLogin?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface MenuSection {
  id: string;
  title?: string;
  icon?: React.ElementType;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onGoToLogin,
}) => {
  const { role } = useAuth();

  const getMenuSections = (): MenuSection[] => {
    switch (role) {
      case 'TEACHER':
        return [
          {
            id: 'teacher_main',
            items: [{ id: 'teacher-overview', label: 'Tổng quan', icon: LayoutDashboard }],
          },
          {
            id: 'teacher_classes',
            title: 'LỚP HỌC',
            icon: GraduationCap,
            items: [
              { id: 'teacher-classes', label: 'Lớp của tôi', icon: GraduationCap },
              { id: 'teacher-students', label: 'Học sinh', icon: Users },
              { id: 'teacher-attendance', label: 'Điểm danh', icon: CalendarCheck },
              { id: 'teacher-schedule', label: 'Thời khóa biểu', icon: CalendarDays },
            ],
          },
          {
            id: 'teacher_learning',
            title: 'DẠY HỌC',
            icon: BookOpen,
            items: [
              { id: 'teacher-question-bank', label: 'Ngân hàng câu hỏi', icon: Database },
              { id: 'teacher-assignments', label: 'Giao bài tập', icon: FileText },
              { id: 'teacher-auto-grading', label: 'Chấm bài tự động', icon: CheckSquare },
              { id: 'teacher-digital-docs', label: 'Tài liệu số', icon: FolderOpen },
              { id: 'teacher-ai', label: 'AI HỖ TRỢ', icon: Sparkles },
            ],
          },
          {
            id: 'teacher_tracking',
            title: 'THEO DÕI',
            icon: BarChart2,
            items: [
              { id: 'teacher-grades', label: 'Quản lý điểm', icon: BarChart2 },
              { id: 'teacher-behavior', label: 'Hành vi & Thi đua', icon: Award },
            ],
          },
          {
            id: 'teacher_tools',
            title: 'CÔNG CỤ LỚP HỌC',
            icon: Sparkles,
            items: [
              { id: 'teacher-tools-wheel', label: 'Vòng quay may mắn', icon: RotateCw },
              { id: 'teacher-tools-random', label: 'Chọn ngẫu nhiên', icon: Shuffle },
              { id: 'teacher-tools-groups', label: 'Chia nhóm', icon: UsersRound },
              { id: 'teacher-tools-timer', label: 'Đồng hồ lớp học', icon: Timer },
              { id: 'teacher-tools-quiz', label: 'Quiz tương tác', icon: Zap },
            ],
          },
          {
            id: 'teacher_system',
            title: 'HỆ THỐNG',
            icon: Megaphone,
            items: [
              { id: 'teacher-announcements', label: 'Thông báo', icon: Megaphone },
              { id: 'teacher-reports', label: 'Báo cáo', icon: BarChart2 },
            ],
          },
        ];

      case 'STUDENT':
        return [
          {
            id: 'student_main',
            items: [
              { id: 'student-overview', label: 'Trang chủ', icon: LayoutDashboard },
              { id: 'student-schedule', label: 'Lịch học', icon: CalendarDays },
            ],
          },
          {
            id: 'student_learning',
            title: 'HỌC TẬP',
            icon: BookOpen,
            items: [
              { id: 'student-assignments', label: 'Bài tập của tôi', icon: FileText },
              { id: 'student-quizzes', label: 'Làm bài kiểm tra', icon: HelpCircle },
            ],
          },
          {
            id: 'student_results',
            title: 'KẾT QUẢ',
            icon: BarChart2,
            items: [
              { id: 'student-grades', label: 'Bảng điểm cá nhân', icon: BarChart2 },
              { id: 'student-attendance', label: 'Chuyên cần của tôi', icon: CalendarCheck },
              { id: 'student-achievements', label: 'Thành tích & Khen thưởng', icon: Award },
            ],
          },
          {
            id: 'student_interaction',
            title: 'TƯƠNG TÁC',
            icon: Megaphone,
            items: [
              { id: 'student-announcements', label: 'Thông báo lớp', icon: Megaphone },
              { id: 'student-profile', label: 'Hồ sơ cá nhân', icon: UserCircle },
            ],
          },
        ];

      case 'PARENT':
        return [
          {
            id: 'parent_main',
            items: [
              { id: 'parent-overview', label: 'Tổng quan theo dõi', icon: LayoutDashboard },
              { id: 'parent-children', label: 'Hồ sơ các con', icon: Users },
            ],
          },
          {
            id: 'parent_learning',
            title: 'HỌC TẬP',
            icon: BookOpen,
            items: [
              { id: 'parent-grades', label: 'Điểm số & Tiến độ', icon: BarChart2 },
              { id: 'parent-assignments', label: 'Tình trạng bài tập', icon: FileText },
              { id: 'parent-attendance', label: 'Nhật ký chuyên cần', icon: CalendarCheck },
            ],
          },
          {
            id: 'parent_connect',
            title: 'KẾT NỐI',
            icon: MessageSquare,
            items: [
              { id: 'parent-comments', label: 'Nhận xét & Thành tích', icon: Award },
              { id: 'parent-messages', label: 'Trao đổi với giáo viên', icon: MessageSquare },
              { id: 'parent-announcements', label: 'Thông báo từ trường', icon: Megaphone },
            ],
          },
        ];

      case 'ADMIN':
        return [
          {
            id: 'admin_main',
            items: [{ id: 'admin-overview', label: 'Dashboard Hệ thống', icon: LayoutDashboard }],
          },
          {
            id: 'admin_education',
            title: 'QUẢN LÝ ĐÀO TẠO',
            icon: GraduationCap,
            items: [
              { id: 'admin-classes', label: 'Quản lý Lớp học', icon: GraduationCap },
              { id: 'admin-users', label: 'Người dùng & Phân quyền', icon: Users },
            ],
          },
          {
            id: 'admin_security',
            title: 'GIÁM SÁT & BẢO MẬT',
            icon: Shield,
            items: [
              { id: 'admin-audit', label: 'Nhật ký Audit Log', icon: History },
              { id: 'admin-reports', label: 'Báo cáo toàn trường', icon: BarChart2 },
              { id: 'admin-backup', label: 'Sao lưu & Cấu hình', icon: Database },
            ],
          },
        ];
    }
  };

  const sections = getMenuSections();

  // State to track open/closed state for each module section
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((s) => {
      initial[s.id] = true; // All sections open by default
    });
    return initial;
  });

  // Auto-expand section if activeTab is inside a collapsed section
  useEffect(() => {
    sections.forEach((sec) => {
      if (sec.items.some((item) => item.id === activeTab)) {
        setOpenSections((prev) => ({
          ...prev,
          [sec.id]: true,
        }));
      }
    });
  }, [activeTab]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleAll = () => {
    const allOpen = Object.values(openSections).every((v) => v);
    const updated: Record<string, boolean> = {};
    sections.forEach((s) => {
      updated[s.id] = !allOpen;
    });
    setOpenSections(updated);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-[#080b1f]/95 backdrop-blur-2xl border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 lg:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh mục chức năng</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Expand / Collapse All Quick Action */}
        <div className="px-3 pt-3 pb-1 flex items-center justify-between border-b border-white/5 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu Chức Năng
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 px-2 py-1 rounded-md transition-colors cursor-pointer"
            title="Mở hoặc thu gọn tất cả module"
          >
            <ChevronsUpDown className="w-3 h-3" />
            <span>Đóng / Mở tất cả</span>
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {sections.map((sec) => {
            const hasTitle = !!sec.title;
            const isOpen = openSections[sec.id] !== false; // defaults to true
            const SectionIcon = sec.icon || FolderOpen;

            // If section has no title (like Overview at the top), render items directly
            if (!hasTitle) {
              return (
                <div key={sec.id} className="space-y-1">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 select-none text-left ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.15)] font-semibold'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            }

            // Toggable Module Section with Open & Close functionality
            const isAnyChildActive = sec.items.some((i) => i.id === activeTab);

            return (
              <div
                key={sec.id}
                className={`rounded-xl border transition-all duration-200 ${
                  isOpen
                    ? 'border-white/10 bg-slate-900/30'
                    : 'border-transparent hover:border-white/5 bg-transparent'
                }`}
              >
                {/* Module Section Header: Click to Open, Click again to Close */}
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none group ${
                    isAnyChildActive
                      ? 'text-cyan-300 bg-cyan-950/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                  aria-expanded={isOpen}
                  title={`Nhấp để ${isOpen ? 'đóng' : 'mở'} module ${sec.title}`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <SectionIcon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isAnyChildActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                      }`}
                    />
                    <span className="tracking-wide uppercase text-[11px] font-extrabold truncate">
                      {sec.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-normal">
                      ({sec.items.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <span className="text-[9px] text-slate-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                      {isOpen ? 'Đóng' : 'Mở'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-0 text-cyan-400' : '-rotate-90'
                      }`}
                    />
                  </div>
                </button>

                {/* Sub-screens inside the module (Opened on click 1, Closed on click 2) */}
                {isOpen && (
                  <div className="px-2 pb-2 pt-1 space-y-1 border-t border-white/5 mt-1 animate-in fade-in-50 duration-200">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id);
                            if (onCloseMobile) onCloseMobile();
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 select-none text-left ${
                            isActive
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.2)] font-semibold pl-3.5'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                              isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer badge & Login button */}
        <div className="p-3 border-t border-white/10 shrink-0 space-y-2">
          {onGoToLogin && (
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                onGoToLogin();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-950/40 to-blue-950/40 hover:from-cyan-900/60 hover:to-blue-900/60 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer shadow-sm group"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              <span>Đăng nhập / Đổi tài khoản</span>
            </button>
          )}

          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="text-[10px] text-slate-400 truncate">
              Hệ thống trực tuyến <span className="font-mono text-slate-300">2026</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
