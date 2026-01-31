const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/parking_reporter.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  // User profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      preferred_authority TEXT DEFAULT 'trochia',
      authority_phone TEXT,
      language TEXT DEFAULT 'el',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Call history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      authority_number TEXT NOT NULL,
      authority_type TEXT NOT NULL,
      vehicle_plate TEXT,
      vehicle_color TEXT,
      vehicle_make_model TEXT,
      status TEXT DEFAULT 'pending',
      bland_call_id TEXT,
      transcript TEXT,
      duration_seconds INTEGER,
      outcome TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    )
  `);

  // Daily call limits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_limits (
      profile_id TEXT NOT NULL,
      date TEXT NOT NULL,
      call_count INTEGER DEFAULT 0,
      PRIMARY KEY (profile_id, date),
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    )
  `);

  console.log('Database initialized successfully');
}

// Profile operations
const profileQueries = {
  getById: db.prepare('SELECT * FROM profiles WHERE id = ?'),
  getAll: db.prepare('SELECT * FROM profiles ORDER BY created_at DESC'),
  insert: db.prepare(`
    INSERT INTO profiles (id, full_name, address, phone_number, preferred_authority, authority_phone, language)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE profiles
    SET full_name = ?, address = ?, phone_number = ?, preferred_authority = ?, authority_phone = ?, language = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM profiles WHERE id = ?')
};

// Call operations
const callQueries = {
  getById: db.prepare('SELECT * FROM calls WHERE id = ?'),
  getByProfileId: db.prepare('SELECT * FROM calls WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?'),
  getAllByProfile: db.prepare('SELECT * FROM calls WHERE profile_id = ? ORDER BY created_at DESC'),
  insert: db.prepare(`
    INSERT INTO calls (id, profile_id, authority_number, authority_type, vehicle_plate, vehicle_color, vehicle_make_model, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateStatus: db.prepare(`
    UPDATE calls SET status = ?, outcome = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?
  `),
  updateWithTranscript: db.prepare(`
    UPDATE calls
    SET status = ?, bland_call_id = ?, transcript = ?, duration_seconds = ?, outcome = ?, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  updateBlandCallId: db.prepare('UPDATE calls SET bland_call_id = ?, status = ? WHERE id = ?')
};

// Daily limits operations
const limitQueries = {
  get: db.prepare('SELECT call_count FROM daily_limits WHERE profile_id = ? AND date = ?'),
  upsert: db.prepare(`
    INSERT INTO daily_limits (profile_id, date, call_count) VALUES (?, ?, 1)
    ON CONFLICT(profile_id, date) DO UPDATE SET call_count = call_count + 1
  `),
  reset: db.prepare('DELETE FROM daily_limits WHERE date < ?')
};

// Helper functions
function getProfile(id) {
  return profileQueries.getById.get(id);
}

function getAllProfiles() {
  return profileQueries.getAll.all();
}

function createProfile(profile) {
  profileQueries.insert.run(
    profile.id,
    profile.full_name,
    profile.address,
    profile.phone_number,
    profile.preferred_authority || 'trochia',
    profile.authority_phone || null,
    profile.language || 'el'
  );
  return getProfile(profile.id);
}

function updateProfile(id, profile) {
  profileQueries.update.run(
    profile.full_name,
    profile.address,
    profile.phone_number,
    profile.preferred_authority || 'trochia',
    profile.authority_phone || null,
    profile.language || 'el',
    id
  );
  return getProfile(id);
}

function deleteProfile(id) {
  return profileQueries.delete.run(id);
}

function getCallsByProfile(profileId, limit = 50) {
  return callQueries.getByProfileId.all(profileId, limit);
}

function getCallById(id) {
  return callQueries.getById.get(id);
}

function createCall(call) {
  callQueries.insert.run(
    call.id,
    call.profile_id,
    call.authority_number,
    call.authority_type,
    call.vehicle_plate || null,
    call.vehicle_color || null,
    call.vehicle_make_model || null,
    'pending'
  );
  return getCallById(call.id);
}

function updateCallStatus(id, status, outcome = null) {
  callQueries.updateStatus.run(status, outcome, id);
  return getCallById(id);
}

function updateCallWithTranscript(id, data) {
  callQueries.updateWithTranscript.run(
    data.status,
    data.bland_call_id,
    data.transcript,
    data.duration_seconds,
    data.outcome,
    id
  );
  return getCallById(id);
}

function updateCallBlandId(id, blandCallId, status = 'in_progress') {
  callQueries.updateBlandCallId.run(blandCallId, status, id);
  return getCallById(id);
}

function getDailyCallCount(profileId) {
  const today = new Date().toISOString().split('T')[0];
  const result = limitQueries.get.get(profileId, today);
  return result ? result.call_count : 0;
}

function incrementDailyCallCount(profileId) {
  const today = new Date().toISOString().split('T')[0];
  limitQueries.upsert.run(profileId, today);
}

function cleanupOldLimits() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  limitQueries.reset.run(yesterday);
}

module.exports = {
  db,
  initializeDatabase,
  getProfile,
  getAllProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  getCallsByProfile,
  getCallById,
  createCall,
  updateCallStatus,
  updateCallWithTranscript,
  updateCallBlandId,
  getDailyCallCount,
  incrementDailyCallCount,
  cleanupOldLimits
};
