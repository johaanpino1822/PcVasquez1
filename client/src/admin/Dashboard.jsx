import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiBox, 
  FiShoppingCart, 
  FiUsers, 
  FiDollarSign, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiEye,
  FiRefreshCw,
  FiPackage,
  FiLayers
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    revenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Usar las nuevas rutas de admin
      const [statsRes, ordersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', config),
        axios.get('http://localhost:5000/api/admin/orders/recent', config)
      ]);

      setStats({
        products: statsRes.data.data.products || 0,
        orders: statsRes.data.data.orders || 0,
        users: statsRes.data.data.users || 0,
        revenue: statsRes.data.data.revenue || 0,
        pendingOrders: statsRes.data.data.pendingOrders || 0,
        completedOrders: statsRes.data.data.completedOrders || 0
      });

      const ordersData = ordersRes.data.data || [];
      const sanitizedOrders = ordersData.map(order => ({
        _id: order._id || '',
        user: {
          name: order.user?.name || 'Cliente no registrado',
          email: order.user?.email || ''
        },
        total: order.total || 0,
        status: order.status || 'pending',
        createdAt: order.createdAt || new Date().toISOString(),
        paymentMethod: order.paymentMethod || 'desconocido'
      }));

      setRecentOrders(sanitizedOrders);
      setError(null);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Error al cargar los datos. Verifica que el servidor esté funcionando.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
          <p className="mt-4 text-green-600 font-medium">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <FiAlertCircle className="mr-3 text-red-500" size={24} />
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
          </div>
          <p className="text-red-700 mb-6">{error}</p>
          <div className="flex space-x-3">
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-1"
            >
              Reintentar
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex-1"
            >
              Ir al login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { 
        color: 'bg-green-100 text-green-800 border border-green-200', 
        icon: <FiCheckCircle className="mr-1" size={14} />,
        text: 'Completado'
      },
      entregado: { 
        color: 'bg-green-100 text-green-800 border border-green-200', 
        icon: <FiCheckCircle className="mr-1" size={14} />,
        text: 'Entregado'
      },
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', 
        icon: <FiClock className="mr-1" size={14} />,
        text: 'Pendiente'
      },
      pendiente: { 
        color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', 
        icon: <FiClock className="mr-1" size={14} />,
        text: 'Pendiente'
      },
      processing: { 
        color: 'bg-blue-100 text-blue-800 border border-blue-200', 
        icon: <FiClock className="mr-1" size={14} />,
        text: 'Procesando'
      },
      shipped: { 
        color: 'bg-purple-100 text-purple-800 border border-purple-200', 
        icon: <FiPackage className="mr-1" size={14} />,
        text: 'Enviado'
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800 border border-red-200', 
        icon: <FiAlertCircle className="mr-1" size={14} />,
        text: 'Cancelado'
      },
      cancelado: { 
        color: 'bg-red-100 text-red-800 border border-red-200', 
        icon: <FiAlertCircle className="mr-1" size={14} />,
        text: 'Cancelado'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    const methodConfig = {
      credit_card: { color: 'bg-blue-100 text-blue-800 border border-blue-200', text: 'Tarjeta' },
      card: { color: 'bg-blue-100 text-blue-800 border border-blue-200', text: 'Tarjeta' },
      paypal: { color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', text: 'PayPal' },
      cash: { color: 'bg-green-100 text-green-800 border border-green-200', text: 'Efectivo' },
      transfer: { color: 'bg-purple-100 text-purple-800 border border-purple-200', text: 'Transferencia' },
      transferencia: { color: 'bg-purple-100 text-purple-800 border border-purple-200', text: 'Transferencia' }
    };
    
    const config = methodConfig[method] || { color: 'bg-gray-100 text-gray-800 border border-gray-200', text: 'Otro' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
            <p className="text-gray-600 mt-1">Resumen general de tu negocio</p>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Productos" 
            value={stats.products} 
            icon={<FiBox size={24} />}
            color="from-purple-200 to-purple-500"
          />
          <StatCard 
            title="Órdenes Totales" 
            value={stats.orders} 
            icon={<FiShoppingCart size={24} />}
            color="from-blue-200 to-blue-500"
          />
          <StatCard 
            title="Usuarios" 
            value={stats.users} 
            icon={<FiUsers size={24} />}
            color="from-green-200 to-green-500"
          />
          <StatCard 
            title="Ingresos" 
            value={formatCurrency(stats.revenue)} 
            icon={<FiDollarSign size={24} />}
            color="from-yellow-200 to-yellow-500"
          />
        </div>

        {/* Estadísticas secundarias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Estado de Órdenes</h3>
              <FiPackage className="text-gray-600" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center">
                  <FiClock className="text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-blue-700">Pendientes</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-2">{stats.pendingOrders}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center">
                  <FiCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-700">Completadas</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">{stats.completedOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Resumen de Ventas</h3>
              <FiLayers className="text-gray-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ventas totales</span>
                <span className="font-semibold text-gray-800">{formatCurrency(stats.revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Órdenes promedio</span>
                <span className="font-semibold text-gray-800">{stats.orders > 0 ? formatCurrency(stats.revenue / stats.orders) : '$0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tasa de conversión</span>
                <span className="font-semibold text-green-600">{(stats.users > 0 ? (stats.orders / stats.users * 100).toFixed(1) : 0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Órdenes recientes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
        >
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-2 sm:mb-0">
              <FiShoppingCart className="mr-2" />
              Órdenes Recientes
            </h2>
            <Link 
              to="/admin/orders" 
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center"
            >
              Ver todas <FiEye className="ml-1" size={16} />
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <FiShoppingCart className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500">No hay órdenes recientes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order._id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{order.user.name}</div>
                        <div className="text-sm text-gray-500">{order.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(order.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Componente de tarjeta de estadística
const StatCard = ({ title, value, icon, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
  >
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-r ${color} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  </motion.div>
);

export default Dashboard;