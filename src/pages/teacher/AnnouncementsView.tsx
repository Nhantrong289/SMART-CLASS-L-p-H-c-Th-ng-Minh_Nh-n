import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Send,
  Users,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Announcement } from '../../types';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';

export const AnnouncementsView: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>(StorageService.getAnnouncements());
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'class' | 'parents' | 'students'>('class');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      error('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo');
      return;
    }
    const newAnn: Announcement = {
      id: `ann_${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      authorId: user?.id || 'usr_teacher_1',
      authorName: user?.name || 'Cô Nguyễn Mai Anh',
      authorRole: user?.role || 'TEACHER',
      targetType,
      targetClassId: 'cls_10a1',
      targetClassName: '10A1',
      priority,
      createdAt: new Date().toLocaleString('vi-VN'),
      readCount: 1,
      totalTarget: 20,
    };

    if (user) StorageService.saveAnnouncement(newAnn, user);
    setAnnouncements(StorageService.getAnnouncements());
    setIsCreateOpen(false);
    setTitle('');
    setContent('');
    success(`Đã phát hành thông báo "${newAnn.title}" tới đối tượng được chọn!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <ModuleBreadcrumb
            section="Hệ thống"
            moduleName="Thông báo"
            title="Trung Tâm Thông Báo & Liên Lạc"
          />
          <p className="text-xs text-slate-400 mt-1 pl-1">
            Gửi thông báo đa kênh tới học sinh, phụ huynh và toàn thể thành viên lớp học
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setIsCreateOpen(true)}>
          Tạo thông báo mới
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`p-5 rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border transition-all ${
              ann.priority === 'urgent'
                ? 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                : ann.priority === 'important'
                ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                : 'border-white/10'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Badge
                  variant={
                    ann.priority === 'urgent'
                      ? 'rose'
                      : ann.priority === 'important'
                      ? 'amber'
                      : 'cyan'
                  }
                  size="sm"
                  dot
                >
                  {ann.priority === 'urgent' ? 'Khẩn cấp' : ann.priority === 'important' ? 'Quan trọng' : 'Thông thường'}
                </Badge>
                <h3 className="text-base font-bold text-white">{ann.title}</h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono">{ann.createdAt}</span>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-300 font-semibold">{ann.authorName}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed whitespace-pre-wrap">
              {ann.content}
            </p>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Đối tượng nhận:</span>
                <Badge variant="purple" size="sm">
                  {ann.targetType === 'all'
                    ? 'Toàn trường'
                    : ann.targetType === 'parents'
                    ? 'Phụ huynh 10A1'
                    : ann.targetType === 'students'
                    ? 'Học sinh 10A1'
                    : 'Lớp 10A1'}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-cyan-300">
                <Eye className="w-3.5 h-3.5" />
                <span>{ann.readCount} / {ann.totalTarget} đã đọc</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tạo Thông Báo Mới"
        subtitle="Thông báo sẽ được gửi tức thì đến ứng dụng phụ huynh và học sinh"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tiêu đề thông báo *</label>
            <input
              type="text"
              required
              placeholder="VD: Lịch thi học kỳ I và khảo sát kỹ năng số"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Đối tượng nhận tin</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="class">Toàn bộ Lớp 10A1</option>
                <option value="parents">Chỉ gửi Phụ huynh</option>
                <option value="students">Chỉ gửi Học sinh</option>
                <option value="all">Toàn trường</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="normal">Thông thường</option>
                <option value="important">Quan trọng</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nội dung chi tiết *</label>
            <textarea
              rows={5}
              required
              placeholder="Nhập nội dung thông báo đầy đủ, ngày giờ và lưu ý..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Send}>
              Phát hành thông báo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
