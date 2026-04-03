import React, { createContext, useContext } from 'react';

// Fixed demo user ID — this is the user_id of the seeded demo contractor
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

interface DemoContextType {
  isDemoMode: boolean;
  demoUserId: string;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemoContext = () => {
  return useContext(DemoContext);
};

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DemoContext.Provider value={{ isDemoMode: true, demoUserId: DEMO_USER_ID }}>
      {children}
    </DemoContext.Provider>
  );
};
