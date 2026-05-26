const express = require('express');
const router = express.Router();
const {
  getFlats, getFlatWithPayments, getFlatsDashboard,
  createFlat, updateFlat, deleteFlat
} = require('../controllers/flatController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getFlats);
router.get('/dashboard', getFlatsDashboard);
router.get('/:id/payments', getFlatWithPayments);
router.post('/', authorize('super_admin'), createFlat);
// Both roles can update flats (e.g. owner name). Wing access check is inside controller.
router.put('/:id', updateFlat);
router.delete('/:id', authorize('super_admin'), deleteFlat);

module.exports = router;
