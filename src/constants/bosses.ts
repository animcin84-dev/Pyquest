export interface BossTemplate {
  id: string;
  name: string;
  maxHp: number;
  description: string;
  xpReward: number;
  coinReward: number;
  image: string;
}

export const BOSS_TEMPLATES: BossTemplate[] = [
  
  { id: 'legacy_boss', name: 'Древний Легаси Код', maxHp: 100000, description: 'Ужасающий спагетти-код из прошлого века.', xpReward: 1000, coinReward: 500, image: '👾' },
  { id: 'mega_bug', name: 'Король Сегфолтов', maxHp: 150000, description: 'Ошибка доступа к памяти, поглощающая все на своем пути.', xpReward: 1200, coinReward: 600, image: '🐜' },
  { id: 'callback_hell', name: 'Зацикленный Коллбэк', maxHp: 200000, description: 'Бесконечная вложенность, из которой нет выхода.', xpReward: 1500, coinReward: 750, image: '🌀' },
  { id: 'memory_leak', name: 'Утечка Памяти', maxHp: 300000, description: 'Тихий убийца ресурсов сервера.', xpReward: 2000, coinReward: 1000, image: '💧' },
  { id: 'omega_ai', name: 'AI Галюцинация', maxHp: 500000, description: 'Искусственный интеллект, сошедший с ума.', xpReward: 3000, coinReward: 1500, image: '🧠' },

  
  { id: 'merge_conflict', name: 'Великий Конфликт Слияния', maxHp: 250000, description: '<<<<<<< HEAD vs EVERYONE', xpReward: 1800, coinReward: 900, image: '⚔️' },
  { id: 'null_pointer', name: 'Пустой Указатель', maxHp: 120000, description: 'Он есть, но его нет.', xpReward: 1100, coinReward: 550, image: '⭕' },
  { id: 'infinite_loop', name: 'Вечный Цикл while(true)', maxHp: 400000, description: 'Время для него остановилось.', xpReward: 2500, coinReward: 1250, image: '♾️' },
  { id: 'ddos_hydra', name: 'Двуглавая Гидра Трафика', maxHp: 600000, description: 'Одна голова падает, две новые атакуют порт.', xpReward: 4000, coinReward: 2000, image: '🐉' },
  { id: 'syntax_error', name: 'Верховная Синтаксическая Ошибка', maxHp: 80000, description: 'Всего одна точка с запятой может разрушить мир.', xpReward: 800, coinReward: 400, image: '❌' },
  { id: 'spaghetti_monster', name: 'Макаронный Код-Монстр', maxHp: 350000, description: 'Его логика запутана до безумия.', xpReward: 2200, coinReward: 1100, image: '🍝' },
  { id: 'zombie_process', name: 'Процесс-Зомби', maxHp: 180000, description: 'Он умер, но все еще занимает таблицу процессов.', xpReward: 1400, coinReward: 700, image: '🧟' },
  { id: 'floating_point', name: 'Неточная Плавающая Запятая', maxHp: 220000, description: '0.1 + 0.2 != 0.3. Это хаос.', xpReward: 1600, coinReward: 800, image: '📏' },
  { id: 'deadlock', name: 'Взаимная Блокировка', maxHp: 280000, description: 'Никто не сдвинется с места первым.', xpReward: 1900, coinReward: 950, image: '🔒' },
  { id: 'regex_demon', name: 'Демон Регулярных Выражений', maxHp: 450000, description: 'Он читает ваши мысли и парсит их за O(n!).', xpReward: 2800, coinReward: 1400, image: '👹' },
  { id: 'unhandled_rejection', name: 'Необработанный Промис', maxHp: 160000, description: 'Обещание, которое было разбито.', xpReward: 1300, coinReward: 650, image: '💔' },
  { id: 'undefined_king', name: 'Король Undefined', maxHp: 550000, description: 'Он правит царством пустоты.', xpReward: 3500, coinReward: 1750, image: '👑' },
  { id: 'cors_wall', name: 'Стена CORS', maxHp: 320000, description: 'Доступ закрыт с вашего домена. И с любого другого тоже.', xpReward: 2100, coinReward: 1050, image: '🧱' },
  { id: 'docker_nightmare', name: 'Кошмар Докера', maxHp: 420000, description: 'Контейнер запустился, но внутри - пустота.', xpReward: 2600, coinReward: 1300, image: '📦' },
  { id: 'db_deadlock', name: 'Паралич Базы Данных', maxHp: 700000, description: 'Транзакции застыли навечно.', xpReward: 5000, coinReward: 2500, image: '🗄️' }
];
