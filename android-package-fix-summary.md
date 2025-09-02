# Android Package Name Fix - Build 127

## Problem
Google Play Store rejected app with error:
```
Remove conflicts from the manifest before uploading. The following content provider authorities are in use by other developers: com.mmiotto.freetotalk.FileSystemFileProvider, com.mmiotto.freetotalk.androidx-startup, com.mmiotto.freetotalk.com.pairip.licensecheck.LicenseContentProvider, com.mmiotto.freetotalk.fileprovider, com.mmiotto.freetotalk.firebaseinitprovider.
You need to use a different package name because "com.mmiotto.freetotalk" already exists in Google Play.
```

## Solution Applied
Changed Android package name from `com.mmiotto.freetotalk` to `com.mmiotto.androidfreetotalk` while preserving iOS bundle identifier.

## Files Modified

### Core Configuration
- `app.json`: Android package → `com.mmiotto.androidfreetotalk`, build 127
- `app.config.js`: Android package → `com.mmiotto.androidfreetotalk`
- `google-services.json`: Removed old package entry, only new package remains

### Build System
- `eas.json`: Changed `credentialsSource: "remote"` → `"local"` for both internal and preview profiles
- `android-build-test.yml`: Added `--clear-cache` flag to force clean build

### Siri Shortcuts (iOS-only features)
- `SiriShortcuts.js`: Reverted to use iOS bundle ID `com.mmiotto.freetotalk`
- `SiriShortcutsSimple.js`: Reverted to use iOS bundle ID `com.mmiotto.freetotalk`

## Final Configuration

### iOS (Unchanged - App Store Compatible)
- Bundle ID: `com.mmiotto.freetotalk`
- Build Number: 127
- Siri shortcuts use iOS bundle ID

### Android (New Package - Google Play Compatible)
- Package: `com.mmiotto.androidfreetotalk`
- Version Code: 127
- Firebase config updated for new package
- All content providers will use new package prefix

## Next Build Command
```bash
eas build --platform android --profile internal --clear-cache --non-interactive
```

The `--clear-cache` flag ensures no old cached artifacts with the previous package name are used.

## Expected Result
Content provider authorities will change from:
- `com.mmiotto.freetotalk.FileSystemFileProvider`
- `com.mmiotto.freetotalk.androidx-startup`

To:
- `com.mmiotto.androidfreetotalk.FileSystemFileProvider`
- `com.mmiotto.androidfreetotalk.androidx-startup`

This resolves the Google Play Store package name conflict.