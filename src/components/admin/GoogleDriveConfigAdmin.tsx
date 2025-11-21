import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { GoogleDriveConfigService, GoogleDriveConfigData } from '../../services/googleDriveConfig';

const GoogleDriveConfigAdmin: React.FC = () => {
  const [config, setConfig] = useState<GoogleDriveConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [formData, setFormData] = useState<Partial<GoogleDriveConfigData>>({
    folderId: '',
    serviceAccountEmail: '',
    privateKey: '',
    clientId: '',
    projectId: '',
    clientSecret: '',
    redirectUris: [],
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const existingConfig = await GoogleDriveConfigService.getConfig();
      if (existingConfig) {
        setConfig(existingConfig);
        setFormData(existingConfig);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setMessage({
        type: 'error',
        text: 'Gagal memuat konfigurasi',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof GoogleDriveConfigData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.folderId?.trim() || !formData.serviceAccountEmail?.trim() ||
        !formData.privateKey?.trim() || !formData.clientId?.trim() ||
        !formData.projectId?.trim()) {
      setMessage({
        type: 'error',
        text: 'Semua field wajib diisi',
      });
      return;
    }

    setIsSaving(true);
    try {
      const success = await GoogleDriveConfigService.saveConfig(formData as GoogleDriveConfigData);
      if (success) {
        setConfig(formData as GoogleDriveConfigData);
        setMessage({
          type: 'success',
          text: 'Konfigurasi Google Drive berhasil disimpan!',
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: 'Gagal menyimpan konfigurasi',
        });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat menyimpan konfigurasi',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);

        const serviceAccount = json.web || json;

        setFormData(prev => ({
          ...prev,
          clientId: serviceAccount.client_id || prev.clientId,
          clientSecret: serviceAccount.client_secret || prev.clientSecret,
          redirectUris: serviceAccount.redirect_uris || prev.redirectUris,
        }));

        if (json.service_account) {
          const sa = json.service_account;
          setFormData(prev => ({
            ...prev,
            serviceAccountEmail: sa.client_email || prev.serviceAccountEmail,
            privateKey: sa.private_key || prev.privateKey,
            projectId: sa.project_id || prev.projectId,
          }));
        }

        setMessage({
          type: 'success',
          text: 'File JSON berhasil diimport',
        });
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage({
          type: 'error',
          text: 'Format JSON tidak valid',
        });
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat konfigurasi...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Konfigurasi Google Drive</h2>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg p-4 flex items-start gap-3 ${
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

      {GoogleDriveConfigService.isConfigValid(config) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-800 font-medium">
                ✅ Google Drive sudah dikonfigurasi
              </p>
              <p className="text-sm text-green-700 mt-1">
                Email: {config?.serviceAccountEmail}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Folder ID Google Drive
          </label>
          <input
            type="text"
            value={formData.folderId || ''}
            onChange={(e) => handleInputChange('folderId', e.target.value)}
            placeholder="Contoh: 11AQVqilWrrNUTWvOimzklSh958-Hr1db"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Copy dari URL Google Drive folder: https://drive.google.com/drive/folders/FOLDER_ID
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Account Email
          </label>
          <input
            type="email"
            value={formData.serviceAccountEmail || ''}
            onChange={(e) => handleInputChange('serviceAccountEmail', e.target.value)}
            placeholder="xxx@xxx.iam.gserviceaccount.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project ID
          </label>
          <input
            type="text"
            value={formData.projectId || ''}
            onChange={(e) => handleInputChange('projectId', e.target.value)}
            placeholder="project-id"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Private Key
          </label>
          <div className="relative">
            <input
              type={showPrivateKey ? 'text' : 'password'}
              value={formData.privateKey || ''}
              onChange={(e) => handleInputChange('privateKey', e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY-----..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPrivateKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client ID
          </label>
          <input
            type="text"
            value={formData.clientId || ''}
            onChange={(e) => handleInputChange('clientId', e.target.value)}
            placeholder="xxx.apps.googleusercontent.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Secret (Opsional)
          </label>
          <input
            type="password"
            value={formData.clientSecret || ''}
            onChange={(e) => handleInputChange('clientSecret', e.target.value)}
            placeholder="GOCSPX-..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
        </button>

        <label className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
          <input
            type="file"
            accept=".json"
            onChange={handleUploadJSON}
            className="hidden"
          />
          📄 Import JSON
        </label>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800 font-medium mb-2">Langkah setup:</p>
        <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
          <li>Buat Service Account di Google Cloud Console</li>
          <li>Generate Private Key (JSON format)</li>
          <li>Copy folder ID dari URL Google Drive</li>
          <li>Share Google Drive folder ke service account email</li>
          <li>Paste semua informasi di atas</li>
          <li>Atau upload file JSON service account</li>
        </ol>
      </div>
    </div>
  );
};

export default GoogleDriveConfigAdmin;
