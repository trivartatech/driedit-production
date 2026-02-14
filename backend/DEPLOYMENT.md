# DRIEDIT Production Deployment Checklist

## Pre-Deployment

### Environment Configuration
- [ ] Set `ENVIRONMENT=production` in backend/.env
- [ ] Update `CORS_ORIGINS` to production domains only
- [ ] Replace Razorpay test keys with production keys
- [ ] Verify Resend API key and sender domain

### Security Checklist
| Item | Status | Notes |
|------|--------|-------|
| HTTPS Enforced | ✅ Implemented | Middleware redirects HTTP to HTTPS in production |
| Secure Cookies | ✅ Implemented | `secure=true`, `httponly=true`, `samesite=strict` in production |
| Security Headers | ✅ Implemented | HSTS, X-Frame-Options, X-Content-Type-Options, XSS Protection |
| Rate Limiting | ✅ Implemented | Login: 5 requests/15min |
| API Docs Disabled | ✅ Implemented | Swagger/ReDoc disabled in production |
| Password Hashing | ✅ Implemented | bcrypt with salt |
| Session Management | ✅ Implemented | 7-day expiry, DB-backed sessions |

### Database
- [ ] Set up production MongoDB (Atlas/self-hosted)
- [ ] Enable authentication
- [ ] Configure connection pooling
- [ ] Set up replica set for high availability

### Backups
| Type | Script | Schedule | Retention |
|------|--------|----------|-----------|
| MongoDB | `/app/backend/scripts/backup_db.sh` | Daily 2 AM | 7 days |
| Uploads | `/app/backend/scripts/backup_uploads.sh` | Daily 3 AM | 30 days |

To enable backups:
```bash
cd /app/backend/scripts
chmod +x setup_cron.sh
./setup_cron.sh
```

### Logging
| Log Type | Location | Rotation |
|----------|----------|----------|
| Access Logs | `/app/backend/logs/access.log` | 10MB, 5 backups |
| Error Logs | `/app/backend/logs/error.log` | 10MB, 5 backups |
| Supervisor | `/var/log/supervisor/backend.*.log` | System managed |

---

## Deployment Steps

### 1. Update Environment Variables
```bash
# backend/.env
ENVIRONMENT=production
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net
DB_NAME=driedit_production
CORS_ORIGINS=https://driedit.in,https://www.driedit.in
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RESEND_API_KEY=re_xxxxx
SENDER_EMAIL=noreply@driedit.in
```

### 2. Install Dependencies
```bash
cd /app/backend
pip install -r requirements.txt

cd /app/frontend
yarn install --production
yarn build
```

### 3. Setup Backups
```bash
cd /app/backend/scripts
./setup_cron.sh
```

### 4. Configure Reverse Proxy (Nginx/Caddy)
Ensure proxy passes these headers:
- `X-Forwarded-Proto`
- `X-Forwarded-For`
- `X-Real-IP`

### 5. SSL Certificate
- Use Let's Encrypt or cloud provider SSL
- Ensure auto-renewal is configured

### 6. Start Services
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

---

## Post-Deployment Verification

- [ ] Test HTTPS redirect (access http:// → should redirect to https://)
- [ ] Test login flow with secure cookies
- [ ] Test Razorpay payment (use test card first)
- [ ] Verify emails are being sent
- [ ] Check error logs for any issues
- [ ] Run backup script manually to verify

---

## Monitoring Recommendations

1. **Uptime Monitoring**: UptimeRobot, Pingdom, or BetterUptime
2. **Error Tracking**: Sentry integration (optional)
3. **Log Aggregation**: CloudWatch, Datadog, or ELK stack
4. **Performance**: New Relic or custom metrics

---

## Emergency Procedures

### Database Restore
```bash
# Extract backup
tar -xzf driedit_backup_YYYYMMDD_HHMMSS.tar.gz

# Restore
mongorestore --uri="$MONGO_URL" --db="$DB_NAME" ./driedit_backup_YYYYMMDD_HHMMSS/
```

### Uploads Restore
```bash
tar -xzf uploads_backup_YYYYMMDD_HHMMSS.tar.gz -C /app/backend/
```

### Rollback
Use Emergent's rollback feature to revert to a previous checkpoint.

---

*Last Updated: 2026-02-14*
