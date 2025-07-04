-- Simplified Supabase Database Schema for AI Nutrition Companion
-- This version avoids advanced PostgreSQL features for maximum compatibility

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles Table
CREATE TABLE profiles (
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

-- 2. Chat History Table
CREATE TABLE chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  sender TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Meal Entries Table
CREATE TABLE meal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  meal_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Nutritional information
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(8,2) DEFAULT 0,
  total_carbs DECIMAL(8,2) DEFAULT 0,
  total_fat DECIMAL(8,2) DEFAULT 0,
  
  -- Additional metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Food Items Table
CREATE TABLE food_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meal_entry_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  
  -- Nutritional values per serving
  calories INTEGER NOT NULL DEFAULT 0,
  protein DECIMAL(8,2) NOT NULL DEFAULT 0,
  carbs DECIMAL(8,2) NOT NULL DEFAULT 0,
  fat DECIMAL(8,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Nutrition Goals Table
CREATE TABLE nutrition_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- Daily targets
  daily_calories INTEGER NOT NULL DEFAULT 2000,
  daily_protein DECIMAL(8,2) NOT NULL DEFAULT 150,
  daily_carbs DECIMAL(8,2) NOT NULL DEFAULT 250,
  daily_fat DECIMAL(8,2) NOT NULL DEFAULT 65,
  
  -- Water intake goal (in ml)
  daily_water INTEGER NOT NULL DEFAULT 2000,
  
  -- Goal period
  goal_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  goal_end_date DATE,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Daily Nutrition Summary Table
CREATE TABLE daily_nutrition_summary (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  summary_date DATE NOT NULL,
  
  -- Actual intake
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(8,2) DEFAULT 0,
  total_carbs DECIMAL(8,2) DEFAULT 0,
  total_fat DECIMAL(8,2) DEFAULT 0,
  
  -- Water intake (in ml)
  water_intake INTEGER DEFAULT 0,
  
  -- Meal counts
  meals_logged INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for one summary per user per day
  UNIQUE(user_id, summary_date)
);

-- 7. Water Intake Log Table
CREATE TABLE water_intake_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- 8. User Preferences Table
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- App preferences
  theme TEXT DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT true,
  meal_reminders BOOLEAN DEFAULT true,
  water_reminders BOOLEAN DEFAULT true,
  
  -- Reminder times (stored as time)
  breakfast_reminder TIME DEFAULT '08:00:00',
  lunch_reminder TIME DEFAULT '12:00:00',
  dinner_reminder TIME DEFAULT '18:00:00',
  
  -- Units preference
  weight_unit TEXT DEFAULT 'kg',
  height_unit TEXT DEFAULT 'cm',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One preference record per user
  UNIQUE(user_id)
);

-- 9. Food Database Table
CREATE TABLE food_database (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  food_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  
  -- Nutritional values per 100g
  calories_per_100g INTEGER NOT NULL,
  protein_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
  carbs_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
  fat_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
  fiber_per_100g DECIMAL(8,2) DEFAULT 0,
  sugar_per_100g DECIMAL(8,2) DEFAULT 0,
  sodium_per_100g DECIMAL(8,2) DEFAULT 0,
  
  -- Common serving sizes
  common_serving_size TEXT,
  serving_size_grams INTEGER,
  
  -- Metadata
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX idx_profiles_userId ON profiles(userId);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_meal_entries_user_id ON meal_entries(user_id);
CREATE INDEX idx_food_items_meal_entry_id ON food_items(meal_entry_id);
CREATE INDEX idx_nutrition_goals_user_id ON nutrition_goals(user_id);
CREATE INDEX idx_daily_nutrition_summary_user_id ON daily_nutrition_summary(user_id);
CREATE INDEX idx_water_intake_log_user_id ON water_intake_log(user_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_food_database_name ON food_database(food_name);

-- Add foreign key constraints
ALTER TABLE chat_history ADD CONSTRAINT fk_chat_history_user FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;
ALTER TABLE meal_entries ADD CONSTRAINT fk_meal_entries_user FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;
ALTER TABLE food_items ADD CONSTRAINT fk_food_items_meal FOREIGN KEY (meal_entry_id) REFERENCES meal_entries(id) ON DELETE CASCADE;
ALTER TABLE nutrition_goals ADD CONSTRAINT fk_nutrition_goals_user FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;
ALTER TABLE daily_nutrition_summary ADD CONSTRAINT fk_daily_summary_user FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;
ALTER TABLE water_intake_log ADD CONSTRAINT fk_water_log_user FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;
ALTER TABLE user_preferences ADD CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_entries_updated_at BEFORE UPDATE ON meal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nutrition_goals_updated_at BEFORE UPDATE ON nutrition_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_nutrition_summary_updated_at BEFORE UPDATE ON daily_nutrition_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
