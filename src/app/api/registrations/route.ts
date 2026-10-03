export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, serverError } from '@/lib/apiResponse';
import { isInstitutionalEmail } from '@/lib/institutionPolicy';

// POST /api/registrations — register for an event
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'student') return error('Only students can register for events', 403);

    const { event_id, team_name, team_members = [], team_member_user_ids = [] } = await req.json();
    if (!event_id) return error('Event ID is required');

    // Check user
    const userResult = await db.query(
      `SELECT id, is_amrita_student, email, verification_status, platform_fee_paid, college_name FROM users WHERE id = $1`,
      [session.userId]
    );
    const user = userResult.rows[0];

    if (user.verification_status !== 'verified') {
      return error('Your account verification is pending Super Admin approval. You will be able to register once verified.', 403);
    }
    if (!user.is_amrita_student && !user.platform_fee_paid) {
      return error('Please complete registration payment before registering for events.', 403);
    }

    // Check event
    const eventResult = await db.query(
      `SELECT id, name, fee, amrita_fee, other_fee, capacity, enrolled, registration_open, status, min_team_size, max_team_size
       FROM events WHERE id = $1`,
      [event_id]
    );
    if (eventResult.rows.length === 0) return error('Event not found', 404);
    const evt = eventResult.rows[0];

    if (!evt.registration_open || evt.status !== 'published') {
      return error('Event registration is closed');
    }

    // Check capacity
    if (evt.capacity && evt.enrolled >= evt.capacity) {
      return error('Event is full. No more registrations available.');
    }

    const isTeamEvent = evt.max_team_size > 1;

    // Team size validation
    if (isTeamEvent) {
      const totalMembers = team_member_user_ids.length + 1; // +1 for leader
      if (totalMembers < evt.min_team_size || totalMembers > evt.max_team_size) {
        return error(`Team size must be between ${evt.min_team_size} and ${evt.max_team_size} (including yourself as team leader). Currently: ${totalMembers}.`);
      }
    }

    // Determine leader's college category
    const leaderIsAmrita = user.is_amrita_student || isInstitutionalEmail(user.email);

    // Validate team members if this is a team event
    if (isTeamEvent && team_member_user_ids.length > 0) {
      // Fetch team member data in one query
      const memberPlaceholders = (team_member_user_ids as string[]).map((_: string, idx: number) => `$${idx + 1}`).join(', ');
      const memberRes = await db.query(
        `SELECT id, is_amrita_student, email, verification_status, college_name, full_name FROM users WHERE id IN (${memberPlaceholders}) AND role = 'student'`,
        team_member_user_ids
      );

      if (memberRes.rows.length !== team_member_user_ids.length) {
        return error('One or more team members could not be found. All team members must be registered on the Parinaam portal.', 404);
      }

      for (const member of memberRes.rows) {
        // Must be verified
        if (member.verification_status !== 'verified') {
          return error(`Team member ${member.full_name} is not yet verified. Only verified students can participate.`, 403);
        }

        const memberIsAmrita = member.is_amrita_student || isInstitutionalEmail(member.email);

        // College constraint: Amrita teams = all Amrita; Other college teams = no Amrita
        if (leaderIsAmrita && !memberIsAmrita) {
          return error(`Mixed-college teams are not allowed. You are an Amrita student, so all team members must also be Amrita students. ${member.full_name} is from ${member.college_name}.`, 400);
        }
        if (!leaderIsAmrita && memberIsAmrita) {
          return error(`Mixed-college teams are not allowed. Your team is from an external college, but ${member.full_name} is an Amrita student.`, 400);
        }

        // Check if team member is already registered
        const memberExisting = await db.query(
          `SELECT id, status FROM registrations WHERE user_id = $1 AND event_id = $2 AND status = 'CONFIRMED'`,
          [member.id, event_id]
        );
        if (memberExisting.rows.length > 0) {
          return error(`Team member ${member.full_name} is already registered for this event in another team.`, 409);
        }
      }
    }

    // Check if leader is already registered
    const existingReg = await db.query(
      `SELECT id, status FROM registrations WHERE user_id = $1 AND event_id = $2`,
      [session.userId, event_id]
    );
    if (existingReg.rows.length > 0) {
      return error('You are already registered for this event', 409);
    }

    // Determine fee based on student type and event fee tiers
    let eventFee: number;
    if (isTeamEvent && evt.amrita_fee !== null && evt.other_fee !== null) {
      // Event has separate Amrita/other college fee tiers
      eventFee = leaderIsAmrita ? Number(evt.amrita_fee) : Number(evt.other_fee);
    } else {
      eventFee = Number(evt.fee) || 0;
    }

    // Create registration (PENDING payment if fee > 0)
    const regStatus = eventFee === 0 ? 'CONFIRMED' : 'PENDING';
    const payStatus = eventFee === 0 ? 'paid' : 'pending';

    const regResult = await db.query(
      `INSERT INTO registrations (user_id, event_id, team_name, team_members, team_member_user_ids, amount_paid, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        session.userId, event_id, team_name || null,
        JSON.stringify(team_members),
        JSON.stringify(team_member_user_ids),
        0, regStatus, payStatus
      ]
    );

    // If free event, increment enrolled count
    if (eventFee === 0) {
      await db.query(`UPDATE events SET enrolled = enrolled + 1 WHERE id = $1`, [event_id]);
    }

    return success({
      registration: regResult.rows[0],
      needs_payment: eventFee > 0,
      amount: eventFee,
      is_amrita: leaderIsAmrita,
    }, 201);
  } catch (err) {
    console.error('Registration error:', err);
    return serverError();
  }
}

// GET /api/registrations — student's own registrations
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();

    const result = await db.query(
      `SELECT 
        r.id, r.status, r.payment_status, r.amount_paid, r.team_name,
        r.team_members, r.team_member_user_ids,
        r.registered_at, r.confirmed_at,
        COALESCE(e.id, r.event_id) as event_id, 
        COALESCE(e.name, 'Festival Event') as event_name, 
        COALESCE(e.category, 'General') as category, 
        COALESCE(e.venue, 'Amrita Campus') as venue,
        e.date_start, e.start_time, e.poster_url, 
        COALESCE(e.fee, r.amount_paid, 0) as fee,
        e.min_team_size, e.max_team_size,
        e.amrita_fee, e.other_fee,
        COALESCE(c.name, 'PARINAAM Fest') as club_name, 
        COALESCE(c.color, '#9333ea') as club_color,
        a.id as attendance_id, a.scanned_at as checked_in_at
       FROM registrations r
       LEFT JOIN events e ON r.event_id = e.id
       LEFT JOIN clubs c ON e.club_id = c.id
       LEFT JOIN attendance a ON a.user_id = r.user_id AND a.event_id = r.event_id AND a.status = 'SUCCESS'
       WHERE r.user_id = $1
       ORDER BY r.registered_at DESC`,
      [session.userId]
    );

    return success({ registrations: result.rows });
  } catch (err) {
    console.error('Get registrations error:', err);
    return serverError();
  }
}
