#!/usr/bin/env node

/**
 * Fix Hermes Engine Mismatch Script for "I'm Free" App
 * 
 * This script fixes the JavaScript engine mismatch between app.json and iOS native project
 * by updating the iOS Podfile.properties.json to enable Hermes, which is required for OTA updates.
 * 
 * Run this script before running the Expo Update workflow to prevent JS engine mismatch errors.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  appJsonPath: path.join(__dirname, 'app.json'),
  iosPodfilePropertiesPath: path.join(__dirname, 'ios', 'Podfile.properties.json'),
  defaultPodfileProperties: { 'expo.jsEngine': 'hermes' }
};

// Check if Hermes is enabled in app.json
function getAppJsonHermesStatus() {
  try {
    if (!fs.existsSync(CONFIG.appJsonPath)) {
      throw new Error(`Could not find app.json at ${CONFIG.appJsonPath}`);
    }
    
    const appJson = JSON.parse(fs.readFileSync(CONFIG.appJsonPath, 'utf8'));
    const iosJsEngine = appJson.expo?.ios?.jsEngine;
    
    return {
      isHermesEnabled: iosJsEngine === 'hermes',
      jsEngine: iosJsEngine
    };
  } catch (error) {
    console.error(`\n❌ Error reading app.json: ${error.message}`);
    return { isHermesEnabled: false, jsEngine: null };
  }
}

// Fix iOS Podfile.properties.json to match app.json
function fixIosPodfileProperties() {
  try {
    const appJsonStatus = getAppJsonHermesStatus();
    console.log(`\n📱 In app.json: JS engine is set to ${appJsonStatus.jsEngine || 'undefined'}`);
    
    if (!appJsonStatus.isHermesEnabled) {
      console.log('\n⚠️ Hermes is not enabled in app.json. Fix might not be necessary.');
      return false;
    }
    
    let podfileProperties = CONFIG.defaultPodfileProperties;
    
    // If the file exists, read it
    if (fs.existsSync(CONFIG.iosPodfilePropertiesPath)) {
      try {
        podfileProperties = JSON.parse(fs.readFileSync(CONFIG.iosPodfilePropertiesPath, 'utf8'));
        console.log(`\n🔍 Current Podfile.properties.json: ${JSON.stringify(podfileProperties)}`);
      } catch (e) {
        console.warn(`\n⚠️ Could not parse Podfile.properties.json, will create a new one.`);
      }
    } else {
      console.log(`\n🔍 No Podfile.properties.json found, will create a new one.`);
    }
    
    // Update the JS engine setting
    podfileProperties['expo.jsEngine'] = 'hermes';
    
    // Ensure directory exists
    const dir = path.dirname(CONFIG.iosPodfilePropertiesPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the updated properties
    fs.writeFileSync(
      CONFIG.iosPodfilePropertiesPath, 
      JSON.stringify(podfileProperties, null, 2)
    );
    
    console.log(`\n✅ Updated Podfile.properties.json with Hermes engine enabled.`);
    return true;
  } catch (error) {
    console.error(`\n❌ Error fixing Podfile.properties.json: ${error.message}`);
    return false;
  }
}

// Main execution
console.log('\n🛠️  Fixing JavaScript engine mismatch for OTA updates...');

if (fixIosPodfileProperties()) {
  console.log(`\n✅ Successfully aligned JavaScript engine configurations!`);
  console.log(`\n📣 You can now run the EAS Update workflow without engine mismatch errors.`);
  console.log(`\n👉 If you're still having issues, you may need to run a full EAS Build.`);
  process.exit(0);
} else {
  console.error(`\n❌ Failed to fix JavaScript engine mismatch.`);
  process.exit(1);
}
