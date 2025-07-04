-- Supabase Database Schema for AI Nutrition Companion
-- This script creates all required tables using Clerk userId as the primary identifier

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles Table
-- Stores user profile information linked to Clerk authentication
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
  gender TEXT NOT NULL DEFAULT 'other' CHECK (gender IN ('male', 'female', 'other')),
  
  -- Health and lifestyle
  isSmoker BOOLEAN NOT NULL DEFAULT false,
  goal TEXT NOT NULL DEFAULT 'healthy_lifestyle' CHECK (goal IN ('weight_loss', 'weight_gain', 'maintenance', 'healthy_lifestyle')),
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
-- Stores AI chat conversations
CREATE TABLE chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(userId) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Meal Entries Table
-- Stores logged meals and food items
CREATE TABLE meal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(userId) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
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
-- Stores individual food items within meals
CREATE TABLE food_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meal_entry_id UUID NOT NULL REFERENCES meal_entries(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity TEXT NOT NULL, -- e.g., "1 cup", "100g", "2 pieces"
  
  -- Nutritional values per serving
  calories INTEGER NOT NULL DEFAULT 0,
  protein DECIMAL(8,2) NOT NULL DEFAULT 0,
  carbs DECIMAL(8,2) NOT NULL DEFAULT 0,
  fat DECIMAL(8,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Nutrition Goals Table
-- Stores daily nutrition targets for users
CREATE TABLE nutrition_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(userId) ON DELETE CASCADE,
  
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
-- Stores aggregated daily nutrition data
CREATE TABLE daily_nutrition_summary (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(userId) ON DELETE CASCADE,
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
-- Tracks water consumption throughout the day
CREATE TABLE water_intake_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(userId) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL, -- amount in milliliters
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- 8. User Preferences Table
-- Stores app preferences and settings
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(userId) ON DELETE CASCADE,
  
  -- App preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled BOOLEAN DEFAULT true,
  meal_reminders BOOLEAN DEFAULT true,
  water_reminders BOOLEAN DEFAULT true,
  
  -- Reminder times (stored as time)
  breakfast_reminder TIME DEFAULT '08:00:00',
  lunch_reminder TIME DEFAULT '12:00:00',
  dinner_reminder TIME DEFAULT '18:00:00',
  
  -- Units preference
  weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  height_unit TEXT DEFAULT 'cm' CHECK (height_unit IN ('cm', 'ft')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One preference record per user
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_userId ON profiles(userId);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at);
CREATE INDEX idx_meal_entries_user_id ON meal_entries(user_id);
CREATE INDEX idx_meal_entries_meal_time ON meal_entries(meal_time);
CREATE INDEX idx_food_items_meal_entry_id ON food_items(meal_entry_id);
CREATE INDEX idx_nutrition_goals_user_id ON nutrition_goals(user_id);
CREATE INDEX idx_daily_nutrition_summary_user_id ON daily_nutrition_summary(user_id);
CREATE INDEX idx_daily_nutrition_summary_date ON daily_nutrition_summary(summary_date);
CREATE INDEX idx_water_intake_log_user_id ON water_intake_log(user_id);
CREATE INDEX idx_water_intake_log_logged_at ON water_intake_log(logged_at);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Create unique constraint for only one active nutrition goal per user
CREATE UNIQUE INDEX idx_nutrition_goals_user_active ON nutrition_goals(user_id) WHERE is_active = true;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_entries_updated_at
    BEFORE UPDATE ON meal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_goals_updated_at
    BEFORE UPDATE ON nutrition_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_nutrition_summary_updated_at
    BEFORE UPDATE ON daily_nutrition_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Meal Plans Table
-- Stores AI-generated meal plans
CREATE TABLE meal_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(userId) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_description TEXT,

  -- Plan duration
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Plan metadata
  total_days INTEGER NOT NULL,
  plan_type TEXT DEFAULT 'custom' CHECK (plan_type IN ('weight_loss', 'weight_gain', 'maintenance', 'custom')),

  -- Nutritional targets for this plan
  target_calories INTEGER,
  target_protein DECIMAL(8,2),
  target_carbs DECIMAL(8,2),
  target_fat DECIMAL(8,2),

  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Meal Plan Items Table
-- Individual meals within a meal plan
CREATE TABLE meal_plan_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL, -- Day 1, 2, 3, etc.
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name TEXT NOT NULL,
  meal_description TEXT,

  -- Estimated nutritional values
  estimated_calories INTEGER DEFAULT 0,
  estimated_protein DECIMAL(8,2) DEFAULT 0,
  estimated_carbs DECIMAL(8,2) DEFAULT 0,
  estimated_fat DECIMAL(8,2) DEFAULT 0,

  -- Ingredients and instructions
  ingredients TEXT[], -- Array of ingredients
  instructions TEXT,
  prep_time INTEGER, -- in minutes
  cook_time INTEGER, -- in minutes

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Food Database Table
-- Common foods database for quick logging
CREATE TABLE food_database (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  food_name TEXT NOT NULL,
  brand TEXT,
  category TEXT, -- e.g., 'fruits', 'vegetables', 'grains', etc.

  -- Nutritional values per 100g
  calories_per_100g INTEGER NOT NULL,
  protein_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
  carbs_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
  fat_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
  fiber_per_100g DECIMAL(8,2) DEFAULT 0,
  sugar_per_100g DECIMAL(8,2) DEFAULT 0,
  sodium_per_100g DECIMAL(8,2) DEFAULT 0,

  -- Common serving sizes
  common_serving_size TEXT, -- e.g., "1 medium apple (150g)"
  serving_size_grams INTEGER,

  -- Metadata
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. User Achievements Table
-- Track user milestones and achievements
CREATE TABLE user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(userId) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- e.g., 'streak', 'weight_goal', 'meals_logged'
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,

  -- Achievement data
  target_value INTEGER, -- e.g., 7 for "7-day streak"
  current_value INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for new tables
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_dates ON meal_plans(start_date, end_date);
CREATE INDEX idx_meal_plan_items_meal_plan_id ON meal_plan_items(meal_plan_id);
CREATE INDEX idx_meal_plan_items_day_meal ON meal_plan_items(day_number, meal_type);
CREATE INDEX idx_food_database_name ON food_database(food_name);
CREATE INDEX idx_food_database_category ON food_database(category);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON user_achievements(achievement_type);

-- Add triggers for new tables
CREATE TRIGGER update_meal_plans_updated_at
    BEFORE UPDATE ON meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all user-specific tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_intake_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Note: Since you're not using Supabase auth, you'll need to handle access control in your application
-- These policies are commented out but can be enabled if you switch to Supabase auth later

/*
-- RLS Policies (uncomment if using Supabase auth)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid()::text = userId);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = userId);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid()::text = userId);

CREATE POLICY "Users can view own chat history" ON chat_history FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own meal entries" ON meal_entries FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own nutrition goals" ON nutrition_goals FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own daily summary" ON daily_nutrition_summary FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own water intake" ON water_intake_log FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own preferences" ON user_preferences FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own meal plans" ON meal_plans FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own achievements" ON user_achievements FOR ALL USING (auth.uid()::text = user_id);
*/
