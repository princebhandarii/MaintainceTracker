const express = require('express');
const router = express.Router();
const { getPayments, getPaymentByFlatMonth, upsertPayment, deletePayment, getDashboardStats, getOverduePayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getPayments);
router.get('/stats', getDashboardStats);
router.get('/overdue', getOverduePayments);
router.get('/:flatId/:year/:month', getPaymentByFlatMonth);
router.put('/:flatId/:year/:month', upsertPayment);
router.delete('/:id', deletePayment);

module.exports = router;
