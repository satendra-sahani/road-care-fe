// ─────────────────────────────────────────────────────────────────────────────
// Firebase Phone-Auth Wrapper (Web)
// ─────────────────────────────────────────────────────────────────────────────
// Web parity of road-care-android/src/services/firebaseAuth.ts.
//
// Flow:
//   1. sendOtp(mobile)  → renders an invisible reCAPTCHA, calls
//                         signInWithPhoneNumber(), keeps ConfirmationResult
//                         in module state, returns the E.164 phone.
//   2. verifyOtp(code)  → confirms the SMS code, returns the Firebase ID
//                         token to POST to /api/common/auth/firebase-signin.
//   3. reset()          → clears in-flight state and signs out the local
//                         Firebase user.
//
// Firebase project (matches backend service account):
//   project_id: gen-lang-client-0032964735
//
// Required NEXT_PUBLIC_* env vars (Firebase Console → Project Settings →
// Your apps → "Web" app → SDK setup and configuration):
//   NEXT_PUBLIC_FIREBASE_API_KEY
//   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN     (e.g. "...firebaseapp.com")
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID
//   NEXT_PUBLIC_FIREBASE_APP_ID
// Optional:
//   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
//   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
} from 'firebase/auth';

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Init lazily so SSR doesn't try to touch window/auth before the browser is
// ready. Re-using the existing app on hot reload prevents the
// "Firebase: Firebase App named '[DEFAULT]' already exists" warning.
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

const isPlaceholder = (val: string | undefined): boolean => {
  if (!val) return true;
  // Detect the TODO_* placeholders we ship in .env.local until the real
  // Web app config is registered in Firebase Console. Without this check
  // the SDK initialises "successfully" with junk values, then hits Google
  // with the bad key and returns 400 mid-flow — the saga's fallback
  // never sees a recognised error code, so OTP appears stuck.
  return /^todo[_-]/i.test(val) || val.includes('placeholder');
};

const getFirebaseApp = (): FirebaseApp => {
  if (app) return app;
  if (
    !firebaseConfig.apiKey ||
    isPlaceholder(firebaseConfig.apiKey) ||
    !firebaseConfig.appId ||
    isPlaceholder(firebaseConfig.appId)
  ) {
    throw new Error(
      'Firebase config is missing. Set NEXT_PUBLIC_FIREBASE_* env vars in .env.local — see src/services/firebaseAuth.ts header for the full list.'
    );
  }
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return app;
};

const getFirebaseAuth = (): Auth => {
  if (authInstance) return authInstance;
  authInstance = getAuth(getFirebaseApp());
  return authInstance;
};

// ─── MODULE STATE ───────────────────────────────────────────────────────────
let pendingConfirmation: ConfirmationResult | null = null;
let pendingPhoneE164: string | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

// ─── HELPERS ────────────────────────────────────────────────────────────────
/**
 * Convert any Indian mobile entry to E.164 ("+919876543210"). Mirrors the
 * Android implementation so a phone typed on web ends up identical to the
 * one Firebase verifies natively on the device.
 */
export const toE164 = (mobile: string): string => {
  const cleaned = String(mobile || '').replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('0')) return `+91${cleaned.slice(1)}`;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return `+91${cleaned}`;
};

/**
 * Build (or reuse) the invisible reCAPTCHA verifier bound to the given
 * container. The Web SDK requires this — it's the equivalent of Play
 * Integrity on the Android client. Container ID is whatever DOM node the
 * caller renders (e.g. `<div id="recaptcha-container" />` on the login page).
 *
 * We only ever instantiate one verifier per page load. If the caller calls
 * sendOtp multiple times we re-render the same widget rather than building
 * a new one (Firebase throws if there are duplicates on the page).
 */
