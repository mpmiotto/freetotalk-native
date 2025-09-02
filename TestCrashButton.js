import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TestCrashButton = ({ onCrashSimulated }) => {
  const simulateCrash = async () => {
    console.log('🧪 [LOG] TestCrashButton.simulateCrash function called');
    console.log('Simulating crash for testing...');
    
    console.log('🧪 [LOG] Creating test crash data object');
    // Create test crash data
    const testCrashData = {
      message: 'Test SIGABRT crash simulation',
      name: 'TestError',
      isFatal: true,
      timestamp: new Date().toISOString(),
      errorType: 'SIMULATED_CRASH',
      buildNumber: 82,
      errorConstructor: 'TestError',
      stack: `TestError: Test SIGABRT crash simulation
    at simulateCrash (TestCrashButton.js:12:0)
    at onPress (TestCrashButton.js:25:0)
    at React Native Bridge
    at ExceptionsManagerQueue`,
      allProperties: {
        message: 'Test SIGABRT crash simulation',
        name: 'TestError',
        stack: 'TestError: Test SIGABRT crash simulation...',
        simulatedCrash: true
      },
      platform: 'ios',
      jsEngine: 'jsc'
    };

    try {
      console.log('🧪 [LOG] About to store test crash data to AsyncStorage');
      console.log('🧪 [LOG] Test data to store:', JSON.stringify(testCrashData, null, 2));
      
      // Store crash data to all possible keys
      await Promise.all([
        AsyncStorage.setItem('last_crash_error', JSON.stringify(testCrashData)),
        AsyncStorage.setItem('component_error_details', JSON.stringify({
          ...testCrashData,
          source: 'Component Error',
          componentStack: '    in TestCrashButton\n    in App\n    in ErrorBoundary'
        })),
        AsyncStorage.setItem('intercepted_fatal_error', JSON.stringify({
          ...testCrashData,
          source: 'Fatal Exception',
          interceptedAt: new Date().toISOString()
        }))
      ]);
      
      console.log('🧪 [LOG] ✅ Test crash data stored successfully to AsyncStorage');
      console.log('Test crash data stored successfully');
      
      console.log('🧪 [LOG] About to call onCrashSimulated callback');
      // Notify parent component
      if (onCrashSimulated) {
        console.log('🧪 [LOG] Calling onCrashSimulated callback function');
        onCrashSimulated();
      } else {
        console.log('🧪 [LOG] ❌ No onCrashSimulated callback provided');
      }
      
    } catch (error) {
      console.log('🧪 [LOG] ❌ Exception while storing test crash data');
      console.error('Failed to store test crash data:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={simulateCrash}>
      <Text style={styles.buttonText}>TEST CRASH SCREEN</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TestCrashButton;