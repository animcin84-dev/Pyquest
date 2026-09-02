import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Trophy, Users, Zap, Shield, Star, Timer, Code2, Play, CheckCircle2, XCircle } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { TextReveal } from '../components/TextReveal';

const DUEL_CHALLENGES = [
  {
    id: 'duel_1',
    title: 'Быстрый Принт',
    description: 'Выведите "Python" 3 раза, используя цикл for.',
    expectedOutput: 'Python\nPython\nPython',
    difficulty: 'Easy',
    reward: 100
  },
  {
    id: 'duel_2',
    title: 'Математик',
    description: 'Выведите сумму чисел от 1 до 10.',
    expectedOutput: '55',
    difficulty: 'Medium',
    reward: 200
  },
  {
    id: 'duel_3',
    title: 'Список Героев',
    description: 'Создайте список ["Python", "Java", "C++"] и выведите его длину.',
    expectedOutput: '3',
    difficulty: 'Medium',
    reward: 250
  }
];

import { playSound } from '../utils/sounds';

export const Duels = () => {
  const { userProfile, addXp } = useAuth();
  const [activeDuel, setActiveDuel] = useState<any>(null);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [hasUsedExtraChance, setHasUsedExtraChance] = useState(false);
  const [userHp, setUserHp] = useState(100);

  useEffect(() => {
    let timer: any;
    if (activeDuel && timeLeft > 0 && !isFinished) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !isFinished) {
      handleFinish('lose');
    }
    return () => clearInterval(timer);
  }, [activeDuel, timeLeft, isFinished]);

  const startSearch = () => {
    playSound('click');
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      playSound('success');
      const randomDuel = DUEL_CHALLENGES[Math.floor(Math.random() * DUEL_CHALLENGES.length)];
      setActiveDuel(randomDuel);
      setTimeLeft(60);
      setIsFinished(false);
      setResult(null);
      setCode('');
      setUserHp(100);
      setHasUsedExtraChance(false);
    }, 3000);
  };

  const handleFinish = async (outcome: 'win' | 'lose') => {
    setIsFinished(true);
    setResult(outcome);
    if (outcome === 'win') {
      playSound('levelUp');
      await addXp(activeDuel.reward);
    } else {
      playSound('error');
    }
  };

  const checkCode = () => {
    playSound('click');
    
    const normalize = (s: string) => s.trim().replace(/"/g, "'").replace(/\s+/g, ' ');
    const normalizedCode = normalize(code);
    
    // Very basic simulation
    let isCorrect = false;
    if (activeDuel.id === 'duel_1') {
      isCorrect = (code.includes('for') && code.includes('print') && code.includes('Python')) || 
                  normalizedCode.includes("print('Python')") && normalizedCode.includes("for");
    } else if (activeDuel.id === 'duel_2') {
      isCorrect = code.includes('sum') || code.includes('range(1, 11)') || code.includes('55');
    } else if (activeDuel.id === 'duel_3') {
      isCorrect = code.includes('len') && code.includes('Python') && code.includes('3');
    }

    if (isCorrect) {
      handleFinish('win');
    } else {
      playSound('error');
      
      if (userProfile?.perks?.includes('double_chance') && !hasUsedExtraChance) {
        setHasUsedExtraChance(true);
        setMessage('Щит "Второй шанс" защитил вас от потери HP! 🛡️');
      } else {
        const dmg = 34; // 3 hits and you die
        const newHp = Math.max(0, userHp - dmg);
        setUserHp(newHp);
        if (newHp === 0) {
          handleFinish('lose');
        } else {
          setMessage(`Ошибка! Вы потеряли ${dmg} HP. Попробуй еще раз!`);
        }
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-brand-primary/30">
      
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-4 tracking-tighter">
              <TextReveal text="Арена " delay={0.1} />
              <span className="text-gradient">Дуэлей</span>
            </h1>
            <p className="text-white/50 text-xl max-w-2xl">
              Сражайтесь в скорости написания кода. Решайте задачи быстрее соперника и забирайте награду.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="glass p-6 rounded-3xl border border-white/10 text-center min-w-[150px]">
              <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Победы</div>
              <div className="text-3xl font-display font-bold text-brand-primary">12</div>
            </div>
            <div className="glass p-6 rounded-3xl border border-white/10 text-center min-w-[150px]">
              <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Рейтинг</div>
              <div className="text-3xl font-display font-bold text-brand-secondary">1450</div>
            </div>
          </div>
        </div>

        {!activeDuel ? (
          <div className="flex flex-col items-center justify-center py-20 glass rounded-[50px] border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-primary/5 blur-[100px] rounded-full" />
            
            <AnimatePresence mode="wait">
              {isSearching ? (
                <motion.div 
                  key="searching"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="text-center z-10"
                >
                  <div className="relative w-32 h-32 mx-auto mb-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 border-4 border-brand-primary/20 border-t-brand-primary rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="w-12 h-12 text-brand-primary animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Поиск соперника...</h2>
                  <p className="text-white/40">Подбираем достойного оппонента вашего уровня</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center z-10"
                >
                  <div className="w-24 h-24 bg-brand-primary/20 rounded-3xl flex items-center justify-center text-brand-primary mx-auto mb-8 border border-brand-primary/30 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                    <Swords className="w-12 h-12" />
                  </div>
                  <h2 className="text-4xl font-display font-bold mb-6">Готовы к битве?</h2>
                  <button 
                    onClick={startSearch}
                    className="px-12 py-5 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full font-bold text-xl glow-shadow hover:scale-105 transition-all"
                  >
                    Найти соперника
                  </button>
                  <p className="mt-8 text-white/30 text-sm flex items-center justify-center gap-2">
                    <Timer className="w-4 h-4" /> Среднее время ожидания: 5 сек
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="glass rounded-[40px] p-8 border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary border border-brand-primary/30">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{activeDuel.title}</h3>
                      <p className="text-white/40 text-sm">{activeDuel.difficulty} • {activeDuel.reward} XP</p>
                    </div>
                  </div>
                  <div className={`text-2xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-brand-primary'}`}>
                    00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                  </div>
                </div>

                {/* HP Bar */}
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                    <span>Ваша Прочность</span>
                    <span className={userHp < 40 ? 'text-red-500' : 'text-emerald-500'}>{userHp}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: '100%' }}
                      animate={{ width: `${userHp}%` }}
                      className={`h-full rounded-full ${userHp < 40 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>

                <div className="bg-black/40 rounded-3xl p-6 border border-white/5 mb-8">
                  <p className="text-lg leading-relaxed">{activeDuel.description}</p>
                </div>

                <div className="relative">
                  <textarea 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isFinished}
                    className="w-full h-64 bg-black/60 border-2 border-white/10 rounded-3xl p-6 font-mono text-lg focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/10 resize-none"
                    placeholder="# Напишите решение здесь..."
                  />
                  {!isFinished && (
                    <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2">
                      {message && (
                        <motion.p 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 font-bold text-sm bg-black/80 px-4 py-2 rounded-xl border border-red-500/30"
                        >
                          {message}
                        </motion.p>
                      )}
                      <button 
                        onClick={checkCode}
                        className="px-8 py-3 bg-brand-primary text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                      >
                        <Play className="w-5 h-5" />
                        ОТПРАВИТЬ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="glass rounded-[40px] p-8 border border-white/10">
                <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-primary" /> Состояние дуэли
                </h3>
                
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-primary">
                        <img src={userProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.username || 'Guest'}`} alt="User" referrerPolicy="no-referrer" />
                      </div>
                      <div className="font-bold text-sm">Вы (Вы)</div>
                    </div>
                    <div className="text-xs font-bold text-brand-primary uppercase tracking-widest">Пишет...</div>
                  </div>

                  <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-brand-primary to-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-500/50">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow" alt="Opponent" referrerPolicy="no-referrer" />
                      </div>
                      <div className="font-bold text-sm">ShadowCoder</div>
                    </div>
                    <div className="text-xs font-bold text-red-500 uppercase tracking-widest">Думает...</div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isFinished && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`glass rounded-[40px] p-8 border-2 text-center ${result === 'win' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}
                  >
                    {result === 'win' ? (
                      <>
                        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">ПОБЕДА!</h3>
                        <p className="text-white/60 mb-6">Вы были быстрее и точнее. Награда: +{activeDuel.reward} XP</p>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">ПОРАЖЕНИЕ</h3>
                        <p className="text-white/60 mb-6">Соперник оказался быстрее. Не сдавайтесь!</p>
                      </>
                    )}
                    <button 
                      onClick={() => setActiveDuel(null)}
                      className="w-full py-4 glass rounded-2xl font-bold hover:bg-white/10 transition-all"
                    >
                      Вернуться в лобби
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
