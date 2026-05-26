const Payment = require('../models/Payment');
const Flat = require('../models/Flat');
const AuditLog = require('../models/AuditLog');

exports.getTrash = async (req, res) => {
  try {
    const payments = await Payment.find({ isDeleted: true }).sort({ deletedAt: -1 });
    const flats = await Flat.find({ isDeleted: true }).sort({ deletedAt: -1 });
    res.json({ success: true, data: { payments, flats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.restorePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null, deletedBy: null },
      { new: true }
    );
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.history.push({
      status: payment.status,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMode: payment.paymentMode,
      remarks: payment.remarks,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      action: 'restored'
    });
    await payment.save();

    await AuditLog.create({
      action: 'RESTORE_PAYMENT',
      entity: 'Payment',
      entityId: payment._id,
      description: `Restored payment for flat ${payment.flatNumber}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role
    });

    res.json({ success: true, data: payment, message: 'Payment restored' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.permanentDelete = async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Payment permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
