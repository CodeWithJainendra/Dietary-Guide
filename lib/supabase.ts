import { UserProfile } from '@/types';
import { createClient } from '@supabase/supabase-js';

// Real Supabase client using provided project URL and anon key
export const supabase = createClient(
  'https://tozbstequzpevxvxnkev.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvemJzdGVxdXpwZXZ4dnhua2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NDc5NTcsImV4cCI6MjA1NjQyMzk1N30.XpmX6KbD3SeQV_04y7Mx1eqHsLaKKVD3oTru-nnEDdo'
);

// NOTE: Ensure 'userId' is unique or primary key in the Supabase 'profiles' table for true upsert safety.
export async function saveUserProfile(profile: UserProfile): Promise<{ success: boolean; error?: string }> {
  try {
    if (!profile.userId) {
      throw new Error('User ID is required to save profile');
    }
    // Use upsert to ensure only one profile per userId
    const { error } = await supabase
      .from('profiles')
      .upsert([{ ...profile }], { onConflict: 'userId' });
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Error upserting profile in Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error upserting profile',
    };
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      throw new Error('User ID is required to update profile');
    }
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates })
      .eq('userId', userId);
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Error updating profile in Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating profile',
    };
  }
}

export async function getUserProfileFromSupabase(
  userId: string
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch profile');
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('userId', userId)
      .single();
    if (error) {
      throw error;
    }
    return {
      success: true,
      profile: data as UserProfile,
    };
  } catch (error) {
    console.error('Error getting profile from Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting profile',
    };
  }
}

export async function deleteUserProfile(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      throw new Error('User ID is required to delete profile');
    }
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('userId', userId);
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting profile from Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting profile',
    };
  }
}

// Type for chat message
export interface ChatHistoryMessage {
  user_id: string;
  message: string;
  sender: string;
  created_at?: string;
}

// Save a chat message to Supabase chat_history table
// userId should be the user's unique id (profile.id), not profile.userId
export async function saveChatMessage({ userId, message, sender, timestamp }: { userId: string, message: string, sender: string, timestamp: number }) {
  try {
    console.log('saveChatMessage called', { userId, message, sender, timestamp });
    if (!userId || !message || !sender) {
      console.error('saveChatMessage: Missing required fields', { userId, message, sender });
      throw new Error('Missing required chat message fields');
    }
    const insertObj = {
      user_id: userId, // Make sure this is profile.id (uuid/text), not profile.userId
      message,
      sender,
      created_at: new Date(timestamp).toISOString(),
    };
    console.log('Inserting chat message:', insertObj);
    const { data, error } = await supabase
      .from('chat_history')
      .insert([insertObj]);
    if (error) {
      console.error('Supabase error in saveChatMessage:', error);
      throw error;
    }
    console.log('Supabase insert result:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error saving chat message:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error saving chat message' };
  }
}

// Fetch all chat messages for a user from Supabase chat_history table
export async function fetchChatHistory(userId: string) {
  try {
    if (!userId) throw new Error('User ID is required to fetch chat history');
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { success: true, messages: data as ChatHistoryMessage[] };
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error fetching chat history' };
  }
}