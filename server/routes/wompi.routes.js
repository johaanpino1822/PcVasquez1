const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

// Función mejorada para obtener el token de aceptación con reintentos (PRODUCCIÓN)
async function getAcceptanceToken(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(
        `https://production.wompi.co/v1/merchants/${process.env.WOMPI_MERCHANT_ID}`, 
        {
          timeout: 5000
        }
      );
      
      if (response.data?.data?.presigned_acceptance?.acceptance_token) {
        return response.data.data.presigned_acceptance.acceptance_token;
      }
    } catch (error) {
      console.error(`Intento ${i + 1} - Error obteniendo acceptance token:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('No se pudo obtener el token de aceptación después de varios intentos');
}

// Función para generar la firma de integridad
function generateSignature(reference, amount, currency) {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) {
    throw new Error('WOMPI_INTEGRITY_SECRET no está configurado en las variables de entorno');
  }
  const data = `${reference}${amount}${currency}${secret}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Validación exhaustiva del payload
function validateWompiPayload(payload) {
  const errors = [];
  const requiredFields = [
    'amount_in_cents', 
    'currency', 
    'customer_email',
    'payment_method',
    'reference'
  ];

  // Validación de campos requeridos
  requiredFields.forEach(field => {
    if (!payload[field]) {
      errors.push(`El campo ${field} es requerido`);
    }
  });

  // Validación de tipos y formatos
  if (payload.amount_in_cents) {
    if (typeof payload.amount_in_cents !== 'number' || payload.amount_in_cents < 1000) {
      errors.push('El monto mínimo es $10 COP (1000 centavos)');
    }
  }

  if (payload.currency && payload.currency !== 'COP') {
    errors.push('La moneda debe ser COP (Peso colombiano)');
  }

  if (payload.customer_email && !/^\S+@\S+\.\S+$/.test(payload.customer_email)) {
    errors.push('El email proporcionado no es válido');
  }

  // Validación de payment_method
  if (payload.payment_method) {
    if (typeof payload.payment_method !== 'object') {
      errors.push('El método de pago no tiene el formato correcto');
    } else {
      if (!payload.payment_method.token || !/^tok_(test|live)_[a-zA-Z0-9_]{16,}$/.test(payload.payment_method.token)) {
        errors.push('Token de pago inválido');
      }
      if (payload.payment_method.installments && (typeof payload.payment_method.installments !== 'number' || payload.payment_method.installments < 1)) {
        errors.push('El número de cuotas debe ser al menos 1');
      }
      if (payload.payment_method.type && payload.payment_method.type !== 'CARD') {
        errors.push('Solo se aceptan pagos con tarjeta (CARD)');
      }
    }
  }

  // Validación de reference
  if (payload.reference && (typeof payload.reference !== 'string' || payload.reference.length < 10)) {
    errors.push('La referencia debe tener al menos 10 caracteres');
  }

  // Validación de customer_data
  if (payload.customer_data) {
    if (typeof payload.customer_data !== 'object') {
      errors.push('Los datos del cliente no tienen el formato correcto');
    } else {
      if (!payload.customer_data.full_name || payload.customer_data.full_name.trim().split(' ').length < 2) {
        errors.push('Nombre completo debe incluir nombre y apellido');
      }
      
      const phoneDigits = payload.customer_data.phone_number ? payload.customer_data.phone_number.replace(/\D/g, '') : '';
      if (!phoneDigits || phoneDigits.length < 10) {
        errors.push('Teléfono debe tener al menos 10 dígitos');
      }
      
      if (!payload.customer_data.legal_id || !/^\d{6,12}$/.test(payload.customer_data.legal_id.toString())) {
        errors.push('Documento debe tener entre 6 y 12 dígitos');
      }
    }
  }

  return errors;
}

// Ruta para crear transacción
router.post('/create-transaction', async (req, res) => {
  try {
    const payload = req.body;

    // Validación exhaustiva del payload
    const validationErrors = validateWompiPayload(payload);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: 'Error de validación',
        details: validationErrors
      });
    }

    // Obtener acceptance token dinámicamente con manejo de errores
    let acceptance_token;
    try {
      acceptance_token = await getAcceptanceToken();
    } catch (error) {
      console.error('Error crítico obteniendo acceptance token:', error);
      return res.status(500).json({
        ok: false,
        error: 'Error interno del servidor',
        details: 'No se pudo obtener el token de aceptación'
      });
    }

    // Generar firma de integridad
    const signature = generateSignature(
      payload.reference,
      payload.amount_in_cents,
      payload.currency
    );

    // Construcción del payload para Wompi
    const wompiPayload = {
      amount_in_cents: Math.round(payload.amount_in_cents),
      currency: payload.currency,
      customer_email: payload.customer_email.toLowerCase().trim(),
      payment_method: {
        type: 'CARD',
        installments: payload.payment_method.installments || 1,
        token: payload.payment_method.token.trim(),
        payment_source_id: null
      },
      reference: payload.reference,
      redirect_url: payload.redirect_url || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${payload.reference.split('-')[1]}`,
      customer_data: {
        full_name: payload.customer_data.full_name.trim(),
        phone_number: payload.customer_data.phone_number.replace(/\D/g, ''),
        email: payload.customer_email.toLowerCase().trim(),
        legal_id_type: payload.customer_data.legal_id_type || 'CC',
        legal_id: payload.customer_data.legal_id.toString()
      },
      acceptance_token: acceptance_token,
      signature: signature // Campo de firma añadido
    };

    // Asegurar formato correcto del teléfono (57 + 10 dígitos)
    if (!wompiPayload.customer_data.phone_number.startsWith('57')) {
      wompiPayload.customer_data.phone_number = '57' + wompiPayload.customer_data.phone_number;
    }

    // Configuración de la petición a Wompi
    const config = {
      headers: {
        'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    };

    // Envío a Wompi (PRODUCCIÓN)
    const response = await axios.post(
      'https://production.wompi.co/v1/transactions',
      wompiPayload,
      config
    );

    // Validación de la respuesta de Wompi
    if (!response.data?.data?.id) {
      throw new Error('Respuesta inválida de Wompi');
    }

    // Respuesta exitosa
    return res.json({
      ok: true,
      data: response.data.data
    });

  } catch (error) {
    console.error('Error en Wompi:', error.message);
    
    // Manejo específico de errores 422 (Unprocessable Entity)
    if (error.response?.status === 422) {
      return res.status(422).json({
        ok: false,
        error: 'Error de validación en Wompi',
        details: error.response.data?.error?.messages || ['Firma inválida o datos incorrectos']
      });
    }

    // Manejo genérico de errores
    return res.status(error.response?.status || 500).json({
      ok: false,
      error: error.message || 'Error al procesar el pago'
    });
  }
});

module.exports = router;