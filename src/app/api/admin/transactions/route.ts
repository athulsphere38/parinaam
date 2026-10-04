import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/transactions — Super Admin Transaction Logs with Cashfree details, rich itemization & filters
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
    const studentType = searchParams.get('student_type')?.trim(); // 'amrita' | 'other'
    const eventId = searchParams.get('event_id')?.trim();
    const clubId = searchParams.get('club_id')?.trim();
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

    if (studentType === 'amrita') {
      whereClause += ` AND u.is_amrita_student = true`;
    } else if (studentType === 'other') {
      whereClause += ` AND (u.is_amrita_student = false OR u.is_amrita_student IS NULL)`;
    }

    if (eventId) {
      whereClause += ` AND p.id IN (SELECT DISTINCT payment_id FROM registrations WHERE event_id = $${paramIdx})`;
      params.push(eventId);
      paramIdx++;
    }

    if (clubId) {
      whereClause += ` AND p.id IN (
        SELECT DISTINCT r.payment_id 
        FROM registrations r 
        JOIN events e ON r.event_id = e.id 
        WHERE e.club_id = $${paramIdx}
      )`;
      params.push(clubId);
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
        u.college_name ILIKE $${paramIdx} OR 
        u.roll_number ILIKE $${paramIdx} OR 
        p.cf_order_id ILIKE $${paramIdx} OR 
        p.cf_payment_id ILIKE $${paramIdx} OR 
        p.razorpay_order_id ILIKE $${paramIdx} OR 
        p.razorpay_payment_id ILIKE $${paramIdx} OR 
        p.id::text ILIKE $${paramIdx}
      )`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    // Fetch transactions with joined user profile and Cashfree fields
    const query = `
      SELECT 
        p.id as payment_id,
        p.user_id,
        p.type,
        p.amount as amount_paise,
        p.cf_order_id,
        p.cf_payment_id,
        p.payment_session_id,
        p.razorpay_order_id,
        p.razorpay_payment_id,
        p.status as payment_status,
        p.metadata,
        p.created_at,
        p.updated_at,
        u.full_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        u.college_name as user_college,
        u.is_amrita_student,
        u.roll_number as user_roll_number,
        u.department as user_department,
        u.year_of_study as user_year,
        u.city as user_city,
        u.verification_status,
        u.pass_type,
        u.qr_token
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
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid' AND p.type = 'event_fee'), 0) as event_paid_paise,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid' AND (u.is_amrita_student = false OR u.is_amrita_student IS NULL)), 0) as outsider_paid_paise,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid' AND u.is_amrita_student = true), 0) as amrita_paid_paise
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
          COALESCE(r.amount_paid, 0) as amount_paid,
          r.team_name,
          r.team_members,
          r.registered_at,
          r.confirmed_at,
          e.id as event_id,
          e.name as event_name,
          e.event_code,
          e.category,
          e.venue,
          e.fee as event_fee,
          c.id as club_id,
          c.name as club_name,
          c.slug as club_slug,
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
      const amountInr = Math.round(amountPaise / 100);
      const linkedRegs = registrationsByPayment[p.payment_id] || [];

      // Determine human-readable "Paid For" description and itemization
      let itemDescription = '';
      let purchasedItems: Array<{
        name: string;
        type: string;
        amount_inr: number;
        club_name?: string;
        club_color?: string;
        category?: string;
        event_code?: string;
        team_name?: string | null;
      }> = [];

      if (p.type === 'platform_fee') {
        itemDescription = 'PARINAAM 2026 Official Festival Pass (₹1000 Fixed Entry)';
        purchasedItems.push({
          name: 'Official Festival Pass (Delegate Pass)',
          type: 'Delegate Pass',
          amount_inr: amountInr,
          category: 'Festival Pass',
        });
      } else if (linkedRegs.length > 0) {
        if (linkedRegs.length === 1) {
          const r = linkedRegs[0];
          itemDescription = `Event: ${r.event_name} (${r.club_name})`;
        } else {
          itemDescription = `Multi-Event Registration (${linkedRegs.length} Events: ${linkedRegs.map(r => r.event_name).join(', ')})`;
        }

        purchasedItems = linkedRegs.map(r => ({
          name: r.event_name,
          type: 'Event Registration',
          amount_inr: Number(r.amount_paid) || 0,
          club_name: r.club_name,
          club_color: r.club_color,
          category: r.category,
          event_code: r.event_code,
          team_name: r.team_name,
        }));
      } else {
        itemDescription = p.type === 'event_fee' ? 'Event Registration Ticket' : 'Festival Entry Pass';
        purchasedItems.push({
          name: itemDescription,
          type: p.type,
          amount_inr: amountInr,
        });
      }

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
          city: p.user_city || null,
          verification_status: p.verification_status || 'verified',
          pass_type: p.pass_type || (p.is_amrita_student ? 'AMRITA_FREE' : 'DELEGATE_PASS_1000'),
          qr_token: p.qr_token || null,
        },
        type: p.type, // 'platform_fee' | 'event_fee'
        gateway: 'Cashfree Payments',
        amount_paise: amountPaise,
        amount_inr: amountInr,
        currency: 'INR',
        cf_order_id: p.cf_order_id || p.razorpay_order_id || null,
        cf_payment_id: p.cf_payment_id || p.razorpay_payment_id || null,
        payment_session_id: p.payment_session_id || null,
        status: p.payment_status, // 'created' | 'paid' | 'failed' | 'refunded'
        item_description: itemDescription,
        purchased_items: purchasedItems,
        created_at: p.created_at,
        updated_at: p.updated_at,
        registrations: linkedRegs,
      };
    });

    const totalRecords = parseInt(countResult.rows[0]?.total || '0', 10);
    const summaryRow = summaryResult.rows[0] || {};

    const totalPaidPaise = Number(summaryRow.total_paid_paise || 0);
    const platformPaidPaise = Number(summaryRow.platform_paid_paise || 0);
    const eventPaidPaise = Number(summaryRow.event_paid_paise || 0);
    const outsiderPaidPaise = Number(summaryRow.outsider_paid_paise || 0);
    const amritaPaidPaise = Number(summaryRow.amrita_paid_paise || 0);

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
        outsider_paid_inr: Math.round(outsiderPaidPaise / 100),
        amrita_paid_inr: Math.round(amritaPaidPaise / 100),
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
