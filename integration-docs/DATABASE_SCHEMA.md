# Database Schema Documentation

## Overview

Free to Talk uses PostgreSQL as its primary database with Drizzle ORM for type-safe database operations. All schemas are defined in `shared/schema.ts` and use Drizzle's declarative syntax.

## Core Tables

### Users Table
Primary user accounts and profile information.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  phone_number TEXT,
  email TEXT,
  photo_url TEXT,
  is_available BOOLEAN DEFAULT false,
  available_until TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_phone_verified BOOLEAN DEFAULT false,
  verified_devices JSONB DEFAULT '[]'
);
```

**Key Fields:**
- `username`: Phone number used as unique identifier
- `password`: Hashed password (bcrypt)
- `is_available`: Current availability status
- `available_until`: Availability expiration timestamp
- `verified_devices`: Array of verified device IDs

### Friends Table
Friend relationships between users.

```sql
CREATE TABLE friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  friend_id INTEGER NOT NULL REFERENCES users(id),
  display_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Relationship Model:**
- Each friendship creates a record in both directions
- `user_id`: The user who owns this friend relationship
- `friend_id`: The user being friended
- `display_name`: Custom name assigned by the owner

### Invitations Table
Manages friend invitations and non-user invites.

```sql
CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  inviter_id INTEGER NOT NULL REFERENCES users(id),
  invitee_id INTEGER REFERENCES users(id),
  invitee_phone_number TEXT NOT NULL,
  invitee_name TEXT,
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Invitation Flow:**
1. User sends invitation with phone number and name
2. If recipient is registered user, `invitee_id` is populated
3. If not registered, SMS is sent with invitation link
4. Upon acceptance, friend relationship is created

### Scheduled Events Table
Future availability scheduling and recurring events.

```sql
CREATE TABLE scheduled_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  data JSONB,
  completed BOOLEAN DEFAULT false,
  cancelled BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  end_time TIMESTAMP WITH TIME ZONE,
  is_recurring BOOLEAN DEFAULT false,
  friends_to_notify TEXT[],
  day_of_week TEXT,
  original_schedule_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Event Types:**
- `"availability"`: Scheduled availability periods
- Future: Could support other event types

**Recurring Events:**
- `is_recurring`: Whether event repeats
- `day_of_week`: For weekly recurring events
- `friends_to_notify`: Array of friend IDs to notify

## Authentication & Security Tables

### SMS Verifications Table
SMS-based device verification codes.

