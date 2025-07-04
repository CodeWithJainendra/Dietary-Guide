# React Hook Rules Fix Guide

## Problem Fixed
**Error**: "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."

## Root Cause
This error occurs when React hooks are called conditionally or when there are early returns before all hooks have been executed. This violates the "Rules of Hooks."

## What Was Wrong

### Before (Incorrect):
```typescript
function MyComponent() {
  const { colors } = useTheme();           // Hook 1
  const { isSignedIn, isLoaded } = useAuth(); // Hook 2
  const [state, setState] = useState();    // Hook 3
  
  // ❌ EARLY RETURN AFTER HOOKS
  if (!isLoaded) {
    return <Loading />;
  }
  
  const [anotherState] = useState();       // Hook 4 - Sometimes not reached!
  
  return <MainContent />;
}
```

### After (Correct):
```typescript
function MyComponent() {
  const { colors } = useTheme();           // Hook 1
  const { isSignedIn, isLoaded } = useAuth(); // Hook 2
  const [state, setState] = useState();    // Hook 3
  const [anotherState] = useState();       // Hook 4 - Always called
  
  // ✅ CONDITIONAL RENDERING AFTER ALL HOOKS
  if (!isLoaded) {
    return <Loading />;
  }
  
  return <MainContent />;
}
```

## Rules of Hooks

### ✅ DO:
1. **Always call hooks at the top level** of your function
2. **Call hooks in the same order** every time
3. **Put conditional returns AFTER all hooks**
4. **Use conditional logic inside hooks** (useEffect, useMemo, etc.)

### ❌ DON'T:
1. **Call hooks inside loops, conditions, or nested functions**
2. **Return early before all hooks are called**
3. **Call hooks conditionally**

## Fixed Components

### 1. `app/(tabs)/index.tsx`
**Problem**: Early returns after hook calls
**Fix**: Moved conditional rendering after all hooks

**Before**:
```typescript
export default function HomeScreen() {
  const { colors } = useTheme();
  // ... more hooks
  
  if (!isLoaded) return <Loading />; // ❌ Early return
  
  // ... more hooks that sometimes don't get called
}
```

**After**:
```typescript
export default function HomeScreen() {
  const { colors } = useTheme();
  // ... ALL hooks called first
  
  // ✅ Conditional rendering after all hooks
  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Redirecting />;
  
  return <MainContent />;
}
```

## Common Patterns

### Authentication Checks
```typescript
function ProtectedComponent() {
  // ✅ All hooks first
  const { isSignedIn, isLoaded } = useAuth();
  const [data, setData] = useState();
  const { colors } = useTheme();
  
  useEffect(() => {
    // Hook logic here
  }, []);
  
  // ✅ Conditional rendering after hooks
  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Login />;
  
  return <MainContent />;
}
```

### Loading States
```typescript
function DataComponent() {
  // ✅ All hooks first
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // ✅ Conditional rendering after hooks
  if (loading) return <Loading />;
  if (error) return <Error />;
  if (!data) return <NoData />;
  
  return <DataDisplay data={data} />;
}
```

### Complex Conditions
```typescript
function ComplexComponent() {
  // ✅ All hooks first
  const { user } = useAuth();
  const { profile } = useProfile();
  const [state, setState] = useState();
  
  // ✅ Compute conditions after hooks
  const isReady = user && profile && !loading;
  const needsSetup = user && !profile;
  const isGuest = !user;
  
  // ✅ Conditional rendering
  if (!isReady) return <Loading />;
  if (needsSetup) return <Setup />;
  if (isGuest) return <Login />;
  
  return <MainApp />;
}
```

## Debugging Hook Issues

### 1. Use the Hook Debugger Component
```typescript
import HookDebugger from '@/components/HookDebugger';

function MyComponent() {
  // Count your hooks manually
  const hook1 = useTheme();        // 1
  const hook2 = useAuth();         // 2
  const [hook3] = useState();      // 3
  const hook4 = useEffect(() => {}, []); // 4
  
  return (
    <View>
      <HookDebugger componentName="MyComponent" hookCount={4} />
      {/* Your content */}
    </View>
  );
}
```

### 2. Console Logging
```typescript
function MyComponent() {
  console.log('Hook 1: useTheme');
  const { colors } = useTheme();
  
  console.log('Hook 2: useAuth');
  const { isSignedIn } = useAuth();
  
  console.log('Hook 3: useState');
  const [state] = useState();
  
  console.log('All hooks called, checking conditions...');
  
  if (!isSignedIn) {
    console.log('Returning early - not signed in');
    return <Login />;
  }
  
  return <MainContent />;
}
```

### 3. ESLint Rule
Add this to your `.eslintrc.js`:
```javascript
{
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

## Prevention Tips

1. **Structure your components consistently**:
   ```typescript
   function MyComponent() {
     // 1. All hooks at the top
     // 2. All useEffect calls
     // 3. All computed values
     // 4. All event handlers
     // 5. Conditional returns
     // 6. Main return
   }
   ```

2. **Use custom hooks for complex logic**:
   ```typescript
   function useAuthCheck() {
     const { isSignedIn, isLoaded } = useAuth();
     const { profile } = useProfile();
     
     return {
       isReady: isSignedIn && isLoaded && profile,
       needsAuth: !isSignedIn,
       needsProfile: isSignedIn && !profile
     };
   }
   ```

3. **Extract components for different states**:
   ```typescript
   function MyComponent() {
     const authState = useAuthCheck();
     
     if (authState.needsAuth) return <LoginScreen />;
     if (authState.needsProfile) return <ProfileSetup />;
     if (!authState.isReady) return <LoadingScreen />;
     
     return <MainScreen />;
   }
   ```

## Summary

The hook rules violation has been fixed by ensuring all hooks are called before any conditional returns. This maintains the consistent hook call order that React requires for proper component lifecycle management.

**Key takeaway**: Always call all your hooks first, then handle conditional rendering afterward.
