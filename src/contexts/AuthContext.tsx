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
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, increment, collection, addDoc, deleteDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import { ALL_ITEMS } from '../pages/Shop';
import { calculateRank } from '../utils/ranks';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
  addXp: (amount: number) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  subtractCoins: (amount: number) => Promise<void>;
  subtractXp: (amount: number) => Promise<void>;
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
  useItem: (inventoryId: string) => Promise<void>;
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
    return saved ? JSON.parse(saved) : { lowPerfMode: false };
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
      if (avgStat >= 80 && level >= 40) return 'S';
      if (avgStat >= 95 && level >= 80) return 'SSS';
    }

    return rank;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
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
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const getFakeEmail = (username: string) => `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@pyquest.app`;

  const login = React.useCallback(async (username: string, password: string) => {
    const email = getFakeEmail(username);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      playSound('success');
    } catch (error) {
      playSound('error');
      throw error;
    }
  }, []);

  const register = React.useCallback(async (username: string, password: string) => {
    const email = getFakeEmail(username);
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
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}`);
      throw err;
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

  const isAdmin = Boolean(currentUser && (
    currentUser.email === 'admin@pyquest.app' ||
    currentUser.email === 'anim@pyquest.app' ||
    currentUser.email === 'test@test.com' ||
    currentUser.email === 'animcinca84@gmail.com' ||
    userProfile?.username?.toUpperCase() === 'ANIM' ||
    userProfile?.role === 'admin'
  ));

  useEffect(() => {
    if (currentUser) {
      console.log('AuthContext: Current User Email:', currentUser.email);
      console.log('AuthContext: Current User UID:', currentUser.uid);
      console.log('AuthContext: User Profile:', userProfile);
      console.log('AuthContext: Is Admin:', isAdmin);
    }
  }, [currentUser, isAdmin, userProfile]);



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
      await addDoc(collection(db, 'trades'), {
        senderId: currentUser.uid,
        senderName: userProfile.username,
        receiverId: targetUserId,
        senderItems: myItems,
        receiverItems: theirItems,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      updateQuestProgress('trade_request');
      playSound('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'trades');
    }
  }, [currentUser, userProfile, updateQuestProgress]);

  const acceptTradeRequest = React.useCallback(async (tradeId: string) => {
    if (!currentUser || !userProfile) return;
    try {
      const tradeRef = doc(db, 'trades', tradeId);
      const tradeSnap = await getDoc(tradeRef);
      if (!tradeSnap.exists()) return;
      
      const tradeData = tradeSnap.data();
      if (tradeData.status !== 'pending') return;

      const senderRef = doc(db, 'users', tradeData.senderId);
      const receiverRef = doc(db, 'users', tradeData.receiverId);

      const senderSnap = await getDoc(senderRef);
      const receiverSnap = await getDoc(receiverRef);

      if (!senderSnap.exists() || !receiverSnap.exists()) return;

      const senderData = senderSnap.data() as UserProfile;
      const receiverData = receiverSnap.data() as UserProfile;

      
      const newSenderInventory = [
        ...senderData.inventory.filter(item => !tradeData.senderItems.includes(item.id)),
        ...receiverData.inventory.filter(item => tradeData.receiverItems.includes(item.id))
      ];
      const newReceiverInventory = [
        ...receiverData.inventory.filter(item => !tradeData.receiverItems.includes(item.id)),
        ...senderData.inventory.filter(item => tradeData.senderItems.includes(item.id))
      ];

      await updateDoc(senderRef, { inventory: newSenderInventory });
      await updateDoc(receiverRef, { inventory: newReceiverInventory });
      await updateDoc(tradeRef, { status: 'accepted' });

      updateQuestProgress('trade_accept');
      if (tradeData.receiverId === currentUser.uid) {
        setUserProfile({ ...userProfile, inventory: newReceiverInventory });
      }

      playSound('buy');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'trades');
    }
  }, [currentUser, userProfile, updateQuestProgress]);

  const cancelTradeRequest = React.useCallback(async (tradeId: string) => {
    try {
      await updateDoc(doc(db, 'trades', tradeId), { status: 'cancelled' });
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

  const checkAchievements = React.useCallback(async (profile: UserProfile) => {
    try {
      const { ACHIEVEMENTS } = await import('../constants/achievements');
      const unlocked = profile.achievements || [];
      const newAchievements: string[] = [];
      
      let bonusXp = 0;
      let bonusCoins = 0;

      for (const ach of ACHIEVEMENTS) {
        if (unlocked.includes(ach.id)) continue;

        let met = false;
        switch (ach.requirementType) {
          case 'level': met = profile.level >= ach.requirementValue; break;
          case 'lessons': met = (profile.completedLessons?.length || 0) >= ach.requirementValue; break;
          case 'coins': met = profile.coins >= ach.requirementValue; break;
          case 'items_owned': met = (profile.inventory?.length || 0) >= ach.requirementValue; break;
        }

        if (met) {
          newAchievements.push(ach.id);
          toast.success(`ДОСТИЖЕНИЕ: ${ach.name}! +${ach.reward.xp} XP, +${ach.reward.coins} Монет`, { icon: '🏆' });
          bonusXp += ach.reward.xp;
          bonusCoins += ach.reward.coins;
        }
      }

      if (newAchievements.length > 0) {
        const finalAchievements = [...unlocked, ...newAchievements];
        await updateDoc(doc(db, 'users', profile.uid), {
          achievements: finalAchievements,
          xp: increment(bonusXp),
          coins: increment(bonusCoins)
        });
        
        setUserProfile(prev => prev ? { 
           ...prev, 
           achievements: finalAchievements,
           xp: prev.xp + bonusXp,
           coins: (prev.coins || 0) + bonusCoins
        } : null);
      }
    } catch (err) {
      console.error('Achievement check failed:', err);
    }
  }, []);

  const addXp = React.useCallback(async (amount: number) => {
    if (!currentUser || !userProfile) return;
    
    let xpGain = amount;
    if (userProfile.perks?.includes('fast_learner')) {
      xpGain = Math.floor(xpGain * 1.1);
    }

    const newXp = userProfile.xp + xpGain;
    const newLevel = Math.floor(newXp / 250) + 1; 
    
    let coinsReward = Math.floor(xpGain / 2);
    if (userProfile.perks?.includes('golden_touch')) {
      coinsReward = Math.floor(coinsReward * 1.1);
    }
    
    
    if (userProfile.pet && (userProfile.pet.level || 0) >= 20) {
      coinsReward = Math.floor(coinsReward * 1.2);
    }

    if (newLevel > userProfile.level) {
      setLevelUp(newLevel);
      playSound('levelUp');
      
      const spReward = (newLevel - userProfile.level) * 5;
      await updateDoc(doc(db, 'users', currentUser.uid), {
        skillPoints: increment(spReward)
      });
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        xp: increment(amount),
        level: newLevel,
        coins: increment(coinsReward)
      });
      const updatedProfile = { ...userProfile, xp: newXp, level: newLevel, coins: (userProfile.coins || 0) + coinsReward };
      setUserProfile(updatedProfile);
      updateQuestProgress('gain_xp', amount);
      await checkAchievements(updatedProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  }, [currentUser, userProfile, updateQuestProgress, checkAchievements]);

  const addCoins = React.useCallback(async (amount: number) => {
    if (!currentUser || !userProfile) return;
    
    let finalAmount = amount;
    if (userProfile.pet && (userProfile.pet.level || 0) >= 20) {
      finalAmount = Math.floor(amount * 1.2);
      if (finalAmount > amount) {
        toast.success(`Магнит монет активирован! +${finalAmount - amount} бонусных монет`, { icon: '💰' });
      }
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        coins: increment(finalAmount)
      });
      const updatedProfile = { ...userProfile, coins: (userProfile.coins || 0) + finalAmount };
      setUserProfile(updatedProfile);
      updateQuestProgress('earn_coins', amount);
      await checkAchievements(updatedProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  }, [currentUser, userProfile, updateQuestProgress, checkAchievements]);

  const subtractCoins = React.useCallback(async (amount: number) => {
    if (!currentUser || !userProfile) return;
    try {
      const newCoins = Math.max(0, (userProfile.coins || 0) - amount);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        coins: newCoins
      });
      setUserProfile({ ...userProfile, coins: newCoins });
      playSound('error');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  }, [currentUser, userProfile]);

  const subtractXp = React.useCallback(async (amount: number) => {
    if (!currentUser || !userProfile) return;
    try {
      const newXp = Math.max(0, userProfile.xp - amount);
      const newLevel = Math.floor(newXp / 250) + 1;
      await updateDoc(doc(db, 'users', currentUser.uid), {
        xp: newXp,
        level: newLevel
      });
      setUserProfile({ ...userProfile, xp: newXp, level: newLevel });
      playSound('error');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  }, [currentUser, userProfile]);

  const buyItem = React.useCallback(async (itemId: string, price: number) => {
    if (!currentUser || !userProfile) return false;
    if ((userProfile.coins || 0) < price) {
      playSound('error');
      return false;
    }
    
    const item = ALL_ITEMS.find(i => i.id === itemId);
    if (!item) return false;

    const newItem: InventoryItem = {
      id: `${itemId}_${Date.now()}`,
      itemId: itemId,
      name: item.name,
      acquiredAt: Date.now()
    };

    try {
      const updatedInventory = [...(userProfile.inventory || []), newItem];
      await updateDoc(doc(db, 'users', currentUser.uid), {
        coins: increment(-price),
        inventory: updatedInventory
      });
      const updatedProfile = { 
        ...userProfile, 
        coins: userProfile.coins - price,
        inventory: updatedInventory
      };
      setUserProfile(updatedProfile);
      playSound('buy');
      await checkAchievements(updatedProfile);
      return true;
    } catch (error) {
      playSound('error');
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      return false;
    }
  }, [currentUser, userProfile, checkAchievements]);

  const quickSellItem = React.useCallback(async (inventoryId: string) => {
    if (!currentUser || !userProfile) return false;
    if (!userProfile.inventory?.some(item => item.id === inventoryId)) return false;

    
    const sellPrice = 100; 
    try {
      const updatedInventory = userProfile.inventory.filter(item => item.id !== inventoryId);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        coins: increment(sellPrice),
        inventory: updatedInventory
      });
      setUserProfile({
        ...userProfile,
        coins: (userProfile.coins || 0) + sellPrice,
        inventory: updatedInventory
      });
      updateQuestProgress('sell_item');
      updateQuestProgress('earn_coins', sellPrice);
      playSound('success');
      return true;
    } catch (error) {
      playSound('error');
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      return false;
    }
  }, [currentUser, userProfile, updateQuestProgress]);

  const listMarketplaceItem = React.useCallback(async (inventoryId: string, price: number) => {
    if (!currentUser || !userProfile) return false;
    const itemToSell = userProfile.inventory?.find(item => item.id === inventoryId);
    if (!itemToSell) return false;

    try {
      
      const updatedInventory = userProfile.inventory.filter(item => item.id !== inventoryId);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        inventory: updatedInventory
      });
      
      
      await addDoc(collection(db, 'marketplace'), {
        sellerId: currentUser.uid,
        sellerName: userProfile.username,
        itemId: itemToSell.itemId,
        itemName: itemToSell.name,
        price,
        createdAt: serverTimestamp()
      });

      setUserProfile({
        ...userProfile,
        inventory: updatedInventory
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
    if ((userProfile.coins || 0) < listing.price) return false;

    const newItem: InventoryItem = {
      id: `${listing.itemId}_${Date.now()}`,
      itemId: listing.itemId,
      name: listing.itemName,
      acquiredAt: Date.now()
    };

    try {
      
      const updatedInventory = [...(userProfile.inventory || []), newItem];
      await updateDoc(doc(db, 'users', currentUser.uid), {
        coins: increment(-listing.price),
        inventory: updatedInventory
      });

      
      await updateDoc(doc(db, 'users', listing.sellerId), {
        coins: increment(listing.price)
      });

      
      await deleteDoc(doc(db, 'marketplace', listing.id));

      setUserProfile({
        ...userProfile,
        coins: (userProfile.coins || 0) - listing.price,
        inventory: updatedInventory
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

    let xpGain = xpReward;
    if (userProfile.perks?.includes('fast_learner')) {
      xpGain = Math.floor(xpGain * 1.1);
    }

    const newXp = userProfile.xp + xpGain;
    const newLevel = Math.floor(newXp / 250) + 1;
    const newCompletedLessons = [...userProfile.completedLessons, lessonId];
    
    let coinsGain = xpGain;
    if (userProfile.perks?.includes('golden_touch')) {
      coinsGain = Math.floor(coinsGain * 1.1);
    }

    if (newLevel > userProfile.level) {
      setLevelUp(newLevel);
      playSound('levelUp');
    } else {
      playSound('success');
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        xp: increment(xpGain),
        level: newLevel,
        completedLessons: newCompletedLessons,
        coins: increment(coinsGain)
      });
      setUserProfile({ 
        ...userProfile, 
        xp: newXp, 
        level: newLevel,
        completedLessons: newCompletedLessons,
        coins: (userProfile.coins || 0) + coinsGain
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  }, [currentUser, userProfile]);

  const updateProfile = React.useCallback(async (data: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), data);
      setUserProfile({ ...userProfile, ...data });
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

    let rewardXp = 50;
    let rewardCoins = 25;

    if (userProfile.perks?.includes('fast_learner')) {
      rewardXp = Math.floor(rewardXp * 1.1);
    }
    if (userProfile.perks?.includes('golden_touch')) {
      rewardCoins = Math.floor(rewardCoins * 1.1);
    }
    const now = new Date();
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        xp: increment(rewardXp),
        coins: increment(rewardCoins),
        lastDailyReward: serverTimestamp()
      });
      
      const newXp = userProfile.xp + rewardXp;
      const newLevel = Math.floor(newXp / 250) + 1;
      
      if (newLevel > userProfile.level) {
        setLevelUp(newLevel);
        playSound('levelUp');
      } else {
        playSound('success');
      }

      setUserProfile({ 
        ...userProfile, 
        xp: newXp, 
        level: newLevel,
        coins: (userProfile.coins || 0) + rewardCoins,
        lastDailyReward: { toDate: () => now } 
      });
      toast.success(`Ежедневная награда получена! +${rewardXp} XP, +${rewardCoins} монет 🎁`);
      return true;
    } catch (error: any) {
      playSound('error');
      toast.error(`Ошибка при получении награды: ${error?.message || 'Попробуйте снова'}`);
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
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
    const today = new Date().toDateString();
    const fullId = `${today}_${challengeId}`;
    
    if (userProfile.completedDailyChallenges?.includes(fullId)) return;

    try {
      const updatedChallenges = [...(userProfile.completedDailyChallenges || []), fullId];
      await updateDoc(doc(db, 'users', currentUser.uid), {
        completedDailyChallenges: updatedChallenges,
        xp: increment(reward.xp),
        coins: increment(reward.coins)
      });
      
      setUserProfile({
        ...userProfile,
        completedDailyChallenges: updatedChallenges,
        xp: userProfile.xp + reward.xp,
        coins: (userProfile.coins || 0) + reward.coins
      });
      
      playSound('success');
      toast.success(`Испытание пройдено! +${reward.xp} XP, +${reward.coins} монет`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
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

  const useItem = React.useCallback(async (inventoryId: string) => {
    if (!userProfile || !currentUser) return;
    
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
    }
  }, [userProfile, currentUser, updateQuestProgress, updateProfile]);

  const value = React.useMemo(() => ({
    currentUser,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    addXp,
    addCoins,
    subtractCoins,
    subtractXp,
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
    performanceSettings,
    setLowPerfMode,
    adminCompleteQuest,
    adminCompleteAllQuests,
  }), [
    currentUser, userProfile, loading, login, register, loginWithGoogle, logout,
    addXp, addCoins, subtractCoins, subtractXp, completeLesson, updateProfile,
    claimDailyReward, buyItem, quickSellItem, listMarketplaceItem, buyMarketplaceItem,
    getMarketplaceListings, isAdmin, adminAddCoins, adminUpdateUserStats,
    adminGiveItem, adminCompleteLesson, adminUnlockAllLessons, adminSetLevel,
    adminMaxOut, adminGiveCoins, adminSetStats, sendTradeRequest, acceptTradeRequest,
    cancelTradeRequest, getTradeRequests, searchUsers, updateQuestProgress,
    levelUp, resetLevelUp, calculateRank, canClaimReward, lastCodeResult,
    currentCode, currentChallenge, completeDailyChallenge, adminSpawnBoss,
    saveSubmission, getSubmissions, useItem, 
    performanceSettings, setLowPerfMode,
    adminCompleteQuest, adminCompleteAllQuests
  ]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
