import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '@/types';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),
      
      setMessages: (messages) => set({
        messages
      }),
      
      clearMessages: () => set({
        messages: []
      }),
      
      setLoading: (isLoading) => set({
        isLoading
      }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);