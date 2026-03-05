import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  company_name?: string;
  contact_name?: string;
  phone?: string;
  business_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  tax_id?: string;
  ct1_contractor_number?: string;
  logo_url?: string;
  subscription_tier?: string;
  training_level?: number;
  // Branding fields
  business_email?: string;
  website_url?: string;
  license_number?: string;
  trade?: string;
  // Brand colors
  brand_primary_color?: string;
  brand_secondary_color?: string;
  brand_accent_color?: string;
  // Estimate defaults
  default_sales_tax_rate?: number;
  default_deposit_percent?: number;
  default_warranty_years?: number;
  // Payment settings
  zelle_email?: string;
  zelle_phone?: string;
  ach_instructions?: string;
  accepted_payment_methods?: string[];
  // Timestamps
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, companyName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    // Check if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    
    console.log('Auth initialization:', { isPWA, hasLocalStorage: !!window.localStorage });

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, { hasSession: !!session, hasUser: !!session?.user });
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching to avoid potential auth deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      console.log('Initial session check:', { hasSession: !!session, hasUser: !!session?.user });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkForUpdates = async () => {
    // Check if there's a service worker update ready
    if ('serviceWorker' in navigator && localStorage.getItem('sw-update-ready') === 'true') {
      console.log('Service worker update detected, reloading...');
      localStorage.removeItem('sw-update-ready');
      
      // Get the waiting service worker and activate it
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        // Reload after a short delay to let the new SW activate
        setTimeout(() => window.location.reload(), 100);
      }
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Store remember me preference and check for updates
    if (!error) {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      // Check for PWA updates after successful login
      await checkForUpdates();
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, companyName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          company_name: companyName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    console.log('Signing out...');
    
    // Set loading to true FIRST to prevent any flash of unauthenticated UI
    setLoading(true);
    
    // Clear all state immediately
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem('ct1-auth-token');
    localStorage.removeItem('rememberMe');
    
    // Sign out from Supabase
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn('Sign out API call failed (session may already be expired):', err);
    }
    
    console.log('Sign out complete, redirecting...');
    
    // Now redirect - loading=true keeps spinner showing until navigation completes
    window.location.replace('https://myct1.com/auth');
    
    try {
      await checkForUpdates();
    } catch {}
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });
      return { error };
    } catch (e: any) {
      return { error: e };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};