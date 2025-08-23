import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { FIREBASE_AUTH, FIREBASE_DB } from '../firebase/firebase';
import { subAdminService } from '../services/subAdminService';
import { userService } from '../services/userService';
import { SessionManager, UserSession } from '../session/sessionManager';

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
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

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing valid session in AsyncStorage
        const hasValidSession = await SessionManager.hasValidSession();
        if (hasValidSession) {
          const existingSession = await SessionManager.getSession();
          if (existingSession) {
            setUserSession(existingSession);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser && !userSession) {
        // Firebase user is authenticated but we don't have a session
        // This happens when user logs in or when app restarts with authenticated user
        try {
          const userData = await userService.getUserById(firebaseUser.uid);
          
          if (userData) {
            let permissions = undefined;
            
            // If user is a sub-admin, get their permissions
            if (userData.role === 'sub-admin') {
              const subAdminData = await subAdminService.getSubAdminById(firebaseUser.uid);
              if (subAdminData) {
                permissions = subAdminData.permissions;
              }
            }
            
            const newSession: UserSession = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || userData.email || undefined,
              displayName: firebaseUser.displayName || userData.displayName,
              phoneNumber: firebaseUser.phoneNumber || userData.phoneNumber,
              role: userData.role || 'customer',
              sessionToken: SessionManager.generateSessionToken(),
              loginTime: Date.now(),
              expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
              passwordChangedAt: userData.passwordChangedAt || undefined,
              permissions,
            };
            
            await SessionManager.saveSession(newSession);
            setUserSession(newSession);
          }
        } catch (error) {
          console.error('Error creating session from Firebase user:', error);
        }
      } else if (!firebaseUser) {
        // No Firebase user; keep any existing custom session (e.g., phone-based)
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
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
      
      // Sign out from Firebase
      if (user) {
        await signOut(FIREBASE_AUTH);
      }
      
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
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