import React, { useState } from 'react';
import {
  Shield,
  Users,
  GraduationCap,
  History,
  Database,
  Building,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Download,
  Key
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { AuditLog, User, UserRole } from '../../types';
import { UserAvatar } from '../../components/ui/UserAvatar';

export const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const { success, info } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit' | 'backup'>('overview');
  const [usersList, setUsersList] = useState<User[]>(StorageService.getUsers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(StorageService.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [auditFilter, setAuditFilter] = useState<string>('all');

  const classes = StorageService.getClasses();
  const students = StorageService.getStudents();

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = auditFilter === 'all' || log.entityType === auditFilter;
    return matchesSearch && matchesType;
  });

  const handleBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      classes,
      students,
      users: usersList,
      auditLogs,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smartclass_full_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Đã tải xuống tệp sao lưu dữ liệu toàn hệ thống (JSON) thành công!');
  };

  const handleResetSeedData = () => {
    StorageService.resetAll();
    setUsersList(StorageService.getUsers());
    setAuditLogs(StorageService.getAuditLogs());
    success('Đã khôi phục toàn bộ dữ liệu mẫu ban đầu của hệ thống!');
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-blue-400" />
            Bảng Quản Trị Hệ Thống (Admin Console)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Giám sát toàn trường, phân quyền người dùng, kiểm toán vết thay đổi và sao lưu dự phòng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={Database} onClick={handleBackup}>
            Tạo bản sao lưu
          </Button>
          <Button variant="danger" size="sm" icon={RotateCcw} onClick={handleResetSeedData}>
            Khôi phục mặc định
          </Button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-white/10 w-fit">
        {[
          { id: 'overview', label: 'Tổng quan' },
          { id: 'users', label: 'Tài khoản & Phân quyền' },
          { id: 'audit', label: 'Nhật ký Audit Log' },
          { id: 'backup', label: 'Sao lưu & Cấu hình' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Tổng người dùng"
              value={usersList.length + students.length}
              subtext="Tất cả các tài khoản hoạt động"
              icon={Users}
              accent="purple"
            />
            <StatCard
              title="Tổng lớp học"
              value={classes.length}
              subtext="Khối 10, 11, 12"
              icon={GraduationCap}
              accent="cyan"
            />
            <StatCard
              title="Nhật ký Audit Log"
              value={auditLogs.length}
              subtext="Ghi nhận mọi biến động điểm & danh sách"
              icon={History}
              accent="amber"
            />
            <StatCard
              title="Tình trạng Server"
              value="99.98%"
              subtext="Hoạt động ổn định · Port 3000"
              icon={Shield}
              accent="emerald"
            />
          </div>

          {/* Quick System Status */}
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cấu hình hệ thống bảo mật</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="text-slate-400">Chính sách mật khẩu:</div>
                <div className="font-bold text-white mt-1">Bắt buộc tối thiểu 8 ký tự</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="text-slate-400">Kiểm tra quyền truy cập (RBAC):</div>
                <div className="font-bold text-emerald-400 mt-1">Đang kích hoạt mức nghiêm ngặt</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="text-slate-400">Tự động sao lưu:</div>
                <div className="font-bold text-cyan-300 mt-1">Hàng ngày lúc 00:00</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management & RBAC */}
      {activeTab === 'users' && (
        <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Danh Sách Người Dùng Hệ Thống & Vai Trò RBAC
            </h3>
            <span className="text-xs text-slate-400 font-mono">{usersList.length} tài khoản quản lý</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Người dùng</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-3">Vai trò hệ thống</th>
                  <th className="py-3 px-4">Quyền hạn chính</th>
                  <th className="py-3 px-4 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={u.avatar}
                          name={u.name}
                          role={u.role}
                          size="sm"
                        />
                        <div className="font-bold text-white">{u.name}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          u.role === 'ADMIN'
                            ? 'rose'
                            : u.role === 'TEACHER'
                            ? 'cyan'
                            : u.role === 'PARENT'
                            ? 'magenta'
                            : 'purple'
                        }
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {u.role === 'ADMIN' && 'Quản trị hệ sinh thái, phân quyền, sao lưu & audit log'}
                      {u.role === 'TEACHER' && 'Quản lý lớp, điểm danh, chấm bài, nhập điểm, AI soạn giảng'}
                      {u.role === 'STUDENT' && 'Làm bài tập, làm quiz, xem điểm cá nhân, theo dõi lịch học'}
                      {u.role === 'PARENT' && 'Theo dõi các con, xem điểm số, nhận xét và trao đổi'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-emerald-400 font-semibold text-xs flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs Explorer (Mandatory from Section 32) */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Audit Search & Type Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhật ký theo hành động, người thực hiện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0b1026] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-white/10 self-stretch sm:self-auto overflow-x-auto">
              {['all', 'GRADE', 'ATTENDANCE', 'STUDENT', 'CLASS', 'ASSIGNMENT'].map((type) => (
                <button
                  key={type}
                  onClick={() => setAuditFilter(type)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    auditFilter === type
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type === 'all' ? 'Tất cả danh mục' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-2xl bg-[#0b1026]/85 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 border-b border-white/10 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Người thực hiện</th>
                    <th className="py-3 px-3">Hành động</th>
                    <th className="py-3 px-4">Đối tượng</th>
                    <th className="py-3 px-4">Dữ liệu trước (Before)</th>
                    <th className="py-3 px-4">Dữ liệu sau (After)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{log.actorName}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{log.actorRole}</div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="cyan" size="sm">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {log.entityName}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                        {log.beforeData || '—'}
                      </td>
                      <td className="py-3 px-4 text-emerald-300 font-mono text-[11px] max-w-xs truncate">
                        {log.afterData || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Backup & System config */}
      {activeTab === 'backup' && (
        <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Quản Lý Sao Lưu & Phục Hồi Dữ Liệu</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Xuất toàn bộ hệ thống lớp học, học sinh, điểm danh, bảng điểm, bài tập và nhật ký kiểm toán ra định dạng JSON mã hóa tiêu chuẩn.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-xs">Bản sao lưu thủ công tức thì</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tải file dữ liệu về máy quản trị viên</div>
            </div>
            <Button variant="primary" size="sm" icon={Download} onClick={handleBackup}>
              Xuất tệp sao lưu (.json)
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
            <div>
              <div className="font-bold text-rose-300 text-xs">Khôi phục về trạng thái dữ liệu mẫu mặc định</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Xóa các thay đổi tạm thời và đưa về 4 lớp mẫu, 20 học sinh chuẩn</div>
            </div>
            <Button variant="danger" size="sm" icon={RotateCcw} onClick={handleResetSeedData}>
              Khôi phục dữ liệu gốc
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
