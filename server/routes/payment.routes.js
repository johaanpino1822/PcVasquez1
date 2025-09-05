const express = require('express');
const router = express.Router();
const {
  processWompiPayment,
  handleWompiWebhook
} = require('../controllers/payment.Controller');
const { protect } = require('../middleware/authmiddleware');

// Ruta para iniciar pago
router.post('/wompi', protect, processWompiPayment);

// Webhook para recibir actualizaciones de Wompi
router.post('/wompi/webhook', handleWompiWebhook);

module.exports = router;