# Google Play Games Services v2 — Gerçek Başarım Sistemi Kurulum ve Yayınlama Rehberi

Bu doküman, **The Black Knight: Orta Çağ Altın Avı** projesindeki gerçek **Google Play Games Services Android SDK v2 (`com.google.android.gms:play-services-games-v2:20.1.2`)** entegrasyonunun Google Play Console üzerinde nasıl etkinleştirileceğini, Android'e nasıl paketleneceğini ve gerçek test hesaplarıyla nasıl doğrulanacağını adım adım açıklar.

---

## 1. Mimari Özeti (Gerçek Entegrasyon Katmanları)

- **Web / Three.js Motoru (`src/game/engine.ts`)**: 30 başarımın tamamı gerçek oyun olaylarına bağlıdır (bölüm tamamlama, düşman yenme, kombo, isabet oranı, altın toplama, kırılabilir çevre, TNT zincir patlaması, özel ödüller, 6 boss savaşı, Prenses/Kral koruma, kusursuz zafer).
- **Merkezi Başarım Kataloğu (`src/game/achievementsConfig.ts`)**: 30 başarım (toplam **1.000 XP**), Standart ve Artımlı (Incremental) tanımları, `public/achievements/icons/` içindeki 30 adet `512x512` PNG ikonu ve Google Play Console Achievement ID eşleştirmeleri.
- **Çevrimdışı Dayanıklı Senkron Yöneticisi (`src/game/achievementManager.ts`)**:
  - Yerel gerçek oyun ilerlemesi ile Google Play sunucusu tarafından onaylanmış başarım durumunu birbirinden **kesin olarak ayırır**.
  - Aynı oyun olayının çift işlenmesini benzersiz olay anahtarlarıyla (`processedEventKeys`) engeller.
  - Çevrimdışı kazanılan ilerlemeyi idempotent kuyruğa (`pendingSync`) alır ve internet + Google Play oturumu geri geldiğinde `setStepsImmediate` / `unlockImmediate` ile senkronize eder.
- **Capacitor Native Köprüsü (`src/game/playGamesBridge.ts`)**: `@capacitor/core` üzerinden Android native `PlayGamesV2` eklentisiyle konuşur. Web tarayıcısında çalışırken asla sahte oturum açmaz.
- **Native Android Kotlin Katmanı (`android/`)**:
  - `BlackKnightApplication.kt`: `PlayGamesSdk.initialize(this)` başlatması.
  - `MainActivity.kt`: `PlayGamesV2Plugin` kaydı.
  - `PlayGamesV2Plugin.kt`: `GamesSignInClient`, `PlayersClient` (`playerId`, `displayName`), `AchievementsClient` (`load`, `unlockImmediate`, `setStepsImmediate`, `achievementsIntent`).
  - `AndroidManifest.xml`: `com.google.android.gms.games.APP_ID` meta verisi ve dikey (`portrait`) ekran kilidi.
  - `applicationId`: `com.blackknight.medievalgoldhunt` (gerekirse `capacitor.config.ts` ve `android/app/build.gradle` içinden kendi paket adınızla değiştirebilirsiniz).

---

## 2. Google Play Console Kurulumu (Zorunlu Adımlar)

Bu bilgiler geliştiricinin kendi Google Play Console hesabına aittir ve proje içine **uydurulmaz**:

1. **Uygulama Oluşturma**
   - Google Play Console'da `com.blackknight.medievalgoldhunt` (veya seçtiğiniz paket adı) ile bir Android uygulaması oluşturun.
   - Uygulamayı en az bir kez **Dahili Test (Internal Testing)** kanalına imzalı AAB olarak yükleyin (Play App Signing SHA-1 anahtarının oluşması için gereklidir).

2. **Play Games Services Yapılandırması**
   - **Büyüme -> Play Oyun Hizmetleri -> Kurulum ve yönetim -> Yapılandırma** bölümüne gidin.
   - Yeni bir Google Cloud projesi oluşturun veya mevcut bir projeyi bağlayın.
   - **Kimlik Bilgileri (Credentials)** sekmesinde Android OAuth 2.0 istemcisi oluşturun:
     - Paket adı: `com.blackknight.medievalgoldhunt`
     - SHA-1 parmak izi: Hem **Upload Key SHA-1** hem de **App Signing Key SHA-1** değerlerini ekleyin (debug testi için debug keystore SHA-1 ayrıca eklenebilir).
   - Yapılandırma ekranında görünen **Project ID** (yalnızca rakamlar) değerini kopyalayın.

