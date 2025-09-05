const Product = require('../models/Product'); // Asegúrate de importar tu modelo

// Obtener todos los productos
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

// Obtener producto por ID
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    // Verifica que el ID sea válido
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID de producto inválido' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado en el servidor' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el producto' });
  }
};

// Crear un producto
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;

    // ✅ Solo guardar el nombre del archivo, no la ruta completa
    const image = req.file ? req.file.filename : null;

    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      category, // ✅ ahora se incluye
      image,
    });

    await newProduct.save();

    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ message: 'Error al crear producto' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct
};
