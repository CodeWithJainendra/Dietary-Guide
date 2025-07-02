// lib/auth-config.ts
// Authentication configuration

export const AUTH_CONFIG = {
  // Set which authentication provider to use
  // 'clerk' | 'auth0' | 'both'
  provider: 'clerk' as 'clerk' | 'auth0' | 'both',
  
  // Clerk configuration
  clerk: {
    publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  
  // Auth0 configuration
  auth0: {
    domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN,
    clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID,
  },
  
  // App configuration
  app: {
    scheme: 'rork-nutrition-companion',
    name: 'Rork AI Nutrition Companion',
  },
};

// Helper functions
export const isClerkEnabled = () => {
  return AUTH_CONFIG.provider === 'clerk' || AUTH_CONFIG.provider === 'both';
};

export const isAuth0Enabled = () => {
  return AUTH_CONFIG.provider === 'auth0' || AUTH_CONFIG.provider === 'both';
};

export const getAuthProvider = () => {
  return AUTH_CONFIG.provider;
};
