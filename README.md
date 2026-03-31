# Field Maintenance Manager

A comprehensive digital tool for oil and gas field technicians to efficiently log, track, and schedule maintenance for critical equipment. Built with modern web technologies for field reliability and offline-capable design.

## Features

### 📋 Equipment Inventory Management
- Quick equipment registration with all critical details
- Support for multiple equipment types (Pumps, Compressors, Separators, Wellheads, Valves, Generators, Motors)
- Priority level classification (Low, Medium, High, Critical)
- Serial number tracking and location mapping
- Equipment status monitoring

### 📝 Maintenance Logging
- Quick log entry form for fast field data capture
- Multiple maintenance type categories:
  - Routine Checks
  - Preventive Maintenance
  - Corrective Repairs
  - Safety Inspections
  - Calibrations
- Technician attribution and detailed notes
- Real-time status updates

### ⏰ Intelligent Reminders
- Automated maintenance schedule calculation
- Visual urgency indicators (Overdue, Due Soon, Active)
- Customizable interval-based scheduling
- 14-day advance reminders for upcoming maintenance

### 📊 Comprehensive Reporting
- **Monthly Overview**: Equipment maintenance frequency and status
- **Equipment Details**: Current schedules and maintenance history
- **Technician Activity**: Track technician productivity and equipment handled
- Export data in JSON format for compliance and auditing

### 📈 Analytics Dashboard
- Total equipment count
- Pending maintenance reminders count
- Monthly maintenance activity tracking
- Equipment status distribution (Active, Due Soon, Overdue)

## Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **Vanilla JavaScript** - No framework dependencies
- **Tailwind CSS** - Responsive design via CDN
- **Local Storage** - Offline data persistence

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Persistent relational database
- **CORS** - Cross-origin request handling

## Project Structure

```
/workspace/
├── index.html              # Main application interface
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json       # Backend dependencies
│   └── maintenance.db     # SQLite database (auto-created)
├── README.md              # This file
```

## Installation & Setup

### Prerequisites
- Node.js 14+ and npm
- Internet connection (first run only)

### Quick Start

1. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Start the API server**
   ```bash
   npm start
   ```
   Server runs on `http://localhost:3000`

3. **Open the application**
   - Open `index.html` in a modern web browser
   - Or serve via http-server: `npx http-server` (runs on port 8080)

### Development Mode

Run the backend with file watching:
```bash
cd backend
npm run dev
```

## API Documentation

### Equipment Endpoints

**GET /api/equipment**
- Retrieve all equipment
- Response: Array of equipment objects

**GET /api/equipment/:id**
- Get single equipment details
- Params: equipment ID
- Response: Equipment object

**POST /api/equipment**
- Create new equipment
- Body: { name, type, location, scheduleInterval, priority, serial?, notes? }
- Response: { id, message }

**PUT /api/equipment/:id**
- Update equipment details
- Body: { name, type, location, priority, serial, notes }
- Response: { message }

**DELETE /api/equipment/:id**
- Delete equipment and related records
- Response: { message }

### Maintenance Logs Endpoints

**GET /api/logs**
- Get all maintenance logs
- Response: Array of log objects

**GET /api/logs/equipment/:equipmentId**
- Get logs for specific equipment
- Response: Array of log objects

**POST /api/logs**
- Create maintenance log entry
- Body: { equipmentId, type, notes?, technician, nextScheduledDate? }
- Response: { id, message }

**DELETE /api/logs/:id**
- Delete specific log entry
- Response: { message }

### Schedules Endpoints

**GET /api/schedules**
- Get all maintenance schedules
- Response: Array of schedule objects

**GET /api/schedules/upcoming**
- Get upcoming maintenance (within 14 days)
- Response: Array of schedule objects

### Reports Endpoints

**GET /api/reports/monthly**
- Monthly overview report with equipment statistics
- Response: Array with monthly maintenance data

**GET /api/reports/equipment-status**
- Current equipment status and maintenance history
- Response: Array with equipment status details

**GET /api/reports/technician-activity**
- Technician activity and productivity metrics
- Response: Array with technician statistics

**POST /api/reports/export**
- Export data to specified format
- Body: { format: "json", type?: string }
- Response: Complete data export

## Data Models

### Equipment
```javascript
{
  id: number,
  name: string,
  type: string,
  location: string,
  installDate: string (ISO 8601),
  scheduleInterval: number (days),
  priority: string,
  serial: string,
  notes: string,
  createdDate: string (ISO 8601),
  lastMaintained: string (ISO 8601),
  status: string
}
```

