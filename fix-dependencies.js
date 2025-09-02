#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing React Native dependencies...');

// Remove corrupted node_modules and lock files
console.log('1. Cleaning up corrupted dependencies...');
try {
  if (fs.existsSync('node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }
  if (fs.existsSync('package-lock.json')) {
    execSync('rm -f package-lock.json', { stdio: 'inherit' });
  }
  if (fs.existsSync('yarn.lock')) {
    execSync('rm -f yarn.lock', { stdio: 'inherit' });
  }
  console.log('✅ Cleanup complete');
} catch (error) {
  console.error('❌ Cleanup failed:', error.message);
}

// Install dependencies with correct flags
console.log('2. Reinstalling dependencies...');
try {
  execSync('npm install --legacy-peer-deps --force', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Installation failed:', error.message);
  process.exit(1);
}

// Verify react-native installation
console.log('3. Verifying React Native installation...');
try {
  const reactNativePath = path.join('node_modules', 'react-native', 'package.json');
  if (fs.existsSync(reactNativePath)) {
    const packageJson = JSON.parse(fs.readFileSync(reactNativePath, 'utf8'));
    console.log('✅ React Native version:', packageJson.version);
  } else {
    console.error('❌ React Native not found after installation');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}

console.log('🎉 Dependencies fixed successfully!');
console.log('You can now run: eas build --platform android --profile internal');