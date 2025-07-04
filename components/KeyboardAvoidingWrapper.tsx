import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAvoidingWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  contentContainerStyle?: ViewStyle | ViewStyle[];
  enableScrollView?: boolean;
  keyboardVerticalOffset?: number;
  behavior?: 'height' | 'position' | 'padding';
}

export const KeyboardAvoidingWrapper: React.FC<KeyboardAvoidingWrapperProps> = ({
  children,
  style,
  contentContainerStyle,
  enableScrollView = true,
  keyboardVerticalOffset,
  behavior,
}) => {
  const insets = useSafeAreaInsets();

  // Calculate the appropriate offset
  const getKeyboardVerticalOffset = () => {
    if (keyboardVerticalOffset !== undefined) {
      return keyboardVerticalOffset;
    }

    if (Platform.OS === 'ios') {
      // For iOS, use safe area bottom inset to avoid home indicator
      return insets.bottom > 0 ? insets.bottom : 0;
    }

    return 0; // No offset for Android
  };

  // Determine the best behavior for the platform
  const getBehavior = () => {
    if (behavior) return behavior;
    
    if (Platform.OS === 'ios') {
      return 'padding';
    }
    
    return 'height';
  };

  const keyboardAvoidingViewStyle = [
    styles.container,
    style,
  ];

  if (enableScrollView) {
    return (
      <KeyboardAvoidingView
        style={keyboardAvoidingViewStyle}
        behavior={getBehavior()}
        keyboardVerticalOffset={getKeyboardVerticalOffset()}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={keyboardAvoidingViewStyle}
      behavior={getBehavior()}
      keyboardVerticalOffset={getKeyboardVerticalOffset()}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
