const axios = require('axios');
const Order = require('../models/Order');

// Procesar pago con Wompi
exports.processWompiPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Crear la transacción en Wompi
    const wompiRequest = {
      amount_in_cents: Math.round(order.total * 100),
      currency: 'COP',
      customer_email: order.shippingInfo.email,
      payment_method: {
        type: 'CARD',
        installments: 1
      },
      reference: order.orderNumber,
      redirect_url: `${process.env.FRONTEND_URL}/order/${order._id}`,
      customer_data: {
        full_name: order.shippingInfo.name,
        phone_number: order.shippingInfo.phone.replace(/\D/g, ''),
        email: order.shippingInfo.email
      }
    };

    const response = await axios.post(
      'https://production.wompi.co/v1/transactions',
      wompiRequest,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Guardar referencia del pago
    order.paymentReference = response.data.data.id;
    await order.save();

    res.json({
      success: true,
      paymentUrl: response.data.data.redirect_url
    });

  } catch (error) {
    console.error('Error en Wompi Integration:', error.message);
    res.status(500).json({
      error: 'Error al procesar el pago',
      details: 'Ocurrió un error al procesar tu pago'
    });
  }
};