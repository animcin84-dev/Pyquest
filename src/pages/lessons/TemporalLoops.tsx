import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Navbar } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';

const CodeBlock = ({ code, language = 'python', title = 'example.py' }: { code: string, language?: string, title?: string }) => (
  <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d0d0d] my-6 shadow-2xl">
    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      <span className="text-xs font-mono text-white/40">{title}</span>
      <Icons.Copy className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors" />
    </div>
    <div className="p-4 overflow-x-auto">
      <pre className="text-sm font-mono leading-relaxed">
        <code className="text-blue-300">{code}</code>
      </pre>
    </div>
  </div>
);

const InteractiveTerminal = ({ expectedOutput, hint, successMsg, onComplete }: { expectedOutput: string, hint: string, successMsg: string, onComplete: () => void }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRun = () => {
    if (input.trim() === '') return;
    
    let result = '';
    let success = false;
    
    if (input.includes('for') && input.includes('range(5)')) {
      result = '0\n1\n2\n3\n4';
      success = true;
    } else if (input.includes('while')) {
      result = 'Обнаружен бесконечный цикл! Шучу. Но будьте осторожны с циклами while.';
    } else {
      result = 'SyntaxError: invalid syntax';
    }

    setOutput([...output, `>>> ${input}`, result]);
    setInput('');
    
    if (success) {
      setIsSuccess(true);
      onComplete();
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-brand-primary/30 bg-[#0a0a0a] my-8 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
      <div className="flex items-center justify-between px-4 py-3 bg-brand-primary/10 border-b border-brand-primary/20">
        <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
          <Icons.Terminal className="w-4 h-4" />
          Интерактивная оболочка Python
        </div>
        <button 
          onClick={() => setOutput([])}
          className="text-xs text-brand-primary/60 hover:text-brand-primary transition-colors"
        >
          Очистить
        </button>
      </div>
      <div className="p-6 font-mono text-sm h-64 overflow-y-auto flex flex-col gap-2">
        <div className="text-white/40 mb-4">Python 3.12.0 (main, Oct  2 2023, 11:58:13)</div>
        
        {output.map((line, i) => (
          <div key={i} className={line.startsWith('>>>') ? 'text-white/70' : line.includes('Error') ? 'text-red-400' : 'text-green-400 whitespace-pre-wrap'}>
            {line}
          </div>
        ))}

        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-start gap-3"
          >
            <Icons.CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Испытание пройдено!</p>
              <p className="text-sm opacity-80">{successMsg}</p>
            </div>
          </motion.div>
        )}

        {!isSuccess && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-brand-primary">{'>>>'}</span>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white/90 placeholder:text-white/20 resize-none h-20"
              placeholder='Попробуйте ввести: for i in range(5): print(i)'
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        )}
      </div>
      {!isSuccess && (
        <div className="px-4 py-3 bg-white/5 border-t border-white/5 flex justify-between items-center">
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Icons.Lightbulb className="w-3 h-3" />
            Подсказка: {hint}
          </div>
          <button 
            onClick={handleRun}
            className="px-4 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white rounded-md text-sm font-bold transition-colors"
          >
            Запустить код
          </button>
        </div>
      )}
    </div>
  );
};

