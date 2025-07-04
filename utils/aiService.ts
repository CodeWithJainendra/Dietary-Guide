import { UserProfile, MealEntry, CoreMessage } from '@/types';

// AI Service Configuration
const AI_CONFIG = {
  // OpenRouter - Primary AI service (supports multiple models)
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    enabled: !!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
    apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
    model: process.env.EXPO_PUBLIC_OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324:free',
    siteName: 'Rork AI Nutrition Companion',
    siteUrl: 'https://github.com/CodeWithJainendra/Dietary-Guide',
  },
  // Fallback to OpenAI (if API key is provided)
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    enabled: !!process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
  },
  // Legacy API (currently failing)
  primary: {
    url: 'https://toolkit.rork.com/text/llm/',
    enabled: false, // Disabled due to 500 errors
  },
  // Local/Mock mode for development
  mock: {
    enabled: true, // Always available as final fallback
  }
};

// Available OpenRouter models
export const OPENROUTER_MODELS = {
  // Free models
  FREE: {
    DEEPSEEK_V3_FREE: 'deepseek/deepseek-chat-v3-0324:free', // Default - Latest DeepSeek V3 (FREE)
    GEMINI_2_FLASH_EXP: 'google/gemini-2.0-flash-exp:free',
    LLAMA_3_1_8B: 'meta-llama/llama-3.1-8b-instruct:free',
    MISTRAL_7B: 'mistralai/mistral-7b-instruct:free',
    PHI_3_MINI: 'microsoft/phi-3-mini-128k-instruct:free',
  },
  // Premium models (cost-effective)
  PREMIUM: {
    DEEPSEEK_V3: 'deepseek/deepseek-chat', // Latest DeepSeek V3 (Paid)
    GEMINI_2_5_FLASH: 'google/gemini-2.5-flash',
    GEMINI_2_FLASH_THINKING: 'google/gemini-2.0-flash-thinking-exp',
    GPT_4O_MINI: 'openai/gpt-4o-mini',
    CLAUDE_3_5_SONNET: 'anthropic/claude-3.5-sonnet',
    GEMINI_PRO_1_5: 'google/gemini-pro-1.5',
  }
};

// Utility function to get current AI service status
export function getAIServiceStatus() {
  return {
    openrouter: AI_CONFIG.openrouter.enabled,
    openai: AI_CONFIG.openai.enabled,
    model: AI_CONFIG.openrouter.model,
    fallbackAvailable: AI_CONFIG.mock.enabled,
    apiKeyPresent: !!AI_CONFIG.openrouter.apiKey,
    apiKeyFormat: AI_CONFIG.openrouter.apiKey?.substring(0, 10) + '...',
  };
}

// Test OpenRouter connection with manual API key (for debugging)
export async function testOpenRouterWithKey(apiKey: string): Promise<boolean> {
  console.log('🧪 Testing OpenRouter with provided key...');
  console.log('🔑 Key format check:', {
    length: apiKey.length,
    startsCorrect: apiKey.startsWith('sk-or-v1-'),
    preview: apiKey.substring(0, 15) + '...',
  });

  const testMessages = [
    {
      role: 'user' as const,
      content: 'Hello, please respond with just "OpenRouter working!"'
    }
  ];

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/CodeWithJainendra/Dietary-Guide',
      'X-Title': 'Rork AI Nutrition Companion',
    };

    const body = {
      model: 'deepseek/deepseek-chat-v3-0324:free',
      messages: testMessages,
      max_tokens: 50,
      temperature: 0.1,
    };

    console.log('📤 Manual test request:', {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: { ...headers, 'Authorization': `Bearer ${apiKey.substring(0, 20)}...` },
      body,
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Manual OpenRouter test successful!');
      console.log('🤖 Response:', data.choices[0]?.message?.content);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Manual OpenRouter test failed:', response.status, response.statusText);
      console.error('📄 Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Manual OpenRouter connection error:', error);
    return false;
  }
}

