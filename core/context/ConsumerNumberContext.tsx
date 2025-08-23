import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { useAuth } from '../auth/AuthContext';

interface ConsumerNumberContextType {
  consumerNumber: string;
  setConsumerNumber: (consumerNumber: string) => void;
  updateConsumerNumber: (consumerNumber: string) => Promise<void>;
  isLoading: boolean;
  refreshConsumerNumber: () => Promise<void>;
}

const ConsumerNumberContext = createContext<ConsumerNumberContextType | undefined>(undefined);

export const useConsumerNumber = () => {
  const context = useContext(ConsumerNumberContext);
  if (context === undefined) {
    throw new Error('useConsumerNumber must be used within a ConsumerNumberProvider');
  }
  return context;
};

interface ConsumerNumberProviderProps {
  children: React.ReactNode;
}

export const ConsumerNumberProvider: React.FC<ConsumerNumberProviderProps> = ({ children }) => {
  const [consumerNumber, setConsumerNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { userSession } = useAuth();

  // Load consumer number from database
  const loadConsumerNumber = async () => {
    if (!userSession?.uid) {
      setIsLoading(false);
      return;
    }

    try {
      const user = await userService.getUserById(userSession.uid);
      if (user?.consumerNumber) {
        setConsumerNumber(user.consumerNumber);
      } else {
        setConsumerNumber('');
      }
    } catch (error) {
      console.error('Error loading consumer number:', error);
      setConsumerNumber('');
    } finally {
      setIsLoading(false);
    }
  };

  // Update consumer number in database and local state
  const updateConsumerNumber = async (newConsumerNumber: string) => {
    if (!userSession?.uid) {
      throw new Error('User not logged in');
    }

    try {
      await userService.updateUser(userSession.uid, { consumerNumber: newConsumerNumber.trim() });
      setConsumerNumber(newConsumerNumber.trim());
    } catch (error) {
      console.error('Error updating consumer number:', error);
      throw error;
    }
  };

  // Refresh consumer number from database
  const refreshConsumerNumber = async () => {
    await loadConsumerNumber();
  };

  // Load consumer number when user session changes
  useEffect(() => {
    loadConsumerNumber();
  }, [userSession?.uid]);

  const value: ConsumerNumberContextType = {
    consumerNumber,
    setConsumerNumber,
    updateConsumerNumber,
    isLoading,
    refreshConsumerNumber,
  };

  return (
    <ConsumerNumberContext.Provider value={value}>
      {children}
    </ConsumerNumberContext.Provider>
  );
};
