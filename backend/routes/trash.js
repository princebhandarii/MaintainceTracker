const express = require('express');
const router = express.Router();
const { getTrash, restorePayment, permanentDelete } = require('../controllers/trashController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('super_admin'));
router.get('/', getTrash);
router.put('/payments/:id/restore', restorePayment);
router.delete('/payments/:id/permanent', permanentDelete);

module.exports = router;
