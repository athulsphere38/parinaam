import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/apiResponse';

// GET /api/attendance/scan
// 1. If `qr_token` is provided: Look up student pass & their registered events (filtered by club if club admin)
// 2. If `event_id` is provided: Get attendance stats and attendee list for that event
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role === 'student') return forbidden('Only organizers and administrators can access scanner data');

    const { searchParams } = new URL(req.url);
    const qrToken = searchParams.get('qr_token');
    const eventId = searchParams.get('event_id');
    const clubSlug = searchParams.get('club_slug');

    // SCENARIO 1: Lookup student and their registered events by QR token
    if (qrToken) {
      const cleanToken = qrToken.trim();
      const userResult = await db.query(
        `SELECT id, full_name, email, phone, college_name, is_amrita_student, roll_number, 
                department, year_of_study, verification_status, platform_fee_paid, pass_type, qr_token
         FROM users 
         WHERE qr_token = $1 OR id::text = $1`,
        [cleanToken]
      );

      if (userResult.rows.length === 0) {
        return error('Invalid QR pass or student not found', 404);
      }

      const scannedStudent = userResult.rows[0];

      // Fetch all registered events with club & attendance details
      const regEventsResult = await db.query(
        `SELECT 
          r.id as registration_id,
          r.status as registration_status,
          r.payment_status,
          r.team_name,
          r.registered_at,
          COALESCE(e.id, r.event_id) as event_id,
          COALESCE(e.name, 'Festival Event') as event_name,
          COALESCE(e.event_code, 'EVT') as event_code,
          COALESCE(e.category, 'General') as category,
          COALESCE(e.venue, 'Amrita Campus') as venue,
          e.date_start,
          e.start_time,
          e.day_number,
          COALESCE(e.fee, r.amount_paid, 0) as fee,
          c.id as club_id,
          COALESCE(c.name, 'PARINAAM Fest') as club_name,
          COALESCE(c.slug, 'parinaam') as club_slug,
          COALESCE(c.color, '#9333ea') as club_color,
          a.id as attendance_id,
          a.scanned_at as checked_in_at
        FROM registrations r
        LEFT JOIN events e ON r.event_id = e.id
        LEFT JOIN clubs c ON e.club_id = c.id
        LEFT JOIN attendance a ON a.user_id = r.user_id AND a.event_id = e.id AND a.status = 'SUCCESS'
        WHERE r.user_id = $1
        ORDER BY a.scanned_at DESC NULLS LAST, r.registered_at DESC`,
        [scannedStudent.id]
      );

      const allRegisteredEvents = regEventsResult.rows;

      // Filter by club if scanned by club_admin or if club_slug is requested
      let filteredEvents = allRegisteredEvents;
      let targetClubName: string | null = null;

      if (session.role === 'club_admin' || clubSlug) {
        // Resolve target club identifier
        const targetSlug = (clubSlug || '').toLowerCase();
        const targetClubId = session.clubId;

        filteredEvents = allRegisteredEvents.filter((ev: any) => {
          if (targetSlug && ev.club_slug && ev.club_slug.toLowerCase() === targetSlug) return true;
          if (targetClubId && ev.club_id && ev.club_id === targetClubId) return true;
          return false;
        });

        if (filteredEvents.length > 0) {
          targetClubName = filteredEvents[0].club_name;
        } else if (targetSlug) {
          targetClubName = targetSlug.toUpperCase();
        }
      }

      return success({
        student: {
          id: scannedStudent.id,
          full_name: scannedStudent.full_name,
          email: scannedStudent.email,
          phone: scannedStudent.phone,
          college_name: scannedStudent.college_name,
          is_amrita_student: scannedStudent.is_amrita_student,
          roll_number: scannedStudent.roll_number,
          department: scannedStudent.department,
          year_of_study: scannedStudent.year_of_study,
          verification_status: scannedStudent.verification_status,
          platform_fee_paid: scannedStudent.platform_fee_paid,
          pass_type: scannedStudent.pass_type,
          qr_token: scannedStudent.qr_token,
        },
        events: filteredEvents,
        total_registered_all_clubs: allRegisteredEvents.length,
        filtered_events_count: filteredEvents.length,
        is_super_admin: session.role === 'super_admin',
        target_club_name: targetClubName,
      });
    }

    // SCENARIO 2: Event attendance list & stats
    if (eventId) {
      const eventResult = await db.query(
        `SELECT id, name, club_id, venue, date_start, start_time FROM events WHERE id = $1`,
        [eventId]
      );
      if (eventResult.rows.length === 0) return error('Event not found', 404);
      const targetEvent = eventResult.rows[0];

      if (session.role === 'club_admin' && session.clubId && session.clubId !== targetEvent.club_id) {
        return forbidden('You are not authorized to view attendance for another club\'s events.');
      }

      const [confirmedRes, checkedInRes, listRes] = await Promise.all([
        db.query(`SELECT COUNT(*) FROM registrations WHERE event_id = $1 AND status = 'CONFIRMED'`, [eventId]),
        db.query(`SELECT COUNT(*) FROM attendance WHERE event_id = $1 AND status = 'SUCCESS'`, [eventId]),
        db.query(
          `SELECT 
            r.id as registration_id, r.status as registration_status, r.payment_status, r.team_name,
            u.id as user_id, u.full_name, u.email, u.college_name, u.roll_number, u.phone,
            a.id as attendance_id, a.scanned_at as checked_in_at
           FROM registrations r
           JOIN users u ON r.user_id = u.id
           LEFT JOIN attendance a ON a.user_id = u.id AND a.event_id = r.event_id AND a.status = 'SUCCESS'
           WHERE r.event_id = $1
           ORDER BY a.scanned_at DESC NULLS LAST, r.registered_at DESC`,
          [eventId]
        ),
      ]);

      const confirmedCount = parseInt(confirmedRes.rows[0]?.count || '0');
      const checkedInCount = parseInt(checkedInRes.rows[0]?.count || '0');
      const remainingCount = Math.max(0, confirmedCount - checkedInCount);
      const attendancePercentage = confirmedCount > 0 ? Math.round((checkedInCount / confirmedCount) * 100) : 0;

      return success({
        event: targetEvent,
        stats: {
          confirmedCount,
          checkedInCount,
          remainingCount,
          attendancePercentage,
        },
        attendees: listRes.rows,
        count: checkedInCount,
      });
    }

    return error('Either qr_token or event_id query parameter is required', 400);
  } catch (err) {
    console.error('Attendance scan GET error:', err);
    return serverError();
  }
}

