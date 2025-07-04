-- Fix Supabase Constraints for Gender and Other Fields
-- Run this to fix the check constraint issues

-- 1. Fix gender constraint to accept both cases or make case-insensitive
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_gender_check 
CHECK (LOWER(gender) IN ('male', 'female', 'other'));

-- 2. Fix goal constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_goal_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_goal_check 
CHECK (goal IN ('weight_loss', 'weight_gain', 'maintenance', 'healthy_lifestyle'));

-- 3. Update any existing data to use lowercase gender values
UPDATE profiles SET gender = LOWER(gender) WHERE gender IS NOT NULL;

-- 4. Verify the constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c';

-- 5. Test the fix with a sample insert
INSERT INTO profiles (userId, email, name, height, weight, age, gender, goal, exerciseDuration, diseases, dietaryPreferences, dietaryRestrictions) 
VALUES ('test_constraint_fix', 'test@example.com', 'Test User', 175, 70, 25, 'male', 'healthy_lifestyle', 30, '{}', '{}', '{}')
ON CONFLICT (userId) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

SELECT 'Constraint fix test successful!' as result;
SELECT * FROM profiles WHERE userId = 'test_constraint_fix';

-- Clean up test data
DELETE FROM profiles WHERE userId = 'test_constraint_fix';

-- 6. Show final table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
