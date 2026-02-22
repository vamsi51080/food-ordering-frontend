import React from 'react';
import './CategoryFilter.css';

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="category-filter">
      <button
        className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
        onClick={() => onSelectCategory(null)}
      >
        All Items
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
          onClick={() => onSelectCategory(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
