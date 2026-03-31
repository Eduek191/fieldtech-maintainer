const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database initialization
const dbPath = path.join(__dirname, 'maintenance.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database open error:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Promise wrapper for db operations
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Initialize database schema
function initializeDatabase() {
    db.serialize(() => {
        // Equipment table
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
                UNIQUE(name, location)
            )
        `);

        // Maintenance logs table
        db.run(`
            CREATE TABLE IF NOT EXISTS maintenance_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                equipmentId INTEGER NOT NULL,
                type TEXT NOT NULL,
                notes TEXT,
                technician TEXT NOT NULL,
                date TEXT DEFAULT CURRENT_TIMESTAMP,
                nextScheduledDate TEXT,
                FOREIGN KEY(equipmentId) REFERENCES equipment(id)
            )
        `);

        // Maintenance schedules table
        db.run(`
            CREATE TABLE IF NOT EXISTS maintenance_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                equipmentId INTEGER UNIQUE NOT NULL,
                nextDueDate TEXT NOT NULL,
                lastDueDate TEXT,
                interval INTEGER NOT NULL,
                FOREIGN KEY(equipmentId) REFERENCES equipment(id)
            )
        `);

        // Create indexes for better performance
        db.run(`CREATE INDEX IF NOT EXISTS idx_logs_equipment ON maintenance_logs(equipmentId)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_logs_date ON maintenance_logs(date)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_schedule_due ON maintenance_schedules(nextDueDate)`);
    });
}

// ============================================
// Equipment Routes
// ============================================

// Get all equipment
app.get('/api/equipment', async (req, res) => {
    try {
        const equipment = await dbAll('SELECT * FROM equipment ORDER BY priority DESC, name ASC');
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single equipment
app.get('/api/equipment/:id', async (req, res) => {
    try {
        const equipment = await dbGet('SELECT * FROM equipment WHERE id = ?', [req.params.id]);
        if (!equipment) {
            return res.status(404).json({ error: 'Equipment not found' });
        }
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create equipment
app.post('/api/equipment', async (req, res) => {
    try {
        const { name, type, location, installDate, scheduleInterval, priority, serial, notes } = req.body;

        if (!name || !type || !location || !scheduleInterval) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await dbRun(
            `INSERT INTO equipment (name, type, location, installDate, scheduleInterval, priority, serial, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, type, location, installDate || null, scheduleInterval, priority || 'Medium', serial || '', notes || '']
        );

        // Create schedule for new equipment
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + scheduleInterval);

        await dbRun(
            `INSERT INTO maintenance_schedules (equipmentId, nextDueDate, interval)
             VALUES (?, ?, ?)`,
            [result.id, nextDueDate.toISOString(), scheduleInterval]
        );

        res.status(201).json({ id: result.id, message: 'Equipment created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update equipment
app.put('/api/equipment/:id', async (req, res) => {
    try {
        const { name, type, location, priority, serial, notes } = req.body;

        await dbRun(
            `UPDATE equipment SET name = ?, type = ?, location = ?, priority = ?, serial = ?, notes = ?
             WHERE id = ?`,
            [name, type, location, priority, serial || '', notes || '', req.params.id]
        );

        res.json({ message: 'Equipment updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete equipment
app.delete('/api/equipment/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM maintenance_logs WHERE equipmentId = ?', [req.params.id]);
        await dbRun('DELETE FROM maintenance_schedules WHERE equipmentId = ?', [req.params.id]);
        await dbRun('DELETE FROM equipment WHERE id = ?', [req.params.id]);

        res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Maintenance Logs Routes
// ============================================

// Get all logs
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await dbAll(`
            SELECT ml.*, e.name as equipmentName FROM maintenance_logs ml
            LEFT JOIN equipment e ON ml.equipmentId = e.id
            ORDER BY ml.date DESC
        `);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get logs for specific equipment
app.get('/api/logs/equipment/:equipmentId', async (req, res) => {
    try {
        const logs = await dbAll(
            `SELECT * FROM maintenance_logs WHERE equipmentId = ? ORDER BY date DESC`,
            [req.params.equipmentId]
        );
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create maintenance log
app.post('/api/logs', async (req, res) => {
    try {
        const { equipmentId, type, notes, technician, nextScheduledDate } = req.body;

        if (!equipmentId || !type || !technician) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await dbRun(
            `INSERT INTO maintenance_logs (equipmentId, type, notes, technician, nextScheduledDate)
             VALUES (?, ?, ?, ?, ?)`,
            [equipmentId, type, notes || '', technician, nextScheduledDate || null]
        );

        // Update equipment last maintained date
        await dbRun(
            `UPDATE equipment SET lastMaintained = CURRENT_TIMESTAMP WHERE id = ?`,
            [equipmentId]
        );

        // Update schedule
        const schedule = await dbGet('SELECT * FROM maintenance_schedules WHERE equipmentId = ?', [equipmentId]);
        if (schedule) {
            const nextDueDate = new Date();
            nextDueDate.setDate(nextDueDate.getDate() + schedule.interval);

            await dbRun(
                `UPDATE maintenance_schedules SET lastDueDate = CURRENT_TIMESTAMP, nextDueDate = ?
                 WHERE equipmentId = ?`,
                [nextDueDate.toISOString(), equipmentId]
            );
        }

        res.status(201).json({ id: result.id, message: 'Log created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete log
app.delete('/api/logs/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM maintenance_logs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Log deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Schedules Routes
// ============================================

// Get all schedules
app.get('/api/schedules', async (req, res) => {
    try {
        const schedules = await dbAll(`
            SELECT ms.*, e.name as equipmentName, e.priority FROM maintenance_schedules ms
            LEFT JOIN equipment e ON ms.equipmentId = e.id
            ORDER BY ms.nextDueDate ASC
        `);
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get upcoming schedules (within 14 days)
app.get('/api/schedules/upcoming', async (req, res) => {
    try {
        const today = new Date().toISOString();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 14);

        const schedules = await dbAll(`
            SELECT ms.*, e.name as equipmentName, e.priority FROM maintenance_schedules ms
            LEFT JOIN equipment e ON ms.equipmentId = e.id
            WHERE ms.nextDueDate <= ?
            ORDER BY ms.nextDueDate ASC
        `, [futureDate.toISOString()]);

        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Reports Routes
// ============================================

// Monthly overview report
app.get('/api/reports/monthly', async (req, res) => {
    try {
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();

        const report = await dbAll(`
            SELECT 
                e.id,
                e.name,
                e.type,
                e.location,
                e.priority,
                COUNT(ml.id) as totalLogs,
                MAX(ml.date) as lastMaintained,
                COUNT(CASE WHEN strftime('%m', ml.date) = ? AND strftime('%Y', ml.date) = ? THEN 1 END) as thisMonthLogs
            FROM equipment e
            LEFT JOIN maintenance_logs ml ON e.id = ml.equipmentId
            GROUP BY e.id
            ORDER BY e.priority DESC, e.name ASC
        `, [String(month).padStart(2, '0'), String(year)]);

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Equipment status report
app.get('/api/reports/equipment-status', async (req, res) => {
    try {
        const report = await dbAll(`
            SELECT 
                e.*,
                ms.nextDueDate,
                ms.interval,
                COUNT(ml.id) as totalMaintenance,
                MAX(ml.date) as lastMaintained
            FROM equipment e
            LEFT JOIN maintenance_schedules ms ON e.id = ms.equipmentId
            LEFT JOIN maintenance_logs ml ON e.id = ml.equipmentId
            GROUP BY e.id
            ORDER BY ms.nextDueDate ASC
        `);

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Technician activity report
app.get('/api/reports/technician-activity', async (req, res) => {
    try {
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();

        const report = await dbAll(`
            SELECT 
                ml.technician,
                COUNT(ml.id) as totalLogs,
                COUNT(CASE WHEN strftime('%m', ml.date) = ? AND strftime('%Y', ml.date) = ? THEN 1 END) as thisMonthLogs,
                MAX(ml.date) as lastActive,
                COUNT(DISTINCT ml.equipmentId) as equipmentHandled
            FROM maintenance_logs ml
            GROUP BY ml.technician
            ORDER BY lastActive DESC
        `, [String(month).padStart(2, '0'), String(year)]);

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate PDF report (placeholder - would need pdf library)
app.post('/api/reports/export', async (req, res) => {
    try {
        const { format, type } = req.body;

        if (format === 'json') {
            const equipment = await dbAll('SELECT * FROM equipment ORDER BY priority DESC');
            const logs = await dbAll('SELECT * FROM maintenance_logs ORDER BY date DESC');
            const schedules = await dbAll('SELECT * FROM maintenance_schedules');

            res.json({
                generatedAt: new Date().toISOString(),
                equipment,
                logs,
                schedules
            });
        } else {
            res.status(400).json({ error: 'Unsupported format' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Health check
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Field Maintenance Manager API running on http://localhost:${PORT}`);
    console.log('Database: maintenance.db');
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});