# TestFlight Submission Guide

## Complete Process for App Store & TestFlight Submission

To ensure your app properly appears in TestFlight, always follow this two-step process:

```bash
# Step 1: Build the app (this takes 15-20 minutes)
eas build --platform ios --profile production

# Step 2: Submit the build to TestFlight (must be run after build completes)
eas submit --platform ios --latest
```

## Important Notes

1. **Both steps are required**. The build step alone only creates the IPA file but doesn't send it to TestFlight.

2. **Increment build numbers**. Each submission to TestFlight requires a unique build number:
   - Update `buildNumber` in app.json for iOS
   - Update `versionCode` in app.json for Android

3. **Native code changes require a full rebuild**. Features that use native APIs (like phone detection, contacts access, etc.) can't be updated with OTA updates.

4. **Current app details**:
   - App Store ID: 6744858216
   - Bundle ID: com.mmiotto.freetotalk
   - Current build number: 155

## Manual Submission Options

If EAS CLI submit is not working:

1. **Download the IPA** from the URL provided in the build output
2. **Use Apple Transporter app** to upload the IPA
3. **Check TestFlight status** in App Store Connect

## One-Line Build Script

For convenience, this single command will build and submit in one go:

```bash
# Run from expo-webview-app directory
./full-build-and-submit.sh
```