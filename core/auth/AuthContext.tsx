import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { FIREBASE_DB } from '../firebase/firebase';
import { userService } from '../services/userService';
import { SessionManager, UserSession } from '../session/sessionManager';

interface AuthContextType {
  user: null;
  userSession: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userSession: UserSession) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userSession: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monitor password changes for delivery agents and sub-admins
  useEffect(() => {
    if (!userSession?.uid || (userSession.role !== 'delivery' && userSession.role !== 'sub-admin')) return;

    const userRef = doc(FIREBASE_DB, 'users', userSession.uid);
    const unsubscribe = onSnapshot(userRef, async (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const currentPasswordChangedAt = userData.passwordChangedAt;
        const sessionPasswordChangedAt = userSession.passwordChangedAt;

        // If password was changed after the session was created, force logout
        if (currentPasswordChangedAt && 
            (!sessionPasswordChangedAt || currentPasswordChangedAt > sessionPasswordChangedAt)) {
          await handleLogout();
        }
      }
    }, (error) => {
      console.error('Error monitoring password changes:', error);
    });

    return () => unsubscribe();
  }, [userSession?.uid, userSession?.role]);

  // Initialize auth state on app start (SessionManager only)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const hasValidSession = await SessionManager.hasValidSession();
        if (hasValidSession) {
          const existingSession = await SessionManager.getSession();
          if (existingSession) {
            setUserSession(existingSession);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const handleLogin = async (session: UserSession) => {
    try {
      // For delivery agents, ensure passwordChangedAt is included
      if (session.role === 'delivery' && !session.passwordChangedAt) {
        try {
          const userData = await userService.getUserById(session.uid);
          if (userData) {
            session.passwordChangedAt = userData.passwordChangedAt;
          }
        } catch (error) {
          console.warn('Could not fetch passwordChangedAt for delivery agent:', error);
        }
      }
      
      await SessionManager.saveSession(session);
      setUserSession(session);
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      // Clear session from AsyncStorage
      await SessionManager.clearSession();
      setUserSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user: null,
    userSession,
    isLoading,
    isAuthenticated: !!userSession,
    login: handleLogin,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};