# Google AdMob, UMP Gizlilik ve Reklamları Kaldırma Mimarisi — Kurulum ve Teknik Dokümantasyon

Bu doküman, **Kara Şövalye: Orta Çağ Altın Avı** (`com.blackknight.medievalgoldhunt`) projesine entegre edilen **gerçek Android Native Google Mobile Ads SDK (AdMob)**, **Google User Messaging Platform (UMP) SDK** ve ileride **Google Play Billing** üzerinden bağlanacak **"Reklamları Kaldır"** mimarisini açıklar.

> Mevcut **Google Play Games Services v2** (`PlayGamesV2Plugin.kt`), 60 bölümlük dünya sistemi, Boss savaşları, skor/altın ekonomisi ve Three.js dikey (Portrait) oyun motoru tamamen korunmuştur.

---

## 1. Mimari Genel Bakış

### Android Native Katmanı (`android/`)
- **`android/app/build.gradle`**
  - `com.google.android.gms:play-services-ads:23.6.0` (Resmi Google Mobile Ads SDK)
  - `com.google.android.ump:user-messaging-platform:3.1.0` (Resmi Google UMP Gizlilik SDK)
  - Mevcut `play-services-games-v2:20.1.2` bağımlılığı korunmuştur.
- **`android/app/src/main/AndroidManifest.xml`**
  - `com.google.android.gms.permission.AD_ID` (Android 13+ / API 33+ için gerekli izin)
  - `com.google.android.gms.ads.APPLICATION_ID` (`@string/admob_app_id` üzerinden okunur)
  - `com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT = true` (UMP onayı öncesi ölçümü bekletir)
- **`android/app/src/main/res/values/admob-ids.xml`**
  - Android tarafındaki AdMob App ID için tek merkezi XML kaynağı.
- **`android/app/src/main/java/com/blackknight/medievalgoldhunt/AdMobNativePlugin.kt`**
  - `@CapacitorPlugin(name = "AdMobNative")`
  - Gerçek UMP gizlilik sorgusu & Gizlilik Tercihleri formu (`requestConsentInfo`, `showPrivacyOptionsForm`)
  - Tek seferlik `MobileAds.initialize` (`AtomicBoolean` koruması)
  - Dikey ekran genişliğine göre **Anchored Adaptive Banner** (`AdView`)
  - **InterstitialAd** (`InterstitialAd.load` + `FullScreenContentCallback`)
  - **RewardedAd** (`RewardedAd.load` + gerçek `OnUserEarnedRewardListener` + tek kullanımlık `grantToken`)
  - `handleOnPause`, `handleOnResume`, `handleOnDestroy` bellek temizliği
- **`android/app/src/main/java/com/blackknight/medievalgoldhunt/MainActivity.kt`**
  - `PlayGamesV2Plugin` ile birlikte `AdMobNativePlugin` kaydedilir.
- **`android/app/proguard-rules.pro`**
  - Release/R8 derlemelerinde Capacitor eklentileri, AdMob, UMP ve Play Games v2 sınıflarını korur.

### TypeScript / Capacitor Katmanı (`src/game/ads/`)
| Modül | Görevi |
|---|---|
| `src/game/ads/adConfig.ts` | Tüm reklam kimlikleri, sıklık kuralları, günlük limitler, banner ekran listesi, AdFree politikası ve UMP ayarları |
| `src/game/ads/adEntitlement.ts` | `AdEntitlement` ve `AdEntitlementStore` — doğrulanmış "Reklamları Kaldır" hakkını tutar ve kalıcı olarak saklar |
| `src/game/ads/adFreeManager.ts` | `AdFreeManager` — her reklam türünden **önce** sorgulanan merkezi yetki kapısı |
| `src/game/ads/purchaseManager.ts` | `PurchaseManager` & `BillingProvider` — ileride Google Play Billing bağlanacak merkezi satın alma katmanı |
| `src/game/ads/adMobBridge.ts` | Capacitor <-> `AdMobNativePlugin.kt` köprüsü (web tarayıcıda sahte reklam/ödül üretmez) |
| `src/game/ads/adManager.ts` | `AdManager` — UMP, tek seferlik SDK başlatma, önceden yükleme, sıklık, bekleme süresi, çift ödül engelleme ve çevrimdışı dayanıklılık |

---

