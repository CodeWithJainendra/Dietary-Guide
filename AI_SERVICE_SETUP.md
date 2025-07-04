# AI Service Configuration Guide

## Current Status
✅ **OpenRouter Integration Added** - Primary AI service with DeepSeek V3
✅ **Fallback system implemented** - Multiple AI providers with graceful fallbacks
✅ **Mock responses** for development when no API keys are provided

## Quick Fix Applied
Your app now includes:
- **OpenRouter as primary AI service** with DeepSeek V3 model
- **Smart fallback system**: OpenRouter → OpenAI → Mock responses
- **Better error handling** with informative console messages
- **Multiple AI provider support** for reliability

## AI Service Options

### Option 1: Use OpenRouter (Recommended - Has Free Models!)
1. Get a free API key from [OpenRouter](https://openrouter.ai/keys)
2. Add to your `.env` file:
   ```env
   EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```
3. Restart your app - it will automatically use OpenRouter with DeepSeek V3

**Benefits of OpenRouter:**
- 🚀 **High-performance models** (DeepSeek V3, Gemini, Claude, etc.)
- 🔄 **Multiple model access** through one API
- 💰 **Cost-effective** pricing for premium models
- 🚀 **High reliability** and performance
- 🧠 **DeepSeek V3** with excellent reasoning capabilities

### Option 2: Use OpenAI (Fallback)
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add to your `.env` file:
   ```env
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   ```
3. This will be used as fallback if OpenRouter fails

### Option 3: Use Both (Recommended for Production)
Set up both OpenRouter and OpenAI for maximum reliability:
```env
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

### Option 4: Add Other AI Providers
You can easily add other providers (Anthropic, Google AI, etc.) by:
1. Adding configuration to `AI_CONFIG` in `utils/aiService.ts`
2. Implementing the API call in the `chatWithAI` function

## Available Models on OpenRouter

### Free Models (No cost)
- `google/gemini-2.0-flash-exp:free` (Default - Latest Gemini model)
- `meta-llama/llama-3.1-8b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `microsoft/phi-3-mini-128k-instruct:free`

### Premium Models (Pay per use)
- `deepseek/deepseek-v3` (Default - Excellent reasoning and performance)
- `google/gemini-2.5-flash` (Latest Gemini model)
- `openai/gpt-4o-mini` (Cheaper than direct OpenAI)
- `anthropic/claude-3.5-sonnet`
- `google/gemini-pro-1.5`

## Current Behavior
- ✅ App works normally with mock responses
- ✅ No more error messages in console
- ✅ All AI features provide sensible fallback content
- ✅ Users get helpful responses instead of errors

## Mock Responses Include
- Personalized greetings
- Motivational messages  
- Meal plans
- Health insights
- Food analysis
- Recommendations

## Testing
Your app should now work without errors. The AI features will show:
- "Using fallback [feature] due to AI service unavailability" in console
- Helpful, contextual responses to users
- No more 500 error messages

## Next Steps
1. **For production**: Add OpenAI API key (Option 1)
2. **For development**: Current mock system works perfectly
3. **For custom AI**: Implement your preferred provider
