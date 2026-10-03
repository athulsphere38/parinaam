import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// GET /api/admin/transactions — Super Admin Transaction Logs with search, filters, and server-side pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'super_admin') {
      return forbidden('Super admin privileges required to access transaction logs');
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim(); // 'paid' | 'created' | 'failed' | 'refunded'
    const type = searchParams.get('type')?.trim(); // 'platform_fee' | 'event_fee'
    const eventId = searchParams.get('event_id')?.trim();
    const dateFrom = searchParams.get('date_from')?.trim();
    const dateTo = searchParams.get('date_to')?.trim();
    const sortBy = searchParams.get('sort_by') === 'amount' ? 'p.amount' : 'p.created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'ASC' : 'DESC';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: unknown[] = [];
    let paramIdx = 1;

    if (status && ['paid', 'created', 'failed', 'refunded'].includes(status)) {
      whereClause += ` AND p.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    if (type && ['platform_fee', 'event_fee'].includes(type)) {
      whereClause += ` AND p.type = $${paramIdx}`;
      params.push(type);
      paramIdx++;
    }

    if (eventId) {
      whereClause += ` AND p.id IN (SELECT DISTINCT payment_id FROM registrations WHERE event_id = $${paramIdx})`;
      params.push(eventId);
      paramIdx++;
    }

    if (dateFrom) {
      whereClause += ` AND p.created_at >= $${paramIdx}`;
      params.push(dateFrom);
      paramIdx++;
    }

    if (dateTo) {
      whereClause += ` AND p.created_at <= $${paramIdx}`;
      params.push(dateTo);
      paramIdx++;
    }

    if (search) {
      whereClause += ` AND (
        u.full_name ILIKE $${paramIdx} OR 
        u.email ILIKE $${paramIdx} OR 
        u.phone ILIKE $${paramIdx} OR 
        p.razorpay_order_id ILIKE $${paramIdx} OR 
        p.razorpay_payment_id ILIKE $${paramIdx} OR 
        p.id::text ILIKE $${paramIdx}
      )`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    // Fetch transactions with joined user profile
    const query = `
      SELECT 
        p.id as payment_id,
        p.user_id,
        p.type,
        p.amount as amount_paise,
        p.razorpay_order_id,
        p.razorpay_payment_id,
        p.status as payment_status,
        p.created_at,
        p.updated_at,
        u.full_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        u.college_name as user_college,
        u.is_amrita_student,
        u.roll_number as user_roll_number,
        u.department as user_department,
        u.year_of_study as user_year
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
    `;

    const statsQuery = `
      SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE p.status = 'paid') as paid_count,
        COUNT(*) FILTER (WHERE p.status = 'created') as created_count,
        COUNT(*) FILTER (WHERE p.status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE p.status = 'refunded') as refunded_count,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0) as total_paid_paise,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid' AND p.type = 'platform_fee'), 0) as platform_paid_paise,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid' AND p.type = 'event_fee'), 0) as event_paid_paise
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
    `;

    const [paymentsResult, countResult, summaryResult] = await Promise.all([
      db.query(query, [...params, limit, offset]),
      db.query(countQuery, params),
      db.query(statsQuery, params),
    ]);

    const rawPayments = paymentsResult.rows;
    const paymentIds = rawPayments.map(p => p.payment_id);

    // Fetch associated event registrations for the payment IDs on this page
    let registrationsByPayment: Record<string, any[]> = {};
    if (paymentIds.length > 0) {
      const regRes = await db.query(
        `SELECT 
          r.id as registration_id,
          r.payment_id,
          r.status as registration_status,
          r.payment_status,
          r.amount_paid,
          r.registered_at,
          r.confirmed_at,
          e.id as event_id,
          e.name as event_name,
          c.id as club_id,
          c.name as club_name,
          c.color as club_color
         FROM registrations r
         JOIN events e ON r.event_id = e.id
         JOIN clubs c ON e.club_id = c.id
         WHERE r.payment_id = ANY($1)
         ORDER BY r.registered_at ASC`,
        [paymentIds]
      );

      for (const reg of regRes.rows) {
        if (!registrationsByPayment[reg.payment_id]) {
          registrationsByPayment[reg.payment_id] = [];
        }
        registrationsByPayment[reg.payment_id].push(reg);
      }
    }

    const formattedPayments = rawPayments.map(p => {
      const amountPaise = Number(p.amount_paise || 0);
      return {
        id: p.payment_id,
        user_id: p.user_id,
        user: {
          name: p.user_name || 'Guest / Temporary',
          email: p.user_email || '—',
          phone: p.user_phone || null,
          college: p.user_college || (p.is_amrita_student ? 'Amrita Vishwa Vidyapeetham' : 'External College'),
          is_amrita_student: Boolean(p.is_amrita_student),
          roll_number: p.user_roll_number || null,
          department: p.user_department || null,
          year_of_study: p.user_year || null,
        },
        type: p.type, // 'platform_fee' | 'event_fee'
        amount_paise: amountPaise,
        amount_inr: Math.round(amountPaise / 100),
        currency: 'INR',
        razorpay_order_id: p.razorpay_order_id || null,
        razorpay_payment_id: p.razorpay_payment_id || null,
        status: p.payment_status, // 'created' | 'paid' | 'failed' | 'refunded'
        created_at: p.created_at,
        updated_at: p.updated_at,
        registrations: registrationsByPayment[p.payment_id] || [],
      };
    });

    const totalRecords = parseInt(countResult.rows[0]?.total || '0', 10);
    const summaryRow = summaryResult.rows[0] || {};

    const totalPaidPaise = Number(summaryRow.total_paid_paise || 0);
    const platformPaidPaise = Number(summaryRow.platform_paid_paise || 0);
    const eventPaidPaise = Number(summaryRow.event_paid_paise || 0);

    return success({
      transactions: formattedPayments,
      summary: {
        total_records: parseInt(summaryRow.total_count || '0', 10),
        paid_count: parseInt(summaryRow.paid_count || '0', 10),
        created_count: parseInt(summaryRow.created_count || '0', 10),
        failed_count: parseInt(summaryRow.failed_count || '0', 10),
        refunded_count: parseInt(summaryRow.refunded_count || '0', 10),
        total_paid_inr: Math.round(totalPaidPaise / 100),
        platform_paid_inr: Math.round(platformPaidPaise / 100),
        event_paid_inr: Math.round(eventPaidPaise / 100),
      },
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
      },
    });
  } catch (err) {
    console.error('Superadmin get transactions error:', err);
    return serverError();
  }
}
