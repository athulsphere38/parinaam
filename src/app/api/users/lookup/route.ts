export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, serverError } from '@/lib/apiResponse';

/**
 * GET /api/users/lookup?email=...&roll=...
 * Used by team leaders to look up registered students to add as team members.
 * Returns minimal safe user info: id, full_name, email, roll_number, is_amrita_student, college_name.
 * Only accessible by logged-in students.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'student') return error('Only students can look up team members', 403);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const email = searchParams.get('email')?.toLowerCase().trim();
    const roll = searchParams.get('roll')?.trim();

    const searchTerm = q || email || roll;
    if (!searchTerm) {
      return error('Provide email or roll number to search');
    }

    let result;
    if (q) {
      result = await db.query(
        `SELECT id, full_name, email, roll_number, is_amrita_student, college_name, verification_status
         FROM users
         WHERE (LOWER(email) = LOWER($1) OR LOWER(roll_number) = LOWER($1)) AND role = 'student'`,
        [q]
      );
    } else if (email) {
      result = await db.query(
        `SELECT id, full_name, email, roll_number, is_amrita_student, college_name, verification_status
         FROM users
         WHERE LOWER(email) = $1 AND role = 'student'`,
        [email]
      );
    } else {
      result = await db.query(
        `SELECT id, full_name, email, roll_number, is_amrita_student, college_name, verification_status
         FROM users
         WHERE LOWER(roll_number) = LOWER($1) AND role = 'student'`,
        [roll]
      );
    }

    if (result.rows.length === 0) {
      return error('No registered student found with that email or roll number. They must be registered on the Parinaam portal.', 404);
    }

    const found = result.rows[0];

    // Cannot add yourself as a team member
    if (found.id === session.userId) {
      return error('You cannot add yourself as a team member. You are already the team leader.', 400);
    }

    // Must be verified
    if (found.verification_status !== 'verified') {
      return error(`${found.full_name} has not been verified yet. Only verified students can be added as team members.`, 403);
    }

    return success({
      user: {
        id: found.id,
        full_name: found.full_name,
        email: found.email,
        roll_number: found.roll_number,
        is_amrita_student: found.is_amrita_student,
        college_name: found.college_name,
      }
    });
  } catch (err) {
    console.error('User lookup error:', err);
    return serverError();
  }
}
