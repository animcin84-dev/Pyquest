import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, increment, collection, addDoc, deleteDoc, getDocs, query, where, limit, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { ALL_ITEMS } from '../pages/Shop';
import { calculateRank } from '../utils/ranks';
import { postAuthenticated } from '../services/serverApi';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  console.error('Firestore operation failed', {
    operationType,
    path,
    code: typeof error === 'object' && error && 'code' in error ? String(error.code) : undefined,
  });
  throw new Error('Не удалось сохранить данные. Попробуйте ещё раз.');
};

const getDailyChallengeDate = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Almaty',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: { coins: number, xp: number };
  target: number;
  current: number;
  type: string;
  completed: boolean;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  acquiredAt: number;
}

export interface CodeResult {
  success: boolean;
  message: string;
  timestamp: number;
}

export interface PerformanceSettings {
  lowPerfMode: boolean;
}

export interface UserProfile {
  uid: string;
  username: string;
  xp: number;
  level: number;
  role?: string;
  avatar?: string;
  bio?: string;
  rank?: string;
  completedLessons: string[];
  inventory: InventoryItem[];
  stats: {
    logic: number;
    speed: number;
    power: number;
    intellect: number;
    stamina: number;
  };
  pet?: {
    name: string;
    type: string;
    level: number;
    xp: number;
    stats: {
      logic: number;
      speed: number;
      power: number;
      intellect: number;
    };
    color: string;
    customPixels?: string[]; 
    lastFed: number;
  };
  coins: number;
  lastDailyReward?: any;
  dailyQuests?: Quest[];
  lastQuestUpdate?: any;
  createdAt: any;
  streak?: number;
  completedDailyChallenges?: string[];
  guildId?: string | null;
  guildRole?: 'leader' | 'member' | null;
  perks: string[];
  skillPoints: number;
  achievements: string[];
  friends?: string[];
}

const QUEST_POOL: Omit<Quest, 'current' | 'completed'>[] = [
  { id: 'q1', title: 'Урок Логики', description: 'Завершите 3 урока по Python.', reward: { coins: 100, xp: 50 }, target: 3, type: 'lesson' },
  { id: 'q2', title: 'Дуэлянт', description: 'Выиграйте 2 дуэли с другими игроками.', reward: { coins: 200, xp: 100 }, target: 2, type: 'duel' },
  { id: 'q3', title: 'Транжира', description: 'Потратьте 500 монет в магазине.', reward: { coins: 50, xp: 25 }, target: 500, type: 'spend' },
  { id: 'q4', title: 'Забота о питомце', description: 'Покормите питомца 5 раз.', reward: { coins: 100, xp: 50 }, target: 5, type: 'pet_feed' },
  { id: 'q5', title: 'Мастер Кода', description: 'Завершите 5 уроков.', reward: { coins: 250, xp: 150 }, target: 5, type: 'lesson' },
  { id: 'q6', title: 'Чемпион', description: 'Выиграйте 5 дуэлей.', reward: { coins: 500, xp: 300 }, target: 5, type: 'duel' },
  { id: 'q7', title: 'Инвестор', description: 'Потратьте 1000 монет.', reward: { coins: 200, xp: 100 }, target: 1000, type: 'spend' },
  { id: 'q8', title: 'Лучший Друг', description: 'Покормите питомца 10 раз.', reward: { coins: 250, xp: 150 }, target: 10, type: 'pet_feed' },
  { id: 'q9', title: 'Песочница', description: 'Запустите код в песочнице 3 раза.', reward: { coins: 50, xp: 25 }, target: 3, type: 'sandbox' },
  { id: 'q10', title: 'Потребитель', description: 'Используйте 3 предмета из инвентаря.', reward: { coins: 100, xp: 50 }, target: 3, type: 'use_item' },
  { id: 'q11', title: 'Шопоголик', description: 'Купите 2 предмета в магазине.', reward: { coins: 100, xp: 50 }, target: 2, type: 'buy_item' },
  { id: 'q12', title: 'Торговец', description: 'Продайте 1 предмет магазину.', reward: { coins: 50, xp: 25 }, target: 1, type: 'sell_item' },
  { id: 'q13', title: 'Дипломат', description: 'Отправьте 1 запрос на обмен.', reward: { coins: 50, xp: 25 }, target: 1, type: 'trade_request' },
  { id: 'q14', title: 'Партнер', description: 'Примите 1 запрос на обмен.', reward: { coins: 100, xp: 50 }, target: 1, type: 'trade_accept' },
  { id: 'q15', title: 'Развитие', description: 'Получите 100 XP.', reward: { coins: 100, xp: 50 }, target: 100, type: 'gain_xp' },
  { id: 'q16', title: 'Прорыв', description: 'Получите 500 XP.', reward: { coins: 500, xp: 250 }, target: 500, type: 'gain_xp' },
  { id: 'q17', title: 'Заработок', description: 'Заработайте 200 монет.', reward: { coins: 50, xp: 25 }, target: 200, type: 'earn_coins' },
  { id: 'q18', title: 'Магнат', description: 'Заработайте 1000 монет.', reward: { coins: 250, xp: 125 }, target: 1000, type: 'earn_coins' },
  { id: 'q19', title: 'Точность', description: 'Завершите урок без ошибок.', reward: { coins: 150, xp: 75 }, target: 1, type: 'perfect_lesson' },
  { id: 'q20', title: 'Коллекционер', description: 'Соберите 10 разных предметов.', reward: { coins: 500, xp: 250 }, target: 10, type: 'collect_items' },
];

interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  itemName: string;
  price: number;
  createdAt: any;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  payShopRefresh: () => Promise<boolean>;
  claimArcadeReward: (gameId: string) => Promise<boolean>;
  claimSoloBossReward: (bossId: string) => Promise<boolean>;
  contributeToGlobalBoss: (bossId: string) => Promise<{ damage: number; currentHp: number } | null>;
  claimTournamentReward: (tournamentId: string) => Promise<boolean>;
  completeLesson: (lessonId: string, xpReward: number) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  claimDailyReward: () => Promise<boolean>;
  buyItem: (itemId: string, price: number) => Promise<boolean>;
  quickSellItem: (itemId: string) => Promise<boolean>;
  listMarketplaceItem: (itemId: string, price: number) => Promise<boolean>;
  buyMarketplaceItem: (listing: MarketplaceListing) => Promise<boolean>;
  getMarketplaceListings: () => Promise<MarketplaceListing[]>;
  isAdmin: boolean;
  adminAddCoins: (userId: string, amount: number) => Promise<void>;
  adminUpdateUserStats: (userId: string, stats: Partial<UserProfile['stats']>) => Promise<void>;
  adminGiveItem: (userId: string, itemId: string) => Promise<void>;
  adminCompleteLesson: (userId: string, lessonId: string) => Promise<void>;
  adminUnlockAllLessons: (userId: string) => Promise<void>;
  adminSetLevel: (userId: string, level: number, xp: number) => Promise<void>;
  adminMaxOut: (userId: string) => Promise<void>;
  adminGiveCoins: (userId: string, amount: number) => Promise<void>;
  adminSetStats: (userId: string, stats: any) => Promise<void>;
  adminCompleteQuest: (userId: string, questId: string) => Promise<void>;
  adminCompleteAllQuests: (userId: string) => Promise<void>;
  sendTradeRequest: (targetUserId: string, myItems: string[], theirItems: string[]) => Promise<void>;
  acceptTradeRequest: (tradeId: string) => Promise<void>;
  cancelTradeRequest: (tradeId: string) => Promise<void>;
  getTradeRequests: () => Promise<any[]>;
  searchUsers: (queryText: string) => Promise<{ uid: string, username: string, avatar?: string }[]>;
  updateQuestProgress: (type: string, amount?: number) => Promise<void>;
  levelUp: number | null;
  resetLevelUp: () => void;
  calculateRank: (level: number, stats?: any) => string;
  canClaimReward: () => boolean;
  lastCodeResult: CodeResult | null;
  setLastCodeResult: (result: CodeResult) => void;
  currentCode: string;
  setCurrentCode: (code: string) => void;
  currentChallenge: string;
  setCurrentChallenge: (challenge: string) => void;
  completeDailyChallenge: (challengeId: string, reward: { xp: number, coins: number }) => Promise<void>;
  adminSpawnBoss: (templateId: string) => Promise<void>;
  saveSubmission: (lessonId: string, code: string, results: any) => Promise<void>;
  getSubmissions: (lessonId: string) => Promise<any[]>;
  useItem: (inventoryId: string, asPetFood?: boolean) => Promise<{ message: string } | null>;
  customizePet: (changes: Pick<NonNullable<UserProfile['pet']>, 'name' | 'type' | 'customPixels'>) => Promise<boolean>;
  trainPet: (stat: 'logic' | 'speed' | 'power') => Promise<boolean>;
  unlockPerk: (perkId: string) => Promise<boolean>;
  performanceSettings: PerformanceSettings;
  setLowPerfMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

