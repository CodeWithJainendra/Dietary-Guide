import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

export interface KeyboardInfo {
  keyboardShown: boolean;
  keyboardHeight: number;
}

export const useKeyboard = (): KeyboardInfo => {
  const [keyboardShown, setKeyboardShown] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (event: KeyboardEvent) => {
      setKeyboardShown(true);
      setKeyboardHeight(event.endCoordinates.height);
    };

    const onKeyboardHide = () => {
      setKeyboardShown(false);
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  return {
    keyboardShown,
    keyboardHeight,
  };
};
