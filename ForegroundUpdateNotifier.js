import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import * as Updates from 'expo-updates';
import { Ionicons } from '@expo/vector-icons';

/**
 * ForegroundUpdateNotifier component - Shows a popup modal when the app comes to the foreground
 * and an update is available
 */
export default function ForegroundUpdateNotifier({ onClose, versionInfo }) {
  const [isVisible, setIsVisible] = useState(true);

  const applyUpdate = async () => {
    try {
      console.log('Applying update via foreground popup');
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Failed to reload app:', error);
      closeModal();
    }
  };

  const closeModal = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={closeModal}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Ionicons name="arrow-down-circle" size={28} color="#007AFF" />
            <Text style={styles.title}>Update Available</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.message}>
            A new version of I'm Free is available and ready to install. 
            Update now to get the latest features and improvements.
          </Text>
          
          {versionInfo && (
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>
                Current: {versionInfo.currentVersion}
                {versionInfo.currentBuildNumber ? ` (Build ${versionInfo.currentBuildNumber})` : ''}
              </Text>
              {versionInfo.otaVersion && (
                <Text style={styles.versionText}>
                  OTA Update: {versionInfo.otaVersion}
                </Text>
              )}
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.laterButton]} 
              onPress={closeModal}
            >
              <Text style={styles.laterButtonText}>Later</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.updateButton]} 
              onPress={applyUpdate}
            >
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    // Add shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Add elevation for Android
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 10,
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    marginLeft: 10,
  },
  laterButton: {
    backgroundColor: '#f0f0f0',
  },
  laterButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#007AFF',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  versionContainer: {
    backgroundColor: '#f7f7f7',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  versionText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});