import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AlertTriangle, X, ExternalLink } from 'lucide-react-native';
import { getAIServiceStatus } from '@/utils/aiService';

export default function AIStatusBanner() {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>(null);

  useEffect(() => {
    const status = getAIServiceStatus();
    setAiStatus(status);

    // Show banner if Gemini needs configuration
    if (status.needsNewKey || !status.apiKeyValidFormat) {
      setIsVisible(true);
    }
  }, []);

  const handleGeminiLink = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || !aiStatus) {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.warning || '#FFA500' }]}>
      <View style={styles.content}>
        <AlertTriangle size={20} color="#FFFFFF" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Google Gemini Configuration Needed</Text>
          <Text style={styles.message}>
            {aiStatus?.needsNewKey
              ? 'Your Google Gemini API key is invalid or expired. Get a new free key to enable Gemini Flash AI features.'
              : 'Google Gemini API key needed for Gemini Flash AI features. Using enhanced responses for now.'
            }
          </Text>
          <TouchableOpacity onPress={handleGeminiLink} style={styles.linkButton}>
            <Text style={styles.linkText}>Get Free Gemini API Key</Text>
            <ExternalLink size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <X size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
    lineHeight: 16,
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  closeButton: {
    padding: 4,
  },
});
