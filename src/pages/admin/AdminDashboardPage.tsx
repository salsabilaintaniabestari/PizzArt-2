import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import RealtimeRevenue from '../../components/admin/RealtimeRevenue';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  todayOrders: number;
  processingOrders: number;
  completedOrders: number;
}

interface PopularPizza {
  name: string;
  count: number;
}

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    todayOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
  });
  const [popularPizzas, setPopularPizzas] = useState<PopularPizza[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const ordersQuery = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);

      const orders = await Promise.all(
        ordersSnapshot.docs.map(async (doc) => {
          const orderData = { id: doc.id, ...doc.data() };

          try {
            const itemsQuery = query(collection(db, 'order_items'), where('order_id', '==', doc.id));
            const itemsSnapshot = await getDocs(itemsQuery);
            orderData.order_items = itemsSnapshot.docs.map(itemDoc => itemDoc.data());
          } catch (err) {
            console.warn('Error loading order items for order', doc.id);
            orderData.order_items = [];
          }

          return orderData;
        })
      );

      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const inventory = inventorySnapshot.docs
        .map(doc => doc.data())
        .filter((item: any) => item.stock_quantity < (item.low_stock_threshold || 10));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalRevenue = orders
        .filter((o) => o.status === 'completed')
        .reduce((sum, order) => {
          const price = order.total_price || order.totalPrice || 0;
          return sum + Number(price);
        }, 0);
      const pendingOrders = orders.filter((o) => o.status === 'ordered').length;
      const processingOrders = orders.filter((o) => o.status === 'preparing' || o.status === 'shipped').length;
      const completedOrders = orders.filter((o) => o.status === 'completed').length;
      const todayOrders = orders.filter((o) => {
        if (!o.created_at) return false;
        const orderDate = new Date(o.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      }).length;

      setStats({
        totalOrders: orders.length,
        pendingOrders,
        totalRevenue,
        lowStockItems: inventory?.length || 0,
        todayOrders,
        processingOrders,
        completedOrders,
      });

      const pizzaCounts: Record<string, number> = {};
      orders.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          const name = item.pizza_name || 'Pizza';
          pizzaCounts[name] = (pizzaCounts[name] || 0) + (item.quantity || 1);
        });
      });

      const popular = Object.entries(pizzaCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setPopularPizzas(popular);
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        lowStockItems: 0,
        todayOrders: 0,
        processingOrders: 0,
        completedOrders: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Pesanan',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pesanan Hari Ini',
      value: stats.todayOrders,
      icon: Clock,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Pendapatan',
      value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Stok Rendah',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const statusCards = [
    {
      title: 'Menunggu',
      value: stats.pendingOrders,
      color: 'bg-orange-100 text-orange-800',
    },
    {
      title: 'Diproses',
      value: stats.processingOrders,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Selesai',
      value: stats.completedOrders,
      color: 'bg-green-100 text-green-800',
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Ringkasan statistik dan aktivitas sistem</p>
        </div>

        <RealtimeRevenue />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${card.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Status Pesanan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statusCards.map((card) => (
              <div key={card.title} className={`${card.color} rounded-lg p-4 text-center`}>
                <p className="text-sm font-medium mb-1">{card.title}</p>
                <p className="text-3xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Pizza Terpopuler
            </h2>
            <div className="space-y-3">
              {popularPizzas.length > 0 ? (
                popularPizzas.map((pizza, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-slate-800 text-white rounded-full text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-slate-900">{pizza.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-600">{pizza.count} terjual</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-8">Belum ada data pesanan</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pesanan Terbaru
            </h2>
            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{order.user_name}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        Rp {Number(order.total_price).toLocaleString('id-ID')}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'pending'
                            ? 'bg-orange-100 text-orange-800'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-8">Belum ada pesanan</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
