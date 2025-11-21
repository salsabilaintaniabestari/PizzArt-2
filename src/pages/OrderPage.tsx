import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PizzaBuilder from '../components/pizza/PizzaBuilder';
import { Pizza } from '../types';

const OrderPage = () => {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const handlePizzaComplete = (pizza: Pizza) => {
    dispatch({ type: 'ADD_TO_CART', payload: { pizza, quantity: 1 } });
    dispatch({ type: 'ADD_POINTS', payload: 25 }); // Reward points for creating pizza
    
    // Show success message and redirect to cart
    alert('🎉 Pizza berhasil ditambahkan ke keranjang! Kamu mendapat +25 poin!');
    navigate('/cart');
  };

  return <PizzaBuilder onPizzaComplete={handlePizzaComplete} />;
};

export default OrderPage;