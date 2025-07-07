/**
 * Test file for RAG (Retrieval-Augmented Generation) functionality
 * This file contains test functions to verify that the RAG system is working correctly
 */

import { getUserContext, chatWithAIRAG } from './aiService';
import { CoreMessage } from '@/types';

/**
 * Test function to verify user context retrieval
 */
export async function testUserContextRetrieval(userId: string) {
  console.log('🧪 Testing RAG User Context Retrieval...');
  console.log('User ID:', userId);
  
  try {
    const context = await getUserContext(userId);
    
    console.log('✅ User Context Retrieved Successfully:');
    console.log('📊 Profile:', context.profile ? 'Found' : 'Not found');
    console.log('🍽️ Recent Meals:', context.recentMeals.length);
    console.log('📈 Today\'s Summary:', {
      meals: context.mealSummary.totalMealsToday,
      calories: context.mealSummary.totalCaloriesToday,
      protein: context.mealSummary.totalProteinToday.toFixed(1) + 'g'
    });
    console.log('🔍 Insights:', {
      avgCalories: context.nutritionInsights.averageDailyCalories,
      proteinPattern: context.nutritionInsights.proteinIntakePattern,
      mealTiming: context.nutritionInsights.mealTimingPattern
    });
    
    return context;
  } catch (error) {
    console.error('❌ Error testing user context retrieval:', error);
    throw error;
  }
}

/**
 * Test function to verify RAG-enhanced chat responses
 */
export async function testRAGChatResponse(userId: string, testMessage: string = "What should I eat for dinner?") {
  console.log('🧪 Testing RAG Chat Response...');
  console.log('User ID:', userId);
  console.log('Test Message:', testMessage);
  
  try {
    const messages: CoreMessage[] = [
      { role: 'user', content: testMessage }
    ];
    
    console.log('🤖 Generating RAG-enhanced response...');
    const response = await chatWithAIRAG(messages, userId);
    
    console.log('✅ RAG Response Generated Successfully:');
    console.log('📝 Response Length:', response.length, 'characters');
    console.log('🎯 Response Preview:', response.substring(0, 100) + '...');
    
    // Check if response seems personalized (contains user-specific terms)
    const personalizationIndicators = [
      'your', 'you\'ve', 'based on', 'considering', 'given', 'since you'
    ];
    const hasPersonalization = personalizationIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );
    
    console.log('🎯 Personalization Detected:', hasPersonalization ? 'Yes' : 'No');
    
    return response;
  } catch (error) {
    console.error('❌ Error testing RAG chat response:', error);
    throw error;
  }
}

/**
 * Compare RAG vs non-RAG responses
 */
export async function compareRAGvsNonRAG(userId: string, testMessage: string = "What should I eat for lunch?") {
  console.log('🧪 Comparing RAG vs Non-RAG Responses...');
  
  try {
    const messages: CoreMessage[] = [
      { role: 'user', content: testMessage }
    ];
    
    // Get RAG response
    console.log('🤖 Getting RAG response...');
    const ragResponse = await chatWithAIRAG(messages, userId);
    
    // Get non-RAG response (without userId)
    console.log('🤖 Getting non-RAG response...');
    const nonRAGResponse = await chatWithAIRAG(messages); // No userId
    
    console.log('✅ Comparison Results:');
    console.log('📊 RAG Response Length:', ragResponse.length);
    console.log('📊 Non-RAG Response Length:', nonRAGResponse.length);
    console.log('🎯 RAG Response:', ragResponse.substring(0, 150) + '...');
    console.log('🎯 Non-RAG Response:', nonRAGResponse.substring(0, 150) + '...');
    
    return {
      ragResponse,
      nonRAGResponse,
      ragLength: ragResponse.length,
      nonRAGLength: nonRAGResponse.length
    };
  } catch (error) {
    console.error('❌ Error comparing responses:', error);
    throw error;
  }
}

/**
 * Run all RAG tests
 */
export async function runAllRAGTests(userId: string) {
  console.log('🚀 Running All RAG Tests...');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: User Context Retrieval
    console.log('\n1️⃣ Testing User Context Retrieval');
    await testUserContextRetrieval(userId);
    
    // Test 2: RAG Chat Response
    console.log('\n2️⃣ Testing RAG Chat Response');
    await testRAGChatResponse(userId);
    
    // Test 3: Compare RAG vs Non-RAG
    console.log('\n3️⃣ Comparing RAG vs Non-RAG');
    await compareRAGvsNonRAG(userId);
    
    console.log('\n✅ All RAG Tests Completed Successfully!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('\n❌ RAG Tests Failed:', error);
    console.log('=' .repeat(50));
    throw error;
  }
}

/**
 * Quick RAG status check
 */
export function getRAGStatus() {
  return {
    ragEnabled: true,
    features: [
      'User Profile Integration',
      'Meal History Analysis',
      'Personalized Nutrition Insights',
      'Context-Aware Responses',
      'Real-time Data Retrieval'
    ],
    description: 'RAG system retrieves user profile and meal data to provide personalized AI responses'
  };
}
