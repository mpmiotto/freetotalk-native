import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Setup diagnostic log file
const LOG_DIRECTORY = `${FileSystem.documentDirectory}logs/`;
const LOG_FILE = `${LOG_DIRECTORY}push_notifications.log`;
const TOKEN_DETAILS_FILE = `${LOG_DIRECTORY}token_details.json`;
const DEVICE_INFO_FILE = `${LOG_DIRECTORY}device_info.json`;
const ERROR_LOG_FILE = `${LOG_DIRECTORY}push_errors.log`;

// Initialize the log directory
(async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(LOG_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(LOG_DIRECTORY, { intermediates: true });
      console.log('Log directory created:', LOG_DIRECTORY);
    }
    
    // Record device information on startup
    saveDeviceInfo();
  } catch (error) {
    console.error('Error creating log directory:', error);
  }
})();

// Diagnostic function to capture detailed device information
const saveDeviceInfo = async () => {
  try {
    const deviceInfo = {
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      modelName: Device.modelName,
      modelId: Device.modelId,
      designName: Device.designName,
      productName: Device.productName,
      deviceYearClass: Device.deviceYearClass,
      supportedCpuArchitectures: Device.supportedCpuArchitectures,
      osName: Device.osName,
      osVersion: Device.osVersion,
      osBuildId: Device.osBuildId,
      osInternalBuildId: Device.osInternalBuildId,
      osBuildFingerprint: Device.osBuildFingerprint,
      platformApiLevel: Device.platformApiLevel,
      deviceName: Device.deviceName,
      isDevice: Device.isDevice,
      timestamp: new Date().toISOString(),
      appVersion: Constants.expoConfig?.version || 'unknown',
      appBuildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || 'unknown',
      appId: Constants.expoConfig?.ios?.bundleIdentifier || Constants.expoConfig?.android?.package || 'unknown',
      appName: Constants.expoConfig?.name || 'unknown',
      projectId: Constants.expoConfig?.extra?.eas?.projectId || 'unknown',
    };

    // Write device info to log file
    await FileSystem.writeAsStringAsync(
      DEVICE_INFO_FILE,
      JSON.stringify(deviceInfo, null, 2)
    );
    
    console.log('Device information saved for diagnostics');
    return deviceInfo;
  } catch (error) {
    console.error('Error saving device information:', error);
    return null;
  }
};

// Log function for push notification events
const logPushEvent = async (event, details = {}) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      ...details
    };
    
    // Serialize to string with formatting
    const logText = JSON.stringify(logEntry, null, 2);
    
    // Check if log file exists
    const fileInfo = await FileSystem.getInfoAsync(LOG_FILE);
    
    if (fileInfo.exists) {
      // Append to existing file
      const currentContent = await FileSystem.readAsStringAsync(LOG_FILE);
      const newContent = currentContent + '\n' + logText;
      await FileSystem.writeAsStringAsync(LOG_FILE, newContent);
    } else {
      // Create new file
      await FileSystem.writeAsStringAsync(LOG_FILE, logText);
    }
    
    console.log(`Push notification event logged: ${event}`);
    return true;
  } catch (error) {
    console.error('Error logging push event:', error);
    return false;
  }
};

// Function to save token details for debugging
const saveTokenDetails = async (token, context = {}) => {
  try {
    const timestamp = new Date().toISOString();
    const tokenDetails = {
      token,
      obtained: timestamp,
      ...context,
      // Additional info that might help debug token issues
      tokenLength: token ? token.length : 0,
      tokenPrefix: token ? token.substring(0, 20) : 'null',
      tokenSuffix: token ? token.substring(token.length - 5) : 'null',
      isValidFormat: token ? (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) : false,
    };
    
    // Save in a persistent file
    await FileSystem.writeAsStringAsync(
      TOKEN_DETAILS_FILE,
      JSON.stringify(tokenDetails, null, 2)
    );
    
    // Log the event
    await logPushEvent('token_details_saved', { 
      tokenPrefix: tokenDetails.tokenPrefix,
      isValidFormat: tokenDetails.isValidFormat
    });
    
    console.log('Token details saved for diagnostics');
    return true;
  } catch (error) {
    console.error('Error saving token details:', error);
    return false;
  }
};

