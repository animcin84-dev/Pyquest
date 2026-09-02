export type UserRank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+' | 'SS' | 'SS+' | 'SSS' | 'SSS+' | 'GOD' | 'ETERNAL';

export const calculateRank = (level: number): UserRank => {
  if (level >= 101) return 'ETERNAL';
  if (level >= 96) return 'GOD';
  if (level >= 91) return 'SSS+';
  if (level >= 86) return 'SSS';
  if (level >= 81) return 'SS+';
  if (level >= 71) return 'SS';
  if (level >= 61) return 'S+';
  if (level >= 51) return 'S';
  if (level >= 41) return 'A';
  if (level >= 31) return 'B';
  if (level >= 21) return 'C';
  if (level >= 11) return 'D';
  if (level >= 6) return 'E';
  return 'F';
};

export const getRankColor = (rank: UserRank): string => {
  switch (rank) {
    case 'ETERNAL': return 'from-white via-cyan-200 to-white animate-pulse';
    case 'GOD': return 'from-yellow-300 via-amber-500 to-yellow-600';
    case 'SSS+':
    case 'SSS': return 'from-red-600 via-orange-500 to-red-600';
    case 'SS+':
    case 'SS': return 'from-purple-600 to-pink-600';
    case 'S+':
    case 'S': return 'from-yellow-400 to-orange-500';
    case 'A': return 'from-blue-500 to-indigo-600';
    case 'B': return 'from-emerald-500 to-teal-600';
    case 'C': return 'from-green-400 to-emerald-500';
    case 'D': return 'from-cyan-400 to-blue-500';
    case 'E': return 'from-gray-400 to-gray-500';
    default: return 'from-gray-600 to-gray-800';
  }
};
