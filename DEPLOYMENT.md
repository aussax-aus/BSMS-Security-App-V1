# Deployment Guide

## Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0 (or MongoDB Atlas account)
- npm >= 9.0.0
- Domain name (for production)
- SSL certificate (for production)

## Environment Setup

### Development

1. **Install MongoDB locally:**
   ```bash
   # macOS with Homebrew
   brew install mongodb-community
   brew services start mongodb-community
   
   # Ubuntu/Debian
   sudo apt-get install mongodb
   sudo systemctl start mongodb
   
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Clone and setup:**
   ```bash
   git clone https://github.com/aussax-aus/BSMS-Security-App-V1.git
   cd BSMS-Security-App-V1
   npm install
   cd packages/backend
   npm install
   ```

3. **Configure environment:**
   ```bash
   cd packages/backend
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Production

#### Option 1: Traditional Server (VPS/Dedicated)

1. **Server Setup (Ubuntu 22.04):**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   
   # Install Nginx
   sudo apt install nginx -y
   
   # Install PM2 (Process Manager)
   sudo npm install -g pm2
   ```

2. **Deploy Application:**
   ```bash
   # Clone repository
   cd /var/www
   sudo git clone https://github.com/aussax-aus/BSMS-Security-App-V1.git
   cd BSMS-Security-App-V1
   
   # Install dependencies
   sudo npm install
   cd packages/backend
   sudo npm install
   
   # Configure environment
   sudo cp .env.example .env
   sudo nano .env
   # Set production values:
   # - NODE_ENV=production
   # - MONGODB_URI=mongodb://localhost:27017/bsms_security
   # - JWT_SECRET=<strong-random-secret>
   # - EMAIL credentials
   ```

3. **Setup PM2:**
   ```bash
   cd /var/www/BSMS-Security-App-V1/packages/backend
   
   # Start with PM2
   pm2 start src/index.js --name bsms-backend
   
   # Save PM2 configuration
   pm2 save
   
   # Setup PM2 to start on boot
   pm2 startup
   # Follow the command output instructions
   ```

4. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/bsms
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       # WebSocket support for Socket.IO
       location /socket.io/ {
           proxy_pass http://localhost:5000/socket.io/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```
   
   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/bsms /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Setup SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d api.yourdomain.com
   ```

6. **Configure Firewall:**
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw allow 22
   sudo ufw enable
   ```

#### Option 2: MongoDB Atlas (Cloud Database)

1. **Create MongoDB Atlas Cluster:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Set up database user
   - Whitelist your server IP (or 0.0.0.0/0 for testing)
   - Get connection string

2. **Update .env:**
   ```bash
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/bsms_security?retryWrites=true&w=majority
   ```

#### Option 3: Docker Deployment

1. **Create Dockerfile:**
   ```dockerfile
   # packages/backend/Dockerfile
   FROM node:20-alpine
   
   WORKDIR /app
   
   # Copy package files
   COPY package*.json ./
   RUN npm ci --only=production
   
   # Copy source code
   COPY . .
   
   # Expose port
   EXPOSE 5000
   
   # Start application
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   
   services:
     mongodb:
       image: mongo:7.0
       container_name: bsms-mongodb
       restart: always
       environment:
         MONGO_INITDB_ROOT_USERNAME: admin
         MONGO_INITDB_ROOT_PASSWORD: changeme
       volumes:
         - mongodb_data:/data/db
       ports:
         - "27017:27017"
     
     backend:
       build:
         context: ./packages/backend
         dockerfile: Dockerfile
       container_name: bsms-backend
       restart: always
       environment:
         NODE_ENV: production
         PORT: 5000
         MONGODB_URI: mongodb://admin:changeme@mongodb:27017/bsms_security?authSource=admin
         JWT_SECRET: ${JWT_SECRET}
       ports:
         - "5000:5000"
       depends_on:
         - mongodb
       volumes:
         - ./packages/backend/uploads:/app/uploads
   
   volumes:
     mongodb_data:
   ```

3. **Deploy with Docker Compose:**
   ```bash
   # Create .env file
   echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
   
   # Build and start
   docker-compose up -d
   
   # View logs
   docker-compose logs -f backend
   ```

