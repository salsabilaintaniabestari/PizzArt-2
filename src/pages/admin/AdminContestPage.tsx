import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { Trophy, Plus, Edit2, Save, X, Trash2, Award, Users } from 'lucide-react';
import { Contest, CommunityPost } from '../../types';

const AdminContestPage: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [submissions, setSubmissions] = useState<CommunityPost[]>([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [formData, setFormData] = useState<Partial<Contest>>({
    name: '',
    description: '',
    rules: '',
    prize: '',
    status: 'upcoming',
    start_date: '',
    end_date: '',
    cover_image_url: '',
  });

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    setIsLoading(true);
    try {
      const contestsQuery = query(collection(db, 'contests'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(contestsQuery);
      const contestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Contest[];

      setContests(contestsData);
    } catch (error) {
      console.error('Error loading contests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContest = async () => {
    if (!formData.name || !formData.description || !formData.start_date || !formData.end_date) {
      alert('Nama, deskripsi, dan tanggal wajib diisi');
      return;
    }

    try {
      await addDoc(collection(db, 'contests'), {
        ...formData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      setFormData({
        name: '',
        description: '',
        rules: '',
        prize: '',
        status: 'upcoming',
        start_date: '',
        end_date: '',
        cover_image_url: '',
      });
      setShowAddForm(false);
      loadContests();
      alert('Kontes berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding contest:', error);
      alert('Gagal menambahkan kontes');
    }
  };

  const handleEditStart = (contest: Contest) => {
    setEditingId(contest.id);
    setFormData(contest);
  };

  const handleEditSave = async () => {
    if (!editingId) return;

    try {
      await updateDoc(doc(db, 'contests', editingId), {
        ...formData,
        updated_at: serverTimestamp(),
      });

      setEditingId(null);
      loadContests();
      alert('Kontes berhasil diperbarui');
    } catch (error) {
      console.error('Error updating contest:', error);
      alert('Gagal memperbarui kontes');
    }
  };

  const handleDelete = async (contestId: string) => {
    if (!confirm('Yakin ingin menghapus kontes ini?')) return;

    try {
      await deleteDoc(doc(db, 'contests', contestId));
      loadContests();
      alert('Kontes berhasil dihapus');
    } catch (error) {
      console.error('Error deleting contest:', error);
      alert('Gagal menghapus kontes');
    }
  };

  const handleViewSubmissions = async (contest: Contest) => {
    setSelectedContest(contest);
    setShowSubmissions(true);

    try {
      const submissionsQuery = query(
        collection(db, 'community_posts'),
        where('is_for_contest', '==', true),
        where('contest_name', '==', contest.name),
        orderBy('likes_count', 'desc')
      );

      const snapshot = await getDocs(submissionsQuery);
      const submissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CommunityPost[];

      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleSelectWinner = async (postId: string) => {
    if (!selectedContest) return;
    if (!confirm('Yakin ingin memilih ini sebagai pemenang?')) return;

    try {
      await updateDoc(doc(db, 'contests', selectedContest.id), {
        winner_post_id: postId,
        status: 'finished',
        updated_at: serverTimestamp(),
      });

      alert('Pemenang berhasil dipilih!');
      setShowSubmissions(false);
      loadContests();
    } catch (error) {
      console.error('Error selecting winner:', error);
      alert('Gagal memilih pemenang');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'finished':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat kontes...</p>
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
            <h1 className="text-3xl font-bold text-slate-900">Manajemen Kontes</h1>
            <p className="text-slate-600 mt-1">Kelola kontes pizza untuk komunitas</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah Kontes
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Kontes Baru</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Kontes</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  placeholder="Summer Pizza Challenge"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Deskripsi</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  rows={3}
                  placeholder="Buat pizza yang menangkap esensi musim panas..."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Aturan</label>
                <textarea
                  value={formData.rules || ''}
                  onChange={e => setFormData({ ...formData, rules: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  rows={4}
                  placeholder="1. Pizza harus original kreasi sendiri...&#10;2. Maksimal 1 submisi per peserta...&#10;3. Pemenang ditentukan berdasarkan likes terbanyak..."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Hadiah</label>
                <input
                  type="text"
                  value={formData.prize || ''}
                  onChange={e => setFormData({ ...formData, prize: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  placeholder="Rp 500.000 + Pizza Gratis Selama Setahun"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={formData.status || 'upcoming'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="finished">Finished</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cover Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.cover_image_url || ''}
                  onChange={e => setFormData({ ...formData, cover_image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Mulai</label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tanggal Berakhir
                </label>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddContest}
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

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Total Kontes</p>
            <p className="text-3xl font-bold text-slate-900">{contests.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Kontes Aktif</p>
            <p className="text-3xl font-bold text-green-600">
              {contests.filter(c => c.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Akan Datang</p>
            <p className="text-3xl font-bold text-blue-600">
              {contests.filter(c => c.status === 'upcoming').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Nama Kontes</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Periode</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Hadiah</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {contests.map(contest => (
                  <tr key={contest.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      {editingId === contest.id ? (
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="px-2 py-1 border border-slate-300 rounded w-full"
                        />
                      ) : (
                        <div>
                          <p className="font-medium text-slate-900">{contest.name}</p>
                          <p className="text-sm text-slate-500 line-clamp-1">{contest.description}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {editingId === contest.id ? (
                        <select
                          value={formData.status || 'upcoming'}
                          onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                          className="px-2 py-1 border border-slate-300 rounded"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="active">Active</option>
                          <option value="finished">Finished</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            contest.status
                          )}`}
                        >
                          {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {editingId === contest.id ? (
                        <div className="space-y-1">
                          <input
                            type="date"
                            value={formData.start_date || ''}
                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            className="px-2 py-1 border border-slate-300 rounded w-full text-xs"
                          />
                          <input
                            type="date"
                            value={formData.end_date || ''}
                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                            className="px-2 py-1 border border-slate-300 rounded w-full text-xs"
                          />
                        </div>
                      ) : (
                        <>
                          <div>
                            {new Date(contest.start_date).toLocaleDateString('id-ID')} -{' '}
                          </div>
                          <div>{new Date(contest.end_date).toLocaleDateString('id-ID')}</div>
                        </>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {editingId === contest.id ? (
                        <input
                          type="text"
                          value={formData.prize || ''}
                          onChange={e => setFormData({ ...formData, prize: e.target.value })}
                          className="px-2 py-1 border border-slate-300 rounded w-full text-xs"
                        />
                      ) : (
                        contest.prize
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {editingId === contest.id ? (
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditStart(contest)}
                            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewSubmissions(contest)}
                            className="p-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                            title="Lihat Submisi"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(contest.id)}
                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showSubmissions && selectedContest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedContest.name}</h3>
                <p className="text-slate-600">Submisi Kontes - Pilih Pemenang</p>
              </div>
              <button
                onClick={() => {
                  setShowSubmissions(false);
                  setSelectedContest(null);
                  setSubmissions([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {submissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {submissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200"
                  >
                    {index < 3 && (
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-center py-2 font-bold">
                        {index === 0 ? '🥇 Peringkat 1' : index === 1 ? '🥈 Peringkat 2' : '🥉 Peringkat 3'}
                      </div>
                    )}
                    <div className="relative">
                      <img
                        src={submission.image_url || 'https://via.placeholder.com/400x300?text=Pizza'}
                        alt={submission.caption}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-800 mb-2">@{submission.user_name}</p>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{submission.caption}</p>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1 text-red-600">
                          <span className="font-bold">{submission.likes_count}</span>
                          <span className="text-sm">likes</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600">
                          <span className="font-bold">{submission.comments_count}</span>
                          <span className="text-sm">komentar</span>
                        </div>
                      </div>
                      {selectedContest.winner_post_id === submission.id ? (
                        <div className="bg-green-100 text-green-800 py-2 rounded-lg text-center font-bold flex items-center justify-center gap-2">
                          <Award className="w-5 h-5" />
                          Pemenang
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectWinner(submission.id)}
                          className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Trophy className="w-5 h-5" />
                          Pilih Sebagai Pemenang
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada submisi untuk kontes ini</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminContestPage;
