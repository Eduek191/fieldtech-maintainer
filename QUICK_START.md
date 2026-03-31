# Quick Start Guide - Field Maintenance Manager

Get up and running in 5 minutes.

## Step 1: Install & Start Backend (1 minute)

```bash
cd /workspace/backend
npm install
npm start
```

Wait for message: `API running on http://localhost:3000`

## Step 2: Start Frontend (1 minute)

Open **new terminal**:
```bash
cd /workspace
npx http-server . -p 8080
```

## Step 3: Access Application (1 minute)

Open browser → `http://localhost:8080`

## Step 4: Add Your First Equipment (1 minute)

1. Click **+ Add Equipment** button
2. Fill in details:
   - **Name**: "Pump Unit A-1"
   - **Type**: "Pump"
   - **Location**: "North Field"
   - **Schedule**: "30" (days)
   - **Priority**: "High"
3. Click **Add Equipment**

## Step 5: Log Maintenance (1 minute)

1. Fill **Quick Log Entry** form:
   - Select your equipment
   - Choose maintenance type: "Routine Check"
   - Add notes (optional)
   - Enter your name
2. Click **Log Maintenance**

## That's It! 🎉

### Now Try:

- **View Equipment**: Click equipment in list to see history
- **Check Reminders**: See upcoming maintenance in right column
- **Generate Reports**: Click report tabs at bottom
- **Export Data**: Use reports section

## Key Features at a Glance

| Feature | Location | Purpose |
|---------|----------|---------|
| Add Equipment | Left column, top button | Register new equipment |
| Quick Log | Left column, bottom form | Record maintenance work |
| Reminders | Right column, top card | See what's due soon |
| Status | Right column, bottom card | Equipment health overview |
| Reports | Bottom section | View analytics & export |

## Common Actions

### Create Equipment
1. Click **+ Add Equipment**
2. Fill form → Click **Add Equipment**

### Log Maintenance
1. Select equipment from dropdown
2. Choose maintenance type
3. Add notes and technician name
4. Click **Log Maintenance**

### View Equipment Details
1. Click any equipment in the inventory list
2. See full history and schedule

### Generate Reports
1. Scroll to bottom (Reports section)
2. Click desired tab:
   - **Monthly Overview** - Equipment activity
   - **Equipment Details** - Schedules & status
   - **Technician Activity** - Who did what

## Data Storage

- **With Backend**: Data saved to SQLite database
- **Without Backend**: Data saved to browser storage
- **Both work offline** - Changes sync when online

## Stopping the Application

```bash
# Stop backend (Ctrl+C in backend terminal)
# Stop frontend (Ctrl+C in frontend terminal)

# Or kill by port:
# macOS/Linux: lsof -i :3000 | kill -9
# Windows: netstat -ano | findstr :3000 | taskkill /PID <PID> /F
```

## Troubleshooting

### Backend won't start
```bash
# Port 3000 in use?
# Kill it and try again
cd /workspace/backend && npm start
```

### Can't see data
- Check browser console (F12) for errors
- Verify backend is running on port 3000
- Try clearing browser cache

### Everything frozen?
- Reload browser page (F5)
- Restart backend: Kill process and `npm start`
- Clear browser storage: DevTools → Application → Clear Storage

## Next Steps

- **Read full docs**: See `README.md`
- **Deploy**: See `DEPLOYMENT.md`
- **Customize**: Edit `index.html` CSS colors and settings

---

**That's all!** Your Field Maintenance Manager is ready to use. 🚀

For detailed documentation, see:
- **`README.md`** - Full feature documentation
- **`DEPLOYMENT.md`** - Production deployment guide
- **`backend/server.js`** - API implementation details