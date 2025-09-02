// Simple script to fix GitHub build issues with expo-notifications
// This file can be required by GitHub workflows

/**
 * This helper script helps ensure that GitHub CI can correctly resolve
 * the expo-notifications plugin during builds. It provides a simplified
 * approach that doesn't rely on complex module imports.
 * 
 * To use: reference this file in GitHub workflows
 */

const fs = require('fs');
const path = require('path');

// Check if expo-notifications exists in node_modules
function ensureNotificationsPlugin() {
  try {
    // Verify the plugin is installed
    const notificationsPath = path.resolve(__dirname, 'node_modules/expo-notifications');
    if (fs.existsSync(notificationsPath)) {
      console.log('✅ expo-notifications module found');
      return true;
    } else {
      console.log('⚠️ expo-notifications module not found');
      return false;
    }
  } catch (error) {
    console.error('Error checking for expo-notifications:', error);
    return false;
  }
}

// This function can be called during GitHub build process
function fixBuildConfig() {
  // Simply check if the plugin exists
  if (ensureNotificationsPlugin()) {
    console.log('Build configuration is ready for expo-notifications');
  } else {
    console.log('Please install expo-notifications package');
  }
}

// Export helpers
module.exports = {
  ensureNotificationsPlugin,
  fixBuildConfig
};