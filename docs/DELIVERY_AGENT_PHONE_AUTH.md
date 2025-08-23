# Delivery Agent Phone Authentication

## Overview

Delivery agents can now login using their phone number and password, in addition to the existing email-based authentication. This provides more flexibility for delivery agents who may prefer using their phone number for login.

## Features

### Phone Number Login
- **Phone + Password**: Delivery agents can login using their registered phone number and password
- **Fallback Authentication**: If phone authentication fails, the system falls back to email authentication
- **Account Status Check**: Verifies that the delivery agent account is active
- **Proper Error Handling**: Specific error messages for different failure scenarios

### Authentication Flow

1. **Phone Authentication Attempt**:
   - User enters phone number and password
   - System queries the users collection for delivery role with matching phone number
   - Validates password and account status
   - Creates user session if successful

2. **Fallback to Email Authentication**:
   - If phone authentication fails, system tries email authentication
   - Maintains backward compatibility with existing email-based login

3. **Error Handling**:
   - Invalid phone/password combinations
   - Deactivated accounts
   - Account not found scenarios

## Implementation

### Updated Services

#### `deliveryAuthService.ts`
```typescript
// New method for phone-based authentication
async authenticateDeliveryAgentByPhone(phoneNumber: string, password: string): Promise<UserSession | null>
```

#### `auth.tsx`
- Updated phone authentication flow to include delivery agents
- Added specific error handling for delivery agent scenarios
- Enhanced toast notifications for delivery agent login

### Toast Notifications

The system now provides specific toast messages for delivery agent authentication:

- **Success**: "Welcome back, delivery agent!"
- **Account Deactivated**: "Your delivery agent account has been deactivated. Please contact admin."
- **Account Not Found**: "No delivery agent account found with this phone number."
- **Login Failed**: "Invalid phone number or password."

## Usage

### For Delivery Agents

1. **Phone Login**:
   - Select "Use Phone" option
   - Enter registered phone number
   - Enter password
   - Tap "Login"

2. **Email Login** (still supported):
   - Select "Use Email" option
   - Enter registered email
   - Enter password
   - Tap "Login"

### For Administrators

When creating delivery agent accounts, ensure:
- Phone number is properly stored in the users collection
- Password is set correctly
- Account is marked as active (`isActive: true`)

## Database Schema

Delivery agent records in the `users` collection should include:

```typescript
{
  uid: string,
  email: string,
  phoneNumber: string,  // Required for phone authentication
  displayName: string,
  role: 'delivery',
  password: string,     // Plaintext per existing flow
  isActive: boolean,    // Must be true for login
  // ... other delivery-specific fields
}
```

## Security Considerations

- **Password Storage**: Currently using plaintext passwords to match existing flow
- **Phone Number Validation**: Ensure phone numbers are properly formatted
- **Account Status**: Always check `isActive` status before allowing login
- **Session Management**: Proper session token generation and expiration

## Testing

### Test Scenarios

1. **Valid Phone Login**:
   - Use valid delivery agent phone number and password
   - Should redirect to delivery dashboard
   - Should show success toast

2. **Invalid Phone Login**:
   - Use invalid phone number or password
   - Should show appropriate error message
   - Should not redirect

3. **Deactivated Account**:
   - Use phone number of deactivated delivery agent
   - Should show deactivation error message

4. **Fallback to Email**:
   - Use email authentication for same delivery agent
   - Should work as before

## Migration Notes

- **Backward Compatibility**: Existing email-based login continues to work
- **No Data Migration Required**: Existing delivery agent accounts work with phone login if phone number is present
- **Optional Feature**: Phone authentication is optional; email authentication remains primary

## Future Enhancements

- **Phone Number Verification**: Add SMS verification for phone numbers
- **Password Hashing**: Implement proper password hashing
- **Multi-Factor Authentication**: Add additional security layers
- **Phone Number Formatting**: Automatic phone number formatting and validation
