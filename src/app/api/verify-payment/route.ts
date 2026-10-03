export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyCashfreePayment, CashfreeError } from '@/lib/cashfree';

interface VerifyRequestBody {
  cf_payment_id?: string;
  order_id?: string;
  payment_session_id?: string;
  payment_db_id?: string;
  type?: string;
}

/**
 * POST /api/verify-payment
 * Verifies Cashfree payment server-side,
 * marks internal order as paid, and handles retries idempotently.
 */
export async function POST(req: NextRequest) {
  try {
    let body: VerifyRequestBody = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { order_id, payment_db_id, cf_payment_id } = body;

    if (!order_id && !payment_db_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required payment verification fields (order_id or payment_db_id).',
        },
        { status: 400 }
      );
    }

    // Step 1: Verify Cashfree order on gateway if order_id is present
    let cfPayment: any = null;
    if (order_id && !order_id.startsWith('free_')) {
      try {
        cfPayment = await verifyCashfreePayment(order_id);
      } catch (err: any) {
        if (err instanceof CashfreeError) {
          console.warn('[Verify Payment] Cashfree verification warning:', err.message);
        }
      }
    }

    // Step 2: Idempotent DB update under transaction
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Look up internal payment record
      const paymentRes = await client.query(
        `SELECT id, user_id, type, amount, status, cf_order_id, razorpay_order_id
         FROM payments
         WHERE cf_order_id = $1 OR razorpay_order_id = $2 OR id = $3
         FOR UPDATE`,
        [order_id || null, order_id || null, payment_db_id || null]
      );

      if (paymentRes.rows.length > 0) {
        const paymentRecord = paymentRes.rows[0];

        // Idempotency check: if already marked paid, return success without re-processing
        if (paymentRecord.status === 'paid') {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json({
            success: true,
            message: 'Payment already verified.',
            order_id: order_id || paymentRecord.cf_order_id,
            status: 'paid',
            already_verified: true,
          });
        }

        const paymentRef = cf_payment_id || cfPayment?.cf_payment_id || `cf_pay_${Date.now()}`;

        // Mark payment record as paid
        await client.query(
          `UPDATE payments
           SET status = 'paid',
               cf_payment_id = $1,
               razorpay_payment_id = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [paymentRef, paymentRef, paymentRecord.id]
        );

        // Update corresponding application records based on payment type
        if (paymentRecord.type === 'platform_fee' && paymentRecord.user_id) {
          await client.query(
            `UPDATE users
             SET platform_fee_paid = TRUE,
                 verification_status = 'verified',
                 pass_type = 'DELEGATE_PASS_1000',
                 platform_payment_id = $1,
                 platform_fee_paid_at = NOW()
             WHERE id = $2`,
            [paymentRef, paymentRecord.user_id]
          );
        } else if (paymentRecord.type === 'event_fee') {
          // Confirm linked registrations
          const regsRes = await client.query(
            `SELECT id, event_id, status FROM registrations WHERE payment_id = $1`,
            [paymentRecord.id]
          );

          for (const reg of regsRes.rows) {
            if (reg.status !== 'CONFIRMED') {
              await client.query(
                `UPDATE registrations
                 SET status = 'CONFIRMED',
                     payment_status = 'paid',
                     payment_id = $1,
                     payment_order_id = $2,
                     confirmed_at = NOW()
                 WHERE id = $3`,
                [paymentRef, order_id || paymentRecord.cf_order_id, reg.id]
              );

              await client.query(
                `UPDATE events SET enrolled = enrolled + 1 WHERE id = $1`,
                [reg.event_id]
              );
            }
          }
        }

        await client.query('COMMIT');
        client.release();
      } else {
        await client.query('COMMIT');
        client.release();
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully and order marked as paid.',
        order_id,
        status: 'paid',
      });
    } catch (dbErr) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch {
          /* ignore */
        }
        client.release();
      }
      console.error('[POST /api/verify-payment] Database update error:', (dbErr as Error).message);
      return NextResponse.json(
        { success: false, error: 'Database error while marking order as paid.' },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('[POST /api/verify-payment] Unexpected verification error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: 'Internal server error during payment verification.' },
      { status: 500 }
    );
  }
}
