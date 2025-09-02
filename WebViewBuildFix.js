import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { registerSiriShortcuts, handleSiriShortcut, SHORTCUT_TYPES } from './SiriShortcutsSimple';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function WebViewApp() {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef(null);
  
  // Initialize app when component mounts
  useEffect(() => {
    // Register notification handler
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      try {
        console.log('Notification response received:', response);
        // Handle notification tap here
      } catch (error) {
        console.error('Error handling notification tap:', error);
      }
    });

    // Register Siri shortcuts on iOS
    registerSiriShortcuts().catch(error => {
      console.error('Error registering Siri shortcuts:', error);
    });

    // Clean up on unmount
    return () => {
      notificationSubscription.remove();
    };
  }, []);

  // Handle messages from the WebView
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', data);

      if (data.type === 'set_user_id') {
        // Store the user ID in AsyncStorage
        AsyncStorage.setItem('userId', data.userId.toString());
      } else if (data.type === 'register_push_token') {
        // Handle push token registration
        console.log('Registering push token for user:', data.userId);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://freetotalk.replit.app' }}
        style={styles.webview}
        onMessage={handleMessage}
        onLoad={() => setIsLoading(false)}
        onError={(error) => console.error('WebView error:', error)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
});