```sql
CREATE TABLE sms_verifications (
  id SERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  device_id TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Verification Flow:**
1. User requests verification code
2. 6-digit code sent via SMS
3. Code expires after 10 minutes
4. Once used, `is_used` set to true

### Device Verifications Table
Track verified devices per phone number.

```sql
CREATE TABLE device_verifications (
  id SERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  device_id TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Multi-Device Support:**
- Users can verify multiple devices
- Each device-phone combination tracked separately
- Used for enhanced security

### Email Verifications Table
Backup email verification method.

```sql
CREATE TABLE email_verifications (
  id SERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  device_id TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fallback Method:**
- Used when SMS verification fails
- Same code mechanism as SMS
- Links email to phone number for verification

## Push Notifications

### Device Tokens Table
Expo push notification tokens for mobile devices.

```sql
CREATE TABLE device_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Token Management:**
- Each device can register one active token
- Tokens updated when app reinstalled or token changes
- Server uses tokens for targeted push notifications

## System & Admin Tables

### System Settings Table
Configurable system-wide settings.

```sql
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);
```

**Common Settings:**
- `MIN_IOS_VERSION`: Minimum required iOS app version
- `MIN_ANDROID_VERSION`: Minimum required Android app version
- `app_invite_message`: SMS invitation message template
- `PRO_TIP_MESSAGE`: Tips shown in app

### SMS Logs Table
Audit trail for all SMS messages sent.

```sql
CREATE TABLE sms_logs (
  id SERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  result JSONB,
  error_details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**SMS Tracking:**
- `status`: "success", "error", "pending"
- `event_type`: "verification", "invitation", "notification"
- `provider`: "textbelt" (current SMS provider)
- `result`: Full API response from SMS provider

## Advanced Features

### Selective Visibility Table
Fine-grained availability visibility control.

```sql
CREATE TABLE selective_visibility (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  visible_to_friend_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);
```

**Privacy Control:**
- Users can show availability to specific friends only
- Temporary visibility rules with expiration
- Overrides default "show to all friends" behavior

### Notifications Table
In-app notification history.

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notification Types:**
- `"status_change"`: Friend availability updates
- `"friend_request"`: New friend requests
- `"system"`: System announcements

### Sessions Table (Managed by connect-pg-simple)
Server-side session storage.

```sql
CREATE TABLE session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
```

**Session Management:**
- HTTP-only session cookies
- 1-year session lifetime
- Automatic cleanup of expired sessions

## Data Types & Constraints

### Phone Number Format
- **Storage:** Raw format (e.g., "3135854620")
- **Display:** Formatted (e.g., "(313) 585-4620")
- **SMS:** E.164 format (e.g., "+13135854620")

### Timestamp Handling
- **Storage:** All timestamps in UTC with timezone info
- **Client:** Convert to local timezone for display
- **Format:** ISO 8601 (e.g., "2025-01-06T20:00:00.000Z")

### JSONB Fields
- `users.verified_devices`: Array of device ID strings
- `scheduled_events.data`: Event-specific data
- `sms_logs.result`: SMS provider API responses
- `session.sess`: Session data from express-session

## Indexes & Performance

### Primary Indexes
All tables have auto-generated primary key indexes on `id` columns.

### Recommended Indexes
```sql
-- User lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone_number ON users(phone_number);

-- Friend relationships
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);

-- Verification lookups
CREATE INDEX idx_sms_verifications_phone_device ON sms_verifications(phone_number, device_id);

-- Session management
CREATE INDEX idx_session_expire ON session(expire);

-- Push tokens
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX idx_device_tokens_device_id ON device_tokens(device_id);
```

## Migration Strategy

### Current Approach
- **No formal migrations:** Schema changes pushed directly
- **Command:** `npm run db:push --force`
- **Safety:** Drizzle generates safe SQL when possible

### Data Safety Rules
1. **Never change ID column types** (serial ↔ varchar breaks everything)
2. **Add columns only** (removing columns loses data)
3. **Use nullable fields** for new optional columns
4. **Test in development** before pushing to production

### Schema Evolution
```typescript
// Safe: Adding new optional fields
export const users = pgTable('users', {
  // existing fields...
  newOptionalField: text('new_optional_field'), // nullable by default
});

// Unsafe: Changing ID types
export const users = pgTable('users', {
  id: varchar('id').primaryKey(), // ❌ Don't change from serial
});
```

## Backup & Recovery

### Automated Backups
- **Frequency:** Daily automatic backups by Replit/Neon
- **Retention:** 7 days of point-in-time recovery
- **Location:** Managed by database provider

### Manual Backup
```bash
# Export schema and data
pg_dump $DATABASE_URL > backup.sql

# Schema only
pg_dump --schema-only $DATABASE_URL > schema.sql

# Data only
pg_dump --data-only $DATABASE_URL > data.sql
```

### Disaster Recovery
1. **Database corruption:** Restore from latest backup
2. **Schema issues:** Revert schema changes via git
3. **Data loss:** Point-in-time recovery up to 7 days

## Development Guidelines

### Schema Changes
1. **Update Drizzle schema** in `shared/schema.ts`
2. **Test locally** with development database
3. **Push changes** using `npm run db:push --force`
4. **Verify in production** that changes applied correctly

### Type Safety
All database operations use Drizzle's type-safe APIs:
```typescript
// Type-safe inserts
const newUser = await db.insert(users).values({
  username: "1234567890",
  name: "John Doe",
  password: hashedPassword
});

// Type-safe queries
const user = await db.select().from(users).where(eq(users.id, userId));
```

### Connection Management
- **Development:** Direct PostgreSQL connection
- **Production:** Connection pooling via Neon
- **Connection string:** Stored in `DATABASE_URL` environment variable