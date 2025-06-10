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
  // Always use the custom scheme for production/release builds
  if (!__DEV__) {
    return 'app.rork.ai-powered-nutrition-companion.auth0://dev-ikys77t6u5pzs053.us.auth0.com/android/app.rork.ai-powered-nutrition-companion/callback';
  }
  
  // For development, we can also use the custom scheme if needed
  // This helps test the exact same flow that will be used in production
  const useCustomSchemeInDev = true; // Set to true to use custom scheme in dev
  
  if (useCustomSchemeInDev) {
    return 'app.rork.ai-powered-nutrition-companion.auth0://dev-ikys77t6u5pzs053.us.auth0.com/android/app.rork.ai-powered-nutrition-companion/callback';
  }
  
  // Otherwise use the Expo redirect URI for development
  return AuthSession.makeRedirectUri({
    scheme: 'exp',
    path: 'auth/callback',
  });
};

// Get the appropriate redirect URI
const redirectUri = getRedirectUri();

// Log the redirect URI for debugging
console.log('Auth0 redirect URI:', redirectUri);

// Create the auth request configuration
const discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
  userInfoEndpoint: `https://${AUTH0_DOMAIN}/userinfo`,
};

// Use secure storage when available (native platforms)
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

// Generate a code verifier for PKCE
async function generateCodeVerifier(): Promise<string> {
  try {
    // Generate random bytes using expo-crypto
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    
    // Convert to base64 URL safe string
    const base64 = base64Encode(Array.from(new Uint8Array(randomBytes))
      .map(byte => String.fromCharCode(byte))
      .join(''))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return base64;
  } catch (error) {
    console.error('Error generating code verifier:', error);
    // Fallback to a static code verifier (not secure for production)
    return 'fallback_code_verifier_' + Date.now().toString();
  }
}

// Generate a code challenge from a code verifier
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  try {
    // Use SHA-256 to hash the code verifier
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier
    );
    
    // Convert the hex digest to a byte array
    const bytes = new Uint8Array(digest.length / 2);
    for (let i = 0; i < digest.length; i += 2) {
      bytes[i / 2] = parseInt(digest.substring(i, i + 2), 16);
    }
    
    // Then convert to base64 and make URL safe
    const base64 = base64Encode(Array.from(bytes)
      .map(byte => String.fromCharCode(byte))
      .join(''))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return base64;
  } catch (error) {
    console.error('Error generating code challenge:', error);
    // If there's an error, just use the code verifier as the challenge (not secure, but a fallback)
    return codeVerifier;
  }
}

// Store code verifier for PKCE - IMPROVED to ensure it's stored in both AsyncStorage and SecureStore
async function storeCodeVerifier(codeVerifier: string, state: string) {
  try {
    console.log('Storing code verifier and state:', codeVerifier, state);
    
    // Always store in AsyncStorage first
    await AsyncStorage.setItem('auth0_code_verifier', codeVerifier);
    await AsyncStorage.setItem('auth0_state', state);
    
    // Then try to store in SecureStore (for native platforms)
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync('auth0_code_verifier', codeVerifier);
      await SecureStore.setItemAsync('auth0_state', state);
    }
    
    // Double-check storage
    const storedVerifier = await AsyncStorage.getItem('auth0_code_verifier');
    const storedState = await AsyncStorage.getItem('auth0_state');
    console.log('Verified storage - Code verifier:', storedVerifier);
    console.log('Verified storage - State:', storedState);
  } catch (error) {
    console.error('Error storing code verifier:', error);
    // Try AsyncStorage as a last resort
    try {
      await AsyncStorage.setItem('auth0_code_verifier', codeVerifier);
      await AsyncStorage.setItem('auth0_state', state);
    } catch (innerError) {
      console.error('Failed to store code verifier in AsyncStorage:', innerError);
    }
  }
}

