/**
 * Profile Routes
 *
 * Handles user profile CRUD operations
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
  getProfile,
  getAllProfiles,
  createProfile,
  updateProfile,
  deleteProfile
} = require('../database/db');
const { isValidGreekPhone } = require('../utils/greekHelpers');

const router = express.Router();

/**
 * GET /api/profile
 * Get all profiles or a specific profile by ID
 */
router.get('/', (req, res) => {
  try {
    const { id } = req.query;

    if (id) {
      const profile = getProfile(id);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      return res.json(profile);
    }

    const profiles = getAllProfiles();
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * GET /api/profile/:id
 * Get a specific profile by ID
 */
router.get('/:id', (req, res) => {
  try {
    const profile = getProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * POST /api/profile
 * Create a new profile
 */
router.post('/', (req, res) => {
  try {
    const { full_name, address, phone_number, preferred_authority, authority_phone, language } = req.body;

    // Validation
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!phone_number || !phone_number.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!isValidGreekPhone(phone_number)) {
      return res.status(400).json({ error: 'Invalid Greek phone number format' });
    }

    if (authority_phone && !isValidGreekPhone(authority_phone)) {
      return res.status(400).json({ error: 'Invalid authority phone number format' });
    }

    const profile = createProfile({
      id: uuidv4(),
      full_name: full_name.trim(),
      address: address.trim(),
      phone_number: phone_number.trim(),
      preferred_authority: preferred_authority || 'trochia',
      authority_phone: authority_phone?.trim() || null,
      language: language || 'el'
    });

    res.status(201).json(profile);
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

/**
 * PUT /api/profile/:id
 * Update an existing profile
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, address, phone_number, preferred_authority, authority_phone, language } = req.body;

    // Check if profile exists
    const existingProfile = getProfile(id);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Validation
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!phone_number || !phone_number.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!isValidGreekPhone(phone_number)) {
      return res.status(400).json({ error: 'Invalid Greek phone number format' });
    }

    if (authority_phone && !isValidGreekPhone(authority_phone)) {
      return res.status(400).json({ error: 'Invalid authority phone number format' });
    }

    const profile = updateProfile(id, {
      full_name: full_name.trim(),
      address: address.trim(),
      phone_number: phone_number.trim(),
      preferred_authority: preferred_authority || 'trochia',
      authority_phone: authority_phone?.trim() || null,
      language: language || 'el'
    });

    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * DELETE /api/profile/:id
 * Delete a profile
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existingProfile = getProfile(id);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    deleteProfile(id);
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

module.exports = router;
