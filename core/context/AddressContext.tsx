import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { useAuth } from '../auth/AuthContext';

interface AddressContextType {
  address: string;
  setAddress: (address: string) => void;
  updateAddress: (address: string) => Promise<void>;
  isLoading: boolean;
  refreshAddress: () => Promise<void>;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};

interface AddressProviderProps {
  children: React.ReactNode;
}

export const AddressProvider: React.FC<AddressProviderProps> = ({ children }) => {
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { userSession } = useAuth();

  // Load address from database
  const loadAddress = async () => {
    if (!userSession?.uid) {
      setIsLoading(false);
      return;
    }

    try {
      const user = await userService.getUserById(userSession.uid);
      if (user?.address) {
        setAddress(user.address);
      } else {
        setAddress('');
      }
    } catch (error) {
      console.error('Error loading address:', error);
      setAddress('');
    } finally {
      setIsLoading(false);
    }
  };

  // Update address in database and local state
  const updateAddress = async (newAddress: string) => {
    if (!userSession?.uid) {
      throw new Error('User not logged in');
    }

    try {
      await userService.updateUser(userSession.uid, { address: newAddress.trim() });
      setAddress(newAddress.trim());
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  };

  // Refresh address from database
  const refreshAddress = async () => {
    await loadAddress();
  };

  // Load address when user session changes
  useEffect(() => {
    loadAddress();
  }, [userSession?.uid]);

  const value: AddressContextType = {
    address,
    setAddress,
    updateAddress,
    isLoading,
    refreshAddress,
  };

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
};