export const TemporalLoops = () => {
  const { scrollYProgress } = useScroll();
  const yBackground = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacityHeader = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  const [activeSection, setActiveSection] = useState('intro');
  const { completeLesson: markLessonComplete, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isCompleted, setIsCompleted] = useState(false);

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

    const sections = ['intro', 'for-loops', 'while-loops', 'challenge'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (userProfile?.completedLessons?.includes('loops')) {
      setIsCompleted(true);
    }
  }, [userProfile]);

  const handleComplete = async () => {
    setIsCompleted(true);
    await markLessonComplete('loops', 50);
  };

  const handleContinue = () => {
    navigate('/pathways');
  };

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-brand-primary/30">
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-brand-primary z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden border-b border-white/10">
        <motion.div 
          className="absolute inset-0 z-0 opacity-20"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 50% 50%, #ec4899 0%, transparent 50%)',
            y: yBackground 
          }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0" />
        
        <motion.div 
          style={{ opacity: opacityHeader }}
          className="relative z-10 text-center max-w-4xl px-6"
        >
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="px-4 py-1.5 rounded-full bg-brand-secondary/20 text-brand-secondary font-bold text-sm tracking-widest uppercase mb-6 inline-block border border-brand-secondary/30">
              Глава 4 • Средний уровень
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
              Временные <span className="text-gradient">Циклы</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 font-light leading-relaxed">
              Автоматизируйте рутину. Научитесь управлять временем и повторять действия с помощью циклов For и While.
            </p>
          </motion.div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16 relative">
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-32 space-y-2 border-l border-white/10 pl-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">Содержание</h3>
            {[
              { id: 'intro', label: '1. Концепция итерации' },
              { id: 'for-loops', label: '2. Циклы For' },
              { id: 'while-loops', label: '3. Циклы While' },
              { id: 'challenge', label: '4. Горнило' },
            ].map(item => (
              <a 
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={`block py-2 text-sm transition-colors ${activeSection === item.id ? 'text-brand-secondary font-bold' : 'text-white/40 hover:text-white/80'}`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex-1 max-w-3xl space-y-32">
          <section id="intro" className="scroll-mt-32">
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-secondary text-2xl">1</span>
              Концепция итерации
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                Представьте, что вам нужно напечатать числа от 1 до 100. Вы могли бы написать <code>print(1)</code>, <code>print(2)</code> и так далее 100 раз. Или вы могли бы использовать цикл.
              </p>
              <p>
                Циклы фундаментальны для программирования. Они позволяют выполнять блок кода многократно, либо заданное количество раз, либо до тех пор, пока не будет выполнено определенное условие.
              </p>
            </div>
          </section>

          <section id="for-loops" className="scroll-mt-32">
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-secondary text-2xl">2</span>
              Циклы For
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                Цикл <code>for</code> используется для итерации по последовательности (будь то список, кортеж, словарь, множество или строка).
              </p>
              
              <CodeBlock 
                title="for_loop.py"
                code={`fruits = ["яблоко", "банан", "вишня"]\nfor x in fruits:\n  print(x)`} 
              />

              <p>
                Функция <code>range()</code> часто используется с циклами <code>for</code> для генерации последовательности чисел.
              </p>

              <CodeBlock 
                title="range_loop.py"
                code={`for x in range(6):\n  print(x) # Печатает от 0 до 5`} 
              />
            </div>
          </section>

          <section id="while-loops" className="scroll-mt-32">
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-secondary text-2xl">3</span>
              Циклы While
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                С помощью цикла <code>while</code> мы можем выполнять набор инструкций до тех пор, пока условие истинно.
              </p>
              
              <CodeBlock 
                title="while_loop.py"
                code={`i = 1\nwhile i < 6:\n  print(i)\n  i += 1`} 
              />

              <div className="p-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-200 my-6">
                <div className="flex items-center gap-3 mb-3 font-bold text-lg">
                  <Icons.AlertTriangle className="w-5 h-5" />
                  Предупреждение: Бесконечные циклы
                </div>
                <div className="text-white/70 leading-relaxed text-sm">
                  Если вы забудете увеличить <code>i</code> в примере выше, цикл будет работать вечно! Всегда следите за тем, чтобы у вашего цикла while был способ в конечном итоге сделать условие ложным.
                </div>
              </div>
            </div>
          </section>

          <section id="challenge" className="scroll-mt-32 pt-10 border-t border-white/10">
            <div className="text-center mb-12">
              <span className="w-16 h-16 mx-auto rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary mb-6">
                <Icons.Repeat className="w-8 h-8" />
              </span>
              <h2 className="text-4xl font-display font-bold mb-4">Горнило</h2>
              <p className="text-white/50">Напишите цикл, который печатает числа от 0 до 4.</p>
            </div>

            <InteractiveTerminal 
              expectedOutput="0\n1\n2\n3\n4"
              hint="Используйте цикл for с функцией range()."
              successMsg="Отлично! Вы овладели искусством повторения."
              onComplete={handleComplete}
            />

            <AnimatePresence>
              {isCompleted && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-16 flex justify-between items-center p-8 glass rounded-3xl border border-green-500/30 bg-green-500/5"
                >
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-green-400">Урок освоен!</h4>
                    <p className="text-white/50 text-sm">+50 XP получено. Вы готовы к следующему испытанию.</p>
                  </div>
                  <button 
                    onClick={handleContinue}
                    className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    Продолжить путь
                    <Icons.ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </div>
      </div>
    </div>
  );
};
