import React, { useState } from 'react';
import {
  GraduationCap,
  Search,
  Copy,
  ChevronRight,
  ChevronDown,
  Trash2,
  AlertCircle,
  Pencil,
  Maximize2,
  LayoutGrid,
  List,
  Layers,
  Plus,
  PlusCircle,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ClassRoom } from '../../types';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';
import { FirestoreDataService } from '../../services/firestoreData';
import { getVietnameseErrorMessage } from '../../services/firebase';

interface ClassesListProps {
  onSelectClass: (classId: string) => void;
  initialTab?: string;
}

export const ClassesList: React.FC<ClassesListProps> = ({ onSelectClass }) => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Real-time Firestore subscription for teacher's own classes
  React.useEffect(() => {
    if (!user?.id) {
      setClasses(StorageService.getClasses());
      return;
    }

    // Subscribe to Firestore classes owned by this teacher
    const unsubscribe = FirestoreDataService.subscribeClasses(
      user.id,
      (liveClasses) => {
        if (liveClasses.length > 0) {
          setClasses(liveClasses);
        } else {
          // If no classes on Firestore yet, fallback to initial local classes while offering Firestore sync
          const local = StorageService.getClasses();
          setClasses(local);
        }
      },
      (err) => {
        console.warn('Firestore subscription error:', err);
        setClasses(StorageService.getClasses());
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // 2 Tabs theo khung màu xanh: 1 là 'list' (Lớp học), 2 là 'create' (Thêm mới lớp)
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // View Mode: 'grid' (thẻ) vs 'table' (bảng)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Form state for Thêm Mới Lớp (Hình 5 thêm phần Giáo viên chủ nhiệm)
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState(10);
  const [newYear, setNewYear] = useState('2025-2026');
  const [newSubject, setNewSubject] = useState('Toán học');
  const [newRoom, setNewRoom] = useState('Phòng STEM-302');
  const [newHomeroomTeacher, setNewHomeroomTeacher] = useState(user?.name || 'Cô Nguyễn Mai Anh');
  const [newDescription, setNewDescription] = useState('');

  // Edit Class Modal state
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassRoom, setEditClassRoom] = useState('');
  const [editClassHomeroomTeacher, setEditClassHomeroomTeacher] = useState('');
  const [editClassGrade, setEditClassGrade] = useState(10);
  const [editClassSubject, setEditClassSubject] = useState('Toán học');
  const [editClassYear, setEditClassYear] = useState('2025-2026');
  const [editClassError, setEditClassError] = useState<string | null>(null);

  const filteredClasses = classes.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || c.grade.toString() === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const checkNewClassDuplicate = (nameToCheck: string, yearToCheck: string) => {
    const clean = nameToCheck.trim().toLowerCase();
    if (!clean) return null;
    const existing = classes.find(
      (c) => c.name.trim().toLowerCase() === clean && c.academicYear === yearToCheck
    );
    if (existing) {
      return `Lớp "${nameToCheck.trim()}" đã tồn tại trong năm học ${yearToCheck} (Phòng: ${existing.room} - Mã: ${existing.code})! Vui lòng đặt tên khác.`;
    }
    return null;
  };

  const newClassDuplicateError = checkNewClassDuplicate(newName, newYear);

  const generatedCode = newName.trim()
    ? `CLS${newName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-2026`
    : 'CLS-NEW-2026';

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      error('Vui lòng đăng nhập để tạo lớp học trên hệ thống');
      return;
    }
    if (!newName.trim()) {
      error('Vui lòng nhập tên lớp học');
      return;
    }
    if (newClassDuplicateError) {
      error(newClassDuplicateError);
      return;
    }
    let finalCode = generatedCode;
    let suffix = 1;
    while (classes.some((c) => c.code.toUpperCase() === finalCode.toUpperCase())) {
      suffix++;
      finalCode = `${generatedCode}-${suffix}`;
    }

    const newClassData: Partial<ClassRoom> & { name: string } = {
      id: `cls_${Date.now()}`,
      name: newName.trim(),
      grade: Number(newGrade),
      academicYear: newYear,
      homeroomTeacherId: user.id,
      homeroomTeacherName: newHomeroomTeacher.trim() || user.name || 'Cô Nguyễn Mai Anh',
      subject: newSubject,
      room: newRoom,
      studentCount: 0,
      attendanceRate: 100,
      pendingAssignments: 0,
      alertCount: 0,
      status: 'active',
      code: finalCode,
      description: newDescription,
    };

    setIsSaving(true);
    try {
      // 1. Save directly to Cloud Firestore and await confirmation
      const savedDoc = await FirestoreDataService.createClass(newClassData, user.id);
      
      // Also update local storage for immediate state
      StorageService.saveClass(savedDoc, user);
      
      // Update local view
      setClasses((prev) => [savedDoc, ...prev.filter((c) => c.id !== savedDoc.id)]);
      setActiveTab('list');
      setNewName('');
      setNewDescription('');
      setNewHomeroomTeacher(user.name || 'Cô Nguyễn Mai Anh');

      // Requirement 7: Chỉ thông báo thành công sau khi Firestore xác nhận lưu
      success(`Đã tạo thành công lớp học "${savedDoc.name}" trên Cloud Firestore!`);
    } catch (err: any) {
      console.error('Lỗi tạo lớp học:', err);
      // Requirement 7: Nếu thất bại, hiển thị lỗi rõ ràng bằng tiếng Việt
      error(getVietnameseErrorMessage(err, 'Tạo lớp học trên Firestore'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditClass = (c: ClassRoom) => {
    setEditingClass(c);
    setEditClassName(c.name);
    setEditClassRoom(c.room);
    setEditClassHomeroomTeacher(c.homeroomTeacherName || '');
    setEditClassGrade(c.grade);
    setEditClassSubject(c.subject);
    setEditClassYear(c.academicYear);
    setEditClassError(null);
  };

  const handleSaveEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !user) return;
    if (!editClassName.trim()) {
      setEditClassError('Vui lòng nhập tên lớp học');
      return;
    }
    const isDup = classes.some(
      (c) =>
        c.id !== editingClass.id &&
        c.name.trim().toLowerCase() === editClassName.trim().toLowerCase() &&
        c.academicYear === editClassYear
    );
    if (isDup) {
      setEditClassError(`Lớp "${editClassName}" đã tồn tại trong năm học ${editClassYear}!`);
      return;
    }
    const updated: ClassRoom = {
      ...editingClass,
      name: editClassName.trim(),
      room: editClassRoom.trim(),
      homeroomTeacherName: editClassHomeroomTeacher.trim() || editingClass.homeroomTeacherName,
      grade: editClassGrade,
      subject: editClassSubject,
      academicYear: editClassYear,
    };

    setIsSaving(true);
    try {
      // 1. Update in Cloud Firestore and await confirmation
      await FirestoreDataService.updateClass(editingClass.id, updated, user.id);
      
      // Also update local storage
      StorageService.saveClass(updated, user);
      setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingClass(null);

      // Requirement 7: Chỉ thông báo thành công sau khi Firestore xác nhận lưu
      success(`Đã cập nhật thông tin lớp "${updated.name}" thành công trên Cloud Firestore!`);
    } catch (err: any) {
      console.error('Lỗi cập nhật lớp học:', err);
      error(getVietnameseErrorMessage(err, 'Cập nhật lớp học trên Firestore'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClassId || !user) return;
    setIsSaving(true);
    try {
      // 1. Delete from Cloud Firestore and await confirmation
      await FirestoreDataService.deleteClass(deletingClassId, user.id);
      
      // Also delete from local storage
      StorageService.deleteClass(deletingClassId, user);
      setClasses((prev) => prev.filter((c) => c.id !== deletingClassId));
      setDeletingClassId(null);

      // Requirement 7: Chỉ thông báo thành công sau khi Firestore xác nhận lưu
      success('Đã xóa lớp học thành công khỏi Cloud Firestore!');
    } catch (err: any) {
      console.error('Lỗi xóa lớp học:', err);
      error(getVietnameseErrorMessage(err, 'Xóa lớp học trên Firestore'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedInitialClass = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      await FirestoreDataService.seedInitialClassForTeacher(user.id, user.name);
      const live = await FirestoreDataService.getClasses(user.id);
      setClasses(live);
      success('Đã khởi tạo thành công lớp mẫu (10A1) và danh sách học sinh lên Cloud Firestore!');
    } catch (err) {
      error(getVietnameseErrorMessage(err, 'Khởi tạo lớp mẫu'));
    } finally {
      setIsSeeding(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    success(`Đã sao chép mã lớp: ${code}`);
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER & BREADCRUMB (THEO CHUẨN 🏠 > Lớp học > Lớp học của tôi • Quản lý Lớp học) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <ModuleBreadcrumb
          section="Lớp học"
          moduleName={activeTab === 'create' ? 'Thêm mới lớp' : 'Lớp học của tôi'}
          title="Quản Lý Lớp Học"
          extra={
            <span className="text-xs font-semibold text-slate-300 bg-slate-900 border border-white/10 px-2 py-0.5 rounded-lg ml-1">
              {classes.length} lớp
            </span>
          }
        />

        {/* 2 Tab chuyển đổi: Lớp học của tôi vs Thêm mới lớp */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-white/10 shadow-lg shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
              activeTab === 'list'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Lớp học của tôi ({classes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mới lớp</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DANH SÁCH LỚP HỌC */}
      {activeTab === 'list' && (
        <div className="space-y-3.5">
          {/* Toolbar: Search input, Module chọn khối & View mode toggle */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên lớp, mã lớp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0b1026] border border-white/10 text-xs text-white placeholder-slate-500 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Right Controls: Modular Grade Selector + View Mode Switcher */}
            <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end overflow-visible">
              {/* Module Chọn Khối (Gọn gàng tối ưu khoảng trống) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/15 hover:border-cyan-500/40 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm select-none"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {selectedGrade === 'all'
                      ? `Module: Tất cả khối (${classes.length})`
                      : `Module: Khối ${selectedGrade} (${classes.filter((c) => c.grade.toString() === selectedGrade).length})`}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isGradeDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isGradeDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Chọn Module Khối
                    </div>
                    {[
                      { id: 'all', label: 'Tất cả các khối', count: classes.length },
                      { id: '10', label: 'Khối 10', count: classes.filter((c) => c.grade === 10).length },
                      { id: '11', label: 'Khối 11', count: classes.filter((c) => c.grade === 11).length },
                      { id: '12', label: 'Khối 12', count: classes.filter((c) => c.grade === 12).length },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSelectedGrade(g.id);
                          setIsGradeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors text-left cursor-pointer ${
                          selectedGrade === g.id
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              selectedGrade === g.id ? 'bg-cyan-400' : 'bg-transparent'
                            }`}
                          />
                          {g.label}
                        </span>
                        <span className="font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full text-slate-300">
                          {g.count} lớp
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Mode Toggle: Dạng Thẻ vs Dạng Bảng */}
              <div className="inline-flex items-center p-0.5 bg-slate-900/90 rounded-xl border border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer relative group ${
                    viewMode === 'grid'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Xem dạng thẻ"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer relative group ${
                    viewMode === 'table'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Xem dạng bảng"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* VIEW 1: DẠNG THẺ (Để chung hết liên tục khi chọn tất cả khối, không chia ngắt dòng) */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3.5 animate-in fade-in duration-150">
              {filteredClasses.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-xl bg-[#0b1026]/90 backdrop-blur-md border border-white/10 hover:border-cyan-500/40 p-3 sm:p-3.5 transition-all duration-200 hover:shadow-lg flex flex-col justify-between gap-2.5"
                >
                  {/* Row 1: Status Dot + Class Name + Code Badge + Edit & Delete Icons */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          item.status === 'active' ? 'bg-rose-500' : 'bg-slate-500'
                        }`}
                        title={item.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                      />
                      <h3
                        onClick={() => onSelectClass(item.id)}
                        className="font-bold text-white text-sm tracking-tight truncate hover:text-cyan-300 transition-colors cursor-pointer"
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                      <button
                        onClick={() => copyCode(item.code)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 px-2 py-0.5 rounded-md border border-cyan-500/30 shrink-0 cursor-pointer transition-colors"
                        title="Bấm để sao chép mã tham gia"
                      >
                        <Copy className="w-3 h-3 text-cyan-400" />
                        <span className="truncate max-w-[130px]">{item.code}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStartEditClass(item)}
                        className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-md transition-colors cursor-pointer"
                        title="Chỉnh sửa lớp học"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingClassId(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                        title="Xóa lớp học"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Compact Meta Info - Đặt cùng trên 1 dòng duy nhất, tối ưu khoảng cách hiển thị trọn vẹn tên GV */}
                  <div className="flex items-center gap-x-1.5 text-xs text-slate-300 whitespace-nowrap overflow-x-auto scrollbar-none py-0.5">
                    <span className="font-semibold text-slate-200 shrink-0">
                      {item.room.toLowerCase().startsWith('phòng')
                        ? item.room
                        : `Phòng ${item.room}`}
                    </span>
                    <span className="text-slate-600 shrink-0">·</span>
                    <span className="shrink-0 text-slate-300">
                      Sĩ số: <strong className="text-slate-100 font-mono">{item.studentCount} HS</strong>
                    </span>
                    <span className="text-slate-600 shrink-0">·</span>
                    <div
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/30 text-cyan-200 shrink-0"
                      title={`Giáo viên chủ nhiệm: ${item.homeroomTeacherName || 'Chưa phân công'}`}
                    >
                      <span className="text-[11px] text-cyan-400 font-bold">GVCN:</span>
                      <strong className="text-white font-bold">{item.homeroomTeacherName || 'Chưa phân công'}</strong>
                    </div>
                  </div>

                  {/* Row 3: Action Links */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onSelectClass(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer group"
                    >
                      <span>Vào không gian làm việc chính</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      onClick={() => onSelectClass(item.id)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3 text-cyan-400" />
                      <span>Mở to cửa sổ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW 2: DẠNG BẢNG (Compact Table Layout) */}
          {viewMode === 'table' && (
            <div className="rounded-xl bg-[#0b1026]/90 backdrop-blur-md border border-white/10 overflow-hidden shadow-xl animate-in fade-in duration-150">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 border-b border-white/10 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3">Tên lớp học</th>
                      <th className="py-2.5 px-3">Mã tham gia</th>
                      <th className="py-2.5 px-3">Khối / Năm học</th>
                      <th className="py-2.5 px-3">Phòng học</th>
                      <th className="py-2.5 px-3">Sĩ số</th>
                      <th className="py-2.5 px-3 min-w-[190px]">Giáo viên chủ nhiệm</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredClasses.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                item.status === 'active' ? 'bg-rose-500' : 'bg-slate-500'
                              }`}
                            />
                            <span className="text-[11px] text-slate-300 font-medium">
                              {item.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => onSelectClass(item.id)}
                            className="font-bold text-white hover:text-cyan-300 transition-colors text-left"
                          >
                            {item.name}
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => copyCode(item.code)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-500/30 transition-colors cursor-pointer"
                            title="Sao chép mã tham gia"
                          >
                            <Copy className="w-3 h-3 text-cyan-400" />
                            <span>{item.code}</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          Khối {item.grade} · <span className="font-mono text-slate-400">{item.academicYear}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{item.room}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-white tabular-nums">
                          {item.studentCount} HS
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white min-w-[190px]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            <span className="whitespace-normal">{item.homeroomTeacherName || 'Chưa phân công'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onSelectClass(item.id)}
                              className="py-1 px-2.5 text-xs"
                            >
                              Vào lớp
                            </Button>
                            <button
                              onClick={() => handleStartEditClass(item)}
                              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa lớp học"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingClassId(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Xóa lớp học"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {classes.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-cyan-500/30 bg-[#0b1026]/70 backdrop-blur-md space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">Chưa có lớp học nào trên Cloud Firestore</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Dữ liệu được lưu trữ trực tiếp trên Firestore collection <code className="text-cyan-300">/classes/{'{classId}'}</code> và được bảo vệ theo UID giáo viên sở hữu.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSeeding}
                  onClick={handleSeedInitialClass}
                  className="font-bold shadow-lg shadow-cyan-500/20"
                >
                  {isSeeding ? 'Đang lưu vào Cloud Firestore...' : '⚡ Khởi tạo lớp mẫu (10A1) lên Firestore'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('create')}
                >
                  ➕ Tạo lớp mới thủ công
                </Button>
              </div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs rounded-xl border border-white/10 bg-[#0b1026]/40">
              Không tìm thấy lớp học nào phù hợp với bộ lọc tìm kiếm.
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: THÊM MỚI LỚP (Khung màu xanh chuyển sang tab này) */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto rounded-2xl bg-[#0b1026]/90 backdrop-blur-xl border border-cyan-500/30 p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in-50 duration-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Khởi tạo lớp học thế hệ số</span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Thêm Mới Lớp Học
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Điền thông tin lớp học và sinh mã tham gia số tự động.
            </p>
          </div>

          <form onSubmit={handleCreateClass} className="space-y-4">
            {newClassDuplicateError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Cảnh báo trùng lặp:</span> {newClassDuplicateError}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Tên lớp học *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Lớp 10A3 (Chuyên Lý & Robot)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={`w-full bg-slate-900/90 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-medium ${
                  newClassDuplicateError
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-white/15 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Khối lớp
                </label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(Number(e.target.value))}
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value={10}>Khối 10 (Chương trình mới)</option>
                  <option value={11}>Khối 11 (Chương trình mới)</option>
                  <option value={12}>Khối 12 (Ôn thi tốt nghiệp & ĐHQG)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Năm học
                </label>
                <select
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="2025-2026">2025 - 2026</option>
                  <option value="2026-2027">2026 - 2027</option>
                </select>
              </div>
            </div>

            {/* Hình 5: Thêm phần Giáo viên chủ nhiệm */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Giáo viên chủ nhiệm (GVCN) *</span>
                <span className="text-[11px] text-cyan-400 font-normal">Quản lý & điều hành lớp học</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Cô Nguyễn Mai Anh"
                value={newHomeroomTeacher}
                onChange={(e) => setNewHomeroomTeacher(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Môn học phụ trách
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Phòng học quy chuẩn
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phòng STEM-302"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Generated Code Preview */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Mã tham gia lớp tự động:</span>
                  <div className="font-mono text-sm font-extrabold text-cyan-300 tracking-wider">
                    {generatedCode}
                  </div>
                </div>
              </div>
              <Badge variant="cyan" size="sm">Tự động kích hoạt</Badge>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setActiveTab('list')}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                icon={PlusCircle}
                disabled={!!newClassDuplicateError}
              >
                Xác nhận tạo lớp học
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA LỚP HỌC */}
      {editingClass && (
        <Modal
          isOpen={!!editingClass}
          onClose={() => setEditingClass(null)}
          title="Chỉnh Sửa Lớp Học"
          subtitle="Cập nhật tên lớp, phòng học và thông tin giảng dạy"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveEditClass} className="space-y-4">
            {editClassError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-2 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{editClassError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tên lớp học *
              </label>
              <input
                type="text"
                required
                value={editClassName}
                onChange={(e) => setEditClassName(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Giáo viên chủ nhiệm (GVCN) *
              </label>
              <input
                type="text"
                required
                value={editClassHomeroomTeacher}
                onChange={(e) => setEditClassHomeroomTeacher(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phòng học
                </label>
                <input
                  type="text"
                  required
                  value={editClassRoom}
                  onChange={(e) => setEditClassRoom(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Năm học
                </label>
                <select
                  value={editClassYear}
                  onChange={(e) => setEditClassYear(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="2025-2026">2025 - 2026</option>
                  <option value="2026-2027">2026 - 2027</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Khối
                </label>
                <select
                  value={editClassGrade}
                  onChange={(e) => setEditClassGrade(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={10}>Khối 10</option>
                  <option value={11}>Khối 11</option>
                  <option value={12}>Khối 12</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Môn học
                </label>
                <input
                  type="text"
                  value={editClassSubject}
                  onChange={(e) => setEditClassSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="ghost" size="sm" type="button" onClick={() => setEditingClass(null)}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Lưu Thay Đổi
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingClassId}
        onClose={() => setDeletingClassId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa lớp học"
        message="Hành động này sẽ xóa dữ liệu lớp học khỏi danh mục giảng dạy. Lịch sử điểm và danh sách học sinh sẽ được lưu vào nhật ký Audit Log."
      />
    </div>
  );
};
