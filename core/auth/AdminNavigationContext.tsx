import { router } from 'expo-router';
import { createContext, useContext } from 'react';

// Navigation context for handling back actions and tab navigation
interface AdminNavigationContextType {
  goBack: () => void;
  setActiveTab: (tab: AdminTab) => void;
  activeTab: AdminTab;
}

const AdminNavigationContext = createContext<AdminNavigationContextType>({
  goBack: () => router.replace('/'),
  setActiveTab: () => {},
  activeTab: 'dashboard',
});

export const useAdminNavigation = () => useContext(AdminNavigationContext);

export type AdminTab = 'dashboard' | 'orders' | 'products' | 'delivery' | 'profile' | 'users';

export { AdminNavigationContext };
