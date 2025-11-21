import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ShoppingBag, Clock, CheckCircle, XCircle, Search } from 'lucide-react';

interface OrderItem {
  pizza_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  user_name: string;
  user_email: string;
  shipping_address?: string;
  customer_phone?: string;
  payment_method?: string;
  total_price: number;
  status: 'ordered' | 'preparing' | 'shipped' | 'completed';
  created_at: any;
  items?: OrderItem[];
}

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ordered' | 'preparing' | 'shipped' | 'completed'>('all');

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const ordersQuery = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);

      const ordersList = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      setOrders(ordersList);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updated_at: new Date(),
      });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Gagal mengubah status pesanan');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'ordered': return 'bg-orange-100 text-orange-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'ordered': return <Clock className="w-4 h-4" />;
      case 'preparing': return <ShoppingBag className="w-4 h-4" />;
      case 'shipped': return <ShoppingBag className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels: Record<string, string> = {
      ordered: 'Dipesan',
      preparing: 'Dibuat',
      shipped: 'Dikirim',
      completed: 'Selesai',
    };
    return labels[status] || status;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat pesanan...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manajemen Pesanan</h1>
          <p className="text-slate-600 mt-1">Kelola semua pesanan pelanggan</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
            >
              <option value="all">Semua Status</option>
              <option value="ordered">Dipesan</option>
              <option value="preparing">Dibuat</option>
              <option value="shipped">Dikirim</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Pelanggan</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Tanggal</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{order.user_name}</p>
                          <p className="text-sm text-slate-500">{order.user_email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        Rp {Number(order.total_price).toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {order.created_at instanceof Timestamp
                          ? order.created_at.toDate().toLocaleDateString('id-ID')
                          : new Date(order.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                          className="px-3 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-slate-500"
                        >
                          <option value="ordered">Dipesan</option>
                          <option value="preparing">Dibuat</option>
                          <option value="shipped">Dikirim</option>
                          <option value="completed">Selesai</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-slate-500">
                      Tidak ada pesanan ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Dipesan</p>
            <p className="text-3xl font-bold text-orange-600">
              {orders.filter(o => o.status === 'ordered').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Dibuat</p>
            <p className="text-3xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'preparing').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Dikirim</p>
            <p className="text-3xl font-bold text-purple-600">
              {orders.filter(o => o.status === 'shipped').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Selesai (Revenue)</p>
            <p className="text-3xl font-bold text-green-600">
              {orders.filter(o => o.status === 'completed').length}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;
