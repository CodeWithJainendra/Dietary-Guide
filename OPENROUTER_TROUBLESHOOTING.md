# OpenRouter 401 Error Troubleshooting

## 🚨 Current Issue
You're getting a **401 Unauthorized** error from OpenRouter API, which means there's an authentication problem.

## 🔍 Quick Diagnosis

### Step 1: Test Your Setup
I've added a **🧪 Test AI** button to your home screen. Tap it to see detailed error information in the console.

### Step 2: Check Your API Key Format
Your API key should look like: `sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Common Issues:**
- ❌ Missing `sk-or-v1-` prefix
- ❌ Extra spaces or characters
- ❌ Incomplete key (too short)
- ❌ Wrong key type (not OpenRouter)

### Step 3: Verify Key is Active
1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Check if your key is listed and active
3. Try regenerating the key if needed

## 🛠️ Troubleshooting Steps

### Option 1: Try Free Model First
Update your `.env` to use a free model:
```env
EXPO_PUBLIC_OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

### Option 2: Check Account Status
- Ensure your OpenRouter account is verified
- Check if you have any usage limits or restrictions
- Verify your account isn't suspended

### Option 3: Test with Different Model
Try these models in order:
1. `google/gemini-2.0-flash-exp:free` (Free)
2. `meta-llama/llama-3.1-8b-instruct:free` (Free)
3. `google/gemini-2.5-flash` (Paid - requires credits)

### Option 4: API Key Regeneration
1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Delete your current key
3. Create a new key
4. Update your `.env` file
5. Restart your app

## 🔧 Debug Information

### Check Console Output
After tapping the **🧪 Test AI** button, look for:
- API key format validation
- Exact error response from OpenRouter
- Request headers and payload

### Expected Success Output
```
✅ OpenRouter test successful!
🤖 Response: OpenRouter working!
```

### Common Error Messages
- **401 Unauthorized**: API key issue
- **402 Payment Required**: Need credits for paid model
- **429 Rate Limited**: Too many requests
- **500 Server Error**: OpenRouter service issue

## 🎯 Quick Fixes

### Fix 1: Use Free Model
```env
EXPO_PUBLIC_OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

### Fix 2: Verify Key Format
Your key in `.env` should be:
```env
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-your-actual-long-key-here
```

### Fix 3: Restart Everything
1. Save your `.env` changes
2. Stop your Expo server (Ctrl+C)
3. Run `npm start` again
4. Test the AI button

## 📞 Still Not Working?

### Fallback Options
1. **Use OpenAI instead**: Add `EXPO_PUBLIC_OPENAI_API_KEY`
2. **Use mock responses**: Remove API keys to use fallback
3. **Check OpenRouter status**: Visit [status.openrouter.ai](https://status.openrouter.ai)

### Get Help
- Check OpenRouter Discord/Support
- Verify your account email is confirmed
- Ensure you're not in a restricted region

## ✅ Success Indicators
When working correctly, you'll see:
- ✅ "OpenRouter AI response generated successfully" in console
- 🤖 Actual AI responses in your app
- No more "Using mock AI response" messages

The **🧪 Test AI** button will help identify the exact issue! 🎯
