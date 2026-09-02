import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Navbar } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { Lesson } from '../../constants/lessons';
import { PythonGame } from '../../components/PythonGame';
import { playSound } from '../../utils/sounds';
import { FloatingParticles } from '../../components/FloatingParticles';

const CodeBlock = ({ code, language = 'python', title = 'example.py' }: { code: string, language?: string, title?: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    playSound('click');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.01, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)" }}
      className="rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] my-8 shadow-2xl relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5 backdrop-blur-md">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
        </div>
        <span className="text-xs font-mono text-white/40 tracking-wider">{title}</span>
        <button onClick={handleCopy} className="text-white/40 hover:text-white transition-colors relative">
          {isCopied ? <Icons.Check className="w-4 h-4 text-green-400" /> : <Icons.Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-6 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed">
          <code className="text-blue-300/90">{code}</code>
        </pre>
      </div>
    </motion.div>
  );
};

const MiniQuiz = ({ lesson }: { lesson: Lesson }) => {
  const quiz = lesson.quiz || {
    q: 'Что из этого является правильным комментарием в Python?',
    options: ['// Комментарий', '/* Комментарий */', '# Комментарий', '<!-- Комментарий -->'],
    answer: 2
  };

  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSelect = (idx: number) => {
    setSelected(idx);
    const correct = idx === quiz.answer;
    setIsCorrect(correct);
    if (correct) {
      playSound('success');
    } else {
      playSound('error');
    }
  };

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <motion.div 
      ref={containerRef}
      whileHover={{ scale: 1.02 }}
      className="space-y-8 relative overflow-hidden group p-8 md:p-10 bg-gradient-to-br from-[#0a0a0a] to-[#111] rounded-[2.5rem] border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none" />
      <h4 className="text-2xl md:text-[28px] font-display font-bold text-white mb-8 relative z-10 leading-snug">{quiz.q}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
        {quiz.options.map((opt, idx) => (
          <motion.button
            whileHover={selected === null ? { scale: 1.05, y: -5 } : {}}
            whileTap={selected === null ? { scale: 0.95 } : {}}
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={selected !== null}
            className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden group/btn ${
              selected === null 
                ? 'border-white/10 hover:border-brand-primary hover:bg-brand-primary/10 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]' 
                : idx === quiz.answer 
                  ? 'border-green-500 bg-green-500/20 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.3)]'
                  : selected === idx 
                    ? 'border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_40px_rgba(239,68,68,0.3)]'
                    : 'border-white/5 opacity-30 grayscale'
            }`}
          >
            <span className="font-mono text-lg md:text-xl relative z-10 font-medium">{opt}</span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {isCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", bounce: 0.6 }}
            className={`p-6 rounded-2xl text-center font-black text-xl md:text-2xl relative z-10 shadow-xl ${isCorrect ? 'text-green-400 bg-green-500/10 border border-green-500/30' : 'text-red-400 bg-red-500/10 border border-red-500/30'}`}
          >
            {isCorrect ? '🎉 Великолепно! Идеальный ответ.' : '💥 Ошибка. Но ошибки делают нас сильнее!'}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};



export const RichLessonDetail = ({ lesson }: { lesson: Lesson }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const yBackground = useTransform(smoothProgress, [0, 1], ['0%', '30%']);
  const yTitle = useTransform(smoothProgress, [0, 1], ['0%', '100%']);
  const opacityHeader = useTransform(smoothProgress, [0, 0.2], [1, 0]);
  const scaleHeader = useTransform(smoothProgress, [0, 0.2], [1, 0.95]);
  
  const [activeSection, setActiveSection] = useState(lesson.sections?.[0]?.id || 'intro');
  const { completeLesson: markLessonComplete, userProfile, updateQuestProgress } = useAuth();
  const navigate = useNavigate();
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasMistakes, setHasMistakes] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    const sections = lesson.sections?.map(s => s.id) || [];
    sections.push('challenge');
    
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [lesson]);

  useEffect(() => {
    if (userProfile?.completedLessons?.includes(lesson.id)) {
      setIsCompleted(true);
    }
  }, [userProfile, lesson.id]);

  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [lesson.id]);

  const handleComplete = async () => {
    setIsCompleted(true);
    updateQuestProgress('lesson');
    if (!hasMistakes) {
      updateQuestProgress('perfect_lesson');
    }
    playSound('levelUp');
    await markLessonComplete(lesson.id, 50);
  };

  const handleContinue = () => {
    navigate('/pathways');
  };

  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-400 to-teal-600',
    pink: 'from-pink-400 to-rose-600',
    yellow: 'from-yellow-400 to-orange-600',
    cyan: 'from-cyan-400 to-blue-600',
    orange: 'from-orange-400 to-red-600',
    red: 'from-red-400 to-rose-600',
    purple: 'from-purple-400 to-fuchsia-600',
  };

  const bgMap: Record<string, string> = {
    emerald: '#10b981',
    pink: '#f472b6',
    yellow: '#facc15',
    cyan: '#22d3ee',
    orange: '#fb923c',
    red: '#f87171',
    purple: '#a855f7',
  };

  const colorClass = colorMap[lesson.color || 'purple'];
  const bgColor = bgMap[lesson.color || 'purple'];

  return (
    <div ref={containerRef} className="min-h-screen bg-transparent text-white selection:bg-white/30 relative">
      
      {}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1.5 z-50 origin-left"
        style={{ scaleX: smoothProgress, backgroundColor: bgColor, boxShadow: `0 0 20px ${bgColor}` }}
      />

      {}
      <AnimatePresence>
        {activeSection === 'challenge' && !isCompleted && (
          <motion.div
            initial={{ opacity: 0, x: 100, rotate: 10 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: 100, rotate: -10 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="fixed bottom-8 right-8 z-50 max-w-xs bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl hidden md:flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
              <Icons.Lightbulb className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h5 className="font-bold text-sm mb-1 text-white">Совет</h5>
              <p className="text-xs text-white/60 leading-relaxed">
                Внимательно прочитайте задание. Если застряли, попробуйте вернуться к предыдущим разделам урока.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <div className="relative h-[80vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <FloatingParticles color={bgColor} count={8} />
        <motion.div 
          className="absolute inset-0 z-0 opacity-30"
          style={{ 
            backgroundImage: `radial-gradient(circle at 50% 50%, ${bgColor} 0%, transparent 60%)`,
            y: yBackground,
            filter: 'blur(60px)'
          }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0 mix-blend-overlay" />
        
        <motion.div 
          style={{ opacity: opacityHeader, scale: scaleHeader, y: yTitle }}
          className="relative z-10 text-center max-w-5xl px-6"
        >
          <motion.div 
            initial={{ opacity: 0, y: 50, rotateX: -20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: 1000 }}
          >
            <span className="px-6 py-2 rounded-full bg-white/5 font-bold text-xs tracking-[0.2em] uppercase mb-8 inline-block border border-white/10 backdrop-blur-md shadow-2xl" style={{ color: bgColor }}>
              {lesson.level}
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-black mb-8 tracking-tighter leading-none">
              <span className={`text-transparent bg-clip-text bg-gradient-to-br ${colorClass} drop-shadow-2xl`}>{lesson.title}</span>
            </h1>
            <p className="text-2xl md:text-3xl text-white/50 font-light leading-relaxed max-w-3xl mx-auto">
              {lesson.description}
            </p>
          </motion.div>
        </motion.div>

        {}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          style={{ opacity: opacityHeader }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-white/30">Скролльте вниз</span>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center p-1"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </motion.div>
        </motion.div>
      </div>

      {}
      <div className="w-full max-w-[98%] md:max-w-[95%] mx-auto px-4 py-20 relative">
        
        {}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="hidden xl:block fixed left-6 top-1/2 -translate-y-[45%] z-50 bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-72"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 rounded-[2rem] pointer-events-none" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8 ml-2 relative z-10">Навигация</h3>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 relative z-10 custom-scrollbar scroll-smooth">
            {lesson.sections?.map((item, idx) => (
              <a 
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-300 relative group overflow-hidden ${activeSection === item.id ? 'font-bold bg-white/10 scale-105' : 'text-white/50 hover:text-white/90 hover:bg-white/5'}`}
                style={{ color: activeSection === item.id ? bgColor : undefined }}
              >
                {activeSection === item.id && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                    style={{ backgroundColor: bgColor, boxShadow: `0 0 10px ${bgColor}` }}
                  />
                )}
                <span className="opacity-40 mr-2 font-mono text-xs hidden group-hover:inline-block transition-all">0{idx + 1}.</span> 
                {item.title}
              </a>
            ))}
            <a 
              href="#challenge"
              onClick={() => setActiveSection('challenge')}
              className={`block px-4 py-3 rounded-xl text-sm transition-all duration-300 relative mt-6 pt-4 border-t border-white/10 ${activeSection === 'challenge' ? 'font-bold bg-white/10 scale-105' : 'text-white/50 hover:text-white/90 hover:bg-white/5'}`}
              style={{ color: activeSection === 'challenge' ? bgColor : undefined }}
            >
              {activeSection === 'challenge' && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                  style={{ backgroundColor: bgColor, boxShadow: `0 0 10px ${bgColor}` }}
                />
              )}
              <Icons.Swords className="w-4 h-4 inline-block mr-2 opacity-50" />
              Босс-файт
            </a>
          </div>
        </motion.div>

        {}
        <div className="flex-1 w-full xl:max-w-[calc(100%-320px)] xl:ml-auto space-y-32">
          {lesson.sections?.map((section, idx) => (
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              key={section.id} 
              id={section.id} 
              className="scroll-mt-40 relative group p-8 md:p-12 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors duration-500 shadow-2xl"
            >
              {}
              <div className="absolute -inset-px bg-gradient-to-br from-brand-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 pointer-events-none rounded-[3rem] z-0" />
              
              <div className="absolute -top-10 -right-4 text-9xl font-black text-white/[0.03] select-none pointer-events-none hidden md:block z-0">
                0{idx + 1}
              </div>
              
              <h2 className="relative z-10 text-4xl md:text-5xl font-display font-bold mb-10 tracking-tight text-white group-hover:text-white/90 transition-colors duration-300">
                {section.title}
              </h2>
              
              <div className="relative z-10 max-w-none space-y-8">
                {section.content.map((p, i) => (
                  <p
                    key={i} 
                    className="text-xl md:text-[22px] leading-[1.8] font-light tracking-wide text-white/80"
                  >
                    {p}
                  </p>
                ))}
                
                {}
                {section.code && (
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="mt-12"
                  >
                    <CodeBlock 
                      title="console.py"
                      code={section.code} 
                    />
                  </motion.div>
                )}
              </div>
            </motion.section>
          ))}

          {}
          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.8 }}
            className="scroll-mt-40 pt-20 pb-20 border-t border-white/10 relative"
          >
            <div className="text-center mb-12">
              <h3 className="text-3xl font-display font-bold mb-4">Мини-практика</h3>
              <p className="text-white/50">Проверьте свое понимание перед финальным испытанием.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto backdrop-blur-md">
              <MiniQuiz lesson={lesson} />
            </div>
          </motion.section>

          {}
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            id="challenge" 
            className="scroll-mt-40 pt-20 border-t border-white/10 relative"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="text-center mb-16">
              <motion.div 
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="w-24 h-24 mx-auto rounded-3xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 shadow-2xl backdrop-blur-xl" 
                style={{ color: bgColor, boxShadow: `0 0 40px ${bgColor}20` }}
              >
                <Icons.Swords className="w-12 h-12" />
              </motion.div>
              <h2 className="text-5xl font-display font-black mb-6 tracking-tighter">Испытание</h2>
              <p className="text-xl text-white/50 max-w-2xl mx-auto">Примените полученные знания на практике, чтобы завершить урок и получить награду.</p>
            </div>

            <PythonGame lesson={lesson} onComplete={handleComplete} onMistake={() => setHasMistakes(true)} />

            <AnimatePresence>
              {isCompleted && (
                <motion.div 
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="mt-20 flex flex-col md:flex-row justify-between items-center p-10 glass rounded-[40px] border-2 border-green-500/30 bg-green-500/10 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-green-500/20 blur-[100px] rounded-full group-hover:bg-green-500/30 transition-colors duration-700" />
                  
                  <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
                    <h4 className="text-3xl font-black mb-3 text-green-400 tracking-tight">Урок освоен!</h4>
                    <p className="text-white/60 text-lg flex items-center justify-center md:justify-start gap-2">
                      <Icons.Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      +50 XP получено. Вы готовы к следующему шагу.
                    </p>
                  </div>
                  <button 
                    onClick={handleContinue}
                    className="relative z-10 px-10 py-5 bg-white text-black rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  >
                    Продолжить путь
                    <Icons.ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

        </div>
      </div>
    </div>
  );
};

