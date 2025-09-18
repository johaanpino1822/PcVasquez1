import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import crypto from 'crypto-browserify';
import { 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  TruckIcon,
  ShieldCheckIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

// Paleta de colores elegante y profesional
const colors = {
  primary: '#0C4B45',
  primaryDark: '#083D38',
  primaryLight: '#83F4E9',
  secondary: '#662D8F',
  secondaryLight: '#F2A9FD',
  accent: '#4CAF50',
  accentDark: '#2E7D32',
  backgroundLight: '#F8FCFA',
  backgroundLighter: '#EFF8F5',
  textDark: '#0C4B45',
  textMedium: '#4A6B57',
  textLight: '#B5EAD7',
  error: '#EF5350',
  success: '#4CAF50',
  border: '#E0E7ED',
  cardHover: '#F5FBF8',
};

// Constantes para configuración EN PRODUCCIÓN
const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// 🔐 CREDENCIALES WOMPI PRODUCCIÓN
const WOMPI_PUBLIC_KEY = process.env.REACT_APP_WOMPI_PUBLIC_KEY || 'pub_prod_PvP6dX3MP46ZIhmXlWJnpJaWw05cQHsa';
const WOMPI_PRIVATE_KEY = process.env.REACT_APP_WOMPI_PRIVATE_KEY || 'prv_prod_eF0QzPuwamt1u7T1q7nEukZBMAvI62ze';
const WOMPI_INTEGRITY_SECRET = process.env.REACT_APP_WOMPI_INTEGRITY_SECRET || 'prod_integrity_aQ80uWvGGqBFfyQDa1hfhgBPiYgZLdvT';
const WOMPI_EVENTS_SECRET = process.env.REACT_APP_WOMPI_EVENTS_SECRET || 'prod_events_toltqgOCuPp5VeSyGxtzYAiP9TJGv9Ge';

// 🎯 TOKEN DE ACEPTACIÓN Y MERCHANT ID
const WOMPI_ACCEPTANCE_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJjb250cmFjdF9pZCI6NTA3LCJwZXJtYWxpbmsiOiJodHRwczovL3dvbXBpLmNvbS9hc3NldHMvZG93bmxvYWRibGUvcmVnbGFtZW50by1Vc3Vhcmlvcy1Db2xvbWJpYS5wZGYiLCJmaWxlX2hhc2giOiJkYzJkNGUzMDVlNGQzNmFhYjhjYzU3N2I1YTY5Nzg1MSIsImppdCI6IjE3NTc5OTk4MDEtNDc2NjEiLCJlbWFpbCI6IiIsImV4cCI6MTc1ODAwMzQwMX0.kWuTIpCiPX4V_BLNBQBqjjfwdjnMQ3w9OOA8Xm7Vnos';
const WOMPI_MERCHANT_ID = process.env.REACT_APP_WOMPI_MERCHANT_ID || '261571';

// BLOQUEO SUPER AGRESIVO DEL SDK WOMPI
(function() {
  if (typeof window === 'undefined') return;
  
  console.log('🔧 Iniciando bloqueo agresivo del SDK Wompi...');
  
  const removeWompiScripts = () => {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src && (
        script.src.includes('wompi') || 
        script.src.includes('checkout.wompi.co') ||
        script.src.includes('api.wompi.co') ||
        script.src.includes('widget.js') ||
        script.src.includes('v1.js') ||
        script.src.includes('v2.js')
      )) {
        console.log('🗑️ Eliminando script de Wompi:', script.src);
        script.remove();
      }
    });
  };
  
  const blockWompiGlobals = () => {
    const globalProps = ['$wompi', 'Wompi', 'wompi', '__WOMPI__', 'wompiCheckout'];
    
    globalProps.forEach(prop => {
      Object.defineProperty(window, prop, {
        value: null,
        writable: false,
        configurable: false,
        enumerable: false
      });
    });
  };
  
  const blockDynamicLoading = () => {
    const originalAppendChild = Element.prototype.appendChild;
    const originalCreateElement = Document.prototype.createElement;
    
    Element.prototype.appendChild = function(node) {
      if (node.src && (
        node.src.includes('wompi') || 
        node.src.includes('checkout.wompi.co') ||
        node.src.includes('api.wompi.co') ||
        node.src.includes('widget.js') ||
        node.src.includes('v1.js') ||
        node.src.includes('v2.js')
      )) {
        console.log('🚫 Bloqueado appendChild de elemento Wompi:', node.src);
        return node;
      }
      return originalAppendChild.call(this, node);
    };
    
    Document.prototype.createElement = function(tagName, options) {
      const element = originalCreateElement.call(this, tagName, options);
      
      if (tagName.toLowerCase() === 'script') {
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
          if (name === 'src' && value && (
            value.includes('wompi') || 
            value.includes('checkout.wompi.co') ||
            value.includes('api.wompi.co') ||
            value.includes('widget.js') ||
            value.includes('v1.js') ||
            value.includes('v2.js')
          )) {
            console.log('🚫 Bloqueado setAttribute de script Wompi:', value);
            return;
          }
          return originalSetAttribute.call(this, name, value);
        };
      }
      
      return element;
    };
  };
  
  removeWompiScripts();
  blockWompiGlobals();
  blockDynamicLoading();
  
  setInterval(removeWompiScripts, 1000);
  
  console.log('✅ Bloqueo completo del SDK Wompi implementado');
})();

