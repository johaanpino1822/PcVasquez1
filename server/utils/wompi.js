const axios = require('axios');

const WOMPI_API_URL = process.env.WOMPI_API_URL;
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY;

exports.createPaymentLink = async (orderData) => {
  try {
    const response = await axios.post(`${WOMPI_API_URL}/payment_links`, {
      name: `Orden #${orderData.reference}`,
      description: `Pago para orden ${orderData.reference}`,
      single_use: true,
      currency: 'COP',
      amount_in_cents: orderData.amount * 100,
      collect_shipping: false,
      redirect_url: `${process.env.FRONTEND_URL}/order/${orderData.orderId}`,
      reference: orderData.reference
    }, {
      headers: {
        'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error creating Wompi payment link:', error.response?.data || error.message);
    throw new Error('Error al crear enlace de pago');
  }
};

exports.getTransaction = async (transactionId) => {
  try {
    const response = await axios.get(`${WOMPI_API_URL}/transactions/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching Wompi transaction:', error.response?.data || error.message);
    throw new Error('Error al obtener transacción');
  }
};