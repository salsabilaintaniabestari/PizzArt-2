import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle, LogIn, LogOut } from 'lucide-react';
import { googleDriveService } from '../../services/googleDrive';

const GoogleDriveConfig: React.FC = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Load saved OAuth config
    const savedClientId = localStorage.getItem('gdrive_oauth_client_id');
    const savedClientSecret = localStorage.getItem('gdrive_oauth_client_secret');

    if (savedClientId && savedClientSecret) {
      setClientId(savedClientId);
      setClientSecret(savedClientSecret);
      setIsConfigured(true);
      
      googleDriveService.configure({
        clientId: savedClientId,
        clientSecret: savedClientSecret,
        redirectUri: `${window.location.origin}/auth/callback`,
      });
    }

    // Check if user is already authenticated
    setIsAuthenticated(googleDriveService.isAuthenticated());
  }, []);

  const handleSaveConfig = () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setMessage({
        type: 'error',
        text: 'Client ID dan Client Secret wajib diisi',
      });
      return;
    }

    localStorage.setItem('gdrive_oauth_client_id', clientId);
    localStorage.setItem('gdrive_oauth_client_secret', clientSecret);

    googleDriveService.configure({
      clientId,
      clientSecret,
      redirectUri: `${window.location.origin}/auth/callback`,
    });

    setIsConfigured(true);
    setShowConfig(false);
    setMessage({
      type: 'success',
      text: 'Konfigurasi OAuth berhasil disimpan! Silakan login dengan Google.',
    });

    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogin = () => {
    if (!isConfigured) {
      setMessage({
        type: 'error',
        text: 'Silakan konfigurasi OAuth terlebih dahulu',
      });
      return;
    }

    try {
      googleDriveService.initiateOAuth();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Gagal memulai login',
      });
    }
  };

  const handleLogout = () => {
    googleDriveService.logout();
    setIsAuthenticated(false);
    setMessage({
      type: 'success',
      text: 'Berhasil logout dari Google Drive',
    });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="mb-6">
      {message && (
        <div
          className={`mb-4 rounded-xl p-4 flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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

      {!isConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">
                Google Drive OAuth belum dikonfigurasi
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Silakan konfigurasi OAuth Client untuk menggunakan fitur upload gambar.
              </p>
            </div>
          </div>
        </div>
      )}

      {isConfigured && !isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">
                Belum login dengan Google
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Silakan login untuk mulai upload gambar.
              </p>
              <button
                onClick={handleLogin}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <LogIn className="w-4 h-4" />
                Login dengan Google
              </button>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-800 font-medium">
                ✅ Terhubung dengan Google Drive
              </p>
              <p className="text-sm text-green-700 mt-1">
                Anda siap untuk upload gambar!
              </p>
              <button
                onClick={handleLogout}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowConfig(!showConfig)}
        className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
      >
        <Settings className="w-4 h-4" />
        {isConfigured ? 'Update Konfigurasi OAuth' : 'Konfigurasi OAuth'}
      </button>

      {showConfig && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OAuth Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="123456789-abcdefg.apps.googleusercontent.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Dari Google Cloud Console → Credentials
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OAuth Client Secret
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono text-sm"
            />
          </div>

          <button
            onClick={handleSaveConfig}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Simpan Konfigurasi
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 font-medium mb-2">Cara setup OAuth:</p>
            <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
              <li>Buka Google Cloud Console</li>
              <li>Aktifkan Google Drive API</li>
              <li>Buat OAuth 2.0 Client ID (Web application)</li>
              <li>Tambahkan Authorized redirect URI: {window.location.origin}/auth/callback</li>
              <li>Copy Client ID & Client Secret</li>
              <li>Paste ke form ini dan simpan</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveConfig;