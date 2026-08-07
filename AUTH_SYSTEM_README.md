# Authentication System Documentation

## Overview

This is a complete, production-ready authentication and registration system for the Suq l-Filaha marketplace application. It implements a secure, step-based registration flow with phone verification, OTP validation, user type selection, and JWT-based authentication.

## Architecture

### Backend (Node.js + Express + Prisma + PostgreSQL)

**Tech Stack:**
- Express.js for REST API
- Prisma ORM with PostgreSQL
- JWT for authentication tokens
- Argon2 for password hashing
- Zod for request validation

**Key Features:**
- ✅ Phone number-based registration
- ✅ SMS OTP verification
- ✅ Secure password hashing with Argon2
- ✅ JWT token generation and validation
- ✅ User type selection (FARMER/BUYER)
- ✅ Protected routes with middleware
- ✅ Comprehensive error handling

### Frontend (React Native CLI)

**Tech Stack:**
- React Native CLI
- React Navigation (Stack Navigator)
- Zustand for state management
- Axios for API calls
- AsyncStorage for token persistence

**Key Features:**
- ✅ Multi-step registration flow
- ✅ Phone number input with validation
- ✅ 6-digit OTP verification with auto-focus
- ✅ User type selection (Farmer/Buyer)
- ✅ Password creation with confirmation
- ✅ Login screen
- ✅ Persistent authentication state
- ✅ Auto-navigation based on auth state

## Registration Flow

```
1. Phone Input Screen
   ↓
2. OTP Verification Screen (6-digit code)
   ↓
3. User Type Selection (FARMER or BUYER)
   ↓
4. Create Password & Account Details
   ↓
5. Home Screen (Authenticated)
```

## API Endpoints

### Authentication Routes

#### 1. Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

Request Body:
{
  "phoneNumber": "string (min 10 chars)"
}

Response (200):
{
  "message": "OTP sent"
}

Errors:
- 401: Phone number already registered
- 401: Failed to send OTP
```

#### 2. Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

Request Body:
{
  "phoneNumber": "string (min 10 chars)",
  "code": "string (6 digits)"
}

Response (200):
{
  "message": "Phone verified"
}

Errors:
- 401: OTP not found
- 401: Invalid OTP
- 401: OTP expired
```

#### 3. Register (Create Account)
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "phoneNumber": "string (min 10 chars)",
  "password": "string (min 6 chars)",
  "name": "string (required)",
  "userType": "FARMER" | "BUYER",
  "location": "string (optional)"
}

Response (201):
{
  "user": {
    "id": "string",
    "name": "string",
    "phoneNumber": "string",
    "userType": "FARMER" | "BUYER",
    "registrationDate": "ISO date string"
  },
  "token": "JWT token string",
  "chatToken": "JWT token string (optional)"
}

Errors:
- 403: Phone number not verified
- 409: User already exists
- 400: Validation error
```

#### 4. Login
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "phoneNumber": "string (min 10 chars)",
  "password": "string (min 6 chars)"
}

Response (200):
{
  "user": {
    "id": "string",
    "name": "string",
    "phoneNumber": "string",
    "userType": "FARMER" | "BUYER",
    "location": "string | null",
    "rating": number,
    "profileInfo": "string | null",
    "registrationDate": "ISO date string"
  },
  "token": "JWT token string",
  "chatToken": "JWT token string"
}

Errors:
- 401: Invalid credentials
```

#### 5. Get Profile (Protected)
```
GET /api/auth/profile
Authorization: Bearer <token>

Response (200):
{
  "id": "string",
  "name": "string",
  "phoneNumber": "string",
  "location": "string | null",
  "userType": "FARMER" | "BUYER",
  "rating": number,
  "profileInfo": "string | null",
  "registrationDate": "ISO date string"
}

Errors:
- 401: Authentication required
- 401: Invalid or expired token
```

#### 6. Update Profile (Protected)
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "string (optional)",
  "location": "string (optional)",
  "profileInfo": "string (optional)",
  "password": "string (optional, min 6 chars)"
}

Response (200):
{
  "id": "string",
  "name": "string",
  "phoneNumber": "string",
  "location": "string | null",
  "userType": "FARMER" | "BUYER",
  "rating": number,
  "profileInfo": "string | null"
}

Errors:
- 401: Authentication required
- 400: Validation error
```

## Database Schema

### User Model
```prisma
model User {
  id                String        @id @default(cuid())
  name              String
  phoneNumber       String        @unique
  password          String
  location          String?
  userType          UserType      @default(FARMER)
  registrationDate  DateTime      @default(now())
  rating            Float         @default(0.0)
  profileInfo       String?
  
  // Relations...
}

