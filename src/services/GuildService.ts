import { collection, doc, getDoc, getDocs, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { postAuthenticated } from './serverApi';

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
    void color;
    const result = await postAuthenticated<{ guild: Guild }>('/guilds/create', { name, description, icon, requiredLevel });
    return result.guild.id;
  },

  joinGuild: async (guildId: string): Promise<void> => {
    await postAuthenticated('/guilds/join', { guildId });
  },

  leaveGuild: async (guildId: string): Promise<void> => {
    await postAuthenticated('/guilds/leave', { guildId });
  },

  addGuildXP: async (guildId: string, amount: number): Promise<void> => {
    void guildId;
    void amount;
    throw new Error('Guild XP must be granted by a verified server event.');
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
    await postAuthenticated('/guilds/messages', { guildId, text });
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
  }
};
