# The Black Knight — 60 Bölümlük Orta Çağ Arcade Sistem Dokümantasyonu

Bu doküman, Three.js tabanlı **The Black Knight: Orta Çağ Altın Avı** oyununun 10 Dünya / 60 Bölümlük genişletilebilir mimarisini, korunan temel mekaniklerini, etkileşimli çevre nesnelerini, özel karakterlerini, 6 adet Boss savaşını ve mobil performans stratejilerini belgelemektedir.

---

## 1. Korunan Temel Oynanış Kuralı (Normal Bölümler vs Boss Bölümleri)

- **Normal Bölümler (54 Bölüm):**
  - Şövalye ekranda **sabit yatay konumda** durur; düşmanlar ve çevre objeleri sağ taraftan yaklaşır.
  - **Oyuncu can barı, oyuncu hasar alma sistemi ve serbest platform hareketi YOKTUR.**
  - Tek parmakla **basılı tut (şarj et) / bırak (vur)** mekaniği, birbirinden tamamen bağımsız **Skor** ve **Altın** ekonomisi, **Kombo Sistemi**, **Bonuslar**, **Cadı Domuz Laneti** ve **Düşük Güçte Fırlayan Objeler** aynen korunmuştur.
- **Özel Boss Bölümleri (Yalnızca 10, 20, 30, 40, 50 ve 60. Bölümler):**
  - Yalnızca bu 6 bölümde özel **Boss Arenası** açılır ve **serbest yatay hareket** aktif olur.
  - Mobilde sol altta çoklu dokunuş destekli **Sanal Joystick**, sağ altta dairesel şarj halkalı büyük **SALDIR** butonu görünür (masaüstünde `A/D` veya `←/→` + `Space`/`Enter`).
  - Üstte büyük **Boss HP Barı**, faz göstergesi (`FAZ X/Y`) ve saldırı uyarı bandı yer alır. Boss saldırıları ölümcül olmayan itme/sersemleme verir; oyuncunun can barı yoktur.

---

## 2. 10 Dünya · 60 Bölümlük Modüler Veri Mimarisi

`src/game/worlds.ts` ve `src/game/levels.ts` veri-odaklı (data-driven) şekilde yapılandırılmıştır. Her dünyada **6 benzersiz bölüm** (`bgVariant` 0–5, farklı ışık tonu, düşman/obje havuzu, dalga deseni ve özel bölüm olayı) bulunur:

| Dünya | Adı | Bölümler | Özel Boss |
| :--- | :--- | :--- | :--- |
| **I** | Orta Çağ Köyü (`village`) | 1 – 6 | — |
| **II** | Orta Çağ Pazarı (`market`) | 7 – 12 | **Bölüm 10:** Pazar Baronu (2 Faz) |
| **III** | Karanlık Orman (`forest`) | 13 – 18 | — |
| **IV** | Kale Kasabası (`castle`) | 19 – 24 | **Bölüm 20:** Demir Kale Komutanı (2 Faz) |
| **V** | Kralın Hazinesi (`throne`) | 25 – 30 | **Bölüm 30:** Altın Kraliyet Golemi (2 Faz) |
| **VI** | Buz Krallığı (`ice`) | 31 – 36 | — |
| **VII** | Çöl Krallığı (`desert`) | 37 – 42 | **Bölüm 40:** Çöl Firavunu (2 Faz) |
| **VIII** | Korsan Limanı (`pirate`) | 43 – 48 | — |
| **IX** | Lanetli Mezarlık (`graveyard`) | 49 – 54 | **Bölüm 50:** Lanetli Mezarlık Lordu (2 Faz) |
| **X** | Ejderha Kalesi (`dragon`) | 55 – 60 | **Bölüm 60:** Kadim Kızıl Ejderha Lordu (3 Faz Final!) |

