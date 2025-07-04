// Test utility for AI service integration
import { chatWithAI, getAIServiceStatus, OPENROUTER_MODELS, testOpenRouterConnection } from './aiService';
import { CoreMessage } from '@/types';

export async function testAIService() {
  console.log('🧪 Testing AI Service Integration...');

  // Check service status
  const status = getAIServiceStatus();
  console.log('📊 AI Service Status:', status);

  if (!status.openrouter && !status.openai) {
    console.log('⚠️  No AI service configured. Add EXPO_PUBLIC_OPENROUTER_API_KEY to .env');
    return false;
  }

  // Test OpenRouter connection first
  if (status.openrouter) {
    console.log('🔍 Testing OpenRouter connection...');
    const openrouterWorking = await testOpenRouterConnection();
    if (!openrouterWorking) {
      console.log('❌ OpenRouter test failed, check your API key');
      return false;
    }
  }

  // Test basic chat
  const testMessages: CoreMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant. Respond briefly and clearly.'
    },
    {
      role: 'user',
      content: 'Say hello and confirm you are working properly.'
    }
  ];

  try {
    const response = await chatWithAI(testMessages);
    console.log('✅ AI Service Test Successful!');
    console.log('🤖 AI Response:', response);
    return true;
  } catch (error) {
    console.error('❌ AI Service Test Failed:', error);
    return false;
  }
}

export function logAvailableModels() {
  console.log('📋 Available OpenRouter Models:');
  console.log('🆓 Free Models:', OPENROUTER_MODELS.FREE);
  console.log('💰 Premium Models:', OPENROUTER_MODELS.PREMIUM);
}

// Quick test for nutrition-specific AI responses
export async function testNutritionAI() {
  console.log('🥗 Testing Nutrition AI Features...');
  
  const nutritionTest: CoreMessage[] = [
    {
      role: 'system',
      content: 'You are a nutrition expert. Provide helpful, accurate nutrition advice.'
    },
    {
      role: 'user',
      content: 'Give me a quick healthy breakfast suggestion for weight loss.'
    }
  ];
  
  try {
    const response = await chatWithAI(nutritionTest);
    console.log('✅ Nutrition AI Test Successful!');
    console.log('🍳 Nutrition Advice:', response);
    return true;
  } catch (error) {
    console.error('❌ Nutrition AI Test Failed:', error);
    return false;
  }
}
