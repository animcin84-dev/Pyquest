import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Swords, Trophy, Skull, Code2, Terminal, User, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { TextReveal } from '../components/TextReveal';
import { io, Socket } from 'socket.io-client';
import { CodeEditor } from '../components/CodeEditor';
import { toast } from 'sonner';

interface DuelChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  initialCode: string;
  testCases: { description: string; assertCode: string; inputValues: string[] }[];
}

const DUEL_CHALLENGES: DuelChallenge[] = [
  {
    id: 'duel_1',
    title: 'Быстрый принт',
    description: 'Напишите solve(), которая возвращает три строки Python через перенос строки.',
    reward: 100,
    initialCode: "def solve():\n    # Верните три строки Python\n    pass",
    testCases: [{ description: 'Три строки Python', inputValues: [], assertCode: "assert solve() == 'Python\\nPython\\nPython'" }]
  },
  {
    id: 'duel_2',
    title: 'Математик',
    description: 'Напишите solve(), которая возвращает сумму чисел от 1 до 10.',
    reward: 150,
    initialCode: "def solve():\n    # Верните сумму от 1 до 10\n    pass",
    testCases: [{ description: 'Сумма равна 55', inputValues: [], assertCode: 'assert solve() == 55' }]
  },
  {
    id: 'duel_3',
    title: 'Список героев',
    description: 'Напишите solve(), которая возвращает длину списка Python, Java и C++.',
    reward: 200,
    initialCode: "def solve():\n    heroes = ['Python', 'Java', 'C++']\n    # Верните длину списка\n    pass",
    testCases: [{ description: 'Длина списка равна 3', inputValues: [], assertCode: 'assert solve() == 3' }]
  }
];