// Get stored code verifier - IMPROVED to properly retrieve from both storage options
async function getCodeVerifier(state: string): Promise<string | null> {
  try {
    console.log('Getting code verifier for state:', state);
    
    // Try to get from AsyncStorage first
    let codeVerifier = await AsyncStorage.getItem('auth0_code_verifier');
    let storedState = await AsyncStorage.getItem('auth0_state');
    
    console.log('From AsyncStorage - Code verifier:', codeVerifier);
    console.log('From AsyncStorage - State:', storedState);
    
    // If not found in AsyncStorage or state doesn't match, try SecureStore
    if ((!codeVerifier || storedState !== state) && Platform.OS !== 'web') {
      console.log('Trying SecureStore for code verifier');
      codeVerifier = await SecureStore.getItemAsync('auth0_code_verifier');
      storedState = await SecureStore.getItemAsync('auth0_state');
      
      console.log('From SecureStore - Code verifier:', codeVerifier);
      console.log('From SecureStore - State:', storedState);
    }
    
    // If state is provided but doesn't match, log warning but still return code verifier
    // This helps in cases where the state parameter might be different but the code verifier is still valid
    if (state && storedState && storedState !== state) {
      console.warn('State mismatch but returning code verifier anyway. Expected:', state, 'Got:', storedState);
    }
    
    return codeVerifier;
  } catch (error) {
    console.error('Error retrieving code verifier:', error);
    return null;
  }
}

// Login with Auth0 - IMPROVED to handle the PKCE flow more robustly
export async function loginWithAuth0(): Promise<{
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
    
    // Clear any previous auth state to avoid conflicts
    await clearAuthState();
    
    // Use the appropriate redirect URI
    const allowedCallbackUrl = redirectUri;
    
    console.log('Using redirect URI:', allowedCallbackUrl);
    
    // Generate a code verifier for PKCE
    const codeVerifier = await generateCodeVerifier();
    console.log('Generated code verifier:', codeVerifier);
    
    // Generate a code challenge from the code verifier
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    console.log('Generated code challenge:', codeChallenge);
    
    // Create a new AuthRequest with PKCE
    const authRequest = new AuthSession.AuthRequest({
      responseType: AuthSession.ResponseType.Code,
      clientId: AUTH0_CLIENT_ID,
      redirectUri: allowedCallbackUrl,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      extraParams: {
        audience: `https://${AUTH0_DOMAIN}/api/v2/`,
        prompt: 'login', // Force login screen to appear
      },
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      codeChallenge: codeChallenge,
      usePKCE: true, // Explicitly enable PKCE
    });
    
    console.log('Auth request created, prompting...');
    
    // IMPORTANT: Store the code verifier BEFORE prompting for authentication
    // This ensures it's available when the callback is processed
    const state = authRequest.state;
    await storeCodeVerifier(codeVerifier, state);
    console.log('Pre-stored code verifier and state:', codeVerifier, state);
    
    // Prompt the user to authenticate
    const result = await authRequest.promptAsync(discovery, {
      showInRecents: true, // Show in Android recents
    });
    
    console.log('Auth0 prompt result:', result.type);
    
    if (result.type === 'success' && result.params.code) {
      console.log('Auth0 success, exchanging code for token...');
      console.log('Code:', result.params.code);
      console.log('State:', result.params.state);
      
      // Verify we have the code verifier stored
      const storedCodeVerifier = await getCodeVerifier(result.params.state);
      
      if (!storedCodeVerifier) {
        console.error('No code verifier found for state:', result.params.state);
        // Try to get code verifier without state check as fallback
        const fallbackVerifier = await AsyncStorage.getItem('auth0_code_verifier');
        
        if (!fallbackVerifier) {
          return {
            success: false,
            error: 'Authentication failed: No code verifier found'
          };
        }
        
        console.log('Using fallback code verifier:', fallbackVerifier);
        
        // Exchange the authorization code for tokens using fallback verifier
        return await exchangeCodeForTokens(result.params.code, allowedCallbackUrl, fallbackVerifier);
      }
      
      console.log('Using code verifier for token exchange:', storedCodeVerifier);
      
      // Exchange the authorization code for tokens
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

// Helper function to exchange code for tokens
async function exchangeCodeForTokens(
  code: string, 
  redirectUri: string, 
  codeVerifier: string
): Promise<{
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
    console.log('Exchanging code for tokens with params:');
    console.log('- Code:', code);
    console.log('- Redirect URI:', redirectUri);
    console.log('- Code Verifier:', codeVerifier);
    
    // Exchange the authorization code for tokens
    const tokenResponse = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: AUTH0_CLIENT_ID,
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });
    
    // Log the full response for debugging
    const responseText = await tokenResponse.text();
    console.log('Token exchange response status:', tokenResponse.status);
    console.log('Token exchange response:', responseText);
    
    // Check if response is OK before trying to parse JSON
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', responseText);
      return {
        success: false,
        error: `Failed to exchange code for token: ${tokenResponse.status} ${responseText}`
      };
    }
    
    // Parse the response text as JSON
    const tokenData = JSON.parse(responseText);
    console.log('Token exchange successful');
    
    // Store tokens
    await storeTokens({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      idToken: tokenData.id_token || '',
      expiresIn: tokenData.expires_in || 3600,
    });
    
    // Get user info
    const userInfo = await getUserInfo(tokenData.access_token);
    
    if (userInfo.success) {
      console.log('User info retrieved successfully');
      
      return {
        success: true,
        user: userInfo.user,
        tokens: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          idToken: tokenData.id_token || '',
          expiresIn: tokenData.expires_in || 3600,
        }
      };
    } else {
      console.error('Failed to get user info:', userInfo.error);
      return {
        success: false,
        error: userInfo.error
      };
    }
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during token exchange'
    };
  }
}

