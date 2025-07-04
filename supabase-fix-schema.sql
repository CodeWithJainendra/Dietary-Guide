-- Fix Supabase Schema for AI Nutrition Companion
-- Run this to fix the missing columns issue

-- First, let's see what we have
SELECT 'Current profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Drop the existing profiles table if it exists (CAREFUL: This will delete all data!)
-- Uncomment the next line only if you want to start completely fresh
-- DROP TABLE IF EXISTS profiles CASCADE;

-- Create the profiles table with all required columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL, -- Clerk user ID
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'User',
  photoUrl TEXT,
  
  -- Physical attributes
  height INTEGER NOT NULL DEFAULT 170, -- in cm
  weight INTEGER NOT NULL DEFAULT 70,  -- in kg
  age INTEGER NOT NULL DEFAULT 25,
  gender TEXT NOT NULL DEFAULT 'other',
  
  -- Health and lifestyle
  isSmoker BOOLEAN NOT NULL DEFAULT false,
  goal TEXT NOT NULL DEFAULT 'healthy_lifestyle',
  exerciseDuration INTEGER NOT NULL DEFAULT 30, -- minutes per day
  
  -- Health conditions and preferences (stored as arrays)
  diseases TEXT[] DEFAULT '{}',
  dietaryPreferences TEXT[] DEFAULT '{}',
  dietaryRestrictions TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table already exists, add missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dietaryPreferences TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dietaryRestrictions TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS diseases TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photoUrl TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure correct data types and defaults
ALTER TABLE profiles ALTER COLUMN height SET DEFAULT 170;
ALTER TABLE profiles ALTER COLUMN weight SET DEFAULT 70;
ALTER TABLE profiles ALTER COLUMN age SET DEFAULT 25;
ALTER TABLE profiles ALTER COLUMN gender SET DEFAULT 'other';
ALTER TABLE profiles ALTER COLUMN isSmoker SET DEFAULT false;
ALTER TABLE profiles ALTER COLUMN goal SET DEFAULT 'healthy_lifestyle';
ALTER TABLE profiles ALTER COLUMN exerciseDuration SET DEFAULT 30;
ALTER TABLE profiles ALTER COLUMN diseases SET DEFAULT '{}';
ALTER TABLE profiles ALTER COLUMN dietaryPreferences SET DEFAULT '{}';
ALTER TABLE profiles ALTER COLUMN dietaryRestrictions SET DEFAULT '{}';

-- Create other essential tables if they don't exist
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  sender TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  meal_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(8,2) DEFAULT 0,
  total_carbs DECIMAL(8,2) DEFAULT 0,
  total_fat DECIMAL(8,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meal_entry_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein DECIMAL(8,2) NOT NULL DEFAULT 0,
  carbs DECIMAL(8,2) NOT NULL DEFAULT 0,
  fat DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_userId ON profiles(userId);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_entries_user_id ON meal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_meal_entry_id ON food_items(meal_entry_id);

-- Add foreign key constraints (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_chat_history_user') THEN
        ALTER TABLE chat_history ADD CONSTRAINT fk_chat_history_user 
        FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_meal_entries_user') THEN
        ALTER TABLE meal_entries ADD CONSTRAINT fk_meal_entries_user 
        FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_food_items_meal') THEN
        ALTER TABLE food_items ADD CONSTRAINT fk_food_items_meal 
        FOREIGN KEY (meal_entry_id) REFERENCES meal_entries(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_entries_updated_at ON meal_entries;
CREATE TRIGGER update_meal_entries_updated_at 
    BEFORE UPDATE ON meal_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the final structure
SELECT 'Final profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Test insert to make sure everything works
INSERT INTO profiles (userId, email, name, height, weight, age, gender, goal, exerciseDuration, diseases, dietaryPreferences, dietaryRestrictions) 
VALUES ('test_user_fix', 'test@example.com', 'Test User', 175, 70, 25, 'other', 'healthy_lifestyle', 30, '{}', '{"vegetarian"}', '{}')
ON CONFLICT (userId) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = NOW();

SELECT 'Test profile created successfully!' as result;
SELECT * FROM profiles WHERE userId = 'test_user_fix';

-- Clean up test data
DELETE FROM profiles WHERE userId = 'test_user_fix';
