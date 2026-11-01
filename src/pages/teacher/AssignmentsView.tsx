import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Send,
  Eye,
  Paperclip,
  Check,
  ArrowLeft,
  Layers,
  ChevronDown,
  Pencil,
  Trash2,
  Copy,
  Archive,
  RotateCcw,
  Sparkles,
  Users,
  Search,
  Filter,
  BarChart2,
  Award,
  Bell,
  Download,
  Printer,
  Unlock,
  Lock,
  Code,
  FolderOpen,
  Settings,
  HelpCircle,
  Database,
  ExternalLink,
  Info
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { StorageService } from '../../services/storage';
import { AIAssignmentService } from '../../services/aiAssignmentService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Assignment,
  Submission,
  AssignmentQuestion,
  AssignmentQuestionType,
  CognitiveLevel,
  Student,
  QuestionAnswer
} from '../../types';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';
import { StudentPreviewModal } from '../../components/assignments/StudentPreviewModal';
import { UserAvatar } from '../../components/ui/UserAvatar';

type SubMenuTab =
  | 'overview'
  | 'list'
  | 'create'
  | 'assign'
  | 'submissions'
  | 'grading'
  | 'analytics'
  | 'settings';

export const AssignmentsView: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  // Active Sub-Menu Tab (Section 12 of Design Document)
  const [activeTab, setActiveTab] = useState<SubMenuTab>('list');

  // Master Data State
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    StorageService.getAssignments('cls_10a1')
  );
  const students = useMemo(() => StorageService.getStudents('cls_10a1'), []);

  // Filter & Search states for 'list' tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    'all' | 'active' | 'draft' | 'expired' | 'archived'
  >('all');

  // Active selection for Submissions Tracking / Grading / Assign / Edit
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    assignments[0]?.id || ''
  );
  const selectedAssignment = useMemo(
    () => assignments.find((a) => a.id === selectedAssignmentId) || assignments[0],
    [assignments, selectedAssignmentId]
  );

  // Student Preview Modal State
  const [previewAssignment, setPreviewAssignment] = useState<Assignment | null>(null);

  // Delete Confirmation Modal State
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);

  // Create / Edit Form State
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('Toán học');
  const [formTopic, setFormTopic] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formClassId, setFormClassId] = useState('cls_10a1');
  const [formMaxScore, setFormMaxScore] = useState(10);
  const [formDurationMinutes, setFormDurationMinutes] = useState(45);
  const [formOpenDate, setFormOpenDate] = useState('2026-10-01 07:00');
  const [formDueDate, setFormDueDate] = useState('2026-10-15 23:59');
  const [formAllowLate, setFormAllowLate] = useState(true);
  const [formAllowResubmission, setFormAllowResubmission] = useState(true);
  const [formMaxAttempts, setFormMaxAttempts] = useState(2);
  const [formOfficialSolution, setFormOfficialSolution] = useState('');
  const [formTeacherNote, setFormTeacherNote] = useState('');
  const [formQuestions, setFormQuestions] = useState<AssignmentQuestion[]>([]);

  // AI Question Generation Modal State (Section 11)
  const [isAIGenModalOpen, setIsAIGenModalOpen] = useState(false);
  const [aiGenSubject, setAiGenSubject] = useState('Toán học');
  const [aiGenTopic, setAiGenTopic] = useState('Định lý Sin và Cosin trong tam giác');
  const [aiGenLevel, setAiGenLevel] = useState<CognitiveLevel>('Vận dụng');
  const [aiGenCount, setAiGenCount] = useState(2);
  const [isAILoading, setIsAILoading] = useState(false);

  // Assign Step State (Section 5)
  const [assignTargetType, setAssignTargetType] = useState<'all_class' | 'specific_students' | 'groups'>('all_class');
  const [assignSelectedStudentIds, setAssignSelectedStudentIds] = useState<string[]>([]);
  const [assignSelectedGroup, setAssignSelectedGroup] = useState<number>(1);
  const [assignMessage, setAssignMessage] = useState('Các em hoàn thành bài tập trước hạn nộp.');

  // Grading Workspace State (Section 8)
  const [activeGradingSub, setActiveGradingSub] = useState<Submission | null>(null);
  const [gradingScore, setGradingScore] = useState<string>('');
  const [gradingFeedback, setGradingFeedback] = useState<string>('');
  const [gradingQuestionScores, setGradingQuestionScores] = useState<Record<string, { score: number; comment: string; isCorrect: boolean }>>({});
  const [gradingReason, setGradingReason] = useState<string>('');
  const [isAIFeedbackLoading, setIsAIFeedbackLoading] = useState(false);

  // Reload assignments helper
  const reloadData = () => {
    setAssignments(StorageService.getAssignments('cls_10a1'));
  };

  // Filtered Assignments for 'list' tab
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (selectedSubjectFilter !== 'all' && a.subject !== selectedSubjectFilter) return false;
      if (selectedStatusFilter === 'archived') {
        if (!a.isArchived) return false;
      } else if (selectedStatusFilter !== 'all') {
        if (a.isArchived) return false;
        if (a.status !== selectedStatusFilter) return false;
      } else {
        // 'all' shows non-archived by default
        if (a.isArchived) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          (a.topic && a.topic.toLowerCase().includes(q)) ||
          a.subject.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assignments, selectedSubjectFilter, selectedStatusFilter, searchQuery]);

  // Submissions for Selected Assignment in 'submissions' tab
  const currentSubmissions = useMemo(() => {
    if (!selectedAssignment) return [];
    return StorageService.getSubmissions(selectedAssignment.id);
  }, [selectedAssignment, assignments]);

  // Map each student to their submission state (5 statuses from Section 7)
  const studentSubmissionRows = useMemo(() => {
    if (!selectedAssignment) return [];
    const isOverdue = new Date() > new Date(selectedAssignment.dueDate.replace(' ', 'T'));

    return students.map((std) => {
      const sub = currentSubmissions.find((s) => s.studentId === std.id);
      let statusLabel: 'Đã chấm' | 'Đã nộp' | 'Nộp muộn' | 'Đang làm' | 'Chưa nộp';
      let statusColor: 'purple' | 'emerald' | 'rose' | 'cyan' | 'amber';

      if (sub?.status === 'graded') {
        statusLabel = 'Đã chấm';
        statusColor = 'purple';
      } else if (sub?.status === 'late') {
        statusLabel = 'Nộp muộn';
        statusColor = 'rose';
      } else if (sub?.status === 'submitted') {
        statusLabel = 'Đã nộp';
        statusColor = 'emerald';
      } else if (sub?.status === 'in_progress') {
        statusLabel = 'Đang làm';
        statusColor = 'cyan';
      } else {
        statusLabel = isOverdue ? 'Nộp muộn' : 'Chưa nộp';
        statusColor = isOverdue ? 'rose' : 'amber';
      }

      return {
        student: std,
        submission: sub,
        statusLabel,
        statusColor,
      };
    });
  }, [students, currentSubmissions, selectedAssignment]);

  // Submission statistics count
  const submissionStats = useMemo(() => {
    let graded = 0;
    let submitted = 0;
    let notSubmitted = 0;
    let overdue = 0;

    studentSubmissionRows.forEach((r) => {
      if (r.statusLabel === 'Đã chấm') graded++;
      else if (r.statusLabel === 'Đã nộp') submitted++;
      else if (r.statusLabel === 'Nộp muộn') overdue++;
      else notSubmitted++;
    });

    return { graded, submitted, notSubmitted, overdue, total: studentSubmissionRows.length };
  }, [studentSubmissionRows]);

  // ================= HANDLERS ================= //

  // Switch to Create Mode
  const handleStartCreate = () => {
    setEditingAssignmentId(null);
    setFormTitle('');
    setFormSubject('Toán học');
    setFormTopic('');
    setFormDescription('');
    setFormMaxScore(10);
    setFormDurationMinutes(45);
    setFormOpenDate('2026-10-01 07:00');
    setFormDueDate('2026-10-15 23:59');
    setFormAllowLate(true);
    setFormAllowResubmission(true);
    setFormMaxAttempts(2);
    setFormOfficialSolution('');
    setFormTeacherNote('');
    setFormQuestions([]);
    setActiveTab('create');
  };

  // Switch to Edit Mode
  const handleStartEdit = (asg: Assignment) => {
    setEditingAssignmentId(asg.id);
    setFormTitle(asg.title);
    setFormSubject(asg.subject);
    setFormTopic(asg.topic || '');
    setFormDescription(asg.description);
    setFormMaxScore(asg.maxScore);
    setFormDurationMinutes(asg.durationMinutes || 0);
    setFormOpenDate(asg.openDate || '2026-10-01 07:00');
    setFormDueDate(asg.dueDate);
    setFormAllowLate(asg.allowLateSubmission ?? true);
    setFormAllowResubmission(asg.allowResubmission ?? true);
    setFormMaxAttempts(asg.maxAttempts || 2);
    setFormOfficialSolution(asg.officialSolution || '');
    setFormTeacherNote(asg.teacherNote || '');
    setFormQuestions(asg.questions ? [...asg.questions] : []);
    setActiveTab('create');
  };

  // Save Assignment (Draft or Published)
  const handleSaveAssignmentForm = (status: 'draft' | 'active') => {
    if (!formTitle.trim()) {
      error('Vui lòng nhập tên bài tập!');
      return;
    }
    if (!user) return;

    const payload: Assignment = {
      id: editingAssignmentId || `asg_${Date.now()}`,
      classId: formClassId,
      className: '10A1',
      title: formTitle.trim(),
      subject: formSubject,
      topic: formTopic.trim(),
      description: formDescription.trim(),
      assignedDate: new Date().toISOString().split('T')[0],
      openDate: formOpenDate,
      dueDate: formDueDate,
      maxScore: Number(formMaxScore) || 10,
      durationMinutes: Number(formDurationMinutes) || 0,
      allowLateSubmission: formAllowLate,
      allowResubmission: formAllowResubmission,
      maxAttempts: Number(formMaxAttempts) || 2,
      status,
      submissionCount: editingAssignmentId ? selectedAssignment?.submissionCount || 0 : 0,
      gradedCount: editingAssignmentId ? selectedAssignment?.gradedCount || 0 : 0,
      totalStudents: students.length,
      teacherUid: user.id,
      teacherName: user.name,
      teacherNote: formTeacherNote.trim(),
      officialSolution: formOfficialSolution.trim(),
      questions: formQuestions,
      isAnswerPublished: editingAssignmentId ? selectedAssignment?.isAnswerPublished || false : false,
      attachments: ['Huong_dan_giai_chi_tiet.pdf'],
    };

    StorageService.saveAssignment(payload, user);
    reloadData();
    setSelectedAssignmentId(payload.id);
    success(
      editingAssignmentId
        ? `Đã cập nhật bài tập "${payload.title}"!`
        : `Đã tạo bài tập mới "${payload.title}" (${status === 'draft' ? 'Bản nháp' : 'Đang mở'})!`
    );
    setActiveTab('list');
  };

  // Duplicate / Clone Assignment
  const handleDuplicate = (asg: Assignment) => {
    if (!user) return;
    const duplicated = StorageService.duplicateAssignment(asg.id, user);
    reloadData();
    if (duplicated) {
      setSelectedAssignmentId(duplicated.id);
      success(`Đã nhân bản bài tập thành công: "${duplicated.title}"!`);
    }
  };

  // Archive / Unarchive
  const handleToggleArchive = (asg: Assignment) => {
    if (!user) return;
    const nextArchived = !asg.isArchived;
    StorageService.archiveAssignment(asg.id, nextArchived, user);
    reloadData();
    success(
      nextArchived
        ? `Đã chuyển bài tập "${asg.title}" vào lưu trữ.`
        : `Đã mở lại bài tập "${asg.title}".`
    );
  };

  // Delete Assignment
  const handleConfirmDelete = () => {
    if (!deletingAssignment || !user) return;
    StorageService.deleteAssignment(deletingAssignment.id, user);
    reloadData();
    success(`Đã xóa vĩnh viễn bài tập "${deletingAssignment.title}".`);
    setDeletingAssignment(null);
  };

  // Publish / Unpublish Answer Keys (Section 3 & 17: Bảo mật đáp án)
  const handleTogglePublishAnswers = (asg: Assignment) => {
    if (!user) return;
    const next = !asg.isAnswerPublished;
    StorageService.publishAssignmentAnswers(asg.id, next, user);
    reloadData();
    success(
      next
        ? `Đã công bố đáp án và thang điểm cho bài tập "${asg.title}". Học sinh có thể xem kết quả đối chiếu!`
        : `Đã bảo mật lại đáp án cho bài tập "${asg.title}".`
    );
  };

  // Batch Remind non-submitted students (Section 7: Gửi nhắc nhở hàng loạt)
  const handleSendBatchReminder = () => {
    if (!selectedAssignment || !user) return;
    const nonSubmitted = studentSubmissionRows
      .filter((r) => r.statusLabel === 'Chưa nộp' || r.statusLabel === 'Nộp muộn')
      .map((r) => r.student.name);

    if (nonSubmitted.length === 0) {
      info('Tất cả học sinh trong lớp đều đã nộp bài tập này!');
      return;
    }

    StorageService.sendBatchReminder(selectedAssignment.id, nonSubmitted, user);
    success(
      `Đã gửi thông báo nhắc nhở hàng loạt tới ${nonSubmitted.length} học sinh chưa nộp bài!`
    );
  };

  // Export submissions to Excel (CSV UTF-8 BOM)
  const handleExportExcel = () => {
    if (!selectedAssignment) return;
    const headers = ['Mã học sinh', 'Họ và tên', 'Tổ', 'Trạng thái', 'Thời gian nộp', 'Điểm số', 'Nhận xét'];
    const rows = studentSubmissionRows.map((r) => [
      r.student.studentCode,
      `"${r.student.name}"`,
      r.student.group,
      r.statusLabel,
      r.submission?.submittedAt || 'Chưa nộp',
      r.submission?.score !== undefined ? r.submission.score : 'Chưa chấm',
      `"${(r.submission?.feedback || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tien_do_nop_bai_${selectedAssignment.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Đã xuất báo cáo tiến độ bài tập ra tệp Excel (.csv) thành công!');
  };

  // AI Generator for Cognitive Level Questions (Section 11)
  const handleGenerateAIQuestions = async () => {
    setIsAILoading(true);
    try {
      const generated = await AIAssignmentService.generateQuestionsByCognitiveLevel(
        aiGenSubject,
        aiGenTopic,
        aiGenLevel,
        aiGenCount
      );
      setFormQuestions((prev) => [...prev, ...generated]);
      setIsAIGenModalOpen(false);
      success(
        `Trợ lý AI đã khởi tạo thành công ${generated.length} câu hỏi mức độ "${aiGenLevel}" chuẩn GDPT 2018!`
      );
    } catch (err) {
      error('Không thể tạo câu hỏi tự động. Vui lòng thử lại!');
    } finally {
      setIsAILoading(false);
    }
  };

  // Add Manual Question
  const handleAddManualQuestion = (type: AssignmentQuestionType) => {
    const newQ: AssignmentQuestion = {
      id: `q_man_${Date.now()}`,
      order: formQuestions.length + 1,
      type,
      cognitiveLevel: 'Thông hiểu',
      content: type === 'single_choice'
        ? 'Chọn khẳng định đúng trong các phương án sau:'
        : 'Nội dung câu hỏi yêu cầu giải quyết:',
      points: 2.5,
      options: type === 'single_choice' || type === 'multiple_choice'
        ? ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D']
        : undefined,
      correctAnswer: type === 'single_choice' ? '0' : undefined,
      explanation: 'Giải thích chi tiết phương pháp giải...',
    };
    setFormQuestions((prev) => [...prev, newQ]);
  };

  // Delete Question from form
  const handleDeleteQuestion = (qId: string) => {
    setFormQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  // Open Grading Workspace for a specific student submission
  const handleOpenGradingModal = (sub: Submission) => {
    setActiveGradingSub(sub);
    setGradingScore(sub.score !== undefined ? String(sub.score) : sub.draftScore !== undefined ? String(sub.draftScore) : '');
    setGradingFeedback(sub.feedback || '');
    setGradingReason('');

    // Pre-fill question scores
    const initialScores: Record<string, { score: number; comment: string; isCorrect: boolean }> = {};
    if (selectedAssignment?.questions) {
      selectedAssignment.questions.forEach((q) => {
        const matchingAns = sub.answers?.find((a) => a.questionId === q.id);
        initialScores[q.id] = {
          score: matchingAns?.score ?? (q.type === 'single_choice' && matchingAns?.isCorrect ? q.points : 0),
          comment: matchingAns?.comment || '',
          isCorrect: matchingAns?.isCorrect ?? false,
        };
      });
    }
    setGradingQuestionScores(initialScores);
  };

  // Save Draft Grade (Step 1 of Section 8)
  const handleSaveDraftGrade = () => {
    if (!activeGradingSub || !user) return;
    const scoreNum = parseFloat(gradingScore) || 0;
    StorageService.saveDraftGrade(
      activeGradingSub.id,
      scoreNum,
      gradingFeedback,
      activeGradingSub.answers,
      user
    );
    reloadData();
    success(`Đã lưu điểm nháp (${scoreNum}đ) cho học sinh ${activeGradingSub.studentName}. (Học sinh chưa thấy)`);
  };

  // Publish Grade (Step 2 & 3 of Section 8)
  const handlePublishGrade = () => {
    if (!activeGradingSub || !user || !selectedAssignment) return;
    const scoreNum = parseFloat(gradingScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > selectedAssignment.maxScore) {
      error(`Điểm phải nằm trong thang điểm từ 0 đến ${selectedAssignment.maxScore}!`);
      return;
    }

    StorageService.publishSubmissionGrade(
      activeGradingSub.id,
      scoreNum,
      gradingFeedback,
      activeGradingSub.answers,
      user,
      gradingReason
    );
    reloadData();
    setActiveGradingSub(null);
    success(`Đã chính thức công bố điểm cho học sinh ${activeGradingSub.studentName}: ${scoreNum} điểm!`);
  };

  // Request AI to Suggest Feedback (Section 11)
  const handleAISuggestFeedback = async () => {
    if (!activeGradingSub || !selectedAssignment) return;
    setIsAIFeedbackLoading(true);
    try {
      const score = parseFloat(gradingScore) || 8.0;
      const res = await AIAssignmentService.suggestFeedback(
        activeGradingSub.studentName,
        score,
        selectedAssignment.maxScore,
        selectedAssignment.topic || selectedAssignment.title,
        activeGradingSub.content || ''
      );
      setGradingFeedback(res.feedback);
      success('Trợ lý AI đã soạn xong nhận xét sư phạm gợi ý! Thầy/cô có thể chỉnh sửa trước khi công bố.');
    } catch (err) {
      error('Không thể tạo gợi ý nhận xét AI.');
    } finally {
      setIsAIFeedbackLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <ModuleBreadcrumb
            section="Dạy học"
            moduleName="Giao bài tập"
            title="Phân hệ Giao bài tập & Chấm điểm"
          />
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Soạn đề thông minh, giao bài theo năng lực, theo dõi tiến độ nộp bài và chấm điểm tự động / thủ công chuẩn GDPT 2018.
          </p>
        </div>

        {/* Global Fast Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={handleStartCreate}
          >
            Tạo bài tập mới
          </Button>
          {selectedAssignment && (
            <Button
              variant="primary"
              size="sm"
              icon={Eye}
              onClick={() => setPreviewAssignment(selectedAssignment)}
            >
              Xem trước góc nhìn HS
            </Button>
          )}
        </div>
      </div>

      {/* Sub-menu Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 scrollbar-thin">
        {[
          { id: 'overview', label: '1. Tổng quan', icon: BarChart2 },
          { id: 'list', label: '2. Danh sách bài tập', icon: FileText },
          { id: 'create', label: '3. Soạn đề / Tạo mới', icon: Plus },
          { id: 'assign', label: '4. Giao bài tập', icon: Send },
          { id: 'submissions', label: '5. Bài nộp học sinh', icon: Users },
          { id: 'grading', label: '6. Chấm điểm', icon: Award },
          { id: 'analytics', label: '7. Thống kê – Báo cáo', icon: BarChart2 },
          { id: 'settings', label: '8. Cài đặt bài tập', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as SubMenuTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: TỔNG QUAN (OVERVIEW) ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-[#0b1026]/90 border border-cyan-500/20 p-5 shadow-xl">
              <span className="text-xs text-slate-400 font-medium">Tổng bài tập đã tạo</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{assignments.length}</span>
                <span className="text-xs text-cyan-400">Đang hoạt động</span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#0b1026]/90 border border-emerald-500/20 p-5 shadow-xl">
              <span className="text-xs text-slate-400 font-medium">Tỷ lệ hoàn thành nộp bài</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">82.5%</span>
                <span className="text-xs text-emerald-400">Lớp 10A1</span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#0b1026]/90 border border-amber-500/20 p-5 shadow-xl">
              <span className="text-xs text-slate-400 font-medium">Bài nộp đang chờ chấm</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">6 bài</span>
                <span className="text-xs text-amber-400">Cần trả bài</span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#0b1026]/90 border border-purple-500/20 p-5 shadow-xl">
              <span className="text-xs text-slate-400 font-medium">Hạn nộp gần nhất</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-bold text-rose-300 font-mono">Hôm nay 23:59</span>
                <span className="text-xs text-slate-400">Toán học</span>
              </div>
            </div>
          </div>

          {/* Quick Hub Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Deadlines */}
            <div className="lg:col-span-2 rounded-2xl bg-[#0b1026]/80 border border-white/10 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Bài tập đang mở & Tiến độ thực hiện</span>
                </h3>
                <button
                  onClick={() => setActiveTab('list')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium"
                >
                  Xem toàn bộ ({assignments.length}) &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {assignments.slice(0, 4).map((asg) => {
                  const percent = Math.round((asg.submissionCount / (asg.totalStudents || 20)) * 100);
                  return (
                    <div
                      key={asg.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{asg.title}</span>
                          <Badge variant="cyan" size="sm">Lớp {asg.className}</Badge>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span>Môn: {asg.subject}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-rose-300 font-mono">Hạn nộp: {asg.dueDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-28 space-y-1 text-right">
                          <div className="text-xs font-mono text-cyan-300 font-semibold">
                            {asg.submissionCount}/{asg.totalStudents} em ({percent}%)
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedAssignmentId(asg.id);
                            setActiveTab('submissions');
                          }}
                        >
                          Xem tiến độ
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="rounded-2xl bg-[#0b1026]/80 border border-white/10 p-5 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Thao tác nhanh phân hệ</span>
              </h3>

              <div className="space-y-2.5">
                <button
                  onClick={handleStartCreate}
                  className="w-full p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 text-left transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Soạn đề & Tạo bài tập mới</div>
                    <div className="text-[11px] text-slate-400">Hỗ trợ 6 dạng bài và AI 4 mức độ Bloom</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    if (selectedAssignment) setPreviewAssignment(selectedAssignment);
                  }}
                  className="w-full p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 text-left transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Xem trước góc nhìn học sinh</div>
                    <div className="text-[11px] text-slate-400">Kiểm thử bài làm và đồng hồ đếm ngược</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('assign')}
                  className="w-full p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 text-left transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500 group-hover:text-slate-950 transition-colors">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Giao bài cá nhân hóa / nhóm</div>
                    <div className="text-[11px] text-slate-400">Chọn lớp, học sinh cụ thể hoặc tổ học tập</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="w-full p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 text-left transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Phổ điểm & Báo cáo kết quả</div>
                    <div className="text-[11px] text-slate-400">Phân tích điểm yếu và xuất file Excel</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DANH SÁCH BÀI TẬP (LIST) ================= */}
      {activeTab === 'list' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#0b1026]/80 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài tập theo tên, chủ đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/80 border border-white/10 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Subject Filter */}
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="rounded-xl bg-slate-900/80 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="all">Tất cả môn</option>
                <option value="Toán học">Toán học</option>
                <option value="Tin học & AI">Tin học & AI</option>
                <option value="Vật lí">Vật lí</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Ngữ văn">Ngữ văn</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="rounded-xl bg-slate-900/80 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang mở (Active)</option>
                <option value="draft">Bản nháp (Draft)</option>
                <option value="expired">Đã hết hạn (Expired)</option>
                <option value="archived">Đã lưu trữ (Archived)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleStartCreate}
              >
                Tạo bài tập mới
              </Button>
            </div>
          </div>

          {/* Assignments Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.map((asg) => {
              const percent = Math.round((asg.submissionCount / (asg.totalStudents || 20)) * 100);
              const isSelected = selectedAssignmentId === asg.id;

              return (
                <div
                  key={asg.id}
                  onClick={() => setSelectedAssignmentId(asg.id)}
                  className={`rounded-2xl bg-[#0b1026]/90 border p-5 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-cyan-400 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="cyan" size="sm">{asg.subject}</Badge>
                      <div className="flex items-center gap-1.5">
                        {asg.status === 'active' && <Badge variant="emerald" size="sm" dot>Đang mở</Badge>}
                        {asg.status === 'draft' && <Badge variant="amber" size="sm">Bản nháp</Badge>}
                        {asg.status === 'expired' && <Badge variant="rose" size="sm">Hết hạn</Badge>}
                        {asg.isArchived && <Badge variant="slate" size="sm">Lưu trữ</Badge>}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2">{asg.title}</h3>
                      {asg.topic && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">Chủ đề: {asg.topic}</p>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span>Hạn nộp:</span>
                        <span className="font-mono text-rose-300 font-semibold">{asg.dueDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Thang điểm:</span>
                        <span className="font-mono text-white font-bold">{asg.maxScore} điểm</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Số câu hỏi:</span>
                        <span className="font-mono text-cyan-300">{asg.questions?.length || 'Tự luận/Tệp'}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Tiến độ nộp bài:</span>
                        <span className="text-cyan-300 font-mono font-bold">
                          {asg.submissionCount}/{asg.totalStudents} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      {/* Student Preview button */}
                      <button
                        title="Xem trước góc nhìn học sinh"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewAssignment(asg);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Duplicate button */}
                      <button
                        title="Nhân bản bài tập"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(asg);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Edit button */}
                      <button
                        title="Chỉnh sửa nội dung & câu hỏi"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(asg);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Toggle Archive button */}
                      <button
                        title={asg.isArchived ? 'Khôi phục bài tập' : 'Lưu trữ bài tập'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleArchive(asg);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                      >
                        {asg.isArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </button>

                      {/* Delete button (with confirmation modal) */}
                      <button
                        title="Xóa bài tập"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingAssignment(asg);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAssignmentId(asg.id);
                        setActiveTab('submissions');
                      }}
                    >
                      Tiến độ & Bài nộp
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAssignments.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-white/5 space-y-3">
              <FileText className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">Không tìm thấy bài tập nào phù hợp với bộ lọc hiện tại.</p>
              <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setSelectedSubjectFilter('all'); setSelectedStatusFilter('all'); }}>
                Xóa bộ lọc tìm kiếm
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: SOẠN ĐỀ / TẠO MỚI (CREATE) ================= */}
      {activeTab === 'create' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="rounded-2xl bg-[#0b1026]/90 border border-white/10 p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {editingAssignmentId ? 'Chỉnh sửa bài tập & Cập nhật câu hỏi' : 'Tạo bài tập mới & Soạn đề'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thiết lập thông tin bài tập, câu hỏi 6 dạng và đáp án bảo mật (Mục 3 & 4)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => setIsAIGenModalOpen(true)}
                >
                  AI Tạo câu hỏi 4 mức độ
                </Button>
              </div>
            </div>

            {/* General Settings Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Tên bài tập <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài tập Toán – Khảo sát hàm số bậc hai"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Môn học:</label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Tin học & AI">Tin học & AI</option>
                  <option value="Vật lí">Vật lí</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Chủ đề kiến thức:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chương I - Mệnh đề và tập hợp"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Thang điểm tối đa:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formMaxScore}
                  onChange={(e) => setFormMaxScore(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Thời gian làm bài (0 = không giới hạn):
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={formDurationMinutes}
                  onChange={(e) => setFormDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Thời gian mở đề:</label>
                <input
                  type="text"
                  value={formOpenDate}
                  onChange={(e) => setFormOpenDate(e.target.value)}
                  placeholder="YYYY-MM-DD HH:mm"
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Hạn chót nộp bài <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  placeholder="YYYY-MM-DD HH:mm"
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Số lần làm lại tối đa:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formMaxAttempts}
                  onChange={(e) => setFormMaxAttempts(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Mô tả / Hướng dẫn học sinh:
                </label>
                <textarea
                  rows={2}
                  placeholder="Nêu rõ yêu cầu giải chi tiết, cách vẽ hình hoặc quy định cách trình bày bài làm..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Đáp án & Thang điểm bảo mật (Chỉ giáo viên thấy trước khi công bố):
                </label>
                <textarea
                  rows={2}
                  placeholder="Nhập barem chấm, lời giải mẫu hoặc tiêu chí đánh giá..."
                  value={formOfficialSolution}
                  onChange={(e) => setFormOfficialSolution(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Questions Builder Section */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Bộ câu hỏi bài tập ({formQuestions.length} câu)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hỗ trợ 6 dạng bài tập chuẩn GDPT 2018 và phân hóa 4 mức độ nhận thức
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Sparkles}
                    onClick={() => setIsAIGenModalOpen(true)}
                  >
                    AI Sinh câu hỏi
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddManualQuestion('single_choice')}
                  >
                    + Trắc nghiệm
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddManualQuestion('fill_in_blank')}
                  >
                    + Điền đáp án
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddManualQuestion('essay')}
                  >
                    + Tự luận
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddManualQuestion('file_upload')}
                  >
                    + Nộp tệp
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddManualQuestion('code')}
                  >
                    + Lập trình
                  </Button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {formQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-3 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-300 text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
                          Câu {idx + 1}
                        </span>
                        <select
                          value={q.cognitiveLevel}
                          onChange={(e) => {
                            const val = e.target.value as CognitiveLevel;
                            setFormQuestions((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, cognitiveLevel: val } : item))
                            );
                          }}
                          className="rounded-lg bg-slate-800 border border-white/10 px-2 py-1 text-xs text-white cursor-pointer"
                        >
                          <option value="Nhận biết">Nhận biết</option>
                          <option value="Thông hiểu">Thông hiểu</option>
                          <option value="Vận dụng">Vận dụng</option>
                          <option value="Vận dụng cao">Vận dụng cao</option>
                        </select>
                        <span className="text-xs text-slate-400">Dạng: {q.type}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Điểm:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={q.points}
                          onChange={(e) => {
                            const pts = parseFloat(e.target.value) || 0;
                            setFormQuestions((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, points: pts } : item))
                            );
                          }}
                          className="w-16 rounded bg-slate-800 border border-white/10 px-2 py-0.5 text-xs text-white text-center font-mono"
                        />
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={q.content}
                      onChange={(e) => {
                        const txt = e.target.value;
                        setFormQuestions((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, content: txt } : item))
                        );
                      }}
                      className="w-full rounded-lg bg-slate-950/60 border border-white/10 p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                    />

                    {/* Options if single choice */}
                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {q.options.map((opt, optI) => (
                          <div key={optI} className="flex items-center gap-2">
                            <span className="w-5 text-xs font-bold text-cyan-400 font-mono">
                              {String.fromCharCode(65 + optI)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormQuestions((prev) =>
                                  prev.map((item, i) => {
                                    if (i !== idx) return item;
                                    const nextOpts = [...(item.options || [])];
                                    nextOpts[optI] = val;
                                    return { ...item, options: nextOpts };
                                  })
                                );
                              }}
                              className="flex-1 rounded-lg bg-slate-950/60 border border-white/10 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={String(q.correctAnswer) === String(optI)}
                              onChange={() => {
                                setFormQuestions((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, correctAnswer: String(optI) } : item))
                                );
                              }}
                              title="Đánh dấu đáp án đúng"
                              className="cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('list')}
              >
                Hủy bỏ
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSaveAssignmentForm('draft')}
                >
                  Lưu bản nháp
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveAssignmentForm('active')}
                >
                  {editingAssignmentId ? 'Cập nhật bài tập' : 'Hoàn tất & Giao bài ngay'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: GIAO BÀI TẬP (ASSIGN) ================= */}
      {activeTab === 'assign' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="rounded-2xl bg-[#0b1026]/90 border border-white/10 p-6 space-y-6 shadow-2xl">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Giao bài tập cho học sinh & Thiết lập phân hóa
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chọn đối tượng nhận bài (Cả lớp, học sinh cụ thể hoặc theo nhóm/tổ), hẹn giờ mở và thông báo tự động (Mục 5).
              </p>
            </div>

            {/* Select Assignment to Assign */}
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Chọn bài tập cần giao:</label>
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.subject} · Hạn nộp: {a.dueDate})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Options */}
            <div className="space-y-3">
              <label className="text-xs text-slate-300 font-semibold block">Đối tượng nhận bài tập:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setAssignTargetType('all_class')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    assignTargetType === 'all_class'
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900/50 border-white/10 text-slate-300'
                  }`}
                >
                  <Users className="w-5 h-5 text-cyan-400 mb-1" />
                  <div className="text-xs font-bold text-white">Toàn bộ lớp 10A1</div>
                  <div className="text-[11px] text-slate-400">Giao đồng loạt cho tất cả 20 học sinh</div>
                </div>

                <div
                  onClick={() => setAssignTargetType('specific_students')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    assignTargetType === 'specific_students'
                      ? 'bg-violet-500/15 border-violet-400 text-violet-200'
                      : 'bg-slate-900/50 border-white/10 text-slate-300'
                  }`}
                >
                  <Award className="w-5 h-5 text-violet-400 mb-1" />
                  <div className="text-xs font-bold text-white">Chọn học sinh cụ thể</div>
                  <div className="text-[11px] text-slate-400">Cá nhân hóa (Bồi dưỡng giỏi / Phụ đạo)</div>
                </div>

                <div
                  onClick={() => setAssignTargetType('groups')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    assignTargetType === 'groups'
                      ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                      : 'bg-slate-900/50 border-white/10 text-slate-300'
                  }`}
                >
                  <Layers className="w-5 h-5 text-amber-400 mb-1" />
                  <div className="text-xs font-bold text-white">Giao theo Tổ / Nhóm</div>
                  <div className="text-[11px] text-slate-400">Bài tập dự án nhóm hoặc thi đua tổ</div>
                </div>
              </div>
            </div>

            {/* Specific Students Selection Matrix if chosen */}
            {assignTargetType === 'specific_students' && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    Chọn học sinh nhận bài ({assignSelectedStudentIds.length}/{students.length} đã chọn):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAssignSelectedStudentIds(students.map((s) => s.id))}
                      className="text-cyan-400 hover:underline cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <span aria-hidden="true">·</span>
                    <button
                      onClick={() => setAssignSelectedStudentIds([])}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {students.map((s) => {
                    const isChecked = assignSelectedStudentIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                          isChecked
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                            : 'bg-slate-950/40 border-white/5 text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignSelectedStudentIds((prev) => [...prev, s.id]);
                            } else {
                              setAssignSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                            }
                          }}
                        />
                        <span className="truncate">{s.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message to students */}
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Lời nhắn gửi học sinh & Thông báo tự động:
              </label>
              <textarea
                rows={3}
                value={assignMessage}
                onChange={(e) => setAssignMessage(e.target.value)}
                className="w-full rounded-xl bg-slate-900/90 border border-white/10 p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Submit Assign */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                variant="primary"
                size="md"
                icon={Send}
                onClick={() => {
                  if (!user || !selectedAssignment) return;
                  const ann = {
                    id: `ann_assign_${Date.now()}`,
                    title: `[Bài tập mới] ${selectedAssignment.title}`,
                    content: `${user.name} vừa giao bài tập mới: "${selectedAssignment.title}". Lời nhắn: "${assignMessage}". Hạn nộp: ${selectedAssignment.dueDate}.`,
                    authorId: user.id,
                    authorName: user.name,
                    authorRole: user.role,
                    targetType: 'class' as const,
                    targetClassId: selectedAssignment.classId,
                    targetClassName: selectedAssignment.className,
                    priority: 'important' as const,
                    createdAt: new Date().toISOString(),
                    readCount: 0,
                    totalTarget: students.length,
                  };
                  StorageService.saveAnnouncement(ann, user);
                  success(`Đã giao bài tập thành công và tự động phát thông báo tới học sinh!`);
                  setActiveTab('submissions');
                }}
              >
                Xác nhận giao bài & Gửi thông báo tự động
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: BÀI NỘP HỌC SINH (SUBMISSIONS - TIẾN ĐỘ) ================= */}
      {activeTab === 'submissions' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Assignment Selector & Statistics Header */}
          <div className="p-5 rounded-2xl bg-[#0b1026]/90 border border-white/10 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400">Đang theo dõi bài tập:</span>
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="mt-1 block rounded-xl bg-slate-900 border border-cyan-500/30 px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.subject} · {a.dueDate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Bell}
                  onClick={handleSendBatchReminder}
                >
                  Nhắc nhở HS chưa nộp ({submissionStats.notSubmitted + submissionStats.overdue})
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  onClick={handleExportExcel}
                >
                  Xuất Excel
                </Button>

                {selectedAssignment && (
                  <Button
                    variant={selectedAssignment.isAnswerPublished ? 'secondary' : 'primary'}
                    size="sm"
                    icon={selectedAssignment.isAnswerPublished ? Lock : Unlock}
                    onClick={() => handleTogglePublishAnswers(selectedAssignment)}
                  >
                    {selectedAssignment.isAnswerPublished ? 'Ẩn đáp án & thang điểm' : 'Công bố đáp án cho HS'}
                  </Button>
                )}
              </div>
            </div>

            {/* Quick 4 KPI Cards from Section 7 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300">
                <div className="text-xs">Đã nộp bài</div>
                <div className="text-xl font-extrabold font-mono text-white mt-1">{submissionStats.submitted}</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/20 text-amber-300">
                <div className="text-xs">Chưa nộp bài</div>
                <div className="text-xl font-extrabold font-mono text-white mt-1">{submissionStats.notSubmitted}</div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-300">
                <div className="text-xs">Đã chấm điểm</div>
                <div className="text-xl font-extrabold font-mono text-white mt-1">{submissionStats.graded}</div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300">
                <div className="text-xs">Quá hạn / Nộp muộn</div>
                <div className="text-xl font-extrabold font-mono text-white mt-1">{submissionStats.overdue}</div>
              </div>
            </div>
          </div>

          {/* Submissions Table with the exact 5 status labels from Section 7 */}
          <div className="rounded-2xl bg-[#0b1026]/80 border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Mã HS</th>
                    <th className="py-3 px-4">Học sinh</th>
                    <th className="py-3 px-4">Tổ</th>
                    <th className="py-3 px-4">Trạng thái (5 mức)</th>
                    <th className="py-3 px-4">Thời gian nộp</th>
                    <th className="py-3 px-4">Điểm số</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {studentSubmissionRows.map(({ student, submission, statusLabel, statusColor }) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-cyan-300 font-bold">{student.studentCode}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            src={student.avatar}
                            name={student.name}
                            role="STUDENT"
                            size="xs"
                          />
                          <span className="font-semibold text-white">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">Tổ {student.group}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColor} size="sm">
                          {statusLabel}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {submission?.submittedAt || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {submission?.score !== undefined ? (
                          <span className="font-mono font-bold text-white text-sm bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                            {submission.score}đ
                          </span>
                        ) : submission?.draftScore !== undefined ? (
                          <span className="font-mono text-amber-300 text-xs italic">
                            (Nháp: {submission.draftScore}đ)
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {submission ? (
                          <Button
                            variant={submission.status === 'graded' ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleOpenGradingModal(submission)}
                          >
                            {submission.status === 'graded' ? 'Xem / Chấm lại' : 'Chấm bài ngay'}
                          </Button>
                        ) : (
                          <button
                            onClick={() => {
                              if (!user) return;
                              StorageService.sendBatchReminder(selectedAssignment.id, [student.name], user);
                              success(`Đã gửi thông báo nhắc riêng học sinh ${student.name}!`);
                            }}
                            className="px-2.5 py-1 rounded-lg text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] cursor-pointer"
                          >
                            Gửi nhắc nhở
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: CHẤM ĐIỂM (GRADING) ================= */}
      {activeTab === 'grading' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="rounded-2xl bg-[#0b1026]/90 border border-white/10 p-6 space-y-5 shadow-2xl">
            <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Bộ công cụ Chấm điểm & Nhận xét bài làm
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chấm tự động câu trắc nghiệm/điền từ; chấm thủ công tự luận kèm gợi ý AI và quy trình trả bài 3 bước (Mục 8).
                </p>
              </div>

              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="rounded-xl bg-slate-900 border border-white/10 px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>

            {/* List of Submissions needing grading */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Danh sách bài nộp cần thao tác:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => handleOpenGradingModal(sub)}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={sub.studentAvatar}
                        name={sub.studentName}
                        role="STUDENT"
                        size="md"
                      />
                      <div>
                        <div className="text-sm font-bold text-white">{sub.studentName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Nộp lúc: {sub.submittedAt}</div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      {sub.score !== undefined ? (
                        <Badge variant="purple" size="sm">Đã chấm: {sub.score}đ</Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">Chờ chấm điểm</Badge>
                      )}
                      <div className="text-[11px] text-cyan-400 hover:underline">Mở bài chấm &rarr;</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 7: THỐNG KÊ – BÁO CÁO (ANALYTICS) ================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl bg-[#0b1026]/90 border border-white/10 space-y-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Thống kê & Báo cáo kết quả học tập</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phân tích điểm trung bình, phổ điểm phân bố và chẩn đoán điểm yếu kiến thức của lớp (Mục 9).
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleExportExcel}
              >
                Xuất báo cáo tổng hợp
              </Button>
            </div>

            {/* Score Distribution Chart Simulation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl bg-slate-900/60 border border-white/5 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <span>Biểu đồ phân bố phổ điểm lớp 10A1</span>
                </h3>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Xuất sắc (9.0 - 10.0)</span>
                      <span className="font-mono font-bold text-cyan-300">8 HS (40%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Giỏi (8.0 - 8.9)</span>
                      <span className="font-mono font-bold text-emerald-300">7 HS (35%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Khá (6.5 - 7.9)</span>
                      <span className="font-mono font-bold text-amber-300">4 HS (20%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: '20%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Trung bình / Cần cố gắng (&lt; 6.5)</span>
                      <span className="font-mono font-bold text-rose-300">1 HS (5%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full" style={{ width: '5%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Weakness Diagnosis */}
              <div className="rounded-xl bg-slate-900/60 border border-white/5 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Chẩn đoán điểm yếu kiến thức từ Trợ lý AI</span>
                </h3>

                <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-800/60 border border-white/5">
                    <strong className="text-white block mb-1">Câu hỏi có tỷ lệ sai nhiều nhất:</strong>
                    Câu 4 (Vận dụng cao quỹ đạo parabol): 45% học sinh chưa tính đến việc bóng chạm đất khi h(t) = 0.
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/60 border border-white/5">
                    <strong className="text-white block mb-1">Gợi ý bài tập củng cố:</strong>
                    Thầy/cô nên giao thêm 2 bài tập tương tự về bài toán thực tế quỹ đạo chuyển động trước tiết kiểm tra 1 tiết.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 8: CÀI ĐẶT BÀI TẬP (SETTINGS) ================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="rounded-2xl bg-[#0b1026]/90 border border-white/10 p-6 space-y-6 shadow-2xl">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Cài đặt quy chế phân hệ Giao bài tập</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Thiết lập quy định nộp bài, làm lại, bảo mật barem và cấu hình thông báo (Mục 12 #9 & 17).
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-white/5">
                <div>
                  <div className="font-bold text-white">Bảo mật đáp án & Thang điểm trước khi công bố</div>
                  <div className="text-slate-400 mt-0.5">Học sinh không thể xem đáp án và barem chấm trước thời điểm giáo viên bấm công bố</div>
                </div>
                <Badge variant="emerald" size="sm">Đang bật (Bảo mật)</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-white/5">
                <div>
                  <div className="font-bold text-white">Tự động gửi thông báo nhắc trước hạn 24 giờ</div>
                  <div className="text-slate-400 mt-0.5">Hệ thống gửi tin nhắc tự động tới ứng dụng học sinh và phụ huynh khi còn 1 ngày đến hạn</div>
                </div>
                <Badge variant="cyan" size="sm">Đang kích hoạt</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-white/5">
                <div>
                  <div className="font-bold text-white">Kiểm soát tệp đính kèm</div>
                  <div className="text-slate-400 mt-0.5">Hỗ trợ: PDF, DOCX, PPTX, JPG, PNG, ZIP. Giới hạn: tối đa 25MB mỗi tệp</div>
                </div>
                <Badge variant="purple" size="sm">Chuẩn an toàn</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-white/5">
                <div>
                  <div className="font-bold text-white">Lưu vết lịch sử sửa điểm (Audit Log)</div>
                  <div className="text-slate-400 mt-0.5">Ghi lại toàn bộ thời gian, người chấm, điểm cũ, điểm mới và lý do chỉnh sửa</div>
                </div>
                <Badge variant="emerald" size="sm">Hoạt động 100%</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: STUDENT PREVIEW ================= */}
      {previewAssignment && (
        <StudentPreviewModal
          assignment={previewAssignment}
          isOpen={true}
          onClose={() => setPreviewAssignment(null)}
        />
      )}

      {/* ================= MODAL: DELETE ASSIGNMENT CONFIRMATION ================= */}
      {deletingAssignment && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingAssignment(null)}
          title="Xác nhận xóa bài tập?"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              <strong>Cảnh báo:</strong> Thao tác này sẽ xóa hoàn toàn bài tập{' '}
              <strong className="text-white">"{deletingAssignment.title}"</strong> cùng với toàn bộ bài nộp và điểm số của học sinh liên quan.
            </div>
            <p className="text-xs text-slate-400">
              Nếu chỉ muốn tạm ngừng thu bài, thầy/cô có thể dùng tính năng <strong>Lưu trữ</strong> thay vì xóa vĩnh viễn.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDeletingAssignment(null)}>
                Hủy bỏ
              </Button>
              <Button variant="danger" size="sm" icon={Trash2} onClick={handleConfirmDelete}>
                Xác nhận xóa vĩnh viễn
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: AI QUESTION GENERATION (SECTION 11) ================= */}
      {isAIGenModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAIGenModalOpen(false)}
          title="Trợ lý AI: Khởi tạo câu hỏi 4 mức độ nhận thức"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Trợ lý AI sẽ xây dựng câu hỏi chuẩn khung năng lực GDPT 2018 theo từng mức độ nhận thức nhận diện của Bloom.
            </p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Môn học:</label>
              <input
                type="text"
                value={aiGenSubject}
                onChange={(e) => setAiGenSubject(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Chủ đề bài học:</label>
              <input
                type="text"
                value={aiGenTopic}
                onChange={(e) => setAiGenTopic(e.target.value)}
                placeholder="Ví dụ: Định lý Cosin và Sin trong tam giác"
                className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Mức độ nhận thức:</label>
                <select
                  value={aiGenLevel}
                  onChange={(e) => setAiGenLevel(e.target.value as CognitiveLevel)}
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-xs text-white cursor-pointer"
                >
                  <option value="Nhận biết">1. Nhận biết</option>
                  <option value="Thông hiểu">2. Thông hiểu</option>
                  <option value="Vận dụng">3. Vận dụng</option>
                  <option value="Vận dụng cao">4. Vận dụng cao</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Số lượng câu:</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={aiGenCount}
                  onChange={(e) => setAiGenCount(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="ghost" size="sm" onClick={() => setIsAIGenModalOpen(false)}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Sparkles}
                loading={isAILoading}
                onClick={handleGenerateAIQuestions}
              >
                Tạo câu hỏi ngay
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: GRADING WORKSPACE (SECTION 8) ================= */}
      {activeGradingSub && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#090d20] border border-cyan-500/40 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-cyan-950 border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={activeGradingSub.studentAvatar}
                  name={activeGradingSub.studentName}
                  role="STUDENT"
                  size="md"
                  imgClassName="border-cyan-400"
                />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Chấm bài: {activeGradingSub.studentName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bài tập: {selectedAssignment.title} · Nộp lúc: {activeGradingSub.submittedAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Sparkles}
                  loading={isAIFeedbackLoading}
                  onClick={handleAISuggestFeedback}
                >
                  AI Gợi ý nhận xét
                </Button>
                <button
                  onClick={() => setActiveGradingSub(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* General Student Answer / Submission Content */}
              {activeGradingSub.content && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-cyan-300">Nội dung bài làm tổng quát của học sinh:</span>
                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {activeGradingSub.content}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {activeGradingSub.attachments && activeGradingSub.attachments.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-cyan-300">Tệp đính kèm học sinh nộp:</span>
                  <div className="flex flex-wrap gap-2">
                    {activeGradingSub.attachments.map((file, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-cyan-300 border border-white/10 text-xs"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{file}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Question By Question Grading */}
              {selectedAssignment.questions && selectedAssignment.questions.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white border-b border-white/10 pb-2">
                    Chi tiết câu trả lời từng câu:
                  </h4>

                  {selectedAssignment.questions.map((q, qIdx) => {
                    const ans = activeGradingSub.answers?.find((a) => a.questionId === q.id);
                    const qScore = gradingQuestionScores[q.id]?.score ?? 0;

                    return (
                      <div
                        key={q.id || qIdx}
                        className="p-4 rounded-xl bg-slate-900/40 border border-white/10 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-cyan-400">
                            Câu {qIdx + 1} ({q.points} điểm · {q.cognitiveLevel})
                          </span>
                          <span className="text-xs text-slate-400">Dạng: {q.type}</span>
                        </div>

                        <p className="text-xs text-slate-200 font-medium">{q.content}</p>

                        {/* Student response summary */}
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-cyan-200">
                          <strong>Câu trả lời của HS:</strong>{' '}
                          {ans?.selectedOption !== undefined
                            ? `${String.fromCharCode(65 + ans.selectedOption)}. ${q.options?.[ans.selectedOption] || ''}`
                            : ans?.answerText || 'Chưa có câu trả lời'}
                        </div>

                        {/* Official answer key */}
                        <div className="text-[11px] text-amber-300">
                          <strong>Đáp án chuẩn:</strong>{' '}
                          {q.options && q.correctAnswer !== undefined
                            ? `${String.fromCharCode(65 + Number(q.correctAnswer))}. ${q.options[Number(q.correctAnswer)]}`
                            : q.correctAnswer}
                        </div>

                        {/* Score and Comment Input */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
                          <div className="sm:col-span-1">
                            <label className="text-[11px] text-slate-400 block mb-0.5">Điểm câu:</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={q.points}
                              value={qScore}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setGradingQuestionScores((prev) => ({
                                  ...prev,
                                  [q.id]: { ...prev[q.id], score: val },
                                }));
                              }}
                              className="w-full rounded bg-slate-950 border border-white/10 px-2 py-1 text-xs text-white font-mono"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="text-[11px] text-slate-400 block mb-0.5">Nhận xét câu:</label>
                            <input
                              type="text"
                              placeholder="Nhận xét riêng cho câu này..."
                              value={gradingQuestionScores[q.id]?.comment || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGradingQuestionScores((prev) => ({
                                  ...prev,
                                  [q.id]: { ...prev[q.id], comment: val },
                                }));
                              }}
                              className="w-full rounded bg-slate-950 border border-white/10 px-2.5 py-1 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Overall Score & Feedback */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">
                      Tổng điểm chính thức (Thang {selectedAssignment.maxScore}):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={selectedAssignment.maxScore}
                      value={gradingScore}
                      onChange={(e) => setGradingScore(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-cyan-500/40 px-3.5 py-2 text-base text-cyan-300 font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-300 font-bold block mb-1">
                      Lý do chỉnh sửa / Ghi chú phúc khảo (nếu có):
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Chấm lại câu 4 sau khi rà soát barem..."
                      value={gradingReason}
                      onChange={(e) => setGradingReason(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-300 font-bold">Nhận xét chung của giáo viên:</label>
                    <button
                      onClick={handleAISuggestFeedback}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Gợi ý nhận xét AI
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={gradingFeedback}
                    onChange={(e) => setGradingFeedback(e.target.value)}
                    placeholder="Viết nhận xét đánh giá ưu điểm, hạn chế và hướng khắc phục cho học sinh..."
                    className="w-full rounded-xl bg-slate-950 border border-white/10 p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Re-grading Audit Log History (Section 8) */}
              {activeGradingSub.gradingHistory && activeGradingSub.gradingHistory.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Lịch sử chỉnh sửa điểm (Audit Log):
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                    {activeGradingSub.gradingHistory.map((h, hi) => (
                      <div key={hi} className="p-2 rounded bg-black/30 border border-white/5">
                        <span className="text-cyan-300">{h.timestamp}</span> · Người chấm: {h.gradedBy} · Điểm:{' '}
                        <strong className="text-white">{h.oldScore ?? 'Mới'} &rarr; {h.newScore}đ</strong> ({h.reason})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with 3-Step Flow (Mục 8) */}
            <div className="px-6 py-4 bg-slate-900/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Quy trình trả bài: Lưu nháp &rarr; Trả bài & công bố &rarr; Chấm lại (nếu có phúc khảo)
              </span>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleSaveDraftGrade}>
                  Lưu điểm nháp (HS chưa thấy)
                </Button>
                <Button variant="primary" size="sm" icon={Send} onClick={handlePublishGrade}>
                  Trả bài & Công bố kết quả
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
