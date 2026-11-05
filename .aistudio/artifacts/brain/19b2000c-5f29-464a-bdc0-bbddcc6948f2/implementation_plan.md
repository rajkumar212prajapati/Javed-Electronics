# Customer Signup with Email Verification OTP

A frictionless, secure, 2-step customer onboarding flow featuring email verification via a 6-digit OTP, countdown resend timer, simulated OTP inbox helper, and immediate auto-login.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters were confirmed during clarification and govern the implementation:
> - **OTP Mechanism**: 6-digit numeric OTP code with a 60-second countdown timer before "Resend Code" becomes active, accompanied by an instant simulated inbox modal/toast so the user can test seamlessly.
> - **Post-Verification Behavior**: Auto-login immediately upon successful OTP verification, updating store customer state, and redirecting to the storefront/cart.
> - **Signup Fields**: Initial form collects **Full Name**, **Email Address**, **Mobile Phone**, and **Password (min 6 characters)** before triggering the OTP verification screen.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades the customer registration flow in `AuthModal.tsx` and `StoreContext.tsx` from an unverified direct form submission into an authentic 2-step onboarding funnel:
  1. **Step 1 (Details Entry)**: Customer inputs Name, Email, Mobile Phone, and Password. Email format and unique registration are validated.
  2. **Step 2 (OTP Verification)**: A 6-digit OTP code is generated and tied to the pending registration session. The customer enters the 6 digits in an auto-advancing segmented input. A 60-second cooldown timer prevents spam, with a 1-click "Resend OTP" action.
  3. **Instant Auto-Login**: Upon entering the correct OTP, the new customer account is created and authenticated in `StoreContext`, their session is saved, and the modal closes with a welcome greeting.
- **Target Persona**: Retail electronics shoppers registering on web or mobile to place orders, track shipments, and claim coupons.
- **Key Value**: Prevents fake accounts and invalid email addresses while keeping onboarding under 30 seconds.

---

## 2. User Experience & Visual Design

### Step-by-Step User Flow
1. **Initiation**: The customer clicks "Register / Sign In" in the header or during checkout.
2. **Form Input (Step 1)**:
   - Clean, single-column input layout with clear labels: Full Name, Email, Mobile Phone, Password (with eye toggle).
   - "Continue to Email Verification" button.
3. **OTP Screen (Step 2)**:
   - Clear headline: `"Verify your email address"`.
   - Subtitle: `"We sent a 6-digit verification code to user@example.com"` with a quick `"Edit Email"` link to fix typos.
   - 6 individual numeric boxes with automatic focus jumping, backspace retreat, and clipboard paste support.
   - Simulation helper: Shows the generated OTP in a neat copyable helper badge for rapid testing in development/preview.
   - 60-second countdown (`"Resend code in 0:48"`). Once it reaches zero, the button switches to active `"Resend Code"`.
4. **Verification & Auto-Login**:
   - Customer clicks `"Verify & Complete Signup"` (or auto-submits on 6th digit).
   - Success state with checkmark, auto-authenticating the customer and closing the modal.

### Visual Styling & Accessibility
- Clean 60-30-10 palette adhering to the Universal Frontend Design Constitution (neutral slate canvas, sharp slate-900 / blue-600 action buttons, zero garish pill badges).
- High-contrast inputs with `focus-visible` rings and explicit error messages.
- Full responsive support for mobile touch keyboards (`inputMode="numeric"`, `pattern="[0-9]*"`).

---

## 3. Technical Architecture & Component Structure

```
┌────────────────────────────────────────────────────────┐
│                   AuthModal.tsx                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ State: authMode = 'customer_register'            │  │
│  │ Sub-step: 'input_details' | 'verify_otp'         │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          │                             │
│     [Step 1: Submit Details & Validate]                │
│                          │                             │
│                          ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ generateCustomerEmailOtp(email, regPayload)      │  │
│  │ - Creates pending signup record                  │  │
│  │ - Generates 6-digit numeric OTP                  │  │
│  │ - Starts 60s cooldown timer                      │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          │                             │
│     [Step 2: Enter & Verify 6-digit OTP]               │
│                          │                             │
│                          ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ verifyCustomerEmailOtpAndRegister(email, otp)    │  │
│  │ - Validates code against pending signup          │  │
│  │ - Commits customer account to StoreContext       │  │
│  │ - Sets currentUser & isAuthenticated = true      │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Data Model & State Additions
- **`PendingCustomerSignup`**:
  ```ts
  interface PendingCustomerSignup {
    name: string;
    email: string;
    phone: string;
    password: string;
    city?: string;
    pincode?: string;
    addressLine?: string;
    otpCode: string;
    expiresAt: number; // 10 minutes
    resendAvailableAt: number; // 60 seconds
  }
  ```
- **Context Methods**:
  - `initiateCustomerSignupOtp(payload)`: Validates email uniqueness and returns OTP data with cooldown.
  - `resendCustomerSignupOtp(email)`: Refreshes OTP code and resets 60s timer.
  - `verifyCustomerSignupOtp(email, code)`: Verifies code, creates customer profile, logs in, and returns success status.

---

## 4. Implementation Steps

1. **Update `StoreContext.tsx`**:
   - Add `pendingCustomerSignup` state or service helper.
   - Implement `initiateCustomerSignupOtp`, `resendCustomerSignupOtp`, and `verifyCustomerSignupOtp`.
   - Wire customer account persistence, auto-login (`setCurrentUser`, `setIsAuthenticated(true)`), and welcome notification.
2. **Upgrade `AuthModal.tsx`**:
   - Split `customer_register` into 2 views: `input_details` and `verify_otp`.
   - Add 6-digit auto-advancing input component with keyboard handling, paste support, and backspace navigation.
   - Add 60-second live countdown timer with resend button.
   - Add developer testing simulation banner showing the generated OTP code with a 1-click "Fill OTP" button.
3. **Verify & Test**:
   - Compile and lint using `compile_applet` and `lint_applet`.
   - Test invalid OTP handling, expired OTP, resend timer, and successful registration with automatic login.
