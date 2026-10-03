export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { PoolClient } from 'pg';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, serverError } from '@/lib/apiResponse';
import { calculatePayableFees, isStudentProfileComplete, isInstitutionalEmail } from '@/lib/institutionPolicy';

// ---------------------------------------------------------------------------
// Internal error class — user-facing validation errors raised inside the
// transaction so the catch block can distinguish them from unexpected errors.
// ---------------------------------------------------------------------------
class UserError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'UserError';
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments/create-order
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let client: PoolClient | null = null;

  try {
    // ── Authentication ────────────────────────────────────────────────────
    const session = await getSessionUser(req);
    if (!session) return unauthorized();

    const body = await req.json();
    const { type, event_id, event_ids: bodyEventIds, team_names = {}, team_members_data = {} } = body;

    if (!type || !['platform_fee', 'event_fee'].includes(type)) {
      return error('Invalid payment type');
    }

    // =========================================================================
    // 1. PLATFORM FEE PAYMENT FLOW (unchanged — not part of multi-event cart)
    // =========================================================================
    if (type === 'platform_fee') {
      const configResult = await db.query(
        `SELECT value FROM platform_config WHERE key = 'platform_fee'`,
      );
      const amount = parseInt(configResult.rows[0]?.value || '1000') * 100; // paise (₹1000)

      const userResult = await db.query(
        `SELECT full_name, email, phone, is_amrita_student, platform_fee_paid FROM users WHERE id = $1`,
        [session.userId],
      );
      const userRow = userResult.rows[0];

      if (userRow?.is_amrita_student || isInstitutionalEmail(userRow?.email || session.email)) {
        await db.query(`UPDATE users SET platform_fee_paid = true, verification_status = 'verified' WHERE id = $1`, [session.userId]);
        return success({
          order_id: `free_amrita_${Date.now()}`,
          amount: 0,
          currency: 'INR',
          description: 'Complimentary Amrita Student Pass',
          is_free: true,
        });
      }
      if (userRow?.platform_fee_paid) {
        return error('Platform fee already paid', 409);
      }

      const { createCashfreeOrder } = await import('@/lib/cashfree');
      const cleanOrderId = `cf_pf_${Date.now()}_${session.userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`;
      const cleanPhone = (userRow?.phone || '9999999999').replace(/\D/g, '').slice(-10) || '9999999999';
      let cfOrder: any;

      try {
        cfOrder = await createCashfreeOrder({
          order_id: cleanOrderId,
          order_amount: 1000,
          order_currency: 'INR',
          customer_details: {
            customer_id: session.userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'student',
            customer_name: userRow?.full_name || 'Participant',
            customer_email: session.email,
            customer_phone: cleanPhone,
          },
          order_note: 'Parinaam 2026 Official Festival Pass (₹1000)',
        });
      } catch (cfErr: any) {
        console.error('[Cashfree Platform Fee Error]', cfErr.message);
        return error(`Payment gateway initialization failed: ${cfErr.message}`, 502);
      }

      const paymentResult = await db.query(
        `INSERT INTO payments (user_id, type, amount, cf_order_id, payment_session_id, razorpay_order_id, status)
         VALUES ($1, 'platform_fee', $2, $3, $4, $5, 'created') RETURNING id`,
        [session.userId, amount, cfOrder.order_id, cfOrder.payment_session_id, cfOrder.order_id],
      );
      return success({
        order_id: cfOrder.order_id,
        cf_order_id: cfOrder.cf_order_id,
        payment_session_id: cfOrder.payment_session_id,
        amount,
        amount_in_rupees: 1000,
        currency: 'INR',
        description: 'Parinaam 2026 Official Festival Pass (₹1000 Fixed Entry)',
        payment_db_id: paymentResult.rows[0].id,
      });
    }

    // =========================================================================
    // 2. MULTI-EVENT REGISTRATION PAYMENT FLOW
    // =========================================================================

    // Normalise and deduplicate event IDs from client (untrusted).
    // Sort deterministically to prevent deadlocks when multiple transactions
    // attempt to lock the same event rows concurrently.
    const rawIds: string[] =
      Array.isArray(bodyEventIds) && bodyEventIds.length > 0
        ? bodyEventIds
        : event_id
          ? [event_id]
          : [];

    if (rawIds.length === 0) {
      return error('At least one Event ID is required');
    }

    const eventIds = [...new Set(rawIds)].sort() as string[];

    // ── Pre-transaction user check (read-only, no locks needed) ──────────────
    const userRes = await db.query(
      `SELECT id, email, role, phone, college_name, department, year_of_study, is_amrita_student, id_card_url, verification_status, platform_fee_paid
       FROM users WHERE id = $1`,
      [session.userId],
    );
    const user = userRes.rows[0];
    if (!user) return unauthorized();

    if (session.role !== 'student') {
      return error('Event registration checkout is restricted to student accounts.', 403);
    }

    if (!isStudentProfileComplete(user)) {
      return error(
        'Platform registration/profile completion is required before registering for events. Please complete your profile in your dashboard first.',
        400,
      );
    }

    if (user.verification_status !== 'verified') {
      return error(
        'Your account verification is pending Super Admin approval. You will be able to register once verified.',
        403,
      );
    }

    // =========================================================================
    // PHASE A — PostgreSQL Transaction
    //
    // Boundary:  BEGIN → lock events → validate → insert payment →
    //            insert PENDING registrations → COMMIT
    // =========================================================================
    client = await db.getClient();

    interface TxResult {
      paymentDbId: string;
      totalAmountPaise: number;
      targetEventsCount: number;
      isFree: boolean;
    }
    let txResult: TxResult | null = null;

    try {
      await client.query('BEGIN');

      // Lock event rows in deterministic (sorted UUID) order to prevent deadlocks.
      const evPlaceholders = eventIds.map((_: string, idx: number) => `$${idx + 1}`).join(', ');
      const eventsRes = await client.query(
        `SELECT id, name, fee, amrita_fee, other_fee, capacity, enrolled, registration_open, status, max_team_size
         FROM events
         WHERE id IN (${evPlaceholders})
         ORDER BY id
         FOR UPDATE`,
        eventIds,
      );

      if (eventsRes.rows.length !== eventIds.length) {
        throw new UserError('One or more selected events were not found.', 404);
      }

      const targetEvents = eventsRes.rows;

      // Validate event status and registration window for each event.
      for (const evt of targetEvents) {
        if (!evt.registration_open || evt.status !== 'published') {
          throw new UserError(
            `Registration for event "${evt.name}" is currently closed.`,
            400,
          );
        }
      }

      // Reject if the user already has a CONFIRMED registration for any event in the cart.
      const regPlaceholders = eventIds.map((_: string, idx: number) => `$${idx + 2}`).join(', ');
      const existingRegsRes = await client.query(
        `SELECT event_id FROM registrations
         WHERE user_id = $1 AND event_id IN (${regPlaceholders}) AND status = 'CONFIRMED'`,
        [session.userId, ...eventIds],
      );
      if (existingRegsRes.rows.length > 0) {
        const dup = targetEvents.find((e: any) => e.id === existingRegsRes.rows[0].event_id);
        throw new UserError(
          `You are already registered for "${dup?.name ?? 'an event in your cart'}".`,
          409,
        );
      }

      // Capacity check — count CONFIRMED registrations plus active 15-minute PENDING holds.
      for (const evt of targetEvents) {
        if (evt.capacity) {
          const holdRes = await client.query(
            `SELECT COUNT(*)::int AS count
             FROM registrations
             WHERE event_id = $1
               AND (
                 status = 'CONFIRMED'
                 OR (status = 'PENDING' AND registered_at > NOW() - INTERVAL '15 minutes')
               )`,
            [evt.id],
          );
          const activeCount = Number(holdRes.rows[0]?.count ?? 0);
          if (activeCount >= evt.capacity) {
            throw new UserError(
              `Event "${evt.name}" is at full capacity or pending checkout by another student.`,
              409,
            );
          }
        }
      }

      // Determine if user is Amrita student for fee tier calculation
      const userIsAmrita = user.is_amrita_student || isInstitutionalEmail(user.email);

      // Calculate total fee from DB values — use amrita_fee/other_fee tier if available on team event.
      const targetEventsWithFee = targetEvents.map((evt: any) => {
        let effectiveFee = Number(evt.fee) || 0;
        if (evt.max_team_size > 1 && evt.amrita_fee != null && evt.other_fee != null) {
          effectiveFee = userIsAmrita ? Number(evt.amrita_fee) : Number(evt.other_fee);
        }
        return { id: evt.id, fee: effectiveFee };
      });

      const feeCalc = calculatePayableFees(user, targetEventsWithFee);
      const totalAmountPaise = feeCalc.totalFee * 100;

      // Insert one payment record in the intermediate 'created' state.
      const paymentRes = await client.query(
        `INSERT INTO payments (user_id, type, amount, status)
         VALUES ($1, 'event_fee', $2, 'created')
         RETURNING id`,
        [session.userId, totalAmountPaise],
      );
      const paymentDbId: string = paymentRes.rows[0].id;

      // Insert one PENDING registration per event, all linked to this payment.
      for (const evt of targetEvents) {
        const teamName = (team_names as Record<string, string>)[evt.id] ?? null;
        const evtTeamData = (team_members_data as Record<string, any>)[evt.id];
        const teamMemberUserIds: string[] = evtTeamData?.team_member_user_ids ?? [];
        const teamMembers = evtTeamData?.team_members ?? [];

        // Validate team member college constraints server-side for each team event
        if (evt.max_team_size > 1 && teamMemberUserIds.length > 0) {
          const leaderIsAmrita = user.is_amrita_student || isInstitutionalEmail(user.email);
          const memberPlaceholders = teamMemberUserIds.map((_: string, idx: number) => `$${idx + 1}`).join(', ');

          const memberRes = await client.query(
            `SELECT id, is_amrita_student, email, verification_status, full_name FROM users WHERE id IN (${memberPlaceholders}) AND role = 'student'`,
            teamMemberUserIds
          );

          for (const member of memberRes.rows) {
            if (member.verification_status !== 'verified') {
              throw new UserError(`Team member ${member.full_name} is not verified.`, 400);
            }
            const memberIsAmrita = member.is_amrita_student || isInstitutionalEmail(member.email);
            if (leaderIsAmrita && !memberIsAmrita) {
              throw new UserError(`Mixed-college teams not allowed: ${member.full_name} is from an external college but you are an Amrita student.`, 400);
            }
            if (!leaderIsAmrita && memberIsAmrita) {
              throw new UserError(`Mixed-college teams not allowed: ${member.full_name} is an Amrita student but your team is from an external college.`, 400);
            }
          }
        }

        await client.query(
          `INSERT INTO registrations
             (user_id, event_id, team_name, team_members, team_member_user_ids, amount_paid, payment_id, status, payment_status, registered_at)
           VALUES ($1, $2, $3, $4, $5, 0, $6, 'PENDING', 'pending', NOW())
           ON CONFLICT (user_id, event_id) DO UPDATE
             SET payment_id    = EXCLUDED.payment_id,
                 team_name     = EXCLUDED.team_name,
                 team_members  = EXCLUDED.team_members,
                 team_member_user_ids = EXCLUDED.team_member_user_ids,
                 status        = 'PENDING',
                 payment_status = 'pending',
                 registered_at = NOW()
             WHERE registrations.status <> 'CONFIRMED'`,
          [session.userId, evt.id, teamName, JSON.stringify(teamMembers), JSON.stringify(teamMemberUserIds), paymentDbId],
        );
      }

      // ── Free-events shortcut — confirm everything inside the same transaction ──
      if (totalAmountPaise === 0) {
        const freeOrderId = `free_evt_${Date.now()}`;
        await client.query(
          `UPDATE payments
           SET status = 'paid', cf_order_id = $1, razorpay_order_id = $2, updated_at = NOW()
           WHERE id = $3`,
          [freeOrderId, freeOrderId, paymentDbId],
        );
        await client.query(
          `UPDATE registrations
           SET status = 'CONFIRMED', payment_status = 'paid', confirmed_at = NOW()
           WHERE payment_id = $1`,
          [paymentDbId],
        );
        for (const evt of targetEvents) {
          await client.query(
            `UPDATE events SET enrolled = enrolled + 1 WHERE id = $1`,
            [evt.id],
          );
        }
        await client.query('COMMIT');
        client.release();
        client = null;

        return success({
          order_id: freeOrderId,
          amount: 0,
          currency: 'INR',
          payment_db_id: paymentDbId,
          is_free: true,
        });
      }

      // ── Paid path — COMMIT and release all locks before calling Cashfree ────
      await client.query('COMMIT');
      client.release();
      client = null;

      txResult = {
        paymentDbId,
        totalAmountPaise,
        targetEventsCount: targetEvents.length,
        isFree: false,
      };
    } catch (txErr) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch {
          /* ignore rollback errors */
        }
        client.release();
        client = null;
      }
      if (txErr instanceof UserError) {
        return error(txErr.message, txErr.statusCode);
      }
      throw txErr;
    }

    if (!txResult) return serverError();

    const { paymentDbId, totalAmountPaise, targetEventsCount } = txResult;

    // =========================================================================
    // PHASE B — Cashfree Order Creation (OUTSIDE the DB transaction)
    // =========================================================================
    const { createCashfreeOrder } = await import('@/lib/cashfree');
    const totalAmountRupees = totalAmountPaise / 100;
    const cleanOrderId = `cf_evt_${Date.now()}_${session.userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`;
    const cleanPhone = (user.phone || '9999999999').replace(/\D/g, '').slice(-10) || '9999999999';
    let cfOrder: any;

    try {
      cfOrder = await createCashfreeOrder({
        order_id: cleanOrderId,
        order_amount: totalAmountRupees,
        order_currency: 'INR',
        customer_details: {
          customer_id: session.userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'student',
          customer_name: user.full_name || 'Participant',
          customer_email: user.email,
          customer_phone: cleanPhone,
        },
        order_note: `Registration for ${targetEventsCount} Event(s)`,
      });
    } catch (cfErr: any) {
      console.error('[Cashfree] Order creation error:', cfErr.message);
      await db.query(
        `UPDATE payments SET status = 'failed', updated_at = NOW() WHERE id = $1`,
        [paymentDbId],
      );
      await db.query(
        `UPDATE registrations SET status = 'CANCELLED' WHERE payment_id = $1`,
        [paymentDbId],
      );
      return error(`Payment gateway initialization failed: ${cfErr.message}`, 502);
    }

    // Persist Cashfree order ID & payment_session_id on the payment record
    await db.query(
      `UPDATE payments 
       SET cf_order_id = $1, payment_session_id = $2, razorpay_order_id = $3, updated_at = NOW() 
       WHERE id = $4`,
      [cfOrder.order_id, cfOrder.payment_session_id, cfOrder.order_id, paymentDbId],
    );

    return success({
      order_id: cfOrder.order_id,
      cf_order_id: cfOrder.cf_order_id,
      payment_session_id: cfOrder.payment_session_id,
      amount: totalAmountPaise,
      amount_in_rupees: totalAmountRupees,
      currency: 'INR',
      description: `Registration for ${targetEventsCount} Event(s)`,
      payment_db_id: paymentDbId,
    });
  } catch (err: any) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
      client.release();
    }
    console.error('[create-order] Unexpected error:', err?.message || err);
    return error(err?.message || 'Internal server error while initializing order.', 500);
  }
}
