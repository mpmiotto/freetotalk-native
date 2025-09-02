# iOS App Store Submission Fix

## The Problem

You're getting this error:

```
Invalid Provisioning Profile for Apple App Store distribution. The application was signed with an Ad Hoc/Enterprise Provisioning Profile, which is meant for "Internal Distribution". In order to distribute an app on the store, it must be signed with a Distribution Provisioning Profile.
```

## The Solution

**You must explicitly use the `store` profile, not `preview` or `internal`.**

## Exact Commands to Fix

```bash
# 1. Create a build with the STORE profile (not preview or internal)
cd expo-webview-app
eas build --platform ios --profile store

# 2. Wait for build to complete, then submit with store profile
eas submit --platform ios --profile store
```

## Why This Will Fix It

Looking at your build logs, you're using the `preview` profile:
```
Resolved "preview" environment for the build.
```

The `preview` profile uses `distribution: "internal"` which creates an Ad Hoc provisioning profile, not suitable for App Store distribution.

Only the `store` profile with `distribution: "store"` will create the correct Distribution Provisioning Profile needed for App Store submission.

## Still Having Issues?

Check that your App Store app ID is correct: 6475723650

Make sure your eas.json has a `store` build profile with `distribution: "store"`:

```json
"store": {
  "distribution": "store",
  "ios": {
    "resourceClass": "m-medium"
  }
}
```
