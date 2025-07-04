# Authentication System Guide

## Overview
This guide explains the comprehensive authentication system implemented in your React Native app using Clerk authentication with automatic redirects.

## How It Works

### 1. AuthGuard Component
The `AuthGuard` component is the central piece that handles all authentication logic:

- **Wraps your entire app** in `app/_layout.tsx`
- **Automatically redirects** users based on their authentication state
- **Monitors route changes** and ensures users are in the correct place
- **Handles loading states** while authentication is being checked

### 2. Authentication Flow

```
User opens app
       ↓
   AuthGuard checks authentication
       ↓
┌─────────────────────────────────────┐
│ Is user signed in with Clerk?      │
└─────────────────────────────────────┘
       ↓ NO                    ↓ YES
   Redirect to                 Check onboarding
   /signin                           ↓
                          ┌─────────────────────────┐
                          │ Is user onboarded?      │
                          └─────────────────────────┘
                                ↓ NO        ↓ YES
                           Redirect to    Allow access
                           /onboarding    to /(tabs)
```

### 3. Route Protection

#### Protected Routes (Require Authentication)
- `/(tabs)/*` - Main app tabs
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/chat` - AI chat
- `/stats` - Health statistics

#### Public Routes (No Authentication Required)
- `/signin` - Sign in page
- `/signup` - Sign up page
- `/onboarding` - User onboarding
- `/auth/*` - Authentication callbacks

## Implementation Details

### AuthGuard Component
Located in `components/AuthGuard.tsx`:

```typescript
// Automatically handles redirects based on authentication state
<AuthGuard>
  <YourAppContent />
</AuthGuard>
```

### Higher-Order Component
For protecting specific screens:

```typescript
import { withAuthGuard } from '@/components/AuthGuard';

function MyProtectedScreen() {
  return <div>Protected content</div>;
}

export default withAuthGuard(MyProtectedScreen);
```

### Custom Hooks
Located in `hooks/useAuthRedirect.ts`:

```typescript
// Check authentication status
const { isAuthenticated, isFullySetup, isLoading } = useAuthGuard();

// Require authentication
const authStatus = useRequireAuth();

// Require full setup (auth + onboarding)
const setupStatus = useRequireOnboarding();

// Redirect if already authenticated
const redirectStatus = useRedirectIfAuthenticated();
```

## User States

### 1. Not Authenticated
- **Condition**: `!isSignedIn`
- **Redirect**: `/signin`
- **Access**: Only public routes

### 2. Authenticated but Not Onboarded
- **Condition**: `isSignedIn && (!isOnboarded || !profile)`
- **Redirect**: `/onboarding`
- **Access**: Authentication routes + onboarding

### 3. Fully Authenticated and Onboarded
- **Condition**: `isSignedIn && isOnboarded && profile`
- **Redirect**: `/(tabs)` (if on auth pages)
- **Access**: All routes

## Configuration

### Environment Variables
Make sure these are set in your `.env` file:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Clerk Setup
Ensure Clerk is properly configured in `lib/clerk.ts`:

```typescript
export const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
export const tokenCache = {
  // Token cache implementation
};
```

## Usage Examples

### Protecting a Screen
```typescript
import { withAuthGuard } from '@/components/AuthGuard';

function ProtectedScreen() {
  return (
    <View>
      <Text>This screen requires authentication</Text>
    </View>
  );
}

export default withAuthGuard(ProtectedScreen);
```

### Checking Auth Status in Components
```typescript
import { useAuthGuard } from '@/components/AuthGuard';

function MyComponent() {
  const { isAuthenticated, isFullySetup, isLoading } = useAuthGuard();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <SignInPrompt />;
  if (!isFullySetup) return <OnboardingPrompt />;

  return <MainContent />;
}
```

### Manual Redirects
```typescript
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

function CustomComponent() {
  // Redirect to signin if not authenticated
  useAuthRedirect({ requireAuth: true, redirectTo: '/signin' });

  // Redirect to onboarding if not fully setup
  useAuthRedirect({ requireAuth: true, requireOnboarding: true });

  return <YourContent />;
}
```

## Troubleshooting

### Common Issues

1. **Infinite Redirect Loops**
   - Check that your route segments are correctly identified
   - Ensure AuthGuard logic doesn't conflict with manual redirects
   - Verify Clerk is properly initialized

2. **User Stuck on Loading Screen**
   - Check Clerk publishable key is correct
   - Verify network connectivity
   - Check console for Clerk initialization errors

3. **Redirects Not Working**
   - Ensure AuthGuard is wrapping your app in `_layout.tsx`
   - Check that route segments are being detected correctly
   - Verify user store state is properly updated

### Debug Mode
Add this to see what's happening:

```typescript
// In AuthGuard component
console.log('AuthGuard Debug:', {
  isSignedIn,
  isOnboarded,
  profile: !!profile,
  segments,
  inTabsGroup,
  inAuthGroup
});
```

## Best Practices

1. **Use AuthGuard for global protection** - Don't duplicate auth logic
2. **Use withAuthGuard for specific screens** - When you need fine-grained control
3. **Use custom hooks for status checks** - When you need to conditionally render content
4. **Keep auth logic centralized** - Avoid scattered authentication checks
5. **Handle loading states properly** - Always show loading while auth is being checked

## Security Notes

- Authentication state is managed by Clerk
- User profile data is stored in Supabase
- Tokens are securely cached using Expo SecureStore
- All protected routes require valid Clerk session
- Automatic session refresh is handled by Clerk

## Next Steps

After implementing this authentication system:

1. Test all authentication flows
2. Verify redirects work correctly
3. Test with different user states
4. Add error handling for edge cases
5. Consider adding role-based access control if needed
