import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUUID } from '@/utils/uuid';
import { UserProfile, GoogleEvent, GoogleTask, GoogleTaskList } from '@/types';
import { saveUserProfile, updateUserProfile as updateSupabaseProfile, getUserProfileFromSupabase } from '@/lib/supabase';

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  isAuthenticated: boolean;
  themePreference: 'system' | 'light' | 'dark';
  auth0: {
    accessToken: string | null;
    idToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
  };
  googleTokens: {
    accessToken: string | null;
    refreshToken?: string | null;
    expiresAt?: number | null;
  };
  googleCalendarEvents: GoogleEvent[];
  googleTasks: GoogleTask[];
  googleTaskLists: GoogleTaskList[];
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setOnboarded: (value: boolean) => void;
  setAuthenticated: (value: boolean) => void;
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void;
  setAuth0Tokens: (tokens: { accessToken: string; idToken: string; refreshToken?: string; expiresAt?: number }) => void;
  setGoogleTokens: (tokens: { accessToken: string | null; refreshToken?: string | null; expiresAt?: number | null }) => void;
  setGoogleCalendarEvents: (events: GoogleEvent[]) => void;
  setGoogleTasks: (tasks: GoogleTask[]) => void;
  setGoogleTaskLists: (taskLists: GoogleTaskList[]) => void;
  calculateBMI: () => number | null;
  getHealthStatus: () => string;
  checkAuth: () => boolean;
  logout: () => void;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      isOnboarded: false,
      isAuthenticated: false,
      themePreference: 'system',
      auth0: {
        accessToken: null,
        idToken: null,
        refreshToken: null,
        expiresAt: null,
      },
      googleTokens: {
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
      },
      googleCalendarEvents: [],
      googleTasks: [],
      googleTaskLists: [],
      
      setProfile: (profile) => {
        // Note: Supabase saving is now handled by the Clerk-Supabase integration
        // This just updates the local store
        set({ profile, isOnboarded: true });
      },

      setOnboarded: (isOnboarded) => {
        set({ isOnboarded });
      },
      
      updateProfile: (updates) => set((state) => {
        // If profile doesn't exist yet, create it with default values
        if (!state.profile) {
          // Generate a unique userId if not provided
          const userId = updates.userId || `user-${generateUUID()}`;
          
          const defaultProfile: UserProfile = {
            userId: userId,
            name: updates.name || 'User',
            email: updates.email || 'user@example.com',
            height: updates.height || 170,
            weight: updates.weight || 70,
            age: updates.age || 30,
            gender: updates.gender || 'other',
            isSmoker: updates.isSmoker !== undefined ? updates.isSmoker : false,
            goal: updates.goal || 'healthy_lifestyle',
            exerciseDuration: updates.exerciseDuration || 30,
            diseases: updates.diseases || [],
            dietaryPreferences: updates.dietaryPreferences || [],
            dietaryRestrictions: updates.dietaryRestrictions || [],
            photoUrl: updates.photoUrl
          };
          
          // Save new profile to Supabase
          if (defaultProfile.userId) {
            saveUserProfile(defaultProfile).catch(error => {
              console.log('Error saving new profile to Supabase:', error);
              // Continue even if Supabase save fails
            });
          }
          
          return { 
            profile: defaultProfile,
            isOnboarded: true
          };
        }
        
        // Update existing profile
        const updatedProfile = { ...state.profile, ...updates };
        
        // Update profile in Supabase
        if (updatedProfile.userId) {
          updateSupabaseProfile(updatedProfile.userId, updates).catch(error => {
            console.log('Error updating profile in Supabase:', error);
            // Continue even if Supabase update fails
          });
        }
        
        return { 
          profile: updatedProfile,
          isOnboarded: true
        };
      }),
      
      setOnboarded: (value) => set({ isOnboarded: value }),
      
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      
      setThemePreference: (theme) => set({ themePreference: theme }),
      
      setAuth0Tokens: (tokens) => set((state) => ({
        auth0: {
          ...state.auth0,
          accessToken: tokens.accessToken,
          idToken: tokens.idToken,
          refreshToken: tokens.refreshToken || state.auth0.refreshToken,
          expiresAt: tokens.expiresAt || state.auth0.expiresAt,
        }
      })),
      
      setGoogleTokens: (tokens) => set((state) => ({
        googleTokens: {
          ...state.googleTokens,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || state.googleTokens.refreshToken,
          expiresAt: tokens.expiresAt || state.googleTokens.expiresAt,
        }
      })),
      
      setGoogleCalendarEvents: (events) => set({ googleCalendarEvents: events }),
      
      setGoogleTasks: (tasks) => set({ googleTasks: tasks }),
      
      setGoogleTaskLists: (taskLists) => set({ googleTaskLists: taskLists }),
      
      checkAuth: () => {
        // Check if user is authenticated from stored state
        const state = get();
        return !!(state.profile && state.isAuthenticated);
      },
      
      calculateBMI: () => {
        const { profile } = get();
        if (!profile || !profile.height || !profile.weight) return null;
        
        // BMI = weight(kg) / (height(m))²
        const heightInMeters = profile.height / 100;
        const bmi = profile.weight / (heightInMeters * heightInMeters);
        return parseFloat(bmi.toFixed(1));
      },
      
      getHealthStatus: () => {
        const bmi = get().calculateBMI();
        if (!bmi) return "Unknown";
        
        if (bmi < 18.5) return "Underweight";
        if (bmi < 25) return "Normal weight";
        if (bmi < 30) return "Overweight";
        return "Obese";
      },
      
      logout: () => set({
        isAuthenticated: false,
        profile: null,
        isOnboarded: false,
        auth0: {
          accessToken: null,
          idToken: null,
          refreshToken: null,
          expiresAt: null,
        },
        googleTokens: {
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        },
        googleCalendarEvents: [],
        googleTasks: [],
        googleTaskLists: []
      }),
      
      fetchProfile: async (userId: string) => {
        if (!userId) return;
        try {
          const { success, profile, error } = await getUserProfileFromSupabase(userId);
          if (success && profile) {
            set({ profile, isOnboarded: true });
          } else {
            console.error('Failed to fetch profile:', error);
          }
        } catch (err) {
          console.error('Error in fetchProfile:', err);
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        isOnboarded: state.isOnboarded,
        isAuthenticated: state.isAuthenticated,
        themePreference: state.themePreference,
        // Don't persist tokens for security
      }),
    }
  )
);