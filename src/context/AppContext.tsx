import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, Pizza, CartItem, Achievement, Contest } from '../types';

interface AppState {
  user: User | null;
  cart: CartItem[];
  communityPizzas: Pizza[];
  contests: Contest[];
  isAuthenticated: boolean;
}

type AppAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_TO_CART'; payload: { pizza: Pizza; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'ADD_COMMUNITY_PIZZA'; payload: Pizza }
  | { type: 'LIKE_PIZZA'; payload: string }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }
  | { type: 'ADD_POINTS'; payload: number };

const initialState: AppState = {
  user: null,
  cart: [],
  communityPizzas: [
    {
      id: '1',
      name: 'Dragon Fire Special',
      size: 'large',
      crust: 'thick',
      sauce: 'spicy',
      toppings: [],
      price: 89000,
      createdBy: 'user1',
      likes: 247,
    },
    {
      id: '2',
      name: 'Garden Paradise',
      size: 'medium',
      crust: 'thin',
      sauce: 'pesto',
      toppings: [],
      price: 65000,
      createdBy: 'user2',
      likes: 156,
    },
    {
      id: '3',
      name: 'Meat Lovers Deluxe',
      size: 'large',
      crust: 'stuffed',
      sauce: 'bbq',
      toppings: [],
      price: 95000,
      createdBy: 'user3',
      likes: 312,
    },
  ],
  contests: [
    {
      id: '1',
      title: 'Summer Vibes Pizza',
      description: 'Create a pizza that captures the essence of summer!',
      theme: 'Summer',
      prize: 'Rp 500,000 + Pizza for a Year',
      endDate: new Date('2025-02-28'),
      submissions: [],
    },
  ],
  isAuthenticated: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, cart: [] };
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.pizza.id === action.payload.pizza.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.pizza.id === action.payload.pizza.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { id: Date.now().toString(), ...action.payload }],
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload),
      };
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'ADD_COMMUNITY_PIZZA':
      return {
        ...state,
        communityPizzas: [action.payload, ...state.communityPizzas],
      };
    case 'LIKE_PIZZA':
      return {
        ...state,
        communityPizzas: state.communityPizzas.map(pizza =>
          pizza.id === action.payload ? { ...pizza, likes: pizza.likes + 1 } : pizza
        ),
      };
    case 'ADD_POINTS':
      return {
        ...state,
        user: state.user ? { ...state.user, points: state.user.points + action.payload } : state.user,
      };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};