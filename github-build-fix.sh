#!/bin/bash
# GitHub build setup script to fix expo-notifications issues

echo "Running GitHub build fix script..."

# Make sure the plugins directory exists
mkdir -p plugins 

# Create a simplified app.config.js
cat > app.config.js << 'EOF'
// Direct export of app.json config - no plugin dependencies
module.exports = require('./app.json').expo;
EOF

# Update app.json directly for GitHub builds
node -e "
const fs = require('fs');
const path = require('path');

// Read current app.json
const appJsonPath = path.resolve('./app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Ensure notifications plugin is properly configured
if (appJson.expo.plugins) {
  // Find and replace any notifications plugin
  const index = appJson.expo.plugins.findIndex(p => 
    (Array.isArray(p) && p[0] === 'expo-notifications') || 
    p === 'expo-notifications' ||
    (typeof p === 'string' && p.includes('withNotifications'))
  );
  
  // Remove if found
  if (index !== -1) {
    appJson.expo.plugins.splice(index, 1);
  }
  
  // Add standard format
  appJson.expo.plugins.push([
    'expo-notifications',
    {
      'icon': './assets/icon.png',
      'color': '#4CAF50',
      'sounds': []
    }
  ]);
} else {
  // Create plugins array if needed
  appJson.expo.plugins = [
    [
      'expo-notifications',
      {
        'icon': './assets/icon.png',
        'color': '#4CAF50',
        'sounds': []
      }
    ]
  ];
}

// Write updated config back
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log('Successfully updated app.json for GitHub builds');
"

echo "GitHub build fix completed!"