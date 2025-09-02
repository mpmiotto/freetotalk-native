# Firebase Setup Instructions for Android Push Notifications

## Current Issue
Android push notifications are not working because the app lacks Firebase Cloud Messaging (FCM) configuration. The `google-services.json` file is missing.

## Required Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Enter project name: "Free to Talk" or similar
4. Optionally enable Google Analytics

### 2. Add Android App to Firebase
1. In Firebase Console, click "Add Firebase to your Android app"
2. Enter Android package name: `com.mmiotto.freetotalk`
3. App nickname: "Free to Talk Android"
4. Click "Register app"

### 3. Download google-services.json
1. Download the `google-services.json` file from Firebase Console
2. Place it in the `expo-webview-app` directory (same level as `app.config.js`)
3. The file should be at: `expo-webview-app/google-services.json`

### 4. Configure FCM Service Account (For Production)
1. In Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file securely
4. Upload to EAS credentials using:
   ```bash
   eas credentials
   # Select Android > production > Google Service Account
   ```

## Current App Configuration
The app is already configured to use Firebase:
- ✅ `googleServicesFile: "./google-services.json"` added to app.config.js
- ✅ Android permissions include `POST_NOTIFICATIONS` and `WAKE_LOCK`
- ✅ Push notification code supports both iOS and Android

## After Setup
Once `google-services.json` is in place:
1. Build the Android app with Build 118+
2. Test push notifications on physical Android device
3. Notifications should work identical to iOS version

## Security Note
The `google-services.json` file contains non-secret identifiers and is safe to include in the repository. However, the service account key file should be kept secure and not committed to version control.