// POST /api/attendance/scan — mark attendance / check in for a specific event
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role === 'student') return forbidden('Only organizers and administrators can mark attendance');

    const body = await req.json();
    const { qr_token, event_id } = body;

    if (!qr_token || !event_id) {
      return error('qr_token and event_id are required to mark attendance', 400);
    }

    const cleanToken = qr_token.trim();

    // 1. Verify Event Exists
    const eventResult = await db.query(
      `SELECT e.id, e.name, e.club_id, c.name as club_name, c.slug as club_slug 
       FROM events e 
       JOIN clubs c ON e.club_id = c.id 
       WHERE e.id = $1`,
      [event_id]
    );
    if (eventResult.rows.length === 0) return error('Event not found', 404);
    const targetEvent = eventResult.rows[0];

    // Verify Club Admin permission
    if (session.role === 'club_admin' && session.clubId && session.clubId !== targetEvent.club_id) {
      return forbidden(`You are not authorized to mark attendance for ${targetEvent.club_name} events.`);
    }

    // 2. Find Student by qr_token or user id
    const userResult = await db.query(
      `SELECT id, full_name, email, college_name, roll_number, verification_status 
       FROM users 
       WHERE qr_token = $1 OR id::text = $1`,
      [cleanToken]
    );

    let scannedUser = userResult.rows[0];

    // If not found by user QR token, check if token is a registration_id
    if (!scannedUser) {
      const regById = await db.query(
        `SELECT r.id as registration_id, r.event_id, r.status, u.id, u.full_name, u.email, u.college_name, u.roll_number, u.verification_status 
         FROM registrations r
         JOIN users u ON r.user_id = u.id
         WHERE r.id::text = $1`,
        [cleanToken]
      );
      if (regById.rows.length > 0) {
        if (regById.rows[0].event_id !== event_id) {
          return error(`This registration is for a different event.`, 400);
        }
        scannedUser = regById.rows[0];
      }
    }

    if (!scannedUser) {
      return error('Invalid student pass or QR code', 404);
    }

    // 3. Find Registration for this event
    const regResult = await db.query(
      `SELECT id, status, payment_status, event_id FROM registrations 
       WHERE user_id = $1 AND event_id = $2`,
      [scannedUser.id, event_id]
    );

    if (regResult.rows.length === 0) {
      return error(`${scannedUser.full_name} is NOT registered for "${targetEvent.name}".`, 400);
    }

    const registration = regResult.rows[0];

    if (registration.status !== 'CONFIRMED') {
      return error(
        `Registration status is ${registration.status}. Only CONFIRMED registrations can check in.`,
        400
      );
    }

    // 4. Check for duplicate attendance
    const existingAttendance = await db.query(
      `SELECT id, scanned_at FROM attendance 
       WHERE user_id = $1 AND event_id = $2 AND status = 'SUCCESS'`,
      [scannedUser.id, event_id]
    );

    if (existingAttendance.rows.length > 0) {
      const checkInTimeStr = new Date(existingAttendance.rows[0].scanned_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return success({
        duplicate: true,
        status: 'DUPLICATE',
        message: `Already checked in at ${checkInTimeStr}`,
        student: {
          id: scannedUser.id,
          name: scannedUser.full_name,
          email: scannedUser.email,
          college: scannedUser.college_name,
          roll_number: scannedUser.roll_number,
        },
        event: {
          id: targetEvent.id,
          name: targetEvent.name,
          club_name: targetEvent.club_name,
        },
        first_check_in: existingAttendance.rows[0].scanned_at,
      });
    }

    // 5. Insert Attendance record
    const attendanceInsert = await db.query(
      `INSERT INTO attendance (user_id, event_id, registration_id, scanned_by, scanned_at, status)
       VALUES ($1, $2, $3, $4, NOW(), 'SUCCESS')
       RETURNING id, scanned_at`,
      [scannedUser.id, event_id, registration.id, session.userId]
    );

    const checkInRecord = attendanceInsert.rows[0];
    const checkInTimeFormatted = new Date(checkInRecord.scanned_at).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return success({
      duplicate: false,
      status: 'SUCCESS',
      message: `✅ ${scannedUser.full_name} checked in successfully for ${targetEvent.name} at ${checkInTimeFormatted}!`,
      student: {
        id: scannedUser.id,
        name: scannedUser.full_name,
        email: scannedUser.email,
        college: scannedUser.college_name,
        roll_number: scannedUser.roll_number,
      },
      event: {
        id: targetEvent.id,
        name: targetEvent.name,
        club_name: targetEvent.club_name,
      },
      checked_in_at: checkInRecord.scanned_at,
    });
  } catch (err) {
    console.error('Attendance scan POST error:', err);
    return serverError();
  }
}
