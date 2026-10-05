import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/users — all users with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'super_admin') return forbidden('Super admin access required');

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const verStatus = searchParams.get('verification_status');
    const studentType = searchParams.get('student_type'); // 'amrita' | 'other'
    const department = searchParams.get('department');
    const yearOfStudy = searchParams.get('year_of_study');
    const feeStatus = searchParams.get('platform_fee_paid'); // 'true' | 'false'
    const search = searchParams.get('search');
    const rawPage = parseInt(searchParams.get('page') || '1');
    const rawLimit = parseInt(searchParams.get('limit') || '20');
    const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1);
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 100);
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];
    let idx = 1;

    if (role) { where += ` AND u.role = $${idx}`; params.push(role); idx++; }
    if (verStatus) { where += ` AND u.verification_status = $${idx}`; params.push(verStatus); idx++; }
    if (studentType === 'amrita') { where += ` AND u.is_amrita_student = true`; }
    else if (studentType === 'other') { where += ` AND u.is_amrita_student = false`; }

    if (department) { where += ` AND u.department = $${idx}`; params.push(department); idx++; }
    if (yearOfStudy) { where += ` AND u.year_of_study = $${idx}`; params.push(yearOfStudy); idx++; }
    if (feeStatus === 'true') { where += ` AND u.platform_fee_paid = true`; }
    else if (feeStatus === 'false') { where += ` AND u.platform_fee_paid = false`; }

    if (search) {
      where += ` AND (u.full_name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.college_name ILIKE $${idx} OR u.roll_number ILIKE $${idx} OR u.phone ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    const [usersResult, countResult, statsResult] = await Promise.all([
      db.query(
        `SELECT 
          u.id, u.email, u.full_name, u.phone, u.role,
          u.college_name, u.is_amrita_student, u.roll_number,
          u.department, u.year_of_study, u.city,
          u.id_card_url, u.verification_status, u.verification_note,
          u.platform_fee_paid, u.pass_type, u.qr_token, u.email_verified,
          u.created_at,
          c.name as club_name,
          (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id AND r.status = 'CONFIRMED') as confirmed_registrations
         FROM users u
         LEFT JOIN clubs c ON u.club_id = c.id
         ${where}
         ORDER BY u.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      db.query(`SELECT COUNT(*) FROM users u ${where}`, params),
      db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_amrita_student = true) as amrita_count,
          COUNT(*) FILTER (WHERE is_amrita_student = false) as external_count,
          COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_count,
          COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_count
        FROM users
      `),
    ]);

    const statsRow = statsResult.rows[0] || {};

    return success({
      users: usersResult.rows,
      stats: {
        total: parseInt(statsRow.total || '0'),
        amrita_count: parseInt(statsRow.amrita_count || '0'),
        external_count: parseInt(statsRow.external_count || '0'),
        pending_count: parseInt(statsRow.pending_count || '0'),
        verified_count: parseInt(statsRow.verified_count || '0'),
      },
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page, limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (err) {
    console.error('Admin get users error:', err);
    return serverError();
  }
}
