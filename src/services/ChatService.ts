import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  setDoc, 
  doc, 
  getDocs,
  limit,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

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
    const participants = [uid1, uid2].sort();
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', '==', participants));
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    
    const newChatRef = await addDoc(chatsRef, {
      participants,
      updatedAt: serverTimestamp(),
      lastMessage: '',
      unreadCount: {
        [uid1]: 0,
        [uid2]: 0
      }
    });
    return newChatRef.id;
  },

  
  async sendMessage(chatId: string, senderId: string, text: string) {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      senderId,
      text,
      timestamp: serverTimestamp()
    });

    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      updatedAt: serverTimestamp()
    });
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
