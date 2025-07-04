# OpenRouter Integration Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Get Your OpenRouter API Key
1. Go to [OpenRouter.ai](https://openrouter.ai/keys)
2. Sign up for a free account
3. Create a new API key
4. Copy your API key

### Step 2: Add API Key to Your App
1. Open your `.env` file
2. Replace `your_openrouter_api_key_here` with your actual API key:
   ```env
   EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```

### Step 3: Restart Your App
```bash
npm start
```

That's it! Your app now uses DeepSeek V3 for all AI features.

## 🎯 What You Get

### ✅ Fixed Issues
- ❌ No more "HTTP error! status: 500" errors
- ❌ No more "Failed to get AI response" errors
- ✅ All AI features working perfectly

### 🤖 AI Features Now Working
- **Personalized Greetings** - Welcome messages based on your profile
- **Motivational Messages** - Encouragement based on your progress
- **Meal Planning** - AI-generated meal suggestions
- **Health Insights** - Personalized health advice
- **Food Analysis** - Nutritional information for logged foods
- **Chat Assistant** - Ask nutrition questions anytime

### 🚀 DeepSeek V3 Benefits
- **DeepSeek V3** - Latest high-performance model
- **Excellent reasoning capabilities** for nutrition advice
- **Cost-effective** pricing on OpenRouter
- **Fast response times** and reliable performance

## 🔧 Advanced Configuration

### Change AI Model
To use a different model, add this to your `.env`:
```env
EXPO_PUBLIC_OPENROUTER_MODEL=your-preferred-model
```

### Available Models

#### Free Models (Recommended)
- `google/gemini-2.0-flash-exp:free` (Default - Best for nutrition)
- `meta-llama/llama-3.1-8b-instruct:free` (Good general purpose)
- `mistralai/mistral-7b-instruct:free` (Fast responses)

#### Premium Models (Pay per use)
- `deepseek/deepseek-v3` (Default - Excellent reasoning and performance)
- `google/gemini-2.0-flash-thinking-exp` (Advanced reasoning)
- `openai/gpt-4o-mini` (Cheaper than direct OpenAI)
- `anthropic/claude-3.5-sonnet` (Excellent for detailed advice)

### Test Your Setup
Add this to any component to test:
```typescript
import { testAIService } from '@/utils/testAI';

// Test in useEffect or button press
testAIService();
```

## 🛡️ Fallback System

Your app has multiple layers of protection:

1. **OpenRouter** (Primary) - Google Gemini 2.0 Flash
2. **OpenAI** (Fallback) - If you add OpenAI key
3. **Mock Responses** (Final fallback) - Always works

## 💰 Cost Information

### Free Tier
- **Google Gemini 2.0 Flash**: Completely free
- **No credit card required**
- **Generous usage limits**

### Paid Models
- Only pay for what you use
- Much cheaper than direct API access
- Transparent pricing at [OpenRouter Pricing](https://openrouter.ai/docs#models)

## 🔍 Troubleshooting

### Common Issues

**"AI service unavailable"**
- Check your API key in `.env`
- Restart your app after adding the key
- Verify key is valid at OpenRouter dashboard

**"Using fallback responses"**
- This is normal if no API key is set
- Add your OpenRouter API key to enable AI features

**Rate limiting**
- Free models have generous limits
- Consider upgrading to paid models for heavy usage

### Debug Mode
Enable detailed logging by adding to your component:
```typescript
import { getAIServiceStatus, logAvailableModels } from '@/utils/aiService';

console.log(getAIServiceStatus());
logAvailableModels();
```

## 🎉 Success!

Once set up, you'll see:
- ✅ "OpenRouter AI response generated successfully" in console
- 🤖 Personalized AI responses throughout the app
- 🚀 Fast, reliable AI features

Your nutrition app is now powered by cutting-edge AI! 🎊
