import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Upload,
  Code,
  Save,
  Send,
  X,
  Award,
  Unlock,
  Lock,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Check
} from 'lucide-react';
import { Assignment, Submission, QuestionAnswer, User } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StorageService } from '../../services/storage';
import { useToast } from '../../contexts/ToastContext';
import confetti from 'canvas-confetti';

interface StudentAssignmentWorkspaceProps {
  assignment: Assignment;
  studentUser: User;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const StudentAssignmentWorkspace: React.FC<StudentAssignmentWorkspaceProps> = ({
  assignment,
  studentUser,
  onClose,
  onSubmitted,
}) => {
  const { success, error, info } = useToast();
  const existingSub = StorageService.getSubmissions(assignment.id).find(
    (s) => s.studentId === studentUser.id || s.studentId === 'std_01'
  );

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [generalEssay, setGeneralEssay] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(
    assignment.durationMinutes ? assignment.durationMinutes * 60 : 0
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Initialize from existing submission if any (e.g. draft or graded)
  useEffect(() => {
    if (existingSub) {
      if (existingSub.content) setGeneralEssay(existingSub.content);
      if (existingSub.attachments) setUploadedFiles(existingSub.attachments);
      if (existingSub.answers) {
        const initialAnswers: Record<string, any> = {};
        existingSub.answers.forEach((ans) => {
          if (ans.selectedOption !== undefined) initialAnswers[ans.questionId] = ans.selectedOption;
          else if (ans.selectedOptions !== undefined) initialAnswers[ans.questionId] = ans.selectedOptions;
          else if (ans.answerText !== undefined) initialAnswers[ans.questionId] = ans.answerText;
        });
        setAnswers(initialAnswers);
      }
    }
  }, [existingSub]);

  // Timer countdown if duration is limited and not yet graded/submitted
  useEffect(() => {
    if (!assignment.durationMinutes || existingSub?.status === 'submitted' || existingSub?.status === 'graded') {
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [assignment.durationMinutes, existingSub?.status]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (qId: string, optIndex: number, isMulti = false) => {
    if (existingSub && existingSub.status === 'graded') return;
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
    if (existingSub && existingSub.status === 'graded') return;
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSimulateFileUpload = () => {
    if (existingSub && existingSub.status === 'graded') return;
    const sampleFileName = `Bai_lam_${studentUser.name.replace(/\s+/g, '')}_v${uploadedFiles.length + 1}.pdf`;
    setUploadedFiles((prev) => [...prev, sampleFileName]);
    success(`Đã đính kèm tệp: ${sampleFileName}`);
  };

  const buildQuestionAnswers = (): QuestionAnswer[] => {
    if (!assignment.questions) return [];
    return assignment.questions.map((q) => {
      const val = answers[q.id];
      if (q.type === 'single_choice') {
        return {
          questionId: q.id,
          selectedOption: val !== undefined ? Number(val) : undefined,
        };
      }
      if (q.type === 'multiple_choice') {
        return {
          questionId: q.id,
          selectedOptions: Array.isArray(val) ? val : [],
        };
      }
      return {
        questionId: q.id,
        answerText: typeof val === 'string' ? val : '',
      };
    });
  };

  const handleSaveDraft = () => {
    const qAnswers = buildQuestionAnswers();
    StorageService.saveStudentDraftWork(
      assignment.id,
      studentUser.id || 'std_01',
      studentUser.name || 'Trần Minh Đức',
      studentUser.avatar || '',
      generalEssay,
      qAnswers,
      uploadedFiles,
      studentUser
    );
    success('Đã lưu bản nháp thành công! Trạng thái: "Đang làm". Em có thể quay lại làm tiếp bất cứ lúc nào.');
  };

  const handleSubmitFinal = () => {
    const isLate = new Date() > new Date(assignment.dueDate.replace(' ', 'T'));
    const qAnswers = buildQuestionAnswers();

    StorageService.submitStudentWork(
      assignment.id,
      studentUser.id || 'std_01',
      studentUser.name || 'Trần Minh Đức',
      studentUser.avatar || '',
      generalEssay,
      qAnswers,
      uploadedFiles,
      studentUser,
      isLate
    );

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // safe fallback
    }

    setIsConfirmModalOpen(false);
    success(
      isLate
        ? 'Đã nộp bài tập (Ghi nhận nộp muộn sau hạn chót).'
        : `Nộp bài tập "${assignment.title}" thành công! Hệ thống đã ghi nhận.`
    );
    if (onSubmitted) onSubmitted();
  };

  const isGraded = existingSub?.status === 'graded';
  const isSubmitted = existingSub?.status === 'submitted' || existingSub?.status === 'late';
  const canPublishAnswers = assignment.isAnswerPublished;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl bg-[#090d20] border border-cyan-500/30 shadow-2xl overflow-hidden">
        {/* Workspace Top Header */}
        <div className="bg-gradient-to-r from-blue-950 via-[#0d1636] to-cyan-950/80 border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
                Phân hệ Bài tập & Chấm điểm · Môn {assignment.subject}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{assignment.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown timer */}
            {assignment.durationMinutes && assignment.durationMinutes > 0 && !isGraded && !isSubmitted && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs font-mono font-bold text-cyan-300">
                <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Thời gian còn: {formatTimer(timeLeft)}</span>
              </div>
            )}

            {/* Submission Status Badge */}
            {isGraded ? (
              <Badge variant="purple" size="md">Đã chấm: {existingSub?.score} / {assignment.maxScore}đ</Badge>
            ) : isSubmitted ? (
              <Badge variant="emerald" size="md">Đã nộp bài</Badge>
            ) : existingSub?.status === 'in_progress' ? (
              <Badge variant="cyan" size="md">Đang làm (Bản nháp)</Badge>
            ) : (
              <Badge variant="amber" size="md">Chưa làm</Badge>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Graded Result Banner if published */}
          {isGraded && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/80 via-purple-900/40 to-slate-900 border border-violet-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-violet-400" />
                  Kết quả đánh giá từ giáo viên ({existingSub?.gradedBy || 'Giáo viên bộ môn'})
                </span>
                <span className="text-xs text-slate-400">Chấm lúc: {existingSub?.gradedAt}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-cyan-300 font-mono">{existingSub?.score}</span>
                <span className="text-slate-400 text-sm">/ {assignment.maxScore} điểm</span>
              </div>
              {existingSub?.feedback && (
                <div className="mt-2 p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-200 italic leading-relaxed">
                  "{existingSub.feedback}"
                </div>
              )}
              {canPublishAnswers ? (
                <div className="mt-2 text-xs text-emerald-300 flex items-center gap-1.5 font-medium">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Giáo viên đã công bố đáp án chính thức và thang điểm chi tiết bên dưới.</span>
                </div>
              ) : (
                <div className="mt-2 text-xs text-amber-300 flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Đáp án chi tiết đang được giáo viên bảo mật theo quy chế thi.</span>
                </div>
              )}
            </div>
          )}

          {/* Description & Instruction */}
          <div className="rounded-xl bg-slate-900/60 border border-white/10 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-400" />
                <span>Hạn nộp bài: <strong className="text-rose-300 font-mono">{assignment.dueDate}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>Thang điểm: <strong>{assignment.maxScore} điểm</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Nộp muộn: {assignment.allowLateSubmission ? 'Được chấp nhận' : 'Không cho phép'}</span>
              </div>
            </div>

            {assignment.description && (
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {assignment.description}
              </p>
            )}

            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2 items-center text-xs">
                <span className="text-slate-400 font-semibold">Tài liệu tham khảo:</span>
                {assignment.attachments.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 text-cyan-300 border border-white/10 hover:border-cyan-400 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{file}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Questions Container */}
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-base font-bold text-white">Nội dung bài làm</h3>
              {existingSub?.savedAsDraftAt && (
                <span className="text-xs text-slate-400 italic">
                  Đã lưu nháp gần nhất: {existingSub.savedAsDraftAt}
                </span>
              )}
            </div>

            {(!assignment.questions || assignment.questions.length === 0) ? (
              <div className="space-y-4">
                <label className="text-xs text-slate-300 font-medium block">
                  Trình bày bài giải hoặc câu trả lời tự luận:
                </label>
                <textarea
                  value={generalEssay}
                  onChange={(e) => setGeneralEssay(e.target.value)}
                  disabled={isGraded}
                  rows={6}
                  placeholder="Gõ lời giải chi tiết của em tại đây..."
                  className="w-full rounded-xl bg-slate-950/70 border border-white/10 p-3.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                />

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-2">
                    Tệp đính kèm bài làm (Ảnh bài giải, PDF, Word):
                  </label>
                  {!isGraded && (
                    <div
                      onClick={handleSimulateFileUpload}
                      className="border-2 border-dashed border-white/15 hover:border-cyan-400 rounded-xl p-4 text-center cursor-pointer bg-slate-950/40"
                    >
                      <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-300">Bấm để tải tệp bài làm lên</p>
                    </div>
                  )}
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {uploadedFiles.map((fn, fi) => (
                        <span key={fi} className="px-3 py-1 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-xs flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{fn}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              assignment.questions.map((q, idx) => {
                const subAns = existingSub?.answers?.find((a) => a.questionId === q.id);
                return (
                  <div
                    key={q.id || idx}
                    className="rounded-xl bg-slate-900/50 border border-white/10 p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-mono">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs text-slate-400">({q.points} điểm)</span>
                        <Badge variant="purple" size="sm">{q.cognitiveLevel}</Badge>
                      </div>

                      {/* Display score on this question if graded */}
                      {subAns?.score !== undefined && (
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                          {subAns.score} / {q.points} điểm
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-medium text-white leading-relaxed whitespace-pre-wrap">
                      {q.content}
                    </div>

                    {/* Single choice */}
                    {q.type === 'single_choice' && q.options && (
                      <div className="space-y-2 mt-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = answers[q.id] === optIdx;
                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleOptionSelect(q.id, optIdx, false)}
                              className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-3 transition-all ${
                                isGraded
                                  ? 'cursor-default'
                                  : 'cursor-pointer hover:border-cyan-400'
                              } ${
                                isSelected
                                  ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200'
                                  : 'bg-slate-950/40 border-white/5 text-slate-300'
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

                    {/* Multiple choice */}
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="space-y-2 mt-2">
                        {q.options.map((opt, optIdx) => {
                          const selectedList: number[] = answers[q.id] || [];
                          const isChecked = selectedList.includes(optIdx);
                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleOptionSelect(q.id, optIdx, true)}
                              className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-3 transition-all ${
                                isGraded ? 'cursor-default' : 'cursor-pointer hover:border-violet-400'
                              } ${
                                isChecked
                                  ? 'bg-violet-500/15 border-violet-400 text-violet-200'
                                  : 'bg-slate-950/40 border-white/5 text-slate-300'
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

                    {/* Fill in blank */}
                    {q.type === 'fill_in_blank' && (
                      <div className="mt-2">
                        <label className="text-xs text-slate-400 block mb-1">Đáp án của em:</label>
                        <input
                          type="text"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          disabled={isGraded}
                          placeholder="Nhập câu trả lời..."
                          className="w-full max-w-sm rounded-xl bg-slate-950/70 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                        />
                      </div>
                    )}

                    {/* Essay */}
                    {q.type === 'essay' && (
                      <div className="mt-2">
                        <label className="text-xs text-slate-400 block mb-1">Lời giải tự luận:</label>
                        <textarea
                          value={answers[q.id] || ''}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          disabled={isGraded}
                          rows={4}
                          placeholder="Trình bày chi tiết các bước giải..."
                          className="w-full rounded-xl bg-slate-950/70 border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    )}

                    {/* Code */}
                    {q.type === 'code' && (
                      <div className="mt-2 space-y-2">
                        <div className="text-xs text-cyan-300 font-mono flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5" /> Python Code Editor
                        </div>
                        <textarea
                          value={answers[q.id] !== undefined ? answers[q.id] : q.codeTemplate || ''}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          disabled={isGraded}
                          rows={5}
                          className="w-full rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-emerald-400 p-3.5 border border-white/10 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    )}

                    {/* File upload */}
                    {q.type === 'file_upload' && (
                      <div className="mt-2 space-y-2">
                        {!isGraded && (
                          <div
                            onClick={handleSimulateFileUpload}
                            className="border-2 border-dashed border-white/15 hover:border-cyan-400 rounded-xl p-4 text-center cursor-pointer bg-slate-950/40"
                          >
                            <Upload className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                            <p className="text-xs text-slate-300">Tải tệp đính kèm cho câu {idx + 1}</p>
                          </div>
                        )}
                        {uploadedFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2">
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

                    {/* Published official answers & explanations */}
                    {canPublishAnswers && (
                      <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                        <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Đáp án chính thức & Lời giải chuẩn:</span>
                        </div>
                        {q.correctAnswer !== undefined && (
                          <div>
                            <strong>Đáp án:</strong>{' '}
                            {q.options ? q.options[Number(q.correctAnswer)] || q.correctAnswer : q.correctAnswer}
                          </div>
                        )}
                        {q.explanation && <div><strong>Giải thích:</strong> {q.explanation}</div>}
                        {q.rubric && <div><strong>Thang điểm Rubric:</strong> {q.rubric}</div>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {isGraded ? (
              <span>Bài tập đã được chấm và công bố kết quả.</span>
            ) : isSubmitted ? (
              <span>Bài tập đã nộp. Em có thể làm lại nếu giáo viên cho phép.</span>
            ) : (
              <span>Em hãy kiểm tra kỹ trước khi bấm nộp bài chính thức.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isGraded && !isSubmitted && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Save}
                  onClick={handleSaveDraft}
                >
                  Lưu bản nháp
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Send}
                  onClick={() => setIsConfirmModalOpen(true)}
                >
                  Nộp bài ngay
                </Button>
              </>
            )}

            {(isSubmitted || isGraded) && assignment.allowResubmission && (
              <Button
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  if (confirm('Em có chắc chắn muốn làm lại bài tập này? (Giáo viên cho phép làm lại)')) {
                    setIsConfirmModalOpen(true);
                  }
                }}
              >
                Nộp bài làm lại
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0b1026] border border-cyan-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-cyan-400">
              <HelpCircle className="w-6 h-6 text-cyan-400 shrink-0" />
              <h3 className="text-base font-bold text-white">Xác nhận nộp bài tập?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Em đang chuẩn bị nộp bài cho: <strong>{assignment.title}</strong>.<br />
              Hãy chắc chắn rằng em đã kiểm tra kỹ toàn bộ câu trả lời và các tệp đính kèm.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Kiểm tra lại
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                onClick={handleSubmitFinal}
              >
                Xác nhận nộp bài
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
