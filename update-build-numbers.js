/**
 * Build Numbers Update Script
 * 
 * This script automatically updates the iOS and Android build numbers
 * in the app.json file, ensuring each submission has a unique version.
 */

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, 'app.json');

try {
  // Read the app.json file
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  // Ensure the expo configuration exists
  if (!appJson.expo) {
    appJson.expo = {};
  }

  // Ensure ios and android configs exist
  if (!appJson.expo.ios) appJson.expo.ios = {};
  if (!appJson.expo.android) appJson.expo.android = {};
  
  // Get current version strings
  const version = appJson.expo.version || '1.0.0';
  let iosBuildNumber = parseInt(appJson.expo.ios.buildNumber || '1');
  let androidVersionCode = parseInt(appJson.expo.android.versionCode || '1');
  
  // Increment build numbers
  iosBuildNumber += 1;
  androidVersionCode += 1;
  
  // Update the configuration
  appJson.expo.version = version;
  appJson.expo.ios.buildNumber = iosBuildNumber.toString();
  appJson.expo.android.versionCode = androidVersionCode;
  
  // Write the updated configuration back to app.json
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

  console.log(`✅ Successfully updated build numbers`);
  console.log(`📱 iOS build number: ${iosBuildNumber}`);
  console.log(`📱 Android version code: ${androidVersionCode}`);
  console.log(`💡 App version: ${version}`);
} catch (error) {
  console.error('❌ Error updating build numbers:', error.message);
  process.exit(1);
}
