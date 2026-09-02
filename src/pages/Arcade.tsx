import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Play, RotateCcw, Trophy, Skull, Star, Code2, Keyboard, BrainCircuit, Blocks, Gamepad2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Bug, Eye, Scissors, Swords, Zap, TerminalSquare, Search, Clock, Target, ShieldCheck, MessageCircle, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { Duel } from './Duel';
import { Sandbox } from './Sandbox';
import { PetCompanion } from '../components/PetCompanion';
import { TextReveal } from '../components/TextReveal';
import { MagneticButton } from '../components/MagneticButton';


type Position = { x: number; y: number };
type Entity = { id: string; type: 'player' | 'slime' | 'gem' | 'wall'; pos: Position; hp?: number };

const GRID_SIZE = 8;
const CELL_SIZE = 48; 

const INITIAL_ENTITIES: Entity[] = [
  { id: 'p1', type: 'player', pos: { x: 1, y: 1 }, hp: 3 },
  { id: 's1', type: 'slime', pos: { x: 4, y: 2 }, hp: 1 },
  { id: 's2', type: 'slime', pos: { x: 6, y: 5 }, hp: 1 },
  { id: 'g1', type: 'gem', pos: { x: 6, y: 1 } },
  { id: 'g2', type: 'gem', pos: { x: 1, y: 6 } },
  
  { id: 'w1', type: 'wall', pos: { x: 3, y: 1 } },
  { id: 'w2', type: 'wall', pos: { x: 3, y: 2 } },
  { id: 'w3', type: 'wall', pos: { x: 3, y: 3 } },
  { id: 'w4', type: 'wall', pos: { x: 5, y: 5 } },
  { id: 'w5', type: 'wall', pos: { x: 5, y: 6 } },
];

const CODE_SNIPPETS = [
  "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
  "class User:\n    def __init__(self, name):\n        self.name = name\n        self.is_active = True",
  "import json\n\ndata = {'key': 'value'}\njson_str = json.dumps(data)",
  "numbers = [1, 2, 3, 4, 5]\nsquares = [n**2 for n in numbers if n % 2 == 0]",
  "try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    print('Cannot divide by zero!')"
];

const DEBUG_QUESTIONS = [
  {
    code: "def greet(name):\nprint('Hello ' + name)",
    options: ["Пропущен двоеточие", "Ошибка отступа (Indentation)", "Ошибка имени", "Синтаксическая ошибка"],
    correct: 1,
    explanation: "В Python тело функции должно иметь отступ."
  },
  {
    code: "if x = 10:\n    print('Ten')",
    options: ["x не определен", "Используйте == для сравнения", "Пропущены кавычки", "Неверный print"],
    correct: 1,
    explanation: "Одиночное '=' используется для присваивания, '==' — для сравнения."
  },
  {
    code: "my_list = [1, 2, 3]\nprint(my_list[3])",
    options: ["Индекс вне диапазона", "Список пуст", "Неверный синтаксис", "Ошибка типа"],
    correct: 0,
    explanation: "Индексация начинается с 0. В списке из 3 элементов максимальный индекс — 2."
  },
  {
    code: "for i in range(5)\n    print(i)",
    options: ["range() не определен", "Пропущено двоеточие", "Неверный цикл", "Ошибка отступа"],
    correct: 1,
    explanation: "После объявления цикла 'for' обязательно должно стоять двоеточие."
  }
];

const PREDICT_QUESTIONS = [
  {
    code: "x = [1, 2, 3]\ny = x\ny.append(4)\nprint(len(x))",
    options: ["3", "4", "5", "Ошибка"],
    correct: 1,
    explanation: "Списки в Python передаются по ссылке. Изменение y меняет и x."
  },
  {
    code: "a = 5\nb = 10\na, b = b, a\nprint(a)",
    options: ["5", "10", "None", "Ошибка"],
    correct: 1,
    explanation: "Конструкция a, b = b, a меняет значения переменных местами."
  },
  {
    code: "print('Python'[1:4])",
    options: ["Pyth", "yth", "ytho", "Pyt"],
    correct: 1,
    explanation: "Срез [1:4] берет символы с индексами 1, 2 и 3 (y, t, h)."
  },
  {
    code: "d = {'a': 1, 'b': 2}\nprint(d.get('c', 3))",
    options: ["1", "2", "3", "None"],
    correct: 2,
    explanation: "Метод get() возвращает значение по умолчанию (3), если ключ не найден."
  }
];

const REGEX_QUESTIONS = [
  { q: "Найдите все цифры в строке 'user123'", p: "\\d+", options: ["\\d+", "\\w+", "[a-z]", "\\s"], correct: 0 },
  { q: "Найдите слово 'Python' (без учета регистра)", p: "(?i)python", options: ["python", "PYTHON", "(?i)python", "^python"], correct: 2 },
  { q: "Найдите начало строки", p: "^", options: ["$", "^", ".", "*"], correct: 1 },
  { q: "Найдите 3 буквы 'a' подряд", p: "a{3}", options: ["a3", "a{3}", "a+", "a*"], correct: 1 }
];

const ALGO_QUESTIONS = [
  { code: "def func(n):\n  for i in range(n):\n    print(i)", complexity: "O(n)", options: ["O(1)", "O(n)", "O(n²)", "O(log n)"], correct: 1 },
  { code: "def func(n):\n  return n * n", complexity: "O(1)", options: ["O(1)", "O(n)", "O(n²)", "O(log n)"], correct: 0 },
  { code: "def func(n):\n  for i in range(n):\n    for j in range(n):\n      print(i, j)", complexity: "O(n²)", options: ["O(1)", "O(n)", "O(n²)", "O(log n)"], correct: 2 },
  { code: "def func(n):\n  i = n\n  while i > 1:\n    i //= 2", complexity: "O(log n)", options: ["O(1)", "O(n)", "O(n²)", "O(log n)"], correct: 3 }
];

const TRIVIA_QUESTIONS = [
  { q: "Кто создал Python?", options: ["Деннис Ритчи", "Бьерн Страуструп", "Гвидо ван Россум", "Линус Торвальдс"], correct: 2 },
  { q: "В каком году появился Python?", options: ["1989", "1991", "1995", "2000"], correct: 1 },
  { q: "Какое ключевое слово используется для создания функций?", options: ["func", "function", "def", "lambda"], correct: 2 },
  { q: "Что выведет bool([])?", options: ["True", "False", "None", "Error"], correct: 1 }
];

