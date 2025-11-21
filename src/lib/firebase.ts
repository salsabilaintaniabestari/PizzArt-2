import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCCfwMekxBh4Kd3-4F8aaLl3SQ1CQY_dKc",
  authDomain: "pizzart-1.firebaseapp.com",
  databaseURL: "https://pizzart-1.firebaseio.com",
  projectId: "pizzart-1",
  storageBucket: "pizzart-1.firebasestorage.app",
  messagingSenderId: "168059122581",
  appId: "1:168059122581:web:07a6a80fc43d22a1267c9c",
  measurementId: "G-6QJGJMKT0Y"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserSessionPersistence).catch(error => {
  console.error('Error setting auth persistence:', error);
});
