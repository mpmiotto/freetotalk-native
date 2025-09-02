/**
 * JavaScript Engine Fix Script
 * 
 * This script automatically updates the app.json file to use JavaScriptCore
 * instead of Hermes for iOS builds, which fixes TestFlight submission issues.
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

  // Ensure the ios configuration exists
  if (!appJson.expo.ios) {
    appJson.expo.ios = {};
  }

  // Set the JavaScript engine to JSC instead of Hermes
  appJson.expo.ios.jsEngine = "jsc";

  // Write the updated configuration back to app.json
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

  console.log('✅ Successfully set iOS JavaScript engine to JavaScriptCore (JSC)');
  console.log('📱 This will fix TestFlight submission issues');
} catch (error) {
  console.error('❌ Error updating app.json:', error.message);
  process.exit(1);
}
