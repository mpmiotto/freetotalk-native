# Compatibility Notes

This document lists important quirks, inconsistencies, and platform-specific considerations that native app developers must handle when integrating with the Free to Talk backend API.

## Authentication Quirks

### 1. Dual Authentication System
The API supports **both session-based and fallback authentication**:

**Session-based (Preferred):**
- Uses HTTP-only cookies (`imfree.sid`)
- Automatic session management
- Required for destructive operations

**Fallback Authentication:**
- Accepts `userId` in query parameters or request body
- Only for non-destructive operations (GET requests)
- Primarily for mobile app compatibility

**Developer Note:** Always try session-based auth first, use fallback only when necessary.

### 2. Cookie Configuration Inconsistencies
Different environments require different cookie settings:

**Development:**
```javascript
{
  sameSite: 'lax',
  secure: false
}
```

**Production:**
```javascript
{
  sameSite: 'none', 
  secure: true
}
```

**WebView Consideration:** Ensure `credentials: 'include'` is set for ALL authenticated requests.

### 3. Version Parameter Requirements
Mobile apps **must** include version parameters in ALL requests:
- `version`: App version (e.g., "1.4.4")
- `platform`: "ios" or "android"
- `build`: Build number (e.g., "161")

**Missing version parameters may result in access denial.**

## API Response Inconsistencies

### 1. Error Response Format Variations
The API returns different error formats depending on the endpoint:

**Standard Format:**
```json
{
  "message": "Human-readable error",
  "error": "ERROR_CODE"
}
```

**Extended Format (development):**
```json
{
  "message": "Human-readable error", 
  "error": "ERROR_CODE",
  "debug": {
    "details": "Additional information"
  }
}
```

**Legacy Format (some endpoints):**
```json
{
  "error": "Error message text"
}
```

### 2. Date/Time Format Inconsistencies
Most endpoints use ISO 8601 format, but some legacy endpoints may return different formats:
- **Standard:** `"2025-01-06T16:58:54.000Z"`
- **Some endpoints:** `"2025-01-06 16:58:54"`

**Recommendation:** Always parse dates defensively.

### 3. Boolean Field Handling
Some endpoints accept both boolean and string representations:
- `isAvailable: true` ✅
- `isAvailable: "true"` ✅ (converted internally)
- `isAvailable: 1` ❌ (not supported)

## Friend Management Quirks

### 1. Friend Relationship ID vs User ID
**Critical distinction:**
- `friendId`: The user ID of your friend (e.g., 135)
- `id`: The relationship ID for managing the friendship (e.g., 294)

**Use relationship ID for:**
- Updating friend details (`PATCH /api/friends/294`)
- Removing friends (`DELETE /api/friends/294`)

**Use friend user ID for:**
- Notifications and WebSocket messages
- Identifying friends in status updates

### 2. Friend Status Values
The `status` field in friend objects can have multiple values:
- `"friend"`: Active friendship
- `"pending"`: Request sent, awaiting acceptance
- `"invited"`: SMS invitation sent to non-user
- `"declined"`: Request was declined

**Note:** Status values are not standardized across all endpoints.

### 3. Display Name vs Name Confusion
Friends have multiple name fields:
- `name`: Friend's actual name from their profile
- `displayName`: Custom name you assigned to them
- `inviteeName`: Name used when inviting non-users

**Priority:** `displayName` > `name` > `inviteeName`

## WebSocket Message Handling

### 1. Message Type Inconsistencies
**Server-to-Client messages use different naming conventions:**

Real-time updates:
- `status_update` (snake_case)
- `friend_connected` (snake_case)
- `initial_status_batch` (snake_case)

Heartbeat messages:
- `heartbeat` (single word)
- `pong` (single word)

**Client-to-Server messages:**
- `ping` (single word)
- `heartbeat_response` (snake_case)

### 2. Connection Management Issues
**Known issues with WebSocket connections:**

1. **Stale Connection Detection:** Server removes connections after 60 seconds of inactivity
2. **Reconnection Logic:** Client must implement exponential backoff (max 10 attempts)
3. **Duplicate Connections:** Server automatically closes existing connections for same user

**Best Practice:** Always check WebSocket readyState before sending messages.

## Platform-Specific Quirks

### 1. iOS Version Control Bug
**Known Issue:** iOS update button may not work due to message type mismatch:
- Server sends: `'OPEN_APP_STORE'`
- iOS expects: `'openStore'`

**Workaround:** Handle both message types in your iOS WebView bridge.

### 2. Android FCM v1 Requirements
Android push notifications require FCM v1 API format:
- Service account key must be present
- Target SDK version 35 (Android 15)
- Specific project ID: `free-to-talk-8e168`

### 3. WebView Cookie Handling
**Platform differences:**
- **iOS:** Requires `sameSite: 'none'` in production
- **Android:** More lenient with cookie policies
- **Both:** Must set `credentials: 'include'` on all fetch requests

## Data Format Quirks