// Test OpenRouter connection
export async function testOpenRouterConnection(): Promise<boolean> {
  if (!AI_CONFIG.openrouter.enabled) {
    console.log('❌ OpenRouter not enabled - no API key found');
    return false;
  }

  console.log('🧪 Testing OpenRouter connection...');
  console.log('📊 Config:', {
    url: AI_CONFIG.openrouter.url,
    model: AI_CONFIG.openrouter.model,
    keyPresent: !!AI_CONFIG.openrouter.apiKey,
    keyLength: AI_CONFIG.openrouter.apiKey?.length,
    keyFormat: AI_CONFIG.openrouter.apiKey?.substring(0, 15) + '...',
    keyStartsWith: AI_CONFIG.openrouter.apiKey?.startsWith('sk-or-v1-'),
  });

  console.log('🔍 Environment check:', {
    envKeyExists: !!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
    envKeyLength: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY?.length,
    envKeyStart: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY?.substring(0, 15),
  });

  const testMessages = [
    {
      role: 'user' as const,
      content: 'Hello, please respond with just "OpenRouter working!"'
    }
  ];

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_CONFIG.openrouter.apiKey}`,
      'HTTP-Referer': AI_CONFIG.openrouter.siteUrl,
      'X-Title': AI_CONFIG.openrouter.siteName,
    };

    const body = {
      model: AI_CONFIG.openrouter.model,
      messages: testMessages,
      max_tokens: 50,
      temperature: 0.1,
    };

    console.log('📤 Request headers:', {
      ...headers,
      'Authorization': `Bearer ${AI_CONFIG.openrouter.apiKey?.substring(0, 20)}...`,
    });
    console.log('📤 Request body:', body);

    const response = await fetch(AI_CONFIG.openrouter.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenRouter test successful!');
      console.log('🤖 Response:', data.choices[0]?.message?.content);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ OpenRouter test failed:', response.status, response.statusText);
      console.error('📄 Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ OpenRouter connection error:', error);
    return false;
  }
}

// Mock AI responses for development/fallback
const MOCK_RESPONSES = {
  greeting: (profile: UserProfile, _mood: string) =>
    `Hello ${profile.name}! 😊 Ready to continue your ${profile.goal.replace('_', ' ')} journey today? I'm here to help you stay motivated! 💪✨`,

  motivation: (profile: UserProfile, _context: string) =>
    `You're doing amazing, ${profile.name}! Every healthy choice brings you closer to your goals. Keep it up! 🌟💪`,

  mealPlan: (profile: UserProfile) =>
    `Here's a balanced meal plan for your ${profile.goal.replace('_', ' ')} goal:\n\n🍳 Breakfast: Oatmeal with berries and nuts\n🥗 Lunch: Grilled chicken salad with mixed vegetables\n🍽️ Dinner: Baked salmon with quinoa and steamed broccoli\n\nStay hydrated and listen to your body's hunger cues!`,

  healthInsights: (profile: UserProfile) =>
    `Great progress on your wellness journey! Based on your profile, here are some key insights:\n\n✅ Your ${profile.goal.replace('_', ' ')} goal is achievable\n✅ ${profile.exerciseDuration} minutes of daily exercise is excellent\n✅ Stay consistent with your healthy habits\n\nKeep up the fantastic work! 🌟`,

  foodAnalysis: (foodName: string) => ({
    foodName: foodName,
    calories: 200,
    protein: 10,
    carbs: 20,
    fat: 8
  }),

  recommendations: () => ({
    mealSuggestion: 'Try a balanced breakfast with protein, healthy fats, and complex carbohydrates to start your day right!',
    exerciseSuggestion: 'Consider a 30-minute walk or light workout to boost your energy and mood.',
    additionalNotes: 'Remember to stay hydrated throughout the day and listen to your body\'s hunger cues.'
  })
};

