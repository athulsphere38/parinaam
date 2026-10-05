export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { PoolClient } from 'pg';
import { db } from '@/lib/db';
import { getSessionUser, signToken, verifyRegistrationToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';
import { success, error, unauthorized } from '@/lib/apiResponse';
import { v4 as uuidv4 } from 'uuid';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    if (!payment_db_id && !effectiveOrderId) {
      return error('Payment order identifier is required', 400);
    }

    const isUuid = typeof payment_db_id === 'string' && UUID_REGEX.test(payment_db_id);

    let targetUserId: string | null = null;
    let isOutsideRegFlow = false;
    let regPayload: Record<string, any> | null = null;
    let authorizedPaymentRecord: any = null;

    // =========================================================================
    // AUTHORIZATION & OWNERSHIP CHECK (BEFORE Gateway & DB Mutations)
    // =========================================================================

    if (session?.userId) {
      // Flow A: Authenticated Session (Logged-in student)
      targetUserId = session.userId;

      let pRes;
      if (isUuid) {
        pRes = await db.query(
          `SELECT id, status, type, amount, cf_order_id, razorpay_order_id, user_id
           FROM payments
           WHERE id = $1::uuid AND user_id = $2::uuid`,
          [payment_db_id, targetUserId]
        );
      } else {
        pRes = await db.query(
          `SELECT id, status, type, amount, cf_order_id, razorpay_order_id, user_id
           FROM payments
           WHERE (cf_order_id = $1 OR razorpay_order_id = $1) AND user_id = $2::uuid`,
          [effectiveOrderId, targetUserId]
        );
      }

      if (pRes.rows.length === 0) {
        return error('Unauthorized or payment order not found for user', 403);
      }

      authorizedPaymentRecord = pRes.rows[0];

      // Strict payment type authorization:
      // If client explicitly requests platform_fee verification, DB payment type MUST be platform_fee.
      if (type === 'platform_fee' && authorizedPaymentRecord.type !== 'platform_fee') {
        return error('Payment record type mismatch. Expected platform_fee.', 400);
      }

      // Idempotency check for logged-in user
      if (authorizedPaymentRecord.status === 'paid') {
        if (authorizedPaymentRecord.type === 'platform_fee') {
          const uRes = await db.query(
            `SELECT id, full_name, email, role, qr_token, verification_status, platform_fee_paid, pass_type FROM users WHERE id = $1::uuid`,
            [targetUserId]
          );
          return success({
            message: 'Payment already verified!',
            user: uRes.rows[0],
            qr_token: uRes.rows[0]?.qr_token,
            already_verified: true,
          });
        }
        return success({ message: 'Payment already verified!', already_verified: true });
      }
    } else {
      // Flow B: Unauthenticated Outside-Student Flow
      if (type !== 'platform_fee' || !registration_token) {
        return unauthorized();
      }

      // Decrypt and verify registration token
      regPayload = await verifyRegistrationToken(registration_token);
      if (!regPayload || !regPayload.email || !regPayload.password_hash) {
        return error('Invalid or expired registration token. Please register again.', 400);
      }

      if (regPayload.type && regPayload.type !== 'platform_fee') {
        return error('Invalid registration token type.', 400);
      }

      // Strengthened Order binding check: token order_id MUST exist and match supplied order_id exactly
      if (!regPayload.order_id) {
        return error('Registration token missing order_id.', 400);
      }
      if (!effectiveOrderId) {
        return error('Payment order identifier is required.', 400);
      }
      if (regPayload.order_id !== effectiveOrderId) {
        return error('Registration token is not valid for this payment order.', 400);
      }

      // Lookup existing payment row if it was already recorded in a prior attempt
      let pRes;
      if (isUuid) {
        pRes = await db.query(
          `SELECT p.id, p.status, p.type, p.user_id, p.cf_order_id, p.razorpay_order_id, u.email
           FROM payments p
           LEFT JOIN users u ON p.user_id = u.id
           WHERE p.id = $1::uuid`,
          [payment_db_id]
        );
      } else {
        pRes = await db.query(
          `SELECT p.id, p.status, p.type, p.user_id, p.cf_order_id, p.razorpay_order_id, u.email
           FROM payments p
           LEFT JOIN users u ON p.user_id = u.id
           WHERE (p.cf_order_id = $1 OR p.razorpay_order_id = $1)`,
          [effectiveOrderId]
        );
      }

      if (pRes.rows.length > 0) {
        authorizedPaymentRecord = pRes.rows[0];

        // Strict DB type check: Outside token flow must operate ONLY on platform_fee payments
        if (authorizedPaymentRecord.type !== 'platform_fee') {
          return error('Payment record type mismatch. Expected platform_fee.', 400);
        }

        // Idempotency check for outside student
        if (authorizedPaymentRecord.status === 'paid') {
          if (
            authorizedPaymentRecord.email &&
            authorizedPaymentRecord.email.toLowerCase().trim() !== regPayload.email.toLowerCase().trim()
          ) {
            return error('Registration token email does not match payment identity.', 400);
          }

          const uRes = await db.query(
            `SELECT id, full_name, email, role, qr_token, verification_status, platform_fee_paid, pass_type FROM users WHERE email = $1`,
            [regPayload.email.toLowerCase().trim()]
          );
          const userObj = uRes.rows[0] || null;
          const response = success({
            message: 'Payment already verified!',
            user: userObj,
            qr_token: userObj?.qr_token,
            already_verified: true,
          });

          if (userObj) {
            const token = await signToken({
              userId: userObj.id,
              email: userObj.email,
              role: userObj.role as 'student' | 'club_admin' | 'super_admin',
            });
            response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
          }

          return response;
        }
      }

      isOutsideRegFlow = true;
    }

    // =========================================================================
    // GATEWAY VERIFICATION (Runs ONLY before DB Creation/Mutation)
    // =========================================================================
    const { verifyCashfreePayment } = await import('@/lib/cashfree');
    let isPaymentValid = false;
    let cfPaymentDetails: any = null;

    if (effectiveOrderId) {
      try {
        const cfResult = await verifyCashfreePayment(effectiveOrderId);
        if (cfResult.isPaid || (cfResult.order && cfResult.order.order_status === 'PAID')) {
          isPaymentValid = true;
          cfPaymentDetails = cfResult.payment || cfResult.order;
        }
      } catch (e: any) {
        console.warn('[Cashfree Verify Warning]', e.message);
      }
    }

    if (!isPaymentValid) {
      return error('Payment verification failed on gateway. Please try again.', 400);
    }

    const payId: string =
      cf_payment_id ||
      cfPaymentDetails?.cf_payment_id ||
      razorpay_payment_id ||
      `cfpay_${Date.now()}`;
    const sig: string = razorpay_signature || 'cf_verified';

    // =========================================================================
    // 1. PLATFORM FEE VERIFICATION & ATOMIC DB CREATION FOR OUTSIDE USERS
    // =========================================================================
    if (isOutsideRegFlow || authorizedPaymentRecord?.type === 'platform_fee') {
      let targetUser: any = null;

      if (isOutsideRegFlow && regPayload) {
        // Outside student registration: atomic DB transaction AFTER gateway PAID confirmation
        client = await db.getClient();
        try {
          await client.query('BEGIN');

          const existingUserRes = await client.query(
            `SELECT id, full_name, email, role, qr_token, verification_status, platform_fee_paid, pass_type
             FROM users WHERE email = $1 FOR UPDATE`,
            [regPayload.email.toLowerCase().trim()]
          );

          if (existingUserRes.rows.length > 0) {
            targetUser = existingUserRes.rows[0];
            if (!targetUser.platform_fee_paid) {
              await client.query(
                `UPDATE users
                 SET platform_fee_paid = TRUE,
                     verification_status = 'verified',
                     pass_type = 'DELEGATE_PASS_1000',
                     platform_payment_id = $1,
                     platform_fee_paid_at = NOW()
                 WHERE id = $2::uuid`,
                [payId, targetUser.id]
              );
              targetUser.platform_fee_paid = true;
              targetUser.verification_status = 'verified';
              targetUser.pass_type = 'DELEGATE_PASS_1000';
            }
          } else {
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

          const pRes = await client.query(
            `SELECT id, status FROM payments WHERE (cf_order_id = $1 OR razorpay_order_id = $1) AND type = 'platform_fee' FOR UPDATE`,
            [effectiveOrderId]
          );

          if (pRes.rows.length === 0) {
            await client.query(
              `INSERT INTO payments (user_id, type, amount, cf_order_id, cf_payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, status)
               VALUES ($1::uuid, 'platform_fee', 100000, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::varchar, 'paid')`,
              [targetUser.id, effectiveOrderId, payId, effectiveOrderId, payId, sig]
            );
          } else if (pRes.rows[0].status !== 'paid') {
            await client.query(
              `UPDATE payments
               SET status = 'paid', cf_payment_id = $1::varchar, razorpay_payment_id = $2::varchar, razorpay_signature = $3::varchar, user_id = $4::uuid, updated_at = NOW()
               WHERE id = $5::uuid`,
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

        await db.query(
          `UPDATE payments
           SET cf_payment_id = $1, razorpay_payment_id = $1, razorpay_signature = $2, status = 'paid', updated_at = NOW()
           WHERE id = $3::uuid AND user_id = $4::uuid`,
          [payId, sig, authorizedPaymentRecord.id, targetUserId],
        );
        const userUpdateRes = await db.query(
          `UPDATE users
           SET platform_fee_paid = TRUE, 
               verification_status = 'verified', 
               pass_type = 'DELEGATE_PASS_1000', 
               platform_payment_id = $1, 
               platform_fee_paid_at = NOW()
           WHERE id = $2::uuid
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

      // ONLY set session cookie after successful DB transaction commit
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
    // =========================================================================
    if (!targetUserId) return unauthorized();

    client = await db.getClient();
    let confirmedCount = 0;
    let overbookedCount = 0;
    let rzpOrderIdForReg: string | null = null;
    let needsRefund = false;

    try {
      await client.query('BEGIN');

      const paymentRes = await client.query(
        `SELECT id, status, amount, cf_order_id, razorpay_order_id, user_id
         FROM payments
         WHERE id = $1::uuid AND user_id = $2::uuid
         FOR UPDATE`,
        [authorizedPaymentRecord.id, targetUserId],
      );

      if (paymentRes.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        client = null;
        return error('Payment order record not found', 404);
      }

      const paymentRecord = paymentRes.rows[0];
      rzpOrderIdForReg = paymentRecord.razorpay_order_id;

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

      if (paymentRecord.status === 'paid') {
        await client.query('ROLLBACK');
        client.release();
        client = null;
        return success({ message: 'Payment already verified!', already_verified: true });
      }

      const regsRes = await client.query(
        `SELECT r.id, r.event_id, r.status, r.payment_status
         FROM registrations r
         WHERE r.payment_id = $1::varchar OR r.payment_id = $2::varchar OR r.payment_id = $3::varchar
         ORDER BY r.event_id`,
        [String(paymentRecord.id), paymentRecord.cf_order_id || '', paymentRecord.razorpay_order_id || ''],
      );

      if (regsRes.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        client = null;
        return error('No registrations found for this payment order', 404);
      }

      const linkedRegs = regsRes.rows;

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

      const evtMap: Record<string, { capacity: number | null; enrolled: number; fee: number }> = {};
      for (const row of evtRes.rows) {
        evtMap[row.id] = {
          capacity: row.capacity ?? null,
          enrolled: Number(row.enrolled) || 0,
          fee: Number(row.fee) || 0,
        };
      }

      for (const reg of linkedRegs) {
        if (reg.status === 'CONFIRMED') {
          confirmedCount++;
          continue;
        }

        if (reg.status === 'CANCELLED') {
          overbookedCount++;
          continue;
        }

        const evt = evtMap[reg.event_id];
        if (!evt) {
          overbookedCount++;
          continue;
        }

        if (!evt.capacity || evt.enrolled < evt.capacity) {
          await client.query(
            `UPDATE registrations
             SET status          = 'CONFIRMED',
                 payment_status  = 'paid',
                 payment_id      = $1,
                 payment_order_id = $2,
                 amount_paid     = $3,
                 confirmed_at    = NOW()
             WHERE id = $4::uuid`,
            [payId, rzpOrderIdForReg ?? razorpay_order_id ?? null, evt.fee, reg.id],
          );
          await client.query(
            `UPDATE events SET enrolled = enrolled + 1 WHERE id = $1::uuid`,
            [reg.event_id],
          );
          evt.enrolled += 1;
          confirmedCount++;
        } else {
          await client.query(
            `UPDATE registrations
             SET status          = 'CANCELLED',
                 payment_status  = 'refunded',
                 payment_id      = $1,
                 payment_order_id = $2,
                 updated_at      = NOW()
             WHERE id = $3::uuid`,
            [payId, rzpOrderIdForReg ?? razorpay_order_id ?? null, reg.id],
          );
          overbookedCount++;
        }
      }

      if (overbookedCount > 0 && confirmedCount === 0) {
        await client.query(
          `UPDATE payments
           SET status = 'refunded', cf_payment_id = $1, razorpay_payment_id = $1, razorpay_signature = $2, updated_at = NOW()
           WHERE id = $3::uuid`,
          [payId, sig, paymentRecord.id],
        );
        needsRefund = true;
      } else {
        await client.query(
          `UPDATE payments
           SET status = 'paid', cf_payment_id = $1, razorpay_payment_id = $1, razorpay_signature = $2, updated_at = NOW()
           WHERE id = $3::uuid`,
          [payId, sig, paymentRecord.id],
        );
        if (paymentRecord.user_id) {
          await client.query(
            `UPDATE users SET platform_fee_paid = true WHERE id = $1::uuid`,
            [paymentRecord.user_id],
          );
        }
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

    if (needsRefund) {
      return success({
        message:
          'Capacity for selected events was filled after hold expiry. Your payment has been marked for automatic refund.',
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
      try { await client.query('ROLLBACK'); } catch {}
      client.release();
    }
    const errorMsg = (err as Error)?.message || 'Payment verification failed.';
    console.error('[verify] Unexpected error stack:', err);
    return error(errorMsg, 500);
  }
}
