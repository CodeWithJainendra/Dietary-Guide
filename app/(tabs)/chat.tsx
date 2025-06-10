import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { useNutritionStore } from '@/store/nutritionStore';
import ChatMessage from '@/components/ChatMessage';
import { Message, CoreMessage } from '@/types';
import { chatWithAI } from '@/utils/aiService';
import { Send, Sparkles, Mic, MicOff } from 'lucide-react-native';

export default function ChatScreen() {
  const { colors } = useTheme();
  const { messages, addMessage, isLoading, setLoading } = useChatStore();
  const profile = useUserStore((state) => state.profile);
  const setAvatarMood = useNutritionStore((state) => state.setAvatarMood);
  
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typingAnimation] = useState(new Animated.Value(0));
  const flatListRef = useRef<FlatList>(null);
  const screenWidth = Dimensions.get('window').width;
  
  // Initialize with a welcome message if no messages exist
  useEffect(() => {
    if (messages.length === 0 && profile) {
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now().toString(),
        role: 'assistant',
        content: `Hello ${profile.name}! 👋 I'm your AI wellness companion. I'm here to help you achieve your health goals and provide personalized nutrition advice. How can I assist you today?`,
        timestamp: Date.now(),
      };
      
      addMessage(welcomeMessage);
      
      // Speak the welcome message
      if (Platform.OS !== 'web') {
        speakMessage(welcomeMessage.content);
      }
    }
  }, [messages.length, profile, addMessage]);
  
  // Animate typing indicator
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      ).start();
    } else {
      typingAnimation.setValue(0);
    }
  }, [isLoading, typingAnimation]);
  
  const speakMessage = (text: string) => {
    if (isSpeaking) {
      // Stop speaking if already speaking
      if (Platform.OS !== 'web') {
        // This would use Speech.stop() if expo-speech was available
      }
    }
    
    setIsSpeaking(true);
    
    // Clean up text for speech (remove emojis, etc.)
    const cleanText = text.replace(/[^\x00-\x7F]/g, "").trim();
    
    // This would use Speech.speak() if expo-speech was available
    // For now, just simulate speaking
    setTimeout(() => {
      setIsSpeaking(false);
    }, 3000);
  };
  
  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now(),
    };
    
    addMessage(userMessage);
    setInputText('');
    
    // Check for mood indicators in the message and set positive moods
    const content = inputText.toLowerCase();
    if (content.includes('great') || content.includes('awesome') || content.includes('excellent')) {
      setAvatarMood('very_happy');
    } else if (content.includes('good') || content.includes('better') || content.includes('progress')) {
      setAvatarMood('proud');
    } else if (content.includes('help') || content.includes('support')) {
      setAvatarMood('caring');
    } else if (content.includes('excited') || content.includes('motivated')) {
      setAvatarMood('excited');
    } else if (content.includes('confused') || content.includes("don't know")) {
      setAvatarMood('supportive');
    } else if (content.includes('thank')) {
      setAvatarMood('humble');
    } else if (content.includes('please')) {
      setAvatarMood('polite');
    } else {
      setAvatarMood('encouraging');
    }
    
    try {
      setLoading(true);
      
      // Create system prompt with user context
      const systemPrompt = `You are a friendly, encouraging AI wellness companion. Always be positive, supportive, and motivational.
      
      User Profile:
      - Name: ${profile?.name || 'User'}
      - Height: ${profile?.height || 'Unknown'} cm
      - Weight: ${profile?.weight || 'Unknown'} kg
      - Age: ${profile?.age || 'Unknown'}
      - Gender: ${profile?.gender || 'Unknown'}
      - Goal: ${profile?.goal === 'weight_loss' ? 'Weight Loss' : profile?.goal === 'weight_gain' ? 'Weight Gain' : 'Healthy Lifestyle'}
      - Exercise: ${profile?.exerciseDuration || 0} minutes/day
      - Health conditions: ${profile?.diseases?.join(', ') || 'None'}
      - Dietary preferences: ${profile?.dietaryPreferences?.join(', ') || 'None'}
      - Dietary restrictions: ${profile?.dietaryRestrictions?.join(', ') || 'None'}
      - Smoker: ${profile?.isSmoker ? 'Yes' : 'No'}
      
      Guidelines:
      - Always be encouraging, positive, and supportive
      - Provide helpful, accurate nutrition and health advice
      - Be conversational and friendly
      - Keep responses concise but informative (max 120 words)
      - Use emojis appropriately but not excessively
      - Always consider the user's profile when giving advice
      - If asked about medical conditions, remind them to consult healthcare providers
      - Focus on practical, actionable advice
      - Celebrate their progress and efforts
      - Be motivational and inspiring`;
      
      // Format messages for the API
      const apiMessages: CoreMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-5).map(msg => ({ 
          role: msg.role as 'user' | 'assistant', 
          content: msg.content 
        })),
        { role: 'user', content: inputText }
      ];
      
      // Get response from AI
      const response = await chatWithAI(apiMessages);
      
      // Add AI response to chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      
      addMessage(assistantMessage);
      
      // Speak the response if on native platform
      if (Platform.OS !== 'web') {
        speakMessage(response);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm here to help! 😊 It seems there was a small hiccup. Please try asking me again - I'm excited to support your wellness journey! 💪✨",
        timestamp: Date.now(),
      };
      
      addMessage(errorMessage);
      
      // Speak the error message if on native platform
      if (Platform.OS !== 'web') {
        speakMessage(errorMessage.content);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const suggestedQuestions = [
    "What should I eat for breakfast?",
    "How can I reach my health goals?",
    "What are good protein sources?",
    "How much water should I drink?",
    "Give me a healthy meal plan",
    "How to stay motivated?"
  ];
  
  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
  };
  
  const toggleSpeaking = () => {
    if (isSpeaking) {
      // Stop speaking
      if (Platform.OS !== 'web') {
        // This would use Speech.stop() if expo-speech was available
      }
      setIsSpeaking(false);
    } else if (messages.length > 0) {
      // Speak the last assistant message
      const lastAssistantMessage = [...messages]
        .reverse()
        .find(msg => msg.role === 'assistant');
      
      if (lastAssistantMessage && Platform.OS !== 'web') {
        speakMessage(lastAssistantMessage.content);
      }
    }
  };
  
  // Typing indicator dots animation
  const typingDot1Opacity = typingAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.3, 1, 0.3],
  });
  
  const typingDot2Opacity = typingAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });
  
  const typingDot3Opacity = typingAnimation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.3, 1, 0.3],
  });
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Sparkles size={48} color={colors.primary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Your AI Wellness Companion
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Hi {profile?.name || 'there'}! 😊 I'm here to support your health journey with personalized advice, meal suggestions, and motivation. Let's achieve your wellness goals together!
            </Text>
            
            <View style={styles.suggestedContainer}>
              <Text style={[styles.suggestedTitle, { color: colors.text }]}>Try asking me:</Text>
              <View style={styles.suggestedQuestions}>
                {suggestedQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.suggestedButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleSuggestedQuestion(question)}
                  >
                    <Text style={[styles.suggestedButtonText, { color: colors.primary }]}>
                      {question}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatMessage 
                  message={item} 
                  onPress={() => {
                    if (item.role === 'assistant' && Platform.OS !== 'web') {
                      speakMessage(item.content);
                    }
                  }}
                />
              )}
              contentContainerStyle={styles.messagesContainer}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              ListFooterComponent={
                isLoading ? (
                  <View style={[styles.typingIndicator, { backgroundColor: colors.card }]}>
                    <Text style={[styles.typingText, { color: colors.textSecondary }]}>AI is typing</Text>
                    <View style={styles.typingDots}>
                      <Animated.View style={[styles.typingDot, { opacity: typingDot1Opacity, backgroundColor: colors.primary }]} />
                      <Animated.View style={[styles.typingDot, { opacity: typingDot2Opacity, backgroundColor: colors.primary }]} />
                      <Animated.View style={[styles.typingDot, { opacity: typingDot3Opacity, backgroundColor: colors.primary }]} />
                    </View>
                  </View>
                ) : null
              }
            />
            
            {Platform.OS !== 'web' && (
              <TouchableOpacity 
                style={[
                  styles.speakButton, 
                  { backgroundColor: isSpeaking ? colors.error : colors.primary }
                ]}
                onPress={toggleSpeaking}
              >
                {isSpeaking ? (
                  <MicOff size={20} color="white" />
                ) : (
                  <Mic size={20} color="white" />
                )}
              </TouchableOpacity>
            )}
          </>
        )}
        
        <View style={[styles.inputContainer, { 
          borderTopColor: colors.border,
          backgroundColor: colors.card 
        }]}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border
            }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything about your wellness journey..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  suggestedContainer: {
    width: '100%',
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestedQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  suggestedButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  speakButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 16,
    marginBottom: 16,
  },
  typingText: {
    fontSize: 14,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});