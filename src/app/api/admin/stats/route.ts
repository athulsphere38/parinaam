import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, unauthorized, forbidden, serverError } from '@/lib/apiResponse';

// GET /api/admin/stats — super admin dashboard overview
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'super_admin') return forbidden();

    const [
      usersCount,
      pendingVerification,
      amritaCount,
      externalCount,
      totalEvents,
      totalRegistrations,
      confirmedRegistrations,
      totalRevenue,
      paymentStats,
      checkinsCount,
      branchStats,
      yearStats,
      clubStats,
      recentUsers,
      recentRegistrations,
      clubEventReports,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM users WHERE role = 'student'`),
      db.query(`SELECT COUNT(*) FROM users WHERE verification_status = 'pending' AND role = 'student'`),
      db.query(`SELECT COUNT(*) FROM users WHERE role = 'student' AND is_amrita_student = true`),
      db.query(`SELECT COUNT(*) FROM users WHERE role = 'student' AND is_amrita_student = false`),
      db.query(`SELECT COUNT(*) FROM events WHERE status != 'cancelled'`),
      db.query(`SELECT COUNT(*) FROM registrations`),
      db.query(`SELECT COUNT(*) FROM registrations WHERE status = 'CONFIRMED'`),
      db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'`),
      db.query(`
        SELECT 
          COUNT(*) as total_payments,
          COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
          COUNT(*) FILTER (WHERE status = 'created') as created_count,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
          COUNT(*) FILTER (WHERE status = 'refunded') as refunded_count,
          COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND type = 'platform_fee'), 0) as platform_revenue_paise,
          COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND type = 'event_fee'), 0) as event_revenue_paise
        FROM payments
      `),
      db.query(`SELECT COUNT(*) FROM attendance`),
      db.query(`
        SELECT department, COUNT(*) as count 
        FROM users 
        WHERE role = 'student' AND department IS NOT NULL AND department != ''
        GROUP BY department 
        ORDER BY count DESC
      `),
      db.query(`
        SELECT year_of_study, COUNT(*) as count 
        FROM users 
        WHERE role = 'student' AND year_of_study IS NOT NULL AND year_of_study != ''
        GROUP BY year_of_study 
        ORDER BY year_of_study ASC
      `),
      db.query(`
        SELECT c.name, c.color, c.slug,
          COUNT(e.id) FILTER (WHERE e.status = 'published') as published_events,
          COUNT(r.id) as total_registrations
        FROM clubs c
        LEFT JOIN events e ON e.club_id = c.id
        LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'CONFIRMED'
        GROUP BY c.id, c.name, c.color, c.slug
        ORDER BY total_registrations DESC
      `),
      db.query(`
        SELECT id, email, full_name, phone, college_name, is_amrita_student,
          roll_number, department, year_of_study, verification_status,
          platform_fee_paid, pass_type, qr_token, created_at
        FROM users
        WHERE role = 'student'
        ORDER BY created_at DESC
        LIMIT 100
      `),
      db.query(`
        SELECT r.id, r.registered_at, r.status,
          u.full_name, u.college_name, u.is_amrita_student, u.department, u.year_of_study,
          COALESCE(e.name, 'Festival Event') as event_name,
          COALESCE(c.name, 'PARINAAM Fest') as club_name
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN events e ON r.event_id = e.id
        LEFT JOIN clubs c ON e.club_id = c.id
        ORDER BY r.registered_at DESC
        LIMIT 100
      `),
      db.query(`
        SELECT 
          c.id as club_id,
          c.name as club_name,
          c.slug as club_slug,
          c.color as club_color,
          e.id as event_id,
          e.name as event_name,
          e.event_code,
          e.category,
          e.venue,
          COALESCE(e.fee, 0) as event_fee,
          e.capacity,
          e.date_start,
          e.start_time,
          e.day_number,
          COUNT(r.id) FILTER (WHERE r.status = 'CONFIRMED') as confirmed_count,
          COUNT(r.id) FILTER (WHERE r.status = 'PENDING') as pending_count,
          COUNT(r.id) as total_count,
          COUNT(a.id) FILTER (WHERE a.status = 'SUCCESS') as checked_in_count,
          COALESCE(SUM(r.amount_paid) FILTER (WHERE r.status = 'CONFIRMED'), 0) as total_revenue
        FROM events e
        JOIN clubs c ON e.club_id = c.id
        LEFT JOIN registrations r ON r.event_id = e.id
        LEFT JOIN attendance a ON a.event_id = e.id AND a.user_id = r.user_id AND a.status = 'SUCCESS'
        WHERE e.status != 'cancelled'
        GROUP BY c.id, c.name, c.slug, c.color, e.id, e.name, e.event_code, e.category, e.venue, e.fee, e.capacity, e.date_start, e.start_time, e.day_number
        ORDER BY c.name ASC, confirmed_count DESC
      `),
    ]);

    const pRow = paymentStats.rows[0] || {};

    return success({
      overview: {
        total_students: parseInt(usersCount.rows[0]?.count || '0'),
        amrita_students: parseInt(amritaCount.rows[0]?.count || '0'),
        external_students: parseInt(externalCount.rows[0]?.count || '0'),
        pending_verification: parseInt(pendingVerification.rows[0]?.count || '0'),
        total_events: parseInt(totalEvents.rows[0]?.count || '0'),
        total_registrations: parseInt(totalRegistrations.rows[0]?.count || '0'),
        confirmed_registrations: parseInt(confirmedRegistrations.rows[0]?.count || '0'),
        total_checkins: parseInt(checkinsCount.rows[0]?.count || '0'),
        total_revenue_paise: parseInt(totalRevenue.rows[0]?.total || '0'),
        total_revenue_inr: Math.round(parseInt(totalRevenue.rows[0]?.total || '0') / 100),
        paid_payments_count: parseInt(pRow.paid_count || '0'),
        created_payments_count: parseInt(pRow.created_count || '0'),
        failed_payments_count: parseInt(pRow.failed_count || '0'),
        refunded_payments_count: parseInt(pRow.refunded_count || '0'),
        platform_revenue_inr: Math.round(parseInt(pRow.platform_revenue_paise || '0') / 100),
        event_revenue_inr: Math.round(parseInt(pRow.event_revenue_paise || '0') / 100),
      },
      branch_stats: branchStats.rows,
      year_stats: yearStats.rows,
      club_stats: clubStats.rows,
      club_event_reports: clubEventReports.rows || [],
      recent_users: recentUsers.rows,
      recent_registrations: recentRegistrations.rows,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return serverError();
  }
}
