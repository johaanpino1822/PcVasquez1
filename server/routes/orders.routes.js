const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getAllOrders,
  getOrderById, // Añadido para obtener orden específica
  handleWompiWebhook 
} = require('../controllers/order.Controller');
const authMiddleware = require('../middleware/authmiddleware');

// Rutas protegidas por autenticación
router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, getAllOrders);
router.get('/:id', authMiddleware, getOrderById); // Nueva ruta para obtener orden por ID

// Webhook (sin autenticación)
router.post('/wompi-webhook', handleWompiWebhook);

module.exports = router;