**Bölüm İlerleme Menüsü (`ChaptersModal.tsx`):**
- Tamamlanan bölümler uzun listeler halinde kalabalık oluşturmaz.
- 10 Dünyalık kompakt ilerleme haritası, aktif dünyanın 6 bölüm düğümü, büyük aktif bölüm kartı ve hemen altında sıradaki kilitli bölüm önizlemesi gösterilir.

---

## 3. Parçalanabilir Çevre ve 13 Gerçek Etkileşimli Nesne

`src/game/BreakableCatalog.ts` içinde 48+ tematik kırılabilir nesne (önbelleğe alınmış prosedürel 256×256 sprite + fiziksel parçalanma havuzu) ve **13 özel etkileşimli nesne** bulunur:

1. **`tnt_crate` (TNT Sandığı):** Patlayarak etraftaki düşmanları ve yakındaki TNT/objeleri zincirleme havaya uçurur.
2. **`balloon` (Uçan Balon):** Patlama sesi ve konfeti/kıvılcımlarla sürpriz altın + skor saçar.
3. **`golden_statue` (Altın Heykel):** Dayanıklı 3 vuruşluk heykel; her vuruşta sikke döker, 3. vuruşta dev hazine patlaması yapar.
4. **`magic_chest` (Büyülü Sandık):** Kırıldığında garantili toplanabilir Bonus (Altın Yağmuru, 2X Skor, Süper Güç veya Ekstra Puan) fırlatır.
5. **`beehive` (Arı Kovanı):** Öfkeli arı sürüsü salarak yakındaki düşmanları panikletip ekstra puan kazandırır.
6. **`bird_nest` (Kuş Yuvası):** Kuşlar ve tüyler uçuşur, gizli altın yumurtalar düşer.
7. **`ice_block` (Buz Bloğu):** Kırılınca şok dalgasıyla sahnedeki düşmanları 3.5 saniye dondurup yavaşlatır.
8. **`pumpkin` (Balkabağı):** Kabak parçaları ve ekstra puan + altın patlaması.
9. **`firework_box` (Havai Fişek Kutusu):** Gökyüzüne yükselen renkli havai fişekler fırlatır ve büyük skor bonusu verir.
10. **`pirate_barrel` (Korsan Fıçısı):** Barut patlaması + korsan altını kesesi + yakındaki hedeflere alan hasarı.
11. **`bone_pile` (Kemik Yığını):** Zıplayan iskelet kemikleri ve ekstra kombo puanı.
12. **`ghost_jar` (Hayalet Kavanozu):** İçinden ürkütücü ama komik hayaletler fırlayıp ekranı aydınlatır ve büyük skor verir.
13. **`egg_basket` (Yumurta Sepeti):** Zıplayan yumurtalar ve altın civciv/sikke yağmuru.

---

## 4. 7 Özel Karakter (Special NPCs)

`src/game/SpecialNpcs.ts` içinde kafalarının üstünde net uyarı veya ödül rozeti taşıyan 7 özel karakter bulunur:

- **Vurulursa Bölüm Anında Biter (Anında Kayıp):**
  - `princess` → **"PRENSESİ ÖLDÜRDÜN!"**
  - `king` → **"KRALA SALDIRDIN!"**
  - `priest` → **"KUTSAL GÖREVİ İHLAL ETTİN!"**
  - `child` → **"MASUM BİRİNE VURDUN!"**
- **Ödüllü / Eğlenceli Özel Karakterler:**
  - `gold_merchant` (Altın Tüccarı): Bolca altın kesesi ve sikke yağmuru döker.
  - `chicken` (Tavuk): Gıdaklayarak tüy fırtınası çıkarır ve eğlenceli ekstra skor + altın verir.
  - `traveler` (Gizemli Gezgin): Rastgele bonus veya hazine kesesi bırakır.

---

## 5. Kombo, Bonus ve Bölüm Olayları

