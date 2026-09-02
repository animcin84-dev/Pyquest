import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LESSONS } from '../constants/lessons';
import { PythonGame } from '../components/PythonGame';
import { Navbar } from '../components/Layout';
import * as Icons from 'lucide-react';
import { PythonGenesis } from './lessons/PythonGenesis';
import { DataVessels } from './lessons/DataVessels';
import { TheCollection } from './lessons/TheCollection';
import { TemporalLoops } from './lessons/TemporalLoops';
import { CodeAlchemy } from './lessons/CodeAlchemy';
import { RichLessonDetail } from './lessons/RichLessonDetail';

import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { MagneticButton } from '../components/MagneticButton';

export const LessonDetail = () => {
  const { updateQuestProgress } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const lesson = LESSONS.find(l => l.id === id);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Урок не найден</h1>
          <Link to="/pathways" className="text-brand-primary hover:underline">Вернуться к путям</Link>
        </div>
      </div>
    );
  }

  if (lesson.id === 'intro') {
    return <PythonGenesis />;
  }
  
  if (lesson.id === 'variables') {
    return <DataVessels />;
  }

  if (lesson.id === 'lists') {
    return <TheCollection />;
  }

  if (lesson.id === 'loops') {
    return <TemporalLoops />;
  }

  if (lesson.id === 'functions') {
    return <CodeAlchemy />;
  }

  if (lesson.sections) {
    return <RichLessonDetail lesson={lesson} />;
  }

  const handleComplete = () => {
    setIsCompleted(true);
    updateQuestProgress('lesson');
    playSound('levelUp');
    const saved = localStorage.getItem('pyquest_progress');
    const completed = saved ? JSON.parse(saved) : [];
    if (!completed.includes(lesson.id)) {
      completed.push(lesson.id);
      localStorage.setItem('pyquest_progress', JSON.stringify(completed));
    }
  };

  const nextLesson = LESSONS[LESSONS.indexOf(lesson) + 1];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <Link to="/pathways" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8">
            <Icons.ChevronLeft className="w-4 h-4" />
            Назад к путям
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase tracking-widest">
                  {lesson.level}
                </span>
                <span className="text-white/20">•</span>
                <span className="text-white/40 text-sm">Урок {LESSONS.indexOf(lesson) + 1} из {LESSONS.length}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">{lesson.title}</h1>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="glass rounded-3xl p-8 md:p-12">
              <p className="text-xl text-white/70 leading-relaxed mb-8">
                {lesson.content}
              </p>
              
              <PythonGame lesson={lesson} onComplete={handleComplete} />
            </div>

            <AnimatePresence>
              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-3xl p-8 border-green-500/30 bg-green-500/5 flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                      <Icons.Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Урок освоен!</h3>
                      <p className="text-white/50">Вы успешно завершили {lesson.title}.</p>
                    </div>
                  </div>
                  
                  {nextLesson ? (
                    <MagneticButton
                      onClick={() => {
                        setIsCompleted(false);
                        navigate(`/lesson/${nextLesson.id}`);
                      }}
                      className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-white/90 transition-all flex items-center gap-2"
                    >
                      Следующий урок
                      <Icons.ArrowRight className="w-4 h-4" />
                    </MagneticButton>
                  ) : (
                    <Link to="/pathways">
                      <MagneticButton
                        className="px-8 py-3 bg-brand-primary text-white rounded-full font-bold hover:bg-brand-primary/90 transition-all"
                      >
                        Вернуться к путям
                      </MagneticButton>
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-3xl p-8 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Icons.Lightbulb className="w-5 h-5 text-yellow-400" />
                Основные выводы
              </h3>
              <ul className="space-y-4 text-sm text-white/60">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                  Поймите основной синтаксис и назначение {lesson.title}.
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                  Узнайте, как применять эти концепции в реальных сценариях.
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                  Практикуйтесь в интерактивном терминале для закрепления навыков.
                </li>
              </ul>
            </div>

            <div className="glass rounded-3xl p-8 bg-brand-primary/5 border-brand-primary/20">
              <h3 className="text-lg font-bold mb-4">Нужна помощь?</h3>
              <p className="text-sm text-white/50 mb-6">
                Застряли на испытании? Присоединяйтесь к нашему сообществу из 50 000+ учеников.
              </p>
              <button className="w-full py-3 glass rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
                Вступить в Discord
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
