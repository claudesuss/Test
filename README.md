# Parking Violation Reporter

AI Voice Call system for reporting illegally parked vehicles in Greece. Press one button and have an AI agent automatically call the local traffic police (Trochia) or municipal police (Dimotiki Astynomia) to report a vehicle blocking your driveway.

## Features

- **One-Click Reporting**: Single button to initiate an AI voice call
- **Greek Language Support**: AI speaks fluent Greek with proper greetings and responses
- **User Profiles**: Save your details once, use them for all reports
- **Vehicle Details**: Optionally add license plate, color, and make/model
- **Call History**: Track all your reports with timestamps and outcomes
- **Rate Limiting**: Maximum 3 calls per day to prevent abuse
- **Safety Features**: Blocks emergency numbers, requires confirmation
- **Mock Mode**: Test the system without making real calls
- **Bilingual UI**: Greek and English interface

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Voice AI**: Bland.ai integration
- **Frontend**: Vanilla HTML/CSS/JS (mobile-first design)

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Bland.ai account and API key (for real calls)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd parking-violation-reporter

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

### Configuration

Edit the `.env` file:

```env
# Bland.ai Configuration
BLAND_API_KEY=your_bland_api_key

# App Configuration
PORT=3000
NODE_ENV=development

# Default Authority Numbers (Greece)
DEFAULT_TROCHIA_NUMBER=+302106411111
DEFAULT_DIMOTIKI_NUMBER=+302105277000

# Mock Mode (set to true for development)
MOCK_CALLS=true

# Webhook URL (optional)
WEBHOOK_BASE_URL=http://localhost:3000
```

### Running the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Open http://localhost:3000 in your browser.

## Usage

### First Time Setup

1. Fill in your profile information:
   - Full name (Onomateponimo)
   - Home address (Dievthinsi)
   - Phone number for callback
   - Preferred authority (Trochia or Dimotiki)
   - Authority phone number (your local police station)

2. Click "Save Profile"

### Reporting a Violation

1. (Optional) Add vehicle details:
   - License plate (e.g., ABC 1234)
   - Color
   - Make/Model

2. Click the big red "Report" button

3. Confirm in the dialog

4. The AI will:
   - Call the configured authority number
   - Greet the operator in Greek
   - Provide your name and callback number
   - Report the location and situation
   - Provide vehicle details if available
   - Answer follow-up questions
   - Thank the operator and end the call

## API Endpoints

### Profile Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get all profiles |
| GET | `/api/profile/:id` | Get profile by ID |
| POST | `/api/profile` | Create new profile |
| PUT | `/api/profile/:id` | Update profile |
| DELETE | `/api/profile/:id` | Delete profile |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/report` | Initiate a violation report call |
| GET | `/api/report/preview` | Preview the AI script |
| GET | `/api/report/limits` | Get rate limit status |

### Call History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calls` | Get call history for a profile |
| GET | `/api/calls/:id` | Get specific call |
| GET | `/api/calls/:id/status` | Get real-time call status |
| GET | `/api/calls/:id/transcript` | Get call transcript |
| POST | `/api/calls/:id/cancel` | Cancel ongoing call |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/config` | Configuration status |

## AI Voice Script

The AI agent follows this conversation flow (in Greek):

1. **Greeting**: "Kalimera/Kalispera, I'm calling to report illegal parking."
2. **Identification**: Provides name and callback number
3. **Location**: Reports the address and situation
4. **Vehicle Details**: Provides plate/color/model if available
5. **Request**: Asks for patrol or next steps
6. **Closing**: Thanks and provides callback number again

The AI can also:
- Spell out names using Greek phonetic alphabet
- Repeat information when asked
- Handle "please hold" situations
- Respond to common follow-up questions

## Safety Features

1. **Rate Limiting**: Maximum 3 calls per day per user
2. **Blocked Numbers**: Cannot call emergency services (100, 166, 199, 112)
3. **Confirmation Dialog**: Must confirm before initiating call
4. **Call Logging**: All calls are logged for accountability
5. **IP Rate Limiting**: 10 report requests per hour per IP

## Project Structure

```
parking-violation-reporter/
├── backend/
│   ├── server.js           # Express server
│   ├── database/
│   │   └── db.js           # SQLite database
│   ├── routes/
│   │   ├── profile.js      # Profile CRUD
│   │   ├── calls.js        # Call history
│   │   └── report.js       # Report submission
│   ├── services/
│   │   ├── blandai.js      # Bland.ai integration
│   │   └── voiceScript.js  # Greek script generator
│   └── utils/
│       └── greekHelpers.js # Greek language utilities
├── frontend/
│   ├── index.html          # Main page
│   ├── styles.css          # Mobile-first styles
│   └── app.js              # Frontend logic
├── data/                   # SQLite database (auto-created)
├── .env.example            # Environment template
├── package.json
└── README.md
```

## Testing

### Mock Mode

Set `MOCK_CALLS=true` in `.env` to test without making real calls. The system will:
- Log call details to console
- Return mock call IDs
- Simulate successful call completion

### Testing with Personal Number

1. Set `MOCK_CALLS=false`
2. Configure your personal phone as `authority_phone`
3. Test the full call flow
4. Review the transcript

## Greek Authority Phone Numbers

**Important**: You must configure your local authority phone numbers.

Examples (verify actual numbers):
- Athens Trochia: +30 210 641 1111
- Athens Dimotiki: +30 210 527 7000

**Do NOT call:**
- 100 (Amesi Drasi - Emergency)
- 166 (EKAV - Ambulance)
- 199 (Fire Department)
- 112 (European Emergency)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This application makes automated phone calls to authorities. Use responsibly and only for legitimate parking violation reports. The developers are not responsible for misuse of this system.
