# API Integration Guide

## Base URLs

### Production Environment
- **REST API:** `https://freetotalk.replit.app`
- **WebSocket:** `wss://freetotalk.replit.app/ws`

### Development Environment  
- **REST API:** `https://{subdomain}.replit.dev`
- **WebSocket:** `wss://{subdomain}.replit.dev/ws`

## Quick Start

### 1. Setup Dependencies
```javascript
// Required for all API calls
const BASE_URL = 'https://freetotalk.replit.app';

// Standard fetch options for authenticated requests
const authFetchOptions = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
};
```

### 2. Version Compatibility
All mobile apps MUST include version parameters for compatibility checking:

```javascript
const versionParams = new URLSearchParams({
  version: '1.4.4',
  platform: 'ios', // or 'android'
  build: '161'
});

const url = `${BASE_URL}/api/endpoint?${versionParams}`;
```

## Authentication Workflow

### Complete User Onboarding
```javascript
async function authenticateUser(phoneNumber, name, deviceId) {
  try {
    // 1. Check if phone number exists
    const checkResponse = await fetch(
      `${BASE_URL}/api/auth/phone-exists?phoneNumber=${phoneNumber}`,
      authFetchOptions
    );
    const { exists } = await checkResponse.json();

    // 2. Register or Login
    const endpoint = exists ? '/api/auth/login' : '/api/auth/register';
    const payload = exists 
      ? { phoneNumber, deviceId }
      : { phoneNumber, name, deviceId };

    const authResponse = await fetch(`${BASE_URL}${endpoint}`, {
      ...authFetchOptions,
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authResponse.status}`);
    }

    const user = await authResponse.json();
    
    // 3. Check device verification status
    const deviceCheck = await fetch(`${BASE_URL}/api/auth/check-device`, {
      ...authFetchOptions,
      method: 'POST',
      body: JSON.stringify({ phoneNumber, deviceId })
    });
    
    const deviceStatus = await deviceCheck.json();
    
    return {
      user,
      requiresVerification: deviceStatus.requiresVerification,
      verificationMethod: deviceStatus.method
    };

  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}
