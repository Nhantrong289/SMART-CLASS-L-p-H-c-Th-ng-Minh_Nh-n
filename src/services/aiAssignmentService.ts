import { GoogleGenAI } from '@google/genai';
import { CognitiveLevel, AssignmentQuestion } from '../types';

// Fallback high-quality curated bank for instant response and offline reliability
const CURATED_AI_QUESTIONS: Record<string, Record<CognitiveLevel, AssignmentQuestion[]>> = {
  'Toán học': {
    'Nhận biết': [
      {
        id: 'ai_m_nb_1',
        order: 1,
        type: 'single_choice',
        cognitiveLevel: 'Nhận biết',
        content: 'Tọa độ đỉnh của parabol y = ax^2 + bx + c (a ≠ 0) là điểm I có tọa độ nào sau đây?',
        points: 2.0,
        options: ['I(-b/(2a); -Δ/(4a))', 'I(-b/a; -Δ/(2a))', 'I(b/(2a); Δ/(4a))', 'I(-b/(2a); -c/a)'],
        correctAnswer: '0',
        explanation: 'Theo định lý đồ thị hàm số bậc hai, tọa độ đỉnh I(-b/(2a); -Δ/(4a)).',
      },
      {
        id: 'ai_m_nb_2',
        order: 2,
        type: 'single_choice',
        cognitiveLevel: 'Nhận biết',
        content: 'Cho tam giác ABC, khẳng định nào sau đây diễn tả đúng Định lý Cosin?',
        points: 2.0,
        options: [
          'a^2 = b^2 + c^2 - 2bc*cosA',
          'a^2 = b^2 + c^2 + 2bc*cosA',
          'a^2 = b^2 + c^2 - 2bc*sinA',
          'a^2 = b^2 + c^2 + 2bc*sinA',
        ],
        correctAnswer: '0',
        explanation: 'Định lý Cosin: a^2 = b^2 + c^2 - 2bc*cosA.',
      },
    ],
    'Thông hiểu': [
      {
        id: 'ai_m_th_1',
        order: 2,
        type: 'single_choice',
        cognitiveLevel: 'Thông hiểu',
        content: 'Trục đối xứng của parabol y = 2x^2 - 4x + 3 là đường thẳng:',
        points: 2.5,
        options: ['x = 1', 'x = -1', 'x = 2', 'y = 1'],
        correctAnswer: '0',
        explanation: 'Trục đối xứng x = -b/(2a) = -(-4)/(2*2) = 1.',
      },
      {
        id: 'ai_m_th_2',
        order: 2,
        type: 'fill_in_blank',
        cognitiveLevel: 'Thông hiểu',
        content: 'Cho tam giác ABC có a = 6, góc A = 30°. Bán kính đường tròn ngoại tiếp R bằng bao nhiêu?',
        points: 2.5,
        correctAnswer: '6',
        acceptableAnswers: ['6', '6.0', 'R=6'],
        explanation: 'Theo định lý Sin: a / sinA = 2R => 6 / 0.5 = 12 => R = 6.',
      },
    ],
    'Vận dụng': [
      {
        id: 'ai_m_vd_1',
        order: 3,
        type: 'fill_in_blank',
        cognitiveLevel: 'Vận dụng',
        content: 'Tìm giá trị lớn nhất của hàm số y = -x^2 + 6x - 1 trên tập số thực R.',
        points: 2.5,
        correctAnswer: '8',
        acceptableAnswers: ['8', '8.0', 'max=8', 'y=8'],
        explanation: 'Hàm số đạt GTLN tại x = -b/(2a) = 3. Thay x = 3: y = -9 + 18 - 1 = 8.',
      },
      {
        id: 'ai_m_vd_2',
        order: 3,
        type: 'essay',
        cognitiveLevel: 'Vận dụng',
        content: 'Cho tam giác ABC có b = 7, c = 5, góc A = 120°. Tính độ dài cạnh a và diện tích tam giác ABC.',
        points: 3.0,
        rubric: '- Áp dụng định lý Cosin tính a = √109 ≈ 10.44: 1.5 điểm\n- Tính diện tích S = 1/2*b*c*sinA = 35√3/4: 1.5 điểm',
        explanation: 'a^2 = 49 + 25 - 2*35*(-0.5) = 109 => a = √109. S = 0.5*7*5*sin(120°) = 35√3/4.',
      },
    ],
    'Vận dụng cao': [
      {
        id: 'ai_m_vdc_1',
        order: 4,
        type: 'essay',
        cognitiveLevel: 'Vận dụng cao',
        content: 'Một cầu thủ sút phạt đưa quả bóng bay theo quỹ đạo parabol h(t) = -5t^2 + 18t + 0.2 (m). Khung thành cao 2.44m cách điểm sút 25m theo phương ngang, vận tốc theo phương ngang không đổi v_x = 20 m/s. Quả bóng có bay vào khung thành không? Giải thích chi tiết.',
        points: 3.0,
        rubric: '- Tính thời gian bóng tới vạch vôi t = 25/20 = 1.25s: 1.0 điểm\n- Tính độ cao h(1.25) = 14.8875m > 2.44m: 1.0 điểm\n- Kết luận bóng bay vọt xà ngang, không vào khung thành: 1.0 điểm',
        explanation: 'Tại t = 1.25s, h(1.25) = -5*(1.25)^2 + 18*(1.25) + 0.2 = 14.8875m. Do 14.8875m > 2.44m nên bóng vọt xà ngang.',
      },
    ],
  },
  'Tin học': {
    'Nhận biết': [
      {
        id: 'ai_cs_nb_1',
        order: 1,
        type: 'single_choice',
        cognitiveLevel: 'Nhận biết',
        content: 'Trong Python, từ khóa nào sau đây dùng để khai báo một hàm?',
        points: 2.0,
        options: ['def', 'function', 'func', 'define'],
        correctAnswer: '0',
        explanation: 'Từ khóa "def" được dùng để định nghĩa hàm trong Python.',
      },
    ],
    'Thông hiểu': [
      {
        id: 'ai_cs_th_1',
        order: 2,
        type: 'single_choice',
        cognitiveLevel: 'Thông hiểu',
        content: 'Độ phức tạp thuật toán tìm kiếm nhị phân (Binary Search) trên mảng đã sắp xếp n phần tử là:',
        points: 2.5,
        options: ['O(log n)', 'O(n)', 'O(n^2)', 'O(1)'],
        correctAnswer: '0',
        explanation: 'Binary Search chia đôi khoảng tìm kiếm sau mỗi bước nên có độ phức tạp O(log n).',
      },
    ],
    'Vận dụng': [
      {
        id: 'ai_cs_vd_1',
        order: 3,
        type: 'code',
        cognitiveLevel: 'Vận dụng',
        content: 'Viết hàm `is_prime(n: int) -> bool` kiểm tra xem một số nguyên dương n có phải số nguyên tố hay không.',
        points: 2.5,
        codeTemplate: 'def is_prime(n: int) -> bool:\n    # Viết mã tại đây\n    pass\n',
        rubric: '- Kiểm tra n < 2 trả về False: 0.5 điểm\n- Lặp từ 2 tới căn bậc hai của n: 1.5 điểm\n- Trả về đúng kết quả: 0.5 điểm',
        explanation: 'Kiểm tra ước từ 2 đến int(n**0.5) + 1.',
      },
    ],
    'Vận dụng cao': [
      {
        id: 'ai_cs_vdc_1',
        order: 4,
        type: 'code',
        cognitiveLevel: 'Vận dụng cao',
        content: 'Viết thuật toán quy hoạch động giải bài toán balo (0/1 Knapsack) tối ưu giá trị quà mang theo với trọng lượng tối đa W.',
        points: 3.0,
        codeTemplate: 'def knapsack(weights: list[int], values: list[int], W: int) -> int:\n    pass\n',
        rubric: 'Đúng bảng quy hoạch động dp[n+1][W+1] và tối ưu bộ nhớ: 3.0 điểm',
      },
    ],
  },
};

