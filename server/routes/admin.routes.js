const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const authMiddleware = require('../middleware/authmiddleware');
const adminMiddleware = require('../middleware/adminmiddleware');
const mongoose = require('mongoose');

/**
 * 📌 Obtener todos los usuarios (solo admin)
 */
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    // Construir filtro
    const filter = {};
    
    // Si hay búsqueda, agregar condiciones
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    // Ejecutar consulta con paginación
    const users = await User.find(filter)
      .select('-password') // Excluir contraseñas
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .exec();

    const count = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: count,
        pages: Math.ceil(count / options.limit),
        page: options.page,
        limit: options.limit
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los usuarios',
      code: 'FETCH_USERS_ERROR'
    });
  }
});

/**
 * 🔧 Actualizar rol de usuario (solo admin)
 */
router.patch('/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;

    // Validar roles permitidos
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rol no válido. Los roles permitidos son: user, admin',
        code: 'INVALID_ROLE'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario no válido',
        code: 'INVALID_USER_ID'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // No permitir que un admin se quite sus propios privilegios
    if (req.user.id === req.params.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'No puedes cambiar tu propio rol de administrador',
        code: 'SELF_ROLE_CHANGE_NOT_ALLOWED'
      });
    }

    // Actualizar rol
    user.role = role;
    await user.save();

    // Devolver usuario sin contraseña
    const userWithoutPassword = await User.findById(req.params.id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Rol de usuario actualizado correctamente',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('❌ Error al actualizar rol de usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el rol del usuario',
      code: 'UPDATE_USER_ROLE_ERROR'
    });
  }
});

/**
 * 🗑️ Eliminar usuario (solo admin) - NUEVA RUTA AÑADIDA
 */
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario no válido',
        code: 'INVALID_USER_ID'
      });
    }

    // No permitir que un admin se elimine a sí mismo
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'No puedes eliminar tu propia cuenta',
        code: 'SELF_DELETION_NOT_ALLOWED'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el usuario',
      code: 'DELETE_USER_ERROR'
    });
  }
});

/**
 * 📌 Obtener estadísticas para el dashboard (solo admin)
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Obtener conteo total de productos
    const productsCount = await Product.countDocuments();
    
    // Obtener conteo total de órdenes
    const ordersCount = await Order.countDocuments();
    
    // Obtener conteo total de usuarios
    const usersCount = await User.countDocuments();
    
    // Calcular ingresos totales (suma de órdenes completadas)
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'completed', 'entregado'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    // Obtener órdenes pendientes
    const pendingOrders = await Order.countDocuments({ 
      status: { $in: ['pending', 'pendiente', 'processing'] } 
    });
    
    // Obtener órdenes completadas
    const completedOrders = await Order.countDocuments({ 
      status: { $in: ['delivered', 'completed', 'entregado'] } 
    });

    res.status(200).json({
      success: true,
      data: {
        products: productsCount,
        orders: ordersCount,
        users: usersCount,
        revenue: revenue,
        pendingOrders: pendingOrders,
        completedOrders: completedOrders
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las estadísticas',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

/**
 * 📌 Obtener órdenes recientes (solo admin)
 */
router.get('/orders/recent', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('items.product', 'name image')
      .exec();

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('❌ Error al obtener órdenes recientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las órdenes recientes',
      code: 'FETCH_RECENT_ORDERS_ERROR'
    });
  }
});

/**
 * 📌 Obtener todas las órdenes (solo admin con paginación y filtros)
 */
router.get('/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Construir filtro
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Si hay búsqueda, agregar condiciones
    if (search) {
      // Buscar usuarios que coincidan con el término de búsqueda
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map(user => user._id);

      // Agregar condiciones de búsqueda
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { _id: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    // Ejecutar consulta con paginación
    const orders = await Order.find(filter)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .populate('user', 'name email')
      .populate('items.product', 'name image')
      .exec();

    const count = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: count,
        pages: Math.ceil(count / options.limit),
        page: options.page,
        limit: options.limit
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener órdenes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las órdenes',
      code: 'FETCH_ORDERS_ERROR'
    });
  }
});

/**
 * 📌 Obtener una orden específica por ID (solo admin)
 */
router.get('/orders/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price image')
      .exec();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('❌ Error al obtener orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la orden',
      code: 'FETCH_ORDER_ERROR'
    });
  }
});

/**
 * 📌 Actualizar estado de una orden (solo admin)
 */
router.patch('/orders/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    // Estados permitidos
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado no válido',
        code: 'INVALID_STATUS'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Actualizar estado
    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Estado actualizado correctamente',
      order
    });
  } catch (error) {
    console.error('❌ Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado',
      code: 'UPDATE_STATUS_ERROR'
    });
  }
});

/**
 * 🗑️ Eliminar una orden (solo admin)
 */
router.delete('/orders/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada',
        code: 'ORDER_NOT_FOUND'
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Orden eliminada correctamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la orden',
      code: 'DELETE_ORDER_ERROR'
    });
  }
});

/**
 * ❌ Cancelar una orden (solo admin)
 */
router.patch('/orders/:id/cancel', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Cambiar estado a cancelado
    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Orden cancelada correctamente',
      order
    });
  } catch (error) {
    console.error('❌ Error al cancelar orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cancelar la orden',
      code: 'CANCEL_ORDER_ERROR'
    });
  }
});

module.exports = router;