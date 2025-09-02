# How to Fix the iOS Build Issues

## 1. Update Your Environment

First, run these commands to update your local expo tools:

```
npm install -g eas-cli@latest
npm update expo
```

## 2. Build Steps

After preparing the changes to your eas.json and App.js, use these exact commands:

```
# Make sure you're in the expo-webview-app directory
cd expo-webview-app

# Create internal build first (for testing)
eas build --platform ios --profile internal

# Deploy to TestFlight (once internal build succeeds)
eas submit --platform ios --profile internal
```

## 3. Common Error Fixes

If you get an error about "ascAppId":
- Make sure you've added the ascAppId to ALL profiles in the submit section
- Use the exact App Store ID: 6475723650

If you get a build error about "implicit instantiation of undefined template":
- Use the simplified App.js we've created
- This minimal implementation doesn't trigger the C++ template error

## 4. Verifying Your Build

Check your build status at: https://expo.dev/accounts/mmiotto/projects/imfreeapp/builds