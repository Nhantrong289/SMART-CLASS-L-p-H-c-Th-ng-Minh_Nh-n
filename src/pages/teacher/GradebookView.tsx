import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  History,
  Check,
  X,
  Search,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { GradeEntry, GradeHistory } from '../../types';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';

export const GradebookView: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [grades, setGrades] = useState<GradeEntry[]>(StorageService.getGrades('cls_10a1'));
  const [searchTerm, setSearchTerm] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'tx1' | 'tx2' | 'tx3' | 'gk' | 'ck'; value: string } | null>(null);

  const history = StorageService.getGradeHistory();

  const filtered = grades.filter((g) =>
    g.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (entry: GradeEntry, field: 'tx1' | 'tx2' | 'tx3' | 'gk' | 'ck') => {
    const val = entry[field];
    setEditingCell({
      id: entry.id,
      field,
      value: val !== undefined && val !== null ? String(val) : '',
    });
  };

  const handleSaveCell = () => {
    if (!editingCell || !user) return;
    const raw = editingCell.value.trim();
    let num: number | null = null;
    if (raw !== '') {
      num = parseFloat(raw);
      if (isNaN(num) || num < 0 || num > 10) {
        error('Điểm số phải từ 0 đến 10');
        return;
      }
    }

    StorageService.updateGradeCell(editingCell.id, editingCell.field, num, user);
    setGrades(StorageService.getGrades('cls_10a1'));
    setEditingCell(null);
    success(`Đã cập nhật điểm cột ${editingCell.field.toUpperCase()} thành ${num ?? 'Trống'}`);
  };

  const handleExportCSV = () => {
    const headers = ['Mã HS,Họ và tên,TX1,TX2,TX3,Giữa kỳ,Cuối kỳ,Điểm TB\n'];
    const rows = grades.map(
      (g) =>
        `"${g.studentCode}","${g.studentName}",${g.tx1 ?? ''},${g.tx2 ?? ''},${g.tx3 ?? ''},${g.gk ?? ''},${g.ck ?? ''},${g.gpa ?? ''}`
    );
    const blob = new Blob([headers.join('') + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_diem_lop_10A1_MonToan.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Đã xuất bảng điểm thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <ModuleBreadcrumb
            section="Theo dõi"
            moduleName="Quản lý điểm"
            title="Sổ Điểm Điện Tử & Bảng Điểm Môn Học"
          />
          <p className="text-xs text-slate-400 mt-1 pl-1">
            Bảng điểm tương tác trực tiếp · Công thức tính điểm TB: (TX1 + TX2 + TX3 + GK×2 + CK×3) / 8
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={History} onClick={() => setIsHistoryOpen(true)}>
            Lịch sử sửa điểm
          </Button>
          <Button variant="primary" size="sm" icon={Download} onClick={handleExportCSV}>
            Xuất bảng điểm Excel
          </Button>
        </div>
      </div>

      {/* Search and Helper Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã HS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b1026] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-white/5">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Nhấp chuột vào bất kỳ ô điểm nào để sửa trực tiếp</span>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="rounded-2xl bg-[#0b1026]/85 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-white/10 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[200px]">Học sinh</th>
                <th className="py-3 px-3 text-center w-24">TX 1 (x1)</th>
                <th className="py-3 px-3 text-center w-24">TX 2 (x1)</th>
                <th className="py-3 px-3 text-center w-24">TX 3 (x1)</th>
                <th className="py-3 px-3 text-center w-24">Giữa kỳ (x2)</th>
                <th className="py-3 px-3 text-center w-24">Cuối kỳ (x3)</th>
                <th className="py-3 px-4 text-center w-28 bg-cyan-950/20 text-cyan-300">ĐTB Môn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-sm">{entry.studentName}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{entry.studentCode}</div>
                  </td>

                  {(['tx1', 'tx2', 'tx3', 'gk', 'ck'] as const).map((field) => {
                    const isEditing = editingCell?.id === entry.id && editingCell?.field === field;
                    const val = entry[field];
                    return (
                      <td key={field} className="py-2 px-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              autoFocus
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveCell();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-16 bg-slate-900 border-2 border-cyan-400 rounded-lg text-center font-mono font-bold text-cyan-200 py-1 text-xs focus:outline-none"
                            />
                            <button
                              onClick={handleSaveCell}
                              className="p-1 bg-cyan-500 text-slate-950 rounded hover:bg-cyan-400 cursor-pointer"
                              title="Lưu"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                              title="Hủy"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(entry, field)}
                            className="w-14 py-1.5 rounded-lg border border-transparent hover:border-cyan-500/40 hover:bg-cyan-500/10 font-mono font-bold text-sm text-slate-200 hover:text-cyan-300 transition-all cursor-pointer text-center"
                          >
                            {val !== undefined && val !== null ? val : '—'}
                          </button>
                        )}
                      </td>
                    );
                  })}

                  <td className="py-3 px-4 text-center bg-cyan-950/20">
                    <span
                      className={`font-mono text-sm font-extrabold px-2.5 py-1 rounded-md ${
                        entry.gpa && entry.gpa >= 9
                          ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                          : entry.gpa && entry.gpa >= 8
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {entry.gpa !== undefined && entry.gpa !== null ? entry.gpa.toFixed(1) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Drawer Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Lịch Sử Chỉnh Sửa Điểm Số (Audit Trail)"
        subtitle="Mọi thay đổi điểm đều được ghi lại với người sửa và dấu thời gian"
        maxWidth="xl"
      >
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{h.studentName}</span>
                <span className="font-mono text-slate-400 text-[11px]">{h.timestamp}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="font-semibold text-cyan-300">Cột {h.field}:</span>
                <span className="text-slate-400 line-through">{h.oldValue ?? 'Trống'}</span>
                <span className="text-cyan-400">→</span>
                <span className="font-bold text-emerald-400">{h.newValue ?? 'Trống'}</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Người sửa: <strong className="text-slate-300">{h.updatedBy}</strong> · Lý do: {h.reason || 'Sửa bảng điểm'}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
