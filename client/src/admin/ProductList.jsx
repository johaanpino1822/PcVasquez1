import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiImage,
  FiDollarSign,
  FiPackage,
  FiAlertCircle,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiZoomIn,
  FiSearch
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [currentProductImages, setCurrentProductImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/products');
        
        if (response.data) {
          const productsWithImages = response.data.map(product => ({
            ...product,
            allImages: product.images || ['/placeholder.jpg']
          }));
          setProducts(productsWithImages);
          setFilteredProducts(productsWithImages);
          setError(null);
        } else {
          throw new Error('Formato de respuesta inesperado');
        }
      } catch (err) {
        console.error('Error al obtener productos:', err);
        setError('Hubo un error al cargar los productos. Por favor intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filtrar productos basado en el término de búsqueda
  useEffect(() => {
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
    setCurrentPage(1); // Resetear a la primera página al buscar
  }, [searchTerm, products]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  const handleAddProduct = () => {
    navigate('/admin/products/new');
  };

  const handleEditProduct = (id) => {
    navigate(`/admin/products/edit/${id}`);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Está seguro que desea eliminar este producto permanentemente?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      setProducts(products.filter(product => product._id !== id));
      toast.success('Producto eliminado correctamente', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        className: "border-l-4 border-green-500 bg-white shadow-lg"
      });
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      toast.error('No se pudo eliminar el producto', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        className: "border-l-4 border-red-500 bg-white shadow-lg"
      });
    }
  };

  const openImageGallery = (images, index = 0) => {
    setCurrentProductImages(images);
    setSelectedImageIndex(index);
    setShowFullscreenImage(true);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => 
      (prev + 1) % currentProductImages.length
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => 
      (prev - 1 + currentProductImages.length) % currentProductImages.length
    );
  };

  // Obtener productos actuales para la página
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Cambiar página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calcular número total de páginas
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0C4B45]/5 to-white p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="text-[#0C4B45]"
        >
          <FiLoader size={48} />
        </motion.div>
        <p className="mt-4 text-xl font-medium text-[#0C4B45]">Cargando catálogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0C4B45]/5 to-white p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <FiAlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-[#0C4B45] mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-[#0C4B45] to-[#083D38] text-white rounded-lg hover:from-[#083D38] hover:to-[#0C4B45] transition-all shadow-md"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0C4B45]/5 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0C4B45] mb-2">Gestión de Productos</h1>
            <p className="text-gray-600">Administra todos los productos disponibles en tu tienda</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddProduct}
            className="mt-4 md:mt-0 flex items-center px-6 py-3 bg-gradient-to-r from-[#662D8F] to-[#512577] text-white rounded-lg hover:from-[#512577] hover:to-[#662D8F] transition-all shadow-lg"
          >
            <FiPlus className="mr-2" size={20} />
            Nuevo Producto
          </motion.button>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar productos por nombre, categoría o marca..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {currentProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Image Gallery */}
                    <div className="relative h-48 bg-gradient-to-br from-[#0C4B45]/10 to-[#83F4E9]/10">
                      {product.allImages && product.allImages.length > 0 ? (
                        <>
                          <img
                            src={getImageUrl(product.allImages[0])}
                            alt={product.name}
                            className="w-full h-full object-contain cursor-pointer p-4"
                            onClick={() => openImageGallery(product.allImages, 0)}
                          />
                          {product.allImages.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-white/80 rounded-full p-1 shadow-sm">
                              <span className="text-xs font-medium text-[#662D8F] px-2">
                                +{product.allImages.length - 1}
                              </span>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageGallery(product.allImages, 0);
                            }}
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md"
                          >
                            <FiZoomIn className="text-[#662D8F]" size={16} />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FiImage size={48} />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 
                          className="font-semibold text-[#0C4B45] truncate"
                          title={product.name}
                        >
                          {product.name}
                        </h3>
                        <div className="flex items-center text-[#662D8F] font-bold">
                          <FiDollarSign className="mr-1" size={14} />
                          <span>{product.price?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <div className="flex items-center mb-2">
                        <span className="text-xs bg-[#0C4B45]/10 text-[#0C4B45] px-2 py-1 rounded mr-2">
                          {product.category}
                        </span>
                        <span className="text-xs bg-[#662D8F]/10 text-[#662D8F] px-2 py-1 rounded">
                          {product.brand}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-12">
                        {product.description || 'Sin descripción'}
                      </p>

                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.stock > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
                        </span>

                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditProduct(product._id)}
                            className="text-[#0C4B45] hover:text-[#083D38] p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Editar producto"
                          >
                            <FiEdit size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Eliminar producto"
                          >
                            <FiTrash2 size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <FiChevronLeft />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`w-10 h-10 rounded-lg border ${
                        currentPage === page 
                          ? 'bg-[#662D8F] text-white border-[#662D8F]' 
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <FiPackage size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-[#0C4B45] mb-2">
              {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer producto'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddProduct}
              className="px-6 py-3 bg-gradient-to-r from-[#662D8F] to-[#512577] text-white rounded-lg hover:from-[#512577] hover:to-[#662D8F] transition-all shadow-md"
            >
              <FiPlus className="inline mr-2" />
              Agregar Producto
            </motion.button>
          </div>
        )}
      </div>

      {/* Fullscreen Image Gallery */}
      <AnimatePresence>
        {showFullscreenImage && (
          <motion.div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="relative max-w-6xl w-full max-h-[90vh]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <button
                onClick={() => setShowFullscreenImage(false)}
                className="absolute top-4 right-4 text-white text-3xl z-10 hover:text-[#F2A9FD]"
              >
                &times;
              </button>
              
              <div className="relative h-full w-full flex items-center justify-center">
                <img
                  src={getImageUrl(currentProductImages[selectedImageIndex])}
                  alt="Producto"
                  className="max-h-full max-w-full object-contain"
                />
                
                {currentProductImages.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full text-white"
                    >
                      <FiChevronLeft className="text-xl" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full text-white"
                    >
                      <FiChevronRight className="text-xl" />
                    </button>
                    
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-2">
                      {currentProductImages.map((_, index) => (
                        <button 
                          key={index}
                          onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(index); }}
                          className={`w-3 h-3 rounded-full transition-all ${
                            selectedImageIndex === index 
                              ? 'bg-white scale-125' 
                              : 'bg-white/50 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductList;