# Build and Deploy Guide - Free to Talk App

## Overview
This guide covers the complete deployment process for both iOS (TestFlight/App Store) and Android (Google Play Store) using the GitHub Actions workflows with crash prevention fixes.

## Current Configuration Status

### ✅ Version 1.4.0 Build 72 Ready
- **Crash Prevention**: Fixed SIGABRT crashes from build 71
- **Version Parameters**: Proper WebView URL construction with fallbacks
- **JavaScript Engine**: Set to JavaScriptCore (JSC) for iOS stability
- **Auto-Submission**: Configured for both TestFlight and Play Store

## Deployment Workflows

### 1. TestFlight Deployment (expo-build.yml)
```bash
# Trigger from GitHub Actions tab
Platform: iOS
Profile: production
Auto-submit: true
```

**Features:**
- Automatically increments build numbers
- Applies crash prevention fixes
- Uses JSC engine for stability
- Auto-submits to TestFlight

### 2. App Store Deployment (app-store-build.yml)
```bash
# Trigger from GitHub Actions tab
Platform: iOS or Android
Profile: store (automatically set)
```

**Features:**
- Production-ready configuration
- Store-specific optimizations
- Auto-submission to both App Store and Google Play

## Build Process Steps

### Automatic Steps (Handled by GitHub Actions)
1. **Code Checkout**: Latest repository code
2. **Environment Setup**: Node.js 20.x, EAS CLI
3. **Dependency Installation**: npm ci
4. **Crash Prevention**: Apply JSC engine and URL fixes
5. **Build Number Increment**: Automatic unique versioning
6. **Git Commit**: Push updated build numbers
7. **Platform Build**: iOS and/or Android compilation
8. **Store Submission**: Automatic submission with --auto-submit

### Manual Steps (Your Part)
1. **Push Code**: `git push` to trigger workflows
2. **Run Workflow**: Go to GitHub Actions tab
3. **Select Workflow**: Choose expo-build.yml or app-store-build.yml
4. **Configure Options**: Select platform and options
5. **Monitor Progress**: Watch build logs for completion

## Platform-Specific Configuration

### iOS Configuration
- **App Store ID**: 6744858216
- **Build Profile**: production/store
- **JavaScript Engine**: JavaScriptCore (JSC)
- **Resource Class**: m-medium
- **Xcode Version**: 16.1 on macOS Sonoma 14.6

### Android Configuration (Ready for Google Play)
- **Resource Class**: medium
- **Service Account**: google-service-account.json
- **Track**: production/internal
- **Adaptive Icon**: Configured with foreground and background

## Crash Prevention (Build 72)

### Fixed Issues from Build 71
- **SIGABRT Crashes**: Resolved version parameter handling
- **WebView URL Construction**: Added fallback values
- **React Native ExceptionsManagerQueue**: Proper error handling
- **Background Refresh**: Enhanced lifecycle management

### Applied Fixes
- Version parameters properly passed to WebView
- Fallback version values prevent crashes
- JSC engine instead of Hermes for stability
- Enhanced URL construction with validation

## Deployment Commands

### Quick TestFlight Build
```bash
# From GitHub Actions > expo-build.yml
Platform: ios
Profile: production
Auto-submit: true
```

### Production Store Release
```bash
# From GitHub Actions > app-store-build.yml
Platform: all (iOS + Android)
# Automatically uses 'store' profile
```

### Manual EAS Commands (if needed)
```bash
cd expo-webview-app

# iOS TestFlight
eas build --platform ios --profile production --auto-submit

# iOS App Store
eas build --platform ios --profile store --auto-submit

# Android Play Store
eas build --platform android --profile store --auto-submit
```

## Success Indicators

### Build Success
- ✅ Build completes without errors
- ✅ Build number incremented (72 → 73)
- ✅ Version shows as 1.4.0
- ✅ JSC engine configuration applied

### Submission Success
- ✅ TestFlight: "Processing" status in App Store Connect
- ✅ Play Store: "Under Review" status in Play Console
- ✅ No crash reports from new build
- ✅ Version control system working correctly

## Troubleshooting

### Common Issues
1. **Build Fails**: Check EAS build logs for specific errors
2. **Submission Fails**: Verify app store credentials in secrets
3. **Version Conflicts**: Ensure build numbers are unique
4. **Crash Reports**: Should not occur with build 72+ fixes

### Required Secrets (GitHub Settings)
- `EXPO_TOKEN`: EAS authentication token
- `GOOGLE_SERVICE_ACCOUNT_JSON`: For Android Play Store (when ready)

## Next Steps After Deployment

1. **TestFlight**: Users can install via TestFlight link
2. **App Store**: Submit for review after TestFlight testing
3. **Play Store**: Monitor review process and respond to feedback
4. **Monitor**: Watch for crash reports and user feedback

## Version Timeline
- **Build 71**: Had SIGABRT crashes (deprecated)
- **Build 72**: Fixed crashes, ready for deployment
- **Build 73+**: Auto-incremented by workflows

The app is now production-ready with comprehensive crash prevention and multi-platform deployment support.