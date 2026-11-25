import { GameScreen } from '../types';

export type AdEnvironment = 'test' | 'production';

export type RewardedPlacement =
  | 'level_clear_bonus'
  | 'extra_gold_shop'
  | 'daily_bonus';

export interface AdUnitIdSet {
  appId: string;
  banner: string;
  interstitial: string;
  rewarded: string;
}

/**
 * MERKEZİ GOOGLE ADMOB YAPILANDIRMASI
 * ===================================
 * Tüm AdMob kimlikleri, sıklık kuralları, ödüllü reklam limitleri ve
 * ileride eklenecek "Reklamları Kaldır" politikası YALNIZCA bu dosyadan yönetilir.
 *
 * Canlı yayına geçerken:
 * 1) `android/app/src/main/res/values/admob-ids.xml` dosyasındaki App ID'yi güncelle.
 * 2) Aşağıdaki `PRODUCTION_ADMOB_IDS` değerlerini kendi AdMob konsolundaki gerçek birimlerle doldur.
 * 3) `ACTIVE_AD_ENVIRONMENT` değerini `'production'` yap.
 */
export const ACTIVE_AD_ENVIRONMENT: AdEnvironment = 'test';

/**
 * Google AdMob Resmi Android Test Kimlikleri (Google Developers Dokümantasyonu)
 * Gerçek SDK üzerinden resmi Google test reklamlarını yükler ve gösterir.
 */
export const TEST_ADMOB_IDS: AdUnitIdSet = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  // Anchored Adaptive Banner resmi Android test birimi
  banner: 'ca-app-pub-3940256099942544/9214589741',
  // Interstitial resmi Android test birimi
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  // Rewarded resmi Android test birimi
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
};

/**
 * Canlı Google Play yayını için AdMob kimlikleri (yayın öncesi AdMob Console'dan doldurulur)
 */
export const PRODUCTION_ADMOB_IDS: AdUnitIdSet = {
  appId: 'REPLACE_WITH_LIVE_ADMOB_APP_ID',
  banner: 'REPLACE_WITH_LIVE_BANNER_AD_UNIT_ID',
  interstitial: 'REPLACE_WITH_LIVE_INTERSTITIAL_AD_UNIT_ID',
  rewarded: 'REPLACE_WITH_LIVE_REWARDED_AD_UNIT_ID',
};

export function getActiveAdUnitIds(): AdUnitIdSet {
  return ACTIVE_AD_ENVIRONMENT === 'production' ? PRODUCTION_ADMOB_IDS : TEST_ADMOB_IDS;
}

export const AD_FREQUENCY_CONFIG = {
  /** Her 3 tamamlanan bölümden sonra en fazla 1 geçiş reklamı */
  interstitialEveryCompletedLevels: 3,
  /** İlk geçiş reklamı için gereken minimum tamamlanan bölüm sayısı (ilk açılışta reklam yok) */
  interstitialMinCompletedLevelsForFirstAd: 3,
  /** İki geçiş reklamı arasındaki minimum bekleme süresi (saniye) */
  interstitialMinCooldownSec: 90,
  /** Geçiş reklamı çağrısı için emniyet zaman aşımı (ms) — oyunu asla kilitlemez */
  interstitialShowTimeoutMs: 12000,

  /** Ödüllü reklam günlük maksimum izlenme sınırı */
  rewardedDailyLimit: 6,
  /** İki ödüllü reklam arası minimum bekleme süresi (saniye) */
  rewardedCooldownSec: 20,

  /** Ödüllü reklam yerleşimlerine göre gerçek oyun ekonomisi altın ödülleri */
  rewardedGold: {
    extra_gold_shop: 120,
    daily_bonus: 200,
    level_clear_bonus_min: 75,
    level_clear_bonus_ratio: 0.5,
  },

  /**
   * Banner reklamın gösterilebileceği oyun dışı ekranlar.
   * Oynanış (`PLAYING`), Eğitim (`TUTORIAL`), Duraklatma (`PAUSED`) ekranlarında ASLA gösterilmez.
   */
  bannerEnabledScreens: ['TITLE', 'SHOP'] as readonly GameScreen[],

  /** Yükleme hatasında artan bekleme süreleri (ms) — sonsuz hızlı döngü oluşmaz */
  retryBackoffMs: [5000, 15000, 30000, 60000] as readonly number[],
} as const;

/**
 * İleride Google Play Billing üzerinden eklenecek "REKLAMLARI KALDIR" ürünü politikası
 */
export const AD_FREE_POLICY = {
  /** Google Play Console tek seferlik (non-consumable) ürün kimliği */
  removeAdsProductId: 'remove_ads_forever',
  /** Reklam kaldırma hakkı varsa geçiş reklamlarını tamamen kapat */
  disableInterstitialWhenAdFree: true,
  /** Reklam kaldırma hakkı varsa banner reklamları tamamen kapat */
  disableBannerWhenAdFree: true,
  /**
   * Reklam kaldırma satın alan oyuncuların isteğe bağlı ödüllü reklam izleyebilme politikası.
   * `false` yapılırsa reklam kaldıranlarda ödüllü reklam seçenekleri de tamamen kapanır.
   */
  allowOptionalRewardedWhenAdFree: true,
} as const;

export type UmpDebugGeography = 'DISABLED' | 'EEA' | 'NOT_EEA';

/**
 * Google UMP (User Messaging Platform) gizlilik & içerik derecelendirmesi ayarları
 */
export const AD_PRIVACY_CONFIG = {
  tagForUnderAgeOfConsent: false,
  maxAdContentRating: 'PG' as 'G' | 'PG' | 'T' | 'MA',
  /** EEA / UK / CH gizlilik formunu gerçek test cihazında zorlamak için `'EEA'` yapılabilir */
  debugGeography: 'DISABLED' as UmpDebugGeography,
  /** AdMob test cihazı hashed ID listesi (isteğe bağlı) */
  testDeviceHashedIds: [] as string[],
};
