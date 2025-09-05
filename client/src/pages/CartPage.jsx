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
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Constantes para configuración
const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const WOMPI_PUBLIC_KEY = process.env.REACT_APP_WOMPI_PUBLIC_KEY || 'pub_prod_WixDpB6CttsHQtutUQTpYwwiWN54qEEc';
const WOMPI_INTEGRITY_SECRET = process.env.REACT_APP_WOMPI_INTEGRITY_SECRET || 'prod_integrity_eNbECYglk1XeAtwswDTPxX29Dy9kc4Ag';
const WOMPI_MERCHANT_ID = process.env.REACT_APP_WOMPI_MERCHANT_ID || '298501';

// Tokens de aceptación de Wompi
const WOMPI_ACCEPTANCE_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJjb250cmFjdF9pZCI6MjQzLCJwZXJtYWxpbmsiOiJodHRwczovL3dvbXBpLmNvbS9hc3NldHMvZG93bmxvYWRibGUvcmVnbGFtZW50by1Vc3Vhcmlvcy1Db2xvbWJpYS5wZGYiLCJmaWxlX2hhc2giOiJkMWVkMDI3NjhlNDEzZWEyMzFmNzAwMjc0N2Y0N2FhOSIsImppdCI6IjE3NTY4NTY3OTctNjUxNTkiLCJlbWFpbCI6IiIsImV4cCI6MTc1Njg2MDM5N30.-60sRPCKuH01348JLhmzkZyMZ-KrO2fj526Mu8XnAC4';

