const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const axios = require("axios");
const crypto = require("crypto");

// ======================= [FUNCIONES PRINCIPALES] =======================

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderItems, shippingAddress, itemsPrice, shippingPrice, totalPrice, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: "El carrito está vacío", code: "EMPTY_CART" });
    }

    const requiredFields = ["name", "address", "city", "phone", "email"];
    const missingFields = requiredFields.filter((f) => !shippingAddress[f]);
    if (missingFields.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "Información de envío incompleta",
        missingFields,
        code: "MISSING_SHIPPING_INFO",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingAddress.email)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: "Formato de email inválido", code: "INVALID_EMAIL" });
    }

    const phoneDigits = shippingAddress.phone.replace(/\D/g, "");
    if (phoneDigits.length < 7) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: "Teléfono inválido", code: "INVALID_PHONE" });
    }

    const productUpdates = [];
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const [i, item] of orderItems.entries()) {
      if (!item.product || !item.quantity || !item.name || !item.price) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `Item ${i + 1} tiene estructura incompleta`,
          code: "INVALID_ITEM_STRUCTURE",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `ID de producto inválido en item ${i + 1}`,
          code: "INVALID_PRODUCT_ID",
        });
      }

      if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `Cantidad inválida en item ${i + 1}`,
          code: "INVALID_QUANTITY",
        });
      }

      const product = await Product.findById(item.product).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: `Producto no encontrado en item ${i + 1}`,
          code: "PRODUCT_NOT_FOUND",
        });
      }

      if (product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para ${product.name}`,
          code: "INSUFFICIENT_STOCK",
        });
      }

      calculatedSubtotal += product.price * item.quantity;
      productUpdates.push({
        updateOne: { filter: { _id: item.product }, update: { $inc: { stock: -item.quantity } } },
      });

      validatedItems.push({
        product: item.product,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });
    }

    const calculatedTotal = calculatedSubtotal + shippingPrice;
    if (calculatedTotal !== totalPrice) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "Los totales no coinciden",
        code: "TOTAL_MISMATCH",
      });
    }

    // GENERAR REFERENCIA CONSISTENTE
    const orderId = new mongoose.Types.ObjectId();
    const timestamp = Date.now();
    const orderNumber = `ORD_${orderId}_${timestamp}`;

    const order = new Order({
      _id: orderId,
      user: userId,
      orderNumber,
      items: validatedItems,
      subtotal: calculatedSubtotal,
      shipping: shippingPrice,
      total: calculatedTotal,
      paymentMethod,
      shippingInfo: shippingAddress,
      status: "pending",
      paymentStatus: "pending",
    });

    await Product.bulkWrite(productUpdates, { session });
    const savedOrder = await order.save({ session });
    await session.commitTransaction();

    res.status(201).json({ success: true, order: savedOrder, orderNumber });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error al crear orden:", error);
    res.status(500).json({ success: false, error: "Error interno", code: "INTERNAL_ERROR" });
  } finally {
    session.endSession();
  }
};

// ======================= [WEBHOOK WOMPI - PRODUCCIÓN] =======================



const handleWompiWebhook = async (req, res) => {
  try {
    // 1️⃣ Validar firma
    const signature = req.headers['x-event-checksum'] || req.headers['x-webhook-signature'];
    if (!signature) {
      console.error("❌ No se encontró firma en headers");
      return res.status(400).json({ success: false, error: "Firma no presente" });
    }

    if (!req.rawBody) {
      console.error("❌ req.rawBody no está definido");
      return res.status(400).json({ success: false, error: "Raw body no presente" });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.WOMPI_EVENT_SECRET)
      .update(req.rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error("❌ Firma inválida");
      return res.status(401).json({ success: false, error: "Firma inválida" });
    }

    console.log("✅ Firma validada correctamente");

    // 2️⃣ Parsear el evento
    const event = JSON.parse(req.rawBody);

    // 3️⃣ Procesar transacción si aplica
    if (event.event === 'transaction.updated' && event.data?.transaction) {
      await processTransactionUpdate(event.data.transaction);
    }

    return res.status(200).json({ success: true, message: "Webhook procesado" });
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    return res.status(500).json({ success: false, error: "Error procesando webhook" });
  }
};

// =======================
// Función para actualizar la orden según transacción Wompi
// =======================
async function processTransactionUpdate(transaction) {
  const orderRef = transaction.reference;

  // Buscar orden por orderNumber o paymentReference
  let order = await Order.findOne({ orderNumber: orderRef }) ||
              await Order.findOne({ paymentReference: orderRef });

  // Intentar extraer ObjectId si no encuentra
  if (!order && orderRef.includes('_')) {
    const parts = orderRef.split('_');
    for (const part of parts) {
      if (part.length === 24 && /^[0-9a-fA-F]+$/.test(part)) {
        order = await Order.findById(part);
        if (order) break;
      }
    }
  }

  if (!order) {
    console.error(`❌ Orden no encontrada para referencia: ${orderRef}`);
    return;
  }

  console.log(`🔄 Actualizando orden ${order.orderNumber} con estado: ${transaction.status}`);

  // Mapear estados Wompi
  const statusMapping = {
    'APPROVED': { paymentStatus: 'completed', orderStatus: 'processing' },
    'DECLINED': { paymentStatus: 'failed', orderStatus: 'cancelled' },
    'VOIDED': { paymentStatus: 'failed', orderStatus: 'cancelled' },
    'ERROR': { paymentStatus: 'failed', orderStatus: 'cancelled' },
    'PENDING': { paymentStatus: 'pending', orderStatus: 'pending' }
  };

  const newStatus = statusMapping[transaction.status];

  if (newStatus) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Restaurar stock si falla
      if (newStatus.paymentStatus === 'failed') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
          }, { session });
        }
      }

      order.paymentStatus = newStatus.paymentStatus;
      order.status = newStatus.orderStatus;

      order.paymentDetails = {
        transactionId: transaction.id,
        status: transaction.status,
        amount: transaction.amount_in_cents / 100,
        currency: transaction.currency,
        method: transaction.payment_method_type,
        receiptUrl: transaction.receipt_url,
        processedAt: new Date(),
        reference: transaction.reference,
        customerEmail: transaction.customer_email,
        customerName: transaction.customer_data?.full_name || order.shippingInfo.name
      };

      await order.save({ session });
      await session.commitTransaction();
      console.log(`✅ Orden ${order.orderNumber} actualizada a: ${newStatus.paymentStatus}`);
    } catch (err) {
      await session.abortTransaction();
      console.error("❌ Error al actualizar orden:", err);
    } finally {
      session.endSession();
    }
  } else {
    console.log(`ℹ️ Estado Wompi no mapeado: ${transaction.status}`);
  }
}

// ======================= [VERIFICAR PAGO - PRODUCCIÓN] =======================

const verifyPayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "ID inválido", code: "INVALID_ORDER_ID" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: "Orden no encontrada", code: "ORDER_NOT_FOUND" });

    console.log(`🔍 Verificando pago para orden: ${order.orderNumber}`);

    // Buscar por múltiples referencias posibles
    const searchReferences = [
      order.orderNumber,
      order.paymentReference,
      order._id.toString()
    ].filter(ref => ref);

    let transactions = [];
    
    for (const ref of searchReferences) {
      try {
        const response = await axios.get(
          `https://production.wompi.co/v1/transactions?reference=${encodeURIComponent(ref)}`,
          {
            headers: { 
              Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000,
          }
        );
        
        if (response.data.data && response.data.data.length > 0) {
          transactions = response.data.data;
          console.log(`✅ Transacciones encontradas con referencia: ${ref}`);
          break;
        }
      } catch (error) {
        console.log(`ℹ️ Búsqueda con referencia ${ref} no arrojó resultados:`, error.message);
      }
    }

    console.log("📊 Transacciones encontradas:", transactions.length);

    const approvedTransaction = transactions.find((t) => t.status === "APPROVED");
    
    if (approvedTransaction) {
      console.log(`✅ Transacción aprobada encontrada: ${approvedTransaction.id}`);
      
      // Actualizar la orden con los datos de la transacción
      await processTransactionUpdate(approvedTransaction);
      
      // Recargar la orden actualizada
      const updatedOrder = await Order.findById(req.params.id);

      return res.status(200).json({
        success: true,
        paymentStatus: updatedOrder.paymentStatus,
        order: updatedOrder,
        message: "Pago verificado y actualizado correctamente",
        transactionStatus: approvedTransaction.status
      });
    }

    console.log(`ℹ️ No se encontraron transacciones para: ${order.orderNumber}`);
    res.status(200).json({
      success: true,
      paymentStatus: order.paymentStatus,
      order,
      message: "No se encontraron transacciones en Wompi",
    });
  } catch (error) {
    console.error("❌ Error al verificar pago:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: "Error interno al verificar pago",
      code: "VERIFY_PAYMENT_ERROR",
      details: error.response?.data || error.message,
    });
  }
};

