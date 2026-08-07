# 🧪 Authentication System Testing Checklist

## Pre-Testing Setup

- [ ] Backend server is running (`pnpm dev` in backend-core)
- [ ] Mobile app is running (iOS Simulator or Android Emulator)
- [ ] Database is accessible and migrations are applied
- [ ] API_BASE_URL is correctly configured in mobile app

## 1. Registration Flow Testing

### Phone Input Screen
- [ ] Screen loads correctly
- [ ] Phone input field is visible and functional
- [ ] Can enter phone number
- [ ] "Send OTP" button is clickable
- [ ] Loading indicator shows when sending OTP
- [ ] Success: Navigates to OTP screen
- [ ] Error: Shows alert for invalid phone number
- [ ] Error: Shows alert if phone already registered
- [ ] "Login" link navigates to login screen

### OTP Verification Screen
- [ ] Screen shows correct phone number
- [ ] 6 input boxes are visible
- [ ] Can enter digits in each box
- [ ] Auto-focus moves to next box
- [ ] Backspace moves to previous box
- [ ] "Verify OTP" button is clickable
- [ ] Loading indicator shows during verification
- [ ] Success: Navigates to user type selection
- [ ] Error: Shows alert for invalid OTP
- [ ] Error: Shows alert for expired OTP
- [ ] "Resend OTP" button works
- [ ] "Change Phone Number" navigates back

### User Type Selection Screen
- [ ] Screen loads with both options
- [ ] Farmer card is clickable
- [ ] Buyer card is clickable
- [ ] Icons and descriptions are visible
- [ ] Features list is displayed
- [ ] Clicking Farmer navigates to password screen
- [ ] Clicking Buyer navigates to password screen
- [ ] Selected user type is stored in state

### Create Password Screen
- [ ] All input fields are visible
- [ ] Name field accepts text input
- [ ] Password field hides text by default
- [ ] Confirm password field hides text by default
- [ ] Eye icon toggles password visibility
- [ ] Location field is optional
- [ ] Phone number is displayed correctly
- [ ] User type is displayed correctly
- [ ] "Create Account" button is clickable
- [ ] Loading indicator shows during registration
- [ ] Success: Account created and navigates to home
- [ ] Error: Shows alert if passwords don't match
- [ ] Error: Shows alert if name is empty
- [ ] Error: Shows alert if password is too short
- [ ] Error: Shows alert if phone not verified

## 2. Login Flow Testing

### Login Screen
- [ ] Screen loads correctly
- [ ] Phone input field is functional
- [ ] Password input field is functional
- [ ] Password is hidden by default
- [ ] Eye icon toggles password visibility
- [ ] "Login" button is clickable
- [ ] Loading indicator shows during login
- [ ] Success: Navigates to home screen
- [ ] Error: Shows alert for invalid credentials
- [ ] Error: Shows alert for non-existent user
- [ ] "Register" link navigates to phone input

## 3. Home Screen Testing

### After Registration
- [ ] Home screen loads after registration
- [ ] User name is displayed correctly
- [ ] Phone number is displayed correctly
- [ ] User type is displayed correctly
- [ ] Location is displayed (if provided)
- [ ] Rating is displayed
- [ ] "Logout" button is visible and clickable

### After Login
- [ ] Home screen loads after login
- [ ] All user data is displayed correctly
- [ ] Logout functionality works

## 4. Authentication State Testing

### Token Persistence
- [ ] After login, close app completely
- [ ] Reopen app
- [ ] Should automatically show home screen
- [ ] User data should be loaded from storage
- [ ] No need to login again

### Logout
- [ ] Click logout button
- [ ] Navigates to phone input screen
- [ ] Token is cleared from storage
- [ ] User state is reset
- [ ] Cannot access home screen without login

### Token Expiration
- [ ] Manually expire token (or wait for expiration)
- [ ] Make an API call
- [ ] Should auto-logout
- [ ] Should navigate to phone input screen

## 5. API Testing

### Send OTP Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```
- [ ] Returns 200 with success message
- [ ] OTP is created in database
- [ ] OTP code is logged in console
- [ ] Returns 401 if phone already registered

### Verify OTP Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "code": "123456"}'
```
- [ ] Returns 200 with success message
- [ ] Marks phone as verified in database
- [ ] Returns 401 for invalid code
- [ ] Returns 401 for expired code

### Register Endpoint
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
- [ ] Returns 201 with user and token
- [ ] User is created in database
- [ ] Password is hashed (not plain text)
- [ ] JWT token is valid
- [ ] Returns 403 if phone not verified
- [ ] Returns 409 if user already exists

### Login Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "password": "password123"
  }'
```
- [ ] Returns 200 with user and tokens
- [ ] JWT token is valid
- [ ] Chat token is included
- [ ] Returns 401 for invalid credentials
- [ ] Returns 401 for non-existent user

