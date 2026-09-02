import { LucideIcon, Zap, Target, Shield, Coins, Flame, Brain, MousePointer2, Star, Rocket, Sparkles, Crown, Ghost, Calculator, Database, Terminal, Cpu, Hammer, FlaskConical, Swords, Binoculars, Compass, Map, Trophy, Gem, Gift, Heart, Eye, FastForward, Activity } from 'lucide-react';

export type PerkRank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'GOD';

export interface Perk {
  id: string;
  name: string;
  description: string;
  icon: any;
  cost: number;
  rank: PerkRank;
  requirements: { stat: string, min: number }[];
  bonus: { type: 'coins' | 'xp' | 'damage' | 'cooldown' | 'luck' | 'stat_boost', value: number, targetStat?: string };
}

export const PERKS: Perk[] = [
  
  { id: 'f_xp_1', name: 'Первые Шаги', description: '+3% XP за уроки.', icon: Star, cost: 2, rank: 'F', requirements: [], bonus: { type: 'xp', value: 0.03 } },
  { id: 'f_coins_1', name: 'Копилка', description: '+3% Монет за уроки.', icon: Coins, cost: 2, rank: 'F', requirements: [], bonus: { type: 'coins', value: 0.03 } },
  { id: 'f_luck_1', name: 'Чуйка', description: '+2% Шанс удачи.', icon: Zap, cost: 3, rank: 'F', requirements: [{ stat: 'intellect', min: 2 }], bonus: { type: 'luck', value: 0.02 } },

  
  { id: 'e_xp_1', name: 'Студент', description: '+5% XP за уроки.', icon: Brain, cost: 5, rank: 'E', requirements: [{ stat: 'intellect', min: 5 }], bonus: { type: 'xp', value: 0.05 } },
  { id: 'e_coins_1', name: 'Экономист', description: '+5% Монет.', icon: Database, cost: 5, rank: 'E', requirements: [{ stat: 'logic', min: 5 }], bonus: { type: 'coins', value: 0.05 } },
  { id: 'e_dmg_1', name: 'Новичок-Воин', description: '+5% Урона боссам.', icon: Swords, cost: 6, rank: 'E', requirements: [{ stat: 'power', min: 5 }], bonus: { type: 'damage', value: 0.05 } },

  
  { id: 'd_xp_1', name: 'Кодер', description: '+8% XP.', icon: Terminal, cost: 8, rank: 'D', requirements: [{ stat: 'intellect', min: 10 }], bonus: { type: 'xp', value: 0.08 } },
  { id: 'd_coins_1', name: 'Инвестор', description: '+8% Монет.', icon: Gem, cost: 8, rank: 'D', requirements: [{ stat: 'logic', min: 10 }], bonus: { type: 'coins', value: 0.08 } },
  { id: 'd_luck_1', name: 'Кладоискатель', description: '+5% К шансу сундука.', icon: Binoculars, cost: 10, rank: 'D', requirements: [{ stat: 'intellect', min: 12 }], bonus: { type: 'luck', value: 0.05 } },

  
  { id: 'c_xp_1', name: 'Младший Разработчик', description: '+12% XP.', icon: Cpu, cost: 12, rank: 'C', requirements: [{ stat: 'intellect', min: 15 }], bonus: { type: 'xp', value: 0.12 } },
  { id: 'c_coins_1', name: 'Финансист', description: '+12% Монет.', icon: Gift, cost: 12, rank: 'C', requirements: [{ stat: 'logic', min: 15 }], bonus: { type: 'coins', value: 0.12 } },
  { id: 'c_dmg_1', name: 'Ломатель Систем', description: '+10% Урона.', icon: Hammer, cost: 15, rank: 'C', requirements: [{ stat: 'power', min: 15 }], bonus: { type: 'damage', value: 0.10 } },
  { id: 'c_mercy_1', name: 'Второй Шанс', description: 'Защита от ошибки (Duels).', icon: Shield, cost: 15, rank: 'C', requirements: [{ stat: 'stamina', min: 15 }], bonus: { type: 'luck', value: 0.5 } },

  
  { id: 'b_xp_1', name: 'Мидл', description: '+15% XP.', icon: Rocket, cost: 20, rank: 'B', requirements: [{ stat: 'intellect', min: 25 }], bonus: { type: 'xp', value: 0.15 } },
  { id: 'b_coins_1', name: 'Бизнесмен', description: '+15% Монет.', icon: Trophy, cost: 20, rank: 'B', requirements: [{ stat: 'logic', min: 25 }], bonus: { type: 'coins', value: 0.15 } },
  { id: 'b_dmg_1', name: 'Охотник за Богами', description: '+15% Урона.', icon: Flame, cost: 25, rank: 'B', requirements: [{ stat: 'power', min: 25 }], bonus: { type: 'damage', value: 0.15 } },
  { id: 'b_luck_2', name: 'Золотой Сундук', description: '+10% К удаче.', icon: Sparkles, cost: 20, rank: 'B', requirements: [{ stat: 'intellect', min: 20 }], bonus: { type: 'luck', value: 0.10 } },

  
  { id: 'a_xp_1', name: 'Сеньор', description: '+20% XP.', icon: Target, cost: 30, rank: 'A', requirements: [{ stat: 'intellect', min: 35 }], bonus: { type: 'xp', value: 0.20 } },
  { id: 'a_coins_1', name: 'Владелец Акций', description: '+20% Монет.', icon: Crown, cost: 30, rank: 'A', requirements: [{ stat: 'logic', min: 35 }], bonus: { type: 'coins', value: 0.20 } },
  { id: 'a_dmg_1', name: 'Мастер Меча и Кода', description: '+20% Урона.', icon: Swords, cost: 35, rank: 'A', requirements: [{ stat: 'power', min: 35 }], bonus: { type: 'damage', value: 0.20 } },
  { id: 'a_speed_1', name: 'Квантовый Код', description: '+5 к Скорости.', icon: FastForward, cost: 40, rank: 'A', requirements: [{ stat: 'speed', min: 40 }], bonus: { type: 'stat_boost', value: 5, targetStat: 'speed' } },

  
  { id: 's_xp_1', name: 'Архитектор Грез', description: '+30% XP.', icon: Map, cost: 50, rank: 'S', requirements: [{ stat: 'intellect', min: 50 }], bonus: { type: 'xp', value: 0.30 } },
  { id: 's_coins_1', name: 'Крипто-Магнат', description: '+30% Монет.', icon: Activity, cost: 50, rank: 'S', requirements: [{ stat: 'logic', min: 50 }], bonus: { type: 'coins', value: 0.30 } },
  { id: 's_dmg_1', name: 'Стиратель Багов', description: '+30% Урона.', icon: MousePointer2, cost: 60, rank: 'S', requirements: [{ stat: 'power', min: 50 }], bonus: { type: 'damage', value: 0.30 } },
  { id: 's_luck_1', name: 'Благословение Питона', description: '+25% Удачи.', icon: Heart, cost: 55, rank: 'S', requirements: [{ stat: 'intellect', min: 45 }], bonus: { type: 'luck', value: 0.25 } },

  
  { id: 'ss_xp_1', name: 'Легенда Python', description: '+45% XP.', icon: Sparkles, cost: 75, rank: 'SS', requirements: [{ stat: 'intellect', min: 70 }], bonus: { type: 'xp', value: 0.45 } },
  { id: 'ss_coins_1', name: 'Миллиардер', description: '+45% Монет.', icon: Gem, cost: 75, rank: 'SS', requirements: [{ stat: 'logic', min: 70 }], bonus: { type: 'coins', value: 0.45 } },
  { id: 'ss_dmg_1', name: 'Пожиратель Кода', description: '+45% Урона.', icon: Ghost, cost: 80, rank: 'SS', requirements: [{ stat: 'power', min: 70 }], bonus: { type: 'damage', value: 0.45 } },

  
  { id: 'sss_xp_1', name: 'Верховный Творец', description: '+65% XP.', icon: Crown, cost: 100, rank: 'SSS', requirements: [{ stat: 'intellect', min: 85 }], bonus: { type: 'xp', value: 0.65 } },
  { id: 'sss_all_1', name: 'Критическая Ошибка', description: '+50% ко ВСЕМУ.', icon: Zap, cost: 150, rank: 'SSS', requirements: [{ stat: 'intellect', min: 80 }, { stat: 'logic', min: 80 }], bonus: { type: 'luck', value: 0.50 } },

  
  { id: 'god_perk_1', name: 'ПОВЕЛИТЕЛЬ СУДЬБЫ', description: '+100% XP и Монет, +100% Урона.', icon: Flame, cost: 300, rank: 'GOD', requirements: [{ stat: 'intellect', min: 99 }, { stat: 'logic', min: 99 }, { stat: 'power', min: 99 }], bonus: { type: 'damage', value: 1.0 } },
  { id: 'god_perk_infinity', name: 'БЕСКОНЕЧНОСТЬ', description: 'Множитель наград x3.', icon: Sparkles, cost: 500, rank: 'GOD', requirements: [{ stat: 'stamina', min: 99 }], bonus: { type: 'coins', value: 2.0 } }
];
