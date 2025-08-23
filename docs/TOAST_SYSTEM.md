# Enhanced Toast Notification System

## Overview

This document describes the new enhanced toast notification system that replaces the basic `Alert.alert` calls throughout the HP Gas app. The new system provides:

- **Blue & White Theme**: Success and general messages use white background with blue borders
- **Red & White Theme**: Error messages use white background with red borders
- **Smooth Animations**: Slide-in/slide-out animations with spring effects
- **Multiple Types**: Success, Error, Warning, and Info notifications
- **Global Management**: Centralized toast management through React Context
- **Easy Integration**: Simple utility functions for common use cases

## Color Scheme

The toast system follows your app's blue and white theme:

- **Success & Info Messages**: White background with blue borders and blue icons
- **Error Messages**: White background with red borders and red icons  
- **Warning Messages**: White background with orange borders and orange icons
- **Text**: Dark text on white background for optimal readability

## Components

### 1. Toast Component (`components/ui/Toast.tsx`)

The main toast component with the following features:

- **Position**: Appears at the top of the screen below the status bar
- **Animations**: Smooth slide-in from top with scale and opacity effects
- **Auto-dismiss**: Automatically disappears after a configurable duration
- **Manual close**: Users can tap the close button to dismiss
- **Responsive**: Adapts to different screen sizes
- **Accessibility**: Proper touch targets and visual feedback

#### Props

```typescript
interface ToastProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // Default: 4000ms
  onClose?: () => void;
  onPress?: () => void; // Optional: handle toast tap
}
```

### 2. Toast Context (`core/context/ToastContext.tsx`)

Provides global toast management through React Context:

```typescript
interface ToastContextType {
  showToast: (props: Omit<ToastProps, 'visible' | 'onClose'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  hideToast: () => void;
}
```

### 3. Toast Utilities (`core/utils/toastUtils.ts`)

Pre-built utility functions for common toast scenarios:

```typescript
const toast = createToastHelpers();

// Success notifications
toast.showLoginSuccess();
toast.showRegistrationSuccess();
toast.showPasswordChangedSuccess();
toast.showProfileUpdatedSuccess();
toast.showAddressUpdatedSuccess();
toast.showProductAddedSuccess();
toast.showOrderPlacedSuccess();

// Error notifications
toast.showValidationError('email');
toast.showNetworkError();
toast.showAuthenticationError('Invalid credentials');
toast.showSaveError('product');
toast.showDeleteError('order');

// Warning notifications
toast.showEmptyCartWarning();
toast.showLogoutWarning();
toast.showDeleteWarning('product');

// Info notifications
toast.showProcessingInfo();
toast.showWeeklyOfferInfo();
```

## Usage Examples

### Basic Usage

```typescript
import { useToast } from '../../core/context/ToastContext';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.showSuccess('Success!', 'Operation completed successfully.');
  };

  const handleError = () => {
    toast.showError('Error!', 'Something went wrong.');
  };

  return (
    // Your component JSX
  );
}
```

### Using Utility Functions

```typescript
import { createToastHelpers } from '../../core/utils/toastUtils';

function MyComponent() {
  const toast = createToastHelpers();

  const handleLogin = async () => {
    try {
      await loginUser();
      toast.showLoginSuccess();
    } catch (error) {
      toast.showAuthenticationError(error.message);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile();
      toast.showProfileUpdatedSuccess();
    } catch (error) {
      toast.showSaveError('profile');
    }
  };

  return (
    // Your component JSX
  );
}
```

### Custom Toast

```typescript
const toast = useToast();

// Custom success toast
toast.showToast({
  type: 'success',
  title: 'Custom Success',
  message: 'This is a custom success message',
  duration: 5000, // 5 seconds
  onPress: () => {
    // Handle toast tap
    console.log('Toast tapped!');
  }
});

// Custom error toast
toast.showToast({
  type: 'error',
  title: 'Custom Error',
  message: 'This is a custom error message',
  duration: 6000, // 6 seconds
});
```

## Migration Guide

### Replacing Alert.alert Calls

#### Before (Old Alert System)
```typescript
Alert.alert('Success', 'Login successful!');
Alert.alert('Error', 'Please check your credentials.');
```

