export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, forbidden, notFound, serverError } from '@/lib/apiResponse';

// GET /api/events/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);

    const result = await db.query(
      `SELECT 
        e.*,
        c.id as club_id, c.name as club_name, c.slug as club_slug, c.color as club_color,
        c.description as club_description
       FROM events e
       JOIN clubs c ON e.club_id = c.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return notFound('Event not found');

    const event = result.rows[0];
    if (event.status === 'published' && (event.registration_open === null || event.registration_open === false)) {
      event.registration_open = true;
    }

    // Non-admins can only see published events
    if (event.status !== 'published') {
      if (!session) return notFound('Event not found');
      if (session.role === 'club_admin' && session.clubId !== event.club_id) {
        return notFound('Event not found');
      }
      if (session.role === 'student') return notFound('Event not found');
    }

    // If student is logged in, check if they're registered
    let userRegistration = null;
    if (session && session.role === 'student') {
      const regResult = await db.query(
        `SELECT id, status, payment_status, amount_paid, registered_at
         FROM registrations WHERE user_id = $1 AND event_id = $2`,
        [session.userId, id]
      );
      if (regResult.rows.length > 0) {
        userRegistration = regResult.rows[0];
      }
    }

    return success({ event, userRegistration });
  } catch (err) {
    console.error('Get event error:', err);
    return serverError();
  }
}

// PATCH /api/events/[id] — update event
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role === 'student') return forbidden();

    // Verify ownership
    const eventResult = await db.query('SELECT club_id, created_by FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) return notFound('Event not found');
    
    const event = eventResult.rows[0];
    if (session.role === 'club_admin' && session.clubId !== event.club_id) {
      return forbidden('You can only edit events in your club');
    }

    const body = await req.json();
    const allowedFields = [
      'name', 'tagline', 'short_description', 'full_description',
      'category', 'tags', 'venue', 'date_start', 'date_end',
      'start_time', 'end_time', 'day_number', 'min_team_size',
      'max_team_size', 'capacity', 'fee', 'prize_pool', 'eligibility',
      'rules', 'rounds', 'coordinators', 'poster_url', 'rulebook_url',
      'unstop_url', 'registration_url',
      'status', 'registration_open', 'is_popular', 'is_featured',
      'amrita_fee', 'other_fee',
    ];

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const normalizeDateOrTime = (val: any): string | null => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? null : trimmed;
      }
      return String(val);
    };

    for (const field of allowedFields) {
      if (field in body) {
        updates.push(`${field} = $${idx}`);
        const val = body[field];
        if (['date_start', 'date_end', 'start_time', 'end_time'].includes(field)) {
          const normDate = normalizeDateOrTime(val);
          if (field === 'date_start' && body.status === 'published' && !normDate) {
            return error('Event start date is required to publish an event', 400);
          }
          values.push(normDate);
        } else if (field === 'tags') {
          values.push(Array.isArray(val) ? val.filter((t: any) => typeof t === 'string' && t.trim() !== '') : null);
        } else if (['rules', 'rounds', 'coordinators'].includes(field)) {
          values.push(JSON.stringify(Array.isArray(val) ? val : []));
        } else if (typeof val === 'object' && val !== null) {
          values.push(JSON.stringify(val));
        } else {
          values.push(val);
        }
        idx++;
      }
    }

    if (updates.length === 0) return error('No valid fields to update');

    values.push(id);
    const result = await db.query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return notFound('Event not found');

    return success({ event: result.rows[0] });
  } catch (err) {
    console.error('Update event error:', err);
    return serverError();
  }
}

// DELETE /api/events/[id] — permanently delete event
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role === 'student') return forbidden();

    const eventResult = await db.query('SELECT club_id, name FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) return notFound('Event not found');

    if (session.role === 'club_admin' && session.clubId !== eventResult.rows[0].club_id) {
      return forbidden('You can only delete events in your club');
    }

    // Clean up dependent attendance and registrations
    await db.query('DELETE FROM attendance WHERE event_id = $1', [id]);
    await db.query('DELETE FROM registrations WHERE event_id = $1', [id]);
    await db.query('DELETE FROM events WHERE id = $1', [id]);

    return success({ message: `Event '${eventResult.rows[0].name}' deleted successfully` });
  } catch (err) {
    console.error('Delete event error:', err);
    return serverError();
  }
}
