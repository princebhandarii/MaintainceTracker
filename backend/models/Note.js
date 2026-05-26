const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  flat: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
  flatNumber: { type: String, required: true },
  wing: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  noteType: {
    type: String,
    enum: ['general', 'pending_reason', 'admin_comment'],
    default: 'general'
  },
  content: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);
