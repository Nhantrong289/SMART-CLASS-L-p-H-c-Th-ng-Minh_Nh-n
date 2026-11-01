import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Shield,
  UserCheck,
  GraduationCap,
  Users,
  Lock,
  Mail,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  UserPlus,
  LogIn,
  User,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types';
import { UserAvatar } from '../../components/ui/UserAvatar';

interface LoginPageProps {
  onBackToHome: () => void;
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome, onLoginSuccess }) => {
  const { login, loginWithGoogle, registerWithEmail, loginWithEmail } = useAuth();
  const { success, error, info } = useToast();

  // Mode: 'login' or 'register' (matching screenshot tabs)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  // Login form state
  const [selectedRole, setSelectedRole] = useState<UserRole>('TEACHER');
  const [email, setEmail] = useState('teacher@smartclass.edu.vn');
  const [password, setPassword] = useState('smartclass2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state (matching screenshot: Họ và tên, Email đăng ký, Vai trò, Mật khẩu, Xác nhận mật khẩu)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('TEACHER');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Loading states
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo accounts map with real portraits
  const demoAccounts: Record<UserRole, { email: string; name: string; roleName: string; avatar: string }> = {
    TEACHER: {
      email: 'teacher@smartclass.edu.vn',
      name: 'Cô Nguyễn Mai Anh',
      roleName: 'Giáo viên Chủ nhiệm 10A1',
      avatar: 'https://images.unsplash.com/photo-1580894732454-defa4fb240c0?auto=format&fit=crop&w=256&h=256&q=80',
    },
    STUDENT: {
      email: 'student@smartclass.edu.vn',
      name: 'Trần Minh Đức',
      roleName: 'Học sinh Lớp 10A1',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
    },
    PARENT: {
      email: 'parent@smartclass.edu.vn',
      name: 'Nguyễn Văn Hùng',
      roleName: 'Phụ huynh 2 học sinh',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80',
    },
    ADMIN: {
      email: 'admin@smartclass.edu.vn',
      name: 'Lê Tuấn Kiệt',
      roleName: 'Quản trị viên Hệ thống',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    },
  };

  const handleSelectRole = (r: UserRole) => {
    setSelectedRole(r);
    setEmail(demoAccounts[r].email);
  };

  // Google Sign-in action with graceful popup cancellation handling
  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        success('Đăng nhập thành công với Google qua Firebase Authentication!');
        onLoginSuccess(res.user?.role || 'TEACHER');
      } else if (res.cancelled) {
        info('Đã đóng cửa sổ đăng nhập Google.');
      } else {
        error(res.message || 'Đăng nhập Google thất bại.');
      }
    } catch (err: any) {
      error('Lỗi đăng nhập Google: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await loginWithEmail(email, password, selectedRole);
      if (res.success) {
        success(`Đăng nhập thành công với vai trò: ${demoAccounts[res.user?.role || selectedRole]?.roleName || res.user?.role || selectedRole}!`);
        onLoginSuccess(res.user?.role || selectedRole);
      } else {
        error(res.message || 'Thông tin đăng nhập hoặc mật khẩu không hợp lệ.');
      }
    } catch (err: any) {
      error('Lỗi khi đăng nhập: ' + (err?.message || 'Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFullName.trim()) {
      error('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!regEmail.trim()) {
      error('Vui lòng nhập email đăng ký.');
      return;
    }
    if (regPassword.length < 6) {
      error('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      error('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerWithEmail({
        name: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
      });

      if (res.success) {
        success(res.message || 'Đăng ký tài khoản thành công!');
        onLoginSuccess(regRole);
      } else {
        error(res.message || 'Đăng ký tài khoản thất bại.');
      }
    } catch (err: any) {
      error('Lỗi khi tạo tài khoản: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex flex-col lg:flex-row selection:bg-cyan-500/30">
      {/* Left Column: Cyberpunk Illustration & Highlights */}
      <div className="lg:w-1/2 relative bg-gradient-to-br from-[#080b1f] via-[#101035] to-[#050816] p-8 lg:p-16 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
        <div className="absolute inset-0 bg-digital-grid opacity-60 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Top brand */}
        <div className="relative z-10">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang chủ</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              SMART<span className="text-cyan-400">CLASS</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-6">
            Nền Tảng Quản Lý Lớp Học & Giáo Dục Số
          </h2>
          <p className="text-sm text-slate-300 mt-2 max-w-md leading-relaxed">
            Hệ thống phân quyền thông minh tích hợp Firebase Authentication, Cloud Firestore thời gian thực và tự động đồng bộ hồ sơ.
          </p>
        </div>

        {/* Mid quote / highlight */}
        <div className="relative z-10 my-8 p-6 rounded-2xl bg-[#0b1026]/75 border border-cyan-500/30 backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            Bảo Mật Đa Tầng Firebase Authentication
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hỗ trợ đăng ký và đăng nhập nhanh bằng Email, mật khẩu được mã hóa chuẩn Firebase, đồng thời liên kết xác thực bằng tài khoản Google chỉ với 1 cú click.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-400 font-mono">
            <div>✓ Firebase Auth</div>
            <div>✓ Cloud Firestore</div>
            <div>✓ Security Rules</div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 text-xs text-slate-500 font-mono">
          © 2026 SMART CLASS ACADEMY · POWERED BY EDTECH AI
        </div>
      </div>

      {/* Right Column: Auth Container */}
      <div className="lg:w-1/2 p-6 sm:p-10 lg:p-14 flex flex-col justify-center my-auto max-w-xl mx-auto w-full">
        <div className="space-y-6">
          {/* Top Auth Mode Tabs (Exact match with user design screenshot) */}
          <div className="p-1 rounded-xl bg-slate-900/90 border border-white/10 flex items-center">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng ký tài khoản</span>
            </button>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {authMode === 'register' ? 'Tạo tài khoản mới' : 'Đăng nhập hệ thống'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {authMode === 'register'
                ? 'Đăng ký tài khoản để quản lý lớp học và kết nối dữ liệu Firebase'
                : 'Đăng nhập qua Google (Firebase Auth) hoặc tài khoản đã đăng ký'}
            </p>
          </div>

          {/* Primary Google Login Button */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={isGoogleSigningIn}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm shadow-lg shadow-white/5 transition-all cursor-pointer select-none disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isGoogleSigningIn ? 'Đang kết nối Google...' : 'Tiếp tục với tài khoản Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#050816] px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0 font-mono">
                {authMode === 'register' ? 'HOẶC EMAIL HỆ THỐNG' : 'HOẶC ĐĂNG NHẬP EMAIL'}
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>
          </div>

          {/* ================= REGISTER VIEW ================= */}
          {authMode === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Họ và tên <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Phan Hoàng Khải"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Email đăng ký */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email đăng ký <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="khai@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vai trò <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer appearance-none"
                  >
                    <option value="TEACHER">Giáo viên</option>
                    <option value="STUDENT">Học sinh</option>
                    <option value="PARENT">Phụ huynh</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    ▼
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>Lưu ý: Không thể tự đăng ký quyền Admin trực tuyến.</span>
                </p>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mật khẩu <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Ít nhất 6 ký tự"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Xác nhận mật khẩu <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại mật khẩu"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={showRegConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full shadow-lg shadow-cyan-500/25 font-bold cursor-pointer"
                  icon={ArrowRight}
                  iconPosition="right"
                  type="submit"
                >
                  {isSubmitting ? 'Đang tạo tài khoản...' : 'ĐĂNG KÝ TÀI KHOẢN'}
                </Button>
              </div>

              {/* Toggle back to login */}
              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">Đã có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-500 font-mono">
                Hệ thống bảo mật xác thực Firebase Auth & Cloud Firestore.
              </div>
            </form>
          ) : (
            /* ================= LOGIN VIEW ================= */
            <div className="space-y-5">
              {/* Role Selector Tabs with Portraits */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Chọn vai trò hoặc tài khoản trải nghiệm:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'TEACHER', label: 'Giáo viên', icon: UserCheck },
                    { id: 'STUDENT', label: 'Học sinh', icon: GraduationCap },
                    { id: 'PARENT', label: 'Phụ huynh', icon: Users },
                    { id: 'ADMIN', label: 'Quản trị', icon: Shield },
                  ].map((item) => {
                    const isSelected = selectedRole === item.id;
                    const acc = demoAccounts[item.id as UserRole];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectRole(item.id as UserRole)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                            : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="relative">
                          <UserAvatar
                            src={acc.avatar}
                            name={acc.name}
                            role={item.id as UserRole}
                            size="md"
                            imgClassName={isSelected ? 'border-cyan-400 scale-105 ring-2 ring-cyan-400/40' : 'border-white/20 opacity-80'}
                          />
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-semibold">{item.label}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[90px]">{acc.name.split(' ').slice(-2).join(' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email / Tên đăng nhập
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-white/20 text-cyan-500"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => info('Vui lòng liên hệ Quản trị viên để đặt lại mật khẩu.')}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full shadow-lg shadow-cyan-500/20 font-bold cursor-pointer"
                    icon={ArrowRight}
                    iconPosition="right"
                    type="submit"
                  >
                    {isSubmitting ? 'Đang đăng nhập...' : `ĐĂNG NHẬP VỚI VAI TRÒ ${demoAccounts[selectedRole]?.roleName || selectedRole}`}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      login(demoAccounts[selectedRole].email, selectedRole);
                      success(`Vào ngay với vai trò ${demoAccounts[selectedRole].name}!`);
                      onLoginSuccess(selectedRole);
                    }}
                    className="w-full py-2.5 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 transition-colors cursor-pointer"
                  >
                    ⚡ Vào nhanh trực tiếp (1-Click Demo)
                  </button>
                </div>
              </form>

              {/* Toggle to register */}
              <div className="text-center pt-1">
                <span className="text-xs text-slate-400">Chưa có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  Đăng ký tài khoản ngay
                </button>
              </div>

              {/* Quick Account Hint Card */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">Tài khoản demo: </span>
                  <span className="text-cyan-300">{demoAccounts[selectedRole].name}</span> ({demoAccounts[selectedRole].email})
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-500 font-mono">
                Hệ thống bảo mật xác thực Firebase Auth & Cloud Firestore.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
