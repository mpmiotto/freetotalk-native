#!/bin/bash

echo "🔧 Fixing Expo WebView App Dependencies"
echo "This script will install all required dependencies for Android builds"

# Navigate to the expo-webview-app directory
cd /home/runner/workspace/expo-webview-app

# Remove any existing node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install dependencies with legacy peer deps to avoid conflicts
npm install --legacy-peer-deps

# Verify installation
echo "✅ Dependencies installed. Checking key packages:"
npm list expo expo-notifications expo-contacts expo-device | grep -E "(expo|expo-notifications|expo-contacts|expo-device)"

echo "🚀 Ready to run: eas build --platform android"