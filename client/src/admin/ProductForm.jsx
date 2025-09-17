import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUpload,  FiEdit, FiStar, FiSave, FiLoader, FiCpu, FiHardDrive, FiPrinter, FiMonitor, FiX, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductForm = ({ mode = 'create', productId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    brand: '',
    model: '',
    warranty: '12',
    featured: false,
    specifications: {
      processor: '',
      ram: '',
      storage: '',
      graphics: '',
      os: ''
    }
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoadingProduct, setIsLoadingProduct] = useState(mode === 'edit');

  const categories = [
    { value: 'laptops', label: 'Laptops' },
    { value: 'desktops', label: 'Computadores de Escritorio' },
    { value: 'components', label: 'Componentes' },
    { value: 'peripherals', label: 'Periféricos' },
    { value: 'barcode', label: 'Lectores de Código de Barras' },
    { value: 'servers', label: 'Servidores' },
    { value: 'networking', label: 'Redes y Conectividad' },
    { value: 'storage', label: 'Almacenamiento' }
  ];

  const categoryIcons = {
    'laptops': <FiCpu className="inline mr-2" />,
    'desktops': <FiMonitor className="inline mr-2" />,
    'components': <FiHardDrive className="inline mr-2" />,
    'peripherals': <FiPrinter className="inline mr-2" />,
    'barcode': <FiPrinter className="inline mr-2" />,
    'servers': <FiHardDrive className="inline mr-2" />,
    'networking': <FiCpu className="inline mr-2" />,
    'storage': <FiHardDrive className="inline mr-2" />
  };

  const brands = [
    'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Apple', 'Microsoft', 
    'Samsung', 'Toshiba', 'MSI', 'Huawei', 'Xiaomi', 'Logitech',
    'Epson', 'Canon', 'Zebra', 'Honeywell', 'Datalogic'
  ];

  const operatingSystems = [
    'Windows 10', 'Windows 11', 'macOS', 'Linux', 'Chrome OS', 'Sin sistema operativo'
  ];

  // Cargar datos del producto si estamos en modo edición
  useEffect(() => {
    if (mode === 'edit' && productId) {
      const fetchProduct = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/products/${productId}`);
          const product = response.data;
          
          setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            stock: product.stock || '',
            category: product.category || '',
            brand: product.brand || '',
            model: product.model || '',
            warranty: product.warranty || '12',
            featured: product.featured || false,
            specifications: product.specifications || {
              processor: '',
              ram: '',
              storage: '',
              graphics: '',
              os: ''
            }
          });

          if (product.images && product.images.length > 0) {
            setExistingImages(product.images);
          }
          
          setIsLoadingProduct(false);
        } catch (err) {
          console.error('Error al cargar el producto:', err);
          toast.error('Error al cargar el producto', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: true,
            className: "border-l-4 border-red-500 bg-white shadow-lg"
          });
          setIsLoadingProduct(false);
        }
      };

      fetchProduct();
    }
  }, [productId, mode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('specifications.')) {
      const specName = name.split('.')[1];
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [specName]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Limitar a 4 imágenes máximo (considerando las existentes)
      const maxImages = 4 - existingImages.length + imagesToDelete.length;
      const selectedFiles = files.slice(0, maxImages - imageFiles.length);
      const newImageFiles = [...imageFiles, ...selectedFiles];
      setImageFiles(newImageFiles);
      
      const newPreviews = [...imagePreviews];
      selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          if (newPreviews.length === newImageFiles.length) {
            setImagePreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index, type) => {
    if (type === 'existing') {
      // Marcar imagen existente para eliminar
      setImagesToDelete([...imagesToDelete, existingImages[index]]);
      const newExisting = [...existingImages];
      newExisting.splice(index, 1);
      setExistingImages(newExisting);
    } else {
      // Eliminar imagen nueva
      const newFiles = [...imageFiles];
      const newPreviews = [...imagePreviews];
      
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      
      setImageFiles(newFiles);
      setImagePreviews(newPreviews);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nombre es requerido';
    if (!formData.description.trim()) newErrors.description = 'Descripción es requerida';
    if (!formData.price || isNaN(formData.price) || formData.price <= 0) 
      newErrors.price = 'Precio debe ser mayor a 0';
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0) 
      newErrors.stock = 'Stock no puede ser negativo';
    if (!formData.category) newErrors.category = 'Categoría es requerida';
    if (!formData.brand) newErrors.brand = 'Marca es requerida';
    if (!formData.model) newErrors.model = 'Modelo es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'specifications') {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, value);
        }
      });
      
      // Agregar todas las imágenes nuevas
      imageFiles.forEach((file) => {
        data.append('images', file);
      });

      // Agregar información de imágenes a eliminar (solo en modo edición)
      if (mode === 'edit') {
        data.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }

      let response;
      if (mode === 'edit') {
        // Actualizar producto existente
        response = await axios.put(`http://localhost:5000/api/products/${productId}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        toast.success('Producto actualizado exitosamente', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          className: "border-l-4 border-green-500 bg-white shadow-lg"
        });
      } else {
        // Crear nuevo producto
        response = await axios.post('http://localhost:5000/api/products', data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        toast.success('Producto creado exitosamente', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          className: "border-l-4 border-green-500 bg-white shadow-lg"
        });
      }

      // Llamar a la función onSubmit proporcionada por el componente padre
      if (onSubmit) {
        onSubmit(response.data);
      }
    } catch (err) {
      console.error(err);
      const message = mode === 'edit' ? 'Error al actualizar el producto' : 'Error al guardar el producto';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        className: "border-l-4 border-red-500 bg-white shadow-lg"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSpecificationFields = () => {
    switch(formData.category) {
      case 'laptops':
      case 'desktops':
      case 'servers':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0C4B45] mb-1">Procesador</label>
              <input
                type="text"
                name="specifications.processor"
                value={formData.specifications.processor || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
                placeholder="Ej: Intel Core i7-10700K"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C4B45] mb-1">Memoria RAM</label>
              <input
                type="text"
                name="specifications.ram"
                value={formData.specifications.ram || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
                placeholder="Ej: 16GB DDR4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C4B45] mb-1">Almacenamiento</label>
              <input
                type="text"
                name="specifications.storage"
                value={formData.specifications.storage || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
                placeholder="Ej: 512GB SSD + 1TB HDD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C4B45] mb-1">Tarjeta Gráfica</label>
              <input
                type="text"
                name="specifications.graphics"
                value={formData.specifications.graphics || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
                placeholder="Ej: NVIDIA GeForce RTX 3060"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#0C4B45] mb-1">Sistema Operativo</label>
              <select
                name="specifications.os"
                value={formData.specifications.os || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
              >
                <option value="">Seleccione un sistema operativo</option>
                {operatingSystems.map(os => (
                  <option key={os} value={os}>{os}</option>
                ))}
              </select>
            </div>
          </div>
        );
      case 'barcode':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0C4B45] mb-1">Tipo de Escáner</label>
              <input
                type="text"
                name="specifications.scannerType"
                value={formData.specifications.scannerType || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
                placeholder="Ej: Láser, CCD, Imager"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C4B45] mb-1">Conectividad</label>
              <input
                type="text"
                name="specifications.connectivity"
                value={formData.specifications.connectivity || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
                placeholder="Ej: USB, Bluetooth, WiFi"
              />
            </div>
          </div>
        );
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-[#0C4B45] mb-1">Especificaciones Técnicas</label>
            <textarea
              name="specifications.general"
              value={formData.specifications.general || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
              placeholder="Ingrese las especificaciones técnicas del producto..."
            />
          </div>
        );
    }
  };

  // Calcular el total de imágenes (existentes + nuevas)
  const totalImages = existingImages.length + imagePreviews.length;

  if (isLoadingProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0C4B45]/5 to-white p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="text-[#0C4B45]"
        >
          <FiLoader size={48} />
        </motion.div>
        <p className="mt-4 text-xl font-medium text-[#0C4B45]">Cargando producto...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0C4B45]/5 to-white p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-[#0C4B45] flex items-center">
              {mode === 'edit' ? (
                <>
                  <FiEdit className="mr-2" />
                  Editar Producto
                </>
              ) : (
                'Nuevo Producto Tecnológico'
              )}
            </h2>
            <button
              onClick={onCancel}
              className="flex items-center px-4 py-2 text-[#0C4B45] hover:bg-[#0C4B45]/10 rounded-lg transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Volver
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Columna Izquierda */}
              <div className="space-y-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-[#0C4B45] mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-[#662D8F] focus:border-transparent`}
                    placeholder="Ej: Laptop HP EliteBook 840 G8"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Marca y Modelo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0C4B45] mb-1">Marca *</label>
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.brand ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-[#662D8F] focus:border-transparent`}
                    >
                      <option value="">Seleccione una marca</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                    {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0C4B45] mb-1">Modelo *</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.model ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-[#662D8F] focus:border-transparent`}
                      placeholder="Número de modelo"
                    />
                    {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-[#0C4B45] mb-1">Descripción *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-[#662D8F] focus:border-transparent`}
                    placeholder="Describe las características y beneficios del producto..."
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>

                {/* Especificaciones Técnicas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-[#0C4B45] mb-3">Especificaciones Técnicas</h3>
                  {renderSpecificationFields()}
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="space-y-6">
                {/* Vista previa de imágenes */}
                <div>
                  <label className="block text-sm font-medium text-[#0C4B45] mb-1">
                    Imágenes del Producto (Máximo 4)
                  </label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                    {totalImages > 0 ? (
                      <div className="grid grid-cols-2 gap-4 w-full">
                        {/* Mostrar imágenes existentes */}
                        {existingImages.map((image, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <img 
                              src={`http://localhost:5000/uploads/${image}`} 
                              alt={`Imagen existente ${index + 1}`} 
                              className="h-32 w-full object-cover rounded-lg"
                            />
                            {mode === 'edit' && (
                              <button
                                type="button"
                                onClick={() => removeImage(index, 'existing')}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FiX size={16} />
                              </button>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                              Existente {index + 1}
                            </div>
                          </div>
                        ))}
                        
                        {/* Mostrar vistas previas de nuevas imágenes */}
                        {imagePreviews.map((preview, index) => (
                          <div key={`new-${index}`} className="relative group">
                            <img 
                              src={preview} 
                              alt={`Vista previa ${index + 1}`} 
                              className="h-32 w-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index, 'new')}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FiX size={16} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                              Nueva {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center">
                        <FiUpload className="mx-auto text-gray-400 text-3xl mb-2" />
                        <p className="text-sm text-gray-500">Arrastra imágenes o haz clic para seleccionar (máx. 4)</p>
                      </div>
                    )}
                    <input
                      type="file"
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                      multiple
                      disabled={totalImages >= 4}
                    />
                    <label 
                      htmlFor="image-upload"
                      className={`mt-4 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                        totalImages >= 4 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-[#0C4B45]/10 hover:bg-[#0C4B45]/20 text-[#0C4B45]'
                      }`}
                    >
                      {totalImages > 0 ? 'Agregar Más Imágenes' : 'Seleccionar Imágenes'}
                    </label>
                    {totalImages > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {totalImages} de 4 imágenes seleccionadas
                      </p>
                    )}
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-[#0C4B45] mb-1">Categoría *</label>
                  <div className="relative">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.category ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-[#662D8F] focus:border-transparent`}
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {formData.category && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0C4B45]">
                        {categoryIcons[formData.category]}
                      </span>
                    )}
                  </div>
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                </div>

                {/* Precio, Stock y Garantía */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[#0C4B45] mb-1">Precio *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className={`w-full pl-8 pr-4 py-3 rounded-lg border ${errors.price ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-[#662D8F] focus:border-transparent`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0C4B45] mb-1">Stock *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      min="0"
                      className={`w-full px-4 py-3 rounded-lg border ${errors.stock ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-[#662D8F] focus:border-transparent`}
                      placeholder="Cantidad"
                    />
                    {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0C4B45] mb-1">Garantía (meses)</label>
                  <select
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
                  >
                    <option value="3">3 meses</option>
                    <option value="6">6 meses</option>
                    <option value="12">12 meses</option>
                    <option value="24">24 meses</option>
                    <option value="36">36 meses</option>
                  </select>
                </div>

                {/* Destacado */}
                <div className="flex items-center space-x-3 p-3 bg-[#F2A9FD]/10 rounded-lg border border-[#F2A9FD]/20">
                  <div className={`p-1 rounded-full ${formData.featured ? 'bg-[#662D8F] text-yellow-300' : 'bg-gray-200'}`}>
                    <FiStar className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="featured" className="text-sm font-medium text-[#662D8F] cursor-pointer">
                      Producto Destacado
                    </label>
                    <p className="text-xs text-gray-500">Aparecerá en la sección principal</p>
                  </div>
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="h-5 w-5 text-[#662D8F] rounded focus:ring-[#662D8F]"
                  />
                </div>
              </div>
            </div>

            {/* Botón de envío */}
            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#662D8F] to-[#512577] hover:from-[#512577] hover:to-[#662D8F] shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    {mode === 'edit' ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    {mode === 'edit' ? 'Actualizar Producto' : 'Crear Producto'}
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;