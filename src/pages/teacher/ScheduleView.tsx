import React, { useState, useEffect, useRef } from 'react';
import {
  Pencil,
  Trash2,
  Undo2,
  Redo2,
  FileSpreadsheet,
  Download,
  Save,
  Check,
  X,
  Plus,
  Users,
  User,
  MapPin,
  CalendarDays,
  AlertTriangle,
  ChevronRight,
  Printer,
  ChevronDown,
  Info,
  Home
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

// Types for the Grid-based Timetable
export interface TimetableColumn {
  id: string; // col_0, col_1...
  dayIndex: number; // 2..8 (Thứ 2 -> Chủ Nhật)
  label: string; // 'Thứ 2', 'Thứ 3'...
}

export interface TimetablePeriod {
  id: string; // row_0, row_1...
  periodNumber: number; // 1, 2, 3...
  time: string; // e.g. "07:00 - 07:45"
}

export type TimetableType = 'class' | 'teacher';

export interface TimetableData {
  columns: TimetableColumn[];
  periods: TimetablePeriod[];
  cells: Record<string, string>; // key: `${rowId}_${colId}`, value: string
}

interface ScheduleViewProps {
  onGoToAttendance?: () => void;
}

// Preset Vietnamese day labels
const DAY_LABELS: Record<number, string> = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ Nhật',
};

// Default standard periods: Bắt đầu lúc 7:00, mỗi tiết đúng 45 phút, cộng dồn liên tục
const DEFAULT_PERIODS: TimetablePeriod[] = [
  { id: 'row_1', periodNumber: 1, time: '07:00 - 07:45' },
  { id: 'row_2', periodNumber: 2, time: '07:45 - 08:30' },
  { id: 'row_3', periodNumber: 3, time: '08:30 - 09:15' },
  { id: 'row_4', periodNumber: 4, time: '09:15 - 10:00' },
  { id: 'row_5', periodNumber: 5, time: '10:00 - 10:45' },
];

// Default initial columns: Thứ 2 -> Thứ 6
const DEFAULT_COLUMNS: TimetableColumn[] = [
  { id: 'col_2', dayIndex: 2, label: 'Thứ 2' },
  { id: 'col_3', dayIndex: 3, label: 'Thứ 3' },
  { id: 'col_4', dayIndex: 4, label: 'Thứ 4' },
  { id: 'col_5', dayIndex: 5, label: 'Thứ 5' },
  { id: 'col_6', dayIndex: 6, label: 'Thứ 6' },
];

// Initial mock data as shown in image.png for Class 7A3
const INITIAL_CELLS_7A3: Record<string, string> = {
  'row_1_col_2': 'toán\nA301\nĐông\n(Dạy bù)',
  'row_2_col_2': 'lý',
  'row_3_col_2': 'hóa',
  'row_4_col_2': 'văn',
  // row_5_col_2 is empty (-trống-)
};

const STORAGE_KEY_PREFIX = 'SMARTCLASS_TIMETABLE_V2_';