// Log errors specifically with stack traces
const logPushError = async (errorType, error, context = {}) => {
  try {
    const timestamp = new Date().toISOString();
    const errorEntry = {
      timestamp,
      errorType,
      message: error.message,
      stack: error.stack,
      ...context
    };
    
    // Serialize to string with formatting
    const errorText = JSON.stringify(errorEntry, null, 2);
    
    // Check if error log file exists
    const fileInfo = await FileSystem.getInfoAsync(ERROR_LOG_FILE);
    
    if (fileInfo.exists) {
      // Append to existing file
      const currentContent = await FileSystem.readAsStringAsync(ERROR_LOG_FILE);
      const newContent = currentContent + '\n' + errorText;
      await FileSystem.writeAsStringAsync(ERROR_LOG_FILE, newContent);
    } else {
      // Create new file
      await FileSystem.writeAsStringAsync(ERROR_LOG_FILE, errorText);
    }
    
    console.error(`Push notification error logged: ${errorType}`);
    return true;
  } catch (logError) {
    console.error('Error logging push error:', logError);
    return false;
  }
};

// Diagnostic function to collect and display all available push notification data
export const getPushNotificationDiagnostics = async () => {
  try {
    // Collect data from various sources
    const logs = await FileSystem.readAsStringAsync(LOG_FILE).catch(() => 'No logs found');
    const tokenDetails = await FileSystem.readAsStringAsync(TOKEN_DETAILS_FILE).catch(() => 'No token details found');
    const deviceInfo = await FileSystem.readAsStringAsync(DEVICE_INFO_FILE).catch(() => 'No device info found');
    const errorLogs = await FileSystem.readAsStringAsync(ERROR_LOG_FILE).catch(() => 'No error logs found');
    
    // Get current storage values
    const pushToken = await AsyncStorage.getItem('pushToken');
    const userId = await AsyncStorage.getItem('userId');
    const deviceId = await AsyncStorage.getItem('deviceId');
    
    // Check permission status
    const { status: permissionStatus } = await Notifications.getPermissionsAsync();
    
    // Package all diagnostic data
    const diagnosticData = {
      currentToken: pushToken,
      userId,
      deviceId,
      permissionStatus,
      tokenDetailsFile: tokenDetails,
      deviceInfoFile: deviceInfo,
      errorLogsFile: errorLogs,
      logsFileSize: logs.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('Push notification diagnostics collected');
    
    // Show diagnostics or return data
    return diagnosticData;
  } catch (error) {
    console.error('Error collecting push notification diagnostics:', error);
    return { error: error.message };
  }
};

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Production server URL
const SERVER_URL = 'https://freetotalk.replit.app';

// Save token to AsyncStorage for persistence
const saveTokenToStorage = async (token) => {
  try {
    await AsyncStorage.setItem('pushToken', token);
    console.log('Push token saved to AsyncStorage:', token);
    return true;
  } catch (error) {
    console.error('Error saving push token to AsyncStorage:', error);
    return false;
  }
};

// Generate or retrieve a unique device ID
const getOrCreateDeviceId = async () => {
  try {
    // Try to get existing device ID from storage
    let deviceId = await AsyncStorage.getItem('deviceId');
    
    // If no device ID exists, create a new one
    if (!deviceId) {
      // Create a unique ID based on device info and timestamp
      deviceId = `${Platform.OS}_${Device.modelName || 'unknown'}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      await AsyncStorage.setItem('deviceId', deviceId);
      console.log('Created new device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error managing device ID:', error);
    // Fallback device ID if storage fails
    return `${Platform.OS}_${Date.now()}`;
  }
};

// Register token with the server - using both approaches for redundancy
const registerTokenWithServer = async (token) => {
  try {
    // Get the API URL
    const apiUrl = `${SERVER_URL}/api/push/register`;
    console.log('Registering push token with server:', token);
    
    // Generate or get a unique device ID
    const deviceId = await getOrCreateDeviceId();
    console.log('Using device ID:', deviceId);
    
    // Check if we have a user ID from storage (for testing or authentication)
    const userId = await AsyncStorage.getItem('userId');
    
    // Detailed diagnostic popup with complete token registration status
    Alert.alert(
      'Push Token Diagnostic',
      `UserId: ${userId || 'Not found'}\n` +
      `Token: ${token ? token.substring(0, 10) + '...' : 'None'}\n` +
      `Device ID: ${deviceId}\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Platform: ${Platform.OS}`,
      [{ text: 'OK' }]
    );
    
    if (!userId) {
      console.log('No userId found in storage. Registration will be anonymous or may fail.');
      return { success: false, message: 'No user ID available for registration' };
    }
    
    // Try the direct method first (more reliable)
    try {
      console.log('Trying direct token registration first...');
      
      const directResponse = await fetch(`${SERVER_URL}/api/push/test-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          token: token
        }),
      });
      
      // Check if the direct method worked
      if (directResponse.ok) {
        const directResult = await directResponse.json();
        
        if (directResult.success) {
          console.log('Direct push token registration success!');
          return { 
            success: true, 
            message: 'Token registered with server using direct method',
            method: 'direct'
          };
        } else {
          console.warn('Direct registration failed:', directResult.message);
          // Continue to try the standard method
        }
      } else {
        console.warn('Direct registration request failed:', directResponse.status);
        // Continue to try the standard method
      }
    } catch (directError) {
      console.error('Error with direct token registration:', directError);
      // Continue to try the standard method
    }
    
    // Try the standard registration endpoint as backup
    console.log('Trying standard token registration...');
    
    // Create URL with optional parameters
    const urlWithParams = new URL(apiUrl);
    urlWithParams.searchParams.append('userId', userId);
    console.log('Including userId in request:', userId);
    
    // Send the token to our server
    const response = await fetch(urlWithParams.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token, 
        deviceId 
      }),
      credentials: 'include', // Include cookies for session auth
    });
    
    // Parse the response
    const result = await response.json();
    
    if (result.success) {
      console.log('Push token successfully registered with server!');
      return { 
        success: true, 
        message: 'Token registered with server using standard method',
        method: 'standard'
      };
    } else {
      console.warn('Server registration issue:', result.message);
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('Error registering token with server:', error);
    return { success: false, error: error.message };
  }
};

