import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { LESSONS } from '../constants/lessons';
import * as Icons from 'lucide-react';
import { Navbar } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { TextReveal } from '../components/TextReveal';

const difficulties = [
  { id: 'Beginner', title: 'Новичок', color: 'blue', icon: 'Zap' },
  { id: 'Intermediate', title: 'Средний', color: 'yellow', icon: 'Shield' },
  { id: 'Advanced', title: 'Продвинутый', color: 'orange', icon: 'Trophy' },
  { id: 'Professional', title: 'Профи', color: 'red', icon: 'Flame' }
];

export const Pathways = () => {
  const { userProfile } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('Beginner');
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const completedLessons = userProfile?.completedLessons || [];

  const progress = Math.round((completedLessons.length / LESSONS.length) * 100) || 0;

  const handleLessonClick = () => {
    playSound('click');
  };

  const filteredLessons = LESSONS.filter(l => l.level === selectedDifficulty);

  return (
    <div ref={containerRef} className="min-h-screen bg-transparent text-white relative overflow-hidden">
      {}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none opacity-30"
        style={{ y: backgroundY }}
      >
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-primary/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-brand-secondary/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 blur-[200px] rounded-full mix-blend-screen" />
      </motion.div>

      
      <div className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <motion.div 
          style={{ opacity }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8"
        >
          <div>
            <h1 className="text-5xl font-display font-bold mb-4">
              <TextReveal text="Пути Обучения" delay={0.1} />
            </h1>
            <p className="text-white/50 text-xl">
              <TextReveal text="Выберите свой квест и начните осваивать Python уже сегодня." delay={0.3} />
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full md:w-80 space-y-2"
            >
              <div className="flex justify-between text-sm font-bold">
                <span>Общий прогресс</span>
                <span className="text-brand-primary">{progress}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {difficulties.map((diff) => {
            const Icon = (Icons as any)[diff.icon] || Icons.Code;
            const diffLessons = LESSONS.filter(l => l.level === diff.id);
            const diffCompleted = diffLessons.filter(l => completedLessons.includes(l.id)).length;
            const diffProgress = Math.round((diffCompleted / diffLessons.length) * 100) || 0;
            const isSelected = selectedDifficulty === diff.id;

            return (
              <motion.button
                key={diff.id}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedDifficulty(diff.id);
                  playSound('click');
                }}
                className={`relative p-6 rounded-3xl border text-left transition-all duration-300 overflow-hidden ${
                  isSelected 
                    ? `bg-${diff.color}-500/20 border-${diff.color}-500/50 shadow-[0_0_30px_rgba(var(--color-${diff.color}-500),0.3)]` 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {isSelected && (
                  <motion.div 
                    layoutId="activeDifficulty"
                    className={`absolute inset-0 bg-gradient-to-br from-${diff.color}-500/10 to-transparent pointer-events-none`}
                  />
                )}
                
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  isSelected ? `bg-${diff.color}-500 text-black` : `bg-white/10 text-${diff.color}-400`
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-bold mb-1">{diff.title}</h3>
                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs font-bold text-white/60">
                    <span>{diffCompleted} / {diffLessons.length} уроков</span>
                    <span className={`text-${diff.color}-400`}>{diffProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${diffProgress}%` }}
                      className={`h-full bg-${diff.color}-500`}
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedDifficulty}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative"
          >
            {}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10 hidden lg:block" />
            
            {filteredLessons.map((lesson, index) => {
              const Icon = (Icons as any)[lesson.icon] || Icons.Code;
              const isCompleted = completedLessons.includes(lesson.id);
              
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 100,
                    damping: 20
                  }}
                  whileHover={{ y: -10 }}
                  className="group relative"
                >
                  {}
                  <div className={`absolute -inset-0.5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500 ${isCompleted ? 'bg-green-500/30' : 'bg-brand-primary/30'}`} />
                  
                  <Link 
                    to={`/lesson/${lesson.id}`} 
                    onClick={handleLessonClick}
                    className="block h-full relative"
                  >
                    <div className={`bg-[#0a0a0a]/90 backdrop-blur-xl rounded-3xl p-8 h-full border transition-all duration-300 flex flex-col relative overflow-hidden ${
                      isCompleted ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_60px_rgba(16,185,129,0.3)] scale-[1.02]' : 'border-white/10 group-hover:border-brand-primary/50 shadow-2xl'
                    }`}>
                      {}
                      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-2xl transition-colors ${isCompleted ? 'bg-emerald-500/30 animate-pulse' : 'bg-white/5 group-hover:bg-brand-primary/10'}`} />

                      <div className="flex items-center justify-between mb-8 relative z-10">
                        <motion.div 
                          whileHover={{ rotate: 15, scale: 1.1 }}
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                          isCompleted ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-br from-white/10 to-white/5 text-white/70 border border-white/10 group-hover:from-brand-primary/20 group-hover:to-brand-primary/5 group-hover:text-brand-primary group-hover:border-brand-primary/30'
                        }`}>
                          {isCompleted ? <Icons.CheckCircle2 className="w-8 h-8" /> : <Icon className="w-8 h-8" />}
                        </motion.div>
                        <div className="flex flex-col items-end gap-2">
                          {isCompleted ? (
                            <div className="flex flex-col items-end gap-1">
                              <div className="px-4 py-1.5 bg-emerald-500 text-black text-xs font-black uppercase rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-2">
                                <Icons.CheckCircle2 className="w-3 h-3" />
                                ПРОЙДЕНО
                              </div>
                              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-1">
                                <Icons.Award className="w-3 h-3" /> МАСТЕРСТВО
                              </span>
                            </div>
                          ) : (
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                              lesson.level === 'Beginner' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              lesson.level === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                              lesson.level === 'Advanced' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                              'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {lesson.level === 'Beginner' ? 'Новичок' : 
                               lesson.level === 'Intermediate' ? 'Средний' : 
                               lesson.level === 'Advanced' ? 'Продвинутый' : 'Профи'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-display font-bold mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-brand-primary group-hover:to-brand-secondary transition-all relative z-10">
                        {lesson.title}
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed mb-8 flex-grow relative z-10">
                        {lesson.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5 relative z-10">
                        <div className={`font-bold text-sm flex items-center gap-2 transition-colors ${isCompleted ? 'text-green-400' : 'text-brand-primary'}`}>
                          {isCompleted ? 'Повторить' : 'Начать квест'}
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <Icons.ArrowRight className="w-4 h-4" />
                          </motion.div>
                        </div>
                        
                        {}
                        <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-white/20'}`} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
