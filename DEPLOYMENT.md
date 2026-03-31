# Deployment Guide - Field Maintenance Manager

Quick deployment and operational instructions for the Field Maintenance Manager system.

## Prerequisites

- **Node.js**: Version 14 or higher
- **npm**: Included with Node.js
- **Modern browser**: Chrome, Firefox, Safari, or Edge (2020+)
- **Disk space**: ~50MB for database and application files

## One-Command Setup

```bash
# From /workspace directory
cd backend && npm install && npm start
```

Then open `index.html` in your browser or serve via:
```bash
npx http-server .. -p 8080
```

Access: `http://localhost:8080`

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd /workspace/backend
npm install
```

**Expected output:**
```
added XX packages in X.XXs
```

### 2. Start the API Server
```bash
npm start
```

**Expected output:**
```
Field Maintenance Manager API running on http://localhost:3000
Database: maintenance.db
```

### 3. Verify Backend is Running
```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{"status":"OK","timestamp":"2024-XX-XXTXX:XX:XX.XXXZ"}
```

### 4. Serve the Frontend

Option A: Using Python (if available)
```bash
cd /workspace
python3 -m http.server 8080
```

Option B: Using Node http-server
```bash
cd /workspace
npx http-server . -p 8080
```

Option C: Direct file access
```bash
# Open in browser directly
file:///workspace/index.html
```

### 5. Access the Application
- **Local Access**: `http://localhost:8080`
- **File Access**: `file:///workspace/index.html`
- **API Base**: `http://localhost:3000/api`

## Production Deployment

### Option 1: CreateOS Deployment

```bash
cd /workspace
createos deploy --name field-maintenance-manager
```

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy application files
COPY . .

EXPOSE 3000 8080

# Start backend
CMD ["node", "backend/server.js"]
```

Build and run:
```bash
docker build -t field-maintenance-manager .
docker run -p 3000:3000 -p 8080:8080 field-maintenance-manager
```

### Option 3: Heroku Deployment

Create `Procfile`:
```
web: node backend/server.js
```

Deploy:
```bash
heroku create field-maintenance-manager
git push heroku main
```

### Option 4: AWS/Azure App Service

1. Push to GitHub repository
2. Connect repository to deployment platform
3. Set environment variables if needed
4. Deploy automatically on push

## Environment Configuration

### Backend Environment Variables

Create `.env` file in `/workspace/backend/`:

```bash
# Port configuration
PORT=3000

# Database path
DATABASE_URL=./maintenance.db

# CORS settings
CORS_ORIGIN=http://localhost:8080

# Node environment
NODE_ENV=production
```

### Frontend Configuration

Edit configuration in `index.html` (line ~600):

```javascript
const API_URL = 'http://localhost:3000/api';
// Change to production URL when deployed
```

## Data Management

### Backup Database

```bash
# SQLite database backup
cp backend/maintenance.db backend/maintenance.backup.db

# Export to JSON
curl http://localhost:3000/api/reports/export \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"format":"json"}' > backup.json
```

### Restore Database

```bash
# Restore from backup
cp backend/maintenance.backup.db backend/maintenance.db

# Restart backend
npm start
```

### Data Export

Access reports endpoint:
```bash
# Monthly report
curl http://localhost:3000/api/reports/monthly

# Equipment status
curl http://localhost:3000/api/reports/equipment-status

# Technician activity
curl http://localhost:3000/api/reports/technician-activity

# Full data export
curl -X POST http://localhost:3000/api/reports/export \
  -H "Content-Type: application/json" \
  -d '{"format":"json"}'
```

## Scaling & Performance

### Single Server Setup
- Suitable for: 1-100 technicians, 50-500 equipment units
- Requirements: 512MB RAM, 1GB storage
- Expected load: ~50 concurrent users

### Load Balancing (Multiple Servers)

Use nginx as reverse proxy:

```nginx
upstream maintenance_api {
    server backend1.local:3000;
    server backend2.local:3000;
    server backend3.local:3000;
}