## 2. Şu Anda Kullanılan Resmi Google AdMob Test Kimlikleri

Aşağıdaki kimlikler Google'ın resmi Android **test** reklam kimlikleridir (gerçek SDK üzerinden resmi test reklamlarını indirir ve gösterir):

| Tür | Dosya | Resmi Google Test Kimliği |
|---|---|---|
| **Android App ID** | `android/app/src/main/res/values/admob-ids.xml` | `ca-app-pub-3940256099942544~3347511713` |
| **Adaptive Banner** | `src/game/ads/adConfig.ts` (`TEST_ADMOB_IDS.banner`) | `ca-app-pub-3940256099942544/9214589741` |
| **Interstitial** | `src/game/ads/adConfig.ts` (`TEST_ADMOB_IDS.interstitial`) | `ca-app-pub-3940256099942544/1033173712` |
| **Rewarded** | `src/game/ads/adConfig.ts` (`TEST_ADMOB_IDS.rewarded`) | `ca-app-pub-3940256099942544/5224354917` |

---

## 3. Canlı (Production) AdMob Kimliklerine Geçiş

Yayınlamadan önce yalnızca **2 dosya** düzenlenir (oyun kodunun başka hiçbir yerinde reklam kimliği yoktur):

### Adım 1 — Gerçek AdMob App ID
`android/app/src/main/res/values/admob-ids.xml` dosyasındaki `admob_app_id` değerini AdMob konsolunuzdaki gerçek Android App ID ile değiştirin:
```xml
<string name="admob_app_id" translatable="false">ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY</string>
```

### Adım 2 — Gerçek Reklam Birimi Kimlikleri
`src/game/ads/adConfig.ts` dosyasında:
1. `PRODUCTION_ADMOB_IDS` içindeki `appId`, `banner`, `interstitial` ve `rewarded` değerlerini kendi AdMob konsolunuzdan aldığınız gerçek birim kimlikleriyle değiştirin.
2. `ACTIVE_AD_ENVIRONMENT` değerini `'production'` yapın:
```ts
export const ACTIVE_AD_ENVIRONMENT: AdEnvironment = 'production';
```

---

## 4. Reklam Sıklığı ve Politikaların Ayarlanması

Tüm reklam sıklığı ve politika değerleri **`src/game/ads/adConfig.ts`** içinde `AD_FREQUENCY_CONFIG` ve `AD_FREE_POLICY` nesnelerinden tek noktadan değiştirilir:

- **`interstitialEveryCompletedLevels`**: Varsayılan `3` (her 3 tamamlanan bölümden sonra en fazla 1 geçiş reklamı, sonuç ekranından "Sonraki Bölüm"e basıldığında).
- **`interstitialMinCompletedLevelsForFirstAd`**: Varsayılan `3` (ilk açılışta ve ilk 2 bölümde geçiş reklamı çıkmaz).
- **`interstitialMinCooldownSec`**: Varsayılan `90` saniye (iki geçiş reklamı arası minimum bekleme süresi).
- **`rewardedDailyLimit`**: Varsayılan `6` (günlük toplam ödüllü reklam sınırı).
- **`rewardedCooldownSec`**: Varsayılan `20` saniye.
- **`rewardedGold`**:
  - `extra_gold_shop`: `+120 Altın` (Mağaza ekranı isteğe bağlı buton)
  - `level_clear_bonus`: Bölüm altınının `%50`'si, minimum `+75 Altın` (Bölüm Sonu ekranı isteğe bağlı buton)
  - `daily_bonus`: `+200 Altın` (Ana Menü → Nasıl Oynanır & Ayarlar içindeki Günlük Bonus, günde 1 kez)
- **`bannerEnabledScreens`**: Varsayılan `['TITLE', 'SHOP']`. `PLAYING`, `TUTORIAL`, `PAUSED`, `LEVEL_CLEAR`, `GAME_OVER`, `VICTORY` ekranlarında banner otomatik olarak gizlenir.

### Ödüllü Reklam Güvenliği
- Ödül **yalnızca** Android `AdMobNativePlugin.kt` içindeki gerçek `OnUserEarnedRewardListener` tetiklendiğinde ve `AdManager` tarafından daha önce kullanılmamış tekil `grantToken` doğrulandığında oyuncunun gerçek `walletGold` kesesine eklenir.
- Reklam yarıda kapatılırsa, yüklenemezse, internet kesikse veya web önizlemede açılırsa **asla ödül verilmez**.

