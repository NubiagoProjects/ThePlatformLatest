import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface AuthUser extends User {
  name?: string;
  role?: 'USER' | 'SUPPLIER' | 'ADMIN';
  avatar?: string;
  isActive?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'USER' | 'SUPPLIER';
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth initialization error:', error);
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              loading: false,
              error: error.message
            }));
          }
          return;
        }

        if (session?.user && mounted) {
          // Fetch user profile data
          const userProfile = await fetchUserProfile(session.user.id);
          setAuthState({
            user: userProfile ? { ...session.user, ...userProfile } : session.user,
            session,
            loading: false,
            error: null
          });
        } else if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Authentication failed'
          });
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          setAuthState({
            user: userProfile ? { ...session.user, ...userProfile } : session.user,
            session,
            loading: false,
            error: null
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setAuthState(prev => ({
            ...prev,
            session,
            error: null
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select(`
          name,
          role,
          avatar,
          is_active,
          supplier_profiles (
            id,
            company_name,
            is_verified
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        name: userProfile.name,
        role: userProfile.role,
        avatar: userProfile.avatar,
        isActive: userProfile.is_active,
        supplierProfile: userProfile.supplier_profiles?.[0] || null
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Register new user
  const register = useCallback(async (data: RegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role || 'USER'
          }
        }
      });

      if (error) {
        throw error;
      }

      if (authData.user && !authData.session) {
        // Email confirmation required
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: null
        }));
        
        return {
          success: true,
          requiresVerification: true,
          message: 'Please check your email to verify your account.'
        };
      }

      return {
        success: true,
        requiresVerification: false,
        user: authData.user
      };

    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: authError.message
      }));
      
      return {
        success: false,
        error: authError.message
      };
    }
  }, []);

  // Sign in user
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };

    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: authError.message
      }));
      
      return {
        success: false,
        error: authError.message
      };
    }
  }, []);

  // Sign out user
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return { success: true };

    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: authError.message
      }));
      
      return {
        success: false,
        error: authError.message
      };
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      setAuthState(prev => ({ ...prev, loading: false }));

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.'
      };

    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: authError.message
      }));
      
      return {
        success: false,
        error: authError.message
      };
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (data: UpdatePasswordData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        throw error;
      }

      setAuthState(prev => ({ ...prev, loading: false }));

      return {
        success: true,
        message: 'Password updated successfully.'
      };

    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: authError.message
      }));
      
      return {
        success: false,
        error: authError.message
      };
    }
  }, []);

  // Verify OTP
  const verifyOtp = useCallback(async (email: string, token: string, type: 'signup' | 'recovery' | 'email_change') => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };

    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: authError.message
      }));
      
      return {
        success: false,
        error: authError.message
      };
    }
  }, []);

  // Resend verification email
  const resendVerification = useCallback(async (email: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        throw error;
      }

      setAuthState(prev => ({ ...prev, loading: false }));

      return {
        success: true,
        message: 'Verification email sent. Please check your inbox.'
      };

    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: authError.message
      }));
      
      return {
        success: false,
        error: authError.message
      };
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates: {
    name?: string;
    avatar?: string;
    phone?: string;
  }) => {
    try {
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: updates
      });

      if (authError) {
        throw authError;
      }

      // Update user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', authState.user.id);

      if (profileError) {
        throw profileError;
      }

      // Refresh user profile
      const userProfile = await fetchUserProfile(authState.user.id);
      setAuthState(prev => ({
        ...prev,
        user: userProfile ? { ...prev.user!, ...userProfile } : prev.user,
        loading: false
      }));

      return {
        success: true,
        message: 'Profile updated successfully.'
      };

    } catch (error) {
      const updateError = error as Error;
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: updateError.message
      }));
      
      return {
        success: false,
        error: updateError.message
      };
    }
  }, [authState.user]);

  // Clear error
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    isAdmin: authState.user?.role === 'ADMIN',
    isSupplier: authState.user?.role === 'SUPPLIER',
    isUser: authState.user?.role === 'USER',

    // Actions
    register,
    login,
    logout,
    resetPassword,
    updatePassword,
    verifyOtp,
    resendVerification,
    updateProfile,
    clearError,

    // Utilities
    getAccessToken: () => authState.session?.access_token,
    refreshSession: () => supabase.auth.refreshSession()
  };
}; 