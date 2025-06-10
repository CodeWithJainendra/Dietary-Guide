import React from 'react';
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

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  errorStyle?: TextStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  ...props
}) => {
  const { colors } = useTheme();
  
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
      
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: error ? colors.error : colors.border,
          },
          inputStyle
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
      
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
};

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