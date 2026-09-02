import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, ChevronRight, BookOpen, ChevronLeft,
  Users, MessageSquare, Check, Share2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Layout';
import { playSound } from '../utils/sounds';
import { TextReveal } from '../components/TextReveal';
import { io, Socket } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import { CodeEditor } from '../components/CodeEditor';
import { toast } from 'sonner';

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const EXAMPLES = [
  { name: "Приветствие (Input)", code: "name = input('Как вас зовут? ')\nprint(f'Привет, {name}!')\nprint('Успехов в PyQuest!')" },
  { name: "Калькулятор", code: "a = int(input('Введите число A: '))\nb = int(input('Введите число B: '))\nprint(f'{a} + {b} = {a+b}')" },
  { name: "Сортировка", code: "nums = [64, 34, 25, 12, 22, 11, 90]\nnums.sort()\nprint(f'Отсортировано: {nums}')" },
  { name: "Фибоначчи", code: "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nfor i in range(10):\n    print(f'fib({i}) = {fibonacci(i)}')" },
  { name: "Генератор", code: "squares = [x**2 for x in range(10) if x % 2 == 0]\nprint(f'Квадраты четных до 10: {squares}')" },
  { name: "Словари", code: "user = {'name': 'Alice', 'role': 'Admin', 'level': 42}\nfor key, value in user.items():\n    print(f'{key}: {value}')" },
  { name: "Классы", code: "class Hero:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n    def take_damage(self, amount):\n        self.hp -= amount\n        print(f'{self.name} получил {amount} урона. HP: {self.hp}')\n\nplayer = Hero('Артур')\nplayer.take_damage(25)" },
  { name: "Декоратор", code: "def timer(func):\n    import time\n    def wrapper(*args, **kwargs):\n        start = time.time()\n        result = func(*args, **kwargs)\n        print(f'{func.__name__} выполнен за {time.time()-start:.3f}s')\n        return result\n    return wrapper\n\n@timer\ndef slow_sum(n):\n    return sum(range(n))\n\nprint(slow_sum(1000000))" },
  { name: "Генератор (yield)", code: "def count_up(start, stop):\n    current = start\n    while current <= stop:\n        yield current\n        current += 1\n\nfor num in count_up(1, 5):\n    print(num)" },
  { name: "Обработка ошибок", code: "def safe_divide(a, b):\n    try:\n        result = a / b\n        return result\n    except ZeroDivisionError:\n        return 'Ошибка: деление на ноль!'\n    finally:\n        print('Вычисление завершено.')\n\nprint(safe_divide(10, 2))\nprint(safe_divide(5, 0))" },
  { name: "Шифр Цезаря", code: "def caesar(text, shift):\n    result = ''\n    for ch in text:\n        if ch.isalpha():\n            base = ord('A') if ch.isupper() else ord('a')\n            result += chr((ord(ch) - base + shift) % 26 + base)\n        else:\n            result += ch\n    return result\n\ntext = 'Hello World'\nprint(f'Original: {text}')\nprint(f'Encoded:  {caesar(text, 3)}')\nprint(f'Decoded:  {caesar(caesar(text, 3), -3)}')" },
  { name: "Рекурсия - Ханой", code: "def hanoi(n, source, target, auxiliary):\n    if n == 1:\n        print(f'Диск 1: {source} -> {target}')\n        return\n    hanoi(n - 1, source, auxiliary, target)\n    print(f'Диск {n}: {source} -> {target}')\n    hanoi(n - 1, auxiliary, target, source)\n\nhanoi(3, 'A', 'C', 'B')" },
  { name: "Паттерн Singleton", code: "class Singleton:\n    _instance = None\n    def __new__(cls):\n        if cls._instance is None:\n            cls._instance = super().__new__(cls)\n            cls._instance.value = 0\n        return cls._instance\n\na = Singleton()\nb = Singleton()\na.value = 42\nprint(f'a.value = {a.value}')\nprint(f'b.value = {b.value}')\nprint(f'same? {a is b}')" },
  { name: "Генератор паролей", code: "import random\nimport string\n\ndef generate_password(length=12):\n    chars = string.ascii_letters + string.digits + '!@#$%^&*'\n    return ''.join(random.choice(chars) for _ in range(length))\n\nfor i in range(5):\n    print(f'Password {i+1}: {generate_password()}')" },
  { name: "Алгоритм бинарного поиска", code: "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\narr = list(range(0, 100, 5))\nprint(f'Array: {arr}')\nprint(f'Index of 45: {binary_search(arr, 45)}')\nprint(f'Index of 7:  {binary_search(arr, 7)}')" },
];

