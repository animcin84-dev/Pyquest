import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Star, Zap, Shield, Heart, Coins, CheckCircle2, Users, Tag, Trash2, Plus, 
  ArrowRightLeft, Apple, Coffee, Pizza, Utensils, Mouse, Trophy, Book, Bug, ShieldCheck, 
  Gem, Ghost, Flame, Wind, Droplets, Target, Cpu, Gift, Brain, Swords, Package, 
  BrainCircuit, TerminalSquare, FileText, Globe, Gamepad2, Sparkles, Skull, Rocket, 
  MessageCircle, Clock, Home as HomeIcon, Lock as LockIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { TextReveal } from '../components/TextReveal';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  color: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'xp_boost_1',
    name: 'XP Буст (1ч)',
    description: 'Удваивает получаемый опыт в течение одного часа.',
    price: 500,
    icon: <Zap className="w-6 h-6" />,
    color: 'from-yellow-400 to-orange-500'
  },
  {
    id: 'shield_1',
    name: 'Защита серии',
    description: 'Сохраняет вашу серию заходов, если вы пропустили день.',
    price: 300,
    icon: <Shield className="w-6 h-6" />,
    color: 'from-blue-400 to-indigo-500'
  },
  {
    id: 'extra_life_1',
    name: 'Дополнительная жизнь',
    description: 'Дает еще одну попытку в сложных испытаниях.',
    price: 200,
    icon: <Heart className="w-6 h-6" />,
    color: 'from-red-400 to-pink-500'
  },
  {
    id: 'premium_avatar_1',
    name: 'Золотая рамка',
    description: 'Эксклюзивная рамка для вашего аватара в профиле.',
    price: 1000,
    icon: <Star className="w-6 h-6" />,
    color: 'from-amber-300 to-yellow-600'
  }
];

