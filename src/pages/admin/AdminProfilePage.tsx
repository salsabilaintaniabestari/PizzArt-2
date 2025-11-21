import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdmin } from '../../context/AdminContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User, Mail, Shield, Calendar, Edit2, Save, X } from 'lucide-react';

interface AdminProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'admin' | 'manager';
  last_login?: any;
  created_at?: any;
}

const AdminProfilePage: React.FC = () => {
  const { adminUser } = useAdmin();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<AdminProfile>>({});

  useEffect(() => {
    loadProfile();
  }, [adminUser]);

  const loadProfile = async () => {
    if (!adminUser) return;

    try {
      const docRef = doc(db, 'admin_users', adminUser.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data(),
        } as AdminProfile;
        setProfile(data);
        setEditData(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      const docRef = doc(db, 'admin_users', profile.id);
      await updateDoc(docRef, editData);

      setProfile({
        ...profile,
        ...editData,
      });
      setIsEditing(false);
      alert('Profil berhasil diperbarui');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Gagal memperbarui profil');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat profil...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-600 text-center">Profil tidak ditemukan</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Profil Admin</h1>
            <p className="text-slate-600 mt-1">Kelola informasi profil Anda</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
              Edit Profil
            </button>
          )}
        </div>

        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{isEditing ? editData.full_name : profile.full_name}</h2>
              <p className="text-slate-300">@{profile.username}</p>
              <p className="text-sm text-slate-400 mt-1 capitalize">{profile.role}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          {isEditing ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editData.full_name || ''}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={editData.username || ''}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">Email tidak dapat diubah</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(profile);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Batal
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Mail className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="font-medium text-slate-900">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <User className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-600">Username</p>
                  <p className="font-medium text-slate-900">@{profile.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Shield className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-600">Role</p>
                  <p className="font-medium text-slate-900 capitalize">{profile.role}</p>
                </div>
              </div>

              {profile.created_at && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-600">Bergabung Sejak</p>
                    <p className="font-medium text-slate-900">
                      {new Date(profile.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">Keamanan Akun</p>
              <p className="text-sm text-blue-800">
                Profil Anda dilindungi dengan Firebase Authentication. Ubah password Anda melalui pengaturan akun Firebase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfilePage;