#### Option 4: Heroku

1. **Install Heroku CLI:**
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   heroku login
   ```

2. **Create Heroku App:**
   ```bash
   cd packages/backend
   heroku create bsms-security-api
   
   # Add MongoDB addon
   heroku addons:create mongolab:sandbox
   
   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=$(openssl rand -hex 32)
   ```

3. **Create Procfile:**
   ```bash
   echo "web: node src/index.js" > Procfile
   ```

4. **Deploy:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a bsms-security-api
   git push heroku main
   ```

#### Option 5: AWS (EC2 + RDS)

1. **Launch EC2 Instance:**
   - Choose Ubuntu 22.04 LTS
   - t2.medium or larger
   - Security group: Allow ports 22, 80, 443

2. **Launch MongoDB on Amazon DocumentDB** or **MongoDB Atlas**

3. **Follow "Traditional Server" deployment steps** on EC2

4. **Use Amazon S3 for file uploads:**
   ```bash
   npm install aws-sdk
   ```
   
   Update upload configuration to use S3 instead of local storage.

## Monitoring & Maintenance

### PM2 Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs bsms-backend

# Restart application
pm2 restart bsms-backend

# Stop application
pm2 stop bsms-backend

# Monitor in real-time
pm2 monit

# Delete from PM2
pm2 delete bsms-backend
```

### Database Backup

```bash
# Backup MongoDB
mongodump --db bsms_security --out /backups/$(date +%Y%m%d)

# Restore MongoDB
mongorestore --db bsms_security /backups/20250115/bsms_security

# Automated backup script
cat > /usr/local/bin/backup-bsms.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mongodump --db bsms_security --out $BACKUP_DIR/$DATE
# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
EOF

chmod +x /usr/local/bin/backup-bsms.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-bsms.sh
```

### Log Rotation

```bash
sudo nano /etc/logrotate.d/bsms

# Add:
/var/www/BSMS-Security-App-V1/packages/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
}
```

### Health Checks

1. **Setup monitoring:**
   ```bash
   # Install monitoring tools
   npm install -g pm2-monitoring
   
   # Or use external services:
   # - UptimeRobot (https://uptimerobot.com)
   # - Pingdom (https://www.pingdom.com)
   # - New Relic (https://newrelic.com)
   ```

2. **Health endpoint:**
   ```bash
   curl http://localhost:5000/health
   ```

### Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure firewall properly:**
   ```bash
   sudo ufw status
   # Only allow necessary ports
   ```

3. **Use strong JWT secret:**
   ```bash
   openssl rand -hex 32
   ```

4. **Enable MongoDB authentication:**
   ```bash
   sudo nano /etc/mongod.conf
   # Add:
   # security:
   #   authorization: enabled
   ```

5. **Regular security audits:**
   ```bash
   npm audit
   npm audit fix
   ```

6. **Setup fail2ban:**
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   ```

### Performance Optimization

1. **Enable MongoDB indexes:**
   - Indexes are defined in models
   - MongoDB will create them automatically

2. **Enable Nginx caching:**
   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;
   
   location /api/ {
       proxy_cache api_cache;
       proxy_cache_valid 200 60m;
       # ... rest of proxy config
   }
   ```

3. **Use PM2 cluster mode:**
   ```bash
   pm2 start src/index.js -i max --name bsms-backend
   ```

## Rollback Procedure

```bash
# Stop the application
pm2 stop bsms-backend

# Go to previous version
cd /var/www/BSMS-Security-App-V1
git log --oneline -10  # Find commit to rollback to
git checkout <commit-hash>

# Reinstall dependencies
cd packages/backend
npm install

# Restart
pm2 restart bsms-backend
```

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs bsms-backend

# Check MongoDB connection
mongo --eval "db.adminCommand('ping')"

# Check port availability
sudo netstat -tlnp | grep 5000
```

### Database connection issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongo mongodb://localhost:27017/bsms_security
```

### High memory usage
```bash
# Check memory
pm2 monit

# Increase server resources or optimize code
# Check for memory leaks
```

## Support

For deployment issues, contact the development team or create an issue on GitHub.
