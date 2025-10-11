import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, profileAPI, isAuthenticated, clearAuth } from '@/services/api';
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
  signUp: (email: string, password: string, displayName?: string, userType?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
  refetchProfile: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ error: any }>;
  checkNeonSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      // First try to check Neon Auth session
      try {
        const neonSession = await authAPI.getNeonSession();
        if (neonSession.data?.user) {
          setUser(neonSession.data.user);
          setProfile(neonSession.data.user); // Neon session includes profile data
          setLoading(false);
          return;
        }
      } catch (neonError) {
        console.log('No Neon Auth session found, checking JWT auth');
      }

      // Fallback to JWT auth check
      if (isAuthenticated()) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData.data.user);
          setProfile(userData.data.profile);
        } catch (error) {
          console.error('Auth check failed:', error);
          clearAuth();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string, userType?: string) => {
    try {
      const response = await authAPI.register(email, password, displayName, userType);
      
      if (response.data?.user) {
        setUser(response.data.user);
        
        // Fetch profile after registration
        try {
          const profileData = await profileAPI.getProfile();
          setProfile(profileData.data.profile);
        } catch (profileError) {
          console.error('Failed to fetch profile after registration:', profileError);
        }
      }
      
      toast({
        title: "Success",
        description: response.message || "Account created successfully!",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.data?.user) {
        setUser(response.data.user);
        
        // Fetch profile after login
        try {
          const profileData = await profileAPI.getProfile();
          setProfile(profileData.data.profile);
        } catch (profileError) {
          console.error('Failed to fetch profile after login:', profileError);
        }
      }
      
      toast({
        title: "Success",
        description: "Login successful!",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Try Neon Auth signout first
      try {
        await authAPI.neonSignOut();
      } catch (neonError) {
        console.log('No Neon session to sign out from');
      }

      // Then try JWT logout
      try {
        await authAPI.logout();
      } catch (jwtError) {
        console.log('No JWT session to log out from');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setProfile(null);
      clearAuth();
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const response = await profileAPI.updateProfile(updates);
      
      if (response.data?.profile) {
        setProfile(response.data.profile);
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Profile update failed",
        variant: "destructive",
      });
      return { error };
    }
  };

  const refetchProfile = async () => {
    if (user) {
      try {
        const profileData = await profileAPI.getProfile();
        setProfile(profileData.data.profile);
      } catch (error) {
        console.error('Failed to refetch profile:', error);
      }
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      const response = await authAPI.sendMagicLink(email);
      
      toast({
        title: "Success",
        description: "Magic link sent! Check your email.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send magic link",
        variant: "destructive",
      });
      return { error };
    }
  };

  const checkNeonSession = async () => {
    try {
      const sessionData = await authAPI.verifyNeonSession();
      if (sessionData.data?.user) {
        setUser(sessionData.data.user);
        setProfile(sessionData.data.user); // Neon session includes profile data
      }
    } catch (error) {
      console.error('Neon session check failed:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refetchProfile,
    sendMagicLink,
    checkNeonSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};