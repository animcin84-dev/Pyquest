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


const ListVisualizer = () => {
  const [list, setList] = useState<string[]>(['"Яблоко"', '"Банан"', '"Вишня"']);
  const [inputValue, setInputValue] = useState('');
  const [actionDesc, setActionDesc] = useState('Начальный список создан.');

  const handleAppend = () => {
    if (!inputValue) return;
    setList([...list, `"${inputValue}"`]);
    setActionDesc(`fruits.append("${inputValue}") - Добавлено в конец.`);
    setInputValue('');
  };

  const handlePop = () => {
    if (list.length === 0) return;
    const newList = [...list];
    const removed = newList.pop();
    setList(newList);
    setActionDesc(`fruits.pop() - Удалено и возвращено ${removed}.`);
  };

  const handleInsert = () => {
    if (!inputValue) return;
    const newList = [...list];
    newList.splice(1, 0, `"${inputValue}"`);
    setList(newList);
    setActionDesc(`fruits.insert(1, "${inputValue}") - Вставлено по индексу 1.`);
    setInputValue('');
  };

  return (
    <div className="my-12 p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
        <Icons.ListOrdered className="w-6 h-6 text-green-400" />
        Симулятор динамического массива
      </h3>

      <div className="mb-8 p-4 bg-black/50 rounded-xl border border-white/5 font-mono text-sm text-white/60">
        <span className="text-green-400">Действие: </span> {actionDesc}
      </div>

      {}
      <div className="flex flex-wrap gap-4 mb-12 min-h-[100px] items-center">
        <div className="text-2xl font-mono text-white/40">[</div>
        <AnimatePresence mode="popLayout">
          {list.map((item, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              key={`${item}-${index}`}
              className="relative group"
            >
              <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-mono text-green-300 font-bold shadow-lg">
                {item}
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/30 font-mono">
                индекс: {index}
              </div>
              {index < list.length - 1 && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-white/40 font-mono">,</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="text-2xl font-mono text-white/40">]</div>
      </div>

      {}
      <div className="flex flex-wrap gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Введите значение..."
          className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500/50 flex-1 min-w-[200px]"
        />
        <button onClick={handleAppend} className="px-4 py-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-lg font-bold transition-colors">
          .append()
        </button>
        <button onClick={handleInsert} className="px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg font-bold transition-colors">
          .insert(1, val)
        </button>
        <button onClick={handlePop} className="px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg font-bold transition-colors">
          .pop()
        </button>
      </div>
    </div>
  );
};


const SlicingGame = ({ onWin }: { onWin: () => void }) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  const list = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  const questions = [
    { slice: "letters[0:3]", answer: "['A', 'B', 'C']" },
    { slice: "letters[2:]", answer: "['C', 'D', 'E', 'F']" },
    { slice: "letters[:2]", answer: "['A', 'B']" },
    { slice: "letters[-1]", answer: "'F'" },
    { slice: "letters[::-1]", answer: "['F', 'E', 'D', 'C', 'B', 'A']" },
  ];

  const options = [
    "['A', 'B', 'C']", "['C', 'D', 'E', 'F']", "['A', 'B']", "'F'", "['F', 'E', 'D', 'C', 'B', 'A']", "['B', 'C']"
  ];

  const handleAnswer = (ans: string) => {
    if (ans === questions[currentQ].answer) {
      setScore(score + 1);
    }
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setGameOver(true);
      if (score + (ans === questions[currentQ].answer ? 1 : 0) >= 4) {
        onWin();
      }
    }
  };

  if (gameOver) {
    return (
      <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
        <h3 className="text-3xl font-bold mb-4">Слайсинг завершен!</h3>
        <p className="text-xl mb-6">Счет: {score} / {questions.length}</p>
        {score >= 4 ? (
          <div className="text-green-400 font-bold flex items-center justify-center gap-2">
            <Icons.Trophy className="w-6 h-6" /> Мастер срезов!
          </div>
        ) : (
          <button onClick={() => { setGameOver(false); setCurrentQ(0); setScore(0); }} className="px-6 py-3 bg-brand-secondary rounded-full font-bold">
            Попробовать снова
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold">Додзё срезов</h3>
        <p className="text-white/50 mt-2">letters = ['A', 'B', 'C', 'D', 'E', 'F']</p>
      </div>
      
      <div className="flex justify-center mb-8">
        <div className="px-8 py-4 bg-black/50 rounded-2xl border border-white/10 font-mono text-3xl font-bold text-brand-secondary">
          {questions[currentQ].slice}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt)}
            className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-brand-secondary/20 transition-all font-mono text-sm"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};


export const TheCollection = () => {
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

    const sections = ['intro', 'methods', 'slicing', 'challenge'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  
  useEffect(() => {
    if (userProfile?.completedLessons?.includes('lists')) {
      setIsCompleted(true);
      setGameWon(true);
    }
  }, [userProfile]);

  const handleComplete = async () => {
    if (!gameWon && !isCompleted) return;
    setIsCompleted(true);
    await markLessonComplete('lists', 50);
  };

  const handleContinue = () => {
    navigate('/pathways');
  };

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-green-500/30">
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-green-500 z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {}
      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden border-b border-white/10">
        <motion.div 
          className="absolute inset-0 z-0 opacity-20"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 50% 50%, #22c55e 0%, transparent 50%)',
            y: yBackground 
          }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0" />
        
        <motion.div style={{ opacity: opacityHeader }} className="relative z-10 text-center max-w-4xl px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="px-4 py-1.5 rounded-full bg-green-500/20 text-green-400 font-bold text-sm tracking-widest uppercase mb-6 inline-block border border-green-500/30">
              Глава 3 • Новичок
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
              Коллекция <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Данных</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 font-light leading-relaxed">
              Овладейте мощью списков. Храните, организуйте и манипулируйте огромными объемами данных в одной структуре.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16 relative">
        
        {}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-32 space-y-2 border-l border-white/10 pl-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">Содержание</h3>
            {[
              { id: 'intro', label: '1. Динамический массив' },
              { id: 'methods', label: '2. Методы списков' },
              { id: 'slicing', label: '3. Искусство срезов' },
              { id: 'challenge', label: '4. Додзё срезов' },
            ].map(item => (
              <a 
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={`block py-2 text-sm transition-colors ${activeSection === item.id ? 'text-green-400 font-bold' : 'text-white/40 hover:text-white/80'}`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {}
        <div className="flex-1 max-w-3xl space-y-32">
          
          <section id="intro" className="scroll-mt-32">
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-green-400 text-2xl">1</span>
              Динамический массив
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                Список в Python — это упорядоченная, изменяемая коллекция элементов. В отличие от массивов в низкоуровневых языках, списки Python являются <strong>динамическими</strong>. Они могут автоматически расти и уменьшаться, а также хранить смешанные типы данных.
              </p>
              <CodeBlock 
                title="lists.py"
                code={`# Список может содержать что угодно!
my_list = [42, "Привет", 3.14, True, [1, 2, 3]]

# Доступ к элементам (индексация с нуля)
print(my_list[0])  # Вывод: 42
print(my_list[1])  # Вывод: Привет`} 
              />
              <InfoCard title="Под капотом" icon={Icons.Database} type="deep">
                В CPython (стандартной реализации) список на самом деле является массивом указателей. Вот почему он может содержать смешанные типы — он просто хранит адреса памяти объектов, расположенных в других местах RAM!
              </InfoCard>
            </div>
          </section>

          <section id="methods" className="scroll-mt-32">
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-green-400 text-2xl">2</span>
              Методы списков
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Списки обладают встроенными суперспособностями, называемыми методами. Давайте визуализируем, как они изменяют список в реальном времени.
            </p>
            <ListVisualizer />
          </section>

          <section id="slicing" className="scroll-mt-32">
            <h2 className="text-4xl font-display font-bold mb-8 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-green-400 text-2xl">3</span>
              Искусство срезов
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p>
                Срезы (slicing) позволяют извлекать подсписок. Синтаксис: <code>list[start:stop:step]</code>.
              </p>
              <ul>
                <li><strong>start</strong>: Индекс, с которого начинается срез (включительно).</li>
                <li><strong>stop</strong>: Индекс, на котором срез заканчивается (исключительно).</li>
                <li><strong>step</strong>: Шаг (сколько элементов пропускать).</li>
              </ul>
              <CodeBlock 
                title="slicing.py"
                code={`nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

print(nums[2:5])    # [2, 3, 4]
print(nums[:4])     # [0, 1, 2, 3] (start по умолчанию 0)
print(nums[7:])     # [7, 8, 9] (stop по умолчанию до конца)
print(nums[::2])    # [0, 2, 4, 6, 8] (шаг 2)
print(nums[::-1])   # [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] (разворот!)`} 
              />
            </div>
          </section>

          <section id="challenge" className="scroll-mt-32 pt-10 border-t border-white/10">
            <div className="text-center mb-12">
              <span className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-6">
                <Icons.Swords className="w-8 h-8" />
              </span>
              <h2 className="text-4xl font-display font-bold mb-4">Додзё срезов</h2>
              <p className="text-white/50">Докажите свое мастерство владения индексами списков.</p>
            </div>

            <SlicingGame onWin={() => { setGameWon(true); handleComplete(); }} />

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
