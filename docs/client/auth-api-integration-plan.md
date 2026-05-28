# Auth API Integration Plan — Frontend

## Current Problems
1. **Types mismatch** — `types/auth.ts` assumes `{ success, data: { accessToken, user } }` but auth-service returns `{ access_token, token_type, expires_in, user }`.
2. **No global auth state** — No AuthContext, no way for Navigation or protected routes to know if user is logged in.
3. **LoginPage uses `setTimeout` simulation** — not connected to `authService.login()`.
4. **SignUpPage uses `setTimeout` simulation** — not connected to `authService.register()`.
5. **Missing auth features** — no email verification, forgot password, reset password, logout UI.
6. **Navigation has no auth-awareness** — no login/logout buttons, no user menu.
7. **`main.jsx` has a global axios interceptor** that reads `localStorage.getItem('access_token')`, conflicting with apiClient's in-memory token approach.

---

## Task 1 — Fix types to match real API responses
**File:** `client/src/types/auth.ts`
- Change `AuthResponse` to match actual login response: `access_token`, `token_type`, `expires_in`, `user: UserPayload`.
- Add `RegisterResponse` — `{ message, user: { id, email, fullName, emailVerified } }`.
- Fix `RefreshTokenResponse` to match actual: `{ access_token, token_type, expires_in }`.
- Add types for: `ForgotPasswordResponse`, `VerifyEmailResponse`, `VerifyOtpResponse` (with `resetToken`), `ResetPasswordResponse`, `LogoutResponse`, `VerifyEmailOtpResponse`.
- Add request types: `VerifyEmailData`, `ForgotPasswordData`, `VerifyResetOtpData`, `ResetPasswordData`.

---

## Task 2 — Fix apiClient refresh logic
**File:** `client/src/services/apiClient.ts`
- Fix refresh response parsing from `response.data.data.accessToken` -> `response.data.access_token`.
- Add `setAccessToken`/`clearAccessToken` exports for AuthContext to use.
- Keep the in-memory token + refresh queue pattern — it works well.

---

## Task 3 — Create AuthContext + useAuth hook
**New file:** `client/src/contexts/AuthContext.tsx` (or `client/src/hooks/useAuth.tsx`)
- Create `AuthProvider` wrapping app that provides:
  - `user: UserPayload | null` — current user.
  - `isAuthenticated: boolean`.
  - `isLoading: boolean` — initial token check in progress.
  - `login(credentials)` — calls authService, stores token, decodes JWT for user info, sets state.
  - `register(data)` — calls authService.register, returns result.
  - `logout()` — calls authService.logout, clears token/user state.
  - `verifyEmail(email, otp)`, `forgotPassword(email)`, `verifyResetOtp(email, otp)`, `resetPassword(token, newPassword)`.
- On mount: check if token exists in apiClient (from prior session via cookie refresh), try `/auth/refresh` to restore session.
- Decode JWT payload (no library — just `atob` on the payload segment) to extract `sub`, `email`, `role` for user state.

---

## Task 4 — Expand authService with all endpoints
**File:** `client/src/services/authService.ts`
- **Fix `login()`** — parse `access_token` instead of `data.accessToken`, store token via `setLocalAccessToken`, return user info.
- **Fix `register()`** — parse actual response shape.
- **Add `refresh()`** — POST /auth/refresh, parse `access_token`.
- **Add `logout()`** — POST /auth/logout.
- **Add `verifyEmail(data)`** — POST /auth/verify-email `{ email, otp }`.
- **Add `forgotPassword(email)`** — POST /auth/forgot-password `{ email }`.
- **Add `verifyResetOtp(data)`** — POST /auth/reset-password/verify-otp `{ email, otp }`.
- **Add `resetPassword(data)`** — POST /auth/reset-password `{ token, newPassword }`.
- **Add Google OAuth URL** — just `/api/auth/google` (external redirect).

---

## Task 5 — Wire LoginPage to real auth
**File:** `client/src/pages/auth/LoginPage.tsx`
- Import and use `useAuth()` hook.
- Replace `setTimeout` with `await login({ email, password })` from context.
- Add `error` state to display API errors (e.g., "Invalid credentials", "Email not verified").
- Show email verification prompt when error code is `EMAIL_NOT_VERIFIED`.
- Wire "Continue with Google" button to `window.location.href = '/api/auth/google'`.
- Navigate to `/dashboard` on success.

---