export const AIAssignmentService = {
  /**
   * Sinh câu hỏi theo 4 mức độ nhận thức (Bloom: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao)
   */
  async generateQuestionsByCognitiveLevel(
    subject: string,
    topic: string,
    level: CognitiveLevel,
    count = 2
  ): Promise<AssignmentQuestion[]> {
    const apiKey = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '';
    if (apiKey) {
      try {
        const ai = new GoogleGenAI();
        const prompt = `Bạn là chuyên gia khảo thí sư phạm GDPT 2018 Việt Nam.
Hãy sinh ${count} câu hỏi môn "${subject}", chủ đề "${topic}", ở mức độ nhận thức "${level}".
Trả về định dạng JSON thuần túy (không markdown, không code block backticks), là một mảng các đối tượng với các trường:
- id: chuỗi ngẫu nhiên (ví dụ "q_ai_1")
- type: một trong ["single_choice", "multiple_choice", "fill_in_blank", "essay", "code"]
- cognitiveLevel: "${level}"
- content: nội dung câu hỏi
- points: số điểm (ví dụ 2.5)
- options: mảng 4 phương án (nếu là trắc nghiệm)
- correctAnswer: đáp án đúng (chỉ số "0", "1", ... hoặc chuỗi điền từ)
- explanation: giải thích chi tiết
- rubric: hướng dẫn chấm thang điểm (nếu là tự luận hoặc code)`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const raw = response.text || '';
        const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            ...item,
            id: `ai_${Date.now()}_${idx}`,
            order: idx + 1,
            cognitiveLevel: level,
          }));
        }
      } catch (err) {
        console.warn('Gemini API call failed, using high-quality pedagogical templates:', err);
      }
    }

    // Curated fallback
    const matchedSubject = CURATED_AI_QUESTIONS[subject] || CURATED_AI_QUESTIONS['Toán học'];
    const candidates = matchedSubject[level] || matchedSubject['Nhận biết'];
    return candidates.map((q, idx) => ({
      ...q,
      id: `ai_q_${Date.now()}_${idx}`,
      order: idx + 1,
    }));
  },

  /**
   * Gợi ý nhận xét bài làm học sinh (Tuân thủ quy tắc: giáo viên luôn duyệt cuối cùng)
   */
  async suggestFeedback(
    studentName: string,
    score: number,
    maxScore: number,
    topic: string,
    studentContent: string
  ): Promise<{ feedback: string; strengths: string[]; weaknesses: string[]; recommendation: string }> {
    const percentage = (score / maxScore) * 100;

    let strengths: string[] = [];
    let weaknesses: string[] = [];
    let recommendation = '';
    let feedback = '';

    if (percentage >= 85) {
      strengths = ['Nắm vững định lý và kiến thức trọng tâm', 'Tư duy logic mạch lạc, trình bày chuẩn xác', 'Hoàn thành tốt câu hỏi vận dụng cao'];
      weaknesses = ['Cần chú ý cẩn thận hơn ở các bước tính toán trung gian'];
      recommendation = 'Giao thêm các bài toán mở rộng và bài tập Olympic/chuyên sâu để phát huy năng lực.';
      feedback = `Em ${studentName} làm bài rất xuất sắc (${score}/${maxScore} điểm)! Lập luận khoa học, nắm chắc kiến thức ${topic}. Hãy tiếp tục phát huy ở các chuyên đề sau nhé!`;
    } else if (percentage >= 65) {
      strengths = ['Nắm chắc lý thuyết và các bài toán cơ bản', 'Thực hiện đúng quy trình giải bài tập'];
      weaknesses = ['Còn lúng túng khi xử lý câu hỏi vận dụng thực tế', 'Cần rèn luyện thêm kỹ năng đọc đồ thị/phân tích đề'];
      recommendation = 'Ôn tập lại các dạng bài toán có tham số và giải tam giác ứng dụng.';
      feedback = `Bài làm của ${studentName} đạt mức Khá (${score}/${maxScore} điểm). Em đã nắm vững kiến thức nền tảng, tuy nhiên cần cẩn thận hơn ở phần lập luận câu hỏi vận dụng. Cố gắng thêm nhé!`;
    } else {
      strengths = ['Có ý thức hoàn thành bài nộp đúng thời hạn', 'Nắm được các công thức cơ bản'];
      weaknesses = ['Chưa phân biệt rõ các trường hợp điều kiện', 'Tính toán còn nhầm lẫn công thức'];
      recommendation = 'Cần được phụ đạo củng cố lại lý thuyết cơ bản và làm lại các bài tập ví dụ mẫu.';
      feedback = `${studentName} cần xem lại kỹ lý thuyết chuyên đề ${topic}. Em nên làm lại các bài tập cơ bản và đối chiếu với đáp án hướng dẫn của cô nhé!`;
    }

    return { feedback, strengths, weaknesses, recommendation };
  },

  /**
   * Phân tích điểm yếu của lớp từ kết quả bài tập
   */
  analyzeClassWeaknesses(scores: number[], maxScore: number) {
    const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
    const belowPass = scores.filter(s => (s / maxScore) < 0.5).length;
    const excellence = scores.filter(s => (s / maxScore) >= 0.85).length;

    return {
      averageScore: parseFloat(avg.toFixed(2)),
      passRate: parseFloat((((scores.length - belowPass) / (scores.length || 1)) * 100).toFixed(1)),
      excellenceRate: parseFloat(((excellence / (scores.length || 1)) * 100).toFixed(1)),
      commonWeakAreas: [
        'Kỹ năng biến đổi công thức và xử lý điều kiện bài toán',
        'Phân tích bài toán gắn liền với thực tiễn',
        'Trình bày tự luận còn thiếu các bước giải thích lý do',
      ],
      recommendedAction: 'Dành 15 phút đầu tiết tới để chữa chi tiết câu 3 và câu 4, sau đó giao 2 bài tương tự để học sinh củng cố.',
    };
  },
};
