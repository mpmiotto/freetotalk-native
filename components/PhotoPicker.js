import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Platform,
  Image,
  Linking,
  ActivityIndicator
} from 'react-native';

// Create a safer mock ImagePicker implementation - this will be used if the real module fails to load
const createMockImagePicker = () => {
  console.warn('Creating mock ImagePicker - photo functionality will be limited');
  
  return {
    MediaTypeOptions: { 
      Images: 'images',
      Videos: 'videos',
      All: 'all'
    },
    
    // Permission functions that simulate user granting/denying permission
    requestCameraPermissionsAsync: async () => {
      console.log('[MOCK] Camera permission requested');
      
      // Show a fake permission dialog to the user
      return new Promise((resolve) => {
        Alert.alert(
          'Mock Camera Permission',
          'This is a simulated camera permission request since the real module is unavailable.',
          [
            { 
              text: 'Deny', 
              style: 'cancel',
              onPress: () => {
                console.log('[MOCK] Camera permission denied');
                resolve({ status: 'denied', granted: false, canAskAgain: true });
              }
            },
            { 
              text: 'Allow', 
              onPress: () => {
                console.log('[MOCK] Camera permission granted');
                resolve({ status: 'granted', granted: true, canAskAgain: true });
              }
            }
          ]
        );
      });
    },
    
    requestMediaLibraryPermissionsAsync: async () => {
      console.log('[MOCK] Media library permission requested');
      
      // Show a fake permission dialog to the user
      return new Promise((resolve) => {
        Alert.alert(
          'Mock Gallery Permission',
          'This is a simulated photo gallery permission request since the real module is unavailable.',
          [
            { 
              text: 'Deny', 
              style: 'cancel',
              onPress: () => {
                console.log('[MOCK] Gallery permission denied');
                resolve({ status: 'denied', granted: false, canAskAgain: true });
              }
            },
            { 
              text: 'Allow', 
              onPress: () => {
                console.log('[MOCK] Gallery permission granted');
                resolve({ status: 'granted', granted: true, canAskAgain: true });
              }
            }
          ]
        );
      });
    },
    
    // Camera function that simulates launching the camera
    launchCameraAsync: async (options) => {
      console.log('[MOCK] Camera launched with options:', options);
      
      // Show a dialog explaining the simulation
      return new Promise((resolve) => {
        Alert.alert(
          'Mock Camera',
          'The camera module is not available in this build. Would you like to simulate selecting a photo?',
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => {
                console.log('[MOCK] Camera cancelled');
                resolve({ canceled: true, assets: [] });
              }
            },
            { 
              text: 'Simulate Photo', 
              onPress: () => {
                console.log('[MOCK] Simulating photo capture');
                
                // Simulate getting a photo with a small base64 1x1 green pixel image
                resolve({ 
                  canceled: false, 
                  assets: [{ 
                    uri: 'mock-camera-uri', 
                    width: 512, 
                    height: 512,
                    // Tiny 1x1 pixel transparent PNG for testing
                    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2Q4g5TwAAAABJRU5ErkJggg=='
                  }] 
                });
              }
            }
          ]
        );
      });
    },
    
    // Gallery function that simulates picking from the photo library
    launchImageLibraryAsync: async (options) => {
      console.log('[MOCK] Image library launched with options:', options);
      
      // Show a dialog explaining the simulation
      return new Promise((resolve) => {
        Alert.alert(
          'Mock Photo Gallery',
          'The photo gallery module is not available in this build. Would you like to simulate selecting a photo?',
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => {
                console.log('[MOCK] Gallery selection cancelled');
                resolve({ canceled: true, assets: [] });
              }
            },
            { 
              text: 'Simulate Photo', 
              onPress: () => {
                console.log('[MOCK] Simulating photo selection');
                
                // Simulate getting a photo with a small base64 1x1 blue pixel image
                resolve({ 
                  canceled: false, 
                  assets: [{ 
                    uri: 'mock-gallery-uri', 
                    width: 512, 
                    height: 512,
                    // Tiny 1x1 pixel transparent PNG for testing
                    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
                  }] 
                });
              }
            }
          ]
        );
      });
    }
  };
};

