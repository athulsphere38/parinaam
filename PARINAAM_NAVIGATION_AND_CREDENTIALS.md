# 🎪 PARINAAM 2026 — Master URL & Credentials Manual

Welcome to the newly structured URL directory and credential manual for **Parinaam 2026 Tech & Cultural Fest**.

---

## ⚡ URL Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │              Authentication                  │
                      │          http://localhost:3000/auth/login    │
                      └──────────────────────┬───────────────────────┘
                                             │
                 ┌───────────────────────────┼───────────────────────────┐
                 ▼                           ▼                           ▼
        👑 Super Admin             🛡️ 12 Club Admins             🎓 Students
       /superadmin                 /admin/[clubSlug]             /dashboard
       /superadmin/users           e.g. /admin/chakravyuha       /dashboard/profile
       /superadmin/settings             /admin/relu              /dashboard/payment
                                        /admin/robotics          /pass
```

---

## 👑 1. Super Admin Headquarters (`/superadmin`)

The central command center for festival convenors and super administrators.

- **Username / Email:** `superadmin@parinaam.fest`
- **Password:** `Admin@123`
- **Role:** `super_admin`

### Direct URLs for Super Admin
| Portal | Direct URL | Description |
|---|---|---|
| **Super Admin HQ** | [`http://localhost:3000/superadmin`](http://localhost:3000/superadmin) | Complete festival metrics, target ~4000 students tracker, revenue overview, and 12-club portal switcher |
| **All Users & KYC Queue** | [`http://localhost:3000/superadmin/users`](http://localhost:3000/superadmin/users) | Filter & search all registered students, approve/reject external college ID cards, role management, and CSV export |
| **Platform Settings** | [`http://localhost:3000/superadmin/settings`](http://localhost:3000/superadmin/settings) | Set platform fee (₹99), toggle registration status, update fest dates and official Amrita email domain |

---

## 🛡️ 2. Dedicated 12 Club Admin Portals (`/admin/[clubSlug]`)

Each club has its own dedicated portal for managing events, reviewing attendee lists, exporting CSVs, and running the live venue QR scanner.

> **Default Password for All Club Admins:** `Admin@123`  
> *(When logging in with a club email, the system automatically redirects you to your club's dedicated `/admin/[clubSlug]` portal).*

---

### 1. Chakravyuha (Technical & Hackathons)
- **Club Admin Email:** `admin.chakravyuha@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/chakravyuha`](http://localhost:3000/admin/chakravyuha)
- **Create Event:** [`http://localhost:3000/admin/chakravyuha/events/new`](http://localhost:3000/admin/chakravyuha/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/chakravyuha/scan`](http://localhost:3000/admin/chakravyuha/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=chakravyuha`](http://localhost:3000/events?club=chakravyuha)

---

### 2. Prachurya (Cultural & Fine Arts)
- **Club Admin Email:** `admin.prachurya@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/prachurya`](http://localhost:3000/admin/prachurya)
- **Create Event:** [`http://localhost:3000/admin/prachurya/events/new`](http://localhost:3000/admin/prachurya/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/prachurya/scan`](http://localhost:3000/admin/prachurya/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=prachurya`](http://localhost:3000/events?club=prachurya)

---

### 3. ReLU (AI / ML & Data Science)
- **Club Admin Email:** `admin.relu@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/relu`](http://localhost:3000/admin/relu)
- **Create Event:** [`http://localhost:3000/admin/relu/events/new`](http://localhost:3000/admin/relu/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/relu/scan`](http://localhost:3000/admin/relu/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=relu`](http://localhost:3000/events?club=relu)

---

### 4. Avisruta (Music & Instrumental)
- **Club Admin Email:** `admin.avisruta@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/avisruta`](http://localhost:3000/admin/avisruta)
- **Create Event:** [`http://localhost:3000/admin/avisruta/events/new`](http://localhost:3000/admin/avisruta/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/avisruta/scan`](http://localhost:3000/admin/avisruta/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=avisruta`](http://localhost:3000/events?club=avisruta)

---

### 5. Salesforce AgentBlazer (Cloud & Enterprise Tech)
- **Club Admin Email:** `admin.salesforce-agentblazer@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/salesforce-agentblazer`](http://localhost:3000/admin/salesforce-agentblazer)
- **Create Event:** [`http://localhost:3000/admin/salesforce-agentblazer/events/new`](http://localhost:3000/admin/salesforce-agentblazer/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/salesforce-agentblazer/scan`](http://localhost:3000/admin/salesforce-agentblazer/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=salesforce-agentblazer`](http://localhost:3000/events?club=salesforce-agentblazer)

---

### 6. Saptaswara (Performing Arts & Classical)
- **Club Admin Email:** `admin.saptaswara@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/saptaswara`](http://localhost:3000/admin/saptaswara)
- **Create Event:** [`http://localhost:3000/admin/saptaswara/events/new`](http://localhost:3000/admin/saptaswara/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/saptaswara/scan`](http://localhost:3000/admin/saptaswara/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=saptaswara`](http://localhost:3000/events?club=saptaswara)

---

### 7. Robotics (Robotics & Hardware Design)
- **Club Admin Email:** `admin.robotics@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/robotics`](http://localhost:3000/admin/robotics)
- **Create Event:** [`http://localhost:3000/admin/robotics/events/new`](http://localhost:3000/admin/robotics/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/robotics/scan`](http://localhost:3000/admin/robotics/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=robotics`](http://localhost:3000/events?club=robotics)

---

### 8. IEEE (Electrical & Hardware Engineering)
- **Club Admin Email:** `admin.ieee@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/ieee`](http://localhost:3000/admin/ieee)
- **Create Event:** [`http://localhost:3000/admin/ieee/events/new`](http://localhost:3000/admin/ieee/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/ieee/scan`](http://localhost:3000/admin/ieee/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=ieee`](http://localhost:3000/events?club=ieee)

---

### 9. Avinya (Innovation & Startups)
- **Club Admin Email:** `admin.avinya@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/avinya`](http://localhost:3000/admin/avinya)
- **Create Event:** [`http://localhost:3000/admin/avinya/events/new`](http://localhost:3000/admin/avinya/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/avinya/scan`](http://localhost:3000/admin/avinya/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=avinya`](http://localhost:3000/events?club=avinya)

---

### 10. Adivika (Cultural Heritage & Theatre)
- **Club Admin Email:** `admin.adivika@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/adivika`](http://localhost:3000/admin/adivika)
- **Create Event:** [`http://localhost:3000/admin/adivika/events/new`](http://localhost:3000/admin/adivika/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/adivika/scan`](http://localhost:3000/admin/adivika/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=adivika`](http://localhost:3000/events?club=adivika)

---

### 11. Nrityasparsh (Dance & Choreography)
- **Club Admin Email:** `admin.nrityasparsh@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/nrityasparsh`](http://localhost:3000/admin/nrityasparsh)
- **Create Event:** [`http://localhost:3000/admin/nrityasparsh/events/new`](http://localhost:3000/admin/nrityasparsh/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/nrityasparsh/scan`](http://localhost:3000/admin/nrityasparsh/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=nrityasparsh`](http://localhost:3000/events?club=nrityasparsh)

---

### 12. Drisya (Film, Photography & Visual Media)
- **Club Admin Email:** `admin.drisya@parinaam.fest`
- **Password:** `Admin@123`
- **Admin Portal URL:** [`http://localhost:3000/admin/drisya`](http://localhost:3000/admin/drisya)
- **Create Event:** [`http://localhost:3000/admin/drisya/events/new`](http://localhost:3000/admin/drisya/events/new)
- **QR Venue Scanner:** [`http://localhost:3000/admin/drisya/scan`](http://localhost:3000/admin/drisya/scan)
- **Public Events Page:** [`http://localhost:3000/events?club=drisya`](http://localhost:3000/events?club=drisya)

---

## 🎓 3. Student & Public Portals

| Page | URL | Description |
|---|---|---|
| **Sign In** | [`http://localhost:3000/auth/login`](http://localhost:3000/auth/login) | Smart login with automatic role-based redirect to `/superadmin`, `/admin/[club]`, or `/dashboard` |
| **Registration** | [`http://localhost:3000/auth/register`](http://localhost:3000/auth/register) | Student signup with Amrita student vs Other College student selector |
| **Student Dashboard** | [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard) | Digital Pass with dynamic QR code & enrolled events |
| **Profile** | [`http://localhost:3000/dashboard/profile`](http://localhost:3000/dashboard/profile) | Edit profile & upload ID card |
| **Payment** | [`http://localhost:3000/dashboard/payment`](http://localhost:3000/dashboard/payment) | Platform entry fee & event fee payment |
| **Events Explorer** | [`http://localhost:3000/events`](http://localhost:3000/events) | All fest events with club & category filters |
| **Schedule** | [`http://localhost:3000/schedule`](http://localhost:3000/schedule) | Day 1 & Day 2 timeline |
| **Pronites** | [`http://localhost:3000/pronites`](http://localhost:3000/pronites) | Celebrity artist concerts & DJ nights |
| **Merchandise** | [`http://localhost:3000/merch`](http://localhost:3000/merch) | Official fest apparel & goodies |
| **Hospitality** | [`http://localhost:3000/hospitality`](http://localhost:3000/hospitality) | Accommodation, food, and campus guidelines |

---

## 💳 4. Payment Gateway (Cashfree LIVE Production)

- **Provider:** Cashfree Payment Gateway
- **API Version:** `2023-08-01`
- **Environment:** `production` (Live)
- **App ID (x-client-id):** `1454372309defa4f81be166e22e2734541`
- **Secret Key (x-client-secret):** `[Configured in .env.local / .env.production]`
- **Checkout JS SDK:** `https://sdk.cashfree.com/js/v3/cashfree.js`

