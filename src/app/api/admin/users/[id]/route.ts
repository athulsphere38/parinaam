import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/apiResponse';
import { isValidEmail, isValidStudentName } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/users/[id] — super admin views complete student details & registration timeline
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'super_admin' && session.role !== 'club_admin') {
      return forbidden('Administrative privileges required');
    }
    if (session.role === 'club_admin' && session.clubId) {
      const accessCheck = await db.query(
        `SELECT 1 FROM registrations r
         JOIN events e ON r.event_id = e.id
         WHERE r.user_id = $1 AND e.club_id = $2 LIMIT 1`,
        [id, session.clubId]
      );
      if (accessCheck.rows.length === 0) {
        return forbidden('Access denied. This user has no registrations in your club.');
      }
    }

    // 1. Fetch user full profile
    const userResult = await db.query(
      `SELECT 
        u.id, u.email, u.full_name, u.phone, u.role,
        u.college_name, u.is_amrita_student, u.roll_number,
        u.department, u.year_of_study, u.city,
        u.id_card_url, u.verification_status, u.verification_note,
        u.platform_fee_paid, u.pass_type, u.qr_token, u.email_verified,
        u.created_at, u.verified_at, u.updated_at,
        c.name as club_name, c.slug as club_slug,
        vb.full_name as verified_by_name, vb.email as verified_by_email
       FROM users u
       LEFT JOIN clubs c ON u.club_id = c.id
       LEFT JOIN users vb ON u.verified_by = vb.id
       WHERE u.id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return error('Student profile not found', 404);
    }

    const user = userResult.rows[0];

    // 2. Fetch registrations with isolated error handling
    let registrations: any[] = [];
    try {
      const registrationsResult = await db.query(
        `SELECT 
          r.id as registration_id, r.status as registration_status, r.payment_status,
          COALESCE(r.amount_paid, 0) as amount_paid, r.team_name, r.team_members, r.registered_at, r.confirmed_at,
          COALESCE(e.id, r.event_id) as event_id, 
          COALESCE(e.name, 'Festival Event Registration') as event_name, 
          COALESCE(e.event_code, 'EVT') as event_code, 
          COALESCE(e.category, 'General') as category, 
          COALESCE(e.venue, 'Amrita Campus') as venue,
          e.date_start, e.start_time, e.end_time, e.day_number, 
          COALESCE(e.fee, r.amount_paid, 0) as event_fee,
          e.poster_url,
          c.id as club_id, 
          COALESCE(c.name, 'PARINAAM Fest') as club_name, 
          COALESCE(c.slug, 'parinaam') as club_slug, 
          COALESCE(c.color, '#9333ea') as club_color,
          a.id as attendance_id, a.scanned_at as checked_in_at, a.status as attendance_status
         FROM registrations r
         LEFT JOIN events e ON r.event_id = e.id
         LEFT JOIN clubs c ON e.club_id = c.id
         LEFT JOIN attendance a ON a.user_id = r.user_id AND a.event_id = r.event_id AND a.status = 'SUCCESS'
         WHERE r.user_id = $1
         ORDER BY r.registered_at DESC`,
        [user.id]
      );
      registrations = registrationsResult.rows || [];
    } catch (regErr) {
      console.error('Failed to fetch detailed registrations:', regErr);
      try {
        const fallbackRegs = await db.query(
          `SELECT r.id as registration_id, r.status as registration_status, r.payment_status, r.registered_at,
                  COALESCE(e.name, 'Festival Event') as event_name, COALESCE(c.name, 'PARINAAM Fest') as club_name
           FROM registrations r
           LEFT JOIN events e ON r.event_id = e.id
           LEFT JOIN clubs c ON e.club_id = c.id
           WHERE r.user_id = $1`,
          [user.id]
        );
        registrations = fallbackRegs.rows || [];
      } catch (fbErr) {
        console.error('Fallback registrations query failed:', fbErr);
      }
    }

    // 3. Fetch payment audit history
    let payments: any[] = [];
    try {
      const paymentsResult = await db.query(
        `SELECT 
          id as payment_id, cf_order_id, cf_payment_id, razorpay_order_id, razorpay_payment_id,
          amount, currency, status, metadata as notes, created_at
         FROM payments
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [user.id]
      );
      payments = paymentsResult.rows || [];
    } catch (payErr) {
      console.error('Failed to fetch payments:', payErr);
    }

    // 4. Fetch attendance audit logs
    let attendance: any[] = [];
    try {
      const attendanceResult = await db.query(
        `SELECT 
          a.id as attendance_id, a.event_id, COALESCE(e.name, 'Festival Event') as event_name,
          a.scanned_at, a.status,
          sb.full_name as scanned_by_name
         FROM attendance a
         LEFT JOIN events e ON a.event_id = e.id
         LEFT JOIN users sb ON a.scanned_by = sb.id
         WHERE a.user_id = $1
         ORDER BY a.scanned_at DESC`,
        [user.id]
      );
      attendance = attendanceResult.rows || [];
    } catch (attErr) {
      console.error('Failed to fetch attendance:', attErr);
    }

    return success({
      user,
      registrations,
      payments,
      attendance,
    });
  } catch (err) {
    console.error('Get user details error:', err);
    return serverError();
  }
}

