/**
 * Bland.ai Voice Call Service
 *
 * Handles integration with Bland.ai API for making AI voice calls
 */

const axios = require('axios');
const { generateBlandTask } = require('./voiceScript');
const { isBlockedNumber } = require('../utils/greekHelpers');

const BLAND_API_URL = 'https://api.bland.ai/v1';

/**
 * Make an AI voice call using Bland.ai
 */
async function initiateCall(profile, vehicleDetails, reportId) {
  // Safety check: Don't call emergency numbers
  if (isBlockedNumber(profile.authority_phone)) {
    throw new Error('BLOCKED_NUMBER: Cannot call emergency services for parking violations');
  }

  const apiKey = process.env.BLAND_API_KEY;

  if (!apiKey) {
    throw new Error('BLAND_API_KEY is not configured');
  }

  // Check if we're in mock mode
  if (process.env.MOCK_CALLS === 'true') {
    return mockCall(profile, vehicleDetails, reportId);
  }

  const task = generateBlandTask(profile, vehicleDetails);
  const webhookUrl = process.env.WEBHOOK_BASE_URL
    ? `${process.env.WEBHOOK_BASE_URL}/api/webhook/call-complete`
    : null;

  const requestBody = {
    phone_number: profile.authority_phone,
    task: task,
    voice: 'nat', // Natural sounding voice
    language: 'el', // Greek
    max_duration: 300, // 5 minutes max
    record: true,
    wait_for_greeting: true,

    // Voice settings for natural speech
    voice_settings: {
      speed: 0.9, // Slightly slower for natural pace
      stability: 0.6, // Some variation for natural sound
      similarity_boost: 0.75
    },

    // Conversation settings
    interruption_threshold: 100, // Allow natural interruptions
    temperature: 0.7, // Some creativity in responses

    // Make it conversational
    model: 'enhanced', // Use enhanced model if available

    // Add natural pauses
    pronunciation_guide: {
      'εεε': 'ehh',
      'λοιπόν': 'lipón',
      'δηλαδή': 'dhiladhí'
    },

    metadata: {
      report_id: reportId,
      profile_id: profile.id,
      authority_type: profile.preferred_authority
    }
  };

  // Add webhook if configured
  if (webhookUrl) {
    requestBody.webhook = webhookUrl;
  }

  try {
    const response = await axios.post(
      `${BLAND_API_URL}/calls`,
      requestBody,
      {
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    return {
      success: true,
      call_id: response.data.call_id,
      status: response.data.status || 'initiated',
      message: 'Call initiated successfully'
    };
  } catch (error) {
    console.error('Bland.ai API Error:', error.response?.data || error.message);

    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to initiate call with Bland.ai'
    );
  }
}

/**
 * Get call status from Bland.ai
 */
async function getCallStatus(callId) {
  const apiKey = process.env.BLAND_API_KEY;

  if (!apiKey) {
    throw new Error('BLAND_API_KEY is not configured');
  }

  if (process.env.MOCK_CALLS === 'true') {
    return mockCallStatus(callId);
  }

  try {
    const response = await axios.get(
      `${BLAND_API_URL}/calls/${callId}`,
      {
        headers: {
          'Authorization': apiKey
        },
        timeout: 10000
      }
    );

    return {
      call_id: callId,
      status: response.data.status,
      duration: response.data.call_length,
      transcript: response.data.transcript,
      recording_url: response.data.recording_url,
      completed: response.data.completed,
      outcome: determineOutcome(response.data)
    };
  } catch (error) {
    console.error('Bland.ai Status Error:', error.response?.data || error.message);
    throw new Error('Failed to get call status from Bland.ai');
  }
}

/**
 * Get call transcript from Bland.ai
 */
async function getCallTranscript(callId) {
  const apiKey = process.env.BLAND_API_KEY;

  if (!apiKey) {
    throw new Error('BLAND_API_KEY is not configured');
  }

  if (process.env.MOCK_CALLS === 'true') {
    return mockTranscript(callId);
  }

  try {
    const response = await axios.get(
      `${BLAND_API_URL}/calls/${callId}/transcript`,
      {
        headers: {
          'Authorization': apiKey
        },
        timeout: 10000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Bland.ai Transcript Error:', error.response?.data || error.message);
    throw new Error('Failed to get call transcript');
  }
}

/**
 * Cancel an ongoing call
 */
async function cancelCall(callId) {
  const apiKey = process.env.BLAND_API_KEY;

  if (!apiKey) {
    throw new Error('BLAND_API_KEY is not configured');
  }

  if (process.env.MOCK_CALLS === 'true') {
    return { success: true, message: 'Mock call cancelled' };
  }

  try {
    const response = await axios.post(
      `${BLAND_API_URL}/calls/${callId}/stop`,
      {},
      {
        headers: {
          'Authorization': apiKey
        },
        timeout: 10000
      }
    );

    return {
      success: true,
      message: 'Call cancelled successfully'
    };
  } catch (error) {
    console.error('Bland.ai Cancel Error:', error.response?.data || error.message);
    throw new Error('Failed to cancel call');
  }
}

/**
 * Determine call outcome based on response data
 */
function determineOutcome(data) {
  if (!data.completed) {
    return 'in_progress';
  }

  if (data.error || data.status === 'failed') {
    return 'failed';
  }

  if (data.call_length && data.call_length > 30) {
    // Call lasted more than 30 seconds, likely successful
    return 'completed';
  }

  if (data.answered === false || data.voicemail) {
    return 'no_answer';
  }

  return 'completed';
}

// ============== Mock Functions for Development ==============

/**
 * Mock call initiation for development/testing
 */
function mockCall(profile, vehicleDetails, reportId) {
  console.log('=== MOCK CALL INITIATED ===');
  console.log('To:', profile.authority_phone);
  console.log('Profile:', profile.full_name);
  console.log('Address:', profile.address);
  console.log('Report ID:', reportId);
  if (vehicleDetails.plate) {
    console.log('Vehicle Plate:', vehicleDetails.plate);
  }
  console.log('===========================');

  // Generate a mock call ID
  const mockCallId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    success: true,
    call_id: mockCallId,
    status: 'mock_initiated',
    message: 'Mock call initiated (MOCK_CALLS=true)',
    mock: true
  };
}

/**
 * Mock call status for development
 */
function mockCallStatus(callId) {
  return {
    call_id: callId,
    status: 'completed',
    duration: 120,
    transcript: getMockTranscript(),
    recording_url: null,
    completed: true,
    outcome: 'completed',
    mock: true
  };
}

/**
 * Mock transcript for development
 */
function mockTranscript(callId) {
  return {
    call_id: callId,
    transcript: getMockTranscript(),
    mock: true
  };
}

/**
 * Get a realistic mock transcript
 */
function getMockTranscript() {
  return `
[AI]: Καλημέρα, σας καλώ για να αναφέρω παράνομη στάθμευση.
[Operator]: Καλημέρα, Τροχαία Αθηνών.
[AI]: Ονομάζομαι Γιώργος Παπαδόπουλος και το τηλέφωνο επικοινωνίας μου είναι 69 45 12 34 56.
[Operator]: Εντάξει, σας ακούω.
[AI]: Η διεύθυνση είναι Λεωφόρος Αλεξάνδρας 123, Αθήνα. Ένα όχημα έχει παρκάρει μπροστά από την είσοδο του γκαράζ μου και εμποδίζει την είσοδο και έξοδο.
[Operator]: Έχετε τον αριθμό πινακίδας;
[AI]: Οι πινακίδες είναι ΑΒΓ 1234.
[Operator]: Εντάξει, θα στείλουμε περιπολικό. Περιμένετε στην περιοχή;
[AI]: Ναι, θα είμαι εκεί. Ευχαριστώ πολύ για τη βοήθειά σας.
[Operator]: Παρακαλώ. Γεια σας.
[AI]: Γεια σας.
`.trim();
}

module.exports = {
  initiateCall,
  getCallStatus,
  getCallTranscript,
  cancelCall
};
