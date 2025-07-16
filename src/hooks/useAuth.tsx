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
  error: string | null;
  retryAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false); // NEW: track if initial session check is done

  // Mounted flag to prevent state updates after unmount
  useEffect(() => {
    let mounted = true;
    return () => {
      mounted = false;
    };
  }, []);

  const retryAuth = () => {
    setLoading(true);
    setError(null);
    getInitialSession();
  };

  // Improved fetchProfile with better error handling and loading management
  const fetchProfile = async (userId: string) => {
    if (!userId) {
      console.error('No userId provided to fetchProfile!');
      if (initialized) setLoading(false);
      return false;
    }
    try {
      console.log('[fetchProfile] Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('[fetchProfile] Error:', error);
        if (initialized) setLoading(false);
        return false;
      }
      if (!data) {
        console.warn('[fetchProfile] No profile data found');
        if (initialized) setLoading(false);
        return false;
      }
      setProfile(data);
      return true;
    } catch (err) {
      console.error('[fetchProfile] Exception:', err);
      if (initialized) setLoading(false);
      return false;
    } finally {
      if (initialized) setLoading(false);
    }
  };

  // Initial session check, only runs once
  const getInitialSession = async () => {
    try {
      console.log('[getInitialSession] Checking for existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const profileSuccess = await fetchProfile(session.user.id);
        if (!profileSuccess) {
          // Profile fetch failed, force sign out
          console.warn('[getInitialSession] Profile fetch failed, signing out.');
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setError('Session was corrupted or invalid. Please log in again.');
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('[getInitialSession] Error:', err);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setError('Session was corrupted or invalid. Please log in again.');
    } finally {
      setInitialized(true);
      setLoading(false);
      console.log('[getInitialSession] Initialization complete.');
    }
  };

  useEffect(() => {
    let mounted = true;
    // Initial session check
    getInitialSession();

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('[onAuthStateChange] Event:', event, 'Session:', session);
        // Only handle events after initial session check is done
        if (!initialized) {
          console.log('[onAuthStateChange] Ignored because not initialized');
          return;
        }
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('signIn called with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('signInWithPassword result:', { data, error });

      if (error) {
        console.error('signIn error:', error);
        return { error };
      }

      if (data.user) {
        console.log('User returned from signIn:', data.user);
        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        console.log('Profile fetch after signIn:', { profile, profileError });

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
      console.error('Unexpected signIn error:', error);
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
    error,
    retryAuth,
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
