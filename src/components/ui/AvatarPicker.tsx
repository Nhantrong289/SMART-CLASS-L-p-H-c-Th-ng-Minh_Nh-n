import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, RefreshCw, Check, X, Image as ImageIcon, User as UserIcon } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { getInitialsAvatar } from '../../utils/avatar';

// High-quality categorized preset avatars
export const PRESET_AVATARS = {
  student: [
    {
      id: 'stu_boy_1',
      label: 'Nam sinh 1',
      url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'stu_girl_1',
      label: 'Nữ sinh 1',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'stu_boy_2',
      label: 'Nam sinh 2',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'stu_girl_2',
      label: 'Nữ sinh 2',
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'stu_boy_3',
      label: 'Nam sinh kính',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'stu_girl_3',
      label: 'Nữ sinh năng động',
      url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'stu_avatar_1',
      label: 'Hình họa nam',
      url: getInitialsAvatar('Minh Đức', 'STUDENT'),
    },
    {
      id: 'stu_avatar_2',
      label: 'Hình họa nữ',
      url: getInitialsAvatar('Hoàng Yến', 'STUDENT'),
    },
  ],
  parent: [
    {
      id: 'par_dad_1',
      label: 'Bố - Lịch lãm',
      url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'par_mom_1',
      label: 'Mẹ - Dịu dàng',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'par_dad_2',
      label: 'Bố - Trí thức',
      url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'par_mom_2',
      label: 'Mẹ - Hiện đại',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'par_dad_3',
      label: 'Bố - Doanh nhân',
      url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'par_avatar_1',
      label: 'Hình họa phụ huynh',
      url: getInitialsAvatar('Nguyễn Hùng', 'PARENT'),
    },
  ],
  teacher: [
    {
      id: 'tea_fem_1',
      label: 'Cô giáo - Thanh lịch',
      url: 'https://images.unsplash.com/photo-1580894732454-defa4fb240c0?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'tea_fem_2',
      label: 'Cô giáo - Năng động',
      url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'tea_fem_3',
      label: 'Cô giáo - Áo dài',
      url: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'tea_male_1',
      label: 'Thầy giáo - Sư phạm',
      url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'tea_male_2',
      label: 'Thầy giáo - Trẻ trung',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'tea_avatar_1',
      label: 'Hình họa cô giáo',
      url: getInitialsAvatar('Mai Anh', 'TEACHER'),
    },
  ],
};

interface AvatarPickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  category?: 'student' | 'parent' | 'teacher' | 'all';
  compact?: boolean;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  value,
  onChange,
  label = 'Ảnh chân dung',
  category = 'student',
  compact = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'student' | 'parent' | 'teacher'>(
    category === 'all' ? 'student' : category
  );
  const [customUrl, setCustomUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets =
    category === 'all'
      ? PRESET_AVATARS[activeCategory]
      : PRESET_AVATARS[category] || PRESET_AVATARS.student;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const resultUrl = event.target.result as string;
        onChange(resultUrl);
        setIsModalOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRandomize = () => {
    const randomNames = ['Minh Tuấn', 'Hải Đăng', 'Ngọc Ánh', 'Phương Nhi', 'Thanh Tùng', 'Khánh Linh', 'Quốc Bảo'];
    const chosen = randomNames[Math.floor(Math.random() * randomNames.length)];
    const generated = getInitialsAvatar(chosen, (category === 'all' ? activeCategory : category).toUpperCase());
    onChange(generated);
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>{label}</span>
          </label>
          <span className="text-[11px] text-cyan-400/80">Chọn ảnh có sẵn hoặc tải ảnh lên</span>
        </div>
      )}

      {/* Main Avatar Trigger Bar */}
      <div className="flex items-center gap-3 p-2 bg-slate-900/80 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all">
        {/* Preview Circle */}
        <div className="relative group shrink-0">
          <img
            src={value && value.trim().length > 0 && !value.includes('dicebear.com') ? value : getInitialsAvatar(label || 'Người dùng', category.toUpperCase())}
            alt="Portrait Avatar"
            onError={(e) => {
              e.currentTarget.src = getInitialsAvatar(label || 'Người dùng', category.toUpperCase());
            }}
            className="w-14 h-14 rounded-full object-cover border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/20 bg-slate-800"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
            title="Tải ảnh chân dung từ máy"
          >
            <Upload className="w-4 h-4 text-cyan-300" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex-1 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs py-1.5 px-3 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/40"
          >
            Tải ảnh từ máy
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={Sparkles}
            onClick={() => setIsModalOpen(true)}
            className="text-xs py-1.5 px-3 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-950/40"
          >
            Chọn mẫu chân dung ({presets.length})
          </Button>

          <button
            type="button"
            onClick={handleRandomize}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Đổi ảnh ngẫu nhiên"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* QUICK PRESET THUMBNAILS (Horizontal row for instant 1-click select) */}
      {!compact && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
          <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Gợi ý nhanh:</span>
          {presets.slice(0, 6).map((preset) => {
            const isSelected = value === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(preset.url)}
                className={`relative shrink-0 w-8 h-8 rounded-full overflow-hidden transition-all cursor-pointer border ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 border-white scale-110 shadow-md shadow-cyan-500/30'
                    : 'border-white/20 opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                title={preset.label}
              >
                <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                {isSelected && (
                  <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white drop-shadow" />
                  </div>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline shrink-0 font-medium px-1 cursor-pointer"
          >
            Xem tất cả...
          </button>
        </div>
      )}

      {/* POPUP MODAL: THƯ VIỆN CHÂN DUNG ĐẦY ĐỦ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chọn Ảnh Chân Dung Chuyên Nghiệp"
        subtitle="Chọn ảnh mẫu theo vai trò hoặc tải ảnh chân dung thật từ thiết bị của bạn"
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* Category Switcher Tabs */}
          {category === 'all' && (
            <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveCategory('student')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeCategory === 'student'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Học sinh
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('parent')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeCategory === 'parent'
                    ? 'bg-fuchsia-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Phụ huynh
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('teacher')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeCategory === 'teacher'
                    ? 'bg-blue-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Giáo viên
              </button>
            </div>
          )}

          {/* Preset Grid */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Thư viện mẫu chân dung</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {presets.length} ảnh chân dung chất lượng cao
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1">
              {presets.map((preset) => {
                const isSelected = value === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onChange(preset.url);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/30 hover:bg-slate-800'
                    }`}
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white/20 bg-slate-800">
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-cyan-500/40 backdrop-blur-[1px] flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-300 font-medium text-center line-clamp-1">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Image URL or Upload Box */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tải ảnh từ thiết bị hoặc nhập liên kết
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Button
                type="button"
                variant="primary"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                Tải ảnh chân dung từ máy
              </Button>
              <div className="flex-1 w-full flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Hoặc dán link ảnh chân dung trực tiếp (https://...)"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!customUrl.trim()}
                  onClick={() => {
                    if (customUrl.trim()) {
                      onChange(customUrl.trim());
                      setCustomUrl('');
                    }
                  }}
                >
                  Áp dụng
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleRandomize}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tạo ngẫu nhiên một ảnh mới</span>
            </button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Hoàn tất chọn ảnh
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