import { playSound } from '../utils/sounds';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [lastCodeResult, setLastCodeResult] = useState<CodeResult | null>(null);
  const [currentCode, setCurrentCode] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState('');
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>(() => {
    const saved = localStorage.getItem('pyquest_perf_settings');
    if (!saved) return { lowPerfMode: false };
    try {
      const parsed: unknown = JSON.parse(saved);
      return typeof parsed === 'object' && parsed !== null && 'lowPerfMode' in parsed &&
        typeof parsed.lowPerfMode === 'boolean'
        ? { lowPerfMode: parsed.lowPerfMode }
        : { lowPerfMode: false };
    } catch {
      localStorage.removeItem('pyquest_perf_settings');
      return { lowPerfMode: false };
    }
  });

  const setLowPerfMode = React.useCallback((enabled: boolean) => {
    setPerformanceSettings(prev => {
      const next = { ...prev, lowPerfMode: enabled };
      localStorage.setItem('pyquest_perf_settings', JSON.stringify(next));
      return next;
    });
  }, []);

  const resetLevelUp = React.useCallback(() => setLevelUp(null), []);

  const calculateRank = React.useCallback((level: number, stats?: any): string => {
    
    let rank: string = 'F';
    if (level >= 91) rank = 'SSS+';
    else if (level >= 86) rank = 'SSS';
    else if (level >= 81) rank = 'SS+';
    else if (level >= 71) rank = 'SS';
    else if (level >= 61) rank = 'S+';
    else if (level >= 51) rank = 'S';
    else if (level >= 41) rank = 'A';
    else if (level >= 31) rank = 'B';
    else if (level >= 21) rank = 'C';
    else if (level >= 11) rank = 'D';
    else if (level >= 6) rank = 'E';

    
    if (stats) {
      const avgStat = (stats.logic + stats.speed + stats.power + stats.intellect + stats.stamina) / 5;
      if (avgStat >= 95 && level >= 80) return 'SSS';
      if (avgStat >= 80 && level >= 40) return 'S';
    }

    return rank;
  }, []);

  useEffect(() => {
    let unsubscribeProfile = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        unsubscribeProfile();
        setCurrentUser(user);
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (auth.currentUser?.uid !== user.uid) return;
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              username: user.displayName || user.email?.split('@')[0] || 'User',
              xp: 0,
              level: 1,
              coins: 100,
              completedLessons: [],
              inventory: [],
              stats: {
                logic: 1,
                speed: 1,
                power: 1,
                intellect: 1,
                stamina: 1
              },
              perks: [],
              skillPoints: 0,
              achievements: [],
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setUserProfile(newProfile);
          }
          unsubscribeProfile = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) setUserProfile(snapshot.data() as UserProfile);
          }, (error) => {
            console.error('Profile sync failed', { code: error.code });
          });
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const getLoginEmail = (username: string) => {
    const normalizedUsername = username.trim().normalize('NFKC');
    if (!normalizedUsername) {
      throw new Error('Введите никнейм.');
    }

    const encodedUsername = Array.from(new TextEncoder().encode(normalizedUsername))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    return `u${encodedUsername}@pyquest.app`;
  };

  const getLegacyLoginEmail = (username: string) => {
    const localPart = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return localPart ? `${localPart}@pyquest.app` : null;
  };

  const login = React.useCallback(async (username: string, password: string) => {
    const emailCandidates = [getLoginEmail(username), getLegacyLoginEmail(username)]
      .filter((email): email is string => Boolean(email))
      .filter((email, index, candidates) => candidates.indexOf(email) === index);

    let lastError: unknown;
    for (const email of emailCandidates) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        playSound('success');
        return;
      } catch (error) {
        lastError = error;
        const code = typeof error === 'object' && error && 'code' in error
          ? String(error.code)
          : '';

        if (!['auth/invalid-credential', 'auth/user-not-found', 'auth/invalid-email'].includes(code)) {
          playSound('error');
          throw error;
        }
      }
    }

    playSound('error');
    throw lastError ?? new Error('Не удалось войти в аккаунт.');
  }, []);

  const register = React.useCallback(async (username: string, password: string) => {
    const email = getLoginEmail(username);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      
      const newProfile: UserProfile = {
        uid: user.uid,
        username,
        xp: 0,
        level: 1,
        coins: 100,
        completedLessons: [],
        inventory: [],
        stats: {
          logic: 1,
          speed: 1,
          power: 1,
          intellect: 1,
          stamina: 1
        },
        perks: [],
        skillPoints: 0,
        achievements: [],
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), newProfile);
      setUserProfile(newProfile);
      playSound('success');
    } catch (err) {
      playSound('error');
      const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : '';
      if (code.startsWith('auth/')) {
        throw err;
      }
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}`);
    }
  }, []);

  const loginWithGoogle = React.useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      playSound('success');
    } catch (error) {
      playSound('error');
      throw error;
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await signOut(auth);
      playSound('click');
    } catch (error) {
      playSound('error');
      throw error;
    }
  }, []);

  // This only controls the interface. Server and Firestore authorization must
  // still rely on protected roles or custom claims, never on a client email list.
  const isAdmin = Boolean(currentUser && userProfile?.role === 'admin');



  const updateQuestProgress = React.useCallback(async (type: string, amount: number = 1) => {
    if (!currentUser || !userProfile?.dailyQuests) return;

    const uniqueItemsCount = new Set((userProfile.inventory || []).map(i => i.itemId)).size;

    const updatedQuests = userProfile.dailyQuests.map(quest => {
      if (quest.completed) return quest;

      if (quest.type === 'collect_items') {
        const newCurrent = Math.min(quest.target, uniqueItemsCount);
        const completed = newCurrent >= quest.target;
        if (completed) {
          toast.success(`Квест выполнен: ${quest.title}! +${quest.reward.coins} монет, +${quest.reward.xp} XP`);
          playSound('success');
          return { ...quest, current: newCurrent, completed: true };
        }
        return { ...quest, current: newCurrent };
      }

      if (quest.type === type) {
        const newCurrent = Math.min(quest.target, quest.current + amount);
        const completed = newCurrent >= quest.target;
        
        if (completed) {
          
          toast.success(`Квест выполнен: ${quest.title}! +${quest.reward.coins} монет, +${quest.reward.xp} XP`);
          playSound('success');
          
          return { ...quest, current: newCurrent, completed: true };
        }
        return { ...quest, current: newCurrent };
      }
      return quest;
    });

    
    const completedQuests = updatedQuests.filter((q, i) => q.completed && !userProfile.dailyQuests![i].completed);
    
    if (completedQuests.length > 0) {
      const totalCoins = completedQuests.reduce((sum, q) => sum + q.reward.coins, 0);
      const totalXp = completedQuests.reduce((sum, q) => sum + q.reward.xp, 0);
      
      const newXp = userProfile.xp + totalXp;
      const newLevel = Math.floor(newXp / 250) + 1;
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        dailyQuests: updatedQuests,
        coins: increment(totalCoins),
        xp: increment(totalXp),
        level: newLevel
      });
      
      setUserProfile({
        ...userProfile,
        dailyQuests: updatedQuests,
        coins: (userProfile.coins || 0) + totalCoins,
        xp: newXp,
        level: newLevel
      });
    } else {
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        dailyQuests: updatedQuests
      });
      setUserProfile({
        ...userProfile,
        dailyQuests: updatedQuests
      });
    }
  }, [currentUser, userProfile]);

  const sendTradeRequest = React.useCallback(async (targetUserId: string, myItems: string[], theirItems: string[]) => {
    if (!currentUser || !userProfile) return;
    try {
      await postAuthenticated('/trades/create', {
        receiverId: targetUserId,
        senderItemIds: myItems,
        receiverItemIds: theirItems,
      });
      playSound('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'trades');
    }
  }, [currentUser, userProfile]);

  const acceptTradeRequest = React.useCallback(async (tradeId: string) => {
    if (!currentUser || !userProfile) return;
    try {
      const result = await postAuthenticated<{ inventory: InventoryItem[] }>('/trades/accept', { tradeId });
      setUserProfile({ ...userProfile, inventory: result.inventory });
      playSound('buy');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'trades');
    }
  }, [currentUser, userProfile]);

  const cancelTradeRequest = React.useCallback(async (tradeId: string) => {
    try {
      await postAuthenticated('/trades/cancel', { tradeId });
      playSound('click');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `trades/${tradeId}`);
    }
  }, []);

  const getTradeRequests = React.useCallback(async () => {
    if (!currentUser) return [];
    try {
      const q = query(collection(db, 'trades'), where('receiverId', '==', currentUser.uid), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'trades');
      return [];
    }
  }, [currentUser]);

  const searchUsers = React.useCallback(async (queryText: string) => {
    if (!currentUser || !queryText) return [];
    try {
      const q = query(collection(db, 'users'), limit(100));
      const querySnapshot = await getDocs(q);
      
      const lowerQuery = queryText.toLowerCase();
      return querySnapshot.docs
        .map(doc => ({ 
          uid: doc.id, 
          username: doc.data().username, 
          avatar: doc.data().avatar 
        }))
        .filter(u => u.username?.toLowerCase().includes(lowerQuery));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  }, [currentUser]);

  const buyItem = React.useCallback(async (itemId: string, price: number) => {
    if (!currentUser || !userProfile) return false;
    const item = ALL_ITEMS.find(i => i.id === itemId);
    if (!item) return false;

    try {
      const purchase = await postAuthenticated<{ coins: number; inventory: InventoryItem[] }>('/shop/purchase', { itemId });
      const updatedProfile = { 
        ...userProfile, 
        coins: purchase.coins,
        inventory: purchase.inventory,
      };
      setUserProfile(updatedProfile);
      playSound('buy');
      return true;
    } catch (error) {
      playSound('error');
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      return false;
    }
  }, [currentUser, userProfile]);

  const quickSellItem = React.useCallback(async (inventoryId: string) => {
    if (!currentUser || !userProfile) return false;
    if (!userProfile.inventory?.some(item => item.id === inventoryId)) return false;

    try {
      const sale = await postAuthenticated<{ coins: number; inventory: InventoryItem[]; sellPrice: number }>(
        '/shop/quick-sell',
        { inventoryId },
      );
      setUserProfile({
        ...userProfile,
        coins: sale.coins,
        inventory: sale.inventory,
      });
      playSound('success');
      return true;
    } catch (error) {
      playSound('error');
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      return false;
    }
  }, [currentUser, userProfile]);

  const payShopRefresh = React.useCallback(async () => {
    if (!currentUser || !userProfile) return false;
    try {
      const result = await postAuthenticated<{ coins: number; refreshCost: number }>('/shop/refresh');
      setUserProfile({ ...userProfile, coins: result.coins });
      return true;
    } catch (error) {
      console.error('Shop refresh payment failed');
      toast.error('Не удалось оплатить обновление магазина.');
      return false;
    }
  }, [currentUser, userProfile]);

  const listMarketplaceItem = React.useCallback(async (inventoryId: string, price: number) => {
    if (!currentUser || !userProfile) return false;

    try {
      const listing = await postAuthenticated<{ inventory: InventoryItem[] }>('/marketplace/list', {
        inventoryId,
        price,
      });

      setUserProfile({
        ...userProfile,
        inventory: listing.inventory,
      });
      
      playSound('success');
      return true;
    } catch (error) {
      playSound('error');
      handleFirestoreError(error, OperationType.WRITE, 'marketplace');
      return false;
    }
  }, [currentUser, userProfile]);

  const buyMarketplaceItem = React.useCallback(async (listing: MarketplaceListing) => {
    if (!currentUser || !userProfile) return false;

    try {
      const purchase = await postAuthenticated<{ coins: number; inventory: InventoryItem[] }>(
        '/marketplace/purchase',
        { listingId: listing.id },
      );

      setUserProfile({
        ...userProfile,
        coins: purchase.coins,
        inventory: purchase.inventory,
      });

      playSound('buy');
      return true;
    } catch (error) {
      playSound('error');
      handleFirestoreError(error, OperationType.WRITE, 'marketplace');
      return false;
    }
  }, [currentUser, userProfile]);

  const getMarketplaceListings = React.useCallback(async () => {
    try {
      const q = query(collection(db, 'marketplace'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketplaceListing[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'marketplace');
      return [];
    }
  }, []);

  const completeLesson = React.useCallback(async (lessonId: string, xpReward: number) => {
    if (!currentUser || !userProfile) return;
    if (userProfile.completedLessons.includes(lessonId)) return; 

    try {
      // XP comes from the server's canonical lesson catalogue. `xpReward` is
      // retained for existing page call sites but is deliberately ignored.
      void xpReward;
      const result = await postAuthenticated<Pick<UserProfile, 'completedLessons' | 'xp' | 'coins' | 'level' | 'skillPoints'>>(
        '/lessons/complete',
        { lessonId },
      );
      if (result.level > userProfile.level) {
        setLevelUp(result.level);
        playSound('levelUp');
      } else {
        playSound('success');
      }
      setUserProfile({ 
        ...userProfile, 
        ...result,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  }, [currentUser, userProfile]);

  const updateProfile = React.useCallback(async (data: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    const publicProfile: Pick<Partial<UserProfile>, 'username' | 'avatar' | 'bio'> = {};
    if (typeof data.username === 'string') publicProfile.username = data.username.trim().slice(0, 49);
    if (typeof data.avatar === 'string') publicProfile.avatar = data.avatar.slice(0, 500);
    if (typeof data.bio === 'string') publicProfile.bio = data.bio.slice(0, 500);
    if (Object.keys(publicProfile).length === 0) {
      throw new Error('Only public profile fields can be changed here.');
    }
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), publicProfile);
      setUserProfile({ ...userProfile, ...publicProfile });
      playSound('success');
    } catch (error) {
      playSound('error');
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  }, [currentUser, userProfile]);

  const canClaimReward = React.useCallback(() => {
    if (!userProfile?.lastDailyReward) return true;
    const now = new Date();
    const lastReward = typeof userProfile.lastDailyReward.toDate === 'function' 
      ? userProfile.lastDailyReward.toDate() 
      : new Date(userProfile.lastDailyReward);
    return (now.getTime() - lastReward.getTime()) >= 24 * 60 * 60 * 1000;
  }, [userProfile?.lastDailyReward]);

  const claimDailyReward = React.useCallback(async () => {
    if (!currentUser || !userProfile) return false;

    
    if (!canClaimReward()) {
      playSound('error');
      toast.error('Награда уже получена. Возвращайтесь через 24 часа!');
      return false;
    }

    try {
      const reward = await postAuthenticated<{
        xpReward: number;
        coinReward: number;
        xp: number;
        coins: number;
        level: number;
        claimedAt: string;
      }>('/rewards/daily');

      if (reward.level > userProfile.level) {
        setLevelUp(reward.level);
        playSound('levelUp');
      } else {
        playSound('success');
      }

      setUserProfile({ 
        ...userProfile, 
        xp: reward.xp,
        level: reward.level,
        coins: reward.coins,
        lastDailyReward: reward.claimedAt,
      });
      toast.success(`Ежедневная награда получена! +${reward.xpReward} XP, +${reward.coinReward} монет 🎁`);
      return true;
    } catch (error) {
      playSound('error');
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[claimDailyReward] Error:', msg);
      toast.error(error instanceof Error && error.message === 'Daily reward has already been claimed'
        ? 'Награда уже получена. Возвращайтесь через 24 часа!'
        : `Ошибка награды: ${msg}`);
      return false;
    }
  }, [currentUser, userProfile, canClaimReward]);


  useEffect(() => {
    if (currentUser && userProfile) {
      const checkDailyQuests = async () => {
        const now = new Date();
        const lastUpdate = userProfile.lastQuestUpdate?.toDate();
        
        
        if (!userProfile.dailyQuests || !lastUpdate || (now.getTime() - lastUpdate.getTime()) > 24 * 60 * 60 * 1000) {
          
          const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, 5).map(q => ({
            ...q,
            current: 0,
            completed: false
          })) as Quest[];
          
          await updateDoc(doc(db, 'users', currentUser.uid), {
            dailyQuests: selected,
            lastQuestUpdate: serverTimestamp()
          });
          
          setUserProfile(prev => prev ? {
            ...prev,
            dailyQuests: selected,
            lastQuestUpdate: { toDate: () => now }
          } : null);
        }
      };
      
      checkDailyQuests();
    }
  }, [currentUser, userProfile?.uid]);

  const adminCompleteLesson = React.useCallback(async (userId: string, lessonId: string) => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      
      const currentData = userSnap.data() as UserProfile;
      if (currentData.completedLessons?.includes(lessonId)) return;
      
      const updatedLessons = [...(currentData.completedLessons || []), lessonId];
      const xpReward = 100; 
      
      await updateDoc(userRef, {
        completedLessons: updatedLessons,
        xp: increment(xpReward),
        coins: increment(xpReward)
      });
      
      if (userId === currentUser?.uid) {
        setUserProfile(prev => prev ? { 
          ...prev, 
          completedLessons: updatedLessons,
          xp: prev.xp + xpReward,
          coins: (prev.coins || 0) + xpReward
        } : null);
      }
      playSound('success');
      toast.success(`Урок ${lessonId} помечен как пройденный!`);
    } catch (error) {
      console.error('Admin complete lesson error:', error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }, [isAdmin, currentUser]);

  const adminCompleteQuest = React.useCallback(async (userId: string, questId: string) => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      const data = userSnap.data() as UserProfile;
      const quests = data.dailyQuests || [];
      const targetQuest = quests.find(q => q.id === questId);
      if (!targetQuest || targetQuest.completed) return;
      const updatedQuests = quests.map(q =>
        q.id === questId ? { ...q, current: q.target, completed: true } : q
      );
      await updateDoc(userRef, {
        dailyQuests: updatedQuests,
        coins: increment(targetQuest.reward?.coins || 0),
        xp: increment(targetQuest.reward?.xp || 0)
      });
      if (userId === currentUser?.uid) {
        setUserProfile(prev => prev ? { ...prev, dailyQuests: updatedQuests } : null);
      }
      toast.success(`✅ ${targetQuest.title} — выполнен! +${targetQuest.reward?.coins || 0} монет, +${targetQuest.reward?.xp || 0} XP`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }, [isAdmin, currentUser]);

  const adminCompleteAllQuests = React.useCallback(async (userId: string) => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      const data = userSnap.data() as UserProfile;
      const quests = data.dailyQuests || [];
      const pending = quests.filter(q => !q.completed);
      const totalCoins = pending.reduce((sum, q) => sum + (q.reward?.coins || 0), 0);
      const totalXp = pending.reduce((sum, q) => sum + (q.reward?.xp || 0), 0);
      const updatedQuests = quests.map(q => ({ ...q, current: q.target, completed: true }));
      await updateDoc(userRef, {
        dailyQuests: updatedQuests,
        coins: increment(totalCoins),
        xp: increment(totalXp)
      });
      if (userId === currentUser?.uid) {
        setUserProfile(prev => prev ? { ...prev, dailyQuests: updatedQuests } : null);
      }
      playSound('levelUp');
      toast.success(`🎯 Все квесты выполнены! +${totalCoins} монет, +${totalXp} XP`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }, [isAdmin, currentUser]);

  const adminUnlockAllLessons = React.useCallback(async (userId: string) => {
    if (!isAdmin) return;
    try {
      const { LESSONS } = await import('../constants/lessons');
      const allLessonIds = LESSONS.map(l => l.id);
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        completedLessons: allLessonIds
      });
      
      if (userId === currentUser?.uid) {
        setUserProfile(prev => prev ? { ...prev, completedLessons: allLessonIds } : null);
      }
      playSound('levelUp');
      toast.success('ВСЕ уроки разблокированы!');
    } catch (error) {
      console.error('Admin unlock all error:', error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }, [isAdmin, currentUser]);

  const adminSetLevel = React.useCallback(async (userId: string, level: number, xp: number) => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const currentStats = userSnap.exists() ? (userSnap.data() as UserProfile).stats : {};
      const newRank = calculateRank(level, currentStats);
      
      await updateDoc(userRef, { 
        level, 
        xp,
        rank: newRank 
      });
      if (userId === currentUser?.uid) {
        setUserProfile(prev => prev ? { ...prev, level, xp, rank: newRank } : null);
      }
      toast.success(`Level set to ${level} for ${userId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }, [isAdmin, calculateRank, currentUser]);

  const adminUpdateUserStats = React.useCallback(async (userId: string, stats: Partial<UserProfile['stats']>) => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      
      const currentData = userSnap.data() as UserProfile;
      const newStats = { ...currentData.stats, ...stats };
      const newRank = calculateRank(currentData.level, newStats);

      await updateDoc(userRef, { 
        stats: newStats,
        rank: newRank 
      });
      if (userId === currentUser?.uid) {
        setUserProfile(prev => prev ? { ...prev, stats: newStats, rank: newRank } : null);
      }
      toast.success(`Stats updated for ${userId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }, [isAdmin, calculateRank, currentUser]);

  const adminMaxOut = React.useCallback(async (userId: string) => {
    if (!isAdmin) return;
    try {
      const godStats = { logic: 99, speed: 99, power: 99, intellect: 99, stamina: 99 };
      const level = 100;
      const xp = 250000;
      const rank = 'SSS+';
      const coins = 999999;

      await updateDoc(doc(db, 'users', userId), {
        level,
        xp,
        stats: godStats,
        rank,
        coins
      });
      
      if (userId === currentUser?.uid) {
        setUserProfile(prev => prev ? { ...prev, level, xp, stats: godStats, rank, coins } : null);
      }
      toast.success(`USER ${userId} IS NOW A GOD.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }, [isAdmin, currentUser]);

  const adminGiveCoins = React.useCallback(async (userId: string, amount: number) => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { coins: increment(amount) });
      if (userId === currentUser?.uid) {
        setUserProfile(prev => prev ? { ...prev, coins: (prev.coins || 0) + amount } : null);
      }
      toast.success(`Добавлено ${amount} монет`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }, [isAdmin, currentUser]);

  const adminSetStats = React.useCallback(async (userId: string, stats: any) => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const level = (userSnap.data() as UserProfile).level;
      const newRank = calculateRank(level, stats);

      await updateDoc(userRef, { stats, rank: newRank });
      if (userId === currentUser?.uid) {
        setUserProfile(prev => prev ? { ...prev, stats, rank: newRank } : null);
      }
      toast.success('Характеристики обновлены');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }, [isAdmin, calculateRank, currentUser]);

  const completeDailyChallenge = React.useCallback(async (challengeId: string, reward: { xp: number, coins: number }) => {
    if (!currentUser || !userProfile) return;
    const fullId = `${getDailyChallengeDate()}_${challengeId}`;
    
    if (userProfile.completedDailyChallenges?.includes(fullId)) return;

    try {
      // Rewards are calculated from the server-side challenge record; never
      // trust values supplied by a browser.
      void reward;
      const result = await postAuthenticated<Pick<UserProfile, 'completedDailyChallenges' | 'xp' | 'coins' | 'level' | 'skillPoints'> & {
        reward: { xp: number; coins: number };
      }>('/daily-challenges/complete', { challengeId });
      const { reward: canonicalReward, ...profileUpdate } = result;
      setUserProfile({
        ...userProfile,
        ...profileUpdate,
      });
      
      playSound('success');
      toast.success(`Испытание пройдено! +${canonicalReward.xp} XP, +${canonicalReward.coins} монет`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  }, [currentUser, userProfile]);

  const claimArcadeReward = React.useCallback(async (gameId: string) => {
    if (!currentUser || !userProfile) return false;
    try {
      const result = await postAuthenticated<Pick<UserProfile, 'xp' | 'coins' | 'level' | 'skillPoints'> & {
        reward: { xp: number; coins: number };
      }>('/arcade/complete', { gameId });
      const { reward, ...profileUpdate } = result;
      setUserProfile({ ...userProfile, ...profileUpdate });
      if (result.level > userProfile.level) setLevelUp(result.level);
      toast.success(`Аркадная награда: +${reward.xp} XP, +${reward.coins} монет`);
      return true;
    } catch (error) {
      console.error('Arcade reward failed');
      toast.error('Награда за эту игру уже получена сегодня или пока недоступна.');
      return false;
    }
  }, [currentUser, userProfile]);

  const claimSoloBossReward = React.useCallback(async (bossId: string) => {
    if (!currentUser || !userProfile) return false;
    try {
      const result = await postAuthenticated<Pick<UserProfile, 'xp' | 'coins' | 'level' | 'skillPoints'> & {
        reward: { xp: number; coins: number };
      }>('/bosses/complete', { bossId });
      const { reward, ...profileUpdate } = result;
      setUserProfile({ ...userProfile, ...profileUpdate });
      if (result.level > userProfile.level) setLevelUp(result.level);
      toast.success(`Победа над боссом: +${reward.xp} XP, +${reward.coins} монет`);
      return true;
    } catch (error) {
      console.error('Solo boss reward failed');
      toast.error('Награда за этого босса уже получена или пока недоступна.');
      return false;
    }
  }, [currentUser, userProfile]);

  const contributeToGlobalBoss = React.useCallback(async (bossId: string) => {
    if (!currentUser || !userProfile) return null;
    try {
      const result = await postAuthenticated<Pick<UserProfile, 'xp' | 'coins' | 'level' | 'skillPoints'> & {
        damage: number;
        currentHp: number;
        reward: { xp: number; coins: number };
      }>('/bosses/global/contribute', { bossId });
      const { damage, currentHp, reward, ...profileUpdate } = result;
      setUserProfile({ ...userProfile, ...profileUpdate });
      if (result.level > userProfile.level) setLevelUp(result.level);
      toast.success(`Вклад засчитан: ${damage} урона, +${reward.xp} XP`);
      return { damage, currentHp };
    } catch (error) {
      console.error('Global boss contribution failed');
      toast.error('Вклад уже засчитан или босс больше недоступен.');
      return null;
    }
  }, [currentUser, userProfile]);

  const claimTournamentReward = React.useCallback(async (tournamentId: string) => {
    if (!currentUser || !userProfile) return false;
    try {
      const result = await postAuthenticated<Pick<UserProfile, 'xp' | 'coins' | 'level' | 'skillPoints'> & {
        reward: { xp: number; coins: number };
      }>('/tournaments/complete', { tournamentId });
      const { reward, ...profileUpdate } = result;
      setUserProfile({ ...userProfile, ...profileUpdate });
      if (result.level > userProfile.level) setLevelUp(result.level);
      toast.success(`Турнир завершён: +${reward.xp} XP, +${reward.coins} монет`);
      return true;
    } catch (error) {
      console.error('Tournament reward failed');
      toast.error('Награда уже получена или пока недоступна.');
      return false;
    }
  }, [currentUser, userProfile]);

  const adminAddCoins = React.useCallback(async (userId: string, amount: number) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        coins: increment(amount)
      });
      if (userId === currentUser?.uid) {
        setUserProfile(prev => prev ? { ...prev, coins: (prev.coins || 0) + amount } : null);
      }
      toast.success(`Gave ${amount} coins to ${userId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }, [isAdmin, currentUser]);

  const adminGiveItem = React.useCallback(async (userId: string, itemId: string) => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      
      const currentData = userSnap.data() as UserProfile;
      const item = ALL_ITEMS.find(i => i.id === itemId);
      if (!item) return;

      const newItem: InventoryItem = {
        id: `${itemId}_${Date.now()}`,
        itemId: itemId,
        name: item.name,
        acquiredAt: Date.now()
      };
      
      const updatedInventory = [...(currentData.inventory || []), newItem];
      await updateDoc(userRef, { inventory: updatedInventory });
      
      if (userId === currentUser?.uid) {
        setUserProfile(prev => prev ? { ...prev, inventory: updatedInventory } : null);
      }
      toast.success(`Item ${item.name} given to ${userId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }, [isAdmin, currentUser]);

  const adminSpawnBoss = React.useCallback(async (templateId: string) => {
    if (!isAdmin) return;
    try {
      const { BossService } = await import('../services/BossService');
      await BossService.spawnBoss(templateId);
      toast.success('Глобальный босс призван!');
    } catch (error) {
       console.error('Error spawning boss:', error);
       toast.error('Ошибка при спавне босса');
    }
  }, [isAdmin]);

  const saveSubmission = React.useCallback(async (lessonId: string, code: string, results: any) => {
    if (!currentUser) return;
    try {
      const submissionRef = doc(collection(db, 'submissions'));
      await setDoc(submissionRef, {
        id: submissionRef.id,
        userId: currentUser.uid,
        lessonId,
        code,
        results,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving submission:', error);
    }
  }, [currentUser]);

  const getSubmissions = React.useCallback(async (lessonId: string) => {
    if (!currentUser) return [];
    try {
      const q = query(
        collection(db, 'submissions'),
        where('userId', '==', currentUser.uid),
        where('lessonId', '==', lessonId),
        limit(20)
      );
      const snap = await getDocs(q);
      
      return snap.docs
        .map(doc => doc.data())
        .sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
    } catch (error) {
      console.error('Error getting submissions:', error);
      return [];
    }
  }, [currentUser]);

  const useItem = React.useCallback(async (inventoryId: string, asPetFood = false) => {
    if (!userProfile || !currentUser) return;

    try {
      const result = await postAuthenticated<{
        inventory: InventoryItem[];
        stats?: UserProfile['stats'];
        pet?: UserProfile['pet'];
        xp?: number;
        level?: number;
        skillPoints?: number;
        message: string;
      }>('/inventory/use', { inventoryId, asPetFood });
      const profileUpdate: Partial<UserProfile> = { inventory: result.inventory };
      if (result.stats) profileUpdate.stats = result.stats;
      if (result.pet) profileUpdate.pet = result.pet;
      if (typeof result.xp === 'number') profileUpdate.xp = result.xp;
      if (typeof result.level === 'number') profileUpdate.level = result.level;
      if (typeof result.skillPoints === 'number') profileUpdate.skillPoints = result.skillPoints;
      setUserProfile({ ...userProfile, ...profileUpdate });
      if (typeof result.level === 'number' && result.level > userProfile.level) setLevelUp(result.level);
      toast.success(result.message);
      playSound('levelUp');
      return { message: result.message };
    } catch (error) {
      console.error('Inventory use failed');
      toast.error('Этот предмет нельзя использовать сейчас.');
      return null;
    }

    /* Legacy client-side effect table retained temporarily below for reference.
       It is unreachable: canonical consumption and rewards run above.
    const invItem = userProfile.inventory.find(i => i.id === inventoryId);
    if (!invItem) return;
    const itemId = invItem.itemId;
    
    let statBoost: any = {};
    let petStatBoost: any = {};
    let xpBoost = 0;
    let message = '';
    let perkToAdd = '';

    
    if (itemId === 'logic_booster') {
      statBoost = { logic: (userProfile.stats.logic || 0) + 5 };
      message = 'Логика повышена на 5!';
    } else if (itemId === 'speed_serum') {
      statBoost = { speed: (userProfile.stats.speed || 0) + 5 };
      message = 'Скорость повышена на 5!';
    } else if (itemId === 'power_gloves') {
      statBoost = { power: (userProfile.stats.power || 0) + 5 };
      message = 'Сила повышена на 5!';
    } else if (itemId === 'intellect_chip') {
      statBoost = { intellect: (userProfile.stats.intellect || 0) + 5 };
      message = 'Интеллект повышен на 5!';
    } else if (itemId === 'stamina_drink') {
      statBoost = { stamina: (userProfile.stats.stamina || 0) + 5 };
      message = 'Выносливость повышена на 5!';
    }
    
    
    else if (itemId === 'apple_red') {
      petStatBoost = { logic: (userProfile.pet?.stats.logic || 0) + 5 };
      message = 'Логика питомца повышена на 5!';
    } else if (itemId === 'coffee_cup') {
      petStatBoost = { speed: (userProfile.pet?.stats.speed || 0) + 5 };
      message = 'Скорость питомца повышена на 5!';
    } else if (itemId === 'burger_king') {
      petStatBoost = { power: (userProfile.pet?.stats.power || 0) + 5 };
      message = 'Сила питомца повышена на 5!';
    } else if (itemId === 'brain_boost') {
      petStatBoost = { intellect: (userProfile.pet?.stats.intellect || 0) + 8 };
      message = 'Интеллект питомца повышен на 8!';
    } else if (itemId === 'energy_drink') {
      petStatBoost = { speed: (userProfile.pet?.stats.speed || 0) + 8 };
      message = 'Скорость питомца повышена на 8!';
    } else if (itemId === 'pizza_slice') {
      petStatBoost = { logic: (userProfile.pet?.stats.logic || 0) + 2, power: (userProfile.pet?.stats.power || 0) + 3 };
      message = 'Логика и Сила питомца повышены!';
    } else if (itemId === 'bit_bot_food') {
      const stats = ['logic', 'speed', 'power', 'intellect', 'stamina'];
      const randomStat = stats[Math.floor(Math.random() * stats.length)];
      petStatBoost = { [randomStat]: (userProfile.pet?.stats[randomStat] || 0) + 10 };
      message = `🤖 Бит-Бот накормлен! +10 к ${randomStat} питомца!`;
    }
    
    
    else if (itemId === 'data_crystal') {
      xpBoost = 100;
      message = 'Вы получили 100 XP!';
    } else if (itemId === 'coding_manual') {
      xpBoost = 50;
      message = 'Вы получили 50 XP и массу знаний!';
    } else if (itemId === 'xp_boost_1') {
      xpBoost = 250;
      message = 'Использован XP Буст (1ч)! +250 XP!';
    } else if (itemId === 'xp_boost_2') {
      xpBoost = 600;
      message = 'Использован Супер XP Буст (2ч)! +600 XP!';
    }
    
    
    else if (itemId === 'scroll_logic') {
      statBoost = { logic: (userProfile.stats.logic || 0) + 10 };
      message = 'Свиток Логики +10!';
    } else if (itemId === 'scroll_speed') {
      statBoost = { speed: (userProfile.stats.speed || 0) + 10 };
      message = 'Свиток Скорости +10!';
    } else if (itemId === 'scroll_power') {
      statBoost = { power: (userProfile.stats.power || 0) + 10 };
      message = 'Свиток Силы +10!';
    } else if (itemId === 'scroll_intellect') {
      statBoost = { intellect: (userProfile.stats.intellect || 0) + 10 };
      message = 'Свиток Интеллекта +10!';
    } else if (itemId === 'scroll_stamina') {
      statBoost = { stamina: (userProfile.stats.stamina || 0) + 10 };
      message = 'Свиток Выносливости +10!';
    } else if (itemId === 'ancient_scroll') {
      statBoost = {
        logic: (userProfile.stats.logic || 0) + 5,
        speed: (userProfile.stats.speed || 0) + 5,
        power: (userProfile.stats.power || 0) + 5,
        intellect: (userProfile.stats.intellect || 0) + 5,
        stamina: (userProfile.stats.stamina || 0) + 5,
      };
      message = 'Древний Манускрипт! Все статы +5!';
    }
    
    
    else if (itemId === 'guido_wisdom') {
      xpBoost = 1000;
      message = 'Мудрость Гвидо! +1000 XP!';
    } else if (itemId === 'quantum_core') {
      statBoost = {
        logic: (userProfile.stats.logic || 0) + 10,
        speed: (userProfile.stats.speed || 0) + 10,
        power: (userProfile.stats.power || 0) + 10,
        intellect: (userProfile.stats.intellect || 0) + 10,
        stamina: (userProfile.stats.stamina || 0) + 10,
      };
      message = 'Квантовое Ядро активировано! Все статы +10!';
    }

    if (message) {
      const newInventory = userProfile.inventory.filter(item => item.id !== inventoryId);
      const updateData: any = { inventory: newInventory };
      
      if (Object.keys(statBoost).length > 0) updateData.stats = { ...userProfile.stats, ...statBoost };
      if (Object.keys(petStatBoost).length > 0 && userProfile.pet) {
        updateData.pet = { ...userProfile.pet, stats: { ...userProfile.pet.stats, ...petStatBoost } };
      }
      if (xpBoost > 0) {
        updateData.xp = (userProfile.xp || 0) + xpBoost;
        updateData.level = Math.floor(updateData.xp / 250) + 1;
        updateQuestProgress('gain_xp', xpBoost);
      }
      
      await updateProfile(updateData);
      updateQuestProgress('use_item');
      toast.success(message);
      const { playSound } = await import('../utils/sounds');
      playSound('levelUp');
    } */
  }, [userProfile, currentUser]);

  const customizePet = React.useCallback(async (changes: Pick<NonNullable<UserProfile['pet']>, 'name' | 'type' | 'customPixels'>) => {
    if (!currentUser || !userProfile) return false;
    try {
      const result = await postAuthenticated<{ pet: NonNullable<UserProfile['pet']> }>('/pet/customize', changes);
      setUserProfile({ ...userProfile, pet: result.pet });
      return true;
    } catch (error) {
      console.error('Pet customization failed');
      toast.error('Не удалось сохранить настройки питомца.');
      return false;
    }
  }, [currentUser, userProfile]);

  const trainPet = React.useCallback(async (stat: 'logic' | 'speed' | 'power') => {
    if (!currentUser || !userProfile) return false;
    try {
      const result = await postAuthenticated<{ coins: number; pet: NonNullable<UserProfile['pet']> }>('/pet/train', { stat });
      setUserProfile({ ...userProfile, coins: result.coins, pet: result.pet });
      return true;
    } catch (error) {
      console.error('Pet training failed');
      toast.error('Не удалось прокачать питомца.');
      return false;
    }
  }, [currentUser, userProfile]);

  const unlockPerk = React.useCallback(async (perkId: string) => {
    if (!currentUser || !userProfile) return false;
    try {
      const result = await postAuthenticated<Pick<UserProfile, 'perks' | 'skillPoints' | 'stats'>>('/perks/unlock', { perkId });
      setUserProfile({ ...userProfile, ...result });
      return true;
    } catch (error) {
      console.error('Perk unlock failed');
      toast.error('Навык нельзя разблокировать: проверьте требования и очки навыков.');
      return false;
    }
  }, [currentUser, userProfile]);

  const value = React.useMemo(() => ({
    currentUser,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    payShopRefresh,
    claimArcadeReward,
    claimSoloBossReward,
    contributeToGlobalBoss,
    claimTournamentReward,
    completeLesson,
    updateProfile,
    claimDailyReward,
    buyItem,
    quickSellItem,
    listMarketplaceItem,
    buyMarketplaceItem,
    getMarketplaceListings,
    isAdmin,
    adminAddCoins,
    adminUpdateUserStats,
    adminGiveItem,
    adminCompleteLesson,
    adminUnlockAllLessons,
    adminSetLevel,
    adminMaxOut,
    adminGiveCoins,
    adminSetStats,
    sendTradeRequest,
    acceptTradeRequest,
    cancelTradeRequest,
    getTradeRequests,
    searchUsers,
    updateQuestProgress,
    levelUp,
    resetLevelUp,
    calculateRank,
    canClaimReward,
    lastCodeResult,
    setLastCodeResult,
    currentCode,
    setCurrentCode,
    currentChallenge,
    setCurrentChallenge,
    completeDailyChallenge,
    adminSpawnBoss,
    saveSubmission,
    getSubmissions,
    useItem,
    customizePet,
    trainPet,
    unlockPerk,
    performanceSettings,
    setLowPerfMode,
    adminCompleteQuest,
    adminCompleteAllQuests,
  }), [
    currentUser, userProfile, loading, login, register, loginWithGoogle, logout,
    payShopRefresh, claimArcadeReward, claimSoloBossReward,
    contributeToGlobalBoss, claimTournamentReward, completeLesson, updateProfile,
    claimDailyReward, buyItem, quickSellItem, listMarketplaceItem, buyMarketplaceItem,
    getMarketplaceListings, isAdmin, adminAddCoins, adminUpdateUserStats,
    adminGiveItem, adminCompleteLesson, adminUnlockAllLessons, adminSetLevel,
    adminMaxOut, adminGiveCoins, adminSetStats, sendTradeRequest, acceptTradeRequest,
    cancelTradeRequest, getTradeRequests, searchUsers, updateQuestProgress,
    levelUp, resetLevelUp, calculateRank, canClaimReward, lastCodeResult,
    currentCode, currentChallenge, completeDailyChallenge, adminSpawnBoss,
    saveSubmission, getSubmissions, useItem, customizePet, trainPet, unlockPerk,
    performanceSettings, setLowPerfMode,
    adminCompleteQuest, adminCompleteAllQuests
  ]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
