import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Navbar } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';



const CodeBlock = ({ code, title = 'example.py' }: { code: string, title?: string }) => (
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
    { code: "x = 10", desc: "Python создает целочисленный объект '10' в памяти, затем прикрепляет к нему метку 'x'." },
    { code: "y = x", desc: "Python прикрепляет новую метку 'y' к ТОМУ ЖЕ САМОМУ объекту в памяти." },
    { code: "x = 20", desc: "Python создает НОВЫЙ целочисленный объект '20' и перемещает метку 'x' на него. 'y' все еще указывает на '10'." },
    { code: "y = 20", desc: "Python перемещает 'y' на '20'. У объекта '10' теперь 0 меток, указывающих на него. Сборщик мусора удаляет его!" }
  ];

  return (
    <div className="my-12 p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-secondary/10 blur-[100px] rounded-full pointer-events-none" />
      
      <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
        <Icons.Cpu className="w-6 h-6 text-brand-secondary" />
        Интерактивный симулятор памяти
      </h3>

      <div className="grid md:grid-cols-2 gap-8">
        {}
        <div className="space-y-4">
          <div className="font-mono text-sm bg-black/50 p-4 rounded-xl border border-white/5 h-48 flex flex-col justify-center">
            {steps.map((s, i) => (
              <div key={i} className={`transition-all duration-300 ${i === step ? 'text-brand-secondary text-lg font-bold scale-105 origin-left' : i < step ? 'text-white/40' : 'opacity-0'}`}>
                {s.code}
              </div>
            ))}
          </div>
          <p className="text-sm text-white/60 min-h-[40px]">{steps[step].desc}</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              Назад
            </button>
            <button 
              onClick={() => setStep(Math.max(0, Math.min(steps.length - 1, step + 1)))}
              disabled={step === steps.length - 1}
              className="px-4 py-2 rounded-lg bg-brand-secondary hover:bg-brand-secondary/80 text-white disabled:opacity-50 transition-colors flex-1"
            >
              Следующий шаг
            </button>
            <button 
              onClick={() => setStep(0)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              Сброс
            </button>
          </div>
        </div>

        {}
        <div className="relative h-64 bg-black/40 rounded-xl border border-white/5 p-6 flex items-center justify-around">
          
          {}
          <div className="flex flex-col gap-12 z-10">
            <motion.div 
              animate={{ y: step >= 2 ? 60 : 0 }}
              className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg font-mono text-blue-300 font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              Метка: x
            </motion.div>
            <AnimatePresence>
              {step >= 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0, y: step >= 3 ? -60 : 0 }}
                  className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg font-mono text-purple-300 font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  Метка: y
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {}
          <div className="flex flex-col gap-8 z-10">
            <AnimatePresence>
              {step < 3 && (
                <motion.div 
                  exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                  className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center font-mono text-2xl font-bold relative"
                >
                  10
                  <span className="absolute -bottom-6 text-[10px] text-white/30 whitespace-nowrap">id: 43901</span>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {step >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center font-mono text-2xl font-bold relative"
                >
                  20
                  <span className="absolute -bottom-6 text-[10px] text-white/30 whitespace-nowrap">id: 43933</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {}
            {step < 2 && <motion.line x1="25%" y1="35%" x2="70%" y2="35%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" className="opacity-50" />}
            {}
            {step >= 2 && <motion.line x1="25%" y1="35%" x2="70%" y2="65%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" className="opacity-50" />}
            
            {}
            {step === 1 && <motion.line x1="25%" y1="65%" x2="70%" y2="35%" stroke="#a855f7" strokeWidth="2" strokeDasharray="5,5" className="opacity-50" />}
            {}
            {step === 2 && <motion.line x1="25%" y1="65%" x2="70%" y2="35%" stroke="#a855f7" strokeWidth="2" strokeDasharray="5,5" className="opacity-50" />}
            {}
            {step >= 3 && <motion.line x1="25%" y1="65%" x2="70%" y2="65%" stroke="#a855f7" strokeWidth="2" strokeDasharray="5,5" className="opacity-50" />}
          </svg>

        </div>
      </div>
    </div>
  );
};


const TypeCasterGame = ({ onWin }: { onWin: () => void }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const questions = [
    { value: "42", correct: "int", options: ["int", "str", "float", "bool"] },
    { value: "3.14159", correct: "float", options: ["int", "str", "float", "bool"] },
    { value: "'Hello'", correct: "str", options: ["int", "str", "float", "bool"] },
    { value: "True", correct: "bool", options: ["int", "str", "float", "bool"] },
    { value: "0", correct: "int", options: ["int", "str", "float", "bool"] },
    { value: "'42'", correct: "str", options: ["int", "str", "float", "bool"] },
  ];

  const handleAnswer = (answer: string) => {
    if (answer === questions[currentQuestion].correct) {
      setScore(score + 1);
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setGameOver(true);
      if (score + (answer === questions[currentQuestion].correct ? 1 : 0) >= 5) {
        onWin();
      }
    }
  };

  if (gameOver) {
    return (
      <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
        <h3 className="text-3xl font-bold mb-4">Игра окончена!</h3>
        <p className="text-xl mb-6">Вы набрали {score} из {questions.length}</p>
        {score >= 5 ? (
          <div className="text-green-400 font-bold flex items-center justify-center gap-2">
            <Icons.Trophy className="w-6 h-6" />
            Испытание пройдено!
          </div>
        ) : (
          <button 
            onClick={() => { setGameOver(false); setCurrentQuestion(0); setScore(0); }}
            className="px-6 py-3 bg-brand-secondary rounded-full font-bold hover:bg-brand-secondary/80 transition-colors"
          >
            Попробовать снова (нужно 5/6 для прохождения)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
        <motion.div 
          className="h-full bg-brand-secondary"
          animate={{ width: `${(currentQuestion / questions.length) * 100}%` }}
        />
      </div>
      
      <div className="text-center mb-8">
        <span className="text-brand-secondary font-bold tracking-widest uppercase text-xs">Мастер типов</span>
        <h3 className="text-2xl font-bold mt-2">Каков тип этого значения?</h3>
      </div>

      <div className="flex justify-center mb-12">
        <div className="px-8 py-4 bg-black/50 rounded-2xl border border-white/10 font-mono text-4xl font-bold text-white shadow-inner">
          {questions[currentQuestion].value}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {questions[currentQuestion].options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-brand-secondary/20 hover:border-brand-secondary/50 transition-all font-mono text-lg font-bold"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};



export const DataVessels = () => {
  const { scrollYProgress } = useScroll();
  const yBackground = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacityHeader = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  const [activeSection, setActiveSection] = useState('intro');
  const [gameWon, setGameWon] = useState(false);
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

    const sections = ['intro', 'memory', 'garbage', 'types', 'challenge'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  
  useEffect(() => {
    if (userProfile?.completedLessons?.includes('variables')) {
      setIsCompleted(true);
      setGameWon(true);
    }
  }, [userProfile]);

  const handleComplete = async () => {
    if (!gameWon && !isCompleted) return;
    setIsCompleted(true);
    await markLessonComplete('variables', 50);
  };

  const handleContinue = () => {
    navigate('/pathways');
  };

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-brand-secondary/30">
      {}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-brand-secondary z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {}
      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden border-b border-white/10">
        <motion.div 
          className="absolute inset-0 z-0 opacity-20"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 50% 50%, #ec4899 0%, transparent 50%)',
            y: yBackground 
          }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0" />
        
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
              Глава 2 • Новичок
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
              Сосуды <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">Данных</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 font-light leading-relaxed">
              Освойте искусство манипуляции памятью. Поймите, как Python хранит, ссылается и уничтожает данные.
            </p>
          </motion.div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest font-bold">Прокрутите, чтобы начать</span>
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
              { id: 'intro', label: '1. Иллюзия коробок' },
              { id: 'memory', label: '2. Симулятор памяти' },
              { id: 'garbage', label: '3. Сборщик мусора' },
              { id: 'types', label: '4. Динамическая типизация' },
              { id: 'challenge', label: '5. Игра "Мастер типов"' },
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

        {}
        <div className="flex-1 max-w-3xl space-y-32">
          
          {}
          <section id="intro" className="scroll-mt-32">
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-secondary text-2xl">1</span>
              Иллюзия коробок
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                Если вы изучали другие языки программирования, такие как C++ или Java, вас, вероятно, учили, что переменная — это как "коробка", в которой вы храните данные. <strong>Забудьте об этом полностью.</strong>
              </p>
              <p>
                В Python переменная — это не коробка. Это <strong>именная метка</strong> (или ярлык), которую вы привязываете к объекту, живущему где-то в памяти вашего компьютера.
              </p>
              
              <InfoCard title="Почему это важно?" icon={Icons.AlertTriangle} type="warning">
                Понимание того, что переменные — это просто метки, предотвращает огромные ошибки в будущем, особенно при работе со списками и словарями. Если две метки указывают на один и тот же список, изменение списка через одну метку изменит его и для другой!
              </InfoCard>
            </div>
          </section>

          {}
          <section id="memory" className="scroll-mt-32">
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-secondary text-2xl">2</span>
              Визуализация памяти
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70 mb-8">
              <p>
                Давайте посмотрим, что именно происходит в оперативной памяти вашего компьютера, когда вы присваиваете переменные в Python. Поиграйте с симулятором ниже, чтобы увидеть, как метки перемещаются между объектами.
              </p>
            </div>
            
            <MemoryVisualizer />
          </section>

          {}
          <section id="garbage" className="scroll-mt-32">
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-secondary text-2xl">3</span>
              Сборщик мусора
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                Вы заметили в симуляторе, что случилось с числом <code>10</code>, когда на него больше не указывали никакие метки? Оно исчезло.
              </p>
              <p>
                Python использует систему под названием <strong>Подсчет ссылок</strong>. Каждый объект ведет учет того, сколько меток (ссылок) указывают на него. 
              </p>
              <ul>
                <li>Когда вы делаете <code>x = 10</code>, количество ссылок на объект <code>10</code> становится равным 1.</li>
                <li>Когда вы делаете <code>y = x</code>, количество ссылок становится равным 2.</li>
                <li>Когда вы переназначаете и <code>x</code>, и <code>y</code> на что-то другое, количество ссылок на <code>10</code> падает до 0.</li>
              </ul>
              
              <InfoCard title="Автоматическая очистка" icon={Icons.Trash2} type="deep">
                Когда количество ссылок на объект достигает нуля, сборщик мусора Python автоматически подметает и удаляет объект, освобождая оперативную память. Вам никогда не придется вручную управлять памятью, как в C!
              </InfoCard>
            </div>
          </section>

          {}
          <section id="types" className="scroll-mt-32">
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-secondary text-2xl">4</span>
              Динамическая типизация
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                Поскольку переменные — это просто метки, им все равно, к какому типу объекта они прикреплены. Метка может указывать на целое число сейчас, а через миллисекунду — на строку.
              </p>
              
              <CodeBlock 
                title="dynamic_typing.py"
                code={`my_var = 42          # my_var указывает на целое число
print(type(my_var))  # <class 'int'>

my_var = "Привет"    # my_var теперь указывает на строку!
print(type(my_var))  # <class 'str'>`} 
              />

              <p>
                Это называется <strong>Динамической типизацией</strong>. Это делает написание кода на Python невероятно быстрым, но также означает, что нужно быть осторожным. Если вы ожидаете, что <code>my_var</code> будет числом, и попытаетесь выполнить с ним математические действия, но на самом деле это строка, ваша программа аварийно завершится!
              </p>
            </div>
          </section>

          {}
          <section id="challenge" className="scroll-mt-32 pt-10 border-t border-white/10">
            <div className="text-center mb-12">
              <span className="w-16 h-16 mx-auto rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary mb-6">
                <Icons.Gamepad2 className="w-8 h-8" />
              </span>
              <h2 className="text-4xl font-display font-bold mb-4">Мастер типов</h2>
              <p className="text-white/50">Проверьте свою способность мгновенно распознавать типы данных Python.</p>
            </div>

            <TypeCasterGame onWin={() => { setGameWon(true); handleComplete(); }} />

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
