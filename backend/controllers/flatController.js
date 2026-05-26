const Flat = require('../models/Flat');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');

// Get all flats for a wing
exports.getFlats = async (req, res) => {
  try {
    const { wing, floor } = req.query;
    let filter = { isDeleted: false };
    if (req.user.role === 'wing_admin') filter.wing = req.user.wing;
    else if (wing) filter.wing = wing;
    if (floor) filter.floor = parseInt(floor);
    const flats = await Flat.find(filter).sort({ wing: 1, floor: 1, flatNumber: 1 });
    res.json({ success: true, count: flats.length, data: flats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get flat with payment summary for year
exports.getFlatWithPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const flat = await Flat.findById(id);
    if (!flat) return res.status(404).json({ success: false, message: 'Flat not found' });

    const payments = await Payment.find({ flat: id, year, isDeleted: false }).populate('notes');
    const paymentMap = {};
    payments.forEach(p => { paymentMap[p.month] = p; });

    const months = [];
    for (let m = 1; m <= 12; m++) {
      months.push({ month: m, payment: paymentMap[m] || null });
    }
    const pendingCount = months.filter(m => !m.payment || m.payment.status !== 'paid').length;
    res.json({ success: true, data: { flat, months, pendingCount, year } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all flats with payment summary (dashboard grid)
exports.getFlatsDashboard = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const { wing } = req.query;
    let filter = { isDeleted: false };
    if (req.user.role === 'wing_admin') filter.wing = req.user.wing;
    else if (wing) filter.wing = wing;

    const flats = await Flat.find(filter).sort({ wing: 1, floor: 1, flatNumber: 1 });
    const payments = await Payment.find({ ...filter, year, isDeleted: false });

    const paymentMap = {};
    payments.forEach(p => {
      if (!paymentMap[p.flatNumber]) paymentMap[p.flatNumber] = {};
      paymentMap[p.flatNumber][p.month] = p.status;
    });

    const result = flats.map(flat => {
      const monthStatuses = {};
      for (let m = 1; m <= 12; m++) {
        monthStatuses[m] = paymentMap[flat.flatNumber]?.[m] || 'no_data';
      }
      const pendingCount = Object.values(monthStatuses)
        .filter(s => s === 'unpaid' || s === 'overdue').length;
      return { ...flat.toObject(), monthStatuses, pendingCount };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create flat (super_admin only — enforced in routes)
exports.createFlat = async (req, res) => {
  try {
    const flat = await Flat.create({ ...req.body, createdBy: req.user._id });
    await AuditLog.create({
      action: 'CREATE_FLAT',
      entity: 'Flat',
      entityId: flat._id,
      description: `Created flat ${flat.flatNumber}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role
    });
    res.status(201).json({ success: true, data: flat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update flat — both roles allowed; wing_admin restricted to own wing
exports.updateFlat = async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) return res.status(404).json({ success: false, message: 'Flat not found' });

    // Wing admin can only edit flats in their own wing
    if (req.user.role === 'wing_admin' && flat.wing !== req.user.wing) {
      return res.status(403).json({ success: false, message: 'Access denied: not your wing' });
    }

    // Wing admins may only update ownerName and contactNumber
    let updateData = req.body;
    if (req.user.role === 'wing_admin') {
      const { ownerName, contactNumber } = req.body;
      updateData = {};
      if (ownerName !== undefined)     updateData.ownerName     = ownerName;
      if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    }

    const updated = await Flat.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete flat (super_admin only — enforced in routes)
exports.deleteFlat = async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) return res.status(404).json({ success: false, message: 'Flat not found' });
    flat.isDeleted = true;
    flat.deletedAt = new Date();
    flat.deletedBy = req.user._id;
    await flat.save();
    res.json({ success: true, message: 'Flat moved to trash' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