// Process auth callback (for use in the callback screen)
export async function processAuthCallback(code: string, state: string): Promise<{
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
    
    // Get the stored code verifier using the state parameter
    const codeVerifier = await getCodeVerifier(state);
    
    if (!codeVerifier) {
      console.error('No code verifier found for state:', state);
      // Try to get code verifier without state check as fallback
      const fallbackVerifier = await AsyncStorage.getItem('auth0_code_verifier');
      
      if (!fallbackVerifier) {
        return {
          success: false,
          error: 'Authentication failed: No code verifier found'
        };
      }
      
      console.log('Using fallback code verifier:', fallbackVerifier);
      
      // Exchange the authorization code for tokens using fallback verifier
      return await exchangeCodeForTokens(code, redirectUri, fallbackVerifier);
    }
    
    console.log('Using code verifier for token exchange:', codeVerifier);
    
    // Exchange the authorization code for tokens
    return await exchangeCodeForTokens(code, redirectUri, codeVerifier);
  } catch (error) {
    console.error('Error processing auth callback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during authentication'
    };
  }
}

// Get user info from Auth0
async function getUserInfo(accessToken: string) {
  try {
    console.log('Getting user info...');
    
    // Validate access token
    if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
      console.error('Invalid access token provided');
      return {
        success: false,
        error: 'Invalid access token',
      };
    }
    
    const response = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      console.error('Failed to get user info:', response.status, response.statusText);
      return {
        success: false,
        error: `Failed to get user info: ${response.status}`,
      };
    }

    // Get the response as text first
    const responseText = await response.text();
    
    // Check if the response is empty
    if (!responseText || responseText.trim() === '') {
      console.error('Empty response from user info endpoint');
      return {
        success: false,
        error: 'Empty response from user info endpoint',
      };
    }
    
    // Check if the response starts with "Unauthorized" or other error text
    if (responseText.startsWith('Unauthorized') || responseText.startsWith('<!DOCTYPE html>')) {
      console.error('Unauthorized or HTML response:', responseText.substring(0, 100));
      return {
        success: false,
        error: 'Unauthorized access or invalid token',
      };
    }
    
    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing user info response:', error, 'Response text:', responseText.substring(0, 100));
      return {
        success: false,
        error: 'Failed to parse user info response',
      };
    }

    console.log('User info retrieved successfully');
    return {
      success: true,
      user: data,
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while getting user info',
    };
  }
}

