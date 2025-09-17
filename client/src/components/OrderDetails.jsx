import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../css/OrderDetails.css';

// Componente de Estado de Pago (integrado directamente)
const PaymentStatus = ({ orderId, orderNumber }) => {
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [verificationCount, setVerificationCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const verifyPaymentStatus = async () => {
    try {
      setIsVerifying(true);
      const response = await axios.get(`http://localhost:5000/api/orders/${orderId}/verify-payment`);
      setPaymentStatus(response.data.paymentStatus);
      setOrderDetails(response.data.order);
    } catch (error) {
      console.error('Error verificando estado de pago:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (paymentStatus === 'pending' && verificationCount < 20) {
      const interval = setInterval(() => {
        verifyPaymentStatus();
        setVerificationCount(prev => prev + 1);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [paymentStatus, verificationCount]);

  useEffect(() => {
    verifyPaymentStatus();
  }, [orderId]);

  return (
    <div className="payment-status-container">
      <h2>Estado de Pago</h2>
      
      {paymentStatus === 'pending' && (
        <div className="status-pending">
          <p>Tu pedido #{orderNumber} está pendiente de pago.</p>
          <p>Si ya realizaste el pago pero aún aparece como pendiente, verifica el estado actual.</p>
          
          <div className="verification-info">
            <p>Verificando estado de pago automáticamente... ({verificationCount}/20)</p>
          </div>
          
          <button 
            onClick={verifyPaymentStatus} 
            disabled={isVerifying}
            className="verify-button"
          >
            {isVerifying ? 'Verificando...' : 'Verificar pago ahora'}
          </button>
        </div>
      )}
      
      {paymentStatus === 'completed' && (
        <div className="status-approved">
          <h3>¡Pago Aprobado!</h3>
          <p>Tu pedido #{orderNumber} ha sido confirmado y está siendo procesado.</p>
          {orderDetails?.paymentDetails?.transactionId && (
            <p>Número de transacción: {orderDetails.paymentDetails.transactionId}</p>
          )}
        </div>
      )}
      
      {paymentStatus === 'failed' && (
        <div className="status-rejected">
          <h3>Pago Rechazado</h3>
          <p>El pago para tu pedido #{orderNumber} no pudo ser procesado.</p>
          <button onClick={verifyPaymentStatus} className="retry-button">
            Reintentar verificación
          </button>
        </div>
      )}
    </div>
  );
};

// Página principal de Detalles de Orden
const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`/api/orders/${orderId}`);
        setOrder(response.data.data);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('No se pudo cargar la información de la orden');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Cargando detalles de la orden...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <h2>Error</h2>
      <p>{error}</p>
      <Link to="/orders" className="back-link">Volver a mis pedidos</Link>
    </div>
  );
  
  if (!order) return (
    <div className="not-found-container">
      <h2>Orden no encontrada</h2>
      <p>La orden que buscas no existe o no tienes permisos para verla.</p>
      <Link to="/orders" className="back-link">Volver a mis pedidos</Link>
    </div>
  );

  return (
    <div className="order-details-container">
      <div className="order-header">
        <h1>Detalles de la Orden #{order.orderNumber}</h1>
        <Link to="/orders" className="back-link">← Volver a mis pedidos</Link>
      </div>
      
      {/* Componente de estado de pago */}
      <PaymentStatus orderId={orderId} orderNumber={order.orderNumber} />
      
      <div className="order-content">
        <div className="order-info-card">
          <h2>Información de la Orden</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Fecha:</span>
              <span className="info-value">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Estado:</span>
              <span className={`status-badge status-${order.status}`}>
                {order.status === 'pending' && 'Pendiente'}
                {order.status === 'processing' && 'Procesando'}
                {order.status === 'shipped' && 'Enviado'}
                {order.status === 'delivered' && 'Entregado'}
                {order.status === 'cancelled' && 'Cancelado'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Método de pago:</span>
              <span className="info-value">
                {order.paymentMethod === 'credit_card' && 'Tarjeta de crédito'}
                {order.paymentMethod === 'nequi' && 'Nequi'}
                {order.paymentMethod === 'pse' && 'PSE'}
                {order.paymentMethod === 'cash' && 'Efectivo'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Total:</span>
              <span className="info-value">${order.total?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="order-items-card">
          <h2>Productos</h2>
          <div className="items-list">
            {order.items && order.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="image-placeholder">Imagen no disponible</div>
                  )}
                </div>
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>Cantidad: {item.quantity}</p>
                  <p>Precio unitario: ${item.price?.toLocaleString()}</p>
                  <p className="item-total">Total: ${(item.price * item.quantity)?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="order-summary">
            <div className="summary-item">
              <span>Subtotal:</span>
              <span>${order.subtotal?.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span>Envío:</span>
              <span>${order.shipping?.toLocaleString()}</span>
            </div>
            <div className="summary-item total">
              <span>Total:</span>
              <span>${order.total?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="shipping-info-card">
          <h2>Dirección de Envío</h2>
          <div className="shipping-details">
            <p><strong>{order.shippingInfo?.name}</strong></p>
            <p>{order.shippingInfo?.address}</p>
            <p>{order.shippingInfo?.city}</p>
            <p>Teléfono: {order.shippingInfo?.phone}</p>
            <p>Email: {order.shippingInfo?.email}</p>
            {order.shippingInfo?.additionalInfo && (
              <p>Información adicional: {order.shippingInfo.additionalInfo}</p>
            )}
          </div>
        </div>

        {order.paymentDetails && (
          <div className="payment-details-card">
            <h2>Detalles del Pago</h2>
            <div className="info-grid">
              {order.paymentDetails.transactionId && (
                <div className="info-item">
                  <span className="info-label">ID de Transacción:</span>
                  <span className="info-value">{order.paymentDetails.transactionId}</span>
                </div>
              )}
              {order.paymentDetails.status && (
                <div className="info-item">
                  <span className="info-label">Estado:</span>
                  <span className="info-value">{order.paymentDetails.status}</span>
                </div>
              )}
              {order.paymentDetails.processedAt && (
                <div className="info-item">
                  <span className="info-label">Procesado:</span>
                  <span className="info-value">
                    {new Date(order.paymentDetails.processedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;