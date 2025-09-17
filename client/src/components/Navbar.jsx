import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FaShoppingCart, FaUser, FaBars, FaTimes, FaHome, FaStore, FaChevronDown, FaGem } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const menuVariants = {
    open: { 
      opacity: 1, 
      height: "auto", 
      transition: { 
        staggerChildren: 0.1,
        when: "beforeChildren"
      } 
    },
    closed: { 
      opacity: 0, 
      height: 0,
      transition: { 
        staggerChildren: 0.05, 
        staggerDirection: -1,
        when: "afterChildren"
      } 
    }
  };

  const itemVariants = {
    open: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        y: { stiffness: 1000, velocity: -100 } 
      } 
    },
    closed: { 
      y: 50, 
      opacity: 0, 
      transition: { 
        y: { stiffness: 1000 } 
      } 
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'py-2 bg-white/95 backdrop-blur-sm shadow-lg' : 'py-4 bg-gradient-to-r from-[#0C4B45] to-[#083D38] shadow-xl'}`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center">
          
          {/* Logo con aniversario destacado */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div 
              className="relative"
              whileHover={{ rotate: [0, 10, -5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6 }}
            >
              {/* Badge de 17 años */}
              <motion.div
                className="absolute -top-4 -right-4 z-20 flex items-center justify-center bg-gradient-to-br from-[#F2A9FD] to-[#662D8F] rounded-full w-16 h-16 md:w-20 md:h-20 shadow-xl border-2 border-white/20"
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="text-center">
                  <span className="block text-white font-bold text-xl md:text-2xl leading-none">17</span>
                  <span className="block text-white text-xs md:text-sm font-light italic">años</span>
                  <FaGem className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-yellow-300 text-xs animate-pulse" />
                </div>
              </motion.div>

              <div className="bg-[#662D8F] p-2 md:p-3 rounded-xl shadow-lg relative z-10 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-[#F2A9FD] to-transparent" />
                <div className="relative z-10 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6 fill-white">
                    <path d="M4 6H20V8H4zM6 10H18V12H6zM8 14H16V16H8z"/>
                  </svg>
                </div>
              </div>
            </motion.div>
            
            <div className="flex flex-col">
              <span className={`text-2xl md:text-3xl font-extrabold tracking-tight ${scrolled ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#662D8F] to-[#0C4B45]' : 'text-white'}`}>
                PC<span className="text-[#F2A9FD]">Vasquez</span>
              </span>
              <span className={`text-xs font-light tracking-widest ${scrolled ? 'text-[#0C4B45]/80' : 'text-[#83F4E9]'} uppercase hidden sm:block`}>Innovación Tecnológica</span>
            </div>
          </Link>

          {/* Menú escritorio */}
          <div className="hidden lg:flex items-center space-x-2">
            <NavLink to="/" active={location.pathname === '/'} scrolled={scrolled}>
              <FaHome className="mr-2" /> Inicio
            </NavLink>

            <NavLink to="/products" active={location.pathname === '/products'} scrolled={scrolled}>
              <FaStore className="mr-2" /> Productos <FaChevronDown className="ml-1 text-xs" />
            </NavLink>

            <NavLink to="/about" active={location.pathname === '/about'} scrolled={scrolled}>
              Sobre Nosotros
            </NavLink>

            <CartLink itemCount={itemCount} scrolled={scrolled} />

            {user ? (
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2.5 rounded-xl font-medium ${scrolled ? 'bg-gradient-to-r from-[#F2A9FD] to-[#e895fc] text-[#662D8F]' : 'bg-gradient-to-r from-[#662D8F] to-[#512577] text-white'} shadow-lg relative`}
              >
                Cerrar sesión
              </motion.button>
            ) : (
              <NavLink to="/login" active={location.pathname === '/login'} scrolled={scrolled}>
                <FaUser className="mr-2" /> Mi Cuenta
              </NavLink>
            )}
          </div>

          {/* Iconos de carrito y usuario en móvil */}
          <div className="flex lg:hidden items-center space-x-4">
            <CartLink itemCount={itemCount} scrolled={scrolled} isMobile={true} />
            
            {user ? (
              <motion.button
                onClick={handleLogout}
                whileTap={{ scale: 0.95 }}
                className={`p-2.5 rounded-xl ${scrolled ? 'bg-[#662D8F] text-white' : 'bg-[#F2A9FD] text-[#662D8F]'} shadow-md`}
              >
                <FaUser className="text-lg" />
              </motion.button>
            ) : (
              <Link 
                to="/login" 
                className={`p-2.5 rounded-xl ${scrolled ? 'bg-[#662D8F] text-white' : 'bg-[#F2A9FD] text-[#662D8F]'} shadow-md`}
              >
                <FaUser className="text-lg" />
              </Link>
            )}

            {/* Botón de menú móvil */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2.5 rounded-xl ${scrolled ? 'bg-[#662D8F] text-white' : 'bg-[#F2A9FD] text-[#662D8F]'} shadow-md`}
              aria-label="Abrir menú"
            >
              {isOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
            </motion.button>
          </div>
        </div>

        {/* Menú móvil desplegable - FIXED: Ahora se muestra correctamente */}
        <motion.div
          className="lg:hidden overflow-hidden"
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          variants={menuVariants}
          style={{ 
            pointerEvents: isOpen ? 'auto' : 'none',
            display: isOpen ? 'block' : 'none'
          }}
        >
          <motion.div 
            className="bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl p-4 mt-4 flex flex-col space-y-3"
            variants={menuVariants}
          >
            <MobileItem to="/" active={location.pathname === '/'} onClick={() => setIsOpen(false)} variants={itemVariants}>
              <FaHome className="mr-3" /> Inicio
            </MobileItem>

            <MobileItem to="/products" active={location.pathname === '/products'} onClick={() => setIsOpen(false)} variants={itemVariants}>
              <FaStore className="mr-3" /> Productos
            </MobileItem>

            <MobileItem to="/about" active={location.pathname === '/about'} onClick={() => setIsOpen(false)} variants={itemVariants}>
              Sobre Nosotros
            </MobileItem>

            <MobileItem to="/cart" active={location.pathname === '/cart'} onClick={() => setIsOpen(false)} variants={itemVariants}>
              <FaShoppingCart className="mr-3" /> Carrito {itemCount > 0 && (
                <span className="ml-auto bg-[#662D8F] text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </MobileItem>

            {user ? (
              <motion.button
                onClick={() => { setIsOpen(false); handleLogout(); }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-3 rounded-xl text-white bg-gradient-to-r from-[#662D8F] to-[#512577] font-medium shadow-lg mt-2"
                variants={itemVariants}
              >
                Cerrar sesión
              </motion.button>
            ) : (
              <MobileItem to="/login" active={location.pathname === '/login'} onClick={() => setIsOpen(false)} variants={itemVariants}>
                <FaUser className="mr-3" /> Mi Cuenta
              </MobileItem>
            )}
          </motion.div>
        </motion.div>
      </div>
    </nav>
  );
};

// Componentes reutilizables
const NavLink = ({ to, children, active, scrolled }) => (
  <motion.div whileHover={{ y: -3 }} className="relative">
    <Link
      to={to}
      className={`flex items-center px-4 py-3 rounded-xl font-medium ${
        active 
          ? (scrolled ? 'text-white bg-gradient-to-r from-[#662D8F] to-[#512577]' : 'text-white bg-gradient-to-r from-[#662D8F] to-[#512577]') 
          : (scrolled ? 'text-[#0C4B45] hover:text-[#662D8F]' : 'text-white/90 hover:text-white')
      } transition-colors duration-300`}
    >
      {children}
    </Link>
  </motion.div>
);

const CartLink = ({ itemCount, scrolled, isMobile = false }) => (
  <motion.div 
    whileHover={isMobile ? {} : { y: -3 }} 
    whileTap={isMobile ? { scale: 0.95 } : {}}
    className="relative"
  >
    <Link 
      to="/cart" 
      className={`flex items-center ${isMobile ? 'p-2.5 rounded-xl shadow-md' : 'px-4 py-3 rounded-xl'} ${
        scrolled && isMobile 
          ? 'bg-[#662D8F] text-white' 
          : isMobile 
            ? 'bg-[#F2A9FD] text-[#662D8F]' 
            : scrolled 
              ? 'text-[#0C4B45] hover:text-[#662D8F]' 
              : 'text-white/90 hover:text-white'
      } transition-colors duration-300`}
    >
      <FaShoppingCart className={`${isMobile ? 'text-lg' : 'text-xl mr-2'}`} />
      {!isMobile && "Carrito"}
      {itemCount > 0 && (
        <span className={`${isMobile ? 'absolute -top-1 -right-1' : 'ml-2'} text-xs rounded-full h-5 w-5 flex items-center justify-center ${
          scrolled && !isMobile 
            ? 'bg-[#662D8F] text-white' 
            : isMobile 
              ? 'bg-white text-[#662D8F]' 
              : 'bg-[#F2A9FD] text-[#662D8F]'
        }`}>
          {itemCount}
        </span>
      )}
    </Link>
  </motion.div>
);

const MobileItem = ({ to, children, active, onClick, variants }) => (
  <motion.div variants={variants}>
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center px-5 py-3 rounded-lg font-medium ${
        active 
          ? 'bg-gradient-to-r from-[#662D8F] to-[#512577] text-white' 
          : 'text-[#0C4B45] hover:bg-[#83F4E9]/30'
      } transition-colors duration-300`}
    >
      {children}
    </Link>
  </motion.div>
);

export default Navbar;