export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone?: string;
  schoolId?: string;
  subject?: string; // For teachers
  studentId?: string; // For students
  classId?: string; // For students & teachers
  childrenIds?: string[]; // For parents
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: number; // e.g. 10, 11, 12
  academicYear: string; // e.g. "2025-2026"
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  subject: string;
  room: string;
  studentCount: number;
  attendanceRate: number; // e.g. 96.5%
  pendingAssignments: number;
  alertCount: number;
  status: 'active' | 'archived';
  code: string; // Class join code
  description?: string;
}

export interface Student {
  id: string;
  studentCode: string;
  name: string;
  classId: string;
  className: string;
  group: number; // Tổ 1, 2, 3, 4
  avatar: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  parentAvatar?: string;
  address?: string; // Địa chỉ thường trú
  attendanceRate: number;
  gpa: number;
  status: 'active' | 'leave' | 'suspended';
  conduct: 'Tốt' | 'Khá' | 'Trung bình'; // Hạnh kiểm
  rewardsCount: number;
  alertsCount: number;
}

export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late' | 'early_leave';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  avatar: string;
  classId: string;
  date: string; // YYYY-MM-DD
  period: string; // "Sáng - Tiết 1", etc.
  status: AttendanceStatus;
  note?: string;
  updatedAt: string;
  updatedBy: string;
}

export type CognitiveLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export type AssignmentQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_in_blank'
  | 'essay'
  | 'file_upload'
  | 'code'
  | 'group_project';

export interface AssignmentQuestion {
  id: string;
  order: number;
  type: AssignmentQuestionType;
  cognitiveLevel: CognitiveLevel;
  content: string;
  points: number;
  options?: string[];
  correctAnswer?: string | string[] | number;
  acceptableAnswers?: string[];
  explanation?: string;
  rubric?: string;
  codeTemplate?: string;
}

export type AssignmentStatus = 'draft' | 'active' | 'expired' | 'closed' | 'archived';

export interface Assignment {
  id: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  subject: string;
  topic?: string;
  assignedDate: string;
  openDate?: string;
  dueDate: string;
  maxScore: number;
  status: AssignmentStatus;
  submissionCount: number;
  gradedCount: number;
  totalStudents: number;
  attachments?: string[];
  teacherUid?: string;
  teacherName?: string;
  targetType?: 'all_class' | 'specific_students' | 'groups';
  targetStudentIds?: string[];
  targetGroups?: number[];
  durationMinutes?: number;
  allowLateSubmission?: boolean;
  allowResubmission?: boolean;
  maxAttempts?: number;
  isAnswerPublished?: boolean;
  officialSolution?: string;
  teacherNote?: string;
  questions?: AssignmentQuestion[];
  isArchived?: boolean;
}

export type SubmissionStatus = 'not_started' | 'in_progress' | 'submitted' | 'late' | 'graded' | 'resubmit_required';

export interface QuestionAnswer {
  questionId: string;
  answerText?: string;
  selectedOption?: number;
  selectedOptions?: number[];
  files?: string[];
  score?: number;
  isCorrect?: boolean;
  comment?: string;
}

export interface SubmissionGradingHistory {
  timestamp: string;
  gradedBy: string;
  oldScore: number | null;
  newScore: number;
  reason: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  studentCode?: string;
  submittedAt: string;
  status: SubmissionStatus;
  score?: number;
  draftScore?: number;
  feedback?: string;
  content: string;
  attachments?: string[];
  answers?: QuestionAnswer[];
  gradedAt?: string;
  gradedBy?: string;
  isPublished?: boolean;
  attemptCount?: number;
  savedAsDraftAt?: string;
  gradingHistory?: SubmissionGradingHistory[];
}

export interface GradeEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classId: string;
  subject: string;
  tx1?: number | null; // Thường xuyên 1
  tx2?: number | null; // Thường xuyên 2
  tx3?: number | null; // Thường xuyên 3
  gk?: number | null;  // Giữa kỳ
  ck?: number | null;  // Cuối kỳ
  gpa?: number | null; // Trung bình môn
  updatedAt: string;
  updatedBy: string;
}

export interface GradeHistory {
  id: string;
  gradeEntryId: string;
  studentName: string;
  field: string;
  oldValue: number | null;
  newValue: number | null;
  updatedBy: string;
  timestamp: string;
  reason?: string;
}

export interface ScheduleItem {
  id: string;
  dayOfWeek: number; // 2 = Thứ 2, 3 = Thứ 3, ... 7 = Thứ 7
  period: number; // Tiết 1 - 5
  time: string; // "07:30 - 08:15"
  subject: string;
  className: string;
  classId: string;
  teacherName: string;
  room: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  targetType: 'all' | 'class' | 'students' | 'parents';
  targetClassId?: string;
  targetClassName?: string;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
  readCount: number;
  totalTarget: number;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'GRADE' | 'ATTENDANCE' | 'STUDENT' | 'CLASS' | 'ASSIGNMENT' | 'USER' | 'SETTINGS';
  entityId: string;
  entityName: string;
  timestamp: string;
  beforeData?: string;
  afterData?: string;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  type: 'positive' | 'negative';
  points: number; // e.g. +5 or -3
  title: string;
  description: string;
  date: string;
  createdBy: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  classId: string;
  className: string;
  title: string;
  subject: string;
  durationMinutes: number;
  questions: QuizQuestion[];
  createdAt: string;
  status: 'draft' | 'published';
}

// 9 Dạng câu hỏi chuẩn GDPT 2018
export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false_items'
  | 'matching'
  | 'ordering'
  | 'fill_in_blank'
  | 'short_answer'
  | 'essay'
  | 'passage_based';

export interface TrueFalseStatement {
  id: string;
  label: string;
  statement: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface MatchingPair {
  leftId: string;
  leftText: string;
  rightId: string;
  rightText: string;
}

export interface SubQuestion {
  id: string;
  indexLabel: string;
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface BankQuestion {
  id: string;
  code: string;
  subject: string;
  grade: string;
  topic?: string;
  type: QuestionType;
  difficulty: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
  content: string;
  passage?: string;
  options?: string[];
  correctAnswer?: string;
  correctAnswers?: string[];
  tfStatements?: TrueFalseStatement[];
  matchingPairs?: MatchingPair[];
  orderingItems?: string[];
  correctOrder?: string[];
  blankAnswers?: string[];
  subQuestions?: SubQuestion[];
  explanation: string;
  tags: string[];
  usageCount: number;
  createdAt: string;
  createdBy?: string;
}