```

### SMS Verification Flow
```javascript
async function verifyDevice(phoneNumber, deviceId) {
  try {
    // 1. Send verification code
    const sendResponse = await fetch(`${BASE_URL}/api/auth/send-verification`, {
      ...authFetchOptions,
      method: 'POST',
      body: JSON.stringify({ phoneNumber, deviceId })
    });

    if (!sendResponse.ok) {
      throw new Error('Failed to send verification code');
    }

    // 2. Present code input to user and verify
    // This would be handled by your UI
    return true;

  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
}

async function submitVerificationCode(phoneNumber, deviceId, code) {
  try {
    const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify-sms`, {
      ...authFetchOptions,
      method: 'POST',
      body: JSON.stringify({
        phoneNumber,
        deviceId,
        verificationCode: code
      })
    });

    if (!verifyResponse.ok) {
      throw new Error('Invalid verification code');
    }

    return await verifyResponse.json();

  } catch (error) {
    console.error('Code verification error:', error);
    throw error;
  }
}
```

## Core Application Workflows

### 1. Get Current User Profile
```javascript
async function getCurrentUser() {
  try {
    const response = await fetch(`${BASE_URL}/api/users/me`, authFetchOptions);
    
    if (!response.ok) {
      if (response.status === 401) {
        // User needs to re-authenticate
        throw new Error('AUTHENTICATION_REQUIRED');
      }
      throw new Error(`Failed to get user: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
}
```

### 2. Update Availability Status
```javascript
async function updateAvailability(isAvailable, availableUntil = null, notifyFriends = []) {
  try {
    const payload = {
      isAvailable,
      ...(availableUntil && { availableUntil: availableUntil.toISOString() }),
      ...(notifyFriends.length > 0 && { notifyFriends })
    };

    const response = await fetch(`${BASE_URL}/api/users/availability`, {
      ...authFetchOptions,
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to update availability: ${response.status}`);
    }

    const updatedUser = await response.json();
    console.log('Availability updated:', updatedUser.isAvailable);
    
    return updatedUser;
  } catch (error) {
    console.error('Update availability error:', error);
    throw error;
  }
}

// Example: Set available for 2 hours, notify specific friends
await updateAvailability(
  true, 
  new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  [20, 135, 136] // friend IDs to notify
);
```

### 3. Friends Management
```javascript
async function getFriendsList() {
  try {
    const response = await fetch(`${BASE_URL}/api/friends`, authFetchOptions);
    
    if (!response.ok) {
      throw new Error(`Failed to get friends: ${response.status}`);
    }

    const data = await response.json();
    return {
      friends: data.friends || [],
      incomingRequests: data.incomingRequests || []
    };
  } catch (error) {
    console.error('Get friends error:', error);
    throw error;
  }
}

async function inviteFriend(phoneNumber, name) {
  try {
    const response = await fetch(`${BASE_URL}/api/friends/invite`, {
      ...authFetchOptions,
      method: 'POST',
      body: JSON.stringify({ phoneNumber, name })
    });

    if (!response.ok) {
      throw new Error(`Failed to invite friend: ${response.status}`);
    }

    const result = await response.json();
    console.log('Invitation result:', result.message);
    
    return result;
  } catch (error) {
    console.error('Invite friend error:', error);
    throw error;
  }
}

async function removeFriend(friendRelationshipId) {
  try {
    const response = await fetch(`${BASE_URL}/api/friends/${friendRelationshipId}`, {
      ...authFetchOptions,
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to remove friend: ${response.status}`);
    }

    console.log('Friend removed successfully');
    return true;
  } catch (error) {
    console.error('Remove friend error:', error);
    throw error;
  }
}

async function updateFriendDetails(friendId, displayName, photoUrl = null) {
  try {
    const payload = { displayName };
    if (photoUrl) payload.photoUrl = photoUrl;

    const response = await fetch(`${BASE_URL}/api/friends/${friendId}`, {
      ...authFetchOptions,
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to update friend: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Update friend error:', error);
    throw error;
  }
}
```

### 4. Scheduled Events Management
```javascript
async function getScheduledEvents() {
  try {
    const response = await fetch(`${BASE_URL}/api/users/scheduled-events`, authFetchOptions);
    
    if (!response.ok) {
      throw new Error(`Failed to get scheduled events: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get scheduled events error:', error);
    throw error;
  }
}

async function scheduleAvailability(scheduledTime, durationMinutes = 30, friendsToNotify = []) {
  try {
    const payload = {
      eventType: 'availability',
      scheduledTime: scheduledTime.toISOString(),
      durationMinutes,
      friendsToNotify: friendsToNotify.map(id => id.toString())
    };

    const response = await fetch(`${BASE_URL}/api/users/scheduled-events`, {
      ...authFetchOptions,
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule event: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Schedule event error:', error);
    throw error;
  }
}

async function cancelScheduledEvent(eventId) {
  try {
    const response = await fetch(`${BASE_URL}/api/users/scheduled-events/${eventId}`, {
      ...authFetchOptions,
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel event: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Cancel event error:', error);
    throw error;
  }
}
```

### 5. Push Notifications
```javascript
async function registerPushToken(expoPushToken, deviceId, platform) {
  try {
    const response = await fetch(`${BASE_URL}/api/push/register`, {
      ...authFetchOptions,
      method: 'POST',
      body: JSON.stringify({
        token: expoPushToken,
        deviceId,
        platform // 'ios' or 'android'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to register push token: ${response.status}`);
    }

    console.log('Push token registered successfully');
    return true;
  } catch (error) {
    console.error('Push token registration error:', error);
    throw error;
  }
}

async function unregisterPushToken(expoPushToken, deviceId) {
  try {
    const response = await fetch(`${BASE_URL}/api/push/unregister`, {
      ...authFetchOptions,
      method: 'POST',
      body: JSON.stringify({
        token: expoPushToken,
        deviceId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to unregister push token: ${response.status}`);
    }

    console.log('Push token unregistered successfully');
    return true;
  } catch (error) {
    console.error('Push token unregistration error:', error);
    throw error;
  }
}
```

## WebSocket Integration

### Connection Setup
```javascript
class FreeToTalkWebSocket {
  constructor(userId, baseUrl = 'freetotalk.replit.app') {
    this.userId = userId;
    this.baseUrl = baseUrl;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.pingInterval = null;
    this.messageListeners = [];
  }

  connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${this.baseUrl}/ws?userId=${this.userId}`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startPingInterval();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected');
      this.stopPingInterval();
      
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(data) {
    // Handle heartbeat
    if (data.type === 'heartbeat') {
      this.socket.send(JSON.stringify({
        type: 'heartbeat_response',
        userId: this.userId,
        timestamp: Date.now()
      }));
      return;
    }

    // Skip pong messages
    if (data.type === 'pong') {
      return;
    }

    // Notify all listeners
    this.messageListeners.forEach(listener => listener(data));
  }

  addMessageListener(listener) {
    this.messageListeners.push(listener);
  }

  removeMessageListener(listener) {
    this.messageListeners = this.messageListeners.filter(l => l !== listener);
  }

  startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping', userId: this.userId }));
      }
    }, 30000);
  }

  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  reconnect() {
    this.reconnectAttempts++;
    const backoffDelay = Math.min(3000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    setTimeout(() => {
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, backoffDelay);
  }

  disconnect() {
    this.stopPingInterval();
    if (this.socket) {
      this.socket.close();
    }
  }
}

// Usage
const websocket = new FreeToTalkWebSocket(userId);
websocket.addMessageListener((data) => {
  switch (data.type) {
    case 'initial_status_batch':
      updateFriendsStatus(data.friends);
      break;
    case 'status_update':
      updateFriendAvailability(data.userId, data.isAvailable, data.availableUntil);
      break;
    case 'friend_request_accepted':
      showNotification(`${data.name} accepted your friend request!`);
      break;
    // Handle other message types...
  }
});
websocket.connect();
```

## System Information

### Version Check
```javascript
async function getSystemVersion() {
  try {
    const response = await fetch(`${BASE_URL}/api/system/version`, authFetchOptions);
    
    if (!response.ok) {
      throw new Error(`Failed to get version: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get version error:', error);
    throw error;
  }
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "debug": {
    "additional": "debug information"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Access denied
- `USER_NOT_FOUND` (404): User doesn't exist
- `PHONE_EXISTS` (409): Phone number already registered
- `INVALID_CODE` (422): Invalid verification code
- `VALIDATION_ERROR` (400): Request validation failed

### Error Handling Best Practices
```javascript
async function handleApiCall(apiFunction) {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.message === 'AUTHENTICATION_REQUIRED') {
      // Redirect to login screen
      showLoginScreen();
      return null;
    }
    
    // Log error and show user-friendly message
    console.error('API Error:', error);
    showErrorMessage('Something went wrong. Please try again.');
    throw error;
  }
}
```

## Performance Optimization

### Request Batching
```javascript
// Batch multiple API calls efficiently
async function initializeApp(userId) {
  try {
    const [user, friends, scheduledEvents, systemVersion] = await Promise.all([
      getCurrentUser(),
      getFriendsList(),
      getScheduledEvents(),
      getSystemVersion()
    ]);

    return { user, friends, scheduledEvents, systemVersion };
  } catch (error) {
    console.error('App initialization error:', error);
    throw error;
  }
}
```

### Caching Strategy
```javascript
class ApiCache {
  constructor(ttlMinutes = 5) {
    this.cache = new Map();
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

const apiCache = new ApiCache(5); // 5 minute TTL

async function getCachedUser() {
  const cached = apiCache.get('current_user');
  if (cached) return cached;
  
  const user = await getCurrentUser();
  apiCache.set('current_user', user);
  return user;
}
```

## Migration Notes

### From Previous Versions
- **Version 1.4.3 → 1.4.4:** No breaking changes
- **Deprecated endpoints:** None currently
- **New features:** Account deletion, enhanced admin functionality

### Platform-Specific Considerations
- **iOS:** Requires minimum version checking for App Store compliance
- **Android:** FCM v1 API support for push notifications
- **WebView:** Ensure `credentials: 'include'` for all authenticated requests