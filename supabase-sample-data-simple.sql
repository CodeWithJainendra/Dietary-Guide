-- Simple Sample Data for AI Nutrition Companion Database
-- Run this after creating the simple schema

-- Sample Food Database Entries
INSERT INTO food_database (food_name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, common_serving_size, serving_size_grams, is_verified) VALUES
-- Fruits
('Apple', 'fruits', 52, 0.3, 14, 0.2, 2.4, '1 medium apple', 150, true),
('Banana', 'fruits', 89, 1.1, 23, 0.3, 2.6, '1 medium banana', 120, true),
('Orange', 'fruits', 47, 0.9, 12, 0.1, 2.4, '1 medium orange', 130, true),

-- Vegetables
('Broccoli', 'vegetables', 34, 2.8, 7, 0.4, 2.6, '1 cup chopped', 90, true),
('Spinach', 'vegetables', 23, 2.9, 3.6, 0.4, 2.2, '1 cup', 30, true),
('Carrots', 'vegetables', 41, 0.9, 10, 0.2, 2.8, '1 medium carrot', 60, true),

-- Grains
('Brown Rice', 'grains', 111, 2.6, 23, 0.9, 1.8, '1 cup cooked', 195, true),
('Quinoa', 'grains', 120, 4.4, 22, 1.9, 2.8, '1 cup cooked', 185, true),
('Oats', 'grains', 68, 2.4, 12, 1.4, 1.7, '1/2 cup dry', 40, true),

-- Proteins
('Chicken Breast', 'protein', 165, 31, 0, 3.6, 0, '100g cooked', 100, true),
('Salmon', 'protein', 208, 20, 0, 12, 0, '100g cooked', 100, true),
('Eggs', 'protein', 155, 13, 1.1, 11, 0, '1 large egg', 50, true),
('Greek Yogurt', 'dairy', 59, 10, 3.6, 0.4, 0, '1 cup', 245, true),

-- Nuts and Seeds
('Almonds', 'nuts', 579, 21, 22, 50, 12, '1 oz (23 almonds)', 28, true),

-- Dairy
('Milk (2%)', 'dairy', 50, 3.3, 4.8, 2.0, 0, '1 cup', 240, true),

-- Beverages
('Water', 'beverages', 0, 0, 0, 0, 0, '1 cup', 240, true);

-- Sample User Profile
INSERT INTO profiles (userId, email, name, height, weight, age, gender, goal, exerciseDuration, diseases, dietaryPreferences, dietaryRestrictions) VALUES
('test_user_123', 'test@example.com', 'Test User', 175, 70, 28, 'other', 'healthy_lifestyle', 45, '{}', '{"vegetarian"}', '{"gluten"}');

-- Sample Nutrition Goals
INSERT INTO nutrition_goals (user_id, daily_calories, daily_protein, daily_carbs, daily_fat, daily_water) VALUES
('test_user_123', 2200, 165, 275, 73, 2500);

-- Sample User Preferences
INSERT INTO user_preferences (user_id, theme, notifications_enabled, meal_reminders, water_reminders, weight_unit, height_unit) VALUES
('test_user_123', 'system', true, true, true, 'kg', 'cm');

-- Sample Meal Entry
INSERT INTO meal_entries (user_id, meal_type, meal_name, meal_time, total_calories, total_protein, total_carbs, total_fat, notes) VALUES
('test_user_123', 'breakfast', 'Healthy Breakfast Bowl', NOW() - INTERVAL '2 hours', 450, 25, 55, 18, 'Delicious and nutritious start to the day');

-- Sample Food Items for the meal
INSERT INTO food_items (meal_entry_id, food_name, quantity, calories, protein, carbs, fat) VALUES
((SELECT id FROM meal_entries WHERE user_id = 'test_user_123' AND meal_type = 'breakfast' LIMIT 1), 'Oats', '1/2 cup dry', 150, 5, 27, 3),
((SELECT id FROM meal_entries WHERE user_id = 'test_user_123' AND meal_type = 'breakfast' LIMIT 1), 'Banana', '1 medium', 105, 1.3, 27, 0.4),
((SELECT id FROM meal_entries WHERE user_id = 'test_user_123' AND meal_type = 'breakfast' LIMIT 1), 'Almonds', '1 oz', 160, 6, 6, 14),
((SELECT id FROM meal_entries WHERE user_id = 'test_user_123' AND meal_type = 'breakfast' LIMIT 1), 'Greek Yogurt', '1/2 cup', 35, 6, 2, 0.2);

