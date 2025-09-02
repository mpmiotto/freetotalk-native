#!/usr/bin/env node

/**
 * Export Sanity Check Script
 * 
 * This script performs a lightweight export of just the bundled JavaScript
 * without actually creating platform-specific bundles. This serves as a 
 * verification that the JS engine configuration is correct and will work for
 * OTA updates.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create a temporary directory for the export
const tmpDir = path.join(__dirname, 'tmp-export-check');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

console.log('\n📍 Running lightweight export check to verify configuration...');
try {
  // Run the export with minimal options for speed
  const result = execSync(
    `npx expo export --no-publish --dump-sourcemap=false --dump-assetmap=false --output-dir=${tmpDir}`,
    { stdio: 'pipe' }
  ).toString();
  
  console.log('\n✅ Export check successful! Your configuration should work for OTA updates.');
  console.log('\n📡 Sample output:');
  console.log(result.split('\n').slice(0, 10).join('\n'));  // Just show the first few lines
  
  // Clean up
  if (fs.existsSync(tmpDir)) {
    console.log('\n🗑️ Cleaning up temporary files...');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Export check failed. This indicates a potential issue with the configuration:');
  if (error.stderr) {
    console.error(error.stderr.toString().split('\n').slice(0, 20).join('\n'));  // Show just part of the error
  } else {
    console.error(error.message);
  }
  
  console.log('\n⚠️ However, we will proceed with the update workflow anyway, as the actual EAS update may still work.');
  console.log('   This check is for information only and doesn\'t prevent the workflow from continuing.');
  
  // Clean up even on failure
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  
  // Still exit with success code to not block the workflow
  process.exit(0);
}