import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { useNutritionStore } from '@/store/nutritionStore';
import ChatMessage from '@/components/ChatMessage';
import { Message, CoreMessage } from '@/types';
import { chatWithAI } from '@/utils/aiService';
import { Send, ArrowLeft, Home, MessageCircle, BarChart2, User } from 'lucide-react-native';

export default function ChatScreen() {
  const { colors, shadows } = useTheme();
  const { messages, addMessage, isLoading, setLoading } = useChatStore();
  const profile = useUserStore((state) => state.profile);
  const setAvatarMood = useNutritionStore((state) => state.setAvatarMood);
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
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
      
      // Create system prompt with user context
      const systemPrompt = `You are a friendly, supportive nutrition and wellness AI companion. 
      You're helping a user with the following profile:
      - Height: ${profile?.height || 'Unknown'} cm
      - Weight: ${profile?.weight || 'Unknown'} kg
      - Age: ${profile?.age || 'Unknown'}
      - Goal: ${profile?.goal === 'weight_loss' ? 'Weight Loss' : profile?.goal === 'weight_gain' ? 'Weight Gain' : 'Healthy Lifestyle'}
      - Health conditions: ${profile?.diseases?.join(', ') || 'None'}
      - Dietary preferences: ${profile?.dietaryPreferences?.join(', ') || 'None'}
      
      Provide helpful, accurate nutrition and health advice. Be conversational, friendly, and encouraging.
      Keep responses concise (2-3 sentences max), structured, and actionable. Use bullet points when listing items.
      Focus on practical advice and positive reinforcement. Avoid lengthy explanations unless specifically asked.
      Always maintain a supportive and motivational tone.`;
      
      // Format messages for the API with proper typing
      const apiMessages: CoreMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({ 
          role: msg.role as 'user' | 'assistant' | 'system', 
          content: msg.content 
        })) as CoreMessage[],
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chat with AI</Text>
        <View style={styles.headerRight} />
      </View>
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Ask me anything about nutrition</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              I can help with meal ideas, nutritional information, dietary advice, and more.
            </Text>
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
        
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              (!inputText.trim() || isLoading) && { backgroundColor: colors.inactive }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
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
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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