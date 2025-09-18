import React, { useState, useEffect } from 'react';
import { getProfile, getFavorites } from '../api/axios';
import ProductCard from './ProductCard';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [profileResponse, favoritesResponse] = await Promise.all([
        getProfile(),
        getFavorites()
      ]);
      
      setUser(profileResponse.data);
      setFavorites(favoritesResponse.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0C4B45]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header del perfil */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <h1 className="text-3xl font-bold text-[#0C4B45] mb-4">Mi Perfil</h1>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-3 text-[#662D8F]">Información Personal</h2>
                <div className="space-y-2">
                  <p><span className="font-medium">Nombre:</span> {user?.name}</p>
                  <p><span className="font-medium">Email:</span> {user?.email}</p>
                  <p><span className="font-medium">Teléfono:</span> {user?.phone || 'No proporcionado'}</p>
                  <p><span className="font-medium">Rol:</span> {user?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-3 text-[#662D8F]">Dirección</h2>
                {user?.address ? (
                  <div className="space-y-2">
                    <p>{user.address.street}</p>
                    <p>{user.address.city}, {user.address.state} {user.address.zipCode}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay dirección registrada</p>
                )}
              </div>
            </div>
          </div>

          {/* Sección de favoritos */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#0C4B45]">Mis Productos Favoritos</h2>
              <span className="bg-[#F2A9FD] text-[#662D8F] px-3 py-1 rounded-full text-sm font-medium">
                {favorites.length} productos
              </span>
            </div>

            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤍</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No tienes favoritos aún</h3>
                <p className="text-gray-500">Explora nuestros productos y guarda tus favoritos haciendo clic en el corazón</p>
                <button 
                  onClick={() => window.location.href = '/products'}
                  className="mt-4 bg-[#662D8F] text-white px-6 py-2 rounded-lg hover:bg-[#4F1F73] transition-colors"
                >
                  Explorar Productos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;