import { UserProfile, MealEntry, CoreMessage } from '@/types';

const API_URL = 'https://toolkit.rork.com/text/llm/';

export async function chatWithAI(messages: CoreMessage[]): Promise<string> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.completion || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Error calling AI service:', error);
    throw new Error('Failed to get AI response');
  }
}

export async function generateMealPlan(profile: UserProfile, recentMeals: MealEntry[]): Promise<string> {
  const messages: CoreMessage[] = [
    {
      role: 'system',
      content: `You are a professional nutritionist. Create a personalized meal plan based on the user's profile and recent eating habits. Focus on their health goals and dietary preferences. Keep responses under 200 words and be encouraging.`
    },
    {
      role: 'user',
      content: `Create a meal plan for:
      - Goal: ${profile.goal}
      - Height: ${profile.height}cm, Weight: ${profile.weight}kg, Age: ${profile.age}
      - Exercise: ${profile.exerciseDuration} minutes/day
      - Health conditions: ${profile.diseases?.join(', ') || 'None'}
      - Dietary preferences: ${profile.dietaryPreferences?.join(', ') || 'None'}
      - Recent meals: ${recentMeals.map(m => m.foods.map(f => f.name).join(', ')).join('; ')}
      
      Provide a balanced daily meal plan with breakfast, lunch, and dinner.`
    }
  ];

  return await chatWithAI(messages);
}

export async function getHealthInsights(profile: UserProfile): Promise<string> {
  const bmi = profile.height && profile.weight 
    ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
    : null;

  const messages: CoreMessage[] = [
    {
      role: 'system',
      content: `You are a supportive health advisor. Provide personalized health insights based on the user's profile. Be encouraging, positive, and focus on actionable advice. Keep it concise (max 150 words) and motivational.`
    },
    {
      role: 'user',
      content: `Provide health insights for:
      - BMI: ${bmi || 'Unknown'}
      - Goal: ${profile.goal}
      - Age: ${profile.age}, Gender: ${profile.gender}
      - Exercise: ${profile.exerciseDuration} minutes/day
      - Smoker: ${profile.isSmoker ? 'Yes' : 'No'}
      - Health conditions: ${profile.diseases?.join(', ') || 'None'}
      - Dietary preferences: ${profile.dietaryPreferences?.join(', ') || 'None'}
      
      Give 3-4 key insights and positive recommendations.`
    }
  ];

  return await chatWithAI(messages);
}

export async function analyzeFoodWithAI(foodName: string, quantity: string): Promise<{
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}> {
  const messages: CoreMessage[] = [
    {
      role: 'system',
      content: 'You are a nutrition expert. Analyze food items and provide accurate nutritional information. Respond only with JSON format.'
    },
    {
      role: 'user',
      content: `Analyze this food and provide nutritional information:
      Food: ${foodName}
      Quantity: ${quantity}
      
      Respond with JSON format:
      {
        "foodName": "food name",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }`
    }
  ];

  try {
    const response = await chatWithAI(messages);
    
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        foodName: parsed.foodName || foodName,
        calories: parsed.calories || 200,
        protein: parsed.protein || 10,
        carbs: parsed.carbs || 20,
        fat: parsed.fat || 8
      };
    }
    
    // Fallback if JSON parsing fails
    throw new Error('Could not parse nutrition data');
  } catch (error) {
    console.error('Error analyzing food:', error);
    
    // Provide reasonable defaults based on common foods
    const defaultNutrition = getDefaultNutrition(foodName, quantity);
    return {
      foodName: foodName,
      ...defaultNutrition
    };
  }
}

function getDefaultNutrition(foodName: string, quantity: string): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const food = foodName.toLowerCase();
  
  // Basic nutrition estimates for common foods
  if (food.includes('apple') || food.includes('fruit')) {
    return { calories: 80, protein: 0.5, carbs: 20, fat: 0.3 };
  } else if (food.includes('chicken') || food.includes('meat')) {
    return { calories: 250, protein: 25, carbs: 0, fat: 14 };
  } else if (food.includes('rice') || food.includes('pasta')) {
    return { calories: 200, protein: 4, carbs: 45, fat: 0.5 };
  } else if (food.includes('salad') || food.includes('vegetable')) {
    return { calories: 50, protein: 2, carbs: 10, fat: 0.5 };
  } else if (food.includes('bread') || food.includes('sandwich')) {
    return { calories: 150, protein: 5, carbs: 30, fat: 2 };
  } else if (food.includes('egg')) {
    return { calories: 70, protein: 6, carbs: 0.5, fat: 5 };
  } else if (food.includes('milk') || food.includes('yogurt')) {
    return { calories: 100, protein: 8, carbs: 12, fat: 3 };
  }
  
  // Default for unknown foods
  return { calories: 150, protein: 8, carbs: 20, fat: 5 };
}

export async function getPersonalizedGreeting(profile: UserProfile, currentMood: string): Promise<string> {
  const messages: CoreMessage[] = [
    {
      role: 'system',
      content: `You are a caring, enthusiastic AI wellness companion. Generate a warm, personalized greeting based on the user's profile. Be encouraging, positive, and mention their health goals. Keep it under 50 words and use emojis appropriately.`
    },
    {
      role: 'user',
      content: `Generate a greeting for:
      - Name: ${profile.name}
      - Goal: ${profile.goal}
      - Current mood: ${currentMood}
      - Exercise: ${profile.exerciseDuration} minutes/day
      
      Make it warm, encouraging, and personalized.`
    }
  ];

  try {
    return await chatWithAI(messages);
  } catch (error) {
    console.error('Error generating greeting:', error);
    return `Hello ${profile.name}! 😊 Ready to continue your wellness journey today? I'm here to help you achieve your ${profile.goal.replace('_', ' ')} goals! 💪✨`;
  }
}

export async function getMotivationalMessage(profile: UserProfile, context: string): Promise<string> {
  const messages: CoreMessage[] = [
    {
      role: 'system',
      content: `You are an encouraging AI wellness companion. Provide motivational messages based on the user's context. Be positive, supportive, and actionable. Keep it under 40 words.`
    },
    {
      role: 'user',
      content: `Generate motivation for:
      - User: ${profile.name}
      - Goal: ${profile.goal}
      - Context: ${context}
      
      Be encouraging and specific to their situation.`
    }
  ];

  try {
    return await chatWithAI(messages);
  } catch (error) {
    console.error('Error generating motivation:', error);
    return `You're doing great, ${profile.name}! Every healthy choice brings you closer to your goals. Keep it up! 🌟💪`;
  }
}