import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Navbar } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { BossFight } from '../../components/BossFight';



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

const TypewriterText = ({ text, delay = 0, onComplete }: { text: string, delay?: number, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          if (onComplete) onComplete();
        }
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay, onComplete]);

  return <span>{displayedText}</span>;
};

const InteractiveTerminal = ({ expectedOutput, hint, successMsg, onComplete }: { expectedOutput: string, hint: string, successMsg: string, onComplete: () => void }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<{type: 'input' | 'output' | 'error', text: string}[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, isTyping]);

  const handleRun = () => {
    if (input.trim() === '' || isTyping) return;
    
    let result = '';
    let success = false;
    let isError = false;
    
    
    const normalizedInput = input.trim().replace(/'/g, '"');
    
    if (normalizedInput === 'print("Hello, World!")') {
      result = 'Hello, World!';
      success = true;
    } else if (normalizedInput.startsWith('print(') && normalizedInput.endsWith(')')) {
      const match = normalizedInput.match(/print\((["'])(.*?)\1\)/);
      if (match) {
        result = match[2];
        if (result === 'Hello, World!') success = true;
      } else {
        result = 'SyntaxError: invalid syntax';
        isError = true;
      }
    } else {
      result = 'SyntaxError: invalid syntax';
      isError = true;
    }

    setOutput(prev => [...prev, { type: 'input', text: `>>> ${input}` }]);
    setOutput(prev => [...prev, { type: isError ? 'error' : 'output', text: result }]);
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
      <div ref={scrollRef} className="p-6 font-mono text-sm h-64 overflow-y-auto flex flex-col gap-2 scroll-smooth">
        <div className="text-white/40 mb-4">
          Python 3.12.0 (main, Oct  2 2023, 11:58:13) [Clang 14.0.0] on darwin<br/>
          Введите "help", "copyright", "credits" или "license" для получения дополнительной информации.
        </div>
        
        {output.map((line, i) => (
          <div key={i} className={
            line.type === 'input' ? 'text-white/70' : 
            line.type === 'error' ? 'text-red-400' : 
            'text-green-400'
          }>
            {line.text}
          </div>
        ))}

        {isSuccess && !isTyping && (
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
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              disabled={isTyping}
              className="flex-1 bg-transparent outline-none text-white/90 placeholder:text-white/20 disabled:opacity-50"
              placeholder='Попробуйте ввести: print("Hello, World!")'
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
            disabled={isTyping || input.trim() === ''}
            className="px-4 py-1.5 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-bold transition-colors"
          >
            Запустить код
          </button>
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ title, icon: Icon, children, type = 'info' }: any) => {
  const colors = {
    info: 'border-blue-500/30 bg-blue-500/5 text-blue-200',
    warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-200',
    deep: 'border-purple-500/30 bg-purple-500/5 text-purple-200',
  };
  
  return (
    <div className={`p-6 rounded-2xl border ${colors[type as keyof typeof colors]} my-6`}>
      <div className="flex items-center gap-3 mb-3 font-bold text-lg">
        <Icon className="w-5 h-5" />
        {title}
      </div>
      <div className="text-white/70 leading-relaxed text-sm">
        {children}
      </div>
    </div>
  );
};

const MemoryVisualizer = () => {
  const [step, setStep] = useState(0);

  const steps = [
    { code: "a = [1, 2, 3]", desc: "Создан объект списка в памяти. Ярлык 'a' указывает на него." },
    { code: "b = a", desc: "Ярлык 'b' прикреплен к ТОМУ ЖЕ объекту. Копирования не произошло!" },
    { code: "b.append(4)", desc: "Объект изменен через ярлык 'b'." },
    { code: "print(a)", desc: "Поскольку 'a' указывает на тот же объект, мы видим изменения." }
  ];

  return (
    <div className="my-8 p-6 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Code Execution Panel */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-white/50 uppercase tracking-widest">Код</h4>
            <span className="text-xs font-mono text-brand-primary">Шаг {step + 1}/4</span>
          </div>
          <div className="font-mono text-sm bg-black/50 p-4 rounded-xl border border-white/5 h-40 flex flex-col justify-center">
            {steps.map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i <= step ? 1 : 0.2, x: 0 }}
                className={`${i === step ? 'text-green-400 font-bold' : 'text-white/50'} py-1`}
              >
                {s.code}
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-white/70 h-12">{steps[step].desc}</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-sm font-bold transition-all"
            >
              Назад
            </button>
            <button 
              onClick={() => setStep(Math.min(3, step + 1))}
              disabled={step === 3}
              className="flex-1 px-4 py-2 bg-brand-primary hover:bg-brand-secondary disabled:opacity-30 text-white rounded-lg text-sm font-bold transition-all"
            >
              Следующий шаг
            </button>
          </div>
        </div>

        {/* Memory Representation */}
        <div className="flex-1 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 flex flex-col items-center justify-center relative min-h-[200px]">
          <h4 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-8 absolute top-0 left-8 md:left-8">Оперативная память</h4>
          
          <div className="relative w-full max-w-[200px] mt-8">
            {/* The Object in Memory */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-full p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-2xl text-center relative z-10 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
            >
              <div className="text-xs text-purple-300/70 font-mono mb-2">id: 0x104A8B</div>
              <div className="font-mono text-xl font-bold text-white">
                [1, 2, 3{step >= 2 && <motion.span initial={{opacity:0, color:'#4ade80'}} animate={{opacity:1, color:'#fff'}}>, 4</motion.span>}]
              </div>
            </motion.div>

            {/* Label A */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute -left-16 top-2 px-3 py-1 bg-yellow-500 text-black font-bold font-mono rounded-md shadow-lg z-20"
            >
              a
              <svg className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-2 text-yellow-500" preserveAspectRatio="none" viewBox="0 0 100 10">
                <line x1="0" y1="5" x2="100" y2="5" stroke="currentColor" strokeWidth="4" />
                <polygon points="100,5 90,0 90,10" fill="currentColor" />
              </svg>
            </motion.div>

            {/* Label B */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute -right-16 bottom-2 px-3 py-1 bg-green-500 text-black font-bold font-mono rounded-md shadow-lg z-20"
                >
                  b
                  <svg className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-2 text-green-500" preserveAspectRatio="none" viewBox="0 0 100 10">
                    <line x1="100" y1="5" x2="0" y2="5" stroke="currentColor" strokeWidth="4" />
                    <polygon points="0,5 10,0 10,10" fill="currentColor" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const Quiz = ({ question, options, correctAnswerIndex, explanation }: { question: string, options: string[], correctAnswerIndex: number, explanation: string }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isCorrect = selected === correctAnswerIndex;

  return (
    <div className="my-8 p-6 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl">
      <h4 className="text-xl font-bold mb-6 flex items-center gap-3">
        <Icons.HelpCircle className="w-6 h-6 text-brand-primary" />
        Проверка знаний
      </h4>
      <p className="text-lg mb-6 text-white/90">{question}</p>
      
      <div className="space-y-3 mb-6">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !isSubmitted && setSelected(i)}
            disabled={isSubmitted}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              isSubmitted 
                ? i === correctAnswerIndex 
                  ? 'bg-green-500/20 border-green-500/50 text-green-200'
                  : i === selected 
                    ? 'bg-red-500/20 border-red-500/50 text-red-200'
                    : 'bg-white/5 border-white/10 opacity-50'
                : selected === i
                  ? 'bg-brand-primary/20 border-brand-primary/50 text-white'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{opt}</span>
              {isSubmitted && i === correctAnswerIndex && <Icons.CheckCircle2 className="w-5 h-5 text-green-400" />}
              {isSubmitted && i === selected && i !== correctAnswerIndex && <Icons.XCircle className="w-5 h-5 text-red-400" />}
            </div>
          </button>
        ))}
      </div>

      {!isSubmitted ? (
        <button
          onClick={() => setIsSubmitted(true)}
          disabled={selected === null}
          className="w-full py-3 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all"
        >
          Проверить ответ
        </button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-200' : 'bg-red-500/10 border-red-500/30 text-red-200'}`}
        >
          <p className="font-bold mb-1">{isCorrect ? 'Верно!' : 'Не совсем так.'}</p>
          <p className="text-sm opacity-90">{explanation}</p>
        </motion.div>
      )}
    </div>
  );
};

const Confetti = () => {
  const colors = ['#4ade80', '#facc15', '#60a5fa', '#f87171', '#c084fc'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: '50vw', 
            y: '50vh', 
            scale: 0,
            opacity: 1
          }}
          animate={{ 
            x: `${Math.random() * 100}vw`, 
            y: `${Math.random() * 100}vh`,
            scale: [0, 1, 1, 0],
            rotate: Math.random() * 360,
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: 2 + Math.random() * 2, 
            ease: "easeOut",
            delay: Math.random() * 0.2
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: colors[Math.floor(Math.random() * colors.length)] }}
        />
      ))}
    </div>
  );
};

// --- Main Lesson Component ---

export const PythonGenesis = () => {
  const { scrollYProgress } = useScroll();
  const yBackground = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacityHeader = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  const [activeSection, setActiveSection] = useState('intro');
  const { completeLesson: markLessonComplete, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isCompleted, setIsCompleted] = useState(false);
  const [showBoss, setShowBoss] = useState(false);

  // Intersection Observer for TOC
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

    const sections = ['intro', 'interpreter', 'variables', 'types', 'challenge'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // Check if already completed
  useEffect(() => {
    if (userProfile?.completedLessons?.includes('intro')) {
      setIsCompleted(true);
    }
  }, [userProfile]);

  const handleComplete = async () => {
    setIsCompleted(true);
    await markLessonComplete('intro', 50); // 50 XP for completing the lesson
  };

  const handleContinue = () => {
    navigate('/pathways');
  };

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-brand-primary/30">
      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-brand-primary z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {isCompleted && <Confetti />}

      {/* Parallax Hero */}
      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden border-b border-white/10">
        <motion.div 
          className="absolute inset-0 z-0 opacity-20"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 50% 50%, #4f46e5 0%, transparent 50%)',
            y: yBackground 
          }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        <motion.div 
          style={{ opacity: opacityHeader }}
          className="relative z-10 text-center max-w-4xl px-6"
        >
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="px-4 py-1.5 rounded-full bg-brand-primary/20 text-brand-primary font-bold text-sm tracking-widest uppercase mb-6 inline-block border border-brand-primary/30">
              Глава 1 • Новичок
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
              Python <span className="text-gradient">Genesis</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 font-light leading-relaxed">
              Погрузитесь в архитектуру, философию и основные механизмы самого универсального языка программирования в мире.
            </p>
          </motion.div>
        </motion.div>

        {}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest font-bold">Листайте, чтобы начать</span>
          <Icons.ChevronDown className="w-5 h-5" />
        </motion.div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16 relative">
        
        {}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-32 space-y-2 border-l border-white/10 pl-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">Содержание</h3>
            {[
              { id: 'intro', label: '1. Философия' },
              { id: 'interpreter', label: '2. Интерпретатор' },
              { id: 'variables', label: '3. Память и переменные' },
              { id: 'types', label: '4. Типы данных' },
              { id: 'challenge', label: '5. Испытание' },
            ].map(item => (
              <a 
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={`block py-2 text-sm transition-colors ${activeSection === item.id ? 'text-brand-primary font-bold' : 'text-white/40 hover:text-white/80'}`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {}
        <div className="flex-1 max-w-3xl space-y-32">
          
          {}
          <motion.section 
            id="intro" 
            className="scroll-mt-32"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-primary text-2xl">1</span>
              Философия
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                Прежде чем написать хоть одну строчку кода, нужно понять менталитет Python. Созданный <strong>Гвидо ван Россумом</strong> в 1991 году, Python был разработан с одной радикальной идеей: <em>код читается гораздо чаще, чем пишется.</em>
              </p>
              <p>
                В отличие от языков, которые используют фигурные скобки <code>{`{}`}</code> или явные ключевые слова для определения блоков кода, Python использует <strong>отступы</strong>. Это заставляет разработчиков писать визуально чистый и структурированный код.
              </p>
              
              <InfoCard title="Дзен Python" icon={Icons.BookOpen} type="deep">
                Откройте терминал Python и введите <code>import this</code>. Вас встретит стихотворение Тима Питерса, в котором изложены основные принципы философии языка.
                <br/><br/>
                <em>"Красивое лучше, чем уродливое.<br/>
                Явное лучше, чем неявное.<br/>
                Простое лучше, чем сложное.<br/>
                Читаемость имеет значение."</em>
              </InfoCard>
            </div>
          </motion.section>

          {}
          <motion.section 
            id="interpreter" 
            className="scroll-mt-32"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-primary text-2xl">2</span>
              Под капотом: Интерпретатор
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                Python часто называют "интерпретируемым" языком, но это лишь половина правды. Когда вы запускаете скрипт Python, за миллисекунды выполняется сложный конвейер.
              </p>
              
              <div className="my-10 p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full" />
                <h4 className="text-white font-bold mb-6 relative z-10">Конвейер выполнения</h4>
                <div className="flex flex-col md:flex-row gap-4 relative z-10 text-sm font-mono">
                  <div className="flex-1 p-4 bg-black/40 rounded-xl border border-white/5 text-center">
                    <Icons.FileCode className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                    Исходный код<br/>(.py)
                  </div>
                  <div className="hidden md:flex items-center text-white/20"><Icons.ArrowRight /></div>
                  <div className="flex-1 p-4 bg-black/40 rounded-xl border border-white/5 text-center">
                    <Icons.Cpu className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                    Компилятор<br/>(Байт-код .pyc)
                  </div>
                  <div className="hidden md:flex items-center text-white/20"><Icons.ArrowRight /></div>
                  <div className="flex-1 p-4 bg-black/40 rounded-xl border border-white/5 text-center">
                    <Icons.MonitorPlay className="w-6 h-6 mx-auto mb-2 text-green-400" />
                    PVM<br/>(Виртуальная машина)
                  </div>
                </div>
              </div>

              <p>
                Сначала компилятор CPython переводит ваш человекочитаемый исходный код в <strong>байт-код</strong> (низкоуровневое, платформонезависимое представление). Затем виртуальная машина Python (PVM) считывает этот байт-код и выполняет его построчно. Вот почему Python очень портативен, но обычно медленнее скомпилированных языков, таких как C или Rust.
              </p>
            </div>
          </motion.section>

          {}
          <motion.section 
            id="variables" 
            className="scroll-mt-32"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-primary text-2xl">3</span>
              Переменные — это ярлыки, а не коробки
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                В таких языках, как C, переменная — это ячейка в памяти. Вы кладете значение внутрь ячейки. <strong>В Python переменные — это стикеры (ярлыки), прикрепленные к объектам в памяти.</strong>
              </p>
              
              <MemoryVisualizer />

              <InfoCard title="Функция id()" icon={Icons.Search} type="info">
                Функция <code>id()</code> возвращает уникальный адрес объекта в памяти. Если две переменные имеют одинаковый <code>id()</code>, они ссылаются на один и тот же объект в оперативной памяти вашего компьютера.
              </InfoCard>

              <Quiz 
                question="Что произойдет, если мы выполним следующий код: a = [1, 2]; b = a; b.append(3); print(a)?"
                options={[
                  "Выведет [1, 2], так как изменился только список b.",
                  "Выведет [1, 2, 3], так как a и b указывают на один и тот же объект в памяти.",
                  "Вызовет ошибку, так как списки неизменяемы.",
                  "Выведет [3], так как старые значения удаляются."
                ]}
                correctAnswerIndex={1}
                explanation="В Python переменные — это ссылки на объекты. Присваивание b = a не копирует список, а создает новый ярлык 'b', указывающий на тот же список, что и 'a'. Поэтому изменения через 'b' отражаются и при обращении через 'a'."
              />

              <p>
                Поскольку Python является языком с <strong>динамической типизацией</strong>, вам не нужно объявлять, какой тип данных будет хранить переменная. Интерпретатор определяет это во время выполнения на основе объекта, к которому прикреплен ярлык.
              </p>
            </div>
          </motion.section>

          {}
          <motion.section 
            id="types" 
            className="scroll-mt-32"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-primary text-2xl">4</span>
              Глубокое погружение в типы данных
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                Все в Python является объектом. Давайте рассмотрим основные примитивные типы.
              </p>

              <div className="space-y-6 mt-8">
                {}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-blue-400 font-mono">int</span> (Целые числа)
                  </h4>
                  <p className="text-sm mb-4">В отличие от многих языков, целые числа в Python 3 имеют <strong>произвольную точность</strong>. Они могут быть настолько большими, насколько позволяет память вашего компьютера. Переполнения целых чисел не существует.</p>
                  <CodeBlock code={`googol = 10 ** 100\nprint(googol) # Работает идеально, без ошибки переполнения`} />
                </div>

                {}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-green-400 font-mono">float</span> (Числа с плавающей точкой)
                  </h4>
                  <p className="text-sm mb-4">Числа с плавающей точкой представляют вещественные числа. Однако, поскольку компьютеры используют двоичные дроби, некоторые десятичные дроби не могут быть представлены точно.</p>
                  <CodeBlock code={`print(0.1 + 0.2)\n# Вывод: 0.30000000000000004\n# (Это аппаратное ограничение, а не ошибка Python!)`} />
                </div>

                {}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-yellow-400 font-mono">str</span> (Строки)
                  </h4>
                  <p className="text-sm mb-4">Строки — это <strong>неизменяемые</strong> последовательности символов Unicode. После создания строку нельзя изменить. Любая операция, которая кажется изменяющей строку, на самом деле создает новую.</p>
                  <CodeBlock code={`name = "Python"\n# name[0] = "J"  <-- TypeError: 'str' object does not support item assignment\nnew_name = "J" + name[1:] # Это создает новый объект`} />
                </div>
              </div>
            </div>
          </motion.section>

          {}
          <motion.section 
            id="challenge" 
            className="scroll-mt-32 pt-10 border-t border-white/10"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <span className="w-16 h-16 mx-auto rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary mb-6">
                <Icons.Swords className="w-8 h-8" />
              </span>
              <h2 className="text-4xl font-display font-bold mb-4">Испытание</h2>
              <p className="text-white/50">Докажите свое понимание. Напишите свою первую программу на Python.</p>
            </div>

            <div className="prose prose-invert prose-lg max-w-none text-white/70 mb-8">
              <p>
                {showBoss 
                  ? "Вы пробудили Стража Генезиса! Чтобы пройти дальше, вы должны доказать свою силу кода."
                  : "В компьютерных науках существует давняя традиция: первая программа на новом языке должна выводить на экран фразу Hello, World!. В Python это делается с помощью встроенной функции print()."
                }
              </p>
            </div>

            {!showBoss ? (
              <InteractiveTerminal 
                expectedOutput="Hello, World!"
                hint="Используйте функцию print() и заключите текст в кавычки."
                successMsg="Отлично! Вы успешно пообщались с интерпретатором Python. Теперь вы официально программист на Python."
                onComplete={() => setShowBoss(true)}
              />
            ) : (
              <BossFight 
                bossName="Страж Генезиса"
                bossHp={3}
                challenge="Чтобы победить стража, вы должны вывести три строки по очереди: 'Python', 'is', 'awesome'"
                expectedOutput="print('Python')\nprint('is')\nprint('awesome')"
                onVictory={handleComplete}
              />
            )}

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
                    className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    Продолжить путь
                    <Icons.ArrowRight className="w-4 h-4" />
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
