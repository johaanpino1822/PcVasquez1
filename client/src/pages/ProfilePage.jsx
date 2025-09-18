import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, favoritesAPI, ordersAPI } from '../api/axios';
import ProductCard from '../components/ProductCard';
import EditProfileModal from '../components/EditProfileModal';
import { 
  FaUser, 
  FaHeart, 
  FaShoppingBag, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEdit,
  FaHistory,
  FaSignOutAlt,
  FaBox,
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaExclamationTriangle,
  FaSpinner
} from 'react-icons/fa';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [profileResponse, favoritesResponse] = await Promise.all([
        authAPI.getProfile(),
        favoritesAPI.getFavorites()
      ]);
      
      setUser(profileResponse.data);
      setFavorites(favoritesResponse.data);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Error al cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await ordersAPI.getAllOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateProfile = async (formData) => {
    try {
      const response = await authAPI.updateProfile(formData);
      setUser(response.data.user);
      setSuccessMessage('Perfil actualizado correctamente');
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar el perfil');
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    window.location.href = '/';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return <FaCheckCircle className="text-green-500 mr-2" />;
      case 'processing':
        return <FaClock className="text-yellow-500 mr-2" />;
      case 'shipped':
        return <FaTruck className="text-blue-500 mr-2" />;
      case 'pending':
        return <FaClock className="text-gray-500 mr-2" />;
      case 'cancelled':
        return <FaExclamationTriangle className="text-red-500 mr-2" />;
      default:
        return <FaBox className="text-gray-500 mr-2" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return 'Entregado';
      case 'completed':
        return 'Completado';
      case 'processing':
        return 'En proceso';
      case 'shipped':
        return 'Enviado';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0) {
      fetchOrders();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0C4B45]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchUserData}
            className="bg-[#0C4B45] text-white px-6 py-2 rounded-lg hover:bg-[#083D38] transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-20">
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg shadow-lg">
            {successMessage}
          </div>
        </div>
      )}

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onUpdate={handleUpdateProfile}
      />

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0C4B45] to-[#83F4E9] rounded-full flex items-center justify-center text-white text-2xl">
                  <FaUser />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#0C4B45]">{user?.name}</h1>
                  <p className="text-gray-600">{user?.email}</p>
                  <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FaSignOutAlt /> Cerrar sesión
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-[#0C4B45]">Información Personal</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaUser className="text-[#662D8F]" />
                    <div>
                      <p className="font-medium">Nombre completo</p>
                      <p className="text-gray-600">{user?.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FaUser className="text-[#662D8F]" />
                    <div>
                      <p className="font-medium">Correo electrónico</p>
                      <p className="text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  
                  {user?.phone && (
                    <div className="flex items-center gap-3">
                      <FaPhone className="text-[#662D8F]" />
                      <div>
                        <p className="font-medium">Teléfono</p>
                        <p className="text-gray-600">{user.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {user?.address && (
                    <div className="flex items-start gap-3">
                      <FaMapMarkerAlt className="text-[#662D8F] mt-1" />
                      <div>
                        <p className="font-medium">Dirección</p>
                        <p className="text-gray-600">
                          {user.address.street}<br />
                          {user.address.city}, {user.address.state} {user.address.zipCode}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-[#0C4B45] text-white py-2 rounded-lg hover:bg-[#083D38] transition-colors"
                >
                  <FaEdit /> Editar perfil
                </button>
              </div>
              
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-[#0C4B45]">Mi Actividad</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#83F4E9]/10 p-4 rounded-lg text-center">
                    <FaHeart className="text-[#662D8F] text-2xl mx-auto mb-2" />
                    <p className="font-bold text-xl">{favorites.length}</p>
                    <p className="text-sm text-gray-600">Favoritos</p>
                  </div>
                  
                  <div className="bg-[#F2A9FD]/10 p-4 rounded-lg text-center">
                    <FaShoppingBag className="text-[#662D8F] text-2xl mx-auto mb-2" />
                    <p className="font-bold text-xl">{orders.length}</p>
                    <p className="text-sm text-gray-600">Pedidos</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
                <div className="flex space-x-4 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('favorites')}
                    className={`pb-2 px-4 font-medium ${
                      activeTab === 'favorites'
                        ? 'text-[#0C4B45] border-b-2 border-[#0C4B45]'
                        : 'text-gray-500 hover:text-[#0C4B45]'
                    }`}
                  >
                    <FaHeart className="inline mr-2" /> Mis Favoritos
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-2 px-4 font-medium ${
                      activeTab === 'orders'
                        ? 'text-[#0C4B45] border-b-2 border-[#0C4B45]'
                        : 'text-gray-500 hover:text-[#0C4B45]'
                    }`}
                  >
                    <FaHistory className="inline mr-2" /> Mis Pedidos
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6">
                {activeTab === 'favorites' ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-[#0C4B45]">Mis Productos Favoritos</h2>
                      <span className="bg-[#F2A9FD] text-[#662D8F] px-3 py-1 rounded-full text-sm font-medium">
                        {favorites.length} productos
                      </span>
                    </div>

                    {favorites.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {favorites.map(product => (
                          <ProductCard key={product._id} product={product} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🤍</div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No tienes favoritos aún</h3>
                        <p className="text-gray-500 mb-6">Explora nuestros productos y guarda tus favoritos haciendo clic en el corazón</p>
                        <Link 
                          to="/products"
                          className="bg-[#662D8F] text-white px-6 py-2 rounded-lg hover:bg-[#4F1F73] transition-colors"
                        >
                          Explorar Productos
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-[#0C4B45]">Historial de Pedidos</h2>
                      <button
                        onClick={fetchOrders}
                        disabled={ordersLoading}
                        className="flex items-center gap-2 px-3 py-1 bg-[#83F4E9] text-[#0C4B45] rounded-lg hover:bg-[#6ad4c9] transition-colors disabled:opacity-50"
                      >
                        {ordersLoading ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaHistory />
                        )}
                        Actualizar
                      </button>
                    </div>
                    
                    {ordersLoading ? (
                      <div className="flex justify-center py-12">
                        <FaSpinner className="animate-spin text-4xl text-[#0C4B45]" />
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map(order => (
                          <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold">Pedido #{order.orderNumber}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                {getStatusText(order.status)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <p className="text-gray-600">
                                {order.items?.length || 0} producto(s)
                              </p>
                              <p className="font-bold text-lg">
                                ${order.total?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <Link 
                                to={`/order/${order._id}`}
                                className="text-[#0C4B45] hover:text-[#083D38] font-medium text-sm"
                              >
                                Ver detalles del pedido →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No tienes pedidos aún</h3>
                        <p className="text-gray-500 mb-6">Realiza tu primera compra y encuentra aquí el historial de tus pedidos</p>
                        <Link 
                          to="/products"
                          className="bg-[#662D8F] text-white px-6 py-2 rounded-lg hover:bg-[#4F1F73] transition-colors"
                        >
                          Comprar Ahora
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;