import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCw,
  Shuffle,
  UsersRound,
  Timer as TimerIcon,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Maximize2,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Trophy
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StorageService } from '../../services/storage';
import { Student } from '../../types';
import { ModuleBreadcrumb } from '../../components/layout/ModuleBreadcrumb';
import { UserAvatar } from '../../components/ui/UserAvatar';

interface ClassroomToolsProps {
  initialTool?: 'wheel' | 'random' | 'groups' | 'timer' | 'quiz';
}

export const ClassroomTools: React.FC<ClassroomToolsProps> = ({ initialTool = 'wheel' }) => {
  const [activeTool, setActiveTool] = useState<'wheel' | 'random' | 'groups' | 'timer' | 'quiz'>(initialTool);
  const students = StorageService.getStudents('cls_10a1');

  // Tool 1: Wheel state
  const [wheelStudents, setWheelStudents] = useState<Student[]>(students);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [removeAfterPick, setRemoveAfterPick] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationAngleRef = useRef(0);

  // Tool 2: Random picker
  const [randomCount, setRandomCount] = useState(1);
  const [pickedStudents, setPickedStudents] = useState<Student[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  // Tool 3: Group generator
  const [groupCount, setGroupCount] = useState(4);
  const [generatedGroups, setGeneratedGroups] = useState<{ id: number; name: string; members: Student[] }[]>([]);

  // Tool 4: Timer
  const [timeLeft, setTimeLeft] = useState(300); // 5 min
  const [timerRunning, setTimerRunning] = useState(false);
  const [initialDuration, setInitialDuration] = useState(300);

  // Tool 5: Quick Quiz
  const [quizQuestion, setQuizQuestion] = useState('Parabol y = ax^2 + bx + c có bề lõm quay lên trên khi nào?');
  const [quizOptions, setQuizOptions] = useState(['a > 0', 'a < 0', 'Δ > 0', 'b > 0']);
  const [quizVotes, setQuizVotes] = useState<number[]>([14, 2, 3, 1]);
  const [quizActive, setQuizActive] = useState(false);

  // Draw wheel on canvas
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const list = wheelStudents.length > 0 ? wheelStudents : students;
    const count = list.length;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 15;
    const sliceAngle = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = [
      '#06b6d4', '#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#0284c7'
    ];

    list.forEach((st, i) => {
      const startAngle = rotationAngleRef.current + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#050816';
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.fillText(st.name.split(' ').slice(-2).join(' '), radius - 20, 4);
      ctx.restore();
    });

    // Center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#050816';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#22d3ee';
    ctx.stroke();
  };

  useEffect(() => {
    if (activeTool === 'wheel') drawWheel();
  }, [activeTool, wheelStudents]);

  // Spin wheel handler
  const handleSpin = () => {
    if (isSpinning || wheelStudents.length === 0) return;
    setIsSpinning(true);
    setSelectedStudent(null);

    const fullRotations = 5 + Math.floor(Math.random() * 5);
    const extraAngle = Math.random() * 2 * Math.PI;
    const targetAngle = rotationAngleRef.current + fullRotations * 2 * Math.PI + extraAngle;

    const start = performance.now();
    const duration = 4000;
    const initialAngle = rotationAngleRef.current;

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      rotationAngleRef.current = initialAngle + (targetAngle - initialAngle) * ease;
      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // calculate chosen student
        // The pointer is at 3 o'clock (0 radians) or 12 o'clock (-PI/2)
        const sliceAngle = (2 * Math.PI) / wheelStudents.length;
        const normalized = (2 * Math.PI - (rotationAngleRef.current % (2 * Math.PI))) % (2 * Math.PI);
        const index = Math.floor(normalized / sliceAngle) % wheelStudents.length;
        const winner = wheelStudents[index];
        setSelectedStudent(winner);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        if (removeAfterPick) {
          setWheelStudents((prev) => prev.filter((s) => s.id !== winner.id));
        }
      }
    };
    requestAnimationFrame(animate);
  };

  // Random student picker
  const handlePickRandom = () => {
    setIsShuffling(true);
    let count = 0;
    const interval = setInterval(() => {
      const shuffled = [...students].sort(() => 0.5 - Math.random());
      setPickedStudents(shuffled.slice(0, randomCount));
      count++;
      if (count > 15) {
        clearInterval(interval);
        setIsShuffling(false);
        confetti({ particleCount: 50, spread: 60 });
      }
    }, 80);
  };

  // Group generator
  const handleGenerateGroups = () => {
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const groups: { id: number; name: string; members: Student[] }[] = [];
    for (let i = 0; i < groupCount; i++) {
      groups.push({ id: i + 1, name: `Nhóm ${i + 1}`, members: [] });
    }
    shuffled.forEach((s, idx) => {
      groups[idx % groupCount].members.push(s);
    });
    setGeneratedGroups(groups);
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      confetti({ particleCount: 80, spread: 80 });
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSetTimer = (secs: number) => {
    setInitialDuration(secs);
    setTimeLeft(secs);
    setTimerRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <ModuleBreadcrumb
            section="Công cụ lớp học"
            moduleName="Bộ công cụ tương tác"
            title="Bộ Công Cụ Lớp Học Tương Tác"
          />
          <p className="text-xs text-slate-400 mt-1 pl-1">
            Vòng quay may mắn, chọn học sinh ngẫu nhiên, chia nhóm tự động và đồng hồ đếm ngược
          </p>
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-white/10 overflow-x-auto">
        {[
          { id: 'wheel', label: 'Vòng quay may mắn', icon: RotateCw },
          { id: 'random', label: 'Chọn ngẫu nhiên', icon: Shuffle },
          { id: 'groups', label: 'Chia nhóm tự động', icon: UsersRound },
          { id: 'timer', label: 'Đồng hồ lớp học', icon: TimerIcon },
          { id: 'quiz', label: 'Quiz nhanh trực tiếp', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTool(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tool 1: Vòng quay may mắn */}
      {activeTool === 'wheel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-6 flex flex-col items-center justify-center relative min-h-[460px]">
            {/* Pointer arrow pointing at the wheel */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 z-20 w-0 h-0 border-y-8 border-y-transparent border-r-16 border-r-cyan-400 drop-shadow-[0_0_10px_#22d3ee]" />

            <canvas
              ref={canvasRef}
              width={380}
              height={380}
              className="max-w-full drop-shadow-2xl rounded-full"
            />

            <div className="mt-6 flex items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                icon={RotateCw}
                onClick={handleSpin}
                loading={isSpinning}
                disabled={wheelStudents.length === 0}
              >
                QUAY THƯỞNG NGAY
              </Button>
            </div>
          </div>

          {/* Control & Winner Card */}
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-5 space-y-5">
            {selectedStudent && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/40 text-center animate-in zoom-in-95">
                <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <div className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">Học sinh được chọn</div>
                <div className="text-xl font-bold text-white mt-1">{selectedStudent.name}</div>
                <div className="text-xs text-slate-300 font-mono mt-0.5">{selectedStudent.studentCode} · Tổ {selectedStudent.group}</div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                <span>Danh sách còn lại: <strong>{wheelStudents.length} học sinh</strong></span>
                <button
                  onClick={() => setWheelStudents(students)}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  Khôi phục tất cả
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-white/5">
                <input
                  type="checkbox"
                  checked={removeAfterPick}
                  onChange={(e) => setRemoveAfterPick(e.target.checked)}
                  className="rounded border-white/20 text-cyan-500"
                />
                <span>Loại học sinh đã chọn khỏi lượt tiếp theo</span>
              </label>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {wheelStudents.map((s, idx) => (
                <div key={s.id} className="text-xs p-2 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-200">{idx + 1}. {s.name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">Tổ {s.group}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tool 2: Chọn học sinh ngẫu nhiên */}
      {activeTool === 'random' && (
        <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Số lượng học sinh cần gọi:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRandomCount(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      randomCount === n ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Shuffle}
              onClick={handlePickRandom}
              loading={isShuffling}
            >
              Chọn ngẫu nhiên ({randomCount} HS)
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-[220px]">
            {pickedStudents.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-[#080b1f] border border-cyan-500/40 text-center shadow-xl shadow-cyan-950/20 animate-in zoom-in-95 flex flex-col items-center justify-center"
              >
                <UserAvatar
                  src={s.avatar}
                  name={s.name}
                  role="STUDENT"
                  size="xl"
                  className="mb-3"
                  imgClassName="border-2 border-cyan-400"
                />
                <h4 className="text-base font-bold text-white">{s.name}</h4>
                <div className="text-xs text-cyan-300 font-mono mt-1">{s.studentCode}</div>
                <div className="text-[11px] text-slate-400 mt-1">Lớp 10A1 · Tổ {s.group}</div>
              </div>
            ))}
            {pickedStudents.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
                Nhấn "Chọn ngẫu nhiên" để kích hoạt thuật toán rút thăm công bằng.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tool 3: Chia nhóm tự động */}
      {activeTool === 'groups' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Chia lớp thành:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                {[2, 3, 4, 5, 6].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGroupCount(g)}
                    className={`w-9 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      groupCount === g ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {g} nhóm
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={UsersRound}
              onClick={handleGenerateGroups}
            >
              Tạo nhóm ngẫu nhiên
            </Button>
          </div>

          {generatedGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {generatedGroups.map((grp) => (
                <div key={grp.id} className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-cyan-500/20 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="font-bold text-white text-sm">{grp.name}</span>
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      {grp.members.length} thành viên
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {grp.members.map((m, idx) => (
                      <div key={m.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/50 text-xs">
                        <span className="w-5 text-center font-mono text-slate-500">{idx + 1}</span>
                        <span className="font-medium text-slate-200">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm rounded-2xl border border-white/10 bg-[#0b1026]/40">
              Chọn số lượng nhóm và nhấn "Tạo nhóm ngẫu nhiên" để phân bố học sinh cân bằng.
            </div>
          )}
        </div>
      )}

      {/* Tool 4: Đồng hồ lớp học */}
      {activeTool === 'timer' && (
        <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-8 text-center max-w-xl mx-auto space-y-6 shadow-2xl">
          <div className="flex items-center justify-center gap-2">
            {[60, 180, 300, 600, 900].map((s) => (
              <button
                key={s}
                onClick={() => handleSetTimer(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  initialDuration === s
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {s / 60} phút
              </button>
            ))}
          </div>

          {/* Big Digital Display */}
          <div className="py-8 px-6 rounded-3xl bg-slate-950 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <span className="text-6xl sm:text-7xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 tracking-wider">
              {formatTimer(timeLeft)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant={timerRunning ? 'danger' : 'primary'}
              size="lg"
              icon={timerRunning ? Pause : Play}
              onClick={() => setTimerRunning(!timerRunning)}
            >
              {timerRunning ? 'Tạm dừng' : 'Bắt đầu đếm'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={RotateCcw}
              onClick={() => handleSetTimer(initialDuration)}
            >
              Đặt lại
            </Button>
          </div>
        </div>
      )}

      {/* Tool 5: Quick Quiz */}
      {activeTool === 'quiz' && (
        <div className="rounded-2xl bg-[#0b1026]/80 backdrop-blur-md border border-white/10 p-6 space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="text-xs text-cyan-400 uppercase font-bold mb-1">Câu hỏi trắc nghiệm nhanh</div>
            <h3 className="text-base font-bold text-white">{quizQuestion}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizOptions.map((opt, idx) => {
              const votes = quizVotes[idx];
              const totalVotes = quizVotes.reduce((a, b) => a + b, 0);
              const percentage = Math.round((votes / totalVotes) * 100);
              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-white">
                      {String.fromCharCode(65 + idx)}. {opt}
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">{votes} phiếu ({percentage}%)</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400">
            <span>Tổng số học sinh phản hồi: <strong className="text-white font-mono">20/20</strong></span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setQuizVotes([16, 1, 2, 1]);
                confetti({ particleCount: 50 });
              }}
            >
              Mô phỏng học sinh bấm vote
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
