import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Comprehensive permission diagnostic tool
export const debugNotificationPermissions = async () => {
  console.log('\n=== 🔔 NOTIFICATION PERMISSION DIAGNOSTIC ===');
  
  try {
    // 1. Platform info
    console.log('\n📱 DEVICE INFO:');
    console.log(`Platform: ${Platform.OS}`);
    console.log(`OS Version: ${Device.osVersion}`);
    console.log(`API Level: ${Device.platformApiLevel}`);
    console.log(`Model: ${Device.modelName}`);
    console.log(`Is Device: ${Device.isDevice}`);
    
    // 2. Current permission status
    console.log('\n🔐 CURRENT PERMISSIONS:');
    const { status, permissions } = await Notifications.getPermissionsAsync();
    console.log(`Main Status: ${status}`);
    console.log(`Full Permissions Object:`, JSON.stringify(permissions, null, 2));
    
    // 3. Check if POST_NOTIFICATIONS is specifically granted (Android 13+)
    if (Platform.OS === 'android' && Device.platformApiLevel >= 33) {
      console.log('\n📋 ANDROID 13+ CHECK:');
      console.log(`Requires POST_NOTIFICATIONS: YES (API ${Device.platformApiLevel})`);
      console.log(`Permission Status: ${status}`);
      console.log(`Should show permission dialog: ${status !== 'granted' ? 'YES' : 'NO'}`);
    }
    
    // 4. Check AsyncStorage for tokens
    console.log('\n💾 STORAGE CHECK:');
    const pushToken = await AsyncStorage.getItem('pushToken');
    const userId = await AsyncStorage.getItem('push_user_id');
    const registrationStatus = await AsyncStorage.getItem('tokenRegistrationStatus');
    
    console.log(`Push Token: ${pushToken ? pushToken.substring(0, 20) + '...' : 'NONE'}`);
    console.log(`User ID: ${userId || 'NONE'}`);
    console.log(`Registration Status: ${registrationStatus || 'NONE'}`);
    
    // 5. Test permission request (if not granted)
    if (status !== 'granted') {
      console.log('\n🚨 PERMISSION NOT GRANTED - WOULD REQUEST NOW');
      console.log('Call requestPermissionsAsync() to trigger dialog');
    } else {
      console.log('\n✅ PERMISSIONS ALREADY GRANTED');
    }
    
    console.log('\n=== END DIAGNOSTIC ===\n');
    
    return {
      platform: Platform.OS,
      osVersion: Device.osVersion,
      apiLevel: Device.platformApiLevel,
      permissionStatus: status,
      requiresDialog: status !== 'granted',
      hasToken: !!pushToken,
      hasUserId: !!userId
    };
    
  } catch (error) {
    console.error('🚨 DIAGNOSTIC ERROR:', error);
    return { error: error.message };
  }
};

// Force permission request for testing
export const forceRequestPermissions = async () => {
  console.log('\n🔔 FORCING PERMISSION REQUEST...');
  
  try {
    const result = await Notifications.requestPermissionsAsync({
      android: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    
    console.log('Permission request result:', result);
    
    // Double-check for Android 13+
    if (Platform.OS === 'android' && Device.platformApiLevel >= 33) {
      const recheck = await Notifications.getPermissionsAsync();
      console.log('Android 13+ recheck:', recheck);
    }
    
    return result;
  } catch (error) {
    console.error('Permission request error:', error);
    return { error: error.message };
  }
};