const TIPS = [
  "Используйте f-строки: f'Привет, {name}'. Это быстрее и удобнее, чем .format().",
  "Списки в Python начинаются с индекса 0. Отрицательный индекс -1 означает последний элемент.",
  "Функция range(5) создаёт числа от 0 до 4. Для диапазона [1..5]: range(1, 6).",
  "PEP 8 — руководство по стилю Python. Отступы — 4 пробела, имена переменных — snake_case.",
  "List comprehensions: [x**2 for x in nums if x > 0] — мощный и читаемый способ обработки списков.",
  "enumerate() даёт индекс и значение: for i, val in enumerate(my_list):",
  "Словари (dict) с Python 3.7+ сохраняют порядок добавления элементов.",
  "Используйте zip() для парной итерации: for a, b in zip(list1, list2):",
  "dict.get('key', default) — безопасная альтернатива dict['key'] без ошибки KeyError.",
  "*args и **kwargs позволяют функции принимать произвольное количество аргументов.",
  "Для копирования списка используйте list.copy() или list[:], а не просто new = old.",
  "collections.Counter — удобный способ подсчитывать элементы в коллекции.",
  "Используйте with open('file.txt') as f: — файл закроется автоматически.",
  "lambda x: x * 2 — анонимная функция. Отлично работает с map() и filter().",
  "any() и all() — проверка условия для любого/всех элементов в коллекции.",
  "set() — множество без дубликатов. Быстрая проверка 'in' по сравнению с list.",
  "Используйте isinstance() вместо type() == для проверки типа объекта.",
  "__repr__ должен возвращать строку для воссоздания объекта; __str__ — для человека.",
  "try/except/finally — обрабатывайте исключения, finally выполнится всегда.",
  "Генераторы (yield) экономят память при работе с большими наборами данных.",
  "dataclasses.dataclass() — удобный способ создать класс с минимальным кодом.",
  "typing.List, Dict, Optional — аннотации типов делают код понятнее и безопаснее.",
  "Модуль itertools содержит эффективные инструменты для работы с итерируемыми объектами.",
  "Не мутируйте список во время итерации по нему — используйте копию или list comprehension.",
  "Декораторы (@) — мощный способ добавить функциональность к функции без изменения её кода.",
];

