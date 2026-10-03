import { NextRequest } from 'next/server';
import { getSessionUser, COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, unauthorized, serverError } from '@/lib/apiResponse';

// GET /api/auth/me — get current user profile
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();

    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.club_id,
              u.college_name, u.is_amrita_student, u.roll_number, u.department,
              u.year_of_study, u.city, u.id_card_url, u.verification_status,
              u.platform_fee_paid, u.qr_token, u.pass_type, u.avatar_url,
              u.email_verified, u.created_at, u.updated_at,
              c.name as club_name, c.slug as club_slug
       FROM users u
       LEFT JOIN clubs c ON u.club_id = c.id
       WHERE u.id = $1`,
      [session.userId]
    );

    if (result.rows.length === 0) return unauthorized('User not found');

    const dbUser = result.rows[0];

    // Invalidate pre-rotation sessions for admin users
    if (dbUser.role === 'super_admin' || dbUser.role === 'club_admin') {
      const userUpdatedAtSec = Math.floor(new Date(dbUser.updated_at).getTime() / 1000);
      if (session.iat && dbUser.updated_at && session.iat < userUpdatedAtSec) {
        const unauthRes = unauthorized('Session expired due to credential rotation. Please sign in again.');
        unauthRes.cookies.set(COOKIE_NAME, '', { httpOnly: true, maxAge: 0, path: '/' });
        return unauthRes;
      }
    }

    const res = success({ user: dbUser });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return res;
  } catch (err) {
    console.error('Get me error:', err);
    return serverError();
  }
}

// POST /api/auth/logout
export async function POST() {
  const response = success({ message: 'Logged out successfully' });
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
