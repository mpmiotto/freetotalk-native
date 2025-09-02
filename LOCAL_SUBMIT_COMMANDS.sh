#!/bin/bash

# This script should be run on your local machine, not in Replit
# It will submit the already-built IPA to TestFlight

echo "===== Local TestFlight Submission Script ====="
echo "=========================================="

# Replace this with your actual build URL from the log
IPA_URL="https://expo.dev/artifacts/eas/uRu1BsaUkKiu3fN2D5NLLv.ipa"

echo "Submitting iOS build from: $IPA_URL"
echo

# First, ensure you're logged into EAS
echo "Step 1: Login to EAS (if needed)"
echo "eas login"
echo

# Submit the app to TestFlight
echo "Step 2: Submit the app to TestFlight"
echo "eas submit --platform ios --url $IPA_URL --non-interactive"
echo

echo "If the above commands fail, try these alternative approaches:"
echo
echo "Option 1: Direct submit using manual Apple credentials"
echo "eas submit --platform ios --url $IPA_URL --apple-id your-apple-id@example.com --asc-app-id 6744858216"
echo
echo "Option 2: Use Transporter app to submit manually"
echo "1. Download the IPA from: $IPA_URL"
echo "2. Open Apple's Transporter app"
echo "3. Drag and drop the downloaded IPA file"
echo "4. Click 'Deliver'"
echo
echo "=========================================="
echo "After submission, check TestFlight status at:"
echo "https://appstoreconnect.apple.com/apps/6744858216/testflight/ios"
echo "=========================================="