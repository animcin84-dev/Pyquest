import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { postAuthenticated } from './serverApi';

export interface Message {
  id?: string;
  senderId: string;
  text: string;
  timestamp: any;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: any;
  unreadCount?: Record<string, number>;
}

export const ChatService = {
  
  async getOrCreateChat(uid1: string, uid2: string): Promise<string> {
    void uid1;
    const result = await postAuthenticated<{ chatId: string }>('/chats/direct', { recipientId: uid2 });
    return result.chatId;
  },

  
  async sendMessage(chatId: string, senderId: string, text: string) {
    void senderId;
    await postAuthenticated('/chats/messages', { chatId, text });
  },

  
  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      callback(messages);
    });
  },

  
  subscribeToUserChats(uid: string, callback: (chats: Chat[]) => void) {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('participants', 'array-contains', uid),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      callback(chats);
    });
  }
};
