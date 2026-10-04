export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCashfreeOrderPayments, CashfreeError } from '@/lib/cashfree';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/order-status/:order_id
 * Queries the Cashfree API for payments associated with an order.
 * Useful when client connectivity dropped or browser closed before checkout handler completed.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id } = await params;

    if (!order_id || !order_id.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid order_id parameter.' },
        { status: 400 }
      );
    }

    // Ownership check for regular users; super_admin can query any order
    if (session.role !== 'super_admin') {
      const pRes = await db.query(
        `SELECT user_id FROM payments WHERE cf_order_id = $1 OR razorpay_order_id = $1 OR id::text = $1`,
        [order_id]
      );
      if (pRes.rows.length > 0 && pRes.rows[0].user_id !== session.userId) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const payments = await getCashfreeOrderPayments(order_id);

    return NextResponse.json({
      success: true,
      order_id,
      count: Array.isArray(payments) ? payments.length : 0,
      items: payments,
    });
  } catch (err: any) {
    if (err instanceof CashfreeError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }

    console.error('[GET /api/order-status] Error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve order payment status.' },
      { status: 500 }
    );
  }
}

