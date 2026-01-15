/**
 * Optimized useAuth Hook with Performance Enhancements
 *
 * Features:
 * - Memoized callbacks
 * - Optimistic UI updates
 * - Error recovery
 * - Session persistence
 */

import { authAPI, clearAuth, isAuthenticated, profileAPI } from '@/services/api-client';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useToast } from './use-toast';

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

interface Profile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  userType: string | null;
  phoneNumber: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
    userType?: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refetchProfile: () => Promise<void>;
  isAdmin: boolean;
  isSeller: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Check authentication on mount
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authAPI.getMe();

        if (isMounted && userData.data) {
          setUser(userData.data.user);
          setProfile(userData.data.profile);
          setError(null);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        if (isMounted) {
          clearAuth();
          setUser(null);
          setProfile(null);
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sign up with error handling
  const signUp = useCallback(
    async (email: string, password: string, displayName?: string, userType?: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await authAPI.register(email, password, displayName, userType);

        if (response.data?.user) {
          setUser(response.data.user);

          // Fetch profile after registration
          try {
            const profileData = await profileAPI.getProfile();
            setProfile(profileData.data.profile);
          } catch (profileError) {
            console.error('Failed to fetch profile:', profileError);
          }
        }

        toast({
          title: 'Success',
          description: response.message || 'Account created successfully!',
        });

        return { error: null };
      } catch (err: any) {
        const errorMessage = err.message || 'Registration failed';
        setError(err);

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return { error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Sign in with error handling
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await authAPI.login(email, password);

        if (response.data?.user) {
          setUser(response.data.user);
          setProfile(response.data.profile);
        }

        toast({
          title: 'Success',
          description: 'Logged in successfully!',
        });

        return { error: null };
      } catch (err: any) {
        const errorMessage = err.message || 'Login failed';
        setError(err);

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return { error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setError(null);

      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
    }
  }, [toast]);

  // Update profile with optimistic updates
  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!profile) {
        return { error: 'No profile loaded' };
      }

      // Optimistic update
      const previousProfile = profile;
      setProfile({ ...profile, ...updates });

      try {
        const response = await profileAPI.updateProfile(updates);

        if (response.data?.profile) {
          setProfile(response.data.profile);
        }

        toast({
          title: 'Success',
          description: 'Profile updated successfully!',
        });

        return { error: null };
      } catch (err: any) {
        // Revert on error
        setProfile(previousProfile);

        const errorMessage = err.message || 'Failed to update profile';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return { error: errorMessage };
      }
    },
    [profile, toast]
  );

  // Refetch profile
  const refetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const profileData = await profileAPI.getProfile();
      if (profileData.data?.profile) {
        setProfile(profileData.data.profile);
      }
    } catch (err) {
      console.error('Failed to refetch profile:', err);
    }
  }, [user]);

  // Computed values
  const isAdmin = useMemo(() => profile?.userType === 'admin', [profile]);
  const isSeller = useMemo(
    () => profile?.userType === 'seller' || profile?.userType === 'admin',
    [profile]
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refetchProfile,
      isAdmin,
      isSeller,
    }),
    [
      user,
      profile,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refetchProfile,
      isAdmin,
      isSeller,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