const getOrCreateRecaptcha = (containerId: string): RecaptchaVerifier => {
  if (recaptchaVerifier) return recaptchaVerifier;
  recaptchaVerifier = new RecaptchaVerifier(getFirebaseAuth(), containerId, {
    size: 'invisible',
    // reCAPTCHA solve callback — Firebase will then proceed with sign-in.
    callback: () => {
      /* no-op — we don't need to do anything in the callback */
    },
    'expired-callback': () => {
      // If the token expires before the user submits, force a fresh widget
      // on the next attempt by clearing our reference.
      try { recaptchaVerifier?.clear(); } catch { /* noop */ }
      recaptchaVerifier = null;
    },
  });
  return recaptchaVerifier;
};

/**
 * Translate Firebase web auth error codes into user-friendly messages.
 * Mirrors the Android version.
 */
export const firebaseAuthErrorMessage = (err: any): string => {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Please enter a valid mobile number.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again after some time.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded for today. Please try again later.';
    case 'auth/invalid-verification-code':
      return 'Incorrect OTP. Please check the code and try again.';
    case 'auth/code-expired':
      return 'OTP expired. Please request a new one.';
    case 'auth/session-expired':
      return 'OTP session expired. Please request a new one.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/missing-verification-code':
      return 'Please enter the 6-digit OTP.';
    case 'auth/captcha-check-failed':
      return 'Verification challenge failed. Please refresh and try again.';
    case 'auth/web-storage-unsupported':
      return 'Your browser blocks local storage. Please enable it (or disable private mode) and retry.';
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is not enabled in Firebase. Please contact support.';
    default:
      return err?.message || 'Something went wrong. Please try again.';
  }
};

// ─── PUBLIC API ─────────────────────────────────────────────────────────────
export const firebaseAuth = {
  /**
   * Render the invisible reCAPTCHA in `containerId` (must already be in the
   * DOM) and request Firebase to send an SMS to the given mobile. Stores
   * the ConfirmationResult in module state for verifyOtp() to consume.
   */
  sendOtp: async (
    mobile: string,
    containerId = 'firebase-recaptcha-container'
  ): Promise<{ phoneE164: string }> => {
    const phoneE164 = toE164(mobile);
    const verifier = getOrCreateRecaptcha(containerId);
    const confirmation = await signInWithPhoneNumber(getFirebaseAuth(), phoneE164, verifier);
    pendingConfirmation = confirmation;
    pendingPhoneE164 = phoneE164;
    return { phoneE164 };
  },

  /**
   * Verify the 6-digit SMS code. Returns a Firebase ID token that the
   * backend's `/firebase-signin` endpoint expects.
   */
  verifyOtp: async (code: string): Promise<{ idToken: string; phoneE164: string }> => {
    if (!pendingConfirmation) {
      throw new Error(
        'No pending Firebase OTP. Please request a new code from the previous step.'
      );
    }
    const userCredential = await pendingConfirmation.confirm(code);
    if (!userCredential || !userCredential.user) {
      throw new Error('OTP confirmation failed.');
    }
    const idToken = await userCredential.user.getIdToken(/* forceRefresh */ true);
    const phoneE164 = pendingPhoneE164 || userCredential.user.phoneNumber || '';
    return { idToken, phoneE164 };
  },

  /**
   * Re-send the SMS for the same phone. Recreates the verifier so the
   * reCAPTCHA widget is freshly mounted (Firebase rejects re-use after
   * a successful verification).
   */
  resendOtp: async (
    mobile: string,
    containerId = 'firebase-recaptcha-container'
  ): Promise<{ phoneE164: string }> => {
    pendingConfirmation = null;
    try { recaptchaVerifier?.clear(); } catch { /* noop */ }
    recaptchaVerifier = null;
    return firebaseAuth.sendOtp(mobile, containerId);
  },

  /** Drop in-flight confirmation + sign the local Firebase user out. */
  reset: async (): Promise<void> => {
    pendingConfirmation = null;
    pendingPhoneE164 = null;
    try { recaptchaVerifier?.clear(); } catch { /* noop */ }
    recaptchaVerifier = null;
    try {
      const auth = getFirebaseAuth();
      if (auth.currentUser) await signOut(auth);
    } catch { /* noop */ }
  },

  hasPendingConfirmation: (): boolean => pendingConfirmation !== null,
  getPendingPhone: (): string | null => pendingPhoneE164,
};