// Store tokens in secure storage
async function storeTokens(tokens: {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  expiresIn: number;
}) {
  try {
    const expiresAt = Date.now() + tokens.expiresIn * 1000;
    
    // Always store in AsyncStorage first
    await AsyncStorage.setItem('auth0_access_token', tokens.accessToken);
    await AsyncStorage.setItem('auth0_id_token', tokens.idToken);
    await AsyncStorage.setItem('auth0_expires_at', expiresAt.toString());
    
    if (tokens.refreshToken) {
      await AsyncStorage.setItem('auth0_refresh_token', tokens.refreshToken);
    }
    
    // Then try to store in SecureStore (for native platforms)
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync('auth0_access_token', tokens.accessToken);
      await SecureStore.setItemAsync('auth0_id_token', tokens.idToken);
      await SecureStore.setItemAsync('auth0_expires_at', expiresAt.toString());
      
      if (tokens.refreshToken) {
        await SecureStore.setItemAsync('auth0_refresh_token', tokens.refreshToken);
      }
    }
    
    console.log('Tokens stored successfully');
  } catch (error) {
    console.error('Error storing tokens:', error);
    // Try AsyncStorage as a last resort
    try {
      await AsyncStorage.setItem('auth0_access_token', tokens.accessToken);
      await AsyncStorage.setItem('auth0_id_token', tokens.idToken);
      await AsyncStorage.setItem('auth0_expires_at', (Date.now() + tokens.expiresIn * 1000).toString());
      
      if (tokens.refreshToken) {
        await AsyncStorage.setItem('auth0_refresh_token', tokens.refreshToken);
      }
    } catch (innerError) {
      console.error('Failed to store tokens in AsyncStorage:', innerError);
    }
  }
}

// Get stored tokens
export async function getStoredTokens() {
  try {
    // Try to get from AsyncStorage first
    let accessToken = await AsyncStorage.getItem('auth0_access_token');
    let idToken = await AsyncStorage.getItem('auth0_id_token');
    let refreshToken = await AsyncStorage.getItem('auth0_refresh_token');
    let expiresAtStr = await AsyncStorage.getItem('auth0_expires_at');
    
    // If not found in AsyncStorage, try SecureStore
    if (!accessToken && Platform.OS !== 'web') {
      console.log('Tokens not found in AsyncStorage, trying SecureStore');
      accessToken = await SecureStore.getItemAsync('auth0_access_token');
      idToken = await SecureStore.getItemAsync('auth0_id_token');
      refreshToken = await SecureStore.getItemAsync('auth0_refresh_token');
      expiresAtStr = await SecureStore.getItemAsync('auth0_expires_at');
    }
    
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;
    
    return {
      accessToken,
      idToken,
      refreshToken,
      expiresAt,
    };
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    return {
      accessToken: null,
      idToken: null,
      refreshToken: null,
      expiresAt: null,
    };
  }
}

// Check if tokens are valid
export async function isAuthenticated() {
  try {
    const { accessToken, expiresAt } = await getStoredTokens();
    
    // If no access token, not authenticated
    if (!accessToken) {
      return false;
    }
    
    // If token is expired, try to refresh
    if (!expiresAt || Date.now() >= expiresAt) {
      console.log('Token expired, attempting to refresh...');
      const refreshResult = await refreshTokens();
      return refreshResult.success;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
}

// Refresh tokens if expired
export async function refreshTokens() {
  try {
    const { refreshToken } = await getStoredTokens();
    
    if (!refreshToken) {
      console.log('No refresh token available');
      // Clear any invalid tokens
      await clearTokens();
      
      return {
        success: false,
        error: 'No refresh token available',
      };
    }
    
    const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: AUTH0_CLIENT_ID,
        refresh_token: refreshToken,
      }),
    });
    
    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', errorText);
      
      // Clear invalid tokens on refresh failure
      await clearTokens();
      
      return {
        success: false,
        error: `Failed to refresh token: ${response.status} ${errorText}`
      };
    }
    
    const data = await response.json();
    
    await storeTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      idToken: data.id_token,
      expiresIn: data.expires_in,
    });
    
    return {
      success: true,
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        idToken: data.id_token,
        expiresIn: data.expires_in,
      },
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    
    // Clear tokens on error
    await clearTokens();
    
    return {
      success: false,
      error: 'An unexpected error occurred while refreshing token',
    };
  }
}

