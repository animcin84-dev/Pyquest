import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, Crown, Star, Zap, Shield, Heart, Coins, CheckCircle2, Lock, Flame, Target, Rocket, Code2, Bug, Eye } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { TextReveal } from '../components/TextReveal';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  reward: number;
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  category: 'learning' | 'arcade' | 'social' | 'special';
}

const ACHIEVEMENT_LIST: Omit<Achievement, 'isUnlocked' | 'progress'>[] = [
  { id: 'a1', title: 'Первые шаги', description: 'Завершите первый урок по Python.', icon: <Rocket className="w-8 h-8" />, reward: 50, maxProgress: 1, category: 'learning' },
  { id: 'a2', title: 'Мастер кода', description: 'Завершите 10 уроков.', icon: <Code2 className="w-8 h-8" />, reward: 200, maxProgress: 10, category: 'learning' },
  { id: 'a3', title: 'Охотник на багов', description: 'Найдите 50 ошибок в Debug Rush.', icon: <Bug className="w-8 h-8" />, reward: 150, maxProgress: 50, category: 'arcade' },
  { id: 'a4', title: 'Предсказатель', description: 'Угадайте 30 выводов в Predictor.', icon: <Eye className="w-8 h-8" />, reward: 120, maxProgress: 30, category: 'arcade' },
  { id: 'a5', title: 'В огне!', description: 'Поддерживайте серию заходов в течение 7 дней.', icon: <Flame className="w-8 h-8" />, reward: 300, maxProgress: 7, category: 'special' },
  { id: 'a6', title: 'Богач', description: 'Накопите 5000 монет.', icon: <Coins className="w-8 h-8" />, reward: 100, maxProgress: 5000, category: 'social' },
  { id: 'a7', title: 'Снайпер синтаксиса', description: 'Пройдите Syntax Match без ошибок.', icon: <Target className="w-8 h-8" />, reward: 250, maxProgress: 1, category: 'arcade' },
  { id: 'a8', title: 'Легенда', description: 'Достигните 50 уровня.', icon: <Crown className="w-8 h-8" />, reward: 1000, maxProgress: 50, category: 'special' },
];

export const Achievements = () => {
  const { userProfile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'learning' | 'arcade' | 'social' | 'special'>('all');

  useEffect(() => {
    
    
    const mapped = ACHIEVEMENT_LIST.map(a => {
      let progress = 0;
      if (a.id === 'a1') progress = userProfile?.completedLessons?.length ? 1 : 0;
      if (a.id === 'a2') progress = userProfile?.completedLessons?.length || 0;
      if (a.id === 'a5') progress = userProfile?.streak || 0;
      if (a.id === 'a6') progress = userProfile?.coins || 0;
      if (a.id === 'a8') progress = userProfile?.level || 1;
      
      return {
        ...a,
        progress: Math.min(progress, a.maxProgress),
        isUnlocked: progress >= a.maxProgress
      };
    });
    setAchievements(mapped);
  }, [userProfile]);

  const filtered = activeCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-transparent text-white">
      
      <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary mx-auto mb-8 border border-brand-primary/30 shadow-[0_0_50px_rgba(99,102,241,0.2)]"
          >
            <Trophy className="w-12 h-12" />
          </motion.div>
          <h1 className="text-6xl font-display font-bold mb-4 tracking-tight">
            <TextReveal text="Зал " delay={0.1} />
            <span className="text-brand-primary italic serif">Достижений</span>
          </h1>
          <p className="text-white/40 text-xl max-w-2xl mx-auto">Твои победы на пути к мастерству Python. Каждое достижение приносит награды и славу.</p>
        </header>

        {}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="glass p-8 rounded-3xl border border-white/10 text-center">
            <div className="text-4xl font-bold text-brand-primary mb-2">{achievements.filter(a => a.isUnlocked).length}</div>
            <div className="text-white/40 text-xs uppercase tracking-widest">Разблокировано</div>
          </div>
          <div className="glass p-8 rounded-3xl border border-white/10 text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">{achievements.reduce((acc, a) => acc + (a.isUnlocked ? a.reward : 0), 0)}</div>
            <div className="text-white/40 text-xs uppercase tracking-widest">Бонусный опыт</div>
          </div>
          <div className="glass p-8 rounded-3xl border border-white/10 text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">{Math.floor(achievements.filter(a => a.isUnlocked).length / achievements.length * 100)}%</div>
            <div className="text-white/40 text-xs uppercase tracking-widest">Общий прогресс</div>
          </div>
          <div className="glass p-8 rounded-3xl border border-white/10 text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">{userProfile?.level || 1}</div>
            <div className="text-white/40 text-xs uppercase tracking-widest">Текущий уровень</div>
          </div>
        </div>

        {}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {['all', 'learning', 'arcade', 'social', 'special'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={`px-8 py-3 rounded-full font-bold transition-all ${activeCategory === cat ? 'bg-brand-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'glass text-white/40 hover:text-white'}`}
            >
              {cat === 'all' ? 'Все' : cat === 'learning' ? 'Обучение' : cat === 'arcade' ? 'Аркада' : cat === 'social' ? 'Социальные' : 'Особые'}
            </button>
          ))}
        </div>

        {}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative glass rounded-[40px] p-8 border transition-all duration-500 overflow-hidden ${achievement.isUnlocked ? 'border-brand-primary/30 bg-brand-primary/5' : 'border-white/5 grayscale opacity-60'}`}
              >
                {}
                {achievement.isUnlocked && (
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full" />
                )}

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${achievement.isUnlocked ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/5 text-white/20'}`}>
                      {achievement.icon}
                    </div>
                    {achievement.isUnlocked ? (
                      <div className="bg-green-500/20 text-green-400 p-2 rounded-full">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="bg-white/5 text-white/20 p-2 rounded-full">
                        <Lock className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold mb-2">{achievement.title}</h3>
                  <p className="text-white/40 text-sm mb-6 leading-relaxed">{achievement.description}</p>

                  {}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span className={achievement.isUnlocked ? 'text-brand-primary' : 'text-white/20'}>{achievement.progress} / {achievement.maxProgress}</span>
                      <span className="text-white/20">{Math.floor(achievement.progress / achievement.maxProgress * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${achievement.progress / achievement.maxProgress * 100}%` }}
                        className={`h-full transition-colors duration-500 ${achievement.isUnlocked ? 'bg-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10'}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-yellow-500 font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>+{achievement.reward} XP</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
