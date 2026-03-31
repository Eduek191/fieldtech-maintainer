# Configuration Reference

Customize the Field Maintenance Manager for your specific needs.

## Frontend Configuration

Edit settings in `index.html` (search for these sections):

### API Configuration

Around **line 600**:
```javascript
const API_URL = 'http://localhost:3000/api';
// Change to your production API endpoint
// Example: 'https://maintenance-api.company.com/api'
```

### UI Customization

#### Colors & Theme

In `<style>` section (lines 11-500):

```css
/* Primary gradient color */
.header {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    /* Change these hex colors to match your brand */
}

/* Button colors */
.btn-primary {
    background: linear-gradient(135deg, #2a5298 0%, #1e90ff 100%);
}

/* Status colors */
.status-active {
    background: #d4edda;  /* Green for active */
    color: #155724;
}

.status-attention {
    background: #fff3cd;  /* Yellow for attention */
    color: #856404;
}

.status-critical {
    background: #f8d7da;  /* Red for critical */
    color: #721c24;
}
```

#### Equipment Types

Modify the dropdown in `addEquipmentModal` (around line 880):

```html
<select id="equipmentType" required>
    <option value="">Select type...</option>
    <option value="Pump">Pump</option>
    <option value="Compressor">Compressor</option>
    <option value="Separator">Separator</option>
    <option value="Wellhead">Wellhead</option>
    <!-- Add your custom types here -->
    <option value="CustomType">Custom Type</option>
</select>
```

#### Maintenance Types

Modify the Quick Log form (around line 920):

```html
<select id="quickLogType" required>
    <option value="">Choose type...</option>
    <option value="Routine">Routine Check</option>
    <option value="Preventive">Preventive Maintenance</option>
    <option value="Corrective">Corrective Repair</option>
    <option value="Safety">Safety Inspection</option>
    <!-- Add custom maintenance types -->
    <option value="Inspection">Field Inspection</option>
</select>
```

#### Priority Levels

In Equipment modal (around line 945):

```html
<select id="equipmentPriority" required>
    <option value="Low">Low</option>
    <option value="Medium" selected>Medium</option>
    <option value="High">High</option>
    <option value="Critical">Critical</option>
    <!-- Add custom priority levels -->
    <option value="Strategic">Strategic Asset</option>
</select>
```

### Reminder Settings

Modify reminder calculations (around line 1200):

```javascript
function renderRemindersList() {
    const reminders = schedules
        .filter(r => r.equip && r.daysUntil <= 14 && r.daysUntil >= -30)
        //                                          ↑ Change 14 for different lookahead
        //                                                               ↑ Change -30 for past-due history
}
```

Customize urgency thresholds (around line 1250):

```javascript
const isUrgent = reminder.daysUntil <= 3;  // Change 3 to different days
const isOverdue = reminder.daysUntil <= 0;  // Overdue threshold
```

## Backend Configuration

### Node.js Server Settings

Edit `/workspace/backend/server.js`:

#### Port Configuration

Around **line 7**:
```javascript
const PORT = process.env.PORT || 3000;
// Change 3000 to your desired port
// Can also set via environment: PORT=8000 npm start
```

#### Database Location

Around **line 15**:
```javascript
const dbPath = path.join(__dirname, 'maintenance.db');
// Change to custom path if needed
// Example: '/var/data/maintenance.db'
```

#### CORS Settings

Around **line 11**:
```javascript
app.use(cors());
// Configure for specific origins:
app.use(cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
```

### Database Schema Customization

#### Add Custom Equipment Fields

Modify `initializeDatabase()` function around line 35:

```javascript
db.run(`
    CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        location TEXT NOT NULL,
        installDate TEXT,
        scheduleInterval INTEGER NOT NULL,
        priority TEXT DEFAULT 'Medium',
        serial TEXT,
        notes TEXT,
        createdDate TEXT DEFAULT CURRENT_TIMESTAMP,
        lastMaintained TEXT,
        status TEXT DEFAULT 'Active',
        -- Add custom columns:
        manufacturer TEXT,
        model TEXT,
        purchaseDate TEXT,
        warranty TEXT
    )
`);
```

#### Add Custom Log Fields

