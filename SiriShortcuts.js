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
  SET_STATUS_BUSY: 'set_status_busy',
  CHECK_FREE_FRIENDS: 'check_free_friends',
  QUICK_STATUS_UPDATE: 'quick_status_update',
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
      suggestedInvocationPhrase: 'I\'m Free',
      description: 'Update your availability status to let friends know you\'re available',
      persistentIdentifier: 'com.mmiotto.freetotalk.set_status_free',
    });

    // 2. Register the "Set my status to Busy" shortcut
    await SiriShortcutsManager.donateShortcut({
      identifier: SHORTCUT_TYPES.SET_STATUS_BUSY,
      title: 'Set my status to Busy',
      suggestedInvocationPhrase: 'I\'m Busy',
      description: 'Update your availability status to let friends know you\'re unavailable',
      persistentIdentifier: 'com.mmiotto.freetotalk.set_status_busy',
    });

    // 3. Register the "Check which friends are Free" shortcut
    await SiriShortcutsManager.donateShortcut({
      identifier: SHORTCUT_TYPES.CHECK_FREE_FRIENDS,
      title: 'Check which friends are Free',
      suggestedInvocationPhrase: 'Who\'s Free',
      description: 'Check which of your friends are currently available',
      persistentIdentifier: 'com.mmiotto.freetotalk.check_free_friends',
    });

    // 4. Register quick status update shortcut
    await SiriShortcutsManager.donateShortcut({
      identifier: SHORTCUT_TYPES.QUICK_STATUS_UPDATE,
      title: 'Quick Status Update',
      suggestedInvocationPhrase: 'Update my status',
      description: 'Quickly toggle your availability status',
      persistentIdentifier: 'com.mmiotto.freetotalk.quick_status_update',
    });
    
    console.log('Successfully registered enhanced Siri shortcuts');
  } catch (error) {
    console.error('Error registering Siri shortcuts:', error);
  }
};

