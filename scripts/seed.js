const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required to run seed.js');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_SEED_PASSWORD environment variable is required to run seed.js');
  }
  const hash = await bcrypt.hash(adminPassword, 10);
  
  // 1. Seed Super Admin
  await pool.query(`
    INSERT INTO users (email, password_hash, full_name, role, is_amrita_student, verification_status, platform_fee_paid, email_verified)
    VALUES ($1, $2, $3, $4, true, $5, true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $4
  `, ['superadmin@parinaam.fest', hash, 'Parinaam Super Admin', 'super_admin', 'verified']);
  console.log('✓ Super Admin Seeded in RDS: superadmin@parinaam.fest (Credential Rotated)');

  // 2. Seed 12 Club Admins
  const clubs = await pool.query('SELECT id, name, slug FROM clubs');
  for (const c of clubs.rows) {
    const adminEmail = `admin.${c.slug}@parinaam.fest`;
    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, club_id, is_amrita_student, verification_status, platform_fee_paid, email_verified)
      VALUES ($1, $2, $3, $4, $5, true, $6, true, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $4, club_id = $5
    `, [adminEmail, hash, `${c.name} Admin`, 'club_admin', c.id, 'verified']);
    console.log(`✓ Club Admin Seeded in RDS: ${adminEmail} -> /admin/${c.slug}`);
  }

  await pool.end();
  console.log('✨ All admin accounts seeded successfully in PostgreSQL RDS!');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