## Task 6 — Wire SignUpPage to real auth
**File:** `client/src/pages/auth/SignUpPage.tsx`
- Import and use `useAuth()` hook.
- Replace `setTimeout` with `await register({ name, email, password })` from context.
- Add controlled inputs with `useState` for email, name, password, confirm.
- Add client-side validation (password match, password strength hint).
- Add `error` state for API errors.
- On success: navigate to `/login` with success toast/message about email verification.
- Wire Google button to `/api/auth/google`.

---

## Task 7 — Create Email Verification Page
**New file:** `client/src/pages/auth/VerifyEmailPage.tsx`
- Two-step flow or single page:
  - Shows "Check your email for OTP" message with the email.
  - 6-digit OTP input (individual digit boxes or single input).
  - Submit button -> calls `verifyEmail(email, otp)`.
  - On success: navigate to `/login` with "Email verified" message.
- Route: `/verify-email`.

---

## Task 8 — Create Forgot Password Flow
**New files:**
- `client/src/pages/auth/ForgotPasswordPage.tsx` — Email input -> calls `forgotPassword()`, stores email in state/URL params, navigates to OTP step.
- `client/src/pages/auth/VerifyResetOtpPage.tsx` — 6-digit OTP input -> calls `verifyResetOtp(email, otp)`, stores `resetToken`, navigates to new password step.
- `client/src/pages/auth/ResetPasswordPage.tsx` — New password + confirm -> calls `resetPassword(token, newPassword)`, navigates to `/login`.

Or combine into a single multi-step component.

Routes: `/forgot-password`, `/forgot-password/verify-otp`, `/forgot-password/reset`.

---

## Task 9 — Wire Navigation with auth state
**File:** `client/src/components/Navigation.jsx`
- Import `useAuth()` hook.
- If authenticated: replace static nav links with a user menu (avatar + name dropdown with Logout, Dashboard, Profile).
- If not authenticated: show "Login" and "Sign Up" buttons at the end of the nav bar.
- Logout button calls `logout()` from context.

---

## Task 10 — Handle Google OAuth callback redirect
**File:** `client/src/AppRoutes.jsx` + new handler
- Auth-service Google callback redirects to `FRONTEND_OAUTH_SUCCESS_URL#access_token=<JWT>&expires_in=900`.
- Create a `GoogleCallbackPage.tsx` that:
  - Reads the URL hash fragment for `access_token`.
  - Stores the token via `setLocalAccessToken()`.
  - Decodes JWT to get user info.
  - Updates auth state.
  - Navigates to `/dashboard`.
- Route: `/oauth/google/callback`.
- Update vite config to not proxy this path (it's a frontend route, not API).

---

## Task 11 — Create ProtectedRoute wrapper
**New file:** `client/src/components/ProtectedRoute.tsx`
- Checks `isAuthenticated` from `useAuth()`.
- If not authenticated and not loading: redirect to `/login` with `?redirect=<original_path>`.
- If loading: show a spinner/skeleton.
- If authenticated: render children (`<Outlet />`).
- Update `AppRoutes.jsx` to wrap protected routes (courses, dashboard, payment, search, analytics, advisor).

---

## Task 12 — Wire AuthProvider in main.jsx & cleanup
**File:** `client/src/main.jsx`
- Remove the global `axios.interceptors.request` that reads `localStorage` (conflicts with apiClient's in-memory approach).
- Wrap `<AppRoutes />` with `<AuthProvider>`.
- Keep `QueryClientProvider` and `BrowserRouter` as outer wrappers.

---

## Task 13 — Add routes for new auth pages
**File:** `client/src/AppRoutes.jsx`
- Add routes: `/verify-email`, `/forgot-password`, `/forgot-password/verify-otp`, `/forgot-password/reset`, `/oauth/google/callback`.

---

## Implementation Order

| # | Task | Depends On |
|---|------|-----------|
| 1 | Fix types/auth.ts | — |
| 2 | Fix apiClient.ts refresh parsing | — |
| 3 | Create AuthContext + useAuth | 1, 2 |
| 4 | Expand authService with all endpoints | 1, 2 |
| 5 | Wire LoginPage | 3, 4 |
| 6 | Wire SignUpPage | 3, 4 |
| 7 | Wire Navigation with auth | 3 |
| 8 | Create VerifyEmailPage | 3, 4 |
| 9 | Create Forgot/Reset Password pages | 3, 4 |
| 10 | Google OAuth callback handler | 3 |
| 11 | ProtectedRoute wrapper | 3 |
| 12 | Wire AuthProvider in main.jsx | 3 |
| 13 | Add new routes in AppRoutes.jsx | 8, 9, 10, 11 |
