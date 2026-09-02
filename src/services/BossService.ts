import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment, onSnapshot, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { BOSS_TEMPLATES, BossTemplate } from '../constants/bosses';

export interface GlobalBoss extends BossTemplate {
  active: boolean;
  currentHp: number;
  endsAt: any;
}

export const BossService = {
  subscribeToAllBosses: (callback: (bosses: GlobalBoss[]) => void) => {
    return onSnapshot(collection(db, 'active_bosses'), (snapshot) => {
      const bosses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GlobalBoss));
      callback(bosses);
    });
  },

  dealDamage: async (bossId: string, amount: number) => {
    const bossRef = doc(db, 'active_bosses', bossId);
    await updateDoc(bossRef, {
      currentHp: increment(-amount)
    });
  },

  
  rotateBosses: async () => {
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const startIdx = (weekNumber * 5) % BOSS_TEMPLATES.length;
    const weeklyPool = [];
    
    for (let i = 0; i < 5; i++) {
       weeklyPool.push(BOSS_TEMPLATES[(startIdx + i) % BOSS_TEMPLATES.length]);
    }

    
    const snapshot = await getDocs(collection(db, 'active_bosses'));
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
    }

    
    for (const boss of weeklyPool) {
      await setDoc(doc(db, 'active_bosses', boss.id), {
        ...boss,
        currentHp: boss.maxHp,
        active: true,
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }
  },

  spawnBoss: async (templateId: string) => {
    const template = BOSS_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    await setDoc(doc(db, 'active_bosses', template.id), {
      ...template,
      currentHp: template.maxHp,
      active: true,
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  }
};
