import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import seedEvents from './seedEvents.json';

export interface MockUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string | null;
  role: 'student' | 'club_admin' | 'super_admin';
  club_id?: string | null;
  college_name?: string | null;
  is_amrita_student: boolean;
  roll_number?: string | null;
  department?: string | null;
  year_of_study?: string | null;
  city?: string | null;
  id_card_url?: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_note?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  platform_fee_paid: boolean;
  platform_payment_id?: string | null;
  platform_fee_paid_at?: string | null;
  qr_token: string;
  pass_type: string;
  avatar_url?: string | null;
  email_verified: boolean;
  email_verify_token?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockClub {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon_url?: string | null;
  banner_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockEvent {
  id: string;
  club_id: string;
  created_by: string;
  name: string;
  event_code: string;
  tagline: string;
  short_description: string;
  full_description: string;
  category: string;
  tags: string[];
  venue: string;
  date_start: string;
  date_end: string;
  start_time: string;
  end_time: string;
  day_number: number;
  min_team_size: number;
  max_team_size: number;
  capacity: number;
  enrolled: number;
  fee: number;
  prize_pool: string;
  eligibility: string;
  rules: string[];
  rounds: any[];
  coordinators: any[];
  poster_url: string;
  rulebook_url: string;
  unstop_url?: string;
  registration_url?: string;
  status: string;
  registration_open: boolean;
  is_popular: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// Fixed Password hash for 'Admin@123'
const ADMIN_PASSWORD_HASH = '$2b$10$oVTYvxiKT8AVrgLI6FDkduvkxf7ZAOMPBLpJYn4PvqSgUO7lcUUIS';

// 12 CLUBS
const CLUBS_DATA: MockClub[] = [
  { id: 'club-1', name: 'Chakravyuha', slug: 'chakravyuha', description: 'Technical, Hackathons & Coding Events', color: '#6366f1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'club-2', name: 'Prachurya', slug: 'prachurya', description: 'Cultural, Fine Arts & Literary Competitions', color: '#f59e0b', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'club-3', name: 'ReLU', slug: 'relu', description: 'AI/ML, Data Analytics & Deep Learning Hackathons', color: '#10b981', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'club-4', name: 'Avisruta', slug: 'avisruta', description: 'Battle of Bands, Solo Vocals & Instrumental', color: '#8b5cf6', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'club-5', name: 'Salesforce AgentBlazer', slug: 'salesforce-agentblazer', description: 'Cloud Computing, Enterprise Solutions & Case Studies', color: '#3b82f6', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'club-6', name: 'Saptaswara', slug: 'saptaswara', description: 'Performing Arts, Classical Music & Choir', color: '#ec4899', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'club-7', name: 'Robotics', slug: 'robotics', description: 'RoboWars, Line Follower & Drone Challenges', color: '#f97316', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'club-8', name: 'IEEE', slug: 'ieee', description: 'Electrical & Electronics Circuit Battles', color: '#06b6d4', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'club-9', name: 'Avinya', slug: 'avinya', description: 'Innovation, Shark Tank & Entrepreneurship', color: '#84cc16', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'club-10', name: 'Adivika', slug: 'adivika', description: 'Street Play, Drama, Mime & Heritage Arts', color: '#e11d48', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'club-11', name: 'Nrityasparsh', slug: 'nrityasparsh', description: 'Dance Battles, Solo, Duet & Group Choreography', color: '#a855f7', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'club-12', name: 'Drisya', slug: 'drisya', description: 'Film Making, Photography, Reels & Visual Media', color: '#14b8a6', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Initial seeded users
const USERS_DATA: MockUser[] = [
  // Super Admin
  {
    id: 'usr-superadmin',
    email: 'superadmin@parinaam.fest',
    password_hash: ADMIN_PASSWORD_HASH,
    full_name: 'Parinaam Super Admin',
    phone: '+91 9999900000',
    role: 'super_admin',
    club_id: null,
    college_name: 'Amrita Vishwa Vidyapeetham, Amaravati',
    is_amrita_student: true,
    verification_status: 'verified',
    platform_fee_paid: true,
    qr_token: 'qr-superadmin-token-001',
    pass_type: 'ALL ACCESS VIP PASS',
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // 12 Club Admins
  ...CLUBS_DATA.map((club, idx) => ({
    id: `usr-admin-${club.slug}`,
    email: `admin.${club.slug}@parinaam.fest`,
    password_hash: ADMIN_PASSWORD_HASH,
    full_name: `${club.name} Admin`,
    phone: `+91 98888000${(idx + 1).toString().padStart(2, '0')}`,
    role: 'club_admin' as const,
    club_id: club.id,
    college_name: 'Amrita Vishwa Vidyapeetham, Amaravati',
    is_amrita_student: true,
    verification_status: 'verified' as const,
    platform_fee_paid: true,
    qr_token: `qr-admin-${club.slug}-001`,
    pass_type: 'ORGANIZER PASS',
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })),
];

// Flagship events seeded for development and testing
const EVENTS_DATA: MockEvent[] = (seedEvents as unknown as MockEvent[]);

// Global in-memory storage singleton
class MockDbEngine {
  users: MockUser[] = [...USERS_DATA];
  clubs: MockClub[] = [...CLUBS_DATA];
  events: MockEvent[] = [...EVENTS_DATA];
  registrations: any[] = [];
  attendance: any[] = [];
  payments: any[] = [];
  sponsorship_applications: any[] = [];
  config: Record<string, string> = {
    platform_fee: '99',
    fest_name: 'PARINAAM 2026',
    fest_dates: 'October 11-12, 2026',
    registration_open: 'true',
    amrita_domain: 'av.students.amrita.edu',
  };

  constructor() {
    this.syncWithProduction();
  }

  async syncWithProduction(): Promise<void> {
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch('https://parinaam.online/api/events?status=published&limit=100', {
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json?.data?.events)) {
            const liveEvents: any[] = json.data.events;
            const clubSlugToId: Record<string, string> = {
              'chakravyuha': 'club-1',
              'prachurya': 'club-2',
              'relu': 'club-3',
              'avisruta': 'club-4',
              'salesforce-agentblazer': 'club-5',
              'saptaswara': 'club-6',
              'robotics': 'club-7',
              'ieee': 'club-8',
              'avinya': 'club-9',
              'adivika': 'club-10',
              'nrityasparsh': 'club-11',
              'drisya': 'club-12',
            };
            for (const le of liveEvents) {
              const mappedClubId = clubSlugToId[le.club_slug] || le.club_id || 'club-1';
              const existingIdx = this.events.findIndex(e => e.id === le.id || e.event_code === le.event_code);
              const formattedEvent: MockEvent = {
                id: le.id,
                club_id: mappedClubId,
                created_by: `usr-admin-${le.club_slug || 'chakravyuha'}`,
                name: le.name,
                event_code: le.event_code,
                tagline: le.tagline || '',
                short_description: le.short_description || '',
                full_description: le.full_description || le.short_description || '',
                category: le.category || 'General',
                tags: Array.isArray(le.tags) ? le.tags : [],
                venue: le.venue || 'Amrita Campus',
                date_start: le.date_start ? le.date_start.split('T')[0] : '2026-10-11',
                date_end: le.date_end ? le.date_end.split('T')[0] : '2026-10-12',
                start_time: le.start_time || '10:00 AM',
                end_time: le.end_time || '05:00 PM',
                day_number: Number(le.day_number) || 1,
                min_team_size: Number(le.min_team_size) || 1,
                max_team_size: Number(le.max_team_size) || 1,
                capacity: Number(le.capacity) || 100,
                enrolled: Number(le.enrolled) || 0,
                fee: Number(le.fee) || 0,
                prize_pool: le.prize_pool || '',
                eligibility: le.eligibility || 'Open to all students',
                rules: Array.isArray(le.rules) ? le.rules : [],
                rounds: Array.isArray(le.rounds) ? le.rounds : [],
                coordinators: Array.isArray(le.coordinators) ? le.coordinators : [],
                poster_url: le.poster_url || '',
                rulebook_url: le.rulebook_url || '',
                unstop_url: le.unstop_url || '',
                registration_url: le.registration_url || '',
                status: le.status || 'published',
                registration_open: le.registration_open !== false,
                is_popular: Boolean(le.is_popular),
                is_featured: Boolean(le.is_featured),
                created_at: le.created_at || new Date().toISOString(),
                updated_at: le.updated_at || new Date().toISOString(),
              };
              if (existingIdx >= 0) {
                this.events[existingIdx] = { ...this.events[existingIdx], ...formattedEvent };
              } else {
                this.events.push(formattedEvent);
              }
            }
          }
        }
      }
    } catch {
      // offline or unreachable
    }
  }

  private _filterEvents(qLower: string, params: any[] = []): MockEvent[] {
    let list = [...this.events];

    // Status filter
    if (qLower.includes('e.status =') || qLower.includes('status =')) {
      const statusParam = params.find(p => typeof p === 'string' && ['published', 'draft', 'archived'].includes(p.toLowerCase()));
      if (statusParam) {
        list = list.filter(e => e.status.toLowerCase() === statusParam.toLowerCase());
      } else {
        list = list.filter(e => e.status === 'published');
      }
    }

    // Club filter (by id or slug)
    if (qLower.includes('club_id =') || qLower.includes('e.club_id =')) {
      const clubIdParam = params.find(p => typeof p === 'string' && (this.clubs.some(c => c.id === p || c.slug === p) || p.startsWith('club-')));
      if (clubIdParam) {
        const targetClub = this.clubs.find(c => c.id === clubIdParam || c.slug === clubIdParam);
        const resolvedId = targetClub ? targetClub.id : clubIdParam;
        list = list.filter(e => e.club_id === resolvedId);
      }
    }

    // Category filter
    const isCategoryFilter = qLower.includes('e.category =') || 
                             qLower.includes('category =') || 
                             (qLower.includes('category ilike') && !qLower.includes('e.name ilike')) ||
                             (qLower.includes('cultural') && !qLower.includes('e.name ilike')) ||
                             (qLower.includes('dance') && !qLower.includes('e.name ilike')) ||
                             (qLower.includes('music') && !qLower.includes('e.name ilike')) ||
                             (qLower.includes('gaming') && !qLower.includes('e.name ilike')) ||
                             (qLower.includes('robotics') && !qLower.includes('e.name ilike'));

    if (isCategoryFilter) {
      if (qLower.includes('dance') || qLower.includes('nrityasparsh')) {
        list = list.filter(e => {
          const club = this.clubs.find(c => c.id === e.club_id);
          const tagsStr = (e.tags || []).join(' ').toLowerCase();
          return e.category.toLowerCase().includes('dance') || 
                 tagsStr.includes('dance') || tagsStr.includes('garba') || tagsStr.includes('dandiya') ||
                 club?.slug === 'nrityasparsh';
        });
      } else if (qLower.includes('music') || qLower.includes('saptaswara')) {
        list = list.filter(e => {
          const club = this.clubs.find(c => c.id === e.club_id);
          const tagsStr = (e.tags || []).join(' ').toLowerCase();
          return e.category.toLowerCase().includes('music') || 
                 tagsStr.includes('music') || tagsStr.includes('vocal') || tagsStr.includes('band') ||
                 club?.slug === 'saptaswara' || club?.slug === 'avisruta';
        });
      } else if (qLower.includes('media') || qLower.includes('theatre') || qLower.includes('drisya')) {
        list = list.filter(e => {
          const club = this.clubs.find(c => c.id === e.club_id);
          const tagsStr = (e.tags || []).join(' ').toLowerCase();
          return e.category.toLowerCase().includes('media') || e.category.toLowerCase().includes('art') ||
                 tagsStr.includes('theatre') || tagsStr.includes('film') || tagsStr.includes('art') ||
                 club?.slug === 'drisya' || club?.slug === 'prachurya';
        });
      } else if (qLower.includes('cultural')) {
        list = list.filter(e => {
          const club = this.clubs.find(c => c.id === e.club_id);
          return e.category.toLowerCase().includes('cultural') || 
                 ['prachurya', 'saptaswara', 'nrityasparsh', 'drisya'].includes(club?.slug || '');
        });
      } else if (qLower.includes('coding') || qLower.includes('hackathon')) {
        list = list.filter(e => 
          e.category.toLowerCase().includes('coding') || 
          e.category.toLowerCase().includes('hackathon') ||
          (e.name || '').toLowerCase().includes('hackathon') ||
          (e.name || '').toLowerCase().includes('challenge') ||
          (e.tags || []).some(t => t.toLowerCase().includes('hackathon') || t.toLowerCase().includes('coding'))
        );
      } else if (qLower.includes('gaming')) {
        list = list.filter(e => 
          e.category.toLowerCase().includes('gaming') || 
          (e.tags || []).some(t => t.toLowerCase().includes('gaming') || t.toLowerCase().includes('badminton') || t.toLowerCase().includes('sports') || t.toLowerCase().includes('mafia'))
        );
      } else if (qLower.includes('robotics')) {
        list = list.filter(e => 
          e.category.toLowerCase().includes('robotics') || 
          (e.name || '').toLowerCase().includes('robot') ||
          (e.tags || []).some(t => t.toLowerCase().includes('robot'))
        );
      } else {
        const knownCats = ['technical', 'cultural', 'coding & hackathon', 'robotics', 'gaming', 'workshops', 'quiz & literary', 'arts & media', 'management', 'dance', 'music', 'film & media'];
        const catParam = params.find(p => typeof p === 'string' && knownCats.some(k => p.toLowerCase().includes(k)));
        if (catParam) {
          const cleanCat = catParam.replace(/%/g, '').toLowerCase().trim();
          list = list.filter(e => 
            e.category.toLowerCase().includes(cleanCat) ||
            (e.tags || []).some(t => t.toLowerCase().includes(cleanCat))
          );
        }
      }
    }

    // Search filter (ILIKE)
    if (qLower.includes('e.name ilike') || qLower.includes('e.tagline ilike')) {
      const searchTerms = params
        .filter(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'))
        .map(p => (p as string).replace(/%/g, '').toLowerCase().trim())
        .filter(Boolean);

      if (searchTerms.length > 0) {
        list = list.filter(e => {
          const club = this.clubs.find(c => c.id === e.club_id);
          const clubName = (club?.name || '').toLowerCase();
          const clubSlug = (club?.slug || '').toLowerCase();
          const tagsStr = (e.tags || []).join(' ').toLowerCase();

          return searchTerms.some(term => {
            const isMatch = 
              (e.name || '').toLowerCase().includes(term) ||
              (e.tagline || '').toLowerCase().includes(term) ||
              (e.short_description || '').toLowerCase().includes(term) ||
              (e.event_code || '').toLowerCase().includes(term) ||
              (e.venue || '').toLowerCase().includes(term) ||
              (e.category || '').toLowerCase().includes(term) ||
              clubName.includes(term) ||
              clubSlug.includes(term) ||
              tagsStr.includes(term);

            if (isMatch) return true;

            // Handle spelling variants
            if (term === 'drsya' && (clubSlug.includes('drisya') || clubName.includes('drisya'))) return true;
            if (term === 'drisya' && (clubSlug.includes('drsya') || clubName.includes('drsya'))) return true;
            if (term === 'avisrutha' && (clubSlug.includes('avisruta') || clubName.includes('avisruta'))) return true;
            if (term === 'harness' && (e.name || '').toLowerCase().includes('harness')) return true;

            return false;
          });
        });
      }
    }

    return list;
  }

  async executeQuery(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    const q = text.trim();
    const qLower = q.toLowerCase();

    // 1. SELECT user by email
    if (qLower.includes('from users') && (qLower.includes('email =') || qLower.includes('email='))) {
      const email = params[0]?.toString().toLowerCase().trim();
      const user = this.users.find(u => u.email.toLowerCase() === email);
      if (!user) return { rows: [], rowCount: 0 };
      const club = this.clubs.find(c => c.id === user.club_id);
      const row = {
        ...user,
        club_name: club?.name || null,
        club_slug: club?.slug || null,
      };
      return { rows: [row], rowCount: 1 };
    }

    // 2. SELECT user by id
    if (qLower.includes('from users') && (qLower.includes('id = $') || qLower.includes('id=$') || qLower.includes('where id =') || qLower.includes('where u.id ='))) {
      const id = params[0]?.toString();
      const user = this.users.find(u => u.id === id);
      if (!user) return { rows: [], rowCount: 0 };
      const club = this.clubs.find(c => c.id === user.club_id);
      const row = {
        ...user,
        club_name: club?.name || null,
        club_slug: club?.slug || null,
      };
      return { rows: [row], rowCount: 1 };
    }

    // 3. SELECT user by qr_token
    if (qLower.includes('from users where qr_token =')) {
      const token = params[0]?.toString();
      const user = this.users.find(u => u.qr_token === token);
      const rows = user ? [{ ...user }] : [];
      return { rows, rowCount: rows.length };
    }

    // 4. INSERT into users
    if (qLower.startsWith('insert into users')) {
      const [
        email, passwordHash, full_name, phone,
        college_name, is_amrita_student, roll_number, department,
        year_of_study, city, verification_status, qr_token,
        email_verify_token, email_verified, platform_fee_paid, id_card_url, pass_type
      ] = params;

      const isAmrita = Boolean(is_amrita_student);
      const isPaid = platform_fee_paid !== undefined ? Boolean(platform_fee_paid) : isAmrita;

      const newUser: MockUser = {
        id: `usr-${uuidv4().slice(0, 8)}`,
        email: email?.toString().toLowerCase().trim(),
        password_hash: passwordHash,
        full_name,
        phone: phone || null,
        role: 'student',
        club_id: null,
        college_name: college_name || (isAmrita ? 'Amrita Vishwa Vidyapeetham, Amaravati' : null),
        is_amrita_student: isAmrita,
        roll_number: roll_number || null,
        department: department || null,
        year_of_study: year_of_study || null,
        city: city || null,
        verification_status: verification_status === 'verified' || isAmrita ? 'verified' : (verification_status === 'rejected' ? 'rejected' : 'pending'),
        platform_fee_paid: isPaid,
        qr_token: qr_token || uuidv4().replace(/-/g, ''),
        pass_type: pass_type || (isAmrita ? 'AMRITA_FREE' : 'DELEGATE_PASS_1000'),
        id_card_url: id_card_url || null,
        email_verified: Boolean(email_verified),
        email_verify_token: email_verify_token || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.users.push(newUser);
      return {
        rows: [{
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          is_amrita_student: newUser.is_amrita_student,
          verification_status: newUser.verification_status,
          qr_token: newUser.qr_token,
          platform_fee_paid: newUser.platform_fee_paid,
          id_card_url: newUser.id_card_url,
          pass_type: newUser.pass_type,
        }],
        rowCount: 1,
      };
    }

    // 5. SELECT clubs
    if (qLower.includes('from clubs') && !qLower.includes('where id =')) {
      const rows = this.clubs.map(c => {
        const clubEvents = this.events.filter(e => e.club_id === c.id);
        return {
          ...c,
          event_count: clubEvents.length.toString(),
          total_enrolled: clubEvents.reduce((acc, e) => acc + (e.enrolled || 0), 0).toString(),
        };
      });
      return { rows, rowCount: rows.length };
    }

    // 6. SELECT single club
    if (qLower.includes('from clubs where id =') || qLower.includes('select slug from clubs where id =')) {
      const clubId = params[0];
      const club = this.clubs.find(c => c.id === clubId);
      const rows = club ? [{ ...club }] : [];
      return { rows, rowCount: rows.length };
    }

    // 7. SELECT events with club join
    if ((qLower.includes('from events e') || (qLower.includes('from events') && !qLower.includes('update events'))) && !qLower.includes('count(*)')) {
      if (qLower.includes('where e.id =') || qLower.includes('where id =')) {
        const eventId = params[0];
        const event = this.events.find(e => e.id === eventId);
        if (!event) return { rows: [], rowCount: 0 };
        const club = this.clubs.find(c => c.id === event.club_id);
        const row = {
          ...event,
          club_name: club?.name || 'Club',
          club_slug: club?.slug || 'club',
          club_color: club?.color || '#6366f1',
          creator_name: 'Club Coordinator',
        };
        return { rows: [row], rowCount: 1 };
      }

      // Dynamically filter events
      let filtered = this._filterEvents(qLower, params);

      // Sort: is_featured desc, is_popular desc
      filtered.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        if (a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1;
        return 0;
      });

      // Pagination
      if (qLower.includes('limit') && qLower.includes('offset')) {
        const numParams = params.filter(p => typeof p === 'number');
        if (numParams.length >= 2) {
          const limit = numParams[numParams.length - 2];
          const offset = numParams[numParams.length - 1];
          filtered = filtered.slice(offset, offset + limit);
        }
      }

      const rows = filtered.map(e => {
        const club = this.clubs.find(c => c.id === e.club_id);
        return {
          ...e,
          club_name: club?.name || 'Club',
          club_slug: club?.slug || 'club',
          club_color: club?.color || '#6366f1',
        };
      });
      return { rows, rowCount: rows.length };
    }

    // 8. INSERT event
    if (qLower.startsWith('insert into events')) {
      const [
        club_id, created_by, name, event_code, tagline,
        short_description, full_description, category, tags,
        venue, date_start, date_end, start_time, end_time,
        day_number, min_team_size, max_team_size, capacity,
        fee, prize_pool, eligibility, rules, rounds,
        coordinators, poster_url, rulebook_url, unstop_url, registration_url, status,
        registration_open, is_popular, is_featured
      ] = params;

      const newEvent: MockEvent = {
        id: `evt-${uuidv4().slice(0, 8)}`,
        club_id,
        created_by,
        name,
        event_code: event_code || `EVT-${Date.now()}`,
        tagline: tagline || '',
        short_description: short_description || '',
        full_description: full_description || '',
        category: category || 'General',
        tags: tags || [],
        venue: venue || 'Campus Venue',
        date_start: date_start || '2026-10-11',
        date_end: date_end || '2026-10-12',
        start_time: start_time || '10:00:00',
        end_time: end_time || '17:00:00',
        day_number: day_number || 1,
        min_team_size: min_team_size || 1,
        max_team_size: max_team_size || 1,
        capacity: capacity || 100,
        enrolled: 0,
        fee: fee || 0,
        prize_pool: prize_pool || '',
        eligibility: eligibility || '',
        rules: rules ? (typeof rules === 'string' ? JSON.parse(rules) : rules) : [],
        rounds: rounds ? (typeof rounds === 'string' ? JSON.parse(rounds) : rounds) : [],
        coordinators: coordinators ? (typeof coordinators === 'string' ? JSON.parse(coordinators) : coordinators) : [],
        poster_url: poster_url || '',
        rulebook_url: rulebook_url || '',
        unstop_url: unstop_url || '',
        registration_url: registration_url || unstop_url || '',
        status: status || 'published',
        registration_open: registration_open !== false,
        is_popular: Boolean(is_popular),
        is_featured: Boolean(is_featured),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.events.unshift(newEvent);
      return { rows: [newEvent], rowCount: 1 };
    }

    // 9. PLATFORM CONFIG
    if (qLower.includes('from platform_config')) {
      const rows = Object.entries(this.config).map(([key, value]) => ({
        key,
        value,
        description: `${key} setting`,
      }));
      return { rows, rowCount: rows.length };
    }

    // 10. ADMIN STATS REVENUE
    if (qLower.includes('sum(amount_paise)') || qLower.includes('sum(amount)')) {
      const totalPaise = this.payments.reduce((acc, p) => acc + (p.status === 'captured' || p.status === 'paid' ? (p.amount || 0) : 0), 0);
      return { rows: [{ total: totalPaise.toString() }], rowCount: 1 };
    }

    // 10b. ADMIN USER STATS
    if (qLower.includes('amrita_count') || qLower.includes('external_count')) {
      const students = this.users.filter(u => u.role === 'student');
      const amrita = students.filter(u => u.is_amrita_student).length;
      const external = students.filter(u => !u.is_amrita_student).length;
      const pending = students.filter(u => u.verification_status === 'pending').length;
      const verified = students.filter(u => u.verification_status === 'verified').length;
      return {
        rows: [{
          total: students.length.toString(),
          amrita_count: amrita.toString(),
          external_count: external.toString(),
          pending_count: pending.toString(),
          verified_count: verified.toString(),
        }],
        rowCount: 1,
      };
    }

    if (qLower.includes('count(*)') || qLower.includes('count(u.id)')) {
      if (qLower.includes('from users')) {
        const count = qLower.includes("role = 'student'")
          ? this.users.filter(u => u.role === 'student').length
          : qLower.includes("verification_status = 'pending'")
          ? this.users.filter(u => u.verification_status === 'pending').length
          : this.users.length;
        return { rows: [{ count: count.toString() }], rowCount: 1 };
      }
      if (qLower.includes('from events')) {
        const count = this._filterEvents(qLower, params).length;
        return { rows: [{ count: count.toString() }], rowCount: 1 };
      }
      if (qLower.includes('from registrations')) {
        const count = qLower.includes("status = 'confirmed'")
          ? this.registrations.filter(r => r.status === 'CONFIRMED').length
          : this.registrations.length;
        return { rows: [{ count: count.toString() }], rowCount: 1 };
      }
      return { rows: [{ count: '0' }], rowCount: 1 };
    }

    // 11. RECENT REGISTRATIONS JOIN
    if (qLower.includes('from registrations r') && qLower.includes('join users u')) {
      const rows = this.registrations.map(r => {
        const user = this.users.find(u => u.id === r.user_id);
        const event = this.events.find(e => e.id === r.event_id);
        const club = event ? this.clubs.find(c => c.id === event.club_id) : undefined;
        return {
          id: r.id,
          registered_at: r.registered_at,
          status: r.status,
          full_name: user?.full_name || user?.email || 'Student',
          college_name: user?.college_name || 'Amrita Vishwa Vidyapeetham',
          event_name: event?.name || 'Festival Event',
          club_name: club?.name || 'Club',
        };
      });
      return { rows: rows.slice(0, 10), rowCount: Math.min(rows.length, 10) };
    }

    // 12. CLUB STATS JOIN
    if (qLower.includes('from clubs c') && qLower.includes('left join events e')) {
      const rows = this.clubs.map(c => {
        const clubEvents = this.events.filter(e => e.club_id === c.id);
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          color: c.color,
          total_events: clubEvents.length.toString(),
          published_events: clubEvents.filter(e => e.status === 'published').length.toString(),
          total_registrations: '0',
        };
      });
      return { rows, rowCount: rows.length };
    }

    // 13. ADMIN USERS LIST & SINGLE USER
    if (qLower.includes('from users u left join clubs c') || qLower.includes('from users u')) {
      let filtered = [...this.users];
      if (qLower.includes('where u.id =') && params && params[0]) {
        filtered = filtered.filter(u => u.id === params[0] || u.email === params[0]);
      }
      const rows = filtered.map(u => {
        const club = this.clubs.find(c => c.id === u.club_id);
        const confirmedRegs = this.registrations.filter(r => (r.user_id === u.id || r.user_id === u.email) && r.status === 'CONFIRMED').length;
        return {
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone || '',
          role: u.role,
          college_name: u.college_name || (u.is_amrita_student ? 'Amrita Vishwa Vidyapeetham, Amaravati' : 'External College'),
          is_amrita_student: u.is_amrita_student,
          roll_number: u.roll_number || '',
          department: u.department || '',
          year_of_study: u.year_of_study || '',
          city: u.city || '',
          verification_status: u.verification_status,
          verification_note: u.verification_note || '',
          platform_fee_paid: u.platform_fee_paid,
          id_card_url: u.id_card_url || '',
          created_at: u.created_at || new Date().toISOString(),
          club_name: club?.name || null,
          confirmed_registrations: confirmedRegs.toString(),
        };
      });
      return { rows, rowCount: rows.length };
    }

    // 14. DELETE FROM USERS
    if (qLower.startsWith('delete from users')) {
      const id = params[0]?.toString();
      const idx = this.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        this.users.splice(idx, 1);
        this.registrations = this.registrations.filter(r => r.user_id !== id);
        this.attendance = this.attendance.filter(a => a.user_id !== id);
        this.payments = this.payments.filter(p => p.user_id !== id);
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // 15. DELETE FROM OTHER TABLES
    if (qLower.startsWith('delete from events')) {
      const id = params[0]?.toString();
      this.events = this.events.filter(e => e.id !== id);
      this.registrations = this.registrations.filter(r => r.event_id !== id);
      this.attendance = this.attendance.filter(a => a.event_id !== id);
      return { rows: [], rowCount: 1 };
    }
    if (qLower.startsWith('delete from registrations')) {
      const id = params[0]?.toString();
      this.registrations = this.registrations.filter(r => r.user_id !== id && r.id !== id && r.event_id !== id);
      return { rows: [], rowCount: 1 };
    }
    if (qLower.startsWith('delete from attendance')) {
      const id = params[0]?.toString();
      this.attendance = this.attendance.filter(a => a.user_id !== id && a.id !== id && a.event_id !== id);
      return { rows: [], rowCount: 1 };
    }
    if (qLower.startsWith('delete from payments')) {
      const id = params[0]?.toString();
      this.payments = this.payments.filter(p => p.user_id !== id && p.id !== id);
      return { rows: [], rowCount: 1 };
    }

    // 16. UPDATE USERS
    if (qLower.startsWith('update users set') || qLower.startsWith('update users')) {
      const target = this.users.find(u => params.includes(u.id));
      if (target) {
        if (qLower.includes('platform_fee_paid = true') || qLower.includes('platform_fee_paid = true')) {
          target.platform_fee_paid = true;
          target.verification_status = 'verified';
          target.pass_type = 'DELEGATE_PASS_1000';
          if (params[0] && typeof params[0] === 'string' && params[0].startsWith('pay_')) {
            target.platform_payment_id = params[0];
          }
        }
        if (qLower.includes('verification_status =')) {
          if (params[0] === 'verified' || params[0] === 'rejected' || params[0] === 'pending') {
            target.verification_status = params[0];
          }
          if (params[0] === 'verified') target.platform_fee_paid = true;
        }
        return { rows: [target], rowCount: 1 };
      }
    }

    // 17. INSERT INTO REGISTRATIONS
    if (qLower.startsWith('insert into registrations')) {
      const newReg = {
        id: `reg-${uuidv4().slice(0, 8)}`,
        user_id: params[0],
        event_id: params[1],
        team_name: params[2] || null,
        team_members: params[3] || '[]',
        amount_paid: params[4] || 0,
        status: params[5] || 'PENDING',
        payment_status: params[6] || 'pending',
        payment_id: params[7] || null,
        registered_at: new Date().toISOString(),
        confirmed_at: params[5] === 'CONFIRMED' ? new Date().toISOString() : null,
      };
      this.registrations.push(newReg);
      return { rows: [newReg], rowCount: 1 };
    }

    // 18. INSERT INTO PAYMENTS
    if (qLower.startsWith('insert into payments')) {
      let userId: string = params[0]?.toString();
      let type: string = 'platform_fee';
      let amount: number = 100000;
      let orderId: string = `order_${Date.now()}`;
      let status: string = 'created';

      if (qLower.includes("'platform_fee'")) {
        type = 'platform_fee';
        amount = Number(params[1]) || 100000;
        orderId = params[2]?.toString() || `order_${Date.now()}`;
      } else {
        type = params[1]?.toString() || 'event_fee';
        amount = Number(params[2] ?? params[4]) || 0;
        orderId = params[3]?.toString() || params[5]?.toString() || `order_${Date.now()}`;
      }

      const newPay = {
        id: `pay-${uuidv4().slice(0, 8)}`,
        user_id: userId,
        type,
        event_id: null,
        registration_id: null,
        amount,
        razorpay_order_id: orderId,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.payments.push(newPay);
      return { rows: [newPay], rowCount: 1 };
    }

    // 19. SELECT FROM REGISTRATIONS
    if (qLower.includes('from registrations')) {
      let result = [...this.registrations];
      if (qLower.includes('user_id =') && qLower.includes('event_id =')) {
        result = result.filter(r => r.user_id === params[0] && r.event_id === params[1]);
      } else if (qLower.includes('payment_id =')) {
        result = result.filter(r => r.payment_id === params[0] || r.payment_id === params[1]);
      } else if (qLower.includes('user_id =')) {
        result = result.filter(r => r.user_id === params[0]);
      }
      if (qLower.includes('join events') || qLower.includes('registration_id') || qLower.includes('event_name') || qLower.includes('club_name')) {
        const enriched = result.map(r => {
          const event = this.events.find(e => e.id === r.event_id);
          const club = event ? this.clubs.find(c => c.id === event.club_id) : undefined;
          const att = this.attendance.find(a => a.user_id === r.user_id && a.event_id === r.event_id && a.status === 'SUCCESS');
          return {
            ...r,
            registration_id: r.id,
            registration_status: r.status,
            payment_status: r.payment_status || 'paid',
            amount_paid: r.amount_paid || 0,
            team_name: r.team_name || null,
            team_members: r.team_members || null,
            registered_at: r.registered_at,
            confirmed_at: r.confirmed_at || r.registered_at,
            event_id: r.event_id,
            event_name: event?.name || 'Festival Event Registration',
            event_code: event?.event_code || 'EVT',
            category: event?.category || 'General',
            venue: event?.venue || 'Amrita Campus',
            date_start: event?.date_start || '2026-10-15',
            start_time: event?.start_time || '10:00 AM',
            end_time: event?.end_time || '05:00 PM',
            day_number: event?.day_number || 1,
            event_fee: event?.fee || r.amount_paid || 0,
            fee: event?.fee || r.amount_paid || 0,
            poster_url: event?.poster_url || '',
            club_id: club?.id || event?.club_id || 'club-1',
            club_name: club?.name || 'PARINAAM Fest',
            club_slug: club?.slug || 'parinaam',
            club_color: club?.color || '#9333ea',
            attendance_id: att?.id || null,
            checked_in_at: att?.scanned_at || null,
            attendance_status: att?.status || null,
          };
        });
        return { rows: enriched, rowCount: enriched.length };
      }
      return { rows: result, rowCount: result.length };
    }

    // 20. SELECT FROM PAYMENTS
    if (qLower.includes('from payments')) {
      let result = [...this.payments];
      if (qLower.includes('cf_order_id =') || qLower.includes('razorpay_order_id =')) {
        result = result.filter(
          p =>
            p.cf_order_id === params[0] ||
            p.cf_order_id === params[1] ||
            p.razorpay_order_id === params[0] ||
            p.razorpay_order_id === params[1] ||
            p.id === params[0] ||
            p.id === params[1]
        );
      } else if (qLower.includes('id =')) {
        result = result.filter(p => p.id === params[0] || p.cf_order_id === params[0] || p.razorpay_order_id === params[0]);
      } else if (qLower.includes('user_id =')) {
        result = result.filter(p => p.user_id === params[0]);
      }
      return { rows: result, rowCount: result.length };
    }

    // 21. UPDATE REGISTRATIONS
    if (qLower.startsWith('update registrations')) {
      const paymentId = params.find(p => typeof p === 'string' && (p.startsWith('pay-') || p.startsWith('order_') || p.startsWith('cf_')));
      const userId = params.find(p => typeof p === 'string' && (p.startsWith('usr-') || p.startsWith('part-')));
      let updatedCount = 0;
      this.registrations.forEach(r => {
        if ((paymentId && (r.payment_id === paymentId || r.payment_order_id === paymentId)) || (userId && r.user_id === userId)) {
          if (qLower.includes("status = 'confirmed'") || qLower.includes("status = 'CONFIRMED'")) {
            r.status = 'CONFIRMED';
            r.payment_status = 'paid';
            r.confirmed_at = new Date().toISOString();
          } else if (qLower.includes("status = 'cancelled'") || qLower.includes("status = 'CANCELLED'")) {
            r.status = 'CANCELLED';
            r.payment_status = 'refunded';
          }
          updatedCount++;
        }
      });
      return { rows: [], rowCount: updatedCount || 1 };
    }

    // 22. UPDATE PAYMENTS
    if (qLower.startsWith('update payments')) {
      const payId = params[params.length - 1] || params[0];
      const payment = this.payments.find(p => p.id === payId || p.cf_order_id === payId || p.razorpay_order_id === payId);
      if (payment) {
        if (qLower.includes("status = 'paid'")) payment.status = 'paid';
        if (qLower.includes("status = 'failed'")) payment.status = 'failed';
        if (qLower.includes("status = 'refunded'")) payment.status = 'refunded';
        if (params[0] && typeof params[0] === 'string' && (params[0].startsWith('pay_') || params[0].startsWith('cfpay_'))) {
          payment.cf_payment_id = params[0];
          payment.razorpay_payment_id = params[0];
        }
        return { rows: [payment], rowCount: 1 };
      }
    }

    // 23. UPDATE EVENTS ENROLLED
    if (qLower.startsWith('update events set enrolled')) {
      const evtId = params[params.length - 1] || params[0];
      const event = this.events.find(e => e.id === evtId);
      if (event) {
        event.enrolled = (event.enrolled || 0) + 1;
        return { rows: [event], rowCount: 1 };
      }
    }

    if (qLower.startsWith('update events set') && qLower.includes('where id = $')) {
      const idMatch = q.match(/where\s+id\s*=\s*\$(\d+)/i);
      const eventId = idMatch ? params[Number(idMatch[1]) - 1] : undefined;
      const event = this.events.find(e => e.id === eventId);
      if (!event) return { rows: [], rowCount: 0 };

      const whereIndex = qLower.indexOf(' where ');
      const assignments = q.slice('update events set'.length, whereIndex).split(',');
      const eventFields = event as unknown as Record<string, unknown>;
      for (const assignment of assignments) {
        const match = assignment.match(/^\s*([a-z_][\w]*)\s*=\s*\$(\d+)\s*$/i);
        if (!match || !(match[1] in eventFields)) continue;

        const field = match[1];
        const value = params[Number(match[2]) - 1];
        if (['rules', 'rounds', 'coordinators'].includes(field) && typeof value === 'string') {
          eventFields[field] = JSON.parse(value);
        } else {
          eventFields[field] = value;
        }
      }

      return { rows: [event], rowCount: 1 };
    }

    // 24. SPONSORSHIP APPLICATIONS (INSERT, SELECT, UPDATE)
    if (qLower.includes('sponsorship_applications')) {
      if (qLower.startsWith('insert into sponsorship_applications')) {
        const app = {
          id: uuidv4(),
          company_name: params[0] || 'Company',
          contact_person: params[1] || 'Contact',
          email: params[2] || '',
          phone: params[3] || '',
          designation: params[4] || null,
          website: params[5] || null,
          tier: params[6] || 'co_sponsor',
          budget: params[7] || null,
          message: params[8] || null,
          status: 'PENDING',
          reviewed_note: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.sponsorship_applications.unshift(app);
        return { rows: [app], rowCount: 1 };
      }

      if (qLower.startsWith('select count(*)')) {
        let list = [...this.sponsorship_applications];
        if (qLower.includes("status = 'pending'")) list = list.filter(a => a.status === 'PENDING');
        if (qLower.includes("status = 'confirmed'")) list = list.filter(a => a.status === 'CONFIRMED');
        if (qLower.includes("status = 'rejected'")) list = list.filter(a => a.status === 'REJECTED');
        return { rows: [{ count: list.length.toString(), total_count: list.length, pending_count: list.filter(a => a.status === 'PENDING').length, confirmed_count: list.filter(a => a.status === 'CONFIRMED').length, rejected_count: list.filter(a => a.status === 'REJECTED').length }], rowCount: 1 };
      }

      if (qLower.startsWith('select') && qLower.includes('from sponsorship_applications')) {
        let list = [...this.sponsorship_applications];
        const statusParam = params.find(p => typeof p === 'string' && ['PENDING', 'CONFIRMED', 'REJECTED'].includes(p.toUpperCase()));
        if (statusParam) {
          list = list.filter(a => a.status === statusParam.toUpperCase());
        }
        return { rows: list, rowCount: list.length };
      }

      if (qLower.startsWith('update sponsorship_applications')) {
        const app = this.sponsorship_applications.find(a => a.id === params[3] || a.id === params[0] || a.id === params[params.length - 1]);
        if (app) {
          app.status = params[0] || app.status;
          app.reviewed_note = params[1] || app.reviewed_note;
          app.reviewed_by = params[2] || app.reviewed_by;
          app.reviewed_at = new Date().toISOString();
          app.updated_at = new Date().toISOString();
          return { rows: [app], rowCount: 1 };
        }
      }
    }

    // Generic fallback for updates & deletes
    return { rows: [], rowCount: 0 };
  }
}

// Global variable ensures single instance across Next.js reloads
declare global {
  var __parinaam_mock_db: MockDbEngine | undefined;
}

export const mockDb = global.__parinaam_mock_db || new MockDbEngine();
if (process.env.NODE_ENV !== 'production') {
  global.__parinaam_mock_db = mockDb;
  if (mockDb.events.length < EVENTS_DATA.length) {
    mockDb.events = [...EVENTS_DATA];
  }
}
