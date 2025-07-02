// lib/clerk.ts
// Clerk authentication configuration for Expo

import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

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
export { ClerkProvider, useAuth, useUser };

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
