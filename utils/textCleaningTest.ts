/**
 * Test utility for AI insights text cleaning functionality
 */

// Test function to verify markdown cleaning
export const testTextCleaning = () => {
  const cleanText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold** formatting
      .replace(/\*(.*?)\*/g, '$1')     // Remove *italic* formatting
      .replace(/^\d+\.\s*/, '')        // Remove numbered list markers
      .replace(/^[-•*]\s*/, '')        // Remove bullet points
      .trim();
  };

  const testCases = [
    {
      input: '1. **Nutrient-Dense Foods**: Focus on incorporating calorie-rich, nutritious foods like nuts, avocados, whole grains, and lean proteins.',
      expected: 'Nutrient-Dense Foods: Focus on incorporating calorie-rich, nutritious foods like nuts, avocados, whole grains, and lean proteins.'
    },
    {
      input: '3. **Frequent Meals**: Try eating 5-6 smaller meals throughout the day.',
      expected: 'Frequent Meals: Try eating 5-6 smaller meals throughout the day.'
    },
    {
      input: '• *Exercise regularly* for better health',
      expected: 'Exercise regularly for better health'
    },
    {
      input: '- **Important**: This is a test',
      expected: 'Important: This is a test'
    }
  ];

  console.log('🧪 Testing text cleaning functionality...');
  
  testCases.forEach((testCase, index) => {
    const result = cleanText(testCase.input);
    const passed = result === testCase.expected;
    
    console.log(`\nTest ${index + 1}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Input:    "${testCase.input}"`);
    console.log(`Expected: "${testCase.expected}"`);
    console.log(`Result:   "${result}"`);
    
    if (!passed) {
      console.log(`❌ Mismatch detected!`);
    }
  });

  const allPassed = testCases.every(testCase => cleanText(testCase.input) === testCase.expected);
  console.log(`\n📊 Overall Result: ${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);
  
  return allPassed;
};

// Sample AI insights with markdown formatting for testing
export const sampleInsightsWithMarkdown = `
Exercise Insights

1. **Nutrient-Dense Foods**: Focus on incorporating calorie-rich, nutritious foods like nuts, avocados, whole grains, and lean proteins. These will help you gain weight healthily while providing essential nutrients.

2. **Strength Training**: Incorporate resistance exercises 2-3 times per week to build muscle mass alongside your weight gain goals.

Exercise Insights

3. **Frequent Meals**: Try eating 5-6 smaller meals throughout the day. This can help increase your calorie intake without feeling overly full.

4. **Healthy Fats**: Include sources like olive oil, nuts, seeds, and fatty fish in your diet for calorie-dense nutrition.

Sleep & Recovery

5. **Quality Sleep**: Aim for 7-9 hours of quality sleep per night to support muscle recovery and overall health.

6. **Hydration**: Stay well-hydrated throughout the day, especially during and after workouts.
`;

// Function to demonstrate the parsing in action
export const demonstrateParsing = () => {
  console.log('🔍 Demonstrating AI insights parsing...');
  console.log('\n📝 Original text with markdown:');
  console.log(sampleInsightsWithMarkdown);
  
  // This would be the same parsing logic as in the component
  const parseHealthInsights = (insights: string) => {
    if (!insights) return null;
    
    const cleanText = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^\d+\.\s*/, '')
        .replace(/^[-•*]\s*/, '')
        .trim();
    };
    
    const sections = [];
    const lines = insights.split('\n').filter(line => line.trim());
    
    let currentSection = { type: 'general', title: 'Health Overview', items: [] };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      const cleanedLine = cleanText(trimmedLine);
      if (!cleanedLine) continue;
      
      if (trimmedLine.toLowerCase().includes('exercise') || trimmedLine.toLowerCase().includes('activity')) {
        if (currentSection.items.length > 0) sections.push(currentSection);
        currentSection = { type: 'exercise', title: 'Exercise Insights', items: [] };
        continue;
      } else if (trimmedLine.toLowerCase().includes('sleep') || trimmedLine.toLowerCase().includes('rest')) {
        if (currentSection.items.length > 0) sections.push(currentSection);
        currentSection = { type: 'sleep', title: 'Sleep & Recovery', items: [] };
        continue;
      } else {
        if (cleanedLine.length > 10) {
          currentSection.items.push(cleanedLine);
        }
      }
    }
    
    if (currentSection.items.length > 0) sections.push(currentSection);
    return sections.filter(section => section.items.length > 0);
  };
  
  const parsed = parseHealthInsights(sampleInsightsWithMarkdown);
  
  console.log('\n✨ Parsed and cleaned result:');
  parsed?.forEach((section, index) => {
    console.log(`\n📋 Section ${index + 1}: ${section.title} (${section.type})`);
    section.items.forEach((item, itemIndex) => {
      console.log(`   ${itemIndex + 1}. ${item}`);
    });
  });
  
  return parsed;
};

// Export for use in development/testing
export default {
  testTextCleaning,
  demonstrateParsing,
  sampleInsightsWithMarkdown
};
