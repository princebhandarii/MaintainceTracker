const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.get('/', protect, (req, res) => {
  const wings = ['A', 'B', 'C', 'D', 'E', 'F'];
  const available = req.user.role === 'super_admin' ? wings : [req.user.wing];
  res.json({ success: true, data: available });
});

module.exports = router;
