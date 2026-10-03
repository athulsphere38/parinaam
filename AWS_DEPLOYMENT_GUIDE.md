# 🚀 Complete Manual AWS Deployment Guide for PARINAAM 2026
## Domain: `parinaam.online` & `www.parinaam.online`
### Architecture: AWS EC2 (Ubuntu 24.04) + AWS RDS (PostgreSQL) + AWS S3 + Nginx Reverse Proxy + PM2 + Let's Encrypt SSL

---

## 📑 Table of Contents
1. [Architecture Overview & Sizing](#1-architecture-overview--sizing)
2. [Step 1: Set Up AWS RDS PostgreSQL Database](#step-1-set-up-aws-rds-postgresql-database)
3. [Step 2: Create AWS S3 Bucket & IAM Credentials for Uploads](#step-2-create-aws-s3-bucket--iam-credentials-for-uploads)
4. [Step 3: Launch and Configure AWS EC2 Instance](#step-3-launch-and-configure-aws-ec2-instance)
5. [Step 4: Connect Domain DNS (`parinaam.online`)](#step-4-connect-domain-dns-parinaamonline)
6. [Step 5: Install Runtime Dependencies on EC2](#step-5-install-runtime-dependencies-on-ec2)
7. [Step 6: Clone Codebase & Configure Environment](#step-6-clone-codebase--configure-environment)
8. [Step 7: Initialize Database Schema & Seed Accounts](#step-7-initialize-database-schema--seed-accounts)
9. [Step 8: Build and Run Application with PM2](#step-8-build-and-run-application-with-pm2)
10. [Step 9: Configure Nginx Reverse Proxy](#step-9-configure-nginx-reverse-proxy)
11. [Step 10: Install Let's Encrypt SSL Certificate](#step-10-install-lets-encrypt-ssl-certificate)
12. [Step 11: Configure Cashfree Production Webhooks](#step-11-configure-cashfree-production-webhooks)
13. [Step 12: Zero-Downtime Deployment Script & Maintenance](#step-12-zero-downtime-deployment-script--maintenance)
14. [Troubleshooting & Verification Checklist](#troubleshooting--verification-checklist)

---

## 1. Architecture Overview & Sizing

For a festival expecting **4,000+ registered students**, 12 active club administrators, live payment checkouts, and real-time QR attendance scanning:

| Component | AWS Resource | Recommended Sizing | Estimated Cost |
|---|---|---|---|
| **Web & API Server** | EC2 Instance | `t3.medium` (2 vCPU, 4 GB RAM) | ~$30 / month |
| **Database** | RDS PostgreSQL 16 | `db.t4g.medium` or `db.t4g.small` | ~$25 - $40 / month |
| **Static Assets & Uploads** | S3 Bucket | Standard S3 (`ap-south-1` Mumbai) | Pay per GB (~$1-3) |
| **Domain & DNS** | Route 53 or Registrar | A-Record -> Elastic IP | Free with domain |
| **SSL Certificate** | Let's Encrypt | Automated via Certbot | **100% Free** |

---

## Step 1: Set Up AWS RDS PostgreSQL Database

### 1.1 Create RDS Security Group
1. Open the **AWS VPC Console** → **Security Groups** → Click **Create security group**.
2. **Security group name:** `parinaam-rds-sg`
3. **Description:** `Allow PostgreSQL traffic from EC2`
4. **VPC:** Select your default VPC (e.g. `ap-south-1`).
5. Under **Inbound rules**:
   - **Type:** `PostgreSQL` (Port `5432`)
   - **Source:** Select `Custom` → Choose your EC2 Security Group (`parinaam-ec2-sg`) or your VPC CIDR (e.g., `172.31.0.0/16`).
6. Click **Create security group**.

### 1.2 Create the PostgreSQL Database
1. Open **Amazon RDS Console** → Click **Create database**.
2. Choose database creation method: **Standard create**.
3. **Engine type:** `PostgreSQL` (Version: `PostgreSQL 16.x` or latest).
4. **Templates:** `Production` (or `Free tier` / `Dev/Test` depending on your budget).
5. **Settings:**
   - **DB instance identifier:** `parinaam-db`
   - **Master username:** `postgres`
   - **Master password:** Choose a strong password (e.g. `ParinaamFest2026SecurePass!#`). *Keep this safe!*
6. **Instance configuration:**
   - **DB instance class:** `db.t4g.small` (or `db.t4g.medium` for higher concurrency).
7. **Storage:**
   - **Storage type:** `General Purpose SSD (gp3)`
   - **Allocated storage:** `20 GiB` (Enable Storage autoscaling up to `100 GiB`).
8. **Connectivity:**
   - **Compute resource:** Don't connect to an EC2 instance directly yet.
   - **Virtual private cloud (VPC):** Default VPC.
   - **Public access:** `No` (EC2 will connect privately inside VPC).
   - **VPC security group:** Select `parinaam-rds-sg` (remove `default`).
9. **Additional configuration:**
   - **Initial database name:** `parinaam`
   - **Backup retention period:** `7 days`
10. Click **Create database** (Takes ~5-10 minutes).

> 📌 **Save your RDS Endpoint:** Once status is *Available*, copy the **Endpoint** (e.g. `parinaam-db.c123456789.ap-south-1.rds.amazonaws.com`).

---

## Step 2: Create AWS S3 Bucket & IAM Credentials for Uploads

This bucket stores student ID card proofs, club logos, and event banner posters.

### 2.1 Create S3 Bucket
1. Go to **AWS S3 Console** → Click **Create bucket**.
2. **Bucket name:** `parinaam-uploads-2026` *(must be globally unique)*.
3. **AWS Region:** `ap-south-1 (Asia Pacific - Mumbai)`.
4. **Object Ownership:** `ACLs disabled (recommended)`.
5. **Block Public Access settings:**
   - Uncheck `Block all public access` if you want uploaded event banners to be viewable publicly.
   - Check the acknowledgement box.
6. Click **Create bucket**.

### 2.2 Add Public Read Bucket Policy (for event posters)
Go to bucket → **Permissions** tab → **Bucket policy** → Click **Edit** → Paste:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::parinaam-uploads-2026/*"
    }
  ]
}
```
*(Replace `parinaam-uploads-2026` with your exact bucket name and click Save).*

### 2.3 Create IAM User for Server Uploads
1. Go to **IAM Console** → **Users** → **Create user**.
2. **User name:** `parinaam-s3-uploader`
3. Click **Next** → Select **Attach policies directly** → Search and select `AmazonS3FullAccess` (or create a restricted policy for just this bucket).
4. Click **Create user**.
5. Click into `parinaam-s3-uploader` → Go to **Security credentials** tab → Click **Create access key** → Select **Application running outside AWS**.
6. 💾 **Download / Copy:**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

---

## Step 3: Launch and Configure AWS EC2 Instance

### 3.1 Launch Instance
1. Go to **EC2 Console** (Region: `ap-south-1` Mumbai) → Click **Launch instance**.
2. **Name:** `parinaam-production-server`
3. **AMI:** `Ubuntu Server 24.04 LTS (HVM), SSD Volume Type` (64-bit x86).
4. **Instance type:** `t3.medium` (2 vCPU, 4 GB RAM).
5. **Key pair (login):**
   - Click **Create new key pair**.
   - Name: `parinaam-key` (.pem for Windows OpenSSH / macOS / Linux).
   - Save the downloaded `parinaam-key.pem` to your computer.
6. **Network settings (Security Group):**
   - Create security group: `parinaam-ec2-sg`
   - **Inbound Rules:**
     - `SSH` (Port `22`) → Source: `My IP` (or `0.0.0.0/0`)
     - `HTTP` (Port `80`) → Source: `Anywhere (0.0.0.0/0)`
     - `HTTPS` (Port `443`) → Source: `Anywhere (0.0.0.0/0)`
7. **Configure Storage:** `30 GiB gp3`.
8. Click **Launch instance**.

### 3.2 Allocate an Elastic IP (Static IP)
*(Crucial: ensures your IP never changes on server restarts)*
1. Go to **EC2 Console** → Left menu: **Elastic IPs** → Click **Allocate Elastic IP address**.
2. Region: `ap-south-1` → Click **Allocate**.
3. Select the allocated Elastic IP → Click **Actions** → **Associate Elastic IP address**.
4. **Instance:** Select your `parinaam-production-server` instance.
5. Click **Associate**.
6. 📌 **Copy your Public IPv4 Address** (e.g. `13.234.XX.YY`).

---

## Step 4: Connect Domain DNS (`parinaam.online`)

Log into where you bought `parinaam.online` (e.g., Namecheap, GoDaddy, Hostinger, Cloudflare, or AWS Route 53):

Navigate to **DNS Management / Advanced DNS** for `parinaam.online` and add these two records:

| Type | Host / Name | Value / Target | TTL |
|---|---|---|---|
| **A Record** | `@` | `YOUR_ELASTIC_IP` (e.g. `13.234.XX.YY`) | `Automatic` or `300` |
| **A Record** (or CNAME) | `www` | `YOUR_ELASTIC_IP` (or `parinaam.online`) | `Automatic` or `300` |

*(DNS propagation usually takes 5 to 30 minutes. You can check propagation at [whatsmydns.net/#A/parinaam.online](https://www.whatsmydns.net/#A/parinaam.online)).*

---

## Step 5: Install Runtime Dependencies on EC2

### 5.1 Connect via SSH
Open PowerShell / Terminal on your computer in the folder where `parinaam-key.pem` is saved:

```bash
# On Linux/macOS only:
chmod 400 parinaam-key.pem

# Connect to your EC2 instance (replace with your Elastic IP):
ssh -i "parinaam-key.pem" ubuntu@YOUR_ELASTIC_IP
```

### 5.2 Update System Packages
Run inside your EC2 terminal:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw certbot python3-certbot-nginx postgresql-client nginx
```

### 5.3 Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions:
node -v   # Should output v20.x.x
npm -v    # Should output v10.x.x
```

### 5.4 Install PM2 Globally
```bash
sudo npm install -g pm2
```

### 5.5 Configure Firewall (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

## Step 6: Clone Codebase & Configure Environment

### 6.1 Clone the GitHub Repository
```bash
cd /var/www
# If /var/www does not exist or permissions are restricted:
sudo mkdir -p /var/www
sudo chown -R ubuntu:ubuntu /var/www

cd /var/www
git clone https://github.com/chakravyuha-club/parinaam.git
cd parinaam
```

### 6.2 Create Production Environment File (`.env.production`)
Create and edit the production environment configuration:
```bash
nano .env.production
```

Paste your exact AWS production credentials:
```env
# ============================================================
# PARINAAM 2026 — PRODUCTION CONFIGURATION
# Domain: parinaam.online
# ============================================================

# ─── Database (AWS RDS PostgreSQL) ──────────────────────────
DATABASE_URL=postgresql://postgres:YOUR_RDS_PASSWORD@YOUR_RDS_ENDPOINT:5432/parinaam

# ─── JWT Security (Generate a strong 64-char key) ───────────
JWT_SECRET=c98a3f81e7d238b761a29f8c4e0b12d589a74e621b03c58d74e92a104f6b839e

# ─── Cashfree Payment Gateway (LIVE / Production) ───────────
CASHFREE_APP_ID=1454372309defa4f81be166e22e2734541
CASHFREE_SECRET_KEY=YOUR_CASHFREE_SECRET_KEY
NEXT_PUBLIC_CASHFREE_APP_ID=1454372309defa4f81be166e22e2734541
CASHFREE_MODE=production
NEXT_PUBLIC_CASHFREE_MODE=production

# ─── AWS S3 (ID Card Proofs & Banners) ──────────────────────
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=YOUR_IAM_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_IAM_SECRET_ACCESS_KEY
AWS_S3_BUCKET=parinaam-uploads-2026

# ─── Public Application URLs ────────────────────────────────
NEXT_PUBLIC_APP_URL=https://parinaam.online
NODE_ENV=production
PORT=3000
```
> Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit nano.

Copy this file also as `.env.local` for Next.js build time:
```bash
cp .env.production .env.local
```

---

## Step 7: Initialize Database Schema & Seed Accounts

### 7.1 Test RDS Connectivity
```bash
psql "postgresql://postgres:YOUR_RDS_PASSWORD@YOUR_RDS_ENDPOINT:5432/parinaam" -c "\conninfo"
```
*(If it connects successfully, proceed to the next command).*

### 7.2 Run Schema Migration
Run the complete SQL migration file containing table creation, enum types, indexes, and seeded club data:
```bash
psql "postgresql://postgres:YOUR_RDS_PASSWORD@YOUR_RDS_ENDPOINT:5432/parinaam" -f src/lib/schema.sql
```

### 7.3 Seed Super Admin & 12 Club Admins into PostgreSQL
Run this one-line script to populate the PostgreSQL database with the admin accounts:
```bash
node -e '
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:YOUR_RDS_PASSWORD@YOUR_RDS_ENDPOINT:5432/parinaam"
});

async function seed() {
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!adminPassword) throw new Error("ADMIN_SEED_PASSWORD environment variable required");
  const hash = await bcrypt.hash(adminPassword, 10);
  
  // 1. Seed Super Admin
  await pool.query(`
    INSERT INTO users (email, password_hash, full_name, role, is_amrita_student, verification_status, platform_fee_paid, email_verified)
    VALUES ($1, $2, $3, $4, true, $5, true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $4
  `, ["superadmin@parinaam.fest", hash, "Parinaam Super Admin", "super_admin", "verified"]);
  console.log("✓ Super Admin Seeded: superadmin@parinaam.fest");

  // 2. Fetch clubs to link club admins
  const clubs = await pool.query("SELECT id, name, slug FROM clubs");
  for (const c of clubs.rows) {
    const adminEmail = `admin.${c.slug}@parinaam.fest`;
    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, club_id, is_amrita_student, verification_status, platform_fee_paid, email_verified)
      VALUES ($1, $2, $3, $4, $5, true, $6, true, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $4, club_id = $5
    `, [adminEmail, hash, `${c.name} Admin`, "club_admin", c.id, "verified"]);
    console.log(`✓ Club Admin Seeded: ${adminEmail} -> /admin/${c.slug}`);
  }

  await pool.end();
}
seed().catch(console.error);
'
```

---

## Step 8: Build and Run Application with PM2

### 8.1 Install Dependencies & Build Next.js Production Bundle
```bash
cd /var/www/parinaam
npm install --production=false
npm run build
```
*(Verify output ends with `✓ Compiled successfully` and generates static/server routes).*

### 8.2 Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```
Paste:
```javascript
module.exports = {
  apps: [
    {
      name: "parinaam-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/parinaam",
      instances: "max",       // Uses all available CPU cores (cluster mode)
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "1G",
      restart_delay: 4000,
    },
  ],
};
```

### 8.3 Start PM2 and Enable Auto-Start on System Boot
```bash
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Check process status:
```bash
pm2 status
# Test local HTTP response:
curl http://localhost:3000
```

---

## Step 9: Configure Nginx Reverse Proxy

### 9.1 Create Nginx Site Configuration
```bash
sudo nano /etc/nginx/sites-available/parinaam.online
```

Paste the production-optimized Nginx config:
```nginx
# Upstream Next.js application
upstream nextjs_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name parinaam.online www.parinaam.online;

    # Client body size for ID card and poster uploads (up to 25MB)
    client_max_body_size 25M;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip Compression
    gzip on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Next.js Static Cache Optimization
    location /_next/static {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        expires 365d;
        access_log off;
    }

    # Public static files
    location /images/ {
        proxy_pass http://nextjs_upstream;
        expires 30d;
        access_log off;
    }

    # Main Application Proxy
    location / {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

### 9.2 Enable Site & Test Nginx
```bash
sudo ln -sf /etc/nginx/sites-available/parinaam.online /etc/nginx/sites-enabled/
# Remove default nginx welcome page:
sudo rm -f /etc/nginx/sites-enabled/default

# Test syntax:
sudo nginx -t
# Should output: nginx: configuration file /etc/nginx/nginx.conf test is successful

sudo systemctl restart nginx
```

---

## Step 10: Install Let's Encrypt SSL Certificate

Make sure your DNS A-records for `parinaam.online` and `www.parinaam.online` are pointing to your EC2 Elastic IP before running this step.

Run Certbot:
```bash
sudo certbot --nginx -d parinaam.online -d www.parinaam.online --non-interactive --agree-tos -m admin@parinaam.online --redirect
```

Certbot will:
1. Validate your domain ownership with Let's Encrypt.
2. Obtain a 2048-bit SSL certificate.
3. Automatically update your Nginx config with SSL directives and automatic HTTP-to-HTTPS redirection.

### Test Auto-Renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 11: Configure Cashfree Production Webhooks

1. Log into your [Cashfree Merchant Dashboard](https://merchant.cashfree.com/merchants/login).
2. Ensure you are on the **Production / Live** environment.
3. Go to **Payment Gateway** → **Developers** → **Webhooks** → Click **Add Webhook Endpoint**.
4. **Endpoint URL:** `https://parinaam.online/api/payments/verify`
5. **API Version:** `2023-08-01`
6. **Active Events:**
   - `PAYMENT_SUCCESS_WEBHOOK`
   - `PAYMENT_FAILED_WEBHOOK`
   - `ORDER_PAID`
7. Click **Test & Save Endpoint**.

---

## Step 12: Zero-Downtime Deployment Script & Maintenance

Whenever you push new updates to GitHub `main`, update your server seamlessly:

Create an update script on your EC2 server:
```bash
nano /var/www/parinaam/deploy.sh
```

Paste:
```bash
#!/bin/bash
set -e

echo "🚀 Starting Parinaam 2026 Zero-Downtime Deployment..."
cd /var/www/parinaam

echo "📥 Pulling latest code from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --production=false

echo "🔨 Building Next.js application..."
npm run build

echo "🔄 Reloading PM2 cluster with zero downtime..."
pm2 reload parinaam-web --update-env

echo "✅ Deployment completed successfully!"
```

Make it executable:
```bash
chmod +x /var/www/parinaam/deploy.sh
```

Now, whenever you want to deploy an update, just connect to EC2 and run:
```bash
/var/www/parinaam/deploy.sh
```

---

## Troubleshooting & Verification Checklist

| Check | How to Verify | Expected Result |
|---|---|---|
| **HTTPS Web Access** | Visit `https://parinaam.online` | Loads hero page with SSL padlock 🔒 |
| **Super Admin Login** | Visit `https://parinaam.online/superadmin` | Log in with `superadmin@parinaam.fest` / `[Rotated Credential]` |
| **Club Admin Portal** | Visit `https://parinaam.online/admin/chakravyuha` | Log in with `admin.chakravyuha@parinaam.fest` / `[Rotated Credential]` |
| **Database Connectivity** | Run `psql $DATABASE_URL -c "SELECT count(*) FROM clubs;"` | Returns `12` |
| **Server Health** | Run `pm2 status` | All cluster instances show `online` status |
| **Nginx Access Logs** | `sudo tail -f /var/log/nginx/access.log` | Displays real-time requests with status `200` |
| **PM2 Error Logs** | `pm2 logs parinaam-web --lines 50` | No unhandled runtime exceptions |

---

🎉 **Your Parinaam 2026 Techfest Platform is now fully deployed and live at [https://parinaam.online](https://parinaam.online)!**
