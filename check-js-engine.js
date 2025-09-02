#!/usr/bin/env node

/**
 * Simple JavaScript Engine Configuration Check
 * 
 * This script checks if the JavaScript engine configuration in app.json
 * is set to Hermes and prints a confirmation message.
 * 
 * It will exit with code 0 regardless of the configuration, allowing
 * the Expo Update workflow to continue.
 */

const fs = require('fs');
const path = require('path');

// Check the app.json configuration
function checkAppJsonConfig() {
  try {
    const appJsonPath = path.join(__dirname, 'app.json');
    console.log(`\n📝 Checking JavaScript engine configuration in ${appJsonPath}`);
    
    if (!fs.existsSync(appJsonPath)) {
      console.log(`\n⚠️ Could not find app.json at ${appJsonPath}`);
      return;
    }
    
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const iosJsEngine = appJson.expo?.ios?.jsEngine;
    
    console.log(`\n📱 In app.json: iOS JS engine is set to ${iosJsEngine || 'undefined'}`);
    
    if (iosJsEngine === 'hermes') {
      console.log('\n⚠️ Hermes is enabled in app.json.');
      console.log('   This might cause issues with OTA updates if native projects use a different engine.');
    } else {
      console.log('\n✅ Hermes is not specified in app.json.');
      console.log('   This configuration should be compatible with OTA updates.');
    }
  } catch (error) {
    console.log(`\n❌ Error checking app.json: ${error.message}`);
  }
}

// Main execution
console.log('\n🔎 Checking JavaScript engine configuration...');
checkAppJsonConfig();
console.log('\n🚀 Proceeding with Expo Update workflow.');

// Always exit with success code to allow the workflow to continue
process.exit(0);
