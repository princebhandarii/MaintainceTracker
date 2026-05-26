const Payment = require('../models/Payment');
const Flat = require('../models/Flat');
const AuditLog = require('../models/AuditLog');

// Get all payments for a wing/flat/year
exports.getPayments = async (req, res) => {
  try {
    const { wing, flatNumber, year, month, status } = req.query;
    let filter = { isDeleted: false };
    if (wing) filter.wing = wing;
    if (flatNumber) filter.flatNumber = flatNumber;
    if (year) filter.year = parseInt(year);
    if (month) filter.month = parseInt(month);
    if (status) filter.status = status;

    // Wing admin can only see their wing
    if (req.user.role === 'wing_admin') filter.wing = req.user.wing;

    const payments = await Payment.find(filter).populate('notes').sort({ month: 1 });
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment for specific flat+month+year
exports.getPaymentByFlatMonth = async (req, res) => {
  try {
    const { flatId, year, month } = req.params;
    const payment = await Payment.findOne({
      flat: flatId, year: parseInt(year), month: parseInt(month), isDeleted: false
    }).populate('notes');
    res.json({ success: true, data: payment || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create or update payment (with history tracking)
exports.upsertPayment = async (req, res) => {
  try {
    const { flatId, year, month } = req.params;
    const { status, amount, paymentDate, paymentMode, remarks } = req.body;

    const flat = await Flat.findById(flatId);
    if (!flat) return res.status(404).json({ success: false, message: 'Flat not found' });

    let payment = await Payment.findOne({ flat: flatId, year: parseInt(year), month: parseInt(month) });

    if (payment) {
      // Push current state to history before updating
      payment.history.push({
        status: payment.status,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMode: payment.paymentMode,
        remarks: payment.remarks,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        updatedAt: new Date(),
        action: 'updated'
      });

      payment.status = status || payment.status;
      payment.amount = amount !== undefined ? amount : payment.amount;
      payment.paymentDate = paymentDate || payment.paymentDate;
      payment.paymentMode = paymentMode || payment.paymentMode;
      payment.remarks = remarks !== undefined ? remarks : payment.remarks;
      payment.updatedAt = new Date();

      await payment.save();

      await AuditLog.create({
        action: 'UPDATE_PAYMENT',
        entity: 'Payment',
        entityId: payment._id,
        description: `Updated payment for flat ${flat.flatNumber} - ${getMonthName(parseInt(month))} ${year}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        performedByRole: req.user.role
      });

      res.json({ success: true, data: payment, message: 'Payment updated' });
    } else {
      // Create new payment
      payment = await Payment.create({
        flat: flatId,
        flatNumber: flat.flatNumber,
        wing: flat.wing,
        year: parseInt(year),
        month: parseInt(month),
        status: status || 'unpaid',
        amount: amount || flat.monthlyAmount,
        paymentDate: paymentDate || null,
        paymentMode: paymentMode || 'cash',
        remarks: remarks || '',
        createdBy: req.user._id,
        createdByName: req.user.name,
        history: [{
          status: status || 'unpaid',
          amount: amount || flat.monthlyAmount,
          paymentDate: paymentDate || null,
          paymentMode: paymentMode || 'cash',
          remarks: remarks || '',
          updatedBy: req.user._id,
          updatedByName: req.user.name,
          action: 'created'
        }]
      });

      await AuditLog.create({
        action: 'CREATE_PAYMENT',
        entity: 'Payment',
        entityId: payment._id,
        description: `Created payment for flat ${flat.flatNumber} - ${getMonthName(parseInt(month))} ${year}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        performedByRole: req.user.role
      });

      res.status(201).json({ success: true, data: payment, message: 'Payment created' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete payment
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.history.push({
      status: payment.status,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMode: payment.paymentMode,
      remarks: payment.remarks,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      action: 'deleted'
    });

    payment.isDeleted = true;
    payment.deletedAt = new Date();
    payment.deletedBy = req.user._id;
    payment.deletedByName = req.user.name;
    await payment.save();

    await AuditLog.create({
      action: 'DELETE_PAYMENT',
      entity: 'Payment',
      entityId: payment._id,
      description: `Deleted payment for flat ${payment.flatNumber}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role
    });

    res.json({ success: true, message: 'Payment moved to trash' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get dashboard stats for a wing/year
exports.getDashboardStats = async (req, res) => {
  try {
    const { wing, year } = req.query;
    const currentYear = parseInt(year) || new Date().getFullYear();
    let wingFilter = {};
    if (req.user.role === 'wing_admin') wingFilter.wing = req.user.wing;
    else if (wing) wingFilter.wing = wing;

    const flats = await Flat.find({ ...wingFilter, isDeleted: false });
    const totalFlats = flats.length;
    const totalPossiblePayments = totalFlats * 12;

    const payments = await Payment.find({
      ...wingFilter, year: currentYear, isDeleted: false
    });

    const paidPayments = payments.filter(p => p.status === 'paid');
    const unpaidPayments = payments.filter(p => p.status === 'unpaid');
    const overduePayments = payments.filter(p => p.status === 'overdue');

    const totalCollected = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPending = [...unpaidPayments, ...overduePayments].reduce((sum, p) => sum + (p.amount || 0), 0);

    // Monthly collection chart data
    const monthlyData = [];
    for (let m = 1; m <= 12; m++) {
      const monthPayments = paidPayments.filter(p => p.month === m);
      monthlyData.push({
        month: getMonthName(m),
        collected: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        count: monthPayments.length
      });
    }

    res.json({
      success: true,
      data: {
        totalFlats,
        totalCollected,
        totalPending,
        paidCount: paidPayments.length,
        unpaidCount: unpaidPayments.length,
        overdueCount: overduePayments.length,
        totalPaymentsRecorded: payments.length,
        monthlyData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get overdue payments
exports.getOverduePayments = async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    let filter = { isDeleted: false };
    if (req.user.role === 'wing_admin') filter.wing = req.user.wing;

    // Mark overdue: unpaid from previous months
    await Payment.updateMany(
      { status: 'unpaid', year: currentYear, month: { $lt: currentMonth }, isDeleted: false, ...filter },
      { status: 'overdue' }
    );
    await Payment.updateMany(
      { status: 'unpaid', year: { $lt: currentYear }, isDeleted: false, ...filter },
      { status: 'overdue' }
    );

    const overduePayments = await Payment.find({ ...filter, status: 'overdue' }).sort({ year: -1, month: -1 });
    res.json({ success: true, count: overduePayments.length, data: overduePayments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function getMonthName(month) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[month - 1];
}
