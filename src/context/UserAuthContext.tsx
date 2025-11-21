import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone: string;
  address: string;
  points: number;
  created_at: string;
  updated_at: string;
}

interface UserAuthContextType {
  user: UserProfile | null;
  authUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, username: string, full_name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | null>(null);

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = async (userId: string, firebaseUser?: any) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (userDoc.exists()) {
        setUser(userDoc.data() as UserProfile);
      } else {
        console.error('User not found in users collection - possibly an admin account');
        setUser(null);
      }
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    if (authUser) {
      await loadUserProfile(authUser.uid, authUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        await loadUserProfile(firebaseUser.uid, firebaseUser);
      } else {
        setUser(null);
        setAuthUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, username: string, full_name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      const userProfile: UserProfile = {
        id: userId,
        email,
        username,
        full_name,
        phone: '',
        address: '',
        points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', userId), userProfile);
      await loadUserProfile(userId);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi kesalahan saat registrasi' };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        return { success: false, error: 'Akun ini bukan user biasa. Silakan login melalui laman admin.' };
      }

      setAuthUser(userCredential.user);
      setUser(userDoc.data() as UserProfile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi kesalahan saat login' };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setAuthUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!authUser) {
        return { success: false, error: 'User tidak ditemukan' };
      }

      await updateDoc(doc(db, 'users', authUser.uid), {
        ...data,
        updated_at: new Date().toISOString(),
      });

      await loadUserProfile(authUser.uid);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal memperbarui profil' };
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        authUser,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within UserAuthProvider');
  }
  return context;
};