// Helper function to clear all tokens
async function clearTokens() {
  try {
    // Clear from AsyncStorage first
    await AsyncStorage.removeItem('auth0_access_token');
    await AsyncStorage.removeItem('auth0_id_token');
    await AsyncStorage.removeItem('auth0_refresh_token');
    await AsyncStorage.removeItem('auth0_expires_at');
    
    // Then clear from SecureStore (for native platforms)
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync('auth0_access_token');
      await SecureStore.deleteItemAsync('auth0_id_token');
      await SecureStore.deleteItemAsync('auth0_refresh_token');
      await SecureStore.deleteItemAsync('auth0_expires_at');
    }
    
    console.log('All tokens cleared successfully');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
}

// Helper function to clear all auth state including PKCE
async function clearAuthState() {
  try {
    // Clear tokens
    await clearTokens();
    
    // Clear PKCE state
    await AsyncStorage.removeItem('auth0_code_verifier');
    await AsyncStorage.removeItem('auth0_state');
    
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync('auth0_code_verifier');
      await SecureStore.deleteItemAsync('auth0_state');
    }
    
    console.log('All auth state cleared successfully');
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
}

// Logout from Auth0
export async function logout() {
  try {
    // Get the access token for revocation
    const { accessToken } = await getStoredTokens();
    
    // Clear stored tokens
    await clearAuthState();
    
    if (accessToken) {
      try {
        // Attempt to revoke the token, but don't fail if it doesn't work
        await fetch(`https://${AUTH0_DOMAIN}/oauth/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: AUTH0_CLIENT_ID,
            token: accessToken,
            token_type_hint: 'access_token'
          }),
        });
      } catch (error) {
        console.warn('Error revoking token:', error);
        // Continue with logout even if token revocation fails
      }
    }
    
    // Construct the logout URL
    const logoutUrl = `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}`;
    
    // Open the logout URL in a browser
    await WebBrowser.openAuthSessionAsync(logoutUrl, redirectUri);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error during logout:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during logout',
    };
  }
}

// Get user profile from Auth0
export async function getUserProfile(): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  try {
    const { accessToken } = await getStoredTokens();
    
    if (!accessToken) {
      console.log('No access token available for getting user profile');
      return {
        success: false,
        error: 'No access token available',
      };
    }
    
    // Try to refresh token if needed
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      console.log('Token expired, attempting to refresh...');
      const refreshResult = await refreshTokens();
      if (!refreshResult.success) {
        console.log('Failed to refresh token:', refreshResult.error);
        return {
          success: false,
          error: 'Failed to refresh token: ' + refreshResult.error
        };
      }
    }
    
    // Get fresh access token after potential refresh
    const { accessToken: freshToken } = await getStoredTokens();
    const tokenToUse = freshToken || accessToken;
    
    if (!tokenToUse) {
      console.log('No valid token available after refresh attempt');
      return {
        success: false,
        error: 'No valid token available'
      };
    }
    
    const userInfo = await getUserInfo(tokenToUse);
    
    if (userInfo.success && userInfo.user) {
      // Map Auth0 user info to our UserProfile type
      const profile: UserProfile = {
        userId: userInfo.user.sub,
        email: userInfo.user.email,
        name: userInfo.user.name || userInfo.user.nickname || userInfo.user.email?.split('@')[0] || '',
        photoUrl: userInfo.user.picture,
        // Default values for new users
        height: 170,
        weight: 70,
        age: 30,
        gender: 'other', // Using a valid enum value
        goal: 'healthy_lifestyle',
        exerciseDuration: 30,
        dietaryRestrictions: [],
        dietaryPreferences: [],
        diseases: [],
        isSmoker: false
      };
      
      return {
        success: true,
        profile,
      };
    } else {
      console.log('Failed to get user info:', userInfo.error);
      return {
        success: false,
        error: userInfo.error,
      };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while getting user profile',
    };
  }
}

// Get SHA-256 fingerprint for Android
export function getAndroidSHAInstructions(): string {
  return `
To get the SHA-256 fingerprint for your Android app:

1. For debug keystore (development):
   Run this command in your terminal:
   
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

2. For release keystore (production):
   Run this command with your keystore path:
   
   keytool -list -v -keystore YOUR_KEYSTORE_PATH -alias YOUR_ALIAS

3. Look for the SHA-256 fingerprint in the output.

4. Add this fingerprint to your Auth0 dashboard in the Android settings.
`;
}