const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order'); // Asegúrate de tener este modelo creado

// ✅ Obtener todos los usuarios
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
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

// Exportar todos los controladores
module.exports = {
  getAllUsers,
  getStats,
  getRecentOrders
};
