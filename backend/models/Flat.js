const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
  wing: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F'], required: true },
  floor: { type: Number, required: true, min: 1, max: 12 },
  flatNumber: { type: String, required: true, unique: true },
  ownerName: { type: String, default: '' },
  contactNumber: { type: String, default: '' },
  monthlyAmount: { type: Number, default: 2000 },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Flat', flatSchema);