/**
 * Handles Siri shortcut activation
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
        // First make sure the app is on the home screen, not on a settings page
        // This attempts to navigate to the main screen first
        webViewRef.current.injectJavaScript(`
          (function() {
            console.log('Navigating to main page for availability toggle');
            // Try to find and click "Home" or similar links
            const homeLinks = document.querySelectorAll('a[href="/"], a[href="/home"], [data-testid="home-link"]');
            if (homeLinks && homeLinks.length > 0) {
              homeLinks[0].click();
              console.log('Clicked home link');
            } else {
              // If no home link found, try to navigate programmatically
              if (window.location.pathname !== '/' && window.location.pathname !== '/home') {
                console.log('Attempting programmatic navigation to home');
                // Use history API if available
                if (window.history && window.history.pushState) {
                  window.history.pushState({}, '', '/');
                  // Dispatch popstate to trigger route updates
                  window.dispatchEvent(new PopStateEvent('popstate'));
                } else {
                  // Direct location change as last resort
                  window.location.href = '/';
                }
              }
            }
            return true;
          })();
        `);

        // Give a short delay for navigation to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Now execute the setAvailabilityStatus function
        console.log('Executing setAvailabilityStatus...');
        webViewRef.current.injectJavaScript(`
          (function() {
            try {
              console.log('Attempting to set availability status to FREE');
              
              // Check if our injected function exists
              if (typeof window.setAvailabilityStatus === 'function') {
                const result = window.setAvailabilityStatus(true);
                console.log('setAvailabilityStatus result:', result);
                return true;
              } else {
                console.error('setAvailabilityStatus function not found');
                
                // Fallback - try to find and click any toggle button with aggressive selectors
                console.log('Attempting aggressive fallback toggle approach');
                
                // First look for the availability switch container or toggle button
                const availabilityElements = [
                  // Try multiple selector strategies
                  ...Array.from(document.querySelectorAll('button[class*="toggle"], [class*="toggle"], [class*="switch"], [class*="availability"], [aria-label*="available"], [aria-label*="status"]')),
                  ...Array.from(document.querySelectorAll('div[class*="status"], section[class*="status"], button')),
                  ...Array.from(document.querySelectorAll('[role="button"]'))
                ];
                
                console.log(`Found ${availabilityElements.length} potential toggle elements`);
                
                // Look through text content for availability related words
                const targetElement = availabilityElements.find(el => {
                  const text = el.textContent?.toLowerCase() || '';
                  return text.includes('free') || 
                         text.includes('available') || 
                         text.includes('status') || 
                         el.className.includes('toggle') || 
                         el.className.includes('switch');
                });
                
                if (targetElement) {
                  console.log('Found target element with matching text:', targetElement);
                  targetElement.click();
                  console.log('Clicked primary target toggle element');
                  return true;
                }
                
                // If no matches by text, take a more aggressive approach with the first few potential elements
                console.log('No text match found, trying first few potential elements');
                for (let i = 0; i < Math.min(5, availabilityElements.length); i++) {
                  try {
                    console.log(`Trying element ${i}:`, availabilityElements[i]);
                    availabilityElements[i].click();
                    console.log(`Clicked element ${i}`);
                    return true;
                  } catch (e) {
                    console.log(`Failed to click element ${i}:`, e);
                  }
                }
                
                // Ultimate fallback: force availability through DOM manipulation
                try {
                  console.log('Attempting direct availability update via DOM');
                  // Create and dispatch a custom event for availability change
                  const availabilityEvent = new CustomEvent('availabilityChange', { detail: { isAvailable: true } });
                  document.dispatchEvent(availabilityEvent);
                  console.log('Dispatched custom availability event');
                  return true;
                } catch (e) {
                  console.log('Failed direct DOM manipulation:', e);
                }
                
                return false;
              }
            } catch (error) {
              console.error('Error in setAvailabilityStatus:', error);
              return false;
            }
          })();
        `);
        
        return { success: true, message: 'Status updated to Free' };

      case SHORTCUT_TYPES.CHECK_FREE_FRIENDS:
        console.log('Executing getAvailableFriends...');
        // First make sure we're on the main screen
        webViewRef.current.injectJavaScript(`
          (function() {
            console.log('Navigating to main page for friend check');
            // Similar navigation code as above
            const homeLinks = document.querySelectorAll('a[href="/"], a[href="/home"], [data-testid="home-link"]');
            if (homeLinks && homeLinks.length > 0) {
              homeLinks[0].click();
              console.log('Clicked home link');
            } else if (window.location.pathname !== '/' && window.location.pathname !== '/home') {
              if (window.history && window.history.pushState) {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              } else {
                window.location.href = '/';
              }
            }
            return true;
          })();
        `);

        // Give a short delay for navigation to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Execute JavaScript to get available friends
        webViewRef.current.injectJavaScript(`
          (function() {
            try {
              console.log('Attempting to get available friends list');
              
              // Check if our injected function exists
              if (typeof window.getAvailableFriends === 'function') {
                const availableFriends = window.getAvailableFriends();
                console.log('Found friends:', availableFriends);
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'available_friends_list',
                  friends: availableFriends
                }));
                return true;
              } else {
                console.error('getAvailableFriends function not found');
                console.log('Trying fallback DOM query approach for available friends');
                
                try {
                  // Attempt to find available friends from DOM elements
                  const availableFriends = [];
                  
                  // Look for common list containers
                  const friendLists = [
                    ...Array.from(document.querySelectorAll('[class*="friend-list"], [class*="friends"], ul, .grid, [role="list"]')),
                    ...Array.from(document.querySelectorAll('div[class*="container"] > div'))
                  ];
                  
                  console.log(`Found ${friendLists.length} potential friend list containers`);
                  
                  // Look for friend items with 'free' or 'available' status
                  let foundItems = [];
                  
                  // First approach: look for elements with green color (indicating available)
                  const greenTexts = document.querySelectorAll('[style*="color: green"], [style*="color:#"], [class*="green"], [class*="available"]');
                  console.log(`Found ${greenTexts.length} potential green/available elements`);
                  
                  greenTexts.forEach(element => {
                    const text = element.textContent?.trim();
                    if (text && (text.toLowerCase().includes('free') || element.className.toLowerCase().includes('available'))) {
                      // Try to find the parent container with the friend name
                      let container = element;
                      for (let i = 0; i < 4; i++) { // Look up to 4 levels up
                        if (container.parentElement) {
                          container = container.parentElement;
                          const nameElement = container.querySelector('h3, h4, strong, [class*="name"], [class*="title"]');
                          if (nameElement) {
                            const name = nameElement.textContent?.trim();
                            if (name) {
                              console.log(`Found available friend: ${name}`);
                              availableFriends.push({ name });
                              foundItems.push(container);
                              break;
                            }
                          }
                        }
                      }
                    }
                  });
                  
                  // Send the results back to React Native
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'available_friends_list',
                    friends: availableFriends,
                    source: 'dom-query'
                  }));
                  
                  return availableFriends.length > 0;
                } catch (err) {
                  console.error('DOM query fallback failed:', err);
                  
                  // Send an empty list as final fallback
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'available_friends_list',
                    friends: [],
                    error: 'Fallback method failed: ' + err.message
                  }));
                  return false;
                }
              }
            } catch (error) {
              console.error('Error in getAvailableFriends:', error);
              
              // Send error notification
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
