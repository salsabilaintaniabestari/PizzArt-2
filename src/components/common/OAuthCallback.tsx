import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { googleDriveService } from '../../services/googleDrive';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      // ✅ TAMBAHKAN: Load konfigurasi dari localStorage terlebih dahulu
      const savedClientId = localStorage.getItem('gdrive_oauth_client_id');
      const savedClientSecret = localStorage.getItem('gdrive_oauth_client_secret');

      if (!savedClientId || !savedClientSecret) {
        setStatus('error');
        setMessage('Konfigurasi OAuth tidak ditemukan. Silakan konfigurasi ulang.');
        setTimeout(() => navigate('/community'), 3000);
        return;
      }

      // ✅ Configure service dengan credentials dari localStorage
      googleDriveService.configure({
        clientId: savedClientId,
        clientSecret: savedClientSecret,
        redirectUri: `${window.location.origin}/auth/callback`,
      });

      // Get authorization code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Akses ditolak. Silakan coba lagi.');
        setTimeout(() => navigate('/community'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('Kode otorisasi tidak ditemukan.');
        setTimeout(() => navigate('/community'), 3000);
        return;
      }

      try {
        const success = await googleDriveService.handleCallback(code);

        if (success) {
          setStatus('success');
          setMessage('Berhasil terhubung dengan Google Drive!');
          setTimeout(() => navigate('/community'), 2000);
        } else {
          setStatus('error');
          setMessage('Gagal menukar kode otorisasi. Silakan coba lagi.');
          setTimeout(() => navigate('/community'), 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Terjadi kesalahan tak terduga.');
        setTimeout(() => navigate('/community'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 text-red-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Menghubungkan dengan Google Drive
            </h2>
            <p className="text-gray-600">Mohon tunggu sebentar...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Berhasil!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Mengalihkan kembali ke halaman community...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Gagal</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Mengalihkan kembali ke halaman community...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;