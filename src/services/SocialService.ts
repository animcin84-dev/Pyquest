import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, serverTimestamp, arrayUnion, arrayRemove, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toast } from 'sonner';

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

    
    const myDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const myData = myDoc.data();
    if (myData?.friends?.includes(targetUserId)) throw new Error('Вы уже друзья');

    
    const reqQ1 = query(collection(db, 'friend_requests'), 
      where('senderId', '==', auth.currentUser.uid), 
      where('receiverId', '==', targetUserId),
      where('status', '==', 'pending')
    );
    const reqSnap1 = await getDocs(reqQ1);
    if (!reqSnap1.empty) throw new Error('Запрос уже отправлен');

    const reqQ2 = query(collection(db, 'friend_requests'), 
      where('senderId', '==', targetUserId), 
      where('receiverId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );
    const reqSnap2 = await getDocs(reqQ2);
    if (!reqSnap2.empty) throw new Error('Этот пользователь уже отправил вам запрос');

    
    const newReqRef = doc(collection(db, 'friend_requests'));
    await setDoc(newReqRef, {
      id: newReqRef.id,
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || myData?.username || 'Unknown',
      receiverId: targetUserId,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    toast.success(`Запрос в друзья пользователю ${targetUsername} отправлен!`);
  },

  acceptRequest: async (requestId: string, senderId: string) => {
    if (!auth.currentUser) return;
    const reqRef = doc(db, 'friend_requests', requestId);
    await updateDoc(reqRef, { status: 'accepted' });

    
    const myRef = doc(db, 'users', auth.currentUser.uid);
    const senderRef = doc(db, 'users', senderId);

    await updateDoc(myRef, { friends: arrayUnion(senderId) });
    await updateDoc(senderRef, { friends: arrayUnion(auth.currentUser.uid) });
    
    toast.success('Заявка в друзья принята!');
  },

  declineRequest: async (requestId: string) => {
    const reqRef = doc(db, 'friend_requests', requestId);
    await updateDoc(reqRef, { status: 'declined' });
  },

  removeFriend: async (friendId: string) => {
    if (!auth.currentUser) return;
    const myRef = doc(db, 'users', auth.currentUser.uid);
    const friendRef = doc(db, 'users', friendId);

    await updateDoc(myRef, { friends: arrayRemove(friendId) });
    await updateDoc(friendRef, { friends: arrayRemove(auth.currentUser.uid) });
    
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
