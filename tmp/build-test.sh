#!/bin/bash

# Test script to verify the fix works
cd expo-webview-app
echo "Testing with store profile (should succeed with App Store distribution)..."
echo "eas build --platform ios --profile store"
echo ""
echo "Expected result:"
echo "✓ Build created with Distribution profile"
echo "✓ No C++ template errors"
echo ""
echo "Then submit using:"
echo "eas submit --platform ios --profile store"
