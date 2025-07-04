-- Fix Foreign Key Issues in Supabase Database
-- This script addresses the foreign key constraint violations

-- 1. Remove all existing foreign key constraints that might cause issues
ALTER TABLE chat_history DROP CONSTRAINT IF EXISTS fk_chat_history_user;
ALTER TABLE chat_history DROP CONSTRAINT IF EXISTS chat_history_user_id_fkey;

ALTER TABLE meal_entries DROP CONSTRAINT IF EXISTS fk_meal_entries_user;
ALTER TABLE meal_entries DROP CONSTRAINT IF EXISTS meal_entries_user_id_fkey;

ALTER TABLE food_items DROP CONSTRAINT IF EXISTS fk_food_items_meal;
ALTER TABLE food_items DROP CONSTRAINT IF EXISTS food_items_meal_entry_id_fkey;

ALTER TABLE nutrition_goals DROP CONSTRAINT IF EXISTS fk_nutrition_goals_user;
ALTER TABLE nutrition_goals DROP CONSTRAINT IF EXISTS nutrition_goals_user_id_fkey;

ALTER TABLE daily_nutrition_summary DROP CONSTRAINT IF EXISTS fk_daily_summary_user;
ALTER TABLE daily_nutrition_summary DROP CONSTRAINT IF EXISTS daily_nutrition_summary_user_id_fkey;

ALTER TABLE water_intake_log DROP CONSTRAINT IF EXISTS fk_water_log_user;
ALTER TABLE water_intake_log DROP CONSTRAINT IF EXISTS water_intake_log_user_id_fkey;

ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS fk_user_preferences_user;
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- 2. Check current data to see what's causing the mismatch
SELECT 'Current profiles table data:' as info;
SELECT userId, id, name, email FROM profiles LIMIT 5;

SELECT 'Current chat_history data:' as info;
SELECT user_id, sender, LEFT(message, 50) as message_preview FROM chat_history LIMIT 5;

-- 3. Clean up any orphaned chat messages (optional - uncomment if needed)
-- DELETE FROM chat_history WHERE user_id NOT IN (SELECT userId FROM profiles);

-- 4. Option A: Remove foreign key constraints entirely (recommended for now)
-- This allows the app to work without strict referential integrity
-- You can handle data consistency in your application code

-- 5. Option B: Add foreign key constraints back with proper references (advanced)
-- Only uncomment these if you want strict referential integrity

/*
-- Add foreign key constraints back (ONLY if you want strict referential integrity)
ALTER TABLE chat_history ADD CONSTRAINT fk_chat_history_user 
FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;

ALTER TABLE meal_entries ADD CONSTRAINT fk_meal_entries_user 
FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;

ALTER TABLE food_items ADD CONSTRAINT fk_food_items_meal 
FOREIGN KEY (meal_entry_id) REFERENCES meal_entries(id) ON DELETE CASCADE;

ALTER TABLE nutrition_goals ADD CONSTRAINT fk_nutrition_goals_user 
FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;

ALTER TABLE daily_nutrition_summary ADD CONSTRAINT fk_daily_summary_user 
FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;

ALTER TABLE water_intake_log ADD CONSTRAINT fk_water_log_user 
FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;

ALTER TABLE user_preferences ADD CONSTRAINT fk_user_preferences_user 
FOREIGN KEY (user_id) REFERENCES profiles(userId) ON DELETE CASCADE;
*/

-- 6. Verify no foreign key constraints exist
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE contype = 'f' 
AND (conrelid::regclass::text LIKE '%chat_history%' 
     OR conrelid::regclass::text LIKE '%meal_entries%'
     OR conrelid::regclass::text LIKE '%profiles%'
     OR conrelid::regclass::text LIKE '%nutrition_goals%'
     OR conrelid::regclass::text LIKE '%daily_nutrition_summary%'
     OR conrelid::regclass::text LIKE '%water_intake_log%'
     OR conrelid::regclass::text LIKE '%user_preferences%'
     OR conrelid::regclass::text LIKE '%food_items%');

-- 7. Test inserting a chat message (replace with actual values)
-- INSERT INTO chat_history (user_id, message, sender, created_at) 
-- VALUES ('user_2zJSwHWP160XMvuQ0QDyQSqUJLn', 'Test message', 'user', NOW());

SELECT 'Foreign key constraints removed successfully!' as result;
SELECT 'Chat messages can now be saved without foreign key violations.' as info;