export const ALL_ITEMS: ShopItem[] = [
  ...SHOP_ITEMS,
  { id: 'xp_boost_2', name: 'XP Буст (2ч)', description: 'Удваивает получаемый опыт в течение двух часов.', price: 800, icon: <Zap className="w-6 h-6" />, color: 'from-yellow-400 to-orange-500' },
  { id: 'shield_2', name: 'Супер Защита', description: 'Сохраняет вашу серию заходов на 3 дня.', price: 600, icon: <Shield className="w-6 h-6" />, color: 'from-blue-400 to-indigo-500' },
  { id: 'extra_life_2', name: 'Жизнь x2', description: 'Дает две попытки в сложных испытаниях.', price: 350, icon: <Heart className="w-6 h-6" />, color: 'from-red-400 to-pink-500' },
  { id: 'premium_avatar_2', name: 'Серебряная рамка', description: 'Стильная серебряная рамка для аватара.', price: 700, icon: <Star className="w-6 h-6" />, color: 'from-gray-300 to-gray-500' },
  
  
  { id: 'apple_red', name: 'Красное Яблоко', description: 'Дает +5 к Логике вашего питомца.', price: 150, icon: <Apple className="w-6 h-6" />, color: 'from-red-500 to-red-700' },
  { id: 'coffee_cup', name: 'Крепкий Кофе', description: 'Дает +5 к Скорости вашего питомца.', price: 150, icon: <Coffee className="w-6 h-6" />, color: 'from-brown-500 to-amber-900' },
  { id: 'burger_king', name: 'Мега Бургер', description: 'Дает +5 к Силе вашего питомца.', price: 200, icon: <Utensils className="w-6 h-6" />, color: 'from-orange-400 to-red-600' },
  { id: 'pizza_slice', name: 'Пицца "Кодер"', description: 'Дает +2 к Логике и +3 к Силе.', price: 180, icon: <Pizza className="w-6 h-6" />, color: 'from-yellow-400 to-red-500' },
  { id: 'energy_drink', name: 'Энергетик', description: 'Дает +8 к Скорости вашего питомца.', price: 250, icon: <Zap className="w-6 h-6" />, color: 'from-blue-400 to-cyan-500' },
  { id: 'brain_boost', name: 'Нейро-Стимулятор', description: 'Дает +8 к Интеллекту вашего питомца.', price: 300, icon: <Cpu className="w-6 h-6" />, color: 'from-purple-400 to-indigo-600' },
  { id: 'golden_apple', name: 'Золотое Яблоко', description: 'Дает +20 ко всем статам питомца.', price: 2000, icon: <Apple className="w-6 h-6" />, color: 'from-yellow-300 to-yellow-600' },
  { id: 'bit_bot_food', name: '🤖 Бит-Бот корм', description: 'Специальный корм для Бит-Бота. Дает +10 к случайному стату питомца.', price: 350, icon: <Cpu className="w-6 h-6" />, color: 'from-cyan-500 to-blue-700', rarity: 'rare' as const },

  
  { id: 'logic_booster', name: 'Логик-Бустер', description: 'Постоянно увеличивает Логику на 5.', price: 1500, icon: <Brain className="w-6 h-6" />, color: 'from-indigo-400 to-purple-600' },
  { id: 'speed_serum', name: 'Сыворотка Скорости', description: 'Постоянно увеличивает Скорость на 5.', price: 1500, icon: <Zap className="w-6 h-6" />, color: 'from-yellow-400 to-orange-600' },
  { id: 'power_gloves', name: 'Перчатки Силы', description: 'Постоянно увеличивают Силу на 5.', price: 1500, icon: <Swords className="w-6 h-6" />, color: 'from-red-400 to-pink-600' },
  { id: 'intellect_chip', name: 'Чип Интеллекта', description: 'Постоянно увеличивает Интеллект на 5.', price: 1500, icon: <Star className="w-6 h-6" />, color: 'from-blue-400 to-cyan-600' },
  { id: 'stamina_drink', name: 'Напиток Выносливости', description: 'Постоянно увеличивает Выносливость на 5.', price: 1500, icon: <Heart className="w-6 h-6" />, color: 'from-green-400 to-emerald-600' },
  { id: 'data_crystal', name: 'Кристалл Данных', description: 'Мгновенно дает 100 XP вашему герою.', price: 400, icon: <Gem className="w-6 h-6" />, color: 'from-cyan-300 to-blue-500' },
  { id: 'lucky_coin', name: 'Счастливая Монета', description: 'Увеличивает награду за уроки на 10%.', price: 1200, icon: <Coins className="w-6 h-6" />, color: 'from-yellow-300 to-yellow-600' },
  { id: 'debug_tool', name: 'Дебаггер', description: 'Позволяет пропустить одну ошибку в песочнице.', price: 500, icon: <Bug className="w-6 h-6" />, color: 'from-green-400 to-emerald-600' },
  { id: 'firewall_v1', name: 'Файервол v1', description: 'Защищает от потери XP при проигрыше в дуэли.', price: 450, icon: <ShieldCheck className="w-6 h-6" />, color: 'from-orange-500 to-red-600' },
  { id: 'mystery_box', name: 'Таинственный Ящик', description: 'Содержит случайный предмет или монеты.', price: 800, icon: <Package className="w-6 h-6" />, color: 'from-purple-500 to-pink-600' },
  { id: 'nano_bot', name: 'Нано-Бот', description: 'Автоматически исправляет мелкие ошибки в коде.', price: 2500, icon: <Cpu className="w-6 h-6" />, color: 'from-blue-400 to-indigo-600' },
  { id: 'quantum_core', name: 'Квантовое Ядро', description: 'Увеличивает все статы на 10.', price: 5000, icon: <Zap className="w-6 h-6" />, color: 'from-cyan-400 to-blue-600' },
  { id: 'neural_link', name: 'Нейро-Связь', description: 'Позволяет питомцу помогать вам в решении задач.', price: 3000, icon: <BrainCircuit className="w-6 h-6" />, color: 'from-purple-400 to-pink-600' },
  { id: 'coding_manual', name: 'Справочник Python', description: 'Дает 50 XP и полезный совет.', price: 150, icon: <Book className="w-6 h-6" />, color: 'from-blue-500 to-indigo-700' },

  
  { id: 'scroll_logic', name: 'Свиток Логики', description: 'Древний свиток, дающий +10 к Логике.', price: 2500, icon: <Book className="w-6 h-6" />, color: 'from-blue-600 to-indigo-900' },
  { id: 'scroll_speed', name: 'Свиток Скорости', description: 'Древний свиток, дающий +10 к Скорости.', price: 2500, icon: <Zap className="w-6 h-6" />, color: 'from-yellow-500 to-orange-700' },
  { id: 'scroll_power', name: 'Свиток Силы', description: 'Древний свиток, дающий +10 к Силе.', price: 2500, icon: <Swords className="w-6 h-6" />, color: 'from-red-600 to-rose-900' },
  { id: 'scroll_intellect', name: 'Свиток Интеллекта', description: 'Древний свиток, дающий +10 к Интеллекту.', price: 2500, icon: <Brain className="w-6 h-6" />, color: 'from-purple-600 to-violet-900' },
  { id: 'scroll_stamina', name: 'Свиток Выносливости', description: 'Древний свиток, дающий +10 к Выносливости.', price: 2500, icon: <Heart className="w-6 h-6" />, color: 'from-green-600 to-emerald-900' },
  { id: 'ancient_scroll', name: 'Древний Манускрипт', description: 'Дает +5 ко всем характеристикам героя.', price: 4500, icon: <Star className="w-6 h-6" />, color: 'from-amber-400 to-yellow-800' },

  
  { id: 'code_breaker', name: 'Взломщик Кода', description: 'Меч, дающий +15 к Силе и +5 к Скорости.', price: 3500, icon: <Swords className="w-6 h-6" />, color: 'from-cyan-500 to-blue-800' },
  { id: 'logic_staff', name: 'Посох Логики', description: 'Посох, дающий +15 к Логике и +5 к Интеллекту.', price: 3500, icon: <Target className="w-6 h-6" />, color: 'from-indigo-500 to-purple-800' },
  { id: 'binary_dagger', name: 'Бинарный Кинжал', description: 'Кинжал, дающий +10 к Скорости и +5 к Силе.', price: 2800, icon: <Swords className="w-6 h-6" />, color: 'from-gray-600 to-black' },
  { id: 'compiler_shield', name: 'Щит Компилятора', description: 'Щит, дающий +20 к Выносливости и +5 к Силе.', price: 3200, icon: <ShieldCheck className="w-6 h-6" />, color: 'from-emerald-500 to-green-800' },
  { id: 'neural_bow', name: 'Нейронный Лук', description: 'Лук, дающий +15 к Интеллекту и +5 к Скорости.', price: 3400, icon: <Target className="w-6 h-6" />, color: 'from-pink-500 to-rose-800' },
  { id: 'data_scythe', name: 'Коса Данных', description: 'Коса, дающая +10 к Силе и +10 к Логике.', price: 3800, icon: <Flame className="w-6 h-6" />, color: 'from-red-700 to-orange-900' },

  
  { id: 'pet_toy_mouse', name: 'Мышка-Игрушка', description: 'Дает +2 XP вашему питомцу.', price: 100, icon: <Mouse className="w-6 h-6" />, color: 'from-gray-400 to-gray-600' },
  { id: 'pet_toy_ball', name: 'Пиксельный Мяч', description: 'Дает +2 XP вашему питомцу.', price: 100, icon: <Target className="w-6 h-6" />, color: 'from-pink-400 to-rose-600' },

  
  { id: 'neon_sword', name: 'Неоновый Меч', description: 'Редкий косметический предмет для профиля.', price: 2500, icon: <Flame className="w-6 h-6" />, color: 'from-red-500 to-purple-600' },
  { id: 'void_essence', name: 'Эссенция Пустоты', description: 'Легендарный эффект для вашего аватара.', price: 5000, icon: <Ghost className="w-6 h-6" />, color: 'from-indigo-900 to-black' },
  { id: 'wind_boots', name: 'Сапоги Ветра', description: 'Ускоряет анимации в интерфейсе.', price: 1500, icon: <Wind className="w-6 h-6" />, color: 'from-blue-300 to-blue-500' },
  { id: 'aqua_shell', name: 'Водный Щит', description: 'Красивый эффект вокруг аватара.', price: 1800, icon: <Droplets className="w-6 h-6" />, color: 'from-blue-400 to-cyan-600' },
  { id: 'gift_box', name: 'Подарочный Набор', description: 'Содержит случайный косметический предмет.', price: 3000, icon: <Gift className="w-5 h-5" />, color: 'from-purple-500 to-pink-600' },

  
  
  
  { id: 'os_module', name: 'Модуль OS', description: 'Дает власть над системными путями. +5 к Логике.', price: 600, icon: <Cpu className="w-6 h-6" />, color: 'from-gray-500 to-gray-700' },
  { id: 'sys_module', name: 'Модуль SYS', description: 'Доступ к аргументам командной строки. +5 к Скорости.', price: 600, icon: <TerminalSquare className="w-6 h-6" />, color: 'from-blue-500 to-indigo-700' },
  { id: 'json_scroll', name: 'Свиток JSON', description: 'Мастерство сериализации. +5 к Интеллекту.', price: 600, icon: <FileText className="w-6 h-6" />, color: 'from-yellow-500 to-orange-700' },
  { id: 'math_tome', name: 'Том Математики', description: 'Сложные вычисления. +10 к Логике.', price: 1200, icon: <Book className="w-6 h-6" />, color: 'from-purple-500 to-indigo-800' },
  { id: 'requests_cloak', name: 'Плащ Requests', description: 'Связь с внешним миром. +5 к Выносливости.', price: 800, icon: <Globe className="w-6 h-6" />, color: 'from-cyan-400 to-blue-600' },
  { id: 'pygame_controller', name: 'Контроллер Pygame', description: 'Радость разработки игр. +5 к Скорости.', price: 900, icon: <Gamepad2 className="w-6 h-6" />, color: 'from-green-400 to-emerald-600' },
  { id: 'sqlite_vault', name: 'Хранилище SQLite', description: 'Локальная база данных. +15 к Инвентарю (визуально).', price: 1500, icon: <Package className="w-6 h-6" />, color: 'from-amber-400 to-orange-600' },
  { id: 'pandas_shield', name: 'Щит Pandas', description: 'Мощь анализа данных. +15 к Выносливости.', price: 1800, icon: <ShieldCheck className="w-6 h-6" />, color: 'from-blue-500 to-cyan-500' },
  { id: 'numpy_array', name: 'Массив NumPy', description: 'Эффективные вычисления. +10 к Силе.', price: 1300, icon: <Target className="w-6 h-6" />, color: 'from-indigo-400 to-blue-600' },
  { id: 'matplotlib_brush', name: 'Кисть Matplotlib', description: 'Визуализация данных. +5 к Интеллекту.', price: 1100, icon: <Sparkles className="w-6 h-6" />, color: 'from-pink-400 to-rose-600' },

  
  { id: 'optic_cable', name: 'Оптический Кабель', description: 'Скорость света. +8 к Скорости.', price: 1200, icon: <Zap className="w-6 h-6" />, color: 'from-blue-300 to-cyan-400' },
  { id: 'neural_uprising', name: 'Восстание Нейронов', description: 'Критический буст Интеллекта (+12).', price: 2200, icon: <BrainCircuit className="w-6 h-6" />, color: 'from-purple-600 to-pink-600' },
  { id: 'glitch_dagger', name: 'Кинжал Глича', description: 'Прошивает любую защиту. +12 к Силе.', price: 2100, icon: <Swords className="w-6 h-6" />, color: 'from-red-500 to-black' },
  { id: 'titanium_server', name: 'Титановый Сервер', description: 'Безотказная работа. +20 к Выносливости.', price: 2800, icon: <Shield className="w-6 h-6" />, color: 'from-gray-300 to-gray-500' },
  { id: 'logic_gate_key', name: 'Ключ Логики', description: 'Открывает доступ к скрытым путям. +10 к Логике.', price: 1600, icon: <Target className="w-6 h-6" />, color: 'from-amber-400 to-yellow-600' },
  { id: 'proxy_mask', name: 'Прокси-Маска', description: 'Анонимность и скрытность. +5 к Скорости.', price: 1100, icon: <Ghost className="w-6 h-6" />, color: 'from-indigo-900 to-purple-900' },
  { id: 'ram_cartridge', name: 'Картридж RAM', description: 'Мгновенная память. +10 к Интеллекту.', price: 1700, icon: <Package className="w-6 h-6" />, color: 'from-emerald-400 to-teal-600' },
  { id: 'ssd_overdrive', name: 'SSD Овердрайв', description: 'Никаких задержек! +15 к Скорости.', price: 2500, icon: <Zap className="w-6 h-6" />, color: 'from-orange-400 to-red-500' },
  { id: 'silicon_heart', name: 'Кремниевое Сердце', description: 'Жизнь без багов. +15 к Выносливости.', price: 2300, icon: <Heart className="w-6 h-6" />, color: 'from-rose-400 to-red-600' },
  { id: 'motherboard_chestplate', name: 'Кираса Материнки', description: 'Основа всей системы. +25 к Силе.', price: 3500, icon: <ShieldCheck className="w-6 h-6" />, color: 'from-green-500 to-emerald-900' },

  
  { id: 'python_fang', name: 'Клык Питона', description: 'Ядовитый урон. +18 к Силе.', price: 3200, icon: <Swords className="w-6 h-6" />, color: 'from-emerald-600 to-green-900' },
  { id: 'recursive_ring', name: 'Кольцо Рекурсии', description: 'Бесконечный цикл силы. +10 ко всем статам.', price: 4800, icon: <Target className="w-6 h-6" />, color: 'from-blue-600 to-purple-800' },
  { id: 'stack_overflow_staff', name: 'Посох Переполнения', description: 'Магия, которую не сдержать. +25 к Интеллекту.', price: 4200, icon: <Zap className="w-6 h-6" />, color: 'from-orange-500 to-red-700' },
  { id: 'heap_memory_bottle', name: 'Бутыль Кучи', description: 'Много временной силы. +5 XP навсегда.', price: 800, icon: <Droplets className="w-6 h-6" />, color: 'from-blue-400 to-indigo-500' },
  { id: 'zen_mantle', name: 'Мантия Дзен', description: 'Красивое лучше, чем уродливое. +15 к Логике.', price: 2900, icon: <Wind className="w-6 h-6" />, color: 'from-white to-gray-400' },
  { id: 'guido_wisdom', name: 'Мудрость Гвидо', description: 'Легендарные знания. Мгновенно +1 уровень.', price: 7500, icon: <Star className="w-6 h-6" />, color: 'from-yellow-400 to-amber-600' },
  { id: 'pep8_shrine', name: 'Святыня PEP 8', description: 'Чистота кода - залог успеха. +20 к Логике.', price: 3600, icon: <ShieldCheck className="w-6 h-6" />, color: 'from-blue-300 to-blue-600' },
  { id: 'tuple_boots', name: 'Сапоги Тюпла', description: 'Неизменная скорость. +12 к Скорости.', price: 2200, icon: <Wind className="w-6 h-6" />, color: 'from-indigo-400 to-blue-800' },
  { id: 'dictionary_necklace', name: 'Ожерелье Словаря', description: 'Быстрый поиск ответов. +15 к Интеллекту.', price: 3100, icon: <Book className="w-6 h-6" />, color: 'from-orange-300 to-amber-700' },
  { id: 'exception_shield', name: 'Щит Исключений', description: 'Обработка любых атак. +30 к Выносливости.', price: 5500, icon: <ShieldCheck className="w-6 h-6" />, color: 'from-red-500 to-rose-900' },

  
  { id: 'pet_house_deluxe', name: 'Люкс-Домик', description: 'Питомец отдыхает с комфортом. +5 XP питомцу/час.', price: 2500, icon: <Package className="w-6 h-6" />, color: 'from-indigo-500 to-blue-700' },
  { id: 'pet_diamond_collar', name: 'Алмазный Ошейник', description: 'Статус вашего спутника. +10 к его Красоте.', price: 1500, icon: <Star className="w-6 h-6" />, color: 'from-cyan-300 to-blue-500' },
  { id: 'pet_laser_pointer', name: 'Лазерная Указка', description: 'Развлечение для пикселей. +10 XP питомцу.', price: 400, icon: <Target className="w-6 h-6" />, color: 'from-red-400 to-red-600' },
  { id: 'pet_organic_treats', name: 'Органик-Лакомства', description: 'Здоровая еда. +5 ко всем статам питомца.', price: 300, icon: <Apple className="w-6 h-6" />, color: 'from-green-400 to-emerald-600' },
  { id: 'pet_vr_headset', name: 'VR-Шлем для пета', description: 'Тренировки в виртуальности. +15 XP питомцу.', price: 900, icon: <Skull className="w-6 h-6" />, color: 'from-indigo-600 to-purple-800' },
  { id: 'pet_rocket_boots', name: 'Ракетные сапожки', description: 'Полет нормальный! +15 к Скорости питомца.', price: 2200, icon: <Rocket className="w-6 h-6" />, color: 'from-orange-500 to-red-600' },
  { id: 'pet_mystery_egg', name: 'Таинственное Яйцо', description: 'Кто же из него вылупится?', price: 4500, icon: <Package className="w-6 h-6" />, color: 'from-purple-400 to-pink-600' },
  { id: 'pet_crown', name: 'Корона Питона', description: 'Для настоящего короля сервера. +50 к ЧСВ.', price: 10000, icon: <Trophy className="w-6 h-6" />, color: 'from-yellow-300 to-yellow-600' },
  { id: 'pet_cape_invisibility', name: 'Плащ-невидимка', description: 'Скрывает питомца (шутка). +10 к Логике.', price: 1800, icon: <Ghost className="w-6 h-6" />, color: 'from-blue-900 to-indigo-950' },
  { id: 'pet_translator', name: 'Переводчик "Гав-в-Код"', description: 'Понимайте своего друга лучше. +15 к Интеллекту.', price: 2600, icon: <MessageCircle className="w-6 h-6" />, color: 'from-white to-blue-200' },

  
  { id: 'lambda_lance', name: 'Лямбда-Копье', description: 'Анонимная мощь в одной строке. +35 к Силе.', price: 6500, icon: <Swords className="w-6 h-6" />, color: 'from-orange-400 to-red-800' },
  { id: 'async_clock', name: 'Асинхронные Часы', description: 'Управление временем выполнения. +25 к Скорости.', price: 5800, icon: <Clock className="w-6 h-6" />, color: 'from-cyan-400 to-blue-600' },
  { id: 'decorators_hat', name: 'Шляпа Декоратора', description: 'Добавьте функциональности стильно. +20 к Логике.', price: 4200, icon: <Package className="w-6 h-6" />, color: 'from-purple-500 to-indigo-700' },
  { id: 'generator_well', name: 'Колодец Генераторов', description: 'Бесконечный поток ресурсов. +50 монет в день.', price: 8500, icon: <Droplets className="w-6 h-6" />, color: 'from-green-500 to-teal-700' },
  { id: 'comprehension_eye', name: 'Око Списков', description: 'Видит структуру данных насквозь. +25 к Интеллекту.', price: 6200, icon: <Target className="w-6 h-6" />, color: 'from-blue-500 to-indigo-900' },
  { id: 'inheritance_shield', name: 'Щит Наследования', description: 'Защита предков. +40 к Выносливости.', price: 7200, icon: <ShieldCheck className="w-6 h-6" />, color: 'from-amber-600 to-orange-900' },
  { id: 'abstraction_orb', name: 'Сфера Абстракции', description: 'Скрывает детали, оставляя суть. +30 к Логике.', price: 8000, icon: <Zap className="w-6 h-6" />, color: 'from-gray-200 to-gray-500' },
  { id: 'polymorphism_staff', name: 'Посох Полиморфизма', description: 'Принимает любую форму. +15 ко всем статам.', price: 9500, icon: <Wind className="w-6 h-6" />, color: 'from-pink-500 to-indigo-600' },
  { id: 'encapsulation_box', name: 'Ящик Инкапсуляции', description: 'Надежно хранит ваши секреты. +10 к Защите.', price: 3400, icon: <LockIcon className="w-6 h-6" />, color: 'from-gray-700 to-black' },
  { id: 'pip_container', name: 'Контейнер PIP', description: 'Установка любых зависимостей. +20 к Силе.', price: 4500, icon: <Package className="w-6 h-6" />, color: 'from-blue-400 to-blue-700' },
  { id: 'virtual_env_tent', name: 'Палатка Virtualenv', description: 'Чистое пространство для работы. +15 к Выносливости.', price: 3100, icon: <HomeIcon className="w-6 h-6" />, color: 'from-emerald-400 to-green-600' },
  { id: 'git_hook', name: 'Крюк Git', description: 'Цепляется за каждый коммит. +10 к Скорости.', price: 2400, icon: <Swords className="w-6 h-6" />, color: 'from-orange-600 to-red-900' },
  { id: 'docker_whale', name: 'Кит Docker', description: 'Упакует что угодно. +50 к грузоподъемности (визуально).', price: 9000, icon: <Droplets className="w-6 h-6" />, color: 'from-blue-400 to-cyan-800' },
  { id: 'k8s_helm', name: 'Шлем Кубернетиса', description: 'Управление целым кластером. +40 к Логике.', price: 12000, icon: <ShieldCheck className="w-6 h-6" />, color: 'from-indigo-500 to-blue-600' },
  { id: 'binary_master_crown', name: 'Корона Бинарного Мастера', description: 'Вы достигли совершенства. +50 ко всем статам.', price: 25000, icon: <Trophy className="w-6 h-6" />, color: 'from-yellow-400 via-amber-200 to-yellow-600 animate-pulse' }
];


