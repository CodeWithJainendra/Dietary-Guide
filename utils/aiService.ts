import { UserProfile, MealEntry, CoreMessage } from '@/types';

// AI Service Configuration
const AI_CONFIG = {
  // Google Gemini - Primary AI service (FREE)
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
    enabled: !!process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
    model: process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash',
  },
  // Fallback to OpenAI (if API key is provided)
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    enabled: !!process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
  },
  // Legacy OpenRouter (deprecated)
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    enabled: false, // Disabled in favor of Gemini
    apiKey: null,
    model: null,
  },
  // Local/Mock mode for development
  mock: {
    enabled: true, // Always available as final fallback
  }
};

// Available Google Gemini models
export const GEMINI_MODELS = {
  // Free models
  FREE: {
    GEMINI_1_5_FLASH: 'gemini-1.5-flash', // Default - Latest Gemini Flash (FREE)
    GEMINI_1_5_FLASH_8B: 'gemini-1.5-flash-8b',
  },
  // Premium models
  PREMIUM: {
    GEMINI_1_5_PRO: 'gemini-1.5-pro',
    GEMINI_1_0_PRO: 'gemini-1.0-pro',
  }
};

// Utility function to get current AI service status
export function getAIServiceStatus() {
  const apiKey = AI_CONFIG.gemini.apiKey;
  const isValidFormat = apiKey?.startsWith('AIza') && apiKey.length > 30;

  return {
    gemini: AI_CONFIG.gemini.enabled,
    openai: AI_CONFIG.openai.enabled,
    model: AI_CONFIG.gemini.model,
    fallbackAvailable: AI_CONFIG.mock.enabled,
    apiKeyPresent: !!apiKey,
    apiKeyFormat: apiKey?.substring(0, 10) + '...',
    apiKeyValidFormat: isValidFormat,
    needsNewKey: !isValidFormat || !AI_CONFIG.gemini.enabled,
    // Legacy OpenRouter status (deprecated)
    openrouter: false,
  };
}

