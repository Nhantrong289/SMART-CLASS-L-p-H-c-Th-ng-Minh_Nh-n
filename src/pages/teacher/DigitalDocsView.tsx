import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Download,
  Share2,
  FileText,
  FileSpreadsheet,
  Eye,
  Trash2,
  Upload,
  HardDrive,
  Layers,
  Sparkles,
  BookOpen,
  Film,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';

interface DigitalDocument {
  id: string;
  title: string;
  category: 'giáo_án' | 'bài_giảng' | 'sách_số' | 'đề_thi' | 'thí_nghiệm';
  categoryLabel: string;
  subject: string;
  grade: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'mp4';
  fileSize: string;
  downloads: number;
  uploadedAt: string;
  author: string;
  description: string;
}

const INITIAL_DOCS: DigitalDocument[] = [
  {
    id: 'doc_1',
    title: 'Kế hoạch bài dạy (KHBD 5512): Định lý Cosin và Định lý Sin',
    category: 'giáo_án',
    categoryLabel: 'Giáo án KHBD',
    subject: 'Toán học',
    grade: 'Lớp 10',
    fileType: 'docx',
    fileSize: '1.4 MB',
    downloads: 142,
    uploadedAt: '14/10/2026',
    author: 'Cô Nguyễn Mai Anh',
    description: 'Giáo án chuẩn Công văn 5512/BGDĐT, tích hợp phương pháp dạy học dự án và giải toán thực tiễn.',
  },
  {
    id: 'doc_2',
    title: 'Slide bài giảng tương tác: Hệ thức lượng trong tam giác',
    category: 'bài_giảng',
    categoryLabel: 'Slide bài giảng',
    subject: 'Toán học',
    grade: 'Lớp 10',
    fileType: 'pptx',
    fileSize: '18.6 MB',
    downloads: 98,
    uploadedAt: '12/10/2026',
    author: 'Thầy Trần Quang Huy',
    description: 'Trọn bộ 25 slide hoạt hình trực quan, bài tập khởi động Geogebra và câu hỏi tương tác trắc nghiệm.',
  },
  {
    id: 'doc_3',
    title: 'Đề cương ôn tập & Ma trận kiểm tra giữa học kỳ 1 môn Toán',
    category: 'đề_thi',
    categoryLabel: 'Đề thi & Đề cương',
    subject: 'Toán học',
    grade: 'Lớp 10',
    fileType: 'pdf',
    fileSize: '3.2 MB',
    downloads: 320,
    uploadedAt: '10/10/2026',
    author: 'Tổ Toán - Tin',
    description: 'Đầy đủ bảng đặc tả ma trận đề 4 mức độ nhận thức kèm 4 đề minh họa có đáp án chi tiết.',
  },
  {
    id: 'doc_4',
    title: 'Sách giáo khoa Toán 10 (Tập 1) - Bản số hóa & Chú giải',
    category: 'sách_số',
    categoryLabel: 'Sách số hóa',
    subject: 'Toán học',
    grade: 'Lớp 10',
    fileType: 'pdf',
    fileSize: '45.0 MB',
    downloads: 410,
    uploadedAt: '01/09/2026',
    author: 'Bộ GD&ĐT',
    description: 'Bản PDF số hóa độ phân giải cao, hỗ trợ tìm kiếm từ khóa và tra cứu công thức nhanh.',
  },
  {
    id: 'doc_5',
    title: 'Video mô phỏng 3D: Chuyển động biến đổi đều và gia tốc',
    category: 'thí_nghiệm',
    categoryLabel: 'Thí nghiệm ảo',
    subject: 'Vật lý',
    grade: 'Lớp 10',
    fileType: 'mp4',
    fileSize: '64.5 MB',
    downloads: 87,
    uploadedAt: '05/10/2026',
    author: 'Tổ Vật lý',
    description: 'Video mô phỏng vật rơi tự do và chuyển động ném ngang trong phòng thí nghiệm ảo.',
  },
  {
    id: 'doc_6',
    title: 'Slide chuyên đề: Cấu tạo nguyên tử & Bảng tuần hoàn Men-đê-lê-ép',
    category: 'bài_giảng',
    categoryLabel: 'Slide bài giảng',
    subject: 'Hóa học',
    grade: 'Lớp 10',
    fileType: 'pptx',
    fileSize: '22.1 MB',
    downloads: 75,
    uploadedAt: '08/10/2026',
    author: 'Cô Lê Thị Lan',
    description: 'Slide minh họa mô hình nguyên tử Rutherford - Bohr với mô hình electron quay 3D.',
  },
];

