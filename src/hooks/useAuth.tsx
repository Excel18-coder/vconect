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
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refetchProfile: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ error: any }>;
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
      // Check JWT auth
      if (isAuthenticated()) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData.data.user);
          setProfile(userData.data.profile);
        } catch (error) {
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
          // Ignore profile fetch errors; user is already registered
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
          // Ignore profile fetch errors; user is already authenticated
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
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors to ensure local state is cleared
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

  const updateProfile = async (updates: Partial<Profile>) => {
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
        // Ignore profile refetch errors
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