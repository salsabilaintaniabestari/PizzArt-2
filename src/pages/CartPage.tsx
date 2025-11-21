import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useUserAuth } from '../context/UserAuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

const CartPage = () => {
  const { state, dispatch } = useApp();
  const { authUser, user } = useUserAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id: itemId, quantity: newQuantity } });
    }
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
  };

  const totalPrice = state.cart.reduce((total, item) => total + (item.pizza.price * item.quantity), 0);
  const totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);

  const handleCheckout = () => {
    if (state.cart.length === 0) return;

    if (!authUser) {
      alert('Silakan login terlebih dahulu untuk melakukan checkout');
      return;
    }

    if (!user?.address && !shippingAddress) {
      setCustomerName(user?.full_name || user?.username || '');
      setCustomerPhone(user?.phone || '');
      setShippingAddress(user?.address || '');
    }

    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
  console.log('🔍 === START DEBUG ORDER ===');
  console.log('1. Auth User:', authUser);
  console.log('2. Auth UID:', authUser?.uid);
  console.log('3. Auth Email:', authUser?.email);
  console.log('4. User Object:', user);
  console.log('5. Customer Name:', customerName);
  console.log('6. Customer Phone:', customerPhone);
  console.log('7. Shipping Address:', shippingAddress);
  console.log('8. Cart Items:', state.cart);
  
  if (!authUser) {
    alert('Anda harus login terlebih dahulu');
    navigate('/login');
    return;
  }

  if (!authUser.uid) {
    console.error('❌ authUser.uid is missing!');
    alert('Error: User ID tidak ditemukan. Silakan login ulang.');
    navigate('/login');
    return;
  }

  if (!shippingAddress.trim()) {
    alert('Mohon isi alamat pengiriman');
    return;
  }

  if (!customerName.trim()) {
    alert('Mohon isi nama lengkap');
    return;
  }

  if (!customerPhone.trim()) {
    alert('Mohon isi nomor telepon');
    return;
  }

  setIsProcessing(true);

  try {
    const finalTotal = Math.floor(totalPrice * 1.1);

    const orderData = {
      user_id: authUser.uid,
      user_email: authUser.email || user?.email || 'guest@pizza.com',
      user_name: customerName,
      shipping_address: shippingAddress,
      customer_phone: customerPhone,
      total_price: finalTotal,
      payment_method: 'COD',
      status: 'ordered',
      items_count: state.cart.length,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    console.log('9. Order Data to be sent:', orderData);
    console.log('10. Attempting to create order in Firestore...');

    const orderRef = await addDoc(collection(db, 'orders'), orderData);

    console.log('✅ Order created successfully! ID:', orderRef.id);

    // Create order items
    const orderItems = state.cart.map((item) => ({
      order_id: orderRef.id,
      pizza_name: item.pizza.name,
      size: item.pizza.size,
      crust: item.pizza.crust,
      sauce: item.pizza.sauce,
      toppings: item.pizza.toppings,
      quantity: item.quantity,
      price: item.pizza.price * item.quantity,
      created_at: serverTimestamp(),
    }));

    console.log('11. Order Items to be created:', orderItems);

    for (const item of orderItems) {
      await addDoc(collection(db, 'order_items'), item);
    }

    console.log('✅ All order items created successfully!');

    const pointsEarned = Math.floor(totalPrice / 1000);
    const newTotalPoints = (user?.points || 0) + pointsEarned;

    console.log('12. Adding points - Points earned:', pointsEarned, 'New total:', newTotalPoints);

    await updateDoc(doc(db, 'users', authUser.uid), {
      points: newTotalPoints,
    });

    console.log('✅ Points updated in Firestore!');

    dispatch({ type: 'ADD_POINTS', payload: pointsEarned });
    dispatch({ type: 'CLEAR_CART' });
    setShowConfirmModal(false);
    alert(`Pesanan berhasil dibuat! Anda mendapatkan +${pointsEarned} poin! Pembayaran dilakukan saat pesanan diterima (COD).`);
    navigate('/orders');
    
  } catch (error: any) {
    console.error('❌ === ERROR CREATING ORDER ===');
    console.error('Error object:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    let errorMessage = 'Terjadi kesalahan saat membuat pesanan';
    
    if (error?.code === 'permission-denied') {
      errorMessage = 'Permission denied: Anda tidak memiliki izin untuk membuat pesanan. Coba login ulang.';
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    alert(`Error: ${errorMessage}\n\nDetail: ${error?.code || 'unknown'}`);
  } finally {
    setIsProcessing(false);
    console.log('🔍 === END DEBUG ORDER ===');
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            to="/order"
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-semibold mr-4"
          >
            <ArrowLeft size={20} />
            <span>Lanjut Belanja</span>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
            🛒 Keranjang Belanja
          </h1>
        </div>

        {state.cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Keranjang Kosong</h2>
            <p className="text-gray-600 mb-8">Belum ada pizza yang dipilih. Yuk buat pizza pertamamu!</p>
            <Link
              to="/order"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 inline-flex items-center space-x-2"
            >
              <ShoppingBag size={24} />
              <span>Buat Pizza Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {state.cart.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl p-6 shadow-lg">
                  <div className="flex items-start space-x-6">
                    {/* Pizza Visual */}
                    <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                      🍕
                    </div>

                    {/* Pizza Details */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{item.pizza.name}</h3>
                      <div className="text-gray-600 text-sm mb-2">
                        <p>{item.pizza.size.charAt(0).toUpperCase() + item.pizza.size.slice(1)} • {item.pizza.crust} crust</p>
                        <p>Sauce: {item.pizza.sauce} • {item.pizza.toppings.length} toppings</p>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        Rp {item.pizza.price.toLocaleString()}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      
                      <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal ({item.quantity} item):</span>
                      <span className="font-bold text-xl text-gray-800">
                        Rp {(item.pizza.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 shadow-lg sticky top-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Ringkasan Pesanan</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items ({totalItems})</span>
                    <span className="font-semibold">Rp {totalPrice.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ongkir</span>
                    <span className="font-semibold text-green-600">Gratis</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pajak</span>
                    <span className="font-semibold">Rp {Math.floor(totalPrice * 0.1).toLocaleString()}</span>
                  </div>
                  
                  <hr className="border-gray-200" />
                  
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-2xl text-green-600">
                      Rp {Math.floor(totalPrice * 1.1).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Points Reward Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center text-yellow-800">
                    <span className="text-2xl mr-2">🏆</span>
                    <div>
                      <p className="font-semibold">Dapatkan Poin!</p>
                      <p className="text-sm">+{Math.floor(totalPrice / 1000)} poin setelah checkout</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag size={24} />
                  <span>Checkout Sekarang</span>
                </button>

                <div className="mt-4 text-center text-gray-600 text-sm">
                  <p>💰 Pembayaran: Cash on Delivery (COD)</p>
                  <p>📞 Customer service 24/7</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Konfirmasi Pesanan</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                  placeholder="08xxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Pengiriman
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Masukkan alamat lengkap untuk pengiriman"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-800 mb-1">Metode Pembayaran: COD</p>
                    <p className="text-sm text-yellow-700">
                      Pembayaran akan dilakukan saat pesanan diterima (Cash on Delivery)
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total Pesanan:</span>
                  <span className="font-bold text-gray-800">Rp {Math.floor(totalPrice * 1.1).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Memproses...' : 'Konfirmasi Pesanan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;