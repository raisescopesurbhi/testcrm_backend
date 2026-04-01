const mongoose = require('mongoose');

const copyRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  role: {
    type: String,
    enum: ['master', 'copier'],
    required: true,
  },
  accounts: [{
    type: Number,
    required: true,
  }],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
}, {
  timestamps: true,
});
const copyRequestModel = mongoose.model('CopyRequest', copyRequestSchema);

module.exports = copyRequestModel;