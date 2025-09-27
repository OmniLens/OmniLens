# User Management API

With multi-user support now implemented, you can access all user information and statistics through both direct database functions and API endpoints.

## 🎯 **Available Functions**

### Database Functions (lib/db-storage.ts)

```typescript
// Get all user IDs
const userIds = await getAllUserIds();
// Returns: ['user-id-1', 'user-id-2', ...]

// Get all users with basic info
const users = await getAllUsers();
// Returns: Array of User objects with id, name, email, etc.

// Get specific user by ID
const user = await getUserById('user-id');
// Returns: User object or null

// Get user statistics
const stats = await getUserStats('user-id');
// Returns: { repositoryCount: 5, workflowCount: 12, lastActivity: '2024-01-15T10:30:00Z' }

// Get all users with their statistics
const usersWithStats = await getAllUsersWithStats();
// Returns: Array of User objects with repositoryCount, workflowCount, lastActivity
```

### API Endpoints

#### 1. Get All User IDs
```bash
GET /api/admin/user-ids
```
**Response:**
```json
{
  "userIds": ["user-id-1", "user-id-2"],
  "count": 2,
  "message": "Found 2 users"
}
```

#### 2. Get All Users
```bash
GET /api/admin/users
```
**Response:**
```json
{
  "users": [
    {
      "id": "user-id-1",
      "name": "John Doe",
      "email": "john@example.com",
      "emailVerified": true,
      "image": "https://avatar.url",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "githubId": "12345",
      "avatarUrl": "https://github-avatar.url"
    }
  ]
}
```

#### 3. Get Users with Statistics
```bash
GET /api/admin/users?includeStats=true
```
**Response:**
```json
{
  "users": [
    {
      "id": "user-id-1",
      "name": "John Doe",
      "email": "john@example.com",
      "repositoryCount": 5,
      "workflowCount": 12,
      "lastActivity": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 4. Get Specific User
```bash
GET /api/admin/users?userId=user-id-1
```
**Response:**
```json
{
  "user": {
    "id": "user-id-1",
    "name": "John Doe",
    "email": "john@example.com",
    // ... other user fields
  }
}
```

## 🧪 **Testing**

Run the user management test to see all available users and their statistics:

```bash
bun run test:users
```

This will show you:
- All user IDs in the system
- User basic information (name, email, etc.)
- User statistics (repository count, workflow count, last activity)
- API endpoint testing

## 📊 **Current System Status**

Based on the test results, your system currently has:

- **2 Users** registered
- **User 1**: Lee Nel (nel.lee@icloud.com) - 0 repos, 0 workflows
- **User 2**: Christopher Zeuch (chriszeuch.cz@gmail.com) - 2 repos, 11 workflows

## 🔒 **Security Notes**

- All API endpoints require authentication (`withAuth` middleware)
- Users can only access their own data through regular endpoints
- Admin endpoints provide system-wide user information
- Consider implementing role-based access control for production use

## 🚀 **Usage Examples**

### In Your Application Code

```typescript
import { getAllUserIds, getAllUsersWithStats } from '@/lib/db-storage';

// Get all user IDs for processing
const userIds = await getAllUserIds();
console.log('System has', userIds.length, 'users');

// Get user statistics for analytics
const usersWithStats = await getAllUsersWithStats();
usersWithStats.forEach(user => {
  console.log(`${user.name}: ${user.repositoryCount} repos, ${user.workflowCount} workflows`);
});
```

### Via API Calls

```javascript
// Get all user IDs
const response = await fetch('/api/admin/user-ids', {
  headers: {
    'Authorization': 'Bearer your-session-token'
  }
});
const { userIds } = await response.json();

// Get users with statistics
const usersResponse = await fetch('/api/admin/users?includeStats=true', {
  headers: {
    'Authorization': 'Bearer your-session-token'
  }
});
const { users } = await usersResponse.json();
```

## ✅ **Benefits**

- **Complete User Visibility**: See all users in the system
- **User Statistics**: Track repository and workflow usage per user
- **Activity Monitoring**: Know when users were last active
- **System Analytics**: Understand user engagement and usage patterns
- **Admin Capabilities**: Manage and monitor the multi-user system

Your multi-user system is now fully functional with complete user management capabilities! 🎉
