import React, { useState } from 'react';
import { Search, Bell, Sparkles, UserCheck, Shield, GraduationCap, Users, LogOut, ChevronDown, Check, LogIn, Camera, User as UserIcon, Database, Cloud } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import { Modal } from '../ui/Modal';
import { AvatarPicker } from '../ui/AvatarPicker';
import { UserAvatar } from '../ui/UserAvatar';

interface TopBarProps {
  onToggleSidebar?: () => void;
  onOpenQuickTools?: () => void;
  onGoToLogin?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, onOpenQuickTools, onGoToLogin }) => {
  const { user, role, switchRole, logout, selectedChildId, setSelectedChildId, isFirebaseConnected, firebaseProjectId, loginWithGoogle, firebaseUser } = useAuth();
  const { info, success, error: toastError } = useToast();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  const announcements = StorageService.getAnnouncements().slice(0, 4);

  const roleLabels: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
    TEACHER: { label: 'Giáo viên', icon: UserCheck, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
    STUDENT: { label: 'Học sinh', icon: GraduationCap, color: 'text-violet-400 border-violet-500/30 bg-violet-500/10' },
    PARENT: { label: 'Phụ huynh', icon: Users, color: 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10' },
    ADMIN: { label: 'Quản trị viên', icon: Shield, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  };

  const currentRoleInfo = roleLabels[role];

  // If role is PARENT, get children list
  const parentChildren = role === 'PARENT' && user?.childrenIds
    ? user.childrenIds.map(id => StorageService.getStudentById(id)).filter(Boolean)
    : [];

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-[#080b1f]/85 backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Zone 1: Mobile toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
          aria-label="Mở menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <a href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            SMART<span className="text-cyan-400">CLASS</span>
          </span>
        </a>

        {/* Child Switcher if Parent */}
        {role === 'PARENT' && parentChildren.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
            <span className="text-xs text-slate-400 font-medium">Học sinh:</span>
            <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-white/10">
              {parentChildren.map(child => (
                child && (
                  <button
                    key={child.id}
                    onClick={() => {
                      setSelectedChildId(child.id);
                      info(`Đã chuyển sang xem dữ liệu con: ${child.name}`);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                      selectedChildId === child.id
                        ? 'bg-fuchsia-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {child.name} ({child.className})
                  </button>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zone 2: Global Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm lớp học, học sinh, bài tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/10 text-sm text-slate-200 placeholder-slate-500 rounded-xl pl-9 pr-4 py-1.5 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
        </div>
      </div>

      {/* Zone 3: Quick Role Switcher, Notifications & User Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Role Switcher Pill Dropdown (Essential for testing all 4 roles) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${currentRoleInfo.color}`}
            title="Đổi vai trò người dùng để trải nghiệm các cổng"
          >
            <currentRoleInfo.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{currentRoleInfo.label}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-[#0b1026] border border-cyan-500/30 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10 mb-1">
                Chuyển đổi vai trò demo
              </div>
              {(['TEACHER', 'STUDENT', 'PARENT', 'ADMIN'] as UserRole[]).map((r) => {
                const item = roleLabels[r];
                const isActive = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setShowRoleMenu(false);
                      info(`Đã chuyển sang vai trò: ${item.label}`);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-cyan-400" />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            aria-label="Thông báo"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#080b1f]" />
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0b1026] border border-white/10 rounded-2xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Thông báo mới</span>
                <span className="text-[11px] text-cyan-400 font-medium cursor-pointer hover:underline">
                  Đánh dấu đã đọc
                </span>
              </div>
              <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                {announcements.map((ann) => (
                  <div key={ann.id} className="py-2.5 hover:bg-white/5 px-2 rounded-lg transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 line-clamp-1">{ann.title}</span>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2 font-mono">Hôm nay</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nút Đăng Nhập Nhanh */}
        {onGoToLogin && (
          <button
            onClick={onGoToLogin}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 transition-all cursor-pointer shadow-sm"
            title="Mở trang đăng nhập / đổi tài khoản"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Đăng nhập</span>
          </button>
        )}

        {/* User Avatar with Profile Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 border-l border-white/10 hover:opacity-90 transition-opacity cursor-pointer group"
            title="Tùy chọn tài khoản & ảnh chân dung"
          >
            <UserAvatar
              src={user?.avatar}
              name={user?.name || 'User'}
              role={role}
              size="sm"
              showCameraBadge
              imgClassName="border-cyan-500/50 group-hover:ring-2 group-hover:ring-cyan-400 transition-all"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                <span>{user?.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 opacity-70" />
              </div>
              <div className="text-[10px] text-slate-400">{user?.email}</div>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0b1026] border border-cyan-500/30 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 mb-2">
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    src={user?.avatar}
                    name={user?.name}
                    role={role}
                    size="md"
                    imgClassName="border-cyan-400/60"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-xs truncate">{user?.name}</div>
                    <div className="text-[11px] text-cyan-300 font-mono truncate">{user?.email}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{currentRoleInfo.label}</div>
                  </div>
                </div>

                {/* Firebase Connection & Auth Status Banner */}
                <div className="mt-2.5 pt-2.5 border-t border-white/10 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Database className="w-3 h-3" /> Cloud Firestore:
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px]">Đã kết nối</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono">
                    Project: {firebaseProjectId}
                  </div>
                  {firebaseUser ? (
                    <div className="text-[10px] text-emerald-300 font-mono flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Google Auth: {firebaseUser.email}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                      Auth: Tài khoản demo / cục bộ
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                {/* Đăng nhập bằng Google Firebase */}
                {!firebaseUser ? (
                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      try {
                        const res = await loginWithGoogle();
                        if (res.success) {
                          success('Đăng nhập Google thành công qua Firebase Authentication!');
                        } else if (res.cancelled) {
                          info('Đã đóng cửa sổ đăng nhập Google.');
                        } else {
                          toastError(res.message || 'Đăng nhập Google thất bại');
                        }
                      } catch (e: any) {
                        toastError('Đăng nhập Google: ' + (e?.message || 'Thất bại'));
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 rounded-xl transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Đăng nhập với Google</span>
                  </button>
                ) : null}

                {/* Đổi ảnh chân dung */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsAvatarModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-cyan-500/15 rounded-xl transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Đổi ảnh chân dung / avatar</span>
                </button>

                {/* Đăng nhập tài khoản khác */}
                {onGoToLogin && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onGoToLogin();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-emerald-400" />
                    <span>Trang đăng nhập / Chuyển tài khoản</span>
                  </button>
                )}

                {/* Đăng xuất */}
                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await logout();
                    if (onGoToLogin) onGoToLogin();
                    info('Đã đăng xuất khỏi hệ thống');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Đăng xuất hệ thống</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* POPUP: ĐỔI ẢNH CHÂN DUNG GIÁO VIÊN / NGƯỜI DÙNG */}
      {isAvatarModalOpen && (
        <Modal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          title={`Chọn Ảnh Chân Dung: ${user?.name}`}
          subtitle="Tải ảnh chân dung thật hoặc chọn ảnh đại diện sư phạm mẫu cho giáo viên"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <AvatarPicker
              value={user?.avatar || ''}
              onChange={(newUrl) => {
                if (user) {
                  StorageService.updateUserAvatar(user.id, newUrl);
                  success('Đã cập nhật ảnh chân dung mới thành công!');
                }
              }}
              label="Ảnh chân dung đại diện"
              category={role === 'TEACHER' ? 'teacher' : role === 'PARENT' ? 'parent' : 'student'}
            />
            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
};
