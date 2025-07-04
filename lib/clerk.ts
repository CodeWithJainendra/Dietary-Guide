// lib/clerk.ts
// Clerk authentication configuration for Expo

import { ClerkProvider, useAuth, useUser, useOAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';

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

  const signInWithGoogle = async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        return { success: true, isNewUser: !!signUp };
      } else {
        // Use signIn or signUp for next steps such as MFA
        return { success: false, signIn, signUp };
      }
    } catch (err) {
      console.error('OAuth error', err);
      return { success: false, error: err };
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