// Get Expo push token and register it with the server
export const registerForPushNotifications = async () => {
  // Record starting of push registration process
  await logPushEvent('registration_started', { 
    timestamp: new Date().toISOString(),
    deviceInfo: Device.isDevice ? 'physical_device' : 'simulator_or_emulator'
  });
  
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices, not on emulators/simulators');
    await logPushEvent('simulator_detected', { reason: 'Push notifications require physical device' });
    console.log('Debug: Push notifications only work on physical devices, not on emulators/simulators');
    return null;
  }

  try {
    // Check if we already have a token saved
    const existingToken = await AsyncStorage.getItem('pushToken');
    if (existingToken) {
      console.log('Using existing push token:', existingToken);
      await logPushEvent('existing_token_found', { 
        tokenPrefix: existingToken.substring(0, 20),
        tokenLength: existingToken.length,
        isValidFormat: existingToken.startsWith('ExponentPushToken[') || existingToken.startsWith('ExpoPushToken[')
      });
      
      // Save detailed token information
      await saveTokenDetails(existingToken, { 
        source: 'async_storage', 
        isExisting: true 
      });
      
      // Get user ID from AsyncStorage for automatic registration
      const userId = await AsyncStorage.getItem('push_user_id');
      await logPushEvent('auto_token_registration', { 
        userIdExists: !!userId,
        userIdValue: userId ? userId : 'null',
        tokenPrefix: existingToken.substring(0, 15),
      });
      
      // Automatically register the token with the server without prompting
      console.log('Automatically registering token for userId:', userId || 'unknown');
      const regResult = await registerTokenWithServer(existingToken);
      await logPushEvent('auto_registration_result', regResult);
      
      // Store registration status
      if (regResult.success && userId) {
        await AsyncStorage.setItem('tokenRegistrationStatus', JSON.stringify({
          success: true,
          userId: userId,
          timestamp: new Date().toISOString(),
          method: regResult.method || 'auto'
        }));
        console.log('Token registration status saved');
      }
      return existingToken;
    }

    // Check for existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    console.log('Current notification permission status:', existingStatus);
    await logPushEvent('permission_status_check', { status: existingStatus });
    
    // If no permissions, request them with comprehensive settings to encourage persistent banners
    if (existingStatus !== 'granted') {
      console.log('Requesting comprehensive notification permissions...');
      await logPushEvent('requesting_permissions', { 
        current_status: existingStatus,
        platform: Platform.OS,
        device_info: {
          osVersion: Device.osVersion,
          platformApiLevel: Device.platformApiLevel
        }
      });
      
      try {
        // Request all notification permissions aggressively to increase persistent banner likelihood
        const permissionConfig = Platform.OS === 'ios' 
          ? {
              ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
                allowDisplayInCarPlay: true,
                allowCriticalAlerts: false,
                provideAppNotificationSettings: true,
                allowProvisional: false,
                allowAnnouncements: true,
              },
            }
          : {
              android: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
              },
            };
        
        console.log('🔔 Showing notification permission dialog...');
        const { status } = await Notifications.requestPermissionsAsync(permissionConfig);
        finalStatus = status;
        
        console.log('🔔 Permission dialog result:', status);
        await logPushEvent('permission_request_completed', { 
          status,
          requestedPermissions: Platform.OS === 'ios' ? 'comprehensive_ios_settings' : 'android_basic_settings',
          platform: Platform.OS,
          final_status: finalStatus
        });
        
        // For Android 13+, add additional validation
        if (Platform.OS === 'android' && Device.platformApiLevel >= 33) {
          console.log('📱 Android 13+ detected, validating POST_NOTIFICATIONS permission...');
          
          // Double-check permissions after user interaction
          const recheck = await Notifications.getPermissionsAsync();
          finalStatus = recheck.status;
          
          await logPushEvent('android_13_permission_recheck', {
            api_level: Device.platformApiLevel,
            initial_result: status,
            recheck_result: recheck.status,
            granted: recheck.status === 'granted'
          });
          
          console.log('🔍 Android 13+ permission recheck result:', recheck.status);
        }
      } catch (permError) {
        await logPushError('permission_request_failed', permError);
        console.error(`Failed to request permissions: ${permError.message}`);
        return null;
      }
    }

    // If permission denied, return null
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token: permission not granted');
      await logPushEvent('permission_denied', { finalStatus });
      
      // Log the permission denial but don't interrupt login
      console.warn('Notification permission denied. Some features will not be available.');
      return null;
    }

    // Get native Firebase token for Android, Expo token for iOS
    console.log('Getting push token...');
    await logPushEvent('getting_push_token', { 
      permissionStatus: finalStatus,
      platform: Platform.OS 
    });
    
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    await logPushEvent('project_id_check', { 
      projectId: projectId || 'not_found',
      appConfig: {
        version: Constants.expoConfig?.version || 'unknown',
        name: Constants.expoConfig?.name || 'unknown',
        slug: Constants.expoConfig?.slug || 'unknown'
      }
    });
    
    if (!projectId) {
      console.warn('No projectId found in app config. Push notifications may not work correctly.');
      await logPushEvent('missing_project_id', { 
        warning: 'Push notifications may not work correctly without project ID'
      });
      
      // Log this error but don't show to the user
      console.warn('Configuration Issue: No project ID found in the app config');
    } else {
      console.log('Using project ID:', projectId);
    }
    
    try {
      console.log('Requesting push token from Expo service...');
      await logPushEvent('requesting_expo_push_token', { 
        projectId: projectId || 'not_provided'
      });
      
      // Skip user prompt in production - just get the token automatically
      
      // Get appropriate token type based on platform
      let tokenValue;
      
      if (Platform.OS === 'android') {
        // For Android, try to get native Firebase token
        try {
          console.log('Attempting to get native Firebase token for Android...');
          const firebaseToken = await Notifications.getDevicePushTokenAsync();
          tokenValue = firebaseToken.data;
          console.log('✅ Got native Firebase token for Android:', tokenValue.substring(0, 20) + '...');
          await logPushEvent('native_firebase_token_obtained', {
            tokenPrefix: tokenValue.substring(0, 20),
            platform: 'android'
          });
        } catch (firebaseError) {
          console.log('❌ Failed to get Firebase token, falling back to Expo token:', firebaseError.message);
          await logPushEvent('firebase_token_failed', { 
            error: firebaseError.message,
            fallback: 'expo_token'
          });
          
          // Fallback to Expo token
          const expoPushToken = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          });
          tokenValue = expoPushToken.data;
        }
      } else {
        // For iOS, use Expo token (works fine with FCM v1)
        console.log('Getting Expo token for iOS...');
        const expoPushToken = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
        tokenValue = expoPushToken.data;
      }
      console.log('Push token obtained:', tokenValue);
      
      await logPushEvent('push_token_obtained', {
        tokenPrefix: tokenValue.substring(0, 20),
        tokenLength: tokenValue.length,
        isValidFormat: tokenValue.startsWith('ExponentPushToken[') || tokenValue.startsWith('ExpoPushToken[')
      });
      
      // Save detailed token information
      await saveTokenDetails(tokenValue, {
        source: 'expo_push_service',
        isNew: true,
        projectId: projectId
      });
      
      // Token received successfully, no need to show alert
      console.log('Successfully obtained token:', tokenValue.substring(0, 15) + '...');
      
      // Save token locally
      const storageResult = await saveTokenToStorage(tokenValue);
      await logPushEvent('token_storage_result', { success: storageResult });
      
      // Get user ID if available
      const userId = await AsyncStorage.getItem('push_user_id');
      await logPushEvent('user_id_check', { 
        userId: userId || 'not_found',
        hasUserId: !!userId
      });
      
      // Register with server
      if (userId) {
        // Log registration attempt but don't show alert
        console.log('Registering token with server for user ID:', userId);
        await logPushEvent('registering_with_server', { userId });
        
        const regResult = await registerTokenWithServer(tokenValue);
        await logPushEvent('server_registration_result', regResult);
        
        // Silently log results without showing alerts
        console.log('Registration result:', regResult.success 
          ? 'Token registered successfully' 
          : `Registration failed: ${regResult.message || 'Unknown error'}`);
      } else {
        await logPushEvent('registration_skipped', { reason: 'no_user_id' });
        console.log('Token received but not registered with server (no user ID)');
      }
      
      // Final diagnostic info recording
      await getPushNotificationDiagnostics();
      
      return tokenValue;
    } catch (tokenError) {
      console.error('Error getting push token:', tokenError);
      await logPushError('token_request_error', tokenError, {
        projectId: projectId || 'not_provided'
      });
      
      // Log error but don't show alert
      console.error('Failed to get token:', tokenError.message);
      return null;
    }
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    await logPushError('registration_process_error', error);
    // Log instead of showing alert
    console.error(`Registration Error: ${error.message}`);
    return null;
  }
};