export function Shop() {
  const { userProfile, buyItem, addCoins, quickSellItem, listMarketplaceItem, buyMarketplaceItem, getMarketplaceListings, updateQuestProgress } = useAuth();
  const [activeTab, setActiveTab] = useState<'shop' | 'marketplace' | 'inventory'>('shop');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [items, setItems] = useState<ShopItem[]>(SHOP_ITEMS);
  const [refreshCount, setRefreshCount] = useState(0);
  const [marketplaceListings, setMarketplaceListings] = useState<any[]>([]);
  const [isListing, setIsListing] = useState(false);
  const [listPrice, setListPrice] = useState(100);
  const [selectedItemToList, setSelectedItemToList] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      loadMarketplace();
    }
  }, [activeTab]);

  const loadMarketplace = async () => {
    const listings = await getMarketplaceListings();
    setMarketplaceListings(listings);
  };

  const handleBuy = async (item: ShopItem) => {
    if (processingId) return;
    if (!userProfile) {
      playSound('error');
      setMessage({ text: 'Только зарегистрированные пользователи могут совершать покупки.', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setProcessingId(item.id);
    playSound('click');
    
    try {
      const success = await buyItem(item.id, item.price);
      
      if (success) {
        updateQuestProgress('buy_item');
        updateQuestProgress('spend', item.price);
        setMessage({ text: `Вы успешно купили ${item.name}!`, type: 'success' });
      } else {
        setMessage({ text: 'Недостаточно монет или предмет уже куплен.', type: 'error' });
      }
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleQuickSell = async (itemId: string) => {
    if (processingId) return;
    setProcessingId(itemId);
    try {
      const success = await quickSellItem(itemId);
      if (success) {
        setMessage({ text: 'Предмет успешно продан!', type: 'success' });
      } else {
        setMessage({ text: 'Ошибка при продаже.', type: 'error' });
      }
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleListToMarketplace = async () => {
    if (!selectedItemToList || processingId) return;
    setProcessingId('list');
    try {
      const success = await listMarketplaceItem(selectedItemToList, listPrice);
      if (success) {
        setMessage({ text: 'Предмет выставлен на рынок!', type: 'success' });
        setIsListing(false);
        setSelectedItemToList(null);
      } else {
        setMessage({ text: 'Ошибка при выставлении.', type: 'error' });
      }
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleBuyMarketplace = async (listing: any) => {
    if (processingId) return;
    if (listing.sellerId === userProfile?.uid) {
      setMessage({ text: 'Вы не можете купить свой собственный предмет!', type: 'error' });
      return;
    }
    setProcessingId(listing.id);
    try {
      const success = await buyMarketplaceItem(listing);
      if (success) {
        updateQuestProgress('buy_item');
        updateQuestProgress('spend', listing.price);
        setMessage({ text: 'Предмет куплен на рынке!', type: 'success' });
        loadMarketplace();
      } else {
        setMessage({ text: 'Недостаточно монет или предмет уже продан.', type: 'error' });
      }
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRefresh = async () => {
    if (processingId) return;
    if (!userProfile) {
      playSound('error');
      setMessage({ text: 'Только зарегистрированные пользователи могут обновлять магазин.', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const cost = refreshCount === 0 ? 0 : 50;
    if (refreshCount > 0 && (userProfile?.coins || 0) < cost) {
      setMessage({ text: 'Недостаточно монет для обновления.', type: 'error' });
      return;
    }
    
    setProcessingId('refresh');
    try {
      if (refreshCount > 0) {
        await addCoins(-cost);
      }
      
      playSound('click');
      const shuffled = [...ALL_ITEMS].sort(() => 0.5 - Math.random());
      setItems(shuffled.slice(0, 4));
      setRefreshCount(prev => prev + 1);
      setMessage({ text: refreshCount === 0 ? 'Магазин обновлен бесплатно!' : 'Магазин обновлен за 50 монет!', type: 'success' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 mb-4"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Экономика PyQuest</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight"
          >
            <TextReveal text="Торговля и" delay={0.1} /> <span className="text-yellow-500 italic serif"><TextReveal text="арсенал" delay={0.3} /></span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row justify-center items-center gap-6"
          >
            <div className="flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-2xl border border-yellow-500/30">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">{userProfile?.coins || 0}</span>
              <span className="text-yellow-500/60 text-sm font-medium ml-1">монет</span>
            </div>

            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveTab('shop')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'shop' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
              >
                Магазин
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'marketplace' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
              >
                Рынок
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'inventory' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
              >
                Инвентарь
              </button>
            </div>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl border flex items-center gap-3 shadow-2xl backdrop-blur-xl ${
                message.type === 'success' 
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                  : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'shop' && (
            <div className="space-y-12">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-yellow-500" />
                  <TextReveal text="Предметы недели" delay={0.1} />
                </h2>
                <button
                  onClick={handleRefresh}
                  disabled={!!processingId}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {processingId === 'refresh' && <div className="w-4 h-4 border-2 border-white/40 border-t-white bg-transparent rounded-full animate-spin" />}
                  {refreshCount === 0 ? 'Бесплатное обновление' : 'Обновить (50 монет)'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item, index) => {
                  const isOwned = userProfile?.inventory?.some(i => i.itemId === item.id);
                  const canAfford = (userProfile?.coins || 0) >= item.price;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="group relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all duration-500"
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-6 shadow-lg`}>
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                      <p className="text-white/40 text-sm mb-8">{item.description}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="text-lg font-bold text-white">{item.price}</span>
                        </div>
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={isOwned || !canAfford || !!processingId}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center min-w-[100px] ${
                            isOwned ? 'bg-white/5 text-white/30' : !canAfford ? 'bg-red-500/10 text-red-500/50' : 'bg-white text-black hover:bg-yellow-500 disabled:opacity-50'
                          }`}
                        >
                          {processingId === item.id ? (
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black bg-transparent rounded-full animate-spin" />
                          ) : (
                            isOwned ? 'Куплено' : 'Купить'
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="space-y-12">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-yellow-500" />
                  <TextReveal text="Рынок игроков" delay={0.1} />
                </h2>
                <button
                  onClick={loadMarketplace}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-sm font-bold transition-all"
                >
                  Обновить список
                </button>
              </div>
              
              {marketplaceListings.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <Tag className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40">На рынке пока пусто. Будьте первым, кто выставит товар!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketplaceListings.map((listing, index) => (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-yellow-500">
                          <Tag className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/40">Продавец</p>
                          <p className="text-sm font-bold text-white">{listing.sellerName}</p>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">{listing.itemName}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="text-lg font-bold text-white">{listing.price}</span>
                        </div>
                        <button
                          onClick={() => handleBuyMarketplace(listing)}
                          disabled={!!processingId}
                          className="px-4 py-2 bg-yellow-500 text-black rounded-xl text-sm font-bold hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                        >
                          {processingId === listing.id ? (
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black bg-transparent rounded-full animate-spin" />
                          ) : (
                            'Купить'
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-12">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-yellow-500" />
                <TextReveal text="Ваш инвентарь" delay={0.1} />
              </h2>
              
              {!userProfile?.inventory || userProfile.inventory.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <ShoppingBag className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40">Ваш инвентарь пуст. Время что-нибудь купить!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {userProfile.inventory.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white mb-4">
                        <Star className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-6">{item.name.toUpperCase()}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleQuickSell(item.id)}
                          disabled={!!processingId}
                          className="flex items-center justify-center gap-2 p-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          {processingId === item.id ? (
                            <div className="w-3 h-3 border-2 border-red-500/40 border-t-red-500 bg-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Продать
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItemToList(item.id);
                            setIsListing(true);
                          }}
                          className="flex items-center justify-center gap-2 p-2 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-all"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          На рынок
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {}
        <AnimatePresence>
          {isListing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
              >
                <h3 className="text-2xl font-bold text-white mb-2">
                  <TextReveal text="Выставить на рынок" delay={0.1} />
                </h3>
                <p className="text-white/40 mb-6">Укажите цену для {selectedItemToList?.replace(/_/g, ' ').toUpperCase()}</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <Coins className="w-6 h-6 text-yellow-500" />
                    <input
                      type="number"
                      value={listPrice}
                      onChange={(e) => setListPrice(parseInt(e.target.value) || 0)}
                      className="bg-transparent text-white text-2xl font-bold outline-none w-full"
                    />
                  </div>
                  <p className="text-xs text-white/20 italic">Примечание: Предмет будет удален из вашего инвентаря и станет доступен другим игрокам.</p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setIsListing(false)}
                    className="flex-1 py-3 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleListToMarketplace}
                    disabled={!!processingId}
                    className="flex-1 py-3 bg-yellow-500 text-black rounded-2xl font-bold hover:bg-yellow-400 transition-all disabled:opacity-50 flex justify-center items-center h-12"
                  >
                    {processingId === 'list' ? (
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black bg-transparent rounded-full animate-spin" />
                    ) : (
                      'Выставить'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-white/5 text-center"
        >
          <p className="text-white/40 text-sm">
            Торгуйте с умом! Цены на рынке устанавливаются игроками.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
