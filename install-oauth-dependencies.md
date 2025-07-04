# OAuth Dependencies Installation

## Required Dependencies

To make Google OAuth work with Clerk in your React Native app, you need to install these dependencies:

### 1. **Install Expo Linking** (if not already installed)
```bash
npx expo install expo-linking
```

### 2. **Install Expo Web Browser** (for OAuth flow)
```bash
npx expo install expo-web-browser
```

### 3. **Install Expo Auth Session** (for OAuth handling)
```bash
npx expo install expo-auth-session
```

### 4. **Install Expo Crypto** (for OAuth security)
```bash
npx expo install expo-crypto
```

## Complete Installation Command

Run this single command to install all required dependencies:

```bash
npx expo install expo-linking expo-web-browser expo-auth-session expo-crypto
```

## Verification

After installation, verify the dependencies are in your `package.json`:

```json
{
  "dependencies": {
    "expo-linking": "~6.0.0",
    "expo-web-browser": "~12.0.0", 
    "expo-auth-session": "~5.0.0",
    "expo-crypto": "~12.0.0"
  }
}
```

## App Configuration

Make sure your `app.json` includes the scheme:

```json
{
  "expo": {
    "scheme": "myapp",
    "name": "AI Nutrition Companion",
    "slug": "ai-nutrition-companion"
  }
}
```

## Testing

After installation, test the OAuth flow:

1. Start your development server: `npx expo start`
2. Go to onboarding screen
3. Click "Continue with Google"
4. Verify OAuth flow opens correctly

## Troubleshooting

If you encounter issues:

1. **Clear cache**: `npx expo start --clear`
2. **Reinstall dependencies**: `rm -rf node_modules && npm install`
3. **Check Clerk configuration** in dashboard
4. **Verify Google OAuth credentials** are correct

The OAuth implementation should work after installing these dependencies and configuring Clerk properly.
