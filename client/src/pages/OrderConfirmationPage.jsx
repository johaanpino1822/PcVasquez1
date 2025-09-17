import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
  ExclamationCircleIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

// Componente para verificar el estado del pago
const PaymentStatusVerifier = ({ orderId, onVerify }) => {
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');

  const verifyPayment = async () => {
    setVerifying(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders/${orderId}/verify-payment`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      if (response.data.success) {
        if (response.data.paymentStatus === 'completed') {
          setMessage('✅ Pago confirmado correctamente');
          if (onVerify && response.data.order) {
            onVerify(response.data.order);
          }
        } else {
          let msg = 'ℹ️ El pago sigue pendiente. Si ya pagaste, contacta a soporte.';
          if (response.data.order?.paymentDetails?.transactionId) {
            msg += ` Número de transacción: ${response.data.order.paymentDetails.transactionId}`;
          }
          if (response.data.transactionStatus) {
            msg += ` (Estado en Wompi: ${response.data.transactionStatus})`;
          }
          setMessage(msg);
        }
      } else {
        setMessage('❌ ' + (response.data.error || 'Error al verificar el pago'));
        if (response.data.details) {
          console.error('Detalles del error:', response.data.details);
        }
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      let errorMsg = error.response?.data?.error || error.message;
      
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Tiempo de espera agotado. Verifica tu conexión e intenta nuevamente.';
      }
      
      setMessage('❌ Error al verificar el pago: ' + errorMsg);
      
      // Mostrar detalles en consola para depuración
      if (error.response) {
        console.error('Respuesta del error:', error.response.data);
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
      <div className="flex items-start">
        <InformationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
        <div className="flex-1">
          <p className="font-medium text-blue-700">Verificar estado de pago</p>
          <p className="text-blue-600 text-sm mt-1">
            Si ya realizaste el pago pero aún aparece como pendiente, verifica el estado actual.
          </p>
          <button
            onClick={verifyPayment}
            disabled={verifying}
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2 text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {verifying ? (
              <>
                <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                Verificando...
              </>
            ) : (
              'Verificar pago ahora'
            )}
          </button>
          {message && (
            <p className={`text-sm mt-2 ${
              message.includes('✅') ? 'text-green-600' : 
              message.includes('❌') ? 'text-red-600' : 'text-blue-600'
            }`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar el error de firma de Wompi
const WompiSignatureError = ({ onRetry, transactionId }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
      <div className="flex items-start">
        <ExclamationCircleIcon className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0 text-red-500" />
        <div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Error de Verificación Wompi</h2>
          <p className="text-red-700 mb-3">
            Se ha detectado un problema al verificar el pago con Wompi.
            {transactionId && ` ID de transacción: ${transactionId}`}
          </p>
          <div className="mb-4">
            <h3 className="font-semibold text-red-800 mb-1">Posibles causas:</h3>
            <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
              <li>La referencia de la orden no coincide con la de Wompi</li>
              <li>Problema de configuración entre entornos (producción/pruebas)</li>
              <li>La clave secreta de Wompi no coincide con la configurada</li>
              <li>El webhook de Wompi no se ha procesado correctamente</li>
            </ul>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold text-red-800 mb-1">Solución:</h3>
            <p className="text-red-700 text-sm">
              Contacta a soporte con el número de tu orden y el ID de transacción si está disponible.
              Nuestro equipo verificará manualmente el estado de tu pago.
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onRetry}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
            >
              Reintentar verificación
            </button>
            <a 
              href={`mailto:soporte@tienda.com?subject=Problema con pago de orden&body=Hola, tengo un problema con mi pago. Mi número de orden es: [NÚMERO DE ORDEN] y el ID de transacción es: ${transactionId || 'No disponible'}`}
              className="border border-red-600 text-red-600 px-4 py-2 rounded text-sm hover:bg-red-50"
            >
              Contactar soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar detalles de transacción exitosa
const TransactionDetails = ({ transaction }) => {
  if (!transaction) return null;

  return (
    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded">
      <div className="flex items-start">
        <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-green-500" />
        <div className="flex-1">
          <p className="font-medium text-green-700">Transacción procesada en Wompi</p>
          <div className="text-green-600 text-sm mt-1 space-y-1">
            {transaction.id && <p><span className="font-medium">ID:</span> {transaction.id}</p>}
            {transaction.status && <p><span className="font-medium">Estado:</span> {transaction.status}</p>}
            {transaction.payment_method_type && <p><span className="font-medium">Método:</span> {transaction.payment_method_type}</p>}
            {transaction.reference && <p><span className="font-medium">Referencia:</span> {transaction.reference}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollingCount, setPollingCount] = useState(0);
  const [isPollingActive, setIsPollingActive] = useState(true);
  const [maxPollingAttempts] = useState(30); // Aumentado para producción
  const [wompiSignatureError, setWompiSignatureError] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  // Función para manejar las URLs de imagen
  const getImageUrl = useCallback((imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/80';
    if (imagePath.startsWith('http')) return imagePath;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/products/${imagePath}`;
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      setError('');
      setWompiSignatureError(false);
      setTransactionDetails(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders/${id}`, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (!response.data || !response.data.data) {
        throw new Error('No se pudo cargar la información del pedido.');
      }

      const orderData = response.data.data;
      
      // Verificar si hay un error de firma de Wompi
      if (orderData.wompiSignatureError || orderData.paymentDetails?.wompiSignatureError) {
        setWompiSignatureError(true);
      }
      
      // Normalizar los datos de la orden
      const normalizedOrder = {
        ...orderData,
        items: Array.isArray(orderData.items) 
          ? orderData.items.map(item => ({
              ...item,
              product: item.product || {},
              _id: item._id || item.product?._id || Math.random().toString(36).substr(2, 9),
              name: item.name || item.product?.name || 'Producto sin nombre',
              price: item.price || item.product?.price || 0,
              quantity: item.quantity || 1,
              image: getImageUrl(item.image || item.product?.image || '')
            }))
          : [],
        shippingAddress: orderData.shippingAddress || orderData.shippingInfo || {},
        paymentStatus: orderData.paymentStatus || 'pending',
        paymentMethod: orderData.paymentMethod || 'No especificado',
        itemsPrice: orderData.itemsPrice || orderData.subtotal || 0,
        shippingPrice: orderData.shippingPrice || orderData.shipping || 0,
        totalPrice: orderData.totalPrice || orderData.total || 0,
        orderNumber: orderData.orderNumber || orderData._id?.slice(-6).toUpperCase() || ''
      };

      setOrder(normalizedOrder);
      
      // Detener el polling si el pago está completo
      if (normalizedOrder.paymentStatus === 'completed') {
        setIsPollingActive(false);
        
        // Mostrar detalles de la transacción si están disponibles
        if (orderData.paymentDetails) {
          setTransactionDetails(orderData.paymentDetails);
        }
      }
      
      return normalizedOrder.paymentStatus;
    } catch (err) {
      console.error('Error fetching order:', err);
      let errorMsg = err.response?.data?.error || err.message || 'No se pudo cargar la orden';
      
      if (err.code === 'ECONNABORTED') {
        errorMsg = 'Tiempo de espera agotado. Verifica tu conexión e intenta nuevamente.';
      }
      
      // Verificar si es un error de firma de Wompi
      if (err.response?.data?.wompiSignatureError || errorMsg.includes('firma') || errorMsg.includes('signature')) {
        setWompiSignatureError(true);
      }
      
      setError(errorMsg);
      setIsPollingActive(false);
      
      // Mostrar detalles en consola para depuración
      if (err.response) {
        console.error('Respuesta del error:', err.response.data);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [id, getImageUrl]);

  // Función para verificar el pago
  const verifyPaymentStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders/${id}/verify-payment`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data && response.data.success) {
        const newStatus = response.data.paymentStatus;
        
        // Actualizar el estado independientemente de si hay cambios
        setOrder(prev => ({ 
          ...prev, 
          paymentStatus: newStatus,
          paymentDetails: response.data.order?.paymentDetails || prev.paymentDetails
        }));
        
        // Actualizar detalles de transacción si están disponibles
        if (response.data.order?.paymentDetails) {
          setTransactionDetails(response.data.order.paymentDetails);
        }
        
        // Detener polling si el pago está completo
        if (newStatus === 'completed') {
          setIsPollingActive(false);
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error verifying payment:', err);
      
      // Verificar si es un error de firma de Wompi
      if (err.response?.data?.wompiSignatureError || err.message.includes('firma') || err.message.includes('signature')) {
        setWompiSignatureError(true);
      }
      
      // Mostrar detalles en consola para depuración
      if (err.response) {
        console.error('Respuesta del error:', err.response.data);
      }
      
      return false;
    }
  }, [id]);

  useEffect(() => {
    // Cargar orden inicial
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    let pollingInterval;
    
    if (isPollingActive && pollingCount < maxPollingAttempts) {
      // Configurar polling cada 10 segundos para verificar el estado del pago
      pollingInterval = setInterval(async () => {
        const paymentCompleted = await verifyPaymentStatus();
        setPollingCount(prev => prev + 1);
        
        // Detener después de máximo intentos
        if (paymentCompleted || pollingCount >= maxPollingAttempts - 1) {
          setIsPollingActive(false);
          console.log('Polling detenido:', { paymentCompleted, pollingCount });
        }
      }, 10000);
    }
    
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [isPollingActive, pollingCount, maxPollingAttempts, verifyPaymentStatus]);

  const handlePaymentVerified = useCallback((updatedOrder) => {
    setOrder(updatedOrder);
    if (updatedOrder.paymentStatus === 'completed') {
      setIsPollingActive(false);
      
      // Mostrar detalles de la transacción si están disponibles
      if (updatedOrder.paymentDetails) {
        setTransactionDetails(updatedOrder.paymentDetails);
      }
    }
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError('');
    setWompiSignatureError(false);
    setPollingCount(0);
    setIsPollingActive(true);
    fetchOrder();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <ArrowPathIcon className="animate-spin h-12 w-12 text-blue-500 mb-4 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-800">Cargando detalles del pedido...</h2>
          <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos momentos</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 mt-14">
        <div className="max-w-2xl mx-auto">
          {wompiSignatureError && (
            <WompiSignatureError 
              onRetry={handleRetry} 
              transactionId={order?.paymentDetails?.transactionId} 
            />
          )}
          
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-red-800 mb-2">Error al cargar el pedido</h2>
                <p className="text-red-700">{error}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button 
                    onClick={handleRetry}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Reintentar
                  </button>
                  <Link 
                    to="/orders"
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 flex items-center"
                  >
                    <ShoppingBagIcon className="h-4 w-4 mr-1" />
                    Ver mis pedidos
                  </Link>
                  <Link 
                    to="/"
                    className="text-blue-600 px-4 py-2 rounded hover:text-blue-800 flex items-center"
                  >
                    Volver al inicio
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 mt-14">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBagIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No se encontró la orden</h2>
          <p className="text-gray-600 mb-6">La orden que buscas no existe o no tienes permisos para verla.</p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/orders"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
            >
              <ShoppingBagIcon className="h-4 w-4 mr-1" />
              Ver mis pedidos
            </Link>
            <Link 
              to="/"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-14">
      <div className="max-w-2xl mx-auto">
        {wompiSignatureError && (
          <WompiSignatureError 
            onRetry={handleRetry} 
            transactionId={order.paymentDetails?.transactionId} 
          />
        )}
        
        {transactionDetails && <TransactionDetails transaction={transactionDetails} />}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Encabezado con estado de pago */}
          <div className={`p-6 ${order.paymentStatus === 'completed' ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="flex items-center justify-center mb-4">
              {order.paymentStatus === 'completed' ? (
                <CheckCircleIcon className="h-12 w-12 text-green-500" />
              ) : (
                <div className="relative">
                  <XCircleIcon className="h-12 w-12 text-yellow-500" />
                  {isPollingActive && (
                    <ArrowPathIcon className="animate-spin h-6 w-6 text-blue-500 absolute -top-1 -right-1" />
                  )}
                </div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-2">
              {order.paymentStatus === 'completed' 
                ? '¡Gracias por tu compra!' 
                : 'Pago pendiente'}
            </h1>
            
            <p className="text-center mb-4">
              {order.paymentStatus === 'completed'
                ? `Tu pedido #${order.orderNumber} ha sido confirmado y está siendo procesado.`
                : `Tu pedido #${order.orderNumber} está pendiente de pago.`}
            </p>

            {/* Mostrar verificador de pago si está pendiente */}
            {order.paymentStatus !== 'completed' && (
              <PaymentStatusVerifier 
                orderId={order._id} 
                onVerify={handlePaymentVerified}
              />
            )}

            {order.paymentStatus !== 'completed' && isPollingActive && (
              <div className="flex items-center justify-center text-sm text-blue-600 mt-2">
                <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" />
                <span>Verificando estado de pago automáticamente... ({pollingCount}/{maxPollingAttempts})</span>
              </div>
            )}

            {order.paymentStatus !== 'completed' && !isPollingActive && pollingCount >= maxPollingAttempts && (
              <div className="text-center text-sm text-gray-600 mt-2">
                La verificación automática ha finalizado. Si ya realizaste el pago, utiliza el botón de verificación manual.
              </div>
            )}
          </div>

          {/* Resumen de productos */}
          <div className="p-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Resumen del Pedido</h2>
            
            <div className="space-y-4 mb-6">
              {order.items && order.items.length > 0 ? (
                order.items.map(item => (
                  <div key={item._id} className="flex justify-between items-start border-b pb-4">
                    <div className="flex items-center">
                      <img 
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded mr-4"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80';
                          e.target.onerror = null;
                        }}
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Cantidad: {item.quantity}
                          {item.product?.size && ` • Talla: ${item.product.size}`}
                          {item.product?.color && ` • Color: ${item.product.color}`}
                        </p>
                        <p className="text-sm font-medium">${(item.price || 0).toLocaleString()} c/u</p>
                      </div>
                    </div>
                    <p className="font-medium whitespace-nowrap">
                      ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay productos en este pedido</p>
              )}
            </div>

            {/* Totales */}
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>${(order.itemsPrice || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Envío:</span>
                <span>${(order.shippingPrice || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                <span>Total:</span>
                <span>${(order.totalPrice || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-4">
                <span>Método de pago:</span>
                <span className="capitalize">{order.paymentMethod?.replace('_', ' ') || 'No especificado'}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Estado:</span>
                <span className="capitalize">
                  {order.paymentStatus === 'completed' ? 'Pagado' : 
                  order.paymentStatus === 'pending' ? 'Pendiente' : 
                  order.paymentStatus || 'Desconocido'}
                </span>
              </div>
            </div>
          </div>

          {/* Dirección de envío */}
          <div className="p-6 bg-gray-50 border-t">
            <h2 className="text-lg font-semibold mb-2">Dirección de Envío</h2>
            {order.shippingAddress && order.shippingAddress.name ? (
              <>
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}{order.shippingAddress.state && `, ${order.shippingAddress.state}`}</p>
                <p>Teléfono: {order.shippingAddress.phone}</p>
                {order.shippingAddress.email && <p>Email: {order.shippingAddress.email}</p>}
                {order.shippingAddress.additionalInfo && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Instrucciones adicionales:</span> {order.shippingAddress.additionalInfo}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-500">No se proporcionó dirección de envío</p>
            )}
          </div>

          {/* Información adicional para pedidos pagados */}
          {order.paymentStatus === 'completed' && order.paymentDetails && (
            <div className="p-6 bg-green-50 border-t">
              <h2 className="text-lg font-semibold mb-2">Información de Pago</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">ID de transacción:</span> {order.paymentDetails.transactionId || 'N/A'}</p>
                <p><span className="font-medium">Método:</span> {order.paymentDetails.method || 'N/A'}</p>
                <p><span className="font-medium">Monto:</span> ${order.paymentDetails.amount?.toLocaleString() || 'N/A'}</p>
                <p><span className="font-medium">Moneda:</span> {order.paymentDetails.currency || 'COP'}</p>
                <p><span className="font-medium">Procesado:</span> {order.paymentDetails.processedAt ? new Date(order.paymentDetails.processedAt).toLocaleString() : 'N/A'}</p>
                <p><span className="font-medium">Estado:</span> {order.paymentDetails.status ? order.paymentDetails.status.toUpperCase() : 'N/A'}</p>
                {order.paymentDetails.receiptUrl && (
                  <p className="md:col-span-2">
                    <span className="font-medium">Comprobante:</span>{' '}
                    <a href={order.paymentDetails.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Ver comprobante
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="p-6 border-t flex flex-wrap gap-3">
            <Link 
              to="/"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Seguir comprando
            </Link>
            <Link 
              to="/orders"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ver todos mis pedidos
            </Link>
            {order.paymentStatus === 'completed' && order.paymentDetails?.receiptUrl && (
              <a 
                href={order.paymentDetails.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
              >
                <CreditCardIcon className="h-4 w-4 mr-1" />
                Ver comprobante
              </a>
            )}
          </div>
        </div>

        {/* Información de depuración en consola */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-xs">
            <p className="font-medium">Información de depuración (solo desarrollo):</p>
            <p>Order ID: {id}</p>
            <p>Order Number: {order.orderNumber}</p>
            <p>Payment Status: {order.paymentStatus}</p>
            <p>Transaction ID: {order.paymentDetails?.transactionId || 'N/A'}</p>
            <button 
              onClick={() => console.log('Order details:', order)} 
              className="text-blue-600 mt-2"
            >
              Ver detalles en consola
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmationPage;