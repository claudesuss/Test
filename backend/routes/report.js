/**
 * Report Routes
 *
 * Handles the main parking violation report functionality
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
  getProfile,
  createCall,
  updateCallBlandId,
  updateCallStatus,
  getDailyCallCount,
  incrementDailyCallCount
} = require('../database/db');
const { initiateCall } = require('../services/blandai');
const { isBlockedNumber, isValidGreekPlate } = require('../utils/greekHelpers');

const router = express.Router();

// Maximum calls per day per user
const MAX_DAILY_CALLS = 3;

/**
 * POST /api/report
 * Initiate a parking violation report call
 */
router.post('/', async (req, res) => {
  try {
    const {
      profile_id,
      vehicle_plate,
      vehicle_color,
      vehicle_make_model,
      authority_phone_override
    } = req.body;

    // Validate profile
    if (!profile_id) {
      return res.status(400).json({ error: 'profile_id is required' });
    }

    const profile = getProfile(profile_id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Determine authority phone number
    const authorityPhone = authority_phone_override || profile.authority_phone ||
      process.env.DEFAULT_TROCHIA_NUMBER || process.env.DEFAULT_DIMOTIKI_NUMBER;

    if (!authorityPhone) {
      return res.status(400).json({
        error: 'No authority phone number configured. Please set up an authority phone number in your profile.'
      });
    }

    // Safety check: Block emergency numbers
    if (isBlockedNumber(authorityPhone)) {
      return res.status(403).json({
        error: 'Cannot call emergency services (100, 166, 199, 112) for parking violations. Please use the local Τροχαία or Δημοτική Αστυνομία number.'
      });
    }

    // Validate license plate format if provided
    if (vehicle_plate && !isValidGreekPlate(vehicle_plate)) {
      return res.status(400).json({
        error: 'Invalid license plate format. Greek plates should be 3 letters + 4 digits (e.g., ΑΒΓ 1234)'
      });
    }

    // Rate limiting: Check daily call count
    const dailyCount = getDailyCallCount(profile_id);
    if (dailyCount >= MAX_DAILY_CALLS) {
      return res.status(429).json({
        error: `Daily limit reached. Maximum ${MAX_DAILY_CALLS} calls per day allowed.`,
        calls_today: dailyCount,
        limit: MAX_DAILY_CALLS
      });
    }

    // Create call record
    const reportId = uuidv4();
    const callRecord = createCall({
      id: reportId,
      profile_id: profile_id,
      authority_number: authorityPhone,
      authority_type: profile.preferred_authority || 'trochia',
      vehicle_plate: vehicle_plate?.trim() || null,
      vehicle_color: vehicle_color?.trim() || null,
      vehicle_make_model: vehicle_make_model?.trim() || null
    });

    // Prepare profile with authority phone for the call
    const callProfile = {
      ...profile,
      authority_phone: authorityPhone
    };

    // Prepare vehicle details
    const vehicleDetails = {
      plate: vehicle_plate?.trim() || null,
      color: vehicle_color?.trim() || null,
      make_model: vehicle_make_model?.trim() || null
    };

    // Initiate the call
    let callResult;
    try {
      callResult = await initiateCall(callProfile, vehicleDetails, reportId);
    } catch (callError) {
      // Update call record with failure
      updateCallStatus(reportId, 'failed', callError.message);

      return res.status(500).json({
        error: 'Failed to initiate call',
        details: callError.message,
        report_id: reportId
      });
    }

    // Update call record with Bland.ai call ID
    if (callResult.call_id) {
      updateCallBlandId(reportId, callResult.call_id, 'in_progress');
    }

    // Increment daily call count
    incrementDailyCallCount(profile_id);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Report submitted and call initiated',
      report_id: reportId,
      call_id: callResult.call_id,
      status: callResult.status,
      mock: callResult.mock || false,
      calls_today: dailyCount + 1,
      calls_remaining: MAX_DAILY_CALLS - dailyCount - 1
    });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

/**
 * GET /api/report/preview
 * Preview the script that would be used for a call
 */
router.get('/preview', (req, res) => {
  try {
    const { profile_id, vehicle_plate, vehicle_color, vehicle_make_model } = req.query;

    if (!profile_id) {
      return res.status(400).json({ error: 'profile_id is required' });
    }

    const profile = getProfile(profile_id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { generateVoiceScript } = require('../services/voiceScript');

    const vehicleDetails = {
      plate: vehicle_plate || null,
      color: vehicle_color || null,
      make_model: vehicle_make_model || null
    };

    const script = generateVoiceScript(profile, vehicleDetails);

    res.json({
      profile_id: profile_id,
      script: script.fullScript,
      conversation_flow: script.conversationFlow
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate script preview' });
  }
});

/**
 * GET /api/report/limits
 * Get current rate limit status for a profile
 */
router.get('/limits', (req, res) => {
  try {
    const { profile_id } = req.query;

    if (!profile_id) {
      return res.status(400).json({ error: 'profile_id is required' });
    }

    const dailyCount = getDailyCallCount(profile_id);

    res.json({
      profile_id: profile_id,
      calls_today: dailyCount,
      limit: MAX_DAILY_CALLS,
      calls_remaining: Math.max(0, MAX_DAILY_CALLS - dailyCount),
      can_make_call: dailyCount < MAX_DAILY_CALLS
    });
  } catch (error) {
    console.error('Error getting limits:', error);
    res.status(500).json({ error: 'Failed to get rate limits' });
  }
});

module.exports = router;
