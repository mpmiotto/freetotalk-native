# I'm Free Mobile App

A mobile application that allows users to see which friends are available for phone calls. 
This app uses Expo to provide a native wrapper around the web app with push notifications.

## Key Features

- Push notifications for friend availability
- WebView integration with the existing web app
- Debug interface for testing push notifications
- Token management for push delivery

## Development

1. Install dependencies: `npm install`
2. Run the app: `expo start`

## Building

Use EAS Build with the configured profiles in eas.json:

```
eas build --platform ios --profile preview
```

Or let GitHub Actions handle builds automatically on push.

