import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  BackHandler, 
  Alert, 
  Platform, 
  ActivityIndicator, 
  Button, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Modal, 
  Share, 
  TextInput, 
  Linking, 
  AppState, 
  Image,
  NativeModules
} from 'react-native';
import { registerSiriShortcuts, handleSiriShortcut, SHORTCUT_TYPES } from './SiriShortcuts';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializePushNotifications, registerForPushNotifications } from './pushNotifications';
import { debugNotificationPermissions, forceRequestPermissions } from './debug-permissions';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
// Network module not needed

// Photo picker functionality removed to streamline app
import { pickContact, formatPhoneNumber } from './components/ContactPicker';

// Import contacts safely
let Contacts;

try {
  Contacts = require('expo-contacts');
} catch (error) {
  console.warn('Failed to load expo-contacts module');
  // Define fallback contacts module later
}

// Constants
const SERVER_URL = 'https://freetotalk.replit.app';

// Helper functions
const checkContactPermissionLevel = async () => {
  try {
    console.log('Checking contacts permission level...');
    if (!Contacts) {
      return {
        status: 'unavailable',
        accessLevel: 'none',
        details: 'Contacts module not available',
        timestamp: new Date().toISOString()
      };
    }
    
    const { status } = await Contacts.getPermissionsAsync();
    
    let accessLevel = 'none';
    let details = 'No access to contacts';
    
    if (status === 'granted') {
      accessLevel = 'full';
      details = 'Full access to contacts';
    }
    
    return {
      status,
      accessLevel,
      details,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error checking contacts permission:', error);
    return {
      status: 'error',
      accessLevel: 'unknown',
      details: 'Error checking permission',
      timestamp: new Date().toISOString()
    };
  }
};

const getDevicePhoneNumber = async () => {
  try {
    const storedPhone = await AsyncStorage.getItem('devicePhoneNumber');
    if (storedPhone) {
      return storedPhone;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Main component
export default function WebViewApp() {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pushToken, setPushToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  // Photo-related state variables removed
  const [contactPermissionInfo, setContactPermissionInfo] = useState(null);

  // Track app state to handle background/foreground transitions
  const [appState, setAppState] = useState(AppState.currentState);
  const [backgroundTime, setBackgroundTime] = useState(null);
  const [needsReload, setNeedsReload] = useState(false);
  const [blankScreenCheckActive, setBlankScreenCheckActive] = useState(false);
  
  // Setup effects
  useEffect(() => {
    const setup = async () => {
      try {
        console.log('Setting up WebViewApp...');
        
        // Force initialLoadComplete after 5 seconds even if other operations fail
        setTimeout(() => {
          setInitialLoadComplete(true);
          setLoading(false);
        }, 5000);
        
        try {
          console.log('Initializing push notifications...');
          
          // First run diagnostic
          console.log('🔍 Running permission diagnostic...');
          const diagnostic = await debugNotificationPermissions();
          
          const result = await initializePushNotifications(webViewRef);
          if (result.token) {
            console.log('Push token received:', result.token.substring(0, 10) + '...');
            setPushToken(result.token);
          } else {
            console.log('No push token received - Permission may be denied');
            console.log('🔔 Permission status from diagnostic:', diagnostic.permissionStatus);
            
            // If no token and permission not granted, suggest manual request
            if (diagnostic.requiresDialog) {
              console.log('💡 TIP: Permission dialog should appear. If not, uninstall/reinstall app.');
            }
          }
        } catch (pushError) {
          console.error('Push notification initialization error:', pushError);
          // Continue despite push errors
        }

        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          console.log('Retrieved stored user ID:', storedUserId);
          setUserId(storedUserId);
          
          // Register Siri shortcuts if on iOS and user is logged in
          if (Platform.OS === 'ios') {
            try {
              await registerSiriShortcuts();
              console.log('Siri shortcuts registered on app launch');
            } catch (siriError) {
              console.error('Error registering Siri shortcuts on launch:', siriError);
            }
          }
        }
        
        try {
          const permissionInfo = await checkContactPermissionLevel();
          console.log('Contact permission level:', permissionInfo.accessLevel);
          setContactPermissionInfo(permissionInfo);
        } catch (contactError) {
          console.error('Contact permission check error:', contactError);
          // Continue despite contact permission errors
        }
        
        console.log('Setup completed successfully');
      } catch (err) {
        console.error('Setup error:', err);
      }
    };

    setup();
    
    // Set up app state change listener
    const handleAppStateChange = (nextAppState) => {
      console.log(`App state changed from ${appState} to ${nextAppState}`);
      
      // When app goes to background, record the time
      if (nextAppState.match(/inactive|background/) && appState === 'active') {
        const now = new Date();
        setBackgroundTime(now);
        console.log('App went to background at:', now.toISOString());
      }
      
      // When app comes to foreground from background
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground - forcing reload to prevent blank screen');
        
        // Calculate how long the app was in the background
        if (backgroundTime) {
          const now = new Date();
          const timeInBackground = now - backgroundTime;
          console.log(`App was in background for ${timeInBackground / 1000} seconds`);
          
          // Force reload for ANY background period to prevent blank screen
          // iOS can unload WebView content at any time, not just after 5 minutes
          console.log('Forcing WebView reload to prevent blank screen issue');
          setNeedsReload(true);
          if (webViewRef.current) {
            // Force complete WebView reload
            webViewRef.current.reload();
          }
        } else {
          // Even without backgroundTime, still force reload as safety measure
          console.log('No background time recorded - still forcing reload as safety measure');
          if (webViewRef.current) {
            webViewRef.current.reload();
          }
        }
      }
      
      setAppState(nextAppState);
    };
    
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      appStateSubscription.remove();
    };

    // Set up URL handler for Siri Shortcuts deep links
    const handleUrl = async (event) => {
      const url = event?.url;
      if (!url) return;
      
      console.log('Deep link received:', url);
      
      // Handle Siri shortcut activation via URL scheme
      if (url.includes('freetotalk://siri-shortcut/')) {
        const shortcutType = url.split('freetotalk://siri-shortcut/')[1];
        console.log('Siri shortcut activated via URL:', shortcutType);
        
        if (shortcutType === SHORTCUT_TYPES.SET_STATUS_FREE) {
          // Handle "I'm Free" shortcut
          await handleSiriShortcut(SHORTCUT_TYPES.SET_STATUS_FREE, webViewRef);
        } else if (shortcutType === SHORTCUT_TYPES.CHECK_FREE_FRIENDS) {
          // Handle "Who's Free" shortcut
          await handleSiriShortcut(SHORTCUT_TYPES.CHECK_FREE_FRIENDS, webViewRef);
        }
      }
    };

    // Listen for deep links in the foreground
    Linking.addEventListener('url', handleUrl);

    // Check for initial URL (app opened from a link)
    Linking.getInitialURL().then(url => {
      if (url) {
        handleUrl({ url });
      }
    });

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => {
      backHandler.remove();
      // Remove event listener for deep links
      // This syntax is needed for newer React Native versions
      const removeListener = Linking.removeEventListener
        ? () => Linking.removeEventListener('url', handleUrl)
        : () => {};
      removeListener();
    };
  }, []);

  const callDetectionScript = `
    (function() {
      let lastVisibilityState = document.visibilityState;
      
      function sendToApp(data) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
      
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden' && lastVisibilityState === 'visible') {
          sendToApp({ 
            type: 'visibility_change', 
            status: 'hidden', 
            timestamp: new Date().toISOString() 
          });
        } else if (document.visibilityState === 'visible' && lastVisibilityState === 'hidden') {
          sendToApp({ 
            type: 'visibility_change', 
            status: 'visible', 
            timestamp: new Date().toISOString() 
          });
        }
        
        lastVisibilityState = document.visibilityState;
      });
      
      window.pushNotificationToken = ${JSON.stringify(pushToken)};
      
      if (window.onPushTokenReceived) {
        window.onPushTokenReceived(${JSON.stringify(pushToken)});
      }
      
      window.sendPushTokenToServer = function(userId) {
        sendToApp({ 
          type: 'send_push_token_to_server', 
          userId: userId,
          timestamp: new Date().toISOString() 
        });
      };
      
      // Add function to set availability status (for Siri shortcut)
      window.setAvailabilityStatus = function(isAvailable) {
        console.log('Setting availability status to:', isAvailable);
        // Find and click the toggle button that sets availability
        try {
          // First check if there's an explicit UI button element
          const availabilityToggle = document.querySelector('[data-testid="availability-toggle"]');
          if (availabilityToggle) {
            availabilityToggle.click();
            return true;
          }

          // Next try finding using classnames
          const toggleBtns = document.querySelectorAll('.toggle-button, #toggle-availability, button[aria-label="Toggle availability"], .status-toggle-button');
          if (toggleBtns && toggleBtns.length > 0) {
            toggleBtns[0].click();
            return true;
          }

          // Try to find a button with specific text content
          const allButtons = document.querySelectorAll('button');
          for (let i = 0; i < allButtons.length; i++) {
            const buttonText = allButtons[i].textContent.toLowerCase();
            if (buttonText.includes('free') || buttonText.includes('available') || buttonText.includes('status')) {
              allButtons[i].click();
              return true;
            }
          }

          // Try finding toggle elements more generally
          const toggleElements = document.querySelectorAll('.toggle, [role="switch"], .switch, input[type="checkbox"].status');
          if (toggleElements && toggleElements.length > 0) {
            toggleElements[0].click();
            return true;
          }

          // Last resort - dispatch a custom event that the web app might be listening for
          const customEvent = new CustomEvent('siriToggleAvailability', {
            detail: { isAvailable: isAvailable }
          });
          document.dispatchEvent(customEvent);
          
          // Return true even if we can't confirm success
          return true;
        } catch (error) {
          console.error('Error setting availability status:', error);
          return false;
        }
      };
      
      // Add function to get available friends (for Siri shortcut)
      window.getAvailableFriends = function() {
        console.log('Getting available friends list');
        try {
          // Try to find friend elements that have availability indicators
          const availableFriends = [];
          
          // Look for various different DOM patterns for friends list
          // Method 1: Try for specific friend elements with standard classes
          const friendElements = document.querySelectorAll(
            '.friend-item, [data-testid^="friend-"], .friend, .friend-card, .user-card, ' + 
            '.avatar-container, .friend-container, [id^="friend-"], [class*="friend"]'
          );
          
          console.log('Found ' + friendElements.length + ' potential friend elements');
          
          if (friendElements && friendElements.length > 0) {
            friendElements.forEach(element => {
              // Check for any indicator that might suggest availability
              const isAvailable = 
                element.classList.contains('available') || 
                element.querySelector('.available, .status-available, .available-indicator, .green, ' + 
                                    '.status-green, .online, [style*="green"], [style*="#4ade80"], ' +
                                    '[class*="available"], [class*="online"]') !== null;
              
              // Try multiple ways to get the friend's name
              let name = 'Unknown';
              const nameElement = element.querySelector(
                '.friend-name, [data-testid="friend-name"], .name, .username, h3, h4, ' +
                'p, .label, [class*="name"], [class*="title"]'
              );
              
              if (nameElement) {
                name = nameElement.textContent.trim();
              } else if (element.textContent && element.textContent.length < 30) {
                // If element has short text content, might be just the name
                name = element.textContent.trim();
              }
              
              // Only add if we have a name that's not empty
              if (name && name !== 'Unknown' && name.length > 0) {
                availableFriends.push({
                  name: name,
                  isAvailable: isAvailable
                });
              }
            });
          }
          
          // If we didn't find any friends via DOM, check for React state in the global scope
          if (availableFriends.length === 0) {
            // Method 2: Look for any global state that might contain friends data
            const globalVars = ['friendsState', 'appState', 'state', 'store', 'data', 'friends', 
                            'reactData', 'window.friendsData', 'window.friends'];
            
            for (const varName of globalVars) {
              try {
                // Safely try to evaluate the variable
                const stateObj = eval(varName);
                if (stateObj && typeof stateObj === 'object') {
                  // Look for friends array/object in this global state
                  let friendsArray;
                  
                  if (Array.isArray(stateObj)) {
                    friendsArray = stateObj;
                  } else if (stateObj.friends && Array.isArray(stateObj.friends)) {
                    friendsArray = stateObj.friends;
                  } else if (stateObj.friends && typeof stateObj.friends === 'object') {
                    // Convert object to array
                    friendsArray = Object.values(stateObj.friends);
                  }
                  
                  if (friendsArray && friendsArray.length > 0) {
                    console.log('Found friends data in global variable:', varName);
                    
                    friendsArray.forEach(friend => {
                      if (friend && (friend.name || friend.displayName)) {
                        availableFriends.push({
                          name: friend.name || friend.displayName,
                          isAvailable: friend.isAvailable || friend.available || 
                                     friend.status === 'available' || friend.status === 'online'
                        });
                      }
                    });
                    
                    if (availableFriends.length > 0) {
                      break; // Stop looking in other variables if we found friends
                    }
                  }
                }
              } catch (evalError) {
                // Ignore eval errors - just try the next variable
              }
            }
          }
          
          // Last resort - just create some mock data for testing the shortcut
          if (availableFriends.length === 0) {
            // Scan the entire document for potential friend names
            const allElements = document.querySelectorAll('*');
            const nameRegex = /^[A-Z][a-z]+ ([A-Z][a-z]+)?$/; // Simple name regex
            
            for (let i = 0; i < allElements.length; i++) {
              const element = allElements[i];
              if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
                const text = element.textContent.trim();
                if (text.length > 2 && text.length < 30 && nameRegex.test(text)) {
                  // Looks like a name
                  const isGreen = 
                    window.getComputedStyle(element).color.includes('rgb(74, 222, 128)') || // #4ade80
                    element.innerHTML.includes('#4ade80') ||
                    element.className.includes('green') ||
                    element.className.includes('available');
                    
                  availableFriends.push({
                    name: text,
                    isAvailable: isGreen
                  });
                }
              }
            }
          }
          
          console.log('Final friends list:', availableFriends);
          return availableFriends;
        } catch (error) {
          console.error('Error getting available friends:', error);
          return [];
        }
      };
      
      sendToApp({ 
        type: 'script_loaded', 
        pushToken: ${JSON.stringify(pushToken)},
        timestamp: new Date().toISOString() 
      });
    })();
  `;

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', data.type);

      switch (data.type) {
        // Photo case removed to streamline app
        case 'store_user_id':
          if (data.userId) {
            await AsyncStorage.setItem('userId', data.userId.toString());
            setUserId(data.userId.toString());
            
            // Register Siri shortcuts when user ID is stored
            if (Platform.OS === 'ios') {
              try {
                await registerSiriShortcuts();
                console.log('Siri shortcuts registered successfully');
              } catch (siriError) {
                console.error('Error registering Siri shortcuts:', siriError);
              }
            }
          }
          break;
          
        case 'page_content_check':
          // Handle checks for blank screen
          console.log('Page content check:', data.hasContent ? 'has content' : 'might be blank');
          if (!data.hasContent) {
            console.log('Initial content check indicates screen might be blank');
          } else {
            // If we have content, no need for further checks
            setBlankScreenCheckActive(false);
          }
          break;
          
        case 'delayed_content_check':
          // Handle delayed check for blank screen
          console.log('Delayed content check:', data.hasContent ? 'has content' : 'confirmed blank');
          setBlankScreenCheckActive(false);
          
          if (!data.hasContent) {
            console.log('Confirmed blank screen - forcing complete reload');
            // Force a reload of the WebView as the screen is confirmed blank
            if (webViewRef.current) {
              try {
                webViewRef.current.reload();
                console.log('WebView reload initiated');
              } catch (error) {
                console.error('Error reloading WebView:', error);
              }
            }
          }
          break;
          
        case 'available_friends_list':
          // Handle response from getAvailableFriends request
          if (data.friends && Array.isArray(data.friends)) {
            const availableFriends = data.friends.filter(friend => friend.isAvailable);
            
            if (availableFriends.length === 0) {
              Alert.alert('Available Friends', 'None of your friends are currently available.');
            } else {
              const friendNames = availableFriends.map(friend => friend.name).join(', ');
              Alert.alert(
                'Available Friends', 
                `Your available friends: ${friendNames}`
              );
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error handling message from WebView:', error);
    }
  };

  const handleNavigationStateChange = (navState) => {
    setCurrentUrl(navState.url);
  };

  // Photo picker modal removed to streamline app

  // Simple loading component - only show if we've been loading for more than 2 seconds
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  useEffect(() => {
    // After 2 seconds, consider initial load complete (prevents getting stuck on loader)
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading && !initialLoadComplete) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loaderText}>Loading I'm Free App...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  // Simple error component
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorSubText}>{error}</Text>
        <Button title="Try Again" onPress={() => setLoading(true)} />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ uri: SERVER_URL }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        cacheEnabled={false}
        incognito={false}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        pullToRefreshEnabled={true}
        useWebView2={true}
        onContentProcessDidTerminate={(syntheticEvent) => {
          console.log('Content process terminated, reloading WebView');
          webViewRef.current?.reload();
        }}
        onNavigationStateChange={(navState) => {
          console.log('Navigation state changed:', navState.url);
          handleNavigationStateChange(navState);
        }}
        onMessage={(event) => {
          console.log('Message received from webview');
          handleMessage(event);
        }}
        onLoadStart={() => {
          console.log('WebView load started');
          setLoading(true);
        }}
        onLoadEnd={() => {
          console.log('WebView load ended');
          setLoading(false);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent.description);
          setError(nativeEvent.description || 'Failed to load app');
        }}
        injectedJavaScript={callDetectionScript}
        renderLoading={() => (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loaderText}>Loading I'm Free App...</Text>
          </View>
        )}
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        androidHardwareAccelerationDisabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 10,
  },
  errorSubText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
});
