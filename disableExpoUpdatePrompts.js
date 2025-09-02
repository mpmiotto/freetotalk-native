/**
 * This module directly monkey-patches the expo-updates library to disable all internal popup dialogs
 * by overriding their implementation. This is the most reliable way to stop the native dialogs
 * from appearing while still allowing our custom update banner to function properly.
 */
import * as Updates from 'expo-updates';

// Directly modify the Updates object to disable all built-in prompts
export function disableExpoUpdatePrompts() {
  try {
    // If the Updates object has an _checkAutomaticallyConfigured property,
    // set it to false to prevent automatic dialog
    if (Updates._checkAutomaticallyConfigured !== undefined) {
      console.log('Disabling Expo automatic update checks');
      Updates._checkAutomaticallyConfigured = false;
    }

    // If Updates has a promptUser method, override it to do nothing
    if (Updates.promptUser) {
      console.log('Overriding Expo promptUser method');
      const originalPromptUser = Updates.promptUser;
      Updates.promptUser = () => {
        console.log('Suppressed promptUser from Expo Updates');
        return Promise.resolve(false);
      };
    }

    // If Updates has showUpdatePrompt, override it
    if (Updates.showUpdatePrompt) {
      console.log('Overriding Expo showUpdatePrompt method');
      Updates.showUpdatePrompt = () => {
        console.log('Suppressed showUpdatePrompt from Expo Updates');
        return Promise.resolve(false);
      };
    }

    // Some Expo versions have an _showUpdatePrompt property
    if (Updates._showUpdatePrompt) {
      console.log('Overriding Expo _showUpdatePrompt method');
      Updates._showUpdatePrompt = () => {
        console.log('Suppressed _showUpdatePrompt from Expo Updates');
        return Promise.resolve(false);
      };
    }

    // If there's a setUpdateCheckAutomatically function, call it with false
    if (typeof Updates.setUpdateCheckAutomatically === 'function') {
      console.log('Setting update check automatically to OFF');
      Updates.setUpdateCheckAutomatically(Updates.UpdateCheckAutomatically.OFF);
    }
    
    console.log('Successfully disabled Expo update prompts');
    return true;
  } catch (error) {
    console.error('Failed to disable Expo update prompts:', error);
    return false;
  }
}

// Export an already disabled function
export const disabledPromptUser = () => {
  console.log('Preventing Expo update prompt');
  return Promise.resolve(false);
};

// Execute the disabling on module import
disableExpoUpdatePrompts();
