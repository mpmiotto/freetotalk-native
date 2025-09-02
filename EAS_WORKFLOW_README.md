# EAS GitHub Workflow Guide

This guide explains how to use the GitHub Actions workflow to build and submit the app to TestFlight automatically.

## Setup

The workflow is already configured in `.github/workflows/expo-build.yml`. It includes the following key components:

1. **JavaScript Engine Fix** - Sets iOS to use JavaScriptCore (JSC) instead of Hermes to ensure TestFlight compatibility
2. **Auto Submit** - Uses the `--auto-submit` flag to automatically submit the app to TestFlight after building
3. **Clear Cache** - Uses the `--clear-cache` flag to ensure clean builds

## How to Use

### Option 1: Run from GitHub

1. Go to the GitHub repository
2. Click on the "Actions" tab
3. Select "Expo Build (Full App Update)" workflow
4. Click "Run workflow"
5. Set the following parameters:
   - Platform: `ios` (or `all` for both iOS and Android)
   - Release Channel: `production`
   - Build Profile: `production`
6. Click "Run workflow"

### Option 2: Run Locally

You can run the build process locally using one of these scripts:

- **Full Build & Submit**: `./full-build-and-submit.sh`
  - Updates build numbers
  - Sets JSC for iOS
  - Builds and submits to TestFlight

- **Auto Submit Only**: `./auto-submit-build.sh`
  - Just runs the build with auto-submit flag

## Important Notes

- You must have the `EXPO_TOKEN` environment variable set (already configured in GitHub Secrets)
- Builds take approximately 15-30 minutes to complete
- TestFlight processing takes additional time after submission
- You can monitor build progress in the [EAS Dashboard](https://expo.dev/accounts/your-account/projects/your-project/builds)

## Troubleshooting

If you encounter TestFlight submission issues:

1. Ensure JavaScript engine is set to JSC (not Hermes)
2. Check that build numbers are incrementing properly
3. Verify the EXPO_TOKEN is valid
4. Check for any iOS-specific configuration issues in app.json

## File Descriptions

- **expo-build.yml** - GitHub Actions workflow configuration
- **direct-js-engine-fix.js** - Script that sets iOS JS engine to JSC
- **update-build-numbers.js** - Script that increments iOS and Android build numbers
- **auto-submit-build.sh** - Simple script to build with auto-submit flag
- **full-build-and-submit.sh** - Complete build and submit process script
