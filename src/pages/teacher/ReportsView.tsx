import React from 'react';
import {
  BarChart2,
  TrendingUp,
  Download,
  CalendarCheck,
  Printer,
  Award,
  Users
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StorageService } from '../../services/storage';
import { useToast } from '../../contexts/ToastContext';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';
import { UserAvatar } from '../../components/ui/UserAvatar';

export const ReportsView: React.FC = () => {
  const { success } = useToast();
  const students = StorageService.getStudents('cls_10a1');
  const grades = StorageService.getGrades('cls_10a1');

  // Distribution
  const excellent = grades.filter((g) => g.gpa && g.gpa >= 9).length;
  const good = grades.filter((g) => g.gpa && g.gpa >= 8 && g.gpa < 9).length;
  const average = grades.filter((g) => g.gpa && g.gpa < 8).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    success('Đang tạo file PDF Báo cáo tổng kết lớp 10A1...');
    setTimeout(() => {
      window.print();
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <ModuleBreadcrumb
            section="Theo dõi"
            moduleName="Báo cáo & Thi đua"
            title="Báo Cáo Thống Kê & Phân Tích Chất Lượng"
          />
          <p className="text-xs text-slate-400 mt-1 pl-1">
            Tổng hợp dữ liệu học tập, chuyên cần, phổ điểm và xếp loại học lực Lớp 10A1
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
            In báo cáo
          </Button>
          <Button variant="primary" size="sm" icon={Download} onClick={handleExportPDF}>
            Xuất PDF Báo cáo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Điểm TB Toàn Lớp"
          value="8.8"
          subtext="Tăng +0.4 so với tháng trước"
          icon={TrendingUp}
          trend={{ value: '+0.4', isPositive: true }}
          accent="cyan"
        />
        <StatCard
          title="Tỷ lệ chuyên cần tháng"
          value="98.2%"
          subtext="Xếp hạng 1 toàn khối 10"
          icon={CalendarCheck}
          accent="emerald"
        />
        <StatCard
          title="Học sinh Xuất sắc"
          value={excellent}
          subtext="Điểm TB ≥ 9.0"
          icon={Award}
          accent="magenta"
        />
        <StatCard
          title="Học sinh Khá - Giỏi"
          value={good}
          subtext="Điểm TB 8.0 - 8.9"
          icon={Users}
          accent="purple"
        />
      </div>

      {/* Grade Distribution Bar Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-6 space-y-5">
          <h3 className="text-base font-bold text-white tracking-tight">Phổ Điểm Học Lực (GPA)</h3>
          
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-cyan-300">Xuất sắc (9.0 - 10.0)</span>
                <span className="font-mono text-white font-bold">{excellent} học sinh ({Math.round((excellent / students.length) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full"
                  style={{ width: `${(excellent / students.length) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-emerald-300">Giỏi (8.0 - 8.9)</span>
                <span className="font-mono text-white font-bold">{good} học sinh ({Math.round((good / students.length) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                  style={{ width: `${(good / students.length) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-amber-300">Khá (7.0 - 7.9)</span>
                <span className="font-mono text-white font-bold">{average} học sinh ({Math.round((average / students.length) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                  style={{ width: `${(average / students.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers Table */}
        <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-6 space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight">Học Sinh Dẫn Đầu Bảng Xếp Hạng</h3>
          <div className="divide-y divide-white/5 text-xs">
            {students.slice(0, 5).map((s, idx) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-mono font-bold text-cyan-400">#{idx + 1}</span>
                  <UserAvatar
                    src={s.avatar}
                    name={s.name}
                    role="STUDENT"
                    size="xs"
                  />
                  <div>
                    <div className="font-bold text-white">{s.name}</div>
                    <div className="text-[10px] text-slate-400">Tổ {s.group}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-extrabold text-cyan-300 text-sm">{s.gpa}</span>
                  <div className="text-[10px] text-emerald-400">{s.attendanceRate}% CC</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
