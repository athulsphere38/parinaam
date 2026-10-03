import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// GET /api/admin/sponsors — Super Admin lists and filters all sponsorship applications
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'super_admin') {
      return forbidden('Super admin privileges required to view sponsor applications');
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim()?.toUpperCase(); // 'PENDING' | 'CONFIRMED' | 'REJECTED'
    const tier = searchParams.get('tier')?.trim()?.toLowerCase();
    const sortBy = searchParams.get('sort_by') === 'company_name' ? 'sa.company_name' : 'sa.created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'ASC' : 'DESC';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: unknown[] = [];
    let paramIdx = 1;

    if (status && ['PENDING', 'CONFIRMED', 'REJECTED'].includes(status)) {
      whereClause += ` AND sa.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    if (tier && ['associate', 'co_sponsor', 'title_sponsor'].includes(tier)) {
      whereClause += ` AND sa.tier = $${paramIdx}`;
      params.push(tier);
      paramIdx++;
    }

    if (search) {
      whereClause += ` AND (
        sa.company_name ILIKE $${paramIdx} OR 
        sa.contact_person ILIKE $${paramIdx} OR 
        sa.email ILIKE $${paramIdx} OR 
        sa.phone ILIKE $${paramIdx} OR 
        sa.designation ILIKE $${paramIdx} OR
        sa.id::text ILIKE $${paramIdx}
      )`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    const query = `
      SELECT 
        sa.id,
        sa.company_name,
        sa.contact_person,
        sa.email,
        sa.phone,
        sa.designation,
        sa.website,
        sa.tier,
        sa.budget,
        sa.message,
        sa.status,
        sa.reviewed_note,
        sa.reviewed_at,
        sa.created_at,
        sa.updated_at,
        rb.full_name as reviewed_by_name,
        rb.email as reviewed_by_email
      FROM sponsorship_applications sa
      LEFT JOIN users rb ON sa.reviewed_by = rb.id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM sponsorship_applications sa
      ${whereClause}
    `;

    const statsQuery = `
      SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed_count,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count
      FROM sponsorship_applications sa
    `;

    const [appsResult, countResult, summaryResult] = await Promise.all([
      db.query(query, [...params, limit, offset]),
      db.query(countQuery, params),
      db.query(statsQuery, []),
    ]);

    const totalRecords = parseInt(countResult.rows[0]?.total || '0', 10);
    const summaryRow = summaryResult.rows[0] || {};

    return success({
      sponsors: appsResult.rows,
      summary: {
        total_count: parseInt(summaryRow.total_count || '0', 10),
        pending_count: parseInt(summaryRow.pending_count || '0', 10),
        confirmed_count: parseInt(summaryRow.confirmed_count || '0', 10),
        rejected_count: parseInt(summaryRow.rejected_count || '0', 10),
      },
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
      },
    });
  } catch (err) {
    console.error('Superadmin get sponsors error:', err);
    return serverError();
  }
}
