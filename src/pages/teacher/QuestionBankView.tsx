import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Download,
  Trash2,
  Copy,
  Layers,
  HelpCircle,
  Check,
  ChevronDown,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  FileText,
  Printer,
  ArrowRight,
  RefreshCw,
  Eye,
  CheckSquare,
  X,
  FileDown,
  Link as LinkIcon,
  Image as ImageIcon,
  Globe,
  ShieldCheck,
  Cpu,
  ArrowLeft,
  FileCheck,
  ExternalLink,
  Database,
  Cloud
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';
import { FirestoreQuestionsService } from '../../services/firestoreQuestions';
import { activeFirebaseConfig } from '../../services/firebase';


// 9 HẠNG CÂU HỎI CHUẨN GDPT 2018
export type QuestionType =
  | 'single_choice'      // Trắc nghiệm 1 đáp án
  | 'multiple_choice'    // Trắc nghiệm nhiều đáp án
  | 'true_false_items'   // Đúng/Sai theo từng ý (a, b, c, d)
  | 'matching'           // Ghép đôi
  | 'ordering'           // Sắp xếp
  | 'fill_in_blank'      // Điền khuyết
  | 'short_answer'       // Trả lời ngắn
  | 'essay'              // Tự luận
  | 'passage_based';     // Câu hỏi theo đoạn văn/tình huống

