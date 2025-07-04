import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export interface InputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  errorStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<InputRef, InputProps>(({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => inputRef.current?.clear(),
  }));
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[
          styles.label, 
          { color: colors.text },
          labelStyle
        ]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: colors.card,
          borderColor: error ? colors.error : colors.border,
        }
      ]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: colors.text,
              flex: 1,
            },
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            inputStyle
          ]}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />

        {rightIcon && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={[
          styles.error,
          { color: colors.error },
          errorStyle
        ]}>
          {error}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  error: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default Input;