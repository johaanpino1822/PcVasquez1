import React, { useState } from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaBars, 
  FaTimes, 
  FaSignOutAlt, 
  FaTachometerAlt, 
  FaBox, 
  FaShoppingBag, 
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaCog,
  FaBell,
  FaQuestionCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 

const AdminLayout = () => {
  const { user, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Paleta de colores profesional
  const colors = {
    primary: '#0C4B45',
    primaryLight: '#83F4E9',
    primaryDark: '#083D38',
    secondary: '#662D8F',
    secondaryLight: '#F2A9FD',
    accent: '#4CAF50',
    textDark: '#0C4B45',
    textLight: '#FFFFFF', // Cambiado a blanco puro para mejor contraste
    background: '#F0F9F5',
    sidebarBg: '#0C4B45',
    sidebarText: '#FFFFFF',
    sidebarHover: '#083D38',
    cardBg: '#FFFFFF',
    border: '#E2E8F0'
  };

  if (!user || isAdmin !== true) {
    return <Navigate to="/" />;
  }

  const handleLogout = () => {
    toast.success(
      <div className="flex items-center">
        <FaSignOutAlt className="mr-2" />
        <span>Sesión cerrada correctamente</span>
      </div>,
      {
        position: "top-right",
        className: 'bg-white border-l-4 border-[#662D8F] shadow-lg'
      }
    );
    logout();
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <FaTachometerAlt />, path: '/admin/dashboard' },
    { id: 'products', name: 'Productos', icon: <FaBox />, path: '/admin/products' },
    { id: 'orders', name: 'Órdenes', icon: <FaShoppingBag />, path: '/admin/orders' },
    { id: 'users', name: 'Usuarios', icon: <FaUsers />, path: '/admin/users' },
  ];

  return (
    <div className="flex h-screen bg-[#F0F9F5] overflow-hidden">
      {/* Sidebar */}
      <motion.div 
        className={`bg-[${colors.sidebarBg}] text-[${colors.sidebarText}] min-h-screen transition-all duration-300 flex flex-col fixed z-10 shadow-xl`}
        style={{ width: sidebarOpen ? '280px' : isHovering ? '280px' : '80px' }}
        initial={{ width: 280 }}
        animate={{ width: sidebarOpen ? 280 : isHovering ? 280 : 80 }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Logo y título */}
        <div className="p-5 border-b border-[#083D38] flex items-center justify-between">
          {sidebarOpen || isHovering ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#662D8F] to-[#F2A9FD] flex items-center justify-center mr-3 shadow-md">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            </motion.div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#662D8F] to-[#F2A9FD] flex items-center justify-center mx-auto shadow-md">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          )}
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#83F4E9] hover:text-white ml-2 transition-colors p-1 rounded-full hover:bg-[#083D38]"
            aria-label={sidebarOpen ? "Contraer menú" : "Expandir menú"}
          >
            {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>
        
        {/* Información del usuario */}
        <div className="p-4 border-b border-[#083D38]">
          {(sidebarOpen || isHovering) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#662D8F] to-[#F2A9FD] flex items-center justify-center text-white font-bold mr-3 shadow-md">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-[#83F4E9]">Administrador</p>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Menú de navegación */}
        <nav className="mt-5 flex-1">
          {menuItems.map((item) => (
            <Link 
              key={item.id}
              to={item.path} 
              className={`flex items-center py-3 px-6 transition-all group ${activeItem === item.id ? 'bg-[#083D38] border-r-4 border-[#83F4E9]' : 'hover:bg-[#083D38]'}`}
              onClick={() => setActiveItem(item.id)}
            >
              <span className={`text-lg ${activeItem === item.id ? 'text-white' : 'text-[#83F4E9]'} group-hover:text-white`}>
                {item.icon}
              </span>
              {(sidebarOpen || isHovering) && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-3 text-white"
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          ))}
        </nav>
        
        {/* Cerrar sesión y menú adicional */}
        <div className="p-4 border-t border-[#083D38] space-y-2">
         
          
       
          
          <button 
            onClick={handleLogout}
            className="flex items-center w-full py-2 px-6 hover:bg-[#083D38] rounded-lg transition-colors group text-white"
          >
            <FaSignOutAlt className="text-lg text-[#83F4E9] group-hover:text-white" />
            {(sidebarOpen || isHovering) && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="ml-3"
              >
                Cerrar Sesión
              </motion.span>
            )}
          </button>
        </div>
      </motion.div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300" style={{ marginLeft: sidebarOpen ? '280px' : '80px' }}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-[#0C4B45] hover:text-[#662D8F] focus:outline-none p-2 rounded-lg hover:bg-[#F0F9F5] mr-2"
                aria-label={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
              >
                {sidebarOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
              </button>
              <h2 className="text-xl font-semibold text-[#0C4B45] hidden md:block">
                {menuItems.find(item => item.id === activeItem)?.name || 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#662D8F] focus:border-transparent w-64 transition-all"
                />
                <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button 
                    className="p-2 rounded-full hover:bg-[#F0F9F5] text-[#0C4B45] relative"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                  >
                    <FaBell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 bg-[#662D8F] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
                  </button>
                  
                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-[#E2E8F0] p-4 z-20"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-[#0C4B45]">Notificaciones</h3>
                          <button className="text-xs text-[#662D8F] hover:underline">Marcar todas como leídas</button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          <div className="p-2 rounded-md bg-[#F0F9F5] border-l-4 border-[#4CAF50]">
                            <p className="text-sm font-medium text-[#0C4B45]">Nueva orden recibida</p>
                            <p className="text-xs text-gray-500">Hace 5 minutos</p>
                          </div>
                          <div className="p-2 rounded-md bg-[#F0F9F5] border-l-4 border-[#662D8F]">
                            <p className="text-sm font-medium text-[#0C4B45]">Usuario registrado</p>
                            <p className="text-xs text-gray-500">Hace 1 hora</p>
                          </div>
                          <div className="p-2 rounded-md bg-[#F0F9F5] border-l-4 border-[#0C4B45]">
                            <p className="text-sm font-medium text-[#0C4B45]">Producto agotado</p>
                            <p className="text-xs text-gray-500">Ayer</p>
                          </div>
                        </div>
                        <button className="w-full mt-3 text-center text-sm text-[#662D8F] hover:underline pt-2 border-t border-[#E2E8F0]">
                          Ver todas las notificaciones
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="hidden md:flex items-center bg-[#F0F9F5] rounded-xl p-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#662D8F] to-[#F2A9FD] flex items-center justify-center text-white font-bold shadow-md">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium text-[#0C4B45]">{user?.name}</p>
                    <p className="text-xs text-[#662D8F]">Administrador</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F0F9F5]">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-[#0C4B45] mb-6">
              <span className="text-[#662D8F]">Admin Panel</span>
              <span className="mx-2">/</span>
              <span>{menuItems.find(item => item.id === activeItem)?.name || 'Dashboard'}</span>
            </div>
            
            <Outlet />
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t p-4 text-center text-sm text-[#0C4B45]">
          <p>© {new Date().getFullYear()} Panel de Administración - Todos los derechos reservados</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;