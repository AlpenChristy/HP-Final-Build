import { useToast } from '../context/ToastContext';

// Utility functions to replace Alert.alert calls with toast notifications
export const createToastHelpers = () => {
  // This function should be called within a component that has access to useToast
  const toast = useToast();

  return {
    // Success notifications
    showSuccess: (title: string, message?: string) => {
      toast.showSuccess(title, message);
    },

    // Error notifications
    showError: (title: string, message?: string) => {
      toast.showError(title, message);
    },

    // Warning notifications
    showWarning: (title: string, message?: string) => {
      toast.showWarning(title, message);
    },

    // Info notifications
    showInfo: (title: string, message?: string) => {
      toast.showInfo(title, message);
    },

    // Common success messages
    showLoginSuccess: () => {
      toast.showSuccess('Login Successful', 'Welcome back!');
    },

    showRegistrationSuccess: () => {
      toast.showSuccess('Registration Successful', 'Your account has been created successfully!');
    },

    showPasswordChangedSuccess: () => {
      toast.showSuccess('Password Changed', 'Your password has been updated successfully!');
    },

    showProfileUpdatedSuccess: () => {
      toast.showSuccess('Profile Updated', 'Your profile has been updated successfully!');
    },

    showAddressUpdatedSuccess: () => {
      toast.showSuccess('Address Updated', 'Your delivery address has been updated successfully!');
    },

    showAddressDeletedSuccess: () => {
      toast.showSuccess('Address Deleted', 'Address has been removed successfully!');
    },

    showProductAddedSuccess: () => {
      toast.showSuccess('Product Added', 'Product has been added successfully!');
    },

    showProductUpdatedSuccess: () => {
      toast.showSuccess('Product Updated', 'Product has been updated successfully!');
    },

    showProductDeletedSuccess: () => {
      toast.showSuccess('Product Deleted', 'Product has been removed successfully!');
    },

    showOrderPlacedSuccess: () => {
      toast.showSuccess('Order Placed', 'Your order has been placed successfully!');
    },

    showOrderStatusUpdatedSuccess: (status: string) => {
      toast.showSuccess('Order Updated', `Order status updated to ${status}`);
    },

    showPromocodeCreatedSuccess: () => {
      toast.showSuccess('Promocode Created', 'Promocode has been created successfully!');
    },

    showPromocodeUpdatedSuccess: () => {
      toast.showSuccess('Promocode Updated', 'Promocode has been updated successfully!');
    },

    showPromocodeDeletedSuccess: () => {
      toast.showSuccess('Promocode Deleted', 'Promocode has been removed successfully!');
    },

    showNotificationCreatedSuccess: () => {
      toast.showSuccess('Notification Created', 'Notification has been created successfully!');
    },

    showNotificationUpdatedSuccess: () => {
      toast.showSuccess('Notification Updated', 'Notification has been updated successfully!');
    },

    showNotificationDeletedSuccess: () => {
      toast.showSuccess('Notification Deleted', 'Notification has been removed successfully!');
    },

    showSubAdminCreatedSuccess: () => {
      toast.showSuccess('Sub-Admin Created', 'Sub-admin account has been created successfully!');
    },

    showSubAdminUpdatedSuccess: () => {
      toast.showSuccess('Sub-Admin Updated', 'Sub-admin account has been updated successfully!');
    },

    showSubAdminDeletedSuccess: () => {
      toast.showSuccess('Sub-Admin Deleted', 'Sub-admin account has been removed successfully!');
    },

    // HP Gas specific success messages
    showGasOrderPlacedSuccess: () => {
      toast.showSuccess('Gas Order Placed', 'Your gas cylinder order has been placed successfully!');
    },

    showDeliveryScheduledSuccess: () => {
      toast.showSuccess('Delivery Scheduled', 'Your gas delivery has been scheduled successfully!');
    },

    showPaymentSuccess: () => {
      toast.showSuccess('Payment Successful', 'Your payment has been processed successfully!');
    },

    showConsumerNumberUpdatedSuccess: () => {
      toast.showSuccess('Consumer Number Updated', 'Your consumer number has been updated successfully!');
    },

    // Common error messages
    showValidationError: (field: string) => {
      toast.showError('Validation Error', `Please check your ${field} and try again.`);
    },

    showNetworkError: () => {
      toast.showError('Network Error', 'Please check your internet connection and try again.');
    },

    showAuthenticationError: (message?: string) => {
      toast.showError('Authentication Error', message || 'Please check your credentials and try again.');
    },

    showPermissionError: () => {
      toast.showError('Permission Denied', 'You do not have permission to perform this action.');
    },

    showGenericError: (message?: string) => {
      toast.showError('Error', message || 'Something went wrong. Please try again.');
    },

    showSaveError: (item: string) => {
      toast.showError('Save Failed', `Failed to save ${item}. Please try again.`);
    },

    showDeleteError: (item: string) => {
      toast.showError('Delete Failed', `Failed to delete ${item}. Please try again.`);
    },

    showLoadError: (item: string) => {
      toast.showError('Load Failed', `Failed to load ${item}. Please try again.`);
    },

    // HP Gas specific error messages
    showGasOrderError: () => {
      toast.showError('Order Failed', 'Failed to place your gas order. Please try again.');
    },

    showDeliveryError: () => {
      toast.showError('Delivery Error', 'Unable to schedule delivery. Please try again later.');
    },

    showPaymentError: () => {
      toast.showError('Payment Failed', 'Payment could not be processed. Please try again.');
    },

    showOutOfStockError: (productName: string) => {
      toast.showError('Out of Stock', `${productName} is currently out of stock.`);
    },

    showServiceAreaError: () => {
      toast.showError('Service Area', 'Sorry, we don\'t deliver to this area yet.');
    },

    // Common warning messages
    showEmptyCartWarning: () => {
      toast.showWarning('Empty Cart', 'Please add items to your cart before checkout.');
    },

    showLogoutWarning: () => {
      toast.showWarning('Logout', 'Are you sure you want to logout?');
    },

    showDeleteWarning: (item: string) => {
      toast.showWarning('Delete Confirmation', `Are you sure you want to delete this ${item}?`);
    },

    // HP Gas specific warning messages
    showGasSafetyWarning: () => {
      toast.showWarning('Safety Reminder', 'Please ensure proper ventilation when using gas cylinders.');
    },

    showDeliveryTimeWarning: () => {
      toast.showWarning('Delivery Time', 'Delivery may take 24-48 hours during peak times.');
    },

    showCylinderExchangeWarning: () => {
      toast.showWarning('Cylinder Exchange', 'Please have your empty cylinder ready for exchange.');
    },

    // Common info messages
    showProcessingInfo: () => {
      toast.showInfo('Processing', 'Please wait while we process your request...');
    },

    showWeeklyOfferInfo: () => {
      toast.showInfo('Weekly Offer', 'Congratulations! Your 10% discount has been applied to your account.');
    },

    // HP Gas specific info messages
    showGasDeliveryInfo: () => {
      toast.showInfo('Delivery Info', 'Our delivery team will contact you before arrival.');
    },

    showCylinderInfo: () => {
      toast.showInfo('Cylinder Info', 'Standard cylinders contain 14.2 kg of LPG gas.');
    },

    showSafetyInfo: () => {
      toast.showInfo('Safety First', 'Always check for gas leaks and keep cylinders in well-ventilated areas.');
    },

    showServiceInfo: () => {
      toast.showInfo('24/7 Service', 'Emergency gas service available round the clock.');
    },

    // Admin Dashboard specific messages
    showStockUpdatedSuccess: () => {
      toast.showSuccess('Stock Updated', 'Product stock has been updated successfully!');
    },

    showStockLowWarning: (productName: string, quantity: number) => {
      toast.showWarning('Low Stock Alert', `${productName} is running low (${quantity} remaining).`);
    },

    showStockOutWarning: (productName: string) => {
      toast.showWarning('Out of Stock', `${productName} is now out of stock.`);
    },

    showStockBackorderWarning: (productName: string, quantity: number) => {
      toast.showWarning('Backorder Alert', `${productName} has ${Math.abs(quantity)} backorders pending.`);
    },

    showDashboardRefreshSuccess: () => {
      toast.showSuccess('Dashboard Refreshed', 'Product data has been updated.');
    },

    showInvalidQuantityError: () => {
      toast.showError('Invalid Quantity', 'Please enter a valid positive number.');
    },

    showStockUpdateError: () => {
      toast.showError('Update Failed', 'Failed to update stock. Please try again.');
    },

    // Delivery Agent Authentication messages
    showDeliveryAgentLoginSuccess: () => {
      toast.showSuccess('Login Successful', 'Welcome back, delivery agent!');
    },

    showDeliveryAgentLoginError: (message?: string) => {
      toast.showError('Login Failed', message || 'Invalid phone number or password.');
    },

    showDeliveryAgentAccountDeactivated: () => {
      toast.showError('Account Deactivated', 'Your delivery agent account has been deactivated. Please contact admin.');
    },

    showDeliveryAgentPhoneNotFound: () => {
      toast.showError('Account Not Found', 'No delivery agent account found with this phone number.');
    },

    // Validation error messages
    showEmailAlreadyExists: () => {
      toast.showError('Email Exists', 'This email address is already registered.');
    },

    showPhoneAlreadyExists: () => {
      toast.showError('Phone Exists', 'This phone number is already registered.');
    },

    showInvalidEmailFormat: () => {
      toast.showError('Invalid Email', 'Please enter a valid email address.');
    },

    showInvalidPhoneFormat: () => {
      toast.showError('Invalid Phone', 'Please enter a valid 10-digit phone number.');
    },

    // WhatsApp OTP specific messages
    showOtpSentSuccess: () => {
      toast.showSuccess('OTP Sent', 'Password reset OTP has been sent to your WhatsApp.');
    },

    showOtpVerifiedSuccess: () => {
      toast.showSuccess('OTP Verified', 'Please enter your new password.');
    },

    showPasswordResetSuccess: () => {
      toast.showSuccess('Password Reset', 'Your password has been reset successfully.');
    },

    showOtpError: (message?: string) => {
      toast.showError('OTP Error', message || 'Failed to send OTP. Please try again.');
    },

    showOtpVerificationError: (message?: string) => {
      toast.showError('Verification Error', message || 'Failed to verify OTP.');
    },

    showPasswordResetError: (message?: string) => {
      toast.showError('Reset Error', message || 'Failed to reset password.');
    },

    showInvalidOtpError: () => {
      toast.showError('Invalid OTP', 'Please enter a valid 6-digit OTP.');
    },

    showPasswordMismatchError: () => {
      toast.showError('Password Mismatch', 'Passwords do not match.');
    },

    showInvalidPasswordError: () => {
      toast.showError('Invalid Password', 'Password must be at least 6 characters long.');
    },

    showUserNotFoundError: () => {
      toast.showError('User Not Found', 'No account found with this email or phone number.');
    },
  };
};
