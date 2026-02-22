import React, { createContext, useState, useEffect, useContext } from 'react';

export const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item, selectedOptions = [], priceVariant = null) => {
    // Calculate item total
    let itemTotal = priceVariant ? priceVariant.price : item.price;
    
    selectedOptions.forEach(option => {
      itemTotal += option.priceDelta || 0;
    });

    const cartItem = {
      itemId: item.id,
      itemName: item.name,
      basePrice: item.price,
      selectedOptions,
      priceVariant,
      itemTotal,
      quantity: 1,
      image: item.image,
    };

    // Check if item with same options already exists
    const existingItemIndex = cartItems.findIndex(
      (ci) =>
        ci.itemId === cartItem.itemId &&
        JSON.stringify(ci.selectedOptions) === JSON.stringify(cartItem.selectedOptions) &&
        JSON.stringify(ci.priceVariant) === JSON.stringify(cartItem.priceVariant)
    );

    if (existingItemIndex !== -1) {
      const updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += 1;
      setCartItems(updatedCart);
    } else {
      setCartItems([...cartItems, cartItem]);
    }
  };

  const removeFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    const updatedCart = [...cartItems];
    updatedCart[index].quantity = newQuantity;
    setCartItems(updatedCart);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.itemTotal * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
