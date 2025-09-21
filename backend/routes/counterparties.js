/**
 * Counterparty Routes
 * 
 * This handles all API endpoints for managing business relationships.
 * Think of this as the "business directory" where you manage your 
 * customers and vendors for invoice reconciliation.
 */

const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Counterparty = require('../models/Counterparty');
const MatchingResult = require('../models/MatchingResult');

const router = express.Router();

/**
 * GET /api/counterparties
 * Get all counterparties for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      type, 
      search, 
      page = 1, 
      limit = 50,
      sortBy = 'statistics.lastActivityAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {
      $or: [
        { primaryUserId: req.user.id },
        { linkedUserId: req.user.id }
      ],
      isActive: true
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [counterparties, total] = await Promise.all([
      Counterparty.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('primaryUserId', 'name email')
        .populate('linkedUserId', 'name email'),
      Counterparty.countDocuments(query)
    ]);

    // Calculate summary statistics
    const stats = await Counterparty.getStatsByUser(req.user.id);
    const summary = {
      total,
      linked: stats.find(s => s._id === 'linked')?.count || 0,
      invited: stats.find(s => s._id === 'invited')?.count || 0,
      pending: stats.find(s => s._id === 'pending')?.count || 0,
      unlinked: stats.find(s => s._id === 'unlinked')?.count || 0
    };

    res.json({
      success: true,
      data: {
        counterparties: counterparties.map(cp => cp.toSafeJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching counterparties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch counterparties',
      error: error.message
    });
  }
});

/**
 * GET /api/counterparties/:id
 * Get a specific counterparty by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const counterparty = await Counterparty.findOne({
      _id: req.params.id,
      $or: [
        { primaryUserId: req.user.id },
        { linkedUserId: req.user.id }
      ],
      isActive: true
    })
    .populate('primaryUserId', 'name email')
    .populate('linkedUserId', 'name email');

    if (!counterparty) {
      return res.status(404).json({
        success: false,
        message: 'Counterparty not found'
      });
    }

    // Get recent matching history with this counterparty
    const recentMatches = await MatchingResult.find({
      $or: [
        { company1Name: counterparty.name },
        { company2Name: counterparty.name }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('createdAt statistics');

    res.json({
      success: true,
      data: {
        counterparty: counterparty.toSafeJSON(),
        recentMatches
      }
    });
  } catch (error) {
    console.error('Error fetching counterparty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch counterparty',
      error: error.message
    });
  }
});

/**
 * POST /api/counterparties
 * Create a new counterparty and send invitation
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      type,
      phone,
      notes,
      matchingEnabled = true,
      autoMatchingEnabled = false,
      preferences = {}
    } = req.body;

    // Validate required fields
    if (!name || !email || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and type are required'
      });
    }

    if (!['customer', 'vendor'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "customer" or "vendor"'
      });
    }

    // Check if counterparty already exists for this user
    const existing = await Counterparty.findOne({
      primaryUserId: req.user.id,
      email: email.toLowerCase(),
      isActive: true
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A counterparty with this email already exists'
      });
    }

    // Create new counterparty
    const counterparty = new Counterparty({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      type,
      primaryUserId: req.user.id,
      primaryCompanyName: req.user.companyName || 'Your Company',
      matchingEnabled,
      autoMatchingEnabled,
      preferences: {
        ...preferences,
        currency: preferences.currency || 'AUD',
        dateFormat: preferences.dateFormat || 'DD/MM/YYYY'
      },
      contactInfo: {
        phone: phone?.trim()
      },
      notes: notes?.trim(),
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    });

    // Generate invitation token
    counterparty.generateInvitationToken();

    await counterparty.save();

    // TODO: Send invitation email
    // await emailService.sendCounterpartyInvitation(counterparty);

    console.log(`📧 Invitation sent to ${email} for ${name} (${type})`);

    res.status(201).json({
      success: true,
      message: 'Counterparty invited successfully',
      data: {
        counterparty: counterparty.toSafeJSON(),
        invitationUrl: `${process.env.FRONTEND_URL}/invite/${counterparty.invitationToken}`
      }
    });
  } catch (error) {
    console.error('Error creating counterparty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create counterparty',
      error: error.message
    });
  }
});

/**
 * PUT /api/counterparties/:id
 * Update an existing counterparty
 */
