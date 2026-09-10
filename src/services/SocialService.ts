import { collection, getDocs, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toast } from 'sonner';
import { postAuthenticated } from './serverApi';

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

export const SocialService = {
  
  searchUsersPartial: async (queryText: string) => {
    if (!auth.currentUser || !queryText) return [];
    
    
    const q = query(collection(db, 'users'), limit(500));
    const snap = await getDocs(q);
    
    const lowerQuery = queryText.toLowerCase();
    return snap.docs
      .map(doc => ({ uid: doc.id, ...doc.data() as any }))
      .filter(u => u.uid !== auth.currentUser?.uid && u.username?.toLowerCase().includes(lowerQuery));
  },

  
  sendFriendRequest: async (targetUserId: string, targetUsername: string) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    if (targetUserId === auth.currentUser.uid) throw new Error('Вы не можете добавить себя в друзья');
    await postAuthenticated('/friends/requests', { receiverId: targetUserId });

    toast.success(`Запрос в друзья пользователю ${targetUsername} отправлен!`);
  },

  acceptRequest: async (requestId: string, senderId: string) => {
    void senderId;
    await postAuthenticated('/friends/requests/accept', { requestId });
    toast.success('Заявка в друзья принята!');
  },

  declineRequest: async (requestId: string) => {
    await postAuthenticated('/friends/requests/decline', { requestId });
  },

  removeFriend: async (friendId: string) => {
    await postAuthenticated('/friends/remove', { friendId });
    toast.info('Пользователь удален из друзей.');
  },

  subscribeToIncomingRequests: (callback: (reqs: FriendRequest[]) => void) => {
     if (!auth.currentUser) return () => {};
     const q = query(
       collection(db, 'friend_requests'), 
       where('receiverId', '==', auth.currentUser.uid),
       where('status', '==', 'pending')
     );
     return onSnapshot(q, (snapshot) => {
        const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FriendRequest);
        callback(reqs);
     });
  },

  fetchFriendsProfiles: async (friendIds: string[]) => {
    if (!friendIds || friendIds.length === 0) return [];
    
    const profiles = [];
    for (let i = 0; i < friendIds.length; i += 10) {
      const chunk = friendIds.slice(i, i + 10);
      const q = query(collection(db, 'users'), where('__name__', 'in', chunk));
      const snap = await getDocs(q);
      snap.forEach(doc => profiles.push(doc.data()));
    }
    return profiles;
  }
};