export const Sandbox = React.memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateQuestProgress } = useAuth();
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [copied, setCopied] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [usersCount, setUsersCount] = useState(1);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io();
    const socket = socketRef.current;

    if (id) {
      socket.emit('join_room', { roomId: id, type: 'sandbox' });
      (socket as any).on('user_joined', ({ count }: { count: number }) => {
        setUsersCount(count);
        toast.info('Новый пользователь присоединился к сессии');
      });
      (socket as any).on('remote_update', ({ code: newCode }: { code: string }) => {
        setCode(newCode);
      });
    }

    return () => { socket.disconnect(); };
  }, [id]);

  const handleCodeChange = React.useCallback((newCode: string) => {
    setCode(newCode);
    if (socketRef.current && id) {
      socketRef.current.emit('sandbox_update', { roomId: id, code: newCode });
    }
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const nextTip = React.useCallback(() => { setCurrentTipIndex((prev) => (prev + 1) % TIPS.length); playSound('click'); }, []);
  const prevTip = React.useCallback(() => { setCurrentTipIndex((prev) => (prev - 1 + TIPS.length) % TIPS.length); playSound('click'); }, []);

  const copyLink = React.useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Ссылка скопирована!');
    playSound('click');
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const createSession = React.useCallback(() => {
    const sessionId = Math.random().toString(36).substring(7);
    navigate(`/sandbox/${sessionId}`);
    toast.success('Сессия создана! Поделись ссылкой с друзьями.');
  }, [navigate]);

  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent text-white">

      <div className="pt-24 md:pt-28 pb-10 md:pb-16 px-4 md:px-8 max-w-[1600px] mx-auto">
        {}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mb-3"
            >
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Creative Lab</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-2">
              <TextReveal text="ПЕСОЧНИЦА " delay={0.1} />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 italic pr-4">PYTHON</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-white/40 text-sm md:text-base max-w-md">Экспериментируй, создавай и тестируй идеи в реальном времени.</p>
              {id && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  <Users className="w-3 h-3" />{usersCount} Онлайн
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0">
            {!id ? (
              <button onClick={createSession} className="flex-1 md:flex-none px-6 py-3 bg-brand-primary text-black font-black rounded-xl md:rounded-2xl uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 text-xs md:text-sm shadow-lg shadow-brand-primary/20">
                <Users className="w-4 h-4" /> Создать сессию
              </button>
            ) : (
              <div className="flex-1 md:flex-none flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl p-2 md:pr-4">
                <div className="flex-1 px-3 py-1.5 bg-white/5 rounded-lg md:rounded-xl text-white/50 font-mono text-[10px] md:text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                  {window.location.host.split(':')[0]}/sandbox/{id}
                </div>
                <button onClick={copyLink} className="p-2 glass rounded-lg md:rounded-xl hover:bg-white/10 transition-all text-brand-primary">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </header>

        {}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {}
          <div className="w-full lg:w-60 shrink-0">
            <div className={`glass rounded-3xl border border-white/10 lg:sticky lg:top-24 transition-all duration-300 ${!isExamplesOpen ? 'p-4 lg:p-5' : 'p-5'}`}>
              <button 
                onClick={() => setIsExamplesOpen(!isExamplesOpen)}
                className="w-full lg:cursor-default flex items-center justify-between lg:mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><BookOpen className="w-4 h-4" /></div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-widest">Примеры</h3>
                </div>
                <ChevronRight className={`w-4 h-4 text-white/40 lg:hidden transition-transform ${isExamplesOpen ? 'rotate-90' : ''}`} />
              </button>
              
              <div className={`${!isExamplesOpen ? 'hidden lg:block' : 'block'} mt-4 lg:mt-0 space-y-1 max-h-[40vh] lg:max-h-[70vh] overflow-y-auto custom-scrollbar pr-1`}>
                {EXAMPLES.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                       handleCodeChange(ex.code);
                       if (window.innerWidth < 1024) setIsExamplesOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/8 text-white/60 hover:text-white transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{ex.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {}
          <div className="flex-1 min-w-0 w-full lg:min-h-[800px]">
            <CodeEditor
              initialCode={code}
              onChange={handleCodeChange}
              onSuccess={() => updateQuestProgress('sandbox')}
              lessonId="sandbox"
            />
          </div>

          {}
          <div className="w-full lg:w-72 shrink-0">
            <div className={`glass rounded-3xl border border-white/10 lg:sticky lg:top-24 transition-all duration-300 ${!isTipsOpen ? 'p-4 lg:p-6' : 'p-6'}`}>
              {}
              <button 
                onClick={() => setIsTipsOpen(!isTipsOpen)}
                className="w-full lg:cursor-default flex items-center justify-between lg:mb-5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary/20 rounded-xl text-brand-primary"><Sparkles className="w-4 h-4" /></div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-widest">Python Tips</h3>
                </div>
                <ChevronRight className={`w-4 h-4 text-white/40 lg:hidden transition-transform ${isTipsOpen ? 'rotate-90' : ''}`} />
              </button>

              <div className={`${!isTipsOpen ? 'hidden lg:flex' : 'flex'} mt-6 lg:mt-0 flex-col`}>
                {id && (
                  <div className="mb-5 bg-black/20 rounded-2xl p-4 border border-white/5">
                    <h3 className="text-xs font-black text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" /> Чат сессии
                    </h3>
                    <div className="h-32 overflow-y-auto custom-scrollbar space-y-2 mb-3">
                      <div className="p-2.5 rounded-xl bg-white/5">
                        <div className="text-[10px] font-bold text-brand-primary mb-1">Система</div>
                        <div className="text-xs text-white/60">Сессия активна. Пригласи друзей!</div>
                      </div>
                    </div>
                    <div className="relative">
                      <input type="text" placeholder="Сообщение..." className="w-full pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-primary/50 text-xs transition-all" />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-primary">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="min-h-[120px] lg:min-h-[160px] flex flex-col justify-center py-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTipIndex}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                    >
                      <div className="text-sm text-white/80 leading-relaxed italic">
                        "{TIPS[currentTipIndex]}"
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-3">
                  <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-mono text-[10px] uppercase font-bold tracking-widest">
                    {currentTipIndex + 1} / {TIPS.length}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={prevTip} className="p-2 glass rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextTip} className="p-2 glass rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});


