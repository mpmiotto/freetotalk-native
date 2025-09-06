# Authentication Guide

## Overview

Free to Talk uses **session-based authentication** with phone number verification. The system supports both SMS and email verification methods with device fingerprinting for enhanced security.

## Authentication Flow

### 1. Phone Number Registration

**Endpoint:** `POST /api/auth/register`

```json
{
  "phoneNumber": "3135854620",
  "name": "John Doe",
  "deviceId": "device123",
  "inviterPhoneNumber": "2485551234"
}
```

**Response (201):**
```json
{
  "id": 130,
  "username": "3135854620",
  "name": "John Doe",
  "phoneNumber": "3135854620",
  "isPhoneVerified": false,
  "isAvailable": false,
  "createdAt": "2025-01-06T16:58:54.000Z"
}
```

### 2. Phone Number Login

**Endpoint:** `POST /api/auth/login`

```json
{
  "phoneNumber": "3135854620",
  "deviceId": "device123"
}
```

**Response (200):**
```json
{
  "id": 130,
  "username": "3135854620",
  "name": "John Doe",
  "phoneNumber": "3135854620",
  "isPhoneVerified": true,
  "isAvailable": false
}
```

### 3. SMS Verification (Primary Method)

**Send Verification Code:**
```
POST /api/auth/send-verification
{
  "phoneNumber": "3135854620",
  "deviceId": "device123"
}
```

**Verify Code:**
```
POST /api/auth/verify-sms
{
  "phoneNumber": "3135854620",
  "deviceId": "device123",
  "verificationCode": "123456"
}
```

### 4. Email Verification (Backup Method)

**Send Email Verification:**
```
POST /api/auth/send-email-verification
{
  "phoneNumber": "3135854620",
  "email": "user@example.com",
  "deviceId": "device123"
}
```

**Verify Email Code:**
```
POST /api/auth/verify-email
{
  "phoneNumber": "3135854620",
  "email": "user@example.com",
  "deviceId": "device123",
  "verificationCode": "123456"
}
```

### 5. Device Verification

**Check Device Status:**
```
POST /api/auth/check-device
{
  "phoneNumber": "3135854620",
  "deviceId": "device123"
}
```

**Response:**
```json
{
  "verified": true,
  "requiresVerification": false,
  "method": "sms"
}
```

## Session Management

### Session Details
- **Type:** Server-side sessions with HTTP-only cookies
- **Cookie Name:** `imfree.sid`
- **Lifetime:** 1 year (31,536,000,000 ms)
- **Security:** 
  - Development: `sameSite: 'lax'`, `secure: false`
  - Production: `sameSite: 'none'`, `secure: true`
- **Storage:** PostgreSQL with `connect-pg-simple`

### Current User Profile

**Endpoint:** `GET /api/users/me`

**Response (200):**
```json
{
  "id": 130,
  "username": "3135854620",
  "name": "Mike",
  "phoneNumber": "3135854620",
  "email": null,
  "photoUrl": null,
  "isAvailable": false,
  "availableUntil": null,
  "lastUpdated": "2025-01-06T16:58:54.000Z",
  "createdAt": "2025-01-06T16:58:54.000Z",
  "isPhoneVerified": true,
  "verifiedDevices": ["device123"]
}
```

### Logout

**Endpoint:** `POST /api/auth/logout`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

## Authentication Helpers

### getAuthenticatedUserId Function

The server uses a secure authentication helper that prioritizes session-based auth:

```javascript
function getAuthenticatedUserId(req, allowFallback = false) {
  // Primary: session-based authentication
  const sessionUserId = req.session?.userId;
  if (sessionUserId) {
    return sessionUserId;
  }

  // Fallback for mobile apps (non-destructive operations only)
  if (allowFallback) {
    const queryUserId = parseInt(req.query.userId, 10);
    const bodyUserId = parseInt(req.body?.userId, 10);
    return queryUserId || bodyUserId || null;
  }

  return null;
}
```

### Destructive Operations Security

For destructive operations (account deletion, data modification), the system:
- **Requires session authentication** (no fallback allowed)
- **Validates session integrity** before proceeding
- **Uses secure cookie settings** for production

## Device Fingerprinting

### Device ID Generation
```javascript
// Example device ID generation
const deviceId = `${platform}_${deviceInfo}_${timestamp}`;
```

### Verified Devices
- Users can have multiple verified devices
- Device verification status stored in `verifiedDevices` array
- Re-verification required for new devices

## Error Responses

### Common Authentication Errors

**401 Unauthorized:**
```json
{
  "message": "Authentication required",
  "error": "UNAUTHORIZED"
}
```

**403 Forbidden:**
```json
{
  "message": "Access denied for this operation",
  "error": "FORBIDDEN"
}
```

**404 User Not Found:**
```json
{
  "message": "User not found with provided phone number",
  "error": "USER_NOT_FOUND"
}
```

**409 Conflict:**
```json
{
  "message": "Phone number already registered",
  "error": "PHONE_EXISTS"
}
```

**422 Verification Failed:**
```json
{
  "message": "Invalid or expired verification code",
  "error": "INVALID_CODE"
}
```

## Integration Examples

### Mobile App Authentication
```javascript
// 1. Check if user exists
const phoneExists = await fetch('/api/auth/phone-exists?phoneNumber=3135854620');

// 2. Register or login
const authResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '3135854620',
    deviceId: getDeviceId()
  }),
  credentials: 'include' // Important for cookies
});

// 3. Get current user
const user = await fetch('/api/users/me', {
  credentials: 'include'
});
```

### WebView Integration
```javascript
// Ensure credentials are included for WebView
const fetchOptions = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
};
```

## Security Best Practices

1. **Always include credentials:** Use `credentials: 'include'` for cookie-based auth
2. **Validate device IDs:** Ensure consistent device identification
3. **Handle session expiry:** Implement proper logout and re-authentication flows
4. **Secure storage:** Never store sensitive data in client-side storage
5. **Version checking:** Include app version in requests for compatibility validation

## Environment Configuration

### Development Settings
```javascript
{
  sameSite: 'lax',
  secure: false,
  trustProxy: false
}
```

### Production Settings
```javascript
{
  sameSite: 'none',
  secure: true,
  trustProxy: true
}
```