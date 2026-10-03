# 🌟 PARINAAM 2026 — Official Techfest Web Platform

> **The Flagship National Technical & Cultural Festival of Amrita Vishwa Vidyapeetham, Amaravati**  
> Designed to scale seamlessly for **4,000+ student attendees**, **12 specialized club sub-organizations**, multi-tier administrative workflows, dual-tier registration & KYC approval, Razorpay payment processing, and high-speed venue QR check-in gates.

---

## 📑 Table of Contents
- [🎯 Project Overview](#-project-overview)
- [🏛️ System Architecture & Workflow](#️-system-architecture--workflow)
- [⚡ Key Features & Capabilities](#-key-features--capabilities)
- [🏢 12 Official Clubs & Dedicated Admin Endpoints](#-12-official-clubs--dedicated-admin-endpoints)
- [🔐 Administrative Roles & Default Credentials](#-administrative-roles--default-credentials)
- [💻 Tech Stack](#-tech-stack)
- [🚀 Quick Start & Local Setup](#-quick-start--local-setup)
- [☁️ AWS Production Deployment Guide](#️-aws-production-deployment-guide)
- [🔑 Environment Variables Reference](#-environment-variables-reference)
- [📊 Database Schema Overview](#-database-schema-overview)
- [📂 Project Directory Structure](#-project-directory-structure)

---

## 🎯 Project Overview

**Parinaam** is the premier annual university techfest hosting hackathons, coding contests, robotic wars, cultural nights, battle of bands, and workshops across a 2-day extravaganza.

This platform provides an end-to-end digital operating system for the festival:
1. **Student Registration**: Dual verification flow distinguishing in-house Amrita students (`@av.students.amrita.edu`) from external national college participants.
2. **Super Admin Command HQ (`/superadmin`)**: Centralized dashboard monitoring live revenue, registration volume, platform-wide configurations, and external student ID verification.
3. **12 Club Admin Portals (`/admin/<clubSlug>`)**: Independent sub-dashboards where individual club leads create rich multi-round events, manage rules, download participant CSVs, and scan QR passes at venues.
4. **Digital Pass & QR Gate Check-in**: Dynamic pass generation with anti-counterfeit QR codes and instant live scanning with duplicate entry detection.
5. **Razorpay Payment Gateway**: Seamless platform delegate fee and individual paid workshop collection.


---

## 🏛️ System Architecture & Workflow

```
                                  PARINAAM 2026 WEB ECOSYSTEM
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
          PUBLIC PORTAL                  AUTHENTICATION               ADMINISTRATION
     ┌───────────────────────┐      ┌───────────────────────┐   ┌─────────────────────────┐
     │ • Interactive Hero    │      │ • Dual-Tier Sign Up   │   │ 👑 Super Admin          │
     │ • 12 Club Showcases   │      │   - Amrita (@amrita)  │   │    /superadmin          │
     │ • Event Explorer      │      │   - Other College(ID) │   │                         │
     │ • Schedule & Timeline │      │ • JWT Session Token   │   │ 🛡️ 12 Club Admins       │
     │ • Sponsor Highlights  │      │ • Anti-CSRF Cookies   │   │    /admin/[clubSlug]    │
     └───────────────────────┘      └───────────────────────┘   └─────────────────────────┘
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                ▼
                                    CORE SERVICES LAYER
                 ┌─────────────────────────────────────────────────────────────┐
                 │ • Next.js 15 App Router API Handlers                       │
                 │ • Hybrid PostgreSQL / In-Memory Mock Store DB Layer         │
                 │ • AWS S3 ID Card & Poster Asset Pipeline                   │
                 │ • Razorpay Order Creation & Webhook Verification            │
                 │ • Camera-Assisted HTML5 QR Code Attendance Scanner          │
                 └─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Features & Capabilities

### 1. Dual-Tier Student Registration Flow
- **Amrita Students**:
  - Requires `@av.students.amrita.edu` institutional email domain.
  - Automatically verified upon signup; college name is locked to *Amrita Vishwa Vidyapeetham*.
  - Instant access to delegate passes upon platform fee checkout.
- **Other College Students**:
  - Open to any university domain or personal email.
  - Mandatory university name and roll number entry.
  - Guided to an ID card upload interface post-registration.
  - Placed into a `pending` verification state until approved by the Super Admin team.

### 2. Super Admin Command Center (`/superadmin`)
- Real-time festival KPIs: Total Registrations (Target ~4000), Total Revenue (₹), Pending ID Verifications, Published Events.
- **ID Verification Workbench**: Super Admins preview uploaded ID cards in high resolution and approve/reject external applicants with one click.
- **Global Platform Controls**: Toggle registration open/closed, change payment amounts, and update fest announcement banners.
- **Role Elevation**: Elevate any user account to a Club Admin or Super Admin.

### 3. Dedicated Club Admin Portals (`/admin/[clubSlug]`)
- Each of the 12 clubs operates an autonomous command portal at `/admin/<clubSlug>` (e.g. `/admin/chakravyuha`, `/admin/relu`, `/admin/robotics`).
- **Rich Event Studio**:
  - Event title, category, tagline, eligibility, team size bounds (min/max).
  - Multi-round agenda builder (Round name, date/time, venue).
  - Rulebook builder and coordinator contact management.
  - Banner poster upload integration.
- **Live Participant Manager**: View filtered student rosters for the club's events and export data directly to CSV.
- **Venue Camera QR Scanner (`/admin/[clubSlug]/scan`)**: Real-time camera scanner with audio/visual feedback for attendee check-in.

### 4. Razorpay Payment Gateway & Digital Pass
- Integrated Razorpay order generation with signature verification.
- Issues a personalized **Digital Delegate Pass** featuring a live QR code, participant roll number, college badge, and event schedule.

---

## 🏢 12 Official Clubs & Dedicated Admin Endpoints

| Club Name | Slug | Portal URL | Domain & Focus |
|---|---|---|---|
| **Chakravyuha** | `chakravyuha` | `/admin/chakravyuha` | Coding, National Hackathons, CTF & Cybersecurity |
| **Prachurya** | `prachurya` | `/admin/prachurya` | Cultural, Fine Arts, Debates & Literary Events |
| **ReLU** | `relu` | `/admin/relu` | AI/ML, Data Analytics & Kaggle Sprint Arena |
| **Avisruta** | `avisruta` | `/admin/avisruta` | Battle of Bands, Solo Vocals & Live Instrumental |
| **Salesforce AgentBlazer** | `salesforce-agentblazer` | `/admin/salesforce-agentblazer` | Enterprise Cloud, Case Studies & Business Tech |
| **Saptaswara** | `saptaswara` | `/admin/saptaswara` | Classical Music, Carnatic/Hindustani Choir |
| **Robotics** | `robotics` | `/admin/robotics` | RoboWars, Line Follower & Drone Racing Challenges |
| **IEEE** | `ieee` | `/admin/ieee` | Electrical, Electronics & Hardware Design Battles |
| **Avinya** | `avinya` | `/admin/avinya` | Shark Tank, Startup Pitches & Product Innovation |
| **Adivika** | `adivika` | `/admin/adivika` | Street Theatre, Stage Play, Mime & Heritage Arts |
| **Nrityasparsh** | `nrityasparsh` | `/admin/nrityasparsh` | Western/Classical Dance Battles & Choreography |
| **Drisya** | `drisya` | `/admin/drisya` | Filmmaking, Photography, Visual Media & Reels |

---

## 🔐 Administrative Roles & Account Access

All administrative accounts have undergone mandatory security credential rotation. Plaintext passwords are strictly prohibited in documentation and code.

### 1. Super Admin Account
- **Email:** `superadmin@parinaam.fest`
- **Credential Status:** `Credential Rotated (Secure)`
- **Dashboard URL:** [`http://localhost:3000/superadmin`](http://localhost:3000/superadmin)

### 2. Club Admin Accounts
| Club | Admin Email | Credential Status | Direct Portal URL |
|---|---|---|---|
| **Chakravyuha** | `admin.chakravyuha@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/chakravyuha`](http://localhost:3000/admin/chakravyuha) |
| **Prachurya** | `admin.prachurya@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/prachurya`](http://localhost:3000/admin/prachurya) |
| **ReLU** | `admin.relu@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/relu`](http://localhost:3000/admin/relu) |
| **Avisruta** | `admin.avisruta@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/avisruta`](http://localhost:3000/admin/avisruta) |
| **Salesforce AgentBlazer** | `admin.salesforce-agentblazer@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/salesforce-agentblazer`](http://localhost:3000/admin/salesforce-agentblazer) |
| **Saptaswara** | `admin.saptaswara@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/saptaswara`](http://localhost:3000/admin/saptaswara) |
| **Robotics** | `admin.robotics@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/robotics`](http://localhost:3000/admin/robotics) |
| **IEEE** | `admin.ieee@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/ieee`](http://localhost:3000/admin/ieee) |
| **Avinya** | `admin.avinya@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/avinya`](http://localhost:3000/admin/avinya) |
| **Adivika** | `admin.adivika@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/adivika`](http://localhost:3000/admin/adivika) |
| **Nrityasparsh** | `admin.nrityasparsh@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/nrityasparsh`](http://localhost:3000/admin/nrityasparsh) |
| **Drisya** | `admin.drisya@parinaam.fest` | `Credential Rotated (Secure)` | [`http://localhost:3000/admin/drisya`](http://localhost:3000/admin/drisya) |

---

## 💻 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) + React 19
- **Language**: TypeScript with strict typing
- **Styling**: Tailwind CSS, CSS Grid, Glassmorphism, Modern Dark Mode UI
- **Icons & Visuals**: `lucide-react`, Custom Vector Graphics, High-DPI Assets
- **Database Layer**: PostgreSQL (`pg` driver) with automatic in-memory fallback for offline/development resilience
- **Authentication**: JWT (`jose`), `bcryptjs`, HTTP-only secure cookie sessions
- **Payment Processing**: Razorpay Webhooks and Checkout SDK
- **Hardware Integration**: HTML5 QR Code Scanner for live venue check-ins
- **Cloud Infrastructure**: AWS RDS (PostgreSQL), AWS S3, AWS EC2 / ECS / Amplify

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- Node.js 18+ or 20+
- npm / yarn / pnpm
- Git

### 2. Clone the Repository
```bash
git clone https://github.com/chakravyuha-club/parinaam.git
cd parinaam
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env.local
```
*(The app works out of the box with default test values and in-memory mock store if PostgreSQL or Razorpay keys are not yet configured).*

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ AWS Production Deployment Guide

### Option A: AWS Amplify (Recommended for Fast CI/CD)
1. Navigate to the **AWS Management Console** → **AWS Amplify**.
2. Click **Deploy an app** → Select **GitHub** and authorize `chakravyuha-club/parinaam`.
3. Select the `main` branch.
4. In the build settings, confirm Next.js is detected (SSR mode).
5. Add environment variables under **Environment Variables** (see table below).
6. Click **Save and Deploy**.

### Option B: AWS EC2 / Docker Container
1. Launch an **Ubuntu 24.04 LTS** EC2 instance (`t3.medium` or larger recommended for 4000+ concurrent users).
2. Install Node.js, Git, and PM2:
   ```bash
   sudo apt update && sudo apt install -y nodejs npm git nginx
   sudo npm install -g pm2
   ```
3. Clone and build the project:
   ```bash
   git clone https://github.com/chakravyuha-club/parinaam.git
   cd parinaam
   npm install
   npm run build
   ```
4. Start with PM2:
   ```bash
   pm2 start npm --name "parinaam" -- start
   pm2 startup
   pm2 save
   ```
5. Configure Nginx reverse proxy to port `3000` and install SSL with Let's Encrypt (`certbot`).

### Option C: AWS RDS PostgreSQL Initialization
Execute the schema migration script on your AWS RDS instance:
```bash
psql -h YOUR_RDS_ENDPOINT -U postgres -d parinaam -f src/lib/schema.sql
```

---

## 🔑 Environment Variables Reference

| Variable Name | Required | Description | Example Value |
|---|---|---|---|
| `DATABASE_URL` | Production | PostgreSQL connection string | `postgresql://user:pass@rds-endpoint:5432/parinaam` |
| `JWT_SECRET` | Yes | 32+ character key for JWT signing | `d9823f9823hfd98h23f98h23f89h23` |
| `RAZORPAY_KEY_ID` | Production | Razorpay Public Key | `rzp_live_XXXXXXXXXXXXXX` |
| `RAZORPAY_KEY_SECRET` | Production | Razorpay Secret Key | `XXXXXXXXXXXXXXXXXXXXXXXX` |
| `AWS_REGION` | Optional | AWS S3 Bucket Region | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | Optional | IAM Access Key for S3 uploads | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Optional | IAM Secret Key for S3 uploads | `wJalrXUtnFEMI/K7MDENG/...` |
| `AWS_S3_BUCKET` | Optional | S3 Bucket Name for ID Cards & Posters | `parinaam-uploads-2026` |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical domain URL | `https://parinaam.amrita.edu` |

---

## 📊 Database Schema Overview

```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'student',        -- 'student' | 'club_admin' | 'super_admin'
  club_id UUID REFERENCES clubs(id),
  college_name VARCHAR,
  is_amrita_student BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR,            -- 'pending' | 'verified' | 'rejected'
  id_card_url VARCHAR,
  platform_fee_paid BOOLEAN DEFAULT FALSE,
  qr_token VARCHAR UNIQUE
);

clubs (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR
);

events (
  id UUID PRIMARY KEY,
  club_id UUID REFERENCES clubs(id),
  name VARCHAR NOT NULL,
  event_code VARCHAR UNIQUE,
  category VARCHAR,
  rounds JSONB,                          -- Array of rounds with time & venue
  rules JSONB,                           -- Array of rule strings
  coordinators JSONB,                    -- Array of name, phone, email objects
  capacity INT,
  fee DECIMAL
);

registrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  status VARCHAR DEFAULT 'CONFIRMED',
  attended BOOLEAN DEFAULT FALSE,
  attended_at TIMESTAMP
);
```

---

## 📂 Project Directory Structure

```
parinaam/
├── public/                      # Brand assets, festival logos, campus photos
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── [clubSlug]/      # Autonomous Club Portals (/admin/chakravyuha, /admin/relu, etc.)
│   │   │   │   ├── events/      # Event creator & editor
│   │   │   │   └── scan/        # Club-scoped QR scanner
│   │   │   └── users/           # User management
│   │   ├── superadmin/          # Superadmin Command HQ (/superadmin)
│   │   │   ├── settings/        # Global platform configuration
│   │   │   └── users/           # ID Card KYC verification workbench
│   │   ├── api/                 # Next.js API route handlers (Auth, Events, Stats, Razorpay)
│   │   ├── auth/                # Login & Dual-Tier Registration pages
│   │   ├── dashboard/           # Student delegate pass and registration center
│   │   ├── events/              # Public event explorer & detail views
│   │   ├── pass/                # Digital Pass display & verification
│   │   └── layout.tsx           # Global app layout & navigation
│   ├── components/              # Modular UI components (Navbar, Footer, QRScanner, Modals)
│   ├── context/                 # AuthContext & FestContext global state
│   ├── data/                    # Static fallback fixtures for clubs and events
│   ├── lib/                     # Database client, In-Memory Mock Engine, JWT Auth, Schema
│   └── types/                   # TypeScript interfaces & type definitions
├── PARINAAM_NAVIGATION_AND_CREDENTIALS.md # Master login & URL directory
├── package.json
└── README.md
```

---

## 🤝 Contribution & Maintenance

Maintained by **Chakravyuha Club** & the **Parinaam 2026 Core Technical Team**.  
For security disclosures or university infrastructure questions, contact `superadmin@parinaam.fest`.

© 2026 Amrita Vishwa Vidyapeetham, Amaravati. All rights reserved.
