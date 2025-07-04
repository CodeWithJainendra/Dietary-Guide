import { Keyboard } from 'react-native';

/**
 * Utility functions for keyboard management
 */

/**
 * Dismiss the keyboard programmatically
 */
export const dismissKeyboard = () => {
  Keyboard.dismiss();
};

/**
 * Check if keyboard is currently visible
 * Note: This is a simple check and may not be 100% accurate in all scenarios
 */
export const isKeyboardVisible = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      showListener.remove();
      resolve(true);
    });
    
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      hideListener.remove();
      resolve(false);
    });
    
    // Timeout to resolve false if no keyboard events are fired
    setTimeout(() => {
      showListener.remove();
      hideListener.remove();
      resolve(false);
    }, 100);
  });
};

/**
 * Add keyboard event listeners
 */
export const addKeyboardListeners = (
  onShow?: (height: number) => void,
  onHide?: () => void
) => {
  const showListener = Keyboard.addListener('keyboardDidShow', (event) => {
    onShow?.(event.endCoordinates.height);
  });
  
  const hideListener = Keyboard.addListener('keyboardDidHide', () => {
    onHide?.();
  });
  
  return () => {
    showListener.remove();
    hideListener.remove();
  };
};
