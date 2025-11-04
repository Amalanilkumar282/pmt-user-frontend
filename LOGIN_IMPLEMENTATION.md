# Login Implementation with .NET Backend

## Overview
Implemented frontend login integration with .NET backend API, including proper error handling, token management, and logout functionality.

## Changes Made

### 1. Environment Configuration
**File:** `src/environments/environment.ts`
- Added `apiUrl: 'https://pmt-backend.runasp.net/swagger/index.html'` for backend API endpoint

### 2. Authentication Service Updates
**File:** `src/app/auth/auth.service.ts`

**Key Features:**
- Integrated with .NET backend login API endpoint: `/api/Auth/login`
- Updated User interface to match backend response:
  - `userId: number`
  - `email: string`
  - `name: string`
  - `isActive: boolean`
  - `isSuperAdmin: boolean`
- Token management:
  - Stores `accessToken`, `refreshToken`, `accessTokenExpires`, `refreshTokenExpires`
  - Auto-logout when access token expires
- Error handling:
  - HTTP 401: "Invalid email or password"
  - HTTP 400: Shows backend error message
  - HTTP 0: "Cannot connect to server"
  - Generic errors with descriptive messages
- Refresh token endpoint ready: `/api/Auth/refresh`

**Request Format:**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

**Response Format:**
```json
{
  "status": 0,
  "data": {
    "userId": 0,
    "email": "string",
    "name": "string",
    "accessToken": "string",
    "refreshToken": "string",
    "accessTokenExpires": "2025-10-30T12:18:32.528Z",
    "refreshTokenExpires": "2025-10-30T12:18:32.528Z",
    "isActive": true,
    "isSuperAdmin": true
  },
  "message": "string"
}
```

### 3. HTTP Client Configuration
**File:** `src/app/app.config.ts`
- Added `provideHttpClient(withFetch())` to enable HTTP requests

### 4. Login Component
**File:** `src/app/auth/login/login.ts`
- Enhanced error handling with console logging
- Redirects to main dashboard (`/`) on successful login
- Shows detailed error messages from backend

### 5. Profile Button with Logout
**File:** `src/app/shared/profile-button/profile-button.ts`
- Injected `AuthService`
- Added `logout()` method to trigger auth service logout
- Clears all session storage and redirects to `/login`

**File:** `src/app/shared/profile-button/profile-button.html`
- Added click handler to logout button: `(click)="logout()"`

### 6. Header Component
**File:** `src/app/shared/header/header.ts`
- Subscribes to `currentUser` observable
- Dynamically updates `userName` and `userEmail` from authenticated user
- Displays logged-in user's information

### 7. UI Updates with Brand Color
**File:** `src/app/auth/login/login.css`
- Updated all colors to use `#3d62a8` (primary) and `#2d4a7d` (darker shade)
- Background gradient
- Brand logo
- Input focus states
- Buttons
- Links

## Security Features

1. **Token Storage:** Uses `sessionStorage` for tokens (cleared on browser close)
2. **Token Expiry Check:** Automatically logs out when access token expires
3. **Protected Routes:** Auth guard checks authentication status
4. **Refresh Token:** Infrastructure ready for token refresh

## Error Handling

### Login Errors:
- **Network Error (Status 0):** "Cannot connect to server. Please check if the backend is running."
- **401 Unauthorized:** "Invalid email or password"
- **400 Bad Request:** Shows backend error message
- **Other Errors:** Shows backend message or generic error

### Display:
- Error banner shows at top of login form
- Red styling with icon
- Clear, user-friendly messages

## Testing the Implementation

### 1. Start Backend
```bash
# Ensure .NET backend is running on https://localhost:7117
```

### 2. Test Login Flow
1. Navigate to `/login`
2. Enter valid credentials
3. Click "Sign In"
4. Should redirect to main dashboard with user info in header
5. Click profile button → Click "Log out"
6. Should redirect back to `/login`

### 3. Test Error Cases
1. **Wrong credentials:** Shows "Invalid email or password"
2. **Backend offline:** Shows "Cannot connect to server"
3. **Empty fields:** Shows validation errors

## API Integration Checklist

- ✅ Environment variable for API URL
- ✅ HttpClient configured with fetch
- ✅ Login endpoint integration
- ✅ Token storage (access + refresh)
- ✅ Error handling with proper messages
- ✅ User session management
- ✅ Logout functionality
- ✅ Token expiry check
- ✅ Refresh token infrastructure
- ✅ UI color scheme updated

## Next Steps (Optional Enhancements)

1. **Implement Token Refresh:** Add HTTP interceptor to auto-refresh expired tokens
2. **Remember Me:** Add persistent login with localStorage option
3. **Loading States:** Add skeleton loaders during authentication
4. **Password Recovery:** Implement forgot password flow
5. **Two-Factor Auth:** Add 2FA support if backend provides it

## Notes

- CORS must be enabled on backend for `https://pmt-backend.runasp.net/swagger/index.html`
- SSL certificate warnings may appear in development
- Session storage ensures security (auto-clear on browser close)
- All color themes updated to `#3d62a8` brand color
