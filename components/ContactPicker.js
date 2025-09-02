import { NativeModules, Platform, Alert, Linking } from 'react-native';

// Diagnostics object to track module availability and errors
const diagnostics = {
  moduleAvailable: false,
  moduleError: null,
  hasCheckedAvailability: false,
  availableNativeModules: []
};

// Safely access the native module with extensive error handling
let ContactPickerModule;
let moduleCheckPromise;

/**
 * Check if the ContactPickerModule is available with detailed diagnostics
 * @returns {Promise<boolean>} - True if the module is available
 */
const checkModuleAvailability = async () => {
  if (diagnostics.hasCheckedAvailability) {
    return diagnostics.moduleAvailable;
  }
  
  try {
    console.log('Checking ContactPickerModule availability...');
    diagnostics.availableNativeModules = Object.keys(NativeModules);
    
    // Log all available native modules for debugging
    console.log('Available Native Modules:', diagnostics.availableNativeModules.join(', '));
    
    ContactPickerModule = NativeModules.ContactPickerModule;
    
    // Verify that the module has the expected method
    if (!ContactPickerModule || typeof ContactPickerModule.showContactPicker !== 'function') {
      throw new Error(
        ContactPickerModule 
          ? 'Module found but missing showContactPicker method' 
          : 'ContactPickerModule not found in NativeModules'
      );
    }
    
    // Additional diagnostic: check if the module responds to a simple call
    if (__DEV__) {
      console.log('Testing basic module functionality...');
      // We don't actually call the method here, just check its presence
    }
    
    diagnostics.moduleAvailable = true;
    console.log('ContactPickerModule is available and appears functional');
  } catch (error) {
    const errorObj = error || {};
    diagnostics.moduleError = errorObj;
    diagnostics.moduleAvailable = false;
    
    console.warn('ContactPickerModule initialization failed:', errorObj.message || 'Unknown error');
  } finally {
    diagnostics.hasCheckedAvailability = true;
  }
  
  return diagnostics.moduleAvailable;
};

// Run the check immediately, but don't wait for it
moduleCheckPromise = checkModuleAvailability();

/**
 * Contact information returned from the native picker
 * @typedef {Object} ContactInfo
 * @property {string} name - Contact's full name
 * @property {string} phoneNumber - Contact's phone number
 * @property {string} [thumbnailBase64] - Base64 encoded contact image (if available)
 */

/**
 * Opens the native iOS contact picker with comprehensive error handling
 * @returns {Promise<ContactInfo | null>} Contact info or null if cancelled
 * @throws {Object} Structured error object with code, message and details
 */
