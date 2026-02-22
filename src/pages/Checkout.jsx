import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../utils/api';
import './Checkout.css';

const PICKUP_SLOT_COUNT = 12;

const getRoundedPickupSlots = (count = PICKUP_SLOT_COUNT) => {
  const now = new Date();
  const rounded = new Date(now);

  const minutes = rounded.getMinutes();
  const addMinutes = minutes === 0 || minutes === 30 ? 0 : 30 - (minutes % 30);
  rounded.setMinutes(minutes + addMinutes, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const slot = new Date(rounded);
    slot.setMinutes(rounded.getMinutes() + index * 30);
    return slot.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const pickupSlots = useMemo(() => getRoundedPickupSlots(), []);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    pickupTime: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const TAX_RATE = 0.07; // 7% tax
  const subtotal = getCartTotal();
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName || !formData.customerPhone || !formData.pickupTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        pickupTime: formData.pickupTime,
        notes: formData.notes,
        items: cartItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
      };

      console.log('Sending order data:', orderData);

      const response = await orderAPI.createOrder(orderData);
      
      clearCart();
      navigate('/order-confirmation', { state: { order: response.data.data } });
    } catch (err) {
      console.error('Order error:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/')}>Browse Menu</button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1>Checkout</h1>

        <div className="checkout-content">
          <form onSubmit={handleSubmit} className="checkout-form">
            <h2>Customer Information</h2>

            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Pickup Time *</label>
              <select
                name="pickupTime"
                value={formData.pickupTime}
                onChange={handleChange}
                required
              >
                <option value="">Select a time</option>
                <option value="ASAP">ASAP (20-30 mins)</option>
                {pickupSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Special Instructions</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any special requests?"
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="place-order-btn" disabled={loading}>
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>

          <div className="order-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-items">
              {cartItems.map((item, index) => (
                <div key={index} className="summary-item">
                  <div className="summary-item-info">
                    <span className="summary-item-name">
                      {item.itemName} x{item.quantity}
                    </span>
                    {item.selectedOptions.length > 0 && (
                      <span className="summary-item-options">
                        {item.selectedOptions.map((opt) => opt.label).join(', ')}
                      </span>
                    )}
                  </div>
                  <span className="summary-item-price">
                    ${(item.itemTotal * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-calculations">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax (7%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="summary-total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <p className="payment-info">
              <strong>Payment at store upon pickup</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
