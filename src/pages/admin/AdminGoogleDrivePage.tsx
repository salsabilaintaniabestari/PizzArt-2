import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import GoogleDriveConfigAdmin from '../../components/admin/GoogleDriveConfigAdmin';

const AdminGoogleDrivePage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Drive Integration</h1>
          <p className="text-gray-600">Kelola konfigurasi Google Drive untuk upload gambar community</p>
        </div>
        <GoogleDriveConfigAdmin />
      </div>
    </AdminLayout>
  );
};

export default AdminGoogleDrivePage;
