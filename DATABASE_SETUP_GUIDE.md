# Supabase Database Setup Guide

## Overview
This guide will help you set up a complete database schema for your AI Nutrition Companion app using Supabase with Clerk authentication.

## 🗄️ Database Schema Overview

### Core Tables

1. **`profiles`** - User profile information linked to Clerk userId
2. **`chat_history`** - AI chat conversations
3. **`meal_entries`** - Logged meals with nutritional data
4. **`food_items`** - Individual food items within meals
5. **`nutrition_goals`** - Daily nutrition targets
6. **`daily_nutrition_summary`** - Aggregated daily nutrition data
7. **`water_intake_log`** - Water consumption tracking
8. **`user_preferences`** - App settings and preferences

### Advanced Tables

9. **`meal_plans`** - AI-generated meal plans
10. **`meal_plan_items`** - Individual meals within plans
11. **`food_database`** - Common foods database for quick logging
12. **`user_achievements`** - Milestones and achievements tracking

## 🚀 Setup Instructions

### Step 1: Create New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready
4. Go to the SQL Editor

### Step 2: Run the Schema Script
1. Copy the contents of `supabase-database-schema.sql`
2. Paste it into the Supabase SQL Editor
3. Click "Run" to execute the script
4. Verify all tables are created successfully

### Step 3: Add Sample Data (Optional)
1. Copy the contents of `supabase-sample-data.sql`
2. Paste it into the SQL Editor
3. Run the script to populate with test data

### Step 4: Update Your App Configuration
Update your `.env` file with the new database credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
```

## 🔑 Key Features

### Clerk Integration
- Uses Clerk's `userId` as the primary identifier
- All user data is linked via `userId` foreign keys
- No dependency on Supabase authentication

### Nutritional Tracking
- Complete meal logging with macro tracking
- Daily nutrition summaries
- Water intake monitoring
- Progress tracking against goals

### AI Features
- Chat history storage for AI conversations
- Meal plan generation and storage
- Achievement system for motivation

### Performance Optimizations
- Proper indexing on frequently queried columns
- Automatic timestamp updates via triggers
- Efficient foreign key relationships

## 📊 Database Relationships

```
profiles (userId) 
    ├── chat_history (user_id)
    ├── meal_entries (user_id)
    │   └── food_items (meal_entry_id)
    ├── nutrition_goals (user_id)
    ├── daily_nutrition_summary (user_id)
    ├── water_intake_log (user_id)
    ├── user_preferences (user_id)
    ├── meal_plans (user_id)
    │   └── meal_plan_items (meal_plan_id)
    └── user_achievements (user_id)
```

## 🔧 Usage Examples

### Creating a User Profile
```sql
INSERT INTO profiles (userId, email, name, height, weight, age, gender, goal)
VALUES ('clerk_user_123', 'user@example.com', 'John Doe', 175, 70, 28, 'male', 'weight_loss');
```

### Logging a Meal
```sql
-- Insert meal entry
INSERT INTO meal_entries (user_id, meal_type, meal_name, meal_time, total_calories)
VALUES ('clerk_user_123', 'breakfast', 'Oatmeal Bowl', NOW(), 350);

-- Insert food items
INSERT INTO food_items (meal_entry_id, food_name, quantity, calories, protein, carbs, fat)
VALUES 
  (meal_entry_id, 'Oats', '1/2 cup', 150, 5, 27, 3),
  (meal_entry_id, 'Banana', '1 medium', 105, 1, 27, 0.4);
```

### Getting User Dashboard Data
```sql
SELECT * FROM user_dashboard_summary WHERE userId = 'clerk_user_123';
```

## 🛡️ Security Considerations

### Row Level Security (RLS)
- RLS is enabled on all user-specific tables
- Currently configured for application-level access control
- Can be switched to Supabase auth policies if needed

### Data Privacy
- All user data is isolated by `userId`
- No cross-user data access possible
- Automatic cleanup on user deletion via CASCADE

## 🔍 Useful Queries

### Get User's Daily Nutrition Summary
```sql
SELECT 
  dns.*,
  ng.daily_calories as goal_calories,
  ng.daily_protein as goal_protein
FROM daily_nutrition_summary dns
JOIN nutrition_goals ng ON dns.user_id = ng.user_id
WHERE dns.user_id = 'clerk_user_123' 
  AND dns.summary_date = CURRENT_DATE
  AND ng.is_active = true;
```

### Get Recent Meals
```sql
SELECT me.*, array_agg(fi.food_name) as foods
FROM meal_entries me
LEFT JOIN food_items fi ON me.id = fi.meal_entry_id
WHERE me.user_id = 'clerk_user_123'
  AND me.meal_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY me.id
ORDER BY me.meal_time DESC;
```

### Calculate Weekly Progress
```sql
SELECT 
  DATE_TRUNC('week', summary_date) as week,
  AVG(total_calories) as avg_calories,
  AVG(total_protein) as avg_protein,
  COUNT(*) as days_logged
FROM daily_nutrition_summary
WHERE user_id = 'clerk_user_123'
  AND summary_date >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', summary_date)
ORDER BY week DESC;
```

## 🔄 Data Migration

If you have existing data, create migration scripts to:
1. Map existing user IDs to Clerk userIds
2. Preserve meal history and preferences
3. Recalculate nutrition summaries

## 📈 Monitoring and Maintenance

### Regular Tasks
- Monitor database size and performance
- Clean up old chat history (optional)
- Update food database with new items
- Backup user data regularly

### Performance Monitoring
- Check slow query logs
- Monitor index usage
- Optimize queries as needed

## 🆘 Troubleshooting

### Common Issues

1. **Foreign Key Violations**
   - Ensure userId exists in profiles table before inserting related data
   - Check Clerk userId format consistency

2. **Constraint Violations**
   - Verify enum values match table constraints
   - Check required fields are not null

3. **Performance Issues**
   - Add indexes for frequently queried columns
   - Use EXPLAIN ANALYZE for slow queries

### Support Queries

```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check user data completeness
SELECT 
  p.userId,
  p.name,
  COUNT(DISTINCT me.id) as meal_count,
  COUNT(DISTINCT ch.id) as chat_count,
  MAX(me.created_at) as last_meal_logged
FROM profiles p
LEFT JOIN meal_entries me ON p.userId = me.user_id
LEFT JOIN chat_history ch ON p.userId = ch.user_id
GROUP BY p.userId, p.name;
```

This database schema provides a solid foundation for your nutrition companion app with room for future enhancements!
