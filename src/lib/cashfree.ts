export interface CashfreeConfig {
  appId: string;
  secretKey: string;
  mode: 'sandbox' | 'production';
  apiVersion: string;
}

export class CashfreeError extends Error {
  statusCode: number;
  code?: string;
  description?: string;

  constructor(message: string, statusCode = 500, code?: string, description?: string) {
    super(message);
    this.name = 'CashfreeError';
    this.statusCode = statusCode;
    this.code = code;
    this.description = description;
  }
}

/**
 * Validates and retrieves Cashfree PG credentials.
 */
export function getCashfreeConfig(): CashfreeConfig {
  const appId =
    process.env.CASHFREE_APP_ID?.trim() ||
    process.env.NEXT_PUBLIC_CASHFREE_APP_ID?.trim() ||
    '1454372309defa4f81be166e22e2734541';
  const secretKey =
    process.env.CASHFREE_SECRET_KEY?.trim() || '';

  // Auto-detect production vs sandbox mode
  const isExplicitSandbox =
    process.env.CASHFREE_MODE?.trim() === 'sandbox' ||
    process.env.NEXT_PUBLIC_CASHFREE_MODE?.trim() === 'sandbox';
  const isTestKey = appId.startsWith('TEST') || secretKey.includes('_test_');
  const mode: 'sandbox' | 'production' = isExplicitSandbox && isTestKey ? 'sandbox' : 'production';
  const apiVersion = '2023-08-01';

  return { appId, secretKey, mode, apiVersion };
}

export function getCashfreeBaseUrl(): string {
  const { mode } = getCashfreeConfig();
  return mode === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

export interface CashfreeCustomerDetails {
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface CreateCashfreeOrderParams {
  order_id?: string;
  order_amount: number; // in Rupees (e.g. 150.00 or 1000.00)
  order_currency?: string;
  customer_details: CashfreeCustomerDetails;
  order_note?: string;
  return_url?: string;
}

export interface CashfreeOrderResult {
  order_id: string;
  cf_order_id: string;
  payment_session_id: string;
  order_status: string;
  order_amount: number;
  order_currency: string;
}

/**
 * Creates an order on Cashfree Payment Gateway v2023-08-01
 */
export async function createCashfreeOrder(
  params: CreateCashfreeOrderParams
): Promise<CashfreeOrderResult> {
  const { appId, secretKey, apiVersion } = getCashfreeConfig();
  const baseUrl = getCashfreeBaseUrl();

  if (!appId || !secretKey) {
    throw new CashfreeError(
      'CASHFREE_APP_ID or CASHFREE_SECRET_KEY is missing in server environment. Please configure .env.production / .env.local on the server.',
      500,
      'MISSING_CREDENTIALS'
    );
  }

  // Validate amount
  if (typeof params.order_amount !== 'number' || params.order_amount <= 0) {
    throw new CashfreeError('Order amount must be a positive number.', 400, 'INVALID_AMOUNT');
  }

  // Format order_id (max 45 chars, alphanumeric, _ -)
  const rawId = params.order_id || `cf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const cleanOrderId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 45);

  // Format customer phone (min 10 digits required by Cashfree)
  let cleanPhone = (params.customer_details.customer_phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) {
    cleanPhone = '9999999999';
  } else if (cleanPhone.length > 10) {
    cleanPhone = cleanPhone.slice(-10);
  }

  // Format customer_id (max 50 chars)
  const cleanCustomerId = (params.customer_details.customer_id || `cust_${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);

  const cleanCustomerName = (params.customer_details.customer_name || 'Participant').trim().slice(0, 100);
  const cleanCustomerEmail = (params.customer_details.customer_email || 'student@parinaam.fest').trim().toLowerCase().slice(0, 100);

  const payload: any = {
    order_id: cleanOrderId,
    order_amount: Number(params.order_amount.toFixed(2)),
    order_currency: (params.order_currency || 'INR').trim().toUpperCase(),
    customer_details: {
      customer_id: cleanCustomerId,
      customer_name: cleanCustomerName,
      customer_email: cleanCustomerEmail,
      customer_phone: cleanPhone,
    },
    order_note: (params.order_note || 'Parinaam 2026 Techfest').slice(0, 200),
  };

  if (params.return_url) {
    payload.order_meta = {
      return_url: params.return_url,
    };
  }

  try {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': apiVersion,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Cashfree Error] Order creation failed:', res.status, data);
      throw new CashfreeError(
        data.message || data.error || 'Failed to create Cashfree order',
        res.status,
        data.code || 'CF_ORDER_ERROR',
        data.message
      );
    }

    if (!data.payment_session_id) {
      console.error('[Cashfree Error] Missing payment_session_id in response:', data);
      throw new CashfreeError(
        'Missing payment_session_id from Cashfree gateway',
        502,
        'MISSING_SESSION_ID'
      );
    }

    return {
      order_id: data.order_id || cleanOrderId,
      cf_order_id: String(data.cf_order_id || data.order_id || cleanOrderId),
      payment_session_id: data.payment_session_id,
      order_status: data.order_status || 'ACTIVE',
      order_amount: data.order_amount,
      order_currency: data.order_currency || 'INR',
    };
  } catch (err: any) {
    if (err instanceof CashfreeError) throw err;
    console.error('[Cashfree Network Error]', err);
    throw new CashfreeError(
      `Cashfree gateway error: ${err.message || 'Network failure'}`,
      503,
      'GATEWAY_UNAVAILABLE'
    );
  }
}

