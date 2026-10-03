-- Parinaam 2026 — Full Database Schema
-- Run this on AWS RDS PostgreSQL instance

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CLUBS (Domains - 12 clubs)
-- ============================================================
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(60) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(20),          -- Hex color for club branding
  icon_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'club_admin', 'super_admin')),
  
  -- Club admin link
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  
  -- Student details
  college_name VARCHAR(255),
  is_amrita_student BOOLEAN DEFAULT FALSE,
  roll_number VARCHAR(60),
  department VARCHAR(150),
  year_of_study VARCHAR(10),
  city VARCHAR(100),
  
  -- Verification
  id_card_url TEXT,                      -- for non-Amrita students
  verification_status VARCHAR(20) DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_note TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,                      -- super admin user id
  
  -- Platform fee
  platform_fee_paid BOOLEAN DEFAULT FALSE,
  platform_payment_id VARCHAR(200),      -- Razorpay payment ID
  platform_fee_paid_at TIMESTAMPTZ,
  
  -- QR / Pass
  qr_token VARCHAR(100) UNIQUE,          -- opaque UUID hash for QR
  pass_type VARCHAR(30) DEFAULT 'DELEGATE PASS',
  
  -- Profile
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verify_token VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_club_id ON users(club_id);
CREATE INDEX idx_users_qr_token ON users(qr_token);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Basic Info
  name VARCHAR(200) NOT NULL,
  event_code VARCHAR(50) UNIQUE,
  tagline VARCHAR(300),
  short_description TEXT,
  full_description TEXT,
  
  -- Category & Tags
  category VARCHAR(80),
  tags TEXT[],                             -- array of tag strings
  
  -- Venue & Schedule
  venue VARCHAR(300),
  date_start DATE,
  date_end DATE,
  start_time TIME,
  end_time TIME,
  day_number SMALLINT CHECK (day_number IN (1, 2, 3)),
  
  -- Team
  min_team_size SMALLINT DEFAULT 1,
  max_team_size SMALLINT DEFAULT 1,
  
  -- Capacity & Fees
  capacity INTEGER,
  enrolled INTEGER DEFAULT 0,
  fee INTEGER DEFAULT 0,                   -- INR
  prize_pool VARCHAR(100),
  
  -- Eligibility & Rules
  eligibility TEXT,
  rules JSONB DEFAULT '[]'::JSONB,         -- array of rule strings
  
  -- Rounds (multiple rounds support)
  rounds JSONB DEFAULT '[]'::JSONB,
  
  -- Coordinators
  coordinators JSONB DEFAULT '[]'::JSONB,
  
  -- Media & Registration
  poster_url TEXT,
  rulebook_url TEXT,
  unstop_url TEXT,
  registration_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'closed', 'cancelled')),
  registration_open BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);

-- ============================================================
-- REGISTRATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Team info
  team_name VARCHAR(200),
  team_members JSONB DEFAULT '[]'::JSONB,  -- [{name, email, college}]
  
  -- Payment
  amount_paid INTEGER DEFAULT 0,
  payment_id VARCHAR(200),                 -- Razorpay payment ID
  payment_order_id VARCHAR(200),
  payment_status VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLISTED')),
  
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_status ON registrations(status);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  registration_id UUID REFERENCES registrations(id),
  
  scanned_by UUID REFERENCES users(id),   -- organizer/admin who scanned
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  venue VARCHAR(300),
  
  status VARCHAR(30) DEFAULT 'SUCCESS'
    CHECK (status IN ('SUCCESS', 'DUPLICATE_ATTEMPT', 'INVALID', 'NOT_REGISTERED')),
  
  UNIQUE(user_id, event_id)               -- prevent duplicate attendance
);

CREATE INDEX idx_attendance_event_id ON attendance(event_id);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);

