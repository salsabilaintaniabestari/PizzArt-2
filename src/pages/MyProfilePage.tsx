import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  X,
  Package,
  TrendingUp,
  Award,
  LogOut,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

interface Order {
  id: string;
  total_price: number;
  status: 'ordered' | 'preparing' | 'shipped' | 'completed';
  created_at: any; // Ubah dari string ke any
  order_items: any[];
}

const convertTimestamp = (timestamp: any): Date => {
  // Jika timestamp adalah Firestore Timestamp
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  // Jika sudah berupa Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  // Jika berupa string
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  // Jika berupa number (milliseconds)
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  // Default: return tanggal sekarang
  return new Date();
};

const MyProfilePage = () => {
  const { user, authUser, updateProfile, logout, isLoading: authLoading } = useUserAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate('/login');
    }
  }, [authUser, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!authUser) {
      setLoadingOrders(false);
      return;
    }

    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('user_id', '==', authUser.uid),
        orderBy('created_at', 'desc'),
        limit(5)
      );

      const ordersSnapshot = await getDocs(ordersQuery);

      const ordersData = await Promise.all(
        ordersSnapshot.docs.map(async (doc) => {
          const orderData = { id: doc.id, ...doc.data() } as Order;

          try {
            const itemsQuery = query(
              collection(db, 'order_items'),
              where('order_id', '==', doc.id)
            );
            const itemsSnapshot = await getDocs(itemsQuery);
            orderData.order_items = itemsSnapshot.docs.map(itemDoc => ({
              ...itemDoc.data()
            }));
          } catch (itemError) {
            console.warn(`Error loading items for order ${doc.id}:`, itemError);
            orderData.order_items = [];
          }

          return orderData;
        })
      );

      setOrders(ordersData);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      const errorMsg = error?.message || 'Gagal memuat pesanan';
      if (!errorMsg.includes('index')) {
        console.log('Collection orders mungkin kosong atau belum ada data');
      }
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const result = await updateProfile(formData);

    if (result.success) {
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      setIsEditing(false);
    } else {
      setMessage({ type: 'error', text: result.error || 'Gagal memperbarui profil' });
    }

    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered':
        return 'bg-orange-100 text-orange-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ordered: 'Dipesan',
      preparing: 'Dibuat',
      completed: 'Selesai',
      shipped: 'Dikirim',
    };
    return labels[status] || status;
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-8">
          Profil Saya
        </h1>

        {message && (
          <div
            className={`rounded-xl p-4 mb-6 flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Informasi Profil</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        username: user.username || '',
                        full_name: user.full_name || '',
                        phone: user.phone || '',
                        address: user.address || '',
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Batal
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    No. Telepon
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="08123456789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                      placeholder="Jl. Contoh No. 123, Jakarta"
                    />
                  </div>
                </div>

                {isEditing && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                )}
              </form>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Package className="w-6 h-6 text-red-600" />
                  Riwayat Pesanan
                </h2>
                <Link
                  to="/orders"
                  className="text-red-600 font-semibold hover:text-red-700 text-sm"
                >
                  Lihat Semua →
                </Link>
              </div>

              {loadingOrders ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Memuat pesanan...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-500">
                            {convertTimestamp(order.created_at).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-gray-400">ID: {order.id.slice(0, 8)}...</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-sm text-gray-600 mb-2">
                          {order.order_items.length} item
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">Total:</span>
                          <span className="text-lg font-bold text-red-600">
                            Rp {Number(order.total_price).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Belum ada pesanan</p>
                  <button
                    onClick={() => navigate('/order')}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Mulai Pesan
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl shadow-lg p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h3 className="text-xl font-bold">{user.username}</h3>
                  <p className="text-sm opacity-90">{user.email}</p>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold">Poin Loyalty</span>
                </div>
                <p className="text-3xl font-bold">{user.points}</p>
                <p className="text-sm opacity-80 mt-1">Kumpulkan poin untuk hadiah!</p>
              </div>

              <div className="bg-white bg-opacity-10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold">Total Pesanan</span>
                </div>
                <p className="text-3xl font-bold">{orders.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h3 className="font-bold text-gray-800 mb-4">Akun & Keamanan</h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Bergabung sejak:</span>
                  <br />
                  {convertTimestamp(user.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;