// Componente para mostrar mensajes de estado
const StatusMessage = ({ type, message, onRetry, onDismiss }) => {
  const icons = {
    error: ExclamationTriangleIcon,
    success: CheckCircleIcon,
    info: InformationCircleIcon
  };
  
  const iconColors = {
    error: 'text-red-500',
    success: 'text-green-500',
    info: 'text-blue-500'
  };
  
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const IconComponent = icons[type];
  
  return (
    <div className={`border rounded-lg p-4 mb-6 flex items-start ${styles[type]}`}>
      <IconComponent className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${iconColors[type]}`} />
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        {type === 'error' && (
          <div className="mt-2 flex space-x-3">
            <button 
              onClick={onRetry}
              className="text-sm font-medium underline hover:no-underline"
            >
              Recargar página
            </button>
            <button 
              onClick={onDismiss}
              className="text-sm font-medium underline hover:no-underline"
            >
              Intentar nuevamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para el loader
const Loader = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
    </div>
  </div>
);

// Componente para elementos del carrito
const CartItem = ({ item, onUpdateQuantity, onRemoveItem, getImageUrl }) => {
  const [imageError, setImageError] = useState(false);
  
  const handleQuantityChange = useCallback((newQuantity) => {
    onUpdateQuantity(item._id, newQuantity);
  }, [item._id, onUpdateQuantity]);

  return (
    <li className="p-5 flex border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
      <div className="flex-shrink-0">
        <img
          src={imageError ? '/placeholder-product.jpg' : getImageUrl(item.image)}
          alt={item.name}
          className="h-20 w-20 object-cover rounded-lg shadow-sm"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
      <div className="ml-4 flex-1 flex flex-col justify-between">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
            <p className="text-gray-600 text-sm">${item.price.toLocaleString()} c/u</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            ${(item.price * item.quantity).toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-gray-200 rounded-md">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Disminuir cantidad"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-gray-700 text-sm font-medium min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <button 
              onClick={() => handleQuantityChange(item.quantity + 1)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Aumentar cantidad"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => onRemoveItem(item._id)}
            className="text-red-500 hover:text-red-700 p-2 transition-colors rounded-full hover:bg-red-50"
            aria-label="Eliminar producto"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </li>
  );
};

// Componente para el formulario de envío
const ShippingForm = ({ shippingInfo, onChange, errors = {} }) => {
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    onChange(name, value);
  }, [onChange]);

  return (
    <div className="space-y-5">
      <div className="flex items-center">
        <TruckIcon className="h-5 w-5 text-primary mr-2" />
        <h3 className="font-semibold text-gray-900">Información de Envío</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre Completo *
          </label>
          <input
            type="text"
            name="name"
            value={shippingInfo.name}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Correo Electrónico *
          </label>
          <input
            type="email"
            name="email"
            value={shippingInfo.email}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Dirección *
          </label>
          <input
            type="text"
            name="address"
            value={shippingInfo.address}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.address && <p className="text-red-500 text-xs mt-1.5">{errors.address}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ciudad *
          </label>
          <input
            type="text"
            name="city"
            value={shippingInfo.city}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            placeholder="Bogotá"
          />
          {errors.city && <p className="text-red-500 text-xs mt-1.5">{errors.city}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Departamento/Estado *
          </label>
          <input
            type="text"
            name="state"
            value={shippingInfo.state}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            placeholder="Cundinamarca"
          />
          {errors.state && <p className="text-red-500 text-xs mt-1.5">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Teléfono *
          </label>
          <input
            type="tel"
            name="phone"
            value={shippingInfo.phone}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            placeholder="3233019836"
          />
          <p className="text-xs text-gray-500 mt-1.5">Sin código de país (57)</p>
          {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Código Postal
          </label>
          <input
            type="text"
            name="postalCode"
            value={shippingInfo.postalCode}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
            placeholder="110111"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tipo de Documento *
          </label>
          <select
            name="legalIdType"
            value={shippingInfo.legalIdType}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
            required
          >
            <option value="CC">Cédula</option>
            <option value="CE">Cédula Extranjería</option>
            <option value="TI">Tarjeta Identidad</option>
            <option value="PP">Pasaporte</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Documento de Identidad *
          </label>
          <input
            type="text"
            name="legalId"
            value={shippingInfo.legalId}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition ${
              errors.legalId ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            placeholder="1234567890"
          />
          {errors.legalId && <p className="text-red-500 text-xs mt-1.5">{errors.legalId}</p>}
        </div>
      </div>
    </div>
  );
};

const CartPage = () => {
  const { 
    cartItems = [], 
    removeFromCart, 
    updateCartItem,
    subtotal = 0,
    clearCart
  } = useCart();
  
  const { loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    postalCode: '',
    legalId: '',
    legalIdType: 'CC'
  });

  useEffect(() => {
    console.log('🔍 Verificando bloqueo de Wompi SDK...');
    
    const checkForWompiScripts = () => {
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.src && script.src.includes('wompi')) {
          console.log('⚠️ Script de Wompi detectado, eliminando:', script.src);
          script.remove();
        }
      });
    };
    
    const interval = setInterval(checkForWompiScripts, 500);
    return () => clearInterval(interval);
  }, []);

  // CORRECCIÓN PRINCIPAL: Función mejorada para obtener URLs de imágenes
  const getImageUrl = useCallback((imagePath) => {
    if (!imagePath) return '/placeholder-product.jpg';
    
    // Si ya es una URL completa, devolverla directamente
    if (imagePath.startsWith('http')) return imagePath;
    
    // Si es una ruta que ya incluye "/uploads/", devolverla con la API_URL
    if (imagePath.includes('/uploads/')) {
      return `${API_URL}${imagePath}`;
    }
    
    // Si es solo el nombre del archivo, construir la ruta completa
    return `${API_URL}/uploads/products/${imagePath}`;
  }, [API_URL]);

  const { shipping, total } = useMemo(() => {
    const shippingCost = subtotal > 100000 ? 0 : 0;
    return {
      shipping: shippingCost,
      total: subtotal + shippingCost
    };
  }, [subtotal]);

  const generateIntegritySignature = useCallback((reference, amountInCents, currency = 'COP') => {
    if (!WOMPI_INTEGRITY_SECRET) {
      console.error('❌ Falta el secreto de integridad de Wompi');
      throw new Error('Falta el secreto de integridad de Wompi');
    }
    
    try {
      const data = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`;
      console.log('📝 Datos para firma:', data);
      
      const signature = crypto.createHash('sha256').update(data).digest('hex');
      console.log('🔐 Firma generada:', signature);
      
      return signature;
    } catch (error) {
      console.error('❌ Error generando firma:', error);
      throw new Error('Error al generar la firma de integridad');
    }
  }, [WOMPI_INTEGRITY_SECRET]);

  const handleInputChange = useCallback((name, value) => {
    setShippingInfo(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [formErrors]);

  const validateForm = useCallback(() => {
    const errors = {};
    let isValid = true;

    if (!WOMPI_PUBLIC_KEY) {
      setError('Error de configuración: Falta la clave pública de Wompi');
      return false;
    }

    if (!WOMPI_INTEGRITY_SECRET) {
      setError('Error de configuración: Falta el secreto de integridad de Wompi');
      return false;
    }

    const requiredFields = ['name', 'email', 'address', 'city', 'state', 'phone', 'legalId'];
    requiredFields.forEach(field => {
      if (!shippingInfo[field]?.trim()) {
        errors[field] = 'Este campo es requerido';
        isValid = false;
      }
    });

    if (shippingInfo.email && !/^\S+@\S+\.\S+$/.test(shippingInfo.email)) {
      errors.email = 'Por favor ingresa un correo electrónico válido';
      isValid = false;
    }

    if (shippingInfo.phone) {
      const phoneDigits = shippingInfo.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        errors.phone = 'El teléfono debe tener al menos 10 dígitos (sin código de país)';
        isValid = false;
      }
    }

    if (shippingInfo.legalId && !/^[0-9]{6,12}$/.test(shippingInfo.legalId)) {
      errors.legalId = 'Documento de identidad inválido. Debe tener entre 6 y 12 dígitos';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  }, [shippingInfo, WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET]);

  const createOrder = useCallback(async (orderData, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/orders`, 
        orderData, 
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      if (!response?.data?.success || !response?.data?.order?._id) {
        throw new Error('No se pudo crear la orden');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error al crear orden:', error);
      throw new Error(error.response?.data?.error || 'Error al crear la orden');
    }
  }, [API_URL]);

  // MODIFICACIÓN PRINCIPAL: Cambiar la URL de redirección al perfil
  const redirectToWompiCheckout = useCallback((orderId, amountInCents, customerData) => {
    if (!WOMPI_PUBLIC_KEY) {
      throw new Error('Error de configuración: Clave pública de Wompi no definida');
    }

    const reference = `ORD_${orderId}_${Date.now()}`;
    
    let signature;
    try {
      signature = generateIntegritySignature(reference, amountInCents, 'COP');
    } catch (error) {
      throw new Error(`Error generando firma: ${error.message}`);
    }

    const baseUrl = 'https://checkout.wompi.co/p/';
    const params = new URLSearchParams({
      'public-key': WOMPI_PUBLIC_KEY,
      'currency': 'COP',
      'amount-in-cents': amountInCents.toString(),
      'reference': reference,
      'signature:integrity': signature,
      // CAMBIO AQUÍ: Redirigir al perfil en lugar de a la orden
      'redirect-url': `${window.location.origin}/profile`,
      'acceptance-token': WOMPI_ACCEPTANCE_TOKEN
    });

    if (customerData.email) {
      params.append('customer-data', JSON.stringify({
        email: customerData.email,
        full_name: customerData.name || '',
        phone_number: customerData.phone || '',
        legal_id: customerData.legalId || '',
        legal_id_type: customerData.legalIdType || 'CC'
      }));
    }

    const wompiCheckoutUrl = `${baseUrl}?${params.toString()}`;
    console.log('🔗 URL de checkout de Wompi:', wompiCheckoutUrl);
    
    // Limpiar carrito antes de redirigir
    clearCart();
    
    window.location.href = wompiCheckoutUrl;
  }, [generateIntegritySignature, WOMPI_PUBLIC_KEY, clearCart]);

  const handleCheckout = useCallback(async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      setError('Tu carrito está vacío');
      return;
    }

    if (!validateForm()) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Debes iniciar sesión para continuar con la compra');
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');
    setFormErrors({});

    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || null
        })),
        shippingAddress: {
          name: shippingInfo.name.trim(),
          email: shippingInfo.email.trim().toLowerCase(),
          address: shippingInfo.address.trim(),
          city: shippingInfo.city.trim(),
          state: shippingInfo.state.trim(),
          postalCode: shippingInfo.postalCode?.trim() || '000000',
          phone: shippingInfo.phone.replace(/\D/g, ''),
          legalId: shippingInfo.legalId,
          legalIdType: shippingInfo.legalIdType
        },
        paymentMethod: 'credit_card',
        itemsPrice: subtotal,
        shippingPrice: shipping,
        totalPrice: total
      };

      const orderResponse = await createOrder(orderData, token);
      const orderId = orderResponse.order._id;

      const amountInCents = Math.round(total * 100);
      const phoneDigits = shippingInfo.phone.replace(/\D/g, '');
      const formattedPhone = phoneDigits.startsWith('57') ? phoneDigits.substring(2) : phoneDigits;

      redirectToWompiCheckout(
        orderId,
        amountInCents,
        {
          email: shippingInfo.email.trim().toLowerCase(),
          name: shippingInfo.name.trim(),
          phone: formattedPhone,
          legalId: shippingInfo.legalId.toString(),
          legalIdType: shippingInfo.legalIdType
        }
      );

    } catch (error) {
      console.error('Error en checkout:', error);
      setError(error.message || 'Error al procesar el pedido. Verifica tus datos e intenta nuevamente.');
      setProcessing(false);
    }
  }, [
    cartItems, 
    validateForm, 
    navigate, 
    shippingInfo, 
    subtotal, 
    shipping, 
    total, 
    createOrder, 
    redirectToWompiCheckout
  ]);

  const handleRemoveItem = useCallback((productId) => {
    removeFromCart(productId);
    setError('');
    setSuccess('');
  }, [removeFromCart]);

  const handleUpdateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateCartItem(productId, { quantity: newQuantity });
    }
    setError('');
    setSuccess('');
  }, [removeFromCart, updateCartItem]);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  const handleDismissError = useCallback(() => {
    setError('');
  }, []);

  if (authLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto lg:max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tu Carrito de Compras</h1>
          <p className="text-gray-600 mb-8">Revisa y completa tu pedido</p>
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-blue-500" />
              <div>
                <p className="font-medium text-blue-800">Método de Pago Seguro</p>
                <p className="text-blue-700 text-sm mt-1">
                  Estás utilizando la integración directa con Wompi. Serás redirigido a su plataforma segura para completar el pago.
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <StatusMessage 
              type="error" 
              message={error} 
              onRetry={handleReload}
              onDismiss={handleDismissError}
            />
          )}

          {success && (
            <StatusMessage 
              type="success" 
              message={success} 
            />
          )}

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
            <div className="lg:col-span-7">
              {cartItems.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-4">No hay productos en tu carrito</p>
                  <button
                    onClick={() => navigate('/products')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primaryDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    Ver Productos
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900">Productos ({cartItems.length})</h2>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {cartItems.map(item => (
                      <CartItem 
                        key={item._id} 
                        item={item} 
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                        getImageUrl={getImageUrl}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-10 lg:mt-0 lg:col-span-5">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-4">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Resumen del Pedido</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-medium">{shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">${total.toLocaleString()}</span>
                  </div>
                </div>

                <form onSubmit={handleCheckout} className="space-y-6">
                  <ShippingForm 
                    shippingInfo={shippingInfo} 
                    onChange={handleInputChange}
                    errors={formErrors}
                  />

                  <div className="pt-4 border-t border-gray-200">
                    <button
                    type="submit"
                    disabled={processing || cartItems.length === 0 || !WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET}
                    className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-colors flex items-center justify-center ${
                      processing || cartItems.length === 0 || !WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 shadow-sm hover:shadow-md'
                    }`}
                    >
                      {processing ? (
                        <>
                          <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="h-5 w-5 mr-2" />
                          Pagar con Wompi
                        </>
                      )}
                    </button>

                    {(!WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET) && (
                      <p className="text-red-500 text-sm mt-2 text-center">
                        Error de configuración: Variables de Wompi no están definidas correctamente
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
                      <ShieldCheckIcon className="h-4 w-4 mr-1 text-green-500" />
                      <span>Pago seguro con encriptación SSL</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;