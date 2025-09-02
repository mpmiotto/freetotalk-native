#!/bin/bash

# TestFlight Direct Submission Script
# Run this script directly to build and submit to TestFlight

echo "===== TestFlight Direct Submission Script ====="
echo "=========================================="

# Verify we're in the correct directory
if [[ ! -f "app.json" ]]; then
  echo "⚠️ Make sure to run this script from the expo-webview-app directory"
  echo "Run: cd expo-webview-app && ./testflight-submit.sh"
  exit 1
fi

# Check for EXPO_TOKEN
if [[ -z "$EXPO_TOKEN" ]]; then
  echo "⚠️ Warning: EXPO_TOKEN environment variable is not set"
  echo "You may need to run 'eas login' first if you're not already logged in"
fi

# Increment iOS build number automatically
CURRENT_BUILD=$(grep -o '"buildNumber": "[0-9]\+"' app.json | grep -o '[0-9]\+')
NEW_BUILD=$((CURRENT_BUILD + 1))

echo "📝 Updating iOS build number from $CURRENT_BUILD to $NEW_BUILD"
sed -i "s/\"buildNumber\": \"[0-9]*\"/\"buildNumber\": \"$NEW_BUILD\"/g" app.json

# Increment Android version code too for consistency
CURRENT_CODE=$(grep -o '"versionCode": [0-9]\+' app.json | grep -o '[0-9]\+')
NEW_CODE=$((CURRENT_CODE + 1))

echo "📝 Updating Android version code from $CURRENT_CODE to $NEW_CODE"
sed -i "s/\"versionCode\": [0-9]*/\"versionCode\": $NEW_CODE/g" app.json

echo "✅ Build numbers updated in app.json"

# First run the build command
echo "🚀 Step 1: Building app with production profile"
echo "This will take 15-20 minutes to complete..."
eas build --platform ios --profile production --non-interactive

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix the errors and try again."
  exit 1
fi

echo "✅ Build completed successfully!"

# Then submit to TestFlight
echo "🚀 Step 2: Submitting to TestFlight"
eas submit --platform ios --profile production --non-interactive

# Check if submission was successful
if [ $? -ne 0 ]; then
  echo "❌ Submission failed. Check the errors above."
  exit 1
fi

echo "✅ App successfully submitted to TestFlight!"
echo "🕒 Your app should appear in TestFlight after Apple's processing (usually 15-30 minutes)"
echo "=========================================="