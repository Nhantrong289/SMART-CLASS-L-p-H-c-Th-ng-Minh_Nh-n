import React, { useState, useRef } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Upload,
  UserCheck,
  Eye,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Filter,
  Phone,
  Mail,
  User,
  GraduationCap,
  AlertCircle,
  FileDown,
  RefreshCw,
  XCircle,
  Check,
  Pencil,
  MapPin,
  Calendar as CalendarIcon,
  MessageSquare,
  Send,
  Copy,
  ExternalLink,
  ShieldCheck,
  Clock,
  Layers,
  ChevronDown,
  Home,
  ChevronRight,
  Heart
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Student, ClassRoom } from '../../types';
import { AvatarPicker, PRESET_AVATARS } from '../../components/ui/AvatarPicker';
import { getInitialsAvatar } from '../../utils/avatar';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { FirestoreDataService } from '../../services/firestoreData';
import { getVietnameseErrorMessage, db, collection, query, where, getDocs, writeBatch } from '../../services/firebase';

interface ParsedStudentRow {
  studentCode: string;
  name: string;
  className: string;
  group: number;
  gender: 'Nam' | 'Nữ';
  dob: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  address?: string;
  errors: string[];
  isDuplicate: boolean;
}

export const StudentsList: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning, info } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classesList, setClassesList] = useState<ClassRoom[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time Firestore subscription for teacher's own students and classes
  React.useEffect(() => {
    if (!user?.id) {
      setStudents(StorageService.getStudents());
      setClassesList(StorageService.getClasses());
      return;
    }

    const unsubStudents = FirestoreDataService.subscribeStudents(
      user.id,
      (liveStudents) => {
        if (liveStudents.length > 0) {
          setStudents(liveStudents);
        } else {
          // If Firestore is empty, use initial local students
          const local = StorageService.getStudents();
          setStudents(local);
        }
      },
      (err) => {
        console.warn('Firestore students error:', err);
        setStudents(StorageService.getStudents());
      }
    );

    const unsubClasses = FirestoreDataService.subscribeClasses(
      user.id,
      (liveClasses) => {
        if (liveClasses.length > 0) {
          setClassesList(liveClasses);
        } else {
          setClassesList(StorageService.getClasses());
        }
      }
    );

    return () => {
      unsubStudents();
      unsubClasses();
    };
  }, [user?.id]);

  // 2 Primary Tabs: Học sinh vs Phụ huynh (PH)
  const [viewTab, setViewTab] = useState<'students' | 'parents'>('students');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);

  // Quick Message to Parent Modal
  const [messagingStudent, setMessagingStudent] = useState<Student | null>(null);
  const [msgTitle, setMsgTitle] = useState('Thông báo kết quả học tập & chuyên cần');
  const [msgBody, setMsgBody] = useState('');

  // Edit Student Modal state (with student and parent portraits)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    studentCode: '',
    name: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '2012-07-27',
    phone: '',
    classId: 'cls_10a1',
    className: '10A1',
    group: 1,
    avatar: PRESET_AVATARS.student[0].url,
    parentName: '',
    parentPhone: '',
    parentAvatar: PRESET_AVATARS.parent[0].url,
    address: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<'student' | 'parent'>('student');

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'excel'>('manual');
  const [addTab, setAddTab] = useState<'student' | 'parent'>('student');

  // Manual Add Form State (with student and parent portraits)
  const [addForm, setAddForm] = useState({
    studentCode: `HS-${String(students.length + 1).padStart(4, '0')}`,
    name: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '2012-07-27',
    phone: '',
    classId: 'cls_10a1',
    className: '10A1',
    group: 1,
    avatar: PRESET_AVATARS.student[0].url,
    parentName: '',
    parentPhone: '',
    parentAvatar: PRESET_AVATARS.parent[0].url,
    address: '',
  });
  const [manualError, setManualError] = useState<string | null>(null);

  // Excel / CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [hasScanned, setHasScanned] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentPhone.includes(searchTerm) ||
      (s.address && s.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass =
      selectedClassFilter === 'all' ||
      s.className.toLowerCase() === selectedClassFilter.toLowerCase() ||
      s.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  const handleDeleteAll = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Delete all students belonging to this teacher on Firestore
      const q = query(collection(db, 'students'), where('teacherUid', '==', user.id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }

      StorageService.deleteAllStudents('cls_10a1', user);
      setStudents([]);
      setIsDeleteAllConfirmOpen(false);
      success('Đã xóa toàn bộ học sinh khỏi Cloud Firestore thành công!');
    } catch (err) {
      console.error('Lỗi xóa toàn bộ học sinh:', err);
      error(getVietnameseErrorMessage(err, 'Xóa toàn bộ học sinh trên Firestore'));
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate Check for Manual Addition
  const checkDuplicateCode = (codeToCheck: string, excludeId?: string) => {
    const cleanCode = codeToCheck.trim().toLowerCase();
    if (!cleanCode) return null;
    const dup = students.find(
      (s) => s.id !== excludeId && s.studentCode.toLowerCase() === cleanCode
    );
    if (dup) {
      return `Mã học sinh "${codeToCheck}" đã trùng với học sinh "${dup.name}" (Lớp ${dup.className} - Tổ ${dup.group})`;
    }
    return null;
  };

  // Open Edit Dialog
  const handleStartEdit = (student: Student, initialTab: 'student' | 'parent' = 'student') => {
    setEditingStudent(student);
    setEditTab(initialTab);
    setEditForm({
      studentCode: student.studentCode,
      name: student.name,
      gender: student.gender,
      dob: student.dob || '2012-07-27',
      phone: student.phone || '0912345678',
      classId: student.classId || 'cls_10a1',
      className: student.className || '10A1',
      group: student.group || 1,
      avatar: student.avatar || PRESET_AVATARS.student[0].url,
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      parentAvatar: student.parentAvatar || PRESET_AVATARS.parent[0].url,
      address: student.address || '',
    });
    setEditError(null);
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !user) return;

    if (!editForm.name.trim()) {
      setEditError('Vui lòng nhập họ và tên học sinh');
      return;
    }
    if (!editForm.studentCode.trim()) {
      setEditError('Vui lòng nhập mã học sinh');
      return;
    }

    const dup = checkDuplicateCode(editForm.studentCode, editingStudent.id);
    if (dup) {
      setEditError(dup);
      error(dup);
      return;
    }

    const updatedStudent: Student = {
      ...editingStudent,
      studentCode: editForm.studentCode.trim().toUpperCase(),
      name: editForm.name.trim(),
      gender: editForm.gender,
      dob: editForm.dob,
      phone: editForm.phone.trim() || '0912345678',
      classId: editForm.classId,
      className: editForm.className,
      group: Number(editForm.group),
      avatar: editForm.avatar || editingStudent.avatar,
      parentName: editForm.parentName.trim(),
      parentPhone: editForm.parentPhone.trim(),
      parentAvatar: editForm.parentAvatar || editingStudent.parentAvatar,
      address: editForm.address.trim(),
    };

    setIsSaving(true);
    try {
      // 1. Update in Cloud Firestore and await confirmation
      await FirestoreDataService.updateStudent(editingStudent.id, updatedStudent, user.id);

      StorageService.saveStudent(updatedStudent, user);
      setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
      setEditingStudent(null);

      // Requirement 7: Chỉ thông báo thành công sau khi Firestore xác nhận lưu
      success(`Đã cập nhật thành công thông tin học sinh "${updatedStudent.name}" trên Cloud Firestore!`);
    } catch (err: any) {
      console.error('Lỗi cập nhật học sinh:', err);
      // Requirement 7: Nếu thất bại, hiển thị lỗi rõ ràng bằng tiếng Việt
      error(getVietnameseErrorMessage(err, 'Cập nhật thông tin học sinh trên Firestore'));
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Manual Add Form
  const handleAddManualStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      error('Vui lòng đăng nhập để thêm học sinh');
      return;
    }
    if (!addForm.name.trim()) {
      setManualError('Vui lòng nhập họ và tên học sinh');
      return;
    }
    if (!addForm.studentCode.trim()) {
      setManualError('Vui lòng nhập mã học sinh');
      return;
    }

    const dupError = checkDuplicateCode(addForm.studentCode);
    if (dupError) {
      setManualError(dupError);
      error(dupError);
      return;
    }

    const newStudentData = {
      id: `std_${Date.now()}`,
      studentCode: addForm.studentCode.trim().toUpperCase(),
      name: addForm.name.trim(),
      classId: addForm.classId,
      className: addForm.className,
      group: Number(addForm.group),
      avatar: addForm.avatar || PRESET_AVATARS.student[0].url,
      gender: addForm.gender,
      dob: addForm.dob,
      email: `${addForm.studentCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu.vn`,
      phone: addForm.phone.trim() || '0912345678',
      parentName: addForm.parentName.trim() || 'Phụ huynh học sinh',
      parentPhone: addForm.parentPhone.trim() || '0906012345',
      parentAvatar: addForm.parentAvatar || PRESET_AVATARS.parent[0].url,
      address: addForm.address.trim(),
      attendanceRate: 100,
      gpa: 8.5,
      status: 'active' as const,
      conduct: 'Tốt' as const,
      rewardsCount: 0,
      alertsCount: 0,
    };

    setIsSaving(true);
    try {
      // 1. Create on Cloud Firestore and await confirmation
      const saved = await FirestoreDataService.createStudent(newStudentData, user.id);

      StorageService.saveStudent(saved, user);
      setStudents((prev) => [saved, ...prev.filter((s) => s.id !== saved.id)]);
      setIsAddModalOpen(false);
      resetManualForm();

      // Requirement 7: Chỉ thông báo thành công sau khi Firestore xác nhận lưu
      success(`Đã thêm thành công học sinh "${saved.name}" (${saved.studentCode}) trên Cloud Firestore!`);
    } catch (err: any) {
      console.error('Lỗi thêm học sinh:', err);
      // Requirement 7: Nếu thất bại, hiển thị lỗi rõ ràng bằng tiếng Việt
      error(getVietnameseErrorMessage(err, 'Thêm học sinh trên Firestore'));
    } finally {
      setIsSaving(false);
    }
  };

  const resetManualForm = () => {
    const nextNum = StorageService.getStudents().length + 1;
    setAddForm({
      studentCode: `HS-${String(nextNum).padStart(4, '0')}`,
      name: '',
      gender: 'Nam',
      dob: '2012-07-27',
      phone: '',
      classId: 'cls_10a1',
      className: '10A1',
      group: 1,
      avatar: PRESET_AVATARS.student[0].url,
      parentName: '',
      parentPhone: '',
      parentAvatar: PRESET_AVATARS.parent[0].url,
      address: '',
    });
    setManualError(null);
  };

  // CSV Parsing & Duplicate Filter Logic
  const processRawStudentList = (rawItems: Omit<ParsedStudentRow, 'errors' | 'isDuplicate'>[], sourceName: string) => {
    const codeCounts: Record<string, number> = {};
    rawItems.forEach((item) => {
      const code = item.studentCode.trim().toUpperCase();
      codeCounts[code] = (codeCounts[code] || 0) + 1;
    });

    const analyzed: ParsedStudentRow[] = rawItems.map((item) => {
      const rowErrors: string[] = [];
      let isDup = false;
      const code = item.studentCode.trim().toUpperCase();

      // Check if studentCode exists in DB
      const existingInDb = students.find((s) => s.studentCode.toUpperCase() === code);
      if (existingInDb) {
        rowErrors.push(`Trùng mã HS "${code}" với học sinh "${existingInDb.name}" (Đang có trong lớp)`);
        isDup = true;
      }

      // Check if duplicate within uploaded file
      if (codeCounts[code] > 1) {
        rowErrors.push(`Mã HS "${code}" bị trùng lặp nhiều lần trong tệp tải lên`);
        isDup = true;
      }

      // Empty name check
      if (!item.name || !item.name.trim()) {
        rowErrors.push('Thiếu họ tên học sinh');
      }

      return {
        ...item,
        errors: rowErrors,
        isDuplicate: isDup,
      };
    });

    setParsedRows(analyzed);
    setImportFileName(sourceName);
    setHasScanned(true);

    const dupCount = analyzed.filter((r) => r.isDuplicate || r.errors.length > 0).length;
    const validCount = analyzed.filter((r) => !r.isDuplicate && r.errors.length === 0).length;

    if (dupCount > 0) {
      warning(`Đã quét xong: Phát hiện ${dupCount} học sinh bị trùng/lỗi. Hệ thống đã tự động lọc ra khỏi danh sách.`);
    } else {
      success(`Tất cả ${validCount} học sinh đều hợp lệ, không có trùng lặp.`);
    }
  };

  // Upload custom CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          error('Tệp tải lên không có dữ liệu học sinh');
          return;
        }

        const dataRows: Omit<ParsedStudentRow, 'errors' | 'isDuplicate'>[] = [];
        const headerRow = lines[0].toLowerCase().split(',').map((h) => h.replace(/^"|"$/g, '').trim());

        // Header detection helper
        const findColIdx = (...terms: string[]) =>
          headerRow.findIndex((col) => terms.some((t) => col.includes(t)));

        const idxCode = findColIdx('mã');
        const idxName = findColIdx('họ và tên', 'họ tên', 'tên học sinh', 'tên');
        const idxClass = findColIdx('lớp');
        const idxGroup = findColIdx('tổ', 'phân tổ');
        const idxGender = findColIdx('giới tính');
        const idxDob = findColIdx('ngày sinh', 'năm sinh');
        const idxPhone = findColIdx('sđt học sinh', 'sdt học sinh', 'điện thoại hs');
        const idxParentName = findColIdx('họ tên phụ huynh', 'phụ huynh', 'tên ph', 'họ tên ph');
        const idxParentPhone = findColIdx('sđt phụ huynh', 'sdt phụ huynh', 'sđt ph', 'sdt ph');
        const idxAddress = findColIdx('địa chỉ');

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 2) {
            let studentCode = '';
            let name = '';
            let className = '10A1';
            let group = 1;
            let gender: 'Nam' | 'Nữ' = 'Nam';
            let dob = '2012-07-27';
            let phone = '0912345678';
            let parentName = 'Phụ huynh học sinh';
            let parentPhone = '0906012345';
            let address = '';

            if (idxCode !== -1 && idxName !== -1) {
              // Header-based mapping
              studentCode = cols[idxCode] || '';
              name = cols[idxName] || '';
              if (idxClass !== -1 && cols[idxClass]) className = cols[idxClass];
              if (idxGroup !== -1 && cols[idxGroup]) group = parseInt(cols[idxGroup].replace(/[^0-9]/g, '')) || 1;
              if (idxGender !== -1 && cols[idxGender] === 'Nữ') gender = 'Nữ';
              if (idxDob !== -1 && cols[idxDob]) dob = cols[idxDob];
              if (idxPhone !== -1 && cols[idxPhone]) phone = cols[idxPhone];
              if (idxParentName !== -1 && cols[idxParentName]) parentName = cols[idxParentName];
              if (idxParentPhone !== -1 && cols[idxParentPhone]) parentPhone = cols[idxParentPhone];
              if (idxAddress !== -1 && cols[idxAddress]) address = cols[idxAddress];
            } else if (cols.length >= 11 && (cols[8] === 'Tốt' || cols[8] === 'Khá' || cols[8] === 'Trung bình')) {
              // 12-column export format: [Mã HS, Họ tên, Lớp, Tổ, Giới tính, Ngày sinh, Điểm TB, Chuyên cần, Hạnh kiểm, Họ tên PH, SĐT PH, Địa chỉ]
              studentCode = cols[0];
              name = cols[1];
              className = cols[2] || '10A1';
              group = cols[3] ? parseInt(cols[3].replace(/[^0-9]/g, '')) || 1 : 1;
              gender = cols[4] === 'Nữ' ? 'Nữ' : 'Nam';
              dob = cols[5] || '2012-07-27';
              parentName = cols[9] || 'Phụ huynh';
              parentPhone = cols[10] || '0987654321';
              address = cols[11] || '';
            } else {
              // Default template: [Mã HS, Họ tên, Lớp, Tổ, Giới tính, Ngày sinh, Họ tên PH, SĐT PH, Địa chỉ]
              studentCode = cols[0];
              name = cols[1];
              className = cols[2] || '10A1';
              group = cols[3] ? parseInt(cols[3].replace(/[^0-9]/g, '')) || 1 : 1;
              gender = cols[4] === 'Nữ' ? 'Nữ' : 'Nam';
              dob = cols[5] || '2012-07-27';
              parentName = cols[6] || 'Phụ huynh';
              parentPhone = cols[7] || '0906012345';
              address = cols[8] || '';
            }

            if (studentCode && name) {
              dataRows.push({
                studentCode,
                name,
                className,
                group,
                gender,
                dob,
                email: `${studentCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu.vn`,
                phone,
                parentName,
                parentPhone,
                address,
              });
            }
          }
        }

        if (dataRows.length === 0) {
          error('Không thể đọc dữ liệu từ tệp. Vui lòng tải file mẫu đúng cấu trúc.');
          return;
        }

        processRawStudentList(dataRows, file.name);
      } catch (err) {
        error('Có lỗi xảy ra khi xử lý tệp CSV/Excel');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Confirm import ONLY valid students
  const handleConfirmImportValidOnly = async () => {
    if (!user) {
      error('Vui lòng đăng nhập để nhập học sinh vào hệ thống');
      return;
    }

    const validStudentsToImport: Array<Partial<Student> & { name: string; classId: string }> = parsedRows
      .filter((r) => !r.isDuplicate && r.errors.length === 0)
      .map((r, idx) => ({
        id: `std_imp_${Date.now()}_${idx}`,
        studentCode: r.studentCode.trim().toUpperCase(),
        name: r.name.trim(),
        classId: 'cls_10a1',
        className: r.className || '10A1',
        group: r.group,
        avatar: getInitialsAvatar(r.name.trim(), 'STUDENT'),
        gender: r.gender,
        dob: r.dob,
        email: `${r.studentCode.toLowerCase()}@student.edu.vn`,
        phone: r.phone,
        parentName: r.parentName,
        parentPhone: r.parentPhone,
        address: r.address || '',
        attendanceRate: 100,
        gpa: 8.5,
        status: 'active',
        conduct: 'Tốt',
        rewardsCount: 0,
        alertsCount: 0,
      }));

    if (validStudentsToImport.length === 0) {
      error('Không có học sinh hợp lệ nào để nhập vào lớp (Tất cả bản ghi đều bị trùng hoặc lỗi).');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Batch write to Cloud Firestore and await confirmation
      const count = await FirestoreDataService.batchImportStudents(validStudentsToImport, user.id);

      StorageService.bulkImportStudents(validStudentsToImport as Student[], user);
      setIsAddModalOpen(false);
      setParsedRows([]);
      setHasScanned(false);

      // Requirement 7: Chỉ thông báo thành công sau khi Firestore xác nhận lưu
      success(`Đã lưu thành công ${count} học sinh lên Cloud Firestore!`);
    } catch (err: any) {
      console.error('Lỗi nhập học sinh:', err);
      // Requirement 7: Nếu thất bại, hiển thị lỗi rõ ràng bằng tiếng Việt
      error(getVietnameseErrorMessage(err, 'Nhập danh sách học sinh lên Firestore'));
    } finally {
      setIsSaving(false);
    }
  };

  // Download sample template
  const handleDownloadTemplate = () => {
    const sampleHeaders = 'Mã học sinh,Họ và tên,Lớp học,Phân tổ,Giới tính,Ngày sinh,Họ tên phụ huynh,SĐT phụ huynh,Địa chỉ thường trú\n';
    const sampleRow = 'HS-0618,Lương Gia Thịnh,Lớp 10A1,Tổ 2,Nam,2012-07-27,Lương Văn Hóa,0906012345,Lê Duẩn Đống Đa Hà Nội\n';
    const blob = new Blob([sampleHeaders + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Mau_Danh_Sach_Hoc_Sinh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Đã tải xuống file mẫu Excel / CSV chuẩn!');
  };

  const handleDelete = async () => {
    if (!deletingStudentId || !user) return;
    const targetStudent = students.find((s) => s.id === deletingStudentId);
    const classId = targetStudent?.classId || 'cls_10a1';

    setIsSaving(true);
    try {
      // 1. Delete from Cloud Firestore and await confirmation
      await FirestoreDataService.deleteStudent(deletingStudentId, classId, user.id);

      StorageService.deleteStudent(deletingStudentId, user);
      setStudents((prev) => prev.filter((s) => s.id !== deletingStudentId));
      setDeletingStudentId(null);

      // Requirement 7: Chỉ thông báo thành công sau khi Firestore xác nhận lưu
      success('Đã xóa học sinh thành công khỏi Cloud Firestore!');
    } catch (err: any) {
      console.error('Lỗi xóa học sinh:', err);
      // Requirement 7: Nếu thất bại, hiển thị lỗi rõ ràng bằng tiếng Việt
      error(getVietnameseErrorMessage(err, 'Xóa học sinh trên Firestore'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (viewTab === 'students') {
      const headers = ['Mã HS,Họ và tên,Lớp,Tổ,Giới tính,Ngày sinh,Điểm TB,Chuyên cần,Hạnh kiểm,Phụ huynh,SĐT Phụ huynh,Địa chỉ\n'];
      const rows = students.map(
        (s) =>
          `"${s.studentCode}","${s.name}","${s.className}","Tổ ${s.group}","${s.gender}","${s.dob}","${s.gpa}","${s.attendanceRate}%","${s.conduct}","${s.parentName}","${s.parentPhone}","${s.address || ''}"`
      );
      const blob = new Blob([headers.join('') + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Danh_sach_hoc_sinh_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Đã xuất file CSV danh sách học sinh thành công!');
    } else {
      const headers = ['Họ tên phụ huynh,SĐT phụ huynh,Học sinh con em,Mã HS,Lớp,Tổ,Địa chỉ thường trú,Kênh liên lạc\n'];
      const rows = students.map(
        (s) =>
          `"${s.parentName}","${s.parentPhone}","${s.name}","${s.studentCode}","${s.className}","Tổ ${s.group}","${s.address || ''}","Sổ liên lạc điện tử / SMS"`
      );
      const blob = new Blob([headers.join('') + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Danh_ba_phu_huynh_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Đã xuất danh bạ phụ huynh thành công!');
    }
  };

  // Quick message template action
  const handleOpenMessageModal = (student: Student) => {
    setMessagingStudent(student);
    setMsgTitle(`Thông báo học tập: Học sinh ${student.name}`);
    setMsgBody(
      `Kính gửi phụ huynh ${student.parentName},\nNhà trường xin gửi thông báo cập nhật kết quả học tập và rèn luyện của học sinh ${student.name} (Lớp ${student.className}): Điểm TB đạt ${student.gpa.toFixed(1)}, Hạnh kiểm ${student.conduct}, Chuyên cần ${student.attendanceRate}%. Trân trọng!`
    );
  };

  const handleSendMessage = () => {
    if (!messagingStudent || !user) return;
    StorageService.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'GỬI_THÔNG_BÁO_PHỤ_HUYNH',
      entityType: 'STUDENT',
      entityId: messagingStudent.id,
      entityName: `Gửi tin nhắn cho PH: ${messagingStudent.parentName}`,
      beforeData: msgTitle,
      afterData: msgBody,
    });
    success(`Đã gửi tin nhắn đến phụ huynh ${messagingStudent.parentName} (${messagingStudent.parentPhone}) qua Sổ liên lạc điện tử!`);
    setMessagingStudent(null);
  };

  const copyPhoneNumber = (phoneNum: string) => {
    navigator.clipboard.writeText(phoneNum);
    info(`Đã sao chép số điện thoại: ${phoneNum}`);
  };

  const validRows = parsedRows.filter((r) => !r.isDuplicate && r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.isDuplicate || r.errors.length > 0);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & BREADCRUMB (PHẦN BÔI ĐỎ THEO HÌNH ẢNH CỦA NGƯỜI DÙNG) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
        {/* PHẦN BÔI ĐỎ: 🏠 > Lớp học > Thông tin phụ huynh • Quản lý Học sinh & Phụ huynh */}
        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-cyan-400">
            <Home className="w-4 h-4" />
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">Lớp học</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-300">
            {viewTab === 'parents' ? 'Thông tin phụ huynh' : 'Danh sách học sinh'}
          </span>
          <span className="text-slate-600 font-bold">•</span>
          <h1 className="font-extrabold text-white text-sm sm:text-base tracking-tight">
            Quản lý Học sinh & Phụ huynh
          </h1>
        </div>

        {/* 2 NÚT THAO TÁC GÓC PHẢI TRÊN CÙNG THEO ẢNH */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/15 hover:border-cyan-500/40 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            title="Xuất danh bạ phụ huynh / học sinh ra file Excel CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Xuất danh bạ Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (students.length > 0) {
                setMessagingStudent(students[0]);
                setMsgTitle('Thông báo chung gửi toàn thể phụ huynh cả lớp');
                setMsgBody('');
              } else {
                info('Chưa có học sinh nào trong danh sách!');
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold text-xs transition-all cursor-pointer shadow-md active:scale-95"
            title="Gửi tin nhắn thông báo đến phụ huynh toàn bộ lớp"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi tin nhắn cả lớp</span>
          </button>
        </div>
      </div>

      {/* 2. CHUYỂN ĐỔI 2 TAB CHÍNH: DANH SÁCH HỌC SINH VS THÔNG TIN PHỤ HUYNH THEO ẢNH */}
      <div className="flex items-center gap-2 p-1 bg-slate-900/90 rounded-2xl border border-white/10 w-fit shadow-lg">
        <button
          type="button"
          onClick={() => setViewTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
            viewTab === 'students'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Danh sách học sinh</span>
          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[11px] font-extrabold">
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewTab('parents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
            viewTab === 'parents'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400" />
          <span>Thông tin phụ huynh</span>
          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[11px] font-extrabold">
            {students.length} PH
          </span>
        </button>
      </div>

      {/* Toolbar: Search input on left, Action buttons on right (Tối ưu không gian) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto flex-1 max-w-lg">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                viewTab === 'students'
                  ? 'Tìm theo tên học sinh, mã HS, phụ huynh, địa chỉ...'
                  : 'Tìm theo họ tên phụ huynh, SĐT, học sinh, địa chỉ...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b1026] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Màu xanh dương đổi thành Module: Module Lớp Học */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 hover:border-cyan-500/40 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm select-none"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {selectedClassFilter === 'all'
                  ? `Module: Tất cả lớp (${students.length})`
                  : `Module: Lớp ${selectedClassFilter} (${students.filter((s) => s.className.toLowerCase() === selectedClassFilter.toLowerCase()).length})`}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isClassDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isClassDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-48 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Chọn Module Lớp
                </div>
                {['all', '10A1', '10A2', '11B1', '12A3'].map((clsName) => (
                  <button
                    key={clsName}
                    type="button"
                    onClick={() => {
                      setSelectedClassFilter(clsName);
                      setIsClassDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      selectedClassFilter === clsName
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{clsName === 'all' ? 'Tất cả các lớp' : `Lớp ${clsName}`}</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      ({clsName === 'all' ? students.length : students.filter((s) => s.className.toLowerCase() === clsName.toLowerCase()).length})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-end">
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExportCSV}>
            {viewTab === 'students' ? 'Xuất Excel/CSV' : 'Xuất danh bạ PH'}
          </Button>

          {viewTab === 'students' && (
            <>
              {students.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setIsDeleteAllConfirmOpen(true)}
                  title="Xóa toàn bộ học sinh khỏi danh sách lớp"
                >
                  Xóa tất cả
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setIsAddModalOpen(true);
                  setManualError(null);
                }}
              >
                Thêm học sinh mới
              </Button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: DANH SÁCH HỌC SINH */}
      {viewTab === 'students' && (
        <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-3">Mã học sinh</th>
                  <th className="py-3 px-3">Điểm TB</th>
                  <th className="py-3 px-3">Chuyên cần</th>
                  <th className="py-3 px-3">Hạnh kiểm</th>
                  <th className="py-3 px-4">Phụ huynh & SĐT</th>
                  <th className="py-3 px-4">Địa chỉ thường trú</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={s.avatar}
                          name={s.name}
                          role="STUDENT"
                          size="sm"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{s.name}</div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span>{s.gender} · {s.dob}</span>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-cyan-300 font-semibold inline-flex items-center gap-1">
                              <Phone className="w-3 h-3 text-cyan-400" />
                              {s.phone || '0912345678'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-300 font-semibold">{s.studentCode}</td>
                    <td className="py-3 px-3 font-mono font-bold text-white tabular-nums">
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          s.gpa >= 9
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : s.gpa >= 8
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {s.gpa.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-400 tabular-nums">
                      {s.attendanceRate}%
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={s.conduct === 'Tốt' ? 'emerald' : 'amber'} size="sm">
                        {s.conduct}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{s.parentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-cyan-400" />
                        {s.parentPhone}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="text-slate-300 text-xs truncate flex items-center gap-1" title={s.address || 'Chưa cập nhật'}>
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{s.address || <span className="text-slate-500 italic">Chưa cập nhật</span>}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStudentForProfile(s)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Xem hồ sơ 360°"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(s)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa học sinh"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStudentId(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State when list has 0 students */}
          {students.length === 0 && (
            <div className="p-12 text-center space-y-4 bg-slate-900/40">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Chưa có học sinh nào trong danh sách</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Danh sách hiện đang trống sau khi xóa. Bạn có thể thêm thủ công, nhập bằng Excel, hoặc khôi phục danh sách học sinh mẫu.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setIsAddModalOpen(true);
                    setManualError(null);
                  }}
                >
                  Thêm học sinh mới
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  onClick={() => {
                    StorageService.resetAll();
                    setStudents(StorageService.getStudents());
                    success('Đã khôi phục lại danh sách học sinh ban đầu!');
                  }}
                >
                  Khôi phục danh sách mẫu
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DANH SÁCH PHỤ HUYNH (PH) */}
      {viewTab === 'parents' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Quick Metrics for Parents */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Tổng số Phụ huynh</div>
                <div className="text-xl font-bold text-white font-mono mt-0.5">{students.length} phụ huynh</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Sổ Liên Lạc Điện Tử</div>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">100% Đã kích hoạt</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 text-fuchsia-400 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Kênh liên lạc chính</div>
                <div className="text-xl font-bold text-fuchsia-300 font-mono mt-0.5">App PH & SMS OTT</div>
              </div>
            </div>
          </div>

          {/* Parents Table */}
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Phụ huynh</th>
                    <th className="py-3 px-4">Học sinh con em</th>
                    <th className="py-3 px-4">Số điện thoại</th>
                    <th className="py-3 px-4">Địa chỉ thường trú</th>
                    <th className="py-3 px-3">Kênh kết nối</th>
                    <th className="py-3 px-4 text-right">Thao tác liên lạc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      {/* Parent info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              s.parentAvatar ||
                              getInitialsAvatar(s.parentName, 'PARENT')
                            }
                            alt={s.parentName}
                            onError={(e) => {
                              e.currentTarget.src = getInitialsAvatar(s.parentName, 'PARENT');
                            }}
                            className="w-10 h-10 rounded-full object-cover border border-fuchsia-500/40 bg-slate-800 shrink-0 shadow-md shadow-fuchsia-500/10"
                          />
                          <div>
                            <div className="font-bold text-white text-sm">{s.parentName}</div>
                            <div className="text-slate-400 text-[11px]">Phụ huynh học sinh</div>
                          </div>
                        </div>
                      </td>

                      {/* Child student info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{s.name}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{s.studentCode} · {s.className} (Tổ {s.group})</span>
                          <span className="text-slate-500">·</span>
                          <a
                            href={`tel:${s.phone || '0912345678'}`}
                            className="text-cyan-300 font-semibold hover:underline inline-flex items-center gap-1"
                            title="Số điện thoại học sinh (bấm để gọi)"
                          >
                            <Phone className="w-3 h-3 text-cyan-400" />
                            <span>{s.phone || '0912345678'}</span>
                          </a>
                        </div>
                      </td>

                      {/* Phone with quick call & copy */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${s.parentPhone}`}
                            className="font-mono text-cyan-300 font-semibold hover:underline flex items-center gap-1"
                            title="Bấm để gọi"
                          >
                            <Phone className="w-3 h-3 text-cyan-400" />
                            {s.parentPhone}
                          </a>
                          <button
                            onClick={() => copyPhoneNumber(s.parentPhone)}
                            className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                            title="Sao chép SĐT"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-3 px-4 max-w-[220px]">
                        <div className="text-slate-300 text-xs truncate flex items-center gap-1" title={s.address || 'Chưa cập nhật'}>
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{s.address || <span className="text-slate-500 italic">Chưa cập nhật</span>}</span>
                        </div>
                      </td>

                      {/* Connection status */}
                      <td className="py-3 px-3">
                        <Badge variant="emerald" size="sm">
                          Sổ liên lạc số
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={MessageSquare}
                            onClick={() => handleOpenMessageModal(s)}
                          >
                            Nhắn tin
                          </Button>
                          <button
                            onClick={() => handleStartEdit(s, 'parent')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin phụ huynh"
                          >
                            <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Sửa thông tin</span>
                          </button>
                          <button
                            onClick={() => setSelectedStudentForProfile(s)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Xem hồ sơ học sinh con em"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QUICK MESSAGE MODAL TO PARENT */}
      {messagingStudent && (
        <Modal
          isOpen={!!messagingStudent}
          onClose={() => setMessagingStudent(null)}
          title={`Gửi Tin Nhắn Phụ Huynh: ${messagingStudent.parentName}`}
          subtitle={`Học sinh: ${messagingStudent.name} (${messagingStudent.studentCode}) · SĐT: ${messagingStudent.parentPhone}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mẫu tin nhắn nhanh
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: 'Báo cáo học tập',
                    text: `Kính gửi phụ huynh ${messagingStudent.parentName}, nhà trường xin thông báo kết quả học tập của em ${messagingStudent.name} đạt điểm TB ${messagingStudent.gpa.toFixed(1)}, rèn luyện tốt.`,
                  },
                  {
                    label: 'Khen thưởng',
                    text: `Kính gửi phụ huynh ${messagingStudent.parentName}, em ${messagingStudent.name} đã có biểu hiện rất xuất sắc và tích cực trong tuần học vừa qua.`,
                  },
                  {
                    label: 'Nhắc nhở bài tập',
                    text: `Kính gửi phụ huynh ${messagingStudent.parentName}, xin vui lòng nhắc nhở em ${messagingStudent.name} hoàn thành bài tập trước hạn nộp vào tối nay.`,
                  },
                  {
                    label: 'Mời họp PH',
                    text: `Kính gửi phụ huynh ${messagingStudent.parentName}, trân trọng kính mời phụ huynh tham dự buổi họp phụ huynh định kỳ vào 08:30 sáng Chủ Nhật tuần này.`,
                  },
                ].map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMsgBody(tpl.text)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-[11px] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors cursor-pointer"
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tiêu đề thông báo
              </label>
              <input
                type="text"
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nội dung gửi qua Sổ liên lạc & SMS
              </label>
              <textarea
                rows={4}
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Mã hóa bảo mật & lưu sổ liên lạc
              </span>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setMessagingStudent(null)}>
                  Hủy
                </Button>
                <Button variant="primary" size="sm" icon={Send} onClick={handleSendMessage}>
                  Gửi ngay
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 1: CHỈNH SỬA HỌC SINH (9 EXACT FIELDS) */}
      {editingStudent && (
        <Modal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          title="Chỉnh Sửa Học Sinh"
          subtitle="Cập nhật thông tin chi tiết học sinh và liên hệ gia đình"
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Lỗi:</span> {editError}
                </div>
              </div>
            )}

            {/* 2 Tabs: Thông tin học sinh vs Thông tin phụ huynh */}
            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-white/10 w-fit">
              <button
                type="button"
                onClick={() => setEditTab('student')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  editTab === 'student'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>1. Thông tin học sinh</span>
              </button>
              <button
                type="button"
                onClick={() => setEditTab('parent')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  editTab === 'parent'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>2. Thông tin phụ huynh</span>
              </button>
            </div>

            {/* TAB 1: THÔNG TIN HỌC SINH */}
            {editTab === 'student' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Chọn ảnh chân dung học sinh */}
                <AvatarPicker
                  value={editForm.avatar}
                  onChange={(url) => setEditForm({ ...editForm, avatar: url })}
                  label="Ảnh chân dung học sinh"
                  category="student"
                />

                {/* Row 1: Mã học sinh * & Họ và tên * */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Mã học sinh *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.studentCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditForm({ ...editForm, studentCode: val });
                        setEditError(checkDuplicateCode(val, editingStudent.id));
                      }}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Row 2: Giới tính & Ngày sinh */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Giới tính
                    </label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as 'Nam' | 'Nữ' })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={editForm.dob}
                      onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                    </input>
                  </div>
                </div>

                {/* Row 3: Lớp học & Phân tổ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Lớp học
                    </label>
                    <select
                      value={editForm.classId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        const foundClass = classesList.find((c) => c.id === selId);
                        setEditForm({
                          ...editForm,
                          classId: selId,
                          className: foundClass?.name || '10A1',
                        });
                      }}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {classesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      {!classesList.some((c) => c.id === editForm.classId) && (
                        <option value={editForm.classId}>{editForm.className}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Phân tổ
                    </label>
                    <select
                      value={editForm.group}
                      onChange={(e) => setEditForm({ ...editForm, group: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value={1}>Tổ 1</option>
                      <option value={2}>Tổ 2</option>
                      <option value={3}>Tổ 3</option>
                      <option value={4}>Tổ 4</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Số điện thoại học sinh */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Số điện thoại học sinh (SĐT con em)</span>
                    <span className="text-[11px] text-cyan-400 font-normal">Hiển thị trong danh bạ và liên lạc</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="VD: 0912 345 678"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Bottom navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setEditingStudent(null)}
                  >
                    Hủy
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => setEditTab('parent')}
                    >
                      Tiếp tục: Thông tin phụ huynh →
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      disabled={!!editError}
                    >
                      Lưu Thay Đổi
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: THÔNG TIN PHỤ HUYNH */}
            {editTab === 'parent' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Chọn ảnh chân dung phụ huynh */}
                <AvatarPicker
                  value={editForm.parentAvatar}
                  onChange={(url) => setEditForm({ ...editForm, parentAvatar: url })}
                  label="Ảnh chân dung phụ huynh"
                  category="parent"
                />

                {/* Row 1: Họ tên phụ huynh & SĐT phụ huynh */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Họ tên phụ huynh
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Lương Văn Hóa"
                      value={editForm.parentName}
                      onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      SĐT phụ huynh
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 0906 012 345"
                      value={editForm.parentPhone}
                      onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Row 2: Địa chỉ thường trú */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Địa chỉ thường trú
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Lê Duẩn, Đống Đa, Hà Nội"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Bottom navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setEditTab('student')}
                  >
                    ← Quay lại: Thông tin học sinh
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setEditingStudent(null)}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      disabled={!!editError}
                    >
                      Lưu Thay Đổi
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* MODAL 2: THÊM TỪNG HỌC SINH (THỦ CÔNG HOẶC EXCEL) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setParsedRows([]);
          setHasScanned(false);
          setManualError(null);
          setAddTab('student');
        }}
        title="Thêm từng học sinh"
        subtitle={`Nhập hồ sơ học sinh và thông tin phụ huynh vào lớp ${
          classesList.find((c) => c.id === addForm.classId)?.name || '11B1'
        }`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Mode Switcher Tabs: Màu xanh dương đổi thành Module */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => {
                setAddMode('manual');
                setManualError(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                addMode === 'manual'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Module: Thêm từng học sinh (Thủ công)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAddMode('excel');
                setManualError(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                addMode === 'excel'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Module: Thêm bằng Excel / CSV (Hàng loạt)</span>
            </button>
          </div>

          {/* METHOD 1: THÊM THỦ CÔNG */}
          {addMode === 'manual' && (
            <form onSubmit={handleAddManualStudent} className="space-y-4">
              {manualError && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold">Lỗi trùng lặp dữ liệu:</span> {manualError}
                  </div>
                </div>
              )}

              {/* Sub-tabs: 1. Thông tin học sinh vs 2. Thông tin phụ huynh */}
              <div className="flex items-center gap-2 p-1 bg-slate-900/60 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setAddTab('student')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    addTab === 'student'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>1. Thông tin học sinh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddTab('parent')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    addTab === 'parent'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>2. Thông tin phụ huynh</span>
                </button>
              </div>

              {/* TAB 1: THÔNG TIN HỌC SINH */}
              {addTab === 'student' && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Chọn ảnh chân dung học sinh */}
                  <AvatarPicker
                    value={addForm.avatar}
                    onChange={(url) => setAddForm({ ...addForm, avatar: url })}
                    label="Ảnh chân dung học sinh"
                    category="student"
                  />

                  {/* Row 1: Mã học sinh * & Họ và tên * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Mã học sinh *
                      </label>
                      <input
                        type="text"
                        required
                        value={addForm.studentCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAddForm({ ...addForm, studentCode: val });
                          setManualError(checkDuplicateCode(val));
                        }}
                        className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none ${
                          manualError && manualError.includes('Mã học sinh')
                            ? 'border-rose-500 ring-1 ring-rose-500'
                            : 'border-white/10 focus:border-cyan-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Lương Gia Thịnh"
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Row 2: Giới tính & Ngày sinh */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Giới tính
                      </label>
                      <select
                        value={addForm.gender}
                        onChange={(e) => setAddForm({ ...addForm, gender: e.target.value as 'Nam' | 'Nữ' })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        value={addForm.dob}
                        onChange={(e) => setAddForm({ ...addForm, dob: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Row 3: Lớp học & Phân tổ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Lớp học
                      </label>
                      <select
                        value={addForm.classId}
                        onChange={(e) => {
                          const selId = e.target.value;
                          const foundClass = classesList.find((c) => c.id === selId);
                          setAddForm({
                            ...addForm,
                            classId: selId,
                            className: foundClass?.name || '10A1',
                          });
                        }}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {classesList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        {!classesList.some((c) => c.id === addForm.classId) && (
                          <option value={addForm.classId}>{addForm.className}</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Phân tổ
                      </label>
                      <select
                        value={addForm.group}
                        onChange={(e) => setAddForm({ ...addForm, group: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value={1}>Tổ 1</option>
                        <option value={2}>Tổ 2</option>
                        <option value={3}>Tổ 3</option>
                        <option value={4}>Tổ 4</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Số điện thoại học sinh */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Số điện thoại học sinh (SĐT con em)</span>
                      <span className="text-[11px] text-cyan-400 font-normal">Hiển thị trong danh bạ và liên lạc</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="VD: 0912 345 678"
                        value={addForm.phone}
                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      type="button"
                      onClick={() => setAddTab('parent')}
                    >
                      Tiếp tục: Thông tin phụ huynh →
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 2: THÔNG TIN PHỤ HUYNH */}
              {addTab === 'parent' && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Chọn ảnh chân dung phụ huynh */}
                  <AvatarPicker
                    value={addForm.parentAvatar}
                    onChange={(url) => setAddForm({ ...addForm, parentAvatar: url })}
                    label="Ảnh chân dung phụ huynh"
                    category="parent"
                  />

                  {/* Row 1: Họ tên phụ huynh & SĐT phụ huynh */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Họ tên phụ huynh
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Lương Văn Hóa"
                        value={addForm.parentName}
                        onChange={(e) => setAddForm({ ...addForm, parentName: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        SĐT phụ huynh
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 0906 012 345"
                        value={addForm.parentPhone}
                        onChange={(e) => setAddForm({ ...addForm, parentPhone: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Row 2: Địa chỉ thường trú */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Địa chỉ thường trú
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Lê Duẩn, Đống Đa, Hà Nội"
                      value={addForm.address}
                      onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setAddTab('student')}
                    >
                      ← Quay lại: Thông tin học sinh
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        disabled={!!manualError}
                      >
                        Thêm học sinh vào lớp
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* METHOD 2: THÊM BẰNG EXCEL / CSV VỚI LỌC TRÙNG VÀ BÁO LỖI */}
          {addMode === 'excel' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Tải lên tệp Excel / CSV
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Hệ thống tự động quét và lọc học sinh trùng ra khỏi danh sách nhập
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={FileDown}
                      onClick={handleDownloadTemplate}
                    >
                      Tải file mẫu (.csv)
                    </Button>
                  </div>
                </div>

                {/* Upload File Box */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, .txt, .xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 rounded-xl border-2 border-dashed border-cyan-500/40 bg-cyan-950/15 hover:bg-cyan-900/25 transition-all text-center cursor-pointer group"
                  >
                    <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-sm font-bold text-white">Chọn tệp CSV / Excel từ máy tính</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Hỗ trợ tệp dữ liệu danh sách học sinh (.csv, .xlsx). Hệ thống tự động lọc trùng lặp khi quét.
                    </div>
                  </button>
                </div>
              </div>

              {/* Duplicate Detection & Filter Results */}
              {hasScanned && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Summary Bar */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">Tệp đã quét:</span>
                      <span className="font-mono text-xs text-cyan-300 font-semibold">{importFileName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-300 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Hợp lệ: {validRows.length} HS
                      </span>

                      <span className="flex items-center gap-1.5 font-bold text-rose-300 bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        Đã lọc ra (Trùng / Lỗi): {invalidRows.length} HS
                      </span>
                    </div>
                  </div>

                  {/* 1. SECTION: DANH SÁCH LỖI & TRÙNG LẶP */}
                  {invalidRows.length > 0 && (
                    <div className="rounded-xl bg-rose-950/20 border border-rose-500/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          Học sinh bị trùng lặp hoặc lỗi ({invalidRows.length} em - Đã tự động loại khỏi danh sách nhập)
                        </h5>
                        <Badge variant="rose" size="sm">Đã loại bỏ</Badge>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {invalidRows.map((r, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-900/80 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-200">
                                {idx + 1}. {r.name} · <span className="font-mono text-rose-300 font-semibold">{r.studentCode}</span>
                              </div>
                              <div className="mt-1 space-y-0.5">
                                {r.errors.map((errText, eIdx) => (
                                  <div key={eIdx} className="text-rose-400 text-[11px] font-medium flex items-center gap-1">
                                    <span>•</span>
                                    <span>{errText}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <span className="text-[10px] font-mono text-slate-500 self-start sm:self-center shrink-0">
                              Bị từ chối
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. SECTION: DANH SÁCH HỢP LỆ */}
                  <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Danh sách học sinh hợp lệ sẵn sàng nhập ({validRows.length} em)
                      </h5>
                      <Badge variant="emerald" size="sm">Đạt chuẩn</Badge>
                    </div>

                    {validRows.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {validRows.map((r, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-900/80 border border-emerald-500/20 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-500 w-5 text-center">{idx + 1}</span>
                              <span className="font-bold text-white">{r.name}</span>
                              <span className="font-mono text-cyan-300">({r.studentCode})</span>
                              <span className="text-slate-400">· {r.className} · Tổ {r.group}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              PH: {r.parentName} ({r.parentPhone})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 text-center py-4 italic">
                        Không có học sinh hợp lệ nào để nhập.
                      </div>
                    )}
                  </div>

                  {/* Confirm Action Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-xs text-slate-400">
                      Chỉ các học sinh không bị trùng ({validRows.length} em) sẽ được lưu vào cơ sở dữ liệu.
                    </span>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={Check}
                      disabled={validRows.length === 0}
                      onClick={handleConfirmImportValidOnly}
                    >
                      Xác nhận nhập {validRows.length} học sinh hợp lệ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* 360° Profile Modal */}
      {selectedStudentForProfile && (
        <Modal
          isOpen={!!selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
          title={`Hồ Sơ 360°: ${selectedStudentForProfile.name}`}
          subtitle={`Mã HS: ${selectedStudentForProfile.studentCode} · Lớp ${selectedStudentForProfile.className}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/80 border border-white/10">
              <img
                src={selectedStudentForProfile.avatar || getInitialsAvatar(selectedStudentForProfile.name, 'STUDENT')}
                alt={selectedStudentForProfile.name}
                onError={(e) => {
                  e.currentTarget.src = getInitialsAvatar(selectedStudentForProfile.name, 'STUDENT');
                }}
                className="w-16 h-16 rounded-full border-2 border-cyan-400 bg-slate-800 shrink-0 object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">{selectedStudentForProfile.name}</h4>
                  <Badge variant="cyan" size="sm">Đang học</Badge>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Lớp: <strong className="text-slate-200">{selectedStudentForProfile.className}</strong></span>
                  <span>Giới tính: <strong className="text-slate-200">{selectedStudentForProfile.gender}</strong></span>
                  <span>Ngày sinh: <strong className="text-slate-200">{selectedStudentForProfile.dob}</strong></span>
                  <span>Phân tổ: <strong className="text-slate-200">Tổ {selectedStudentForProfile.group}</strong></span>
                  <span className="inline-flex items-center gap-1">
                    <span>SĐT học sinh:</span>
                    <strong className="text-cyan-300 font-mono inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      {selectedStudentForProfile.phone || '0912345678'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Điểm TB</div>
                <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">{selectedStudentForProfile.gpa}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Chuyên cần</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{selectedStudentForProfile.attendanceRate}%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Khen thưởng</div>
                <div className="text-lg font-bold text-fuchsia-400 font-mono mt-0.5">{selectedStudentForProfile.rewardsCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Cảnh báo</div>
                <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">{selectedStudentForProfile.alertsCount}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Thông tin Gia đình & Liên lạc</span>
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedStudentForProfile;
                    setSelectedStudentForProfile(null);
                    handleStartEdit(target, 'parent');
                  }}
                  className="text-[11px] text-cyan-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  title="Chỉnh sửa thông tin phụ huynh"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Sửa thông tin phụ huynh</span>
                </button>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                <img
                  src={
                    selectedStudentForProfile.parentAvatar ||
                    getInitialsAvatar(selectedStudentForProfile.parentName, 'PARENT')
                  }
                  alt={selectedStudentForProfile.parentName}
                  onError={(e) => {
                    e.currentTarget.src = getInitialsAvatar(selectedStudentForProfile.parentName, 'PARENT');
                  }}
                  className="w-12 h-12 rounded-full object-cover border-2 border-fuchsia-400/60 bg-slate-800 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-400">Phụ huynh học sinh:</div>
                  <div className="font-bold text-white text-sm truncate">{selectedStudentForProfile.parentName}</div>
                  <div className="font-mono text-xs text-cyan-300">{selectedStudentForProfile.parentPhone}</div>
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Địa chỉ thường trú:</span>
                <p className="font-medium text-slate-200 text-xs mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{selectedStudentForProfile.address || 'Chưa cập nhật'}</span>
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Single Student Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingStudentId}
        onClose={() => setDeletingStudentId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa học sinh"
        message="Dữ liệu học sinh sẽ được xóa khỏi lớp và chuyển sang lưu trữ kiểm toán. Các điểm số đã nhập sẽ được lưu trong lịch sử."
      />

      {/* Delete All Students Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAllConfirmOpen}
        onClose={() => setIsDeleteAllConfirmOpen(false)}
        onConfirm={handleDeleteAll}
        title="Xác nhận xóa TẤT CẢ học sinh"
        message={`Bạn có chắc chắn muốn xóa toàn bộ ${students.length} học sinh khỏi lớp không? Toàn bộ danh sách học sinh sẽ được xóa sạch khỏi lớp và ghi nhận vào nhật ký Audit Log. Hành động này không thể hoàn tác.`}
        confirmText="Chắc chắn, xóa tất cả"
        cancelText="Hủy bỏ"
        variant="danger"
      />
    </div>
  );
};
