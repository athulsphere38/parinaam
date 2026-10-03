import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/sponsors/[id] — Super Admin approves (CONFIRMED) or rejects (REJECTED) a sponsor application
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'super_admin') {
      return forbidden('Super admin privileges required to review sponsor applications');
    }

    const body = await req.json();
    const { status, note } = body || {};
    const newStatus = typeof status === 'string' ? status.trim().toUpperCase() : '';

    if (!['CONFIRMED', 'REJECTED'].includes(newStatus)) {
      return error('Status must be either CONFIRMED or REJECTED');
    }

    // Lock and check current application state
    const existingRes = await db.query(
      `SELECT id, company_name, contact_person, email, status FROM sponsorship_applications WHERE id = $1`,
      [id]
    );

    if (existingRes.rows.length === 0) {
      return error('Sponsorship application not found', 404);
    }

    const app = existingRes.rows[0];

    // Strict status transition check: PENDING -> CONFIRMED or PENDING -> REJECTED only
    if (app.status !== 'PENDING') {
      return error(`Only PENDING sponsorship applications can be reviewed. Current status is ${app.status}.`, 400);
    }

    // Update DB record with reviewer audit trail
    const updateRes = await db.query(
      `UPDATE sponsorship_applications
       SET status = $1,
           reviewed_note = $2,
           reviewed_by = $3,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, company_name, contact_person, email, tier, status, reviewed_note, reviewed_at, created_at`,
      [newStatus, note ? note.trim() : null, session.userId, id]
    );

    const updatedApp = updateRes.rows[0];

    return success({
      message: `Sponsorship application for "${updatedApp.company_name}" has been marked as ${newStatus}.`,
      application: updatedApp,
    });
  } catch (err) {
    console.error('Review sponsor application error:', err);
    return serverError();
  }
}
