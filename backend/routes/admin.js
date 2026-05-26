const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, resetPassword, deleteUser, getAuditLogs, getAdminStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('super_admin'));
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/reset-password', resetPassword);
router.delete('/users/:id', deleteUser);
router.get('/audit-logs', getAuditLogs);
router.get('/stats', getAdminStats);

module.exports = router;