### 1. Phone Number Formatting
The API expects phone numbers in different formats depending on the endpoint:
- **Login/Registration:** Raw format (e.g., "3135854620")
- **SMS sending:** E.164 format (e.g., "+13135854620")
- **Display:** Formatted (e.g., "(313) 585-4620")

**Internal conversion:** Server handles E.164 conversion automatically.

### 2. Friend Array Structures
Different endpoints return friend data in different structures:

**GET /api/friends:**
```json
{
  "friends": [...],
  "incomingRequests": [...]
}
```

**WebSocket initial_status_batch:**
```json
{
  "type": "initial_status_batch", 
  "friends": [...]
}
```

### 3. Scheduled Event Time Zones
**Critical:** All times are stored and returned in UTC. Client must handle timezone conversion.

**Example:**
- User schedules: "3 PM local time"
- API stores: "2025-01-06T20:00:00.000Z" (UTC)
- Client displays: "3:00 PM EST" (converted back)

## Rate Limiting & Performance

### 1. Endpoint-Specific Limits
**No formal rate limiting implemented**, but some endpoints have natural throttling:
- SMS sending: Limited by TextBelt API quotas
- Push notifications: Limited by Expo service
- WebSocket connections: 1 per user maximum

### 2. Request Timing Considerations
**Some operations have timing dependencies:**

1. **Authentication flow:** Must wait for session establishment before making authenticated requests
2. **Availability updates:** May take 1-2 seconds to propagate via WebSocket
3. **Friend invitations:** SMS delivery is asynchronous (not immediate)

## Migration & Backward Compatibility

### 1. Version 1.4.3 → 1.4.4 Changes
**Breaking changes:** None
**New features:**
- Account deletion functionality
- Enhanced admin endpoints
- Improved error messaging

### 2. Legacy Field Support
**Deprecated but still supported:**
- `username` field in login (use `phoneNumber` instead)
- Old invitation system (some endpoints still reference it)

### 3. API Versioning Strategy
**Current approach:** No formal API versioning
**Compatibility:** New fields added without breaking existing clients
**Client strategy:** Ignore unknown fields, provide defaults for missing fields

## Known Issues & Workarounds

### 1. Session Cookie Issues in Development
**Problem:** Cookies may not persist in some development environments
**Workaround:** Use query parameter authentication fallback

### 2. WebSocket Reconnection Race Conditions
**Problem:** Multiple reconnection attempts may create duplicate connections
**Workaround:** Clear existing connection before attempting reconnection

### 3. Push Token Registration Timing
**Problem:** Token registration may fail if called immediately after login
**Workaround:** Add 500ms delay after authentication before registering push tokens

### 4. Friend Status Synchronization
**Problem:** WebSocket status updates may arrive before REST API friend list
**Workaround:** Cache status updates and apply them after friend list loads

## Testing Considerations

### 1. Environment-Specific Behavior
**Development vs Production differences:**
- Different cookie security settings
- Different CORS origins
- Different error verbosity levels

### 2. Mock Data Limitations
**Real vs Test data:**
- SMS verification codes work only with real phone numbers in production
- Push notifications require valid Expo tokens
- WebSocket connections need valid user sessions

### 3. Database State Dependencies
**Test order importance:**
- Friend relationship tests depend on user creation order
- Availability tests may interfere with each other
- Admin endpoints may affect global system state

## Security Considerations

### 1. Authentication Bypass (Development Only)
**Development endpoints** allow authentication bypass:
- `/auth-bypass` - Direct login without verification
- `/api/admin/emergency-login` - Emergency access

**Production:** These endpoints are disabled

### 2. UserId Exposure
**Query parameter authentication exposes user IDs in logs**
- URL parameters are logged by web servers
- Use session-based auth for sensitive operations
- Fallback auth only for read operations

### 3. WebSocket Authentication
**WebSocket connections authenticate via URL parameter**
- Less secure than header-based auth
- UserId is visible in connection logs
- Required due to WebSocket protocol limitations

## Recommended Integration Patterns

### 1. Authentication Flow
```javascript
// 1. Always try session-based first
let user = await getCurrentUser();

// 2. Fall back to explicit auth if needed
if (!user && userId) {
  user = await getCurrentUser(`?userId=${userId}`);
}

// 3. Redirect to login if both fail
if (!user) {
  redirectToLogin();
}
```

### 2. Error Handling
```javascript
try {
  const response = await apiCall();
  return response;
} catch (error) {
  // Handle various error formats
  const message = error.message || error.error || 'Unknown error';
  const code = error.error || error.status || 'UNKNOWN';
  
  handleError(message, code);
}
```

### 3. WebSocket Message Processing
```javascript
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Skip internal messages
  if (['heartbeat', 'pong'].includes(data.type)) {
    return;
  }
  
  // Handle known message types
  switch (data.type) {
    case 'status_update':
    case 'friend_connected':
    case 'initial_status_batch':
      handleFriendUpdate(data);
      break;
    default:
      console.warn('Unknown message type:', data.type);
  }
};
```