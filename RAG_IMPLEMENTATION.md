# RAG (Retrieval-Augmented Generation) Implementation

## Overview

This document describes the implementation of RAG (Retrieval-Augmented Generation) in the AI Nutrition Companion chat system. RAG enhances AI responses by retrieving and incorporating user-specific data from the database, providing personalized and contextually relevant advice.

## 🚀 Features

### Core RAG Capabilities
- **User Profile Integration**: Retrieves complete user profile including health goals, dietary preferences, and physical attributes
- **Meal History Analysis**: Analyzes recent meal entries to understand eating patterns and nutritional intake
- **Real-time Context**: Provides up-to-date information about today's nutrition and recent eating habits
- **Personalized Insights**: Generates nutrition insights based on user's actual data and patterns

### Smart Data Retrieval
- **Profile Data**: Name, age, height, weight, health goals, dietary preferences, restrictions, and health conditions
- **Recent Meals**: Last 7 days of meal entries with detailed nutritional breakdown
- **Daily Summary**: Today's total calories, protein, carbs, fat, and meal count
- **Nutrition Patterns**: Average daily intake, protein patterns, meal timing analysis, and dietary trends

## 🏗️ Architecture

### File Structure
```
utils/
├── aiService.ts          # Main AI service with RAG functions
├── ragTest.ts           # Testing utilities for RAG functionality
lib/
├── supabase.ts          # Database functions for data retrieval
app/
├── (tabs)/chat.tsx      # Main chat interface with RAG integration
├── chat.tsx             # Alternative chat interface with RAG
```

### Key Functions

#### `getUserContext(userId: string)`
Retrieves comprehensive user context from the database:
- User profile data
- Recent meal entries (last 7 days)
- Today's nutrition summary
- Nutrition insights and patterns

#### `chatWithAIRAG(messages: CoreMessage[], userId?: string)`
Enhanced chat function that:
- Retrieves user context if userId is provided
- Creates enhanced system prompt with user data
- Provides personalized AI responses based on actual user data

#### `calculateNutritionInsights(meals: MealEntry[])`
Analyzes meal history to provide:
- Average daily calorie intake
- Protein intake patterns
- Meal timing regularity
- Dietary trend identification

## 💾 Database Integration

### Tables Used
- **profiles**: User profile information
- **meal_entries**: Logged meals with nutritional data
- **food_items**: Individual food items within meals
- **chat_history**: Chat conversation history

### Data Retrieved
```typescript
interface UserContext {
  profile: UserProfile | null;
  recentMeals: MealEntry[];
  mealSummary: {
    totalMealsToday: number;
    totalCaloriesToday: number;
    totalProteinToday: number;
    totalCarbsToday: number;
    totalFatToday: number;
    lastMealTime: string | null;
    commonFoods: string[];
  };
  nutritionInsights: {
    averageDailyCalories: number;
    proteinIntakePattern: string;
    mealTimingPattern: string;
    dietaryTrends: string[];
  };
}
```

## 🤖 AI Enhancement

### System Prompt Enhancement
The RAG system creates a comprehensive system prompt that includes:

```
USER PROFILE:
- Name, age, gender, height, weight
- Health goals and exercise duration
- Health conditions and dietary preferences/restrictions

TODAY'S NUTRITION:
- Meals logged, total calories, macronutrients
- Last meal time

RECENT EATING PATTERNS:
- Average daily calories
- Protein intake patterns
- Meal timing regularity
- Common foods and dietary trends
```

### Response Personalization
AI responses now include:
- References to specific user data
- Personalized recommendations based on goals
- Nutritional gap identification
- Progress tracking with actual numbers
- Meal suggestions based on eating patterns

## 🔧 Implementation Details

### Chat Integration
Both chat interfaces (`app/(tabs)/chat.tsx` and `app/chat.tsx`) have been updated to:
- Use `chatWithAIRAG` instead of `chatWithAI`
- Pass user ID for context retrieval
- Display RAG status indicator
- Remove redundant system prompts (handled by RAG)

### Error Handling
- Graceful fallback when user data is unavailable
- Continues with standard AI responses if RAG fails
- Comprehensive error logging for debugging

### Performance Considerations
- Efficient database queries with proper filtering
- Caching of user context during chat sessions
- Minimal data retrieval (last 7 days of meals)

## 🧪 Testing

### Test Functions Available
```typescript
// Test user context retrieval
testUserContextRetrieval(userId: string)

// Test RAG-enhanced responses
testRAGChatResponse(userId: string, message?: string)

// Compare RAG vs non-RAG responses
compareRAGvsNonRAG(userId: string, message?: string)

// Run all tests
runAllRAGTests(userId: string)
```

### Usage Example
```typescript
import { runAllRAGTests } from '@/utils/ragTest';

// Test RAG functionality
await runAllRAGTests('user_123');
```

## 🎯 Benefits

### For Users
- **Personalized Advice**: Responses tailored to individual health goals and eating patterns
- **Progress Tracking**: AI references actual logged data and progress
- **Contextual Recommendations**: Meal suggestions based on recent eating habits
- **Goal-Oriented Guidance**: Advice aligned with specific health objectives

### For Developers
- **Modular Design**: Easy to extend and modify RAG functionality
- **Comprehensive Testing**: Built-in test utilities for validation
- **Error Resilience**: Graceful fallbacks ensure system reliability
- **Performance Optimized**: Efficient data retrieval and processing

## 🔮 Future Enhancements

### Planned Features
- **Seasonal Recommendations**: Adjust advice based on time of year
- **Exercise Integration**: Include workout data in context
- **Social Features**: Compare patterns with similar users
- **Advanced Analytics**: More sophisticated pattern recognition
- **Caching Layer**: Improve performance with intelligent caching

### Potential Improvements
- **Vector Embeddings**: Store meal embeddings for similarity search
- **Trend Analysis**: Long-term pattern recognition and predictions
- **Integration APIs**: Connect with fitness trackers and health apps
- **Multi-modal RAG**: Include image analysis in context retrieval

## 📊 Status Indicator

Users can see RAG is active through:
- Green dot indicator in chat interface
- "🧠 Smart AI with access to your profile & meal data" message
- More personalized and specific AI responses

## 🚨 Important Notes

- RAG requires user to be logged in and have profile data
- Falls back to standard AI responses if user context unavailable
- Respects user privacy - only retrieves data for the authenticated user
- All data retrieval follows existing security and privacy patterns
