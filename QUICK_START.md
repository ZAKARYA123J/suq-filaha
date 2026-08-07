# 🚀 Quick Start Guide - Authentication System

## Prerequisites

- Node.js 20+
- PostgreSQL database running
- React Native development environment set up
- iOS Simulator or Android Emulator (or physical device)

## 5-Minute Setup

### Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend-core

# Install dependencies (if not already done)
pnpm install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/suq_filaha"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="7d"
PORT=3000
EOF

# Run migrations
pnpm prisma migrate dev

# Start backend server
pnpm dev
```

✅ Backend should now be running on `http://localhost:3000`

### Step 2: Mobile App Setup (3 minutes)

```bash
# Navigate to mobile app
cd ../mobile-app

# Install dependencies (if not already done)
pnpm install

# Update API URL in src/services/api.ts
# - For iOS Simulator: http://localhost:3000/api
# - For Android Emulator: http://10.0.2.2:3000/api
# - For Physical Device: http://YOUR_COMPUTER_IP:3000/api

# For iOS (macOS only)
cd ios && pod install && cd ..
pnpm ios

# OR for Android
pnpm android
```

✅ Mobile app should now be running!

## Test the Flow

### 1. Registration (First Time User)

1. **Splash Screen** → Automatically proceeds
2. **Onboarding Screen** → Click "Next"
3. **Phone Input Screen**:
   - Enter: `+1234567890`
   - Click: "Send OTP"
4. **Check Backend Console** for OTP code (e.g., `123456`)
5. **OTP Verification Screen**:
   - Enter the 6-digit code
   - Click: "Verify OTP"
6. **User Type Selection**:
   - Choose: "I'm a Farmer" or "I'm a Buyer"
7. **Create Password Screen**:
   - Name: `John Doe`
   - Password: `password123`
   - Confirm Password: `password123`
   - Location: `California` (optional)
   - Click: "Create Account"
8. **Home Screen** → You're logged in! 🎉

### 2. Login (Returning User)

1. **Phone Input Screen** → Click "Login"
2. **Login Screen**:
   - Phone: `+1234567890`
   - Password: `password123`
   - Click: "Login"
3. **Home Screen** → You're logged in! 🎉

### 3. Test Persistence

1. Close the app completely
2. Reopen the app
3. Should automatically show **Home Screen** (still logged in)

## API Testing with curl

### Send OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "code": "123456"}'
```

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "password": "password123",
    "name": "John Doe",
    "userType": "FARMER",
    "location": "California"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "password": "password123"
  }'
```

## Common Issues & Quick Fixes

### ❌ "Network Error" on mobile app
**Fix**: Update `API_BASE_URL` in `mobile-app/src/services/api.ts`
- iOS: `http://localhost:3000/api`
- Android: `http://10.0.2.2:3000/api`
- Device: `http://YOUR_IP:3000/api`

### ❌ "Phone number already registered"
**Fix**: Use a different phone number or delete from database:
```sql
DELETE FROM "PhoneVerification" WHERE "phoneNumber" = '+1234567890';
DELETE FROM "users" WHERE "phoneNumber" = '+1234567890';
```

### ❌ Backend not starting
**Fix**: Check PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### ❌ OTP not showing
**Fix**: Check backend console logs - OTP is printed there during development

### ❌ iOS build fails
**Fix**: 
```bash
cd ios
pod install
cd ..
```

## Project Structure

```
suq-l-filaha/
├── backend-core/
│   ├── src/
│   │   ├── routes/auth.routes.ts       # Auth endpoints
│   │   ├── controllers/auth.controller.ts
│   │   ├── services/auth.service.ts
│   │   └── validators/auth.validator.ts
│   └── prisma/schema.prisma
│
├── mobile-app/
│   └── src/
│       ├── screens/                    # All auth screens
│       ├── store/authStore.ts          # Zustand state
│       ├── services/api.ts             # API client
│       └── App.tsx                     # Navigation
│
├── AUTH_SYSTEM_README.md               # Full documentation
├── API_QUICK_REFERENCE.md              # API reference
├── IMPLEMENTATION_SUMMARY.md           # What was built
└── QUICK_START.md                      # This file
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRATION="7d"
PORT=3000
```

### Mobile App (src/services/api.ts)
```typescript
const API_BASE_URL = 'http://localhost:3000/api'; // Update this!
```

## Next Steps

1. ✅ Test the complete registration flow
2. ✅ Test login functionality
3. ✅ Test persistence (close/reopen app)
4. 🔧 Configure SMS provider for production
5. 🔧 Implement main app features (products, orders, chat)
6. 🔧 Add profile picture upload
7. 🔧 Deploy to production

## Need Help?

- 📖 Full Documentation: `AUTH_SYSTEM_README.md`
- 🔍 API Reference: `API_QUICK_REFERENCE.md`
- ✅ Implementation Details: `IMPLEMENTATION_SUMMARY.md`

---

**Ready to go! Start the backend, launch the app, and test the flow.** 🚀