export async function chatWithAI(messages: CoreMessage[]): Promise<string> {
  // Try OpenRouter first (primary service)
  if (AI_CONFIG.openrouter.enabled) {
    try {
      const response = await fetch(AI_CONFIG.openrouter.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.openrouter.apiKey}`,
          'HTTP-Referer': AI_CONFIG.openrouter.siteUrl,
          'X-Title': AI_CONFIG.openrouter.siteName,
        },
        body: JSON.stringify({
          model: AI_CONFIG.openrouter.model,
          messages: messages,
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          console.info('✅ OpenRouter AI response generated successfully');
          return content;
        }
      } else {
        const errorText = await response.text();
        console.warn(`OpenRouter API returned ${response.status}: ${response.statusText}`);
        console.warn('OpenRouter Error Details:', errorText);

        // Check for specific 401 error
        if (response.status === 401) {
          console.error('🔑 OpenRouter Authentication Failed:');
          console.error('- Check your API key in .env file');
          console.error('- Verify key is valid at https://openrouter.ai/keys');
          console.error('- Make sure key starts with "sk-or-v1-"');
        }
      }
    } catch (error) {
      console.warn('OpenRouter API failed, trying fallback:', error);
    }
  }

  // Try OpenAI as fallback
  if (AI_CONFIG.openai.enabled) {
    try {
      const response = await fetch(AI_CONFIG.openai.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.openai.model,
          messages: messages,
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          console.info('✅ OpenAI fallback response generated successfully');
          return content;
        }
      }
    } catch (error) {
      console.warn('OpenAI API failed, falling back to mock responses:', error);
    }
  }

  // Try primary API if enabled (currently disabled due to 500 errors)
  if (AI_CONFIG.primary.enabled) {
    try {
      const response = await fetch(AI_CONFIG.primary.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.completion || 'Sorry, I could not generate a response.';
      }
    } catch (error) {
      console.warn('Primary AI API failed, falling back to mock responses:', error);
    }
  }

  // Fallback to mock response
  console.info('Using mock AI response for development');
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  const messageText = typeof userMessage === 'string' ? userMessage : '';

  // Simple keyword-based mock responses
  if (messageText.toLowerCase().includes('greeting') || messageText.toLowerCase().includes('hello')) {
    return 'Hello! I\'m your AI wellness companion. How can I help you with your health journey today? 😊';
  }

  if (messageText.toLowerCase().includes('motivation')) {
    return 'You\'re doing great! Every healthy choice you make is a step towards your goals. Keep up the excellent work! 💪✨';
  }

  if (messageText.toLowerCase().includes('meal plan')) {
    return 'Here\'s a balanced meal suggestion: Focus on lean proteins, whole grains, and plenty of vegetables. Stay hydrated! 🥗';
  }

  return 'I\'m here to help with your wellness journey! While my AI service is temporarily unavailable, I can still provide basic guidance and support. 😊';
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

  try {
    return await chatWithAI(messages);
  } catch (error) {
    console.info('Using fallback meal plan due to AI service unavailability');
    return MOCK_RESPONSES.mealPlan(profile);
  }
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

  try {
    return await chatWithAI(messages);
  } catch (error) {
    console.info('Using fallback health insights due to AI service unavailability');
    return MOCK_RESPONSES.healthInsights(profile);
  }
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
    console.info('Using fallback food analysis due to AI service unavailability');

    // Use mock response first, then fallback to default nutrition
    const mockResponse = MOCK_RESPONSES.foodAnalysis(foodName);
    const defaultNutrition = getDefaultNutrition(foodName, quantity);

    return {
      foodName: foodName,
      calories: defaultNutrition.calories || mockResponse.calories,
      protein: defaultNutrition.protein || mockResponse.protein,
      carbs: defaultNutrition.carbs || mockResponse.carbs,
      fat: defaultNutrition.fat || mockResponse.fat,
    };
  }
}

function getDefaultNutrition(foodName: string, _quantity: string): {
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
    console.info('Using fallback greeting due to AI service unavailability');
    return MOCK_RESPONSES.greeting(profile, currentMood);
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
    console.info('Using fallback motivation due to AI service unavailability');
    return MOCK_RESPONSES.motivation(profile, context);
  }
}