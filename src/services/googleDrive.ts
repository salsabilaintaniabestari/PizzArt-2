export interface GoogleDriveOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  publicUrl?: string;
  error?: string;
}

export class GoogleDriveService { // ✅ FIXED: Service (bukan Serivce)
  private static instance: GoogleDriveService;
  private config: GoogleDriveOAuthConfig | null = null;
  private tokenData: TokenData | null = null;

  private constructor() {
    // Load saved tokens from localStorage on init
    this.loadTokensFromStorage();
  }

  static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  configure(config: GoogleDriveOAuthConfig) {
    this.config = config;
  }

  private loadTokensFromStorage() {
    const savedTokens = localStorage.getItem('gdrive_oauth_tokens');
    if (savedTokens) {
      try {
        this.tokenData = JSON.parse(savedTokens);
      } catch (error) {
        console.error('Failed to load tokens from storage:', error);
      }
    }
  }

  private saveTokensToStorage() {
    if (this.tokenData) {
      localStorage.setItem('gdrive_oauth_tokens', JSON.stringify(this.tokenData));
    }
  }

  isAuthenticated(): boolean {
    return this.tokenData !== null && !!this.tokenData.refreshToken;
  }

  // Step 1: Redirect user to Google OAuth consent screen
  initiateOAuth() {
    if (!this.config) {
      throw new Error('OAuth not configured');
    }

    const scope = 'https://www.googleapis.com/auth/drive.file';
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    
    authUrl.searchParams.append('client_id', this.config.clientId);
    authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('access_type', 'offline'); // ✅ Get refresh token
    authUrl.searchParams.append('prompt', 'consent'); // ✅ Force consent to get refresh token

    window.location.href = authUrl.toString();
  }

  // Step 2: Exchange authorization code for tokens
  async handleCallback(code: string): Promise<boolean> {
    if (!this.config) {
      throw new Error('OAuth not configured');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Token exchange error:', error);
        return false;
      }

      const data = await response.json();
      
      this.tokenData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token, // ✅ Permanent token
        expiresAt: Date.now() + (data.expires_in * 1000),
      };

      this.saveTokensToStorage();
      return true;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return false;
    }
  }

  // Get valid access token (auto-refresh if expired)
  private async getValidAccessToken(): Promise<string> {
    if (!this.config) {
      throw new Error('OAuth not configured');
    }

    if (!this.tokenData) {
      throw new Error('Not authenticated. Please login first.');
    }

    // If token is still valid (with 5 minute buffer)
    if (Date.now() < this.tokenData.expiresAt - 300000) {
      return this.tokenData.accessToken;
    }

    // Token expired, refresh it
    console.log('🔄 Access token expired, refreshing...');
    
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: this.tokenData.refreshToken, // ✅ Use refresh token
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Token refresh error:', error);
        throw new Error('Failed to refresh token. Please login again.');
      }

      const data = await response.json();
      
      // Update access token (refresh token stays the same)
      this.tokenData.accessToken = data.access_token;
      this.tokenData.expiresAt = Date.now() + (data.expires_in * 1000);
      
      this.saveTokensToStorage();
      console.log('✅ Access token refreshed successfully');

      return this.tokenData.accessToken;
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Upload image to user's Google Drive
  async uploadImage(file: File): Promise<UploadResult> {
    if (!this.config) {
      return {
        success: false,
        error: 'OAuth not configured. Please set client credentials.',
      };
    }

    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated. Please login with Google first.',
      };
    }

    try {
      const accessToken = await this.getValidAccessToken();

      const metadata = {
        name: `pizzart_${Date.now()}_${file.name}`,
        // No parents = upload to root of user's Drive
      };

      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append('file', file);

      console.log('📤 Uploading to Google Drive...');

      const uploadResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('Upload error:', errorData);
        return {
          success: false,
          error: errorData.error?.message || 'Upload failed',
        };
      }

      const uploadData = await uploadResponse.json();
      const fileId = uploadData.id;

      console.log('✅ File uploaded:', fileId);

      // Set public permission
      await this.setPublicPermission(fileId, accessToken);

      // Generate public URL - menggunakan format yang lebih reliable
      // Format 1: Googleusercontent (paling reliable)
      const publicUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      
      // Format 2: Jika format 1 tidak work, bisa coba ini:
      // const publicUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
      
      console.log('✅ Public URL:', publicUrl);

      return {
        success: true,
        fileId,
        publicUrl,
      };
    } catch (error: any) {
      console.error('Error uploading to Google Drive:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  private async setPublicPermission(fileId: string, accessToken: string): Promise<void> {
    const permissionData = {
      role: 'reader',
      type: 'anyone',
    };

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissionData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to set permissions');
    }

    console.log('✅ File set to public');
  }

  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      const accessToken = await this.getValidAccessToken();
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Logout (clear tokens)
  logout() {
    this.tokenData = null;
    localStorage.removeItem('gdrive_oauth_tokens');
    console.log('✅ Logged out from Google Drive');
  }
}

export const googleDriveService = GoogleDriveService.getInstance(); // ✅ FIXED