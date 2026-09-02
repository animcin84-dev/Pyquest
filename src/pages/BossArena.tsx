import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Trophy, Skull, Zap, Shield, Flame, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { CodeEditor } from '../components/CodeEditor';
import { Link } from 'react-router-dom';
import { BossService, GlobalBoss } from '../services/BossService';
import { toast } from 'sonner';

interface Boss {
  id: string;
  name: string;
  title: string;
  description: string;
  emoji: string;
  difficulty: 'Hard' | 'Extreme' | 'Legendary';
  hp: number;
  reward: { xp: number, coins: number };
  penalty: { xp: number, coins: number };
  challenge: {
    question: string;
    description: string;
    initialCode: string;
    testCases: { input: string, expectedOutput: string, description: string }[];
  };
}

const BOSSES: Boss[] = [
  {
    id: 'b1',
    name: 'Циклоп Рекурсии',
    title: 'Хранитель Глубины',
    description: 'Он зациклит твой разум, если ты не поймешь базовый случай.',
    emoji: '👁️',
    difficulty: 'Hard',
    hp: 100,
    reward: { xp: 500, coins: 300 },
    penalty: { xp: 50, coins: 30 },
    challenge: {
      question: 'Реализуйте функцию факториала',
      description: 'Напишите функцию factorial(n), которая возвращает факториал числа n.',
      initialCode: 'def factorial(n):\n    # Твой код здесь\n    pass',
      testCases: [
        { input: 'print(factorial(5))', expectedOutput: '120', description: 'factorial(5) должен быть 120' },
        { input: 'print(factorial(0))', expectedOutput: '1', description: 'factorial(0) должен быть 1' }
      ]
    }
  },
  {
    id: 'b2',
    name: 'Теневой Декоратор',
    title: 'Мастер Оберток',
    description: 'Он прячет истинную суть функций за слоями логики.',
    emoji: '👤',
    difficulty: 'Extreme',
    hp: 200,
    reward: { xp: 1000, coins: 600 },
    penalty: { xp: 100, coins: 60 },
    challenge: {
      question: 'Создайте декоратор логирования',
      description: 'Напишите декоратор log_call, который выводит "Calling function" перед вызовом функции.',
      initialCode: 'def log_call(func):\n    # Твой код здесь\n    pass\n\n@log_call\ndef test():\n    print("Inside")',
      testCases: [
        { input: 'test()', expectedOutput: 'Calling function\nInside', description: 'Декоратор должен выводить сообщение' }
      ]
    }
  }
];

export const BossArena = () => {
  const { userProfile, addXp, addCoins, subtractCoins, subtractXp } = useAuth();
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  const [activeGlobalBosses, setActiveGlobalBosses] = useState<GlobalBoss[]>([]);
  const [activeGlobalBoss, setActiveGlobalBoss] = useState<GlobalBoss | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [isFighting, setIsFighting] = useState(false);
  const [isGlobalFight, setIsGlobalFight] = useState(false);
  const [bossHp, setBossHp] = useState(0);
  const [userHp, setUserHp] = useState(100);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = BossService.subscribeToAllBosses((bosses) => {
      setActiveGlobalBosses(bosses);
    });
    return () => unsubscribe();
  }, []);

  const handleEnterArena = (boss: Boss) => {
    setSelectedBoss(boss);
    setIsEntering(true);
    playSound('click');
  };

  const startFight = () => {
    if (!selectedBoss && !isGlobalFight) return;
    setIsEntering(false);
    setIsFighting(true);
    if (isGlobalFight && activeGlobalBoss) {
      setBossHp(activeGlobalBoss.currentHp);
    } else if (selectedBoss) {
      setBossHp(selectedBoss.hp);
    }
    setUserHp(100);
    setBattleLog(['Битва началась!']);
    playSound('success');
  };

  const startGlobalFight = (boss: GlobalBoss) => {
    setActiveGlobalBoss(boss);
    setIsGlobalFight(true);
    setIsEntering(true);
  };

  const handleSuccess = async () => {
    if (isGlobalFight && activeGlobalBoss) {
      let damage = 20; 
      if (userProfile?.perks?.includes('boss_slayer')) {
        damage = Math.floor(damage * 1.3);
      }
      await BossService.dealDamage(activeGlobalBoss.id, damage);
      playSound('success');
      setBattleLog(prev => [...prev, `ВЫ НАНЕСЛИ ${damage} УРОНА ГЛОБАЛЬНОМУ БОССУ!`]);
      toast.success(`Урон нанесен! +50 XP вне вклада.`);
      await addXp(50);
      setIsFighting(false);
      setIsGlobalFight(false);
      setActiveGlobalBoss(null);
      return;
    }

    if (!selectedBoss) return;
    
    playSound('success');
    setBattleLog(prev => [...prev, `Вы нанесли сокрушительный удар по ${selectedBoss.name}!`]);
    setBossHp(0);
    
    setTimeout(async () => {
      await addXp(selectedBoss.reward.xp);
      await addCoins(selectedBoss.reward.coins);
      setIsFighting(false);
      setSelectedBoss(null);
      playSound('levelUp');
    }, 2000);
  };

  const handleFailure = async () => {
    if (!selectedBoss) return;
    
    playSound('error');
    setBattleLog(prev => [...prev, `${selectedBoss.name} одолел вас...`]);
    setUserHp(0);
    
    setTimeout(async () => {
      await subtractXp(selectedBoss.penalty.xp);
      await subtractCoins(selectedBoss.penalty.coins);
      setIsFighting(false);
      setSelectedBoss(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      
      <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        {!isFighting ? (
          <>
            <header className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-6"
              >
                <Skull className="w-5 h-5" />
                <span className="text-sm font-black uppercase tracking-[0.3em]">Арена Боссов</span>
              </motion.div>
              <h1 className="text-6xl font-display font-black mb-6 tracking-tighter">
                Эпические <span className="text-red-500 italic serif">Испытания</span>
              </h1>
              <p className="text-white/40 text-xl max-w-2xl mx-auto font-medium">
                Сразись с легендарными стражами кода. Высокий риск — колоссальная награда.
              </p>
            </header>

            {}
            <div className="grid grid-cols-1 gap-8 mb-12">
              {activeGlobalBosses.map((boss) => (
                <motion.div
                  key={boss.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-[40px] p-8 border-2 border-red-600/30 bg-gradient-to-br from-red-600/10 via-transparent to-brand-primary/10 overflow-hidden relative group"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 scale-125 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <Flame className="w-32 h-32" />
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="text-8xl drop-shadow-[0_0_30px_rgba(239,68,68,0.4)]">{boss.image || '👾'}</div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-[9px] uppercase tracking-[0.2em]">ГЛОБАЛЬНЫЙ БОСС</span>
                        <span className="text-red-500 font-mono text-[10px] animate-pulse">LIVE EVENT</span>
                      </div>
                      <h2 className="text-3xl font-black text-white italic mb-4">{boss.name}</h2>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-end text-xs">
                           <div className="text-white/40 font-black uppercase tracking-widest">HP: {boss.currentHp}/{boss.maxHp}</div>
                           <div className="text-red-500 font-bold">{Math.round((boss.currentHp / (boss.maxHp || 1)) * 100)}%</div>
                        </div>
                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                           <motion.div 
                             initial={{ width: '100%' }}
                             animate={{ width: `${(boss.currentHp / (boss.maxHp || 1)) * 100}%` }}
                             className="h-full bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                           />
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={() => startGlobalFight(boss)}
                          disabled={boss.currentHp <= 0}
                          className={`px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-2 text-xs ${boss.currentHp <= 0 ? 'bg-white/5 text-white/20' : 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20'}`}
                        >
                          {boss.currentHp <= 0 ? 'ПОВЕРЖЕН' : <><Swords className="w-4 h-4" /> ВСТУПИТЬ В БОЙ</>}
                        </button>
                        <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-center">
                           <span className="text-[8px] text-white/30 uppercase">Награда</span>
                           <span className="text-emerald-400 font-bold text-xs">+{boss.xpReward} XP / +{boss.coinReward} Cp</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {BOSSES.map((boss, idx) => (
                <motion.div
                  key={boss.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative glass rounded-[40px] p-10 border border-white/10 hover:border-red-500/30 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative flex items-start gap-8">
                    <div className="text-8xl filter drop-shadow-[0_0_20px_rgba(239,68,68,0.3)] group-hover:scale-110 transition-transform duration-500">
                      {boss.emoji}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          boss.difficulty === 'Hard' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                          'border-red-500/30 text-red-400 bg-red-500/10'
                        }`}>
                          {boss.difficulty}
                        </span>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{boss.title}</span>
                      </div>
                      <h3 className="text-3xl font-black mb-4 tracking-tight">{boss.name}</h3>
                      <p className="text-white/50 mb-8 leading-relaxed font-medium">{boss.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="text-[10px] text-white/30 uppercase font-black mb-1">Награда</div>
                          <div className="text-lg font-black text-emerald-400">+{boss.reward.xp} XP</div>
                          <div className="text-lg font-black text-brand-primary">+{boss.reward.coins} C</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="text-[10px] text-white/30 uppercase font-black mb-1">Штраф</div>
                          <div className="text-lg font-black text-red-400">-{boss.penalty.xp} XP</div>
                          <div className="text-lg font-black text-red-500">-{boss.penalty.coins} C</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEnterArena(boss)}
                        className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-black/20"
                      >
                        Бросить вызов
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-8">
                <div className="glass rounded-[40px] p-8 border border-white/10 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                      <div className="text-6xl">{selectedBoss?.emoji}</div>
                      <div>
                        <h2 className="text-2xl font-black">{selectedBoss?.name}</h2>
                        <div className="w-64 h-3 bg-white/10 rounded-full mt-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: `${(bossHp / (selectedBoss?.hp || 100)) * 100}%` }}
                            className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-white/30 uppercase mb-1">Твое здоровье</div>
                      <div className="w-48 h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: '100%' }}
                          animate={{ width: `${userHp}%` }}
                          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        />
                      </div>
                    </div>
                  </div>

                  <CodeEditor
                    initialCode={selectedBoss?.challenge.initialCode || ''}
                    testCases={selectedBoss?.challenge.testCases || []}
                    onSuccess={handleSuccess}
                    onFailure={handleFailure}
                  />
                </div>

                <div className="glass rounded-[32px] p-6 border border-white/10 h-48 overflow-y-auto custom-scrollbar font-mono text-sm">
                  <div className="text-[10px] font-black text-white/30 uppercase mb-4 tracking-widest">Лог битвы</div>
                  <div className="space-y-2">
                    {battleLog.map((log, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-white/20">[{i+1}]</span>
                        <span className={log.includes('Вы') ? 'text-emerald-400' : log.includes('Битва') ? 'text-brand-primary' : 'text-red-400'}>
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass rounded-[32px] p-8 border border-white/10">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-brand-primary" /> Описание Босса
                  </h3>
                  <p className="text-white/60 leading-relaxed font-medium mb-6">
                    {selectedBoss?.challenge.description}
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-xs font-bold text-white/40">Сложность</span>
                      <span className="text-xs font-black text-red-400 uppercase">{selectedBoss?.difficulty}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-xs font-bold text-white/40">Награда</span>
                      <span className="text-xs font-black text-emerald-400">+{selectedBoss?.reward.xp} XP</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    if (window.confirm('Вы уверены, что хотите сбежать? Это будет считаться поражением.')) {
                      handleFailure();
                    }
                  }}
                  className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-black rounded-2xl uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                >
                  Сбежать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {}
      <AnimatePresence>
        {isEntering && (selectedBoss || isGlobalFight) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl glass rounded-[50px] p-16 border border-red-500/30 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <div className="text-9xl mb-8 animate-bounce">{isGlobalFight ? activeGlobalBoss?.image : selectedBoss?.emoji}</div>
                <h2 className="text-4xl font-black mb-4">{isGlobalFight ? 'Вход в Глобальный Рейд' : 'Вход в покои босса'}</h2>
                <p className="text-white/60 text-lg mb-12 max-w-md mx-auto leading-relaxed">
                  {isGlobalFight ? (
                    <>Вы входите в битву с <span className="text-white font-bold">{activeGlobalBoss?.name}</span>. Ваш урон будет добавлен к общему вкладу сервера!</>
                  ) : (
                    <>Вы собираетесь сразиться с <span className="text-white font-bold">{selectedBoss?.name}</span>. Если вы проиграете, вы потеряете <span className="text-red-400 font-bold">{selectedBoss?.penalty.xp} XP</span> и <span className="text-red-500 font-bold">{selectedBoss?.penalty.coins} монет</span>.</>
                  )}
                </p>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setIsEntering(false);
                      setIsGlobalFight(false);
                    }}
                    className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-3xl text-sm font-black uppercase tracking-widest transition-all"
                  >
                    Назад
                  </button>
                  <button
                    onClick={startFight}
                    className="flex-1 py-5 bg-red-600 hover:bg-red-500 text-white rounded-3xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl shadow-red-600/20"
                  >
                    В БОЙ!
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
