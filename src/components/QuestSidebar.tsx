import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Coins, CheckCircle2, ChevronRight, ChevronLeft, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';

export const QuestSidebar = () => {
  const { userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedQuests, setExpandedQuests] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  if (!userProfile || !userProfile.dailyQuests) return null;

  const toggleExpand = (id: string) => {
    setExpandedQuests(prev => ({ ...prev, [id]: !prev[id] }));
    playSound('click');
  };

  const completedCount = userProfile.dailyQuests.filter(q => q.completed).length;
  const totalCount = userProfile.dailyQuests.length;

  const handleQuestSolve = (quest: any) => {
    playSound('click');
    const type = quest.type?.toLowerCase();
    
    let targetPath = '/dashboard';
    if (type === 'lesson' || type === 'perfect_lesson') targetPath = '/pathways';
    else if (type === 'duel') targetPath = '/duels';
    else if (type === 'sandbox') targetPath = '/sandbox';
    else if (type === 'spend' || type === 'buy_item' || type === 'sell_item') targetPath = '/shop';
    else if (type === 'pet_feed') targetPath = '/inventory';
    else if (type === 'gain_xp' || type === 'earn_coins') targetPath = '/daily';
    
    navigate(targetPath);
    setIsOpen(false);
  };

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] flex items-center">
      {}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          playSound('click');
        }}
        className={`w-14 h-28 bg-black/90 backdrop-blur-2xl border-y border-l border-brand-primary/30 rounded-l-[2rem] flex flex-col items-center justify-center gap-2 transition-all hover:bg-black group shadow-[0_0_30px_rgba(99,102,241,0.2)] ${isOpen ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
      >
        <div className="relative">
          <div className="absolute -inset-2 bg-brand-primary/20 blur-lg rounded-full animate-pulse" />
          <Target className="w-7 h-7 text-brand-primary relative z-10" />
          {completedCount < totalCount && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black z-20" />
          )}
        </div>
        <div className="flex flex-col items-center -space-y-1">
          <ChevronLeft className="w-5 h-5 text-brand-primary group-hover:scale-125 transition-transform" />
          <span className="text-[8px] font-black text-brand-primary uppercase tracking-tighter">Квесты</span>
        </div>
      </button>

      {}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 h-[600px] bg-black/95 backdrop-blur-3xl border-l border-y border-white/10 rounded-l-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            {}
            <div className="p-6 border-bottom border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Квесты</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                    Выполнено: {completedCount}/{totalCount}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {userProfile.dailyQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    quest.completed 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-bold leading-tight ${quest.completed ? 'text-emerald-500' : 'text-white'}`}>
                        {quest.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {quest.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                        <button 
                          onClick={() => toggleExpand(quest.id)}
                          className={`p-1 rounded-lg hover:bg-white/10 transition-all ${expandedQuests[quest.id] ? 'rotate-90 text-brand-primary' : 'text-white/40'}`}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedQuests[quest.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-[10px] text-white/50 leading-relaxed py-1">
                            {quest.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <span>Прогресс</span>
                        <span>{quest.current} / {quest.target}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(quest.current / quest.target) * 100}%` }}
                          className={`h-full rounded-full ${quest.completed ? 'bg-emerald-500' : 'bg-brand-primary'}`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1">
                          <Coins className="w-3 h-3 text-yellow-500" />
                          <span className="text-[10px] font-black text-yellow-500">+{quest.reward.coins}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-brand-primary" />
                          <span className="text-[10px] font-black text-brand-primary">+{quest.reward.xp} XP</span>
                        </div>
                      </div>
                      {!quest.completed && (
                        <button
                          onClick={() => handleQuestSolve(quest)}
                          className="px-2 py-1 bg-brand-primary/20 hover:bg-brand-primary text-brand-primary hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                        >
                          Решить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {}
            <div className="p-4 bg-white/5 border-t border-white/10 text-center">
              <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-black">
                Обновление каждые 24 часа
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