export const DigitalDocsView: React.FC = () => {
  const { success, info } = useToast();
  const [docs, setDocs] = useState<DigitalDocument[]>(INITIAL_DOCS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả');
  const [selectedDocPreview, setSelectedDocPreview] = useState<DigitalDocument | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Form upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'giáo_án' | 'bài_giảng' | 'sách_số' | 'đề_thi' | 'thí_nghiệm'>('giáo_án');
  const [uploadSubject, setUploadSubject] = useState('Toán học');
  const [uploadGrade, setUploadGrade] = useState('Lớp 10');
  const [uploadFileType, setUploadFileType] = useState<'pdf' | 'docx' | 'pptx' | 'mp4'>('docx');
  const [uploadDesc, setUploadDesc] = useState('');

  const filteredDocs = docs.filter((d) => {
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    if (selectedSubject !== 'Tất cả' && d.subject !== selectedSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    const categoryLabels: Record<string, string> = {
      giáo_án: 'Giáo án KHBD',
      bài_giảng: 'Slide bài giảng',
      sách_số: 'Sách số hóa',
      đề_thi: 'Đề thi & Đề cương',
      thí_nghiệm: 'Thí nghiệm ảo',
    };

    const newDoc: DigitalDocument = {
      id: `doc_${Date.now()}`,
      title: uploadTitle,
      category: uploadCategory,
      categoryLabel: categoryLabels[uploadCategory] || 'Tài liệu số',
      subject: uploadSubject,
      grade: uploadGrade,
      fileType: uploadFileType,
      fileSize: '4.8 MB',
      downloads: 0,
      uploadedAt: new Date().toLocaleDateString('vi-VN'),
      author: 'Tôi (Giáo viên)',
      description: uploadDesc || 'Tài liệu học tập số hóa mới tải lên.',
    };

    setDocs([newDoc, ...docs]);
    setIsUploadOpen(false);
    setUploadTitle('');
    setUploadDesc('');
    success(`Đã tải lên tài liệu "${newDoc.title}" vào kho tài liệu số!`);
  };

  const handleShareToClass = (doc: DigitalDocument) => {
    success(`Đã chia sẻ tài liệu "${doc.title}" tới học sinh lớp 10A1 qua cổng học tập!`);
  };

  const handleDeleteDoc = (id: string) => {
    setDocs(docs.filter((d) => d.id !== id));
    success('Đã xóa tài liệu khỏi kho số.');
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & BREADCRUMB: 🏠 > Dạy học > Tài liệu số • Kho Học Liệu Điện Tử GDPT 2018 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <ModuleBreadcrumb
            section="Dạy học"
            moduleName="Tài liệu số"
            title="Tài Liệu Số & Kho Học Liệu Điện Tử"
            className="mb-1"
          />
          <p className="text-xs text-slate-400 mt-1">
            Lưu trữ, số hóa giáo án KHBD 5512, slide bài giảng trình chiếu, sách bài tập điện tử và học liệu tương tác.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={HardDrive}
            onClick={() => info('Dung lượng lưu trữ đám mây của trường: 2.8 GB / 50 GB đã sử dụng.')}
          >
            2.8 GB / 50 GB
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsUploadOpen(true)}
          >
            Tải lên tài liệu mới
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0b1026]/75 border border-white/10">
          <div className="text-xs text-slate-400 font-medium">Tổng tài liệu số</div>
          <div className="text-xl font-bold text-white mt-1">{docs.length} tài liệu</div>
          <div className="text-[10px] text-cyan-400 mt-0.5">Sẵn sàng chia sẻ</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0b1026]/75 border border-white/10">
          <div className="text-xs text-slate-400 font-medium">Giáo án KHBD 5512</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {docs.filter((d) => d.category === 'giáo_án').length} giáo án
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Đã duyệt chuyên môn</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0b1026]/75 border border-white/10">
          <div className="text-xs text-slate-400 font-medium">Slide bài giảng</div>
          <div className="text-xl font-bold text-fuchsia-400 mt-1">
            {docs.filter((d) => d.category === 'bài_giảng').length} bộ trình chiếu
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">PowerPoint & Canva</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0b1026]/75 border border-white/10">
          <div className="text-xs text-slate-400 font-medium">Lượt tải học sinh</div>
          <div className="text-xl font-bold text-amber-400 mt-1">1,142 lượt</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Kỳ 1 năm học 2026-2027</div>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="p-3.5 rounded-2xl bg-[#0b1026]/90 border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Category switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('giáo_án')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'giáo_án'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Giáo án 5512
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('bài_giảng')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'bài_giảng'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Slide bài giảng
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('đề_thi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'đề_thi'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Đề thi & Đề cương
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('sách_số')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'sách_số'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Sách số hóa
          </button>
        </div>

        {/* Search & Subject select */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên tài liệu..."
              className="bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-44 sm:w-56"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="Tất cả">Môn: Tất cả</option>
            <option value="Toán học">Toán học</option>
            <option value="Vật lý">Vật lý</option>
            <option value="Hóa học">Hóa học</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-4 rounded-2xl bg-[#0b1026]/80 hover:bg-[#0b1026] border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-lg"
          >
            <div className="space-y-2.5">
              {/* Header: FileType Badge & Downloads */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    doc.fileType === 'pdf'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : doc.fileType === 'docx'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : doc.fileType === 'pptx'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  .{doc.fileType} · {doc.fileSize}
                </span>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>{doc.downloads} lượt tải</span>
                </span>
              </div>

              {/* Title */}
              <h3
                onClick={() => setSelectedDocPreview(doc)}
                className="font-bold text-white text-sm leading-snug line-clamp-2 hover:text-cyan-300 transition-colors cursor-pointer"
                title={doc.title}
              >
                {doc.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {doc.description}
              </p>

              {/* Meta tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <Badge variant="cyan">{doc.subject}</Badge>
                <Badge variant="slate">{doc.grade}</Badge>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-white/5">
                  {doc.categoryLabel}
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 truncate">{doc.author}</span>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedDocPreview(doc)}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Xem trước tài liệu"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShareToClass(doc)}
                  className="p-1.5 text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Chia sẻ cho lớp học"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => success(`Đang tải xuống file ${doc.title}...`)}
                  className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Tải file về máy"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Xóa tài liệu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Preview */}
      {selectedDocPreview && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDocPreview(null)}
          title={`Xem trước: ${selectedDocPreview.title}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{selectedDocPreview.title}</span>
                <span className="font-mono text-cyan-400 font-bold uppercase">.{selectedDocPreview.fileType} ({selectedDocPreview.fileSize})</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{selectedDocPreview.description}</p>
              <div className="flex items-center gap-2 text-slate-400 pt-1 text-[11px]">
                <span>Tác giả: <strong className="text-white">{selectedDocPreview.author}</strong></span>
                <span>·</span>
                <span>Ngày đăng: {selectedDocPreview.uploadedAt}</span>
                <span>·</span>
                <span>Lượt tải: {selectedDocPreview.downloads}</span>
              </div>
            </div>

            {/* Document preview simulation */}
            <div className="p-8 rounded-xl bg-slate-950/80 border border-white/10 text-center space-y-3">
              <FileText className="w-12 h-12 text-cyan-400 mx-auto opacity-70 animate-pulse" />
              <div className="text-slate-200 font-semibold">Tài liệu đã được xác thực mã hóa an toàn trên hệ thống SmartClass</div>
              <p className="text-slate-400 max-w-md mx-auto text-[11px]">
                Bạn có thể mở trực tiếp trong trình đọc văn bản hoặc tải file gốc về máy để chỉnh sửa.
              </p>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <Button
                variant="secondary"
                size="sm"
                icon={Share2}
                onClick={() => {
                  handleShareToClass(selectedDocPreview);
                  setSelectedDocPreview(null);
                }}
              >
                Chia sẻ cho lớp học
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedDocPreview(null)}>
                  Đóng
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  onClick={() => {
                    success(`Đã tải xuống file: ${selectedDocPreview.title}`);
                    setSelectedDocPreview(null);
                  }}
                >
                  Tải xuống file (.${selectedDocPreview.fileType})
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Upload */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Tải Lên Tài Liệu Số Mới"
        maxWidth="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Tên tài liệu / Kế hoạch bài dạy *</label>
            <input
              type="text"
              required
              placeholder="VD: KHBD 5512 Bài 3: Giải tam giác"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Danh mục học liệu</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
              >
                <option value="giáo_án">Giáo án KHBD 5512</option>
                <option value="bài_giảng">Slide bài giảng</option>
                <option value="đề_thi">Đề thi & Đề cương</option>
                <option value="sách_số">Sách số hóa</option>
                <option value="thí_nghiệm">Thí nghiệm ảo</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Định dạng file</label>
              <select
                value={uploadFileType}
                onChange={(e) => setUploadFileType(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
              >
                <option value="docx">Word (.docx)</option>
                <option value="pptx">PowerPoint (.pptx)</option>
                <option value="pdf">PDF (.pdf)</option>
                <option value="mp4">Video MP4 (.mp4)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Môn học</label>
              <select
                value={uploadSubject}
                onChange={(e) => setUploadSubject(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
              >
                <option value="Toán học">Toán học</option>
                <option value="Vật lý">Vật lý</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Ngữ văn">Ngữ văn</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Khối lớp</label>
              <select
                value={uploadGrade}
                onChange={(e) => setUploadGrade(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
              >
                <option value="Lớp 10">Lớp 10</option>
                <option value="Lớp 11">Lớp 11</option>
                <option value="Lớp 12">Lớp 12</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Mô tả tóm tắt</label>
            <textarea
              rows={2}
              placeholder="Ghi chú nội dung chính của tài liệu..."
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 rounded-xl p-2.5 text-white"
            />
          </div>

          <div className="p-3 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-950/20 text-center">
            <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-1 opacity-70" />
            <div className="text-[11px] text-slate-300">Kéo thả file vào đây hoặc bấm chọn file tải lên (tối đa 100MB)</div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsUploadOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Xác nhận tải lên
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
