/**
 * DemoAuthOverride — Re-provides AuthContext with demo user identity.
 * When wrapped around production components, they resolve effectiveUserId
 * to the demo contractor instead of the logged-in admin.
 */
import React, { createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_USER_ID } from '@/contexts/DemoContext';

// We need to re-export the AuthContext type to override it
// Since AuthContext is not directly exported, we create a parallel provider
// that wraps children and provides a modified useAuth via a separate context

interface DemoAuthContextType {
  isDemoAuthActive: boolean;
  demoEffectiveUserId: string;
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

export const useDemoAuth = () => useContext(DemoAuthContext);

/**
 * This provider wraps production components to signal that they should
 * use DEMO_USER_ID as their effectiveUserId. Components that call useAuth()
 * still get the real admin user, but the effectiveUserId is overridden.
 */
export const DemoAuthOverride: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DemoAuthContext.Provider value={{ isDemoAuthActive: true, demoEffectiveUserId: DEMO_USER_ID }}>
      {children}
    </DemoAuthContext.Provider>
  );
};
