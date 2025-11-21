import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';

interface RevenueStats {
  total_revenue: number;
  total_orders: number;
  total_payments: number;
  today: {
    total_revenue: number;
    total_orders: number;
    successful_payments: number;
  };
  recent: Array<{
    date: string;
    total_revenue: number;
    total_orders: number;
    successful_payments: number;
  }>;
  pending_payments: number;
}

const RealtimeRevenue: React.FC = () => {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadStats();

    const unsubscribe = onSnapshot(collection(db, 'orders'), () => {
      loadStats();
    });

    const interval = setInterval(loadStats, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadStats = async () => {
    try {
      const ordersQuery = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);

      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let totalRevenue = 0;
      let todayRevenue = 0;
      let todayOrders = 0;
      let completedOrders = 0;
      let todayCompletedOrders = 0;

      orders.forEach((order: any) => {
        if (order.status === 'completed') {
          const amount = order.total_price || 0;
          totalRevenue += Number(amount);
          completedOrders += 1;

          const orderDate = order.created_at instanceof Timestamp
            ? order.created_at.toDate()
            : new Date(order.created_at);
          orderDate.setHours(0, 0, 0, 0);

          if (orderDate.getTime() === today.getTime()) {
            todayRevenue += Number(amount);
            todayCompletedOrders += 1;
          }
        }
      });

      const pendingOrders = orders.filter((o: any) => o.status === 'ordered').length;

      todayOrders = orders.filter((order: any) => {
        if (!order.created_at) return false;
        const orderDate = order.created_at instanceof Timestamp
          ? order.created_at.toDate()
          : new Date(order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      }).length;

      const last30Days: Array<{
        date: string;
        total_revenue: number;
        total_orders: number;
        successful_payments: number;
      }> = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        let dayRevenue = 0;
        let dayOrders = 0;
        let dayCompletedOrders = 0;

        orders.forEach((order: any) => {
          if (!order.created_at) return;
          const orderDate = order.created_at instanceof Timestamp
            ? order.created_at.toDate()
            : new Date(order.created_at);
          orderDate.setHours(0, 0, 0, 0);

          if (orderDate.getTime() === date.getTime()) {
            dayOrders += 1;
            if (order.status === 'completed') {
              dayRevenue += Number(order.total_price || 0);
              dayCompletedOrders += 1;
            }
          }
        });

        last30Days.push({
          date: date.toISOString(),
          total_revenue: dayRevenue,
          total_orders: dayOrders,
          successful_payments: dayCompletedOrders,
        });
      }

      setStats({
        total_revenue: totalRevenue,
        total_orders: orders.length,
        total_payments: completedOrders,
        today: {
          total_revenue: todayRevenue,
          total_orders: todayOrders,
          successful_payments: todayCompletedOrders,
        },
        recent: last30Days,
        pending_payments: pendingOrders,
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading revenue stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat data revenue...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600 text-center">Gagal memuat data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-green-600 animate-pulse" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Revenue Real-time</h2>
            <p className="text-sm text-slate-500">
              Update terakhir: {formatTime(lastUpdate)}
            </p>
          </div>
        </div>
        <button
          onClick={() => loadStats()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.total_revenue)}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <TrendingUp className="w-4 h-4" />
            <span>{stats.total_orders} pesanan</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Revenue Hari Ini</p>
              <p className="text-3xl font-bold">
                {formatCurrency(stats.today.total_revenue)}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span>{stats.today.total_orders} pesanan hari ini</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Pembayaran Sukses</p>
              <p className="text-3xl font-bold">{stats.total_payments}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span>{stats.pending_payments} pending</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Tren 7 Hari Terakhir</h3>
        <div className="space-y-2">
          {stats.recent.length > 0 ? (
            stats.recent.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {new Date(day.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-slate-500">
                    {day.total_orders} pesanan • {day.successful_payments} pembayaran sukses
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(day.total_revenue)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-4">Belum ada data</p>
          )}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-green-800">
          <Activity className="w-5 h-5 animate-pulse" />
          <p className="text-sm font-medium">
            Data diperbarui secara real-time dari Firestore
          </p>
        </div>
      </div>
    </div>
  );
};

export default RealtimeRevenue;