3. **30 Başarımı Tek Seferde İçe Aktarma (Hazır ZIP Paketi)**
   - **Play Oyun Hizmetleri -> Kurulum ve yönetim -> Başarımlar -> Başarımları içe aktar (Import achievements)** seçeneğine tıklayın.
   - Proje içindeki hazır resmi paketi yükleyin:
     ```
     google-play-console/achievements-import.zip
     ```
   - Bu paket şunları içerir:
     - `AchievementsMetadata.csv` (30 başarım, Standart/Artımlı adım sayıları, toplam 1.000 XP)
     - `AchievementsLocalizations.csv` (`tr-TR` ve `en-US` yerelleştirmeleri)
     - `AchievementsIconsMapping.csv`
     - 30 adet `512x512` PNG başarım ikonu
   - İçe aktarma tamamlandığında Google Play Console her başarım için benzersiz bir **`CgkI...` Achievement ID** üretecektir.

4. **Test Kullanıcılarını Ekleme**
   - **Play Oyun Hizmetleri -> Kurulum ve yönetim -> Test Kullanıcıları (Testers)** ekranında test edeceğiniz Gmail hesaplarını ekleyin.
   - **Değişiklikleri Yayınla (Publish changes)** adımını uygulayarak taslak başarımları test hesapları için aktif hale getirin.

---

## 3. Gerçek Kimlikleri Projeye Bağlama

1. **`android/app/src/main/res/values/games-ids.xml`** dosyasını açın:
   - `game_services_project_id` değerini gerçek **Project ID** ile değiştirin.
   - `achievement_ach_*` satırlarındaki `REPLACE_WITH_PLAY_CONSOLE_ID_*` yer tutucularını Google Play Console'dan aldığınız gerçek `CgkI...` kimlikleriyle değiştirin.

2. **`.env` (veya `src/game/achievementsConfig.ts`)** dosyasına aynı 30 gerçek `CgkI...` kimliğini girin:
   - Örnek değişken listesi `.env.example` içinde hazırdır (`VITE_PGS_ACH_LEVEL_1` ... `VITE_PGS_ACH_TRUE_LEGEND`).

---

## 4. Android Paketleme ve Derleme Komutları

Yerel geliştirme makinenizde (Node.js 20+ ve Android Studio / JDK 17 kurulu iken):

```bash
# 1. Capacitor Android paketlerini kur (ilk kez)
npm install @capacitor/cli @capacitor/android

# 2. Web uygulamasını (Three.js + React) derle
npm run build

# 3. Derlenen dist/ klasörünü Android projesine senkronize et
npx cap sync android

# 4. Android Studio'da açıp imzalı APK / AAB üret
npx cap open android
```

---

## 5. Gerçek Cihazda Doğrulama Kontrol Listesi

Aşağıdaki testler gerçek Android cihazda (Google Play Services yüklü + test hesabı ekli) yapılmalıdır:

- [ ] **Otomatik Kimlik Doğrulama**: Uygulama açıldığında Google Play Games v2 giriş banner'ı görünür ve Başarımlar ekranında gerçek **Oyuncu Adı + Player ID** görüntülenir.
- [ ] **Standart Başarım Açma**: İlk düşmanı yenince (`İlk Kan`) ve ilk bölümü geçince (`İlk Adım`) başarımlar Google Play sunucusuna yazılır ve kart üzerinde **Google Play Onaylı** rozeti görünür.
- [ ] **Artımlı İlerleme (`setStepsImmediate`)**: 100 düşman / 100 altın / 5 bölüm başarımlarında ilerleme Play Games sunucusunda doğru artar; tekrar senkronizasyonda çift sayım oluşmaz.
- [ ] **Resmi Google Play Başarımlar Ekranı**: Başarımlar ekranındaki **"Google Play Başarımlarını Aç (Resmi)"** butonu Google Play Games native arayüzünü açar.
- [ ] **Uygulama Kapatıp Açma**: Uygulama kapatılıp tekrar açıldığında Play Games sunucusu ve yerel ilerleme eksiksiz korunur.
- [ ] **Çevrimdışı & Yeniden Bağlantı**: Uçak modunda bir başarım kazanıldığında **Çevrimdışı Kayıtlı** görünür; internet açıldığında otomatik senkronize olarak **Google Play Onaylı** olur.
- [ ] **Çift Açılma Koruması**: Zaten açılmış başarım tekrar tetiklendiğinde hata vermez ve ikinci kez bildirim/ödül üretmez.
