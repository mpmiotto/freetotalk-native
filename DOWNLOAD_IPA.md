# Download and Submit iOS Build

Because we're having issues with the EAS CLI in the Replit environment, here are direct instructions for downloading the .ipa file and submitting it to TestFlight:

## Option 1: Download and Use Transporter

1. **Download the IPA file**
   - Open this URL in your browser: https://expo.dev/artifacts/eas/uRu1BsaUkKiu3fN2D5NLLv.ipa
   - The file will download to your computer

2. **Submit using Apple Transporter**
   - Download [Transporter from the Mac App Store](https://apps.apple.com/us/app/transporter/id1450874784)
   - Log in with your Apple Developer account
   - Drag and drop the downloaded .ipa file
   - Click "Deliver"

3. **Check status**
   - Visit [App Store Connect](https://appstoreconnect.apple.com/apps/6744858216/testflight/ios)
   - Check the TestFlight tab
   - The build should appear after processing (usually 15-30 minutes)

## Option 2: Use EAS CLI Locally

If you have the EAS CLI installed on your local machine (not in Replit):

```bash
# Login if needed
eas login

# Submit the specific IPA file
eas submit --platform ios --url https://expo.dev/artifacts/eas/uRu1BsaUkKiu3fN2D5NLLv.ipa
```

## Option 3: Use an Alternative Install Method

Since this build contains native code changes for phone detection, it can't be updated with OTA. The options are:

1. TestFlight submission (recommended)
2. Install via Apple Developer internal distribution
3. TestFlight specific build distribution

## Future Workflow Improvements

To fix the build+submit workflow in the future, the correct steps should be:

1. Build with production profile: `eas build --platform ios --profile production`
2. Submit the build: `eas submit --platform ios --latest`

If using a script, both commands need to be included with proper error handling between them.