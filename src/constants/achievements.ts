import { Trophy, Star, Target, Zap, Shield, Flame, Heart, Crown, Rocket, Ghost, BookOpen, Terminal, Code2, Users, ShoppingBag, Coins, Swords } from 'lucide-react';

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  tier: AchievementTier;
  requirementType: 'lessons' | 'level' | 'coins' | 'boss_damage' | 'duels_won' | 'items_owned' | 'social';
  requirementValue: number;
  reward: { xp: number, coins: number, sp?: number };
}

export const ACHIEVEMENTS: Achievement[] = [
  
  { id: 'prog_1', name: 'Новичок Кода', description: 'Завершите 5 уроков.', icon: BookOpen, tier: 'BRONZE', requirementType: 'lessons', requirementValue: 5, reward: { xp: 100, coins: 100 } },
  { id: 'prog_2', name: 'Кодер-Подмастерье', description: 'Завершите 20 уроков.', icon: Code2, tier: 'SILVER', requirementType: 'lessons', requirementValue: 20, reward: { xp: 500, coins: 500 } },
  { id: 'prog_3', name: 'Мастер Алгоритмов', description: 'Завершите 50 уроков.', icon: Terminal, tier: 'GOLD', requirementType: 'lessons', requirementValue: 50, reward: { xp: 1500, coins: 1500, sp: 5 } },
  
  
  { id: 'lvl_1', name: 'Прорыв', description: 'Достигните 10 уровня.', icon: Rocket, tier: 'BRONZE', requirementType: 'level', requirementValue: 10, reward: { xp: 200, coins: 200 } },
  { id: 'lvl_2', name: 'Ветеран Опыта', description: 'Достигните 50 уровня.', icon: Star, tier: 'GOLD', requirementType: 'level', requirementValue: 50, reward: { xp: 2000, coins: 2000, sp: 10 } },
  { id: 'lvl_3', name: 'Легендарное Восхождение', description: 'Достигните 100 уровня.', icon: Crown, tier: 'DIAMOND', requirementType: 'level', requirementValue: 100, reward: { xp: 10000, coins: 10000, sp: 50 } },

  
  { id: 'coin_1', name: 'Первый Капитал', description: 'Соберите 1000 монет.', icon: Coins, tier: 'BRONZE', requirementType: 'coins', requirementValue: 1000, reward: { xp: 100, coins: 200 } },
  { id: 'coin_2', name: 'Магнат Питона', description: 'Соберите 50000 монет.', icon: ShoppingBag, tier: 'GOLD', requirementType: 'coins', requirementValue: 50000, reward: { xp: 1000, coins: 5000 } },

  
  { id: 'boss_1', name: 'Первая Кровь', description: 'Нанесите 1000 урона глобальным боссам.', icon: Swords, tier: 'BRONZE', requirementType: 'boss_damage', requirementValue: 1000, reward: { xp: 300, coins: 300 } },
  { id: 'boss_2', name: 'Разрушитель Систем', description: 'Нанесите 100000 урона боссам.', icon: Flame, tier: 'PLATINUM', requirementType: 'boss_damage', requirementValue: 100000, reward: { xp: 5000, coins: 5000, sp: 20 } },

  
  { id: 'duel_1', name: 'Дуэлянт', description: 'Выиграйте 5 дуэлей.', icon: Target, tier: 'BRONZE', requirementType: 'duels_won', requirementValue: 5, reward: { xp: 200, coins: 200 } },
  { id: 'duel_2', name: 'Непобедимый', description: 'Выиграйте 50 дуэлей.', icon: Shield, tier: 'GOLD', requirementType: 'duels_won', requirementValue: 50, reward: { xp: 3000, coins: 3000, sp: 15 } },

  
  { id: 'item_1', name: 'Коллекционер', description: 'Соберите 10 предметов в инвентаре.', icon: ShoppingBag, tier: 'BRONZE', requirementType: 'items_owned', requirementValue: 10, reward: { xp: 150, coins: 150 } },
  { id: 'item_2', name: 'Музейный Хранитель', description: 'Соберите 50 предметов.', icon: Ghost, tier: 'PLATINUM', requirementType: 'items_owned', requirementValue: 50, reward: { xp: 2000, coins: 2000, sp: 10 } }
];
