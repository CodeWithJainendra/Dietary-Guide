import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Animated,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { useNutritionStore } from '@/store/nutritionStore';
import ChatMessage from '@/components/ChatMessage';
import { Message, CoreMessage } from '@/types';
import { chatWithAI } from '@/utils/aiService';
import { Send, Sparkles } from 'lucide-react-native';
import { saveChatMessage, fetchChatHistory } from '@/lib/supabase';
import { generateUUID } from '@/utils/uuid';
import { KeyboardAvoidingWrapper } from '@/components/KeyboardAvoidingWrapper';

export default function ChatScreen() {
  const { colors } = useTheme();
  const { messages, addMessage, isLoading, setLoading, setMessages } = useChatStore();
  const profile = useUserStore((state) => state.profile);
  const setAvatarMood = useNutritionStore((state) => state.setAvatarMood);
  
  const [inputText, setInputText] = useState('');
  const [typingAnimation] = useState(new Animated.Value(0));
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayedMessagesCount, setDisplayedMessagesCount] = useState(10);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  
  // Initialize with a welcome message if no messages exist and history is loaded
  useEffect(() => {
    if (messages.length === 0 && profile && !isLoadingHistory) {
      const welcomeMessage: Message = {
        id: 'welcome-' + generateUUID(),
        role: 'assistant',
        content: `Hello ${profile.name}! 👋 I'm your AI wellness companion. I'm here to help you achieve your health goals and provide personalized nutrition advice. How can I assist you today?`,
        timestamp: Date.now(),
      };

      addMessage(welcomeMessage);
      setDisplayedMessagesCount(10);
      setShouldAutoScroll(true);
      // Keep initial render true for welcome message to scroll to bottom

      // Force scroll to bottom after welcome message is added
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages.length, profile, addMessage, isLoadingHistory]);
  
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

  // Handle initial scroll to bottom after history is loaded
  useEffect(() => {
    if (!isLoadingHistory && messages.length > 0) {
      // Ensure we scroll to bottom on initial load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Mark initial render as complete after scrolling
      setTimeout(() => {
        setIsInitialRender(false);
      }, 2000);
    }
  }, [isLoadingHistory, messages.length]);

  // Additional effect to ensure scroll to bottom on initial render
  useEffect(() => {
    if (isInitialRender && messages.length > 0 && !isLoadingHistory) {
      const scrollToBottom = () => {
        flatListRef.current?.scrollToEnd({ animated: true });
      };

      // Multiple attempts to ensure scroll works
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
      setTimeout(scrollToBottom, 500);
    }
  }, [isInitialRender, messages.length, isLoadingHistory]);
  

  
  // On mount, fetch chat history from Supabase and set in store
  useEffect(() => {
    const loadHistory = async () => {
      if (!profile?.userId) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        console.log('Loading chat history for user:', profile.userId);
        const { success, messages, error } = await fetchChatHistory(profile.userId);

        if (success && Array.isArray(messages) && messages.length > 0) {
          // Convert Supabase rows to Message[]
          const formatted = messages.map((msg: any) => ({
            id: msg.id || `${msg.created_at}-${msg.sender}`,
            role: msg.sender as 'user' | 'assistant',
            content: msg.message,
            timestamp: new Date(msg.created_at).getTime(),
          }));

          console.log('Loaded chat history:', formatted.length, 'messages');
          setMessages(formatted);
        } else if (!success) {
          console.error('Failed to load chat history:', error);
        } else {
          console.log('No chat history found for user');
          // Clear any existing messages if no history found
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (profile?.userId) {
      loadHistory();
    }
  }, [profile?.userId, setMessages]);

  // Refresh chat history
  const onRefresh = async () => {
    if (!profile?.userId) return;

    setIsRefreshing(true);
    try {
      console.log('Refreshing chat history for user:', profile.userId);
      const { success, messages, error } = await fetchChatHistory(profile.userId);

      if (success && Array.isArray(messages)) {
        const formatted = messages.map((msg: any) => ({
          id: msg.id || `${msg.created_at}-${msg.sender}`,
          role: msg.sender as 'user' | 'assistant',
          content: msg.message,
          timestamp: new Date(msg.created_at).getTime(),
        }));

        console.log('Refreshed chat history:', formatted.length, 'messages');
        setMessages(formatted);
      } else if (!success) {
        console.error('Failed to refresh chat history:', error);
      }
    } catch (error) {
      console.error('Error refreshing chat history:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load older messages (pagination)
  const loadOlderMessages = async () => {
    if (isLoadingOlder || displayedMessagesCount >= messages.length) return;

    setIsLoadingOlder(true);
    setIsInitialRender(false); // Mark that we're no longer in initial render
    setShouldAutoScroll(false); // Disable auto-scroll when loading older messages

    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedMessagesCount(prev => Math.min(prev + 10, messages.length));
      setIsLoadingOlder(false);
    }, 500);
  };

  // Get displayed messages (last N messages)
  const displayedMessages = messages.slice(-displayedMessagesCount);

  // Check if there are older messages to load
  const hasOlderMessages = displayedMessagesCount < messages.length;

  const handleSend = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    // Use profile.userId (Clerk ID) for foreign key reference
    const userId = profile?.userId;
    if (!userId) return; // Ensure user is loaded

    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: trimmedText,
      timestamp: Date.now(),
    };
    addMessage(userMessage);
    setInputText('');

    // Reset pagination to show latest messages and enable auto-scroll
    setDisplayedMessagesCount(10);
    setShouldAutoScroll(true);
    setIsInitialRender(false); // No longer initial render after user sends message
    try {
      await saveChatMessage({
        userId: userId.toString(),
        message: userMessage.content,
        sender: userMessage.role,
        timestamp: userMessage.timestamp,
      });
    } catch (e) {
      console.error('Failed to save user message to Supabase:', e);
    }
    setLoading(true);
    try {
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
        id: generateUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      
      addMessage(assistantMessage);

      // Ensure we show the latest messages including the new response and enable auto-scroll
      setDisplayedMessagesCount(prev => Math.max(prev, 10));
      setShouldAutoScroll(true);
      const userId = profile?.userId;
      if (!userId) return;
      try {
        await saveChatMessage({
          userId: userId.toString(),
          message: assistantMessage.content,
          sender: assistantMessage.role,
          timestamp: assistantMessage.timestamp,
        });
      } catch (e) {
        console.error('Failed to save assistant message to Supabase:', e);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: "I'm here to help! 😊 It seems there was a small hiccup. Please try asking me again - I'm excited to support your wellness journey! 💪✨",
        timestamp: Date.now(),
      };
      
      addMessage(errorMessage);
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingWrapper
        style={styles.keyboardAvoidingView}
        enableScrollView={false}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading your chat history...
            </Text>
          </View>
        ) : messages.length === 0 ? (
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
              data={displayedMessages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatMessage
                  message={item}
                />
              )}
              contentContainerStyle={styles.messagesContainer}
              onContentSizeChange={() => {
                // Auto-scroll to bottom on initial render or when sending new messages
                // But NOT when loading older messages
                if ((isInitialRender || shouldAutoScroll) && !isLoadingOlder) {
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 50);
                }
              }}
              onLayout={() => {
                // Auto-scroll to bottom on initial layout or when sending new messages
                // But NOT when loading older messages
                if ((isInitialRender || shouldAutoScroll) && !isLoadingOlder) {
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 50);
                }
              }}
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              ListHeaderComponent={
                hasOlderMessages ? (
                  <View style={styles.loadOlderContainer}>
                    <TouchableOpacity
                      style={[styles.loadOlderButton, {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: isLoadingOlder ? 0.6 : 1
                      }]}
                      onPress={loadOlderMessages}
                      disabled={isLoadingOlder}
                    >
                      {isLoadingOlder ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[styles.loadOlderText, { color: colors.primary }]}>
                          Load older messages
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null
              }
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
            

          </>
        )}
        
        <View style={[styles.inputContainer, {
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          shadowColor: colors.text,
        }]}>
          <View style={[styles.inputWrapper, {
            backgroundColor: colors.background,
            borderColor: colors.border
          }]}>
            <View style={styles.inputSection}>
              <TextInput
                style={[styles.input, {
                  color: colors.text,
                }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything..."
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={500}
                textAlignVertical="center"
              />
              {inputText.length > 400 && (
                <Text style={[styles.characterCount, {
                  color: inputText.length > 480 ? colors.error : colors.textSecondary
                }]}>
                  {inputText.length}/500
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() && !isLoading ? colors.primary : colors.inactive,
                  transform: [{
                    scale: inputText.trim() && !isLoading ? 1 : 0.85
                  }],
                  opacity: inputText.trim() || isLoading ? 1 : 0.6
                }
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size={18} color="white" />
              ) : (
                <Send
                  size={18}
                  color="white"
                  style={{
                    transform: [{ translateX: 1 }] // Slight offset for better visual alignment
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingWrapper>
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
    paddingBottom: 8, // Minimized padding for better keyboard handling
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 25,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 42,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputSection: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 100,
    minHeight: 20,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
    marginBottom: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
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
  loadOlderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  loadOlderButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  loadOlderText: {
    fontSize: 14,
    fontWeight: '500',
  },
});