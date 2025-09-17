const express = require('express');
const router = express.Router();
const {
  processWompiPayment,
  handleWompiWebhook
} = require('../controllers/payment.Controller');
const { protect } = require('../middleware/authmiddleware');

router.post('/wompi', protect, processWompiPayment);
router.post('/wompi/webhook', handleWompiWebhook);

module.exports = router;