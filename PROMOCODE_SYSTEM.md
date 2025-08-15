# Promocode Management System

## Overview

The promocode management system allows admins to create, manage, and track promotional codes for customer discounts. The system supports both percentage and fixed amount discounts with comprehensive validation and usage tracking.

## Features

### ✅ **Core Features**
- **Create Promocodes**: Generate new promotional codes with various discount types
- **Edit Promocodes**: Modify existing promocodes (code, discount, dates, etc.)
- **Delete Promocodes**: Permanently remove promocodes
- **Usage Tracking**: Monitor how many times each promocode has been used
- **Status Management**: Activate/deactivate promocodes
- **Validation**: Comprehensive validation for promocode usage

### ✅ **Discount Types**
- **Percentage Discount**: Percentage off the total order (e.g., 20% off)
- **Fixed Amount Discount**: Fixed dollar amount off (e.g., $10 off)

### ✅ **Advanced Features**
- **Minimum Order Amount**: Require a minimum order value
- **Maximum Discount Cap**: Limit maximum discount for percentage codes
- **Usage Limits**: Set maximum number of times a promocode can be used
- **Date Range**: Set validity period (from/to dates)
- **Admin Tracking**: Track which admin created each promocode

## Database Structure

### Collection: `promocodes`

```typescript
interface PromocodeData {
  id: string;                    // Auto-generated document ID
  code: string;                  // Promocode (e.g., "SAVE20")
  discountType: 'percentage' | 'fixed';
  discountValue: number;         // Percentage or fixed amount
  minOrderAmount?: number;       // Optional minimum order requirement
  maxDiscount?: number;          // Optional max discount for percentage
  usageLimit: number;            // Maximum usage count
  usedCount: number;             // Current usage count
  validFrom: Date;               // Start date
  validUntil: Date;              // End date
  isActive: boolean;             // Active/inactive status
  description?: string;          // Optional description
  createdBy: string;             // Admin UID who created it
  createdAt: number;             // Timestamp
  updatedAt: number;             // Last update timestamp
}
```

## Service Methods

### `promocodeService`

#### **Create Promocode**
```typescript
createPromocode(adminUid: string, data: CreatePromocodeData): Promise<string>
```
- Creates a new promocode
- Validates code uniqueness
- Returns the new promocode ID

#### **Get Promocodes by Admin**
```typescript
getPromocodesByAdmin(adminUid: string): Promise<PromocodeData[]>
```
- Retrieves all promocodes created by a specific admin
- Ordered by creation date (newest first)

#### **Get Promocode by Code**
```typescript
getPromocodeByCode(code: string): Promise<PromocodeData | null>
```
- Finds a promocode by its code
- Case-insensitive search

#### **Update Promocode**
```typescript
updatePromocode(id: string, data: UpdatePromocodeData): Promise<void>
```
- Updates existing promocode fields
- Validates code uniqueness if code is being changed

#### **Delete Promocode**
```typescript
deletePromocode(id: string): Promise<void>
```
- Permanently deletes a promocode

#### **Validate Promocode**
```typescript
validatePromocode(code: string, orderAmount: number): Promise<{valid: boolean, promocode?: PromocodeData, error?: string}>
```
- Validates promocode for use
- Checks: existence, active status, validity dates, usage limits, minimum order amount

#### **Increment Usage Count**
```typescript
incrementUsageCount(id: string): Promise<void>
```
- Increases the usage count when promocode is used

#### **Get Active Promocodes**
```typescript
getActivePromocodes(): Promise<PromocodeData[]>
```
- Returns all currently active and valid promocodes
- Used for customer-facing promocode lists

## Usage Examples

### Creating a Promocode
```typescript
const promocodeId = await promocodeService.createPromocode(adminUid, {
  code: 'SAVE20',
  discountType: 'percentage',
  discountValue: 20,
  minOrderAmount: 50,
  maxDiscount: 100,
  usageLimit: 100,
  validFrom: new Date(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  isActive: true,
  description: '20% off orders above $50'
});
```

### Validating a Promocode
```typescript
const validation = await promocodeService.validatePromocode('SAVE20', 75);
if (validation.valid) {
  // Apply discount
  const discount = calculateDiscount(validation.promocode, 75);
  // Increment usage
  await promocodeService.incrementUsageCount(validation.promocode.id);
} else {
  console.log('Invalid promocode:', validation.error);
}
```

## Admin Interface

### Access
- Navigate to **Admin Profile** → **Promocode Management**
- Only available to full admins (not sub-admins)

### Features
1. **List View**: Shows all promocodes with status, usage, and actions
2. **Add New**: Create new promocodes with comprehensive form
3. **Edit**: Modify existing promocodes
4. **Delete**: Remove promocodes with confirmation
5. **Status Toggle**: Activate/deactivate promocodes

### Form Fields
- **Promocode**: Unique code (auto-uppercase)
- **Discount Type**: Percentage or Fixed Amount
- **Discount Value**: Amount or percentage
- **Minimum Order Amount**: Optional requirement
- **Maximum Discount**: For percentage discounts
- **Usage Limit**: Maximum number of uses
- **Valid From/Until**: Date range
- **Description**: Optional notes
- **Active Status**: Toggle on/off

## Validation Rules

### Creation/Update
- Promocode code must be unique
- Percentage discounts: 1-100%
- Fixed discounts: > 0
- Usage limit: > 0
- Valid dates: Until date must be after From date
- Required fields: code, discountType, discountValue, usageLimit, validUntil

### Usage Validation
- Promocode must exist
- Must be active
- Current date must be within validity period
- Usage count must be below limit
- Order amount must meet minimum requirement

## Error Handling

The system provides comprehensive error handling:
- **Duplicate codes**: Prevents creation of duplicate promocodes
- **Invalid data**: Validates all input fields
- **Database errors**: Graceful handling of Firebase errors
- **User feedback**: Clear error messages in the UI

## Testing

Run the test script to verify functionality:
```bash
node scripts/testPromocodeService.js
```

## Integration Points

### Customer Side
- Promocode input in checkout
- Validation before applying discount
- Usage tracking when order is placed

### Admin Side
- Full CRUD operations in admin profile
- Usage analytics and reporting
- Bulk operations (future enhancement)

## Security Considerations

- Only admins can create/manage promocodes
- Usage tracking prevents abuse
- Validation prevents invalid usage
- Audit trail with creation/update timestamps

## Future Enhancements

- **Bulk Operations**: Import/export promocodes
- **Analytics**: Usage reports and insights
- **Customer-Specific**: Promocodes for specific customers
- **Auto-Generation**: Automatic promocode generation
- **Expiry Notifications**: Alert admins about expiring promocodes
