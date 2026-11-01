import React, { useState } from 'react';
import {
  GraduationCap,
  CalendarDays,
  FileText,
  HelpCircle,
  BarChart2,
  CalendarCheck,
  Award,
  Clock,
  CheckCircle2,
  Send,
  Upload,
  Trophy,
  ArrowRight,
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
import { Assignment, Submission, Quiz, User } from '../../types';
import { StudentAssignmentWorkspace } from '../../components/assignments/StudentAssignmentWorkspace';
import { UserAvatar, getInitialsAvatar } from '../../components/ui/UserAvatar';

export const StudentPortal: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const student = StorageService.getStudentById('std_01'); // Tran Minh Duc
  const schedule = StorageService.getSchedule();
  const [refreshKey, setRefreshKey] = useState(0);
  const assignments = StorageService.getAssignments('cls_10a1');
  const mySubmissions = StorageService.getStudentSubmissions('std_01');
  const myGrades = StorageService.getGrades('cls_10a1').find((g) => g.studentId === 'std_01');
  const quiz = StorageService.getQuizzes('cls_10a1')[0];

  // Active assignment to open interactive workspace
  const [selectedAsgToSubmit, setSelectedAsgToSubmit] = useState<Assignment | null>(null);

  // Active quiz runner modal
  const [isQuizRunnerOpen, setIsQuizRunnerOpen] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const handleFinishQuiz = () => {
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedQuizAnswers[idx] === q.correctIndex) correct++;
    });
    const finalScore = parseFloat(((correct / quiz.questions.length) * 10).toFixed(1));
    setQuizScore(finalScore);
    success(`Bạn đã hoàn thành Quiz với ${correct}/${quiz.questions.length} câu đúng (${finalScore} điểm)!`);
  };

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b1026] via-[#1a0f35] to-[#080b1f] border border-violet-500/20 p-6 lg:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => setIsAvatarModalOpen(true)}
              title="Đổi ảnh chân dung học sinh"
            >
              <UserAvatar
                src={student?.avatar || user?.avatar}
                name={student?.name || 'Trần Minh Đức'}
                role="STUDENT"
                size="xl"
                imgClassName="!rounded-2xl border-2 border-violet-400 shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-all"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white pointer-events-none">
                <Camera className="w-5 h-5 text-violet-300" />
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">
                Cổng Thông Tin Học Sinh · Lớp 10A1
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                Chào mừng, {student?.name || 'Trần Minh Đức'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Mã HS: <span className="font-mono text-cyan-300 font-bold">{student?.studentCode}</span> · Tổ {student?.group} · Điểm TB hiện tại: <strong className="text-cyan-300 font-mono">{student?.gpa}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={HelpCircle}
              onClick={() => {
                setIsQuizRunnerOpen(true);
                setCurrentQuizIndex(0);
                setSelectedQuizAnswers({});
                setQuizScore(null);
              }}
            >
              Làm Quiz ôn tập
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Điểm Trung Bình"
          value={student?.gpa || 9.4}
          subtext="Xếp loại: Xuất sắc"
          icon={BarChart2}
          accent="cyan"
        />
        <StatCard
          title="Tỷ lệ chuyên cần"
          value={`${student?.attendanceRate || 100}%`}
          subtext="Không vắng buổi nào"
          icon={CalendarCheck}
          accent="emerald"
        />
        <StatCard
          title="Bài tập đã nộp"
          value={mySubmissions.length}
          subtext="1 bài đã được chấm điểm"
          icon={FileText}
          accent="purple"
        />
        <StatCard
          title="Huy hiệu & Khen thưởng"
          value={student?.rewardsCount || 4}
          subtext="Học sinh tiêu biểu tuần"
          icon={Trophy}
          accent="magenta"
        />
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Bài tập cần làm & Lịch học */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bài tập cần làm */}
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-5 shadow-xl">
            <h2 className="text-base font-bold text-white tracking-tight pb-3 border-b border-white/10 flex items-center justify-between">
              <span>Nhiệm vụ học tập & Bài tập về nhà</span>
              <span className="text-xs font-mono text-cyan-400">5 Trạng thái nộp bài chuẩn</span>
            </h2>

            <div className="mt-4 space-y-3">
              {assignments.map((asg) => {
                const sub = mySubmissions.find((s) => s.assignmentId === asg.id);
                const isOverdue = new Date() > new Date(asg.dueDate.replace(' ', 'T'));

                let statusBadge = <Badge variant="amber" size="sm">Chưa làm</Badge>;
                let actionText = 'Làm bài ngay';

                if (sub?.status === 'graded') {
                  statusBadge = <Badge variant="purple" size="sm">Đã chấm: {sub.score}/{asg.maxScore}đ</Badge>;
                  actionText = 'Xem kết quả & Lời phê';
                } else if (sub?.status === 'late') {
                  statusBadge = <Badge variant="rose" size="sm">Nộp muộn</Badge>;
                  actionText = 'Xem bài nộp';
                } else if (sub?.status === 'submitted') {
                  statusBadge = <Badge variant="emerald" size="sm">Đã nộp bài</Badge>;
                  actionText = 'Xem lại bài nộp';
                } else if (sub?.status === 'in_progress') {
                  statusBadge = <Badge variant="cyan" size="sm">Đang làm (Bản nháp)</Badge>;
                  actionText = 'Tiếp tục làm bài';
                } else if (isOverdue) {
                  statusBadge = <Badge variant="rose" size="sm">Quá hạn nộp</Badge>;
                  actionText = asg.allowLateSubmission ? 'Nộp muộn' : 'Đã khóa bài';
                }

                return (
                  <div
                    key={asg.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{asg.title}</span>
                        {statusBadge}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-rose-300">Hạn nộp: {asg.dueDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>Môn {asg.subject}</span>
                        {asg.durationMinutes && asg.durationMinutes > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-cyan-300">Thời gian: {asg.durationMinutes} phút</span>
                          </>
                        )}
                      </div>
                      {sub && sub.score !== undefined && (
                        <div className="mt-2 text-xs font-medium text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/20">
                          Điểm số: <strong className="font-mono text-sm text-white">{sub.score} / {asg.maxScore}</strong>
                          {sub.feedback && <span> · Nhận xét của cô: "{sub.feedback}"</span>}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      <Button
                        variant={sub?.status === 'graded' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => setSelectedAsgToSubmit(asg)}
                      >
                        {actionText}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lịch học hôm nay */}
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-5 shadow-xl">
            <h2 className="text-base font-bold text-white tracking-tight pb-3 border-b border-white/10">
              Lịch học trong ngày
            </h2>
            <div className="mt-4 space-y-2.5">
              {schedule.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-cyan-300 font-mono w-14">Tiết {item.period}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{item.subject}</div>
                      <div className="text-[11px] text-slate-400">{item.time} · {item.room} · {item.teacherName}</div>
                    </div>
                  </div>
                  {item.status === 'completed' && <Badge variant="slate" size="sm">Đã học</Badge>}
                  {item.status === 'ongoing' && <Badge variant="cyan" size="sm" dot>Đang học</Badge>}
                  {item.status === 'upcoming' && <Badge variant="slate" size="sm">Sắp tới</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Bảng điểm cá nhân & Khen thưởng */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-5 shadow-xl">
            <h2 className="text-base font-bold text-white tracking-tight pb-3 border-b border-white/10">
              Bảng điểm cá nhân
            </h2>
            {myGrades && (
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                  <span className="text-slate-400">Thường xuyên 1 (TX1):</span>
                  <span className="font-mono font-bold text-white">{myGrades.tx1}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                  <span className="text-slate-400">Thường xuyên 2 (TX2):</span>
                  <span className="font-mono font-bold text-white">{myGrades.tx2}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                  <span className="text-slate-400">Thường xuyên 3 (TX3):</span>
                  <span className="font-mono font-bold text-white">{myGrades.tx3}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                  <span className="text-slate-400">Giữa kỳ (GK):</span>
                  <span className="font-mono font-bold text-cyan-300">{myGrades.gk}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                  <span className="text-slate-400">Cuối kỳ (CK):</span>
                  <span className="font-mono font-bold text-cyan-300">{myGrades.ck}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 mt-3">
                  <span className="font-bold text-cyan-300 uppercase tracking-wider">Điểm tổng kết (GPA):</span>
                  <span className="font-mono font-extrabold text-base text-cyan-200">{myGrades.gpa}</span>
                </div>
              </div>
            )}
          </div>

          {/* Thành tích */}
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-5 shadow-xl">
            <h2 className="text-base font-bold text-white tracking-tight pb-3 border-b border-white/10 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Thành tích đạt được
            </h2>
            <div className="mt-3 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="font-bold text-amber-300">Học sinh giỏi toàn diện Tháng 9</div>
                <div className="text-[11px] text-slate-300 mt-1">Đạt điểm trung bình các môn trên 9.0</div>
              </div>
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                <div className="font-bold text-cyan-300">Trợ giảng số của lớp</div>
                <div className="text-[11px] text-slate-300 mt-1">+5 điểm tích cực hỗ trợ bạn lập trình thuật toán</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Student Assignment Workspace */}
      {selectedAsgToSubmit && user && (
        <StudentAssignmentWorkspace
          assignment={selectedAsgToSubmit}
          studentUser={user}
          onClose={() => setSelectedAsgToSubmit(null)}
          onSubmitted={() => {
            setSelectedAsgToSubmit(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* Quiz Runner Modal */}
      {isQuizRunnerOpen && (
        <Modal
          isOpen={isQuizRunnerOpen}
          onClose={() => setIsQuizRunnerOpen(false)}
          title={quiz.title}
          subtitle={`Thời lượng: ${quiz.durationMinutes} phút · Câu hỏi ${currentQuizIndex + 1} / ${quiz.questions.length}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            {quizScore === null ? (
              <>
                <div className="p-4 rounded-xl bg-slate-900 border border-white/10">
                  <span className="text-xs text-cyan-400 font-mono font-bold">Câu hỏi {currentQuizIndex + 1}:</span>
                  <h4 className="text-base font-bold text-white mt-1">
                    {quiz.questions[currentQuizIndex].question}
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {quiz.questions[currentQuizIndex].options.map((opt, optIdx) => {
                    const isSelected = selectedQuizAnswers[currentQuizIndex] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() =>
                          setSelectedQuizAnswers((prev) => ({ ...prev, [currentQuizIndex]: optIdx }))
                        }
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <span>
                          {String.fromCharCode(65 + optIdx)}. {opt}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentQuizIndex === 0}
                    onClick={() => setCurrentQuizIndex((i) => i - 1)}
                  >
                    Câu trước
                  </Button>

                  {currentQuizIndex < quiz.questions.length - 1 ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setCurrentQuizIndex((i) => i + 1)}
                    >
                      Câu tiếp theo
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={handleFinishQuiz}>
                      Nộp bài Quiz
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <Trophy className="w-16 h-16 text-amber-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">Kết Quả Bài Kiểm Tra</h3>
                <div className="text-4xl font-extrabold text-cyan-300 font-mono">
                  {quizScore} / 10 điểm
                </div>
                <p className="text-xs text-slate-300">
                  Bạn đã hoàn thành xuất sắc bài kiểm tra trắc nghiệm nhanh. Kết quả được tự động lưu vào hồ sơ cá nhân.
                </p>
                <div className="pt-4">
                  <Button variant="primary" size="sm" onClick={() => setIsQuizRunnerOpen(false)}>
                    Hoàn tất & Đóng
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* POPUP: ĐỔI ẢNH CHÂN DUNG HỌC SINH */}
      {isAvatarModalOpen && (
        <Modal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          title={`Chọn Ảnh Chân Dung Học Sinh: ${student?.name || 'Trần Minh Đức'}`}
          subtitle="Tải ảnh chân dung từ thiết bị hoặc chọn ảnh mẫu học sinh năng động, đồng phục"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <AvatarPicker
              value={student?.avatar || user?.avatar || ''}
              onChange={(newUrl) => {
                if (student && user) {
                  StorageService.updateStudentAvatar(student.id, newUrl, user);
                  StorageService.updateUserAvatar(user.id, newUrl);
                  success('Đã cập nhật ảnh chân dung học sinh thành công!');
                }
              }}
              label="Ảnh chân dung học sinh"
              category="student"
            />
            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer font-bold"
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
