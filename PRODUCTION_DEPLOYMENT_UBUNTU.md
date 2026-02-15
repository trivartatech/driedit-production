# DRIEDIT Production Deployment Guide
## Ubuntu 24.04 + CloudPanel VPS

---

## Prerequisites

- Ubuntu 24.04 VPS with CloudPanel installed
- Domain: `driedit.in` pointed to your server IP
- SSH access with root/sudo privileges
- MongoDB Atlas account (recommended) OR local MongoDB

---

## Step 1: Server Preparation

### 1.1 Connect to your server
```bash
ssh root@your-server-ip
```

### 1.2 Update system
```bash
apt update && apt upgrade -y
```

### 1.3 Install required packages
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Python 3.11+ and pip
apt install -y python3 python3-pip python3-venv

# Install additional dependencies
apt install -y git nginx certbot python3-certbot-nginx supervisor

# Verify installations
node --version  # Should be v20.x
python3 --version  # Should be 3.11+
```

### 1.4 Install Yarn (for frontend)
```bash
npm install -g yarn
```

---

## Step 2: MongoDB Setup

### Option A: MongoDB Atlas (Recommended for Production)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster named `driedit-production`
3. Create database user with read/write access
4. Whitelist your server IP (or use 0.0.0.0/0 for all IPs)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/driedit_production
   ```

### Option B: Local MongoDB

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

