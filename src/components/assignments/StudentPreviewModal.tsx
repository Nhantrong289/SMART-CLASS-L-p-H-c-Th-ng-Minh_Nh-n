import React, { useState } from 'react';
import {
  Eye,
  X,
  Clock,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Code,
  Save,
  Send,
  HelpCircle,
  Info,
  Lock,
  Unlock,
  Check
} from 'lucide-react';
import { Assignment, AssignmentQuestion } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface StudentPreviewModalProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentPreviewModal: React.FC<StudentPreviewModalProps> = ({
  assignment,
  isOpen,
  onClose,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [generalEssay, setGeneralEssay] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [showAnswersPreview, setShowAnswersPreview] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleOptionSelect = (qId: string, optIndex: number, isMulti = false) => {
    if (isMulti) {
      const current: number[] = answers[qId] || [];
      const updated = current.includes(optIndex)
        ? current.filter((i) => i !== optIndex)
        : [...current, optIndex];
      setAnswers((prev) => ({ ...prev, [qId]: updated }));
    } else {
      setAnswers((prev) => ({ ...prev, [qId]: optIndex }));
    }
  };

  const handleTextChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSimulateUpload = () => {
    const fakeFileName = `Bai_lam_MinhDuc_cau_hoi_${Date.now().toString().slice(-4)}.pdf`;
    setUploadedFiles((prev) => [...prev, fakeFileName]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#090d20] border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Banner Bar indicating Student Perspective Preview */}
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/30 px-5 py-2.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold uppercase tracking-wider">
              Chế độ xem trước dưới góc nhìn học sinh (Student Preview)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnswersPreview(!showAnswersPreview)}
              className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 flex items-center gap-1.5 cursor-pointer font-medium"
            >
              {showAnswersPreview ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{showAnswersPreview ? 'Ẩn đáp án & Barem' : 'Mô phỏng khi giáo viên công bố đáp án'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header info */}
          <div className="rounded-xl bg-slate-900/60 border border-white/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="text-xs text-cyan-400 font-mono font-medium">Môn: {assignment.subject} · Lớp {assignment.className}</span>
                <h1 className="text-xl font-bold text-white mt-1">{assignment.title}</h1>
                {assignment.topic && (
                  <p className="text-xs text-slate-400 mt-0.5">Chủ đề: {assignment.topic}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="cyan" size="md">Thang {assignment.maxScore} điểm</Badge>
                {assignment.durationMinutes && assignment.durationMinutes > 0 && (
                  <Badge variant="purple" size="md" dot>
                    Thời gian: {assignment.durationMinutes} phút
                  </Badge>
                )}
              </div>
            </div>

            {/* Timings and Guidelines */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-4 h-4 text-rose-400" />
                <span>Hạn nộp: <strong className="text-rose-300 font-mono">{assignment.dueDate}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Nộp muộn: {assignment.allowLateSubmission ? 'Cho phép' : 'Không cho phép'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Làm lại: {assignment.allowResubmission ? `Tối đa ${assignment.maxAttempts || 2} lần` : '1 lần duy nhất'}</span>
              </div>
            </div>

            {assignment.description && (
              <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-white/5 text-xs text-slate-300 leading-relaxed">
                <strong className="text-white block mb-1">Mục tiêu & Hướng dẫn làm bài:</strong>
                {assignment.description}
              </div>
            )}

            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 items-center text-xs">
                <span className="text-slate-400 font-medium">Tệp đính kèm:</span>
                {assignment.attachments.map((file, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-cyan-300 border border-white/10 hover:border-cyan-500/40 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{file}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submission Success Notice (if submitted simulated) */}
          {isSubmitted && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-white">Mô phỏng: Nộp bài thành công!</h4>
                  <p className="text-xs text-emerald-300 mt-0.5">
                    Hệ thống đã ghi nhận bài làm của học sinh. Trạng thái chuyển sang <strong>Đã nộp</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-xs text-emerald-300 underline hover:text-white cursor-pointer"
              >
                Làm lại thử nghiệm
              </button>
            </div>
          )}

          {/* Questions Section */}
          <div className="space-y-5">
            <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-white/10 pb-2">
              <span>Nội dung câu hỏi ({assignment.questions?.length || 0} câu)</span>
              <span className="text-xs font-normal text-slate-400">Học sinh hoàn thành và kiểm tra kỹ trước khi bấm nộp</span>
            </h3>

            {(!assignment.questions || assignment.questions.length === 0) ? (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-white/5 space-y-4">
                <p className="text-sm text-slate-300">
                  Bài tập tự luận / Nộp tệp tổng quan. Học sinh nhập nội dung giải hoặc đính kèm bài làm:
                </p>
                <textarea
                  value={generalEssay}
                  onChange={(e) => setGeneralEssay(e.target.value)}
                  placeholder="Nhập câu trả lời hoặc trình bày lời giải của em tại đây..."
                  rows={5}
                  className="w-full rounded-xl bg-slate-950/60 border border-white/10 p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            ) : (
              assignment.questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="rounded-xl bg-slate-900/50 border border-white/10 p-5 space-y-3.5 transition-all"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-mono">
                        Câu {idx + 1}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">({q.points} điểm)</span>
                      <Badge variant="purple" size="sm">{q.cognitiveLevel}</Badge>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="text-sm font-medium text-white leading-relaxed whitespace-pre-wrap">
                    {q.content}
                  </div>

                  {/* Single Choice (Trắc nghiệm 1 đáp án) */}
                  {q.type === 'single_choice' && q.options && (
                    <div className="space-y-2 mt-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = answers[q.id] === optIdx;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleOptionSelect(q.id, optIdx, false)}
                            className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200'
                                : 'bg-slate-950/40 border-white/5 hover:border-white/20 text-slate-300'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-slate-400'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Multiple Choice (Chọn nhiều đáp án) */}
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs text-cyan-400 italic font-normal">* Chọn tất cả các phương án đúng</p>
                      {q.options.map((opt, optIdx) => {
                        const selectedList: number[] = answers[q.id] || [];
                        const isChecked = selectedList.includes(optIdx);
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleOptionSelect(q.id, optIdx, true)}
                            className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-3 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-violet-500/15 border-violet-400 text-violet-200'
                                : 'bg-slate-950/40 border-white/5 hover:border-white/20 text-slate-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 border ${
                                isChecked ? 'bg-violet-500 border-violet-400 text-white' : 'border-slate-600 bg-white/5'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className="flex-1">
                              <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fill in blank (Điền đáp án) */}
                  {q.type === 'fill_in_blank' && (
                    <div className="mt-2">
                      <label className="text-xs text-slate-400 block mb-1.5 font-medium">Nhập đáp án số hoặc kết quả ngắn:</label>
                      <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder="Ví dụ: 9 hoặc 12.5"
                        className="w-full max-w-sm rounded-xl bg-slate-950/60 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  )}

                  {/* Essay (Tự luận) */}
                  {q.type === 'essay' && (
                    <div className="mt-2 space-y-2">
                      <label className="text-xs text-slate-400 block font-medium">Bài làm tự luận:</label>
                      <textarea
                        value={answers[q.id] || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        rows={4}
                        placeholder="Trình bày các bước giải toán, lập luận hoặc bài văn của em..."
                        className="w-full rounded-xl bg-slate-950/60 border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}

                  {/* Code (Lập trình) */}
                  {q.type === 'code' && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-mono text-cyan-300">
                          <Code className="w-3.5 h-3.5" /> Python 3 Editor
                        </span>
                        <span>Nhấn Tab để thụt dòng</span>
                      </div>
                      <textarea
                        value={answers[q.id] !== undefined ? answers[q.id] : q.codeTemplate || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        rows={5}
                        className="w-full rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-emerald-400 p-3.5 border border-white/10 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}

                  {/* File Upload (Nộp tệp) */}
                  {q.type === 'file_upload' && (
                    <div className="mt-2 space-y-2">
                      <div
                        onClick={handleSimulateUpload}
                        className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-xl p-4 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-900/40 transition-all"
                      >
                        <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-300">
                          Kéo thả hoặc bấm để tải lên tệp bài làm (PDF, Word, Ảnh JPG/PNG tối đa 25MB)
                        </p>
                      </div>
                      {uploadedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {uploadedFiles.map((fn, fi) => (
                            <span key={fi} className="px-2.5 py-1 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-xs flex items-center gap-1.5">
                              <FileText className="w-3 h-3" />
                              <span>{fn}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show Answer Preview (Protected when real, but simulated preview for teacher) */}
                  {showAnswersPreview && (
                    <div className="mt-3 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-300">
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Đáp án & Hướng dẫn chấm (Chỉ hiển thị khi giáo viên công bố):</span>
                      </div>
                      {q.correctAnswer !== undefined && (
                        <div>
                          <strong>Đáp án chuẩn:</strong> {q.options ? q.options[Number(q.correctAnswer)] || q.correctAnswer : q.correctAnswer}
                        </div>
                      )}
                      {q.explanation && <div><strong>Giải thích:</strong> {q.explanation}</div>}
                      {q.rubric && <div><strong>Thang điểm Rubric:</strong> {q.rubric}</div>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Đây là bản giả lập giao diện làm bài của học sinh để giáo viên kiểm tra đề trước khi phát hành.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Save}
              onClick={() => alert('Mô phỏng: Đã lưu bản nháp tiến độ của học sinh thành công!')}
            >
              Lưu bản nháp
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              onClick={() => setIsSubmitted(true)}
            >
              Nộp bài thử nghiệm
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Đóng xem trước
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