### Get Profile Endpoint (Protected)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns 200 with user profile
- [ ] All user fields are present
- [ ] Returns 401 without token
- [ ] Returns 401 with invalid token

### Update Profile Endpoint (Protected)
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "location": "New York"}'
```
- [ ] Returns 200 with updated user
- [ ] Changes are saved in database
- [ ] Returns 401 without token
- [ ] Returns 400 for invalid data

## 6. Security Testing

### Password Security
- [ ] Passwords are hashed in database (check with DB client)
- [ ] Cannot retrieve plain text password
- [ ] Argon2 is used for hashing
- [ ] Password minimum length is enforced (6 chars)

### JWT Security
- [ ] Token is signed with secret
- [ ] Token contains userId and userType
- [ ] Token has expiration time
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected

### OTP Security
- [ ] OTP expires after 5 minutes
- [ ] Expired OTPs are rejected
- [ ] OTP is deleted after successful registration
- [ ] Cannot reuse verified OTP

### Input Validation
- [ ] Phone number validation works
- [ ] Password length validation works
- [ ] Name required validation works
- [ ] User type enum validation works
- [ ] Invalid requests return 400

## 7. Error Handling Testing

### Network Errors
- [ ] Stop backend server
- [ ] Try to send OTP
- [ ] Shows "Network Error" alert
- [ ] Try to login
- [ ] Shows appropriate error message

### Validation Errors
- [ ] Enter invalid phone number (too short)
- [ ] Shows validation error
- [ ] Enter mismatched passwords
- [ ] Shows error alert
- [ ] Leave required fields empty
- [ ] Shows error alert

### Server Errors
- [ ] Test with invalid database connection
- [ ] Shows appropriate error message
- [ ] App doesn't crash

## 8. UI/UX Testing

### Visual Design
- [ ] All screens follow consistent design
- [ ] Green theme (#489163) is used correctly
- [ ] Buttons have proper styling
- [ ] Input fields are clearly visible
- [ ] Loading states are shown
- [ ] Error messages are user-friendly

### Navigation
- [ ] Back navigation works correctly
- [ ] Forward navigation works correctly
- [ ] Can't go back from home screen to auth
- [ ] Splash screen shows only once
- [ ] Onboarding shows only once

### Responsiveness
- [ ] Works on different screen sizes
- [ ] Keyboard doesn't cover inputs
- [ ] ScrollView works on small screens
- [ ] All text is readable

## 9. Edge Cases

### Registration
- [ ] Try to register with existing phone number
- [ ] Try to register without verifying OTP
- [ ] Try to verify OTP for non-existent phone
- [ ] Try to use expired OTP
- [ ] Try to register with very long name
- [ ] Try to register with special characters in name

### Login
- [ ] Try to login with non-existent phone
- [ ] Try to login with wrong password
- [ ] Try to login before registration
- [ ] Try multiple failed login attempts

### State Management
- [ ] Logout and login with different account
- [ ] Switch between farmer and buyer accounts
- [ ] Clear app data and restart
- [ ] Force close during registration

## 10. Performance Testing

### Load Times
- [ ] App starts in < 3 seconds
- [ ] Screens load instantly
- [ ] API calls complete in < 2 seconds
- [ ] No lag in input fields

### Memory
- [ ] No memory leaks
- [ ] App doesn't crash after prolonged use
- [ ] Smooth navigation transitions

## Test Results Summary

**Date**: _______________
**Tester**: _______________
**Environment**: iOS / Android (circle one)

**Total Tests**: _____ / _____
**Passed**: _____
**Failed**: _____
**Blocked**: _____

**Critical Issues Found**:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

---

## Quick Test Script

For rapid testing, use this sequence:

1. **Happy Path Registration**:
   - Phone: `+1111111111` → Send OTP
   - OTP: Check console → Verify
   - Type: Farmer → Select
   - Name: `Test User`, Password: `test123` → Register
   - ✅ Should see home screen

2. **Happy Path Login**:
   - Logout → Login
   - Phone: `+1111111111`, Password: `test123` → Login
   - ✅ Should see home screen

3. **Persistence**:
   - Close app → Reopen
   - ✅ Should still be logged in

**All three working? System is functional! 🎉**
