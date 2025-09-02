#!/bin/bash

# Full Build and Submit Script
# This script performs a complete iOS build and TestFlight submission process

set -e  # Exit on any error

ECHO_PREFIX="\033[1;36m[Build]\033[0m"

echo -e "$ECHO_PREFIX 🚀 Starting full build and submit process"

# Step 1: Set JavaScript engine to JSC (required for TestFlight)
echo -e "$ECHO_PREFIX 🔧 Setting JavaScript engine to JavaScriptCore"
node direct-js-engine-fix.js

# Step 2: Update build numbers
echo -e "$ECHO_PREFIX 🔢 Updating build numbers"
node update-build-numbers.js

# Step 3: Execute the build with auto-submit flag
echo -e "$ECHO_PREFIX 📱 Starting iOS build and TestFlight submission"
NODE_OPTIONS="--max-old-space-size=4096" eas build --platform ios --profile production --non-interactive --clear-cache --auto-submit

echo -e "$ECHO_PREFIX ✅ Build and submit process initiated!"
echo -e "$ECHO_PREFIX 🕐 This will take 15-30 minutes to complete"
echo -e "$ECHO_PREFIX 📲 The app will be automatically submitted to TestFlight"
