import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  if (!order) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-empty">
          <h2>No order found</h2>
          <button onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className="success-icon">✓</div>
        <h1>Order Placed Successfully!</h1>
        <p className="confirmation-message">
          Thank you for your order. We'll have it ready for pickup!
        </p>

        <div className="order-details">
          <h2>Order Details</h2>
          
          <div className="detail-row">
            <span>Order Number:</span>
            <strong>{order.orderNumber}</strong>
          </div>

          <div className="detail-row">
            <span>Customer:</span>
            <strong>{order.customerName}</strong>
          </div>

          <div className="detail-row">
            <span>Phone:</span>
            <strong>{order.customerPhone}</strong>
          </div>

          <div className="detail-row">
            <span>Pickup Time:</span>
            <strong>{order.pickupTime}</strong>
          </div>

          <div className="detail-row">
            <span>Total Amount:</span>
            <strong className="total-amount">${order.total.toFixed(2)}</strong>
          </div>

          <div className="payment-reminder">
            <strong>Payment at store upon pickup</strong>
          </div>
        </div>

        <div className="order-items">
          <h3>Your Items</h3>
          {order.items.map((item, index) => (
            <div key={index} className="confirmation-item">
              <span className="item-quantity">{item.quantity}x</span>
              <div className="item-details">
                <span className="item-name">{item.itemName}</span>
                {item.selectedOptions.length > 0 && (
                  <span className="item-options">
                    {item.selectedOptions.map((opt) => opt.label).join(', ')}
                  </span>
                )}
              </div>
              <span className="item-price">
                ${(item.itemTotal * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <button className="home-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;
