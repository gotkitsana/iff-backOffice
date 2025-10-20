# Sales Components

## Overview

This directory contains modular components for sales management functionality, extracted from the original `ModalEditSale.vue` for better maintainability and reusability.

## Components

### 1. ModalEditSale.vue

**Main container component** for editing sales data.

**Props:**

- `visible: boolean` - Controls modal visibility
- `saleData: ISales` - Sales data to edit

**Features:**

- Customer information display
- Status and seller selection
- Bank selection (when required)
- Slip upload management
- Product management
- Payment calculation
- Notes section

### 2. BankSelectionSection.vue

**Component for bank account selection** when payment method requires it.

**Props:**

- `selectedBankCode: string` - Currently selected bank code
- `isSubmitting: boolean` - Form submission state

**Events:**

- `update:selectedBankCode` - Emitted when bank is selected

**Features:**

- Grid layout of bank options
- Visual feedback for selection
- Validation error display

### 3. SlipUploadSection.vue

**Component for slip upload and management** when payment status requires it.

**Props:**

- `saleId: string` - ID of the sale
- `currentStatus: string` - Current payment status
- `isSubmitting: boolean` - Form submission state

**Events:**

- `slip-uploaded` - Emitted when slip is successfully uploaded

**Features:**

- Displays existing slip image
- File upload with preview
- Upload confirmation step
- Edit slip functionality
- Validation for required uploads
- Support for both PNG and JPEG formats

### 4. ProductManagementSection.vue

**Component for managing product selection and quantities.**

**Props:**

- `products: Array<{id: string, quantity: number}>` - Array of selected products
- `isSubmitting: boolean` - Form submission state

**Events:**

- `update:products` - Emitted when products are modified
- `add-product` - Emitted when new product should be added
- `remove-product` - Emitted when product should be removed
- `update:total-amount` - Emitted when total amount changes

**Features:**

- Dynamic product selection
- Quantity management
- Product validation
- Total amount calculation
- Product details display

### 5. PaymentCalculationSection.vue

**Component for payment calculations and summary.**

**Props:**

- `totalAmount: number` - Total amount from products
- `deposit: number` - Deposit amount
- `discount: number` - Discount amount
- `isSubmitting: boolean` - Form submission state

**Events:**

- `update:deposit` - Emitted when deposit changes
- `update:discount` - Emitted when discount changes

**Features:**

- Deposit and discount input
- Real-time calculation
- Summary display with breakdown
- Currency formatting

## Usage Example

```vue
<template>
  <ModalEditSale v-model:visible="showEditModal" :sale-data="selectedSale" />
</template>
```

## Key Features

### Conditional Display Logic

- **Bank Selection**: Shows when `status >= wait_payment`
- **Slip Upload**: Shows when `status >= wait_payment`
- **Validation**: Prevents submission without required data

### File Upload Flow

1. User selects file
2. Preview is shown with "Waiting for confirmation" status
3. User clicks "Confirm Upload" button
4. File is uploaded to server
5. Success feedback and image display

### State Management

- Each component manages its own local state
- Parent component coordinates data flow
- Real-time validation and feedback

## Dependencies

- Vue 3 Composition API
- PrimeVue components
- TanStack Query for data fetching
- Vue3-toastify for notifications
- Custom stores for data management
