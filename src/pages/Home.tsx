import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Layout';
import { 
  Database, 
  BrainCircuit, 
  Globe, 
  Gamepad2, 
  TerminalSquare, 
  Trophy, 
  CheckCircle2, 
  Network, 
  DatabaseZap, 
  ArrowUpRight, 
  ArrowRight,
  Code2,
  ShoppingBag,
  Users,
  Sword,
  Sparkles,
  Zap,
  Coins,
  BookOpen,
  Bug
} from 'lucide-react';

import { playSound } from '../utils/sounds';
import { useAuth } from '../contexts/AuthContext';
import { TextReveal } from '../components/TextReveal';
import { MagneticButton } from '../components/MagneticButton';

export const Home = () => {
  const { userProfile } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const scrollToCurriculum = () => {
    playSound('click');
    document.getElementById('curriculum')?.scrollIntoView({ behavior: 'smooth' });
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as any } }
  };

  return (
    <div ref={containerRef} className="relative bg-transparent overflow-hidden">
      <div className="relative z-10">
        <Hero onSyllabusClick={scrollToCurriculum} />
      </div>

      {}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
              <TextReveal text="БОЛЬШЕ, ЧЕМ" delay={0.1} />
              <TextReveal 
                text="КУРСЫ." 
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 italic serif pr-4" 
                delay={0.5} 
              />
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-xl">
              Мы создали целую экосистему для твоего развития. Соревнуйся, общайся и прокачивайся.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
            <FeatureCard 
              className="md:col-span-8 md:row-span-2"
              title="Турниры"
              description="Еженедельные битвы кодеров. Выигрывай эксклюзивные награды и монеты."
              icon={<Trophy className="w-10 h-10" />}
              link="/tournaments"
              color="text-orange-500"
              borderColor="border-orange-500/50"
              glowColor="group-hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]"
              bgGradient="from-orange-500/20 via-orange-900/10 to-transparent"
              customBg={<TournamentsBg />}
              sysName="SYS.TRN"
            />
            <FeatureCard 
              className="md:col-span-4"
              title="Песочница"
              description="Свободное пространство для экспериментов с кодом."
              icon={<TerminalSquare className="w-8 h-8" />}
              link="/sandbox"
              color="text-emerald-500"
              borderColor="border-emerald-500/50"
              glowColor="group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              bgGradient="from-emerald-500/20 via-emerald-900/10 to-transparent"
              customBg={<SandboxBg />}
              sysName="SYS.SND"
            />
            <FeatureCard 
              className="md:col-span-4"
              title="Магазин"
              description="Трать монеты на бусты и кастомизацию."
              icon={<ShoppingBag className="w-8 h-8" />}
              link="/shop"
              color="text-yellow-500"
              borderColor="border-yellow-500/50"
              glowColor="group-hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]"
              bgGradient="from-yellow-500/20 via-yellow-900/10 to-transparent"
              customBg={<ShopBg />}
              sysName="SYS.SHP"
            />
            <FeatureCard 
              className="md:col-span-4"
              title="Друзья"
              description="Добавляй друзей и следи за их прогрессом."
              icon={<Users className="w-8 h-8" />}
              link="/friends"
              color="text-indigo-500"
              borderColor="border-indigo-500/50"
              glowColor="group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]"
              bgGradient="from-indigo-500/20 via-indigo-900/10 to-transparent"
              customBg={<FriendsBg />}
              sysName="SYS.SOC"
            />
            <FeatureCard 
              className="md:col-span-4 md:row-span-2"
              title="Аркада"
              description="Мини-игры для оттачивания навыков."
              icon={<Gamepad2 className="w-10 h-10" />}
              link="/arcade"
              color="text-green-500"
              borderColor="border-green-500/50"
              glowColor="group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]"
              bgGradient="from-green-500/20 via-green-900/10 to-transparent"
              customBg={<ArcadeBg />}
              sysName="SYS.ARC"
            />
            <FeatureCard 
              className="md:col-span-8"
              title="Дуэли"
              description="Бросай вызов 1 на 1 в реальном времени."
              icon={<Sword className="w-8 h-8" />}
              link="/duels"
              color="text-red-500"
              borderColor="border-red-500/50"
              glowColor="group-hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              bgGradient="from-red-500/20 via-red-900/10 to-transparent"
              customBg={<DuelsBg />}
              sysName="SYS.DUL"
            />
          </div>
        </div>
      </section>

      {}
      <section id="curriculum" className="py-32 px-6 relative z-10 overflow-hidden bg-transparent">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {}
        <motion.div 
          style={{ y: useTransform(smoothProgress, [0, 1], ["0%", "-50%"]) }}
          className="absolute inset-0 pointer-events-none opacity-30"
        >
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />
        </motion.div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8"
          >
            <div className="max-w-3xl">
              <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter flex flex-wrap items-center gap-4">
                <TextReveal text="ПРОГРАММА" delay={0.1} />
                <TextReveal text="ОБУЧЕНИЯ" className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 italic serif pr-4" delay={0.5} />
              </h2>
              <p className="text-white/50 text-xl">От основ до продвинутых концепций. Каждый шаг — это новый уровень.</p>
            </div>
            <Link to="/pathways" onClick={() => playSound('click')}>
              <MagneticButton className="px-10 py-5 bg-white text-black rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                Изучить все пути
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </MagneticButton>
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { level: "Новичок", title: "Истоки", topics: ["Синтаксис", "Переменные", "Списки", "Условия"], color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", shadow: "shadow-[0_0_30px_rgba(96,165,250,0.1)]" },
              { level: "Средний", title: "Логика", topics: ["Циклы", "Функции", "Словари", "Модули"], color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20", shadow: "shadow-[0_0_30px_rgba(74,222,128,0.1)]" },
              { level: "Продвинутый", title: "Архитектор", topics: ["ООП", "Декораторы", "Генераторы", "Контекст"], color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", shadow: "shadow-[0_0_30px_rgba(192,132,252,0.1)]" },
              { level: "Профи", title: "Мастерство", topics: ["Asyncio", "Метаклассы", "Оптимизация", "Безопасность"], color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", shadow: "shadow-[0_0_30px_rgba(251,113,133,0.1)]" }
            ].map((track, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 50, rotateY: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`bg-[#0a0a0a] rounded-[40px] p-10 border ${track.border} ${track.shadow} transition-all relative overflow-hidden group`}
              >
                <div className={`absolute top-0 right-0 w-40 h-40 ${track.bg} blur-[60px] rounded-full group-hover:scale-150 group-hover:opacity-70 transition-all duration-700`} />
                <span className={`text-xs font-black ${track.color} uppercase tracking-[0.2em] mb-6 block`}>{track.level}</span>
                <h4 className="text-3xl font-bold mb-8 relative z-10 tracking-tight">{track.title}</h4>
                <ul className="space-y-4 relative z-10">
                  {track.topics.map((topic, j) => (
                    <li key={j} className="flex items-center gap-3 text-white/60 text-base group-hover:text-white/80 transition-colors">
                      <CheckCircle2 className={`w-5 h-5 ${track.color} opacity-70`} />
                      {topic}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-32 px-6 relative z-10 bg-transparent border-y border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 flex flex-wrap justify-center lg:justify-start items-center gap-4">
                <TextReveal text="ИГРАЙ И" delay={0.1} />
                <TextReveal text="УЧИСЬ" className="text-brand-primary" delay={0.5} />
              </h2>
              <p className="text-white/50 text-xl mb-10 max-w-xl mx-auto lg:mx-0">
                Практика — ключ к успеху. Решай интерактивные задачи, лови баги и пиши код прямо в браузере.
              </p>
              <Link to="/arcade">
                <MagneticButton className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">
                  В Аркаду <ArrowRight className="w-5 h-5" />
                </MagneticButton>
              </Link>
            </motion.div>
          </div>
          <div className="flex-1 w-full max-w-lg relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="glass p-8 rounded-[40px] border border-white/10 shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <TerminalSquare className="w-6 h-6 text-brand-primary" />
                  <h3 className="font-bold text-xl">Catch the Bug</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
                  Level 1
                </div>
              </div>
              <div className="bg-black/50 rounded-2xl p-6 font-mono text-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {}
                <motion.div
                  animate={{ 
                    x: [0, 100, 200, 150, 300],
                    y: [0, 20, -10, 40, 10],
                    rotate: [0, 90, 180, 270, 360]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute z-30 text-red-500/30 pointer-events-none"
                >
                  <Bug className="w-8 h-8" />
                </motion.div>

                <pre className="text-white/70 relative z-10">
                  <code>
                    <span className="text-purple-400">def</span> <span className="text-blue-400">calculate_total</span>(items):<br/>
                    {'    '}total = <span className="text-orange-400">0</span><br/>
                    {'    '}<span className="text-purple-400">for</span> item <span className="text-purple-400">in</span> items:<br/>
                    {'        '}total = total - item.price  <motion.span 
                      whileHover={{ scale: 1.2, color: '#ef4444' }} 
                      className="cursor-pointer inline-block text-white/40 hover:text-red-500 transition-colors relative z-20"
                      onClick={() => playSound('success')}
                    >
                      <Bug className="inline-block w-4 h-4 mr-1 animate-pulse" />
                      # BUG HERE
                    </motion.span><br/>
                    {'    '}<span className="text-purple-400">return</span> total
                  </code>
                </pre>
              </div>
              <p className="text-center text-white/40 text-sm mt-6">
                Найди и исправь ошибку в коде, чтобы заработать очки.
              </p>
            </motion.div>
            
            {}
            <motion.div 
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 w-32 h-32 bg-brand-primary/20 blur-3xl rounded-full"
            />
            <motion.div 
              animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }} 
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full"
            />
          </div>
        </div>
      </section>

      {}
      <section className="py-20 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Уровень", value: "12", icon: <Sparkles className="w-6 h-6 text-indigo-400" /> },
            { label: "XP", value: "1,240", icon: <Zap className="w-6 h-6 text-yellow-400" /> },
            { label: "Монеты", value: "850", icon: <Coins className="w-6 h-6 text-emerald-400" /> },
            { label: "Серия", value: "5 дней", icon: <CheckCircle2 className="w-6 h-6 text-red-400" /> }
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="p-3 rounded-xl bg-black/40">{stat.icon}</div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-widest">{stat.label}</div>
                <div className="text-xl font-bold">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const TournamentsBg = () => (
  <div className="absolute inset-0 flex items-center justify-center opacity-40">
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.2),transparent_70%)]" />
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 10 20 L 30 20 L 30 40 L 50 40 M 10 60 L 30 60 L 30 40 M 90 50 L 70 50 L 70 40 L 50 40" stroke="url(#glow)" strokeWidth="1" fill="none" />
        <motion.circle 
          animate={{ r: [2, 4, 2], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          cx="50" cy="40" r="3" fill="#f97316" 
        />
        {[...Array(5)].map((_, i) => (
          <motion.circle 
            key={i}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
            cx={20 + i * 15} cy={20 + (i % 2) * 40} r="1" fill="#f97316"
          />
        ))}
      </svg>
    </div>
  </div>
);

const SandboxBg = () => (
  <div className="absolute inset-0 flex items-center justify-center opacity-30 font-mono text-[10px] sm:text-xs leading-tight text-emerald-500 overflow-hidden whitespace-pre p-4 select-none">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:100%_20px] animate-scanline" />
    <motion.div
      animate={{ y: [0, -200] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      {`def init_sandbox():
  env = VirtualEnvironment()
  env.load_modules(['sys', 'os', 'math'])
  
  while True:
    code = await get_input()
    if code.is_valid():
      result = env.execute(code)
      render(result)
    else:
      raise SyntaxError("Invalid syntax")
      
# Sandbox initialized...
# Ready for input...
# Loading kernel...
# Memory check: OK
# GPU acceleration: ON
# Neural engine: READY`}
    </motion.div>
  </div>
);

const ShopBg = React.memo(() => {
  const bars = useMemo(() => [...Array(20)].map((_, i) => ({
    id: i,
    width: Math.random() * 8 + 2,
    duration: 2 + Math.random() * 2,
    delay: i * 0.1
  })), []);

  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-30">
      <div className="flex gap-1 h-full w-full items-center justify-center px-4">
        {bars.map((bar) => (
          <motion.div 
            key={bar.id} 
            animate={{ height: ['40%', '80%', '40%'], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: bar.duration, repeat: Infinity, delay: bar.delay }}
            className="bg-yellow-500" 
            style={{ width: `${bar.width}px` }} 
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 border-4 border-yellow-500/20 rounded-full animate-ping" />
        </div>
      </div>
    </div>
  );
});

const FriendsBg = React.memo(() => (
  <div className="absolute inset-0 flex items-center justify-center opacity-40">
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <filter id="neon-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g stroke="currentColor" strokeWidth="0.5" fill="none" className="text-indigo-500" filter="url(#neon-glow)">
        <motion.path 
          animate={{ strokeDashoffset: [0, 100] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          strokeDasharray="10 5"
          d="M 20 30 L 50 50 L 80 20 M 50 50 L 30 80 M 50 50 L 70 70 M 20 30 L 30 80 M 80 20 L 70 70" 
        />
      </g>
      <g fill="currentColor" className="text-indigo-500">
        <circle cx="20" cy="30" r="2" />
        <circle cx="50" cy="50" r="3" />
        <circle cx="80" cy="20" r="2" />
        <circle cx="30" cy="80" r="2" />
        <circle cx="70" cy="70" r="2" />
      </g>
    </svg>
  </div>
));

const ArcadeBg = React.memo(() => {
  const cells = useMemo(() => [...Array(100)].map((_, i) => {
    const isSnake = [42, 43, 44, 45, 35, 25, 26, 27, 28, 38].includes(i);
    const isFood = i === 67;
    return { id: i, isSnake, isFood };
  }), []);

  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-30">
      <div className="grid grid-cols-10 grid-rows-10 gap-1 w-full h-full p-4">
        {cells.map((cell) => (
          <div
            key={cell.id}
            className={`${
              cell.isSnake
                ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]'
                : cell.isFood
                ? 'bg-red-500'
                : 'bg-green-500/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

const DuelsBg = React.memo(() => (
  <div className="absolute inset-0 flex items-center justify-center opacity-30">
    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.1)_10px,rgba(239,68,68,0.1)_20px)] animate-pulse" />
    <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,rgba(239,68,68,0.1)_10px,rgba(239,68,68,0.1)_20px)]" />
    <motion.div 
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 0.5, repeat: Infinity }}
      className="text-red-500 font-black text-7xl md:text-9xl italic transform -rotate-12"
    >
      VS
    </motion.div>
  </div>
));

const FeatureCard = ({ className, title, description, icon, link, color, borderColor, glowColor, bgGradient, customBg, sysName }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`relative rounded-[32px] overflow-hidden group cursor-pointer ${className} bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 hover:${borderColor} ${glowColor} transition-all duration-500 shadow-2xl`}
  >
    <Link to={link} className="block h-full p-8 flex flex-col" onClick={() => playSound('click')}>
      {}
      {bgGradient && (
        <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-40 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none`} />
      )}

      {customBg && (
        <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-80 transition-opacity duration-700 overflow-hidden mix-blend-screen pointer-events-none">
          {customBg}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>
      )}
      
      {}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-10 opacity-20 group-hover:opacity-40 transition-opacity" />

      <div className="relative z-20 flex flex-col h-full">
        {}
        <div className="flex justify-between items-start mb-8">
          <div className={`p-4 rounded-none border border-white/10 bg-black/50 ${color} group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
            {icon}
          </div>
          <div className="font-mono text-xs tracking-widest text-white/30 group-hover:text-white/60 transition-colors">
            {sysName}
          </div>
        </div>

        {}
        <div className="mt-auto">
          <h3 className="text-3xl font-black text-white mb-3 tracking-tight uppercase">{title}</h3>
          <p className="text-white/50 text-base font-mono leading-relaxed mb-6">{description}</p>
          
          {}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
            <div className="flex items-center gap-2 text-xs font-mono text-white/40">
              <span className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')} animate-pulse`} />
              STATUS: ONLINE
            </div>
            <div className={`flex items-center gap-2 font-mono text-sm font-bold ${color} opacity-80 group-hover:opacity-100 group-hover:gap-4 transition-all`}>
              INITIATE <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);
