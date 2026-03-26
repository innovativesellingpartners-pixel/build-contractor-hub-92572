import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  business_email?: string;
  website_url?: string;
  license_number?: string;
  trade?: string;
  brand_primary_color?: string;
  brand_secondary_color?: string;
  brand_accent_color?: string;
  default_sales_tax_rate?: number;
  default_deposit_percent?: number;
  default_warranty_years?: number;
  zelle_email?: string;
  zelle_phone?: string;
  ach_instructions?: string;
  accepted_payment_methods?: string[];
  preferred_language?: string;
  parent_owner_id?: string;
  max_team_seats?: number;
  per_seat_price?: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, companyName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  // Team member context
  isTeamMember: boolean;
  ownerProfile: Profile | null;
  teamRole: string | null;
  effectiveUserId: string | null;
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
  const signingOutRef = useRef(false);

  // Team member state
  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null);
  const [teamRole, setTeamRole] = useState<string | null>(null);

  const isTeamMember = !!profile?.parent_owner_id;
  const effectiveUserId = profile?.parent_owner_id || user?.id || null;

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

      // If this user is a team member, fetch owner's profile and team role
      if (data?.parent_owner_id) {
        // Fetch owner profile
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.parent_owner_id)
          .maybeSingle();
        setOwnerProfile(ownerData);

        // Fetch team role
        const { data: memberData } = await supabase
          .from('team_members')
          .select('role, status')
          .eq('member_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (memberData) {
          setTeamRole(memberData.role);

          // If suspended, sign out
          if (memberData.status === 'suspended') {
            toast.error('Your account has been suspended. Contact your administrator.');
            await supabase.auth.signOut({ scope: 'local' });
            return;
          }
        } else {
          // No active membership found — might be removed
          setTeamRole(null);
        }
      } else {
        setOwnerProfile(null);
        setTeamRole(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    
    if (import.meta.env.DEV) console.log('Auth initialization:', { isPWA, hasLocalStorage: !!window.localStorage });

    let authStateInitialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        authStateInitialized = true;
        if (import.meta.env.DEV) console.log('Auth state changed:', event, { hasSession: !!session, hasUser: !!session?.user });
        
        if (signingOutRef.current) {
          if (import.meta.env.DEV) console.log('Sign-out in progress, skipping auth state update');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setOwnerProfile(null);
          setTeamRole(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }

      if (authStateInitialized) {
        if (import.meta.env.DEV) console.log('Initial session check skipped (already initialized by auth event)');
        return;
      }

      if (import.meta.env.DEV) console.log('Initial session check:', { hasSession: !!session, hasUser: !!session?.user });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setOwnerProfile(null);
        setTeamRole(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkForUpdates = async () => {
    if ('serviceWorker' in navigator && localStorage.getItem('sw-update-ready') === 'true') {
      if (import.meta.env.DEV) console.log('Service worker update detected, reloading...');
      localStorage.removeItem('sw-update-ready');
      
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        setTimeout(() => window.location.reload(), 100);
      }
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
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
    if (import.meta.env.DEV) console.log('Signing out...');
    
    signingOutRef.current = true;
    setLoading(true);
    
    setUser(null);
    setSession(null);
    setProfile(null);
    setOwnerProfile(null);
    setTeamRole(null);
    localStorage.removeItem('ct1-auth-token');
    localStorage.removeItem('rememberMe');
    
    if (import.meta.env.DEV) console.log('Sign out complete, redirecting to /auth...');
    window.location.replace('/auth');
    
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn('Sign out API call failed (session may already be expired):', err);
    }
    
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

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
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
    refreshProfile,
    // Team member context
    isTeamMember,
    ownerProfile,
    teamRole,
    effectiveUserId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