// Unregister token when logging out
export const unregisterPushToken = async () => {
  try {
    // Get the token from storage
    const token = await AsyncStorage.getItem('pushToken');
    
    if (!token) {
      console.log('No push token to unregister');
      return { success: false, message: 'No token found' };
    }
    
    // Unregister with server
    const response = await fetch(`${SERVER_URL}/api/push/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
      credentials: 'include',
    });
    
    const result = await response.json();
    console.log('Token unregistration result:', result);
    
    // Clear token from storage
    if (result.success) {
      await AsyncStorage.removeItem('pushToken');
      console.log('Push token removed from AsyncStorage');
    }
    
    return result;
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return { success: false, error: error.message };
  }
};

// Send a test notification request to the server
export const requestTestNotification = async (userId) => {
  try {
    const targetUserId = userId || await AsyncStorage.getItem('userId');
    
    if (!targetUserId) {
      console.error('No user ID available for test notification');
      return { success: false, message: 'No user ID available' };
    }
    
    console.log(`Requesting test notification for user ${targetUserId}`);
    
    const response = await fetch(`${SERVER_URL}/api/push/test?userId=${targetUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const result = await response.json();
    console.log('Test notification request result:', result);
    
    return result;
  } catch (error) {
    console.error('Error requesting test notification:', error);
    return { success: false, error: error.message };
  }
};

// Setup notification handling for the app
export const setupNotificationListeners = (webViewRef) => {
  // Handle received notifications (while app is open)
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received while app is open:', notification);
    
    // Get the notification data
    const data = notification.request.content.data;
    console.log('Foreground notification data:', data);
    
    // Update the WebView with the status change - this is the key enhancement!
    if (data && data.type === 'statusChange' && webViewRef && webViewRef.current) {
      console.log('🔄 Friend status change detected while app is open, updating UI immediately');
      
      // Inject JavaScript to update the UI without requiring a refresh
      webViewRef.current.injectJavaScript(`
        (function() {
          // Check if our handler function exists
          if (window.handleFriendStatusUpdate) {
            console.log('Calling handleFriendStatusUpdate with:', ${JSON.stringify(data)});
            window.handleFriendStatusUpdate(${JSON.stringify(data)});
          } else {
            console.warn('handleFriendStatusUpdate function not available in web app');
            // Fallback approach: manually update any UI elements
            const statusIndicator = document.querySelector('[data-friend-id="${data.userId}"]');
            if (statusIndicator) {
              statusIndicator.className = ${data.isAvailable} ? 'friend-available' : 'friend-unavailable';
              console.log('Updated friend status indicator directly');
            }
          }
          true;
        })();
      `);
    } 
    // Handle friend request acceptance notification
    else if (data && data.type === 'friendRequestAccepted' && webViewRef && webViewRef.current) {
      console.log('🤝 Friend request accepted notification received, updating UI immediately');
      
      // Inject JavaScript to update the UI without requiring a refresh
      webViewRef.current.injectJavaScript(`
        (function() {
          // Check if our handler function exists
          if (window.handleFriendRequestAccepted) {
            console.log('Calling handleFriendRequestAccepted with:', ${JSON.stringify(data)});
            window.handleFriendRequestAccepted(${JSON.stringify(data)});
          } else {
            console.log('Handler not found, refreshing friends list to update UI');
            // Fallback: Refresh the friends list by triggering the API call
            if (window.refreshFriendsList) {
              window.refreshFriendsList();
            } else {
              // Last resort - force refresh the page
              window.location.reload();
            }
          }
          true;
        })();
      `);
    }
  });

  // Handle user tapping on notification (when app is in background)
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('User tapped notification:', response);
    
    // Get the notification data
    const data = response.notification.request.content.data;
    console.log('Notification tap data:', data);
    
    // We'll still need to update the UI when the user taps a notification
    if (data && data.type === 'statusChange' && webViewRef && webViewRef.current) {
      console.log(`Friend ${data.userId} status changed to ${data.isAvailable ? 'available' : 'unavailable'}`);
      
      // Slight delay to ensure WebView is ready after coming from background
      setTimeout(() => {
        webViewRef.current.injectJavaScript(`
          (function() {
            if (window.handleFriendStatusUpdate) {
              console.log('Calling handleFriendStatusUpdate with:', ${JSON.stringify(data)});
              window.handleFriendStatusUpdate(${JSON.stringify(data)});
            } else {
              console.warn('handleFriendStatusUpdate function not available in web app');
            }
            true;
          })();
        `);
      }, 1000);
    } 
    // Handle friend request acceptance notification when app in background
    else if (data && data.type === 'friendRequestAccepted' && webViewRef && webViewRef.current) {
      console.log('🤝 Friend request accepted notification tapped, updating UI');
      
      // Slight delay to ensure WebView is ready after coming from background
      setTimeout(() => {
        webViewRef.current.injectJavaScript(`
          (function() {
            if (window.handleFriendRequestAccepted) {
              console.log('Calling handleFriendRequestAccepted with:', ${JSON.stringify(data)});
              window.handleFriendRequestAccepted(${JSON.stringify(data)});
            } else {
              console.log('Handler not found, refreshing friends list to update UI');
              // Fallback: Refresh the friends list by triggering the API call
              if (window.refreshFriendsList) {
                window.refreshFriendsList();
              } else {
                // Last resort - force refresh the page
                window.location.reload();
              }
            }
            true;
          })();
        `);
      }, 1000);
    } else if (data.type === 'friendRequest') {
      console.log('New friend request received');
      // Handle friend request notification
    } else if (data.type === 'message') {
      console.log('New message received');
      // Handle message notification
    }
  });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};

// Combined initialization function for convenience
export const initializePushNotifications = async (webViewRef) => {
  // Setup notification handlers with webViewRef for UI updates
  const unsubscribe = setupNotificationListeners(webViewRef);
  
  // Register for push notifications
  const token = await registerForPushNotifications();
  
  return {
    token,
    unsubscribe,
  };
};