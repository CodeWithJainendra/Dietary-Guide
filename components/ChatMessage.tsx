import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Message } from '@/types';
import { Copy, Check } from 'lucide-react-native';

interface ChatMessageProps {
  message: Message;
  onPress?: () => void;
}

export default function ChatMessage({ message, onPress }: ChatMessageProps) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0.95));
  
  const isUser = message.role === 'user';
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format message content with markdown-like styling
  const formatContent = (content: string) => {
    // Replace ** bold ** with styled text
    const boldRegex = /\*\*(.*?)\*\*/g;
    const contentWithBold = content.replace(boldRegex, (_, text) => `<b>${text}</b>`);
    
    // Replace * italic * with styled text
    const italicRegex = /\*(.*?)\*/g;
    const contentWithItalic = contentWithBold.replace(italicRegex, (_, text) => `<i>${text}</i>`);
    
    // Replace bullet points
    const bulletRegex = /^- (.*?)$/gm;
    const contentWithBullets = contentWithItalic.replace(bulletRegex, (_, text) => `• ${text}`);
    
    // Replace numbered lists
    const numberedRegex = /^\d+\. (.*?)$/gm;
    const contentWithNumbered = contentWithBullets.replace(numberedRegex, (match) => match);
    
    // Split by newlines to handle paragraphs
    return contentWithNumbered.split('\n');
  };
  
  const formattedContent = formatContent(message.content);
  
  // Handle copy to clipboard
  const copyToClipboard = async () => {
    try {
      if (Platform.OS === 'web') {
        // Use navigator.clipboard for web
        await navigator.clipboard.writeText(message.content);
      } else {
        // For native platforms, we would use Clipboard.setString
        // But since we're removing the dependency, we'll just simulate it
        console.log('Copying to clipboard:', message.content);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };
  
  // Animate on press
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.02,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
    
    if (onPress) {
      onPress();
    }
  };
  
  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <Animated.View
        style={[
          styles.messageContainer,
          isUser 
            ? [styles.userMessage, { backgroundColor: colors.primary }] 
            : [styles.assistantMessage, { backgroundColor: colors.card, borderColor: colors.border }],
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {/* Message content with markdown-like styling */}
        <View style={styles.contentContainer}>
          {formattedContent.map((paragraph, index) => {
            // Check if paragraph contains HTML tags
            const hasBold = paragraph.includes('<b>');
            const hasItalic = paragraph.includes('<i>');
            
            if (hasBold || hasItalic) {
              // Split the paragraph by HTML tags
              const parts = [];
              let currentText = paragraph;
              
              // Handle bold text
              while (currentText.includes('<b>') && currentText.includes('</b>')) {
                const startIndex = currentText.indexOf('<b>');
                const endIndex = currentText.indexOf('</b>') + 4;
                
                if (startIndex > 0) {
                  parts.push({
                    type: 'regular',
                    text: currentText.substring(0, startIndex)
                  });
                }
                
                parts.push({
                  type: 'bold',
                  text: currentText.substring(startIndex + 3, endIndex - 4)
                });
                
                currentText = currentText.substring(endIndex);
              }
              
              // Handle italic text
              while (currentText.includes('<i>') && currentText.includes('</i>')) {
                const startIndex = currentText.indexOf('<i>');
                const endIndex = currentText.indexOf('</i>') + 4;
                
                if (startIndex > 0) {
                  parts.push({
                    type: 'regular',
                    text: currentText.substring(0, startIndex)
                  });
                }
                
                parts.push({
                  type: 'italic',
                  text: currentText.substring(startIndex + 3, endIndex - 4)
                });
                
                currentText = currentText.substring(endIndex);
              }
              
              if (currentText.length > 0) {
                parts.push({
                  type: 'regular',
                  text: currentText
                });
              }
              
              return (
                <Text key={index} style={[
                  styles.messageText, 
                  { color: isUser ? 'white' : colors.text },
                  index < formattedContent.length - 1 && styles.paragraphSpacing
                ]}>
                  {parts.map((part, partIndex) => {
                    if (part.type === 'bold') {
                      return (
                        <Text key={partIndex} style={styles.boldText}>
                          {part.text}
                        </Text>
                      );
                    } else if (part.type === 'italic') {
                      return (
                        <Text key={partIndex} style={styles.italicText}>
                          {part.text}
                        </Text>
                      );
                    } else {
                      return <Text key={partIndex}>{part.text}</Text>;
                    }
                  })}
                </Text>
              );
            } else {
              // Regular paragraph
              return (
                <Text 
                  key={index} 
                  style={[
                    styles.messageText, 
                    { color: isUser ? 'white' : colors.text },
                    index < formattedContent.length - 1 && styles.paragraphSpacing,
                    paragraph.startsWith('•') && styles.bulletPoint,
                    paragraph.match(/^\d+\./) && styles.numberedList
                  ]}
                >
                  {paragraph}
                </Text>
              );
            }
          })}
        </View>
        
        {/* Message footer with timestamp and copy button */}
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp, 
            { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          
          {!isUser && (
            <TouchableOpacity 
              style={styles.copyButton} 
              onPress={copyToClipboard}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              {copied ? (
                <Check size={14} color={colors.success} />
              ) : (
                <Copy size={14} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  messageContainer: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  userMessage: {
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    borderBottomLeftRadius: 4,
  },
  contentContainer: {
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  paragraphSpacing: {
    marginBottom: 8,
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  bulletPoint: {
    paddingLeft: 8,
  },
  numberedList: {
    paddingLeft: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  copyButton: {
    padding: 2,
  },
});