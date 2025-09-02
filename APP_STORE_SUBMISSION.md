# App Store Submission Guide

## IMPORTANT: Use the STORE Profile!

Your App Store submission was failing because you were using the `preview` profile. This creates an Ad Hoc provisioning profile which is meant for internal distribution and testing, not for App Store submission.

## Exact Error Message

```
Invalid Provisioning Profile for Apple App Store distribution. The application was signed with an 
Ad Hoc/Enterprise Provisioning Profile, which is meant for "Internal Distribution". In order to 
distribute an app on the store, it must be signed with a Distribution Provisioning Profile.
```

## Solution

You must explicitly use the `store` profile when building and submitting. This ensures the correct Distribution provisioning profile is created.

### Build Commands

```bash
# Build with store profile (NOT preview)
eas build --platform ios --profile store

# After build completes, submit with store profile
eas submit --platform ios --profile store
```

## Fixes Applied

1. **Simplified App.js** - Created an ultra-minimal App implementation that avoids C++ template errors
2. **Updated eas.json** - Configured with proper `store` profile and distribution setting
3. **Set correct ascAppId** - Ensured App Store Connect ID is properly configured (6475723650)

## Verification

After running the build with the store profile, check the output for:
```
Resolved "store" environment for the build
```

And NOT:
```
Resolved "preview" environment for the build
```

## App Store Connect

Once successfully submitted, you can monitor the review status at:
https://appstoreconnect.apple.com/apps/6475723650/appstore

## If You Still Have Issues

Double-check:
1. You're using the EXACT commands above (with `--profile store`)
2. Your App Store Connect API key is valid
3. Your App's bundle identifier matches what's in App Store Connect
