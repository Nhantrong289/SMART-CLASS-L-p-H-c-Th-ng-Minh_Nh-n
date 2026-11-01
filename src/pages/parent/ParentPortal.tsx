import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  CalendarCheck,
  BarChart2,
  FileText,
  Award,
  AlertTriangle,
  MessageSquare,
  Send,
  Phone,
  CalendarDays,
  ChevronRight,
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
import { UserAvatar } from '../../components/ui/UserAvatar';

export const ParentPortal: React.FC = () => {
  const { user, selectedChildId, setSelectedChildId } = useAuth();
  const { success, info } = useToast();
  const [isParentAvatarOpen, setIsParentAvatarOpen] = useState(false);

  const childIds = user?.childrenIds || ['std_01', 'std_06'];
  const activeChild = StorageService.getStudentById(selectedChildId || childIds[0]) || StorageService.getStudentById('std_01');
  const allChildren = childIds.map((id) => StorageService.getStudentById(id)).filter(Boolean);

  const grades = StorageService.getGrades('cls_10a1').find((g) => g.studentId === activeChild?.id);
  const submissions = StorageService.getStudentSubmissions(activeChild?.id || 'std_01');
  const behavior = StorageService.getBehavior('cls_10a1').filter((b) => b.studentId === activeChild?.id);

  // Message Teacher modal state
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setIsMessageOpen(false);
    setMessageText('');
    success(`Tin nhắn đã được gửi tới Cô Nguyễn Mai Anh (GVCN lớp ${activeChild?.className})!`);
  };

  return (
    <div className="space-y-6">
      {/* Child Switcher Strip (Prominently featured as required by prompt) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0b1026] via-[#1a0c24] to-[#080b1f] border border-fuchsia-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => setIsParentAvatarOpen(true)}
            title="Đổi ảnh chân dung phụ huynh"
          >
            <UserAvatar
              src={user?.avatar}
              name={user?.name || 'Phụ huynh'}
              role="PARENT"
              size="lg"
              imgClassName="border-2 border-fuchsia-400 group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white pointer-events-none">
              <Camera className="w-3.5 h-3.5 text-fuchsia-300" />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-fuchsia-400 uppercase tracking-widest">
              Cổng Giám Sát Phụ Huynh · Đồng Hành Cùng Con
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
              Phụ huynh: {user?.name || 'Nguyễn Văn Hùng'}
            </h1>
          </div>
        </div>

        {/* Dynamic Child Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-white/10">
          <span className="text-xs text-slate-400 font-semibold px-2">Chọn con:</span>
          {allChildren.map((c) => {
            if (!c) return null;
            const isSelected = activeChild?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedChildId(c.id);
                  info(`Đã chuyển đổi sang hồ sơ của con: ${c.name}`);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserAvatar
                  src={c.avatar}
                  name={c.name}
                  role="STUDENT"
                  size="xs"
                />
                <span>{c.name} ({c.className})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Child Details Snapshot */}
      {activeChild && (
        <div className="p-4 rounded-2xl bg-[#0b1026]/70 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar
              src={activeChild.avatar}
              name={activeChild.name}
              role="STUDENT"
              size="lg"
              imgClassName="border-2 border-fuchsia-400"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{activeChild.name}</h3>
                <Badge variant="magenta" size="sm">Lớp {activeChild.className}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Mã HS: <span className="font-mono text-cyan-300 font-semibold">{activeChild.studentCode}</span> · GVCN: Cô Nguyễn Mai Anh · Hạnh kiểm: <strong className="text-emerald-400">{activeChild.conduct}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="neon-magenta"
              size="sm"
              icon={MessageSquare}
              onClick={() => setIsMessageOpen(true)}
            >
              Nhắn tin với GVCN
            </Button>
          </div>
        </div>
      )}

      {/* KPIs for Selected Child */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Điểm Tổng Kết (GPA)"
          value={activeChild?.gpa || 9.4}
          subtext="Xếp loại học tập: Xuất sắc"
          icon={BarChart2}
          accent="magenta"
        />
        <StatCard
          title="Tỷ lệ chuyên cần"
          value={`${activeChild?.attendanceRate || 100}%`}
          subtext="Đi học đúng giờ đầy đủ"
          icon={CalendarCheck}
          accent="emerald"
        />
        <StatCard
          title="Số bài tập hoàn thành"
          value={`${submissions.length} bài`}
          subtext="Tất cả bài tập đã được nộp"
          icon={FileText}
          accent="cyan"
        />
        <StatCard
          title="Ghi nhận khen thưởng"
          value={activeChild?.rewardsCount || 4}
          subtext="Tuyên dương trước toàn trường"
          icon={Award}
          accent="amber"
        />
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Bảng điểm chi tiết & Tiến độ bài tập */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bảng điểm chi tiết của con */}
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-5 shadow-xl">
            <h2 className="text-base font-bold text-white tracking-tight pb-3 border-b border-white/10 flex items-center justify-between">
              <span>Bảng Điểm Chi Tiết Học Kỳ I</span>
              <span className="text-xs text-fuchsia-400 font-mono">Đồng bộ tự động từ sổ điểm</span>
            </h2>

            {grades && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <div className="text-slate-400 font-medium">TX 1</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">{grades.tx1}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <div className="text-slate-400 font-medium">TX 2</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">{grades.tx2}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <div className="text-slate-400 font-medium">TX 3</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">{grades.tx3}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <div className="text-slate-400 font-medium">Giữa kỳ</div>
                  <div className="text-lg font-bold text-cyan-300 font-mono mt-1">{grades.gk}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <div className="text-slate-400 font-medium">Cuối kỳ</div>
                  <div className="text-lg font-bold text-cyan-300 font-mono mt-1">{grades.ck}</div>
                </div>
                <div className="p-3 rounded-xl bg-fuchsia-950/30 border border-fuchsia-500/40">
                  <div className="text-fuchsia-300 font-bold uppercase">ĐTB Môn</div>
                  <div className="text-lg font-extrabold text-white font-mono mt-1">{grades.gpa}</div>
                </div>
              </div>
            )}
          </div>

          {/* Tiến độ bài tập */}
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-5 shadow-xl">
            <h2 className="text-base font-bold text-white tracking-tight pb-3 border-b border-white/10">
              Tình Trạng Bài Tập Về Nhà
            </h2>
            <div className="mt-4 space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Bài nộp lúc: {sub.submittedAt}</span>
                      <Badge variant="emerald" size="sm">Đã chấm điểm</Badge>
                    </div>
                    <div className="text-slate-400 mt-1 line-clamp-1">{sub.content}</div>
                    {sub.feedback && (
                      <div className="text-cyan-300 mt-1.5 italic bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/20">
                        Nhận xét: "{sub.feedback}"
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold text-fuchsia-400 font-mono">{sub.score} / 10đ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Nhận xét giáo viên & Cảnh báo / Điểm danh */}
        <div className="space-y-6">
          {/* Nhận xét của GVCN */}
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-5 shadow-xl">
            <h2 className="text-base font-bold text-white tracking-tight pb-3 border-b border-white/10 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-fuchsia-400" />
              Nhận xét định kỳ của GVCN
            </h2>
            <div className="mt-3.5 space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Cô Nguyễn Mai Anh (GVCN)</span>
                  <span className="font-mono">03/10/2026</span>
                </div>
                <p className="text-slate-200 leading-relaxed italic">
                  "{activeChild?.name} học tập rất nghiêm túc, tích cực xung phong giải các bài toán nâng cao và có tinh thần đồng đội cao. Gia đình hãy tiếp tục khích lệ cháu tham gia đội tuyển học sinh giỏi."
                </p>
              </div>
            </div>
          </div>

          {/* Ghi nhận hành vi & rèn luyện */}
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-5 shadow-xl">
            <h2 className="text-base font-bold text-white tracking-tight pb-3 border-b border-white/10">
              Nhật ký rèn luyện & Thi đua
            </h2>
            <div className="mt-3 space-y-2 text-xs">
              {behavior.map((b) => (
                <div key={b.id} className="p-2.5 rounded-lg bg-slate-900/50 border border-white/5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-white">{b.title}</span>
                    <span className={b.points > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {b.points > 0 ? '+' : ''}{b.points} điểm
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Message Teacher Modal */}
      <Modal
        isOpen={isMessageOpen}
        onClose={() => setIsMessageOpen(false)}
        title={`Trao Đổi Với Giáo Viên Chủ Nhiệm (Cô Nguyễn Mai Anh)`}
        subtitle={`Về tình hình học tập của em ${activeChild?.name} (Lớp ${activeChild?.className})`}
        maxWidth="md"
      >
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nội dung trao đổi / Xin phép</label>
            <textarea
              rows={5}
              required
              placeholder="Kính gửi cô giáo chủ nhiệm, phụ huynh xin phép trao đổi về việc..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-fuchsia-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsMessageOpen(false)}>
              Hủy
            </Button>
            <Button variant="neon-magenta" size="sm" type="submit" icon={Send}>
              Gửi tin nhắn
            </Button>
          </div>
        </form>
      </Modal>

      {/* POPUP: ĐỔI ẢNH CHÂN DUNG PHỤ HUYNH */}
      {isParentAvatarOpen && (
        <Modal
          isOpen={isParentAvatarOpen}
          onClose={() => setIsParentAvatarOpen(false)}
          title={`Chọn Ảnh Chân Dung Phụ Huynh: ${user?.name || 'Nguyễn Văn Hùng'}`}
          subtitle="Tải ảnh chân dung từ máy hoặc chọn ảnh mẫu phụ huynh (bố hoặc mẹ) trang nhã"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <AvatarPicker
              value={user?.avatar || ''}
              onChange={(newUrl) => {
                if (user) {
                  StorageService.updateUserAvatar(user.id, newUrl);
                  success('Đã cập nhật ảnh chân dung phụ huynh thành công!');
                }
              }}
              label="Ảnh chân dung phụ huynh"
              category="parent"
            />
            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setIsParentAvatarOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition-all cursor-pointer font-bold"
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
