-- Supabase Migration Script to Fix Profiles Table
-- Run this in your Supabase SQL Editor

-- First, let's see the current table structure
-- You can run this to check your current table:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles';

-- Option 1: If you want to keep the id column as auto-incrementing integer
-- This assumes your current id column is an integer type

-- Drop the NOT NULL constraint temporarily if it exists
ALTER TABLE profiles ALTER COLUMN id DROP NOT NULL;

-- Set a default value for the id column (auto-increment)
-- Note: This assumes id is a SERIAL or INTEGER type
-- If your id column is not SERIAL, you might need to recreate it

-- Option 2: If you want to make id column auto-incrementing SERIAL
-- (Only run this if your id column is currently not SERIAL)

-- First backup your data (recommended)
-- CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Drop and recreate the id column as SERIAL (auto-incrementing)
-- ALTER TABLE profiles DROP COLUMN id;
-- ALTER TABLE profiles ADD COLUMN id SERIAL PRIMARY KEY;

-- Option 3: Simple fix - just make id nullable and set a default
-- This is the safest option that should work immediately

-- Make id column nullable
ALTER TABLE profiles ALTER COLUMN id DROP NOT NULL;

-- Set a default value for id (using a sequence)
-- CREATE SEQUENCE IF NOT EXISTS profiles_id_seq;
-- ALTER TABLE profiles ALTER COLUMN id SET DEFAULT nextval('profiles_id_seq');

-- Option 4: Most recommended approach - Use UUID for id
-- This is more scalable and avoids conflicts

-- If you want to use UUID instead of integer:
-- ALTER TABLE profiles ALTER COLUMN id TYPE UUID USING gen_random_uuid();
-- ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure userId is unique (this should already be the case)
-- CREATE UNIQUE INDEX IF NOT EXISTS profiles_userId_unique ON profiles(userId);

-- Make sure the table has proper constraints
ALTER TABLE profiles ALTER COLUMN userId SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN name SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Set default values for required columns
ALTER TABLE profiles ALTER COLUMN height SET DEFAULT 170;
ALTER TABLE profiles ALTER COLUMN weight SET DEFAULT 70;
ALTER TABLE profiles ALTER COLUMN age SET DEFAULT 25;
ALTER TABLE profiles ALTER COLUMN gender SET DEFAULT 'other';
ALTER TABLE profiles ALTER COLUMN goal SET DEFAULT 'healthy_lifestyle';
ALTER TABLE profiles ALTER COLUMN exerciseDuration SET DEFAULT 30;
ALTER TABLE profiles ALTER COLUMN isSmoker SET DEFAULT false;

-- Ensure arrays have proper defaults
ALTER TABLE profiles ALTER COLUMN diseases SET DEFAULT '{}';
ALTER TABLE profiles ALTER COLUMN dietaryPreferences SET DEFAULT '{}';
ALTER TABLE profiles ALTER COLUMN dietaryRestrictions SET DEFAULT '{}';

-- Add timestamps if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or update the trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the changes
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;
