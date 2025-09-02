import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock implementation for Siri shortcuts when the native module isn't available
const mockSiriShortcuts = {
  donateShortcut: (shortcutInfo) => {
    console.log('Donating shortcut (mock):', shortcutInfo);
    return Promise.resolve({ success: true });
  },
  presentShortcut: (shortcutInfo) => {
    console.log('Presenting shortcut (mock):', shortcutInfo);
    return Promise.resolve({ success: true });
  },
  deleteShortcut: (identifier) => {
    console.log('Deleting shortcut (mock):', identifier);
    return Promise.resolve({ success: true });
  },
};

// Use native module if available, otherwise use mock implementation
const SiriShortcutsManager = Platform.OS === 'ios' && NativeModules.SiriShortcutsManager
  ? NativeModules.SiriShortcutsManager
  : mockSiriShortcuts;

export const SHORTCUT_TYPES = {
  SET_STATUS_FREE: 'set_status_free',
  CHECK_FREE_FRIENDS: 'check_free_friends',
};

/**
 * Registers Siri shortcuts for the app
 * @returns {Promise<void>}
 */
export const registerSiriShortcuts = async () => {
  if (Platform.OS !== 'ios') {
    console.log('Siri shortcuts are only available on iOS');
    return;
  }

  try {
    // 1. Register the "Set my status to Free" shortcut
    await SiriShortcutsManager.donateShortcut({
      identifier: SHORTCUT_TYPES.SET_STATUS_FREE,
      title: 'Set my status to Free',
      suggestedInvocationPhrase: "I'm Free",
      description: "Update your availability status to let friends know you're available",
      persistentIdentifier: 'com.mmiotto.freetotalk.set_status_free',
    });

    // 2. Register the "Check which friends are Free" shortcut
    await SiriShortcutsManager.donateShortcut({
      identifier: SHORTCUT_TYPES.CHECK_FREE_FRIENDS,
      title: 'Check which friends are Free',
      suggestedInvocationPhrase: "Who's Free",
      description: 'Check which of your friends are currently available',
      persistentIdentifier: 'com.mmiotto.freetotalk.check_free_friends',
    });
    
    console.log('Successfully registered Siri shortcuts');
  } catch (error) {
    console.error('Error registering Siri shortcuts:', error);
  }
};

/**
 * Handles Siri shortcut activation - simplified version
 * @param {string} type - The type of shortcut activated
 * @param {Object} webViewRef - Reference to the WebView component
 * @returns {Promise<any>}
 */
export const handleSiriShortcut = async (type, webViewRef) => {
  if (!webViewRef || !webViewRef.current) {
    console.error('WebView reference is not available');
    return { success: false, error: 'WebView not available' };
  }

  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found in AsyncStorage');
      return { success: false, error: 'User not logged in' };
    }

    // Log details of the activation for debugging
    console.log(`Siri shortcut activated: ${type}`, { userId });

    switch (type) {
      case SHORTCUT_TYPES.SET_STATUS_FREE:
        // Simple implementation to toggle availability
        webViewRef.current.injectJavaScript(`
          (function() {
            try {
              // Try to find and click the toggle button by basic search
              const buttons = document.querySelectorAll('button');
              let found = false;
              
              for (let i = 0; i < buttons.length; i++) {
                const button = buttons[i];
                if (button.textContent && 
                   (button.textContent.includes('Free') || 
                    button.textContent.includes('Available'))) {
                  button.click();
                  found = true;
                  break;
                }
              }
              
              return found;
            } catch (error) {
              console.error('Error in availability toggle:', error);
              return false;
            }
          })();
        `);
        
        return { success: true, message: 'Attempted to update status' };

      case SHORTCUT_TYPES.CHECK_FREE_FRIENDS:
        // Simple implementation to check friends
        webViewRef.current.injectJavaScript(`
          (function() {
            try {
              // Basic search for available friends
              const availableFriends = [];
              
              // Look for elements with "Free" text
              const elements = document.querySelectorAll('*');
              for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (element.textContent && 
                    element.textContent.trim() === 'Free') {
                  // Try to find the friend name in parent elements
                  let parent = element.parentElement;
                  for (let j = 0; j < 3 && parent; j++) {
                    const nameElement = parent.querySelector('span, div, p, h3, h4');
                    if (nameElement && nameElement !== element) {
                      availableFriends.push({ name: nameElement.textContent.trim() });
                      break;
                    }
                    parent = parent.parentElement;
                  }
                }
              }
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'available_friends_list',
                friends: availableFriends
              }));
              
              return true;
            } catch (error) {
              console.error('Error checking available friends:', error);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'available_friends_list',
                friends: [],
                error: error.message
              }));
              return false;
            }
          })();
        `);
        
        return { success: true, message: 'Checking available friends' };

      default:
        console.warn('Unknown shortcut type:', type);
        return { success: false, error: 'Unknown shortcut type' };
    }
  } catch (error) {
    console.error('Error handling Siri shortcut:', error);
    return { success: false, error: error.message };
  }
};