# Verify MongoDB is running
systemctl status mongod
```

---

## Step 3: Application Setup

### 3.1 Create application directory
```bash
mkdir -p /var/www/driedit
cd /var/www/driedit
```

### 3.2 Clone or upload your code

**Option A: From Git (if you saved to GitHub)**
```bash
git clone https://github.com/yourusername/driedit.git .
```

**Option B: Upload via SCP**
```bash
# From your local machine:
scp -r /path/to/driedit/* root@your-server-ip:/var/www/driedit/
```

**Option C: Download from Emergent**
Use the "Download Code" option in Emergent to get a zip file, then:
```bash
# Upload and extract
unzip driedit.zip -d /var/www/driedit/
```

### 3.3 Set permissions
```bash
chown -R www-data:www-data /var/www/driedit
chmod -R 755 /var/www/driedit
```

---

## Step 4: Backend Setup

### 4.1 Create Python virtual environment
```bash
cd /var/www/driedit/backend
python3 -m venv venv
source venv/bin/activate
```

### 4.2 Install Python dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4.3 Configure environment variables
```bash
nano /var/www/driedit/backend/.env
```

**Production .env file:**
```env
# Database
MONGO_URL=mongodb+srv://username:password@cluster.xxxxx.mongodb.net
DB_NAME=driedit_production

# Environment
ENVIRONMENT=production
CORS_ORIGINS=https://driedit.in,https://www.driedit.in

# Razorpay (LIVE)
RAZORPAY_KEY_ID=rzp_live_SGKZZJQmDAckS7
RAZORPAY_KEY_SECRET=UDJvcgbcrct1A3M9ogmjX7Vu

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key
SENDER_EMAIL=noreply@driedit.in

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://driedit.in/api/auth/google/callback
```

### 4.4 Test backend
```bash
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
# Press Ctrl+C after confirming it works
```

---

## Step 5: Frontend Setup

### 5.1 Install dependencies
```bash
cd /var/www/driedit/frontend
yarn install
```

### 5.2 Configure environment
```bash
nano /var/www/driedit/frontend/.env
```

**Production frontend .env:**
```env
REACT_APP_BACKEND_URL=https://driedit.in
```

### 5.3 Build production bundle
```bash
yarn build
```

This creates a `build/` folder with optimized static files.

---

## Step 6: Process Management (Supervisor)

### 6.1 Create backend supervisor config
```bash
nano /etc/supervisor/conf.d/driedit-backend.conf
```

```ini
[program:driedit-backend]
directory=/var/www/driedit/backend
command=/var/www/driedit/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001 --workers 4
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/driedit/backend.err.log
stdout_logfile=/var/log/driedit/backend.out.log
environment=PATH="/var/www/driedit/backend/venv/bin"
```

### 6.2 Create log directory
```bash
mkdir -p /var/log/driedit
chown www-data:www-data /var/log/driedit
```

### 6.3 Start supervisor
```bash
supervisorctl reread
supervisorctl update
supervisorctl start driedit-backend
supervisorctl status
```

---

## Step 7: Nginx Configuration (with CloudPanel)

### Option A: Using CloudPanel UI

1. Login to CloudPanel
2. Go to **Sites** → **Add Site**
3. Select **Node.js** or **Static Site**
4. Domain: `driedit.in`
5. After creating, SSH and modify the Nginx config

### Option B: Manual Nginx Config

```bash
nano /etc/nginx/sites-available/driedit.in
```

```nginx
server {
    listen 80;
    server_name driedit.in www.driedit.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name driedit.in www.driedit.in;

    # SSL certificates (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/driedit.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/driedit.in/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Frontend (React build)
    root /var/www/driedit/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Serve uploaded files
    location /uploads/ {
        alias /var/www/driedit/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # React SPA - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 7.1 Enable site
```bash
ln -s /etc/nginx/sites-available/driedit.in /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl reload nginx
```

---

## Step 8: SSL Certificate (Let's Encrypt)

```bash
# Install SSL certificate
certbot --nginx -d driedit.in -d www.driedit.in

# Auto-renewal test
certbot renew --dry-run
```

---

## Step 9: Database Seeding

```bash
cd /var/www/driedit/backend
source venv/bin/activate

# Run seed script
python seed_database.py

# Create admin user (if not in seed)
python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import bcrypt
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('.env')

async def create_admin():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME')]
    
    # Check if admin exists
    existing = await db.users.find_one({"email": "admin@driedit.in"})
    if existing:
        print("Admin already exists")
        return
    
    password = "your_secure_admin_password"  # CHANGE THIS!
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    admin_user = {
        "user_id": "admin_001",
        "email": "admin@driedit.in",
        "name": "Admin",
        "password": hashed,
        "auth_provider": "email",
        "role": "admin",
        "is_verified": True,
        "wishlist": [],
        "addresses": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(admin_user)
    print("Admin created successfully!")
    client.close()

asyncio.run(create_admin())
EOF
```

---

## Step 10: Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

---

## Step 11: Final Verification

### 11.1 Check all services
```bash
# Backend
supervisorctl status driedit-backend

# Nginx
systemctl status nginx

# MongoDB (if local)
systemctl status mongod
```

### 11.2 Test endpoints
```bash
# Health check
curl https://driedit.in/api/health

# Products API
curl https://driedit.in/api/products

# Payment config
curl https://driedit.in/api/orders/payment-config
```

### 11.3 Test login
```bash
curl -X POST https://driedit.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@driedit.in","password":"your_secure_admin_password"}'
```

---

## Maintenance Commands

### Restart backend
```bash
supervisorctl restart driedit-backend
```

### View logs
```bash
# Backend logs
tail -f /var/log/driedit/backend.err.log
tail -f /var/log/driedit/backend.out.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Update code
```bash
cd /var/www/driedit
git pull origin main  # or upload new files

# Rebuild frontend
cd frontend
yarn install
yarn build

# Restart backend
supervisorctl restart driedit-backend
```

### Backup database
```bash
# MongoDB Atlas - use Atlas UI for backups
# Local MongoDB:
mongodump --uri="mongodb://localhost:27017" --db=driedit_production --out=/var/backups/mongodb/$(date +%Y%m%d)
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
tail -100 /var/log/driedit/backend.err.log

# Test manually
cd /var/www/driedit/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

### 502 Bad Gateway
```bash
# Check if backend is running
supervisorctl status driedit-backend

# Check Nginx config
nginx -t

# Restart services
supervisorctl restart driedit-backend
systemctl restart nginx
```

### SSL issues
```bash
# Renew certificate
certbot renew

# Check certificate
certbot certificates
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong MongoDB password
- [ ] Keep Razorpay secret keys secure
- [ ] Enable firewall (ufw)
- [ ] Regular security updates: `apt update && apt upgrade`
- [ ] Set up fail2ban for SSH protection
- [ ] Regular database backups
- [ ] Monitor error logs

---

## CloudPanel Specific Notes

If using CloudPanel's built-in site management:

1. Create site as "Reverse Proxy" or "Static Site"
2. Point domain to CloudPanel
3. Use CloudPanel's SSL feature or manual certbot
4. Modify Nginx vhost file at: `/etc/nginx/sites-enabled/driedit.in.conf`

---

*Last Updated: February 2026*
*For support: Check Emergent platform or contact trivarta.tech@gmail.com*
