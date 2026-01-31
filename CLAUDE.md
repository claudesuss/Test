# CLAUDE.md

This file provides guidance for AI assistants working on this codebase.

## Project Overview

This is an **AI Voice Call Parking Violation Reporter** for Greece. Users press one button to have an AI agent call local traffic police (Τροχαία) or municipal police (Δημοτική Αστυνομία) to report illegally parked vehicles blocking their driveway.

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite via better-sqlite3
- **Voice AI**: Bland.ai API
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework)

## Project Structure

```
├── backend/
│   ├── server.js           # Main Express server, middleware, webhooks
│   ├── database/db.js      # SQLite schema and query functions
│   ├── routes/
│   │   ├── profile.js      # User profile CRUD endpoints
│   │   ├── calls.js        # Call history and status endpoints
│   │   └── report.js       # Report submission endpoint (main feature)
│   ├── services/
│   │   ├── blandai.js      # Bland.ai API integration
│   │   └── voiceScript.js  # Greek conversation script generator
│   └── utils/
│       └── greekHelpers.js # Greek language utilities (phonetics, validation)
├── frontend/
│   ├── index.html          # Single-page application
│   ├── styles.css          # Mobile-first CSS
│   └── app.js              # Frontend state management and API calls
├── data/                   # SQLite database (auto-created, gitignored)
└── .env                    # Environment variables (gitignored)
```

## Key Commands

```bash
npm install          # Install dependencies
npm start            # Run production server
npm run dev          # Run with auto-reload (--watch)
```

## Environment Variables

Required in `.env`:
- `BLAND_API_KEY` - Bland.ai API key for voice calls
- `MOCK_CALLS=true` - Set to false for real calls
- `PORT` - Server port (default: 3000)

## Important Conventions

### Backend

1. **Database**: All queries use prepared statements in `backend/database/db.js`
2. **Routes**: Each route file exports an Express Router
3. **Error handling**: Routes return JSON with `{ error: "message" }` on failure
4. **Rate limiting**: 3 calls/day per user, 10 reports/hour per IP

### Frontend

1. **No build step**: Plain HTML/CSS/JS served statically
2. **State management**: Global `state` object in app.js
3. **Bilingual**: All UI text has `data-el` and `data-en` attributes
4. **Mobile-first**: CSS uses 480px max-width container

### Greek Language

1. **Greetings**: Use `getGreekGreeting()` for time-appropriate greeting
2. **Phone spelling**: Use `formatPhoneForSpeech()` for digit grouping
3. **Name spelling**: Use `spellGreekName()` with Greek phonetic alphabet
4. **Blocked numbers**: Emergency services (100, 166, 199, 112) are blocked

## Safety Features (Do Not Remove)

1. **Emergency number blocking** in `greekHelpers.js:isBlockedNumber()`
2. **Daily rate limiting** in `report.js` (MAX_DAILY_CALLS = 3)
3. **Confirmation modal** before initiating calls
4. **Call logging** for accountability

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | /api/profile | User profile management |
| POST | /api/report | Initiate voice call |
| GET | /api/calls | Call history |
| GET | /api/calls/:id/status | Real-time call status |
| POST | /api/webhook/call-complete | Bland.ai callback |

## Testing

Set `MOCK_CALLS=true` in `.env` to test without making real calls. Mock mode:
- Logs call details to console
- Returns mock call IDs
- Simulates successful completion

## Common Tasks

### Adding a new API endpoint
1. Create or modify route file in `backend/routes/`
2. Register route in `backend/server.js`
3. Add frontend API call in `frontend/app.js`

### Modifying the voice script
1. Edit `backend/services/voiceScript.js`
2. Test with `/api/report/preview` endpoint

### Adding UI translations
1. Add `data-el` and `data-en` attributes to HTML elements
2. Update `setLanguage()` in `frontend/app.js` if needed
