import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { KeyboardAvoidingWrapper } from '@/components/KeyboardAvoidingWrapper';
import Input, { InputRef } from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { ArrowLeft, TestTube } from 'lucide-react-native';
import { dismissKeyboard } from '@/utils/keyboardUtils';

export default function KeyboardTestScreen() {
  const { colors } = useTheme();
  const [field1, setField1] = useState('');
  const [field2, setField2] = useState('');
  const [field3, setField3] = useState('');
  const [field4, setField4] = useState('');
  const [field5, setField5] = useState('');
  
  const input1Ref = useRef<InputRef>(null);
  const input2Ref = useRef<InputRef>(null);
  const input3Ref = useRef<InputRef>(null);
  const input4Ref = useRef<InputRef>(null);
  const input5Ref = useRef<InputRef>(null);

  const handleSubmit = () => {
    Alert.alert(
      'Form Data',
      `Field 1: ${field1}\nField 2: ${field2}\nField 3: ${field3}\nField 4: ${field4}\nField 5: ${field5}`,
      [{ text: 'OK' }]
    );
  };

  const handleDismissKeyboard = () => {
    dismissKeyboard();
  };

  const focusNextField = (nextRef: React.RefObject<InputRef>) => {
    nextRef.current?.focus();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper
        style={styles.wrapper}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Keyboard Test</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <TestTube size={48} color={colors.primary} />
          </View>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Test keyboard behavior with multiple input fields
          </Text>

          <Input
            ref={input1Ref}
            label="Field 1"
            value={field1}
            onChangeText={setField1}
            placeholder="Enter text for field 1"
            returnKeyType="next"
            onSubmitEditing={() => focusNextField(input2Ref)}

          />

          <Input
            ref={input2Ref}
            label="Field 2"
            value={field2}
            onChangeText={setField2}
            placeholder="Enter text for field 2"
            returnKeyType="next"
            onSubmitEditing={() => focusNextField(input3Ref)}

          />

          <Input
            ref={input3Ref}
            label="Field 3 (Email)"
            value={field3}
            onChangeText={setField3}
            placeholder="Enter email"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => focusNextField(input4Ref)}

          />

          <Input
            ref={input4Ref}
            label="Field 4 (Number)"
            value={field4}
            onChangeText={setField4}
            placeholder="Enter number"
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => focusNextField(input5Ref)}

          />

          <Input
            ref={input5Ref}
            label="Field 5 (Multiline)"
            value={field5}
            onChangeText={setField5}
            placeholder="Enter multiline text"
            multiline
            numberOfLines={3}
            returnKeyType="done"
            onSubmitEditing={handleDismissKeyboard}
            style={styles.multilineInput}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Dismiss Keyboard"
              onPress={handleDismissKeyboard}
              style={[styles.button, { backgroundColor: colors.textSecondary }]}
            />
            
            <Button
              title="Submit Form"
              onPress={handleSubmit}
              style={styles.button}
            />
          </View>
        </Card>

        <View style={styles.instructions}>
          <Text style={[styles.instructionTitle, { color: colors.text }]}>
            Test Instructions:
          </Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            • Tap on input fields to see keyboard behavior{'\n'}
            • Use "Next" button to move between fields{'\n'}
            • Check if input fields stay visible above keyboard{'\n'}
            • Test with different keyboard types{'\n'}
            • Try multiline input field
          </Text>
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },

  multilineInput: {
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  instructions: {
    marginTop: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