---

## 5. Google UMP Gizlilik ve İzin Yönetimi (EEA / Birleşik Krallık / İsviçre / Türkiye)

- Uygulama başlangıcında `AdManager.initialize()` önce `AdMobNativePlugin.requestConsentInfo()` çağrısını çalıştırır.
- Gerekli bölgelerde (EEA, Birleşik Krallık, İsviçre vb.) Google UMP izin formu otomatik olarak gösterilir.
- Kullanıcı izni olmadan kişiselleştirilmiş reklam isteği gönderilmez (`AdMobAdapter` `npa = "1"` eklenir); `canRequestAds()` `false` ise AdMob SDK reklam talebi göndermez.
- Kullanıcı dilediği zaman **Ana Menü → Nasıl Oynanır → "Gizlilik ve Reklam Tercihleri (Google UMP)"** butonuyla `UserMessagingPlatform.showPrivacyOptionsForm()` ekranını açıp tercihlerini güncelleyebilir.
- **AdMob Konsolunda Yapılması Gerekenler**:
  1. AdMob Console → **Gizlilik ve mesajlaşma (Privacy & messaging)** bölümünde **Avrupa yönetmelikleri (GDPR)** mesajını oluşturup yayınlayın.
  2. Türkiye (KVKK) ve küresel gizlilik politikası bağlantınızı Play Console ve AdMob ayarlarına ekleyin.
  3. Gerçek cihazda EEA akışını test etmek için `AD_PRIVACY_CONFIG.debugGeography = 'EEA'` ve `testDeviceHashedIds` değerini geçici olarak ayarlayabilirsiniz (yayın öncesi `'DISABLED'` yapın).

---

## 6. İleride "REKLAMLARI KALDIR" (Google Play Billing) Satın Alımını Bağlama

Mimari şimdiden tek seferlik **non-consumable** `remove_ads_forever` ürünü için tamamen hazırdır:

1. **Google Play Console** üzerinde `remove_ads_forever` kimlikli tek seferlik uygulama içi ürün oluşturun.
2. Android projesine resmi **Google Play Billing Library v7+** (`com.android.billingclient:billing-ktx`) ekleyen Capacitor eklentisini yazın.
3. TypeScript tarafında `src/game/ads/purchaseManager.ts` içindeki `BillingProvider` arayüzünü bu eklentiyle uygulayın ve uygulama başlangıcında kaydedin:
   ```ts
   import { purchaseManager } from './game/ads';
   purchaseManager.registerProvider(googlePlayBillingProvider);
   ```
4. Bundan sonra hiçbir reklam veya oyun kodunu değiştirmenize gerek yoktur:
   - `purchaseManager.purchaseRemoveAds()` gerçek satın alma + `acknowledgePurchase` sonrası `adEntitlementStore.applyVerifiedPurchase(...)` çağırır.
   - Uygulama silinip yeniden yüklendiğinde `purchaseManager.initializeAndSyncEntitlements()` / `restorePurchases()` aktif Google Play satın alımını otomatik geri yükler.
   - `AdFreeManager` anında:
     - Tüm **Interstitial** reklamları kapatır (`disableInterstitialWhenAdFree: true`),
     - Tüm **Banner** reklamları kapatır ve mevcut bannerı ekrandan kaldırır (`disableBannerWhenAdFree: true`),
     - İsteğe bağlı **Rewarded** reklamları `AD_FREE_POLICY.allowOptionalRewardedWhenAdFree` (`true` veya `false`) ayarına göre yönetir.

---

## 7. Android Derleme ve Cihaz Üzerinde Doğrulama Komutları

Web varlıklarını derleyip Android projesine senkronize etmek ve gerçek Android APK/AAB üretmek için Android SDK + JDK 17 kurulu yerel makinenizde şu komutları çalıştırın:

```bash
# 1. Web / Three.js uygulamasını derle
npm run build

# 2. Capacitor Android projesini senkronize et
npx cap sync android

# 3. Debug APK derle ve bağlı Android cihazda test et
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Cihaz loglarında AdMob & UMP akışını doğrulamak için:
```bash
adb logcat | grep -E "AdMobNativePlugin|Ads|PlayGamesV2"
```
