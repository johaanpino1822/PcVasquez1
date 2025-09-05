const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order');

// Función para validar el payload de pago
function validatePaymentData(paymentMethod, order) {
  const errors = [];
  
  // Validar método de pago
  const validMethods = ['CARD', 'NEQUI', 'PSE', 'BANCOLOMBIA_TRANSFER', 'DAVIPLATA'];
  if (!validMethods.includes(paymentMethod.type)) {
    errors.push('Método de pago no soportado');
  }

  // Validaciones específicas para tarjetas
  if (paymentMethod.type === 'CARD') {
    if (!paymentMethod.token || !/^tok_(test|live)_[a-zA-Z0-9_]{16,}$/.test(paymentMethod.token)) {
      errors.push('Token de pago inválido para tarjeta');
    }
    if (paymentMethod.installments && (paymentMethod.installments < 1 || paymentMethod.installments > 36)) {
      errors.push('Número de cuotas inválido');
    }
  }

  // Validar datos del cliente
  if (!order.customerInfo.email || !/^\S+@\S+\.\S+$/.test(order.customerInfo.email)) {
    errors.push('Email del cliente inválido');
  }

  if (!order.customerInfo.phone || !/^\d{10,12}$/.test(order.customerInfo.phone.replace(/\D/g, ''))) {
    errors.push('Teléfono debe tener entre 10 y 12 dígitos');
  }

  if (!order.customerInfo.legal_id || !/^\d{6,12}$/.test(order.customerInfo.legal_id)) {
    errors.push('Documento debe tener entre 6 y 12 dígitos');
  }

  return errors;
}

// Función para generar firma de integridad
function generateWompiSignature(reference, amount, currency) {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) throw new Error('WOMPI_INTEGRITY_SECRET no configurado');
  
  const data = `${reference}${amount}${currency}${secret}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

exports.createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    
    // Validar datos de entrada
    if (!orderId || !paymentMethod || !paymentMethod.type) {
      return res.status(400).json({
        success: false,
        error: 'Datos de pago incompletos'
      });
    }

    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Orden no encontrada' 
      });
    }

    // Validar datos del pago
    const validationErrors = validatePaymentData(paymentMethod, order);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }

    // Preparar datos para Wompi
    const amountInCents = Math.round(order.total * 100);
    const reference = `ORD-${order._id}-${Date.now()}`;
    const phoneNumber = order.customerInfo.phone.replace(/\D/g, '');
    
    const transactionData = {
      amount_in_cents: amountInCents,
      currency: 'COP',
      customer_email: order.customerInfo.email.toLowerCase().trim(),
      payment_method: {
        type: paymentMethod.type,
        installments: paymentMethod.installments || 1,
        token: paymentMethod.token?.trim(),
        payment_source_id: null
      },
      reference: reference,
      redirect_url: `${process.env.FRONTEND_URL}/order/${order._id}`,
      customer_data: {
        full_name: order.customerInfo.name.trim(),
        phone_number: phoneNumber.startsWith('57') ? phoneNumber.substring(2) : phoneNumber, // Eliminar código país
        email: order.customerInfo.email.toLowerCase().trim(),
        legal_id: order.customerInfo.legal_id.toString(),
        legal_id_type: order.customerInfo.legal_id_type || 'CC'
      },
      acceptance_token: process.env.WOMPI_ACCEPTANCE_TOKEN,
      signature: generateWompiSignature(reference, amountInCents, 'COP') // Firma de integridad
    };

    console.log('Payload para Wompi:', {
      ...transactionData,
      payment_method: {
        ...transactionData.payment_method,
        token: transactionData.payment_method.token ? '***REDACTED***' : null
      }
    });

    // Crear transacción en Wompi (PRODUCCIÓN)
    const response = await axios.post(
      `${process.env.WOMPI_API_URL}/transactions`, // URL de producción
      transactionData, 
      {
        headers: {
          'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    // Validar respuesta de Wompi
    if (!response.data?.data?.id) {
      throw new Error('Respuesta inválida de Wompi');
    }

    // Actualizar orden
    order.paymentDetails = {
      wompiId: response.data.data.id,
      status: response.data.data.status,
      paymentMethod: paymentMethod.type,
      reference: transactionData.reference,
      paymentLink: response.data.data.payment_link || response.data.data.redirect_url,
      amount_in_cents: transactionData.amount_in_cents,
      currency: transactionData.currency,
      customer_email: transactionData.customer_email,
      paymentData: {
        ...transactionData.payment_method,
        token: '***REDACTED***'
      }
    };
    
    order.paymentStatus = 'pending';
    await order.save();

    res.json({ 
      success: true,
      transaction: response.data.data,
      paymentLink: response.data.data.payment_link || response.data.data.redirect_url
    });

  } catch (error) {
    console.error('Error en pago Wompi:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    let errorDetails = 'Error al procesar pago';
    const wompiError = error.response?.data?.error;
    
    if (wompiError?.messages) {
      errorDetails = Object.entries(wompiError.messages)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('; ');
    } else if (wompiError?.message) {
      errorDetails = wompiError.message;
    } else if (error.response?.data?.details) {
      errorDetails = error.response.data.details.join(', ');
    }

    res.status(error.response?.status || 500).json({ 
      success: false,
      error: errorDetails,
      details: error.response?.data || error.message
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const event = req.body;
    const signature = req.headers['x-signature'];
    
    // Validar firma del webhook
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WOMPI_EVENT_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.warn('Intento de webhook no autorizado');
      return res.status(403).send('Firma inválida');
    }

    // Procesar evento
    const transaction = event.data.transaction;
    const order = await Order.findOne({ 
      'paymentDetails.reference': transaction.reference 
    });

    if (!order) {
      return res.status(404).send('Orden no encontrada');
    }

    // Actualizar estado del pago
    order.paymentDetails.status = transaction.status;
    order.paymentDetails.processedAt = new Date();
    order.paymentDetails.transactionResponse = transaction;
    
    if (transaction.status === 'APPROVED') {
      order.status = 'processing';
      order.paymentStatus = 'completed';
      order.paymentDetails.receiptUrl = transaction.receipt_url || transaction.payment_link;
    } else if (transaction.status === 'DECLINED') {
      order.status = 'cancelled';
      order.paymentStatus = 'failed';
    } else if (transaction.status === 'VOIDED') {
      order.status = 'cancelled';
      order.paymentStatus = 'refunded';
    }
    
    await order.save();
    res.status(200).send('OK');

  } catch (error) {
    console.error('Error en webhook Wompi:', error);
    res.status(500).send('Error processing webhook');
  }
};

exports.checkPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere ID de transacción'
      });
    }

    const response = await axios.get(
      `${process.env.WOMPI_API_URL}/transactions/${transactionId}`, // URL de producción
      {
        headers: {
          'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`
        },
        timeout: 10000
      }
    );

    if (!response.data?.data) {
      throw new Error('Respuesta inválida de Wompi');
    }

    res.json({
      success: true,
      transaction: response.data.data
    });

  } catch (error) {
    console.error('Error verificando estado:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Error al verificar estado de pago',
      details: error.response?.data || error.message
    });
  }
};