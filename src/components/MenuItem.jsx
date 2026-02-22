import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import './MenuItem.css';

const MenuItem = ({ item, globalOptions }) => {
  const { addToCart } = useCart();
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);

  const handleOptionChange = (optionGroup, choice) => {
    const { groupId, groupName, type } = optionGroup;
    const choiceData = {
      groupId,
      groupName,
      choiceId: choice.id,
      choiceLabel: choice.label,
      label: choice.label,
      priceDelta: Number(choice.priceDelta || 0),
    };

    setSelectedOptions((prev) => {
      const currentValue = prev[groupId];

      if (type === 'single') {
        return {
          ...prev,
          [groupId]: choiceData,
        };
      }

      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      const exists = currentArray.some((opt) => opt.choiceId === choice.id);

      return {
        ...prev,
        [groupId]: exists
          ? currentArray.filter((opt) => opt.choiceId !== choice.id)
          : [...currentArray, choiceData],
      };
    });
  };

  const getSelectedOptionsArray = () => {
    return Object.values(selectedOptions).flatMap((value) =>
      Array.isArray(value) ? value : value ? [value] : []
    );
  };

  const isChoiceChecked = (optionGroup, choice) => {
    const selected = selectedOptions[optionGroup.groupId];
    if (optionGroup.type === 'single') {
      return selected?.choiceId === choice.id;
    }

    return Array.isArray(selected)
      ? selected.some((opt) => opt.choiceId === choice.id)
      : false;
  };

  const getModalTotal = () => {
    const basePrice = Number(selectedVariant?.price ?? item.price ?? 0);
    const optionsTotal = getSelectedOptionsArray().reduce(
      (sum, opt) => sum + Number(opt.priceDelta || 0),
      0
    );
    return basePrice + optionsTotal;
  };

  // Resolve choices from choicesRef
  const resolveChoices = (optionGroup) => {
    if (Array.isArray(optionGroup.choices) && optionGroup.choices.length > 0) {
      return optionGroup.choices;
    }

    if (optionGroup.choicesRef && globalOptions) {
      // Parse the reference like "globalOptions.breads"
      const refPath = optionGroup.choicesRef.split('.');
      if (refPath[0] === 'globalOptions' && refPath[1]) {
        const resolved = globalOptions[refPath[1]];
        if (Array.isArray(resolved)) {
          return resolved;
        }
        if (resolved && typeof resolved === 'object') {
          return [resolved];
        }
      }
    }

    return [];
  };

  const handleAddToCart = () => {
    // Check if all required options are selected
    if (item.options) {
      const requiredOptions = item.options.filter((opt) => opt.required);
      const allRequiredSelected = requiredOptions.every((opt) =>
        opt.type === 'single'
          ? Boolean(selectedOptions[opt.groupId])
          : Array.isArray(selectedOptions[opt.groupId]) &&
            selectedOptions[opt.groupId].length > 0
      );

      if (!allRequiredSelected) {
        alert('Please select all required options');
        return;
      }
    }

    if (item.priceVariants?.length > 0 && !selectedVariant) {
      alert('Please select a size/variant');
      return;
    }

    const optionsArray = getSelectedOptionsArray();
    addToCart(item, optionsArray, selectedVariant);
    setShowOptions(false);
    setSelectedOptions({});
    setSelectedVariant(null);
    alert(`${item.name} added to cart!`);
  };

  const handleQuickAdd = () => {
    if (
      (item.options && item.options.length > 0) ||
      (item.priceVariants && item.priceVariants.length > 0)
    ) {
      setShowOptions(true);
    } else {
      addToCart(item, [], null);
      alert(`${item.name} added to cart!`);
    }
  };

  const displayPrice =
    item.priceVariants && item.priceVariants.length > 0
      ? `From $${Math.min(...item.priceVariants.map((variant) => Number(variant.price || 0))).toFixed(2)}`
      : `$${Number(item.price || 0).toFixed(2)}`;

  return (
    <>
      <div className={`menu-item ${!item.available ? 'unavailable' : ''}`}>
        <img src={item.image || '/placeholder.jpg'} alt={item.name} className="menu-item-image" />

        {item.tags && item.tags.length > 0 && (
          <div className="menu-item-tags">
            {item.tags.map((tag, idx) => (
              <span key={idx} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="menu-item-content">
          <h3 className="menu-item-name">{item.name}</h3>
          <p className="menu-item-description">{item.description}</p>
          <div className="menu-item-footer">
            <span className="menu-item-price">{displayPrice}</span>
            {item.available ? (
              <button className="add-to-cart-btn" onClick={handleQuickAdd}>
                Add to Cart
              </button>
            ) : (
              <span className="unavailable-badge">Unavailable</span>
            )}
          </div>
        </div>
      </div>

      {showOptions && (
        <div className="modal-overlay" onClick={() => setShowOptions(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowOptions(false)}>
              x
            </button>

            <h2>{item.name}</h2>
            <p className="modal-description">{item.description}</p>

            {item.priceVariants && item.priceVariants.length > 0 && (
              <div className="option-group">
                <h4>
                  Size
                  <span className="required">*</span>
                </h4>
                {item.priceVariants.map((variant) => (
                  <label key={variant.label} className="option-label">
                    <input
                      type="radio"
                      name="variant"
                      onChange={() => setSelectedVariant(variant)}
                      checked={selectedVariant?.label === variant.label}
                    />
                    {variant.label} - ${Number(variant.price || 0).toFixed(2)}
                  </label>
                ))}
              </div>
            )}

            {item.options?.map((optionGroup) => {
              const choices = resolveChoices(optionGroup);

              return (
                <div key={optionGroup.groupId} className="option-group">
                  <h4>
                    {optionGroup.groupName}
                    {optionGroup.required && <span className="required">*</span>}
                  </h4>
                  {choices.map((choice) => (
                    <label key={choice.id} className="option-label">
                      <input
                        type={optionGroup.type === 'single' ? 'radio' : 'checkbox'}
                        name={optionGroup.groupId}
                        onChange={() => handleOptionChange(optionGroup, choice)}
                        checked={isChoiceChecked(optionGroup, choice)}
                      />
                      {choice.label}
                      {Number(choice.priceDelta || 0) > 0 &&
                        ` (+$${Number(choice.priceDelta).toFixed(2)})`}
                    </label>
                  ))}
                </div>
              );
            })}

            <p className="modal-total">Your price: ${getModalTotal().toFixed(2)}</p>

            <button className="modal-add-btn" onClick={handleAddToCart}>
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItem;
