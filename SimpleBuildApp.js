import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

// Ultra-simple app without any complex imports or components
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        source={{ uri: 'https://freetotalk.replit.app' }}
        style={styles.webview}
        onLoad={() => console.log('WebView loaded')}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
});