// Quick test function for Google Gemini
export async function testGeminiConnection(): Promise<{ success: boolean; message: string; response?: string }> {
  if (!AI_CONFIG.gemini.enabled || !AI_CONFIG.gemini.apiKey) {
    return {
      success: false,
      message: 'Google Gemini API key not configured. Please add EXPO_PUBLIC_GOOGLE_API_KEY to your .env file.'
    };
  }

  console.log('🧪 Testing Google Gemini connection...');

  try {
    const url = `${AI_CONFIG.gemini.url}/${AI_CONFIG.gemini.model}:generateContent?key=${AI_CONFIG.gemini.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Hello! Please respond with "Gemini Flash working!" and give me one healthy food tip.'
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response content';
      console.log('✅ Gemini test successful!');
      console.log('🤖 AI Response:', aiResponse);

      return {
        success: true,
        message: 'Google Gemini Flash is working perfectly!',
        response: aiResponse
      };
    } else {
      const errorText = await response.text();
      console.error('❌ Gemini test failed:', response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: 'API key is invalid. Please check your Google API key from https://aistudio.google.com/app/apikey'
        };
      }

      return {
        success: false,
        message: `API error: ${response.status} - ${errorText}`
      };
    }
  } catch (error) {
    console.error('❌ Gemini connection error:', error);
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Test Google Gemini with manual API key (for debugging)
export async function testGeminiWithKey(apiKey: string): Promise<boolean> {
  console.log('🧪 Testing Gemini with provided key...');
  console.log('🔑 Key format check:', {
    length: apiKey.length,
    startsCorrect: apiKey.startsWith('AIza'),
    preview: apiKey.substring(0, 10) + '...',
  });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            {
              text: 'Hello, please respond with just "Gemini working!"'
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 50,
      }
    };

    console.log('📤 Manual Gemini test request:', {
      url: url.replace(apiKey, apiKey.substring(0, 10) + '...'),
      body,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Manual Gemini test successful!');
      console.log('🤖 Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Manual Gemini test failed:', response.status, response.statusText);
      console.error('📄 Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Manual Gemini connection error:', error);
    return false;
  }
}

// Legacy function - now redirects to Gemini
export async function testOpenRouterConnection(): Promise<boolean> {
  console.log('🔄 Redirecting to Gemini test...');
  const result = await testGeminiConnection();
  return result.success;
}

// Enhanced Mock AI responses for development/fallback
const MOCK_RESPONSES = {
  greeting: (profile: UserProfile, _mood: string) => {
    const goalText = profile.goal.replace('_', ' ');
    const greetings = [
      `Hello ${profile.name}! 😊 Ready to continue your ${goalText} journey today? I'm here to help you stay motivated! 💪✨`,
      `Good to see you, ${profile.name}! 🌟 Let's make today count towards your ${goalText} goals! 🚀`,
      `Hey ${profile.name}! 👋 Your dedication to ${goalText} is inspiring. What's on the agenda today? 💪`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  },

  motivation: (profile: UserProfile, _context: string) => {
    const motivations = [
      `You're doing amazing, ${profile.name}! Every healthy choice brings you closer to your goals. Keep it up! 🌟💪`,
      `${profile.name}, your consistency is your superpower! Small steps lead to big changes. 🚀✨`,
      `Keep pushing forward, ${profile.name}! Your future self will thank you for the effort you're putting in today! 💪🌟`
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
  },

  mealPlan: (profile: UserProfile) => {
    const goalText = profile.goal.replace('_', ' ');
    if (profile.goal === 'weight_gain') {
      return `Here's a calorie-rich meal plan for your ${goalText} goal:\n\n🍳 **Breakfast**: Oatmeal with banana, nuts, and honey + Greek yogurt\n🥗 **Lunch**: Grilled chicken with quinoa and avocado salad\n🍽️ **Dinner**: Salmon with sweet potato and steamed vegetables\n🥤 **Snacks**: Protein smoothie, nuts, and dried fruits\n\n💡 Focus on nutrient-dense, calorie-rich foods!`;
    } else if (profile.goal === 'weight_loss') {
      return `Here's a balanced meal plan for your ${goalText} goal:\n\n🍳 **Breakfast**: Vegetable omelet with whole grain toast\n🥗 **Lunch**: Grilled chicken salad with mixed greens\n🍽️ **Dinner**: Baked fish with roasted vegetables\n🥤 **Snacks**: Fresh fruits and herbal tea\n\n💡 Focus on portion control and nutrient density!`;
    } else {
      return `Here's a balanced meal plan for your ${goalText} goal:\n\n🍳 **Breakfast**: Oatmeal with berries and nuts\n🥗 **Lunch**: Grilled chicken salad with mixed vegetables\n🍽️ **Dinner**: Baked salmon with quinoa and steamed broccoli\n🥤 **Snacks**: Greek yogurt and fresh fruits\n\n💡 Stay hydrated and listen to your body's hunger cues!`;
    }
  },

  healthInsights: (profile: UserProfile) => {
    const bmi = profile.height && profile.weight
      ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
      : null;

    return `Great progress on your wellness journey, ${profile.name}! Here are some key insights:\n\n✅ Your ${profile.goal.replace('_', ' ')} goal is achievable with consistency\n✅ ${profile.exerciseDuration} minutes of daily exercise is ${profile.exerciseDuration >= 30 ? 'excellent' : 'a good start'}\n${bmi ? `✅ Your BMI is ${bmi} - keep monitoring your progress\n` : ''}✅ Stay consistent with your healthy habits\n\n🌟 Remember: Progress, not perfection!`;
  },

  foodAnalysis: (foodName: string) => {
    // More realistic food analysis based on common foods
    const food = foodName.toLowerCase();
    if (food.includes('apple')) return { foodName, calories: 95, protein: 0.5, carbs: 25, fat: 0.3 };
    if (food.includes('banana')) return { foodName, calories: 105, protein: 1.3, carbs: 27, fat: 0.4 };
    if (food.includes('chicken')) return { foodName, calories: 231, protein: 43.5, carbs: 0, fat: 5 };
    if (food.includes('rice')) return { foodName, calories: 205, protein: 4.3, carbs: 45, fat: 0.4 };
    if (food.includes('bread')) return { foodName, calories: 265, protein: 9, carbs: 49, fat: 3.2 };
    if (food.includes('egg')) return { foodName, calories: 155, protein: 13, carbs: 1.1, fat: 11 };

    // Default values
    return { foodName, calories: 200, protein: 10, carbs: 20, fat: 8 };
  },

  recommendations: (profile?: UserProfile) => ({
    mealSuggestion: profile?.goal === 'weight_gain'
      ? 'Try a protein-rich smoothie with banana, peanut butter, and oats for extra calories!'
      : 'Try a balanced breakfast with protein, healthy fats, and complex carbohydrates to start your day right!',
    exerciseSuggestion: `Consider a ${profile?.exerciseDuration || 30}-minute workout that matches your fitness level and goals.`,
    additionalNotes: 'Remember to stay hydrated throughout the day and listen to your body\'s hunger cues. Consistency is key!'
  }),

  chatResponse: (message: string, profile?: UserProfile) => {
    const msg = message.toLowerCase();

    if (msg.includes('food') || msg.includes('meal') || msg.includes('eat')) {
      if (profile?.goal === 'weight_gain') {
        return "For weight gain, focus on calorie-dense foods like nuts, avocados, whole grains, and lean proteins. Try adding healthy fats to your meals! 🥑🥜";
      } else if (profile?.goal === 'weight_loss') {
        return "For weight loss, prioritize lean proteins, vegetables, and whole grains. Control portions and stay hydrated! 🥗💧";
      } else {
        return "Focus on balanced nutrition with a variety of whole foods, lean proteins, healthy fats, and complex carbs! 🌟";
      }
    }

    if (msg.includes('exercise') || msg.includes('workout')) {
      return "Regular exercise is key! Start with activities you enjoy and gradually increase intensity. Even 30 minutes daily makes a difference! 💪";
    }

    if (msg.includes('motivation') || msg.includes('help')) {
      return `You're doing great, ${profile?.name || 'there'}! Every small step counts towards your health goals. Stay consistent and be patient with yourself! 🌟`;
    }

    // Default response
    return "I'm here to help with your nutrition and wellness journey! Feel free to ask about meals, exercise, or health tips. 😊";
  }
};

export async function chatWithAI(messages: CoreMessage[]): Promise<string> {
  // Try Google Gemini first (primary service)
  if (AI_CONFIG.gemini.enabled) {
    try {
      // Convert messages to Gemini format
      const geminiContents = messages
        .filter(msg => msg.role !== 'system') // Gemini handles system messages differently
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
        }));

      // Add system message as first user message if present
      const systemMessage = messages.find(msg => msg.role === 'system');
      if (systemMessage) {
        geminiContents.unshift({
          role: 'user',
          parts: [{ text: `System: ${typeof systemMessage.content === 'string' ? systemMessage.content : JSON.stringify(systemMessage.content)}` }]
        });
      }

      const url = `${AI_CONFIG.gemini.url}/${AI_CONFIG.gemini.model}:generateContent?key=${AI_CONFIG.gemini.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          console.info('✅ Google Gemini AI response generated successfully');
          return content;
        }
      } else {
        const errorText = await response.text();
        console.warn(`Gemini API returned ${response.status}: ${response.statusText}`);
        console.warn('Gemini Error Details:', errorText);

        // Check for specific authentication errors
        if (response.status === 401 || response.status === 403) {
          console.error('🔑 Google Gemini Authentication Failed:');
          console.error('- Your API key may be expired or invalid');
          console.error('- Get a new key at: https://aistudio.google.com/app/apikey');
          console.error('- Make sure key starts with "AIza"');
          console.error('- Falling back to mock responses for now');
        }
      }
    } catch (error) {
      console.warn('Gemini API failed, trying fallback:', error);
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



  // Fallback to enhanced mock response
  console.info('🤖 Using enhanced mock AI response (Gemini unavailable)');
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  const messageText = typeof userMessage === 'string' ? userMessage : '';

  // Try to get user profile from context (if available)
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  let mockProfile: Partial<UserProfile> = {};

  // Extract basic info from system message if available
  if (systemMessage.includes('weight_gain')) mockProfile.goal = 'weight_gain';
  if (systemMessage.includes('weight_loss')) mockProfile.goal = 'weight_loss';
  if (systemMessage.includes('maintenance')) mockProfile.goal = 'maintenance';
  if (systemMessage.includes('healthy_lifestyle')) mockProfile.goal = 'healthy_lifestyle';

  // Use enhanced mock response
  return MOCK_RESPONSES.chatResponse(messageText, mockProfile as UserProfile);
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