router.put('/:id', async (req, res) => {
  try {
    const counterparty = await Counterparty.findOne({
      _id: req.params.id,
      primaryUserId: req.user.id, // Only the primary user can update
      isActive: true
    });

    if (!counterparty) {
      return res.status(404).json({
        success: false,
        message: 'Counterparty not found or you do not have permission to update it'
      });
    }

    const {
      name,
      phone,
      notes,
      matchingEnabled,
      autoMatchingEnabled,
      preferences,
      permissions,
      tags
    } = req.body;

    // Update allowed fields
    if (name) counterparty.name = name.trim();
    if (phone !== undefined) counterparty.contactInfo.phone = phone?.trim();
    if (notes !== undefined) counterparty.notes = notes?.trim();
    if (matchingEnabled !== undefined) counterparty.matchingEnabled = matchingEnabled;
    if (autoMatchingEnabled !== undefined) counterparty.autoMatchingEnabled = autoMatchingEnabled;
    if (tags) counterparty.tags = tags;

    if (preferences) {
      counterparty.preferences = {
        ...counterparty.preferences.toObject(),
        ...preferences
      };
    }

    if (permissions) {
      counterparty.permissions = {
        ...counterparty.permissions.toObject(),
        ...permissions
      };
    }

    counterparty.lastModifiedBy = req.user.id;
    counterparty.statistics.lastActivityAt = new Date();

    await counterparty.save();

    res.json({
      success: true,
      message: 'Counterparty updated successfully',
      data: {
        counterparty: counterparty.toSafeJSON()
      }
    });
  } catch (error) {
    console.error('Error updating counterparty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update counterparty',
      error: error.message
    });
  }
});

/**
 * DELETE /api/counterparties/:id
 * Soft delete a counterparty
 */
router.delete('/:id', async (req, res) => {
  try {
    const counterparty = await Counterparty.findOne({
      _id: req.params.id,
      primaryUserId: req.user.id, // Only the primary user can delete
      isActive: true
    });

    if (!counterparty) {
      return res.status(404).json({
        success: false,
        message: 'Counterparty not found or you do not have permission to delete it'
      });
    }

    // Soft delete
    counterparty.isActive = false;
    counterparty.deletedAt = new Date();
    counterparty.deletedBy = req.user.id;
    counterparty.status = 'unlinked';

    await counterparty.save();

    res.json({
      success: true,
      message: 'Counterparty removed successfully'
    });
  } catch (error) {
    console.error('Error deleting counterparty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete counterparty',
      error: error.message
    });
  }
});

/**
 * POST /api/counterparties/:id/resend-invitation
 * Resend invitation to a counterparty
 */
router.post('/:id/resend-invitation', async (req, res) => {
  try {
    const counterparty = await Counterparty.findOne({
      _id: req.params.id,
      primaryUserId: req.user.id,
      status: 'invited',
      isActive: true
    });

    if (!counterparty) {
      return res.status(404).json({
        success: false,
        message: 'Counterparty not found or invitation cannot be resent'
      });
    }

    // Generate new invitation token
    counterparty.generateInvitationToken();
    counterparty.lastModifiedBy = req.user.id;

    await counterparty.save();

    // TODO: Send invitation email
    // await emailService.sendCounterpartyInvitation(counterparty);

    console.log(`📧 Invitation resent to ${counterparty.email} for ${counterparty.name}`);

    res.json({
      success: true,
      message: 'Invitation resent successfully',
      data: {
        invitationUrl: `${process.env.FRONTEND_URL}/invite/${counterparty.invitationToken}`,
        expiresAt: counterparty.invitationExpiresAt
      }
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend invitation',
      error: error.message
    });
  }
});

/**
 * GET /api/counterparties/invitation/:token
 * Get counterparty information by invitation token (public route)
 */