-- ============================================================
-- PAYMENTS (audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(30) NOT NULL 
    CHECK (type IN ('platform_fee', 'event_fee')),
  
  event_id UUID REFERENCES events(id),
  registration_id UUID REFERENCES registrations(id),
  
  amount INTEGER NOT NULL,                -- in INR paise (e.g. 100000)
  currency VARCHAR(5) DEFAULT 'INR',
  
  cf_order_id VARCHAR(200),
  cf_payment_id VARCHAR(200),
  payment_session_id TEXT,
  razorpay_order_id VARCHAR(200),
  razorpay_payment_id VARCHAR(200),
  razorpay_signature VARCHAR(500),
  
  status VARCHAR(20) DEFAULT 'created'
    CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================
-- PLATFORM CONFIG
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED: 12 CLUBS
-- ============================================================
INSERT INTO clubs (name, slug, description, color) VALUES
  ('Chakravyuha', 'chakravyuha', 'Technical & Engineering Events', '#6366f1'),
  ('Prachurya', 'prachurya', 'Cultural & Fine Arts Events', '#f59e0b'),
  ('ReLU', 'relu', 'AI/ML & Data Science Events', '#10b981'),
  ('Avisruta', 'avisruta', 'Music Events', '#8b5cf6'),
  ('Salesforce AgentBlazer', 'salesforce-agentblazer', 'Industry & Business Events', '#3b82f6'),
  ('Saptaswara', 'saptaswara', 'Performing Arts Events', '#ec4899'),
  ('Robotics', 'robotics', 'Robotics & Hardware Events', '#f97316'),
  ('IEEE', 'ieee', 'Electronics & Electrical Events', '#06b6d4'),
  ('Avinya', 'avinya', 'Innovation & Startup Events', '#84cc16'),
  ('Adivika', 'adivika', 'Cultural & Heritage Events', '#e11d48'),
  ('Nrityasparsh', 'nrityasparsh', 'Dance & Movement Events', '#a855f7'),
  ('Drisya', 'drisya', 'Film, Photography & Media Events', '#14b8a6')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED: PLATFORM CONFIG
-- ============================================================
INSERT INTO platform_config (key, value, description) VALUES
  ('platform_fee', '99', 'Platform registration fee in INR'),
  ('fest_name', 'PARINAAM 2026', 'Fest name'),
  ('fest_dates', 'October 11-12, 2026', 'Fest dates'),
  ('registration_open', 'true', 'Global registration toggle'),
  ('amrita_domain', 'av.students.amrita.edu', 'Amrita student email domain')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED: SUPER ADMIN & 12 CLUB ADMINS
-- Password for all default accounts: Admin@123
-- ============================================================
INSERT INTO users (email, password_hash, full_name, role, is_amrita_student, email_verified, verification_status)
VALUES 
  ('superadmin@parinaam.fest', '$2b$10$oVTYvxiKT8AVrgLI6FDkduvkxf7ZAOMPBLpJYn4PvqSgUO7lcUUIS', 'Parinaam Super Admin', 'super_admin', TRUE, TRUE, 'verified')
ON CONFLICT (email) DO NOTHING;

-- 12 Club Admins mapped to their respective clubs
INSERT INTO users (email, password_hash, full_name, role, club_id, is_amrita_student, email_verified, verification_status)
SELECT 
  'admin.' || c.slug || '@parinaam.fest',
  '$2b$10$oVTYvxiKT8AVrgLI6FDkduvkxf7ZAOMPBLpJYn4PvqSgUO7lcUUIS',
  c.name || ' Admin',
  'club_admin',
  c.id,
  TRUE,
  TRUE,
  'verified'
FROM clubs c
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- FUNCTION: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SPONSORSHIP APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sponsorship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  designation VARCHAR(150),
  website TEXT,
  tier VARCHAR(50) NOT NULL,
  budget VARCHAR(100),
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED')),
  reviewed_note TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsorship_apps_status ON sponsorship_applications(status);
CREATE INDEX IF NOT EXISTS idx_sponsorship_apps_created_at ON sponsorship_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsorship_apps_email ON sponsorship_applications(email);

CREATE TRIGGER update_sponsorship_applications_updated_at BEFORE UPDATE ON sponsorship_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

