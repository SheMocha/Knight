import { Capacitor, registerPlugin } from '@capacitor/core';
import { AchievementKey } from './achievementsConfig';

export type PlayGamesConnectionState =
  | 'INITIALIZING'
  | 'AUTHENTICATED'
  | 'NOT_SIGNED_IN'
  | 'OFFLINE'
  | 'PLAY_SERVICES_UNAVAILABLE'
  | 'PROJECT_NOT_CONFIGURED'
  | 'UNSUPPORTED_WEB'
  | 'SERVER_ERROR';

export interface PlayGamesPlayerInfo {
  playerId: string;
  displayName: string;
  title?: string;
  avatarImageUri?: string;
}

export interface PlayGamesAuthResponse {
  isAuthenticated: boolean;
  statusCode: string;
  playServicesAvailable?: boolean;
  projectIdConfigured?: boolean;
  playerId?: string;
  displayName?: string;
  title?: string;
  avatarImageUri?: string;
  message?: string;
}

export interface RemotePlayAchievement {
  id: string;
  name: string;
  description: string;
  state: 'UNLOCKED' | 'REVEALED' | 'HIDDEN';
  type: 'STANDARD' | 'INCREMENTAL';
  currentSteps: number;
  totalSteps: number;
  lastUpdatedTimestamp: number;
}

export interface LoadAchievementsResponse {
  success: boolean;
  statusCode: string;
  isStale?: boolean;
  message?: string;
  achievements: RemotePlayAchievement[];
}

export interface AchievementActionResponse {
  success: boolean;
  statusCode: string;
  unlocked?: boolean;
  alreadyUnlocked?: boolean;
  achievementId?: string;
  steps?: number;
  message?: string;
}

interface PlayGamesV2NativePlugin {
  isAuthenticated(): Promise<PlayGamesAuthResponse>;
  signIn(): Promise<PlayGamesAuthResponse>;
  loadAchievements(options: { forceReload: boolean }): Promise<LoadAchievementsResponse>;
  unlockAchievement(options: {
    achievementId: string;
    achievementKey: AchievementKey;
  }): Promise<AchievementActionResponse>;
  setStepsAchievement(options: {
    achievementId: string;
    achievementKey: AchievementKey;
    numSteps: number;
  }): Promise<AchievementActionResponse>;
  showAchievementsUi(): Promise<AchievementActionResponse>;
}

const NativePlayGamesV2 = registerPlugin<PlayGamesV2NativePlugin>('PlayGamesV2');

export interface PlayGamesConnectionSnapshot {
  state: PlayGamesConnectionState;
  isNativeAndroid: boolean;
  isOnline: boolean;
  player: PlayGamesPlayerInfo | null;
  statusMessage: string;
  lastSyncedAt: number | null;
}

/**
 * GERÇEK ANDROID CAPACITOR <-> GOOGLE PLAY GAMES SERVICES V2 KÖPRÜSÜ
 * ==================================================================
 * - Web tarayıcısında çalışırken ASLA sahte oturum açmaz veya Play Games bağlı gibi davranmaz.
 * - Android Capacitor ortamında doğrudan PlayGamesV2Plugin.kt üzerinden gerçek SDK v2 çağrıları yapar.
 */
class PlayGamesBridge {
  private isNativeAndroidRuntime(): boolean {
    try {
      return (
        Capacitor.isNativePlatform() &&
        Capacitor.getPlatform() === 'android' &&
        Capacitor.isPluginAvailable('PlayGamesV2')
      );
    } catch {
      return false;
    }
  }

