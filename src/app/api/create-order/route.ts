export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { CashfreeError } from '@/lib/cashfree';
import { calculatePayableFees } from '@/lib/institutionPolicy';

interface CreateOrderRequestBody {
  amount?: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string | number>;
  order_id?: string;
  type?: 'platform_fee' | 'event_fee';
  event_ids?: string[];
  event_id?: string;
}

/**
 * POST /api/create-order
 * Creates a Razorpay Order server-side with authoritative amount computation.
 */
export async function POST(req: NextRequest) {
  try {
    let body: CreateOrderRequestBody = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const session = await getSessionUser(req);
    const userId = session?.userId;

    let computedAmountPaise: number | null = null;
    let internalPaymentId: string | null = null;
    let internalNotes: Record<string, string | number> = { ...(body.notes || {}) };
    let internalReceipt = (body.receipt || '').trim();

    // 1. If explicit festival pass or multi-event registration type is provided
    if (body.type === 'platform_fee') {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Authentication required for festival pass checkout.' },
          { status: 401 }
        );
      }

      // Compute platform fee server-side from database configuration
      const configRes = await db.query(
        `SELECT value FROM platform_config WHERE key = 'platform_fee'`
      );
      const feeRupees = parseInt(configRes.rows[0]?.value || '1000', 10);
      computedAmountPaise = feeRupees * 100;

      // Check if already paid
      const userRes = await db.query(
        `SELECT is_amrita_student, platform_fee_paid FROM users WHERE id = $1`,
        [userId]
      );
      const user = userRes.rows[0];
      if (user?.platform_fee_paid) {
        return NextResponse.json(
          { success: false, error: 'Festival delegate pass is already paid.' },
          { status: 409 }
        );
      }

      // Create internal payment record
      const payRes = await db.query(
        `INSERT INTO payments (user_id, type, amount, status)
         VALUES ($1, 'platform_fee', $2, 'created')
         RETURNING id`,
        [userId, computedAmountPaise]
      );
      internalPaymentId = payRes.rows[0].id;
      internalReceipt = `pf_${Date.now().toString().slice(-8)}`;
      internalNotes = {
        ...internalNotes,
        userId,
        type: 'platform_fee',
        order_id: internalPaymentId || '',
      };
    } else if (body.type === 'event_fee') {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Authentication required for event registration checkout.' },
          { status: 401 }
        );
      }

      const rawEventIds = Array.isArray(body.event_ids) && body.event_ids.length > 0
        ? body.event_ids
        : body.event_id
          ? [body.event_id]
          : [];

      if (rawEventIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'At least one event ID is required.' },
          { status: 400 }
        );
      }

      const eventIds = [...new Set(rawEventIds)].sort();

      // Lock & fetch events to compute server-side amount
      const evPlaceholders = (eventIds as string[]).map((_: string, idx: number) => `$${idx + 1}`).join(', ');
      const eventsRes = await db.query(
        `SELECT id, name, fee, capacity, enrolled, registration_open, status
         FROM events
         WHERE id IN (${evPlaceholders})
         ORDER BY id`,
        eventIds
      );

      if (eventsRes.rows.length !== eventIds.length) {
        return NextResponse.json(
          { success: false, error: 'One or more selected events were not found.' },
          { status: 404 }
        );
      }

      const userRes = await db.query(
        `SELECT id, email, role, is_amrita_student, platform_fee_paid FROM users WHERE id = $1`,
        [userId]
      );
      const user = userRes.rows[0];

      // Calculate fee strictly server-side
      const feeCalc = calculatePayableFees(user, eventsRes.rows);
      computedAmountPaise = feeCalc.totalFee * 100;

      // Insert internal payment record
      const payRes = await db.query(
        `INSERT INTO payments (user_id, type, amount, status)
         VALUES ($1, 'event_fee', $2, 'created')
         RETURNING id`,
        [userId, computedAmountPaise]
      );
      internalPaymentId = payRes.rows[0].id;
      internalReceipt = `ev_${Date.now().toString().slice(-8)}`;
      internalNotes = {
        ...internalNotes,
        userId,
        type: 'event_fee',
        order_id: internalPaymentId || '',
      };
    } else if (body.order_id || body.notes?.order_id) {
      // 2. Internal order reference lookup (if order already created in DB)
      const lookupId = (body.order_id || body.notes?.order_id) as string;
      const existingPayRes = await db.query(
        `SELECT id, amount, user_id FROM payments WHERE id = $1`,
        [lookupId]
      );
      if (existingPayRes.rows.length > 0) {
        internalPaymentId = existingPayRes.rows[0].id;
        // Compute amount strictly from DB record
        computedAmountPaise = existingPayRes.rows[0].amount;
      }
    }

    // 3. If direct amount is provided for general/testing orders, validate server-side
    if (computedAmountPaise === null) {
      if (typeof body.amount === 'number') {
        if (!Number.isInteger(body.amount) || body.amount < 100) {
          return NextResponse.json(
            { success: false, error: 'Amount must be an integer >= 100 subunits (e.g. 100 paise).' },
            { status: 400 }
          );
        }
        computedAmountPaise = body.amount;
      } else {
        return NextResponse.json(
          { success: false, error: 'Missing order details or valid amount.' },
          { status: 400 }
        );
      }
    }

    // Generate internal receipt reference if empty (max 40 chars)
    if (!internalReceipt) {
      internalReceipt = `rcpt_${Date.now().toString().slice(-10)}_${Math.random().toString(36).substring(2, 6)}`;
    }
    if (internalReceipt.length > 40) {
      internalReceipt = internalReceipt.substring(0, 40);
    }

    // Validate currency
    const currency = (body.currency || 'INR').trim().toUpperCase();

    // Create Cashfree Order
    const { createCashfreeOrder } = await import('@/lib/cashfree');
    const orderRupees = computedAmountPaise / 100;
    const cleanOrderId = `cf_ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const userRes = userId ? await db.query(`SELECT full_name, email, phone FROM users WHERE id = $1`, [userId]) : { rows: [] };
    const uInfo = userRes.rows[0] || {};

    const cfOrder = await createCashfreeOrder({
      order_id: cleanOrderId,
      order_amount: orderRupees,
      order_currency: currency,
      customer_details: {
        customer_id: userId || `guest_${Date.now()}`,
        customer_name: uInfo.full_name || 'Fest Participant',
        customer_email: uInfo.email || 'participant@parinaam.fest',
        customer_phone: uInfo.phone || '9999999999',
      },
      order_note: `Parinaam Order ${internalReceipt}`,
    });

    // Persist order details against internal order record in database if present
    if (internalPaymentId) {
      await db.query(
        `UPDATE payments SET cf_order_id = $1, payment_session_id = $2, razorpay_order_id = $3, updated_at = NOW() WHERE id = $4`,
        [cfOrder.order_id, cfOrder.payment_session_id, cfOrder.order_id, internalPaymentId]
      );
    } else {
      // Create a payment record to persist the order id for idempotency
      try {
        await db.query(
          `INSERT INTO payments (user_id, type, amount, cf_order_id, payment_session_id, razorpay_order_id, status)
           VALUES ($1, 'standard_order', $2, $3, $4, $3, 'created')`,
          [userId || null, computedAmountPaise, cfOrder.order_id, cfOrder.payment_session_id]
        );
      } catch (dbErr) {
        console.warn('[Payments] Could not persist test payment record:', (dbErr as Error).message);
      }
    }

    // Return order details to browser
    return NextResponse.json({
      success: true,
      order_id: cfOrder.order_id,
      cf_order_id: cfOrder.cf_order_id,
      payment_session_id: cfOrder.payment_session_id,
      amount: computedAmountPaise,
      amount_in_rupees: orderRupees,
      currency: cfOrder.order_currency,
      payment_db_id: internalPaymentId,
    });
  } catch (err: any) {
    if (err instanceof CashfreeError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }

    console.error('[POST /api/create-order] Unexpected error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: 'Internal server error while creating order.' },
      { status: 500 }
    );
  }
}
