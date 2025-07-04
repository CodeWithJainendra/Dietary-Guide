# Supabase Profile Table Fix Guide

## Problem
You're getting this error when trying to save user profiles to Supabase:
```
"null value in column \"id\" of relation \"profiles\" violates not-null constraint"
```

## Root Cause
The `profiles` table in Supabase has an `id` column with a NOT NULL constraint, but your application code is trying to insert records without providing an `id` value (or with `id: undefined`).

## Solution Overview
You have two main options to fix this:

### Option 1: Make ID Auto-Incrementing (Recommended)
This is the most common approach for database tables.

### Option 2: Use UUID for ID
This is more scalable and avoids potential conflicts.

## Step-by-Step Fix

### 1. Run the Database Migration
1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Run the migration script provided in `supabase-migration.sql`

The key changes in the migration:
- Makes the `id` column nullable or auto-incrementing
- Sets proper default values for all required columns
- Adds proper constraints and indexes
- Adds timestamp columns with auto-update triggers

### 2. Code Changes Made
The following files have been updated to fix the issue:

#### `lib/supabase.ts`
- Removed `id` field from profile data before insertion
- Added proper default values for all required fields
- Added timestamp fields (`created_at`, `updated_at`)

#### `app/index.tsx`
- Removed the incorrect `id: userId` assignment
- Added proper default values
- Fixed the upsert call to use `onConflict: 'userId'`

#### `lib/clerk-supabase-integration.ts`
- Removed the `id: undefined` assignment
- Let Supabase handle ID generation automatically

#### `utils/test-profile-save.ts`
- Updated test function to match the new profile saving logic
- Added proper cleanup and error handling

## Testing the Fix

### 1. Run the Migration
Execute the SQL migration in your Supabase dashboard first.

### 2. Test Profile Saving
You can test the fix by running the test utility:

```typescript
import { testProfileSave } from '@/utils/test-profile-save';

// Test the profile saving functionality
testProfileSave().then(result => {
  if (result.success) {
    console.log('Profile saving works!', result.profile);
  } else {
    console.error('Profile saving failed:', result.error);
  }
});
```

### 3. Test the Full Flow
1. Go through the onboarding process
2. Complete email verification with OTP
3. Check that the profile is saved to Supabase without errors

## Database Schema After Fix

Your `profiles` table should have this structure:

```sql
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,  -- Auto-incrementing integer
  userId TEXT UNIQUE NOT NULL,  -- Clerk user ID
  name TEXT NOT NULL DEFAULT 'User',
  email TEXT NOT NULL,
  height INTEGER DEFAULT 170,
  weight INTEGER DEFAULT 70,
  age INTEGER DEFAULT 25,
  gender TEXT DEFAULT 'other',
  goal TEXT DEFAULT 'healthy_lifestyle',
  exerciseDuration INTEGER DEFAULT 30,
  isSmoker BOOLEAN DEFAULT false,
  diseases TEXT[] DEFAULT '{}',
  dietaryPreferences TEXT[] DEFAULT '{}',
  dietaryRestrictions TEXT[] DEFAULT '{}',
  photoUrl TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Key Points

1. **Never set `id` in your application code** - let Supabase handle it
2. **Always use `userId` for identifying users** - this is your Clerk user ID
3. **Use upsert with `onConflict: 'userId'`** - this prevents duplicate profiles
4. **Provide default values** - ensures required fields are never null
5. **Use proper error handling** - catch and log Supabase errors

## Verification

After applying the fix, you should see:
- ✅ No more "null value in column id" errors
- ✅ Profiles successfully saved to Supabase
- ✅ Proper default values for all fields
- ✅ Automatic timestamps for created_at and updated_at

## Troubleshooting

If you still get errors:

1. **Check your Supabase table structure**:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'profiles';
   ```

2. **Verify the migration ran successfully**:
   - Check that `id` column is nullable or has a default value
   - Check that `userId` has a unique constraint

3. **Test with a simple insert**:
   ```sql
   INSERT INTO profiles (userId, name, email) 
   VALUES ('test-user-123', 'Test User', 'test@example.com');
   ```

4. **Check your environment variables**:
   - Ensure `EXPO_PUBLIC_SUPABASE_URL` is correct
   - Ensure `EXPO_PUBLIC_SUPABASE_ANON_KEY` is correct

## Next Steps

After fixing this issue:
1. Test the complete user registration flow
2. Verify that existing users can still access their profiles
3. Consider adding more robust error handling for edge cases
4. Add proper logging for debugging future issues