  private isBrowserOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine !== false;
  }

  public isNativeReady(): boolean {
    return this.isNativeAndroidRuntime();
  }

  public async checkAuthentication(): Promise<PlayGamesConnectionSnapshot> {
    const online = this.isBrowserOnline();
    if (!this.isNativeAndroidRuntime()) {
      return {
        state: 'UNSUPPORTED_WEB',
        isNativeAndroid: false,
        isOnline: online,
        player: null,
        statusMessage:
          'Web önizleme modunda çalışıyorsun. Gerçek Google Play Games Services v2 bağlantısı yalnızca imzalı Android uygulamasında aktiftir.',
        lastSyncedAt: null,
      };
    }

    if (!online) {
      return {
        state: 'OFFLINE',
        isNativeAndroid: true,
        isOnline: false,
        player: null,
        statusMessage:
          'İnternet bağlantısı yok. Çevrimdışı ilerlemen kaydediliyor; bağlantı gelince Google Play ile senkronize edilecek.',
        lastSyncedAt: null,
      };
    }

    try {
      const res = await NativePlayGamesV2.isAuthenticated();
      return this.mapAuthResponse(res, online);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Play Games doğrulaması başarısız.';
      return {
        state: 'SERVER_ERROR',
        isNativeAndroid: true,
        isOnline: online,
        player: null,
        statusMessage: msg,
        lastSyncedAt: null,
      };
    }
  }

  public async signIn(): Promise<PlayGamesConnectionSnapshot> {
    const online = this.isBrowserOnline();
    if (!this.isNativeAndroidRuntime()) {
      return {
        state: 'UNSUPPORTED_WEB',
        isNativeAndroid: false,
        isOnline: online,
        player: null,
        statusMessage:
          'Google Play Games oturumu yalnızca Android cihazda Play Games Services v2 ile açılabilir.',
        lastSyncedAt: null,
      };
    }
    if (!online) {
      return {
        state: 'OFFLINE',
        isNativeAndroid: true,
        isOnline: false,
        player: null,
        statusMessage: 'Giriş yapmak için internet bağlantısı gerekiyor.',
        lastSyncedAt: null,
      };
    }

    try {
      const res = await NativePlayGamesV2.signIn();
      return this.mapAuthResponse(res, online);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Play Games girişi başarısız oldu.';
      return {
        state: 'SERVER_ERROR',
        isNativeAndroid: true,
        isOnline: online,
        player: null,
        statusMessage: msg,
        lastSyncedAt: null,
      };
    }
  }

  public async loadRemoteAchievements(forceReload = false): Promise<LoadAchievementsResponse> {
    if (!this.isNativeAndroidRuntime()) {
      return {
        success: false,
        statusCode: 'UNSUPPORTED_WEB',
        message: 'Web ortamında Google Play sunucusu kullanılamaz.',
        achievements: [],
      };
    }
    if (!this.isBrowserOnline()) {
      return {
        success: false,
        statusCode: 'OFFLINE',
        message: 'İnternet bağlantısı yok.',
        achievements: [],
      };
    }
    try {
      return await NativePlayGamesV2.loadAchievements({ forceReload });
    } catch (err) {
      return {
        success: false,
        statusCode: 'SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Başarımlar yüklenemedi.',
        achievements: [],
      };
    }
  }

  public async unlockAchievement(
    achievementId: string,
    achievementKey: AchievementKey,
  ): Promise<AchievementActionResponse> {
    if (!this.isNativeAndroidRuntime()) {
      return {
        success: false,
        statusCode: 'UNSUPPORTED_WEB',
        message: 'Yalnızca Android Play Games v2 üzerinden açılabilir.',
      };
    }
    if (!this.isBrowserOnline()) {
      return {
        success: false,
        statusCode: 'OFFLINE',
        message: 'Çevrimdışı — bağlantı gelince gönderilecek.',
      };
    }
    try {
      return await NativePlayGamesV2.unlockAchievement({ achievementId, achievementKey });
    } catch (err) {
      return {
        success: false,
        statusCode: 'SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Google Play başarım gönderim hatası.',
      };
    }
  }

  public async setStepsAchievement(
    achievementId: string,
    achievementKey: AchievementKey,
    numSteps: number,
  ): Promise<AchievementActionResponse> {
    if (!this.isNativeAndroidRuntime()) {
      return {
        success: false,
        statusCode: 'UNSUPPORTED_WEB',
        message: 'Yalnızca Android Play Games v2 üzerinden güncellenebilir.',
      };
    }
    if (!this.isBrowserOnline()) {
      return {
        success: false,
        statusCode: 'OFFLINE',
        message: 'Çevrimdışı — bağlantı gelince senkronize edilecek.',
      };
    }
    try {
      return await NativePlayGamesV2.setStepsAchievement({
        achievementId,
        achievementKey,
        numSteps: Math.max(1, Math.floor(numSteps)),
      });
    } catch (err) {
      return {
        success: false,
        statusCode: 'SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Google Play adım gönderim hatası.',
      };
    }
  }

  public async showNativeAchievementsUi(): Promise<AchievementActionResponse> {
    if (!this.isNativeAndroidRuntime()) {
      return {
        success: false,
        statusCode: 'UNSUPPORTED_WEB',
        message:
          'Google Play Games resmi başarımlar ekranı yalnızca Android cihazda kurulu uygulamada açılır.',
      };
    }
    if (!this.isBrowserOnline()) {
      return {
        success: false,
        statusCode: 'OFFLINE',
        message: 'Resmi Google Play Başarımlar ekranını açmak için internet bağlantısı gerekiyor.',
      };
    }
    try {
      return await NativePlayGamesV2.showAchievementsUi();
    } catch (err) {
      return {
        success: false,
        statusCode: 'SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Google Play ekranı açılamadı.',
      };
    }
  }

  private mapAuthResponse(
    res: PlayGamesAuthResponse,
    online: boolean,
  ): PlayGamesConnectionSnapshot {
    if (res.isAuthenticated && res.playerId) {
      return {
        state: 'AUTHENTICATED',
        isNativeAndroid: true,
        isOnline: online,
        player: {
          playerId: res.playerId,
          displayName: res.displayName || 'Play Games Oyuncusu',
          title: res.title,
          avatarImageUri: res.avatarImageUri,
        },
        statusMessage: 'Google Play Games hesabına bağlı.',
        lastSyncedAt: Date.now(),
      };
    }

    if (res.statusCode === 'PROJECT_NOT_CONFIGURED') {
      return {
        state: 'PROJECT_NOT_CONFIGURED',
        isNativeAndroid: true,
        isOnline: online,
        player: null,
        statusMessage:
          res.message ||
          'Google Play Console Project ID henüz Android yapılandırmasına girilmemiş.',
        lastSyncedAt: null,
      };
    }

    if (res.statusCode === 'PLAY_SERVICES_UNAVAILABLE') {
      return {
        state: 'PLAY_SERVICES_UNAVAILABLE',
        isNativeAndroid: true,
        isOnline: online,
        player: null,
        statusMessage: res.message || 'Google Play Hizmetleri bu cihazda kullanılamıyor.',
        lastSyncedAt: null,
      };
    }

    if (res.statusCode === 'NOT_SIGNED_IN') {
      return {
        state: 'NOT_SIGNED_IN',
        isNativeAndroid: true,
        isOnline: online,
        player: null,
        statusMessage:
          res.message ||
          'Google Play Games hesabına bağlı değilsin. Bağlanarak başarımlarını bulutta saklayabilirsin.',
        lastSyncedAt: null,
      };
    }

    return {
      state: 'SERVER_ERROR',
      isNativeAndroid: true,
      isOnline: online,
      player: null,
      statusMessage: res.message || 'Google Play Games sunucusu geçici hata verdi.',
      lastSyncedAt: null,
    };
  }
}

export const playGamesBridge = new PlayGamesBridge();