#### After (New Toast System)
```typescript
// Using utility functions
toast.showLoginSuccess();
toast.showAuthenticationError('Please check your credentials.');

// Or using direct methods
toast.showSuccess('Success', 'Login successful!');
toast.showError('Error', 'Please check your credentials.');
```

### Common Replacements

| Old Alert | New Toast |
|-----------|-----------|
| `Alert.alert('Success', 'Login successful!')` | `toast.showLoginSuccess()` |
| `Alert.alert('Success', 'Registration successful!')` | `toast.showRegistrationSuccess()` |
| `Alert.alert('Success', 'Password changed successfully!')` | `toast.showPasswordChangedSuccess()` |
| `Alert.alert('Success', 'Profile updated successfully!')` | `toast.showProfileUpdatedSuccess()` |
| `Alert.alert('Error', 'Please fill all required fields.')` | `toast.showValidationError('required fields')` |
| `Alert.alert('Error', 'Network error occurred.')` | `toast.showNetworkError()` |
| `Alert.alert('Error', 'Failed to save product.')` | `toast.showSaveError('product')` |

## Design System

### Color Scheme

The toast system uses a consistent color scheme that matches your app's design:

- **Success**: Green (`#10B981`) with darker border (`#059669`)
- **Error**: Red (`#EF4444`) with darker border (`#DC2626`)
- **Warning**: Orange (`#F59E0B`) with darker border (`#D97706`)
- **Info**: Blue (`#3B82F6`) with darker border (`#2563EB`)

### Typography

- **Title**: 16px, Semi-bold (600), White text
- **Message**: 14px, Regular (400), Semi-transparent white text
- **Line Height**: 20px for better readability

### Spacing & Layout

- **Container**: 16px horizontal margins, 12px border radius
- **Content**: 16px padding, 60px minimum height
- **Icon**: 32px circle with 12px margin right
- **Close Button**: 24px circle with 10px hit slop

### Animations

- **Show**: 300ms slide-in from top with spring scale effect
- **Hide**: 250ms slide-out to top with scale down
- **Auto-dismiss**: Configurable duration (default 4 seconds)

## Best Practices

### 1. Use Appropriate Toast Types

- **Success**: For completed actions (login, save, delete)
- **Error**: For failures and validation errors
- **Warning**: For confirmations and important notices
- **Info**: For general information and updates

### 2. Keep Messages Concise

- **Title**: Short and clear (1-3 words)
- **Message**: Brief explanation (1-2 lines max)
- **Avoid**: Long paragraphs or technical jargon

### 3. Use Utility Functions

- Prefer utility functions over direct toast calls
- They provide consistent messaging across the app
- Easier to maintain and update

### 4. Handle User Interactions

- Use `onPress` for actionable toasts
- Provide clear feedback for user actions
- Don't overwhelm users with too many toasts

### 5. Consider Timing

- Use longer durations for important messages
- Shorter durations for quick confirmations
- Allow users to manually dismiss if needed

## Implementation Checklist

- [ ] ToastProvider added to app layout
- [ ] Toast component imported and styled
- [ ] Utility functions created for common scenarios
- [ ] Alert.alert calls replaced with toast calls
- [ ] Error handling updated to use toast system
- [ ] Success messages updated to use toast system
- [ ] Validation errors updated to use toast system
- [ ] Testing completed for all toast types
- [ ] Accessibility verified
- [ ] Performance tested

## Troubleshooting

### Toast Not Appearing

1. Check if ToastProvider is properly wrapped around your app
2. Verify the toast hook is called within a component
3. Ensure the toast state is being set correctly

### Toast Styling Issues

1. Check if Colors import is correct
2. Verify StatusBar height calculation
3. Test on different screen sizes

### Animation Issues

1. Ensure useNativeDriver is enabled
2. Check for conflicting animations
3. Verify timing values are appropriate

## Future Enhancements

- **Queue System**: Handle multiple toasts gracefully
- **Custom Positions**: Bottom, center, or custom positioning
- **Rich Content**: Support for images, buttons, or custom components
- **Theming**: Dark/light mode support
- **Analytics**: Track toast interactions and effectiveness
- **Accessibility**: Enhanced screen reader support