export const ScheduleView: React.FC<ScheduleViewProps> = () => {
  const { success, error: toastError, info } = useToast();

  // Active Schedule Type & Target selector: Hỗ trợ 2 loại lịch (Lớp học, Giáo viên)
  const [scheduleType, setScheduleType] = useState<TimetableType>('class');
  const [selectedTarget, setSelectedTarget] = useState<string>('Lớp 7A3');

  // Available targets for 2 types
  const CLASS_OPTIONS = ['Lớp 7A3', 'Lớp 6A1', 'Lớp 10A1', 'Lớp 10A2', 'Lớp 11B1', 'Lớp 12A3'];
  const TEACHER_OPTIONS = ['Thầy Trần Quang Huy', 'Cô Nguyễn Mai Anh', 'Thầy Nguyễn Văn Đông', 'Cô Lê Thị Lan'];

  // Timetable State
  const [data, setData] = useState<TimetableData>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}class_Lớp 7A3`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      columns: DEFAULT_COLUMNS,
      periods: DEFAULT_PERIODS,
      cells: INITIAL_CELLS_7A3,
    };
  });

  // Saved snapshot for change detection and discard
  const [savedSnapshot, setSavedSnapshot] = useState<TimetableData>(data);

  // 6 Main Action States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Undo / Redo History Stacks
  const [undoStack, setUndoStack] = useState<TimetableData[]>([]);
  const [redoStack, setRedoStack] = useState<TimetableData[]>([]);

  // Popups & Modals
  const [showMaxColumnsPopup, setShowMaxColumnsPopup] = useState<boolean>(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');

  // Active cell editing (inline like MS Word)
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);
  const [cellDraftText, setCellDraftText] = useState<string>('');

  // Editing time in Column 1 (Tiết / Giờ)
  const [editingPeriodTimeId, setEditingPeriodTimeId] = useState<string | null>(null);
  const [periodDraftTime, setPeriodDraftTime] = useState<string>('');

  const tableRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to re-index column labels (Thứ 2, Thứ 3...) based on their order
  const reindexColumns = (cols: TimetableColumn[]): TimetableColumn[] => {
    return cols.map((c, idx) => {
      const dayNum = 2 + idx; // 0 -> Thứ 2, 1 -> Thứ 3, etc.
      return {
        ...c,
        dayIndex: dayNum,
        label: DAY_LABELS[dayNum] || `Thứ ${dayNum}`,
      };
    });
  };

  // Helper to re-index periods (Tiết 1, Tiết 2...) based on their order
  const reindexPeriods = (rows: TimetablePeriod[]): TimetablePeriod[] => {
    return rows.map((r, idx) => {
      const pNum = idx + 1;
      return {
        ...r,
        periodNumber: pNum,
      };
    });
  };

  // Save changes to storage
  const handleSave = () => {
    // Commit current cell edit if any
    let currentData = { ...data };
    if (activeCellKey) {
      currentData = {
        ...currentData,
        cells: {
          ...currentData.cells,
          [activeCellKey]: cellDraftText.trim(),
        },
      };
      setActiveCellKey(null);
    }
    if (editingPeriodTimeId) {
      currentData = {
        ...currentData,
        periods: currentData.periods.map((p) =>
          p.id === editingPeriodTimeId ? { ...p, time: periodDraftTime.trim() } : p
        ),
      };
      setEditingPeriodTimeId(null);
    }

    setData(currentData);
    setSavedSnapshot(currentData);
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${scheduleType}_${selectedTarget}`,
      JSON.stringify(currentData)
    );

    // Disable edit mode & clear undo/redo
    setIsEditing(false);
    setIsDeleting(false);
    setUndoStack([]);
    setRedoStack([]);
    success('Đã lưu thành công thời khóa biểu!');
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = (): boolean => {
    return JSON.stringify(data) !== JSON.stringify(savedSnapshot) || activeCellKey !== null;
  };

  // Toggle Edit Mode with unsaved warning
  const handleToggleEdit = () => {
    if (isEditing) {
      // User is turning edit mode OFF
      if (hasUnsavedChanges()) {
        setShowUnsavedWarning(true);
        return;
      }
      setIsEditing(false);
      setIsDeleting(false);
      setActiveCellKey(null);
      setEditingPeriodTimeId(null);
    } else {
      // Turn edit mode ON
      setIsEditing(true);
      setIsDeleting(false);
    }
  };

  // Push to Undo stack before performing a mutation
  const pushHistory = (newData: TimetableData) => {
    setUndoStack((prev) => [...prev, data]);
    setRedoStack([]); // reset redo on new action
    setData(newData);
  };

  // Undo (Ctrl+Z)
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, data]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setData(previous);
    setActiveCellKey(null);
    info('Đã hoàn tác (Undo)');
  };

  // Redo (Ctrl+Y)
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, data]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setData(next);
    setActiveCellKey(null);
    info('Đã làm lại (Redo)');
  };

  // Keyboard shortcut listener for Ctrl+Z, Ctrl+Y, Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if inside modals
      if (showMaxColumnsPopup || showUnsavedWarning || showImportModal || showExportModal) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (isEditing) {
          e.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, undoStack, redoStack, isEditing, showMaxColumnsPopup, showUnsavedWarning]);

  // Load data when changing Schedule Type or Target
  const handleTargetChange = (newTarget: string) => {
    if (isEditing && hasUnsavedChanges()) {
      setShowUnsavedWarning(true);
      return;
    }
    setSelectedTarget(newTarget);
    const key = `${STORAGE_KEY_PREFIX}${scheduleType}_${newTarget}`;
    const saved = localStorage.getItem(key);
    let loaded: TimetableData;
    if (saved) {
      try {
        loaded = JSON.parse(saved);
      } catch {
        loaded = { columns: DEFAULT_COLUMNS, periods: DEFAULT_PERIODS, cells: {} };
      }
    } else {
      loaded = {
        columns: DEFAULT_COLUMNS,
        periods: DEFAULT_PERIODS,
        cells: newTarget === 'Lớp 7A3' ? INITIAL_CELLS_7A3 : {},
      };
    }
    setData(loaded);
    setSavedSnapshot(loaded);
    setIsEditing(false);
    setIsDeleting(false);
    setUndoStack([]);
    setRedoStack([]);
    setActiveCellKey(null);
  };

  // Add Column at a specific divider index
  const handleAddColumn = (insertIndex: number) => {
    if (!isEditing) {
      setIsEditing(true);
    }
    if (data.columns.length >= 7) {
      // Max 7 days: Thứ 2 -> Chủ Nhật
      setShowMaxColumnsPopup(true);
      return;
    }

    const newColId = `col_${Date.now()}`;
    const newCol: TimetableColumn = {
      id: newColId,
      dayIndex: 2 + data.columns.length,
      label: 'Cột mới',
    };

    const newColumns = [...data.columns];
    newColumns.splice(insertIndex, 0, newCol);
    const reindexed = reindexColumns(newColumns);

    const newData: TimetableData = {
      ...data,
      columns: reindexed,
    };
    pushHistory(newData);
    success(`Đã thêm ${reindexed[insertIndex]?.label || 'cột ngày mới'} vào thời khóa biểu!`);
  };

  // Add Row at a specific divider index
  const handleAddRow = (insertIndex: number) => {
    if (!isEditing) return;
    const newRowId = `row_${Date.now()}`;
    const nextPeriodNum = data.periods.length + 1;

    // Calculate 45 min slot starting from 07:00
    const startTotalMin = 7 * 60 + insertIndex * 45;
    const endTotalMin = startTotalMin + 45;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const newTime = `${pad(Math.floor(startTotalMin / 60))}:${pad(startTotalMin % 60)} - ${pad(
      Math.floor(endTotalMin / 60)
    )}:${pad(endTotalMin % 60)}`;

    const newPeriod: TimetablePeriod = {
      id: newRowId,
      periodNumber: nextPeriodNum,
      time: newTime,
    };

    const newPeriods = [...data.periods];
    newPeriods.splice(insertIndex, 0, newPeriod);
    const reindexed = reindexPeriods(newPeriods);

    const newData: TimetableData = {
      ...data,
      periods: reindexed,
    };
    pushHistory(newData);
    success(`Đã thêm Tiết ${insertIndex + 1}`);
  };

  // Delete Column (with automatic re-indexing while keeping inner text)
  const handleDeleteColumn = (colId: string) => {
    if (data.columns.length <= 1) {
      toastError('Không thể xóa hết tất cả các cột!');
      return;
    }

    const colToDelete = data.columns.find((c) => c.id === colId);
    const remainingCols = data.columns.filter((c) => c.id !== colId);
    // Reindex columns so Thứ 3 becomes Thứ 2, Thứ 4 becomes Thứ 3, etc.
    const reindexed = reindexColumns(remainingCols);

    // Filter cells (remove cells belonging to this deleted col)
    const newCells: Record<string, string> = {};
    Object.entries(data.cells).forEach(([key, val]) => {
      if (!key.endsWith(`_${colId}`)) {
        newCells[key] = val;
      }
    });

    const newData: TimetableData = {
      ...data,
      columns: reindexed,
      cells: newCells,
    };
    pushHistory(newData);
    success(`Đã xóa cột ${colToDelete?.label || ''} và tự động cập nhật lại thứ tự ngày!`);
  };

  // Delete Row (with automatic re-indexing of Tiết 1, 2, 3...)
  const handleDeleteRow = (rowId: string) => {
    if (data.periods.length <= 1) {
      toastError('Không thể xóa hết tất cả các hàng!');
      return;
    }

    const rowToDelete = data.periods.find((r) => r.id === rowId);
    const remainingRows = data.periods.filter((r) => r.id !== rowId);
    const reindexed = reindexPeriods(remainingRows);

    // Filter cells (remove cells belonging to this deleted row)
    const newCells: Record<string, string> = {};
    Object.entries(data.cells).forEach(([key, val]) => {
      if (!key.startsWith(`${rowId}_`)) {
        newCells[key] = val;
      }
    });

    const newData: TimetableData = {
      ...data,
      periods: reindexed,
      cells: newCells,
    };
    pushHistory(newData);
    success(`Đã xóa Tiết ${rowToDelete?.periodNumber || ''} và tự động đánh lại số tiết!`);
  };

  // Cell Click: Handle Delete Mode or Edit Mode
  const handleCellClick = (rowId: string, colId: string) => {
    const key = `${rowId}_${colId}`;

    // 1. If Delete Mode is Active: Instantly clear cell without confirmation
    if (isDeleting) {
      if (data.cells[key]) {
        const newCells = { ...data.cells };
        delete newCells[key];
        const newData = { ...data, cells: newCells };
        pushHistory(newData);
        info('Đã xóa nội dung ô!');
      }
      return;
    }

    // 2. If Edit Mode is Active: Start direct inline editing like MS Word
    if (isEditing) {
      // If clicking another cell, commit current draft first
      if (activeCellKey && activeCellKey !== key) {
        commitCurrentCellDraft();
      }
      setActiveCellKey(key);
      setCellDraftText(data.cells[key] || '');
    }
  };

  // Commit current cell draft
  const commitCurrentCellDraft = () => {
    if (!activeCellKey) return;
    const trimmed = cellDraftText.trim();
    if ((data.cells[activeCellKey] || '') !== trimmed) {
      const newCells = { ...data.cells };
      if (trimmed) {
        newCells[activeCellKey] = trimmed;
      } else {
        delete newCells[activeCellKey];
      }
      const newData = { ...data, cells: newCells };
      pushHistory(newData);
    }
    setActiveCellKey(null);
  };

  // Click outside table area to commit cell draft (MS Word-like behavior)
  const handleTableContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // If not clicking directly on textarea or cell
    if (!target.closest('.timetable-cell-editor') && !target.closest('.timetable-cell')) {
      if (activeCellKey) {
        commitCurrentCellDraft();
      }
      if (editingPeriodTimeId) {
        commitPeriodTimeDraft();
      }
    }
  };

  // Period Time Edit Commit
  const commitPeriodTimeDraft = () => {
    if (!editingPeriodTimeId) return;
    const trimmed = periodDraftTime.trim();
    const period = data.periods.find((p) => p.id === editingPeriodTimeId);
    if (period && period.time !== trimmed) {
      const newPeriods = data.periods.map((p) =>
        p.id === editingPeriodTimeId ? { ...p, time: trimmed } : p
      );
      const newData = { ...data, periods: newPeriods };
      pushHistory(newData);
    }
    setEditingPeriodTimeId(null);
  };

  // Auto-resize textarea when text changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(64, textareaRef.current.scrollHeight)}px`;
    }
  }, [cellDraftText, activeCellKey]);

  // Handle Export to CSV
  const handleExportCSV = () => {
    const headers = ['Tiết', 'Thời gian', ...data.columns.map((c) => c.label)];
    const rows = data.periods.map((p) => {
      const rowData = [
        `Tiết ${p.periodNumber}`,
        `"${p.time}"`,
        ...data.columns.map((c) => {
          const content = data.cells[`${p.id}_${c.id}`] || '';
          return `"${content.replace(/"/g, '""').replace(/\n/g, ' - ')}"`;
        }),
      ];
      return rowData.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Thoi_Khoa_Bieu_${selectedTarget.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Đã xuất file CSV thành công!');
    setShowExportModal(false);
  };

  // Handle Import Text / Table
  const handleImportData = () => {
    if (!importText.trim()) {
      toastError('Vui lòng dán dữ liệu hoặc nội dung bảng!');
      return;
    }

    try {
      const lines = importText.trim().split('\n');
      if (lines.length < 2) {
        toastError('Dữ liệu bảng cần có ít nhất 2 dòng (tiêu đề và nội dung)!');
        return;
      }

      // Detect separator: tab or comma
      const sep = lines[0].includes('\t') ? '\t' : ',';
      const headerCols = lines[0].split(sep).map((s) => s.trim().replace(/^"|"$/g, ''));

      // If headers match days or generic columns
      const dayHeaders = headerCols.slice(headerCols[0].toLowerCase().includes('tiết') ? 1 : 0);
      const colsCount = Math.min(7, Math.max(1, dayHeaders.length));

      const newColumns: TimetableColumn[] = [];
      for (let i = 0; i < colsCount; i++) {
        const dayNum = 2 + i;
        newColumns.push({
          id: `col_${dayNum}`,
          dayIndex: dayNum,
          label: DAY_LABELS[dayNum] || `Thứ ${dayNum}`,
        });
      }

      const newPeriods: TimetablePeriod[] = [];
      const newCells: Record<string, string> = {};

      const rowLines = lines.slice(1);
      rowLines.forEach((line, rIdx) => {
        if (!line.trim()) return;
        const rowId = `row_${rIdx + 1}`;
        const parts = line.split(sep).map((s) => s.trim().replace(/^"|"$/g, ''));
        const timePart = parts[1] || `${7 + rIdx}:00 - ${7 + rIdx}:45`;

        newPeriods.push({
          id: rowId,
          periodNumber: rIdx + 1,
          time: timePart,
        });

        // Cell contents
        const contentStartIndex = 2 < parts.length ? 2 : 1;
        newColumns.forEach((col, cIdx) => {
          const val = parts[contentStartIndex + cIdx];
          if (val && val !== '-trống-') {
            newCells[`${rowId}_${col.id}`] = val.replace(/ - /g, '\n');
          }
        });
      });

      const importedData: TimetableData = {
        columns: newColumns,
        periods: newPeriods.length > 0 ? newPeriods : DEFAULT_PERIODS,
        cells: newCells,
      };

      pushHistory(importedData);
      success('Đã import thành công thời khóa biểu!');
      setShowImportModal(false);
      setImportText('');
    } catch (e) {
      toastError('Định dạng dữ liệu không hợp lệ. Vui lòng kiểm tra lại!');
    }
  };

  return (
    <div
      ref={tableRef}
      onClick={handleTableContainerClick}
      className="space-y-4 animate-in fade-in duration-150 select-none"
    >
      {/* 1. BREADCRUMB & HEADER TITLE (as in image.png) */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
          <div className="p-1 rounded-md bg-white/5 border border-white/10 text-cyan-400">
            <Home className="w-3.5 h-3.5" />
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">Lớp học</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-300">Thời khóa biểu</span>
          <span className="text-slate-600 font-bold">•</span>
          <span className="text-cyan-400 font-bold">{selectedTarget}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Thời Khóa Biểu Giảng Dạy ({selectedTarget})
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý và điều phối lịch học theo Lịch lớp học và Lịch giáo viên với dữ liệu độc lập.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TWO SCHEDULE TYPES & TARGET SELECTOR ROW: Hỗ trợ 2 loại lịch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0b1026]/90 border border-white/10 shadow-lg">
        {/* 2 Tabs: Lịch lớp học, Lịch giáo viên */}
        <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => {
              if (isEditing && hasUnsavedChanges()) {
                setShowUnsavedWarning(true);
                return;
              }
              setScheduleType('class');
              handleTargetChange(CLASS_OPTIONS[0]);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scheduleType === 'class'
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Lịch lớp học</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isEditing && hasUnsavedChanges()) {
                setShowUnsavedWarning(true);
                return;
              }
              setScheduleType('teacher');
              handleTargetChange(TEACHER_OPTIONS[0]);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scheduleType === 'teacher'
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Lịch giáo viên</span>
          </button>
        </div>

        {/* Target Dropdown: CHỌN LỚP / CHỌN GIÁO VIÊN */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
            {scheduleType === 'class' ? 'CHỌN LỚP:' : 'CHỌN GIÁO VIÊN:'}
          </span>
            <div className="relative">
              <select
                value={selectedTarget}
                onChange={(e) => handleTargetChange(e.target.value)}
                className="bg-slate-900 border border-white/15 hover:border-cyan-500/40 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 cursor-pointer shadow-sm pr-8"
              >
                {scheduleType === 'class' &&
                  CLASS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                {scheduleType === 'teacher' &&
                  TEACHER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

      {/* 3. KHU VỰC THANH CHỨC NĂNG (TOP BAR): CHỈ ĐÚNG 6 NÚT CHÍNH + THÊM THỨ 7 TRÊN CÙNG MỘT THANH NGANG */}
      <div className="p-2.5 rounded-2xl bg-[#0b1026]/90 border border-white/10 shadow-xl flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* NÚT 1: Chỉnh sửa (Pencil) */}
          <button
            type="button"
            onClick={handleToggleEdit}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
              isEditing
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 ring-2 ring-amber-500/20'
                : 'bg-slate-900/90 hover:bg-white/10 text-slate-200 border border-white/15 hover:border-cyan-500/40'
            }`}
            title="Bật/tắt chế độ chỉnh sửa trực tiếp"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-400" />
            <span>{isEditing ? 'Đang chỉnh sửa' : 'Chỉnh sửa'}</span>
          </button>

          {/* NÚT LƯU (Chỉ xuất hiện khi đang bật chế độ Chỉnh sửa) */}
          {isEditing && (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer transition-all active:scale-95 animate-in fade-in"
              title="Lưu toàn bộ thay đổi và tắt chế độ chỉnh sửa (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Lưu</span>
            </button>
          )}

          {/* NÚT 2: Xóa (MÀU ĐỎ, NẰM CẠNH NÚT CHỈNH SỬA) */}
          <button
            type="button"
            onClick={() => {
              const nextState = !isDeleting;
              setIsDeleting(nextState);
              if (nextState) {
                info('Chế độ Xóa bật: Click vào ô để xóa nội dung ngay lập tức.');
              }
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
              isDeleting
                ? 'bg-rose-600 text-white border border-rose-400 ring-2 ring-rose-500/30 font-extrabold'
                : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 hover:border-rose-400'
            }`}
            title="Bật chế độ xóa: Click ô/hàng/cột để xóa ngay"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{isDeleting ? 'Đang xóa...' : 'Xóa'}</span>
          </button>

          {/* NÚT 3: Hoàn tác (Undo - Icon mũi tên trái) */}
          <button
            type="button"
            disabled={undoStack.length === 0}
            onClick={handleUndo}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              undoStack.length > 0
                ? 'bg-slate-900/90 hover:bg-white/10 text-slate-200 border border-white/15 hover:border-cyan-500/40 cursor-pointer active:scale-95'
                : 'bg-slate-900/40 text-slate-600 border border-white/5 cursor-not-allowed opacity-50'
            }`}
            title="Hoàn tác thay đổi (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Hoàn tác</span>
          </button>

          {/* NÚT 4: Làm lại (Redo - Icon mũi tên phải) */}
          <button
            type="button"
            disabled={redoStack.length === 0}
            onClick={handleRedo}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              redoStack.length > 0
                ? 'bg-slate-900/90 hover:bg-white/10 text-slate-200 border border-white/15 hover:border-cyan-500/40 cursor-pointer active:scale-95'
                : 'bg-slate-900/40 text-slate-600 border border-white/5 cursor-not-allowed opacity-50'
            }`}
            title="Làm lại thay đổi (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span>Làm lại</span>
          </button>

          {/* NÚT THÊM THỨ / THỨ 7 (ĐƯỢC ĐƯA LÊN TRÊN THANH CÔNG CỤ THEO MŨI TÊN XANH CỦA NGƯỜI DÙNG) */}
          <button
            type="button"
            onClick={() => handleAddColumn(data.columns.length)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer shadow-sm active:scale-95 group"
            title={
              data.columns.length < 7
                ? `Thêm ${DAY_LABELS[2 + data.columns.length] || 'Thứ mới'} vào thời khóa biểu`
                : 'Một tuần có tối đa 7 ngày (Thứ 2 đến Chủ Nhật)'
            }
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-125 transition-transform" />
            <span>
              {data.columns.length < 7
                ? `Thêm ${DAY_LABELS[2 + data.columns.length]}`
                : 'Thêm Thứ'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* NÚT 5: Import Excel */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Nhập bảng từ Excel hoặc CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import Excel</span>
          </button>

          {/* NÚT 6: Xuất thời khóa biểu */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Xuất thời khóa biểu ra file (Excel / In ấn)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Xuất file</span>
          </button>
        </div>
      </div>

      {/* Delete mode alert badge */}
      {isDeleting && (
        <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-between text-xs text-rose-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>
              <strong>Chế độ Xóa đang bật:</strong> Click ô nào sẽ xóa ngay nội dung ô đó. Hoặc bấm icon thùng rác ở tiêu đề cột/hàng để xóa cả cột/hàng.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDeleting(false)}
            className="text-[11px] font-bold underline hover:text-white cursor-pointer ml-2"
          >
            Tắt chế độ xóa
          </button>
        </div>
      )}

      {/* 4. KHUNG THỜI KHÓA BIỂU DẠNG BẢNG LƯỚI CHUẨN */}
      <div className="rounded-2xl bg-[#0b1026]/90 border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center select-text">
            {/* TABLE HEADER */}
            <thead>
              <tr className="bg-slate-900/90 border-b border-white/10">
                {/* CỘT 1: Tiết / Giờ */}
                <th className="py-3 px-4 w-40 min-w-[140px] text-xs font-extrabold uppercase text-slate-300 tracking-wider border-r border-white/10 relative text-center group/thcol1">
                  <span>Tiết / Giờ</span>
                  {/* Vạch thêm cột sau Cột 1 (trước Thứ 2) */}
                  {isEditing && (
                    <div className="absolute right-0 top-0 bottom-0 w-6 -mr-3 z-20 flex items-center justify-center opacity-0 group-hover/thcol1:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddColumn(0);
                        }}
                        className="w-5 h-5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-110 transition-transform"
                        title="Thêm cột vào đây"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  )}
                </th>

                {/* CÁC CỘT THỨ (Thứ 2 đến Thứ 6/7/CN) */}
                {data.columns.map((col, colIdx) => (
                  <th
                    key={col.id}
                    className="py-3 px-3 text-center text-xs font-extrabold text-white tracking-wider border-r border-white/10 relative group/th min-w-[150px]"
                  >
                    <div className="flex items-center justify-center gap-1.5 relative">
                      <span>{col.label}</span>

                      {/* Delete Column Button (In Delete Mode or Edit Mode) */}
                      {(isDeleting || isEditing) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteColumn(col.id);
                          }}
                          className="p-1 rounded-md text-rose-400 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          title={`Xóa cột ${col.label}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* DẤU CỘNG THÊM CỘT Ở VẠCH NGĂN CÁCH KHI RÊ CHUỘT (CHẾ ĐỘ CHỈNH SỬA) */}
                    {isEditing && (
                      <div className="absolute right-0 top-0 bottom-0 w-6 -mr-3 z-20 flex items-center justify-center opacity-0 group-hover/th:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddColumn(colIdx + 1);
                          }}
                          className="w-5 h-5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-110 transition-transform"
                          title="Thêm cột vào đây"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* TABLE BODY (5 HÀNG NGANG TƯƠNG ỨNG 5 TIẾT) */}
            <tbody className="divide-y divide-white/5">
              {data.periods.map((period, rowIdx) => (
                <tr
                  key={period.id}
                  className="hover:bg-white/[0.02] transition-colors relative group/tr"
                >
                  {/* CỘT 1: Tiết & Giờ (Click để sửa trực tiếp giờ, không cho sửa số tiết) */}
                  <td className="py-3.5 px-4 text-xs border-r border-white/10 bg-slate-900/40 relative align-middle text-center">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex-1 text-center">
                        {/* Tiết số (Hệ thống tự động đặt, khóa không cho sửa) */}
                        <div className="font-extrabold text-white text-sm text-center">
                          Tiết {period.periodNumber}
                        </div>

                        {/* Thời gian tiết: Click sửa trực tiếp nếu đang ở chế độ chỉnh sửa */}
                        {isEditing && editingPeriodTimeId === period.id ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 flex items-center justify-center gap-1"
                          >
                            <input
                              type="text"
                              value={periodDraftTime}
                              onChange={(e) => setPeriodDraftTime(e.target.value)}
                              onBlur={commitPeriodTimeDraft}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  commitPeriodTimeDraft();
                                }
                              }}
                              autoFocus
                              className="w-28 px-1.5 py-0.5 rounded bg-slate-950 border border-cyan-400 text-[11px] font-mono text-cyan-300 focus:outline-none text-center"
                            />
                            <button
                              type="button"
                              onClick={commitPeriodTimeDraft}
                              className="text-cyan-400 hover:text-white p-0.5"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => {
                              if (isEditing) {
                                e.stopPropagation();
                                setEditingPeriodTimeId(period.id);
                                setPeriodDraftTime(period.time);
                              }
                            }}
                            className={`text-[11px] font-mono text-slate-400 mt-0.5 text-center ${
                              isEditing
                                ? 'cursor-pointer hover:text-cyan-300 hover:underline'
                                : ''
                            }`}
                            title={isEditing ? 'Click để sửa thời gian tiết' : ''}
                          >
                            {period.time}
                          </div>
                        )}
                      </div>

                      {/* Nút xóa hàng (nếu đang ở chế độ xóa hoặc chỉnh sửa) */}
                      {(isDeleting || isEditing) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(period.id);
                          }}
                          className="p-1 rounded-md text-rose-400 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          title={`Xóa Tiết ${period.periodNumber}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* DẤU CỘNG THÊM HÀNG Ở VẠCH NGĂN CÁCH DƯỚI (CHẾ ĐỘ CHỈNH SỬA) */}
                    {isEditing && (
                      <div className="absolute left-0 right-0 -bottom-2.5 h-5 z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddRow(rowIdx + 1);
                          }}
                          className="px-2 py-0.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1 shadow-lg cursor-pointer text-[10px] font-bold transform hover:scale-105 transition-transform"
                          title="Thêm hàng mới tại đây"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Thêm tiết</span>
                        </button>
                      </div>
                    )}
                  </td>

                  {/* CÁC Ô NỘI DUNG THỜI KHÓA BIỂU */}
                  {data.columns.map((col) => {
                    const cellKey = `${period.id}_${col.id}`;
                    const content = data.cells[cellKey];
                    const isCellActive = activeCellKey === cellKey;

                    return (
                      <td
                        key={cellKey}
                        onClick={() => handleCellClick(period.id, col.id)}
                        className={`timetable-cell py-3 px-3 border-r border-white/5 align-middle text-center transition-colors relative min-w-[150px] ${
                          isDeleting
                            ? 'hover:bg-rose-950/40 cursor-crosshair'
                            : isEditing
                            ? 'cursor-text hover:bg-white/[0.04]'
                            : ''
                        } ${isCellActive ? 'bg-cyan-950/30 ring-1 ring-cyan-500/40' : ''}`}
                      >
                        {isCellActive && isEditing ? (
                          /* TRẢI NGHIỆM NHẬP LIỆU GIỐNG MS WORD: CON TRỎ NHÁY |, TỰ ĐỘNG GIÃN CHIỀU CAO, ENTER XUỐNG DÒNG */
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="timetable-cell-editor w-full text-center"
                          >
                            <textarea
                              ref={textareaRef}
                              value={cellDraftText}
                              onChange={(e) => setCellDraftText(e.target.value)}
                              onKeyDown={(e) => {
                                // Enter key creates newline (like MS Word)
                                if (e.key === 'Enter') {
                                  // Default behavior is newline in textarea! Do nothing to allow newline
                                  return;
                                }
                                if (e.key === 'Escape') {
                                  commitCurrentCellDraft();
                                }
                              }}
                              placeholder="-trống-"
                              rows={2}
                              autoFocus
                              className="w-full bg-slate-950/90 text-white font-medium text-xs leading-relaxed p-2 rounded-lg border border-cyan-400/80 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none overflow-hidden text-center"
                            />
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                              <span>Enter: xuống dòng</span>
                              <button
                                type="button"
                                onClick={commitCurrentCellDraft}
                                className="text-cyan-400 hover:text-white font-bold"
                              >
                                Xong
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* HIỂN THỊ NỘI DUNG HOẶC -trống- (TỰ ĐỘNG CO GIÃN HÀNG, CHỮ CĂN GIỮA) */
                          <div className="min-h-[50px] flex flex-col justify-center items-center text-center">
                            {content && content.trim() ? (
                              <div className="text-xs font-semibold text-white whitespace-pre-line leading-relaxed break-words text-center">
                                {content}
                              </div>
                            ) : (
                              <div className="text-xs font-mono text-slate-500/70 select-none text-center">
                                -trống-
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* HÀNG THÊM TIẾT MỚI KHI Ở CHẾ ĐỘ CHỈNH SỬA */}
              {isEditing && (
                <tr className="bg-slate-900/30 border-t border-dashed border-white/10 hover:bg-cyan-950/20 transition-colors">
                  <td colSpan={data.columns.length + 1} className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleAddRow(data.periods.length)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>+ Thêm Tiết {data.periods.length + 1}</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP 1: GIỚI HẠN CỘT (TỐI ĐA 7 NGÀY / TUẦN) */}
      {showMaxColumnsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-[#0e142e] border border-cyan-500/40 p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Giới hạn thời khóa biểu</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Không thể thêm cột vì một tuần chỉ có 7 ngày (từ Thứ 2 đến Chủ Nhật).
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowMaxColumnsPopup(false)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-bold hover:brightness-110 cursor-pointer shadow-md transition-all active:scale-95"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: CẢNH BÁO CHƯA LƯU KHI TẮT CHẾ ĐỘ CHỈNH SỬA */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#0e142e] border border-amber-500/40 p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Bạn chưa lưu thay đổi</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bạn có các thay đổi chưa được lưu trên thời khóa biểu. Bạn muốn lưu hay hủy bỏ?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  // Discard changes & restore snapshot
                  setData(savedSnapshot);
                  setIsEditing(false);
                  setIsDeleting(false);
                  setActiveCellKey(null);
                  setEditingPeriodTimeId(null);
                  setUndoStack([]);
                  setRedoStack([]);
                  setShowUnsavedWarning(false);
                  info('Đã hủy các thay đổi chưa lưu.');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                Hủy bỏ (Không lưu)
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSave();
                  setShowUnsavedWarning(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPORT EXCEL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#0e142e] border border-cyan-500/30 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Import Thời Khóa Biểu</h3>
                  <p className="text-xs text-slate-400">Sao chép từ Excel / Google Sheets rồi dán vào đây</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Dán dữ liệu dạng bảng (Tab hoặc phẩy):
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Tiết&#9;Giờ&#9;Thứ 2&#9;Thứ 3&#9;Thứ 4&#9;Thứ 5&#9;Thứ 6&#10;Tiết 1&#9;07:00 - 07:45&#9;Toán&#9;Văn&#9;Anh&#9;Lý&#9;Hóa&#10;Tiết 2&#9;07:45 - 08:30&#9;Tin học&#9;Sinh&#9;Sử&#9;Địa&#9;GDCD"
                rows={7}
                className="w-full p-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400">
                Hệ thống sẽ tự động nhận diện các cột thứ và các hàng tiết để nhập dữ liệu.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleImportData}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md"
              >
                Bắt đầu Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: XUẤT THỜI KHÓA BIỂU */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#0e142e] border border-cyan-500/30 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Xuất Thời Khóa Biểu</h3>
                  <p className="text-xs text-slate-400">{selectedTarget}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-emerald-500/50 flex items-center gap-3 transition-colors text-left cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Xuất file Excel / CSV</div>
                  <div className="text-[11px] text-slate-400">Tải tệp dạng bảng tính tương thích Microsoft Excel</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                  setShowExportModal(false);
                }}
                className="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-cyan-500/50 flex items-center gap-3 transition-colors text-left cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">In / Xuất PDF Khổ Ngang</div>
                  <div className="text-[11px] text-slate-400">Mở hộp thoại in ấn với khung bảng chuẩn</div>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
