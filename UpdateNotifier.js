import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import * as Updates from 'expo-updates';
import { Ionicons } from '@expo/vector-icons';

/**
 * UpdateNotifier component - Shows a notification banner when an OTA update has been downloaded
 * and is waiting for app restart to apply.
 */
export default function UpdateNotifier({ versionInfo }) {
  const applyUpdate = async () => {
    try {
      console.log('Applying update via banner click');
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Failed to reload app:', error);
      // No popup on failure - just log the error
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.notificationBar}
        onPress={applyUpdate} // Make the entire banner clickable to restart
      >
        <View style={styles.iconContainer}>
          <Ionicons name="arrow-down-circle" size={24} color="#ffffff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Update Ready!</Text>
          <Text style={styles.message}>
            A new version is ready. Tap here to restart and apply the update.
          </Text>
          {versionInfo && (
            <Text style={styles.versionInfo}>
              v{versionInfo.currentVersion}{versionInfo.otaVersion ? ` → OTA ${versionInfo.otaVersion}` : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering the parent's onPress
            // Do nothing when close is clicked - this is intentional
          }}
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
  },
  notificationBar: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    // Add shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Add elevation for Android
    elevation: 5,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  message: {
    color: '#ffffff',
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  versionInfo: {
    color: '#e0e0e0',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});