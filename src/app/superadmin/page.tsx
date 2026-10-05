import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { SuperAdminClientShell } from '@/components/admin/superadmin/SuperAdminClientShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Super Admin Dashboard - PARINAAM 2026',
};

export default async function SuperAdminPage() {
  const session = await getSessionUser();
  if (!session || session.role !== 'super_admin') {
    redirect('/login');
  }

  // Pre-fetch initial data concurrently via db.query
  const [
    usersCount,
    pendingVerification,
    amritaCount,
    externalCount,
    totalEvents,
    totalRegistrations,
    confirmedRegistrations,
    checkinsCount,
    paymentStats,
    branchStats,
    yearStats,
    clubStats,
    recentUsers,
    recentRegistrations,
    clubEventReports,
    clubsRes,
    pendingUsersRes,
  ] = await Promise.all([
    // Total student counts
    db.query(`SELECT COUNT(*) FROM users WHERE role = 'student'`),
    db.query(`SELECT COUNT(*) FROM users WHERE verification_status = 'pending' AND role = 'student'`),
    db.query(`SELECT COUNT(*) FROM users WHERE role = 'student' AND is_amrita_student = true`),
    db.query(`SELECT COUNT(*) FROM users WHERE role = 'student' AND (is_amrita_student = false OR is_amrita_student IS NULL)`),

    // Events & Registrations
    db.query(`SELECT COUNT(*) FROM events WHERE status != 'cancelled'`),
    db.query(`SELECT COUNT(*) FROM registrations`),
    db.query(`SELECT COUNT(*) FROM registrations WHERE status = 'CONFIRMED'`),
    db.query(`SELECT COUNT(*) FROM attendance WHERE status = 'SUCCESS'`),

    // Cashfree Payment & Revenue Breakdown
    db.query(`
      SELECT
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE p.status = 'paid') as paid_count,
        COUNT(*) FILTER (WHERE p.status = 'created') as created_count,
        COUNT(*) FILTER (WHERE p.status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE p.status = 'refunded') as refunded_count,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0) as total_paid_paise,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid' AND p.type = 'platform_fee'), 0) as platform_paid_paise,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid' AND p.type = 'event_fee'), 0) as event_paid_paise,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid' AND (u.is_amrita_student = false OR u.is_amrita_student IS NULL)), 0) as outsider_paid_paise,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid' AND u.is_amrita_student = true), 0) as amrita_paid_paise
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
    `),

    // Branch demographics
    db.query(`
      SELECT department, COUNT(*) as count
      FROM users
      WHERE role = 'student' AND department IS NOT NULL AND department != ''
      GROUP BY department
      ORDER BY count DESC
    `),

    // Year of study demographics
    db.query(`
      SELECT year_of_study, COUNT(*) as count
      FROM users
      WHERE role = 'student' AND year_of_study IS NOT NULL AND year_of_study != ''
      GROUP BY year_of_study
      ORDER BY year_of_study ASC
    `),

    // Club Breakdown
    db.query(`
      SELECT
        c.id, c.name, c.color, c.slug,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'published') as published_events,
        COUNT(DISTINCT e.id) as total_events,
        COALESCE(SUM(reg_stats.total_count), 0)::int as total_registrations,
        COALESCE(SUM(reg_stats.confirmed_count), 0)::int as confirmed_registrations,
        COALESCE(SUM(reg_stats.total_revenue), 0)::int as total_revenue,
        COALESCE(SUM(att_stats.checked_in_count), 0)::int as total_checkins
      FROM clubs c
      LEFT JOIN events e ON e.club_id = c.id AND e.status != 'cancelled'
      LEFT JOIN (
        SELECT
          event_id,
          COUNT(id) FILTER (WHERE status = 'CONFIRMED') as confirmed_count,
          COUNT(id) as total_count,
          COALESCE(SUM(amount_paid) FILTER (WHERE status = 'CONFIRMED'), 0) as total_revenue
        FROM registrations
        GROUP BY event_id
      ) reg_stats ON reg_stats.event_id = e.id
      LEFT JOIN (
        SELECT
          event_id,
          COUNT(id) FILTER (WHERE status = 'SUCCESS') as checked_in_count
        FROM attendance
        GROUP BY event_id
      ) att_stats ON att_stats.event_id = e.id
      GROUP BY c.id, c.name, c.color, c.slug
      ORDER BY total_revenue DESC, confirmed_registrations DESC
    `),

    // Recent users
    db.query(`
      SELECT id, email, full_name, phone, college_name, is_amrita_student,
        roll_number, department, year_of_study, verification_status,
        platform_fee_paid, pass_type, qr_token, created_at, id_card_url
      FROM users
      WHERE role = 'student'
      ORDER BY created_at DESC
      LIMIT 100
    `),

    // Recent registrations
    db.query(`
      SELECT r.id, r.registered_at, r.status, r.payment_status, r.amount_paid,
        u.full_name, u.email, u.college_name, u.is_amrita_student, u.department, u.year_of_study,
        COALESCE(e.name, 'Festival Event') as event_name,
        COALESCE(c.name, 'PARINAAM Fest') as club_name,
        COALESCE(c.color, '#9333ea') as club_color
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN events e ON r.event_id = e.id
      LEFT JOIN clubs c ON e.club_id = c.id
      ORDER BY r.registered_at DESC
      LIMIT 100
    `),

    // Club event reports
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
        COALESCE(reg_stats.confirmed_count, 0)::int as confirmed_count,
        COALESCE(reg_stats.pending_count, 0)::int as pending_count,
        COALESCE(reg_stats.total_count, 0)::int as total_count,
        COALESCE(reg_stats.total_revenue, 0)::int as total_revenue,
        COALESCE(att_stats.checked_in_count, 0)::int as checked_in_count
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN (
        SELECT
          event_id,
          COUNT(id) FILTER (WHERE status = 'CONFIRMED') as confirmed_count,
          COUNT(id) FILTER (WHERE status = 'PENDING') as pending_count,
          COUNT(id) as total_count,
          COALESCE(SUM(amount_paid) FILTER (WHERE status = 'CONFIRMED'), 0) as total_revenue
        FROM registrations
        GROUP BY event_id
      ) reg_stats ON reg_stats.event_id = e.id
      LEFT JOIN (
        SELECT
          event_id,
          COUNT(id) FILTER (WHERE status = 'SUCCESS') as checked_in_count
        FROM attendance
        GROUP BY event_id
      ) att_stats ON att_stats.event_id = e.id
      WHERE e.status != 'cancelled'
      ORDER BY c.name ASC, confirmed_count DESC
    `),

    // Clubs list
    db.query(`SELECT id, name, slug, color, description, lead_name, lead_email, created_at FROM clubs ORDER BY name ASC`),

    // Pending verification users (bounded to 20)
    db.query(`
      SELECT id, full_name, email, phone, college_name, department, roll_number, year_of_study, city, id_card_url, verification_status, platform_fee_paid, is_amrita_student, pass_type, created_at
      FROM users WHERE verification_status = 'pending' AND role = 'student' ORDER BY created_at ASC LIMIT 20
    `),
  ]);

  const pRow = paymentStats.rows[0] || {};
  const totalPaidPaise = Number(pRow.total_paid_paise || 0);
  const platformPaidPaise = Number(pRow.platform_paid_paise || 0);
  const eventPaidPaise = Number(pRow.event_paid_paise || 0);
  const outsiderPaidPaise = Number(pRow.outsider_paid_paise || 0);
  const amritaPaidPaise = Number(pRow.amrita_paid_paise || 0);

  const overview = {
    total_students: parseInt(usersCount.rows[0]?.count || '0', 10),
    amrita_students: parseInt(amritaCount.rows[0]?.count || '0', 10),
    external_students: parseInt(externalCount.rows[0]?.count || '0', 10),
    pending_verification: parseInt(pendingVerification.rows[0]?.count || '0', 10),
    total_events: parseInt(totalEvents.rows[0]?.count || '0', 10),
    total_registrations: parseInt(totalRegistrations.rows[0]?.count || '0', 10),
    confirmed_registrations: parseInt(confirmedRegistrations.rows[0]?.count || '0', 10),
    total_checkins: parseInt(checkinsCount.rows[0]?.count || '0', 10),

    total_revenue_paise: totalPaidPaise,
    total_revenue_inr: Math.round(totalPaidPaise / 100),
    platform_revenue_inr: Math.round(platformPaidPaise / 100),
    event_revenue_inr: Math.round(eventPaidPaise / 100),
    outsider_revenue_inr: Math.round(outsiderPaidPaise / 100),
    amrita_revenue_inr: Math.round(amritaPaidPaise / 100),

    total_payments_count: parseInt(pRow.total_payments || '0', 10),
    paid_payments_count: parseInt(pRow.paid_count || '0', 10),
    created_payments_count: parseInt(pRow.created_count || '0', 10),
    failed_payments_count: parseInt(pRow.failed_count || '0', 10),
    refunded_payments_count: parseInt(pRow.refunded_count || '0', 10),
  };

  return (
    <SuperAdminClientShell
      initialOverview={overview}
      initialBranchStats={branchStats.rows}
      initialYearStats={yearStats.rows}
      initialClubStats={clubStats.rows}
      initialClubEventReports={clubEventReports.rows || []}
      initialRecentUsers={recentUsers.rows}
      initialRecentRegistrations={recentRegistrations.rows}
      initialClubs={clubsRes.rows || []}
      initialPendingUsers={pendingUsersRes.rows || []}
    />
  );
}
