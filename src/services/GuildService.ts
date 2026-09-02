import { collection, doc, setDoc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, query, where, deleteDoc, serverTimestamp, increment, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { playSound } from '../utils/sounds';
import { toast } from 'sonner';

export interface GuildMember {
  uid: string;
  username: string;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  joinedAt: number;
}

export interface Guild {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  leaderId: string;
  members: GuildMember[];
  memberCount: number;
  level: number;
  xp: number;
  perks: string[];
  createdAt: any;
  isPublic: boolean;
  requiredLevel: number;
}

export const GuildService = {
  createGuild: async (name: string, description: string, icon: string, color: string, requiredLevel: number = 1): Promise<string> => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.data()?.guildId) {
       throw new Error('Вы уже состоите в гильдии.');
    }

    const guildRef = doc(collection(db, 'guilds'));
    const newGuild: Guild = {
      id: guildRef.id,
      name,
      description,
      icon,
      color,
      leaderId: auth.currentUser.uid,
      members: [{
        uid: auth.currentUser.uid,
        username: auth.currentUser.displayName || 'Unknown',
        role: 'leader',
        contribution: 0,
        joinedAt: Date.now()
      }],
      memberCount: 1,
      level: 1,
      xp: 0,
      perks: [],
      createdAt: serverTimestamp(),
      isPublic: true,
      requiredLevel
    };

    await setDoc(guildRef, newGuild);
    await updateDoc(userRef, {
      guildId: guildRef.id,
      guildRole: 'leader'
    });

    return guildRef.id;
  },

  joinGuild: async (guildId: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('Not authenticated');

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    if (userData?.guildId) {
      throw new Error('Вы уже состоите в гильдии.');
    }

    const guildRef = doc(db, 'guilds', guildId);
    const guildDoc = await getDoc(guildRef);

    if (!guildDoc.exists()) throw new Error('Гильдия не найдена.');

    const guildData = guildDoc.data() as Guild;
    
    if (userData && guildData.requiredLevel > userData.level) {
       throw new Error(`Требуется ${guildData.requiredLevel} уровень.`);
    }

    if (guildData.memberCount >= 50) {
       throw new Error('Гильдия заполнена.');
    }

    const newMember: GuildMember = {
      uid: auth.currentUser.uid,
      username: auth.currentUser.displayName || 'Unknown',
      role: 'member',
      contribution: 0,
      joinedAt: Date.now()
    };

    await updateDoc(guildRef, {
      members: arrayUnion(newMember),
      memberCount: increment(1)
    });

    await updateDoc(userRef, {
      guildId,
      guildRole: 'member'
    });
  },

  leaveGuild: async (guildId: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('Not authenticated');

    const guildRef = doc(db, 'guilds', guildId);
    const guildDoc = await getDoc(guildRef);
    if (!guildDoc.exists()) throw new Error('Guild not found');

    const guildData = guildDoc.data() as Guild;
    const member = guildData.members.find(m => m.uid === auth.currentUser?.uid);

    if (!member) throw new Error('You are not in this guild');

    if (member.role === 'leader' && guildData.memberCount > 1) {
      throw new Error('Лидер не может покинуть гильдию. Сначала передайте лидерство.');
    }

    if (member.role === 'leader' && guildData.memberCount === 1) {
      await deleteDoc(guildRef);
    } else {
      await updateDoc(guildRef, {
        members: arrayRemove(member),
        memberCount: increment(-1)
      });
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      guildId: null,
      guildRole: null
    });
  },

  addGuildXP: async (guildId: string, amount: number): Promise<void> => {
    const guildRef = doc(db, 'guilds', guildId);
    await updateDoc(guildRef, {
      xp: increment(amount)
    });
  },

  getAllGuilds: async (): Promise<Guild[]> => {
    const snap = await getDocs(collection(db, 'guilds'));
    return snap.docs.map(doc => doc.data() as Guild);
  },

  getGuild: async (id: string): Promise<Guild | null> => {
    const snap = await getDoc(doc(db, 'guilds', id));
    if (snap.exists()) return snap.data() as Guild;
    return null;
  },

  subscribeToGuild: (id: string, callback: (guild: Guild) => void) => {
    return onSnapshot(doc(db, 'guilds', id), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as Guild);
      }
    });
  },

  sendGuildMessage: async (guildId: string, text: string): Promise<void> => {
    if (!auth.currentUser) return;
    const msgRef = doc(collection(db, 'guilds', guildId, 'messages'));
    await setDoc(msgRef, {
      id: msgRef.id,
      text,
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || 'Unknown',
      timestamp: serverTimestamp()
    });
  },

  subscribeToGuildChat: (guildId: string, callback: (messages: any[]) => void) => {
    const q = query(
      collection(db, 'guilds', guildId, 'messages'), 
      orderBy('timestamp', 'desc'), 
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(msgs.reverse());
    });
  },

  seedGuilds: async () => {
    const fakeGuilds = [
      { name: "Bit Knights", description: "Орден самых точных отступов и чистейшего кода.", icon: "⚔️", color: "blue", requiredLevel: 5 },
      { name: "Pythonic Order", description: "Последователи Дзена Питона. Импортируем только мудрость.", icon: "🐍", color: "emerald", requiredLevel: 10 },
      { name: "Async Wizards", description: "Маги асинхронности. Мы не ждем никого, кроме колбэков.", icon: "purple", requiredLevel: 15 },
      { name: "Zero Bug Squad", description: "Наш код идеален. По крайней мере, так говорит документация.", icon: "🐞", color: "red", requiredLevel: 3 },
      { name: "Deep Learning AI", description: "Обучаем будущее, эпоха за эпохой. Веса под контролем.", icon: "🧠", color: "indigo", requiredLevel: 20 },
      { name: "Code Drifters", description: "Быстрый код, быстрые деплои. Дрифтим на проде без страха.", icon: "🏎️", color: "orange", requiredLevel: 7 },
      { name: "Cyber Sentinels", description: "Защитники сервера от Глобального Босса. Вирусы уйдут ни с чем.", icon: "🤖", color: "cyan", requiredLevel: 12 }
    ];

    let count = 0;
    for (const data of fakeGuilds) {
      const guildRef = doc(collection(db, 'guilds'));
      const newGuild: Guild = {
        id: guildRef.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        leaderId: "SYSTEM",
        members: [{
          uid: "SYSTEM",
          username: "Archivator",
          role: 'leader',
          contribution: 9999,
          joinedAt: Date.now()
        }],
        memberCount: 1,
        level: Math.floor(Math.random() * 10) + 5,
        xp: Math.floor(Math.random() * 5000),
        perks: [],
        createdAt: serverTimestamp(),
        isPublic: true,
        requiredLevel: data.requiredLevel
      };
      await setDoc(guildRef, newGuild);
      count++;
    }
    return count;
  }
};
