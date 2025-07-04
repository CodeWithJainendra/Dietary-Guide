// lib/clerk.ts
// Clerk authentication configuration for Expo

import { ClerkProvider, useAuth, useUser, useOAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { UserProfile } from '@/types';

// Get the publishable key from environment variables
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file'
  );
}

// Token cache for Clerk
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Export the configuration
export { publishableKey, tokenCache };

// Re-export Clerk hooks for convenience
export { ClerkProvider, useAuth, useUser, useOAuth };

// Helper function to check if user is authenticated
export const useClerkAuth = () => {
  const { isSignedIn, userId, sessionId, getToken } = useAuth();
  const { user } = useUser();
  
  return {
    isAuthenticated: isSignedIn,
    userId,
    sessionId,
    user,
    getToken,
  };
};

// Helper function to get user profile data
export const useClerkProfile = () => {
  const { user } = useUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress,
    name: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// OAuth helper functions
export const useGoogleOAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const signInWithGoogle = async (onboardingData?: Partial<UserProfile>) => {
    try {
      console.log('Starting Google OAuth flow...');

      // Check if startOAuthFlow is available
      if (!startOAuthFlow) {
        console.error('startOAuthFlow is not available');
        return {
          success: false,
          error: 'Google OAuth is not properly configured. Please check your Clerk dashboard settings.'
        };
      }

      console.log('Calling startOAuthFlow...');
      const result = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)', { scheme: 'rork-nutrition-companion' }),
      });

      console.log('OAuth flow result:', result);

      if (!result) {
        console.error('OAuth flow returned undefined');
        return {
          success: false,
          error: 'OAuth flow failed to return a result. This might be due to user cancellation or configuration issues.'
        };
      }

      const { createdSessionId, signIn, signUp, setActive } = result;

      if (createdSessionId) {
        console.log('OAuth successful, setting active session...');
        await setActive!({ session: createdSessionId });

        // If this is a new user, create a profile immediately with onboarding data
        if (signUp) {
          console.log('New user detected, creating profile with onboarding data...');
          try {
            // Import the profile creation function
            const { handleSignupComplete } = await import('./clerk-supabase-integration');

            // Get the user data from the session
            const { user } = signUp;
            if (user) {
              // Use provided onboarding data or create basic profile with default values
              const profileData = {
                name: onboardingData?.name || user.fullName || user.firstName || 'User',
                email: user.primaryEmailAddress?.emailAddress || '',
                photoUrl: user.imageUrl || undefined,
                age: onboardingData?.age || 25,
                height: onboardingData?.height || 170,
                weight: onboardingData?.weight || 70,
                gender: onboardingData?.gender || 'other' as const,
                goal: onboardingData?.goal || 'healthy_lifestyle' as const,
                exerciseDuration: onboardingData?.exerciseDuration || 30,
                isSmoker: onboardingData?.isSmoker || false,
                diseases: onboardingData?.diseases || [],
                dietaryPreferences: onboardingData?.dietaryPreferences || [],
                dietaryRestrictions: onboardingData?.dietaryRestrictions || []
              };

              console.log('Creating profile for new Google OAuth user with data:', profileData);
              const syncResult = await handleSignupComplete(user, profileData);

              if (syncResult.success) {
                console.log('Profile created successfully for Google OAuth user');
                return { success: true, isNewUser: !!signUp, profile: syncResult.profile };
              } else {
                console.error('Failed to create profile for Google OAuth user:', syncResult.error);
                return { success: true, isNewUser: !!signUp, error: syncResult.error };
              }
            }
          } catch (error) {
            console.error('Error creating profile for Google OAuth user:', error);
            // Don't fail the OAuth flow if profile creation fails
            return { success: true, isNewUser: !!signUp, error: 'Failed to create user profile' };
          }
        }

        return { success: true, isNewUser: !!signUp };
      } else {
        console.log('OAuth flow incomplete, additional steps required');
        // Use signIn or signUp for next steps such as MFA
        return { success: false, signIn, signUp };
      }
    } catch (err: any) {
      console.error('OAuth error details:', err);
      console.error('Error message:', err?.message);
      console.error('Error code:', err?.code);
      console.error('Full error object:', JSON.stringify(err, null, 2));

      let errorMessage = 'Google sign-in failed. Please try again.';

      if (err?.message) {
        if (err.message.includes('not configured') || err.message.includes('not enabled')) {
          errorMessage = 'Google OAuth is not configured in your Clerk dashboard. Please enable Google as a social connection.';
        } else if (err.message.includes('cancelled') || err.message.includes('user_cancelled')) {
          errorMessage = 'Sign-in was cancelled.';
        } else if (err.message.includes('network') || err.message.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      return { success: false, error: errorMessage };
    }
  };

  return { signInWithGoogle };
};

// Generic OAuth helper
export const useOAuthFlow = (strategy: 'oauth_google' | 'oauth_apple' | 'oauth_facebook') => {
  const { startOAuthFlow } = useOAuth({ strategy });

  const signInWithOAuth = async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        return {
          success: true,
          isNewUser: !!signUp,
          sessionId: createdSessionId
        };
      } else {
        return { success: false, signIn, signUp };
      }
    } catch (err) {
      console.error(`OAuth error for ${strategy}:`, err);
      return { success: false, error: err };
    }
  };

  return { signInWithOAuth };
};
