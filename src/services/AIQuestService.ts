import { collection, doc, getDocs, setDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface AIQuest {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reward: { xp: number; coins: number };
  initialCode: string;
  testCases: { inputValues: string[]; expectedOutput: string; description: string }[];
  type: 'code';
  recommendedRank?: string;
  createdAt: any;
  dateStr: string;
}

const BACKUP_QUESTS: Omit<AIQuest, 'id' | 'createdAt' | 'dateStr'>[] = [
  
  { title: "Эхо Пустоты", description: "Напишите функцию, которая возвращает строку 'Hello, World!'.", difficulty: 'easy', reward: { xp: 50, coins: 25 }, initialCode: "def solve():\n    pass", testCases: [{ inputValues: [], expectedOutput: "Hello, World!", description: "Basic return" }], type: 'code', recommendedRank: 'F' },
  { title: "Магия Четности", description: "Проверьте, является ли число четным.", difficulty: 'easy', reward: { xp: 50, coins: 25 }, initialCode: "def is_even(n):\n    pass", testCases: [{ inputValues: ["4"], expectedOutput: "True", description: "Even check" }, { inputValues: ["7"], expectedOutput: "False", description: "Odd check" }], type: 'code', recommendedRank: 'F' },
  { title: "Сумматор Миров", description: "Сложите два числа a и b.", difficulty: 'easy', reward: { xp: 50, coins: 25 }, initialCode: "def add(a, b):\n    pass", testCases: [{ inputValues: ["10 20"], expectedOutput: "30", description: "Simple addition" }], type: 'code', recommendedRank: 'F' },
  { title: "Реверс Заклинания", description: "Разверните строку задом наперед.", difficulty: 'easy', reward: { xp: 50, coins: 25 }, initialCode: "def reverse_str(s):\n    pass", testCases: [{ inputValues: ["python"], expectedOutput: "nohtyp", description: "String reversal" }], type: 'code', recommendedRank: 'E' },
  { title: "Длина Артефакта", description: "Верните длину списка.", difficulty: 'easy', reward: { xp: 50, coins: 25 }, initialCode: "def get_length(l):\n    pass", testCases: [{ inputValues: ["1 2 3 4"], expectedOutput: "4", description: "List length" }], type: 'code', recommendedRank: 'E' },
  { title: "Квадрат Силы", description: "Возведите число в квадрат.", difficulty: 'easy', reward: { xp: 50, coins: 25 }, initialCode: "def sq(n):\n    pass", testCases: [{ inputValues: ["5"], expectedOutput: "25", description: "Square" }], type: 'code', recommendedRank: 'E' },
  { title: "Первый из Магистров", description: "Верните первый элемент списка.", difficulty: 'easy', reward: { xp: 50, coins: 25 }, initialCode: "def first(l):\n    pass", testCases: [{ inputValues: ["10 20 30"], expectedOutput: "10", description: "First element" }], type: 'code', recommendedRank: 'D' },
  { title: "Крик в Регистре", description: "Переведите строку в верхний регистр.", difficulty: 'easy', reward: { xp: 50, coins: 25 }, initialCode: "def to_upper(s):\n    pass", testCases: [{ inputValues: ["hello"], expectedOutput: "HELLO", description: "Uppercase" }], type: 'code', recommendedRank: 'D' },
  { title: "Поиск Нуля", description: "Верните True, если 0 есть в списке.", difficulty: 'easy', reward: { xp: 50, coins: 25 }, initialCode: "def has_zero(l):\n    pass", testCases: [{ inputValues: ["1 0 2"], expectedOutput: "True", description: "Has zero" }], type: 'code', recommendedRank: 'D' },
  { title: "Арифметика Теней", description: "Умножьте число на 2.", difficulty: 'easy', reward: { xp: 50, coins: 25 }, initialCode: "def double(n):\n    pass", testCases: [{ inputValues: ["21"], expectedOutput: "42", description: "Double" }], type: 'code', recommendedRank: 'C' },
  
  
  { title: "Фибоначчиев Поток", description: "Верните n-ое число Фибоначчи.", difficulty: 'medium', reward: { xp: 120, coins: 60 }, initialCode: "def fib(n):\n    pass", testCases: [{ inputValues: ["6"], expectedOutput: "8", description: "6th Fib" }], type: 'code', recommendedRank: 'B' },
  { title: "Сортировка Хаоса", description: "Отсортируйте список чисел.", difficulty: 'medium', reward: { xp: 120, coins: 60 }, initialCode: "def sort_list(l):\n    pass", testCases: [{ inputValues: ["3 1 2"], expectedOutput: "[1, 2, 3]", description: "Sorting" }], type: 'code', recommendedRank: 'B' },
  { title: "Детектор Палиндромов", description: "Проверьте, является ли строка палиндромом.", difficulty: 'medium', reward: { xp: 120, coins: 60 }, initialCode: "def is_pal(s):\n    pass", testCases: [{ inputValues: ["radar"], expectedOutput: "True", description: "Palindrome" }], type: 'code', recommendedRank: 'A' },
  { title: "Уникальный Код", description: "Удалите дубликаты из списка.", difficulty: 'medium', reward: { xp: 120, coins: 60 }, initialCode: "def unique(l):\n    pass", testCases: [{ inputValues: ["1 2 2 3"], expectedOutput: "[1, 2, 3]", description: "Unique" }], type: 'code', recommendedRank: 'A' },
  { title: "Среднее Арифметическое", description: "Найдите среднее значение списка.", difficulty: 'medium', reward: { xp: 120, coins: 60 }, initialCode: "def avg(l):\n    pass", testCases: [{ inputValues: ["2 4 6"], expectedOutput: "4.0", description: "Average" }], type: 'code', recommendedRank: 'S' },
  { title: "Факториал Силы", description: "Найдите факториал n.", difficulty: 'medium', reward: { xp: 120, coins: 60 }, initialCode: "def fact(n):\n    pass", testCases: [{ inputValues: ["5"], expectedOutput: "120", description: "Factorial" }], type: 'code', recommendedRank: 'S' },
  { title: "Поиск в Глубине", description: "Найдите индекс элемента x.", difficulty: 'medium', reward: { xp: 120, coins: 60 }, initialCode: "def find_idx(l, x):\n    pass", testCases: [{ inputValues: ["10 20 30 20"], expectedOutput: "1", description: "Index of" }], type: 'code', recommendedRank: 'S+' },
  { title: "Генератор Квадратов", description: "Верните список квадратов от 1 до n.", difficulty: 'medium', reward: { xp: 120, coins: 60 }, initialCode: "def gen_sq(n):\n    pass", testCases: [{ inputValues: ["3"], expectedOutput: "[1, 4, 9]", description: "Squares list" }], type: 'code', recommendedRank: 'S+' },
  { title: "Сумма Оцифровки", description: "Сложите все цифры числа.", difficulty: 'medium', reward: { xp: 120, coins: 60 }, initialCode: "def sum_digits(n):\n    pass", testCases: [{ inputValues: ["123"], expectedOutput: "6", description: "Sum digits" }], type: 'code', recommendedRank: 'SS' },
  { title: "Минимальный Элемент", description: "Найдите минимум в списке.", difficulty: 'medium', reward: { xp: 120, coins: 60 }, initialCode: "def find_min(l):\n    pass", testCases: [{ inputValues: ["5 2 8"], expectedOutput: "2", description: "Min check" }], type: 'code', recommendedRank: 'SS' },

  
  { title: "Сортировка Пузырьком", description: "Реализуйте Bubble Sort.", difficulty: 'hard', reward: { xp: 250, coins: 125 }, initialCode: "def bubble(l):\n    pass", testCases: [{ inputValues: ["3 1 2"], expectedOutput: "[1, 2, 3]", description: "Bubble" }], type: 'code', recommendedRank: 'SS+' },
  { title: "Анаграммы", description: "Проверьте, являются ли две строки анаграммами.", difficulty: 'hard', reward: { xp: 250, coins: 125 }, initialCode: "def is_ana(s1, s2):\n    pass", testCases: [{ inputValues: ["listen silent"], expectedOutput: "True", description: "Anagram" }], type: 'code', recommendedRank: 'SSS' },
  { title: "Двоичный Поиск", description: "Реализуйте binary search для таргета x.", difficulty: 'hard', reward: { xp: 250, coins: 125 }, initialCode: "def bin_search(l, x):\n    pass", testCases: [{ inputValues: ["1 2 3 4 5 3"], expectedOutput: "2", description: "Binary" }], type: 'code', recommendedRank: 'SSS+' },
  { title: "Простые Числа", description: "Верните True, если n - простое.", difficulty: 'hard', reward: { xp: 250, coins: 125 }, initialCode: "def is_prime(n):\n    pass", testCases: [{ inputValues: ["7"], expectedOutput: "True", description: "Prime" }, { inputValues: ["4"], expectedOutput: "False", description: "Not prime" }], type: 'code', recommendedRank: 'GOD' },
  { title: "Сжатие Кода", description: "Реализуйте простое сжатие: aaabb -> a3b2.", difficulty: 'hard', reward: { xp: 300, coins: 150 }, initialCode: "def compress(s):\n    pass", testCases: [{ inputValues: ["aaabb"], expectedOutput: "a3b2", description: "Compression" }], type: 'code', recommendedRank: 'ETERNAL' },
];

export const AIQuestService = {
  getTodayDateStr: () => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  },

  getDailyQuests: async (): Promise<AIQuest[]> => {
    try {
      const dateStr = AIQuestService.getTodayDateStr();
      const q = query(collection(db, 'ai_quests'), where('dateStr', '==', dateStr));
      const snap = await getDocs(q);

      let quests: AIQuest[] = [];
      if (!snap.empty) {
        quests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIQuest));
      }

      
      if (quests.length < 5) {
        const remaining = 10 - quests.length;
        const backupPool = AIQuestService.getSeededBackupQuests(dateStr, remaining);
        quests = [...quests, ...backupPool];
      }

      return quests;
    } catch (error) {
      console.error('Error in getDailyQuests:', error);
      
      return AIQuestService.getSeededBackupQuests(AIQuestService.getTodayDateStr(), 10);
    }
  },

  getSeededBackupQuests: (dateStr: string, count: number): AIQuest[] => {
    
    const seed = dateStr.split('-').reduce((acc, val) => acc + parseInt(val), 0);
    const result: AIQuest[] = [];
    
    for (let i = 0; i < count; i++) {
      const index = (seed + i) % BACKUP_QUESTS.length;
      result.push({
        id: `backup_${dateStr}_${i}`,
        ...BACKUP_QUESTS[index],
        createdAt: null,
        dateStr
      } as AIQuest);
    }
    return result;
  },

  generateDailyQuests: async (): Promise<AIQuest[]> => {
    try {
      const response = await fetch('/api/admin/generate-daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to generate daily quests from proxy');
      
      const generatedData = await response.json();
      const dateStr = AIQuestService.getTodayDateStr();
      
      const newQuests: AIQuest[] = [];
      const questsRef = collection(db, 'ai_quests');
      
      for (const q of generatedData) {
        const questRef = doc(questsRef);
        const questObj: AIQuest = {
          id: questRef.id,
          ...q,
          createdAt: serverTimestamp(),
          dateStr
        };
        await setDoc(questRef, questObj);
        newQuests.push(questObj);
      }

      return newQuests;

    } catch (error) {
      console.error('Failed to generate AI quests:', error);
      return AIQuestService.getDailyQuests(); 
    }
  }
};
