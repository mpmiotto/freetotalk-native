import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  AppState,
  Platform,
  Linking,
  StatusBar as RNStatusBar,
  Alert,
  Text,
  TextInput,
} from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import appConfig from "./app.config.js";

// Apply font scaling limits to prevent accessibility settings from breaking the UI
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = true;
Text.defaultProps.maxFontSizeMultiplier = 1.3;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = true;
TextInput.defaultProps.maxFontSizeMultiplier = 1.3;

function Main() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const [appVersion] = useState(appConfig.extra.appVersion);
  const [buildNumber] = useState(appConfig.extra.buildNumber);

  // State for foreground detection
  const [appState, setAppState] = useState(AppState.currentState);
  const [backgroundTime, setBackgroundTime] = useState(null);
  const [pushTokenReady, setPushTokenReady] = useState(false);

  // Register for push notifications on app start and set window.pushNotificationToken
  const registerForPushNotifications = async () => {
    try {
      console.log("🚀 Starting push notification registration...");
      console.log("📱 Build: " + buildNumber + ", Version: " + appVersion);

      // Device support check
      console.log(
        "📱 Device check - Constants.isDevice: " + Constants.isDevice
      );
      console.log("📱 Device check - Platform.OS: " + Platform.OS);

      // Check existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      console.log("📱 Current permission status: " + existingStatus);
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== "granted") {
        console.log("🔔 Requesting notification permissions...");
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: true,
            allowProvisional: false,
            allowAnnouncements: true,
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        console.log("📱 Permission request completed. New status: " + status);
        finalStatus = status;
      }

      console.log("📱 Final permission status: " + finalStatus);
      if (finalStatus !== "granted") {
        console.log("❌ Notification permission denied");
        return null;
      }

      console.log("✅ Notification permission granted");

      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn("No project ID found in config");
        return null;
      }

      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = expoPushToken.data;
      console.log("Push token obtained:", token.substring(0, 20) + "...");

      // Save token locally
      await AsyncStorage.setItem("pushToken", token);

      // Send token into the WebView
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: "NATIVE_PUSH_TOKEN",
            token,
            platform: Platform.OS,
          })
        );
        console.log(
          "📱 Push token sent to WebView for registration:",
          token.substring(0, 20) + "..."
        );

        // Also set on window for backward compatibility
        webViewRef.current.injectJavaScript(`
          window.pushNotificationToken = '${token}';
          console.log('📱 Push token set on window for web app:', '${token.substring(
            0,
            20
          )}...');
        `);
      } else {
        console.log("📱 WebView not ready, will set token on load");
      }

      return token;
    } catch (error) {
      console.error("❌ Error registering for push notifications:", error);
      console.error("❌ Error details:", error.message);
      console.error("❌ Error stack:", error.stack);
      return null;
    }
  };

  const getWebViewUrl = () => {
    const baseUrl = "https://freetotalk.replit.app";
    const params = new URLSearchParams({
      version: appVersion,
      build: buildNumber.toString(),
      platform: Platform.OS,
      timestamp: Date.now().toString(),
      // TEMPORARY: Add testing bypass for account deletion verification
      bypassUserId: "186",
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = event.nativeEvent.data;
      console.log("WebView message:", data);

      if (data === "GET_PHONE_NUMBER") {
        webViewRef.current?.postMessage("");
      }

      // Handle version control response
      if (
        data &&
        typeof data === "string" &&
        data.includes("VERSION_CONTROL_RESPONSE")
      ) {
        try {
          const parsedMessage = JSON.parse(data);
          if (
            parsedMessage.type === "VERSION_CONTROL_RESPONSE" &&
            parsedMessage.data
          ) {
            const updateData = parsedMessage.data;
            console.log("Version control response received:", updateData);

            Alert.alert(
              "Update Required",
              `${updateData.message}\n\nCurrent: ${updateData.currentVersion}\nRequired: ${updateData.requiredVersion}`,
              [
                {
                  text: "Update Now",
                  onPress: () => {
                    console.log("Opening store URL:", updateData.storeUrl);
                    Linking.openURL(updateData.storeUrl).catch((error) => {
                      console.error("Failed to open store URL:", error);
                      Alert.alert(
                        "Error",
                        "Could not open app store. Please update manually."
                      );
                    });
                  },
                },
                {
                  text: "Exit App",
                  style: "cancel",
                  onPress: () => {
                    console.log(
                      "User chose to exit app due to version requirement"
                    );
                  },
                },
              ],
              { cancelable: false }
            );
            return;
          }
        } catch (e) {
          console.error("Error parsing version control message:", e);
        }
      }

      // Handle notification permission check
      if (data === "checkNotificationPermissions") {
        console.log("Checking notification permissions...");
        Notifications.getPermissionsAsync()
          .then(({ status, granted, canAskAgain }) => {
            console.log(
              `Notification permission status: ${status}, granted: ${granted}`
            );

            const response = {
              type: "NOTIFICATION_PERMISSION_RESULT",
              granted,
              canAskAgain,
              status,
            };

            webViewRef.current?.injectJavaScript(`
              document.dispatchEvent(new CustomEvent('notificationPermissionReceived', {
                detail: ${JSON.stringify(response)}
              }));
            `);
          })
          .catch((error) => {
            console.error("Error checking notification permissions:", error);
          });
      }

      // Handle PHONE_CALL requests
      if (data && typeof data === "string" && data.includes("PHONE_CALL")) {
        try {
          const parsedData = JSON.parse(data);
          if (
            parsedData &&
            parsedData.type === "PHONE_CALL" &&
            parsedData.phoneNumber
          ) {
            console.log("Phone call request received:", parsedData.phoneNumber);
            const telUrl = `tel:${parsedData.phoneNumber}`;

            console.log("Attempting to open tel URL with Linking:", telUrl);

            Linking.canOpenURL(telUrl)
              .then((supported) => {
                console.log("Tel URL supported:", supported);
                if (supported) return Linking.openURL(telUrl);
                throw new Error("Tel URLs not supported on this device");
              })
              .then(() => {
                console.log(
                  "Successfully opened phone dialer for:",
                  parsedData.phoneNumber
                );
              })
              .catch((error) => {
                console.error(
                  "Failed to open phone dialer:",
                  error.message,
                  error
                );
              });
          }
        } catch (e) {
          console.error("Error parsing phone call message:", e);
        }
      }

      // Handle openStore requests for app updates
      if (data && typeof data === "string" && data.includes("openStore")) {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData && parsedData.type === "openStore" && parsedData.url) {
            console.log("Store URL request received:", parsedData.url);
            console.log(
              "Attempting to open store URL with Linking:",
              parsedData.url
            );

            Linking.canOpenURL(parsedData.url)
              .then((supported) => {
                console.log("Store URL supported:", supported);
                if (supported) return Linking.openURL(parsedData.url);
                throw new Error("Store URLs not supported on this device");
              })
              .then(() => {
                console.log("Successfully opened store URL:", parsedData.url);
              })
              .catch((error) => {
                console.error(
                  "Failed to open store URL:",
                  error.message,
                  error
                );
                Alert.alert(
                  "Error",
                  "Could not open app store. Please update manually."
                );
              });
          }
        } catch (e) {
          console.error("Error parsing store URL message:", e);
        }
      }

      // Handle TEST_CRASH for crash testing
      if (data && typeof data === "string" && data.includes("TEST_CRASH")) {
        const parsedData = JSON.parse(data);
        if (parsedData && parsedData.type === "TEST_CRASH") {
          console.log("Test crash triggered from web interface");
          const testCrashData = {
            message: "Test SIGABRT crash simulation from web",
            name: "WebTestError",
            isFatal: true,
            timestamp: new Date().toISOString(),
            errorType: "WEB_TRIGGERED_CRASH",
            buildNumber: 86,
            stack:
              "WebTestError: Test crash from web interface\n    at testCrash (Home.tsx)\n    at React Native Bridge\n    at ExceptionsManagerQueue",
            source: "Web Interface Test",
          };

          AsyncStorage.setItem(
            "last_crash_error",
            JSON.stringify(testCrashData)
          )
            .then(() => console.log("Test crash data stored"))
            .catch((err) =>
              console.log("Error storing test data:", err.message)
            );
        }
      }
    } catch (error) {
      console.log("Error handling WebView message:", error.message);
    }
  };

  useEffect(() => {
    console.log("App component mounted - Build 157");
    console.log("🔥 DEBUG: App.js useEffect started");

    // Always show alerts, sound, badge even when foregrounded
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Setup Android notification channels first (required on 8+)
    const setupAndroidChannel = async () => {
      if (Platform.OS === "android") {
        try {
          // Channel used by your server pushes
          await Notifications.setNotificationChannelAsync("high-priority", {
            name: "High Priority",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: "default",
            lockscreenVisibility:
              Notifications.AndroidNotificationVisibility.PUBLIC,
            enableVibration: true,
            enableLights: true,
            showBadge: true,
          });
          console.log(
            "📱 Android notification channel (high-priority) created"
          );

          // Fallback channel if a push arrives without channelId
          await Notifications.setNotificationChannelAsync("default", {
            name: "General",
            importance: Notifications.AndroidImportance.MAX, // heads-up by default
            sound: "default",
            showBadge: true,
            enableVibration: true,
            lockscreenVisibility:
              Notifications.AndroidNotificationVisibility.PUBLIC,
          });
          console.log("📱 Android notification channel (default) created");
        } catch (error) {
          console.error("Error creating Android notification channel:", error);
        }
      }
    };

    // Setup channel first, then register for notifications
    setupAndroidChannel()
      .then(() => registerForPushNotifications())
      .then(() => {
        setPushTokenReady(true);
        console.log(
          "📱 Push notification registration completed, WebView ready to load"
        );
      });

    const handleAppStateChange = (nextAppState) => {
      console.log("App state changed to:", nextAppState);

      if (appState === "active" && nextAppState === "background") {
        const currentTime = Date.now();
        setBackgroundTime(currentTime);
        console.log("App went to background, recorded time:", currentTime);
      } else if (appState === "background" && nextAppState === "active") {
        if (backgroundTime) {
          const timeInBackground = Date.now() - backgroundTime;
          const secondsInBackground = Math.floor(timeInBackground / 1000);
          console.log(
            `App was in background for ${secondsInBackground} seconds`
          );

          if (secondsInBackground > 300) {
            console.log(
              "App was in background for >5 minutes, reloading WebView to prevent white screen"
            );
            if (webViewRef.current) {
              webViewRef.current.reload();
            }
          } else {
            console.log(
              "App was in background for <5 minutes, preserving state without reload"
            );
          }
        }
        setBackgroundTime(null);
      } else if (nextAppState === "inactive") {
        console.log(
          "App state changed to inactive (ignoring - likely swipe gesture)"
        );
        return;
      }

      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      {pushTokenReady && (
        <WebView
          ref={webViewRef}
          source={{ uri: getWebViewUrl() }}
          style={styles.webview}
          textZoom={100}
          onMessage={handleWebViewMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.log("WebView error:", nativeEvent.description);
          }}
          onLoadStart={() => console.log("WebView load started")}
          onLoadEnd={async () => {
            console.log("WebView load completed");

            // Ensure push token is available to the web app
            try {
              const savedToken = await AsyncStorage.getItem("pushToken");
              if (savedToken && webViewRef.current) {
                console.log(
                  "📱 Setting push token on WebView load:",
                  savedToken.substring(0, 20) + "..."
                );
                webViewRef.current.injectJavaScript(`
                  window.pushNotificationToken = '${savedToken}';
                  console.log('📱 Push token set on WebView load:', '${savedToken.substring(
                    0,
                    20
                  )}...');
                `);
              }
            } catch (error) {
              console.error("Error setting push token on WebView load:", error);
            }

            // Detect server "update required" JSON responses
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`
                (function() {
                  try {
                    const bodyText = document.body.innerText || document.body.textContent || '';
                    console.log('Page content check:', bodyText.substring(0, 100));
                    if (bodyText.includes('"updateRequired":true') || bodyText.includes('updateRequired')) {
                      console.log('Detected update required response, parsing...');
                      const jsonMatch = bodyText.match(/\\{.*"updateRequired".*\\}/);
                      if (jsonMatch) {
                        const updateData = JSON.parse(jsonMatch[0]);
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'VERSION_CONTROL_RESPONSE',
                          data: updateData
                        }));
                      }
                    }
                  } catch (e) {
                    console.log('Error checking for version control response:', e);
                  }
                })();
              `);
            }

            // Prevent WebView text size adjustments and set proper viewport
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`
                (function(){
                  var m=document.querySelector('meta[name=viewport]')||document.createElement('meta');
                  m.name='viewport'; 
                  m.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no';
                  document.head.appendChild(m);
                  var s=document.createElement('style');
                  s.textContent='html{-webkit-text-size-adjust:100% !important; text-size-adjust:100% !important;}';
                  document.head.appendChild(s);
                })(); 
                true;
              `);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          incognito={false}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={false}
          originWhitelist={["*"]}
          mixedContentMode="compatibility"
          userAgent={`FreeToTalk/${appVersion} (${Platform.OS}; Build ${buildNumber})`}
          onShouldStartLoadWithRequest={(request) => {
            console.log("🔗 WebView navigation request:", request.url);

            // Handle tel:
            if (request.url && request.url.startsWith("tel:")) {
              console.log(
                "📞 Tel protocol detected, opening with Linking:",
                request.url
              );
              Linking.openURL(request.url)
                .then(() =>
                  console.log("✅ Successfully opened tel URL with Linking")
                )
                .catch((error) =>
                  console.error("❌ Failed to open tel URL:", error)
                );
              return false;
            }

            // Handle sms:
            if (request.url && request.url.startsWith("sms:")) {
              console.log(
                "💬 SMS protocol detected, opening with Linking:",
                request.url
              );
              Linking.openURL(request.url)
                .then(() =>
                  console.log("✅ Successfully opened SMS URL with Linking")
                )
                .catch((error) =>
                  console.error("❌ Failed to open SMS URL:", error)
                );
              return false;
            }

            return true;
          }}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#002952",
  },
  webview: {
    flex: 1,
  },
});