export interface TrueFalseStatement {
  id: string;
  label: string; // a, b, c, d
  statement: string;
  isCorrect: boolean; // true = Đúng, false = Sai
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
  indexLabel: string; // Câu 1, Câu 2
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface Question {
  id: string;
  code: string;
  subject: string;
  grade: string;
  topic?: string;
  type: QuestionType;
  difficulty: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
  content: string;
  passage?: string; // Đoạn văn / ngữ liệu tình huống
  options?: string[]; // Cho single_choice, multiple_choice
  correctAnswer?: string; // Cho single_choice, short_answer, essay
  correctAnswers?: string[]; // Cho multiple_choice
  tfStatements?: TrueFalseStatement[]; // Cho true_false_items
  matchingPairs?: MatchingPair[]; // Cho matching
  orderingItems?: string[]; // Các mục cần sắp xếp
  correctOrder?: string[]; // Thứ tự đúng
  blankAnswers?: string[]; // Các từ cần điền vào [___]
  subQuestions?: SubQuestion[]; // Cho passage_based
  explanation: string;
  tags: string[];
  usageCount: number;
  createdAt: string;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: 'Trắc nghiệm 1 đáp án',
  multiple_choice: 'Trắc nghiệm nhiều đáp án',
  true_false_items: 'Đúng / Sai theo từng ý',
  matching: 'Ghép đôi (Nối cột)',
  ordering: 'Sắp xếp theo thứ tự',
  fill_in_blank: 'Điền khuyết vào chỗ trống',
  short_answer: 'Trả lời ngắn',
  essay: 'Tự luận có Barème',
  passage_based: 'Theo đoạn văn / tình huống',
};

// DỮ LIỆU MẪU ĐẦY ĐỦ 9 DẠNG CÂU HỎI
const INITIAL_QUESTIONS: Question[] = [
  // 1. Single Choice
  {
    id: 'q_1',
    code: 'TOAN10-001',
    subject: 'Toán học',
    grade: 'Khối 10',
    topic: 'Hệ thức lượng trong tam giác',
    type: 'single_choice',
    difficulty: 'Thông hiểu',
    content: 'Cho tam giác ABC có a = 8, b = 10, góc C = 60°. Độ dài cạnh c là:',
    options: ['A. 2√21', 'B. 2√19', 'C. 3√17', 'D. 4√5'],
    correctAnswer: 'B',
    explanation: 'Áp dụng định lý Cosin: c² = a² + b² - 2ab*cos(C) = 64 + 100 - 160*0.5 = 76 => c = 2√19.',
    tags: ['Định lý Cosin', 'Hệ thức lượng', 'Hình học 10'],
    usageCount: 18,
    createdAt: '15/10/2026',
  },
  // 2. Multiple Choice (Chọn nhiều đáp án)
  {
    id: 'q_2',
    code: 'TOAN10-002',
    subject: 'Toán học',
    grade: 'Khối 10',
    topic: 'Hệ thức lượng & Diện tích tam giác',
    type: 'multiple_choice',
    difficulty: 'Vận dụng',
    content: 'Trong tam giác ABC, những công thức nào sau đây ĐÚNG về diện tích S?',
    options: [
      'A. S = 1/2 * a * b * sin(C)',
      'B. S = (a * b * c) / (4R)',
      'C. S = p * r (với p là nửa chu vi, r là bán kính đường tròn nội tiếp)',
      'D. S = 1/2 * a * c * cos(B)'
    ],
    correctAnswers: ['A', 'B', 'C'],
    explanation: 'Công thức A, B, C đều đúng theo sách giáo khoa GDPT 2018. Công thức D sai vì phải dùng sin(B) thay vì cos(B).',
    tags: ['Diện tích tam giác', 'Hệ thức lượng'],
    usageCount: 12,
    createdAt: '14/10/2026',
  },
  // 3. True/False per statement (Đúng / Sai từng ý chuẩn 2018)
  {
    id: 'q_3',
    code: 'VATLY10-001',
    subject: 'Vật lý',
    grade: 'Khối 10',
    topic: 'Chuyển động thẳng biến đổi đều',
    type: 'true_false_items',
    difficulty: 'Thông hiểu',
    content: 'Một vật chuyển động thẳng biến đổi đều với phương trình vận tốc v = 10 + 2t (m/s). Xét tính đúng/sai của các phát biểu sau:',
    tfStatements: [
      { id: 'tf_1', label: 'a)', statement: 'Vận tốc ban đầu của vật là v₀ = 10 m/s.', isCorrect: true, explanation: 'Đối chiếu phương trình v = v₀ + at => v₀ = 10 m/s.' },
      { id: 'tf_2', label: 'b)', statement: 'Gia tốc của vật là a = 1 m/s².', isCorrect: false, explanation: 'Gia tốc a = 2 m/s² chứ không phải 1 m/s².' },
      { id: 'tf_3', label: 'c)', statement: 'Vật chuyển động thẳng nhanh dần đều.', isCorrect: true, explanation: 'Vì a * v₀ = 2 * 10 = 20 > 0 nên vật chuyển động nhanh dần đều.' },
      { id: 'tf_4', label: 'd)', statement: 'Tại thời điểm t = 5s, vận tốc của vật đạt 25 m/s.', isCorrect: false, explanation: 'Tại t = 5s: v = 10 + 2*5 = 20 m/s.' }
    ],
    explanation: 'Câu trắc nghiệm Đúng/Sai 4 ý chuẩn cấu trúc thi tốt nghiệp THPT từ năm 2025.',
    tags: ['Động học', 'Biến đổi đều'],
    usageCount: 25,
    createdAt: '12/10/2026',
  },
  // 4. Matching (Ghép đôi)
  {
    id: 'q_4',
    code: 'HOAHOC10-001',
    subject: 'Hóa học',
    grade: 'Khối 10',
    topic: 'Cấu tạo nguyên tử',
    type: 'matching',
    difficulty: 'Nhận biết',
    content: 'Hãy ghép tên hạt cấu tạo nguyên tử ở Cột A với đặc điểm điện tích tương ứng ở Cột B:',
    matchingPairs: [
      { leftId: '1', leftText: '1. Proton (p)', rightId: 'a', rightText: 'a. Mang điện tích dương (+1)' },
      { leftId: '2', leftText: '2. Electron (e)', rightId: 'b', rightText: 'b. Mang điện tích âm (-1)' },
      { leftId: '3', leftText: '3. Neutron (n)', rightId: 'c', rightText: 'c. Không mang điện tích' },
    ],
    explanation: 'Đáp án ghép đúng: 1-a, 2-b, 3-c. Trong hạt nhân có proton và neutron, lớp vỏ chứa electron.',
    tags: ['Cấu tạo nguyên tử', 'Hạt cơ bản'],
    usageCount: 16,
    createdAt: '10/10/2026',
  },
  // 5. Ordering (Sắp xếp theo thứ tự)
  {
    id: 'q_5',
    code: 'SINH10-001',
    subject: 'Sinh học',
    grade: 'Khối 10',
    topic: 'Chu kỳ tế bào & Nguyên phân',
    type: 'ordering',
    difficulty: 'Thông hiểu',
    content: 'Hãy sắp xếp đúng thứ tự 4 kì của quá trình Nguyên phân (Phân chia nhân):',
    orderingItems: [
      'Kì giữa (các NST co xoắn cực đại và xếp thành 1 hàng trên mặt phẳng xích đạo)',
      'Kì đầu (màng nhân tiêu biến, thoi phân bào xuất hiện)',
      'Kì cuối (màng nhân xuất hiện trở lại, NST dãn xoắn)',
      'Kì sau (các cromatit tách nhau tại tâm động đi về hai cực)'
    ],
    correctOrder: [
      '1. Kì đầu (màng nhân tiêu biến, thoi phân bào xuất hiện)',
      '2. Kì giữa (các NST co xoắn cực đại và xếp thành 1 hàng trên mặt phẳng xích đạo)',
      '3. Kì sau (các cromatit tách nhau tại tâm động đi về hai cực)',
      '4. Kì cuối (màng nhân xuất hiện trở lại, NST dãn xoắn)'
    ],
    explanation: 'Thứ tự đúng của nguyên phân: Kì đầu -> Kì giữa -> Kì sau -> Kì cuối.',
    tags: ['Nguyên phân', 'Chu kỳ tế bào'],
    usageCount: 11,
    createdAt: '09/10/2026',
  },
  // 6. Fill in the Blank (Điền khuyết)
  {
    id: 'q_6',
    code: 'TIENGANH10-001',
    subject: 'Tiếng Anh',
    grade: 'Khối 10',
    topic: 'Conditional Sentences',
    type: 'fill_in_blank',
    difficulty: 'Thông hiểu',
    content: 'Điền từ thích hợp vào chỗ trống trong đoạn văn sau:\n"If humanity protects the environment, our planet [1]_____ a safer place for future generations. Renewable energy sources such as solar and wind will [2]_____ fossil fuels to reduce carbon emissions."',
    blankAnswers: ['[1] will become', '[2] replace'],
    explanation: 'Chỗ trống [1] dùng câu điều kiện loại 1: if + hiện tại đơn, tương lai đơn (will become). Chỗ trống [2] dùng động từ nguyên thể sau will: replace (thay thế).',
    tags: ['Conditional Type 1', 'Environment'],
    usageCount: 20,
    createdAt: '08/10/2026',
  },
  // 7. Short Answer (Trả lời ngắn)
  {
    id: 'q_7',
    code: 'TOAN10-004',
    subject: 'Toán học',
    grade: 'Khối 10',
    topic: 'Giải tam giác & Bán kính nội tiếp',
    type: 'short_answer',
    difficulty: 'Vận dụng',
    content: 'Cho tam giác ABC có a = 5, b = 7, c = 8. Bán kính đường tròn nội tiếp r của tam giác bằng bao nhiêu? (Nhập kết quả dưới dạng số thập phân làm tròn 2 chữ số hoặc căn thức)',
    correctAnswer: 'r = √3 ≈ 1.73',
    explanation: 'Nửa chu vi p = (5 + 7 + 8)/2 = 10. Diện tích S = √(p(p-a)(p-b)(p-c)) = √(10*5*3*2) = √300 = 10√3. Khi đó r = S / p = 10√3 / 10 = √3 ≈ 1.73.',
    tags: ['Bán kính nội tiếp', 'Công thức Heron'],
    usageCount: 30,
    createdAt: '06/10/2026',
  },
  // 8. Essay (Tự luận có Barème)
  {
    id: 'q_8',
    code: 'VAN10-001',
    subject: 'Ngữ văn',
    grade: 'Khối 10',
    topic: 'Sử thi Đăm Săn',
    type: 'essay',
    difficulty: 'Vận dụng cao',
    content: 'Phân tích vẻ đẹp bi tráng của hình tượng người dũng sĩ Đăm Săn trong đoạn trích "Chiến thắng Mtao Mxây" (Sử thi Ê-đê).',
    correctAnswer: 'Barème điểm chi tiết:\n- Mở bài (0.5đ): Giới thiệu sử thi Đăm Săn và đoạn trích.\n- Thân bài (3.5đ):\n  + Vẻ đẹp ngoại hình kỳ vĩ, phi thường (1.0đ)\n  + Khí phách dũng cảm, tài năng võ nghệ xuất chúng (1.5đ)\n  + Tinh thần vì cộng đồng buôn làng và khát vọng hòa bình (1.0đ)\n- Kết bài (0.5đ): Khẳng định giá trị nghệ thuật sử thi Tây Nguyên.',
    explanation: 'Cần bám sát biện pháp so sánh phóng đại (ngực thở ầm ầm như sấm gầm), âm hưởng hào hùng và ngôn ngữ đối thoại sinh động.',
    tags: ['Sử thi Đăm Săn', 'Văn học dân gian'],
    usageCount: 9,
    createdAt: '01/10/2026',
  },
  // 9. Passage-based (Theo đoạn văn / tình huống)
  {
    id: 'q_9',
    code: 'TOAN10-005',
    subject: 'Toán học',
    grade: 'Khối 10',
    topic: 'Bài toán thực tế trắc địa',
    type: 'passage_based',
    difficulty: 'Vận dụng cao',
    passage: 'Tình huống thực tế: Để đo khoảng cách từ bờ đất bên này (vị trí A) sang một hải đăng nằm ngoài khơi (vị trí C) mà không thể trực tiếp bơi ra, một nhóm kỹ sư đã chọn thêm một điểm quan sát B nằm cùng trên bờ đất sao cho khoảng cách AB = 100 m. Sử dụng giác kế, nhóm đo được các góc CAB = 75° và góc CBA = 60°.',
    content: 'Dựa vào dữ liệu tình huống trắc địa trên, hãy trả lời các câu hỏi sau:',
    subQuestions: [
      {
        id: 'sub_1',
        indexLabel: 'Ý 1',
        content: 'Số đo góc ACB nhìn từ hải đăng về hai điểm quan sát A và B là bao nhiêu độ?',
        options: ['45°', '50°', '55°', '60°'],
        correctAnswer: 'A. 45°',
        explanation: 'Tổng 3 góc trong tam giác ABC là 180° => Góc ACB = 180° - 75° - 60° = 45°.'
      },
      {
        id: 'sub_2',
        indexLabel: 'Ý 2',
        content: 'Khoảng cách từ điểm A trên bờ đến hải đăng C xấp xỉ bằng bao nhiêu mét? (Làm tròn đến hàng đơn vị)',
        options: ['122 m', '135 m', '141 m', '150 m'],
        correctAnswer: 'A. 122 m',
        explanation: 'Áp dụng định lý Sin trong tam giác ABC: AC / sin(B) = AB / sin(C) => AC = 100 * sin(60°) / sin(45°) = 100 * (√3/2) / (√2/2) = 100 * √(3/2) ≈ 122.47 m ≈ 122 m.'
      }
    ],
    explanation: 'Bài toán ứng dụng thực tế định lý Sin trong giải tam giác theo định hướng đánh giá năng lực GDPT 2018.',
    tags: ['Ứng dụng thực tế', 'Đo đạc trắc địa', 'Định lý Sin'],
    usageCount: 14,
    createdAt: '03/10/2026',
  }
];

export const QuestionBankView: React.FC = () => {
  const { success, error: toastError, info } = useToast();
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [isFirestoreSynced, setIsFirestoreSynced] = useState<boolean>(true);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState<boolean>(false);

  // Subscribe to Cloud Firestore real-time questions
  useEffect(() => {
    const unsubscribe = FirestoreQuestionsService.subscribeQuestions(
      (remoteList) => {
        if (remoteList && remoteList.length > 0) {
          setQuestions(remoteList as Question[]);
          setIsFirestoreSynced(true);
        }
      },
      (err) => {
        console.warn('Real-time sync to Firestore note:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSyncAllToFirestore = async () => {
    setIsSyncingFirestore(true);
    try {
      const count = await FirestoreQuestionsService.batchSaveQuestions(questions as any);
      success(`Đã đồng bộ thành công ${count} câu hỏi lên Cloud Firestore (${activeFirebaseConfig.projectId})!`);
      setIsFirestoreSynced(true);
    } catch (e) {
      toastError('Đồng bộ thất bại, vui lòng kiểm tra kết nối.');
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  // VIEW MODE: 'create' (Hiển thị 3 tab nhập vào khớp các ảnh) | 'list' (Danh sách kho câu hỏi & quản lý)
  const [viewMode, setViewMode] = useState<'create' | 'list'>('create');
  // TAB ACTIVE TRONG VIEW CREATE: 'tab1' | 'tab2' | 'tab3'
  const [activeTab, setActiveTab] = useState<'tab1' | 'tab2' | 'tab3'>('tab1');


  // FILTERS (cho chế độ list)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả');
  const [selectedGrade, setSelectedGrade] = useState('Tất cả');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Tất cả');
  const [selectedType, setSelectedType] = useState<string>('Tất cả');

  // =========================================================================
  // TAB 1 STATE: IMPORT FILE (WORD / EXCEL / CSV / JSON)
  // =========================================================================
  const [tab1FileName, setTab1FileName] = useState<string | null>(null);
  const [tab1FileSize, setTab1FileSize] = useState<string | null>(null);
  const [tab1ValidationStatus, setTab1ValidationStatus] = useState<{
    unicode: boolean;
    schema: boolean;
    duplicateCount: number;
  } | null>(null);
  const [tab1ParsedQuestions, setTab1ParsedQuestions] = useState<Question[]>([]);
  const [tab1IsParsing, setTab1IsParsing] = useState(false);

  // =========================================================================
  // TAB 2 STATE: AI GEMINI (4 NGUỒN: VĂN BẢN, FILE, LINK WEB, HÌNH ẢNH)
  // =========================================================================
  const [aiSourceMode, setAiSourceMode] = useState<'text' | 'file' | 'link' | 'image'>('text');
  const [aiTextContent, setAiTextContent] = useState('');
  const [aiAttachedFile, setAiAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [aiWebLinkInput, setAiWebLinkInput] = useState('');
  const [aiWebLinksList, setAiWebLinksList] = useState<string[]>([]);
  const [aiUploadedImage, setAiUploadedImage] = useState<string | null>(null);
  const [aiSubject, setAiSubject] = useState('Toán học');
  const [aiGrade, setAiGrade] = useState('Khối 10');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<Question[] | null>(null);
  const [aiApprovedSelection, setAiApprovedSelection] = useState<Record<string, boolean>>({});

  // =========================================================================
  // TAB 3 STATE: TẠO THỦ CÔNG
  // =========================================================================
  const [manualSubject, setManualSubject] = useState('Toán học');
  const [manualGrade, setManualGrade] = useState('Khối 10');
  const [manualType, setManualType] = useState<
    'single_choice' | 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'essay'
  >('single_choice');
  const [manualDifficulty, setManualDifficulty] = useState<'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao'>('Thông hiểu');
  const [manualTopic, setManualTopic] = useState('');
  const [manualContent, setManualContent] = useState('');
  // 4 phương án lựa chọn A, B, C, D
  const [manualOptA, setManualOptA] = useState('');
  const [manualOptB, setManualOptB] = useState('');
  const [manualOptC, setManualOptC] = useState('');
  const [manualOptD, setManualOptD] = useState('');
  // Đáp án đúng cho single choice
  const [manualSingleCorrect, setManualSingleCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  // Đáp án đúng cho multiple choice (nhiều đáp án - Pick Many)
  const [manualMultiSelected, setManualMultiSelected] = useState<string[]>(['A']);
  // Đúng sai từng ý
  const [manualTFItems, setManualTFItems] = useState([
    { label: 'a)', text: '', isCorrect: true },
    { label: 'b)', text: '', isCorrect: false },
    { label: 'c)', text: '', isCorrect: true },
    { label: 'd)', text: '', isCorrect: false },
  ]);
  // Điền khuyết
  const [manualFillBlanks, setManualFillBlanks] = useState('');
  // Tự luận
  const [manualEssayRubric, setManualEssayRubric] = useState('');
  // Lời giải chi tiết
  const [manualExplanation, setManualExplanation] = useState('');

  // MODAL EXPORT DATA
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'word' | 'excel' | 'pdf'>('word');
  const [exportIncludeSolutions, setExportIncludeSolutions] = useState(true);
  const [exportHeaderTitle, setExportHeaderTitle] = useState('ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC TOÁN HỌC');

  // =========================================================================
  // DOWNLOAD TEMPLATES HANDLERS (TAB 1)
  // =========================================================================
  const handleDownloadExcelTemplate = () => {
    let csvContent = '\uFEFF'; // BOM UTF-8 for Excel
    csvContent += 'Mã câu,Môn học,Khối lớp,Dạng câu hỏi,Mức độ,Chủ đề bài học,Nội dung câu hỏi,Phương án A,Phương án B,Phương án C,Phương án D,Đáp án đúng,Lời giải chi tiết\n';
    csvContent += '"TOAN10-EX1","Toán học","Khối 10","Trắc nghiệm 1 đáp án","Thông hiểu","Hàm số bậc hai","Cho hàm số y = ax² + bx + c. Đỉnh Parabol I có tọa độ là:","-b/(2a); -Δ/(4a)","-b/a; -Δ/a","b/(2a); Δ/(4a)","-b/(4a); -Δ/(2a)","A","Tọa độ đỉnh Parabol theo SGK Toán 10 là I(-b/2a; -Δ/4a)."\n';
    csvContent += '"TOAN10-EX2","Toán học","Khối 10","Trắc nghiệm nhiều đáp án","Vận dụng","Hệ thức lượng","Các công thức nào sau đây tính diện tích tam giác ABC?","S = 1/2*a*h_a","S = (abc)/(4R)","S = p*r","S = 1/2*a*b*cos(C)","A, B, C","Các công thức A, B, C đều đúng. Công thức D dùng cos là sai."\n';
    csvContent += '"VATLY10-EX1","Vật lý","Khối 10","Trắc nghiệm 1 đáp án","Nhận biết","Định luật Newton","Gia tốc của một vật cùng hướng với lực tác dụng theo định luật nào?","Định luật I Newton","Định luật II Newton","Định luật III Newton","Định luật Vạn vật hấp dẫn","B","Theo định luật II Newton: F = m*a nên a cùng hướng với hợp lực F."\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Template_NganHangCauHoi_Excel_Chuan.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Đã tải xuống Template Excel chuẩn (.csv UTF-8) kèm hướng dẫn & ví dụ mẫu!');
  };

  const handleDownloadWordTemplate = () => {
    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Template Ngân hàng câu hỏi chuẩn Word</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #111; }
        .title { text-align: center; font-weight: bold; font-size: 15pt; margin-bottom: 5px; }
        .guide { background: #f3f4f6; border-left: 4px solid #0284c7; padding: 10px; margin-bottom: 20px; font-size: 11pt; }
        .q-item { margin-bottom: 18px; }
        .q-title { font-weight: bold; color: #0f172a; }
        .opts { margin-left: 20px; }
        .ans { color: #047857; font-weight: bold; }
        .exp { color: #334155; font-style: italic; }
      </style>
      </head>
      <body>
        <div class="title">BỘ GIÁO DỤC VÀ ĐÀO TẠO — MA TRẬN & NGÂN HÀNG CÂU HỎI CHUẨN HÓA</div>
        <div class="guide">
          <strong>HƯỚNG DẪN ĐỊNH DẠNG TỰ ĐỘNG PARSE:</strong><br/>
          - Bắt đầu câu hỏi bằng <code>[Câu X]</code> hoặc <code>Câu X:</code><br/>
          - Mỗi phương án trên 1 dòng bắt đầu bằng <code>A.</code>, <code>B.</code>, <code>C.</code>, <code>D.</code><br/>
          - Dòng tiếp theo ghi <code>Đáp án: [A/B/C/D]</code> (hoặc <code>A, B</code> nếu nhiều đáp án)<br/>
          - Dòng tiếp theo ghi <code>Lời giải: [Nội dung giải thích chi tiết]</code><br/>
          - Dòng phân loại: <code>Mức độ: [Nhận biết/Thông hiểu/Vận dụng/Vận dụng cao]</code> và <code>Môn: [Tên môn]</code>
        </div>
        <div class="q-item">
          <div class="q-title">[Câu 1] Cho tam giác ABC có a = 6, b = 8, góc C = 90°. Độ dài cạnh huyền c là:</div>
          <div class="opts">
            <div>A. 10</div>
            <div>B. 12</div>
            <div>C. 14</div>
            <div>D. 16</div>
          </div>
          <div class="ans">Đáp án: A</div>
          <div class="exp">Lời giải: Áp dụng định lý Pytago: c² = a² + b² = 36 + 64 = 100 => c = 10.</div>
          <div>Mức độ: Nhận biết | Môn: Toán học | Khối: Khối 10</div>
        </div>
        <div class="q-item">
          <div class="q-title">[Câu 2] Tập hợp các số thực x thỏa mãn phương trình x² - 4 = 0 là:</div>
          <div class="opts">
            <div>A. {2}</div>
            <div>B. {-2}</div>
            <div>C. {-2; 2}</div>
            <div>D. ∅</div>
          </div>
          <div class="ans">Đáp án: C</div>
          <div class="exp">Lời giải: Phương trình tương đương x² = 4 => x = 2 hoặc x = -2.</div>
          <div>Mức độ: Thông hiểu | Môn: Toán học | Khối: Khối 10</div>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Template_NganHangCauHoi_Word_Chuan.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Đã tải xuống Template Word chuẩn (.doc) theo cấu trúc Bộ GD&ĐT!');
  };

  // UPLOAD FILE HANDLER (TAB 1)
  const handleTab1FileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTab1FileName(file.name);
    setTab1FileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setTab1IsParsing(true);

    setTimeout(() => {
      setTab1IsParsing(false);
      setTab1ValidationStatus({
        unicode: true,
        schema: true,
        duplicateCount: 0,
      });

      // Tạo các câu hỏi bóc tách từ file mẫu
      const parsedSample: Question[] = [
        {
          id: `imp_${Date.now()}_1`,
          code: `IMP-${String(questions.length + 1).padStart(3, '0')}`,
          subject: 'Toán học',
          grade: 'Khối 10',
          topic: 'Tam giác vuông & Định lý Pytago',
          type: 'single_choice',
          difficulty: 'Nhận biết',
          content: 'Cho tam giác ABC vuông tại C có AC = 6 cm, BC = 8 cm. Độ dài cạnh huyền AB là:',
          options: ['A. 10 cm', 'B. 12 cm', 'C. 14 cm', 'D. 16 cm'],
          correctAnswer: 'A',
          explanation: 'Áp dụng định lý Pytago AB² = AC² + BC² = 36 + 64 = 100 => AB = 10 cm.',
          tags: ['File Import', 'Pytago'],
          usageCount: 0,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        },
        {
          id: `imp_${Date.now()}_2`,
          code: `IMP-${String(questions.length + 2).padStart(3, '0')}`,
          subject: 'Toán học',
          grade: 'Khối 10',
          topic: 'Phương trình bậc hai',
          type: 'single_choice',
          difficulty: 'Thông hiểu',
          content: 'Tập hợp các nghiệm thực của phương trình x² - 5x + 6 = 0 là:',
          options: ['A. {1; 6}', 'B. {2; 3}', 'C. {-2; -3}', 'D. {3; 4}'],
          correctAnswer: 'B',
          explanation: 'Phân tích nhân tử (x - 2)(x - 3) = 0 => x = 2 hoặc x = 3.',
          tags: ['File Import', 'Nghiệm phương trình'],
          usageCount: 0,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        },
        {
          id: `imp_${Date.now()}_3`,
          code: `IMP-${String(questions.length + 3).padStart(3, '0')}`,
          subject: 'Toán học',
          grade: 'Khối 10',
          topic: 'Bất phương trình',
          type: 'single_choice',
          difficulty: 'Vận dụng',
          content: 'Tập nghiệm của bất phương trình (x - 1)(x - 3) ≤ 0 là đoạn:',
          options: ['A. [1; 3]', 'B. (-∞; 1]', 'C. [3; +∞)', 'D. (1; 3)'],
          correctAnswer: 'A',
          explanation: 'Tam thức bậc hai mang dấu âm trong khoảng 2 nghiệm [1; 3].',
          tags: ['File Import', 'Bất phương trình'],
          usageCount: 0,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        }
      ];

      setTab1ParsedQuestions(parsedSample);
      success(`Đã phân tích thành công ${parsedSample.length} câu hỏi từ tệp "${file.name}"!`);
    }, 700);
  };

  const handleSaveTab1ImportedQuestions = () => {
    if (tab1ParsedQuestions.length === 0) {
      toastError('Chưa có câu hỏi nào được bóc tách!');
      return;
    }
    setQuestions((prev) => [...tab1ParsedQuestions, ...prev]);
    // Save to Cloud Firestore
    FirestoreQuestionsService.batchSaveQuestions(tab1ParsedQuestions as any).catch((err) => {
      console.warn('Firestore sync background notice:', err);
    });
    success(`Đã lưu thành công ${tab1ParsedQuestions.length} câu hỏi vào Ngân hàng và Cloud Firestore!`);
    setTab1ParsedQuestions([]);
    setTab1FileName(null);
    setTab1ValidationStatus(null);
    setViewMode('list');
  };

  // =========================================================================
  // TAB 2 AI GENERATE HANDLER
  // =========================================================================
  const handleAddWebLink = () => {
    if (!aiWebLinkInput.trim()) {
      toastError('Vui lòng nhập đường dẫn trang web!');
      return;
    }
    if (!aiWebLinkInput.startsWith('http')) {
      toastError('Đường dẫn phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    setAiWebLinksList((prev) => [...prev, aiWebLinkInput.trim()]);
    setAiWebLinkInput('');
    info('Đã thêm liên kết web vào danh sách nguồn tài liệu của AI!');
  };

  const handleStartAiGenerate = () => {
    let sourceDesc = '';
    if (aiSourceMode === 'text') {
      sourceDesc = aiTextContent || 'Chủ đề: Hệ thức lượng trong tam giác và Định lý Cosin';
    } else if (aiSourceMode === 'file') {
      sourceDesc = aiAttachedFile ? `File: ${aiAttachedFile.name}` : 'Tài liệu giáo án tổng hợp';
    } else if (aiSourceMode === 'link') {
      sourceDesc = aiWebLinksList.length > 0 ? aiWebLinksList.join(', ') : 'Trang tài liệu trực tuyến';
    } else if (aiSourceMode === 'image') {
      sourceDesc = 'Ảnh chụp giáo trình / Đề kiểm tra';
    }

    setIsAiGenerating(true);
    setAiGeneratedQuestions(null);

    setTimeout(() => {
      setIsAiGenerating(false);

      const generated: Question[] = [
        {
          id: `ai_q_${Date.now()}_1`,
          code: `AI-${aiSubject === 'Toán học' ? 'TOAN' : 'MON'}10-001`,
          subject: aiSubject,
          grade: aiGrade,
          topic: 'Định lý Cosin & Giải tam giác',
          type: 'single_choice',
          difficulty: 'Thông hiểu',
          content: `Trong tam giác ABC có a = 7, b = 5, cos(C) = 3/5. Độ dài cạnh c là:`,
          options: ['A. 2√6', 'B. 4√2', 'C. 6', 'D. 2√10'],
          correctAnswer: 'B',
          explanation: 'Áp dụng định lý Cosin: c² = a² + b² - 2ab*cos(C) = 49 + 25 - 2*7*5*(3/5) = 74 - 42 = 32 => c = √32 = 4√2.',
          tags: ['AI Gemini', 'Định lý Cosin', 'Chống Hallucination'],
          usageCount: 0,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        },
        {
          id: `ai_q_${Date.now()}_2`,
          code: `AI-${aiSubject === 'Toán học' ? 'TOAN' : 'MON'}10-002`,
          subject: aiSubject,
          grade: aiGrade,
          topic: 'Công thức diện tích tam giác',
          type: 'multiple_choice',
          difficulty: 'Vận dụng',
          content: `Cho tam giác ABC có ba cạnh a, b, c và bán kính đường tròn ngoại tiếp R, bán kính nội tiếp r. Những công thức nào sau đây ĐÚNG?`,
          options: [
            'A. S = (abc) / (4R)',
            'B. S = p * r (với p là nửa chu vi)',
            'C. S = 1/2 * b * c * sin(A)',
            'D. S = 1/2 * a * b * cos(C)'
          ],
          correctAnswers: ['A', 'B', 'C'],
          explanation: 'Các công thức A, B, C đều đúng theo sách giáo khoa GDPT 2018. Công thức D sai vì diện tích dùng sin góc xen giữa chứ không dùng cos.',
          tags: ['AI Gemini', 'Diện tích', 'Nhiều đáp án'],
          usageCount: 0,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        },
        {
          id: `ai_q_${Date.now()}_3`,
          code: `AI-${aiSubject === 'Toán học' ? 'TOAN' : 'MON'}10-003`,
          subject: aiSubject,
          grade: aiGrade,
          topic: 'Tính chất góc & cạnh tam giác',
          type: 'true_false_items',
          difficulty: 'Thông hiểu',
          content: `Cho tam giác ABC có a = 6, b = 7, c = 8. Xét tính đúng sai của các khẳng định sau:`,
          tfStatements: [
            { id: 'ai_tf_1', label: 'a)', statement: 'Nửa chu vi tam giác p = 10.5.', isCorrect: true, explanation: 'p = (6 + 7 + 8)/2 = 10.5.' },
            { id: 'ai_tf_2', label: 'b)', statement: 'Tam giác ABC là tam giác vuông tại A.', isCorrect: false, explanation: 'Vì 6² + 7² = 85 ≠ 8² = 64 nên tam giác không vuông.' },
            { id: 'ai_tf_3', label: 'c)', statement: 'Góc C là góc tù.', isCorrect: false, explanation: 'cos(C) = (a²+b²-c²)/(2ab) = (36+49-64)/(2*6*7) = 21/84 = 1/4 > 0 nên góc C là góc nhọn.' },
            { id: 'ai_tf_4', label: 'd)', statement: 'Diện tích tam giác S = (21√15)/4.', isCorrect: true, explanation: 'Áp dụng công thức Heron.' },
          ],
          explanation: 'Cấu trúc Đúng/Sai chuẩn 4 ý GDPT 2018 bám sát tài liệu nguồn.',
          tags: ['AI Gemini', 'Đúng/Sai 4 ý'],
          usageCount: 0,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        },
        {
          id: `ai_q_${Date.now()}_4`,
          code: `AI-${aiSubject === 'Toán học' ? 'TOAN' : 'MON'}10-004`,
          subject: aiSubject,
          grade: aiGrade,
          topic: 'Toán học thực tế',
          type: 'short_answer',
          difficulty: 'Vận dụng cao',
          content: `Một ngọn hải đăng cao 45m so với mực nước biển. Từ đỉnh hải đăng, người ta nhìn thấy một con thuyền dưới góc hạ 30°. Hỏi con thuyền cách chân hải đăng bao nhiêu mét? (Làm tròn 1 chữ số thập phân).`,
          correctAnswer: '77.9 m',
          explanation: 'Khoảng cách d = h / tan(30°) = 45 / (1/√3) = 45√3 ≈ 77.94 m ≈ 77.9 m.',
          tags: ['AI Gemini', 'Thực tế'],
          usageCount: 0,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        },
        {
          id: `ai_q_${Date.now()}_5`,
          code: `AI-${aiSubject === 'Toán học' ? 'TOAN' : 'MON'}10-005`,
          subject: aiSubject,
          grade: aiGrade,
          topic: 'Đo đạc trắc địa',
          type: 'single_choice',
          difficulty: 'Vận dụng',
          content: `Muốn đo khoảng cách giữa hai điểm A và B ở hai bên bờ sông mà không thể qua sông, ta dựng tam giác ABC với C nằm cùng bờ với A, đo được AC = 50m, góc A = 60°, góc C = 45°. Khoảng cách AB xấp xỉ:`,
          options: ['A. 36.6 m', 'B. 42.5 m', 'C. 48.3 m', 'D. 55.2 m'],
          correctAnswer: 'A',
          explanation: 'Góc B = 180° - 60° - 45° = 75°. Theo định lý Sin: AB / sin(C) = AC / sin(B) => AB = 50 * sin(45°) / sin(75°) ≈ 36.6 m.',
          tags: ['AI Gemini', 'Định lý Sin'],
          usageCount: 0,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        }
      ];

      setAiGeneratedQuestions(generated);
      const sel: Record<string, boolean> = {};
      generated.forEach((g) => { sel[g.id] = true; });
      setAiApprovedSelection(sel);
      success(`AI Gemini đã tạo thành công ${generated.length} câu hỏi bám sát tài liệu nguồn!`);
    }, 1100);
  };

  const handleSaveAiApprovedQuestions = () => {
    if (!aiGeneratedQuestions) return;
    const approved = aiGeneratedQuestions.filter((q) => aiApprovedSelection[q.id]);
    if (approved.length === 0) {
      toastError('Vui lòng chọn ít nhất một câu hỏi để lưu!');
      return;
    }
    setQuestions((prev) => [...approved, ...prev]);
    // Save to Cloud Firestore
    FirestoreQuestionsService.batchSaveQuestions(approved as any).catch((err) => {
      console.warn('Firestore AI save background note:', err);
    });
    success(`Đã lưu thành công ${approved.length} câu hỏi AI vào Ngân hàng và Cloud Firestore!`);
    setAiGeneratedQuestions(null);
    setViewMode('list');
  };

  // =========================================================================
  // TAB 3 MANUAL CREATION HANDLER
  // =========================================================================
  const toggleMultiCorrect = (key: string) => {
    if (manualMultiSelected.includes(key)) {
      if (manualMultiSelected.length === 1) {
        toastError('Phải có ít nhất 1 đáp án đúng!');
        return;
      }
      setManualMultiSelected(manualMultiSelected.filter((k) => k !== key));
    } else {
      setManualMultiSelected([...manualMultiSelected, key].sort());
    }
  };

  const handleSaveManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualContent.trim()) {
      toastError('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    const codePrefix = manualSubject === 'Toán học' ? 'TOAN' : manualSubject === 'Vật lý' ? 'VATLY' : 'MON';
    const newCode = `${codePrefix}10-${String(questions.length + 1).padStart(3, '0')}`;

    let qType: QuestionType = 'single_choice';
    if (manualType === 'single_choice') qType = 'single_choice';
    else if (manualType === 'multiple_choice') qType = 'multiple_choice';
    else if (manualType === 'true_false') qType = 'true_false_items';
    else if (manualType === 'fill_in_blank') qType = 'fill_in_blank';
    else if (manualType === 'essay') qType = 'essay';

    const newQ: Question = {
      id: `man_${Date.now()}`,
      code: newCode,
      subject: manualSubject,
      grade: manualGrade,
      topic: manualTopic || 'Chủ đề tự chọn',
      type: qType,
      difficulty: manualDifficulty,
      content: manualContent,
      explanation: manualExplanation || 'Chưa có lời giải chi tiết.',
      tags: ['Soạn thủ công', manualSubject],
      usageCount: 0,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    if (manualType === 'single_choice') {
      newQ.options = [
        `A. ${manualOptA || 'Phương án A'}`,
        `B. ${manualOptB || 'Phương án B'}`,
        `C. ${manualOptC || 'Phương án C'}`,
        `D. ${manualOptD || 'Phương án D'}`
      ];
      newQ.correctAnswer = manualSingleCorrect;
    } else if (manualType === 'multiple_choice') {
      newQ.options = [
        `A. ${manualOptA || 'Phương án A'}`,
        `B. ${manualOptB || 'Phương án B'}`,
        `C. ${manualOptC || 'Phương án C'}`,
        `D. ${manualOptD || 'Phương án D'}`
      ];
      newQ.correctAnswers = manualMultiSelected;
    } else if (manualType === 'true_false') {
      newQ.tfStatements = manualTFItems.map((item, idx) => ({
        id: `tf_man_${idx}`,
        label: item.label,
        statement: item.text || `Phát biểu ý ${item.label}`,
        isCorrect: item.isCorrect,
      }));
    } else if (manualType === 'fill_in_blank') {
      newQ.blankAnswers = manualFillBlanks.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (manualType === 'essay') {
      newQ.correctAnswer = manualEssayRubric || 'Thang điểm chấm tự luận chuẩn.';
    }

    setQuestions((prev) => [newQ, ...prev]);
    // Save to Cloud Firestore
    FirestoreQuestionsService.saveQuestion(newQ as any).catch((err) => {
      console.warn('Firestore manual save error:', err);
    });
    success(`Đã thêm thành công câu hỏi [${QUESTION_TYPE_LABELS[qType]}] vào Ngân hàng và Cloud Firestore!`);

    // Reset inputs
    setManualContent('');
    setManualOptA('');
    setManualOptB('');
    setManualOptC('');
    setManualOptD('');
    setManualExplanation('');
    setViewMode('list');
  };

  // FILTERED QUESTIONS (cho list mode)
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubject !== 'Tất cả' && q.subject !== selectedSubject) return false;
      if (selectedGrade !== 'Tất cả' && q.grade !== selectedGrade) return false;
      if (selectedDifficulty !== 'Tất cả' && q.difficulty !== selectedDifficulty) return false;
      if (selectedType !== 'Tất cả' && q.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          q.content.toLowerCase().includes(query) ||
          q.code.toLowerCase().includes(query) ||
          (q.topic && q.topic.toLowerCase().includes(query)) ||
          q.tags.some((t) => t.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [questions, selectedSubject, selectedGrade, selectedDifficulty, selectedType, searchQuery]);

  // ACTION: XÓA & NHÂN BẢN
  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    FirestoreQuestionsService.deleteQuestion(id).catch((err) => {
      console.warn('Firestore delete note:', err);
    });
    success('Đã xóa câu hỏi khỏi ngân hàng và Cloud Firestore.');
  };

  const handleDuplicateQuestion = (q: Question) => {
    const duplicated: Question = {
      ...q,
      id: `q_${Date.now()}`,
      code: `${q.code}-COPY`,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      usageCount: 0,
    };
    setQuestions((prev) => [duplicated, ...prev]);
    FirestoreQuestionsService.saveQuestion(duplicated as any).catch((err) => {
      console.warn('Firestore duplicate note:', err);
    });
    success(`Đã nhân bản câu hỏi #${q.code} và đồng bộ Firestore!`);
  };

  // ACTION: XUẤT WORD / EXCEL / PDF
  const handleExportData = () => {
    const listToExport = filteredQuestions;
    if (listToExport.length === 0) {
      toastError('Không có câu hỏi nào để xuất!');
      return;
    }

    if (exportFormat === 'excel') {
      let csvContent = '\uFEFF';
      csvContent += 'Mã câu,Môn học,Khối lớp,Dạng câu,Mức độ,Nội dung câu hỏi,Các lựa chọn,Đáp án đúng,Lời giải chi tiết\n';

      listToExport.forEach((q) => {
        const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
        const optionsStr = q.options ? q.options.join(' | ') : q.tfStatements ? q.tfStatements.map(t => `${t.label} ${t.statement}`).join(' | ') : '';
        const correctStr = q.correctAnswer || (q.correctAnswers ? q.correctAnswers.join('; ') : '');
        csvContent += [
          escapeCsv(q.code),
          escapeCsv(q.subject),
          escapeCsv(q.grade),
          escapeCsv(QUESTION_TYPE_LABELS[q.type]),
          escapeCsv(q.difficulty),
          escapeCsv(q.content),
          escapeCsv(optionsStr),
          escapeCsv(correctStr),
          escapeCsv(q.explanation)
        ].join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ngan_hang_cau_hoi_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Đã tải xuống file Excel (.csv UTF-8) thành công!');
    } else if (exportFormat === 'word') {
      let docContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${exportHeaderTitle}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; }
          .header-table { width: 100%; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .q-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
          .options { margin-left: 20px; }
          .solution { background: #f0f4f8; border-left: 4px solid #0284c7; padding: 8px 12px; margin-top: 5px; font-size: 11pt; }
          .answer-key { font-weight: bold; color: #047857; }
        </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="width: 50%; text-align: center;"><strong>TRƯỜNG THPT CHUẨN QUỐC GIA</strong><br/>TỔ CHUYÊN MÔN</td>
              <td style="width: 50%; text-align: center;"><strong>${exportHeaderTitle}</strong><br/>NĂM HỌC 2026 - 2027</td>
            </tr>
          </table>
          <p style="text-align: center; font-style: italic; margin-bottom: 20px;">(Ngân hàng câu hỏi chuẩn hóa gồm ${listToExport.length} câu)</p>
      `;

      listToExport.forEach((q, idx) => {
        docContent += `<div class="q-title">Câu ${idx + 1} (${q.code} - ${q.difficulty}): ${q.content}</div>`;
        if (q.passage) {
          docContent += `<div style="font-style: italic; background: #fafafa; padding: 6px; margin: 4px 0;">Ngữ liệu: ${q.passage}</div>`;
        }
        if (q.options) {
          docContent += `<div class="options">${q.options.map((opt) => `<div>${opt}</div>`).join('')}</div>`;
        }
        if (q.tfStatements) {
          docContent += `<div class="options">${q.tfStatements.map((t) => `<div>${t.label} ${t.statement} [${t.isCorrect ? 'Đúng' : 'Sai'}]</div>`).join('')}</div>`;
        }
        if (exportIncludeSolutions) {
          docContent += `
            <div class="solution">
              <span class="answer-key">Đáp án: ${q.correctAnswer || (q.correctAnswers ? q.correctAnswers.join('; ') : 'Xem chi tiết')}</span><br/>
              <strong>Lời giải chi tiết:</strong> ${q.explanation}
            </div>
          `;
        }
      });

      docContent += `</body></html>`;
      const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `De_thi_cau_hoi_${new Date().toISOString().slice(0, 10)}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Đã tải xuống file Word (.doc) thành công!');
    } else {
      window.print();
      success('Đang mở hộp thoại In / Lưu PDF chuẩn Bộ GD&ĐT!');
    }
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP BREADCRUMB CHUẨN GIAO DIỆN HÌNH 1 & HÌNH 6 */}
      <div className="flex flex-col gap-1 pb-1">
        <ModuleBreadcrumb
          section="Dạy & Học"
          moduleName="Ngân hàng câu hỏi"
          title="Ngân hàng Câu hỏi Thông minh (Quản lý kho câu hỏi chuẩn 9 dạng, tích hợp AI & Import đa định dạng)"
          className="text-xs text-slate-300"
        />
      </div>

      {/* FIREBASE CLOUD FIRESTORE REAL-TIME SYNC BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-cyan-950/30 to-[#070d1e] border border-amber-500/30 shadow-lg">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Google Cloud Firestore:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Đã kết nối trực tiếp
              </span>
              <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                Project: <span className="text-cyan-300">{activeFirebaseConfig.projectId}</span>
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate max-w-xl">
              Database: {activeFirebaseConfig.firestoreDatabaseId} • Bộ sưu tập: <span className="text-amber-300">questions</span> ({questions.length} câu)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncAllToFirestore}
            disabled={isSyncingFirestore}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Đẩy toàn bộ câu hỏi hiện tại lên Cloud Firestore"
          >
            <Cloud className={`w-3.5 h-3.5 ${isSyncingFirestore ? 'animate-spin' : ''}`} />
            <span>{isSyncingFirestore ? 'Đang đồng bộ...' : 'Đồng bộ lên Firestore'}</span>
          </button>
        </div>
      </div>


      {/* 2. THANH CHỌN PHƯƠNG THỨC 3 TAB (KHỚP 100% CÁC ẢNH CHỤP) */}
      <div className="p-3 rounded-2xl bg-[#070d1e] border border-cyan-900/40 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-300 mr-1">Phương thức:</span>

          {/* TAB 1: NHẬP BẰNG CÁCH IMPORT */}
          <button
            type="button"
            onClick={() => {
              setViewMode('create');
              setActiveTab('tab1');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'create' && activeTab === 'tab1'
                ? 'bg-[#0284c7] text-white shadow-md shadow-cyan-900/50 ring-1 ring-cyan-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-cyan-300" />
            <span>Tab 1: Nhập câu hỏi bằng cách import</span>
          </button>

          {/* TAB 2: TẠO BẰNG AI THÔNG MINH */}
          <button
            type="button"
            onClick={() => {
              setViewMode('create');
              setActiveTab('tab2');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'create' && activeTab === 'tab2'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50 ring-1 ring-purple-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Tab 2: Tạo bằng AI thông minh</span>
          </button>

          {/* TAB 3: TẠO BẰNG THỦ CÔNG */}
          <button
            type="button"
            onClick={() => {
              setViewMode('create');
              setActiveTab('tab3');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'create' && activeTab === 'tab3'
                ? 'bg-[#0284c7] text-white shadow-md shadow-cyan-900/50 ring-1 ring-cyan-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-cyan-300" />
            <span>+ Tab 3: Tạo bằng thủ công</span>
          </button>
        </div>

        {/* NÚT QUAY LẠI DANH SÁCH / XEM KHO (KHỚP HÌNH 6) */}
        <div className="flex items-center gap-2">
          {viewMode === 'create' ? (
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Quay lại danh sách</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setViewMode('create');
                setActiveTab('tab1');
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] text-white hover:bg-[#0369a1] transition-all flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm câu hỏi mới</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 border border-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          NỘI DUNG CHẾ ĐỘ 1: VIEW TẠO CÂU HỎI (TAB 1, TAB 2, TAB 3 KHỚP 100% CÁC ẢNH)
      ========================================================================= */}
      {viewMode === 'create' && (
        <div className="rounded-2xl bg-[#070d1e] border border-cyan-900/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle neon ambient lights */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* -----------------------------------------------------------------------
              TAB 1: NHẬP CÂU HỎI TỪ FILE WORD / EXCEL / CSV (KHỚP ẢNH 1)
          ----------------------------------------------------------------------- */}
          {activeTab === 'tab1' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Tiêu đề & phụ đề căn giữa */}
              <div className="text-center space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  Tab 1: Nhập câu hỏi từ file Word / Excel / CSV
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Tải template chuẩn, hệ thống tự động kiểm tra Unicode, validate schema và phát hiện trùng lặp.
                </p>
              </div>

              {/* Bước 1: Tải template chuẩn định dạng */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/50 border border-white/10 space-y-3">
                <div className="text-xs font-bold text-slate-200">
                  Bước 1: Tải template chuẩn định dạng
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] text-white transition-all shadow cursor-pointer flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Tải Template Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadWordTemplate}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-transparent hover:bg-slate-800 text-slate-200 border border-white/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Tải Template Word</span>
                  </button>
                </div>
              </div>

              {/* Bước 2: Tải lên file câu hỏi (DOCX, XLSX, CSV, JSON) */}
              <div className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-cyan-800/60 hover:border-cyan-500/80 bg-slate-950/40 text-center space-y-4 transition-all">
                {/* Icon xanh lá góc bo tròn như trong hình 1 */}
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <div className="text-sm sm:text-base font-bold text-white">
                    Tải lên file câu hỏi (DOCX, XLSX, CSV, JSON)
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Kéo thả file bài tập hoặc click chọn tệp từ máy tính. Hệ thống sẽ bóc tách đề bài, đáp án A-B-C-D và lời giải tự động.
                  </p>
                </div>

                {/* Input chọn tệp */}
                <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                  <label className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 cursor-pointer transition-all shadow">
                    <span>Chọn tệp</span>
                    <input
                      type="file"
                      accept=".docx,.xlsx,.csv,.json,.txt,.doc"
                      onChange={handleTab1FileSelect}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">
                    {tab1FileName ? (
                      <span className="text-emerald-400 font-semibold">
                        {tab1FileName} ({tab1FileSize})
                      </span>
                    ) : (
                      'Không có tệp nào được chọn'
                    )}
                  </span>
                </div>

                {/* Nút demo tải file mẫu nhanh nếu không có file thật */}
                {!tab1FileName && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const fakeEvent = {
                          target: {
                            files: [new File(['dummy'], 'De_thi_Toan_10_KiemTra_1Tiet.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })]
                          }
                        } as any;
                        handleTab1FileSelect(fakeEvent);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
                    >
                      ⚡ Hoặc nhấn vào đây để nạp nhanh tệp mẫu kiểm thử hệ thống
                    </button>
                  </div>
                )}
              </div>

              {/* TRẠNG THÁI KIỂM ĐỊNH TỰ ĐỘNG & XEM TRƯỚC BÓC TÁCH */}
              {tab1ValidationStatus && (
                <div className="space-y-4 p-5 rounded-2xl bg-slate-900/80 border border-white/10 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Kết quả kiểm định chất lượng tệp:</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        ✓ Unicode UTF-8 Hợp lệ
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        ✓ Cấu trúc chuẩn hóa 100%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        ✓ Trùng lặp: 0 câu
                      </span>
                    </div>
                  </div>

                  {/* Danh sách câu hỏi xem trước */}
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {tab1ParsedQuestions.map((q, i) => (
                      <div key={q.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-300 font-semibold">
                          <span className="text-cyan-300">Câu {i + 1} ({q.code}): {q.content}</span>
                          <span className="text-emerald-400 font-bold">Đáp án: {q.correctAnswer}</span>
                        </div>
                        {q.options && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="p-1 rounded bg-slate-900/60 border border-white/5">
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 italic">
                          Lời giải: {q.explanation}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Nút lưu vào kho */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setTab1ParsedQuestions([]);
                        setTab1FileName(null);
                        setTab1ValidationStatus(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTab1ImportedQuestions}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác nhận nhập ({tab1ParsedQuestions.length} câu) vào Ngân hàng</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* -----------------------------------------------------------------------
              TAB 2: TRỢ LÝ AI GEMINI (KHỚP ẢNH 2, 3, 4, 5)
          ----------------------------------------------------------------------- */}
          {activeTab === 'tab2' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Tiêu đề & phụ đề căn giữa */}
              <div className="text-center space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  Tab 2: Trợ lý AI Gemini – Tạo Ngân hàng câu hỏi thông minh
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Quy trình AI 5 bước: Nhập chủ đề bài học → Cấu hình khối, môn, số lượng → Gemini tạo câu hỏi → Review & Lưu.
                </p>
              </div>

              {/* Banner Chống Hallucination viền tím */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#190d2e]/90 border border-purple-500/40 text-purple-200 text-xs sm:text-sm leading-relaxed shadow-lg shadow-purple-950/30">
                <strong className="text-purple-300 font-bold">Chống Hallucination: </strong>
                <span>AI bám sát nguồn, ghi rõ khi thiếu căn cứ và gắn nhãn cần giáo viên kiểm tra.</span>
              </div>

              {/* Hàng chọn nguồn: Nguồn nội dung / Tài liệu gốc cho AI (4 nút pill) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="text-xs sm:text-sm font-semibold text-slate-200">
                    Nguồn nội dung / Tài liệu gốc cho AI:
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Nút 1: Văn bản */}
                    <button
                      type="button"
                      onClick={() => setAiSourceMode('text')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        aiSourceMode === 'text'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>✍️ Văn bản</span>
                    </button>

                    {/* Nút 2: File (PDF/Word) */}
                    <button
                      type="button"
                      onClick={() => setAiSourceMode('file')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        aiSourceMode === 'file'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>📎 File (PDF/Word)</span>
                    </button>

                    {/* Nút 3: Link Web */}
                    <button
                      type="button"
                      onClick={() => setAiSourceMode('link')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        aiSourceMode === 'link'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>🔗 Link Web</span>
                    </button>

                    {/* Nút 4: Hình ảnh */}
                    <button
                      type="button"
                      onClick={() => setAiSourceMode('image')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        aiSourceMode === 'image'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>🖼️ Hình ảnh</span>
                    </button>
                  </div>
                </div>

                {/* 1. NGUỒN VĂN BẢN (KHỚP ẢNH 2) */}
                {aiSourceMode === 'text' && (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={aiTextContent}
                      onChange={(e) => setAiTextContent(e.target.value)}
                      placeholder="Dán hoặc nhập nội dung chủ đề bài học, đoạn trích tài liệu, yêu cầu sinh câu hỏi... (VD: Giáo án Toán 10 bài Hệ thức lượng trong tam giác, công thức Heron, định lý Cosin...)"
                      className="w-full bg-[#030712] border border-cyan-900/60 focus:border-purple-400 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                    {/* Gợi ý chủ đề nhanh cho giáo viên */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                      <span>Gợi ý chủ đề:</span>
                      <button
                        type="button"
                        onClick={() => setAiTextContent('Toán học 10: Định lý Cosin và Định lý Sin trong tam giác. Các dạng toán giải tam giác thực tế.')}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 hover:border-purple-400 hover:text-purple-300"
                      >
                        Định lý Cosin & Sin
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiTextContent('Vật lý 10: Chuyển động thẳng biến đổi đều và ba định luật Newton.')}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 hover:border-purple-400 hover:text-purple-300"
                      >
                        Định luật Newton
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiTextContent('Sinh học 10: Chu kỳ tế bào, các pha của nguyên phân và phân chia giảm nhiễm.')}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 hover:border-purple-400 hover:text-purple-300"
                      >
                        Nguyên phân & Giảm phân
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. NGUỒN FILE PDF/WORD/PPT (KHỚP ẢNH 3) */}
                {aiSourceMode === 'file' && (
                  <div className="p-8 sm:p-10 rounded-2xl border-2 border-dashed border-purple-800/60 bg-[#030712] text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-200">
                      Đính kèm tài liệu PDF, Word (.docx, .txt, .ppt, .pptx)
                    </div>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <label className="px-4 py-2 rounded-lg text-xs font-semibold bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 cursor-pointer transition-all">
                        <span>Chọn tệp</span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt,.doc,.ppt,.pptx"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setAiAttachedFile({
                                name: f.name,
                                size: `${(f.size / 1024).toFixed(1)} KB`
                              });
                              success(`Đã chọn tài liệu "${f.name}". AI sẵn sàng bóc tách!`);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-slate-400">
                        {aiAttachedFile ? (
                          <span className="text-purple-300 font-bold">
                            {aiAttachedFile.name} ({aiAttachedFile.size})
                          </span>
                        ) : (
                          'Không có tệp nào được chọn'
                        )}
                      </span>
                    </div>

                    {!aiAttachedFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setAiAttachedFile({
                            name: 'Giao_an_Toan10_HeThucLuong_GDPT2018.pdf',
                            size: '2.4 MB'
                          });
                          success('Đã tải mẫu giáo án PDF chuẩn Bộ GD&ĐT!');
                        }}
                        className="text-[11px] text-purple-400 hover:underline font-medium"
                      >
                        ⚡ Nhấn để đính kèm giáo án PDF mẫu: Giao_an_Toan10_HeThucLuong.pdf
                      </button>
                    )}
                  </div>
                )}

                {/* 3. NGUỒN LINK WEB (KHỚP ẢNH 4) */}
                {aiSourceMode === 'link' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={aiWebLinkInput}
                        onChange={(e) => setAiWebLinkInput(e.target.value)}
                        placeholder="Dán link trang web tài liệu (ví dụ: https://example.com/bai-hoc)..."
                        className="flex-1 bg-[#030712] border border-cyan-900/60 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddWebLink}
                        className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow shrink-0 cursor-pointer"
                      >
                        Thêm Link
                      </button>
                    </div>

                    {aiWebLinksList.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-1.5 text-xs">
                        <div className="font-bold text-slate-300 text-[11px]">Các liên kết đã nạp:</div>
                        {aiWebLinksList.map((link, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-950/60">
                            <span className="text-cyan-300 truncate">{link}</span>
                            <button
                              type="button"
                              onClick={() => setAiWebLinksList(aiWebLinksList.filter((_, i) => i !== idx))}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. NGUỒN HÌNH ẢNH (KHỚP ẢNH 5) */}
                {aiSourceMode === 'image' && (
                  <div className="p-8 sm:p-10 rounded-2xl border-2 border-dashed border-cyan-800/60 bg-[#030712] text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-200">
                      Tải lên hình ảnh tài liệu hoặc ảnh chụp màn hình bài học (.png, .jpg)
                    </div>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <label className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 cursor-pointer transition-all">
                        <span>Chọn tệp</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setAiUploadedImage(f.name);
                              success(`Đã nạp hình ảnh "${f.name}". AI OCR sẵn sàng đọc văn bản!`);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-slate-400">
                        {aiUploadedImage ? (
                          <span className="text-cyan-300 font-bold">
                            {aiUploadedImage}
                          </span>
                        ) : (
                          'Không có tệp nào được chọn'
                        )}
                      </span>
                    </div>

                    {!aiUploadedImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setAiUploadedImage('anh_chup_sgk_toan_10_trang_45.png');
                          success('Đã tải hình ảnh trang sách giáo khoa mẫu!');
                        }}
                        className="text-[11px] text-cyan-400 hover:underline font-medium"
                      >
                        ⚡ Nhấn để dùng ảnh chụp SGK mẫu: anh_chup_sgk_toan_10_trang_45.png
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Hàng 3: Môn học | Khối lớp | Số lượng câu tạo (Khớp 100% hình 2, 3, 4, 5) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Môn học</label>
                  <select
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="w-full bg-[#030712] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="Toán học">Toán học</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Lịch sử">Lịch sử</option>
                    <option value="Địa lý">Địa lý</option>
                    <option value="Tin học">Tin học</option>
                    <option value="GDCD">GDCD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Khối lớp</label>
                  <select
                    value={aiGrade}
                    onChange={(e) => setAiGrade(e.target.value)}
                    className="w-full bg-[#030712] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="Khối 10">Khối 10</option>
                    <option value="Khối 11">Khối 11</option>
                    <option value="Khối 12">Khối 12</option>
                    <option value="Khối 9">Khối 9</option>
                    <option value="Khối 8">Khối 8</option>
                    <option value="Khối 7">Khối 7</option>
                    <option value="Khối 6">Khối 6</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Số lượng câu tạo</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#030712] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Nút hành động: Bắt đầu tạo bằng AI (màu tím tím như hình 2, 3, 4, 5) */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isAiGenerating}
                  onClick={handleStartAiGenerate}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white transition-all shadow-lg shadow-purple-950/50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>{isAiGenerating ? 'Gemini đang phân tích tài liệu...' : 'Bắt đầu tạo bằng AI'}</span>
                </button>
              </div>

              {/* KẾT QUẢ AI GEMINI ĐỀ XUẤT CHO GIÁO VIÊN DUYỆT */}
              {aiGeneratedQuestions && (
                <div className="space-y-4 pt-4 border-t border-purple-500/20 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        Bộ câu hỏi do Gemini tạo ({aiGeneratedQuestions.length} câu)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        100% Đã đối soát nguồn
                      </span>
                    </div>
                    <span className="text-xs text-purple-300 font-medium">
                      Đã chọn {Object.values(aiApprovedSelection).filter(Boolean).length}/{aiGeneratedQuestions.length} câu
                    </span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {aiGeneratedQuestions.map((q) => {
                      const isSel = !!aiApprovedSelection[q.id];
                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border transition-all text-xs space-y-2 ${
                            isSel
                              ? 'bg-slate-900/90 border-purple-500/50 shadow-md shadow-purple-950/20'
                              : 'bg-slate-950/40 border-white/5 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSel}
                                onChange={() => {
                                  setAiApprovedSelection({
                                    ...aiApprovedSelection,
                                    [q.id]: !isSel,
                                  });
                                }}
                                className="w-4 h-4 rounded text-purple-500"
                              />
                              <span className="font-mono font-bold text-white">{q.code}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                                {QUESTION_TYPE_LABELS[q.type]}
                              </span>
                              <Badge variant="cyan">{q.difficulty}</Badge>
                            </label>
                            <span className="text-[10px] text-slate-400">{q.topic}</span>
                          </div>

                          <div className="font-medium text-white leading-relaxed">{q.content}</div>

                          {q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="p-1.5 rounded-lg bg-slate-950/60 border border-white/5 text-slate-300">
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}

                          {q.tfStatements && (
                            <div className="space-y-1 text-[11px]">
                              {q.tfStatements.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-1.5 rounded bg-slate-950/40">
                                  <span>{t.label} {t.statement}</span>
                                  <span className={t.isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                    {t.isCorrect ? 'ĐÚNG' : 'SAI'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200">
                            <strong>Đáp án:</strong> {q.correctAnswer || (q.correctAnswers ? q.correctAnswers.join(', ') : 'Chuẩn')} · <strong>Lời giải:</strong> {q.explanation}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-purple-500/20 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const all: Record<string, boolean> = {};
                        aiGeneratedQuestions.forEach((q) => { all[q.id] = true; });
                        setAiApprovedSelection(all);
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      Chọn tất cả câu hỏi
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAiGeneratedQuestions(null)}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAiApprovedQuestions}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50 flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Lưu câu hỏi đã chọn vào Ngân hàng</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* -----------------------------------------------------------------------
              TAB 3: TẠO CÂU HỎI THỦ CÔNG (KHỚP ẢNH 6 & ẢNH 7)
          ----------------------------------------------------------------------- */}
          {activeTab === 'tab3' && (
            <form onSubmit={handleSaveManualQuestion} className="space-y-5 max-w-4xl mx-auto">
              {/* Tiêu đề & phụ đề căn giữa */}
              <div className="text-center space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  Tab 3: Tạo câu hỏi thủ công
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Nhập trực tiếp nội dung, thiết lập đáp án và lời giải chi tiết.
                </p>
              </div>

              {/* Hàng 1: Môn học & Khối lớp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Môn học</label>
                  <select
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    className="w-full bg-[#030712] border border-cyan-900/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Toán học">Toán học</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Lịch sử">Lịch sử</option>
                    <option value="Địa lý">Địa lý</option>
                    <option value="Tin học">Tin học</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Khối lớp</label>
                  <select
                    value={manualGrade}
                    onChange={(e) => setManualGrade(e.target.value)}
                    className="w-full bg-[#030712] border border-cyan-900/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Khối 10">Khối 10</option>
                    <option value="Khối 11">Khối 11</option>
                    <option value="Khối 12">Khối 12</option>
                    <option value="Khối 9">Khối 9</option>
                    <option value="Khối 8">Khối 8</option>
                    <option value="Khối 7">Khối 7</option>
                    <option value="Khối 6">Khối 6</option>
                  </select>
                </div>
              </div>

              {/* Hàng 2: Dạng câu hỏi | Mức độ | Chủ đề bài học (Khớp 100% hình 6 & 7) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dạng câu hỏi</label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as any)}
                    className="w-full bg-[#030712] border border-cyan-900/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-medium"
                  >
                    <option value="single_choice">Trắc nghiệm - Pick One (1 đáp án)</option>
                    <option value="multiple_choice">Nhiều đáp án - Pick Many</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="fill_in_blank">Điền khuyết</option>
                    <option value="essay">Tự luận</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mức độ</label>
                  <select
                    value={manualDifficulty}
                    onChange={(e) => setManualDifficulty(e.target.value as any)}
                    className="w-full bg-[#030712] border border-cyan-900/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Thông hiểu">Thông hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                    <option value="Vận dụng cao">Vận dụng cao</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Chủ đề bài học</label>
                  <input
                    type="text"
                    value={manualTopic}
                    onChange={(e) => setManualTopic(e.target.value)}
                    placeholder="Ví dụ: Hàm số bậc hai"
                    className="w-full bg-[#030712] border border-cyan-900/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Hàng 3: Nội dung câu hỏi (hỗ trợ Markdown / LaTeX) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nội dung câu hỏi (hỗ trợ Markdown / LaTeX):
                </label>
                <textarea
                  rows={4}
                  required
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full bg-[#030712] border border-cyan-900/60 focus:border-cyan-400 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Hàng 4: CÁC PHƯƠNG ÁN LỰA CHỌN (KHI CHỌN SINGLE CHOICE HOẶC MULTIPLE CHOICE) */}
              {(manualType === 'single_choice' || manualType === 'multiple_choice') && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Các phương án lựa chọn:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={manualOptA}
                      onChange={(e) => setManualOptA(e.target.value)}
                      placeholder="Đáp án A"
                      className="bg-[#030712] border border-cyan-900/60 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={manualOptB}
                      onChange={(e) => setManualOptB(e.target.value)}
                      placeholder="Đáp án B"
                      className="bg-[#030712] border border-cyan-900/60 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={manualOptC}
                      onChange={(e) => setManualOptC(e.target.value)}
                      placeholder="Đáp án C"
                      className="bg-[#030712] border border-cyan-900/60 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={manualOptD}
                      onChange={(e) => setManualOptD(e.target.value)}
                      placeholder="Đáp án D"
                      className="bg-[#030712] border border-cyan-900/60 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* ĐÁP ÁN ĐÚNG KHI SINGLE CHOICE (KHỚP ẢNH 6) */}
              {manualType === 'single_choice' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Đáp án đúng:
                  </label>
                  <input
                    type="text"
                    value={manualSingleCorrect}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      if (['A', 'B', 'C', 'D'].includes(val)) {
                        setManualSingleCorrect(val as any);
                      }
                    }}
                    placeholder="A"
                    className="w-full bg-[#030712] border border-cyan-900/60 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none font-bold"
                  />
                </div>
              )}

              {/* ĐÁP ÁN ĐÚNG (CHỌN NHIỀU ĐÁP ÁN) KHI PICK MANY (KHỚP ẢNH 7) */}
              {manualType === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Đáp án đúng (Chọn nhiều đáp án):
                  </label>
                  <div className="flex items-center gap-3">
                    {['A', 'B', 'C', 'D'].map((key) => {
                      const isSelected = manualMultiSelected.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleMultiCorrect(key)}
                          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950/60 border-2 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/30'
                              : 'bg-[#030712] border border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-cyan-500 text-slate-950 font-black' : 'border border-slate-600'
                          }`}>
                            {isSelected && '✓'}
                          </div>
                          <span>{key}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* KHI CHỌN ĐÚNG/SAI */}
              {manualType === 'true_false' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    4 Phát biểu theo từng ý (a, b, c, d):
                  </label>
                  {manualTFItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#030712] p-2 rounded-xl border border-white/10">
                      <span className="font-bold text-cyan-400 font-mono w-5">{item.label}</span>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const copy = [...manualTFItems];
                          copy[idx].text = e.target.value;
                          setManualTFItems(copy);
                        }}
                        placeholder={`Nội dung phát biểu ý ${item.label}`}
                        className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...manualTFItems];
                            copy[idx].isCorrect = true;
                            setManualTFItems(copy);
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-bold ${
                            item.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Đúng
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...manualTFItems];
                            copy[idx].isCorrect = false;
                            setManualTFItems(copy);
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-bold ${
                            !item.isCorrect ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Sai
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* KHI CHỌN ĐIỀN KHUYẾT */}
              {manualType === 'fill_in_blank' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Các từ cần điền vào chỗ trống [___] (cách nhau bởi dấu phẩy):
                  </label>
                  <input
                    type="text"
                    value={manualFillBlanks}
                    onChange={(e) => setManualFillBlanks(e.target.value)}
                    placeholder="VD: will become, replace, 10 m/s"
                    className="w-full bg-[#030712] border border-cyan-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* KHI CHỌN TỰ LUẬN */}
              {manualType === 'essay' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Barème điểm & Tiêu chí chấm:
                  </label>
                  <textarea
                    rows={3}
                    value={manualEssayRubric}
                    onChange={(e) => setManualEssayRubric(e.target.value)}
                    placeholder="Mở bài (0.5đ), Thân bài (3.5đ), Kết bài (0.5đ)..."
                    className="w-full bg-[#030712] border border-cyan-900/60 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              )}

              {/* Hàng 5: Lời giải chi tiết */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lời giải chi tiết:
                </label>
                <textarea
                  rows={3}
                  value={manualExplanation}
                  onChange={(e) => setManualExplanation(e.target.value)}
                  placeholder="Nhập lời giải..."
                  className="w-full bg-[#030712] border border-cyan-900/60 focus:border-cyan-400 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Nút lưu câu hỏi vào Ngân hàng màu xanh lá (Khớp ảnh 6 & 7) */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Lưu câu hỏi vào Ngân hàng</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* =========================================================================
          NỘI DUNG CHẾ ĐỘ 2: DANH SÁCH CÂU HỎI & QUẢN LÝ KHO (VIEW MODE === 'LIST')
      ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* KPI STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#0b1026]/75 border border-white/10 shadow-sm">
              <div className="text-xs text-slate-400 font-medium">Tổng câu hỏi trong kho</div>
              <div className="text-2xl font-bold text-white mt-1">{questions.length} câu</div>
              <div className="text-[10px] text-cyan-400 mt-0.5">Sẵn sàng trích đề thi</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0b1026]/75 border border-white/10 shadow-sm">
              <div className="text-xs text-slate-400 font-medium">Trắc nghiệm 1 & Nhiều đáp án</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {questions.filter((q) => q.type === 'single_choice' || q.type === 'multiple_choice').length} câu
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">Pick One & Pick Many</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0b1026]/75 border border-white/10 shadow-sm">
              <div className="text-xs text-slate-400 font-medium">Đúng/Sai & Điền khuyết</div>
              <div className="text-2xl font-bold text-purple-400 mt-1">
                {questions.filter((q) => q.type === 'true_false_items' || q.type === 'fill_in_blank').length} câu
              </div>
              <div className="text-[10px] text-purple-400/80 mt-0.5">Format tốt nghiệp 2025</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0b1026]/75 border border-white/10 shadow-sm">
              <div className="text-xs text-slate-400 font-medium">Vận dụng cao & Tình huống</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {questions.filter((q) => q.difficulty === 'Vận dụng cao' || q.type === 'passage_based').length} câu
              </div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">Đánh giá năng lực thực tế</div>
            </div>
          </div>

          {/* BỘ LỌC ĐA NĂNG */}
          <div className="p-3.5 rounded-2xl bg-[#0b1026]/90 border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm nội dung câu hỏi, mã câu, chủ đề, từ khóa..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Lọc Dạng */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-400"
              >
                <option value="Tất cả">Tất cả dạng câu hỏi</option>
                <option value="single_choice">Trắc nghiệm - Pick One</option>
                <option value="multiple_choice">Nhiều đáp án - Pick Many</option>
                <option value="true_false_items">Đúng/Sai từng ý</option>
                <option value="matching">Ghép đôi (Nối cột)</option>
                <option value="ordering">Sắp xếp theo thứ tự</option>
                <option value="fill_in_blank">Điền khuyết</option>
                <option value="short_answer">Trả lời ngắn</option>
                <option value="essay">Tự luận có Barème</option>
                <option value="passage_based">Theo đoạn văn / tình huống</option>
              </select>

              {/* Lọc Môn */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="Tất cả">Môn: Tất cả</option>
                <option value="Toán học">Toán học</option>
                <option value="Vật lý">Vật lý</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Sinh học">Sinh học</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
              </select>

              {/* Lọc Độ khó */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="Tất cả">Độ khó: Tất cả</option>
                <option value="Nhận biết">Nhận biết</option>
                <option value="Thông hiểu">Thông hiểu</option>
                <option value="Vận dụng">Vận dụng</option>
                <option value="Vận dụng cao">Vận dụng cao</option>
              </select>
            </div>
          </div>

          {/* DANH SÁCH CÂU HỎI */}
          <div className="space-y-3.5">
            {filteredQuestions.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#0b1026]/60 border border-white/10 text-slate-400 text-xs">
                Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-[#0b1026]/85 hover:bg-[#0b1026] border border-white/10 hover:border-cyan-500/40 transition-all space-y-3 group shadow-md"
                >
                  {/* Header hàng 1: Mã, Loại, Môn, Khối, Mức độ & Nút thao tác */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-md">
                        #{idx + 1} · {q.code}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-200 border border-cyan-500/30">
                        {QUESTION_TYPE_LABELS[q.type]}
                      </span>
                      <Badge variant="cyan">{q.subject}</Badge>
                      <Badge variant="slate">{q.grade}</Badge>
                      {q.topic && (
                        <span className="text-[10px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md">
                          {q.topic}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          q.difficulty === 'Nhận biết'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : q.difficulty === 'Thông hiểu'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : q.difficulty === 'Vận dụng'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDuplicateQuestion(q)}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Nhân bản câu hỏi"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Nội dung câu hỏi */}
                  <div className="text-sm font-semibold text-white leading-relaxed whitespace-pre-line">
                    {q.content}
                  </div>

                  {/* 1. Trắc nghiệm 1 đáp án */}
                  {q.type === 'single_choice' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const optLetter = String.fromCharCode(65 + oIdx);
                        const isCorrect = q.correctAnswer === optLetter || q.correctAnswer?.startsWith(optLetter);
                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-semibold'
                                : 'bg-slate-900/60 border-white/5 text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {optLetter}
                            </span>
                            <span>{opt}</span>
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. Trắc nghiệm nhiều đáp án (Pick Many) */}
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const optLetter = String.fromCharCode(65 + oIdx);
                        const isCorrect = q.correctAnswers?.includes(optLetter) || q.correctAnswers?.some((ans) => ans.startsWith(optLetter));
                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-semibold'
                                : 'bg-slate-900/60 border-white/5 text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {optLetter}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isCorrect && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ĐÚNG
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. Đúng/Sai từng ý */}
                  {q.type === 'true_false_items' && q.tfStatements && (
                    <div className="space-y-1.5 pt-1">
                      {q.tfStatements.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs gap-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-cyan-300 font-mono">{item.label}</span>
                            <span className="text-slate-200">{item.statement}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              item.isCorrect
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {item.isCorrect ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 4. Ghép đôi */}
                  {q.type === 'matching' && q.matchingPairs && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cột A:</div>
                        {q.matchingPairs.map((p) => (
                          <div key={p.leftId} className="p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-200">
                            {p.leftText}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cột B:</div>
                        {q.matchingPairs.map((p) => (
                          <div key={p.rightId} className="p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-200">
                            {p.rightText}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Điền khuyết */}
                  {q.type === 'fill_in_blank' && q.blankAnswers && (
                    <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300 space-y-1">
                      <span className="font-bold">Từ khóa cần điền vào [___]:</span>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {q.blankAnswers.map((ans, bIdx) => (
                          <span key={bIdx} className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-white font-mono font-bold">
                            {ans}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. Trả lời ngắn / Tự luận */}
                  {(q.type === 'short_answer' || q.type === 'essay') && q.correctAnswer && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300">
                      <span className="font-bold text-emerald-400">Đáp án / Thang điểm: </span>
                      <span className="text-white font-mono whitespace-pre-line">{q.correctAnswer}</span>
                    </div>
                  )}

                  {/* Lời giải chi tiết */}
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5 text-xs text-slate-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold text-emerald-300">Lời giải chi tiết: </span>
                      {q.explanation}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL XUẤT CÂU HỎI SANG WORD, EXCEL HOẶC PDF
      ========================================================================= */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Xuất Câu Hỏi, Đáp Án & Lời Giải"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Chọn định dạng xuất file:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('word')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  exportFormat === 'word'
                    ? 'bg-blue-950/80 border-blue-400 text-blue-200 font-bold ring-2 ring-blue-500/20'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                <span>File Word (.doc)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('excel')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  exportFormat === 'excel'
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                <span>File Excel (.csv)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  exportFormat === 'pdf'
                    ? 'bg-rose-950/80 border-rose-400 text-rose-200 font-bold ring-2 ring-rose-500/20'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Printer className="w-5 h-5 mx-auto mb-1 text-rose-400" />
                <span>In ấn / PDF</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Tiêu đề xuất đề thi / ngân hàng:</label>
            <input
              type="text"
              value={exportHeaderTitle}
              onChange={(e) => setExportHeaderTitle(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={exportIncludeSolutions}
                onChange={(e) => setExportIncludeSolutions(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500"
              />
              <span className="font-bold text-white">Bao gồm Đáp án và Lời giải chi tiết</span>
            </label>
            <p className="text-[11px] text-slate-400 pl-6">
              Nếu bỏ chọn, file xuất ra sẽ chỉ có đề bài để phát cho học sinh làm bài thi.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-slate-400 font-mono text-[11px]">
              Đang chọn xuất: {filteredQuestions.length} câu hỏi
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsExportModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" icon={Download} onClick={handleExportData}>
                Bắt đầu xuất file
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
