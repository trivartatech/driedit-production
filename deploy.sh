#!/bin/bash
# DRIEDIT Quick Deployment Script for Ubuntu 24.04 + CloudPanel
# Run as root: bash deploy.sh

set -e

echo "🚀 DRIEDIT Deployment Script"
echo "============================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Check if root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Variables - EDIT THESE
DOMAIN="driedit.in"
APP_DIR="/var/www/driedit"
MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net"  # CHANGE THIS
DB_NAME="driedit_production"

echo ""
echo "Step 1: Installing dependencies..."
apt update
apt install -y python3 python3-pip python3-venv nginx supervisor

# Install Node.js 20.x
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

npm install -g yarn

echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo "Step 2: Setting up application..."
mkdir -p $APP_DIR
mkdir -p /var/log/driedit

echo ""
echo "Step 3: Setting up Python environment..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo -e "${GREEN}✓ Backend setup complete${NC}"

echo ""
echo "Step 4: Building frontend..."
cd $APP_DIR/frontend
yarn install
yarn build

echo -e "${GREEN}✓ Frontend built${NC}"

echo ""
echo "Step 5: Configuring supervisor..."
cat > /etc/supervisor/conf.d/driedit-backend.conf << EOF
[program:driedit-backend]
directory=$APP_DIR/backend
command=$APP_DIR/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001 --workers 4
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/driedit/backend.err.log
stdout_logfile=/var/log/driedit/backend.out.log
environment=PATH="$APP_DIR/backend/venv/bin"
EOF

supervisorctl reread
supervisorctl update
supervisorctl start driedit-backend

echo -e "${GREEN}✓ Backend service started${NC}"

echo ""
echo "Step 6: Configuring Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/frontend/build;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /uploads/ {
        alias $APP_DIR/backend/uploads/;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

echo ""
echo "Step 7: Setting permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

echo ""
echo "============================================"
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Update $APP_DIR/backend/.env with your credentials"
echo "2. Run: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Seed database: cd $APP_DIR/backend && source venv/bin/activate && python seed_database.py"
echo "4. Test: curl http://$DOMAIN/api/health"
echo ""
