'use client';

/**
 * Frontend Cashfree PG JS SDK v3 Web Checkout Integration
 *
 * Responsibilities:
 * 1. Loads Cashfree JS SDK dynamically from https://sdk.cashfree.com/js/v3/cashfree.js
 * 2. Initializes Cashfree in 'sandbox' or 'production' mode
 * 3. Launches Cashfree modal checkout seamlessly
 * 4. Resolves when payment is completed and invokes verification
 */

let scriptLoadingPromise: Promise<boolean> | null = null;

export function loadCashfreeScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Cashfree) return Promise.resolve(true);

  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]'
    );

    if (existingScript) {
      if ((window as any).Cashfree) {
        resolve(true);
      } else {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.id = 'cashfree-checkout-script';

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.error('[Cashfree] Failed to load SDK from https://sdk.cashfree.com/js/v3/cashfree.js');
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export interface LaunchCashfreeOptions {
  paymentSessionId: string;
  orderId: string;
  paymentDbId?: string;
  mode?: 'sandbox' | 'production';
  returnUrl?: string;
  onSuccess: (paymentDetails?: any) => void;
  onFailure?: (errorMessage: string) => void;
  onDismiss?: () => void;
}

export async function launchCashfreeCheckout(options: LaunchCashfreeOptions): Promise<void> {
  const isLoaded = await loadCashfreeScript();

  if (!isLoaded || typeof window === 'undefined' || !(window as any).Cashfree) {
    options.onFailure?.('Unable to load Cashfree payment gateway. Please check your internet connection and try again.');
    return;
  }

  if (!options.paymentSessionId || options.paymentSessionId.startsWith('session_mock_')) {
    options.onFailure?.('Invalid or missing Cashfree payment session. Please verify that live Cashfree keys are loaded in .env.local on the server.');
    return;
  }

  const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID || '';
  const isExplicitSandbox = process.env.NEXT_PUBLIC_CASHFREE_MODE === 'sandbox';
  const mode =
    options.mode ||
    (isExplicitSandbox && appId.startsWith('TEST') ? 'sandbox' : 'production');

  try {
    const cashfree = (window as any).Cashfree({
      mode: mode,
    });

    const checkoutOptions: any = {
      paymentSessionId: options.paymentSessionId,
      redirectTarget: '_modal', // Opens popup modal
    };

    const result = await cashfree.checkout(checkoutOptions);

    if (result?.error) {
      console.warn('[Cashfree] Checkout error/dismissed:', result.error);
      const isDismiss =
        result.error?.message?.toLowerCase().includes('closed') ||
        result.error?.message?.toLowerCase().includes('dismiss') ||
        result.error?.code === 'PAYMENT_CANCELLED';
      if (isDismiss) {
        options.onDismiss?.();
      } else {
        options.onFailure?.(result.error?.message || 'Payment could not be completed.');
      }
      return;
    }

    if (result?.paymentDetails) {
      options.onSuccess(result.paymentDetails);
      return;
    }

    if (result?.redirect) {
      // User redirected
      return;
    }

    // Default completion check
    options.onSuccess(result);
  } catch (err: any) {
    console.error('[Cashfree] Checkout runtime error:', err);
    options.onFailure?.(err.message || 'Payment window encountered an issue.');
  }
}
