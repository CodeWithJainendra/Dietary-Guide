import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { useNutritionStore } from '@/store/nutritionStore';
import ChatMessage from '@/components/ChatMessage';
import { Message, CoreMessage } from '@/types';
import { chatWithAIRAG } from '@/utils/aiService';
import { Send, ArrowLeft, Home, MessageCircle, BarChart2, User } from 'lucide-react-native';
import { saveChatMessage, fetchChatHistory } from '@/lib/supabase';
import { KeyboardAvoidingWrapper } from '@/components/KeyboardAvoidingWrapper';

export default function ChatScreen() {
  const { colors, shadows } = useTheme();
  const { messages, addMessage, isLoading, setLoading, setMessages } = useChatStore();
  const profile = useUserStore((state) => state.profile);
  const setAvatarMood = useNutritionStore((state) => state.setAvatarMood);

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!profile?.userId) return;

      try {
        console.log('Loading chat history for user:', profile.userId);
        const { success, messages, error } = await fetchChatHistory(profile.userId);

        if (success && Array.isArray(messages) && messages.length > 0) {
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
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    if (profile?.userId) {
      loadHistory();
    }
  }, [profile?.userId, setMessages]);
  
  const handleSend = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isLoading) return;

    const userId = profile?.userId;
    if (!userId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedText,
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    setInputText('');

    // Save user message to database
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
    
    // Check for mood indicators in the message
    const content = inputText.toLowerCase();
    if (content.includes('sad') || content.includes('depressed') || content.includes('unhappy')) {
      setAvatarMood('sad');
    } else if (content.includes('worried') || content.includes('anxious')) {
      setAvatarMood('worried');
    } else if (content.includes('scared') || content.includes('terrified')) {
      setAvatarMood('scared');
    } else if (content.includes('happy') || content.includes('great')) {
      setAvatarMood('happy');
    } else if (content.includes('excited')) {
      setAvatarMood('excited');
    }
    
    try {
      setLoading(true);
      
      // Format messages for the API - RAG will add enhanced system prompt with user data
      const apiMessages: CoreMessage[] = [
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })) as CoreMessage[],
        { role: 'user', content: inputText }
      ];

      // Get response from AI with RAG (Retrieval-Augmented Generation)
      // This will automatically retrieve user profile and meal data for personalized responses
      const response = await chatWithAIRAG(apiMessages, userId);
      
      // Add AI response to chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      addMessage(assistantMessage);

      // Save AI response to database
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
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I couldn't process your request. Please try again.",
        timestamp: Date.now(),
      };
      
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const navigateToHome = () => {
    router.push('/home');
  };
  
  const navigateToStats = () => {
    router.push('/stats');
  };
  
  const navigateToProfile = () => {
    router.push('/profile');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerRight} />
      </View>
      
      <KeyboardAvoidingWrapper
        style={styles.keyboardAvoidingView}
        enableScrollView={false}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Ask me anything about nutrition</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              I can help with meal ideas, nutritional information, dietary advice, and more.
            </Text>

            {/* RAG Status Indicator */}
            <View style={[styles.ragStatusContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.ragStatusDot} />
              <Text style={[styles.ragStatusText, { color: colors.textSecondary }]}>
                🧠 Smart AI with access to your profile & meal data
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatMessage message={item} />}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
        
        <View style={[styles.inputContainer, {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
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
      
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }, shadows?.medium || {}]}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={navigateToHome}
        >
          <View style={styles.tabIcon}>
            <Home size={24} color={colors.inactive} />
          </View>
          <Text style={[styles.tabLabel, { color: colors.inactive }]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => {/* Already on chat */}}
        >
          <View style={[styles.tabIcon, styles.activeTabIcon, { backgroundColor: `${colors.primary}20` }]}>
            <MessageCircle size={24} color={colors.primary} />
          </View>
          <Text style={[styles.tabLabel, styles.activeTabLabel, { color: colors.primary }]}>Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={navigateToStats}
        >
          <View style={styles.tabIcon}>
            <BarChart2 size={24} color={colors.inactive} />
          </View>
          <Text style={[styles.tabLabel, { color: colors.inactive }]}>Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={navigateToProfile}
        >
          <View style={styles.tabIcon}>
            <User size={24} color={colors.inactive} />
          </View>
          <Text style={[styles.tabLabel, { color: colors.inactive }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40, // Balance the header
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  ragStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  ragStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  ragStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    padding: 16,
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
    paddingVertical: 8,
    minHeight: 50,
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
    paddingVertical: 8,
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
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    marginBottom: 4,
  },
  activeTabIcon: {
    borderRadius: 8,
    padding: 4,
  },
  tabLabel: {
    fontSize: 12,
  },
  activeTabLabel: {
    fontWeight: '500',
  },
});