// lib/auth0.ts
// Minimal Auth0 login stub for Expo/React Native
// Replace with your real Auth0 logic as needed

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { UserProfile } from '@/types';
import * as Crypto from 'expo-crypto';
import { encode as base64Encode } from 'base-64';

// Register for the auth callback
WebBrowser.maybeCompleteAuthSession();

// Auth0 Configuration
const AUTH0_DOMAIN = 'dev-ikys77t6u5pzs053.us.auth0.com';
const AUTH0_CLIENT_ID = 'j2rvOniVRDHetrzPtFt18IWayA2sR8Ag';

// IMPORTANT: Use the custom URL scheme for Auth0
// This must match EXACTLY what's in your Auth0 dashboard
const getRedirectUri = () => {
  if (!__DEV__) {
    return 'app.rork.ai-powered-nutrition-companion.auth0://dev-ikys77t6u5pzs053.us.auth0.com/android/app.rork.ai-powered-nutrition-companion/callback';
  }
  const useCustomSchemeInDev = true;
  if (useCustomSchemeInDev) {
    return 'app.rork.ai-powered-nutrition-companion.auth0://dev-ikys77t6u5pzs053.us.auth0.com/android/app.rork.ai-powered-nutrition-companion/callback';
  }
  return AuthSession.makeRedirectUri({
    scheme: 'exp',
    path: 'auth/callback',
  });
};
const redirectUri = getRedirectUri();
console.log('Auth0 redirect URI:', redirectUri);

const discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
  userInfoEndpoint: `https://${AUTH0_DOMAIN}/userinfo`,
};

const tokenStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }
};

// Login with Auth0 - IMPROVED to handle the PKCE flow more robustly
async function loginWithAuth0(): Promise<{
  success: boolean;
  error?: string;
  user?: any;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
    idToken: string;
    expiresIn: number;
  };
}> {
  try {
    console.log('Starting Auth0 login process...');
    await clearAuthState();
    const allowedCallbackUrl = redirectUri;
    console.log('Using redirect URI:', allowedCallbackUrl);
    const codeVerifier = await generateCodeVerifier();
    console.log('Generated code verifier:', codeVerifier);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    console.log('Generated code challenge:', codeChallenge);
    const authRequest = new AuthSession.AuthRequest({
      responseType: AuthSession.ResponseType.Code,
      clientId: AUTH0_CLIENT_ID,
      redirectUri: allowedCallbackUrl,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      extraParams: {
        audience: `https://${AUTH0_DOMAIN}/api/v2/`,
        prompt: 'login',
      },
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      codeChallenge: codeChallenge,
      usePKCE: true,
    });
    console.log('Auth request created, prompting...');
    const state = authRequest.state;
    await storeCodeVerifier(codeVerifier, state);
    console.log('Pre-stored code verifier and state:', codeVerifier, state);
    const result = await authRequest.promptAsync(discovery, {
      showInRecents: true,
    });
    console.log('Auth0 prompt result:', result.type);
    if (result.type === 'success' && result.params.code) {
      console.log('Auth0 success, exchanging code for token...');
      console.log('Code:', result.params.code);
      console.log('State:', result.params.state);
      const storedCodeVerifier = await getCodeVerifier(result.params.state);
      if (!storedCodeVerifier) {
        console.error('No code verifier found for state:', result.params.state);
        const fallbackVerifier = await AsyncStorage.getItem('auth0_code_verifier');
        if (!fallbackVerifier) {
          return {
            success: false,
            error: 'Authentication failed: No code verifier found'
          };
        }
        console.log('Using fallback code verifier:', fallbackVerifier);
        return await exchangeCodeForTokens(result.params.code, allowedCallbackUrl, fallbackVerifier);
      }
      console.log('Using code verifier for token exchange:', storedCodeVerifier);
      return await exchangeCodeForTokens(result.params.code, allowedCallbackUrl, storedCodeVerifier);
    } else if (result.type === 'error') {
      console.error('Auth0 login error:', result.error);
      return {
        success: false,
        error: result.error?.message || 'Authentication failed'
      };
    } else {
      console.log('Auth0 login cancelled or failed');
      return {
        success: false,
        error: 'Authentication was cancelled or failed'
      };
    }
  } catch (error) {
    console.error('Auth0 login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during authentication'
    };
  }
}

// Process auth callback (for use in the callback screen)
async function processAuthCallback(code: string, state: string): Promise<{
  success: boolean;
  error?: string;
  user?: any;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
    idToken: string;
    expiresIn: number;
  };
}> {
  try {
    console.log('Processing auth callback with code and state');
    console.log('Code:', code);
    console.log('State:', state);
    const codeVerifier = await getCodeVerifier(state);
    if (!codeVerifier) {
      console.error('No code verifier found for state:', state);
      const fallbackVerifier = await AsyncStorage.getItem('auth0_code_verifier');
      if (!fallbackVerifier) {
        return {
          success: false,
          error: 'Authentication failed: No code verifier found'
        };
      }
      console.log('Using fallback code verifier:', fallbackVerifier);
      return await exchangeCodeForTokens(code, redirectUri, fallbackVerifier);
    }
    console.log('Using code verifier for token exchange:', codeVerifier);
    return await exchangeCodeForTokens(code, redirectUri, codeVerifier);
  } catch (error) {
    console.error('Error processing auth callback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during authentication'
    };
  }
}

// Helper: Generate a random code verifier for PKCE
async function generateCodeVerifier(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return base64Encode(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper: Generate a code challenge from the code verifier
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Store code verifier for a given state
async function storeCodeVerifier(codeVerifier: string, state: string) {
  await AsyncStorage.setItem(`auth0_code_verifier_${state}`, codeVerifier);
  await AsyncStorage.setItem('auth0_code_verifier', codeVerifier); // fallback
}

// Retrieve code verifier for a given state
async function getCodeVerifier(state: string): Promise<string | null> {
  return (
    (await AsyncStorage.getItem(`auth0_code_verifier_${state}`)) ||
    (await AsyncStorage.getItem('auth0_code_verifier'))
  );
}

// Clear Auth0 state (logout helper)
async function clearAuthState() {
  const keys = await AsyncStorage.getAllKeys();
  const auth0Keys = keys.filter((k) => k.startsWith('auth0_code_verifier'));
  if (auth0Keys.length > 0) {
    await AsyncStorage.multiRemove(auth0Keys);
  }
  await tokenStorage.removeItem('access_token');
  await tokenStorage.removeItem('refresh_token');
  await tokenStorage.removeItem('id_token');
}

// Add any other Auth0 related functions or exports here

// Export functions
export {
  loginWithAuth0,
  processAuthCallback,
  clearAuthState,
};
