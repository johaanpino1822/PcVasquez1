const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

// Crear nueva orden con transacción
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderItems, shippingAddress, itemsPrice, shippingPrice, totalPrice, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'El carrito está vacío',
        code: 'EMPTY_CART'
      });
    }

    const requiredFields = {
      name: 'Nombre completo',
      address: 'Dirección',
      city: 'Ciudad',
      phone: 'Teléfono',
      email: 'Email'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !shippingAddress?.[field])
      .map(([_, name]) => name);

    if (missingFields.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Información de envío incompleta',
        missingFields,
        code: 'MISSING_SHIPPING_INFO'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingAddress.email)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Formato de email inválido',
        code: 'INVALID_EMAIL'
      });
    }

    const phoneRegex = /^[0-9]{7,}$/;
    if (!phoneRegex.test(shippingAddress.phone.replace(/\D/g, ''))) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Teléfono inválido (mínimo 7 dígitos)',
        code: 'INVALID_PHONE'
      });
    }

    const productUpdates = [];
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const [index, item] of orderItems.entries()) {
      if (!item.product || !item.quantity || !item.name || !item.price) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `Item ${index + 1} tiene estructura incompleta`,
          itemIndex: index,
          code: 'INVALID_ITEM_STRUCTURE'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `ID de producto inválido en item ${index + 1}`,
          itemIndex: index,
          code: 'INVALID_PRODUCT_ID'
        });
      }

      if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `Cantidad inválida en item ${index + 1}`,
          itemIndex: index,
          code: 'INVALID_QUANTITY'
        });
      }

      if (item.price <= 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `Precio inválido en item ${index + 1}`,
          itemIndex: index,
          code: 'INVALID_PRICE'
        });
      }

      const product = await Product.findById(item.product).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: `Producto no encontrado en item ${index + 1}`,
          itemIndex: index,
          productId: item.product,
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      if (product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para ${product.name}`,
          itemIndex: index,
          productName: product.name,
          available: product.stock,
          requested: item.quantity,
          code: 'INSUFFICIENT_STOCK'
        });
      }

      if (product.price !== item.price) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `El precio del producto ${product.name} ha cambiado`,
          itemIndex: index,
          productName: product.name,
          currentPrice: product.price,
          receivedPrice: item.price,
          code: 'PRICE_MISMATCH'
        });
      }

      calculatedSubtotal += product.price * item.quantity;
      productUpdates.push({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: -item.quantity } }
        }
      });

      validatedItems.push({
        product: item.product,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      });
    }

    const calculatedTotal = calculatedSubtotal + shippingPrice;
    if (calculatedTotal !== totalPrice) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Los totales no coinciden',
        calculatedSubtotal,
        calculatedTotal,
        receivedTotal: totalPrice,
        code: 'TOTAL_MISMATCH'
      });
    }

    const validPaymentMethods = ['credit_card', 'nequi', 'pse', 'cash_on_delivery', 'bancolombia_transfer'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Método de pago no válido',
        validMethods: validPaymentMethods,
        code: 'INVALID_PAYMENT_METHOD'
      });
    }

    const order = new Order({
      user: userId,
      orderNumber: `ORD-${Date.now()}-${uuidv4().substring(0, 4)}`,
      items: validatedItems,
      subtotal: calculatedSubtotal,
      shipping: shippingPrice,
      total: calculatedTotal,
      paymentMethod,
      shippingInfo: {
        name: shippingAddress.name,
        address: shippingAddress.address,
        city: shippingAddress.city,
        phone: shippingAddress.phone,
        email: shippingAddress.email,
        ...(shippingAddress.additionalInfo && { additionalInfo: shippingAddress.additionalInfo })
      },
      status: 'pending',
      paymentStatus: 'pending'
    });

    await Product.bulkWrite(productUpdates, { session });
    const savedOrder = await order.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      order: savedOrder,
      orderNumber: savedOrder.orderNumber
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error al crear orden:', error);
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    const errorResponse = {
      success: false,
      error: 'Error al procesar la orden',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    };
    res.status(statusCode).json(errorResponse);
  } finally {
    session.endSession();
  }
};

// Obtener todas las órdenes con paginación
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: {
        path: 'items.product',
        select: 'name image'
      }
    };

    const orders = await Order.paginate({ user: req.user.id }, options);

    res.status(200).json({
      success: true,
      orders: orders.docs,
      pagination: {
        total: orders.totalDocs,
        pages: orders.totalPages,
        page: orders.page,
        limit: orders.limit
      }
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las órdenes',
      code: 'FETCH_ORDERS_ERROR'
    });
  }
};

// Obtener una orden por ID con verificación de propiedad
const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de orden no válido',
        code: 'INVALID_ORDER_ID'
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Verificar que el usuario sea el dueño de la orden
    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para acceder a esta orden',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la orden',
      code: 'FETCH_ORDER_ERROR'
    });
  }
};

// Webhook Wompi mejorado
const handleWompiWebhook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = req.body;
    if (!event?.data?.transaction?.id) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Estructura de webhook inválida',
        code: 'INVALID_WEBHOOK_STRUCTURE'
      });
    }

    const transaction = event.data.transaction;
    const order = await Order.findOne({
      'paymentDetails.transactionId': transaction.id
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada para esta transacción',
        transactionId: transaction.id,
        code: 'ORDER_NOT_FOUND'
      });
    }

    const statusMap = {
      'APPROVED': { paymentStatus: 'completed', orderStatus: 'processing' },
      'DECLINED': { paymentStatus: 'failed', orderStatus: 'cancelled' },
      'VOIDED': { paymentStatus: 'refunded', orderStatus: 'cancelled' },
      'PENDING': { paymentStatus: 'pending', orderStatus: 'pending' },
      'ERROR': { paymentStatus: 'failed', orderStatus: 'cancelled' }
    };

    const newStatus = statusMap[transaction.status] || statusMap.PENDING;

    const updateData = {
      paymentStatus: newStatus.paymentStatus,
      status: newStatus.orderStatus,
      'paymentDetails.status': transaction.status,
      updatedAt: new Date()
    };

    if (transaction.status === 'APPROVED') {
      updateData.paymentDetails = {
        ...order.paymentDetails,
        transactionId: transaction.id,
        status: transaction.status,
        amount: transaction.amount_in_cents / 100,
        currency: transaction.currency,
        method: transaction.payment_method_type,
        receiptUrl: transaction.receipt_url,
        processedAt: new Date()
      };
    }

    if (['DECLINED', 'VOIDED'].includes(transaction.status)) {
      const productUpdates = order.items.map(item => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: item.quantity } }
        }
      }));
      await Product.bulkWrite(productUpdates, { session });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      { $set: updateData },
      { new: true, session }
    );

    await session.commitTransaction();
    res.status(200).json({ success: true, orderId: updatedOrder._id });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error en webhook Wompi:', error);
    res.status(500).json({
      success: false,
      error: 'Error procesando webhook',
      code: 'WEBHOOK_PROCESSING_ERROR'
    });
  } finally {
    session.endSession();
  }
};

// Exportaciones finales
module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  handleWompiWebhook
};