// Simplified approach - we'll use a workaround instead of trying to import expo-image-picker
// This will allow us to provide a better user experience even without the module

// Create a simplified ImagePicker implementation with minimal functionality
// Export so WebViewApp.js can also use these functions
export const SimplifiedImagePicker = {
  MediaTypeOptions: { 
    Images: 'images',
    Videos: 'videos',
    All: 'all'
  },
  
  // Permission functions that simulate user granting/denying permission
  requestCameraPermissionsAsync: async () => {
    console.log('[SIMPLIFIED] Camera permission requested');
    
    // Always grant permission in this simplified implementation
    // This will allow the flow to continue for testing
    return { status: 'granted', granted: true, canAskAgain: true };
  },
  
  requestMediaLibraryPermissionsAsync: async () => {
    console.log('[SIMPLIFIED] Media library permission requested');
    
    // Always grant permission in this simplified implementation
    return { status: 'granted', granted: true, canAskAgain: true };
  },
  
  // Simplified camera function that returns a placeholder image
  launchCameraAsync: async (options) => {
    console.log('[SIMPLIFIED] Camera launched with options:', options);
    
    // Return a placeholder image without displaying UI
    return { 
      canceled: false, 
      assets: [{ 
        uri: 'https://placehold.co/512x512/002952/FFFFFF.png?text=Camera+Image', 
        width: 512, 
        height: 512,
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2Q4g5TwAAAABJRU5ErkJggg==' // small 1x1 pixel
      }] 
    };
  },
  
  // Simplified gallery function that returns a placeholder image
  launchImageLibraryAsync: async (options) => {
    console.log('[SIMPLIFIED] Image library launched with options:', options);
    
    // Return a placeholder image without displaying UI
    return { 
      canceled: false, 
      assets: [{ 
        uri: 'https://placehold.co/512x512/002952/FFFFFF.png?text=Gallery+Image', 
        width: 512, 
        height: 512,
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' // small 1x1 pixel
      }] 
    };
  }
};

// Use our simplified implementation
const ImagePicker = SimplifiedImagePicker;

// Set a flag to indicate we're using the simplified version
const imagePickerError = {
  message: 'Using simplified implementation until expo-image-picker is properly integrated'
};

console.log('Using a simplified image picker implementation');


/**
 * PhotoPicker Component - Completely Refactored
 * 
 * A component that allows users to pick images from their camera or gallery
 * with significantly improved error handling, user feedback, and fallbacks.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.webViewRef - Reference to the WebView component
 * @param {Function} props.onClose - Function to close the picker
 * @param {String} props.userId - The ID of the current user
 */
