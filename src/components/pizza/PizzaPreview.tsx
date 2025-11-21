import React from 'react';
import { Topping } from '../../types';

interface PizzaPreviewProps {
  size: 'small' | 'medium' | 'large';
  crust: 'thin' | 'thick' | 'stuffed';
  sauce: string;
  toppings: Topping[];
}

const PizzaPreview: React.FC<PizzaPreviewProps> = ({ size, crust, sauce, toppings }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'w-48 h-48';
      case 'medium': return 'w-64 h-64';
      case 'large': return 'w-80 h-80';
      default: return 'w-64 h-64';
    }
  };

  const getCrustStyle = () => {
    switch (crust) {
      case 'thin': return 'border-6 border-amber-700';
      case 'thick': return 'border-8 border-amber-800';
      case 'stuffed': return 'border-10 border-yellow-600';
      default: return 'border-6 border-amber-700';
    }
  };

  const getSauceColor = () => {
    switch (sauce) {
      case 'tomato': return 'bg-red-700';
      case 'white': return 'bg-gray-100';
      case 'bbq': return 'bg-amber-900';
      case 'pesto': return 'bg-green-700';
      case 'spicy': return 'bg-red-800';
      default: return 'bg-red-700';
    }
  };

  // Generate circular positions for toppings
  const generateCircularPositions = (count: number, radius: number = 30) => {
    const positions = [];
    const centerX = 50;
    const centerY = 50;
    
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // Add some randomness to make it look more natural
      const randomOffset = 8;
      const finalX = Math.max(15, Math.min(85, x + (Math.random() - 0.5) * randomOffset));
      const finalY = Math.max(15, Math.min(85, y + (Math.random() - 0.5) * randomOffset));
      
      positions.push({ top: finalY, left: finalX });
    }
    
    return positions;
  };

  // Generate multiple circular layers for more toppings
  const generateMultiLayerPositions = (count: number) => {
    const positions = [];
    
    if (count <= 6) {
      // Single circle
      return generateCircularPositions(count, 25);
    } else {
      // Multiple circles
      const innerCount = Math.ceil(count / 2);
      const outerCount = count - innerCount;
      
      const innerPositions = generateCircularPositions(innerCount, 15);
      const outerPositions = generateCircularPositions(outerCount, 30);
      
      return [...innerPositions, ...outerPositions];
    }
  };

  // Get special sauce overlay with neat patterns
  const getSpecialSauceOverlay = () => {
    const specialSauces = toppings.filter(t => t.category === 'sauce');
    if (specialSauces.length === 0) return null;

    return specialSauces.map((sauceTopping, index) => {
      switch (sauceTopping.id) {
        case 'truffle-oil':
          return (
            <div 
              key={`sauce-${index}`}
              className="absolute inset-2 bg-yellow-400 opacity-30 rounded-full"
              style={{ zIndex: 5 }}
            />
          );
        case 'ranch':
          return (
            <div 
              key={`sauce-${index}`}
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{ zIndex: 10 }}
            >
              {/* Neat parallel lines like in the image */}
              <div className="absolute top-1/4 left-1/4 right-1/4 h-1 bg-white opacity-80 rounded-full"></div>
              <div className="absolute top-2/5 left-1/5 right-1/5 h-1 bg-white opacity-80 rounded-full"></div>
              <div className="absolute top-3/5 left-1/4 right-1/4 h-1 bg-white opacity-80 rounded-full"></div>
              <div className="absolute top-3/4 left-1/3 right-1/3 h-1 bg-white opacity-80 rounded-full"></div>
            </div>
          );
        case 'hot-sauce':
          return (
            <div 
              key={`sauce-${index}`}
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{ zIndex: 10 }}
            >
              {/* Neat red sauce lines */}
              <div className="absolute top-1/3 left-1/4 right-1/4 h-1 bg-red-600 opacity-90 rounded-full"></div>
              <div className="absolute top-1/2 left-1/5 right-1/5 h-1 bg-red-600 opacity-90 rounded-full"></div>
              <div className="absolute top-2/3 left-1/3 right-1/3 h-1 bg-red-600 opacity-90 rounded-full"></div>
            </div>
          );
        case 'pesto-drizzle':
          return (
            <div 
              key={`sauce-${index}`}
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{ zIndex: 10 }}
            >
              {/* Neat green pesto lines */}
              <div className="absolute top-1/4 left-1/5 right-1/3 h-1 bg-green-600 opacity-80 rounded-full transform rotate-12"></div>
              <div className="absolute top-1/2 left-1/3 right-1/5 h-1 bg-green-600 opacity-80 rounded-full transform -rotate-12"></div>
              <div className="absolute top-3/4 left-1/4 right-1/4 h-1 bg-green-600 opacity-80 rounded-full transform rotate-6"></div>
            </div>
          );
        default:
          return null;
      }
    });
  };

  // Separate toppings by category (excluding sauce)
  const regularToppings = toppings.filter(t => t.category !== 'sauce');
  
  // Generate positions for all toppings
  const toppingElements: JSX.Element[] = [];

  regularToppings.forEach((topping, toppingIndex) => {
    let count = 1;
    let emoji = topping.image;
    let size = 'text-lg';

    // Determine count and appearance based on topping type
    switch (topping.category) {
      case 'meat':
        count = topping.id === 'pepperoni' ? 8 : 6;
        size = 'text-xl';
        break;
      case 'vegetable':
        count = 7;
        size = 'text-lg';
        break;
      case 'cheese':
        count = 10;
        size = 'text-sm';
        // Use different cheese representations
        if (topping.id === 'mozzarella') emoji = '⚪';
        else if (topping.id === 'cheddar') emoji = '🟡';
        else if (topping.id === 'parmesan') emoji = '🟨';
        else if (topping.id === 'goat-cheese') emoji = '⚪';
        break;
    }

    const positions = generateMultiLayerPositions(count);

    positions.forEach((position, posIndex) => {
      toppingElements.push(
        <div
          key={`${topping.id}-${toppingIndex}-${posIndex}`}
          className={`absolute ${size} transform hover:scale-125 transition-transform cursor-pointer`}
          style={{
            top: `${position.top}%`,
            left: `${position.left}%`,
            zIndex: 15 + toppingIndex,
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.3))'
          }}
        >
          {emoji}
        </div>
      );
    });
  });

  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${getSizeClass()} ${getCrustStyle()} ${getSauceColor()} rounded-full relative overflow-hidden transition-all duration-500 transform hover:scale-105 shadow-2xl`}>
        {/* Base cheese layer */}
        <div className="absolute inset-3 bg-yellow-200 rounded-full opacity-90" style={{ zIndex: 1 }}></div>
        
        {/* Special sauce overlays */}
        {getSpecialSauceOverlay()}
        
        {/* Regular toppings */}
        {toppingElements}
        
        {/* Pizza shine effect */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
          <div className="absolute top-4 left-4 w-8 h-8 bg-white opacity-20 rounded-full blur-sm"></div>
          <div className="absolute top-8 right-6 w-4 h-4 bg-white opacity-15 rounded-full blur-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default PizzaPreview;