server {
    listen 80;
    server_name maintenance.company.com;

    location /api {
        proxy_pass http://maintenance_api;
        proxy_set_header Host $host;
    }

    location / {
        root /var/www/html;
        try_files $uri /index.html;
    }
}
```

### Database Optimization

For large deployments (1000+ equipment):

```bash
# Run SQLite maintenance
cd backend
sqlite3 maintenance.db "VACUUM;"
sqlite3 maintenance.db "ANALYZE;"
```

## Monitoring & Maintenance

### Health Check

```bash
# Endpoint health
curl -f http://localhost:3000/api/health

# Database connectivity
curl http://localhost:3000/api/equipment
```

### Logs Management

Backend logs (stdout):
```bash
# View with timestamps
npm start | while IFS= read -r line; do echo "$(date '+%Y-%m-%d %H:%M:%S') $line"; done

# Save to file
npm start > logs/server.log 2>&1
```

### Scheduled Backups

Linux cron job:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cp /path/to/backend/maintenance.db /path/to/backups/maintenance.db.$(date +\%Y\%m\%d)
```

Windows Task Scheduler:
```powershell
# PowerShell backup script
$source = "C:\field-maintenance\backend\maintenance.db"
$dest = "C:\backups\maintenance.db.$(Get-Date -Format 'yyyyMMdd')"
Copy-Item -Path $source -Destination $dest
```

## Troubleshooting Deployment

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000
# Or on Windows
netstat -ano | findstr :3000

# Kill process (Unix)
kill -9 <PID>
# Or on Windows
taskkill /PID <PID> /F

# Use different port
PORT=3001 npm start
```

### Database Lock

```bash
# SQLite database is locked
# Solution: Ensure only one backend instance running
# Check for stale processes
ps aux | grep node

# Restart backend
npm stop
npm start
```

### CORS Errors

Update frontend API_URL:
```javascript
// In index.html around line 600
const API_URL = 'http://your-backend-domain:3000/api';
```

Update backend CORS:
```javascript
// In backend/server.js around line 11
app.use(cors({
    origin: 'http://your-frontend-domain:8080'
}));
```

### Memory Issues

Monitor with:
```bash
# Watch memory usage
watch -n 1 'ps aux | grep node'

# Or use PM2 with memory limits
npm install -g pm2
pm2 start backend/server.js --max-memory-restart 500M
```

## Security Considerations

### For Production Deployment

1. **Enable HTTPS**
   ```bash
   # Use Let's Encrypt with nginx
   sudo certbot certonly --nginx -d maintenance.company.com
   ```

2. **Add Authentication**
   ```javascript
   // Backend: Add JWT middleware
   app.use(authenticateToken);
   ```

3. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

4. **Input Validation**
   ```bash
   npm install joi express-validator
   ```

5. **Environment Secrets**
   ```bash
   # Use .env file (never commit)
   npm install dotenv
   ```

6. **Database Encryption**
   ```bash
   # SQLite encryption
   npm install better-sqlite3-sqlcipher
   ```

## Operational Commands

### Common Tasks

```bash
# Start backend
cd /workspace/backend && npm start

# Start frontend (separate terminal)
cd /workspace && npx http-server . -p 8080

# Stop servers
# Press Ctrl+C in terminal windows

# View recent logs
tail -f logs/server.log

# Test API
curl http://localhost:3000/api/equipment

# Export data
curl -X POST http://localhost:3000/api/reports/export \
  -H "Content-Type: application/json" \
  -d '{"format":"json"}' > export_$(date +%Y%m%d).json
```

## Migration from Legacy System

If migrating from another maintenance system:

1. **Export legacy data** to CSV format
2. **Transform data** to match our schema
3. **Import via API** or direct database insert
4. **Verify data integrity** in reports
5. **Train staff** on new interface

Example Python migration script:
```python
import json
import requests

# Read legacy CSV
equipment_data = read_legacy_csv('equipment.csv')

# Transform and upload
for item in equipment_data:
    payload = {
        'name': item['equipment_name'],
        'type': item['equipment_type'],
        'location': item['location'],
        'scheduleInterval': 30,
        'priority': item['priority']
    }
    requests.post('http://localhost:3000/api/equipment', json=payload)
```

## Support

For deployment issues:
- Check API health: `curl http://localhost:3000/api/health`
- Review backend logs for errors
- Verify database file permissions
- Ensure ports 3000 and 8080 are available
- Test CORS with browser developer tools

---

**Last Updated**: 2024  
**Version**: 1.0.0