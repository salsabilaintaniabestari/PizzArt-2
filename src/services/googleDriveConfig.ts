import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface GoogleDriveConfigData {
  folderId: string;
  serviceAccountEmail: string;
  privateKey: string;
  clientId: string;
  projectId: string;
  clientSecret?: string;
  redirectUris?: string[];
  updatedAt: string;
}

const CONFIG_DOC = 'google_drive_config';
const CONFIG_COLLECTION = 'system_config';

export class GoogleDriveConfigService {
  static async getConfig(): Promise<GoogleDriveConfigData | null> {
    try {
      const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
      const configDoc = await getDoc(configRef);

      if (!configDoc.exists()) {
        console.warn('Google Drive config not found in Firestore');
        return null;
      }

      return configDoc.data() as GoogleDriveConfigData;
    } catch (error) {
      console.error('Error loading Google Drive config:', error);
      return null;
    }
  }

  static async saveConfig(config: GoogleDriveConfigData): Promise<boolean> {
    try {
      const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);

      await setDoc(
        configRef,
        {
          ...config,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log('✅ Google Drive config saved to Firestore');
      return true;
    } catch (error) {
      console.error('Error saving Google Drive config:', error);
      return false;
    }
  }

  static async updateConfig(updates: Partial<GoogleDriveConfigData>): Promise<boolean> {
    try {
      const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);

      await updateDoc(configRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Google Drive config updated in Firestore');
      return true;
    } catch (error) {
      console.error('Error updating Google Drive config:', error);
      return false;
    }
  }

  static isConfigValid(config: GoogleDriveConfigData | null): boolean {
    if (!config) return false;

    return !!(
      config.folderId &&
      config.serviceAccountEmail &&
      config.privateKey &&
      config.clientId &&
      config.projectId
    );
  }
}