// BLOQUEO SUPER AGRESIVO DEL SDK WOMPI - REFORZADO
(function() {
  if (typeof window === 'undefined') return;
  
  console.log('🔧 Iniciando bloqueo agresivo del SDK Wompi...');
  
  // 1. Eliminar scripts existentes de Wompi de forma más agresiva
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
  
  // 2. Bloquear globales de Wompi de forma más completa
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
  
  // 3. Bloquear dynamic imports y appendChild de forma más robusta
  const blockDynamicLoading = () => {
    // Guardar originales
    const originalAppendChild = Element.prototype.appendChild;
    const originalCreateElement = Document.prototype.createElement;
    
    // Override appendChild
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
    
    // Override createElement
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
  
  // Ejecutar todas las protecciones
  removeWompiScripts();
  blockWompiGlobals();
  blockDynamicLoading();
  
  // Limpiar periódicamente por si se intenta cargar después
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
  
  const styles = {
    error: 'bg-red-100 border-red-500 text-red-700',
    success: 'bg-green-100 border-green-500 text-green-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700'
  };
  
  const IconComponent = icons[type];
  
  return (
    <div className={`border-l-4 p-4 mb-6 rounded flex items-start ${styles[type]}`}>
      <IconComponent className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        {type === 'error' && (
          <div className="mt-2 flex space-x-2">
            <button 
              onClick={onRetry}
              className="text-sm underline"
            >
              Recargar página
            </button>
            <button 
              onClick={onDismiss}
              className="text-sm underline"
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
    <ArrowPathIcon className="animate-spin h-12 w-12 text-blue-500" />
  </div>
);

// Componente para elementos del carrito
const CartItem = ({ item, onUpdateQuantity, onRemoveItem, getImageUrl }) => {
  const handleQuantityChange = useCallback((newQuantity) => {
    onUpdateQuantity(item._id, newQuantity);
  }, [item._id, onUpdateQuantity]);

  return (
    <li className="p-4 flex flex-col sm:flex-row">
      <div className="flex-shrink-0">
        <img
          src={getImageUrl(item.image)}
          alt={item.name}
          className="h-24 w-24 object-cover rounded"
          onError={(e) => {
            e.target.src = '/placeholder-product.jpg';
            e.target.onerror = null;
          }}
        />
      </div>
      <div className="ml-4 flex-1">
        <div className="flex justify-between">
          <h3 className="text-lg font-medium">{item.name}</h3>
          <p className="text-lg font-semibold">
            ${(item.price * item.quantity).toLocaleString()}
          </p>
        </div>
        <p className="text-gray-600">${item.price.toLocaleString()} c/u</p>
        
        <div className="mt-2 flex items-center">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="disabled:opacity-50 text-gray-500 hover:text-gray-700 p-1"
            aria-label="Disminuir cantidad"
          >
            <MinusIcon className="h-5 w-5" />
          </button>
          <span className="mx-2 text-gray-700 w-8 text-center">
            {item.quantity}
          </span>
          <button 
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label="Aumentar cantidad"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => onRemoveItem(item._id)}
            className="ml-auto text-red-500 hover:text-red-700 p-1"
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
    <div className="space-y-4">
      <h3 className="font-medium">Información de Envío</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre Completo *
        </label>
        <input
          type="text"
          name="name"
          value={shippingInfo.name}
          onChange={handleChange}
          className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
            errors.name ? 'border-red-500' : ''
          }`}
          required
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correo Electrónico *
        </label>
        <input
          type="email"
          name="email"
          value={shippingInfo.email}
          onChange={handleChange}
          className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
            errors.email ? 'border-red-500' : ''
          }`}
          required
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección *
        </label>
        <input
          type="text"
          name="address"
          value={shippingInfo.address}
          onChange={handleChange}
          className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
            errors.address ? 'border-red-500' : ''
          }`}
          required
        />
        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ciudad *
          </label>
          <input
            type="text"
            name="city"
            value={shippingInfo.city}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
              errors.city ? 'border-red-500' : ''
            }`}
            required
            placeholder="Bogotá"
          />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departamento/Estado *
          </label>
          <input
            type="text"
            name="state"
            value={shippingInfo.state}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
              errors.state ? 'border-red-500' : ''
            }`}
            required
            placeholder="Cundinamarca"
          />
          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <input
            type="tel"
            name="phone"
            value={shippingInfo.phone}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
              errors.phone ? 'border-red-500' : ''
            }`}
            required
            placeholder="3233019836"
          />
          <p className="text-xs text-gray-500 mt-1">Sin código de país (57)</p>
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código Postal
          </label>
          <input
            type="text"
            name="postalCode"
            value={shippingInfo.postalCode}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="110111"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Documento *
          </label>
          <select
            name="legalIdType"
            value={shippingInfo.legalIdType}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            required
          >
            <option value="CC">Cédula</option>
            <option value="CE">Cédula Extranjería</option>
            <option value="TI">Tarjeta Identidad</option>
            <option value="PP">Pasaporte</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Documento de Identidad *
          </label>
          <input
            type="text"
            name="legalId"
            value={shippingInfo.legalId}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
              errors.legalId ? 'border-red-500' : ''
            }`}
            required
            placeholder="1234567890"
          />
          {errors.legalId && <p className="text-red-500 text-xs mt-1">{errors.legalId}</p>}
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
    subtotal = 0 
  } = useCart();
  
  const { loading: authLoading } = useAuth();
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

  // Verificar que el bloqueo esté funcionando
  useEffect(() => {
    console.log('🔍 Verificando bloqueo de Wompi SDK...');
    console.log('window.$wompi:', window.$wompi);
    console.log('window.Wompi:', window.Wompi);
    console.log('window.wompi:', window.wompi);
    
    // Verificar variables de entorno
    console.log('Variables de entorno React:', {
      API_URL,
      WOMPI_PUBLIC_KEY: WOMPI_PUBLIC_KEY ? 'Configurada' : 'Falta configurar',
      WOMPI_INTEGRITY_SECRET: WOMPI_INTEGRITY_SECRET ? 'Configurada' : 'Falta configurar',
      WOMPI_MERCHANT_ID: WOMPI_MERCHANT_ID ? 'Configurada' : 'Falta configurar'
    });
    
    // Verificar periódicamente que no se carguen scripts de Wompi
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

  // Función para manejar las URLs de imagen
  const getImageUrl = useCallback((imagePath) => {
    if (!imagePath) return '/placeholder-product.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}/uploads/products/${imagePath}`;
  }, []);

  // Calcular envío y total
  const { shipping, total } = useMemo(() => {
    const shippingCost = subtotal > 100000 ? 0 : 8000;
    return {
      shipping: shippingCost,
      total: subtotal + shippingCost
    };
  }, [subtotal]);

  // Generar firma de integridad - CORREGIDO Y MEJORADO
  const generateIntegritySignature = useCallback((reference, amountInCents, currency = 'COP') => {
    if (!WOMPI_INTEGRITY_SECRET) {
      console.error('❌ Falta el secreto de integridad de Wompi');
      throw new Error('Falta el secreto de integridad de Wompi');
    }
    
    try {
      // Formato CORRECTO para la firma según documentación de Wompi
      // reference + amountInCents + currency + WOMPI_INTEGRITY_SECRET
      const data = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`;
      console.log('📝 Datos para firma:', data);
      
      // Crear hash SHA256
      const signature = crypto.createHash('sha256').update(data).digest('hex');
      console.log('🔐 Firma generada:', signature);
      
      return signature;
    } catch (error) {
      console.error('❌ Error generando firma:', error);
      throw new Error('Error al generar la firma de integridad');
    }
  }, [WOMPI_INTEGRITY_SECRET]);

  // Manejar cambios en el formulario
  const handleInputChange = useCallback((name, value) => {
    setShippingInfo(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [formErrors]);

  // Validar formulario
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

  // Crear orden en el backend
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
  }, []);

  // Redirección directa a checkout de Wompi - CORREGIDA
  const redirectToWompiCheckout = useCallback((orderId, amountInCents, customerData) => {
    if (!WOMPI_PUBLIC_KEY) {
      throw new Error('Error de configuración: Clave pública de Wompi no definida');
    }

    // Generar referencia única (usar guión bajo en lugar de guión para evitar problemas)
    const reference = `ORD_${orderId}_${Date.now()}`;
    
    // Generar firma de integridad
    let signature;
    try {
      signature = generateIntegritySignature(reference, amountInCents, 'COP');
    } catch (error) {
      throw new Error(`Error generando firma: ${error.message}`);
    }

    // Construir URL de checkout - FORMA CORRECTA
    const baseUrl = 'https://checkout.wompi.co/p/';
    const params = new URLSearchParams({
      'public-key': WOMPI_PUBLIC_KEY,
      'currency': 'COP',
      'amount-in-cents': amountInCents.toString(),
      'reference': reference,
      'signature:integrity': signature, // ¡CORRECCIÓN IMPORTANTE!
      'redirect-url': `${window.location.origin}/order/${orderId}`,
      'acceptance-token': WOMPI_ACCEPTANCE_TOKEN
    });

    // Agregar datos del cliente si están disponibles
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
    
    // Redirección directa
    window.location.href = wompiCheckoutUrl;
  }, [generateIntegritySignature, WOMPI_PUBLIC_KEY]);

  // Manejar checkout
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
      // Preparar datos de la orden
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

      // Crear orden en el backend
      const orderResponse = await createOrder(orderData, token);
      const orderId = orderResponse.order._id;

      // Preparar datos para Wompi
      const amountInCents = Math.round(total * 100);
      const phoneDigits = shippingInfo.phone.replace(/\D/g, '');
      const formattedPhone = phoneDigits.startsWith('57') ? phoneDigits.substring(2) : phoneDigits;

      // Redirección a Wompi
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

  // Resto de funciones auxiliares
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tu Carrito de Compras</h1>
      
      {/* Mensaje informativo sobre el método de pago */}
      <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
          <div>
            <p className="font-medium text-blue-700">Método de Pago Seguro</p>
            <p className="text-blue-600 text-sm mt-1">
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

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {cartItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 mb-4">No hay productos en tu carrito</p>
              <button
                onClick={() => navigate('/products')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Ver Productos
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200">
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

        <div>
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Resumen del Pedido</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>{shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              <ShippingForm 
                shippingInfo={shippingInfo} 
                onChange={handleInputChange}
                errors={formErrors}
              />

              <button
                type="submit"
                disabled={processing || cartItems.length === 0 || !WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white mt-4 transition-colors ${
                  processing || cartItems.length === 0 || !WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } flex items-center justify-center`}
              >
                {processing ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    Procesando...
                  </>
                ) : (
                  'Pagar con Wompi'
                )}
              </button>

              {(!WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET) && (
                <p className="text-red-500 text-sm mt-2">
                  Error de configuración: Variables de Wompi no están definidas correctamente
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;