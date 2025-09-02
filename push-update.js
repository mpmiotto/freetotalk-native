/**
 * Simple script to push an update to the release-candidate channel
 * Run with: node push-update.js "Your update message here"
 */

const { execSync } = require('child_process');

// Get the update message from command line arguments
const args = process.argv.slice(2);
const updateMessage = args[0] || 'Bug fixes and improvements';

// Validate that we have an update message
if (!updateMessage) {
  console.error('❌ Please provide an update message');
  console.error('Usage: node push-update.js "Your update message here"');
  process.exit(1);
}

console.log(`🚀 Pushing update to release-candidate channel...\n`);
console.log(`📝 Update message: "${updateMessage}"\n`);

try {
  // Run the EAS Update command
  try {
    // EAS CLI automatically uses EXPO_TOKEN environment variable
    // No explicit login needed when EXPO_TOKEN is set
    if (process.env.EXPO_TOKEN) {
      console.log('🔑 Using EXPO_TOKEN for authentication');
    } else {
      console.log('⚠️ No EXPO_TOKEN found. Using interactive login if needed.');
      console.log('⚠️ Make sure you are already logged in with: eas login');
    }
    
    // Run the EAS Update command
    execSync(`eas update --branch release-candidate --message "${updateMessage}" --non-interactive`, {
      stdio: 'inherit',
    });
  } catch (error) {
    console.error(`\n❌ Error running EAS update: ${error.message}`);
    console.log('\n💡 If you see authentication errors, try running:');
    console.log('   eas login');
    console.log('\n💡 You may also set the EXPO_TOKEN environment variable to automate authentication.');
    process.exit(1);
  }
  
  console.log(`\n✅ Update successfully pushed to release-candidate channel!`);
  console.log(`🔄 Users will receive this update the next time they open the app.`);
  console.log(`⏱️ No App Store review is required for this update.`);
} catch (error) {
  console.error(`\n❌ Error pushing update: ${error.message}`);
  process.exit(1);
}