router.get('/invitation/:token', async (req, res) => {
  try {
    const counterparty = await Counterparty.findByInvitationToken(req.params.token)
      .populate('primaryUserId', 'name email');

    if (!counterparty) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation token'
      });
    }

    // Return limited information for invitation
    res.json({
      success: true,
      data: {
        invitation: {
          id: counterparty._id,
          name: counterparty.name,
          type: counterparty.type,
          primaryCompany: counterparty.primaryCompanyName,
          primaryUser: {
            name: counterparty.primaryUserId.name,
            email: counterparty.primaryUserId.email
          },
          expiresAt: counterparty.invitationExpiresAt,
          daysUntilExpiry: counterparty.daysUntilExpiry
        }
      }
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation',
      error: error.message
    });
  }
});

/**
 * POST /api/counterparties/invitation/:token/accept
 * Accept a counterparty invitation (requires authentication)
 */
router.post('/invitation/:token/accept', async (req, res) => {
  try {
    const counterparty = await Counterparty.findByInvitationToken(req.params.token);

    if (!counterparty) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation token'
      });
    }

    // Check if user is trying to accept their own invitation
    if (counterparty.primaryUserId.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot accept your own invitation'
      });
    }

    // Accept the invitation
    await counterparty.acceptInvitation(req.user.id);

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        counterparty: counterparty.toSafeJSON()
      }
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation',
      error: error.message
    });
  }
});

/**
 * GET /api/counterparties/stats
 * Get counterparty statistics for the authenticated user
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Counterparty.getStatsByUser(req.user.id);
    
    const summary = {
      total: 0,
      linked: 0,
      invited: 0,
      pending: 0,
      unlinked: 0,
      totalTransactions: 0,
      totalMatches: 0,
      totalAmount: 0,
      averageMatchRate: 0
    };

    let totalTransactions = 0;
    let totalMatches = 0;

    stats.forEach(stat => {
      summary.total += stat.count;
      summary[stat._id] = stat.count;
      summary.totalTransactions += stat.totalTransactions;
      summary.totalMatches += stat.totalMatches;
      summary.totalAmount += stat.totalAmount;
      totalTransactions += stat.totalTransactions;
      totalMatches += stat.totalMatches;
    });

    summary.averageMatchRate = totalTransactions > 0 
      ? (totalMatches / totalTransactions) * 100 
      : 0;

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching counterparty stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/counterparties/search
 * Search counterparties for matching operations
 */
router.get('/search', async (req, res) => {
  try {
    const { q, type, status = 'linked' } = req.query;

    const query = {
      primaryUserId: req.user.id,
      isActive: true,
      status
    };

    if (type) {
      query.type = type;
    }

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const counterparties = await Counterparty.find(query)
      .select('name email type status statistics')
      .sort({ 'statistics.lastActivityAt': -1 })
      .limit(20);

    res.json({
      success: true,
      data: counterparties
    });
  } catch (error) {
    console.error('Error searching counterparties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search counterparties',
      error: error.message
    });
  }
});

/**
 * POST /api/counterparties/:id/update-stats
 * Update counterparty statistics after a matching operation
 * (Internal route used by the matching system)
 */
router.post('/:id/update-stats', async (req, res) => {
  try {
    const { totalTransactions, matches, totalAmount } = req.body;

    const counterparty = await Counterparty.findOne({
      _id: req.params.id,
      $or: [
        { primaryUserId: req.user.id },
        { linkedUserId: req.user.id }
      ],
      isActive: true
    });

    if (!counterparty) {
      return res.status(404).json({
        success: false,
        message: 'Counterparty not found'
      });
    }

    await counterparty.updateMatchingStats(
      totalTransactions || 0,
      matches || 0,
      totalAmount || 0
    );

    res.json({
      success: true,
      message: 'Statistics updated successfully',
      data: {
        statistics: counterparty.statistics
      }
    });
  } catch (error) {
    console.error('Error updating counterparty stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update statistics',
      error: error.message
    });
  }
});

module.exports = router;