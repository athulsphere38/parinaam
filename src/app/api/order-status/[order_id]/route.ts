export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCashfreeOrderPayments, CashfreeError } from '@/lib/cashfree';

/**
 * GET /api/order-status/:order_id
 * Queries the Cashfree API for payments associated with an order.
 * Useful when client connectivity dropped or browser closed before checkout handler completed.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  try {
    const { order_id } = await params;

    if (!order_id || !order_id.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid order_id parameter.' },
        { status: 400 }
      );
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