- **Kombo Sistemi (`COMBO_DECAY_DURATION = 2.2 sn`):** Arka arkaya isabetli vuruşlarda `x2`, `x3`, `x4+` (Alev Kombo), `x7+` (Efsane Kombo) skor çarpanı (`+%14` / adım).
- **4 Bonus Türü:** `gold_rush` (Altın Bonusu), `double_score` (7 sn 2X Skor), `power_surge` (6.5 sn Süper Güç), `extra_points` (+450 / +900 Anında Skor).
- **Bölüm İçi Dinamik Olaylar (`levelEvent`):** `gold_rain`, `sprinter_wave`, `tnt_chain`, `ghost_mist`, `meteor_shower`.

---

## 6. Three.js Mobil Performans Optimizasyonları

- **Doku Önbellekleme:** Tüm kırılabilir nesne (`BreakableCatalog.ts`), özel NPC (`SpecialNpcs.ts`), Boss (`BossSystem.ts`) ve karanlık fantezi çevre dokuları tek seferlik CanvasTexture olarak önbellekte tutulur ve `dispose()` anında tamamen serbest bırakılır.
- **Nesne Havuzları (Object Pooling):** Parçalanma enkazı (`debrisPool`, 56 slot), etkileşimli efektler (`interactiveFxPool`, 24 slot), Boss tehlike/mermileri (`hazardPool`, 12 slot), kıvılcım ve sikkeler çalışma zamanında yeni GPU bellek tahsisi yapmadan yeniden kullanılır.
- **UI Performansı:** Oyun içi aktif WebGL sahnesi üstünde (`GameHud.tsx` ve `BossControlsHud.tsx`) `backdrop-blur` kullanılmaz; çoklu dokunuş joystick ve saldırı butonu `pointerId` ile izole edilmiştir.

---

## 7. Merkezi Altın Ekonomisi ve Bölüm Başarısına Bağlı Ödül Sistemi

Altın kazanma, hesaplama, geçici bakiye takibi ve kalıcı ödül aktarımı `src/game/goldEconomy.ts` (`GoldEconomyManager`) ve `src/game/storage.ts` üzerinden tek merkezden yönetilir.

