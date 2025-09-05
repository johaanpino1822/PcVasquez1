const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');
const adminMiddleware = require('../middleware/adminmiddleware');
const upload = require('../middleware/uploadmiddleware');
const Product = require('../models/Product');
const { body, validationResult } = require('express-validator');

// ✅ Controladores
const {
  getAllUsers,
  getStats,
  getRecentOrders
} = require('../controllers/admin.Controller');

// Middlewares globales
router.use(authMiddleware, adminMiddleware);

// 🧑‍💼 Obtener todos los usuarios
router.get('/users', getAllUsers);

// 📊 Obtener estadísticas del dashboard
router.get('/stats', getStats);

// 🧾 Obtener últimas órdenes
router.get('/orders', getRecentOrders);

// 🛒 Obtener todos los productos
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Validaciones de productos
const productValidations = [
  body('name').notEmpty().trim().withMessage('El nombre del producto es obligatorio'),
  body('description').notEmpty().trim().withMessage('La descripción es obligatoria'),
  body('price').isFloat({ gt: 0 }).withMessage('El precio debe ser un número mayor que 0'),
  body('stock').isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo')
];

// ➕ Crear un nuevo producto
router.post('/products', upload.single('image'), productValidations, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map(err => ({ path: err.param, msg: err.msg }))
      });
    }

    if (!req.file) {
      return res.status(400).json({
        errors: [{ path: 'image', msg: 'La imagen del producto es obligatoria' }]
      });
    }

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock, 10),
      image: req.file.path
    });

    const newProduct = await product.save();

    res.status(201).json({
      success: true,
      data: newProduct
    });

  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ✏️ Actualizar producto
router.put('/products/:id', upload.single('image'), productValidations, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map(err => ({ path: err.param, msg: err.msg }))
      });
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock, 10)
    };

    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.json({ success: true, data: updatedProduct });

  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;