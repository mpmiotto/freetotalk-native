import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function DebugOverlay({ webViewRef, visible, onClose, debugStats = {}, debugLogs = [] }) {
  const [logs, setLogs] = useState(debugLogs || []);
  const [stats, setStats] = useState({
    lastPollTime: 'Never',
    lastPollSuccess: false,
    totalPolls: 0,
    successfulPolls: 0,
    lastError: 'None',
    wsStatus: 'Unknown',
    lastWSMessage: 'None',
    refreshCount: 0,
    ...debugStats
  });

  // Poll for debug stats
  useEffect(() => {
    if (!visible) return;
    
    const intervalId = setInterval(() => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          (function() {
            const stats = {
              lastPollTime: window.lastPollTime ? new Date(window.lastPollTime).toLocaleTimeString() : 'Never',
              lastPollSuccess: window.lastPollSuccess || false,
              totalPolls: window.totalPolls || 0,
              successfulPolls: window.successfulPolls || 0,
              lastError: window.lastPollError || 'None',
              wsStatus: window.activeSocket ? 
                (window.activeSocket.readyState === 0 ? 'Connecting' : 
                 window.activeSocket.readyState === 1 ? 'Open' : 
                 window.activeSocket.readyState === 2 ? 'Closing' : 'Closed') : 'None',
              lastWSMessage: window.lastWSMessage || 'None',
              isPollingActive: window.isPollingActive || false,
              refreshCount: window.refreshCount || 0
            };
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'debug-stats',
              stats: stats
            }));
            
            // Return true to avoid affecting the WebView
            return true;
          })();
        `);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [visible, webViewRef]);

  // Add a message handler in the parent component to capture the stats
  // Add this to the handleMessage function:
  // if (data.type === 'debug-stats') {
  //   setStats(data.stats);
  // }

  const triggerManualPolling = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        console.log('Manual debugging poll triggered');
        if (typeof refreshFriendData === 'function') {
          refreshFriendData();
        }
        true;
      `);
      
      // Add to logs
      setLogs(prevLogs => [
        { message: 'Manual polling triggered', timestamp: new Date().toLocaleTimeString() },
        ...prevLogs.slice(0, 19) // Keep last 20 logs
      ]);
    }
  };

  const resetPollingStats = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        window.totalPolls = 0;
        window.successfulPolls = 0;
        window.lastPollError = null;
        window.refreshCount = 0;
        console.log('Polling stats reset');
        true;
      `);
      
      // Update logs
      setLogs(prevLogs => [
        { message: 'Polling stats reset', timestamp: new Date().toLocaleTimeString() },
        ...prevLogs.slice(0, 19)
      ]);
    }
  };
  
  // Function to force a direct style update to friend cards
  const forceStyleUpdate = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        (function() {
          // Direct DOM update - brute force approach
          console.log('Forcing direct style update to friend status elements');
          
          // Get the latest friend data if available
          const friendData = window.latestFriends || [];
          
          if (friendData.length === 0) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'debug-log',
              message: 'No friend data available to use for updates'
            }));
            return true;
          }
          
          // Let's try a variety of approaches to update the UI
          
          // 1. Try using most specific selectors first
          let updated = 0;
          let skipped = 0;
          
          // Create a more detailed log for debugging
          const log = [];
          
          // Try using our improved updateCardForFriend function if available
          if (typeof updateCardForFriend === 'function') {
            log.push('Using enhanced updateCardForFriend function for updates');
            
            // Find potential friend elements with any approach possible
            const allElements = document.querySelectorAll('*');
            const potentialCards = [];
            
            // Look for any element that might contain friend information
            allElements.forEach(el => {
              const text = el.textContent || '';
              
              // Look for elements that might contain friend names
              if (friendData.some(friend => friend.name && text.includes(friend.name))) {
                potentialCards.push(el);
              }
            });
            
            log.push(\`Found \${potentialCards.length} potential elements containing friend names\`);
            
            // Try to update each potential card
            potentialCards.forEach(card => {
              // Find which friend this might be
              const friendName = card.textContent || '';
              const matchedFriend = friendData.find(f => f.name && friendName.includes(f.name));
              
              if (matchedFriend) {
                try {
                  // Use the existing updateCardForFriend function to do the hard work
                  updateCardForFriend(card, matchedFriend);
                  updated++;
                  log.push(\`Updated friend: \${matchedFriend.name} to \${matchedFriend.isAvailable ? 'available' : 'unavailable'}\`);
                } catch (e) {
                  skipped++;
                  log.push(\`Error updating \${matchedFriend.name}: \${e.message}\`);
                }
              }
            });
          } else {
            log.push('Enhanced updater function not available, using direct DOM manipulation');
            
            // Find potential friend elements with any approach possible
            const allElements = document.querySelectorAll('*');
            const potentialCards = [];
            
            // Look for any element that might contain friend information
            allElements.forEach(el => {
              const text = el.textContent || '';
              
              // Look for elements that might contain friend names
              if (friendData.some(friend => friend.name && text.includes(friend.name))) {
                potentialCards.push(el);
              }
            });
            
            log.push(\`Found \${potentialCards.length} potential elements containing friend names\`);
            
            // Try to update each potential card
            potentialCards.forEach(card => {
              // Find which friend this might be
              const friendName = card.textContent || '';
              const matchedFriend = friendData.find(f => f.name && friendName.includes(f.name));
              
              if (matchedFriend) {
                // Look for any status indicators (circular elements, small colored divs, etc.)
                const statusElements = Array.from(card.querySelectorAll('*')).filter(el => {
                  const style = window.getComputedStyle(el);
                  return (style.borderRadius === '50%' || style.borderRadius === '9999px' || 
                         style.backgroundColor.includes('rgb')) && 
                         (el.offsetWidth < 25 && el.offsetHeight < 25);
                });
                
                if (statusElements.length > 0) {
                  // Update the first potential status element
                  const statusEl = statusElements[0];
                  const isAvailable = matchedFriend.isAvailable;
                  
                  // Force update with inline style
                  statusEl.style.backgroundColor = isAvailable ? '#4caf50' : '#f44336';
                  statusEl.style.borderColor = isAvailable ? '#4caf50' : '#f44336';
                  
                  // Also try to update classes
                  if (isAvailable) {
                    statusEl.classList.add('available');
                    statusEl.classList.remove('unavailable');
                  } else {
                    statusEl.classList.add('unavailable');
                    statusEl.classList.remove('available');
                  }
                  
                  updated++;
                  log.push(\`Updated friend: \${matchedFriend.name} to \${isAvailable ? 'available' : 'unavailable'}\`);
                } else {
                  skipped++;
                }
              }
            });
          }
          
          // Also try a specialized technique for status indicators
          const statusIndicators = [...document.querySelectorAll('.status-indicator, .availability-status, .friend-status')];
          log.push(\`Found \${statusIndicators.length} dedicated status indicators\`);
          
          // Try to update each one individually
          if (statusIndicators.length > 0) {
            // Attempt to find a parent element with user/friend identification
            statusIndicators.forEach(indicator => {
              // Look for parent elements that might contain friend info
              let parent = indicator.parentElement;
              let depth = 0;
              let friendId = null;
              let friendName = null;
              
              // Go up the tree looking for friend identification
              while (parent && depth < 5) {
                // Try to find any ID attributes
                const possibleId = parent.getAttribute('data-friend-id') || 
                                  parent.getAttribute('data-user-id') || 
                                  parent.getAttribute('id');
                
                // Check for a name in text content
                const text = parent.textContent || '';
                const matchingFriend = friendData.find(f => f.name && text.includes(f.name));
                
                if (possibleId && !isNaN(parseInt(possibleId))) {
                  friendId = parseInt(possibleId);
                  break;
                } else if (matchingFriend) {
                  friendName = matchingFriend.name;
                  friendId = matchingFriend.userId || matchingFriend.id;
                  break;
                }
                
                parent = parent.parentElement;
                depth++;
              }
              
              // If we found a match, update the indicator
              if (friendId || friendName) {
                const matchingFriend = friendData.find(f => 
                  (friendId && ((f.userId && f.userId.toString() === friendId.toString()) || 
                               (f.id && f.id.toString() === friendId.toString()))) ||
                  (friendName && f.name === friendName)
                );
                
                if (matchingFriend) {
                  const isAvailable = matchingFriend.isAvailable;
                  
                  // Force style update
                  indicator.style.backgroundColor = isAvailable ? '#4caf50' : '#f44336';
                  
                  // Update classes too
                  if (isAvailable) {
                    indicator.classList.add('available');
                    indicator.classList.remove('unavailable');
                  } else {
                    indicator.classList.remove('available');
                    indicator.classList.add('unavailable');
                  }
                  
                  updated++;
                  log.push(\`Updated indicator for friend ID \${friendId || 'unknown'}: \${matchingFriend.name || 'Unnamed friend'}\`);
                }
              }
            });
          }
          
          // Report results
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'debug-log',
            message: \`Updated \${updated} friend cards, skipped \${skipped} cards\`
          }));
          
          // Also send detailed log
          if (log.length > 0) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'debug-dom',
              log: log
            }));
          }
          
          return true;
        })();
      `);
      
      // Update logs
      setLogs(prevLogs => [
        { message: 'Forced style update to friend cards', timestamp: new Date().toLocaleTimeString() },
        ...prevLogs.slice(0, 19)
      ]);
    }
  };

  const checkDOMStructure = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        (function() {
          const log = [];
          
          // Look for all possible friend cards with multiple selectors
          const friendCardSelectors = [
            '.friend-card', '.availability-card', '[data-type="friend-card"]',
            '[data-friend-id]', '[data-user-id]', '[class*="friendCard"]', 
            '[class*="FriendCard"]', '[class*="friend-item"]', '[class*="friendItem"]'
          ];
          
          // Try each selector
          let allFriendCards = [];
          friendCardSelectors.forEach(selector => {
            const cards = document.querySelectorAll(selector);
            if (cards.length > 0) {
              log.push(\`Found \${cards.length} elements with selector: \${selector}\`);
              allFriendCards.push(...Array.from(cards));
            }
          });
          
          // Remove duplicates
          const uniqueCards = [...new Set(allFriendCards)];
          log.push(\`Found \${uniqueCards.length} unique friend cards\`);
          
          // Check for time elements with multiple selectors
          const timeSelectors = [
            '.time-remaining', '.availability-time', '.remaining-time', 
            '[data-end-time]', '[class*="time"]', '[class*="Time"]',
            '[class*="duration"]', '[class*="Duration"]'
          ];
          
          let allTimeElements = [];
          timeSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              log.push(\`Found \${elements.length} time elements with selector: \${selector}\`);
              allTimeElements.push(...Array.from(elements));
            }
          });
          
          const uniqueTimeElements = [...new Set(allTimeElements)];
          log.push(\`Found \${uniqueTimeElements.length} unique time elements\`);
          
          // Check for status indicators with multiple selectors
          const statusSelectors = [
            '.status-indicator', '.availability-status', '.friend-status',
            '[class*="status"]', '[class*="Status"]', '[class*="indicator"]',
            '[class*="Indicator"]', '[class*="circle"]', '[class*="Circle"]'
          ];
          
          let allStatusElements = [];
          statusSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              log.push(\`Found \${elements.length} status indicators with selector: \${selector}\`);
              allStatusElements.push(...Array.from(elements));
            }
          });
          
          const uniqueStatusElements = [...new Set(allStatusElements)];
          log.push(\`Found \${uniqueStatusElements.length} unique status indicators\`);
          
          // Try wider selectors to find any friend-like cards
          const possibleListItems = document.querySelectorAll('li, .item, [class*="item"], [class*="card"], [class*="Card"]');
          log.push(\`Found \${possibleListItems.length} total list items\`);
          
          // Check for circular elements that might be status indicators
          const possibleCircles = Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            return (style.borderRadius === '50%' || style.borderRadius === '9999px') && 
                   (el.offsetWidth < 20 && el.offsetHeight < 20);
          });
          
          log.push(\`Found \${possibleCircles.length} circular elements that could be status indicators\`);
          
          // Now let's get specific DOM details for one friend card if possible
          if (uniqueCards.length > 0) {
            const sampleCard = uniqueCards[0];
            log.push('Sample friend card details:');
            log.push(\`Tag: \${sampleCard.tagName}\`);
            log.push(\`Classes: \${sampleCard.className}\`);
            log.push(\`Attributes: \${Array.from(sampleCard.attributes).map(attr => \`\${attr.name}="\${attr.value}"\`).join(', ')}\`);
            log.push(\`Children: \${sampleCard.children.length}\`);
            log.push(\`Content: \${sampleCard.textContent.substring(0, 50)}...\`);
          }
          
          // Get friend data from WebSocket
          if (window.lastWSData) {
            log.push('Last WebSocket friend data:');
            try {
              const friendData = window.lastWSData.friends || [];
              friendData.forEach(friend => {
                log.push(\`Friend ID \${friend.userId}: \${friend.name} - \${friend.isAvailable ? 'Available' : 'Unavailable'}\`);
              });
            } catch (e) {
              log.push(\`Error parsing WebSocket data: \${e.message}\`);
            }
          }
          
          // Send logs back to native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'debug-dom',
            log: log
          }));
          
          return true;
        })();
      `);
    }
  };

  if (!visible) return null;
  
  return (
    <View style={styles.overlay}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Console</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Polling Stats:</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Last Poll:</Text>
          <Text style={styles.statValue}>{stats.lastPollTime}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Success:</Text>
          <Text style={styles.statValue}>{stats.lastPollSuccess ? 'Yes ✓' : 'No ✗'}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Total Polls:</Text>
          <Text style={styles.statValue}>{stats.totalPolls}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Successful:</Text>
          <Text style={styles.statValue}>{stats.successfulPolls}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Refreshes:</Text>
          <Text style={styles.statValue}>{stats.refreshCount}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Last Error:</Text>
          <Text style={styles.statValue}>{stats.lastError}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>WebSocket:</Text>
          <Text style={styles.statValue}>{stats.wsStatus}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Polling:</Text>
          <Text style={styles.statValue}>{stats.isPollingActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={triggerManualPolling}>
          <Text style={styles.actionButtonText}>Force Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={resetPollingStats}>
          <Text style={styles.actionButtonText}>Reset Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={checkDOMStructure}>
          <Text style={styles.actionButtonText}>Check DOM</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={forceStyleUpdate}>
          <Text style={styles.actionButtonText}>Force Update</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Activity Log:</Text>
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logEntry}>
            <Text style={styles.logTime}>[{log.timestamp}]</Text> {log.message}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 10,
    maxHeight: '80%',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomColor: '#444',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#0af',
    fontSize: 16,
  },
  statsContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0af',
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  statLabel: {
    color: '#aaa',
    width: 100,
  },
  statValue: {
    color: '#fff',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  actionButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#0af',
  },
  actionButtonText: {
    color: '#0af',
    fontSize: 14,
  },
  logContainer: {
    maxHeight: 200,
    marginTop: 5,
  },
  logEntry: {
    color: '#eee',
    fontSize: 12,
    marginBottom: 3,
  },
  logTime: {
    color: '#0af',
  },
});