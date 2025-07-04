# Google OAuth Implementation with Clerk

## Overview
This guide explains the Google OAuth implementation in your React Native app using Clerk authentication.

## 🔧 **Implementation Summary**

### 1. **Updated Clerk Configuration** (`lib/clerk.ts`)
- Added `useOAuth` import from Clerk
- Created `useGoogleOAuth()` hook for Google sign-in
- Added generic `useOAuthFlow()` for other OAuth providers
- Proper error handling and session management

### 2. **Enhanced Onboarding Flow** (`app/onboarding.tsx`)
- Integrated Google OAuth with questionnaire
- Smart flow detection (new vs existing users)
- Loading states and error handling
- Conditional UI based on authentication status

### 3. **User Flow**

#### **New User with Google:**
1. User clicks "Continue with Google"
2. Google OAuth flow opens
3. User authenticates with Google
4. If new user → Continue with questionnaire
5. Complete questionnaire → Save profile to Supabase
6. Redirect to main app

#### **Existing User with Google:**
1. User clicks "Continue with Google"
2. Google OAuth flow opens
3. User authenticates with Google
4. If existing user → Direct redirect to main app

## 🛠️ **Setup Requirements**

### 1. **Clerk Dashboard Configuration**
1. Go to your Clerk Dashboard
2. Navigate to "Social Connections"
3. Enable Google OAuth
4. Configure OAuth settings:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
   - **Scopes**: `openid profile email`

### 2. **Google Cloud Console Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Application type**: Web application
   - **Authorized redirect URIs**: Add your Clerk redirect URI
   - **Authorized JavaScript origins**: Add your app domains

### 3. **Environment Variables**
Make sure your `.env` file has:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
```

### 4. **App Configuration** (`app.json`)
Add the Clerk scheme to your app.json:
```json
{
  "expo": {
    "scheme": "myapp",
    "web": {
      "bundler": "metro"
    }
  }
}
```

## 📱 **Code Implementation**

### **Google OAuth Hook** (`lib/clerk.ts`)
```typescript
export const useGoogleOAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  
  const signInWithGoogle = async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)', { scheme: 'myapp' }),
      });

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
      console.error('OAuth error:', err);
      return { success: false, error: err };
    }
  };

  return { signInWithGoogle };
};
```

### **Onboarding Integration** (`app/onboarding.tsx`)
```typescript
const handleGoogleSignIn = async () => {
  try {
    setIsGoogleLoading(true);
    const result = await signInWithGoogle();
    
    if (result.success) {
      setAuthenticated(true);
      
      if (result.isNewUser) {
        // New user - continue with questionnaire
        setStep(1);
      } else {
        // Existing user - redirect to main app
        setOnboarded(true);
        router.replace('/(tabs)');
      }
    } else {
      // Handle error
      Alert.alert('Sign-in Failed', 'Please try again.');
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
  } finally {
    setIsGoogleLoading(false);
  }
};
```

## 🔄 **User Experience Flow**

### **Step 0: Welcome Screen**
- Shows app introduction
- "Get Started" button to begin

### **Steps 1-3: Questionnaire**
- Personal info (name, email, physical stats)
- Goals and preferences
- Activity level and lifestyle
- Dietary preferences and restrictions

### **Step 4: Authentication**
- **If not signed in**: Show Google + Email options
- **If signed in**: Show "Complete Setup" button
- Smart detection of user state

### **Completion**
- Save profile to Supabase with Clerk userId
- Update user store state
- Navigate to main app

## 🎨 **UI Features**

### **Loading States**
- Google button shows "Signing in..." during OAuth
- Complete Setup button shows "Saving Profile..." during save
- Proper disabled states during loading

### **Conditional Rendering**
- Different UI for authenticated vs non-authenticated users
- Smart button text and icons
- Contextual messaging

### **Error Handling**
- User-friendly error messages
- Fallback options
- Proper error logging

## 🧪 **Testing**

### **Test Scenarios**
1. **New User Google Sign-up**:
   - Click "Continue with Google"
   - Complete OAuth flow
   - Fill questionnaire
   - Verify profile saved to Supabase

2. **Existing User Google Sign-in**:
   - Click "Continue with Google"
   - Complete OAuth flow
   - Verify direct redirect to main app

3. **Error Handling**:
   - Cancel OAuth flow
   - Network errors
   - Invalid credentials

### **Debug Logging**
All OAuth flows include comprehensive logging:
```typescript
console.log('Starting Google OAuth flow...');
console.log('Google OAuth successful!', { isNewUser: result.isNewUser });
console.log('Saving Google user profile:', profileData);
```

## 🔒 **Security Considerations**

### **Data Protection**
- User data stored securely in Supabase
- Clerk handles authentication tokens
- No sensitive data in client-side storage

### **OAuth Security**
- Proper redirect URI validation
- Secure token exchange
- Session management by Clerk

### **Error Handling**
- No sensitive information in error messages
- Proper fallback mechanisms
- User-friendly error states

## 🚀 **Deployment Notes**

### **Production Setup**
1. Update Google OAuth credentials for production domains
2. Configure Clerk production environment
3. Update redirect URIs for production app
4. Test OAuth flow in production environment

### **Environment Variables**
Ensure production environment has:
- Correct Clerk publishable key
- Proper app scheme configuration
- Valid redirect URIs

## 📋 **Next Steps**

After implementing Google OAuth:

1. **Test thoroughly** with different user scenarios
2. **Add other OAuth providers** (Apple, Facebook) using the generic hook
3. **Implement proper error tracking** for production
4. **Add analytics** to track OAuth conversion rates
5. **Consider adding** social profile data import (avatar, etc.)

The Google OAuth implementation provides a seamless authentication experience while maintaining the comprehensive onboarding flow for new users.
