import { db } from '../firebase/client';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { HexGameProfile } from './types';

// Load User Profile from Firestore
export const loadUserProfile = async (telegramId: string): Promise<HexGameProfile> => {
  const userRef = doc(db, 'users', telegramId, 'hexagonBlockSort', 'profile');
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as HexGameProfile;
  } else {
    // Create new profile
    const defaultProfile: HexGameProfile = {
      telegramId,
      currentLevel: 1,
      totalScore: 0,
      levelsCompleted: 0,
      bestScore: 0,
      premiumThemesUnlocked: ['default'],
      hasRemovedAds: false,
      hints: 3,
      undos: 3,
      shuffles: 3
    };

    await setDoc(userRef, defaultProfile);
    return defaultProfile;
  }
};

// Save User Profile
export const saveUserProfile = async (telegramId: string, updates: Partial<HexGameProfile>): Promise<void> => {
  const userRef = doc(db, 'users', telegramId, 'hexagonBlockSort', 'profile');
  await updateDoc(userRef, updates);
};

// Record a purchase
export const recordPurchase = async (telegramId: string, productId: string, itemType: string): Promise<void> => {
  const purchaseRef = doc(db, 'users', telegramId, 'hexagonSortPurchases', productId);
  await setDoc(purchaseRef, {
    productId,
    itemType,
    purchasedAt: new Date().toISOString()
  });
};
