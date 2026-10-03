import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/apiResponse';
import { isValidEmail } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const VALID_TIERS = ['associate', 'co_sponsor', 'title_sponsor'];

// POST /api/sponsors/apply — Public endpoint for submitting sponsor applications
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      contactPerson,
      email,
      phone,
      designation,
      website,
      tier,
      budget,
      message,
    } = body || {};

    const cleanCompanyName = typeof companyName === 'string' ? companyName.trim() : '';
    const cleanContactPerson = typeof contactPerson === 'string' ? contactPerson.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const cleanDesignation = typeof designation === 'string' ? designation.trim() : null;
    const cleanWebsite = typeof website === 'string' ? website.trim() : null;
    const cleanTier = typeof tier === 'string' ? tier.trim().toLowerCase() : 'co_sponsor';
    const cleanBudget = typeof budget === 'string' ? budget.trim() : null;
    const cleanMessage = typeof message === 'string' ? message.trim() : null;

    // Required field validation
    if (!cleanCompanyName) {
      return error('Company / Organization name is required');
    }
    if (!cleanContactPerson) {
      return error('Contact person name is required');
    }
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return error('Please enter a valid official corporate email address');
    }
    if (!cleanPhone || cleanPhone.length < 7) {
      return error('Please enter a valid phone or WhatsApp number');
    }
    if (!VALID_TIERS.includes(cleanTier)) {
      return error('Invalid sponsorship package tier selected');
    }

    // Insert into DB with default status = 'PENDING'
    const result = await db.query(
      `INSERT INTO sponsorship_applications (
        company_name, contact_person, email, phone, designation, website, tier, budget, message, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
       RETURNING id, company_name, contact_person, email, tier, status, created_at`,
      [
        cleanCompanyName,
        cleanContactPerson,
        cleanEmail,
        cleanPhone,
        cleanDesignation || null,
        cleanWebsite || null,
        cleanTier,
        cleanBudget || null,
        cleanMessage || null,
      ]
    );

    const insertedRow = result.rows[0];

    return success({
      message: 'Your sponsorship application has been received successfully! Our Corporate Relations Desk will review your application.',
      application_id: insertedRow?.id,
      company_name: insertedRow?.company_name,
      contact_person: insertedRow?.contact_person,
      email: insertedRow?.email,
      tier: insertedRow?.tier,
      status: insertedRow?.status,
      created_at: insertedRow?.created_at,
    });
  } catch (err) {
    console.error('Submit sponsor application error:', err);
    return serverError();
  }
}