// ======================= [PROCESAR PAGO WOMPI - PRODUCCIÓN] =======================

const processWompiPayment = async (req, res) => {
  try {
    const { orderId, paymentToken } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Orden no encontrada" });

    const wompiRequest = {
      amount_in_cents: Math.round(order.total * 100),
      currency: "COP",
      customer_email: order.shippingInfo.email,
      payment_method: { 
        type: "CARD", 
        installments: 1,
        token: paymentToken
      },
      reference: order.orderNumber,
      redirect_url: `${process.env.FRONTEND_URL}/order/${order._id}`,
      customer_data: {
        full_name: order.shippingInfo.name,
        phone_number: order.shippingInfo.phone.replace(/\D/g, ""),
        email: order.shippingInfo.email,
      },
      shipping_address: {
        address_line_1: order.shippingInfo.address,
        city: order.shippingInfo.city,
        country: "CO",
        phone_number: order.shippingInfo.phone.replace(/\D/g, ""),
      }
    };

    const response = await axios.post(
      "https://production.wompi.co/v1/transactions",
      wompiRequest,
      { 
        headers: { 
          Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    order.paymentReference = response.data.data.id;
    await order.save();

    res.json({ 
      success: true, 
      paymentUrl: response.data.data.redirect_url,
      transactionId: response.data.data.id
    });
  } catch (error) {
    console.error("Error en Wompi Integration:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: "Error al procesar el pago",
      details: error.response?.data,
      code: "WOMPI_PAYMENT_ERROR"
    });
  }
};

// ======================= [GET ORDENES] =======================

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("items.product", "name image");
    const count = await Order.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      orders,
      pagination: { total: count, pages: Math.ceil(count / limit), page: +page, limit: +limit },
    });
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    res.status(500).json({ success: false, error: "Error interno", code: "FETCH_ORDERS_ERROR" });
  }
};

// ======================= [GET ORDEN POR ID] =======================

const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "ID inválido", code: "INVALID_ORDER_ID" });
    }
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name price image");

    if (!order) return res.status(404).json({ success: false, error: "Orden no encontrada", code: "ORDER_NOT_FOUND" });
    if (order.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ success: false, error: "No autorizado", code: "UNAUTHORIZED_ACCESS" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error al obtener orden:", error);
    res.status(500).json({ success: false, error: "Error interno", code: "FETCH_ORDER_ERROR" });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  processWompiPayment,
  verifyPayment,
  handleWompiWebhook
};