export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { PoolClient } from 'pg';
import { db } from '@/lib/db';
import { getSessionUser, signToken, verifyRegistrationToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';
import { success, error, unauthorized, serverError } from '@/lib/apiResponse';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// POST /api/payments/verify — verify Cashfree / payment and confirm registrations
export async function POST(req: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const session = await getSessionUser(req);
    const body = await req.json();
    const {
      payment_db_id,
      order_id,
      cf_order_id,
      razorpay_order_id,
      cf_payment_id,
      razorpay_payment_id,
      razorpay_signature,
      registration_token,
      type,
    } = body;

    const effectiveOrderId = order_id || cf_order_id || razorpay_order_id;

    let targetUserId = session?.userId;

    if (!targetUserId && (payment_db_id || effectiveOrderId)) {
      const pRes = await db.query(
        `SELECT user_id FROM payments WHERE id::text = $1 OR cf_order_id = $2 OR razorpay_order_id = $3`,
        [payment_db_id ?? null, effectiveOrderId ?? null, effectiveOrderId ?? null]
      );
      if (pRes.rows.length > 0) {
        targetUserId = pRes.rows[0].user_id;
      }
    }

    if (!targetUserId && !(type === 'platform_fee' && registration_token)) {
      return unauthorized();
    }

    // =========================================================================
    // Cashfree / Gateway Verification
    // =========================================================================
    const { verifyCashfreePayment } = await import('@/lib/cashfree');
    let isPaymentValid = false;
    let cfPaymentDetails: any = null;

    if (effectiveOrderId) {
      try {
        const cfResult = await verifyCashfreePayment(effectiveOrderId);
        if (cfResult.isPaid || (cfResult.order && (cfResult.order.order_status === 'PAID' || cfResult.order.order_status === 'ACTIVE'))) {
          isPaymentValid = true;
          cfPaymentDetails = cfResult.payment || cfResult.order;
        }
      } catch (e: any) {
        console.warn('[Cashfree Verify Warning]', e.message);
      }
    }

    // Development fallback
    if (!isPaymentValid && (process.env.NODE_ENV === 'development' || process.env.CASHFREE_MODE === 'sandbox')) {
      isPaymentValid = true;
    }

    if (!isPaymentValid) {
      return error('Payment verification failed on gateway. Please try again.', 400);
    }

    // Resolved payment identifier
    const payId: string =
      cf_payment_id ||
      cfPaymentDetails?.cf_payment_id ||
      razorpay_payment_id ||
      `cfpay_${Date.now()}`;
    const sig: string = razorpay_signature || 'cf_verified';

    // =========================================================================
    // 1. PLATFORM FEE VERIFICATION & ATOMIC USER CREATION FOR OUTSIDE USERS
    // =========================================================================
    if (type === 'platform_fee') {
      let targetUser: any = null;

      if (registration_token) {
        // Outside student registration verification (User row did NOT exist prior to payment)
        const regPayload = await verifyRegistrationToken(registration_token);
        if (!regPayload || !regPayload.email || !regPayload.password_hash) {
          return error('Invalid or expired registration token. Please register again.', 400);
        }

        client = await db.getClient();
        try {
          // Ensure schema columns exist
          await client.query(`
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS cf_order_id TEXT;
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS cf_payment_id TEXT;
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_session_id TEXT;
          `).catch(() => {});

          await client.query('BEGIN');

          // Idempotency check: Look up existing user by email
          const existingUserRes = await client.query(
            `SELECT id, full_name, email, role, qr_token, verification_status, platform_fee_paid, pass_type
             FROM users WHERE email = $1 FOR UPDATE`,
            [regPayload.email.toLowerCase().trim()]
          );

          if (existingUserRes.rows.length > 0) {
            targetUser = existingUserRes.rows[0];
            await client.query(
              `UPDATE users
               SET platform_fee_paid = TRUE,
                   verification_status = 'verified',
                   pass_type = 'DELEGATE_PASS_1000',
                   platform_payment_id = $1,
                   platform_fee_paid_at = NOW()
               WHERE id = $2`,
              [payId, targetUser.id]
            );
            targetUser.platform_fee_paid = true;
            targetUser.verification_status = 'verified';
            targetUser.pass_type = 'DELEGATE_PASS_1000';
          } else if (regPayload) {
            // Create outside user row if not yet inserted
            const qrToken = regPayload.qr_token || (uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').slice(0, 8));
            const userInsertRes = await client.query(
              `INSERT INTO users (
                email, password_hash, full_name, phone, college_name,
                is_amrita_student, roll_number, department, year_of_study, city,
                verification_status, qr_token, email_verify_token, email_verified,
                platform_fee_paid, id_card_url, pass_type, platform_payment_id, platform_fee_paid_at
              ) VALUES ($1,$2,$3,$4,$5,FALSE,$6,$7,$8,$9,'verified',$10,$11,TRUE,TRUE,$12,'DELEGATE_PASS_1000',$13,NOW())
              RETURNING id, full_name, email, role, qr_token, verification_status, platform_fee_paid, pass_type`,
              [
                regPayload.email.toLowerCase().trim(),
                regPayload.password_hash,
                regPayload.full_name,
                regPayload.phone,
                regPayload.college_name,
                regPayload.roll_number || null,
                regPayload.department || null,
                regPayload.year_of_study || null,
                regPayload.city || null,
                qrToken,
                regPayload.emailVerifyToken || uuidv4(),
                regPayload.id_card_url || null,
                payId,
              ]
            );
            targetUser = userInsertRes.rows[0];
          }

          // Insert or update payment record linked to newly created user
          const pRes = await client.query(
            `SELECT id, status FROM payments WHERE (cf_order_id = $1 OR razorpay_order_id = $2) AND type = 'platform_fee' FOR UPDATE`,
            [effectiveOrderId ?? null, effectiveOrderId ?? null]
          );

          if (pRes.rows.length === 0) {
            await client.query(
              `INSERT INTO payments (user_id, type, amount, cf_order_id, cf_payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, status)
               VALUES ($1, 'platform_fee', 100000, $2, $3, $4, $5, $6, 'paid')`,
              [targetUser.id, effectiveOrderId ?? null, payId, effectiveOrderId ?? null, payId, sig]
            );
          } else if (pRes.rows[0].status !== 'paid') {
            await client.query(
              `UPDATE payments
               SET status = 'paid', cf_payment_id = $1, razorpay_payment_id = $2, razorpay_signature = $3, user_id = $4, updated_at = NOW()
               WHERE id = $5`,
              [payId, payId, sig, targetUser.id, pRes.rows[0].id]
            );
          }

          await client.query('COMMIT');
          client.release();
          client = null;
        } catch (txErr) {
          if (client) {
            try { await client.query('ROLLBACK'); } catch {}
            client.release();
            client = null;
          }
          throw txErr;
        }
      } else {
        // Logged-in user paying platform fee
        if (!targetUserId) return unauthorized();

        // Idempotency check: if payment already marked paid
        const pRes = await db.query(
          `SELECT id, status, user_id FROM payments WHERE (id::text = $1 OR cf_order_id = $2 OR razorpay_order_id = $3) AND user_id = $4`,
          [payment_db_id ?? null, effectiveOrderId ?? null, effectiveOrderId ?? null, targetUserId]
        );

        if (pRes.rows.length > 0 && pRes.rows[0].status === 'paid') {
          const uRes = await db.query(
            `SELECT id, full_name, email, role, qr_token, verification_status, platform_fee_paid, pass_type FROM users WHERE id = $1`,
            [targetUserId]
          );
          return success({
            message: 'Payment already verified!',
            user: uRes.rows[0],
            qr_token: uRes.rows[0]?.qr_token,
            already_verified: true,
          });
        }

        await db.query(
          `UPDATE payments
           SET cf_payment_id = $1, razorpay_payment_id = $2, razorpay_signature = $3, status = 'paid', updated_at = NOW()
           WHERE (id::text = $4 OR cf_order_id = $5 OR razorpay_order_id = $6) AND user_id = $7`,
          [payId, payId, sig, payment_db_id ?? null, effectiveOrderId ?? null, effectiveOrderId ?? null, targetUserId],
        );
        const userUpdateRes = await db.query(
          `UPDATE users
           SET platform_fee_paid = TRUE, 
               verification_status = 'verified', 
               pass_type = 'DELEGATE_PASS_1000', 
               platform_payment_id = $1, 
               platform_fee_paid_at = NOW()
           WHERE id = $2
           RETURNING id, full_name, email, role, qr_token, verification_status, platform_fee_paid, pass_type`,
          [payId, targetUserId],
        );
        targetUser = userUpdateRes.rows[0];
      }

      const response = success({
        message: 'Payment of ₹1000 received! Your Official Festival Pass and QR Code have been activated.',
        user: targetUser,
        qr_token: targetUser?.qr_token,
      });

      if (targetUser) {
        const token = await signToken({
          userId: targetUser.id,
          email: targetUser.email,
          role: targetUser.role as 'student' | 'club_admin' | 'super_admin',
        });
        response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
      }

      return response;
    }

    // =========================================================================
    // 2. MULTI-EVENT REGISTRATION VERIFICATION
    //
    // Transaction boundary:
    //   BEGIN
    //   → lock payment row (FOR UPDATE)           — prevent concurrent verifications
    //   → idempotency check (return if already 'paid')
    //   → fetch registrations linked to this payment only
    //   → lock event rows in deterministic order (FOR UPDATE)
    //   → for each PENDING registration:
    //       re-validate capacity under lock
    //       → CONFIRMED  (enrolled + 1) | CANCELLED (refunded)
    //   → skip CONFIRMED registrations (crash-recovery path, no double-increment)
    //   → update payment status
    //   COMMIT
    // =========================================================================
    client = await db.getClient();

    let confirmedCount = 0;
    let overbookedCount = 0;
    let paymentRecordId: string = '';
    let rzpOrderIdForReg: string | null = null;
    let needsRefund = false;

    try {
      await client.query('BEGIN');

      // ── Lock the payment row to prevent concurrent verification attempts ───
      const paymentRes = await client.query(
        `SELECT id, status, amount, cf_order_id, razorpay_order_id, user_id
         FROM payments
         WHERE (id::text = $1 OR cf_order_id = $2 OR razorpay_order_id = $3) AND user_id = $4
         FOR UPDATE`,
        [payment_db_id ?? null, effectiveOrderId ?? null, effectiveOrderId ?? null, targetUserId],
      );

      if (paymentRes.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        client = null;
        return error('Payment order record not found', 404);
      }

      const paymentRecord = paymentRes.rows[0];
      paymentRecordId = paymentRecord.id;
      rzpOrderIdForReg = paymentRecord.razorpay_order_id;

      // ── Order ID consistency check ──────────────────────────────────────────
      if (
        paymentRecord.razorpay_order_id &&
        razorpay_order_id &&
        paymentRecord.razorpay_order_id !== razorpay_order_id
      ) {
        await client.query('ROLLBACK');
        client.release();
        client = null;
        return error('Payment verification failed — order ID mismatch', 400);
      }

      // ── Idempotency: if already paid, return success without side-effects ──
      if (paymentRecord.status === 'paid') {
        await client.query('ROLLBACK');
        client.release();
        client = null;
        return success({ message: 'Payment already verified!', already_verified: true });
      }

      // ── Fetch ONLY the registrations belonging to this specific payment ────
      // The authoritative relationship is registrations.payment_id = payments.id.
      // No broad fallback based on user_id + payment_status.
      const regsRes = await client.query(
        `SELECT r.id, r.event_id, r.status, r.payment_status
         FROM registrations r
         WHERE r.payment_id = $1
         ORDER BY r.event_id`,
        [paymentRecord.id],
      );

      if (regsRes.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        client = null;
        return error('No registrations found for this payment order', 404);
      }

      const linkedRegs = regsRes.rows;

      // ── Lock all relevant event rows in deterministic (sorted UUID) order ──
      // Reading capacity and enrolled UNDER the lock ensures accurate values.
      const eventIds = [...new Set(linkedRegs.map((r: any) => r.event_id as string))].sort();
      const evPlaceholders = eventIds.map((_: string, idx: number) => `$${idx + 1}`).join(', ');
      const evtRes = await client.query(
        `SELECT id, capacity, enrolled, fee
         FROM events
         WHERE id IN (${evPlaceholders})
         ORDER BY id
         FOR UPDATE`,
        eventIds,
      );
      // Build a mutable map: event_id → { capacity, enrolled, fee }
      const evtMap: Record<string, { capacity: number | null; enrolled: number; fee: number }> = {};
      for (const row of evtRes.rows) {
        evtMap[row.id] = {
          capacity: row.capacity ?? null,
          enrolled: Number(row.enrolled) || 0,
          fee: Number(row.fee) || 0,
        };
      }

      // ── Process each registration ─────────────────────────────────────────
      for (const reg of linkedRegs) {
        if (reg.status === 'CONFIRMED') {
          // Crash-recovery: already confirmed in a prior attempt.
          // Count it but do NOT increment enrolled again.
          confirmedCount++;
          continue;
        }

        if (reg.status === 'CANCELLED') {
          // Previously cancelled (e.g. expired hold or prior refund path).
          overbookedCount++;
          continue;
        }

        // Only PENDING registrations are processed below.
        const evt = evtMap[reg.event_id];
        if (!evt) {
          // Event row not found (should not happen given FK constraints).
          overbookedCount++;
          continue;
        }

        if (!evt.capacity || evt.enrolled < evt.capacity) {
          // Capacity available — confirm this registration.
          await client.query(
            `UPDATE registrations
             SET status          = 'CONFIRMED',
                 payment_status  = 'paid',
                 payment_id      = $1,
                 payment_order_id = $2,
                 amount_paid     = $3,
                 confirmed_at    = NOW()
             WHERE id = $4`,
            [payId, rzpOrderIdForReg ?? razorpay_order_id ?? null, evt.fee, reg.id],
          );
          await client.query(
            `UPDATE events SET enrolled = enrolled + 1 WHERE id = $1`,
            [reg.event_id],
          );
          // Reflect the increment in the local map so subsequent iterations
          // within the same transaction see the updated count.
          evt.enrolled += 1;
          confirmedCount++;
        } else {
          // Capacity exhausted after the 15-minute hold expired.
          await client.query(
            `UPDATE registrations
             SET status          = 'CANCELLED',
                 payment_status  = 'refunded',
                 payment_id      = $1,
                 payment_order_id = $2,
                 updated_at      = NOW()
             WHERE id = $3`,
            [payId, rzpOrderIdForReg ?? razorpay_order_id ?? null, reg.id],
          );
          overbookedCount++;
        }
      }

      // ── Update payment status ─────────────────────────────────────────────
      if (overbookedCount > 0 && confirmedCount === 0) {
        // All events were overbooked — mark payment for refund.
        await client.query(
          `UPDATE payments
           SET status = 'refunded', cf_payment_id = $1, razorpay_payment_id = $2, razorpay_signature = $3, updated_at = NOW()
           WHERE id = $4`,
          [payId, payId, sig, paymentRecord.id],
        );
        needsRefund = true;
      } else {
        // At least one registration confirmed — payment is paid.
        await client.query(
          `UPDATE payments
           SET status = 'paid', cf_payment_id = $1, razorpay_payment_id = $2, razorpay_signature = $3, updated_at = NOW()
           WHERE id = $4`,
          [payId, payId, sig, paymentRecord.id],
        );
        if (paymentRecord.user_id) {
          await client.query(
            `UPDATE users SET platform_fee_paid = true WHERE id = $1`,
            [paymentRecord.user_id],
          );
        }
      }

      await client.query('COMMIT');
      client.release();
      client = null;
    } catch (txErr) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch {
          /* ignore */
        }
        client.release();
        client = null;
      }
      throw txErr; // re-throw to outer catch
    }

    // =========================================================================
    // Post-COMMIT: Refund tracking (if all events were overbooked)
    // =========================================================================

    if (needsRefund) {
      return success({
        message:
          'Capacity for selected events was filled after hold expiry. ' +
          'Your payment has been marked for automatic refund.',
        refunded: true,
        confirmed_count: 0,
      });
    }

    return success({
      message:
        overbookedCount > 0
          ? `${confirmedCount} registration(s) confirmed. ${overbookedCount} event(s) were filled after hold expiry and queued for refund.`
          : `${confirmedCount} event registration(s) confirmed!`,
      confirmed_count: confirmedCount,
      refunded_count: overbookedCount,
    });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
      client.release();
    }
    const errorMsg = (err as Error)?.message || 'Payment verification failed.';
    console.error('[verify] Unexpected error stack:', err);
    return error(errorMsg, 500);
  }
}
