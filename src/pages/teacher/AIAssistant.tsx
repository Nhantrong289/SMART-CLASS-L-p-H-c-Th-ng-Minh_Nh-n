import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  FileText,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  Send,
  Edit3,
  Copy,
  PlusCircle,
  Save
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StorageService } from '../../services/storage';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';

export const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const { success, info } = useToast();
  const [selectedTask, setSelectedTask] = useState<'quiz' | 'assignment' | 'rubric' | 'feedback'>('quiz');
  const [topic, setTopic] = useState('Định lý Cosin và Định lý Sin trong tam giác');
  const [gradeLevel, setGradeLevel] = useState('Lớp 10');
  const [difficulty, setDifficulty] = useState('Vận dụng');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const sampleTemplates = {
    quiz: `[BỘ 3 CÂU HỎI TRẮC NGHIỆM AI GỢI Ý]
Chủ đề: Định lý Cosin và Sin trong tam giác (Lớp 10)

Câu 1: Cho tam giác ABC có a = 8, b = 10, góc C = 60°. Độ dài cạnh c là:
A. 2√21
B. 2√19
C. 3√17
D. 4√5
-> Đáp án đúng: B (Giải thích: Áp dụng c^2 = a^2 + b^2 - 2ab*cosC = 64 + 100 - 160*0.5 = 76 => c = 2√19)

Câu 2: Bán kính đường tròn ngoại tiếp R của tam giác ABC có a = 6 và góc A = 30° là:
A. R = 3
B. R = 6
C. R = 12
D. R = 6√3
-> Đáp án đúng: B (Giải thích: Áp dụng định lý Sin: a / sinA = 2R => 6 / 0.5 = 12 => R = 6)

Câu 3: Trong tam giác ABC, khẳng định nào sau đây là SAI?
A. a^2 = b^2 + c^2 - 2bc*cosA
B. S = 1/2*a*b*sinC
C. a/sinA = b/sinB = c/sinC = R
D. b^2 = a^2 + c^2 - 2ac*cosB
-> Đáp án đúng: C (Vì a/sinA = 2R chứ không phải R)`,

    assignment: `[ĐỀ BÀI TẬP LỚN ỨNG DỤNG THỰC TẾ]
Tiêu đề: Đo chiều cao tháp truyền hình bằng giác kế và định lý Sin/Cosin
Thời lượng: 1 tuần
Yêu cầu:
1. Mô tả cách chọn hai điểm quan sát A và B trên mặt đất cùng nằm trên một đường thẳng với chân tháp.
2. Đo khoảng cách AB = 50m và các góc nâng đỉnh tháp từ A (45°) và B (35°).
3. Lập công thức tính độ cao h của tháp và tính sai số thực nghiệm.
Thang điểm đánh giá:
- Lập luận hình học: 4.0 điểm
- Tính toán & xử lý số liệu: 4.0 điểm
- Đồ thị mô phỏng minh họa: 2.0 điểm`,

    rubric: `[TIÊU CHÍ ĐÁNH GIÁ NĂNG LỰC TOÁN HỌC (RUBRIC)]
Chuyên đề: Giải tam giác & Ứng dụng thực tiễn
Mức 1 (Xuất sắc - 9.0 - 10):
- Nắm vững công thức, vận dụng linh hoạt cả định lý Sin và Cosin vào bài toán thực địa phức tạp.
- Trình bày trực quan, biểu đồ vẽ bằng công cụ số rõ nét, sai số < 1%.

Mức 2 (Đạt yêu cầu - 7.0 - 8.5):
- Áp dụng đúng công thức tính cạnh và góc.
- Tính toán chính xác nhưng chưa tối ưu các bước trung gian.

Mức 3 (Cần cải thiện - < 6.5):
- Nhầm lẫn giữa định lý Sin và Cosin hoặc bấm máy tính nhầm đơn vị Radian/Degree.`,

    feedback: `[GỢI Ý NHẬN XÉT HỌC SINH TOÁN - TIN]
1. Nhận xét học sinh xuất sắc:
"Em thể hiện tư duy thuật toán và lập luận toán học rất sắc bén. Luôn có phương án tối ưu trong các bài tập nhóm. Cần tiếp tục giữ vững phong độ và thử thách các bài toán Olympic."

2. Nhận xét học sinh cần nỗ lực thêm:
"Em có tinh thần cầu tiến và chăm chỉ nghe giảng. Cần chú ý cẩn thận hơn trong khâu biến đổi đại số trung gian và tích cực đặt câu hỏi khi gặp các bài toán thực tế phức tạp."`
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setIsApproved(false);
    setTimeout(() => {
      setGeneratedContent(sampleTemplates[selectedTask]);
      setIsGenerating(false);
      info('Nội dung AI đã được tạo. Vui lòng xem trước và chỉnh sửa trước khi phê duyệt.');
    }, 1200);
  };

  const handleApprove = () => {
    setIsApproved(true);
    success('Đã duyệt nội dung thành công! Bạn có thể lưu vào ngân hàng câu hỏi hoặc giao ngay cho lớp.');
  };

  const handleCopyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      success('Đã sao chép nội dung vào bộ nhớ tạm!');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & BREADCRUMB: 🏠 > Dạy học > AI hỗ trợ • Trợ Lý AI Soạn Giảng & Đề Thi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <ModuleBreadcrumb
            section="Dạy học"
            moduleName="AI hỗ trợ giáo viên"
            title="Trợ Lý AI Soạn Giảng & Đề Thi"
            className="mb-1"
          />
          <p className="text-xs text-slate-400 mt-1">
            Quy trình an toàn EdTech: AI tạo → Xem trước → Giáo viên tinh chỉnh → Giáo viên phê duyệt
          </p>
        </div>
      </div>

      {/* Task Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'quiz', label: 'Tạo bộ câu hỏi Quiz', icon: HelpCircle },
          { id: 'assignment', label: 'Tạo bài tập lớn', icon: FileText },
          { id: 'rubric', label: 'Tạo tiêu chí chấm điểm', icon: BookOpen },
          { id: 'feedback', label: 'Gợi ý nhận xét học sinh', icon: MessageSquare },
        ].map((t) => {
          const Icon = t.icon;
          const isSelected = selectedTask === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTask(t.id as any);
                setGeneratedContent(null);
                setIsApproved(false);
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : 'bg-[#0b1026]/70 border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <Icon className="w-5 h-5 mb-2 text-cyan-400" />
              <div className="text-xs font-bold text-white">{t.label}</div>
            </button>
          );
        })}
      </div>

      {/* Input Parameters Box */}
      <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cấu hình yêu cầu</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Chủ đề bài học</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Đối tượng áp dụng</label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Lớp 10">Lớp 10 (Chương trình mới)</option>
              <option value="Lớp 11">Lớp 11 (Chương trình mới)</option>
              <option value="Lớp 12">Lớp 12 (Ôn thi tốt nghiệp)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mức độ nhận thức</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Nhận biết - Thông hiểu">Nhận biết & Thông hiểu</option>
              <option value="Vận dụng">Vận dụng</option>
              <option value="Vận dụng cao">Vận dụng cao / Tích hợp STEM</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            icon={Sparkles}
            loading={isGenerating}
            onClick={handleGenerate}
          >
            Tạo nội dung với AI
          </Button>
        </div>
      </div>

      {/* AI Output Workspace with Editorial Approval Flow */}
      {generatedContent && (
        <div className="rounded-2xl bg-[#0b1026]/90 backdrop-blur-md border border-cyan-500/30 p-6 space-y-4 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Badge variant={isApproved ? 'emerald' : 'amber'} size="md" dot>
                {isApproved ? 'Đã được giáo viên phê duyệt' : 'Bản nháp AI đề xuất · Cần giáo viên kiểm duyệt'}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={Copy} onClick={handleCopyToClipboard}>
                Sao chép
              </Button>
              {!isApproved && (
                <Button variant="primary" size="sm" icon={CheckCircle2} onClick={handleApprove}>
                  Phê duyệt nội dung
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              Nội dung (Giáo viên có thể chỉnh sửa trực tiếp nội dung bên dưới):
            </label>
            <textarea
              rows={12}
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 font-mono text-xs sm:text-sm text-cyan-100 focus:outline-none focus:border-cyan-400 leading-relaxed"
            />
          </div>

          {isApproved && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <span className="text-xs text-emerald-300 font-medium">
                Nội dung đã sẵn sàng! Bạn có thể lưu vào thư viện bài tập hoặc chuyển sang phòng thi.
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => success('Đã lưu nội dung vào Ngân hàng học liệu thành công!')}
              >
                Lưu vào học liệu lớp 10A1
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
