/**
 * Parking Violation Reporter - Backend Server
 *
 * AI Voice Call system for reporting illegally parked vehicles in Greece
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { initializeDatabase, cleanupOldLimits } = require('./database/db');

// Import routes
const profileRoutes = require('./routes/profile');
const callsRoutes = require('./routes/calls');
const reportRoutes = require('./routes/report');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiting (100 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', globalLimiter);

// Stricter rate limiting for report endpoint (10 requests per hour per IP)
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many report requests. Please wait before making another call.' }
});
app.use('/api/report', reportLimiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/profile', profileRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/report', reportRoutes);

// Webhook endpoint for Bland.ai call completion callbacks
app.post('/api/webhook/call-complete', (req, res) => {
  try {
    const { call_id, status, transcript, call_length, metadata } = req.body;

    console.log('Webhook received:', { call_id, status, metadata });

    if (metadata && metadata.report_id) {
      const { updateCallWithTranscript, getCallById } = require('./database/db');

      const call = getCallById(metadata.report_id);
      if (call) {
        updateCallWithTranscript(metadata.report_id, {
          status: status === 'completed' ? 'completed' : 'failed',
          bland_call_id: call_id,
          transcript: transcript || null,
          duration_seconds: call_length || null,
          outcome: status
        });

        console.log(`Call ${metadata.report_id} updated with webhook data`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mock_mode: process.env.MOCK_CALLS === 'true'
  });
});

// Configuration info endpoint (safe info only)
app.get('/api/config', (req, res) => {
  res.json({
    mock_mode: process.env.MOCK_CALLS === 'true',
    max_daily_calls: 3,
    default_trochia_configured: !!process.env.DEFAULT_TROCHIA_NUMBER,
    default_dimotiki_configured: !!process.env.DEFAULT_DIMOTIKI_NUMBER,
    bland_configured: !!process.env.BLAND_API_KEY
  });
});

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    initializeDatabase();

    // Cleanup old rate limit records
    cleanupOldLimits();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚗 Parking Violation Reporter                            ║
║   AI Voice Call System for Greece                          ║
║                                                            ║
║   Server running on http://localhost:${PORT}                 ║
║                                                            ║
║   Mock Mode: ${process.env.MOCK_CALLS === 'true' ? 'ENABLED (no real calls)' : 'DISABLED (real calls)'}        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);

      if (process.env.MOCK_CALLS === 'true') {
        console.log('⚠️  Running in MOCK mode - no actual calls will be made');
        console.log('   Set MOCK_CALLS=false in .env to enable real calls\n');
      }

      if (!process.env.BLAND_API_KEY) {
        console.log('⚠️  BLAND_API_KEY not configured');
        console.log('   Add your Bland.ai API key to .env file\n');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