-- Sample Water Intake Log
INSERT INTO water_intake_log (user_id, amount_ml, logged_at, notes) VALUES
('test_user_123', 250, NOW() - INTERVAL '3 hours', 'Morning glass'),
('test_user_123', 500, NOW() - INTERVAL '2 hours', 'With breakfast'),
('test_user_123', 300, NOW() - INTERVAL '1 hour', 'Mid-morning hydration');

-- Sample Daily Nutrition Summary
INSERT INTO daily_nutrition_summary (user_id, summary_date, total_calories, total_protein, total_carbs, total_fat, water_intake, meals_logged) VALUES
('test_user_123', CURRENT_DATE, 450, 25, 55, 18, 1050, 1);

-- Sample Chat History
INSERT INTO chat_history (user_id, message, sender) VALUES
('test_user_123', 'Hello! I want to start tracking my nutrition.', 'user'),
('test_user_123', 'Great! I''m here to help you with your nutrition journey. Let''s start by logging your first meal. What did you have for breakfast today?', 'assistant'),
('test_user_123', 'I had oatmeal with banana and almonds.', 'user'),
('test_user_123', 'Excellent choice! That''s a nutritious breakfast with good fiber, healthy fats, and protein. I''ve logged that meal for you.', 'assistant');

-- Useful functions for the app

-- Function to calculate BMI
CREATE OR REPLACE FUNCTION calculate_bmi(height_cm INTEGER, weight_kg INTEGER)
RETURNS DECIMAL(4,1) AS $$
BEGIN
    RETURN ROUND((weight_kg::DECIMAL / POWER(height_cm::DECIMAL / 100, 2)), 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get daily calorie needs
CREATE OR REPLACE FUNCTION calculate_daily_calories(
    weight_kg INTEGER,
    height_cm INTEGER,
    age_years INTEGER,
    gender_val TEXT,
    activity_level TEXT DEFAULT 'moderate'
)
RETURNS INTEGER AS $$
DECLARE
    bmr DECIMAL;
    activity_multiplier DECIMAL;
BEGIN
    -- Calculate BMR using Mifflin-St Jeor Equation
    IF gender_val = 'male' THEN
        bmr := (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) + 5;
    ELSE
        bmr := (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) - 161;
    END IF;
    
    -- Apply activity multiplier
    CASE activity_level
        WHEN 'sedentary' THEN activity_multiplier := 1.2;
        WHEN 'light' THEN activity_multiplier := 1.375;
        WHEN 'moderate' THEN activity_multiplier := 1.55;
        WHEN 'active' THEN activity_multiplier := 1.725;
        WHEN 'very_active' THEN activity_multiplier := 1.9;
        ELSE activity_multiplier := 1.55;
    END CASE;
    
    RETURN ROUND(bmr * activity_multiplier);
END;
$$ LANGUAGE plpgsql;

-- View for user dashboard summary
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
    p.userId,
    p.name,
    p.email,
    calculate_bmi(p.height, p.weight) as current_bmi,
    ng.daily_calories as calorie_goal,
    COALESCE(dns.total_calories, 0) as calories_today,
    COALESCE(dns.water_intake, 0) as water_today,
    ng.daily_water as water_goal,
    COALESCE(dns.meals_logged, 0) as meals_logged_today
FROM profiles p
LEFT JOIN nutrition_goals ng ON p.userId = ng.user_id AND ng.is_active = true
LEFT JOIN daily_nutrition_summary dns ON p.userId = dns.user_id AND dns.summary_date = CURRENT_DATE;

-- Test the setup
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as food_items_count FROM food_database;
SELECT COUNT(*) as profiles_count FROM profiles;
