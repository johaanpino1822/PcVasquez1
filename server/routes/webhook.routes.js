const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// Middleware para recibir el body crudo de Wompi
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['x-event-checksum'];
      if (!signature) {
        return res.status(400).json({
          success: false,
          error: 'Firma no presente',
          code: 'MISSING_SIGNATURE',
        });
      }

      // Body crudo que Wompi envió
      const rawBody = req.body.toString('utf8');

      // Crear hash SHA256 con tu INTEGRITY_SECRET
      const hash = crypto
        .createHmac('sha256', process.env.WOMPI_INTEGRITY_SECRET)
        .update(rawBody)
        .digest('hex');

      // Verificar firma
      if (hash !== signature) {
        console.error('❌ Firma inválida. Calculado:', hash, 'Recibido:', signature);
        return res.status(400).json({
          success: false,
          error: 'Firma inválida',
          code: 'INVALID_SIGNATURE',
        });
      }

      // Si todo OK, parseamos el JSON
      const event = JSON.parse(rawBody);
      console.log('✅ Evento recibido de Wompi:', JSON.stringify(event, null, 2));

      // Aquí actualizas tu orden según el evento
      // Ejemplo: si es transaction.updated y está aprobada
      if (event.event === 'transaction.updated' && event.data.transaction.status === 'APPROVED') {
        const reference = event.data.transaction.reference;
        console.log(`🔄 Actualizando orden con referencia: ${reference}`);

        // TODO: Busca tu orden por referencia y márcala como pagada
        // await Order.findOneAndUpdate({ orderNumber: reference }, { status: 'paid' });
      }

      res.status(200).json({ success: true, received: true });
    } catch (err) {
      console.error('❌ Error en webhook:', err);
      res.status(500).json({
        success: false,
        error: 'Error procesando webhook',
        details: err.message,
      });
    }
  }
);

module.exports = router;
