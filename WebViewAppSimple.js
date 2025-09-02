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
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializePushNotifications, registerForPushNotifications } from './pushNotifications';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';

// Import from the PhotoPicker file, not SimplifiedImagePicker
import PhotoPicker from './components/PhotoPicker';
import { pickContact, formatPhoneNumber } from './components/ContactPicker';

// Import contacts safely
let Contacts;
let ImagePicker;

try {
  Contacts = require('expo-contacts');
} catch (error) {
  console.warn('Failed to load expo-contacts module');
  // Define fallback contacts module later
}

try {
  ImagePicker = require('expo-image-picker');
} catch (error) {
  console.warn('Failed to load expo-image-picker module');
  // We'll handle this later
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
  const [showPhotoPickerModal, setShowPhotoPickerModal] = useState(false);
  const [photoPickerCallbackId, setPhotoPickerCallbackId] = useState(null);
  const [contactPermissionInfo, setContactPermissionInfo] = useState(null);

  // Setup effects
  useEffect(() => {
    const setup = async () => {
      try {
        const result = await initializePushNotifications(webViewRef);
        if (result.token) {
          setPushToken(result.token);
        }

        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
        
        const permissionInfo = await checkContactPermissionLevel();
        setContactPermissionInfo(permissionInfo);
      } catch (err) {
        console.error('Setup error:', err);
      }
    };

    setup();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => {
      backHandler.remove();
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

      switch (data.type) {
        case 'select_photo':
          setPhotoPickerCallbackId(data.callbackId);
          setShowPhotoPickerModal(true);
          break;
          
        case 'store_user_id':
          if (data.userId) {
            await AsyncStorage.setItem('userId', data.userId.toString());
            setUserId(data.userId.toString());
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

  // Simple photo picker modal
  const renderPhotoPickerModal = () => {
    if (!showPhotoPickerModal) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPhotoPickerModal}
        onRequestClose={() => setShowPhotoPickerModal(false)}
      >
        <PhotoPicker
          webViewRef={webViewRef}
          onClose={() => setShowPhotoPickerModal(false)}
          userId={userId}
        />
      </Modal>
    );
  };

  // Simple loading component
  if (loading) {
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
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setError(nativeEvent.description || 'Failed to load app');
        }}
        injectedJavaScript={callDetectionScript}
        renderLoading={() => (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loaderText}>Loading I'm Free App...</Text>
          </View>
        )}
      />
      
      {renderPhotoPickerModal()}
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
