const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadmiddleware');
const { 
  createProduct, 
  getProducts,
  getDeletedProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  softDeleteProduct,
  restoreProduct
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
router.get('/deleted', getDeletedProducts);
router.get('/:id', getProductById);
router.post(
  '/',
  upload.array('images', 4),
  validateProduct,
  runValidation,
  createProduct
);
router.put('/:id', upload.array('images', 4), updateProduct);
router.patch('/:id/soft-delete', softDeleteProduct);
router.patch('/:id/restore', restoreProduct);
router.delete('/:id', deleteProduct);

module.exports = router;