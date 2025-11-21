import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pizza, User, ShoppingCart, Trophy, Users, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useUserAuth } from '../../context/UserAuthContext';

const Header = () => {
  const { state } = useApp();
  const { user, authUser, logout } = useUserAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const cartItemsCount = state.cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-white font-bold text-2xl hover:scale-105 transition-transform">
            <div className="bg-white p-2 rounded-full text-red-600">
              <Pizza size={28} />
            </div>
            <span className="bg-gradient-to-r from-yellow-300 to-white bg-clip-text text-transparent">
              Pizzart
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/order"
              className="text-white hover:text-yellow-300 transition-colors font-medium flex items-center space-x-1"
            >
              <Pizza size={18} />
              <span>Create Pizza</span>
            </Link>
            <Link
              to="/community"
              className="text-white hover:text-yellow-300 transition-colors font-medium flex items-center space-x-1"
            >
              <Users size={18} />
              <span>Community</span>
            </Link>
            <Link
              to="/contests"
              className="text-white hover:text-yellow-300 transition-colors font-medium flex items-center space-x-1"
            >
              <Trophy size={18} />
              <span>Contests</span>
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {authUser && user ? (
              <>
                {/* Points */}
                <div className="hidden md:flex items-center bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-semibold">
                  <Trophy size={16} className="mr-1" />
                  {user.points || 0}
                </div>

                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-all"
                >
                  <ShoppingCart className="text-white" size={20} />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>

                {/* Profile */}
                <Link
                  to="/my-profile"
                  className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-all"
                >
                  <User className="text-white" size={20} />
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 bg-opacity-80 p-2 rounded-full hover:bg-opacity-100 transition-all"
                  title="Logout"
                >
                  <LogOut className="text-white" size={20} />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="bg-white text-red-600 px-4 py-2 rounded-full font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;