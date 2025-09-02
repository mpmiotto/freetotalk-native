#!/bin/bash

# Clean Android Build Script
# Use this script to force a completely clean Android build with new package name

echo "🧹 Starting clean Android build for new package name..."
echo "Package: com.mmiotto.androidfreetotalk"
echo "Build: 126"

# Clear all caches
echo "Clearing EAS build cache..."
eas build --platform android --profile internal --clear-cache --non-interactive

echo "✅ Clean build completed!"
echo "This should resolve the Google Play package name conflicts."