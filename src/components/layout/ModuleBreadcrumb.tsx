import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface ModuleBreadcrumbProps {
  section: string;      // e.g. "Lớp học", "Dạy học", "Theo dõi", "Công cụ lớp học", "Hệ thống"
  moduleName: string;   // e.g. "Lớp học của tôi", "Điểm danh", "Giao bài tập", "Ngân hàng câu hỏi"
  title: string;        // e.g. "Quản lý Lớp học", "Sổ Điểm Danh Điện Tử"
  className?: string;
  extra?: React.ReactNode;
}

export const ModuleBreadcrumb: React.FC<ModuleBreadcrumbProps> = ({
  section,
  moduleName,
  title,
  className = '',
  extra,
}) => {
  return (
    <div className={`flex items-center gap-2 text-xs text-slate-400 flex-wrap ${className}`}>
      <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-cyan-400 shrink-0">
        <Home className="w-4 h-4" />
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
      <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
        {section}
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
      <span className="text-slate-300 font-medium">{moduleName}</span>
      <span className="text-slate-600 font-bold">•</span>
      <h1 className="font-extrabold text-white text-sm sm:text-base tracking-tight">
        {title}
      </h1>
      {extra && <div className="ml-1">{extra}</div>}
    </div>
  );
};
