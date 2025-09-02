#!/usr/bin/env node

/**
 * OTA Update Script for "I'm Free" App
 * 
 * This script pushes JavaScript changes as an over-the-air update to existing app installations
 * without requiring a new build or App Store review process.
 * 
 * Changes in this update:
 * 1. Improved SMS invitation dialog with clearer text and instructions
 * 2. Updated button labels to "Cancel" and "Send"
 * 3. Enhanced iOS iMessage integration
 * 
 * Usage:
 *   node update-sms-invite.js [--message "Your update message here"]
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs');

// Parse command-line arguments
const args = process.argv.slice(2);
let updateMessage = 'SMS invitation dialog improvements';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--message' && args[i + 1]) {
    updateMessage = args[i + 1];
    i++; // Skip the next argument since we've used it
  }
}

// Configuration
const CONFIG = {
  channel: 'release-candidate',
  message: updateMessage,
  // Verify we're in the correct directory
  easJsonPath: path.join(__dirname, 'eas.json')
};

// Validation
function validateEnvironment() {
  try {
    if (!fs.existsSync(CONFIG.easJsonPath)) {
      throw new Error(`Could not find eas.json at ${CONFIG.easJsonPath}`);
    }
    
    const easJson = JSON.parse(fs.readFileSync(CONFIG.easJsonPath, 'utf8'));
    
    // Check that the channel exists in the configuration
    const channelExists = Object.values(easJson.build || {}).some(
      profile => profile.channel === CONFIG.channel
    );
    
    if (!channelExists) {
      console.warn(
        `\n⚠️ Warning: Channel '${CONFIG.channel}' not found in eas.json.\n` +
        `This might mean you're pushing to a channel that no build is configured for.`
      );
    }
    
    return true;
  } catch (error) {
    console.error(`\n❌ Validation error: ${error.message}`);
    return false;
  }
}

// Push the update
async function pushUpdate() {
  try {
    console.log('\n🔍 Validating environment...');
    
    if (!validateEnvironment()) {
      console.error('\n❌ Environment validation failed. Aborting update.');
      return;
    }
    
    console.log('\n🚀 Pushing OTA update to existing app installations...');
    console.log(`📋 Update message: "${CONFIG.message}"`)
    console.log(`🔄 Target channel: ${CONFIG.channel}`);
    
    // Execute the update command with a message
    const updateCommand = `eas update --branch ${CONFIG.channel} --message "${CONFIG.message}"`;
    console.log(`\n📝 Running: ${updateCommand}`);
    
    const result = await execAsync(updateCommand);
    
    console.log('\n✅ Update pushed successfully!');
    console.log(result.stdout);
    console.log('\n📱 Changes will now be available to all users running the current TestFlight build');
    console.log('👉 Users will get the update the next time they open the app');
  } catch (error) {
    console.error('\n❌ Error pushing update:');
    
    if (error.stderr) {
      console.error(error.stderr);
    } else {
      console.error(error);
    }
    
    // Provide helpful troubleshooting guidance
    if (error.stderr && error.stderr.includes('authentication')) {
      console.log('\n⚠️ Authentication error. Please make sure you\'re logged in to Expo:');
      console.log('  Run: npx expo login');
    } else if (error.stderr && error.stderr.includes('git')) {
      console.log('\n⚠️ Git repository issue. Make sure your changes are committed:');
      console.log('  1. git add .');
      console.log(`  2. git commit -m "${CONFIG.message}"`);
    } else if (error.stderr && error.stderr.includes('manifest')) {
      console.log('\n⚠️ App manifest issue. Check that your app.json/app.config.js is valid:');
      console.log('  Ensure your app ID and bundle identifier are consistent');
    } else {
      console.log('\n🔍 Check the error above and try again.');
    }
  }
}

// Run the update process
pushUpdate();
