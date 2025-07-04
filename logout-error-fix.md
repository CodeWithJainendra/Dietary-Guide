# Logout Error Fix

## Problem
The app was showing this error during logout:
```
ReferenceError: Property 'clearChatMessages' doesn't exist
```

## Root Cause
The logout functions were trying to call `clearChatMessages()` but:
1. The actual function name in the chat store is `clearMessages()`
2. The user doesn't want to clear chat messages during logout

## Solution
Removed all references to chat message clearing during logout since it's not desired functionality.

## Changes Made

### Files Modified:
1. **app/(tabs)/profile.tsx**
   - Removed `useChatStore` import
   - Removed `clearChatHistory` variable
   - Removed `clearChatHistory()` calls from logout function
   - Updated comments to reflect changes

2. **app/profile.tsx**
   - Removed `useChatStore` import
   - Removed `clearChatHistory` variable
   - Removed `clearChatHistory()` call from clear data function
   - Updated alert message to remove mention of chat history

## Current Logout Behavior
The logout function now:
1. Signs out from Clerk
2. Signs out from Supabase
3. Clears SecureStore credentials
4. Clears AsyncStorage data
5. Clears user store state
6. Clears nutrition data only (no chat clearing)
7. Redirects to signin page

## Chat Messages
Chat messages are now preserved during logout and will persist across sessions through the chat store's persistence mechanism.

## Testing
The logout functionality should now work without any reference errors and will not attempt to clear chat messages.
