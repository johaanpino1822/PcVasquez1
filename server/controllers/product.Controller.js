const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// Obtener todos los productos (no eliminados y productos sin campo deleted)
const getProducts = async (req, res) => {
  try {
    // Buscar productos que no estén eliminados O que no tengan el campo deleted
    const products = await Product.find({
      $or: [
        { deleted: false },
        { deleted: { $exists: false } } // Incluir productos que no tienen el campo deleted
      ]
    });
    
    const processedProducts = products.map(product => {
      if (product.image && (!product.images || product.images.length === 0)) {
        product.images = [product.image];
      }
      return product;
    });
    
    res.json({ success: true, data: processedProducts });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

// Obtener productos eliminados
const getDeletedProducts = async (req, res) => {
  try {
    const products = await Product.find({ deleted: true });
    
    const processedProducts = products.map(product => {
      if (product.image && (!product.images || product.images.length === 0)) {
        product.images = [product.image];
      }
      return product;
    });
    
    res.json({ success: true, data: processedProducts });
  } catch (err) {
    console.error('Error al obtener productos eliminados:', err);
    res.status(500).json({ message: 'Error al obtener productos eliminados' });
  }
};

// Obtener producto por ID
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID de producto inválido' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (product.image && (!product.images || product.images.length === 0)) {
      product.images = [product.image];
    }

    res.json({ success: true, data: product });
  } catch (err) {
    console.error('Error al obtener el producto:', err);
    res.status(500).json({ message: 'Error al obtener el producto' });
  }
};

// Crear un producto con múltiples imágenes
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, brand, model, warranty, featured, specifications } = req.body;

    const images = req.files ? req.files.map(file => file.filename) : [];

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock);
    const parsedWarranty = warranty ? parseInt(warranty) : 12;
    const isFeatured = featured === 'true' || featured === true;
    
    let parsedSpecs = {};
    if (specifications) {
      try {
        parsedSpecs = typeof specifications === 'string' 
          ? JSON.parse(specifications) 
          : specifications;
      } catch (error) {
        console.error('Error parsing specifications:', error);
        parsedSpecs = {};
      }
    }

    const newProduct = new Product({
      name,
      description,
      price: parsedPrice,
      stock: parsedStock,
      category,
      brand,
      model,
      warranty: parsedWarranty,
      featured: isFeatured,
      specifications: parsedSpecs,
      images,
      image: images[0] || null,
      deleted: false,
      deletedAt: null,
    });

    await newProduct.save();

    res.status(201).json({ 
      success: true, 
      message: 'Producto creado exitosamente',
      data: newProduct 
    });
  } catch (err) {
    console.error('Error al crear producto:', err);
    
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join('uploads/products/', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    res.status(500).json({ message: 'Error al crear producto' });
  }
};

// Actualizar un producto
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updates = req.body;

    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => file.filename);
      updates.image = updates.images[0];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ success: true, data: updatedProduct });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

// Soft delete: marcar como eliminado
const softDeleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByIdAndUpdate(
      productId,
      { deleted: true, deletedAt: Date.now() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ success: true, message: 'Producto archivado correctamente' });
  } catch (err) {
    console.error('Error al archivar producto:', err);
    res.status(500).json({ message: 'Error al archivar producto' });
  }
};

// Restaurar producto
const restoreProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByIdAndUpdate(
      productId,
      { deleted: false, deletedAt: null },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ success: true, message: 'Producto restaurado correctamente' });
  } catch (err) {
    console.error('Error al restaurar producto:', err);
    res.status(500).json({ message: 'Error al restaurar producto' });
  }
};

// Eliminación permanente (hard delete)
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (product.images && product.images.length > 0) {
      product.images.forEach(imageName => {
        const filePath = path.join('uploads/products/', imageName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Product.findByIdAndDelete(productId);

    res.json({ success: true, message: 'Producto eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};

module.exports = {
  getProducts,
  getDeletedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  softDeleteProduct,
  restoreProduct
};