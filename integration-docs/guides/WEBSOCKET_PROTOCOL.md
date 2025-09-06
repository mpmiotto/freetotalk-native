# WebSocket Protocol

## Connection

### Endpoint
- **Production:** `wss://freetotalk.replit.app/ws`
- **Development:** `wss://{subdomain}.replit.dev/ws`

### Authentication
WebSocket connections require a `userId` query parameter for authentication:
```
wss://freetotalk.replit.app/ws?userId=130
```

**Authentication Flow:**
1. User must be authenticated via REST API first (session-based)
2. Extract `userId` from session or authentication context
3. Include `userId` in WebSocket connection URL
4. Server validates the connection and stores it for real-time messaging

### Connection Management
- **Auto-cleanup:** Server automatically removes stale connections after 60 seconds of inactivity
- **Heartbeat interval:** Server sends heartbeat every 30 seconds
- **Reconnection:** Client should implement exponential backoff (max 10 attempts)
- **Concurrent connections:** Server closes existing connections when new connection established for same user

## Heartbeat & Keep-Alive

### Client → Server
```json
{
  "type": "ping",
  "userId": 130
}
```

### Server → Client
```json
{
  "type": "pong",
  "timestamp": 1736186313000
}
```

### Server Heartbeat
Server sends periodic heartbeat to detect stale connections:
```json
{
  "type": "heartbeat",
  "timestamp": 1736186313000
}
```

Client should respond with:
```json
{
  "type": "heartbeat_response",
  "userId": 130,
  "timestamp": 1736186313000
}
```

## Message Types

### 1. Initial Status Batch
Sent when client first connects, provides current status of all friends.

**Server → Client:**
```json
{
  "type": "initial_status_batch",
  "friends": [
    {
      "userId": 20,
      "isAvailable": false,
      "availableUntil": null,
      "name": "Zvi Flanders"
    },
    {
      "userId": 135,
      "isAvailable": true,
      "availableUntil": "2025-01-06T18:00:00.000Z",
      "name": "Mike Richards"
    }
  ]
}
```

### 2. Status Update
Real-time availability changes from friends.

**Server → Client:**
```json
{
  "type": "status_update",
  "userId": 135,
  "isAvailable": true,
  "availableUntil": "2025-01-06T18:00:00.000Z",
  "name": "Mike Richards"
}
```

### 3. Friend Connected
Notification when a friend comes online.

**Server → Client:**
```json
{
  "type": "friend_connected",
  "userId": 20,
  "name": "Zvi Flanders"
}
```

### 4. Friend Request Accepted
Notification when someone accepts your friend request.

**Server → Client:**
```json
{
  "type": "friend_request_accepted",
  "userId": 204,
  "name": "John Nader",
  "isAvailable": false,
  "availableUntil": null
}
```

### 5. Friend Request Declined
Notification when someone declines your friend request.

**Server → Client:**
```json
{
  "type": "friend_request_declined",
  "userId": 204,
  "name": "John Nader"
}
```

### 6. New Friend Request
Notification when someone sends you a friend request.

**Server → Client:**
```json
{
  "type": "friend_request_received",
  "fromUserId": 150,
  "fromName": "Jane Smith",
  "requestId": 42
}
```

## Client Implementation Guidelines

### Connection Setup
```javascript
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
const socket = new WebSocket(wsUrl);
```

### Message Handling
```javascript
socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    
    // Don't pass heartbeat/pong to app listeners
    if (data.type === 'heartbeat' || data.type === 'pong') {
      if (data.type === 'heartbeat') {
        // Respond to server heartbeat
        socket.send(JSON.stringify({
          type: 'heartbeat_response',
          userId: userId,
          timestamp: Date.now()
        }));
      }
      return;
    }
    
    // Handle app messages
    handleMessage(data);
  } catch (error) {
    console.error('Error parsing WebSocket message:', error);
  }
};
```

### Ping Implementation
Send regular pings to maintain connection:
```javascript
setInterval(() => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'ping', userId: userId }));
  }
}, 30000); // Every 30 seconds
```

### Reconnection Logic
```javascript
let reconnectAttempts = 0;
const maxAttempts = 10;

socket.onclose = (event) => {
  if (!event.wasClean && reconnectAttempts < maxAttempts) {
    reconnectAttempts++;
    const backoffDelay = Math.min(3000 * Math.pow(2, reconnectAttempts - 1), 30000);
    
    setTimeout(() => {
      setupWebSocket(userId);
    }, backoffDelay);
  }
};
```

## Error Handling

### Connection Errors
- **1006:** Abnormal closure (network issues)
- **1000:** Normal closure
- **1001:** Going away

### Invalid Messages
Server ignores malformed JSON or messages without required fields.

### Authentication Issues
- Missing `userId` parameter results in connection rejection
- Invalid `userId` results in connection termination

## Performance Notes

- **Message batching:** Initial status sent as batch, not individual messages
- **Selective updates:** Only availability changes trigger real-time updates
- **Connection pooling:** Server maintains active connection map for efficient message routing
- **Memory management:** Automatic cleanup of stale connections prevents memory leaks

## Security Considerations

- WebSocket connections require prior REST API authentication
- UserId validation prevents unauthorized access to other users' data
- No sensitive data transmitted over WebSocket (authentication handled via HTTP)
- Connection-level rate limiting prevents abuse