import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider useEffect triggered');
    
    // Listen for auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (session?.user) {
          console.log('Setting user from auth state change');
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log('Clearing user from auth state change');
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session:', session);
        
        if (session?.user) {
          console.log('Setting user from initial session');
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log('No initial session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Don't return early - we still want to set loading to false
      } else {
        console.log('Profile fetched:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      // Always set loading to false, regardless of whether profile fetch succeeded
      console.log('Setting loading to false after profile fetch attempt');
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          return { error: { message: 'No profile found for this user. Please contact an administrator.' } };
        }

        if (!profile.active) {
          await supabase.auth.signOut();
          return { error: { message: 'Your account has been deactivated. Please contact an administrator.' } };
        }
      }

      return { error: null };
    } catch (error) {
      return { error: { message: 'An unexpected error occurred. Please try again.' } };
    }
  };

  const signOut = async () => {
    console.log('Signing out');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: profile?.role === 'admin',
    isStaff: profile?.role === 'staff',
  };

  console.log('AuthProvider rendering with value:', value);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
