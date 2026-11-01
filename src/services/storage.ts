import {
  User,
  ClassRoom,
  Student,
  AttendanceRecord,
  Assignment,
  Submission,
  GradeEntry,
  GradeHistory,
  ScheduleItem,
  Announcement,
  AuditLog,
  BehaviorRecord,
  Quiz,
  QuestionAnswer,
  SubmissionStatus
} from '../types';
import { getInitialsAvatar } from '../utils/avatar';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_SCHEDULE,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_GRADES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BEHAVIOR,
  INITIAL_QUIZ
} from '../data/mockData';

const KEYS = {
  USERS: 'smartclass_users_v1',
  CLASSES: 'smartclass_classes_v1',
  STUDENTS: 'smartclass_students_v1',
  SCHEDULE: 'smartclass_schedule_v1',
  ASSIGNMENTS: 'smartclass_assignments_v1',
  SUBMISSIONS: 'smartclass_submissions_v1',
  GRADES: 'smartclass_grades_v1',
  GRADE_HISTORY: 'smartclass_grade_history_v1',
  ATTENDANCE: 'smartclass_attendance_v1',
  ANNOUNCEMENTS: 'smartclass_announcements_v1',
  AUDIT_LOGS: 'smartclass_audit_logs_v1',
  BEHAVIOR: 'smartclass_behavior_v1',
  QUIZ: 'smartclass_quiz_v1',
  ACTIVE_USER: 'smartclass_active_user_v1',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('smartclass_storage_updated'));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export const StorageService = {
  // Initialize storage with seeds if empty
  init: () => {
    if (!localStorage.getItem(KEYS.USERS)) setItem(KEYS.USERS, INITIAL_USERS);
    if (!localStorage.getItem(KEYS.CLASSES)) setItem(KEYS.CLASSES, INITIAL_CLASSES);
    if (!localStorage.getItem(KEYS.STUDENTS)) setItem(KEYS.STUDENTS, INITIAL_STUDENTS);
    if (!localStorage.getItem(KEYS.SCHEDULE)) setItem(KEYS.SCHEDULE, INITIAL_SCHEDULE);
    if (!localStorage.getItem(KEYS.ASSIGNMENTS)) setItem(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    if (!localStorage.getItem(KEYS.SUBMISSIONS)) setItem(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    if (!localStorage.getItem(KEYS.GRADES)) setItem(KEYS.GRADES, INITIAL_GRADES);
    if (!localStorage.getItem(KEYS.ANNOUNCEMENTS)) setItem(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    if (!localStorage.getItem(KEYS.AUDIT_LOGS)) setItem(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    if (!localStorage.getItem(KEYS.BEHAVIOR)) setItem(KEYS.BEHAVIOR, INITIAL_BEHAVIOR);
    if (!localStorage.getItem(KEYS.QUIZ)) setItem(KEYS.QUIZ, [INITIAL_QUIZ]);
    if (!localStorage.getItem(KEYS.ACTIVE_USER)) setItem(KEYS.ACTIVE_USER, INITIAL_USERS[0]); // Default to teacher
  },

  // Users
  getUsers: (): User[] => {
    const list: User[] = getItem(KEYS.USERS, INITIAL_USERS);
    return list.map(u => ({
      ...u,
      avatar: (!u.avatar || u.avatar.includes('dicebear.com')) ? getInitialsAvatar(u.name, u.role) : u.avatar,
    }));
  },
  getActiveUser: (): User => {
    const u: User = getItem(KEYS.ACTIVE_USER, INITIAL_USERS[0]);
    if (!u.avatar || u.avatar.includes('dicebear.com')) {
      u.avatar = getInitialsAvatar(u.name, u.role);
    }
    return u;
  },
  setActiveUser: (user: User) => setItem(KEYS.ACTIVE_USER, user),
  updateUser: (updatedUser: User) => {
    const list = StorageService.getUsers();
    const idx = list.findIndex(u => u.id === updatedUser.id);
    if (idx >= 0) {
      list[idx] = updatedUser;
    } else {
      list.push(updatedUser);
    }
    setItem(KEYS.USERS, list);
    const active = StorageService.getActiveUser();
    if (active && active.id === updatedUser.id) {
      setItem(KEYS.ACTIVE_USER, updatedUser);
    }
  },
  updateUserAvatar: (userId: string, newAvatar: string) => {
    const list = StorageService.getUsers();
    const target = list.find(u => u.id === userId);
    if (target) {
      target.avatar = newAvatar;
      setItem(KEYS.USERS, [...list]);
      const active = StorageService.getActiveUser();
      if (active && active.id === userId) {
        setItem(KEYS.ACTIVE_USER, { ...active, avatar: newAvatar });
      }
    }
  },
  updateStudentAvatar: (studentId: string, newAvatar: string, actor: User) => {
    const students = StorageService.getStudents();
    const target = students.find(s => s.id === studentId);
    if (target) {
      target.avatar = newAvatar;
      setItem(KEYS.STUDENTS, [...students]);
      StorageService.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'CẬP_NHẬT_HỌC_SINH',
        entityType: 'STUDENT',
        entityId: studentId,
        entityName: target.name,
        beforeData: 'Cập nhật ảnh chân dung',
        afterData: 'Đã đổi ảnh chân dung học sinh',
      });
    }
  },
  updateParentAvatar: (studentId: string, parentAvatar: string, actor: User) => {
    const students = StorageService.getStudents();
    const target = students.find(s => s.id === studentId);
    if (target) {
      target.parentAvatar = parentAvatar;
      setItem(KEYS.STUDENTS, [...students]);
      StorageService.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'CẬP_NHẬT_HỌC_SINH',
        entityType: 'STUDENT',
        entityId: studentId,
        entityName: `Phụ huynh của ${target.name}`,
        beforeData: 'Cập nhật ảnh chân dung phụ huynh',
        afterData: 'Đã đổi ảnh chân dung phụ huynh',
      });
    }
  },

  // Classes
  getClasses: (): ClassRoom[] => {
    const raw: ClassRoom[] = getItem(KEYS.CLASSES, INITIAL_CLASSES);
    // Auto-deduplicate any exact duplicate classes by name and academicYear
    const seen = new Set<string>();
    const unique: ClassRoom[] = [];
    for (const c of raw) {
      const key = `${c.name.trim().toLowerCase()}__${c.academicYear}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }
    if (unique.length !== raw.length) {
      setItem(KEYS.CLASSES, unique);
    }
    return unique;
  },
  getClassById: (id: string): ClassRoom | undefined => {
    const list = StorageService.getClasses();
    return list.find((c) => c.id === id);
  },
  saveClass: (classRoom: ClassRoom, actor: User) => {
    const list = StorageService.getClasses();
    const index = list.findIndex((c) => c.id === classRoom.id);
    
    // Validate duplicates: cannot have same name in the same academic year
    const isDuplicate = list.some(
      (c) =>
        c.id !== classRoom.id &&
        c.name.trim().toLowerCase() === classRoom.name.trim().toLowerCase() &&
        c.academicYear === classRoom.academicYear
    );
    if (isDuplicate) {
      throw new Error(`Lớp học "${classRoom.name}" đã tồn tại trong năm học ${classRoom.academicYear}!`);
    }

    let before = 'Tạo mới';
    if (index >= 0) {
      before = JSON.stringify(list[index]);
      list[index] = classRoom;
    } else {
      list.unshift(classRoom);
    }
    setItem(KEYS.CLASSES, list);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: index >= 0 ? 'CẬP_NHẬT_LỚP_HỌC' : 'TẠO_LỚP_HỌC',
      entityType: 'CLASS',
      entityId: classRoom.id,
      entityName: classRoom.name,
      beforeData: before,
      afterData: JSON.stringify(classRoom),
    });
  },
  deleteClass: (id: string, actor: User) => {
    const list = StorageService.getClasses();
    const target = list.find(c => c.id === id);
    if (!target) return;
    const updated = list.filter(c => c.id !== id);
    setItem(KEYS.CLASSES, updated);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'XÓA_LỚP_HỌC',
      entityType: 'CLASS',
      entityId: id,
      entityName: target.name,
      beforeData: `Lớp ${target.name}`,
      afterData: 'Đã xóa khỏi hệ thống',
    });
  },

  // Students
  getStudents: (classId?: string): Student[] => {
    const list: Student[] = getItem(KEYS.STUDENTS, INITIAL_STUDENTS);
    let modified = false;
    const conductList = ['Tốt', 'Khá', 'Trung bình'];

    const sanitized = list.map((s) => {
      let updated = { ...s };

      // 1. Auto-repair if parentName holds conduct (e.g. 'Tốt', 'Khá') and parentPhone holds the real parent name (e.g. 'Nguyễn Văn Hùng')
      if (
        conductList.includes(updated.parentName) &&
        updated.parentPhone &&
        !/^[0-9+\s().-]+$/.test(updated.parentPhone)
      ) {
        const correctParentName = updated.parentPhone;
        const correctConduct = updated.parentName as 'Tốt' | 'Khá' | 'Trung bình';
        const matchInit = INITIAL_STUDENTS.find(
          (init) => init.id === s.id || init.studentCode === s.studentCode || init.name === s.name
        );
        updated.parentName = correctParentName;
        updated.conduct = correctConduct;
        updated.parentPhone = matchInit?.parentPhone || '0987654321';
        modified = true;
      }

      // 2. Ensure s.phone (Số điện thoại học sinh) is valid and populated
      if (!updated.phone || !/^[0-9+\s().-]+$/.test(updated.phone)) {
        const matchInit = INITIAL_STUDENTS.find(
          (init) => init.id === s.id || init.studentCode === s.studentCode || init.name === s.name
        );
        updated.phone = matchInit?.phone || '0912345678';
        modified = true;
      }

      // 3. Ensure s.parentPhone is a valid phone number
      if (!updated.parentPhone || !/^[0-9+\s().-]+$/.test(updated.parentPhone)) {
        const matchInit = INITIAL_STUDENTS.find(
          (init) => init.id === s.id || init.studentCode === s.studentCode || init.name === s.name
        );
        updated.parentPhone = matchInit?.parentPhone || '0987654321';
        modified = true;
      }

      // 4. Ensure avatars are valid and do not cause broken image icons
      if (!updated.avatar || updated.avatar.includes('dicebear.com')) {
        updated.avatar = getInitialsAvatar(s.name, 'STUDENT');
        modified = true;
      }
      if (!updated.parentAvatar || updated.parentAvatar.includes('dicebear.com')) {
        updated.parentAvatar = getInitialsAvatar(updated.parentName, 'PARENT');
        modified = true;
      }

      return updated;
    });

    if (modified) {
      setItem(KEYS.STUDENTS, sanitized);
    }

    if (classId) return sanitized.filter(s => s.classId === classId);
    return sanitized;
  },
  getStudentById: (id: string): Student | undefined => {
    const list = StorageService.getStudents();
    return list.find(s => s.id === id);
  },
  saveStudent: (student: Student, actor: User) => {
    const list = StorageService.getStudents();
    const index = list.findIndex(s => s.id === student.id);
    let before = 'Thêm mới';
    if (index >= 0) {
      before = JSON.stringify(list[index]);
      list[index] = student;
    } else {
      list.push(student);
    }
    setItem(KEYS.STUDENTS, list);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: index >= 0 ? 'CẬP_NHẬT_HỌC_SINH' : 'THÊM_HỌC_SINH',
      entityType: 'STUDENT',
      entityId: student.id,
      entityName: student.name,
      beforeData: before,
      afterData: JSON.stringify(student),
    });
  },
  deleteStudent: (id: string, actor: User) => {
    const list = StorageService.getStudents();
    const target = list.find(s => s.id === id);
    if (!target) return;
    const updated = list.filter(s => s.id !== id);
    setItem(KEYS.STUDENTS, updated);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'XÓA_HỌC_SINH',
      entityType: 'STUDENT',
      entityId: id,
      entityName: target.name,
      beforeData: `Học sinh ${target.name} - ${target.studentCode}`,
      afterData: 'Đã xóa',
    });
  },
  deleteAllStudents: (classId: string | undefined, actor: User) => {
    const list = StorageService.getStudents();
    const countBefore = list.length;
    let remaining: Student[] = [];
    if (classId) {
      remaining = list.filter((s) => s.classId !== classId);
    }
    setItem(KEYS.STUDENTS, remaining);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'XÓA_TẤT_CẢ_HỌC_SINH',
      entityType: 'STUDENT',
      entityId: classId || 'all',
      entityName: `Toàn bộ học sinh (${countBefore} em)`,
      beforeData: `Tổng số học sinh trước khi xóa: ${countBefore}`,
      afterData: 'Đã xóa toàn bộ học sinh khỏi danh sách',
    });
  },
  bulkImportStudents: (newStudents: Student[], actor: User) => {
    const current = StorageService.getStudents();
    const merged = [...current, ...newStudents];
    setItem(KEYS.STUDENTS, merged);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'IMPORT_EXCEL_HỌC_SINH',
      entityType: 'STUDENT',
      entityId: 'bulk',
      entityName: `Import ${newStudents.length} học sinh`,
      beforeData: `Số lượng cũ: ${current.length}`,
      afterData: `Số lượng mới: ${merged.length}`,
    });
  },

  // Attendance
  getAttendance: (classId: string, date: string): AttendanceRecord[] => {
    const all: AttendanceRecord[] = getItem(KEYS.ATTENDANCE, []);
    const existing = all.filter(a => a.classId === classId && a.date === date);
    if (existing.length > 0) return existing;

    // Generate default attendance records for all students in class
    const students = StorageService.getStudents(classId);
    return students.map(s => ({
      id: `att_${classId}_${s.id}_${date}`,
      studentId: s.id,
      studentName: s.name,
      studentCode: s.studentCode,
      avatar: s.avatar,
      classId,
      date,
      period: 'Buổi sáng (Tiết 1 - 5)',
      status: 'present',
      note: '',
      updatedAt: new Date().toISOString(),
      updatedBy: 'Hệ thống tự động',
    }));
  },
  saveAttendance: (records: AttendanceRecord[], actor: User) => {
    const all: AttendanceRecord[] = getItem(KEYS.ATTENDANCE, []);
    const keysToRemove = new Set(records.map(r => `${r.classId}_${r.studentId}_${r.date}`));
    const filtered = all.filter(r => !keysToRemove.has(`${r.classId}_${r.studentId}_${r.date}`));
    const updated = [...filtered, ...records];
    setItem(KEYS.ATTENDANCE, updated);

    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'excused' || r.status === 'unexcused').length;
    const lateCount = records.filter(r => r.status === 'late').length;

    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'LƯU_ĐIỂM_DANH',
      entityType: 'ATTENDANCE',
      entityId: records[0]?.classId || 'class',
      entityName: `Điểm danh ngày ${records[0]?.date}`,
      beforeData: 'Dữ liệu trước lưu',
      afterData: `Có mặt: ${presentCount}, Vắng: ${absentCount}, Muộn: ${lateCount}`,
    });
  },

  // Assignments & Submissions
  // Assignments & Submissions
  getAssignments: (classId?: string): Assignment[] => {
    const list: Assignment[] = getItem(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    if (classId) return list.filter(a => a.classId === classId);
    return list;
  },
  getAssignmentById: (id: string): Assignment | undefined => {
    const list = StorageService.getAssignments();
    return list.find(a => a.id === id);
  },
  saveAssignment: (assignment: Assignment, actor: User) => {
    const list = StorageService.getAssignments();
    const index = list.findIndex(a => a.id === assignment.id);
    if (index >= 0) {
      list[index] = assignment;
    } else {
      list.unshift(assignment);
    }
    setItem(KEYS.ASSIGNMENTS, list);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: index >= 0 ? 'CẬP_NHẬT_BÀI_TẬP' : 'GIAO_BÀI_TẬP_MỚI',
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      entityName: assignment.title,
      afterData: `Hạn nộp: ${assignment.dueDate}, Thang điểm: ${assignment.maxScore}`,
    });
  },
  deleteAssignment: (id: string, actor: User) => {
    const list = StorageService.getAssignments();
    const target = list.find(a => a.id === id);
    if (!target) return;
    const updated = list.filter(a => a.id !== id);
    setItem(KEYS.ASSIGNMENTS, updated);
    // Also remove associated submissions
    const allSubs: Submission[] = getItem(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    const updatedSubs = allSubs.filter(s => s.assignmentId !== id);
    setItem(KEYS.SUBMISSIONS, updatedSubs);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'XÓA_BÀI_TẬP',
      entityType: 'ASSIGNMENT',
      entityId: id,
      entityName: target.title,
      beforeData: `Bài tập: ${target.title}`,
      afterData: 'Đã xóa hoàn toàn bài tập và các bài nộp',
    });
  },
  duplicateAssignment: (id: string, actor: User): Assignment | null => {
    const list = StorageService.getAssignments();
    const target = list.find(a => a.id === id);
    if (!target) return null;
    const duplicated: Assignment = {
      ...target,
      id: `asg_${Date.now()}_copy`,
      title: `${target.title} (Bản sao)`,
      status: 'draft',
      submissionCount: 0,
      gradedCount: 0,
      assignedDate: new Date().toISOString().split('T')[0],
      isAnswerPublished: false,
    };
    list.unshift(duplicated);
    setItem(KEYS.ASSIGNMENTS, list);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'NHÂN_BẢN_BÀI_TẬP',
      entityType: 'ASSIGNMENT',
      entityId: duplicated.id,
      entityName: duplicated.title,
      afterData: `Nhân bản từ bài tập ID: ${id}`,
    });
    return duplicated;
  },
  archiveAssignment: (id: string, isArchived: boolean, actor: User) => {
    const list = StorageService.getAssignments();
    const target = list.find(a => a.id === id);
    if (!target) return;
    target.isArchived = isArchived;
    if (isArchived && target.status !== 'closed') {
      target.status = 'closed';
    } else if (!isArchived && target.status === 'closed') {
      target.status = 'active';
    }
    setItem(KEYS.ASSIGNMENTS, [...list]);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: isArchived ? 'LƯU_TRỮ_BÀI_TẬP' : 'MỞ_LẠI_BÀI_TẬP',
      entityType: 'ASSIGNMENT',
      entityId: id,
      entityName: target.title,
      afterData: isArchived ? 'Đã chuyển vào kho lưu trữ' : 'Đã khôi phục trạng thái hoạt động',
    });
  },
  publishAssignmentAnswers: (assignmentId: string, isPublished: boolean, actor: User) => {
    const list = StorageService.getAssignments();
    const target = list.find(a => a.id === assignmentId);
    if (!target) return;
    target.isAnswerPublished = isPublished;
    setItem(KEYS.ASSIGNMENTS, [...list]);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: isPublished ? 'CÔNG_BỐ_ĐÁP_ÁN' : 'ẨN_ĐÁP_ÁN',
      entityType: 'ASSIGNMENT',
      entityId: assignmentId,
      entityName: target.title,
      afterData: isPublished ? 'Học sinh hiện có thể xem đáp án và barem chấm' : 'Đã bảo mật đáp án',
    });
  },
  sendBatchReminder: (assignmentId: string, studentNames: string[], actor: User) => {
    const asg = StorageService.getAssignmentById(assignmentId);
    if (!asg) return;
    // Create an announcement to notify
    const announcement: Announcement = {
      id: `ann_remind_${Date.now()}`,
      title: `[Nhắc nhở hạn nộp] ${asg.title}`,
      content: `Hệ thống nhắc nhở tự động từ ${actor.name}: Bài tập "${asg.title}" (Hạn nộp: ${asg.dueDate}) sắp đến hạn. Nhắc các em: ${studentNames.slice(0, 5).join(', ')}${studentNames.length > 5 ? ` và ${studentNames.length - 5} học sinh khác` : ''} khẩn trương hoàn thành và nộp bài.`,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
      targetType: 'class',
      targetClassId: asg.classId,
      targetClassName: asg.className,
      priority: 'important',
      createdAt: new Date().toISOString(),
      readCount: 0,
      totalTarget: studentNames.length,
    };
    StorageService.saveAnnouncement(announcement, actor);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'GỬI_NHẮC_NHỞ_HÀNG_LOẠT',
      entityType: 'ASSIGNMENT',
      entityId: assignmentId,
      entityName: asg.title,
      afterData: `Đã gửi nhắc nhở tới ${studentNames.length} học sinh chưa nộp`,
    });
  },
  getSubmissions: (assignmentId: string): Submission[] => {
    const all: Submission[] = getItem(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    return all.filter(s => s.assignmentId === assignmentId);
  },
  getStudentSubmissions: (studentId: string): Submission[] => {
    const all: Submission[] = getItem(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    return all.filter(s => s.studentId === studentId);
  },
  saveSubmission: (submission: Submission, actor: User) => {
    const all: Submission[] = getItem(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    const index = all.findIndex(s => s.id === submission.id);
    if (index >= 0) {
      all[index] = submission;
    } else {
      all.push(submission);
    }
    setItem(KEYS.SUBMISSIONS, all);

    // Update assignment counts
    const assignments = StorageService.getAssignments();
    const asgIndex = assignments.findIndex(a => a.id === submission.assignmentId);
    if (asgIndex >= 0) {
      const subs = all.filter(s => s.assignmentId === submission.assignmentId);
      assignments[asgIndex].submissionCount = subs.filter(s => s.status === 'submitted' || s.status === 'late' || s.status === 'graded').length;
      assignments[asgIndex].gradedCount = subs.filter(s => s.status === 'graded').length;
      setItem(KEYS.ASSIGNMENTS, assignments);
    }

    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: submission.status === 'graded' ? 'CHẤM_ĐIỂM_BÀI_TẬP' : 'NỘP_BÀI_TẬP',
      entityType: 'ASSIGNMENT',
      entityId: submission.assignmentId,
      entityName: `${submission.studentName} - Điểm: ${submission.score ?? 'Chưa chấm'}`,
      afterData: submission.feedback || submission.content,
    });
  },
  saveDraftGrade: (
    submissionId: string,
    draftScore: number,
    feedback: string,
    answers: QuestionAnswer[] | undefined,
    actor: User
  ) => {
    const all: Submission[] = getItem(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    const target = all.find(s => s.id === submissionId);
    if (!target) return;
    target.draftScore = draftScore;
    target.feedback = feedback;
    if (answers) target.answers = answers;
    target.gradedBy = actor.name;
    setItem(KEYS.SUBMISSIONS, [...all]);
  },
  publishSubmissionGrade: (
    submissionId: string,
    score: number,
    feedback: string,
    answers: QuestionAnswer[] | undefined,
    actor: User,
    reason?: string
  ) => {
    const all: Submission[] = getItem(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    const target = all.find(s => s.id === submissionId);
    if (!target) return;
    const oldScore = target.score !== undefined ? target.score : null;
    target.score = score;
    target.draftScore = undefined;
    target.feedback = feedback;
    if (answers) target.answers = answers;
    target.status = 'graded';
    target.isPublished = true;
    target.gradedAt = new Date().toLocaleString('vi-VN');
    target.gradedBy = actor.name;

    // Log history for re-grading audits
    if (!target.gradingHistory) target.gradingHistory = [];
    target.gradingHistory.push({
      timestamp: new Date().toLocaleString('vi-VN'),
      gradedBy: actor.name,
      oldScore,
      newScore: score,
      reason: reason || (oldScore !== null ? 'Chỉnh sửa/Chấm lại' : 'Chấm và công bố điểm lần đầu'),
    });

    setItem(KEYS.SUBMISSIONS, [...all]);

    // Recalculate counts
    const assignments = StorageService.getAssignments();
    const asgIndex = assignments.findIndex(a => a.id === target.assignmentId);
    if (asgIndex >= 0) {
      const subs = all.filter(s => s.assignmentId === target.assignmentId);
      assignments[asgIndex].gradedCount = subs.filter(s => s.status === 'graded').length;
      setItem(KEYS.ASSIGNMENTS, assignments);
    }

    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CÔNG_BỐ_ĐIỂM_BÀI_TẬP',
      entityType: 'ASSIGNMENT',
      entityId: target.assignmentId,
      entityName: `${target.studentName}: ${score} điểm`,
      afterData: `Nhận xét: ${feedback} (Lý do: ${reason || 'Chính thức'})`,
    });
  },
  saveStudentDraftWork: (
    assignmentId: string,
    studentId: string,
    studentName: string,
    studentAvatar: string,
    content: string,
    answers: QuestionAnswer[],
    attachments: string[],
    actor: User
  ) => {
    const all: Submission[] = getItem(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    let sub = all.find(s => s.assignmentId === assignmentId && s.studentId === studentId);
    if (!sub) {
      sub = {
        id: `sub_${Date.now()}_${studentId}`,
        assignmentId,
        studentId,
        studentName,
        studentAvatar,
        submittedAt: '',
        status: 'in_progress',
        content,
        answers,
        attachments,
        savedAsDraftAt: new Date().toLocaleString('vi-VN'),
        attemptCount: 1,
      };
      all.push(sub);
    } else {
      sub.content = content;
      sub.answers = answers;
      sub.attachments = attachments;
      sub.status = 'in_progress';
      sub.savedAsDraftAt = new Date().toLocaleString('vi-VN');
    }
    setItem(KEYS.SUBMISSIONS, all);
  },
  submitStudentWork: (
    assignmentId: string,
    studentId: string,
    studentName: string,
    studentAvatar: string,
    content: string,
    answers: QuestionAnswer[],
    attachments: string[],
    actor: User,
    isLate = false
  ) => {
    const all: Submission[] = getItem(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    let sub = all.find(s => s.assignmentId === assignmentId && s.studentId === studentId);
    const asg = StorageService.getAssignmentById(assignmentId);

    // Auto-grade multiple choice / fill-in questions if questions are present
    let calculatedAutoScore = 0;
    if (asg?.questions && answers.length > 0) {
      answers.forEach(ans => {
        const q = asg.questions?.find(item => item.id === ans.questionId);
        if (!q) return;
        if (q.type === 'single_choice') {
          const isCorrect = String(ans.selectedOption) === String(q.correctAnswer);
          ans.isCorrect = isCorrect;
          ans.score = isCorrect ? q.points : 0;
          calculatedAutoScore += ans.score;
        } else if (q.type === 'fill_in_blank') {
          const userText = (ans.answerText || '').trim().toLowerCase();
          const acceptable = [q.correctAnswer as string, ...(q.acceptableAnswers || [])].map(a => (a || '').toLowerCase().trim());
          const isCorrect = acceptable.includes(userText);
          ans.isCorrect = isCorrect;
          ans.score = isCorrect ? q.points : 0;
          calculatedAutoScore += ans.score;
        }
      });
    }

    const currentAttempt = (sub?.attemptCount || 0) + 1;
    const finalStatus: SubmissionStatus = isLate ? 'late' : 'submitted';

    if (!sub) {
      sub = {
        id: `sub_${Date.now()}_${studentId}`,
        assignmentId,
        studentId,
        studentName,
        studentAvatar,
        submittedAt: new Date().toLocaleString('vi-VN'),
        status: finalStatus,
        content,
        answers,
        attachments,
        attemptCount: currentAttempt,
      };
      all.push(sub);
    } else {
      sub.submittedAt = new Date().toLocaleString('vi-VN');
      sub.status = finalStatus;
      sub.content = content;
      sub.answers = answers;
      sub.attachments = attachments;
      sub.attemptCount = currentAttempt;
    }
    setItem(KEYS.SUBMISSIONS, all);

    // Update assignment counts
    if (asg) {
      const subs = all.filter(s => s.assignmentId === assignmentId);
      asg.submissionCount = subs.filter(s => s.status === 'submitted' || s.status === 'late' || s.status === 'graded').length;
      StorageService.saveAssignment(asg, actor);
    }

    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: isLate ? 'NỘP_BÀI_MUỘN' : 'NỘP_BÀI_TẬP',
      entityType: 'ASSIGNMENT',
      entityId: assignmentId,
      entityName: `${studentName} nộp bài ${asg?.title || ''}`,
      afterData: `Trạng thái: ${finalStatus}, Số tệp: ${attachments.length}, Lần nộp thứ: ${currentAttempt}`,
    });
  },

  // Grades & Gradebook
  getGrades: (classId?: string): GradeEntry[] => {
    const list: GradeEntry[] = getItem(KEYS.GRADES, INITIAL_GRADES);
    if (classId) return list.filter(g => g.classId === classId);
    return list;
  },
  getGradeHistory: (): GradeHistory[] => {
    return getItem(KEYS.GRADE_HISTORY, [
      {
        id: 'gh_1',
        gradeEntryId: 'grd_01',
        studentName: 'Trần Minh Đức',
        field: 'TX1',
        oldValue: 9.0,
        newValue: 9.5,
        updatedBy: 'Cô Nguyễn Mai Anh',
        timestamp: '2026-10-03 09:15',
        reason: 'Chấm phúc khảo bài kiểm tra 15 phút',
      }
    ]);
  },
  updateGradeCell: (gradeId: string, field: 'tx1' | 'tx2' | 'tx3' | 'gk' | 'ck', value: number | null, actor: User, reason?: string) => {
    const list = StorageService.getGrades();
    const index = list.findIndex(g => g.id === gradeId);
    if (index === -1) return;

    const entry = list[index];
    const oldValue = entry[field] ?? null;
    entry[field] = value;

    // Recalculate weighted GPA formula:
    // GPA = (TX1 + TX2 + TX3 + GK*2 + CK*3) / (1 + 1 + 1 + 2 + 3)
    const validScores: { weight: number; val: number }[] = [];
    if (entry.tx1 !== undefined && entry.tx1 !== null) validScores.push({ weight: 1, val: entry.tx1 });
    if (entry.tx2 !== undefined && entry.tx2 !== null) validScores.push({ weight: 1, val: entry.tx2 });
    if (entry.tx3 !== undefined && entry.tx3 !== null) validScores.push({ weight: 1, val: entry.tx3 });
    if (entry.gk !== undefined && entry.gk !== null) validScores.push({ weight: 2, val: entry.gk });
    if (entry.ck !== undefined && entry.ck !== null) validScores.push({ weight: 3, val: entry.ck });

    if (validScores.length > 0) {
      const sumWeight = validScores.reduce((sum, item) => sum + item.weight, 0);
      const sumWeightedVal = validScores.reduce((sum, item) => sum + item.val * item.weight, 0);
      entry.gpa = parseFloat((sumWeightedVal / sumWeight).toFixed(1));
    } else {
      entry.gpa = null;
    }
    entry.updatedAt = new Date().toISOString().split('T')[0];
    entry.updatedBy = actor.name;
    list[index] = entry;
    setItem(KEYS.GRADES, list);

    // Save history
    const historyList = StorageService.getGradeHistory();
    const newHistory: GradeHistory = {
      id: `gh_${Date.now()}`,
      gradeEntryId: gradeId,
      studentName: entry.studentName,
      field: field.toUpperCase(),
      oldValue,
      newValue: value,
      updatedBy: actor.name,
      timestamp: new Date().toLocaleString('vi-VN'),
      reason: reason || 'Cập nhật điểm trong bảng điểm',
    };
    historyList.unshift(newHistory);
    setItem(KEYS.GRADE_HISTORY, historyList);

    // Add Audit Log
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SỬA_ĐIỂM_SỐ',
      entityType: 'GRADE',
      entityId: gradeId,
      entityName: `${entry.studentName} - Cột ${field.toUpperCase()}`,
      beforeData: `${field.toUpperCase()}: ${oldValue ?? 'Trống'}`,
      afterData: `${field.toUpperCase()}: ${value ?? 'Trống'} (GPA mới: ${entry.gpa ?? 'N/A'})`,
    });
  },

  // Schedule
  getSchedule: (): ScheduleItem[] => getItem(KEYS.SCHEDULE, INITIAL_SCHEDULE),
  saveSchedule: (schedule: ScheduleItem[]) => setItem(KEYS.SCHEDULE, schedule),
  addScheduleItem: (item: ScheduleItem, actor?: User) => {
    const list = StorageService.getSchedule();
    list.push(item);
    list.sort((a, b) => a.dayOfWeek === b.dayOfWeek ? a.period - b.period : a.dayOfWeek - b.dayOfWeek);
    setItem(KEYS.SCHEDULE, list);
    if (actor) {
      StorageService.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'TẠO_TIẾT_HỌC',
        entityType: 'CLASS',
        entityId: item.id,
        entityName: `Tiết ${item.period} - ${item.subject} (${item.className})`,
        afterData: JSON.stringify(item),
      });
    }
    return list;
  },
  updateScheduleItem: (item: ScheduleItem, actor?: User) => {
    const list = StorageService.getSchedule();
    const index = list.findIndex(s => s.id === item.id);
    let before = '';
    if (index >= 0) {
      before = JSON.stringify(list[index]);
      list[index] = item;
    } else {
      list.push(item);
    }
    list.sort((a, b) => a.dayOfWeek === b.dayOfWeek ? a.period - b.period : a.dayOfWeek - b.dayOfWeek);
    setItem(KEYS.SCHEDULE, list);
    if (actor) {
      StorageService.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'CẬP_NHẬT_TIẾT_HỌC',
        entityType: 'CLASS',
        entityId: item.id,
        entityName: `Tiết ${item.period} - ${item.subject} (${item.className})`,
        beforeData: before,
        afterData: JSON.stringify(item),
      });
    }
    return list;
  },
  deleteScheduleItem: (id: string, actor?: User) => {
    const list = StorageService.getSchedule();
    const target = list.find(s => s.id === id);
    if (!target) return list;
    const updated = list.filter(s => s.id !== id);
    setItem(KEYS.SCHEDULE, updated);
    if (actor) {
      StorageService.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'XÓA_TIẾT_HỌC',
        entityType: 'CLASS',
        entityId: id,
        entityName: `Tiết ${target.period} - ${target.subject}`,
        beforeData: JSON.stringify(target),
        afterData: 'Đã xóa',
      });
    }
    return updated;
  },

  // Announcements
  getAnnouncements: (): Announcement[] => getItem(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS),
  saveAnnouncement: (announcement: Announcement, actor: User) => {
    const list = StorageService.getAnnouncements();
    list.unshift(announcement);
    setItem(KEYS.ANNOUNCEMENTS, list);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TẠO_THÔNG_BÁO',
      entityType: 'SETTINGS',
      entityId: announcement.id,
      entityName: announcement.title,
      afterData: `Mức độ: ${announcement.priority}, Đối tượng: ${announcement.targetType}`,
    });
  },

  // Audit Logs
  getAuditLogs: (): AuditLog[] => getItem(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  addAuditLog: (logData: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const logs = StorageService.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      ...logData,
    };
    logs.unshift(newLog);
    // keep maximum 150 records
    setItem(KEYS.AUDIT_LOGS, logs.slice(0, 150));
  },

  // Behavior
  getBehavior: (classId?: string): BehaviorRecord[] => {
    const list: BehaviorRecord[] = getItem(KEYS.BEHAVIOR, INITIAL_BEHAVIOR);
    if (classId) return list.filter(b => b.classId === classId);
    return list;
  },
  addBehaviorRecord: (record: BehaviorRecord, actor: User) => {
    const list = StorageService.getBehavior();
    list.unshift(record);
    setItem(KEYS.BEHAVIOR, list);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'GHI_NHẬN_HÀNH_VI',
      entityType: 'STUDENT',
      entityId: record.studentId,
      entityName: `${record.studentName} (${record.points > 0 ? '+' : ''}${record.points} điểm)`,
      afterData: record.title,
    });
  },

  // Quizzes
  getQuizzes: (classId?: string): Quiz[] => {
    const list: Quiz[] = getItem(KEYS.QUIZ, [INITIAL_QUIZ]);
    if (classId) return list.filter(q => q.classId === classId);
    return list;
  },
  saveQuiz: (quiz: Quiz, actor: User) => {
    const list = StorageService.getQuizzes();
    const index = list.findIndex(q => q.id === quiz.id);
    if (index >= 0) list[index] = quiz;
    else list.unshift(quiz);
    setItem(KEYS.QUIZ, list);
    StorageService.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TẠO_QUIZ_TRẮC_NGHIỆM',
      entityType: 'ASSIGNMENT',
      entityId: quiz.id,
      entityName: quiz.title,
      afterData: `Số câu hỏi: ${quiz.questions.length}`,
    });
  },

  // Reset to default seed data
  resetAll: () => {
    localStorage.clear();
    StorageService.init();
  }
};
