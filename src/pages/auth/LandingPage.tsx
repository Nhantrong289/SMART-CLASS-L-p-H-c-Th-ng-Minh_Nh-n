import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Shield,
  GraduationCap,
  Users,
  BarChart2,
  CalendarCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface LandingPageProps {
  onGoToLogin: () => void;
  onExplore: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin, onExplore }) => {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30">
      {/* Background Cyberpunk Grid & Ambient Glow Orbs */}
      <div className="fixed inset-0 bg-digital-grid pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="relative z-20 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            SMART<span className="text-cyan-400">CLASS</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onExplore}>
            Trải nghiệm ngay
          </Button>
          <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right" onClick={onGoToLogin}>
            Đăng nhập
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-20 text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-[0_0_20px_rgba(6,182,212,0.25)]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Nền tảng AI Giáo dục Thế hệ mới</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
          SMART CLASS <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-fuchsia-400">
            LỚP HỌC THÔNG MINH
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          Nền tảng quản lý lớp học toàn diện cho thế hệ số. Kết nối Giáo viên, Học sinh, Phụ huynh và Nhà trường trên cùng một hệ sinh thái dữ liệu thời gian thực.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" onClick={onGoToLogin}>
            Đăng nhập hệ thống
          </Button>
          <Button variant="secondary" size="lg" onClick={onExplore}>
            Khám phá 4 Cổng Trải Nghiệm
          </Button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12 text-left">
          <div className="p-5 rounded-2xl bg-[#0b1026]/75 border border-white/10 backdrop-blur-md hover:border-cyan-500/40 transition-all">
            <CalendarCheck className="w-6 h-6 text-cyan-400 mb-3" />
            <h3 className="font-bold text-white text-sm">Điểm danh 1 chạm</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Tối ưu cho thiết bị di động, tự động gửi cảnh báo vắng muộn tới phụ huynh.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1026]/75 border border-white/10 backdrop-blur-md hover:border-fuchsia-500/40 transition-all">
            <BarChart2 className="w-6 h-6 text-fuchsia-400 mb-3" />
            <h3 className="font-bold text-white text-sm">Sổ điểm Spreadsheet</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Tự động tính điểm trung bình môn có trọng số, theo dõi lịch sử chỉnh sửa điểm.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1026]/75 border border-white/10 backdrop-blur-md hover:border-violet-500/40 transition-all">
            <Zap className="w-6 h-6 text-violet-400 mb-3" />
            <h3 className="font-bold text-white text-sm">Công cụ tương tác lớp</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Vòng quay may mắn, gọi tên ngẫu nhiên, chia nhóm tự động và đồng hồ đếm giờ.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1026]/75 border border-white/10 backdrop-blur-md hover:border-blue-500/40 transition-all">
            <Shield className="w-6 h-6 text-blue-400 mb-3" />
            <h3 className="font-bold text-white text-sm">Phân quyền RBAC & Audit</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Không gian riêng biệt cho 4 vai trò: Admin, Giáo viên, Học sinh, Phụ huynh.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <div>SMART CLASS © 2026 · Hệ thống giáo dục thông minh ứng dụng AI & Dữ liệu số</div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono">
          <span>Version 2.4-Production</span>
        </div>
      </footer>
    </div>
  );
};
