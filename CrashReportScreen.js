import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, View, TouchableOpacity, StyleSheet, Clipboard } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CrashReportScreen = ({ onRestart }) => {
  console.log('📊 [LOG] CrashReportScreen component rendered');
  const [crashData, setCrashData] = useState(null);
  const [showStack, setShowStack] = useState(false);
  const [showAllProps, setShowAllProps] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📊 [LOG] CrashReportScreen useEffect triggered');
    loadCrashData();
  }, []);

  const loadCrashData = async () => {
    console.log('📊 [LOG] loadCrashData function called');
    try {
      console.log('📊 [LOG] Loading crash data from AsyncStorage');
      console.log('Loading crash data from AsyncStorage...');
      
      // Load all possible error sources
      const [lastCrash, componentError, interceptedFatal] = await Promise.all([
        AsyncStorage.getItem('last_crash_error'),
        AsyncStorage.getItem('component_error_details'),
        AsyncStorage.getItem('intercepted_fatal_error')
      ]);
      console.log('📊 [LOG] Raw data from AsyncStorage:');
      console.log('📊 [LOG] lastCrash:', lastCrash);
      console.log('📊 [LOG] componentError:', componentError);
      console.log('📊 [LOG] interceptedFatal:', interceptedFatal);

      let crashInfo = null;

      console.log('📊 [LOG] Processing crash data');
      // Prioritize most recent crash data
      if (lastCrash) {
        console.log('📊 [LOG] Found lastCrash, parsing JSON');
        crashInfo = JSON.parse(lastCrash);
        crashInfo.source = 'Global Error Handler';
        console.log('Found last_crash_error:', crashInfo);
      } else if (interceptedFatal) {
        console.log('📊 [LOG] Found interceptedFatal, parsing JSON');
        crashInfo = JSON.parse(interceptedFatal);
        crashInfo.source = 'Fatal Exception';
        console.log('Found intercepted_fatal_error:', crashInfo);
      } else if (componentError) {
        console.log('📊 [LOG] Found componentError, parsing JSON');
        crashInfo = JSON.parse(componentError);
        crashInfo.source = 'Component Error';
        console.log('Found component_error_details:', crashInfo);
      } else {
        console.log('📊 [LOG] ❌ No crash data found in any AsyncStorage key');
      }

      if (crashInfo) {
        // Add additional diagnostic info
        crashInfo.loadedAt = new Date().toISOString();
        crashInfo.buildNumber = crashInfo.buildNumber || 81;
      }

      console.log('📊 [LOG] Final crashInfo:', crashInfo);
      setCrashData(crashInfo);
      console.log('📊 [LOG] Setting loading to false');
      setLoading(false);
      
      console.log('Crash data loaded successfully:', !!crashInfo);
    } catch (error) {
      console.log('📊 [LOG] ❌ Exception in loadCrashData');
      console.error('Error loading crash data:', error);
      setLoading(false);
    }
  };

  const clearAllCrashData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('last_crash_error'),
        AsyncStorage.removeItem('component_error_details'),
        AsyncStorage.removeItem('intercepted_fatal_error')
      ]);
      console.log('All crash data cleared');
    } catch (error) {
      console.error('Error clearing crash data:', error);
    }
  };

  const copyAllData = () => {
    const allData = {
      crashData,
      systemInfo: {
        timestamp: new Date().toISOString(),
        buildNumber: 81,
        version: '1.4.0'
      }
    };
    
    const dataText = JSON.stringify(allData, null, 2);
    Clipboard.setString(dataText);
    console.log('Complete crash data copied to clipboard');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#1a365d" />
        <View style={styles.content}>
          <Text style={styles.title}>Loading Crash Report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a365d" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>
            Crash Report - Build 81
          </Text>
          
          {crashData ? (
            <>
              <Text style={styles.subtitle}>
                Critical Error Detected ({crashData.source})
              </Text>

              {/* Basic Error Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔍 Error Details</Text>
                <Text style={styles.detail}>Type: {crashData.errorType || crashData.name || 'Unknown'}</Text>
                <Text style={styles.detail}>Message: {crashData.message || 'No message'}</Text>
                <Text style={styles.detail}>Fatal: {crashData.isFatal ? 'Yes' : 'No'}</Text>
                <Text style={styles.detail}>Time: {crashData.timestamp || 'Unknown'}</Text>
                <Text style={styles.detail}>Platform: {crashData.platform || 'Unknown'}</Text>
                <Text style={styles.detail}>Build: {crashData.buildNumber || 81}</Text>
                {crashData.jsEngine && (
                  <Text style={styles.detail}>JS Engine: {crashData.jsEngine}</Text>
                )}
                {crashData.errorConstructor && (
                  <Text style={styles.detail}>Constructor: {crashData.errorConstructor}</Text>
                )}
              </View>

              {/* Stack Trace */}
              {crashData.stack && (
                <View style={styles.section}>
                  <TouchableOpacity 
                    style={styles.toggleButton}
                    onPress={() => setShowStack(!showStack)}
                  >
                    <Text style={styles.toggleButtonText}>
                      {showStack ? 'Hide' : 'Show'} Stack Trace
                    </Text>
                  </TouchableOpacity>
                  
                  {showStack && (
                    <View style={styles.stackContainer}>
                      <Text style={styles.stackText}>{crashData.stack}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Additional Properties */}
              {crashData.allProperties && Object.keys(crashData.allProperties).length > 0 && (
                <View style={styles.section}>
                  <TouchableOpacity 
                    style={styles.toggleButton}
                    onPress={() => setShowAllProps(!showAllProps)}
                  >
                    <Text style={styles.toggleButtonText}>
                      {showAllProps ? 'Hide' : 'Show'} All Properties ({Object.keys(crashData.allProperties).length})
                    </Text>
                  </TouchableOpacity>
                  
                  {showAllProps && (
                    <View style={styles.propsContainer}>
                      {Object.entries(crashData.allProperties).map(([key, value], index) => (
                        <Text key={index} style={styles.propText}>
                          {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Component Stack (if available) */}
              {crashData.componentStack && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📱 Component Stack</Text>
                  <Text style={styles.stackText}>{crashData.componentStack}</Text>
                </View>
              )}

            </>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>❌ No Crash Data Found</Text>
              <Text style={styles.detail}>
                Error screen displayed but no stored crash data was found.
                This might indicate a different type of crash or data clearing issue.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={async () => {
                await clearAllCrashData();
                if (onRestart) onRestart();
              }}
            >
              <Text style={styles.primaryButtonText}>Clear & Restart</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={copyAllData}
            >
              <Text style={styles.secondaryButtonText}>Copy Crash Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#2d3748',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  detail: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  toggleButton: {
    backgroundColor: '#4a5568',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  toggleButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  stackContainer: {
    backgroundColor: '#1a202c',
    padding: 12,
    borderRadius: 6,
    maxHeight: 300,
  },
  stackText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  propsContainer: {
    backgroundColor: '#1a202c',
    padding: 12,
    borderRadius: 6,
    maxHeight: 250,
  },
  propText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#3182ce',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#2d3748',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a5568',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CrashReportScreen;