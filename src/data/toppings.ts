import { Topping } from '../types';

export const availableToppings: Topping[] = [
  // Meat
  { id: 'pepperoni', name: 'Pepperoni', category: 'meat', price: 15000, image: '🍕' },
  { id: 'sausage', name: 'Sausage', category: 'meat', price: 15000, image: '🌭' },
  { id: 'chicken', name: 'Grilled Chicken', category: 'meat', price: 15000, image: '🍗' },
  { id: 'beef', name: 'Smoked Beef', category: 'meat', price: 15000, image: '🍖' },
  
  // Vegetables
  { id: 'mushrooms', name: 'Fresh Mushrooms', category: 'vegetable', price: 10000, image: '🍄' },
  { id: 'bell-peppers', name: 'Bell Peppers', category: 'vegetable', price: 10000, image: '🫑' },
  { id: 'onions', name: 'Red Onions', category: 'vegetable', price: 8000, image: '🧅' },
  { id: 'tomatoes', name: 'Fresh Tomatoes', category: 'vegetable', price: 8000, image: '🍅' },
  { id: 'olives', name: 'Black Olives', category: 'vegetable', price: 10000, image: '🫒' },
  { id: 'chili', name: 'Sliced Chili', category: 'vegetable', price: 8000, image: '🌶️' },
  
  // Cheese
  { id: 'mozzarella', name: 'Extra Mozzarella', category: 'cheese', price: 10000, image: '🧀' },
  { id: 'parmesan', name: 'Parmesan', category: 'cheese', price: 10000, image: '🧀' },
  { id: 'cheddar', name: 'Sharp Cheddar', category: 'cheese', price: 10000, image: '🧀' },
];

export const baseSauces = [
  { id: 'tomato-sauce', name: 'Classic Tomato', price: 0 },
  { id: 'bbq-sauce', name: 'BBQ Sauce', price: 8000 },
];

export const pizzaSizes = [
  { id: 'small', name: 'Small (8")', basePrice: 25000 },
  { id: 'medium', name: 'Medium (12")', basePrice: 40000 },
];