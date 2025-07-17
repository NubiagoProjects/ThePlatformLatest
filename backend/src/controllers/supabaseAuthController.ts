import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

// Auth validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['USER', 'SUPPLIER']).default('USER')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
  token: z.string().min(6, 'OTP must be 6 characters'),
  type: z.enum(['signup', 'recovery', 'email_change'])
});

export class SupabaseAuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name, role } = registerSchema.parse(req.body);

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User with this email already exists',
            code: 'USER_EXISTS'
          }
        });
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // Require email verification
        user_metadata: {
          name,
          role
        }
      });

      if (authError) {
        console.error('Auth registration error:', authError);
        return res.status(400).json({
          success: false,
          error: {
            message: authError.message,
            code: 'REGISTRATION_FAILED'
          }
        });
      }

      // Create user profile in database
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          name,
          email,
          role,
          is_active: false // Will be activated after email verification
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // Cleanup: delete the auth user if profile creation failed
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to create user profile',
            code: 'PROFILE_CREATION_FAILED'
          }
        });
      }

      // If user is a supplier, create supplier profile
      if (role === 'SUPPLIER') {
        const { error: supplierError } = await supabaseAdmin
          .from('supplier_profiles')
          .insert({
            user_id: authData.user.id,
            company_name: name, // Default to user name, can be updated later
            is_verified: false
          });

        if (supplierError) {
          console.error('Supplier profile creation error:', supplierError);
          // Continue with registration, supplier profile can be created later
        }
      }

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name,
            role
          },
          message: 'Registration successful. Please check your email to verify your account.'
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Registration failed',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth login error:', authError);
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS'
          }
        });
      }

      // Get user profile from database
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          supplier_profiles (
            id,
            company_name,
            is_verified
          )
        `)
        .eq('id', authData.user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Profile fetch error:', profileError);
        return res.status(404).json({
          success: false,
          error: {
            message: 'User profile not found',
            code: 'PROFILE_NOT_FOUND'
          }
        });
      }

      // Check if user is active
      if (!userProfile.is_active) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Account is not active. Please verify your email.',
            code: 'ACCOUNT_INACTIVE'
          }
        });
      }

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            role: userProfile.role,
            avatar: userProfile.avatar,
            supplierProfile: userProfile.supplier_profiles?.[0] || null
          },
          accessToken: authData.session.access_token,
          expiresAt: authData.session.expires_at
        },
        message: 'Login successful'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Login failed',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Refresh token not found',
            code: 'NO_REFRESH_TOKEN'
          }
        });
      }

      // Refresh session with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (authError || !authData.session) {
        console.error('Auth refresh error:', authError);
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid refresh token',
            code: 'INVALID_REFRESH_TOKEN'
          }
        });
      }

      // Update refresh token cookie
      res.cookie('refreshToken', authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: authData.session.access_token,
          expiresAt: authData.session.expires_at
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Token refresh failed',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        // Sign out from Supabase Auth
        await supabase.auth.refreshSession({ refresh_token: refreshToken })
          .then(({ data }) => {
            if (data.session) {
              return supabase.auth.signOut();
            }
          })
          .catch(error => {
            console.error('Logout error:', error);
          });
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Logout failed',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }

  /**
   * Forgot password
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = resetPasswordSchema.parse(req.body);

      // Send reset password email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error);
        return res.status(400).json({
          success: false,
          error: {
            message: error.message,
            code: 'RESET_FAILED'
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to send reset email',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }

  /**
   * Update password
   * POST /api/auth/update-password
   */
  static async updatePassword(req: Request, res: Response) {
    try {
      const { password } = updatePasswordSchema.parse(req.body);
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Access token required',
            code: 'NO_ACCESS_TOKEN'
          }
        });
      }

      // Create authenticated Supabase client
      const supabaseClient = supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: req.cookies.refreshToken
      });

      // Update password
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        console.error('Password update error:', error);
        return res.status(400).json({
          success: false,
          error: {
            message: error.message,
            code: 'UPDATE_FAILED'
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update password',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }

  /**
   * Verify OTP
   * POST /api/auth/verify-otp
   */
  static async verifyOtp(req: Request, res: Response) {
    try {
      const { email, token, type } = verifyOtpSchema.parse(req.body);

      // Verify OTP with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        email,
        token,
        type
      });

      if (authError) {
        console.error('OTP verification error:', authError);
        return res.status(400).json({
          success: false,
          error: {
            message: authError.message,
            code: 'VERIFICATION_FAILED'
          }
        });
      }

      // If this is email verification, activate the user account
      if (type === 'signup') {
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ is_active: true })
          .eq('id', authData.user?.id);

        if (updateError) {
          console.error('User activation error:', updateError);
          // Continue with verification success
        }
      }

      res.status(200).json({
        success: true,
        data: {
          user: authData.user,
          session: authData.session
        },
        message: 'Verification successful'
      });

    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Verification failed',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  static async resendVerification(req: Request, res: Response) {
    try {
      const { email } = resetPasswordSchema.parse(req.body);

      // Resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        console.error('Resend verification error:', error);
        return res.status(400).json({
          success: false,
          error: {
            message: error.message,
            code: 'RESEND_FAILED'
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Verification email sent'
      });

    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to resend verification email',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  static async getCurrentUser(req: Request, res: Response) {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Access token required',
            code: 'NO_ACCESS_TOKEN'
          }
        });
      }

      // Get user from Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

      if (authError || !user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid access token',
            code: 'INVALID_ACCESS_TOKEN'
          }
        });
      }

      // Get user profile from database
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          supplier_profiles (
            id,
            company_name,
            is_verified,
            rating
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return res.status(404).json({
          success: false,
          error: {
            message: 'User profile not found',
            code: 'PROFILE_NOT_FOUND'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            role: userProfile.role,
            phone: userProfile.phone,
            avatar: userProfile.avatar,
            isActive: userProfile.is_active,
            supplierProfile: userProfile.supplier_profiles?.[0] || null,
            createdAt: userProfile.created_at,
            updatedAt: userProfile.updated_at
          }
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get user information',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }
} 