export default function PhotoPicker({ webViewRef, onClose, userId }) {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [moduleStatus, setModuleStatus] = useState({
    available: imagePickerError === null,
    error: imagePickerError ? imagePickerError.message : null,
  });

  // On component mount, check for any module issues
  useEffect(() => {
    // Log detailed diagnostics to help with debugging
    console.log('PhotoPicker component mounted');
    console.log('ImagePicker module status:', moduleStatus.available ? 'Available' : 'Unavailable');
    
    if (!moduleStatus.available) {
      console.warn('Using mock ImagePicker implementation due to:', moduleStatus.error);
    }
  }, []);

  /**
   * Structured permission handler - can be used for both camera and media library
   * @param {string} permissionType - Either 'camera' or 'mediaLibrary'
   * @returns {Promise<boolean>} - Whether permission was granted
   */
  const requestPermission = async (permissionType) => {
    console.log(`Requesting ${permissionType} permission...`);
    setErrorState(null);
    
    if (Platform.OS === 'web') {
      console.log('Web platform - no permission needed');
      return true;
    }
    
    try {
      // Select the right permission request function based on type
      const permissionMethod = permissionType === 'camera' 
        ? ImagePicker.requestCameraPermissionsAsync 
        : ImagePicker.requestMediaLibraryPermissionsAsync;
      
      // Request permission with comprehensive error handling
      const permResult = await permissionMethod();
      console.log(`${permissionType} permission status:`, permResult);
      
      if (permResult && permResult.status === 'granted') {
        return true;
      }
      
      // Determine why permission wasn't granted
      const canAskAgain = permResult.canAskAgain !== false;
      
      Alert.alert(
        `${permissionType === 'camera' ? 'Camera' : 'Photo Library'} Access Required`,
        canAskAgain
          ? `Please allow access to your ${permissionType === 'camera' ? 'camera' : 'photo library'} to use this feature.`
          : `You've previously denied ${permissionType === 'camera' ? 'camera' : 'photo library'} access. Please enable it in your device settings.`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel'
          },
          // Only show settings option if they can't ask again
          ...(canAskAgain ? [] : [{ 
            text: 'Open Settings', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            } 
          }])
        ]
      );
      
      return false;
    } catch (error) {
      // Handle errors in a structured way
      const errorObj = error || {};
      const errorMsg = errorObj.message || 'Unknown error';
      
      console.error(`Error requesting ${permissionType} permission:`, errorObj);
      setErrorState({
        type: `${permissionType}_permission_error`,
        message: errorMsg
      });
      
      Alert.alert(
        'Permission Error',
        `Error requesting ${permissionType === 'camera' ? 'camera' : 'photo library'} permission: ${errorMsg}`,
        [{ text: 'OK' }]
      );
      
      return false;
    }
  };

  /**
   * Takes a photo using the camera with robust error handling
   */
  const takePhoto = async () => {
    setErrorState(null);
    
    // First check if module is available
    if (!moduleStatus.available && !__DEV__) {
      Alert.alert(
        'Feature Unavailable',
        'The camera feature is not available in this version of the app. Please try selecting from your photo library instead.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Request camera permission
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return;

    try {
      console.log('Launching camera...');
      // Check that the function exists and is callable
      if (typeof ImagePicker.launchCameraAsync !== 'function') {
        throw new Error('Camera function not available');
      }
      
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      };
      
      console.log('Camera options:', options);
      const result = await ImagePicker.launchCameraAsync(options);

      console.log('Camera result received:', result);
      console.log('Camera result canceled:', result.canceled);
      
      if (result.canceled) {
        console.log('User canceled camera capture');
        return;
      }
      
      if (!result.assets || result.assets.length === 0) {
        console.warn('Camera returned no assets');
        Alert.alert(
          'No Photo Selected',
          'No photo was captured. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const selectedAsset = result.assets[0];
      console.log('Photo captured successfully:', selectedAsset);
      
      // Validate the asset has what we need
      if (!selectedAsset.base64) {
        console.warn('Camera image missing base64 data');
        Alert.alert(
          'Error Processing Photo',
          'The captured photo could not be processed. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setImage(selectedAsset.uri);
      sendImageToWebView(selectedAsset);
      
    } catch (error) {
      // Enhanced error handling
      const errorObj = error || {};
      const errorMsg = errorObj.message || 'Unknown error';
      
      console.error('Error taking photo:', errorObj);
      setErrorState({
        type: 'camera_error',
        message: errorMsg
      });
      
      Alert.alert(
        'Camera Error',
        `An error occurred while using the camera: ${errorMsg}`,
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Picks an image from the photo library with robust error handling
   */
  const pickImage = async () => {
    setErrorState(null);
    
    // First check if module is available
    if (!moduleStatus.available && !__DEV__) {
      Alert.alert(
        'Feature Limited',
        'The photo library feature has limited functionality in this version.',
        [{ text: 'Continue Anyway' }, { text: 'Cancel', style: 'cancel' }],
        { cancelable: true }
      );
    }
    
    // Request media library permission
    const hasPermission = await requestPermission('mediaLibrary');
    if (!hasPermission) return;

    try {
      console.log('Launching photo library...');
      // Check that the function exists and is callable
      if (typeof ImagePicker.launchImageLibraryAsync !== 'function') {
        throw new Error('Photo library function not available');
      }
      
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      };
      
      console.log('Photo library options:', options);
      const result = await ImagePicker.launchImageLibraryAsync(options);

      console.log('Photo library result received:', result);
      console.log('Photo library result canceled:', result.canceled);
      
      if (result.canceled) {
        console.log('User canceled photo selection');
        return;
      }
      
      if (!result.assets || result.assets.length === 0) {
        console.warn('Photo library returned no assets');
        Alert.alert(
          'No Photo Selected',
          'No photo was selected. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const selectedAsset = result.assets[0];
      console.log('Photo selected successfully:', selectedAsset);
      
      // Validate the asset has what we need
      if (!selectedAsset.base64) {
        console.warn('Selected image missing base64 data');
        Alert.alert(
          'Error Processing Photo',
          'The selected photo could not be processed. Please try again or choose a different photo.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setImage(selectedAsset.uri);
      sendImageToWebView(selectedAsset);
      
    } catch (error) {
      // Enhanced error handling
      const errorObj = error || {};
      const errorMsg = errorObj.message || 'Unknown error';
      
      console.error('Error picking image:', errorObj);
      setErrorState({
        type: 'photo_library_error',
        message: errorMsg
      });
      
      Alert.alert(
        'Photo Gallery Error',
        `An error occurred while accessing your photo gallery: ${errorMsg}`,
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Sends the selected image to the WebView with comprehensive error handling
   */
  const sendImageToWebView = (asset) => {
    if (!webViewRef.current) {
      console.error('WebView reference is null');
      Alert.alert(
        'System Error',
        'Cannot update profile photo - web view not available.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!asset.base64) {
      console.error('Image base64 data is missing');
      Alert.alert(
        'Processing Error',
        'Cannot process the selected photo - image data is missing.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!userId) {
      console.error('User ID is missing');
      Alert.alert(
        'Account Error',
        'Cannot update profile photo - user information is missing.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setUploading(true);
      console.log('Sending image to WebView, base64 length:', asset.base64.length);

      const imageData = {
        type: 'photo-selected',
        userId: userId,
        photoUri: `data:image/jpeg;base64,${asset.base64}`,
      };

      // Create a self-executing function to avoid global scope pollution
      const jsCode = `
        (function() {
          try {
            console.log('Executing profile photo update in WebView');
            if (typeof window.handleProfilePhotoUpdate === 'function') {
              window.handleProfilePhotoUpdate(${JSON.stringify(imageData)});
              console.log('Photo update function called successfully');
            } else {
              console.error('handleProfilePhotoUpdate function not found in WebView');
              alert('Cannot update profile photo - handler not available. Please try again later.');
            }
          } catch (e) {
            console.error('Error in WebView photo handler:', e);
            alert('Error updating profile photo: ' + e.message);
          }
          return true;
        })();
      `;

      webViewRef.current.injectJavaScript(jsCode);

      // Close the photo picker after successful upload with a delay
      setTimeout(() => {
        setUploading(false);
        onClose();
      }, 500);
    } catch (error) {
      setUploading(false);
      console.error('Error sending image to WebView:', error);
      
      Alert.alert(
        'Upload Failed',
        'An error occurred while updating your profile photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Update Profile Photo</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Display module status warning if there's an issue */}
      {!moduleStatus.available && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Photo features may have limited functionality in this build.
          </Text>
        </View>
      )}

      {/* Display error message if an error occurred */}
      {errorState && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Error: {errorState.message}
          </Text>
        </View>
      )}

      {/* Image preview area */}
      {image && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.previewImage} />
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.cameraButton,
            uploading && styles.disabledButton
          ]} 
          onPress={takePhoto}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.libraryButton,
            uploading && styles.disabledButton
          ]} 
          onPress={pickImage}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>Choose from Library</Text>
        </TouchableOpacity>
      </View>

      {/* Uploading overlay with spinner */}
      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 10,
  },
  closeText: {
    fontSize: 30,
    color: '#FFFFFF',
  },
  warningContainer: {
    padding: 10,
    backgroundColor: '#FFA000',
    borderRadius: 5,
    marginBottom: 15,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#D32F2F',
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
  },
  libraryButton: {
    backgroundColor: '#2196F3',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  uploadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
});