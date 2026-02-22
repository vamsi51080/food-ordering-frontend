import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, menuAPI, orderAPI } from '../utils/api';
import './AdminDashboard.css';

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
const PAST_ORDER_STATUSES = ['completed'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [ordersView, setOrdersView] = useState('current');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createItemLoading, setCreateItemLoading] = useState(false);
  const [editItemLoading, setEditItemLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newItemForm, setNewItemForm] = useState({
    categoryId: '',
    categoryName: '',
    name: '',
    description: '',
    price: '',
    image: '',
    tags: '',
    available: true,
    dealOneLabel: '',
    dealOnePrice: '',
    dealTwoLabel: '',
    dealTwoPrice: ''
  });
  const [editItemForm, setEditItemForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    tags: '',
    available: true,
    dealOneLabel: '',
    dealOnePrice: '',
    dealTwoLabel: '',
    dealTwoPrice: ''
  });

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchData = async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
          setError('');
        }

        await adminAPI.me(token);
        const [ordersResponse, menuResponse] = await Promise.all([
          orderAPI.getAllOrders('', token),
          menuAPI.getMenu()
        ]);

        setOrders(ordersResponse.data.data || []);
        setMenu(menuResponse.data.data || null);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          return;
        }
        if (!silent) {
          setError(err.response?.data?.message || 'Failed to load admin data');
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    };

    fetchData(false);

    const intervalId = setInterval(() => {
      fetchData(true);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [navigate, token]);

  const inventoryItems = useMemo(() => {
    if (!menu?.categories) {
      return [];
    }

    return menu.categories.flatMap((category) =>
      category.items.map((item) => ({
        ...item,
        categoryName: category.name
      }))
    );
  }, [menu]);

  const currentOrders = useMemo(
    () => orders.filter((order) => !PAST_ORDER_STATUSES.includes(order.status)),
    [orders]
  );

  const pastOrders = useMemo(
    () => orders.filter((order) => PAST_ORDER_STATUSES.includes(order.status)),
    [orders]
  );

  const handleOrderStatusChange = async (orderId, status) => {
    try {
      await orderAPI.updateOrderStatus(orderId, status, token);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status } : order
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleInventoryToggle = async (itemId, available) => {
    try {
      await menuAPI.updateItemAvailability(itemId, available, token);
      setMenu((prevMenu) => ({
        ...prevMenu,
        categories: prevMenu.categories.map((category) => ({
          ...category,
          items: category.items.map((item) =>
            item.id === itemId ? { ...item, available } : item
          )
        }))
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update inventory');
    }
  };

  const handleNewItemChange = (event) => {
    const { name, value, type, checked } = event.target;
    setNewItemForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const buildPriceVariants = (form) => {
    const variants = [];

    if (form.dealOneLabel && form.dealOnePrice !== '') {
      variants.push({
        label: form.dealOneLabel.trim(),
        price: Number(form.dealOnePrice)
      });
    }

    if (form.dealTwoLabel && form.dealTwoPrice !== '') {
      variants.push({
        label: form.dealTwoLabel.trim(),
        price: Number(form.dealTwoPrice)
      });
    }

    return variants.filter(
      (variant) => variant.label && !Number.isNaN(variant.price) && variant.price >= 0
    );
  };

  const handleCreateItem = async (event) => {
    event.preventDefault();
    setError('');

    if (!newItemForm.name || !newItemForm.price) {
      setError('Item name and price are required');
      return;
    }

    if (!newItemForm.categoryId && !newItemForm.categoryName) {
      setError('Select an existing category or provide a new category name');
      return;
    }

    try {
      setCreateItemLoading(true);
      await menuAPI.createMenuItem(
        {
          categoryId: newItemForm.categoryId || undefined,
          categoryName: newItemForm.categoryName || undefined,
          name: newItemForm.name,
          description: newItemForm.description,
          price: Number(newItemForm.price),
          image: newItemForm.image,
          tags: newItemForm.tags,
          available: newItemForm.available,
          priceVariants: buildPriceVariants(newItemForm)
        },
        token
      );

      const menuResponse = await menuAPI.getMenu();
      setMenu(menuResponse.data.data || null);
      setNewItemForm({
        categoryId: '',
        categoryName: '',
        name: '',
        description: '',
        price: '',
        image: '',
        tags: '',
        available: true,
        dealOneLabel: '',
        dealOnePrice: '',
        dealTwoLabel: '',
        dealTwoPrice: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create item');
    } finally {
      setCreateItemLoading(false);
    }
  };

  const startEditItem = (item) => {
    const variants = item.priceVariants || [];
    setEditingItemId(item.id);
    setEditItemForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price ?? '',
      image: item.image || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      available: item.available !== false,
      dealOneLabel: variants[0]?.label || '',
      dealOnePrice: variants[0]?.price ?? '',
      dealTwoLabel: variants[1]?.label || '',
      dealTwoPrice: variants[1]?.price ?? ''
    });
  };

  const handleEditItemChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditItemForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveItemEdit = async (itemId) => {
    if (!editItemForm.name || editItemForm.price === '') {
      setError('Item name and price are required');
      return;
    }

    try {
      setEditItemLoading(true);
      await menuAPI.updateMenuItem(
        itemId,
        {
          name: editItemForm.name,
          description: editItemForm.description,
          price: Number(editItemForm.price),
          image: editItemForm.image,
          tags: editItemForm.tags,
          available: editItemForm.available,
          priceVariants: buildPriceVariants(editItemForm)
        },
        token
      );

      const menuResponse = await menuAPI.getMenu();
      setMenu(menuResponse.data.data || null);
      setEditingItemId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item');
    } finally {
      setEditItemLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    const confirmed = window.confirm('Delete this item from inventory?');
    if (!confirmed) {
      return;
    }

    try {
      await menuAPI.deleteMenuItem(itemId, token);
      setMenu((prevMenu) => ({
        ...prevMenu,
        categories: prevMenu.categories.map((category) => ({
          ...category,
          items: category.items.filter((item) => item.id !== itemId)
        }))
      }));
      if (editingItemId === itemId) {
        setEditingItemId(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await adminAPI.logout(token);
      }
    } catch (err) {
      // Ignore logout failure and clear local token anyway.
    } finally {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <p className="admin-loading">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>

        <div className="admin-tabs">
          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button
            className={activeTab === 'inventory' ? 'active' : ''}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
        </div>

        {error && <p className="admin-error">{error}</p>}

        {activeTab === 'orders' && (
          <div className="admin-panel">
            <h2>Order Management</h2>
            <div className="orders-subtabs">
              <button
                className={ordersView === 'current' ? 'active' : ''}
                onClick={() => {
                  setExpandedOrderId(null);
                  setOrdersView('current');
                }}
              >
                Current Orders ({currentOrders.length})
              </button>
              <button
                className={ordersView === 'past' ? 'active' : ''}
                onClick={() => {
                  setExpandedOrderId(null);
                  setOrdersView('past');
                }}
              >
                Past Orders ({pastOrders.length})
              </button>
            </div>

            {(ordersView === 'current' ? currentOrders : pastOrders).length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Pickup</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ordersView === 'current' ? currentOrders : pastOrders).map((order) => {
                      const isExpanded = expandedOrderId === order._id;
                      return (
                        <React.Fragment key={order._id}>
                          <tr>
                            <td>{order.orderNumber}</td>
                            <td>{order.customerName}</td>
                            <td>{order.customerEmail || 'N/A'}</td>
                            <td>{order.customerPhone}</td>
                            <td>{order.pickupTime}</td>
                            <td>${Number(order.total).toFixed(2)}</td>
                            <td>
                              <select
                                value={order.status}
                                onChange={(event) =>
                                  handleOrderStatusChange(order._id, event.target.value)
                                }
                              >
                                {ORDER_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <button
                                className="order-details-btn"
                                onClick={() =>
                                  setExpandedOrderId(isExpanded ? null : order._id)
                                }
                              >
                                {isExpanded ? 'Hide' : 'View'}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="order-details-row">
                              <td colSpan={8}>
                                <div className="order-details-panel">
                                  <div className="order-meta-grid">
                                    <p>
                                      <strong>Email:</strong>{' '}
                                      {order.customerEmail || 'N/A'}
                                    </p>
                                    <p>
                                      <strong>Phone:</strong>{' '}
                                      {order.customerPhone || 'N/A'}
                                    </p>
                                    <p>
                                      <strong>Pickup Time:</strong>{' '}
                                      {order.pickupTime || 'N/A'}
                                    </p>
                                    <p>
                                      <strong>Subtotal:</strong> $
                                      {Number(order.subtotal || 0).toFixed(2)}
                                    </p>
                                    <p>
                                      <strong>Tax:</strong> $
                                      {Number(order.tax || 0).toFixed(2)}
                                    </p>
                                    <p>
                                      <strong>Placed At:</strong>{' '}
                                      {order.createdAt
                                        ? new Date(order.createdAt).toLocaleString()
                                        : 'N/A'}
                                    </p>
                                  </div>

                                  {order.notes && (
                                    <p className="order-notes">
                                      <strong>Notes:</strong> {order.notes}
                                    </p>
                                  )}

                                  <h4>Items</h4>
                                  <ul className="order-items-list">
                                    {(order.items || []).map((item, index) => (
                                      <li key={`${item.itemId}-${index}`}>
                                        <div>
                                          <strong>
                                            {item.quantity}x {item.itemName}
                                          </strong>
                                          {item.priceVariant?.label && (
                                            <span> | Size: {item.priceVariant.label}</span>
                                          )}
                                          {item.selectedOptions?.length > 0 && (
                                            <div className="order-item-options">
                                              Options:{' '}
                                              {item.selectedOptions
                                                .map(
                                                  (opt) =>
                                                    opt.choiceLabel ||
                                                    opt.label ||
                                                    opt.choiceId ||
                                                    'Option'
                                                )
                                                .join(', ')}
                                            </div>
                                          )}
                                        </div>
                                        <span>
                                          $
                                          {Number(
                                            (item.itemTotal || 0) * (item.quantity || 1)
                                          ).toFixed(2)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="admin-panel">
            <h2>Inventory Management</h2>
            <form className="add-item-form" onSubmit={handleCreateItem}>
              <h3>Add New Stock Item</h3>

              <div className="add-item-grid">
                <div className="form-control">
                  <label>Existing Category</label>
                  <select
                    name="categoryId"
                    value={newItemForm.categoryId}
                    onChange={handleNewItemChange}
                  >
                    <option value="">Select category</option>
                    {(menu?.categories || []).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label>Or New Category Name</label>
                  <input
                    name="categoryName"
                    type="text"
                    value={newItemForm.categoryName}
                    onChange={handleNewItemChange}
                    placeholder="Example: Salads"
                  />
                </div>

                <div className="form-control">
                  <label>Item Name *</label>
                  <input
                    name="name"
                    type="text"
                    value={newItemForm.name}
                    onChange={handleNewItemChange}
                  />
                </div>

                <div className="form-control">
                  <label>Price *</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemForm.price}
                    onChange={handleNewItemChange}
                  />
                </div>

                <div className="form-control form-control-wide">
                  <label>Description</label>
                  <input
                    name="description"
                    type="text"
                    value={newItemForm.description}
                    onChange={handleNewItemChange}
                    placeholder="Short item description"
                  />
                </div>

                <div className="form-control form-control-wide">
                  <label>Image URL</label>
                  <input
                    name="image"
                    type="text"
                    value={newItemForm.image}
                    onChange={handleNewItemChange}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-control form-control-wide">
                  <label>Tags (comma-separated)</label>
                  <input
                    name="tags"
                    type="text"
                    value={newItemForm.tags}
                    onChange={handleNewItemChange}
                    placeholder="popular, spicy, vegetarian"
                  />
                </div>

                <div className="form-control">
                  <label>Deal 1 Label</label>
                  <input
                    name="dealOneLabel"
                    type="text"
                    value={newItemForm.dealOneLabel}
                    onChange={handleNewItemChange}
                    placeholder="Single"
                  />
                </div>

                <div className="form-control">
                  <label>Deal 1 Price</label>
                  <input
                    name="dealOnePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemForm.dealOnePrice}
                    onChange={handleNewItemChange}
                    placeholder="3.99"
                  />
                </div>

                <div className="form-control">
                  <label>Deal 2 Label</label>
                  <input
                    name="dealTwoLabel"
                    type="text"
                    value={newItemForm.dealTwoLabel}
                    onChange={handleNewItemChange}
                    placeholder="2 Pc Deal"
                  />
                </div>

                <div className="form-control">
                  <label>Deal 2 Price</label>
                  <input
                    name="dealTwoPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemForm.dealTwoPrice}
                    onChange={handleNewItemChange}
                    placeholder="6.99"
                  />
                </div>
              </div>

              <label className="checkbox-control">
                <input
                  name="available"
                  type="checkbox"
                  checked={newItemForm.available}
                  onChange={handleNewItemChange}
                />
                In Stock
              </label>

              <button type="submit" className="add-item-btn" disabled={createItemLoading}>
                {createItemLoading ? 'Adding...' : 'Add Item'}
              </button>
            </form>

            {inventoryItems.length === 0 ? (
              <p>No menu items found.</p>
            ) : (
              <div className="inventory-list">
                {inventoryItems.map((item) => (
                  <div key={item.id} className="inventory-item">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.categoryName}</p>
                      {item.priceVariants?.length > 0 && (
                        <p className="variant-text">
                          Deals:{' '}
                          {item.priceVariants
                            .map((variant) => `${variant.label} ($${Number(variant.price).toFixed(2)})`)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="inventory-actions">
                      <button
                        className={item.available ? 'in-stock' : 'out-of-stock'}
                        onClick={() => handleInventoryToggle(item.id, !item.available)}
                      >
                        {item.available ? 'In Stock' : 'Out of Stock'}
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() =>
                          editingItemId === item.id
                            ? setEditingItemId(null)
                            : startEditItem(item)
                        }
                      >
                        {editingItemId === item.id ? 'Cancel Edit' : 'Edit'}
                      </button>
                      <button className="delete-btn" onClick={() => handleDeleteItem(item.id)}>
                        Delete
                      </button>
                    </div>

                    {editingItemId === item.id && (
                      <div className="edit-item-form">
                        <h4>Edit Item</h4>
                        <div className="add-item-grid">
                          <div className="form-control">
                            <label>Item Name *</label>
                            <input
                              name="name"
                              type="text"
                              value={editItemForm.name}
                              onChange={handleEditItemChange}
                            />
                          </div>
                          <div className="form-control">
                            <label>Price *</label>
                            <input
                              name="price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={editItemForm.price}
                              onChange={handleEditItemChange}
                            />
                          </div>
                          <div className="form-control form-control-wide">
                            <label>Description</label>
                            <input
                              name="description"
                              type="text"
                              value={editItemForm.description}
                              onChange={handleEditItemChange}
                            />
                          </div>
                          <div className="form-control form-control-wide">
                            <label>Image URL</label>
                            <input
                              name="image"
                              type="text"
                              value={editItemForm.image}
                              onChange={handleEditItemChange}
                            />
                          </div>
                          <div className="form-control form-control-wide">
                            <label>Tags (comma-separated)</label>
                            <input
                              name="tags"
                              type="text"
                              value={editItemForm.tags}
                              onChange={handleEditItemChange}
                            />
                          </div>
                          <div className="form-control">
                            <label>Deal 1 Label</label>
                            <input
                              name="dealOneLabel"
                              type="text"
                              value={editItemForm.dealOneLabel}
                              onChange={handleEditItemChange}
                            />
                          </div>
                          <div className="form-control">
                            <label>Deal 1 Price</label>
                            <input
                              name="dealOnePrice"
                              type="number"
                              step="0.01"
                              min="0"
                              value={editItemForm.dealOnePrice}
                              onChange={handleEditItemChange}
                            />
                          </div>
                          <div className="form-control">
                            <label>Deal 2 Label</label>
                            <input
                              name="dealTwoLabel"
                              type="text"
                              value={editItemForm.dealTwoLabel}
                              onChange={handleEditItemChange}
                            />
                          </div>
                          <div className="form-control">
                            <label>Deal 2 Price</label>
                            <input
                              name="dealTwoPrice"
                              type="number"
                              step="0.01"
                              min="0"
                              value={editItemForm.dealTwoPrice}
                              onChange={handleEditItemChange}
                            />
                          </div>
                        </div>
                        <label className="checkbox-control">
                          <input
                            name="available"
                            type="checkbox"
                            checked={editItemForm.available}
                            onChange={handleEditItemChange}
                          />
                          In Stock
                        </label>
                        <button
                          className="save-edit-btn"
                          onClick={() => handleSaveItemEdit(item.id)}
                          disabled={editItemLoading}
                        >
                          {editItemLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
