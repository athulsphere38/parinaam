export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error, notFound, serverError } from '@/lib/apiResponse';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!token) return error('Token is required');

    const userRes = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.college_name, u.department,
              u.year_of_study, u.verification_status, u.pass_type, u.qr_token, u.created_at
       FROM users u
       WHERE u.qr_token = $1`,
      [token]
    );

    if (userRes.rows.length === 0) {
      return notFound('Pass record not found');
    }

    const user = userRes.rows[0];

    const regsRes = await db.query(
      `SELECT r.id, r.status, COALESCE(e.name, 'Festival Event') as event_name, COALESCE(c.name, 'PARINAAM Fest') as club_name
       FROM registrations r
       LEFT JOIN events e ON r.event_id = e.id
       LEFT JOIN clubs c ON e.club_id = c.id
       WHERE r.user_id = $1 AND r.status = 'CONFIRMED'`,
      [user.id]
    );

    return success({
      participant: {
        name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        college: user.college_name || 'Amrita Vishwa Vidyapeetham',
        department: user.department || 'Engineering',
        year: user.year_of_study || 'Student',
        participantId: user.qr_token ? user.qr_token.slice(0, 14).toUpperCase() : user.id.slice(0, 8),
      },
      pass: {
        status: user.verification_status === 'verified' ? 'ACTIVE' : 'PENDING',
        passType: user.pass_type || 'DELEGATE PASS',
      },
      registrations: regsRes.rows.map(r => ({ id: r.id, eventName: r.event_name, clubName: r.club_name })),
    });
  } catch (err) {
    console.error('Verify token error:', err);
    return serverError();
  }
}
