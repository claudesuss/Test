/**
 * Calls Routes
 *
 * Handles call history retrieval and call status updates
 */

const express = require('express');
const {
  getCallsByProfile,
  getCallById,
  updateCallStatus,
  updateCallWithTranscript
} = require('../database/db');
const { getCallStatus, getCallTranscript, cancelCall } = require('../services/blandai');

const router = express.Router();

/**
 * GET /api/calls
 * Get call history for a profile
 */
router.get('/', (req, res) => {
  try {
    const { profile_id, limit } = req.query;

    if (!profile_id) {
      return res.status(400).json({ error: 'profile_id is required' });
    }

    const calls = getCallsByProfile(profile_id, parseInt(limit) || 50);
    res.json(calls);
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

/**
 * GET /api/calls/:id
 * Get a specific call by ID
 */
router.get('/:id', (req, res) => {
  try {
    const call = getCallById(req.params.id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    res.json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({ error: 'Failed to fetch call' });
  }
});

/**
 * GET /api/calls/:id/status
 * Get real-time status of a call from Bland.ai
 */
router.get('/:id/status', async (req, res) => {
  try {
    const call = getCallById(req.params.id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (!call.bland_call_id) {
      return res.json({
        call_id: call.id,
        status: call.status,
        outcome: call.outcome,
        message: 'No Bland.ai call ID associated'
      });
    }

    // Get status from Bland.ai
    const status = await getCallStatus(call.bland_call_id);

    // Update local database if call is completed
    if (status.completed && call.status !== 'completed') {
      updateCallWithTranscript(call.id, {
        status: 'completed',
        bland_call_id: call.bland_call_id,
        transcript: status.transcript,
        duration_seconds: status.duration,
        outcome: status.outcome
      });
    }

    res.json({
      call_id: call.id,
      bland_call_id: call.bland_call_id,
      ...status
    });
  } catch (error) {
    console.error('Error getting call status:', error);
    res.status(500).json({ error: 'Failed to get call status' });
  }
});

/**
 * GET /api/calls/:id/transcript
 * Get transcript of a completed call
 */
router.get('/:id/transcript', async (req, res) => {
  try {
    const call = getCallById(req.params.id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Return stored transcript if available
    if (call.transcript) {
      return res.json({
        call_id: call.id,
        transcript: call.transcript
      });
    }

    // Try to get from Bland.ai if we have a call ID
    if (call.bland_call_id) {
      const transcriptData = await getCallTranscript(call.bland_call_id);

      // Store transcript in database
      if (transcriptData.transcript) {
        updateCallWithTranscript(call.id, {
          status: call.status,
          bland_call_id: call.bland_call_id,
          transcript: transcriptData.transcript,
          duration_seconds: call.duration_seconds,
          outcome: call.outcome
        });
      }

      return res.json({
        call_id: call.id,
        transcript: transcriptData.transcript
      });
    }

    res.status(404).json({ error: 'No transcript available for this call' });
  } catch (error) {
    console.error('Error getting transcript:', error);
    res.status(500).json({ error: 'Failed to get transcript' });
  }
});

/**
 * POST /api/calls/:id/cancel
 * Cancel an ongoing call
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const call = getCallById(req.params.id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (call.status === 'completed' || call.status === 'failed' || call.status === 'cancelled') {
      return res.status(400).json({ error: 'Call is already finished' });
    }

    if (call.bland_call_id) {
      await cancelCall(call.bland_call_id);
    }

    updateCallStatus(call.id, 'cancelled', 'Cancelled by user');

    res.json({
      message: 'Call cancelled successfully',
      call_id: call.id
    });
  } catch (error) {
    console.error('Error cancelling call:', error);
    res.status(500).json({ error: 'Failed to cancel call' });
  }
});

module.exports = router;
