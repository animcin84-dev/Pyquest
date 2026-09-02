import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Trophy, Skull, Star, Code2, Play, RotateCcw, Terminal, Zap, Shield, Heart, User, Search, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { TextReveal } from '../components/TextReveal';
import { io, Socket } from 'socket.io-client';

export const Duel = () => {
  const { userProfile, addXp, updateQuestProgress } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [duelStarted, setDuelStarted] = useState(false);
  const [opponent, setOpponent] = useState<{ id: string, username: string } | null>(null);
  const [playerCode, setPlayerCode] = useState("def solve():\n    # Твой код здесь\n    pass");
  const [opponentCode, setOpponentCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [duelResult, setDuelResult] = useState<'win' | 'loss' | 'draw' | null>(null);

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on("duel_start", ({ players }) => {
      const oppId = players.find((id: string) => id !== newSocket.id);
      setOpponent({ id: oppId, username: "Игрок " + oppId.slice(0, 4) });
      setDuelStarted(true);
      setIsSearching(false);
      playSound('levelUp');
    });

    newSocket.on("opponent_code", (code: string) => {
      setOpponentCode(code);
    });

    newSocket.on("duel_event", ({ playerId, action }) => {
      if (action === 'finish') {
        const result = playerId === newSocket.id ? 'win' : 'loss';
        setDuelResult(result);
        setDuelStarted(false);
        updateQuestProgress('duel');
        if (result === 'win') {
          addXp(150);
          updateQuestProgress('duel_win');
          playSound('success');
        } else {
          playSound('error');
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const startSearch = () => {
    if (!socket) return;
    setIsSearching(true);
    playSound('click');
    
    const id = "duel_room_1"; 
    setRoomId(id);
    socket.emit("join_duel", id);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setPlayerCode(newCode);
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
                    <span className="text-xs font-bold text-white/70 tracking-widest uppercase">main.py</span>
                  </div>
                </div>
                <textarea
                  value={playerCode}
                  onChange={handleCodeChange}
                  className="flex-grow w-full bg-transparent p-8 font-mono text-lg text-green-400 focus:outline-none resize-none"
                  spellCheck="false"
                />
                <div className="p-6 bg-black/40 border-t border-white/5">
                  <button
                    onClick={finishDuel}
                    className="w-full py-4 bg-green-500 hover:bg-green-400 text-black rounded-2xl font-bold text-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  >
                    Завершить решение
                  </button>
                </div>
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
            <p className="text-white/60 text-2xl mb-12">{duelResult === 'win' ? 'Вы доказали свое превосходство в коде! +150 XP' : 'Противник оказался быстрее. Не сдавайся!'}</p>
            
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
