#!/bin/bash

# Complete App Store Build & Submit Workflow
# This script handles the entire process of building and submitting to TestFlight

echo "===== I'm Free iOS App Store Build & Submit Workflow ====="
echo "====================================================="

# Increment build numbers
NEW_IOS_BUILD=$(( $(grep -o '"buildNumber": "[0-9]\+"' ../app.json | grep -o '[0-9]\+') + 1 ))
NEW_ANDROID_VERSION=$(( $(grep -o '"versionCode": [0-9]\+' ../app.json | grep -o '[0-9]\+') + 1 ))

echo "Incrementing iOS build number to: $NEW_IOS_BUILD"
echo "Incrementing Android version code to: $NEW_ANDROID_VERSION"

sed -i "s/\"buildNumber\": \"[0-9]*\"/\"buildNumber\": \"$NEW_IOS_BUILD\"/g" ../app.json
sed -i "s/\"versionCode\": [0-9]*/\"versionCode\": $NEW_ANDROID_VERSION/g" ../app.json

echo "✅ Build numbers updated in app.json"
echo

echo "STEP 1: Building app with 'production' profile"
eas build --platform ios --profile production --non-interactive

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Exiting workflow."
  exit 1
fi

echo "✅ Build completed successfully!"
echo

echo "STEP 2: Submitting build to TestFlight"
eas submit --platform ios --profile production --non-interactive

if [ $? -ne 0 ]; then
  echo "❌ Submit failed. Please check the error messages above."
  exit 1
fi

echo "✅ App successfully submitted to TestFlight!"
echo "🕒 Your app should appear in TestFlight after Apple's processing (usually 15-30 minutes)"
echo "====================================================="

chmod +x BUILD_COMMANDS.sh
