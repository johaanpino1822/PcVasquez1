const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// ✅ Obtener todos los usuarios
const getAllUsers = async (req, res) => {
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
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuarios',
      code: 'FETCH_USERS_ERROR'
    });
  }
};

// 🔧 Actualizar rol de usuario (admin)
const updateUserRole = async (req, res) => {
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
    console.error('Error al actualizar rol de usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el rol del usuario',
      code: 'UPDATE_USER_ROLE_ERROR'
    });
  }
};

// 🗑️ Eliminar usuario (admin) - FUNCIÓN NUEVA AÑADIDA
const deleteUser = async (req, res) => {
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
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el usuario',
      code: 'DELETE_USER_ERROR'
    });
  }
};

// 📊 Obtener estadísticas del dashboard
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalProducts
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error interno al obtener estadísticas' });
  }
};

// 🧾 Obtener últimas órdenes (recientes)
const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error al obtener órdenes recientes:', error);
    res.status(500).json({ success: false, message: 'Error interno al obtener órdenes' });
  }
};

// 🛒 Obtener todas las órdenes (admin)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    // Construir filtro
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email')
      .exec();

    const count = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener órdenes (admin):', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las órdenes',
      code: 'FETCH_ORDERS_ERROR'
    });
  }
};

// 📝 Actualizar estado de orden (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado no válido. Los estados permitidos son: pending, processing, completed, cancelled',
        code: 'INVALID_STATUS'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de orden no válido',
        code: 'INVALID_ORDER_ID'
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Estado de orden actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado de orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado de la orden',
      code: 'UPDATE_ORDER_STATUS_ERROR'
    });
  }
};

// 🔍 Obtener orden por ID (admin)
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

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error al obtener orden (admin):', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la orden',
      code: 'FETCH_ORDER_ERROR'
    });
  }
};

// 🗑️ Eliminar una orden (admin)
const deleteOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de orden no válido',
        code: 'INVALID_ORDER_ID'
      });
    }

    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Orden eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la orden',
      code: 'DELETE_ORDER_ERROR'
    });
  }
};

// ❌ Cancelar una orden (admin)
const cancelOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de orden no válido',
        code: 'INVALID_ORDER_ID'
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Orden cancelada correctamente'
    });
  } catch (error) {
    console.error('Error al cancelar orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cancelar la orden',
      code: 'CANCEL_ORDER_ERROR'
    });
  }
};

// Exportar todos los controladores
module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser, // Nueva función añadida
  getStats,
  getRecentOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  deleteOrder,
  cancelOrder
};