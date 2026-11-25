import { Capacitor, PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { UmpDebugGeography } from './adConfig';

export type ConsentStatus = 'UNKNOWN' | 'REQUIRED' | 'NOT_REQUIRED' | 'OBTAINED';

export interface ConsentInfoResponse {
  success: boolean;
  canRequestAds: boolean;
  consentStatus: ConsentStatus;
  privacyOptionsRequired: boolean;
  nonPersonalizedOnly: boolean;
  statusCode: string;
  message?: string;
}

export interface InitializeAdsResponse {
  initialized: boolean;
  statusCode: string;
  message?: string;
}

export interface BannerShowResponse {
  shown: boolean;
  heightPx?: number;
  heightDp?: number;
  statusCode: string;
  message?: string;
}

export interface AdLoadResponse {
  loaded: boolean;
  statusCode: string;
  code?: number;
  message?: string;
}

export interface InterstitialShowResponse {
  shown: boolean;
  statusCode: string;
  message?: string;
}

export interface RewardedShowResponse {
  shown: boolean;
  rewarded: boolean;
  rewardType?: string;
  rewardAmount?: number;
  grantToken?: string;
  statusCode: string;
  message?: string;
}

export interface AdMobNativePluginContract {
  requestConsentInfo(options: {
    tagForUnderAgeOfConsent: boolean;
    debugGeography: UmpDebugGeography;
    testDeviceHashedIds: string[];
  }): Promise<ConsentInfoResponse>;
  showPrivacyOptionsForm(): Promise<ConsentInfoResponse>;
  initializeAds(options: {
    maxAdContentRating: 'G' | 'PG' | 'T' | 'MA';
    testDeviceHashedIds: string[];
  }): Promise<InitializeAdsResponse>;
  showBanner(options: { adUnitId: string }): Promise<BannerShowResponse>;
  hideBanner(): Promise<{ hidden: boolean }>;
  removeBanner(): Promise<{ removed: boolean }>;
  loadInterstitial(options: { adUnitId: string }): Promise<AdLoadResponse>;
  showInterstitial(): Promise<InterstitialShowResponse>;
  loadRewarded(options: { adUnitId: string }): Promise<AdLoadResponse>;
  showRewarded(): Promise<RewardedShowResponse>;
  addListener(
    eventName:
      | 'bannerLoaded'
      | 'bannerFailedToLoad'
      | 'bannerClicked'
      | 'interstitialLoaded'
      | 'interstitialFailedToLoad'
      | 'interstitialOpened'
      | 'interstitialClosed'
      | 'interstitialFailedToShow'
      | 'rewardedLoaded'
      | 'rewardedFailedToLoad'
      | 'rewardedOpened'
      | 'rewardedClosed'
      | 'rewardedEarned'
      | 'rewardedFailedToShow',
    listenerFunc: (data: Record<string, unknown>) => void,
  ): Promise<PluginListenerHandle>;
}

const NativeAdMobPlugin = registerPlugin<AdMobNativePluginContract>('AdMobNative');

export interface AdMobBridgeAdapter {
  isNativeAndroidReady(): boolean;
  isOnline(): boolean;
  requestConsentInfo(options: {
    tagForUnderAgeOfConsent: boolean;
    debugGeography: UmpDebugGeography;
    testDeviceHashedIds: string[];
  }): Promise<ConsentInfoResponse>;
  showPrivacyOptionsForm(): Promise<ConsentInfoResponse>;
  initializeAds(options: {
    maxAdContentRating: 'G' | 'PG' | 'T' | 'MA';
    testDeviceHashedIds: string[];
  }): Promise<InitializeAdsResponse>;
  showBanner(adUnitId: string): Promise<BannerShowResponse>;
  hideBanner(): Promise<{ hidden: boolean }>;
  removeBanner(): Promise<{ removed: boolean }>;
  loadInterstitial(adUnitId: string): Promise<AdLoadResponse>;
  showInterstitial(): Promise<InterstitialShowResponse>;
  loadRewarded(adUnitId: string): Promise<AdLoadResponse>;
  showRewarded(): Promise<RewardedShowResponse>;
  addListener(
    eventName: Parameters<AdMobNativePluginContract['addListener']>[0],
    listenerFunc: (data: Record<string, unknown>) => void,
  ): Promise<PluginListenerHandle | null>;
}

/**
 * GERÇEK ANDROID CAPACITOR <-> GOOGLE ADMOB & UMP NATIVE KÖPRÜSÜ
 * =============================================================
 * - Web tarayıcısında çalışırken ASLA sahte reklam göstermez veya sahte ödül vermez.
 * - Android Capacitor ortamında doğrudan `AdMobNativePlugin.kt` üzerinden gerçek
 *   Google Mobile Ads SDK ve Google UMP SDK çağrılarını yürütür.
 */
class CapacitorAdMobBridge implements AdMobBridgeAdapter {
  public isNativeAndroidReady(): boolean {
    try {
      return (
        Capacitor.isNativePlatform() &&
        Capacitor.getPlatform() === 'android' &&
        Capacitor.isPluginAvailable('AdMobNative')
      );
    } catch {
      return false;
    }
  }

  public isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine !== false;
  }

  public async requestConsentInfo(options: {
    tagForUnderAgeOfConsent: boolean;
    debugGeography: UmpDebugGeography;
    testDeviceHashedIds: string[];
  }): Promise<ConsentInfoResponse> {
    if (!this.isNativeAndroidReady()) {
      return {
        success: false,
        canRequestAds: false,
        consentStatus: 'UNKNOWN',
        privacyOptionsRequired: false,
        nonPersonalizedOnly: true,
        statusCode: 'UNSUPPORTED_WEB',
        message:
          'Web önizleme ortamında gerçek Google AdMob ve UMP SDK çalışmaz; reklamlar yalnızca Android uygulamasında aktiftir.',
      };
    }
    try {
      return await NativeAdMobPlugin.requestConsentInfo(options);
    } catch (err) {
      return {
        success: false,
        canRequestAds: false,
        consentStatus: 'UNKNOWN',
        privacyOptionsRequired: false,
        nonPersonalizedOnly: true,
        statusCode: 'NATIVE_ERROR',
        message: err instanceof Error ? err.message : 'UMP gizlilik sorgusu başarısız oldu.',
      };
    }
  }

  public async showPrivacyOptionsForm(): Promise<ConsentInfoResponse> {
    if (!this.isNativeAndroidReady()) {
      return {
        success: false,
        canRequestAds: false,
        consentStatus: 'UNKNOWN',
        privacyOptionsRequired: false,
        nonPersonalizedOnly: true,
        statusCode: 'UNSUPPORTED_WEB',
        message:
          'Google UMP gizlilik tercihleri formu yalnızca Android cihazda kurulu uygulamada açılır.',
      };
    }
    try {
      return await NativeAdMobPlugin.showPrivacyOptionsForm();
    } catch (err) {
      return {
        success: false,
        canRequestAds: false,
        consentStatus: 'UNKNOWN',
        privacyOptionsRequired: false,
        nonPersonalizedOnly: true,
        statusCode: 'NATIVE_ERROR',
        message: err instanceof Error ? err.message : 'Gizlilik tercihleri ekranı açılamadı.',
      };
    }
  }

  public async initializeAds(options: {
    maxAdContentRating: 'G' | 'PG' | 'T' | 'MA';
    testDeviceHashedIds: string[];
  }): Promise<InitializeAdsResponse> {
    if (!this.isNativeAndroidReady()) {
      return {
        initialized: false,
        statusCode: 'UNSUPPORTED_WEB',
        message: 'Google Mobile Ads SDK yalnızca Android Native ortamında başlatılır.',
      };
    }
    try {
      return await NativeAdMobPlugin.initializeAds(options);
    } catch (err) {
      return {
        initialized: false,
        statusCode: 'NATIVE_ERROR',
        message: err instanceof Error ? err.message : 'AdMob SDK başlatılamadı.',
      };
    }
  }

  public async showBanner(adUnitId: string): Promise<BannerShowResponse> {
    if (!this.isNativeAndroidReady()) {
      return { shown: false, statusCode: 'UNSUPPORTED_WEB' };
    }
    try {
      return await NativeAdMobPlugin.showBanner({ adUnitId });
    } catch (err) {
      return {
        shown: false,
        statusCode: 'NATIVE_ERROR',
        message: err instanceof Error ? err.message : 'Banner gösterilemedi.',
      };
    }
  }

  public async hideBanner(): Promise<{ hidden: boolean }> {
    if (!this.isNativeAndroidReady()) return { hidden: true };
    try {
      return await NativeAdMobPlugin.hideBanner();
    } catch {
      return { hidden: false };
    }
  }

  public async removeBanner(): Promise<{ removed: boolean }> {
    if (!this.isNativeAndroidReady()) return { removed: true };
    try {
      return await NativeAdMobPlugin.removeBanner();
    } catch {
      return { removed: false };
    }
  }

  public async loadInterstitial(adUnitId: string): Promise<AdLoadResponse> {
    if (!this.isNativeAndroidReady()) {
      return { loaded: false, statusCode: 'UNSUPPORTED_WEB' };
    }
    try {
      return await NativeAdMobPlugin.loadInterstitial({ adUnitId });
    } catch (err) {
      return {
        loaded: false,
        statusCode: 'NATIVE_ERROR',
        message: err instanceof Error ? err.message : 'Geçiş reklamı yüklenemedi.',
      };
    }
  }

  public async showInterstitial(): Promise<InterstitialShowResponse> {
    if (!this.isNativeAndroidReady()) {
      return { shown: false, statusCode: 'UNSUPPORTED_WEB' };
    }
    try {
      return await NativeAdMobPlugin.showInterstitial();
    } catch (err) {
      return {
        shown: false,
        statusCode: 'NATIVE_ERROR',
        message: err instanceof Error ? err.message : 'Geçiş reklamı gösterilemedi.',
      };
    }
  }

  public async loadRewarded(adUnitId: string): Promise<AdLoadResponse> {
    if (!this.isNativeAndroidReady()) {
      return { loaded: false, statusCode: 'UNSUPPORTED_WEB' };
    }
    try {
      return await NativeAdMobPlugin.loadRewarded({ adUnitId });
    } catch (err) {
      return {
        loaded: false,
        statusCode: 'NATIVE_ERROR',
        message: err instanceof Error ? err.message : 'Ödüllü reklam yüklenemedi.',
      };
    }
  }

  public async showRewarded(): Promise<RewardedShowResponse> {
    if (!this.isNativeAndroidReady()) {
      return {
        shown: false,
        rewarded: false,
        statusCode: 'UNSUPPORTED_WEB',
        message:
          'Gerçek Google AdMob ödüllü reklamları yalnızca Android cihazda kurulu uygulamada izlenebilir.',
      };
    }
    try {
      return await NativeAdMobPlugin.showRewarded();
    } catch (err) {
      return {
        shown: false,
        rewarded: false,
        statusCode: 'NATIVE_ERROR',
        message: err instanceof Error ? err.message : 'Ödüllü reklam gösterilemedi.',
      };
    }
  }

  public async addListener(
    eventName: Parameters<AdMobNativePluginContract['addListener']>[0],
    listenerFunc: (data: Record<string, unknown>) => void,
  ): Promise<PluginListenerHandle | null> {
    if (!this.isNativeAndroidReady()) return null;
    try {
      return await NativeAdMobPlugin.addListener(eventName, listenerFunc);
    } catch {
      return null;
    }
  }
}

export const adMobBridge = new CapacitorAdMobBridge();
