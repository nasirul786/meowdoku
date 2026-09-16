import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    if (process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'mock-project-id',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'mock@mock.com',
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // In development or build environments where secrets aren't available, we fallback to default behavior
      // This will throw if actually used to query, but allows build compilation to pass
      initializeApp({
        projectId: 'demo-project'
      });
    }
  } catch (error) {
    console.warn('Firebase Admin mock initialization fallback. Using default App fallback.', error);
    initializeApp({ projectId: 'demo-project' });
  }
}

const app = getApp();
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