enum UserType {
  FARMER
  BUYER
  ADMIN
}
```

### PhoneVerification Model
```prisma
model PhoneVerification {
  id          String   @id @default(uuid())
  phoneNumber String   @unique
  code        String
  expiresAt   DateTime
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

## Frontend State Management

### Zustand Auth Store

```typescript
interface AuthState {
  // Auth state
  user: User | null;
  token: string | null;
  chatToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Registration flow state
  phoneNumber: string;
  isPhoneVerified: boolean;
  selectedUserType: UserType | null;

  // Actions
  setPhoneNumber: (phone: string) => void;
  setPhoneVerified: (verified: boolean) => void;
  setUserType: (type: UserType) => void;
  setAuth: (user: User, token: string, chatToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  clearRegistrationFlow: () => void;
}
```

## Security Features

### Backend Security
1. **Password Hashing**: Argon2 (industry-standard, memory-hard)
2. **JWT Tokens**: Signed with HS256 algorithm
3. **OTP Expiration**: 5-minute validity window
4. **Phone Verification**: Required before account creation
5. **Request Validation**: Zod schemas for all inputs
6. **Protected Routes**: JWT middleware authentication

### Frontend Security
1. **Token Storage**: AsyncStorage (secure on-device storage)
2. **Automatic Token Injection**: Axios interceptors
3. **Token Expiration Handling**: Auto-logout on 401
4. **Input Validation**: Client-side validation before API calls
5. **Secure Password Input**: Hidden by default with toggle

## Setup Instructions

### Backend Setup

1. **Install Dependencies**
```bash
cd backend-core
pnpm install
```

2. **Configure Environment Variables**
Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/suq_filaha"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="7d"
PORT=3000
```

3. **Run Database Migrations**
```bash
pnpm prisma migrate dev
```

4. **Start Development Server**
```bash
pnpm dev
```

Backend will run on `http://localhost:3000`

### Mobile App Setup

1. **Install Dependencies**
```bash
cd mobile-app
pnpm install
```

2. **Update API URL**
Edit `src/services/api.ts`:
```typescript
// For iOS Simulator
const API_BASE_URL = 'http://localhost:3000/api';

// For Android Emulator
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// For Physical Device (use your computer's IP)
const API_BASE_URL = 'http://192.168.1.XXX:3000/api';
```

3. **iOS Setup** (macOS only)
```bash
cd ios
pod install
cd ..
```

4. **Run the App**

For iOS:
```bash
pnpm ios
```

For Android:
```bash
pnpm android
```

## File Structure

### Backend
```
backend-core/
├── src/
│   ├── controllers/
│   │   └── auth.controller.ts      # Auth request handlers
│   ├── services/
│   │   ├── auth.service.ts         # Auth business logic
│   │   └── sms.service.ts          # SMS/OTP sending
│   ├── routes/
│   │   └── auth.routes.ts          # Auth endpoints
│   ├── validators/
│   │   └── auth.validator.ts       # Zod schemas
│   ├── middlewares/
│   │   └── auth.middleware.ts      # JWT verification
│   └── app.ts                      # Express app setup
├── prisma/
│   └── schema.prisma               # Database schema
└── package.json
```

### Mobile App
```
mobile-app/
├── src/
│   ├── screens/
│   │   ├── PhoneInputScreen.tsx           # Step 1: Phone input
│   │   ├── OtpVerificationScreen.tsx      # Step 2: OTP verification
│   │   ├── UserTypeSelectionScreen.tsx    # Step 3: User type
│   │   ├── CreatePasswordScreen.tsx       # Step 4: Password & details
│   │   ├── LoginScreen.tsx                # Login
│   │   └── HomeScreen.tsx                 # Authenticated home
│   ├── store/
│   │   └── authStore.ts                   # Zustand state management
│   ├── services/
│   │   └── api.ts                         # Axios API client
│   └── App.tsx                            # Navigation setup
└── package.json
```

## Testing the Flow

### 1. Test Registration Flow

1. Launch the mobile app
2. Complete onboarding
3. Enter phone number → "Send OTP"
4. Check backend logs for OTP code (or SMS)
5. Enter 6-digit OTP → "Verify OTP"
6. Select user type (Farmer or Buyer)
7. Enter name, password, and optional location
8. Click "Create Account"
9. Should navigate to Home screen with user profile

### 2. Test Login Flow

1. From Phone Input screen, click "Login"
2. Enter registered phone number
3. Enter password
4. Click "Login"
5. Should navigate to Home screen

### 3. Test Persistence

1. Close the app completely
2. Reopen the app
3. Should automatically navigate to Home screen (if logged in)

## Common Issues & Solutions

### Issue: "Network Error" on mobile app
**Solution**: Update API_BASE_URL in `src/services/api.ts` to match your setup:
- iOS Simulator: `http://localhost:3000/api`
- Android Emulator: `http://10.0.2.2:3000/api`
- Physical Device: `http://YOUR_COMPUTER_IP:3000/api`

### Issue: OTP not received
**Solution**: Check `backend-core/src/services/sms.service.ts` - you may need to configure your SMS provider credentials.

### Issue: "Phone number already registered"
**Solution**: Either:
1. Use a different phone number, OR
2. Delete the user from database and try again

### Issue: JWT token expired
**Solution**: The app automatically logs out on 401 errors. Just log in again.

## Next Steps

1. **Implement SMS Provider**: Configure a real SMS service (Twilio, AWS SNS, etc.)
2. **Add Forgot Password**: Implement password reset flow
3. **Add Social Login**: Google, Facebook, Apple Sign-In
4. **Enhance Security**: Add rate limiting, CAPTCHA
5. **Add Profile Pictures**: Image upload functionality
6. **Implement Main Features**: Products, orders, chat, etc.

## Environment Variables Reference

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRATION="7d"

# Server
PORT=3000
NODE_ENV="development"

# SMS Service (configure based on your provider)
SMS_API_KEY="your-sms-api-key"
SMS_API_URL="https://api.sms-provider.com"
```

## License

This authentication system is part of the Suq l-Filaha marketplace project.

---

**Built with ❤️ for secure, scalable authentication**
