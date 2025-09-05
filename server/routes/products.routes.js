// routes/products.routes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadmiddleware');
const { 
  createProduct, 
  getProducts,
  getProductById // Añade esta importación
} = require('../controllers/product.Controller');
const { validateProduct } = require('../validators/productValidator');
const { validationResult } = require('express-validator');

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get('/', getProducts);

// Añade esta nueva ruta para obtener producto por ID
router.get('/:id', getProductById);

router.post(
  '/',
  upload.single('image'),
  validateProduct,
  runValidation,
  createProduct
);

module.exports = router;