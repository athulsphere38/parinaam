import { db } from '@/lib/db';
import { EventsClientView, Club, Event } from '@/components/events/EventsClientView';

export const revalidate = 0;

async function getInitialData() {
  try {
    const [clubsRes, eventsRes] = await Promise.all([
      db.query(`
        SELECT c.id, c.name, c.slug, c.color, COUNT(e.id)::text as event_count
        FROM clubs c
        LEFT JOIN events e ON e.club_id = c.id AND e.status = 'published'
        GROUP BY c.id, c.name, c.slug, c.color
        ORDER BY c.name
      `),
      db.query(`
        SELECT
          e.id, e.name, e.event_code, e.tagline, e.short_description,
          e.category, e.venue, e.date_start, e.start_time, e.end_time,
          e.min_team_size, e.max_team_size, e.capacity, e.enrolled, e.fee,
          e.amrita_fee, e.other_fee, e.prize_pool, e.poster_url, e.status,
          e.registration_open, e.unstop_url, e.registration_url,
          e.is_popular, e.is_featured,
          c.id as club_id, c.name as club_name, c.slug as club_slug, c.color as club_color
        FROM events e
        JOIN clubs c ON e.club_id = c.id
        WHERE e.status = 'published'
        ORDER BY e.created_at DESC
        LIMIT 18
      `)
    ]);

    const sortedEvents = [...(eventsRes.rows || [])].sort((a: Event, b: Event) => {
      const aFlag = (a.is_popular || a.is_featured) ? 0 : 1;
      const bFlag = (b.is_popular || b.is_featured) ? 0 : 1;
      return aFlag - bFlag;
    });

    return {
      clubs: (clubsRes.rows || []) as Club[],
      events: sortedEvents as Event[],
      total: eventsRes.rowCount || sortedEvents.length,
    };
  } catch (err) {
    console.error('Error loading initial events server-side:', err);
    return { clubs: [], events: [], total: 0 };
  }
}

export default async function EventsPage() {
  const initialData = await getInitialData();
  return (
    <EventsClientView
      initialClubs={initialData.clubs}
      initialEvents={initialData.events}
      initialTotal={initialData.total}
    />
  );
}