### Maintenance Log
```javascript
{
  id: number,
  equipmentId: number,
  type: string,
  notes: string,
  technician: string,
  date: string (ISO 8601),
  nextScheduledDate: string (ISO 8601)
}
```

### Schedule
```javascript
{
  id: number,
  equipmentId: number,
  nextDueDate: string (ISO 8601),
  lastDueDate: string (ISO 8601),
  interval: number (days)
}
```

## Usage Workflow

### Daily Operations

1. **Start of Shift**
   - Check "Upcoming Reminders" section for equipment due for maintenance
   - Review equipment status dashboard

2. **During Maintenance**
   - Click "Quick Log Entry"
   - Select equipment and maintenance type
   - Add detailed notes about work performed
   - Log technician name
   - Submit entry

3. **Track Progress**
   - View equipment details by clicking on any equipment item
   - Check full maintenance history
   - Monitor status changes in real-time

### Weekly Reviews

1. **Equipment Status Report**
   - Navigate to "Equipment Details" tab
   - Review all equipment with their next check dates
   - Identify any overdue maintenance

2. **Technician Activity**
   - Check "Technician Activity" report
   - Track workload distribution
   - Monitor productivity metrics

### Monthly Reporting

1. **Generate Reports**
   - Use "Monthly Overview" for compliance documentation
   - Export data as JSON for archival
   - Share with management for KPI tracking

## Offline Capabilities

The application maintains functionality without internet connection:
- All data stored in browser localStorage
- Forms work offline
- Syncs to backend when connection restored
- Backend API optional for field operations

## Safety Considerations

- **Priority Levels**: Identify critical equipment requiring immediate attention
- **Overdue Alerts**: Visual warnings for past-due maintenance
- **Complete History**: Full audit trail of all maintenance work
- **Compliance Ready**: Export functionality for regulatory reporting
- **Technician Attribution**: Track who performed each maintenance task

## Database

### SQLite Setup
Database automatically created on first backend startup:
- Location: `/workspace/backend/maintenance.db`
- Tables: equipment, maintenance_logs, maintenance_schedules
- Indexes: Optimized for common queries

### Database Schema
```sql
-- Equipment inventory
CREATE TABLE equipment (
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
  status TEXT DEFAULT 'Active'
)

-- Maintenance activity log
CREATE TABLE maintenance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipmentId INTEGER NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  technician TEXT NOT NULL,
  date TEXT DEFAULT CURRENT_TIMESTAMP,
  nextScheduledDate TEXT,
  FOREIGN KEY(equipmentId) REFERENCES equipment(id)
)

-- Maintenance schedules
CREATE TABLE maintenance_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipmentId INTEGER UNIQUE NOT NULL,
  nextDueDate TEXT NOT NULL,
  lastDueDate TEXT,
  interval INTEGER NOT NULL,
  FOREIGN KEY(equipmentId) REFERENCES equipment(id)
)
```

## Performance Optimizations

- **Indexed queries** for fast equipment and schedule lookups
- **Lazy loading** of maintenance logs
- **CSS animations** use GPU acceleration
- **Responsive images** and minimal bundle size
- **Client-side filtering** for instant report updates

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
kill -9 <PID>

# Restart server
cd backend && npm start
```

### API not responding
- Verify backend is running: `curl http://localhost:3000/api/health`
- Check CORS settings if using different ports
- Verify database file exists: `backend/maintenance.db`

### Data not persisting
- Check browser localStorage is enabled
- Verify backend database directory permissions
- Check browser console for error messages

### Performance issues
- Clear browser cache and reload
- Check SQLite database file size
- Verify backend server resources

## Future Enhancements

- Mobile app (React Native/Flutter)
- Real-time notifications and SMS alerts
- Image/video attachment support
- Predictive maintenance analytics
- Integration with SCADA systems
- PDF report generation
- Multi-user authentication
- Cloud sync capabilities
- Equipment QR code scanning
- Spare parts inventory tracking

## Support & Documentation

For issues, feature requests, or documentation, refer to:
- Application help: Check inline form tooltips
- API docs: Review endpoint examples above
- Database: Review SQLite schema structure

## License

MIT License - Open source and freely available for use

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintenance Manager** - Keeping equipment running safely