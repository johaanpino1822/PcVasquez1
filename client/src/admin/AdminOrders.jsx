import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { 
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// Función auxiliar para reintentos de peticiones
const retryAxiosRequest = async (config, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios(config);
    } catch (error) {
      // Solo reintentar para errores de red o timeout
      if ((error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') && i < retries - 1) {
        console.log(`Reintentando petición... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersPerPage] = useState(10);
  const [updateError, setUpdateError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Obtener URL base de la API desde variables de entorno o usar valor por defecto
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Función para mostrar mensajes temporales
  const showTempMessage = (message, isError = false) => {
    if (isError) {
      setUpdateError(message);
      setSuccessMessage('');
    } else {
      setSuccessMessage(message);
      setUpdateError('');
    }
    
    setTimeout(() => {
      if (isError) {
        setUpdateError('');
      } else {
        setSuccessMessage('');
      }
    }, 3000);
  };

  // Función mejorada para obtener órdenes con filtros
  const fetchOrders = useCallback(async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no disponible. Debes iniciar sesión.');
      }

      // Construir parámetros de consulta
      let url = `${API_BASE_URL}/api/admin/orders?page=${page}&limit=${ordersPerPage}`;
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      if (status && status !== 'all') {
        url += `&status=${encodeURIComponent(status)}`;
      }

      const response = await retryAxiosRequest({
        method: 'get',
        url: url,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // Manejar diferentes formatos de respuesta
      if (response.data && Array.isArray(response.data)) {
        setOrders(response.data);
        setTotalPages(1);
        setTotalOrders(response.data.length);
      } else if (response.data && response.data.orders) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages || 1);
        setTotalOrders(response.data.totalCount || response.data.orders.length);
      } else if (response.data && response.data.data) {
        setOrders(response.data.data);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalOrders(response.data.pagination?.total || response.data.data.length);
      } else {
        throw new Error('Formato de respuesta inesperado del servidor');
      }
      
      setCurrentPage(page);
    } catch (err) {
      console.error('Error al obtener las órdenes:', err);
      if (err.code === 'ECONNABORTED') {
        setError('La solicitud está tardando demasiado. Verifica tu conexión.');
      } else if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (err.response?.status === 403) {
        setError('No tienes permisos de administrador para acceder a las órdenes.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Error de conexión. Verifica que el servidor esté ejecutándose y tu conexión a internet.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || err.message || 'No se pudieron cargar las órdenes.');
      }
    } finally {
      setLoading(false);
    }
  }, [ordersPerPage, API_BASE_URL]);

  // Cargar órdenes al montar el componente
  useEffect(() => {
    fetchOrders(currentPage, searchTerm, statusFilter);
  }, [fetchOrders]);

  // Efecto para aplicar filtros con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders(1, searchTerm, statusFilter);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, fetchOrders]);

  // Funciones de utilidad para estados
  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered':
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 mr-1" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 mr-1" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 mr-1" />;
      case 'processing':
      case 'shipped':
        return <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 mr-1" />;
    }
  };

  // Ver detalles de la orden
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Actualizar estado de la orden
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdateError('');
      setSuccessMessage('');

      const token = localStorage.getItem('token');
      if (!token) {
        showTempMessage('Sesión expirada. Por favor, inicia sesión nuevamente.', true);
        return;
      }

      await retryAxiosRequest({
        method: 'patch',
        url: `${API_BASE_URL}/api/admin/orders/${orderId}/status`,
        data: { status: newStatus },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // Actualizar solo la orden modificada
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      showTempMessage('Estado actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      let errorMessage = 'Error al actualizar el estado';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'La solicitud tardó demasiado tiempo';
      } else if (err.response?.status === 401) {
        errorMessage = 'No autorizado. Sesión expirada';
      } else if (err.response?.status === 403) {
        errorMessage = 'No tienes permisos de administrador';
      } else if (err.response?.status === 404) {
        errorMessage = 'Orden no encontrada en el servidor';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Error de red. Verifica tu conexión y que el servidor esté funcionando';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      showTempMessage(errorMessage, true);
    }
  };

  // Eliminar orden - FUNCIÓN MEJORADA CON MANEJO DE ERRORES
  const handleDeleteOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showTempMessage('Sesión expirada. Por favor, inicia sesión nuevamente.', true);
        return;
      }

      // Primero intentamos con DELETE
      try {
        await retryAxiosRequest({
          method: 'delete',
          url: `${API_BASE_URL}/api/admin/orders/${orderId}`,
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
      } catch (deleteError) {
        // Si falla DELETE, intentamos con PATCH para cancelar la orden
        if (deleteError.response?.status === 404 || deleteError.response?.status === 405) {
          console.log('Endpoint DELETE no encontrado, intentando cancelar orden en su lugar');
          
          await retryAxiosRequest({
            method: 'patch',
            url: `${API_BASE_URL}/api/admin/orders/${orderId}/cancel`,
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          
          // Si llegamos aquí, la cancelación fue exitosa
          showTempMessage('Orden cancelada (no se pudo eliminar completamente)', false);
          
          // Actualizamos el estado a cancelado en lugar de eliminar
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order._id === orderId ? { ...order, status: 'cancelled' } : order
            )
          );
          
          setDeleteConfirm(null);
          return;
        }
        throw deleteError;
      }

      // Si DELETE fue exitoso, eliminamos de la lista
      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
      setDeleteConfirm(null);
      showTempMessage('Orden eliminada correctamente');
      
    } catch (err) {
      console.error('Error al eliminar orden:', err);
      let errorMessage = 'Error al procesar la solicitud';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'La solicitud tardó demasiado tiempo';
      } else if (err.response?.status === 401) {
        errorMessage = 'No autorizado. Sesión expirada';
      } else if (err.response?.status === 403) {
        errorMessage = 'No tienes permisos para esta acción';
      } else if (err.response?.status === 404) {
        errorMessage = 'Orden no encontrada. Puede que ya haya sido eliminada.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Error de red. Verifica tu conexión';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      showTempMessage(errorMessage, true);
    }
  };

  // Exportar órdenes
  const handleExportOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showTempMessage('Sesión expirada. Por favor, inicia sesión nuevamente.', true);
        return;
      }

      // Obtener todas las órdenes para exportar
      const response = await retryAxiosRequest({
        method: 'get',
        url: `${API_BASE_URL}/api/admin/orders?limit=1000`,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      let allOrders = [];
      if (response.data && Array.isArray(response.data)) {
        allOrders = response.data;
      } else if (response.data && response.data.orders) {
        allOrders = response.data.orders;
      } else if (response.data && response.data.data) {
        allOrders = response.data.data;
      }

      const dataStr = JSON.stringify(allOrders, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `orders_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error('Error al exportar órdenes:', err);
      showTempMessage('Error al exportar las órdenes', true);
    }
  };

  // Paginación
  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    fetchOrders(pageNumber, searchTerm, statusFilter);
  };

  if (loading) return (
    <motion.div 
      className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="flex flex-col items-center"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      >
        <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <span className="text-gray-700 font-medium">Cargando órdenes...</span>
      </motion.div>
    </motion.div>
  );

  if (error && !loading) return (
    <div className="text-center py-20 bg-gradient-to-b from-gray-50 to-white">
      <motion.div 
        className="inline-block bg-white p-6 rounded-xl shadow-lg border border-gray-200 max-w-md"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Error al cargar órdenes</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={() => fetchOrders(1, searchTerm, statusFilter)}
        >
          Reintentar
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Mensajes de estado */}
        <AnimatePresence>
          {updateError && (
            <motion.div 
              className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                {updateError}
              </div>
            </motion.div>
          )}
          
          {successMessage && (
            <motion.div 
              className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {successMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Administración de <span className="text-blue-500">Órdenes</span>
            </h1>
            <p className="text-gray-600 mt-2">
              {totalOrders > 0 ? `Total de órdenes: ${totalOrders}` : 'No hay órdenes registradas'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => fetchOrders(currentPage, searchTerm, statusFilter)}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Actualizar
            </button>
            <button
              onClick={handleExportOrders}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar órdenes por ID, nombre, email..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
            <select
              className="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="processing">Procesando</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Tabla de órdenes */}
        {orders.length === 0 ? (
          <motion.div 
            className="text-center py-12 bg-white rounded-xl shadow-sm max-w-md mx-auto border border-gray-200"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-gray-500 text-lg">
              {totalOrders === 0 ? 'No hay órdenes para mostrar' : 'No se encontraron órdenes con los filtros aplicados'}
            </p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                fetchOrders(1, '', 'all');
              }}
            >
              Limpiar filtros
            </button>
          </motion.div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map(order => (
                  <motion.tr 
                    key={order._id} 
                    className="hover:bg-gray-50 transition-colors"
                    whileHover={{ backgroundColor: "#f9fafb" }}
                    transition={{ duration: 0.2 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.orderNumber || order._id?.substring(0, 8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.user?.name || order.customerName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.user?.email || order.customerEmail || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items?.length || order.products?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-500">
                      ${order.totalAmount?.toFixed(2) || order.total?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          className="text-xs border rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          title="Cambiar estado"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="processing">Procesando</option>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregado</option>
                          <option value="completed">Completado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                        <button
                          onClick={() => setDeleteConfirm(order._id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Eliminar orden"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100'}`}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`px-3 py-1 rounded-lg ${currentPage === pageNumber ? 'bg-blue-500 text-white' : 'text-blue-500 hover:bg-blue-100'}`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              {totalPages > 5 && (
                <span className="px-2 text-gray-500">...</span>
              )}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100'}`}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        <AnimatePresence>
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div 
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Confirmar Eliminación</h3>
                <p className="text-gray-600 mb-6">¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.</p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(deleteConfirm)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal de detalles */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Detalles de la Orden #{selectedOrder.orderNumber || selectedOrder._id?.substring(0, 8) || 'N/A'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Información del Cliente</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><span className="font-medium">Nombre:</span> {selectedOrder.user?.name || selectedOrder.customerName || selectedOrder.shippingInfo?.name || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.user?.email || selectedOrder.customerEmail || selectedOrder.shippingInfo?.email || 'N/A'}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedOrder.shippingInfo?.phone || selectedOrder.customerPhone || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Dirección de Envío</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>{selectedOrder.shippingInfo?.address || selectedOrder.shippingAddress || 'N/A'}</p>
                    <p>{selectedOrder.shippingInfo?.city || selectedOrder.shippingCity || 'N/A'}</p>
                    {selectedOrder.shippingInfo?.additionalInfo && (
                      <p className="text-sm text-gray-500 mt-2">{selectedOrder.shippingInfo.additionalInfo}</p>
                    )}
                  </div>
                </div>
              </div>

              <h4 className="font-medium text-gray-700 mb-2">Productos</h4>
              <div className="mb-6">
                {(selectedOrder.items || selectedOrder.products || []).length > 0 ? (
                  (selectedOrder.items || selectedOrder.products).map((item, index) => (
                    <div key={index} className="flex items-center py-3 border-b last:border-b-0">
                      <img 
                        src={item.image || item.product?.image || 'https://via.placeholder.com/80'} 
                        alt={item.name || item.product?.name}
                        className="w-16 h-16 object-cover rounded mr-4"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=Imagen+no+disponible'}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name || item.product?.name}</p>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        <p className="text-sm text-gray-600">Precio unitario: ${item.price?.toFixed(2) || item.product?.price?.toFixed(2)}</p>
                      </div>
                      <p className="font-medium text-blue-500">${((item.price || item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 py-4">No hay productos en esta orden</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700">Subtotal</p>
                  <p>${selectedOrder.subtotal?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Envío</p>
                  <p>${selectedOrder.shippingCost?.toFixed(2) || selectedOrder.shipping?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Total</p>
                  <p className="font-bold text-lg text-gray-900">${selectedOrder.totalAmount?.toFixed(2) || selectedOrder.total?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Información de Pago</h4>
                <p><span className="font-medium">Método:</span> {selectedOrder.paymentMethod || selectedOrder.payment?.method || 'N/A'}</p>
                <p><span className="font-medium">Estado de pago:</span> {selectedOrder.paymentStatus || selectedOrder.payment?.status || 'pending'}</p>
                {selectedOrder.paymentDetails && (
                  <>
                    <p><span className="font-medium">Referencia:</span> {selectedOrder.paymentDetails.reference}</p>
                    <p><span className="font-medium">ID de transacción:</span> {selectedOrder.paymentDetails.transactionId}</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;