/**
 * Fetches order details from Cashfree to check status
 */
export async function getCashfreeOrder(orderId: string): Promise<any> {
  const { appId, secretKey, apiVersion } = getCashfreeConfig();
  const baseUrl = getCashfreeBaseUrl();

  const cleanOrderId = orderId.trim();

  try {
    const res = await fetch(`${baseUrl}/orders/${encodeURIComponent(cleanOrderId)}`, {
      method: 'GET',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': apiVersion,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[Cashfree Error] Fetch order failed:', res.status, data);
      throw new CashfreeError(
        data.message || 'Failed to fetch Cashfree order',
        res.status,
        data.code || 'FETCH_ORDER_ERROR'
      );
    }

    return data;
  } catch (err: any) {
    if (err instanceof CashfreeError) throw err;
    throw new CashfreeError(
      `Cashfree fetch order error: ${err.message}`,
      503,
      'GATEWAY_UNAVAILABLE'
    );
  }
}

/**
 * Fetches all payments associated with an order from Cashfree
 */
export async function getCashfreeOrderPayments(orderId: string): Promise<any[]> {
  const { appId, secretKey, apiVersion } = getCashfreeConfig();
  const baseUrl = getCashfreeBaseUrl();

  const cleanOrderId = orderId.trim();

  try {
    const res = await fetch(`${baseUrl}/orders/${encodeURIComponent(cleanOrderId)}/payments`, {
      method: 'GET',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': apiVersion,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[Cashfree Error] Fetch payments failed:', res.status, data);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.warn('[Cashfree Error] getCashfreeOrderPayments error:', err.message);
    return [];
  }
}

/**
 * Verifies if an order is paid on Cashfree
 */
export async function verifyCashfreePayment(orderId: string): Promise<{
  isPaid: boolean;
  order: any;
  payment?: any;
}> {
  try {
    const order = await getCashfreeOrder(orderId);
    if (order.order_status === 'PAID') {
      const payments = await getCashfreeOrderPayments(orderId);
      const successfulPayment = payments.find((p: any) => p.payment_status === 'SUCCESS') || payments[0];
      return { isPaid: true, order, payment: successfulPayment };
    }

    // Secondary check: check payments array
    const payments = await getCashfreeOrderPayments(orderId);
    const successfulPayment = payments.find((p: any) => p.payment_status === 'SUCCESS');
    if (successfulPayment) {
      return { isPaid: true, order, payment: successfulPayment };
    }

    return { isPaid: false, order };
  } catch (err: any) {
    console.error('[Cashfree verify error]', err);
    return { isPaid: false, order: null };
  }
}