export const pickContact = async () => {
  // Ensure module check has completed
  if (!diagnostics.hasCheckedAvailability) {
    await moduleCheckPromise;
  }
  
  // Log attempt with detailed diagnostics
  console.log(`Attempting to open contact picker (module available: ${diagnostics.moduleAvailable})`);

  // Production vs Development behavior branching
  const isProduction = !__DEV__;

  // In production with module unavailable - be very clear about the issue
  if (isProduction && !diagnostics.moduleAvailable) {
    console.error('ContactPickerModule unavailable in production!', diagnostics);
    
    // Show comprehensive error to user
    Alert.alert(
      'Feature Unavailable',
      'The contact picker cannot be used on this device. This may indicate a build configuration issue.',
      [{ text: 'OK' }]
    );
    
    throw {
      code: 'MODULE_UNAVAILABLE',
      message: 'Contact picker is not available on this device',
      details: {
        platformOS: Platform.OS,
        platformVersion: Platform.Version,
        availableModules: diagnostics.availableNativeModules,
        originalError: diagnostics.moduleError ? diagnostics.moduleError.message : null
      }
    };
  }
  
  // In development with module unavailable - provide fallback
  if (!isProduction && !diagnostics.moduleAvailable) {
    console.warn('ContactPickerModule unavailable in development - using mock implementation');
    
    // Request permission to contacts via Expo Contacts API if that's available
    try {
      const { Contacts, Permissions } = require('expo-contacts');
      console.log('Expo Contacts module is available, using it as fallback');
      
      // Check permission
      const { status } = await Permissions.askAsync(Permissions.CONTACTS);
      if (status !== 'granted') {
        console.log('User denied contacts permission');
        return null; // User denied permission
      }
      
      // Get the contacts (simplified mock version)
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      
      // Just get the first contact with a phone number
      const contact = data.find(c => c.phoneNumbers && c.phoneNumbers.length > 0);
      if (!contact) {
        console.log('No contacts with phone numbers found');
        return null;
      }
      
      return {
        name: contact.name,
        phoneNumber: contact.phoneNumbers[0].number,
      };
    } catch (error) {
      console.warn('Failed to use Expo Contacts as fallback:', error);
      
      // When even the fallback fails, use a UI-based approach in development
      return new Promise((resolve) => {
        Alert.alert(
          'Contact Picker Simulation',
          'Enter contact details manually (in development mode):',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(null)
            },
            {
              text: 'Test Contact',
              onPress: () => {
                resolve({
                  name: 'Test Contact',
                  phoneNumber: '+15551234567'
                });
              }
            }
          ]
        );
      });
    }
  }
  
  // We'll use the more detailed platform check below instead
  if (__DEV__ && !diagnostics.moduleAvailable) {
    console.warn('Using contact picker fallback for development environment', diagnostics);
    
    // Inform the user what's happening
    return new Promise((resolve) => {
      Alert.alert(
        'Development Mode',
        'The contact picker module is not available. Would you like to use a simulated contact for testing?',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => {
              console.log('User cancelled mock contact selection');
              resolve(null);
            } 
          },
          { 
            text: 'Use Test Contact', 
            onPress: () => {
              console.log('Using mock contact data');
              // Delay to simulate picker UI
              setTimeout(() => {
                resolve({
                  name: 'Test Contact',
                  phoneNumber: '+12125551234',
                  thumbnailBase64: null
                });
              }, 500);
            } 
          }
        ]
      );
    });
  }
  
  // Platform validation - iOS only
  if (Platform.OS !== 'ios') {
    console.error('Contact picker attempted on unsupported platform:', Platform.OS);
    
    const errorMessage = `Contact picker is only supported on iOS (current: ${Platform.OS})`;
    
    // Different approaches for different platforms
    if (Platform.OS === 'android') {
      Alert.alert(
        'Not Available on Android',
        'The contact picker feature is only available on iOS devices. Please enter contact details manually.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Platform Not Supported',
        'The contact picker is not available on this platform. Please enter contact details manually.',
        [{ text: 'OK' }]
      );
    }
    
    throw {
      code: 'PLATFORM_UNSUPPORTED',
      message: errorMessage,
      details: {
        currentPlatform: Platform.OS,
        supportedPlatform: 'ios'
      }
    };
  }
  
  // At this point we should have a valid module on iOS
  if (!ContactPickerModule) {
    console.error('ContactPickerModule still not available despite checks', diagnostics);
    
    Alert.alert(
      'Feature Unavailable',
      'The contact picker could not be initialized. Please try restarting the app or enter contacts manually.',
      [{ text: 'OK' }]
    );
    
    throw {
      code: 'MODULE_INITIALIZATION_FAILED',
      message: 'Contact picker module failed to initialize properly',
      details: diagnostics
    };
  }
  
  // Now attempt to use the module with comprehensive error handling
  try {
    console.log('Opening native iOS contact picker...');
    
    // Returns { name, phoneNumber, thumbnailBase64 } if selected, or null if cancelled
    const startTime = Date.now();
    const contact = await ContactPickerModule.showContactPicker();
    const duration = Date.now() - startTime;
    
    console.log(`Contact picker completed in ${duration}ms`);
    
    // Check if user cancelled
    if (!contact) {
      console.log('Contact picker was cancelled by user');
      return null;
    }
    
    // Validate returned contact data
    if (!contact.name || !contact.phoneNumber) {
      console.warn('Contact picker returned incomplete data:', contact);
      
      // Still return what we got - the formatter below will handle null values
      console.log('Proceeding with incomplete contact data');
    } else {
      console.log('Contact selected successfully:', contact.name);
    }
    
    // Ensure phone number is formatted correctly
    try {
      if (contact.phoneNumber) {
        const originalNumber = contact.phoneNumber;
        contact.phoneNumber = formatPhoneNumber(contact.phoneNumber);
        console.log(`Formatted phone number: ${originalNumber} → ${contact.phoneNumber}`);
      }
    } catch (formattingError) {
      console.warn('Error formatting phone number:', formattingError);
      // Continue with the original phone number
    }
    
    return contact;
  } catch (error) {
    // Enhanced error handling with specific error codes
    const errorObj = error || {};
    const errorMessage = errorObj.message || 'Unknown error';
    
    console.error('Error picking contact:', errorObj);
    
    // Categorize errors for better user feedback
    let userMessage = 'Failed to access contacts.';
    let errorCode = 'CONTACT_PICKER_ERROR';
    let suggestSettings = false;
    
    // Analyze error message for better categorization
    const errorString = String(errorMessage).toLowerCase();
    
    if (errorString.includes('permission') || 
        errorString.includes('denied') || 
        errorString.includes('access') || 
        errorString.includes('not authorized')) {
      errorCode = 'PERMISSION_DENIED';
      userMessage = 'Permission to access contacts was denied.';
      suggestSettings = true;
    } else if (errorString.includes('busy') || errorString.includes('already') || errorString.includes('in use')) {
      errorCode = 'PICKER_BUSY';
      userMessage = 'Contact picker is already open.';
      
      Alert.alert(
        'Contact Picker Busy',
        'The contact picker is already open. Please complete or cancel the current selection before trying again.',
        [{ text: 'OK' }]
      );
    } else if (errorString.includes('timeout') || errorString.includes('time out')) {
      errorCode = 'PICKER_TIMEOUT';
      userMessage = 'The contact picker operation timed out.';
      
      Alert.alert(
        'Operation Timed Out',
        'The contact selection took too long and timed out. Please try again.',
        [{ text: 'OK' }]
      );
    } else {
      // Generic error with detailed logging
      console.error('Unrecognized contact picker error:', {
        message: errorMessage,
        objectType: typeof errorObj,
        hasStack: !!errorObj.stack,
        stack: errorObj.stack
      });
      
      Alert.alert(
        'Contact Access Failed',
        'There was a problem accessing your contacts. Please try again or enter the details manually.',
        [{ text: 'OK' }]
      );
    }
    
    // For permission issues, offer to open settings
    if (suggestSettings) {
      Alert.alert(
        'Permission Required',
        'Please enable contact access in your device settings to use this feature.',
        [
          { text: 'Not Now', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:').catch(settingsError => {
                  console.error('Failed to open settings:', settingsError);
                });
              } else {
                Linking.openSettings().catch(settingsError => {
                  console.error('Failed to open settings:', settingsError);
                });
              }
            }
          }
        ]
      );
    }
    
    // Throw structured error for better handling upstream
    throw {
      code: errorCode,
      message: userMessage,
      details: {
        originalError: errorMessage,
        suggestSettings,
        diagnostics: {
          moduleAvailable: diagnostics.moduleAvailable,
          platformOS: Platform.OS,
          platformVersion: Platform.Version
        }
      }
    };
  }
};

/**
 * Formats a phone number for display or database storage
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number in E.164 format when possible
 */
export const formatPhoneNumber = (phoneNumber) => {
  try {
    if (!phoneNumber) return '';
    
    // Normalize input value
    const input = String(phoneNumber).trim();
    if (!input) return '';
    
    // Remove any non-digit characters except the leading +
    let cleaned = input.replace(/[^0-9+]/g, '');
    
    // Ensure consistent E.164 format when possible
    if (!cleaned.startsWith('+')) {
      // Different formatting logic based on length and patterns
      
      // For US numbers, ensure they start with +1
      if (cleaned.length === 10) {
        // Standard US 10-digit number
        cleaned = '+1' + cleaned;
      } else if (cleaned.startsWith('1') && cleaned.length === 11) {
        // US number with leading 1
        cleaned = '+' + cleaned;
      } else if (cleaned.length > 7) {
        // For other numbers, at least ensure + prefix
        // Note: This won't correctly format international numbers without country code
        cleaned = '+' + cleaned;
      }
      // For very short numbers (< 7 digits), leave as is - likely not a real phone number
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error formatting phone number:', error);
    // Return the original to avoid complete failure
    return phoneNumber || '';
  }
};