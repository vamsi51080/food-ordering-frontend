import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const TAX_RATE = 0.07; // 7% tax
  const subtotal = getCartTotal();
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty</h2>
        <p>Add some delicious items to get started!</p>
        <button onClick={() => navigate('/')} className="continue-shopping-btn">
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1>Your Cart</h1>

        <div className="cart-items">
          {cartItems.map((item, index) => (
            <div key={index} className="cart-item">
              <img src={item.image || '/placeholder.jpg'} alt={item.itemName} />
              
              <div className="cart-item-details">
                <h3>{item.itemName}</h3>
                
                {item.priceVariant && (
                  <p className="cart-item-variant">Size: {item.priceVariant.label}</p>
                )}
                
                {item.selectedOptions.length > 0 && (
                  <div className="cart-item-options">
                    {item.selectedOptions.map((opt, idx) => (
                      <span key={idx} className="option-badge">
                        {opt.label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(index, item.quantity - 1)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(index, item.quantity + 1)}>
                      +
                    </button>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="cart-item-price">
                ${(item.itemTotal * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (7%):</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <p className="payment-note">Payment at store upon pickup</p>

          <button
            className="checkout-btn"
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>

          <button className="clear-cart-btn" onClick={clearCart}>
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
