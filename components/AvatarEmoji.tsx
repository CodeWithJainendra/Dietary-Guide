import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Dimensions } from 'react-native';
import { AvatarMood } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface AvatarEmojiProps {
  mood: AvatarMood;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  interactive?: boolean;
  onPress?: () => void;
}

export default function AvatarEmoji({
  mood,
  size = 'medium',
  interactive = false,
  onPress
}: AvatarEmojiProps) {
  const { colors } = useTheme();
  const [animation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [bounceAnimation] = useState(new Animated.Value(0));
  const previousMoodRef = useRef<AvatarMood>(mood);
  
  // Map mood to emoji
  const getMoodEmoji = (mood: AvatarMood): string => {
    switch (mood) {
      case 'happy': return '😊';
      case 'very_happy': return '😄';
      case 'excited': return '🤩';
      case 'loving': return '🥰';
      case 'caring': return '🤗';
      case 'joyful': return '😁';
      case 'neutral': return '😌';
      case 'concerned': return '🤔';
      case 'worried': return '😟';
      case 'tired': return '😴';
      case 'confused': return '😕';
      case 'surprised': return '😲';
      case 'encouraging': return '💪';
      case 'proud': return '🙌';
      case 'supportive': return '👍';
      case 'polite': return '🙏';
      case 'humble': return '😇';
      default: return '😊';
    }
  };
  
  // Get size based on prop
  const getSize = (size: string): number => {
    switch (size) {
      case 'small': return 40;
      case 'medium': return 60;
      case 'large': return 80;
      case 'xlarge': return 100;
      case 'xxlarge': return 140;
      default: return 60;
    }
  };
  
  // Get background color based on mood
  const getMoodColor = (mood: AvatarMood): string => {
    switch (mood) {
      case 'happy':
      case 'very_happy':
      case 'joyful':
      case 'excited':
        return colors.success + '30';
      case 'loving':
      case 'caring':
      case 'proud':
      case 'humble':
        return colors.primary + '30';
      case 'concerned':
      case 'worried':
      case 'confused':
        return colors.warning + '30';
      case 'encouraging':
      case 'supportive':
      case 'polite':
        return colors.secondary + '30';
      default:
        return colors.card;
    }
  };
  
  // Animate avatar when mood changes
  useEffect(() => {
    // Store the current mood in the ref
    const previousMood = previousMoodRef.current;
    
    // Only animate if the mood has changed
    if (previousMood !== mood) {
      // Rotate animation
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        })
      ]).start();
      
      // Bounce animation
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: -10,
          duration: 150,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(bounceAnimation, {
          toValue: 5,
          duration: 100,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(bounceAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: Platform.OS !== 'web',
        })
      ]).start();
      
      // Update the ref after animations are triggered
      previousMoodRef.current = mood;
    }
  }, [mood, animation, bounceAnimation]);
  
  // Pulse animation for interactive avatar
  useEffect(() => {
    if (interactive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: Platform.OS !== 'web',
          })
        ])
      ).start();
    }
  }, [interactive, pulseAnimation]);
  

  
  // Calculate styles based on props
  const emojiSize = getSize(size);
  const fontSize = emojiSize * 0.6;
  const backgroundColor = getMoodColor(mood);
  
  // Animation styles
  const animatedStyle = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '20deg']
        })
      },
      {
        translateY: bounceAnimation
      },
      {
        scale: interactive ? pulseAnimation : 1
      }
    ]
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={interactive ? 0.7 : 1}
        onPress={interactive ? onPress : undefined}
        disabled={!interactive}
      >
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              width: emojiSize,
              height: emojiSize,
              borderRadius: emojiSize / 2,
              backgroundColor,
              borderColor: colors.primary + '50',
            },
            animatedStyle
          ]}
        >
          <Text style={[styles.emoji, { fontSize }]}>
            {getMoodEmoji(mood)}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emoji: {
    textAlign: 'center',
  },
});