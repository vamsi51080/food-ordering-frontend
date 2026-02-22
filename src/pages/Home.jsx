import React, { useState, useEffect } from 'react';
import { menuAPI } from '../utils/api';
import MenuItem from '../components/MenuItem';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import './Home.css';

const Home = () => {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMenu(false);

    const intervalId = setInterval(() => {
      fetchMenu(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchMenu = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await menuAPI.getMenu();
      setMenu(response.data.data);
    } catch (err) {
      if (!silent) {
        setError('Failed to load menu. Please try again.');
      }
      console.error(err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
  };

  const filterItems = () => {
    if (!menu) return [];

    let filteredCategories = menu.categories;

    // Filter by selected category
    if (selectedCategory) {
      filteredCategories = filteredCategories.filter(
        (cat) => cat.id === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery) {
      filteredCategories = filteredCategories
        .map((category) => ({
          ...category,
          items: category.items.filter(
            (item) =>
              item.name.toLowerCase().includes(searchQuery) ||
              item.description.toLowerCase().includes(searchQuery)
          ),
        }))
        .filter((category) => category.items.length > 0);
    }

    return filteredCategories;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => fetchMenu(false)}>Retry</button>
      </div>
    );
  }

  const filteredCategories = filterItems();

  return (
    <div className="home">
      <div className="hero">
        <h1>{menu?.store?.name}</h1>
        <p>{menu?.store?.tagline}</p>
        <div className="store-info">
          <p>{menu?.store?.addressLine1}</p>
          <p>{menu?.store?.cityStateZip}</p>
          <p>{menu?.store?.phone}</p>
          <p className="pickup-note">{menu?.store?.pickupNote}</p>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} />

      <CategoryFilter
        categories={menu?.categories || []}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <div className="menu-container">
        {filteredCategories.length === 0 ? (
          <p className="no-results">No items found</p>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="category-section" id={category.id}>
              <h2 className="category-title">{category.name}</h2>
              <p className="category-description">{category.description}</p>
              <div className="menu-grid">
                {category.items.map((item) => (
                  <MenuItem 
                    key={item.id} 
                    item={item} 
                    globalOptions={menu?.globalOptions}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
