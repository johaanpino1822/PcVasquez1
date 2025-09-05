const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// Crear producto
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;

    if (!name || !description || !price || !stock) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'La imagen del producto es obligatoria.' });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      image: imagePath,
    });

    await newProduct.save();

    res.status(201).json({ message: 'Producto creado correctamente', product: newProduct });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los productos
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

// Obtener un producto por ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el producto' });
  }
};

// Actualizar producto
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    if (req.file) {
      const oldPath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      product.image = `/uploads/${req.file.filename}`;
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock || product.stock;

    await product.save();
    res.json({ message: 'Producto actualizado correctamente', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar producto
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    if (product.image) {
      const imagePath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
