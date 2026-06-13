import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'supervisor' | 'staff';

interface Profile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Views accessible per role (sidebar menu + routing guard)
const VIEW_ACCESS: Record<UserRole, string[]> = {
  admin:      ['home','ingredients','compounds','products','recipes','clients','categories','orders','work-orders','invoices','reports','settings','backup'],
  supervisor: ['home','ingredients','compounds','products','recipes','work-orders'],
  staff:      ['home','work-orders'],
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSupervisor: boolean;
  isStaff: boolean;
  canAccessView: (view: string) => boolean;
  canEditView: (view: string) => boolean;
  canUpdateStock: boolean;
  error: string | null;
  retryAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

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

  const getInitialSession = async () => {
    try {
      console.log('[getInitialSession] Checking for existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const profileSuccess = await fetchProfile(session.user.id);
        if (!profileSuccess) {
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
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('[onAuthStateChange] Event:', event, 'Session:', session);
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

  const role = profile?.role ?? 'staff';

  const canAccessView = (view: string): boolean =>
    VIEW_ACCESS[role]?.includes(view) ?? false;

  // Same matrix: if you can see a view, you can fully edit it
  const canEditView = (view: string): boolean => canAccessView(view);

  // All authenticated active users can trigger stock updates (Staff via Work Orders)
  const canUpdateStock = !!profile?.active;

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    retryAuth,
    signIn,
    signOut,
    isAdmin: role === 'admin',
    isSupervisor: role === 'supervisor',
    isStaff: role === 'staff',
    canAccessView,
    canEditView,
    canUpdateStock,
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
