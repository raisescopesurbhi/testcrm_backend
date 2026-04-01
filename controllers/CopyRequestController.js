const copyRequestModel = require("../models/user/CopyRequestModel.js");

// Create a new copy trading role request
const createCopyRequestController = async (req, res) => {
  try {
    const { role, accounts, userId } = req.body;

    // Additional validation
    if (!['master', 'copier'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "master" or "copier"' });
    }
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({ message: 'At least one account is required' });
    }

    // Create the request
    const copyRequest = await copyRequestModel.create({
      user: userId,
      role,
      accounts,
    });

    res.status(201).json({ message: 'Request submitted successfully', copyRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
  
  // Get request history for the authenticated user
  const copyRequestHistoryController = async (req, res) => {
    try {
      const { userId, page = 1, limit = 10, status } = req.query;

      // Build query object
      const query = {};
      if (userId) {
        query.user = userId;
      }
      if (status) {
        query.status = status;
      }

      // Convert page and limit to numbers
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      // Calculate skip for pagination
      const skip = (pageNum - 1) * limitNum;

      // Query with pagination and sorting
      const requests = await copyRequestModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user');

      // Get total count for pagination metadata
      const total = await copyRequestModel.countDocuments(query);

      res.status(200).json({
        data:requests,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// update request by id --
const updateCopyRequestStatusController = async (req, res) => {
  try {
    const { id } = req.params; // Get ID from URL parameters
    const { status } = req.body;

    // Validate ID
    if (!id || !require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    // Validate status
    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "Pending", "Approved", or "Rejected"' });
    }

    // Find and update the request status
    const copyRequest = await copyRequestModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!copyRequest) {
      return res.status(404).json({ message: 'Copy request not found' });
    }

    res.status(200).json({ message: 'Status updated successfully', copyRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

  
  module.exports = {
    createCopyRequestController,
    copyRequestHistoryController,
    updateCopyRequestStatusController
  };