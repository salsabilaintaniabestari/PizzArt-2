import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Plus, Edit2, Save, X, AlertTriangle } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: 'ingredient' | 'crust' | 'sauce' | 'cheese';
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  price: number;
  is_available: boolean;
  created_at?: any;
}

const AdminInventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editData, setEditData] = useState<Partial<InventoryItem>>({});
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'ingredient',
    stock_quantity: 0,
    low_stock_threshold: 10,
    unit: 'pcs',
    price: 0,
    is_available: true,
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const inventoryQuery = query(collection(db, 'inventory'), orderBy('name'));
      const inventorySnapshot = await getDocs(inventoryQuery);

      const items = inventorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];

      setInventory(items);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || newItem.stock_quantity === undefined) {
      alert('Nama dan stok diperlukan');
      return;
    }

    try {
      await addDoc(collection(db, 'inventory'), {
        ...newItem,
        created_at: serverTimestamp(),
      });

      setNewItem({
        name: '',
        category: 'ingredient',
        stock_quantity: 0,
        low_stock_threshold: 10,
        unit: 'pcs',
        price: 0,
        is_available: true,
      });
      setShowAddForm(false);
      loadInventory();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Gagal menambahkan item');
    }
  };

  const handleEditStart = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const handleEditSave = async () => {
    if (!editingId) return;

    try {
      await updateDoc(doc(db, 'inventory', editingId), editData);
      setEditingId(null);
      loadInventory();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Gagal memperbarui item');
    }
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity <= 0) return { color: 'bg-red-100 text-red-800', status: 'Kosong' };
    if (quantity <= threshold) return { color: 'bg-orange-100 text-orange-800', status: 'Rendah' };
    return { color: 'bg-green-100 text-green-800', status: 'Normal' };
  };

  const lowStockItems = inventory.filter(item => item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0);
  const outOfStockItems = inventory.filter(item => item.stock_quantity <= 0);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat inventori...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manajemen Inventori</h1>
            <p className="text-slate-600 mt-1">Kelola stok bahan dan persediaan</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah Item
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Item Baru</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nama item"
                value={newItem.name || ''}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              />
              <select
                value={newItem.category || 'ingredient'}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              >
                <option value="ingredient">Ingredient</option>
                <option value="crust">Adonan</option>
                <option value="sauce">Saus</option>
                <option value="cheese">Keju</option>
              </select>
              <input
                type="number"
                placeholder="Stok"
                value={newItem.stock_quantity || 0}
                onChange={(e) => setNewItem({ ...newItem, stock_quantity: Number(e.target.value) })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              />
              <input
                type="number"
                placeholder="Threshold stok rendah"
                value={newItem.low_stock_threshold || 10}
                onChange={(e) => setNewItem({ ...newItem, low_stock_threshold: Number(e.target.value) })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              />
              <input
                type="text"
                placeholder="Unit (pcs, kg, dll)"
                value={newItem.unit || 'pcs'}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              />
              <input
                type="number"
                placeholder="Harga"
                value={newItem.price || 0}
                onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddItem}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Simpan
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Batal
              </button>
            </div>
          </div>
        )}

        {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800 mb-1">Perhatian Stok</p>
                <p className="text-sm text-red-700">
                  {outOfStockItems.length > 0 && `${outOfStockItems.length} item kosong, `}
                  {lowStockItems.length > 0 && `${lowStockItems.length} item stok rendah`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Total Item</p>
            <p className="text-3xl font-bold text-slate-900">{inventory.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Stok Rendah</p>
            <p className="text-3xl font-bold text-orange-600">{lowStockItems.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Kosong</p>
            <p className="text-3xl font-bold text-red-600">{outOfStockItems.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Nama</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Kategori</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Stok</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Unit</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const status = getStockStatus(item.stock_quantity, item.low_stock_threshold);
                  return (
                    <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editData.name || ''}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="px-2 py-1 border border-slate-300 rounded w-full"
                          />
                        ) : (
                          <p className="font-medium text-slate-900">{item.name}</p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {editingId === item.id ? (
                          <select
                            value={editData.category || 'ingredient'}
                            onChange={(e) => setEditData({ ...editData, category: e.target.value as any })}
                            className="px-2 py-1 border border-slate-300 rounded"
                          >
                            <option value="ingredient">Ingredient</option>
                            <option value="crust">Adonan</option>
                            <option value="sauce">Saus</option>
                            <option value="cheese">Keju</option>
                          </select>
                        ) : (
                          item.category
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {editingId === item.id ? (
                          <input
                            type="number"
                            value={editData.stock_quantity || 0}
                            onChange={(e) => setEditData({ ...editData, stock_quantity: Number(e.target.value) })}
                            className="px-2 py-1 border border-slate-300 rounded w-20"
                          />
                        ) : (
                          item.stock_quantity
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600">{item.unit}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                          {status.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {editingId === item.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleEditSave}
                              className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                              title="Simpan"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditStart(item)}
                            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminInventoryPage;
