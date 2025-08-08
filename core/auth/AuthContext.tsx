import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { FIREBASE_AUTH } from '../firebase/firebase';
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

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing valid session in AsyncStorage
        const hasValidSession = await SessionManager.hasValidSession();
        if (hasValidSession) {
          const existingSession = await SessionManager.getSession();
          if (existingSession) {
            console.log('Found valid existing session:', existingSession.email);
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
      console.log('Firebase auth state changed:', firebaseUser ? 'User authenticated' : 'User not authenticated');
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
              email: firebaseUser.email || userData.email,
              displayName: firebaseUser.displayName || userData.displayName,
              role: userData.role || 'customer',
              sessionToken: SessionManager.generateSessionToken(),
              loginTime: Date.now(),
              permissions,
            };
            
            await SessionManager.saveSession(newSession);
            setUserSession(newSession);
            console.log('Created session from Firebase auth for:', newSession.email, 'Role:', newSession.role);
          }
        } catch (error) {
          console.error('Error creating session from Firebase user:', error);
        }
      } else if (!firebaseUser && userSession) {
        // Firebase user is null but we have a session, clear the session
        handleLogout();
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (session: UserSession) => {
    try {
      await SessionManager.saveSession(session);
      setUserSession(session);
      console.log('Session saved successfully for:', session.email);
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
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userSession,
    isLoading,
    isAuthenticated: !!(user && userSession),
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