### 7.1 Tespit Edilen ve Giderilen Eski Enflasyon / Çift Ödeme Hataları
- **Üst Üste Çarpılan Çarpanlar:** Eskiden hedefler spawn anında `goldScale` (3.65x'e kadar) ile çarpılıyor, vuruş anında tekrar `goldMult` (2.04x) ve `goldPowerScale` (1.25x) ile katlanıyordu (~9.3x). Artık tüm kaynaklar tekil taban tablosu + bölüm kalibre ölçeği + üst tavanlı toplamsal altın çarpanı (`MAX_GOLD_MULTIPLIER = 1.65x`) ile hesaplanır.
- **Etkileşimli Nesne Çift Ödemeleri:** `golden_statue`, `balloon`, `pumpkin` ve `pirate_barrel` eskiden hem genel vuruşta hem etkileşimli efekt içinde ikinci kez altın saçıyordu. Artık `SELF_DISTRIBUTING_GOLD_BREAKABLES` koruması ve tekil `target_${entityId}` anahtarı ile yalnızca **bir kez** ödeme yapar.
- **TNT ve Zincir Patlama Çift Sayımı:** `allocateTntBlastGold`, normal vuruşlarla aynı `target_${entityId}` tekilleştirme anahtarını kullanır; bir hedef hem vuruş hem TNT veya zincir patlama ile asla iki kez altın üretemez.
- **Boss Sınırsız Vuruş ve Çift Yenilgi Ödülü:** Boss vuruş altını toplam boss ödülünün %25 bütçesiyle sınırlandı; yinelenen `onBossDefeated` kod bloğu tek `handleBossDefeated` metodunda birleştirildi ve `boss_defeat_${bossId}` anahtarıyla tekilleştirildi.
- **Skor / Kombo Ayrımı:** Kombo çarpanı, `2X Çift Skor`, `Süper Güç` ve `Ekstra Puan` bonusları altın hesaplamasına kesinlikle girmez.

### 7.2 60 Bölümlük Dengeli Altın Eğrisi (`computeLevelGoldCalibration`)
- **Mağaza Toplam Maliyeti:** Silahlar (`28.950`) + Tılsımlar (`14.200`) = **43.150 Altın**.
- **60 Bölüm Beklenen Toplam Kazanç (Tek Sefer Geçiş):** **37.790 Altın** (`29.760` bölüm içi + `8.030` tamamlama bonusu); üst tavanlı tam performansla **47.290 Altın**.
- **Örnek Bölümler:**
  - Bölüm 1 (46 sn): ~120 bölüm içi (maks 160) + 30 tamamlama bonusu = **150 Altın**
  - Bölüm 10 (Boss): ~280 bölüm içi (maks 320) + 100 tamamlama bonusu = **380 Altın**
  - Bölüm 15 (50 sn): ~270 bölüm içi (maks 360) + 70 tamamlama bonusu = **340 Altın**
  - Bölüm 30 (Boss): ~620 bölüm içi (maks 710) + 220 tamamlama bonusu = **840 Altın** (ilk 30 bölüm kümülatif ~11.020 altın)
  - Bölüm 59 (69 sn): ~860 bölüm içi (maks 1.160) + 220 tamamlama bonusu = **1.080 Altın**
  - Bölüm 60 (Final Boss): ~1.300 bölüm içi (maks 1.490) + 500 tamamlama bonusu = **1.800 Altın**

### 7.3 Bölüm Bazlı Geçici Altın ve Atomik Aktarım Kuralları
1. **Bölüm Sırasında (`PLAYING`):** Toplanan her sikke yalnızca bellek içi geçici bakiyeyi (`GoldEconomyManager.temporaryGold`) artırır. Kalıcı bakiye (`SaveData.walletGold`) ve `localStorage` **değişmez**. HUD kalıcı bakiyeyi ve `+X Geçici` rozetini ayrı gösterir.
2. **Bölüm Başarısızlığında (`GAME_OVER`):** `failLevelSession()` geçici bakiyeyi ve havadaki sikkeleri tamamen sıfırlar. `recordLevelResult(..., won: false)` kalıcı `walletGold` ve `bestGold` değerlerini kesinlikle değiştirmez; altın başarımları tetiklenmez. Sonuç ekranında kazanılan altın `0` olarak, kaybedilen geçici altın ayrıca gösterilir.
3. **Bölüm Başarısında (`LEVEL_CLEAR` / `VICTORY`):** Havadaki kazanılmış sikkeler tamamlanır, `settleLevelVictory(runId)` `collectedLevelGold + completionBonusGold` toplamını tek işlemde hesaplar. `recordLevelResult` bu toplamı tek atomik yazmayla kalıcı `walletGold` bakiyesine ekler ve `runId` bilgisini `SaveData.settledRunIds` içinde saklayarak ikinci kez aktarımı engeller. `gold_earned` Google Play başarımı yalnızca bu kalıcı aktarım sonrasında tetiklenir.
4. **Uygulama Kapanması / Yeniden Başlatma:** Geçici altın yalnızca RAM'de tutulduğundan uygulama yarıda kapatılıp açıldığında kalıcı bakiyeye dönüşmez. Bölüm yeniden başlatıldığında `beginLevelSession()` geçici bakiyeyi `0` olarak sıfırlar.
5. **Ödüllü Reklam İzolasyonu:** Google AdMob `OnUserEarnedRewardListener` + benzersiz `grantToken` doğrulamasıyla kazanılan reklam altınları (`adConfig.ts`: mağaza +100, günlük +150, bölüm sonu %35 / min 50 / maks 300) geçici bölüm bakiyesinden tamamen bağımsız olarak `creditPermanentRewardedAdGold` ile tek seferlik kalıcı bakiyeye aktarılır.

