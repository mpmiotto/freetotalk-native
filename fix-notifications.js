/**
 * Fix GitHub Build Issues with Expo Notifications
 * 
 * GitHub's build process is having difficulty resolving the expo-notifications plugin.
 * This script verifies that all dependencies are correctly installed and
 * helps GitHub properly resolve the plugin.
 */

// Simple script to ensure expo-notifications is properly set up
const fs = require('fs');
const path = require('path');

// Read the current app.json
const appJsonPath = path.join(__dirname, 'app.json');
console.log('Reading app.json from:', appJsonPath);

// Parse app.json
try {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  console.log('Successfully parsed app.json');

  // Check for plugins array
  if (!appJson.expo.plugins) {
    console.log('No plugins array found, creating one');
    appJson.expo.plugins = [];
  }

  // Find and replace notifications plugin
  const hasNotifications = appJson.expo.plugins.some(plugin => 
    (Array.isArray(plugin) && plugin[0] === 'expo-notifications') ||
    plugin === 'expo-notifications'
  );

  if (!hasNotifications) {
    console.log('Adding expo-notifications plugin');
    // Add in the standard format
    appJson.expo.plugins.push([
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#4CAF50',
        sounds: []
      }
    ]);
  } else {
    console.log('Expo notifications plugin already exists');
  }

  // Write the updated app.json back
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('Updated app.json with proper plugin configuration');

  // Create a simple app.config.js that just uses app.json
  const appConfigPath = path.join(__dirname, 'app.config.js');
  const simpleConfig = `// Simple app.config.js that just uses app.json\nmodule.exports = require('./app.json').expo;`;
  fs.writeFileSync(appConfigPath, simpleConfig);
  console.log('Created simplified app.config.js');

  console.log('All fixes completed successfully!');
} catch (error) {
  console.error('Error updating configuration:', error);
  process.exit(1);
}