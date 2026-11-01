import React, { useState } from 'react';
import {
  CheckSquare,
  Sparkles,
  Zap,
  Camera,
  Upload,
  FileCheck,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Award,
  BookOpen
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';
import { UserAvatar } from '../../components/ui/UserAvatar';

interface AutoGradedStudent {
  id: string;
  name: string;
  code: string;
  avatar: string;
  submissionTime: string;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  status: 'graded' | 'flagged' | 'pending';
  aiFeedback: string;
  weakTopics: string[];
}

const MOCK_GRADED_STUDENTS: AutoGradedStudent[] = [
  {
    id: 'hs_1',
    name: 'Nguyễn Văn An',
    code: 'HS001',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    submissionTime: '10:45 16/10/2026',
    correctAnswers: 19,
    totalQuestions: 20,
    score: 9.5,
    status: 'graded',
    aiFeedback: 'Tư duy xuất sắc, giải quyết chính xác các câu hỏi vận dụng cao về hàm số bậc hai.',
    weakTopics: ['Câu 18: Sai số làm tròn'],
  },
  {
    id: 'hs_2',
    name: 'Trần Thị Mai',
    code: 'HS002',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    submissionTime: '10:48 16/10/2026',
    correctAnswers: 18,
    totalQuestions: 20,
    score: 9.0,
    status: 'graded',
    aiFeedback: 'Nắm vững lý thuyết định lý Sin và Cosin, trình bày logic.',
    weakTopics: ['Câu 15: Tính toán nhầm dấu'],
  },
  {
    id: 'hs_3',
    name: 'Lê Hoàng Long',
    code: 'HS003',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    submissionTime: '10:50 16/10/2026',
    correctAnswers: 15,
    totalQuestions: 20,
    score: 7.5,
    status: 'graded',
    aiFeedback: 'Đạt chuẩn kiến thức cơ bản. Cần luyện thêm bài tập giải tam giác thực tế.',
    weakTopics: ['Câu 12, 16: Góc tù trong tam giác'],
  },
  {
    id: 'hs_4',
    name: 'Phạm Minh Đức',
    code: 'HS004',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    submissionTime: '10:52 16/10/2026',
    correctAnswers: 16,
    totalQuestions: 20,
    score: 8.0,
    status: 'graded',
    aiFeedback: 'Tốc độ làm bài tốt, nắm chắc công thức tính diện tích S = 1/2*a*b*sinC.',
    weakTopics: ['Câu 20: Bán kính đường tròn nội tiếp r'],
  },
  {
    id: 'hs_5',
    name: 'Đặng Thảo Vy',
    code: 'HS005',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
    submissionTime: '10:55 16/10/2026',
    correctAnswers: 11,
    totalQuestions: 20,
    score: 5.5,
    status: 'flagged',
    aiFeedback: 'Học sinh nhầm lẫn giữa định lý Sin và định lý Cosin ở phần trắc nghiệm nhanh.',
    weakTopics: ['Hệ thức lượng', 'Công thức Heron'],
  },
];

export const AutoGradingView: React.FC = () => {
  const { success, info } = useToast();
  const [selectedClass, setSelectedClass] = useState('Lớp 10A1');
  const [selectedExam, setSelectedExam] = useState('Kiểm tra 15 phút: Hệ thức lượng tam giác');
  const [gradingMode, setGradingMode] = useState<'mcq_omr' | 'ai_essay'>('mcq_omr');
  const [isScanning, setIsScanning] = useState(false);
  const [students, setStudents] = useState<AutoGradedStudent[]>(MOCK_GRADED_STUDENTS);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<AutoGradedStudent | null>(null);

  const avgScore = (students.reduce((acc, s) => acc + s.score, 0) / students.length).toFixed(1);
  const passRate = ((students.filter((s) => s.score >= 5).length / students.length) * 100).toFixed(0);

  const handleBatchAutoGrade = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      success('Đã quét và chấm tự động toàn bộ 35 bài thi lớp 10A1 thành công! Tỉ lệ đúng trung bình 82%.');
    }, 1500);
  };

  const handleSyncToGradebook = () => {
    success(`Đã đồng bộ điểm số bài thi vào Sổ điểm điện tử môn Toán lớp ${selectedClass}!`);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & BREADCRUMB: 🏠 > Dạy học > Chấm bài tự động • Chấm Tự Động & Quét Phiếu Trắc Nghiệm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <ModuleBreadcrumb
            section="Dạy học"
            moduleName="Chấm bài tự động"
            title="Chấm Tự Động & Quét Phiếu Trắc Nghiệm"
            className="mb-1"
          />
          <p className="text-xs text-slate-400 mt-1">
            Tự động nhận diện phiếu trắc nghiệm (OMR), quét ảnh bài làm, AI chấm tự luận theo Rubrics và đẩy điểm tự động vào Sổ điểm.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleSyncToGradebook}
          >
            Đồng bộ Sổ điểm
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={isScanning ? RefreshCw : Zap}
            disabled={isScanning}
            onClick={handleBatchAutoGrade}
          >
            {isScanning ? 'Đang chấm AI...' : 'Chấm tự động toàn lớp'}
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0b1026]/75 border border-white/10">
          <div className="text-xs text-slate-400 font-medium">Đã chấm xong</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">35/35 HS</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">100% hoàn thành</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0b1026]/75 border border-white/10">
          <div className="text-xs text-slate-400 font-medium">Điểm trung bình</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">{avgScore} điểm</div>
          <div className="text-[10px] text-cyan-400/80 mt-0.5">Cao hơn TB khối +0.4</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0b1026]/75 border border-white/10">
          <div className="text-xs text-slate-400 font-medium">Tỉ lệ trên trung bình</div>
          <div className="text-xl font-bold text-fuchsia-400 mt-1">{passRate}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">34/35 học sinh</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0b1026]/75 border border-white/10">
          <div className="text-xs text-slate-400 font-medium">Tốc độ chấm AI</div>
          <div className="text-xl font-bold text-amber-400 mt-1">0.8 giây/bài</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Tiết kiệm 2.5 giờ</div>
        </div>
      </div>

      {/* Mode Switcher & Filter */}
      <div className="p-3.5 rounded-2xl bg-[#0b1026]/90 border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setGradingMode('mcq_omr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              gradingMode === 'mcq_omr'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quét phiếu trắc nghiệm (OMR)
          </button>
          <button
            type="button"
            onClick={() => setGradingMode('ai_essay')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              gradingMode === 'ai_essay'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chấm tự luận theo Rubrics AI
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="Lớp 10A1">Lớp 10A1 (Sĩ số: 35)</option>
            <option value="Lớp 7A3">Lớp 7A3 (Sĩ số: 40)</option>
            <option value="Lớp 11B1">Lớp 11B1 (Sĩ số: 38)</option>
          </select>

          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white max-w-[280px] truncate"
          >
            <option value="Kiểm tra 15 phút: Hệ thức lượng tam giác">Kiểm tra 15 phút: Hệ thức lượng</option>
            <option value="Bài tập lớn: Mô hình hóa toán học">Bài tập lớn: Mô hình hóa</option>
            <option value="Kiểm tra giữa kỳ 1 môn Toán">Kiểm tra giữa kỳ 1 môn Toán</option>
          </select>
        </div>
      </div>

      {/* Main Student Submissions Table */}
      <div className="rounded-2xl bg-[#0b1026]/90 border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            <span>Danh sách kết quả chấm tự động: {selectedExam}</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">35 bài nộp</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-white/10 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-4">Mã HS</th>
                <th className="py-3 px-4 text-center">Thời gian nộp</th>
                <th className="py-3 px-4 text-center">Số câu đúng</th>
                <th className="py-3 px-4 text-center">Điểm AI chấm</th>
                <th className="py-3 px-4">Nhận xét & Lỗ hổng kiến thức</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        src={st.avatar}
                        name={st.name}
                        role="STUDENT"
                        size="sm"
                      />
                      <span className="font-semibold text-white">{st.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-300 font-bold">{st.code}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{st.submissionTime}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-white">
                      {st.correctAnswers}/{st.totalQuestions}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-sm font-extrabold px-2.5 py-1 rounded-lg ${
                        st.score >= 8.5
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                          : st.score >= 6.5
                          ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {st.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="text-slate-300 truncate" title={st.aiFeedback}>
                      {st.aiFeedback}
                    </div>
                    {st.weakTopics.length > 0 && (
                      <div className="text-[10px] text-rose-400 font-medium mt-0.5 truncate">
                        Cần ôn: {st.weakTopics.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedStudentDetail(st)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      <span>Xem bài</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Xem bài thi & Phiếu chấm */}
      {selectedStudentDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudentDetail(null)}
          title={`Chi Tiết Bài Chấm AI: ${selectedStudentDetail.name} (${selectedStudentDetail.code})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">{selectedStudentDetail.name}</div>
                <div className="text-slate-400 text-xs mt-0.5">Thời gian nộp: {selectedStudentDetail.submissionTime}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-400">{selectedStudentDetail.score} / 10</div>
                <div className="text-[11px] text-slate-400 font-medium">Đúng {selectedStudentDetail.correctAnswers}/20 câu</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1.5">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Phân tích đánh giá từ AI:</span>
              </div>
              <p className="text-slate-200 leading-relaxed">{selectedStudentDetail.aiFeedback}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 space-y-2">
              <div className="font-bold text-white">Kiến thức đề xuất bổ sung:</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedStudentDetail.weakTopics.map((topic, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudentDetail(null)}>
                Đóng
              </Button>
              <Button variant="primary" size="sm" onClick={() => {
                success(`Đã lưu xác nhận điểm cho học sinh ${selectedStudentDetail.name}!`);
                setSelectedStudentDetail(null);
              }}>
                Xác nhận điểm & Đẩy vào Sổ điểm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
