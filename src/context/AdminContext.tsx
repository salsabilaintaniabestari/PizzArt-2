import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AdminUser {
  id: string;
  email: string;
  username: string;
}

interface AdminContextType {
  adminUser: AdminUser | null;
  authUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = async (): Promise<boolean> => {
    const user = auth.currentUser;

    if (!user) {
      return false;
    }

    try {
      const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));

      if (adminDoc.exists()) {
        setAdminUser(adminDoc.data() as AdminUser);
        setAuthUser(user);
        return true;
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }

    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isAdmin = await checkAdminStatus();
        if (!isAdmin) {
          await signOut(auth);
          setAdminUser(null);
          setAuthUser(null);
        }
      } else {
        setAdminUser(null);
        setAuthUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));

      if (!adminDoc.exists()) {
        await signOut(auth);
        return { success: false, error: 'Akun ini bukan admin' };
      }

      setAdminUser(adminDoc.data() as AdminUser);
      setAuthUser(user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi kesalahan saat login' };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setAdminUser(null);
    setAuthUser(null);
  };

  return (
    <AdminContext.Provider
      value={{
        adminUser,
        authUser,
        isLoading,
        login,
        logout,
        checkAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