// PATCH /api/admin/users/[id]/verify — approve or reject ID card
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'super_admin') return forbidden();

    const { status, note } = await req.json();
    if (!['verified', 'rejected'].includes(status)) {
      return error('Status must be verified or rejected');
    }

    if (status === 'rejected') {
      // Purge/delete rejected unverified student record so they are completely removed
      await db.query(`DELETE FROM attendance WHERE user_id = $1 OR scanned_by = $1`, [id]);
      await db.query(`DELETE FROM registrations WHERE user_id = $1`, [id]);
      await db.query(`DELETE FROM payments WHERE user_id = $1`, [id]);
      await db.query(`DELETE FROM users WHERE id = $1`, [id]);
      return success({ message: 'User rejected and record removed successfully', deleted: true });
    }

    // Approved / Verified: Activate status, platform_fee_paid, and ensure QR token is set
    await db.query(
      `UPDATE users
       SET verification_status = 'verified',
           verification_note   = $1,
           platform_fee_paid   = TRUE,
           verified_at         = NOW(),
           verified_by         = $2,
           qr_token            = COALESCE(NULLIF(qr_token, ''), encode(gen_random_bytes(20), 'hex'))
       WHERE id = $3`,
      [note || null, session.userId, id]
    );

    return success({ message: 'User approved and QR pass activated successfully' });
  } catch (err) {
    console.error('Verify user error:', err);
    return serverError();
  }
}

// PUT /api/admin/users/[id] — super admin edits any student details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'super_admin') return forbidden();

    const body = await req.json();
    const {
      full_name,
      email,
      phone,
      college_name,
      is_amrita_student,
      roll_number,
      department,
      year_of_study,
      city,
      verification_status,
      platform_fee_paid,
      role,
    } = body;

    if (full_name !== undefined) {
      const nameCheck = isValidStudentName(full_name);
      if (!nameCheck.valid) return error(nameCheck.error || 'Student name is invalid');
    }
    if (email !== undefined && !isValidEmail(email)) {
      return error('Please enter a valid email address');
    }

    await db.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        college_name = COALESCE($4, college_name),
        is_amrita_student = COALESCE($5, is_amrita_student),
        roll_number = COALESCE($6, roll_number),
        department = COALESCE($7, department),
        year_of_study = COALESCE($8, year_of_study),
        city = COALESCE($9, city),
        verification_status = COALESCE($10, verification_status),
        platform_fee_paid = COALESCE($11, platform_fee_paid),
        role = COALESCE($12, role),
        updated_at = NOW()
       WHERE id = $13`,
      [
        full_name,
        email ? email.toLowerCase().trim() : null,
        phone,
        college_name,
        typeof is_amrita_student === 'boolean' ? is_amrita_student : null,
        roll_number,
        department,
        year_of_study,
        city,
        verification_status,
        typeof platform_fee_paid === 'boolean' ? platform_fee_paid : null,
        role,
        id,
      ]
    );

    return success({ message: 'Student profile updated successfully' });
  } catch (err) {
    console.error('Superadmin edit user error:', err);
    return serverError();
  }
}

// DELETE /api/admin/users/[id] — super admin deletes user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'super_admin') return forbidden();

    // Prevent superadmin from deleting themselves
    if (session.userId === id) {
      return error('Cannot delete your own superadmin account');
    }

    // Cascade cleanup
    await db.query(`UPDATE events SET created_by = $1 WHERE created_by = $2`, [session.userId, id]);
    await db.query(`UPDATE users SET verified_by = NULL WHERE verified_by = $1`, [id]);
    await db.query(`DELETE FROM attendance WHERE user_id = $1 OR scanned_by = $1`, [id]);
    await db.query(`DELETE FROM registrations WHERE user_id = $1`, [id]);
    await db.query(`DELETE FROM payments WHERE user_id = $1`, [id]);
    await db.query(`DELETE FROM users WHERE id = $1`, [id]);

    return success({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return serverError();
  }
}
