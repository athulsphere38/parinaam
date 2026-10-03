export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/apiResponse';

// GET /api/events — list events (public, with filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('club_id');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'published';
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 'all' is a special value meaning no status filter (used by organizer dashboard)
    let whereClause = status === 'all' ? 'WHERE 1=1' : 'WHERE e.status = $1';
    const params: unknown[] = status === 'all' ? [] : [status];
    let paramIdx = status === 'all' ? 1 : 2;


    if (clubId) {
      whereClause += ` AND e.club_id = $${paramIdx}`;
      params.push(clubId);
      paramIdx++;
    }

    if (category && category !== 'All') {
      const catLower = category.toLowerCase().trim();
      if (catLower === 'dance') {
        whereClause += ` AND (e.category ILIKE '%dance%' OR e.tags::text ILIKE '%dance%' OR e.tags::text ILIKE '%garba%' OR e.tags::text ILIKE '%dandiya%' OR c.slug = 'nrityasparsh')`;
      } else if (catLower === 'music') {
        whereClause += ` AND (e.category ILIKE '%music%' OR e.tags::text ILIKE '%music%' OR e.tags::text ILIKE '%vocal%' OR e.tags::text ILIKE '%band%' OR c.slug = 'saptaswara' OR c.slug = 'avisruta')`;
      } else if (catLower === 'film & media' || catLower === 'arts & media') {
        whereClause += ` AND (e.category ILIKE '%media%' OR e.category ILIKE '%art%' OR e.tags::text ILIKE '%theatre%' OR e.tags::text ILIKE '%film%' OR e.tags::text ILIKE '%art%' OR c.slug = 'drisya' OR c.slug = 'prachurya')`;
      } else if (catLower === 'cultural') {
        whereClause += ` AND (e.category ILIKE '%cultural%' OR c.slug IN ('prachurya', 'saptaswara', 'nrityasparsh', 'drisya'))`;
      } else if (catLower === 'technical') {
        whereClause += ` AND (e.category ILIKE '%technical%' OR c.slug IN ('chakravyuha', 'relu', 'robotics', 'ieee', 'salesforce-agentblazer'))`;
      } else if (catLower === 'coding & hackathon') {
        whereClause += ` AND (e.category ILIKE '%coding%' OR e.category ILIKE '%hackathon%' OR e.tags::text ILIKE '%hackathon%' OR e.tags::text ILIKE '%coding%' OR e.name ILIKE '%hackathon%' OR e.name ILIKE '%challenge%')`;
      } else if (catLower === 'gaming') {
        whereClause += ` AND (e.category ILIKE '%gaming%' OR e.tags::text ILIKE '%gaming%' OR e.tags::text ILIKE '%badminton%' OR e.tags::text ILIKE '%sports%' OR e.tags::text ILIKE '%mafia%')`;
      } else if (catLower === 'robotics') {
        whereClause += ` AND (e.category ILIKE '%robotics%' OR e.tags::text ILIKE '%robot%' OR e.name ILIKE '%robot%')`;
      } else {
        whereClause += ` AND (e.category ILIKE $${paramIdx} OR e.tags::text ILIKE $${paramIdx})`;
        params.push(`%${category}%`);
        paramIdx++;
      }
    }

    if (search && search.trim()) {
      const rawSearch = search.trim();
      const STOP_WORDS = new Set(['from', 'by', 'in', 'at', 'the', 'and', 'of', 'a', 'an', 'for', 'with', 'on', 'to']);
      
      // Tokenize query into words
      const rawTokens = rawSearch.split(/[\s,+/\\-]+/).filter(Boolean);
      // Filter out stop words unless all words are stop words
      const meaningfulTokens = rawTokens.filter(t => !STOP_WORDS.has(t.toLowerCase()));
      const termsToSearch = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;

      // Alias mapping for common misspellings or variations
      const getTermVariants = (term: string): string[] => {
        const t = term.toLowerCase();
        const variants = [t];
        if (t === 'drsya') variants.push('drisya');
        if (t === 'drisya') variants.push('drsya');
        if (t === 'avisrutha') variants.push('avisruta');
        if (t === 'avisruta') variants.push('avisrutha');
        if (t === 'harness') variants.push('harness.md');
        if (t === 'nritya' || t === 'sparsh') variants.push('nrityasparsh');
        return Array.from(new Set(variants));
      };

      // Each search term must match SOME field in the event or its club
      termsToSearch.forEach(term => {
        const variants = getTermVariants(term);
        const subConditions: string[] = [];
        variants.forEach(v => {
          subConditions.push(
            `e.name ILIKE $${paramIdx} OR e.tagline ILIKE $${paramIdx} OR e.short_description ILIKE $${paramIdx} OR c.name ILIKE $${paramIdx} OR c.slug ILIKE $${paramIdx} OR e.category ILIKE $${paramIdx} OR e.tags::text ILIKE $${paramIdx} OR e.venue ILIKE $${paramIdx}`
          );
          params.push(`%${v}%`);
          paramIdx++;
        });
        whereClause += ` AND (${subConditions.join(' OR ')})`;
      });
    }

    const [eventsResult, countResult] = await Promise.all([
      db.query(
        `SELECT 
          e.id, e.name, e.event_code, e.tagline, e.short_description,
          e.category, e.tags, e.venue, e.date_start, e.date_end,
          e.start_time, e.end_time, e.day_number, e.min_team_size,
          e.max_team_size, e.capacity, e.enrolled, e.fee, e.prize_pool,
          e.poster_url, e.rulebook_url, e.unstop_url, e.registration_url, e.status, 
          (CASE WHEN e.status = 'published' AND (e.registration_open IS NULL OR e.registration_open = false) THEN true ELSE e.registration_open END) as registration_open,
          e.is_popular, e.is_featured, e.created_at,
          e.amrita_fee, e.other_fee,
          c.id as club_id, c.name as club_name, c.slug as club_slug, c.color as club_color
         FROM events e
         JOIN clubs c ON e.club_id = c.id
         ${whereClause}
         ORDER BY e.is_featured DESC, e.is_popular DESC, e.created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*) FROM events e JOIN clubs c ON e.club_id = c.id ${whereClause}`,
        params
      )
    ]);

    const totalCount = parseInt(countResult.rows?.[0]?.count || '0', 10);
    return success({
      events: eventsResult.rows,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (err) {
    console.error('Get events error:', err);
    return serverError();
  }
}

// POST /api/events — create event (club admin or super admin)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();
    if (session.role !== 'club_admin' && session.role !== 'super_admin') {
      return forbidden('Only club admins and super admins can create events');
    }

    const body = await req.json();
    const {
      name, tagline, short_description, full_description,
      category, tags, venue, date_start, date_end,
      start_time, end_time, day_number,
      min_team_size = 1, max_team_size = 1,
      capacity, fee = 0, prize_pool, eligibility,
      rules = [], rounds = [], coordinators = [],
      poster_url, rulebook_url, unstop_url, registration_url, status = 'draft',
      registration_open = body.registration_open !== undefined ? body.registration_open : (status === 'published'),
      is_popular = false,
      club_id: bodyClubId,
      amrita_fee, other_fee,
    } = body;

    if (!name) return error('Event name is required');

    // Club admin can only create for their club
    const clubId = session.role === 'super_admin' ? bodyClubId : session.clubId;
    if (!clubId) return error('Club ID is required');

    // Generate event code
    const clubSlugResult = await db.query('SELECT slug FROM clubs WHERE id = $1', [clubId]);
    if (clubSlugResult.rows.length === 0) return error('Club not found', 404);
    
    const slug = clubSlugResult.rows[0].slug.toUpperCase().slice(0, 4);
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const eventCode = `${slug}-${rand}`;

    // Helper to convert empty string date/time inputs to null (PostgreSQL throws on "")
    const normalizeDateOrTime = (val: any): string | null => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? null : trimmed;
      }
      return String(val);
    };

    const parsedDateStart = normalizeDateOrTime(date_start);
    const parsedDateEnd = normalizeDateOrTime(date_end);
    const parsedStartTime = normalizeDateOrTime(start_time);
    const parsedEndTime = normalizeDateOrTime(end_time);

    // Validation rules: Published events require a start date
    if (status === 'published' && !parsedDateStart) {
      return error('Event start date is required to publish an event', 400);
    }

    // Validate and format array parameters
    // tags is a PostgreSQL TEXT[] array column — pg expects a JS Array (or null)
    let parsedTags: string[] | null = null;
    if (tags !== undefined && tags !== null) {
      if (!Array.isArray(tags)) {
        return error('Field "tags" must be an array of strings', 400);
      }
      parsedTags = tags.filter((t: any) => typeof t === 'string' && t.trim() !== '');
    }

    // rules, rounds, coordinators are PostgreSQL JSONB columns — pg expects a JSON string
    if (rules && !Array.isArray(rules)) return error('Field "rules" must be an array', 400);
    if (rounds && !Array.isArray(rounds)) return error('Field "rounds" must be an array', 400);
    if (coordinators && !Array.isArray(coordinators)) return error('Field "coordinators" must be an array', 400);

    const parsedRules = JSON.stringify(Array.isArray(rules) ? rules : []);
    const parsedRounds = JSON.stringify(Array.isArray(rounds) ? rounds : []);
    const parsedCoordinators = JSON.stringify(Array.isArray(coordinators) ? coordinators : []);

    const effectiveUnstopUrl = (unstop_url || registration_url || '').trim() || null;
    const effectiveRegUrl = (registration_url || unstop_url || '').trim() || null;

    const parsedAmritaFee = amrita_fee !== undefined && amrita_fee !== null && amrita_fee !== '' ? parseInt(String(amrita_fee)) : null;
    const parsedOtherFee = other_fee !== undefined && other_fee !== null && other_fee !== '' ? parseInt(String(other_fee)) : null;

    const result = await db.query(
      `INSERT INTO events (
        club_id, created_by, name, event_code, tagline, short_description,
        full_description, category, tags, venue, date_start, date_end,
        start_time, end_time, day_number, min_team_size, max_team_size,
        capacity, fee, prize_pool, eligibility, rules, rounds,
        coordinators, poster_url, rulebook_url, unstop_url, registration_url, status,
        registration_open, is_popular, amrita_fee, other_fee
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
        $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33
      ) RETURNING *`,
      [
        clubId, session.userId, name, eventCode, tagline,
        short_description, full_description, category,
        parsedTags,
        venue, parsedDateStart, parsedDateEnd, parsedStartTime, parsedEndTime, day_number,
        min_team_size, max_team_size, capacity, fee, prize_pool,
        eligibility,
        parsedRules,
        parsedRounds,
        parsedCoordinators,
        poster_url, rulebook_url, effectiveUnstopUrl, effectiveRegUrl, status, registration_open, is_popular,
        parsedAmritaFee, parsedOtherFee
      ]
    );

    return success({ event: result.rows[0] }, 201);
  } catch (err: any) {
    console.error('Create event error:', err?.message || err);
    return serverError(err?.message || 'Failed to create event');
  }
}