export const Duel = () => {
  const { currentUser, userProfile } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [duelStarted, setDuelStarted] = useState(false);
  const [opponent, setOpponent] = useState<{ id: string, username: string } | null>(null);
  const [activeDuel, setActiveDuel] = useState<DuelChallenge | null>(null);
  const [opponentCode, setOpponentCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [duelResult, setDuelResult] = useState<'win' | 'loss' | 'draw' | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setSocket(null);
      return;
    }
    let disposed = false;
    let newSocket: Socket | null = null;

    const connect = async () => {
      const token = await currentUser.getIdToken();
      if (disposed) return;
      newSocket = io(window.location.origin, { auth: { token } });
      setSocket(newSocket);

      newSocket.on("duel_start", ({ roomId: matchedRoomId, players, challengeIndex }) => {
        const oppId = players.find((id: string) => id !== newSocket?.id);
        if (!oppId) return;
        setOpponent({ id: oppId, username: "Игрок " + oppId.slice(0, 4) });
        setRoomId(matchedRoomId);
        setActiveDuel(DUEL_CHALLENGES[challengeIndex] || DUEL_CHALLENGES[0]);
        setTimeLeft(60);
        setDuelStarted(true);
        setIsSearching(false);
        playSound('levelUp');
      });

      newSocket.on("duel_waiting", () => setIsSearching(true));

      newSocket.on("opponent_code", (code: string) => {
        setOpponentCode(code);
      });

      newSocket.on("duel_event", ({ playerId, action }) => {
        if (action === 'finish' || action === 'timeout' || action === 'opponent_left') {
          const result = action === 'opponent_left'
            ? 'win'
            : action === 'finish'
              ? (playerId === newSocket?.id ? 'win' : 'loss')
              : (playerId === newSocket?.id ? 'loss' : 'win');
          setDuelResult(result);
          setDuelStarted(false);
          if (result === 'win') {
            playSound('success');
          } else {
            playSound('error');
          }
        }
      });

      newSocket.on('connect_error', () => {
        setIsSearching(false);
        toast.error('Не удалось безопасно подключиться к дуэли. Войдите в аккаунт и попробуйте снова.');
      });
    };

    void connect().catch(() => {
      if (!disposed) toast.error('Не удалось получить безопасный токен для дуэли.');
    });

    return () => {
      disposed = true;
      newSocket?.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!duelStarted || duelResult || !socket || !roomId) return;

    const timer = window.setInterval(() => {
      setTimeLeft(previous => {
        if (previous <= 1) {
          socket.emit("duel_action", { roomId, action: 'timeout' });
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [duelStarted, duelResult, roomId, socket]);

  const startSearch = () => {
    if (!socket) return;
    setIsSearching(true);
    playSound('click');
    socket.emit("find_duel");
  };

  const handleCodeChange = (newCode: string) => {
    if (socket && roomId) {
      socket.emit("code_update", { roomId, code: newCode });
    }
  };

  const finishDuel = () => {
    if (!socket || !roomId) return;
    socket.emit("duel_action", { roomId, action: 'finish' });
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
        {!duelStarted && !duelResult && (
          <div className="flex-grow flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-12 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)]"
            >
              <Swords className="w-16 h-16" />
            </motion.div>
            <h1 className="text-6xl font-display font-bold mb-6">
              <TextReveal text="Код-Дуэль" delay={0.1} />
            </h1>
            <p className="text-white/40 text-xl max-w-2xl mb-12 leading-relaxed">Сразись с другими мастерами Python в реальном времени. Кто быстрее решит задачу, тот заберет всю славу и XP!</p>
            
            <button
              onClick={startSearch}
              disabled={isSearching}
              className={`px-12 py-5 rounded-3xl font-bold text-2xl transition-all flex items-center gap-4 ${isSearching ? 'bg-white/5 text-white/40 cursor-default' : 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:scale-105'}`}
            >
              {isSearching ? (
                <><Loader2 className="w-8 h-8 animate-spin" /> Поиск противника...</>
              ) : (
                <><Search className="w-8 h-8" /> Найти дуэль</>
              )}
            </button>
          </div>
        )}

        {duelStarted && (
          <div className="grid lg:grid-cols-2 gap-8 flex-grow overflow-hidden">
            {}
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary border border-brand-primary/30">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{userProfile?.username || 'Вы'}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest">Твой код</div>
                  </div>
                </div>
                <div className="text-2xl font-mono font-bold text-red-400">{timeLeft}с</div>
              </div>

              <div className="glass rounded-[40px] border border-white/10 overflow-hidden flex flex-col flex-grow bg-[#0a0a0a] shadow-2xl">
                <div className="bg-black/40 px-8 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-bold text-white/70 tracking-widest uppercase">{activeDuel?.title || 'Задание'}</span>
                  </div>
                </div>
                <div className="p-6 border-b border-white/5 text-white/60 text-sm leading-relaxed">
                  {activeDuel?.description}
                </div>
                {activeDuel && (
                  <div className="p-4">
                    <CodeEditor
                      initialCode={activeDuel.initialCode}
                      testCases={activeDuel.testCases as any}
                      lessonId={`duel_${activeDuel.id}`}
                      onChange={handleCodeChange}
                      onSuccess={finishDuel}
                    />
                  </div>
                )}
              </div>
            </div>

            {}
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{opponent?.username}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest">Код противника</div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-[40px] border border-white/10 overflow-hidden flex flex-col flex-grow bg-black/40 opacity-60">
                <div className="bg-black/40 px-8 py-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-white/20" />
                    <span className="text-xs font-bold text-white/20 tracking-widest uppercase">opponent_script.py</span>
                  </div>
                </div>
                <pre className="flex-grow w-full p-8 font-mono text-lg text-white/20 overflow-hidden">
                  {opponentCode || "# Противник еще не начал писать..."}
                </pre>
              </div>
            </div>
          </div>
        )}

        {duelResult && (
          <div className="flex-grow flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className={`w-40 h-40 rounded-full flex items-center justify-center mb-12 border-4 shadow-[0_0_80px_rgba(0,0,0,0.5)] ${duelResult === 'win' ? 'bg-green-500/20 border-green-500 text-green-500 shadow-green-500/30' : 'bg-red-500/20 border-red-500 text-red-500 shadow-red-500/30'}`}
            >
              {duelResult === 'win' ? <Trophy className="w-20 h-20" /> : <Skull className="w-20 h-20" />}
            </motion.div>
            <h2 className="text-6xl font-display font-bold mb-4">{duelResult === 'win' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}</h2>
            <p className="text-white/60 text-2xl mb-12">{duelResult === 'win' ? 'Вы доказали свое превосходство в коде!' : 'Противник оказался быстрее. Не сдавайся!'}</p>
            
            <button
              onClick={() => { setDuelResult(null); setDuelStarted(false); }}
              className="px-12 py-5 bg-white text-black rounded-3xl font-bold text-2xl hover:bg-gray-200 transition-all hover:scale-105"
            >
              Вернуться в лобби
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
