const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema({
  status: String,
  amount: Number,
  paymentDate: Date,
  paymentMode: String,
  remarks: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedByName: String,
  updatedAt: { type: Date, default: Date.now },
  action: { type: String, enum: ['created', 'updated', 'deleted', 'restored'], default: 'updated' }
}, { _id: true });

const paymentSchema = new mongoose.Schema({
  flat: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
  flatNumber: { type: String, required: true },
  wing: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  status: {
    type: String,
    enum: ['paid', 'unpaid', 'overdue'],
    default: 'unpaid'
  },
  amount: { type: Number, default: 0 },
  paymentDate: { type: Date },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'online', 'other'],
    default: 'cash'
  },
  remarks: { type: String, default: '' },
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
  history: [historyEntrySchema],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedByName: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

paymentSchema.index({ flat: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
