import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * ManualUpdateButton - A floating button that allows users to manually check for updates
 * This is useful for users who know an update is available but don't want to restart the app
 */
export default function ManualUpdateButton() {
  const [isChecking, setIsChecking] = useState(false);
  
  async function handleCheckForUpdates() {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      console.log('Manually checking for updates...');
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('Update available, downloading...');
        await Updates.fetchUpdateAsync();
        
        // No Alert dialogs - just silently reload the app
        try {
          console.log('Applying update automatically');
          await Updates.reloadAsync();
        } catch (error) {
          console.error('Error applying update:', error);
          // No Alert dialog on failure either
        }
      } else {
        console.log('App is already up to date');
        // No Alert dialogs for up-to-date status
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      // No Alert dialogs for errors
    } finally {
      setIsChecking(false);
    }
  }
  
  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={handleCheckForUpdates}
      disabled={isChecking}
    >
      {isChecking ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <Text style={styles.buttonText}>Check for Updates</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
