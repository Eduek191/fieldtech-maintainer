# System Architecture

Field Maintenance Manager - Complete system design and component relationships.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FIELD TECHNICIANS                              │
│                     (Mobile/Desktop/Tablet)                           │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND APPLICATION                              │
│                       (Vanilla HTML/JS)                                │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ • Equipment Dashboard                                            │ │
│  │ • Maintenance Log Form                                           │ │
│  │ • Reminder Alerts                                                │ │
│  │ • Reports & Analytics                                            │ │
│  │ • Local Storage (Offline Mode)                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       │ REST API (JSON)
                       │ Fetch/CORS
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API SERVER                               │
│                    (Node.js + Express)                                 │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Routes & Controllers                                             │ │
│  │ • Equipment CRUD                                                  │ │
│  │ • Maintenance Logs                                                │ │
│  │ • Schedules                                                       │ │
│  │ • Reports & Export                                                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Middleware                                                        │ │
│  │ • CORS Handler                                                    │ │
│  │ • Request Parser                                                  │ │
│  │ • Error Handler                                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       │ SQL Queries
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE                                      │
│                        (SQLite3)                                        │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Tables:                                                          │  │
│  │ • equipment (500 rows × 12 cols)                                │  │
│  │ • maintenance_logs (10K+ rows × 7 cols)                         │  │
│  │ • maintenance_schedules (500 rows × 5 cols)                     │  │
│  │                                                                  │  │
│  │ Indexes:                                                         │  │
│  │ • equipment.priority, equipment.status                          │  │
│  │ • logs.equipmentId, logs.date, logs.technician                 │  │
│  │ • schedules.nextDueDate, schedules.equipmentId                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
TECHNICIAN INPUT
       │
       ├─► Add Equipment Form
       │        │
       │        └─► POST /api/equipment
       │               │
       │               ├─► Validate Input
       │               ├─► Insert to DB
       │               └─► Create Schedule
       │
       ├─► Log Maintenance Form
       │        │
       │        └─► POST /api/logs
       │               │
       │               ├─► Create Log Entry
       │               ├─► Update last_maintained
       │               ├─► Recalculate next_due
       │               └─► Return Success
       │
       └─► View Reminders/Reports
                │
                └─► GET /api/schedules/upcoming
                   GET /api/reports/*
                        │
                        ├─► Query Database
                        ├─► Calculate Status
                        ├─► Format Response
                        └─► Render UI
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND MODULES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐    │
│  │  Equipment   │ ───► │ Maintenance  │ ───► │  Schedules   │    │
│  │  Management  │      │   Logging    │      │  & Reminders │    │
│  └──────────────┘      └──────────────┘      └──────────────┘    │
│         │                     │                     │               │
│         │                     │                     │               │
│         ▼                     ▼                     ▼               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │         LOCAL STORAGE / API INTERFACE                     │    │
│  │  (Fetch API + LocalStorage fallback)                     │    │
│  └──────────────────────────────────────────────────────────┘    │
│         │                     │                     │               │
│         └─────────────────────┼─────────────────────┘               │
│                               │                                    │
│                               ▼                                    │
│                     ┌──────────────────┐                           │
│                     │    Reports UI    │                           │
│                     │  (Dashboard)     │                           │
│                     └──────────────────┘                           │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND MODULES                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Equipment   │  │ Maintenance  │  │  Schedule    │             │
│  │  Routes      │  │  Log Routes  │  │  Routes      │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                      │
│         └─────────────────┼─────────────────┘                      │
│                           │                                        │
│                           ▼                                        │
│  ┌─────────────────────────────────────────┐                     │
│  │     Database Layer (SQLite3)             │                     │
│  │  • Connection Management                 │                     │
│  │  • Query Execution                       │                     │
│  │  • Transaction Handling                  │                     │
│  └─────────────────────────────────────────┘                     │
│                           │                                        │
│         ┌─────────────────┼─────────────────┐                     │
│         │                 │                 │                     │
│         ▼                 ▼                 ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Equipment   │  │ Maintenance  │  │  Schedules   │            │
│  │   Table      │  │  Logs Table  │  │   Table      │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

### Equipment Registration Flow

```
USER ACTION: Click "Add Equipment"
       │
       ▼
┌─────────────────────┐
│ Modal Form Opens    │
│ (Empty)             │
└─────────────────────┘
       │
       │ User fills:
       │ • Name, Type, Location
       │ • Interval, Priority
       │
       ▼
┌─────────────────────┐
│ Click "Add"         │
└─────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Validation (Frontend)               │
│ • Check required fields             │
│ • Validate input format             │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ API Request                         │
│ POST /api/equipment                 │
│ {name, type, location, ...}         │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Backend Receives                    │
│ • Parse JSON body                   │
│ • Validate inputs                   │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Database Operations                 │
│ • INSERT equipment                  │
│ • INSERT schedule (auto-create)     │
│ • Calculate next_due_date           │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Response Sent                       │
│ {id: 12345, message: "success"}    │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Frontend Receives                   │
│ • Parse response                    │
│ • Show success alert                │
│ • Close modal                       │
│ • Refresh equipment list            │
└─────────────────────────────────────┘
```

### Maintenance Logging Flow

```
USER ACTION: Click "Log Maintenance"
       │
       ▼
┌─────────────────────┐
│ Quick Log Form      │
│ Pre-filled with:    │
│ • Equipment list    │
│ • Maintenance types │
└─────────────────────┘
       │
       │ User fills:
       │ • Select equipment
       │ • Choose type
       │ • Add notes
       │ • Enter name
       │
       ▼
┌─────────────────────┐
│ Click "Log"         │
└─────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Frontend Processing                 │
│ • Validate selection                │
│ • Prepare payload                   │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /api/logs                      │
│ {equipmentId, type, notes, ...}     │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Backend Processing                  │
│ • INSERT maintenance_log            │
│ • UPDATE equipment.lastMaintained   │
│ • UPDATE schedule.nextDueDate       │
│ • UPDATE schedule.lastDueDate       │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Response Sent                       │
│ {id: 67890, message: "success"}    │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Frontend Updates                    │
│ • Show success message              │
│ • Clear form                        │
│ • Refresh dashboard                 │
│ • Update reminders                  │
│ • Update status                     │
└─────────────────────────────────────┘
```

### Reminder Calculation Flow

```
SYSTEM PROCESS: Calculate Reminders (On Load & Every Action)
       │
       ▼
┌─────────────────────────────────────┐
│ Fetch Schedules                     │
│ GET /api/schedules                  │
│ Returns all maintenance schedules   │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ For Each Schedule:                  │
│                                    │
│ 1. Calculate days until due        │
│    daysUntil = dueDate - today     │
│                                    │
│ 2. Determine status:               │
│    if (daysUntil <= 0)             │
│      status = "Overdue"            │
│    else if (daysUntil <= 3)        │
│      status = "Urgent"             │
│    else if (daysUntil <= 7)        │
│      status = "Due Soon"           │
│    else                            │
│      status = "Active"             │
│                                    │
│ 3. Assign visual indicator:        │
│    Red, Yellow, Green, Blue        │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Render Reminders                    │
│ • Sort by daysUntil (ascending)     │
│ • Display with status color        │
│ • Show next due date               │
└─────────────────────────────────────┘
```

## Database Schema Relationships

```
equipment
┌─────────────────────────────────────────┐
│ id (PK)                                 │
│ name                                    │
│ type                                    │
│ location                                │
│ installDate                             │
│ scheduleInterval                        │
│ priority                                │
│ serial                                  │
│ notes                                   │
│ createdDate                             │
│ lastMaintained                          │
│ status                                  │
└─────────────────────────────────────────┘
          │
          │ 1:N
          │ (id = equipmentId)
          │
          ▼
maintenance_logs
┌─────────────────────────────────────────┐
│ id (PK)                                 │
│ equipmentId (FK) ──────► ┐             │
│ type                      │             │
│ notes                     │             │
│ technician                │             │
│ date                      │             │
│ nextScheduledDate         │             │
└─────────────────────────────────────────┘
          │
          │ From
          │ equipment
          │
          ▼
maintenance_schedules
┌─────────────────────────────────────────┐
│ id (PK)                                 │
│ equipmentId (FK) ─ UNIQUE               │
│ nextDueDate                             │
│ lastDueDate                             │
│ interval                                │
└─────────────────────────────────────────┘
```

## Error Handling Flow

```
ANY REQUEST
       │
       ▼
┌─────────────────────────────────────┐
│ Validation Layer                    │
│ • Check required fields             │
│ • Validate data types               │
│ • Check constraints                 │
└─────────────────────────────────────┘
       │
       ├─► VALID ──────────────────────────┐
       │                                    │
       └─► INVALID                         │
                    │                      │
                    ▼                      │
           ┌─────────────────┐            │
           │ Return Error    │            │
           │ • 400 Status    │            │
           │ • Error Message │            │
           └─────────────────┘            │
                    │                      │
                    ▼                      │
           ┌─────────────────┐            │
           │ Frontend Shows  │            │
           │ Error Alert     │            │
           └─────────────────┘            │
                    │                      │
                    ▼                      │
           ┌─────────────────┐            │
           │ User Can Retry  │            │
           └─────────────────┘            │
                                          │
                                          ▼
                    ┌─────────────────────────────────┐
                    │ Database Operation               │
                    │ • Execute query                 │
                    │ • Handle DB errors              │
                    └─────────────────────────────────┘
                                          │
                                          ├─► SUCCESS
                                          │      │
                                          │      ▼
                                          │  ┌─────────────────┐
                                          │  │ Return Data     │
                                          │  │ • 200 Status    │
                                          │  │ • Result JSON   │
                                          │  └─────────────────┘
                                          │      │
                                          │      ▼
                                          │  ┌─────────────────┐
                                          │  │ Frontend Updates│
                                          │  │ • Render data   │
                                          │  │ • Show success  │
                                          │  └─────────────────┘
                                          │
                                          └─► DATABASE ERROR
                                                 │
                                                 ▼
                                             ┌─────────────────┐
                                             │ Return Error    │
                                             │ • 500 Status    │
                                             │ • Log error     │
                                             └─────────────────┘
```

## Offline Architecture

```
ONLINE MODE
┌────────────────────────────────┐
│ Frontend                         │
│ • API calls to backend          │
│ • Real-time data sync           │
│ • Remote storage                │
└────────────────────────────────┘
       │
       │ HTTP
       │
       ▼
┌────────────────────────────────┐
│ Backend                         │
│ • API responses                 │
│ • Database queries              │
│ • Data persistence              │
└────────────────────────────────┘


OFFLINE MODE
┌────────────────────────────────┐
│ Frontend                         │
│ • LocalStorage access           │
│ • All forms work                │
│ • Cached data displayed         │
│ • Graceful fallback             │
└────────────────────────────────┘
       │
       │ No connection
       │
       ▼
┌────────────────────────────────┐
│ LocalStorage                    │
│ • equipment[]                   │
│ • maintenanceLogs[]             │
│ • schedules[]                   │
└────────────────────────────────┘


BACK ONLINE
┌────────────────────────────────┐
│ Frontend detects connection     │
│ • Syncs queued changes          │
│ • Fetches remote updates        │
│ • Merges local + remote data    │
└────────────────────────────────┘
       │
       │ Sync
       │
       ▼
┌────────────────────────────────┐
│ Backend                         │
│ • Accepts pending changes       │
│ • Updates database              │
│ • Returns synchronized data     │
└────────────────────────────────┘
```

## Deployment Architecture

### Single Server Deployment

```
┌─────────────────────────────────────────────┐
│           SINGLE SERVER                     │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ Nginx/Apache (Port 80/443)           │  │
│  │ • Serve static files (index.html)    │  │
│  │ • HTTPS/SSL certificates            │  │
│  └──────────────────────────────────────┘  │
│         │                                   │
│         ▼                                   │
│  ┌──────────────────────────────────────┐  │
│  │ Node.js Process (Port 3000)          │  │
│  │ • Express API server                 │  │
│  │ • Request handling                   │  │
│  └──────────────────────────────────────┘  │
│         │                                   │
│         ▼                                   │
│  ┌──────────────────────────────────────┐  │
│  │ SQLite Database                      │  │
│  │ • maintenance.db                     │  │
│  │ • Local file storage                 │  │
│  └──────────────────────────────────────┘  │
│                                            │
└─────────────────────────────────────────────┘
```

### Load-Balanced Deployment

```
┌──────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                    (nginx/HAProxy)                       │
└──────────────────────────────────────────────────────────┘
    │                     │                     │
    ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ Backend 1   │       │ Backend 2   │       │ Backend 3   │
│ API Port    │       │ API Port    │       │ API Port    │
│ 3000        │       │ 3001        │       │ 3002        │
└─────────────┘       └─────────────┘       └─────────────┘
    │                     │                     │
    └─────────────────────┼─────────────────────┘
                          │
                          ▼
              ┌──────────────────────────┐
              │ PostgreSQL Database      │
              │ (Central Shared DB)      │
              └──────────────────────────┘
```

## Performance Optimization

```
CLIENT SIDE
├─ LocalStorage caching
├─ Lazy loading of reports
├─ CSS animations (GPU-accelerated)
├─ Minimal bundle size
└─ Efficient DOM manipulation

SERVER SIDE
├─ Database indexes
│  ├─ equipment.priority
│  ├─ equipment.status
│  ├─ logs.equipmentId
│  ├─ logs.date
│  └─ schedules.nextDueDate
├─ Query optimization
├─ Connection pooling
├─ Caching strategies
└─ Request compression

DATABASE SIDE
├─ Indexed columns
├─ Optimized query plans
├─ Data compression
├─ Regular VACUUM
└─ Transaction batching
```

---

This architecture provides:
- **Scalability**: Can grow from single server to load-balanced cluster
- **Reliability**: Error handling at each layer
- **Performance**: Optimized queries and caching
- **Offline-First**: Works without internet connection
- **Maintainability**: Clear separation of concerns