export const Arcade = () => {
  const { addXp } = useAuth();
  const [activeGame, setActiveGame] = useState<'pyarcade' | 'speedtyper' | 'logicgates' | 'syntaxmatch' | 'snake' | 'debugrush' | 'predictor' | 'duel' | 'sandbox' | 'regexracer' | 'algoascent' | 'triviachase'>('pyarcade');
  const [isSwitching, setIsSwitching] = useState(false);

  const handleGameSwitch = (game: typeof activeGame) => {
    if (game === activeGame) return;
    setIsSwitching(true);
    playSound('click');
    setTimeout(() => {
      setActiveGame(game);
      setIsSwitching(false);
    }, 600);
  };

  
  const [entities, setEntities] = useState<Entity[]>(INITIAL_ENTITIES);
  const [code, setCode] = useState("for i in range(3):\n    move_right()\n\nmove_down()\nattack()");
  const [output, setOutput] = useState<string[]>(['System initialized. Waiting for commands...']);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [playerAction, setPlayerAction] = useState<'idle' | 'attack' | 'hit'>('idle');

  
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [typedCode, setTypedCode] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [typerFinished, setTyperFinished] = useState(false);

  
  const [logicScore, setLogicScore] = useState(0);
  const [currentLogicQuestion, setCurrentLogicQuestion] = useState(0);
  const [logicGameOver, setLogicGameOver] = useState(false);
  const [logicFlash, setLogicFlash] = useState<'success' | 'error' | null>(null);
  const logicQuestions = [
    { q: "True and False", a: false },
    { q: "not False", a: true },
    { q: "True or False", a: true },
    { q: "not (True and True)", a: false },
    { q: "(True or False) and True", a: true },
    { q: "10 > 5 and 5 < 2", a: false },
    { q: "'Python' == 'python'", a: false },
    { q: "len([1, 2, 3]) == 3", a: true },
    { q: "not (10 == 10)", a: false },
    { q: "True and (False or True)", a: true }
  ];

  
  type Card = { id: number; content: string; type: 'concept' | 'syntax'; pairId: number; isFlipped: boolean; isMatched: boolean };
  const initialCards: Omit<Card, 'id' | 'isFlipped' | 'isMatched'>[] = [
    { content: 'Список', type: 'concept', pairId: 1 },
    { content: '[1, 2, 3]', type: 'syntax', pairId: 1 },
    { content: 'Словарь', type: 'concept', pairId: 2 },
    { content: '{"key": "value"}', type: 'syntax', pairId: 2 },
    { content: 'Функция', type: 'concept', pairId: 3 },
    { content: 'def my_func():', type: 'syntax', pairId: 3 },
    { content: 'Строка', type: 'concept', pairId: 4 },
    { content: '"Hello"', type: 'syntax', pairId: 4 },
    { content: 'Целое число', type: 'concept', pairId: 5 },
    { content: '42', type: 'syntax', pairId: 5 },
    { content: 'Булево', type: 'concept', pairId: 6 },
    { content: 'True', type: 'syntax', pairId: 6 },
  ];

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchScore, setMatchScore] = useState(0);
  const [matchGameOver, setMatchGameOver] = useState(false);
  const [matchFlash, setMatchFlash] = useState<'success' | 'error' | null>(null);

  
  const [debugIndex, setDebugIndex] = useState(0);
  const [debugScore, setDebugScore] = useState(0);
  const [debugGameOver, setDebugGameOver] = useState(false);
  const [debugFlash, setDebugFlash] = useState<'success' | 'error' | null>(null);

  
  const [predictIndex, setPredictIndex] = useState(0);
  const [predictScore, setPredictScore] = useState(0);
  const [predictGameOver, setPredictGameOver] = useState(false);
  const [predictFlash, setPredictFlash] = useState<'success' | 'error' | null>(null);

  
  const [regexIndex, setRegexIndex] = useState(0);
  const [regexScore, setRegexScore] = useState(0);
  const [regexGameOver, setRegexGameOver] = useState(false);
  const [regexFlash, setRegexFlash] = useState<'success' | 'error' | null>(null);

  
  const [algoIndex, setAlgoIndex] = useState(0);
  const [algoScore, setAlgoScore] = useState(0);
  const [algoGameOver, setAlgoGameOver] = useState(false);
  const [algoFlash, setAlgoFlash] = useState<'success' | 'error' | null>(null);

  
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaScore, setTriviaScore] = useState(0);
  const [triviaGameOver, setTriviaGameOver] = useState(false);
  const [triviaFlash, setTriviaFlash] = useState<'success' | 'error' | null>(null);

  const initMatchGame = () => {
    const shuffled = [...initialCards]
      .sort(() => Math.random() - 0.5)
      .map((card, index) => ({ ...card, id: index, isFlipped: false, isMatched: false }));
    setCards(shuffled);
    setFlippedCards([]);
    setMatchScore(0);
    setMatchGameOver(false);
    playSound('click');
  };

  useEffect(() => {
    if (activeGame === 'syntaxmatch' && cards.length === 0) {
      initMatchGame();
    }
  }, [activeGame]);

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards.find(c => c.id === id)?.isFlipped || cards.find(c => c.id === id)?.isMatched) return;

    playSound('click');
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    setCards(cards.map(c => c.id === id ? { ...c, isFlipped: true } : c));

    if (newFlipped.length === 2) {
      const card1 = cards.find(c => c.id === newFlipped[0]);
      const card2 = cards.find(c => c.id === id);

      if (card1 && card2 && card1.pairId === card2.pairId) {
        setMatchFlash('success');
        setTimeout(() => {
          playSound('success');
          setCards(prev => prev.map(c => c.id === card1.id || c.id === card2.id ? { ...c, isMatched: true } : c));
          setFlippedCards([]);
          setMatchScore(prev => prev + 20);
          setMatchFlash(null);
          
          
          if (cards.filter(c => c.isMatched).length === cards.length - 2) {
            setMatchGameOver(true);
            playSound('levelUp');
            addXp(120); 
          }
        }, 500);
      } else {
        setMatchFlash('error');
        setTimeout(() => {
          playSound('error');
          setCards(prev => prev.map(c => c.id === card1?.id || c.id === card2?.id ? { ...c, isFlipped: false } : c));
          setFlippedCards([]);
          setMatchFlash(null);
        }, 1000);
      }
    }
  };

  const handleLogicAnswer = (answer: boolean) => {
    const isCorrect = answer === logicQuestions[currentLogicQuestion].a;
    
    if (isCorrect) {
      playSound('success');
      setLogicScore(prev => prev + 10);
      setLogicFlash('success');
    } else {
      playSound('error');
      setLogicFlash('error');
    }
    
    setTimeout(() => {
      setLogicFlash(null);
      if (currentLogicQuestion < logicQuestions.length - 1) {
        setCurrentLogicQuestion(prev => prev + 1);
      } else {
        setLogicGameOver(true);
        playSound('levelUp');
        addXp(logicScore + (isCorrect ? 10 : 0));
      }
    }, 500);
  };

  const resetLogicGame = () => {
    playSound('click');
    setLogicScore(0);
    setCurrentLogicQuestion(0);
    setLogicGameOver(false);
  };

  
  const handleDebugAnswer = (index: number) => {
    if (debugGameOver) return;
    const isCorrect = index === DEBUG_QUESTIONS[debugIndex].correct;
    
    if (isCorrect) {
      playSound('success');
      setDebugScore(prev => prev + 25);
      setDebugFlash('success');
    } else {
      playSound('error');
      setDebugFlash('error');
    }

    setTimeout(() => {
      setDebugFlash(null);
      if (debugIndex < DEBUG_QUESTIONS.length - 1) {
        setDebugIndex(prev => prev + 1);
      } else {
        setDebugGameOver(true);
        playSound('levelUp');
        addXp(debugScore + (isCorrect ? 25 : 0));
      }
    }, 800);
  };

  const resetDebugGame = () => {
    playSound('click');
    setDebugIndex(0);
    setDebugScore(0);
    setDebugGameOver(false);
  };

  
  const handlePredictAnswer = (index: number) => {
    if (predictGameOver) return;
    const isCorrect = index === PREDICT_QUESTIONS[predictIndex].correct;
    
    if (isCorrect) {
      playSound('success');
      setPredictScore(prev => prev + 30);
      setPredictFlash('success');
    } else {
      playSound('error');
      setPredictFlash('error');
    }

    setTimeout(() => {
      setPredictFlash(null);
      if (predictIndex < PREDICT_QUESTIONS.length - 1) {
        setPredictIndex(prev => prev + 1);
      } else {
        setPredictGameOver(true);
        playSound('levelUp');
        addXp(predictScore + (isCorrect ? 30 : 0));
      }
    }, 800);
  };

  const resetPredictGame = () => {
    playSound('click');
    setPredictIndex(0);
    setPredictScore(0);
    setPredictGameOver(false);
  };

  
  const handleRegexAnswer = (index: number) => {
    if (regexGameOver) return;
    const isCorrect = index === REGEX_QUESTIONS[regexIndex].correct;
    if (isCorrect) { playSound('success'); setRegexScore(s => s + 40); setRegexFlash('success'); }
    else { playSound('error'); setRegexFlash('error'); }
    setTimeout(() => {
      setRegexFlash(null);
      if (regexIndex < REGEX_QUESTIONS.length - 1) setRegexIndex(s => s + 1);
      else { setRegexGameOver(true); playSound('levelUp'); addXp(regexScore + (isCorrect ? 40 : 0)); }
    }, 800);
  };

  const handleAlgoAnswer = (index: number) => {
    if (algoGameOver) return;
    const isCorrect = index === ALGO_QUESTIONS[algoIndex].correct;
    if (isCorrect) { playSound('success'); setAlgoScore(s => s + 50); setAlgoFlash('success'); }
    else { playSound('error'); setAlgoFlash('error'); }
    setTimeout(() => {
      setAlgoFlash(null);
      if (algoIndex < ALGO_QUESTIONS.length - 1) setAlgoIndex(s => s + 1);
      else { setAlgoGameOver(true); playSound('levelUp'); addXp(algoScore + (isCorrect ? 50 : 0)); }
    }, 800);
  };

  const handleTriviaAnswer = (index: number) => {
    if (triviaGameOver) return;
    const isCorrect = index === TRIVIA_QUESTIONS[triviaIndex].correct;
    if (isCorrect) { playSound('success'); setTriviaScore(s => s + 20); setTriviaFlash('success'); }
    else { playSound('error'); setTriviaFlash('error'); }
    setTimeout(() => {
      setTriviaFlash(null);
      if (triviaIndex < TRIVIA_QUESTIONS.length - 1) setTriviaIndex(s => s + 1);
      else { setTriviaGameOver(true); playSound('levelUp'); addXp(triviaScore + (isCorrect ? 20 : 0)); }
    }, 800);
  };

  const resetNewGames = () => {
    playSound('click');
    setRegexIndex(0); setRegexScore(0); setRegexGameOver(false);
    setAlgoIndex(0); setAlgoScore(0); setAlgoGameOver(false);
    setTriviaIndex(0); setTriviaScore(0); setTriviaGameOver(false);
  };

  
  const runCode = async () => {
    if (isRunning || gameOver || gameWon) return;
    setIsRunning(true);
    playSound('click');
    setOutput(['> Executing script...']);
    
    let currentEntities = [...entities];
    let currentScore = score;
    
    const lines = code.split('\n').map(l => l.trim()).filter(l => l);
    const commands: string[] = [];
    
    let inLoop = false;
    let loopCount = 0;
    let loopCommands: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('for ') && line.includes('range(')) {
        const match = line.match(/range\((\d+)\)/);
        if (match) {
          loopCount = parseInt(match[1]);
          inLoop = true;
          continue;
        }
      }
      
      if (inLoop) {
        if (line === '' || !code.split('\n')[i].startsWith('    ')) {
          for (let j = 0; j < loopCount; j++) {
            commands.push(...loopCommands);
          }
          inLoop = false;
          loopCommands = [];
          commands.push(line);
        } else {
          loopCommands.push(line);
        }
      } else {
        commands.push(line);
      }
    }
    
    if (inLoop) {
      for (let j = 0; j < loopCount; j++) {
        commands.push(...loopCommands);
      }
    }
    
    for (const cmd of commands) {
      if (gameOver || gameWon) break;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let playerIndex = currentEntities.findIndex(e => e.type === 'player');
      if (playerIndex === -1) break;
      let player = { ...currentEntities[playerIndex] };
      
      let newPos = { ...player.pos };
      let actionMsg = '';

      if (cmd === 'move_up()') { newPos.y -= 1; actionMsg = 'Moved Up'; }
      else if (cmd === 'move_down()') { newPos.y += 1; actionMsg = 'Moved Down'; }
      else if (cmd === 'move_left()') { newPos.x -= 1; actionMsg = 'Moved Left'; }
      else if (cmd === 'move_right()') { newPos.x += 1; actionMsg = 'Moved Right'; }
      else if (cmd === 'attack()') {
        setPlayerAction('attack');
        playSound('click');
        setTimeout(() => setPlayerAction('idle'), 300);
        const adjacentSlimes = currentEntities.filter(e => 
          e.type === 'slime' && 
          Math.abs(e.pos.x - player.pos.x) + Math.abs(e.pos.y - player.pos.y) === 1
        );
        
        if (adjacentSlimes.length > 0) {
          actionMsg = 'Attacked and destroyed slime!';
          playSound('success');
          currentEntities = currentEntities.filter(e => e.id !== adjacentSlimes[0].id);
          currentScore += 50;
        } else {
          actionMsg = 'Attacked nothing.';
        }
      } else {
        actionMsg = `Unknown command: ${cmd}`;
      }

      if (cmd.startsWith('move_')) {
        if (newPos.x < 0 || newPos.x >= GRID_SIZE || newPos.y < 0 || newPos.y >= GRID_SIZE) {
          actionMsg = 'Hit boundary wall!';
          playSound('error');
        } else {
          const cellEntity = currentEntities.find(e => e.pos.x === newPos.x && e.pos.y === newPos.y);
          if (cellEntity) {
            if (cellEntity.type === 'wall') {
              actionMsg = 'Hit a wall!';
              playSound('error');
            } else if (cellEntity.type === 'slime') {
              actionMsg = 'Ouch! Hit a slime!';
              playSound('error');
              setPlayerAction('hit');
              setTimeout(() => setPlayerAction('idle'), 300);
              player.hp = (player.hp || 1) - 1;
              if (player.hp <= 0) {
                setGameOver(true);
                playSound('error');
                actionMsg = 'Game Over! You died.';
              }
            } else if (cellEntity.type === 'gem') {
              actionMsg = 'Collected a gem! +100 XP';
              playSound('success');
              currentScore += 100;
              currentEntities = currentEntities.filter(e => e.id !== cellEntity.id);
              player.pos = newPos;
            }
          } else {
            player.pos = newPos;
          }
        }
      }

      currentEntities[playerIndex] = player;
      setEntities([...currentEntities]);
      setScore(currentScore);
      setOutput(prev => [...prev, `> ${cmd} -> ${actionMsg}`]);
      
      if (!currentEntities.some(e => e.type === 'gem')) {
        setGameWon(true);
        playSound('levelUp');
        setOutput(prev => [...prev, '> SUCCESS: All gems collected!']);
        addXp(currentScore);
        break;
      }
    }
    
    setIsRunning(false);
  };

  const resetGame = () => {
    playSound('click');
    setEntities(INITIAL_ENTITIES);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setOutput(['System reset. Ready.']);
  };

  
  const handleType = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }
    setTypedCode(val);

    if (val === CODE_SNIPPETS[snippetIndex]) {
      const timeTaken = (Date.now() - (startTime || Date.now())) / 1000 / 60; 
      const words = val.length / 5;
      const calculatedWpm = Math.round(words / timeTaken);
      setWpm(calculatedWpm);
      setTyperFinished(true);
      playSound('levelUp');
      addXp(calculatedWpm); 
    }
  };

  const nextSnippet = () => {
    playSound('click');
    setSnippetIndex((prev) => (prev + 1) % CODE_SNIPPETS.length);
    setTypedCode("");
    setStartTime(null);
    setTyperFinished(false);
    setWpm(0);
  };

  const renderTyperText = () => {
    const target = CODE_SNIPPETS[snippetIndex];
    return target.split('').map((char, i) => {
      let color = 'text-white/40';
      let glow = '';
      if (i < typedCode.length) {
        if (typedCode[i] === char) {
          color = 'text-green-400';
          glow = 'drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]';
        } else {
          color = 'text-red-400 bg-red-400/20';
        }
      }
      return <span key={i} className={`${color} ${glow} transition-colors duration-75`}>{char}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-transparent text-white pt-40 pb-20 px-6 font-mono">
      
      <div className="max-w-7xl mx-auto">
        {}
        <div className="mb-16 grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-1">
            <PetCompanion />
          </div>
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-12 rounded-[40px] border border-white/10 relative overflow-hidden h-full flex flex-col justify-center"
            >
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full" />
              <h2 className="text-4xl font-bold mb-4 italic serif tracking-tight">
                <TextReveal text="Твой цифровой напарник" delay={0.1} />
              </h2>
              <p className="text-white/40 text-lg leading-relaxed">
                <TextReveal text="Заботься о своем питомце, решая задачи и играя в игры. Чем больше ты учишься, тем сильнее и умнее становится твой друг!" delay={0.3} />
              </p>
            </motion.div>
          </div>
        </div>

        {}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          <MagneticButton 
            onClick={() => handleGameSwitch('pyarcade')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'pyarcade' ? 'bg-brand-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'pyarcade' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />} Бот-Кодер
          </MagneticButton>
          <MagneticButton 
            onClick={() => handleGameSwitch('debugrush')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'debugrush' ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'debugrush' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bug className="w-5 h-5" />} Debug Rush
          </MagneticButton>
          <MagneticButton 
            onClick={() => handleGameSwitch('predictor')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'predictor' ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'predictor' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />} Predictor
          </MagneticButton>
          <MagneticButton 
            onClick={() => handleGameSwitch('speedtyper')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'speedtyper' ? 'bg-brand-secondary text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'speedtyper' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Keyboard className="w-5 h-5" />} Python-Спринтер
          </MagneticButton>
          <MagneticButton 
            onClick={() => handleGameSwitch('logicgates')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'logicgates' ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'logicgates' ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />} Булева Логика
          </MagneticButton>
          <MagneticButton 
            onClick={() => handleGameSwitch('syntaxmatch')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'syntaxmatch' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'syntaxmatch' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Blocks className="w-5 h-5" />} Синтаксис-Пары
          </MagneticButton>
          <MagneticButton 
            onClick={() => handleGameSwitch('snake')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'snake' ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'snake' ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />} Python Snake
          </MagneticButton>
          <MagneticButton 
            onClick={() => handleGameSwitch('duel')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'duel' ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'duel' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />} Дуэли
          </MagneticButton>
          <MagneticButton 
            onClick={() => handleGameSwitch('regexracer')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'regexracer' ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'regexracer' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />} RegEx Racer
          </MagneticButton>
          <MagneticButton 
            onClick={() => handleGameSwitch('algoascent')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'algoascent' ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'algoascent' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />} Big O Ascent
          </MagneticButton>
          <MagneticButton 
            onClick={() => handleGameSwitch('triviachase')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'triviachase' ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'triviachase' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />} Python Trivia
          </MagneticButton>
          <MagneticButton 
            onClick={() => handleGameSwitch('sandbox')}
            disabled={isSwitching}
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeGame === 'sandbox' ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)]' : 'glass text-white/60 hover:text-white'}`}
          >
            {isSwitching && activeGame === 'sandbox' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Code2 className="w-5 h-5" />} Песочница
          </MagneticButton>
        </div>

        {activeGame === 'pyarcade' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-5xl font-display font-bold mb-2 flex items-center gap-4 text-green-400">
                  <Code2 className="w-10 h-10" />
                  <TextReveal text="ПиАркада" delay={0.1} />
                </h1>
                <p className="text-white/50">Пишите код на Python, чтобы управлять ботом. Соберите все камни для победы.</p>
              </div>
              <div className="flex gap-6 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="text-center">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Счет</div>
                  <div className="text-2xl font-bold text-yellow-400">{score}</div>
                </div>
                <div className="text-center">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Здоровье</div>
                  <div className="text-2xl font-bold text-red-400 flex gap-1 justify-center">
                    {[...Array(entities.find(e => e.type === 'player')?.hp || 0)].map((_, i) => (
                      <span key={i}>♥</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {}
              <div className="lg:col-span-7">
                <div className={`glass rounded-[30px] p-8 border border-white/10 relative overflow-hidden bg-[#0a0a0a] ${playerAction === 'hit' ? 'animate-shake' : ''}`}>
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20 opacity-50" />
                  
                  <div 
                    className="relative mx-auto bg-[#111] border-4 border-[#333] rounded-lg shadow-[0_0_50px_rgba(0,255,0,0.1)]"
                    style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
                  >
                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
                      {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => (
                        <div key={i} className="border border-white/5" />
                      ))}
                    </div>

                    <AnimatePresence>
                      {entities.map(entity => (
                        <motion.div
                          key={entity.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ 
                            scale: 1, 
                            opacity: 1,
                            x: entity.pos.x * CELL_SIZE,
                            y: entity.pos.y * CELL_SIZE
                          }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className="absolute flex items-center justify-center z-10"
                          style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        >
                          {entity.type === 'player' && (
                            <motion.div 
                              animate={
                                playerAction === 'attack' ? { scale: [1, 1.3, 1], rotate: [0, 20, -20, 0] } :
                                playerAction === 'hit' ? { x: [-5, 5, -5, 5, 0], backgroundColor: ['#ef4444', '#22c55e'] } :
                                {}
                              }
                              transition={{ duration: 0.3 }}
                              className="w-8 h-8 bg-green-500 rounded-sm shadow-[0_0_15px_#22c55e] flex items-center justify-center text-black font-bold text-xs relative" style={{ imageRendering: 'pixelated' }}>
                              <div className="w-full h-full relative z-10">
                                <div className="absolute top-2 left-1.5 w-1.5 h-1.5 bg-black" />
                                <div className="absolute top-2 right-1.5 w-1.5 h-1.5 bg-black" />
                                <div className="absolute bottom-1.5 left-2 w-4 h-1 bg-black" />
                              </div>
                              {playerAction === 'attack' && (
                                <motion.div 
                                  initial={{ opacity: 1, scale: 0.5 }}
                                  animate={{ opacity: 0, scale: 2.5 }}
                                  transition={{ duration: 0.3 }}
                                  className="absolute inset-0 border-2 border-white rounded-full z-0"
                                />
                              )}
                            </motion.div>
                          )}
                          {entity.type === 'slime' && (
                            <motion.div 
                              animate={{ y: [0, -5, 0], scaleY: [1, 0.9, 1] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="w-8 h-8 bg-purple-500 rounded-t-xl rounded-b-sm shadow-[0_0_15px_#a855f7] flex items-center justify-center relative"
                            >
                              <div className="absolute top-2 left-1.5 w-1.5 h-1.5 bg-white rounded-full">
                                <div className="w-0.5 h-0.5 bg-black ml-0.5 mt-0.5" />
                              </div>
                              <div className="absolute top-2 right-1.5 w-1.5 h-1.5 bg-white rounded-full">
                                <div className="w-0.5 h-0.5 bg-black ml-0.5 mt-0.5" />
                              </div>
                            </motion.div>
                          )}
                          {entity.type === 'gem' && (
                            <motion.div 
                              animate={{ rotate: [0, 15, -15, 0], y: [0, -4, 0] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                              className="w-5 h-5 bg-yellow-400 rotate-45 shadow-[0_0_15px_#facc15] relative"
                            >
                               <div className="absolute inset-1 bg-yellow-200 opacity-50" />
                            </motion.div>
                          )}
                          {entity.type === 'wall' && (
                            <div className="w-full h-full bg-[#444] border-[3px] border-t-[#666] border-l-[#666] border-b-[#222] border-r-[#222] rounded-sm" />
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence>
                    {gameOver && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-red-900/80 z-30 flex flex-col items-center justify-center backdrop-blur-sm"
                      >
                        <Skull className="w-20 h-20 text-red-400 mb-4" />
                        <h2 className="text-4xl font-bold text-white mb-6">ИГРА ОКОНЧЕНА</h2>
                        <button onClick={resetGame} className="px-8 py-3 bg-white text-red-900 font-bold rounded-full hover:bg-gray-200 transition-colors">
                          Попробовать снова
                        </button>
                      </motion.div>
                    )}
                    {gameWon && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-green-900/80 z-30 flex flex-col items-center justify-center backdrop-blur-sm"
                      >
                        <Trophy className="w-20 h-20 text-yellow-400 mb-4" />
                        <h2 className="text-4xl font-bold text-white mb-2">УРОВЕНЬ ПРОЙДЕН!</h2>
                        <p className="text-green-200 mb-6">+{score} XP получено</p>
                        <button onClick={resetGame} className="px-8 py-3 bg-white text-green-900 font-bold rounded-full hover:bg-gray-200 transition-colors">
                          Играть снова
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="glass rounded-[30px] border border-white/10 overflow-hidden flex flex-col flex-1 bg-[#0a0a0a]">
                  <div className="bg-black/40 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-bold text-white/70">bot_script.py</span>
                    </div>
                    <div className="text-xs text-white/40">Доступно: move_up(), move_down(), move_left(), move_right(), attack()</div>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isRunning || gameOver || gameWon}
                    className="flex-1 w-full bg-transparent p-6 font-mono text-sm text-green-400 focus:outline-none resize-none disabled:opacity-50"
                    spellCheck="false"
                  />
                  <div className="p-4 border-t border-white/5 bg-black/40 flex gap-4">
                    <button 
                      onClick={runCode}
                      disabled={isRunning || gameOver || gameWon}
                      className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-black disabled:opacity-50 transition-colors rounded-xl font-bold flex items-center justify-center gap-2 relative overflow-hidden group"
                    >
                      <span className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-shimmer" />
                      <Play className="w-4 h-4" /> Выполнить
                    </button>
                    <button 
                      onClick={resetGame}
                      className="px-6 py-3 glass hover:bg-white/10 transition-colors rounded-xl font-bold flex items-center justify-center"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="glass rounded-[30px] border border-white/10 overflow-hidden bg-black/80 h-48 flex flex-col">
                  <div className="px-6 py-3 border-b border-white/5 text-xs font-bold text-white/40 uppercase tracking-widest">
                    Системный лог
                  </div>
                  <div className="p-6 font-mono text-xs text-white/60 overflow-y-auto flex-1 flex flex-col gap-1">
                    {output.map((line, i) => (
                      <div key={i} className={line.includes('SUCCESS') ? 'text-green-400' : line.includes('Error') || line.includes('Over') ? 'text-red-400' : ''}>
                        {line}
                      </div>
                    ))}
                    {isRunning && (
                      <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>_</motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {}
        {activeGame === 'debugrush' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-display font-bold text-red-400 mb-2 flex items-center justify-center gap-4">
                <Bug className="w-10 h-10" /> Debug Rush
              </h2>
              <p className="text-white/50 text-xl">Найдите ошибку в коде Python как можно быстрее.</p>
            </div>

            <div className={`glass rounded-[30px] p-8 border border-white/10 relative overflow-hidden bg-[#0a0a0a] min-h-[500px] flex flex-col transition-colors duration-300 ${debugFlash === 'success' ? 'bg-green-500/20' : debugFlash === 'error' ? 'bg-red-500/20 animate-shake' : ''}`}>
              {}
              {!debugGameOver && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        x: [Math.random() * 800, Math.random() * 800],
                        y: [Math.random() * 500, Math.random() * 500],
                        rotate: [0, 360],
                        scale: [1, 1.5, 1],
                        opacity: [0.1, 0.3, 0.1]
                      }}
                      transition={{ 
                        duration: 2 + Math.random() * 3, 
                        repeat: Infinity,
                        repeatType: "mirror"
                      }}
                      className="absolute text-red-500"
                    >
                      <Bug className="w-24 h-24" />
                    </motion.div>
                  ))}
                </div>
              )}

              {!debugGameOver ? (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div className="text-white/40 font-mono">Вопрос {debugIndex + 1} из {DEBUG_QUESTIONS.length}</div>
                    <div className="text-2xl font-bold text-yellow-400">{debugScore} XP</div>
                  </div>

                  <div className="bg-black/50 rounded-2xl p-6 font-mono text-lg mb-8 border border-white/5">
                    <pre className="text-blue-300">
                      {DEBUG_QUESTIONS[debugIndex].code}
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DEBUG_QUESTIONS[debugIndex].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleDebugAnswer(i)}
                        className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all text-left font-bold text-lg"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                  <Trophy className="w-24 h-24 text-yellow-500 mb-6" />
                  <h3 className="text-4xl font-bold mb-2">Отличная отладка!</h3>
                  <p className="text-white/60 text-xl mb-8">Вы заработали {debugScore} XP за исправление багов.</p>
                  <button 
                    onClick={resetDebugGame}
                    className="px-10 py-4 bg-brand-primary rounded-2xl font-bold text-xl hover:scale-105 transition-transform"
                  >
                    Играть снова
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {}
        {activeGame === 'predictor' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-display font-bold text-blue-400 mb-2 flex items-center justify-center gap-4">
                <Eye className="w-10 h-10" /> Output Predictor
              </h2>
              <p className="text-white/50 text-xl">Предскажите, что выведет этот код Python.</p>
            </div>

            <div className={`glass rounded-[30px] p-8 border border-white/10 relative overflow-hidden bg-[#0a0a0a] min-h-[500px] flex flex-col transition-colors duration-300 ${predictFlash === 'success' ? 'bg-green-500/20' : predictFlash === 'error' ? 'bg-red-500/20 animate-shake' : ''}`}>
              {!predictGameOver ? (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div className="text-white/40 font-mono">Вопрос {predictIndex + 1} из {PREDICT_QUESTIONS.length}</div>
                    <div className="text-2xl font-bold text-yellow-400">{predictScore} XP</div>
                  </div>

                  <div className="bg-black/50 rounded-2xl p-6 font-mono text-lg mb-8 border border-white/5">
                    <pre className="text-green-300">
                      {PREDICT_QUESTIONS[predictIndex].code}
                    </pre>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {PREDICT_QUESTIONS[predictIndex].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handlePredictAnswer(i)}
                        className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all text-center font-bold text-xl"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                  <Star className="w-24 h-24 text-yellow-500 mb-6" />
                  <h3 className="text-4xl font-bold mb-2">Мастер интерпретации!</h3>
                  <p className="text-white/60 text-xl mb-8">Вы заработали {predictScore} XP за верные предсказания.</p>
                  <button 
                    onClick={resetPredictGame}
                    className="px-10 py-4 bg-brand-primary rounded-2xl font-bold text-xl hover:scale-105 transition-transform"
                  >
                    Играть снова
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeGame === 'speedtyper' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-display font-bold mb-4 flex items-center justify-center gap-4 text-brand-secondary">
                <Keyboard className="w-10 h-10" />
                <TextReveal text="Скоропечать" delay={0.1} />
              </h1>
              <p className="text-white/50 text-xl">Печатайте код на Python как можно быстрее, чтобы заработать XP.</p>
            </div>

            <div className="glass rounded-[30px] p-8 border border-white/10 relative overflow-hidden bg-[#0a0a0a]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 mb-8 p-6 bg-black/50 rounded-2xl border border-white/5 font-mono text-lg leading-relaxed whitespace-pre-wrap">
                {renderTyperText()}
              </div>

              <div className="relative z-10">
                <textarea
                  value={typedCode}
                  onChange={handleType}
                  disabled={typerFinished}
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-lg text-white focus:outline-none focus:border-brand-secondary transition-colors resize-none disabled:opacity-50"
                  placeholder="Начните печатать здесь..."
                  spellCheck="false"
                  autoFocus
                />
              </div>

              <AnimatePresence>
                {typerFinished && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center rounded-[30px]"
                  >
                    <Trophy className="w-20 h-20 text-yellow-400 mb-6" />
                    <h2 className="text-4xl font-bold mb-2">Сниппет завершен!</h2>
                    <div className="flex gap-8 mb-8">
                      <div className="text-center">
                        <div className="text-white/40 text-sm uppercase tracking-widest mb-1">Скорость</div>
                        <div className="text-4xl font-display font-bold text-brand-secondary">{wpm} <span className="text-xl">WPM</span></div>
                      </div>
                      <div className="text-center">
                        <div className="text-white/40 text-sm uppercase tracking-widest mb-1">XP Получено</div>
                        <div className="text-4xl font-display font-bold text-green-400">+{wpm}</div>
                      </div>
                    </div>
                    <button 
                      onClick={nextSnippet}
                      className="px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full font-bold text-lg glow-shadow hover:scale-105 transition-all"
                    >
                      Следующий сниппет
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {activeGame === 'logicgates' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-display font-bold mb-4 flex items-center justify-center gap-4 text-purple-400">
                <BrainCircuit className="w-10 h-10" />
                <TextReveal text="Логика" delay={0.1} />
              </h1>
              <p className="text-white/50 text-xl">Правильно оценивайте булевы выражения Python, чтобы заработать XP.</p>
            </div>

            <div className={`glass rounded-[30px] p-8 border border-white/10 relative overflow-hidden bg-[#0a0a0a] min-h-[400px] flex flex-col items-center justify-center transition-colors duration-300 ${logicFlash === 'success' ? 'bg-green-500/20' : logicFlash === 'error' ? 'bg-red-500/20 animate-shake' : ''}`}>
              <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
              
              {!logicGameOver ? (
                <div className="relative z-10 w-full max-w-2xl text-center">
                  <div className="text-white/40 text-sm uppercase tracking-widest mb-8">Вопрос {currentLogicQuestion + 1} из {logicQuestions.length}</div>
                  
                  <div className="p-8 bg-black/50 rounded-2xl border border-white/5 font-mono text-3xl md:text-4xl text-white mb-12 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                    {logicQuestions[currentLogicQuestion].q}
                  </div>

                  <div className="flex gap-6 justify-center">
                    <button 
                      onClick={() => handleLogicAnswer(true)}
                      className="px-12 py-6 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl font-bold text-2xl hover:bg-green-500/20 hover:scale-105 transition-all w-48"
                    >
                      True
                    </button>
                    <button 
                      onClick={() => handleLogicAnswer(false)}
                      className="px-12 py-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl font-bold text-2xl hover:bg-red-500/20 hover:scale-105 transition-all w-48"
                    >
                      False
                    </button>
                  </div>
                  
                  <div className="mt-12 text-xl font-bold text-purple-400">
                    Счет: {logicScore}
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative z-10 flex flex-col items-center justify-center text-center"
                >
                  <Trophy className="w-20 h-20 text-yellow-400 mb-6" />
                  <h2 className="text-4xl font-bold mb-2">Викторина завершена!</h2>
                  <p className="text-white/50 text-xl mb-8">Вы набрали {logicScore} из {logicQuestions.length * 10}</p>
                  
                  <div className="text-center mb-8">
                    <div className="text-white/40 text-sm uppercase tracking-widest mb-1">XP Получено</div>
                    <div className="text-5xl font-display font-bold text-green-400">+{logicScore}</div>
                  </div>

                  <button 
                    onClick={resetLogicGame}
                    className="px-8 py-4 bg-purple-500 hover:bg-purple-400 text-white rounded-full font-bold text-lg glow-shadow hover:scale-105 transition-all"
                  >
                    Играть снова
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {activeGame === 'syntaxmatch' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-display font-bold mb-4 flex items-center justify-center gap-4 text-blue-400">
                <Blocks className="w-10 h-10" />
                <TextReveal text="Синтаксис" delay={0.1} />
              </h1>
              <p className="text-white/50 text-xl">Сопоставьте концепцию Python с ее синтаксисом, чтобы заработать XP.</p>
            </div>

            <div className={`glass rounded-[30px] p-8 border border-white/10 relative overflow-hidden bg-[#0a0a0a] min-h-[500px] flex flex-col items-center justify-center transition-colors duration-300 ${matchFlash === 'success' ? 'bg-green-500/20' : matchFlash === 'error' ? 'bg-red-500/20 animate-shake' : ''}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
              
              {!matchGameOver ? (
                <div className="relative z-10 w-full">
                  <div className="flex justify-between items-center mb-8">
                    <div className="text-white/40 text-sm uppercase tracking-widest">Счет</div>
                    <div className="text-2xl font-bold text-blue-400">{matchScore}</div>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {cards.map(card => (
                      <motion.div
                        key={card.id}
                        onClick={() => handleCardClick(card.id)}
                        className={`relative w-full aspect-square cursor-pointer ${card.isMatched ? 'opacity-0 pointer-events-none' : ''}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="w-full h-full absolute inset-0"
                          initial={false}
                          animate={{ rotateY: card.isFlipped ? 180 : 0 }}
                          transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 20 }}
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          {}
                          <div 
                            className="absolute inset-0 w-full h-full bg-white/5 border border-white/10 rounded-xl flex items-center justify-center"
                            style={{ backfaceVisibility: 'hidden' }}
                          >
                            <Blocks className="w-8 h-8 text-white/20" />
                          </div>
                          
                          {}
                          <div 
                            className={`absolute inset-0 w-full h-full rounded-xl flex items-center justify-center p-4 text-center border shadow-[0_0_20px_rgba(59,130,246,0.2)] ${card.type === 'concept' ? 'bg-blue-500/20 border-blue-500/50 text-blue-200 font-bold' : 'bg-black/80 border-white/20 text-green-400 font-mono text-sm'}`}
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          >
                            {card.content}
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative z-10 flex flex-col items-center justify-center text-center"
                >
                  <Trophy className="w-20 h-20 text-yellow-400 mb-6" />
                  <h2 className="text-4xl font-bold mb-2">Мастер памяти!</h2>
                  <p className="text-white/50 text-xl mb-8">Вы сопоставили все пары синтаксиса.</p>
                  
                  <div className="text-center mb-8">
                    <div className="text-white/40 text-sm uppercase tracking-widest mb-1">XP Получено</div>
                    <div className="text-5xl font-display font-bold text-green-400">+{matchScore}</div>
                  </div>

                  <button 
                    onClick={initMatchGame}
                    className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-full font-bold text-lg glow-shadow hover:scale-105 transition-all"
                  >
                    Играть снова
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {activeGame === 'regexracer' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-display font-bold text-orange-400 mb-2 flex items-center justify-center gap-4">
                <Search className="w-10 h-10" /> RegEx Racer
              </h2>
              <p className="text-white/50 text-xl">Выберите правильное регулярное выражение.</p>
            </div>
            <div className={`glass rounded-[30px] p-8 border border-white/10 relative overflow-hidden bg-[#0a0a0a] min-h-[400px] flex flex-col transition-colors duration-300 ${regexFlash === 'success' ? 'bg-green-500/20' : regexFlash === 'error' ? 'bg-red-500/20 animate-shake' : ''}`}>
              {!regexGameOver ? (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div className="text-white/40 font-mono">Вопрос {regexIndex + 1} из {REGEX_QUESTIONS.length}</div>
                    <div className="text-2xl font-bold text-yellow-400">{regexScore} XP</div>
                  </div>
                  <div className="bg-black/50 rounded-2xl p-8 font-mono text-2xl mb-8 border border-white/5 text-center text-orange-200 italic">
                    {REGEX_QUESTIONS[regexIndex].q}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {REGEX_QUESTIONS[regexIndex].options.map((opt, i) => (
                      <button key={i} onClick={() => handleRegexAnswer(i)} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-500/50 transition-all text-center font-bold text-xl font-mono text-orange-400">
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                  <Trophy className="w-24 h-24 text-yellow-500 mb-6" />
                  <h3 className="text-4xl font-bold mb-2">RegEx Мастер!</h3>
                  <button onClick={resetNewGames} className="px-10 py-4 bg-brand-primary rounded-2xl font-bold text-xl mt-8">Играть снова</button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeGame === 'algoascent' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-display font-bold text-cyan-400 mb-2 flex items-center justify-center gap-4">
                <Zap className="w-10 h-10" /> Big O Ascent
              </h2>
              <p className="text-white/50 text-xl">Определите временную сложность алгоритма.</p>
            </div>
            <div className={`glass rounded-[30px] p-8 border border-white/10 relative overflow-hidden bg-[#0a0a0a] min-h-[500px] flex flex-col transition-colors duration-300 ${algoFlash === 'success' ? 'bg-green-500/20' : algoFlash === 'error' ? 'bg-red-500/20 animate-shake' : ''}`}>
              {!algoGameOver ? (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div className="text-white/40 font-mono">Вопрос {algoIndex + 1} из {ALGO_QUESTIONS.length}</div>
                    <div className="text-2xl font-bold text-yellow-400">{algoScore} XP</div>
                  </div>
                  <div className="bg-black/50 rounded-2xl p-6 font-mono text-sm mb-8 border border-white/5">
                    <pre className="text-cyan-300">{ALGO_QUESTIONS[algoIndex].code}</pre>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {ALGO_QUESTIONS[algoIndex].options.map((opt, i) => (
                      <button key={i} onClick={() => handleAlgoAnswer(i)} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/50 transition-all text-center font-bold text-xl text-cyan-400">
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                  <Star className="w-24 h-24 text-yellow-500 mb-6" />
                  <h3 className="text-4xl font-bold mb-2">Алгоритмист!</h3>
                  <button onClick={resetNewGames} className="px-10 py-4 bg-brand-primary rounded-2xl font-bold text-xl mt-8">Играть снова</button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeGame === 'triviachase' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-display font-bold text-amber-400 mb-2 flex items-center justify-center gap-4">
                <Star className="w-10 h-10" /> Python Trivia
              </h2>
              <p className="text-white/50 text-xl">Насколько хорошо вы знаете Python?</p>
            </div>
            <div className={`glass rounded-[30px] p-8 border border-white/10 relative overflow-hidden bg-[#0a0a0a] min-h-[400px] flex flex-col transition-colors duration-300 ${triviaFlash === 'success' ? 'bg-green-500/20' : triviaFlash === 'error' ? 'bg-red-500/20 animate-shake' : ''}`}>
              {!triviaGameOver ? (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div className="text-white/40 font-mono">Вопрос {triviaIndex + 1} из {TRIVIA_QUESTIONS.length}</div>
                    <div className="text-2xl font-bold text-yellow-400">{triviaScore} XP</div>
                  </div>
                  <div className="bg-black/50 rounded-2xl p-8 text-2xl mb-8 border border-white/5 text-center font-bold">
                    {TRIVIA_QUESTIONS[triviaIndex].q}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TRIVIA_QUESTIONS[triviaIndex].options.map((opt, i) => (
                      <button key={i} onClick={() => handleTriviaAnswer(i)} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/50 transition-all text-center font-bold text-lg">
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                  <Trophy className="w-24 h-24 text-yellow-500 mb-6" />
                  <h3 className="text-4xl font-bold mb-2">Знаток Python!</h3>
                  <button onClick={resetNewGames} className="px-10 py-4 bg-brand-primary rounded-2xl font-bold text-xl mt-8">Играть снова</button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeGame === 'snake' && <PythonSnakeGame />}
        {activeGame === 'duel' && <Duel />}
        {activeGame === 'sandbox' && <Sandbox />}
      </div>
    </div>
  );
};

const PythonSnakeGame = () => {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState({ x: 0, y: -1 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [snakeFlash, setSnakeFlash] = useState<'error' | null>(null);
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<string[]>(["Система готова. Введите команду для змейки."]);
  const { addXp } = useAuth();

  const gridSize = 20;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.toLowerCase().trim();
    setCommand("");

    if (cmd === 'up' || cmd === 'snake.move_up()') {
      if (direction.y === 0) setDirection({ x: 0, y: -1 });
      setLogs(prev => [...prev, ">>> snake.move_up()"]);
    } else if (cmd === 'down' || cmd === 'snake.move_down()') {
      if (direction.y === 0) setDirection({ x: 0, y: 1 });
      setLogs(prev => [...prev, ">>> snake.move_down()"]);
    } else if (cmd === 'left' || cmd === 'snake.move_left()') {
      if (direction.x === 0) setDirection({ x: -1, y: 0 });
      setLogs(prev => [...prev, ">>> snake.move_left()"]);
    } else if (cmd === 'right' || cmd === 'snake.move_right()') {
      if (direction.x === 0) setDirection({ x: 1, y: 0 });
      setLogs(prev => [...prev, ">>> snake.move_right()"]);
    } else {
      setLogs(prev => [...prev, `Error: Unknown command '${cmd}'`]);
      playSound('error');
    }
  };

  useEffect(() => {
    if (isPaused || gameOver) return;

    const moveSnake = () => {
      const newSnake = [...snake];
      const head = { x: newSnake[0].x + direction.x, y: newSnake[0].y + direction.y };

      
      if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize || newSnake.some(s => s.x === head.x && s.y === head.y)) {
        setGameOver(true);
        setSnakeFlash('error');
        playSound('error');
        setTimeout(() => setSnakeFlash(null), 500);
        addXp(score);
        return;
      }

      newSnake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 10);
        setFood({ x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) });
        playSound('success');
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    const interval = setInterval(moveSnake, 200);
    return () => clearInterval(interval);
  }, [snake, direction, food, isPaused, gameOver]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 5, y: 5 });
    setDirection({ x: 0, y: -1 });
    setGameOver(false);
    setScore(0);
    setIsPaused(true);
    setLogs(["Игра сброшена. Введите команду."]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-display font-bold mb-4 flex items-center justify-center gap-4 text-green-400">
          <RotateCcw className="w-10 h-10" />
          <TextReveal text="Python Snake" delay={0.1} />
        </h1>
        <p className="text-white/50 text-xl">Управляйте змейкой с помощью команд Python: <code className="text-green-400">snake.move_up()</code>, <code className="text-green-400">move_down()</code> и т.д.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {}
        <div className="lg:col-span-7">
          <div className={`glass rounded-[40px] p-8 border border-white/10 relative overflow-hidden bg-[#0a0a0a] aspect-square flex items-center justify-center transition-colors duration-300 ${snakeFlash === 'error' ? 'bg-red-500/20 animate-shake' : ''}`}>
            <div className="grid grid-cols-20 grid-rows-20 w-full h-full gap-1">
              {[...Array(gridSize * gridSize)].map((_, i) => {
                const x = i % gridSize;
                const y = Math.floor(i / gridSize);
                const isSnake = snake.some(s => s.x === x && s.y === y);
                const isHead = snake[0].x === x && snake[0].y === y;
                const isFood = food.x === x && food.y === y;

                return (
                  <div 
                    key={i} 
                    className={`rounded-sm transition-all duration-200 ${isHead ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] z-10' : isSnake ? 'bg-green-600/60' : isFood ? 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-white/5'}`}
                  />
                );
              })}
            </div>

            <AnimatePresence>
              {(isPaused || gameOver) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20"
                >
                  {gameOver ? (
                    <>
                      <Skull className="w-20 h-20 text-red-500 mb-6" />
                      <h2 className="text-4xl font-bold mb-2">Game Over</h2>
                      <p className="text-white/50 text-xl mb-8">Счет: {score}</p>
                      <button onClick={resetGame} className="px-8 py-4 bg-green-500 text-black rounded-full font-bold text-lg hover:scale-105 transition-all">Играть снова</button>
                    </>
                  ) : (
                    <>
                      <Play className="w-20 h-20 text-green-400 mb-6" />
                      <button onClick={() => setIsPaused(false)} className="px-12 py-5 bg-green-500 text-black rounded-full font-bold text-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)]">Начать</button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass rounded-[40px] p-8 border border-white/10 bg-black/60 flex flex-col h-[400px]">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <Terminal className="w-5 h-5 text-green-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">Python Console</span>
            </div>
            <div className="flex-grow overflow-y-auto font-mono text-sm space-y-2 scrollbar-thin scrollbar-thumb-white/10 pr-2">
              {logs.map((log, i) => (
                <div key={i} className={log.startsWith('>>>') ? 'text-brand-primary' : log.includes('Error') ? 'text-red-400' : 'text-green-400/60'}>
                  {log}
                </div>
              ))}
            </div>
            <form onSubmit={handleCommand} className="mt-6 relative">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="snake.move_up()..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-mono text-green-400 focus:outline-none focus:border-green-500/50 transition-all"
              />
              <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            </form>
          </div>

          <div className="glass rounded-[40px] p-8 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <div className="text-white/40 text-xs uppercase tracking-widest">Текущий счет</div>
              <div className="text-3xl font-bold text-green-400">{score}</div>
            </div>
            <div className="space-y-3">
              <div className="text-[10px] text-white/20 uppercase tracking-widest mb-2">Доступные команды:</div>
              <div className="grid grid-cols-2 gap-2">
                {['move_up()', 'move_down()', 'move_left()', 'move_right()'].map(cmd => (
                  <code key={cmd} className="bg-white/5 p-2 rounded-lg text-[10px] text-green-400/60 text-center">snake.{cmd}</code>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
