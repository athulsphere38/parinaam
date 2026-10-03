import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, serverError } from '@/lib/apiResponse';
import { isValidStudentName } from '@/lib/utils';

// PATCH /api/auth/profile — update logged-in user's profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();

    const body = await req.json();

    if ('full_name' in body && body.full_name !== undefined) {
      const nameCheck = isValidStudentName(body.full_name);
      if (!nameCheck.valid) {
        return error(nameCheck.error || 'Student name is invalid');
      }
    }

    if ('email' in body && body.email !== undefined) {
      const email = String(body.email).toLowerCase().trim();
      const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!EMAIL_REGEX.test(email)) {
        return error('Please enter a valid email address');
      }
      // Check if email already exists for another user
      const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [email, session.userId]);
      if (existing.rows.length > 0) {
        return error('This email is already in use by another account');
      }
      body.email = email;
    }

    // roll_number is strictly locked and cannot be modified after registration
    const ALLOWED = ['full_name','email','phone','college_name','department','year_of_study','city'];

    const updates: string[] = [];
    const values: unknown[]  = [];
    let idx = 1;

    for (const key of ALLOWED) {
      if (key in body && body[key] !== undefined) {
        updates.push(`${key} = $${idx}`);
        values.push(body[key]);
        idx++;
      }
    }

    if (updates.length === 0) return error('No valid fields to update');

    values.push(session.userId);
    await db.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
      values
    );

    return success({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Profile update error:', err);
    return serverError();
  }
}