Modify maintenance_logs table creation around line 51:

```javascript
db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipmentId INTEGER NOT NULL,
        type TEXT NOT NULL,
        notes TEXT,
        technician TEXT NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        nextScheduledDate TEXT,
        -- Add custom fields:
        partsUsed TEXT,
        estimatedCost REAL,
        downtime INTEGER,
        FOREIGN KEY(equipmentId) REFERENCES equipment(id)
    )
`);
```

### Environment Variables

Create `/workspace/backend/.env`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=./maintenance.db
DB_POOL_SIZE=10

# CORS
CORS_ORIGIN=http://localhost:8080

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/server.log

# Performance
REQUEST_TIMEOUT=30000
MAX_JSON_SIZE=10mb

# Security
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

Then load in server.js:
```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

### API Rate Limiting

Add to `/workspace/backend/server.js` around line 11:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

Install package:
```bash
npm install express-rate-limit
```

## Data Storage Options

### SQLite (Default)

No additional configuration needed. Database auto-creates.

### PostgreSQL (Alternative)

Update server.js:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

// Replace db.run/all/get with pool queries
```

### MongoDB (Alternative)

Update server.js:
```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI);

const equipmentSchema = new mongoose.Schema({
    name: String,
    type: String,
    location: String,
    // ... fields
});
```

## Authentication (Optional)

Add JWT authentication to backend:

```javascript
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'your-secret-key';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Protect routes
app.get('/api/equipment', authenticateToken, async (req, res) => {
    // ... existing code
});
```

## Logging Configuration

### Enable Detailed Logging

Add to `/workspace/backend/server.js`:

```javascript
// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Error logging
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});
```

## Performance Tuning

### Database Indexes

Add to `initializeDatabase()`:

```javascript
// Optimize common queries
db.run(`CREATE INDEX IF NOT EXISTS idx_equipment_priority ON equipment(priority)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_logs_technician ON maintenance_logs(technician)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_schedule_equipment ON maintenance_schedules(equipmentId)`);
```

### Query Optimization

```javascript
// Use LIMIT for large result sets
const logs = await dbAll(
    'SELECT * FROM maintenance_logs ORDER BY date DESC LIMIT 1000'
);

// Use pagination
const PAGE_SIZE = 50;
const page = req.query.page || 0;
const logs = await dbAll(
    'SELECT * FROM maintenance_logs ORDER BY date DESC LIMIT ? OFFSET ?',
    [PAGE_SIZE, page * PAGE_SIZE]
);
```

### Connection Pooling

For production, use connection pooling:

```javascript
const ConnectionPool = require('sqlite-pool');

const pool = new ConnectionPool({
    filename: dbPath,
    max: 10
});
```

## Notification Configuration

### Email Reminders (Optional)

Add to `/workspace/backend/server.js`:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function sendMaintenanceReminder(equipment, technician) {
    transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: technician.email,
        subject: `Maintenance Due: ${equipment.name}`,
        html: `<p>Equipment ${equipment.name} is due for maintenance.</p>`
    });
}
```

### SMS Alerts (Optional)

Add Twilio integration:

```javascript
const twilio = require('twilio');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

function sendSMSAlert(phoneNumber, message) {
    client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: phoneNumber
    });
}
```

## Backup Configuration

### Automated Backups

Linux cron job in `/etc/cron.d/maintenance-backup`:

```bash
# Daily backup at 2 AM
0 2 * * * /usr/bin/sqlite3 /path/to/maintenance.db ".backup '/path/to/backups/maintenance-$(date +\%Y\%m\%d).db'"

# Weekly full backup
0 3 * * 0 tar -czf /path/to/backups/maintenance-$(date +\%Y\%m\%d).tar.gz /path/to/backend/
```

### AWS S3 Backup

```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

async function backupToS3() {
    const fs = require('fs');
    const fileContent = fs.readFileSync('maintenance.db');
    
    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: `backups/maintenance-${Date.now()}.db`,
        Body: fileContent
    };
    
    return s3.upload(params).promise();
}
```

---

For complete details, see:
- **README.md** - Full documentation
- **DEPLOYMENT.md** - Production deployment
- **backend/server.js** - API implementation