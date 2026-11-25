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
