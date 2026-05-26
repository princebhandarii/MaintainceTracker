const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Payment = require('../models/Payment');
const Flat = require('../models/Flat');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    await AuditLog.create({
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user._id,
      description: `Created user ${user.username} (${user.role})`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role
    });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const logs = await AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await AuditLog.countDocuments();
    res.json({ success: true, data: logs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const wings = ['A', 'B', 'C', 'D', 'E', 'F'];
    const wingStats = [];
    for (const wing of wings) {
      const flats = await Flat.countDocuments({ wing, isDeleted: false });
      const paid = await Payment.countDocuments({ wing, year, status: 'paid', isDeleted: false });
      const unpaid = await Payment.countDocuments({ wing, year, status: 'unpaid', isDeleted: false });
      const overdue = await Payment.countDocuments({ wing, year, status: 'overdue', isDeleted: false });
      const payments = await Payment.find({ wing, year, status: 'paid', isDeleted: false });
      const collected = payments.reduce((s, p) => s + (p.amount || 0), 0);
      wingStats.push({ wing, flats, paid, unpaid, overdue, collected });
    }
    const totalCollected = wingStats.reduce((s, w) => s + w.collected, 0);
    const totalFlats = wingStats.reduce((s, w) => s + w.flats, 0);
    res.json({ success: true, data: { wingStats, totalCollected, totalFlats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
