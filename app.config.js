// Inline configuration to avoid module compatibility issues
// Values synced with root app.config.js
const version = "1.4.9";
const buildNumber = 172;

module.exports = {
  name: "Free to Talk",
  slug: "imfreeapp",
  version: version,
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#002952",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.mmiotto.freetotalk",
    buildNumber: buildNumber.toString(),
    jsEngine: "jsc",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSContactsUsageDescription:
        "This app needs access to your contacts to help you connect with friends.",
      UIBackgroundModes: ["remote-notification"],
      LSApplicationQueriesSchemes: ["tel", "telprompt", "sms"],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#002952",
    },
    package: "com.mmiotto.androidfreetotalk",
    versionCode: buildNumber,
    googleServicesFile: "./google-services.json",
    permissions: [
      "READ_CONTACTS",
      "WRITE_CONTACTS",
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "POST_NOTIFICATIONS",
      "WAKE_LOCK",
    ],
  },
  web: {
    favicon: "./assets/icon.png",
  },
  plugins: [
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#ffffff",
        sounds: [],
      },
    ],
    [
      "expo-contacts",
      {
        contactsPermission:
          "Allow $(PRODUCT_NAME) to access your contacts to help you connect with friends.",
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 26,
          extraProguardRules: "",
        },
        ios: {
          // Minimum iOS supported for Expo SDK 53 / RN 0.79
          deploymentTarget: "15.1",
        },
      },
    ],
  ],
  extra: {
    apiUrl: "https://freetotalk.replit.app",
    appVersion: version,
    buildNumber: buildNumber,
    eas: {
      projectId: "f5a3dc10-b9c3-45dc-810a-cab1cacec0c5",
    },
    expoUpdates: {
      disableNativeUpdatePrompt: true,
      disableUpdatePrompts: true,
      disableUpdatePromptExperimental: true,
      disableConfirmationDialogs: true,
      checkAutomatically: "ON_LOAD",
      showUpgradePrompt: false,
    },
  },
};
