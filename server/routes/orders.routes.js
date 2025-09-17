const express = require('express');
const router = express.Router();
const {
  handleWompiWebhook,
  createOrder,
  getAllOrders,
  getOrderById,
  verifyPayment,
  processWompiPayment
} = require('../controllers/order.Controller');
const authMiddleware = require('../middleware/authmiddleware');

// =======================
// ✅ Webhook Wompi (RAW seguro)
// =======================
router.post('/wompi-webhook', (req, res, next) => {
  let data = [];

  req.on('data', (chunk) => data.push(chunk));
  req.on('end', () => {
    try {
      const rawBuffer = Buffer.concat(data);
      req.rawBody = rawBuffer.toString('utf-8'); // siempre definido

      // Intentamos parsear JSON
      try {
        req.body = JSON.parse(req.rawBody);
      } catch {
        req.body = {};
      }

      console.log("📩 Webhook recibido correctamente");
      next();
    } catch (err) {
      console.error("❌ Error procesando raw body:", err);
      return res.status(400).json({ error: "Webhook inválido" });
    }
  });
}, handleWompiWebhook);

// =======================
// 🔐 Rutas protegidas (JSON normal)
// =======================
router.use(express.json());
router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.get('/:id/verify-payment', verifyPayment);
router.post('/process-wompi-payment', processWompiPayment);

module.exports = router;
