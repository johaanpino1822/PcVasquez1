const axios = require('axios');
const Order = require('../models/Order');

// Configuración de Wompi
const WOMPI_ENDPOINT = process.env.WOMPI_ENVIRONMENT === 'production' 
  ? 'https://production.wompi.co/v1/transactions' 
  : 'https://sandbox.wompi.co/v1/transactions';

exports.processWompiPayment = async (req, res) => {
  try {
    const { orderId, amountInCents, customerEmail, redirectUrl } = req.body;

    // 1. Verificar que la orden exista
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // 2. Preparar datos para Wompi
    const wompiRequest = {
      amount_in_cents: amountInCents,
      currency: 'COP',
      customer_email: customerEmail,
      payment_method: {
        type: 'CARD',
        installments: 1
      },
      reference: `ORDEN_${orderId}`,
      redirect_url: redirectUrl,
      metadata: {
        orderId: orderId,
        internalReference: order._id.toString()
      }
    };

    // 3. Hacer la petición a Wompi
    const response = await axios.post(WOMPI_ENDPOINT, wompiRequest, {
      headers: {
        'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 4. Actualizar la orden con la referencia de pago
    order.paymentReference = response.data.data.id;
    await order.save();

    // 5. Responder con la URL de redirección
    res.json({
      success: true,
      paymentUrl: response.data.data.redirect_url
    });

  } catch (error) {
    console.error('Error en Wompi Integration:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Error al procesar el pago',
      details: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Ocurrió un error al procesar tu pago'
    });
  }
};

exports.handleWompiWebhook = async (req, res) => {
  try {
    const event = req.body;
    const signature = req.headers['x-signature'];

    // 1. Validar firma del webhook
    if (!validateWompiSignature(signature, event)) {
      return res.status(403).json({ error: 'Firma no válida' });
    }

    // 2. Procesar diferentes tipos de eventos
    switch (event.event) {
      case 'transaction.updated':
        await processTransactionUpdate(event.data);
        break;
      // ... otros casos de eventos
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};

function validateWompiSignature(signature, payload) {
  // Implementar validación de firma según documentación de Wompi
  return true; // Temporal para desarrollo
}

async function processTransactionUpdate(transaction) {
  const order = await Order.findOne({ 
    paymentReference: transaction.id 
  });

  if (!order) return;

  switch (transaction.status) {
    case 'APPROVED':
      order.paymentStatus = 'completed';
      order.status = 'processing';
      break;
    case 'DECLINED':
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      break;
    case 'VOIDED':
      order.paymentStatus = 'refunded';
      break;
  }

  await order.save();
}