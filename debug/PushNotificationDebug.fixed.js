import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  PixelRatio,
  useWindowDimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { initializePushNotifications, registerForPushNotifications, requestTestNotification } from '../pushNotifications';

// Production server URL
const SERVER_URL = 'https://freetotalk.replit.app';

// Function to normalize font sizes based on device scale
const normalize = (size) => {
  const scale = PixelRatio.getFontScale();
  // If font scale is above 1.3, we start reducing our UI font sizes to compensate
  const normalizedScale = scale > 1.3 ? (1 + (scale - 1.3) * 0.5) : scale;
  return Math.round(size / normalizedScale);
};

export default function PushNotificationDebug() {
  // Get window dimensions for responsive layouts
  const { width, height } = useWindowDimensions();
  const [pushToken, setPushToken] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const [friendId, setFriendId] = useState('');
  const [response, setResponse] = useState(null);
  
  // Store ScrollView ref for auto-scrolling
  const scrollViewRef = React.useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Get stored values
      const storedToken = await AsyncStorage.getItem('pushToken');
      const storedUserId = await AsyncStorage.getItem('userId');
      
      if (storedToken) {
        setPushToken(storedToken);
        addLog('Loaded stored push token: ' + storedToken);
      }
      
      if (storedUserId) {
        setUserId(storedUserId);
        addLog('Loaded stored user ID: ' + storedUserId);
      }
      
      // Check notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      setStatus(`Permission status: ${status}`);
      addLog('Notification permission status: ' + status);
    } catch (error) {
      addLog('Error loading initial data: ' + error.message);
    }
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [`[${timestamp}] ${message}`, ...prevLogs]);
  };

  const registerToken = async () => {
    try {
      setLoading(true);
      addLog('Requesting push notification permissions...');
      
      const result = await initializePushNotifications();
      
      if (result.token) {
        setPushToken(result.token);
        addLog('Successfully registered push token: ' + result.token);
      } else {
        addLog('Failed to get push token.');
      }
    } catch (error) {
      addLog('Error registering token: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      setLoading(true);
      addLog(`Sending test notification to user ID: ${userId || 'self'}`);
      
      // Use the direct API endpoint instead of the helper function
      const response = await fetch(`${SERVER_URL}/api/push/test${userId ? `?userId=${userId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      // Log the raw response for debugging
      const responseText = await response.text();
      addLog(`Server response status: ${response.status}`);
      addLog(`Raw response: ${responseText}`);
      
      // Try to parse the response as JSON
      try {
        const result = JSON.parse(responseText);
        setResponse(result);
        
        if (result.success) {
          addLog('Test notification sent successfully!');
          addLog(`Message: ${result.message}`);
        } else {
          addLog('Failed to send test notification: ' + (result.message || 'Unknown error'));
        }
      } catch (e) {
        addLog('Error parsing server response: ' + e.message);
      }
    } catch (error) {
      addLog('Error sending test notification: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const registerWithServer = async () => {
    if (!pushToken) {
      addLog('No push token to register. Get a token first.');
      return;
    }

    if (!userId) {
      addLog('Please enter a User ID to register the token.');
      return;
    }

    try {
      setLoading(true);
      addLog('STARTING REGISTRATION PROCESS');
      addLog(`🔑 User ID: ${userId}`);
      addLog(`📱 Device: ${Platform.OS}`);
      addLog(`📟 Token length: ${pushToken.length} chars`);
      
      // First step: Save the token directly to the database using a direct SQL update
      addLog('💾 STEP 1: Directly saving token to database...');
      
      try {
        const tokenEndpoint = `${SERVER_URL}/api/admin/save-user-token`;
        addLog(`Endpoint: ${tokenEndpoint}`);
        
        const tokenPayload = {
          userId: parseInt(userId, 10),
          pushToken: pushToken
        };
        addLog(`Payload: ${JSON.stringify(tokenPayload)}`);
        
        // Use direct SQL update API
        const saveTokenResponse = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tokenPayload),
        });
        
        addLog(`Response status: ${saveTokenResponse.status}`);
        const saveTokenResult = await saveTokenResponse.text();
        addLog(`Step 1 result: ${saveTokenResult}`);
        
        if (saveTokenResponse.ok) {
          addLog('✅ Token saved to database successfully');
        } else {
          addLog('❌ Token save FAILED');
        }
      } catch (e) {
        addLog(`⚠️ Error in step 1: ${e.message}`);
      }
      
      // Step 2: Now register with deviceId
      addLog('📲 STEP 2: Registering with device ID...');
      
      // Generate a device ID with more uniqueness
      const deviceId = `${Platform.OS}_${Device.modelName || 'unknown'}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      addLog(`Generated deviceId: ${deviceId}`);
      
      // Store device ID for future use
      await AsyncStorage.setItem('deviceId', deviceId);
      addLog('Saved deviceId to AsyncStorage');
      
      // Prepare full request for debugging
      const registerEndpoint = `${SERVER_URL}/api/push/register?userId=${userId}`;
      addLog(`Endpoint: ${registerEndpoint}`);
      
      const payload = { 
        token: pushToken, 
        deviceId: deviceId 
      };
      addLog(`Payload: ${JSON.stringify(payload)}`);
      
      // Make the actual request
      const response = await fetch(registerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      // Log the raw response for debugging
      const responseText = await response.text();
      addLog(`Server response status: ${response.status}`);
      addLog(`Raw response: ${responseText}`);
      
      // Test direct register with simpler approach
      addLog('🧪 STEP 3: Trying alternative registration approach...');
      try {
        // Using direct token registration function
        const altResponse = await fetch(`${SERVER_URL}/api/push/test-register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(userId, 10),
            token: pushToken
          }),
        });
        
        const altResult = await altResponse.text();
        addLog(`Alternative approach response: ${altResponse.status}`);
        addLog(`Result: ${altResult}`);
      } catch (e) {
        addLog(`Error in alt approach: ${e.message}`);
      }
      
      // Parse JSON result from main approach if possible
      let result;
      try {
        result = JSON.parse(responseText);
        setResponse(result);
        
        if (result.success) {
          addLog('✅ Push token registered with server successfully!');
        } else {
          addLog(`❌ Registration FAILED: ${result.message || 'Unknown error'}`);
        }
      } catch (e) {
        addLog(`Error parsing server response: ${e.message}`);
      }
    } catch (error) {
      addLog(`❌ ERROR: ${error.message}`);
      addLog(`Stack: ${error.stack ? error.stack.slice(0, 200) : 'No stack trace'}`);
    } finally {
      setLoading(false);
      addLog('Registration process completed');
    }
  };

  // Test the direct push token registration endpoint
  // Function to manually set a user token directly through admin endpoint
  const registerUserDirectly = async () => {
    if (!userId) {
      addLog('❌ User ID is required');
      return;
    }
    
    try {
      setLoading(true);
      addLog(`🔄 Registering token for user ID: ${userId}`);
      
      // Check for valid userId format
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        addLog('❌ User ID must be a valid number');
        setStatus('Invalid user ID format');
        setLoading(false);
        return;
      }
      
      // Generate a test token if none exists
      const tokenToUse = pushToken || `ExpoSampleToken[${Date.now().toString(36)}]`;
      addLog(`Using token: ${tokenToUse}`);
      
      // Use the admin endpoint to directly save token
      const endpoint = `${SERVER_URL}/api/admin/save-user-token`;
      addLog(`Using endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userIdNum,
          pushToken: tokenToUse,
          deviceId: `debug-device-${Date.now()}`
        })
      });
      
      const responseText = await response.text();
      addLog(`Response status: ${response.status}`);
      
      try {
        const result = JSON.parse(responseText);
        setResponse(result);
        
        if (response.ok) {
          addLog('✅ Direct token registration SUCCESSFUL');
          setStatus('Token registered for user ' + userId);
        } else {
          addLog(`❌ Failed to register token: ${result.message || 'Unknown error'}`);
          setStatus('Failed to register token');
        }
      } catch (e) {
        addLog(`Error parsing response: ${e.message}`);
        addLog(`Raw response: ${responseText}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
      setStatus('Error registering token');
    } finally {
      setLoading(false);
    }
  };

  const testDirectRegistration = async () => {
    if (!userId || !pushToken) {
      addLog('❌ Both User ID and Push Token are required');
      return;
    }
    
    try {
      setLoading(true);
      addLog(`🔄 Testing direct token registration for user ID: ${userId}`);
      
      // Check for valid userId format first
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        addLog('❌ User ID must be a valid number');
        setStatus('Invalid user ID format');
        setLoading(false);
        return;
      }
      
      addLog(`Using server URL: ${SERVER_URL}`);
      const endpoint = `${SERVER_URL}/api/admin/save-user-token`;
      addLog(`Calling endpoint: ${endpoint}`);
      
      // Use the more reliable direct SQL update endpoint
      const directResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userIdNum,
          pushToken: pushToken
        })
      });
      
      // Log response status for debugging
      addLog(`Response status: ${directResponse.status}`);
      
      // Safely check content type
      const contentType = directResponse.headers.get('content-type') || '';
      addLog(`Response content type: ${contentType}`);
      
      // Get the response text
      const responseText = await directResponse.text();
      
      // Truncate if response is too long
      const truncatedResponse = responseText.length > 200 
        ? responseText.substring(0, 200) + '...[truncated]' 
        : responseText;
      addLog(`Raw response: ${truncatedResponse}`);
      
      // Try to parse as JSON only if it's a JSON response
      if (contentType.includes('application/json')) {
        try {
          const result = JSON.parse(responseText);
          setResponse(result);
          
          if (result.success) {
            addLog('✅ Direct token registration SUCCESS');
            setStatus('Direct registration successful');
          } else {
            addLog(`❌ Direct registration FAILED: ${result.message || 'Unknown error'}`);
            setStatus('Direct registration failed');
          }
        } catch (e) {
          addLog(`⚠️ Error parsing JSON response: ${e.message}`);
          setStatus('Error parsing JSON response');
        }
      } else {
        // Handle non-JSON response
        if (directResponse.ok) {
          addLog('✅ Registration appears successful (non-JSON response)');
          setStatus('Registration successful');
        } else {
          addLog(`❌ Registration failed with status ${directResponse.status}`);
          if (responseText.includes('<html')) {
            addLog('Received HTML response instead of JSON');
          }
          setStatus('Registration failed');
        }
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
      setStatus('Error with direct registration');
    } finally {
      setLoading(false);
    }
  };
  
  const testAvailabilityNotification = async () => {
    if (!userId || !friendId) {
      addLog('Both user ID and friend ID are required.');
      return;
    }

    try {
      setLoading(true);
      addLog(`Testing availability notification from user ${userId} to friend ${friendId}...`);

      // Make the user available and notify the specific friend
      const response = await fetch(`${SERVER_URL}/api/users/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isAvailable: true,
          userId: parseInt(userId, 10), 
          notifyFriends: [parseInt(friendId, 10)] 
        }),
        credentials: 'include',
      });
      
      const result = await response.json();
      setResponse(result);
      
      if (response.ok) {
        addLog('Availability updated and notification sent!');
      } else {
        addLog('Failed to update availability: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      addLog('Error testing availability notification: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };
  
  // Handle a full refresh of the debug screen
  const handleRefresh = () => {
    setLoading(true);
    addLog('🔄 Refreshing debug screen...');
    
    // Clear logs and reset state for clean testing
    setLogs(['🔄 Screen refreshed at ' + new Date().toLocaleTimeString()]);
    setResponse(null);
    
    // Add version info
    addLog(`🧪 Debug build: ${new Date().toISOString()}`);
    addLog(`🌐 API endpoint: ${SERVER_URL}`);
    addLog(`📱 Device: ${Platform.OS}`);
    
    // Re-fetch token and info
    loadInitialData()
      .then(() => {
        addLog('✅ Refresh complete');
      })
      .catch(err => {
        addLog(`❌ Refresh error: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>Push Notification Debug</Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={handleRefresh}
                  disabled={loading}
                >
                  <Text style={styles.refreshText}>🔄 Refresh</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>User ID:</Text>
                <TextInput
                  style={styles.input}
                  value={userId}
                  onChangeText={setUserId}
                  placeholder="Enter user ID"
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={styles.tokenContainer}>
                <Text style={styles.label}>Push Token:</Text>
                <Text style={styles.tokenText} numberOfLines={1} ellipsizeMode="middle">
                  {pushToken || 'No token'}
                </Text>
              </View>
              
              <Text style={styles.status}>{status}</Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={registerToken}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Get Token</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.button}
                  onPress={registerWithServer}
                  disabled={loading || !pushToken}
                >
                  <Text style={styles.buttonText}>Register with Server</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.button}
                  onPress={sendTestNotification}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Send Test</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.directButton]}
                  onPress={testDirectRegistration}
                  disabled={loading || !pushToken || !userId}
                >
                  <Text style={styles.buttonText}>Test Direct Registration</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.emergencyButton]}
                  onPress={registerUserDirectly}
                  disabled={loading || !userId}
                >
                  <Text style={styles.buttonText}>Register Token for User</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.friendSection}>
                <Text style={styles.subTitle}>Test Friend Notification</Text>
                <Text style={styles.helpText}>
                  Enter your User ID and a Friend ID to simulate becoming available and sending a notification.
                </Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Friend ID:</Text>
                  <TextInput
                    style={styles.input}
                    value={friendId}
                    onChangeText={setFriendId}
                    placeholder="Enter friend ID"
                    keyboardType="number-pad"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.testButton, styles.bigButton]}
                  onPress={testAvailabilityNotification}
                  disabled={loading || !userId || !friendId}
                >
                  <Text style={styles.buttonText}>Test Availability Notification</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.logsContainer}>
                <View style={styles.logsHeader}>
                  <Text style={styles.subTitle}>Logs</Text>
                  <TouchableOpacity onPress={clearLogs}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView 
                  style={styles.logsScrollView}
                  ref={scrollViewRef}
                  showsVerticalScrollIndicator={true}
                  persistentScrollbar={true}
                  onContentSizeChange={() => {
                    if (logs.length > 0 && scrollViewRef.current) {
                      scrollViewRef.current.scrollToEnd({ animated: false });
                    }
                  }}
                >
                  {logs.map((log, index) => (
                    <Text key={index} style={styles.logText} selectable={true}>{log}</Text>
                  ))}
                  {/* Add padding at bottom to ensure content is visible */}
                  <View style={{ height: 50 }} />
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: normalize(12),
    backgroundColor: '#F5F5F5',
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: normalize(30),
  },
  helpText: {
    fontSize: normalize(13),
    color: '#555',
    marginBottom: normalize(10),
    lineHeight: normalize(16),
  },
  testButton: {
    backgroundColor: '#2E7D32', // Darker green for distinction
    marginTop: normalize(8), 
  },
  bigButton: {
    paddingVertical: normalize(12),
    marginHorizontal: 0, 
    marginBottom: normalize(8),
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  title: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(6),
    borderRadius: 4,
  },
  refreshText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: normalize(13),
  },
  subTitle: {
    fontSize: normalize(16),
    fontWeight: 'bold',
    marginBottom: normalize(6),
    color: '#333',
  },
  status: {
    fontSize: normalize(13),
    color: '#666',
    marginBottom: normalize(12),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(10),
    flexWrap: 'wrap', // Allow wrapping on small screens or large font sizes
  },
  label: {
    fontSize: normalize(14),
    marginRight: normalize(8),
    width: normalize(60),
    flexShrink: 0, // Prevent the label from shrinking
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(6),
    backgroundColor: '#FFF',
    fontSize: normalize(14), // Set explicit font size for input
    minWidth: 120, // Ensure input has minimum width
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(10),
    flexWrap: 'wrap', // Allow wrapping
  },
  tokenText: {
    flex: 1,
    fontSize: normalize(11),
    color: '#666',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: normalize(6),
    backgroundColor: '#FFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(12),
    flexWrap: 'wrap', // Allow buttons to wrap on small screens
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: normalize(10),
    borderRadius: 4,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: normalize(4),
    marginVertical: normalize(4), // Add vertical margin for when buttons wrap
    minWidth: 120, // Ensure buttons have minimum width
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: normalize(12),
    textAlign: 'center',
  },
  logsContainer: {
    flex: 1,
    marginTop: normalize(12),
    minHeight: 150,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(6),
  },
  clearText: {
    color: '#4CAF50',
    fontSize: normalize(13),
  },
  logsScrollView: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: normalize(6),
    minHeight: 180,
    height: 250, // Fixed height to ensure visibility on small screens
  },
  logText: {
    fontSize: normalize(11), // Smaller font for logs
    color: '#333',
    marginBottom: normalize(6),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flexWrap: 'wrap',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendSection: {
    marginTop: normalize(12),
    padding: normalize(10),
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginBottom: normalize(12),
  },
  directButton: {
    backgroundColor: '#9C27B0', // Purple for distinction
  },
  emergencyButton: {
    backgroundColor: '#FF9800', // Orange for direct registration
  }
});