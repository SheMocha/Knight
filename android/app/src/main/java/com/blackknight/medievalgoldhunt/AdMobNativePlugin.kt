package com.blackknight.medievalgoldhunt

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.ads.mediation.admob.AdMobAdapter
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.ump.ConsentDebugSettings
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean

/**
 * GERÇEK ANDROID NATIVE GOOGLE ADMOB & UMP CAPACITOR EKLENTİSİ
 * ============================================================
 * - Doğrudan resmi Google Mobile Ads SDK (play-services-ads) ve
 *   Google User Messaging Platform SDK (user-messaging-platform) kullanır.
 * - Sahte/mock reklam gösterimi veya sahte ödül callback'i kesinlikle içermez.
 * - SDK uygulama yaşam döngüsünde yalnızca bir kez başlatılır (atomic guard).
 * - Ödüllü reklamlarda ödül YALNIZCA gerçek OnUserEarnedRewardListener
 *   tetiklendiğinde `rewarded = true` olarak döndürülür ve her gösterime
 *   benzersiz bir `grantToken` atanır.
 * - Banner reklamlar cihazın gerçek dikey genişliğine göre Anchored Adaptive
 *   Banner olarak alt kenara yerleştirilir ve oyun ekranlarında tamamen kaldırılır.
 */
@CapacitorPlugin(name = "AdMobNative")
class AdMobNativePlugin : Plugin() {

    private val sdkInitialized = AtomicBoolean(false)
    private val sdkInitializing = AtomicBoolean(false)

    private var consentInformation: ConsentInformation? = null
    private var nonPersonalizedOnly: Boolean = true

    private var bannerContainer: FrameLayout? = null
    private var bannerAdView: AdView? = null
    private var bannerVisible: Boolean = false
    private var lastBannerHeightPx: Int = 0
    private var lastBannerHeightDp: Int = 0

    private var interstitialAd: InterstitialAd? = null
    private var interstitialLoading: Boolean = false

    private var rewardedAd: RewardedAd? = null
    private var rewardedLoading: Boolean = false

    private fun mapConsentStatus(status: Int): String {
        return when (status) {
            ConsentInformation.ConsentStatus.OBTAINED -> "OBTAINED"
            ConsentInformation.ConsentStatus.NOT_REQUIRED -> "NOT_REQUIRED"
            ConsentInformation.ConsentStatus.REQUIRED -> "REQUIRED"
            else -> "UNKNOWN"
        }
    }

    private fun buildAdRequest(): AdRequest {
        val builder = AdRequest.Builder()
        if (nonPersonalizedOnly) {
            val extras = Bundle()
            extras.putString("npa", "1")
            builder.addNetworkExtrasBundle(AdMobAdapter::class.java, extras)
        }
        return builder.build()
    }

    private fun getPortraitAdaptiveAdSize(): AdSize {
        val act = activity ?: return AdSize.BANNER
        val displayMetrics = DisplayMetrics()
        val adWidthPixels = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val windowMetrics = act.windowManager.currentWindowMetrics
            windowMetrics.bounds.width().toFloat()
        } else {
            @Suppress("DEPRECATION")
            act.windowManager.defaultDisplay.getMetrics(displayMetrics)
            displayMetrics.widthPixels.toFloat()
        }
        val density = act.resources.displayMetrics.density.coerceAtLeast(1f)
        val adWidthDp = (adWidthPixels / density).toInt().coerceAtLeast(320)
        return AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(act, adWidthDp)
    }

    /**
     * 1) Google UMP SDK ile gerçek gizlilik / izin durumunu sorgular ve gerekiyorsa
     *    (EEA, Birleşik Krallık, İsviçre veya yapılandırılmış bölgeler) izin formunu gösterir.
     */
    @PluginMethod
    fun requestConsentInfo(call: PluginCall) {
        val act = activity ?: run {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("canRequestAds", false)
            ret.put("consentStatus", "UNKNOWN")
            ret.put("privacyOptionsRequired", false)
            ret.put("nonPersonalizedOnly", true)
            ret.put("statusCode", "ACTIVITY_UNAVAILABLE")
            ret.put("message", "Android Activity erişilemiyor.")
            call.resolve(ret)
            return
        }

        val tagForUnderAge = call.getBoolean("tagForUnderAgeOfConsent", false) ?: false
        val debugGeography = call.getString("debugGeography", "DISABLED") ?: "DISABLED"
        val testDevicesArray = call.getArray("testDeviceHashedIds")

        act.runOnUiThread {
            try {
                val info = UserMessagingPlatform.getConsentInformation(act)
                consentInformation = info

                val paramsBuilder = ConsentRequestParameters.Builder()
                    .setTagForUnderAgeOfConsent(tagForUnderAge)

                if (debugGeography != "DISABLED") {
                    val debugBuilder = ConsentDebugSettings.Builder(act)
                    val geoConst = when (debugGeography) {
                        "EEA" -> ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_EEA
                        "NOT_EEA" -> ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_NOT_EEA
                        else -> ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_DISABLED
                    }
                    debugBuilder.setDebugGeography(geoConst)
                    if (testDevicesArray != null) {
                        for (i in 0 until testDevicesArray.length()) {
                            val hash = testDevicesArray.optString(i).trim()
                            if (hash.isNotEmpty()) {
                                debugBuilder.addTestDeviceHashedId(hash)
                            }
                        }
                    }
                    paramsBuilder.setConsentDebugSettings(debugBuilder.build())
                }

                info.requestConsentInfoUpdate(
                    act,
                    paramsBuilder.build(),
                    {
                        UserMessagingPlatform.loadAndShowConsentFormIfRequired(act) { formError ->
                            val canRequest = info.canRequestAds()
                            val privacyRequired =
                                info.privacyOptionsRequirementStatus ==
                                    ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED
                            val statusStr = mapConsentStatus(info.consentStatus)
                            // Kişiselleştirilmiş reklam yalnızca açık onay alındığında veya UMP gerekli değilse açılır
                            nonPersonalizedOnly =
                                !(canRequest &&
                                    (info.consentStatus == ConsentInformation.ConsentStatus.OBTAINED ||
                                        info.consentStatus == ConsentInformation.ConsentStatus.NOT_REQUIRED))

                            val ret = JSObject()
                            ret.put("success", formError == null)
                            ret.put("canRequestAds", canRequest)
                            ret.put("consentStatus", statusStr)
                            ret.put("privacyOptionsRequired", privacyRequired)
                            ret.put("nonPersonalizedOnly", nonPersonalizedOnly)
                            ret.put(
                                "statusCode",
                                if (formError == null) "OK" else "CONSENT_FORM_ERROR"
                            )
                            if (formError != null) {
                                ret.put("message", formError.message)
                            }
                            call.resolve(ret)
                        }
                    },
                    { requestError ->
                        // UMP güncellemesi başarısız olsa bile (örn. çevrimdışı) mevcut önbellek durumunu kontrol et
                        val canRequest = info.canRequestAds()
                        val privacyRequired =
                            info.privacyOptionsRequirementStatus ==
                                ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED
                        nonPersonalizedOnly = true
                        Log.w(TAG, "UMP requestConsentInfoUpdate hatası: ${requestError.message}")
                        val ret = JSObject()
                        ret.put("success", false)
                        ret.put("canRequestAds", canRequest)
                        ret.put("consentStatus", mapConsentStatus(info.consentStatus))
                        ret.put("privacyOptionsRequired", privacyRequired)
                        ret.put("nonPersonalizedOnly", true)
                        ret.put("statusCode", "CONSENT_REQUEST_FAILED")
                        ret.put("message", requestError.message)
                        call.resolve(ret)
                    }
                )
            } catch (e: Exception) {
                Log.e(TAG, "UMP izin akışı sırasında beklenmeyen hata", e)
                nonPersonalizedOnly = true
                val ret = JSObject()
                ret.put("success", false)
                ret.put("canRequestAds", false)
                ret.put("consentStatus", "UNKNOWN")
                ret.put("privacyOptionsRequired", false)
                ret.put("nonPersonalizedOnly", true)
                ret.put("statusCode", "UMP_EXCEPTION")
                ret.put("message", e.message ?: "UMP gizlilik kontrolü başarısız.")
                call.resolve(ret)
            }
        }
    }

    /**
     * Kullanıcının istediği zaman gizlilik ve reklam tercihlerini güncellemesi için UMP formunu açar.
     */
    @PluginMethod
    fun showPrivacyOptionsForm(call: PluginCall) {
        val act = activity ?: run {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("statusCode", "ACTIVITY_UNAVAILABLE")
            ret.put("message", "Android Activity erişilemiyor.")
            call.resolve(ret)
            return
        }

        act.runOnUiThread {
            try {
                UserMessagingPlatform.showPrivacyOptionsForm(act) { formError ->
                    val info = consentInformation ?: UserMessagingPlatform.getConsentInformation(act)
                    val canRequest = info.canRequestAds()
                    val privacyRequired =
                        info.privacyOptionsRequirementStatus ==
                            ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED
                    nonPersonalizedOnly =
                        !(canRequest &&
                            (info.consentStatus == ConsentInformation.ConsentStatus.OBTAINED ||
                                info.consentStatus == ConsentInformation.ConsentStatus.NOT_REQUIRED))

                    val ret = JSObject()
                    ret.put("success", formError == null)
                    ret.put("canRequestAds", canRequest)
                    ret.put("consentStatus", mapConsentStatus(info.consentStatus))
                    ret.put("privacyOptionsRequired", privacyRequired)
                    ret.put("nonPersonalizedOnly", nonPersonalizedOnly)
                    ret.put("statusCode", if (formError == null) "OK" else "PRIVACY_FORM_ERROR")
                    if (formError != null) {
                        ret.put("message", formError.message)
                    }
                    call.resolve(ret)
                }
            } catch (e: Exception) {
                val ret = JSObject()
                ret.put("success", false)
                ret.put("statusCode", "PRIVACY_FORM_EXCEPTION")
                ret.put("message", e.message ?: "Gizlilik tercihleri ekranı açılamadı.")
                call.resolve(ret)
            }
        }
    }

    /**
     * 2) Resmi Google Mobile Ads SDK'sını yalnızca bir kez (gizlilik izni uygunsa) başlatır.
     */
    @PluginMethod
    fun initializeAds(call: PluginCall) {
        val act = activity ?: run {
            val ret = JSObject()
            ret.put("initialized", false)
            ret.put("statusCode", "ACTIVITY_UNAVAILABLE")
            ret.put("message", "Android Activity erişilemiyor.")
            call.resolve(ret)
            return
        }

        val info = consentInformation ?: UserMessagingPlatform.getConsentInformation(act)
        if (!info.canRequestAds()) {
            val ret = JSObject()
            ret.put("initialized", false)
            ret.put("statusCode", "CONSENT_NOT_GRANTED")
            ret.put("message", "Kullanıcı gizlilik onayı henüz reklam talebine izin vermiyor.")
            call.resolve(ret)
            return
        }

        if (sdkInitialized.get()) {
            val ret = JSObject()
            ret.put("initialized", true)
            ret.put("statusCode", "ALREADY_INITIALIZED")
            call.resolve(ret)
            return
        }

        val testDevicesArray = call.getArray("testDeviceHashedIds")
        val maxContentRating = call.getString("maxAdContentRating", "PG") ?: "PG"

        if (!sdkInitializing.compareAndSet(false, true)) {
            val ret = JSObject()
            ret.put("initialized", false)
            ret.put("statusCode", "INITIALIZING")
            call.resolve(ret)
            return
        }

        act.runOnUiThread {
            try {
                val reqConfigBuilder = RequestConfiguration.Builder()
                val testIds = mutableListOf<String>()
                if (testDevicesArray != null) {
                    for (i in 0 until testDevicesArray.length()) {
                        val id = testDevicesArray.optString(i).trim()
                        if (id.isNotEmpty()) testIds.add(id)
                    }
                }
                if (testIds.isNotEmpty()) {
                    reqConfigBuilder.setTestDeviceIds(testIds)
                }
                val rating = when (maxContentRating) {
                    "G" -> RequestConfiguration.MAX_AD_CONTENT_RATING_G
                    "T" -> RequestConfiguration.MAX_AD_CONTENT_RATING_T
                    "MA" -> RequestConfiguration.MAX_AD_CONTENT_RATING_MA
                    else -> RequestConfiguration.MAX_AD_CONTENT_RATING_PG
                }
                reqConfigBuilder.setMaxAdContentRating(rating)
                MobileAds.setRequestConfiguration(reqConfigBuilder.build())

                MobileAds.initialize(act) {
                    sdkInitialized.set(true)
                    sdkInitializing.set(false)
                    val ret = JSObject()
                    ret.put("initialized", true)
                    ret.put("statusCode", "INITIALIZED")
                    call.resolve(ret)
                }
            } catch (e: Exception) {
                sdkInitializing.set(false)
                Log.e(TAG, "MobileAds.initialize hatası", e)
                val ret = JSObject()
                ret.put("initialized", false)
                ret.put("statusCode", "INIT_FAILED")
                ret.put("message", e.message ?: "Google Mobile Ads SDK başlatılamadı.")
                call.resolve(ret)
            }
        }
    }

    /**
     * 3) Anchored Adaptive Banner reklamını alt kenarda gösterir (yalnızca oyun dışı ekranlar için).
     */
    @PluginMethod
    fun showBanner(call: PluginCall) {
        val act = activity ?: run {
            val ret = JSObject()
            ret.put("shown", false)
            ret.put("statusCode", "ACTIVITY_UNAVAILABLE")
            call.resolve(ret)
            return
        }
        val adUnitId = call.getString("adUnitId")?.trim().orEmpty()
        if (adUnitId.isEmpty()) {
            val ret = JSObject()
            ret.put("shown", false)
            ret.put("statusCode", "MISSING_AD_UNIT_ID")
            call.resolve(ret)
            return
        }
        if (!sdkInitialized.get()) {
            val ret = JSObject()
            ret.put("shown", false)
            ret.put("statusCode", "SDK_NOT_INITIALIZED")
            call.resolve(ret)
            return
        }

        act.runOnUiThread {
            try {
                // Var olan banner zaten yüklüyse yalnızca görünür yap
                if (bannerAdView != null && bannerAdView?.adUnitId == adUnitId) {
                    bannerContainer?.visibility = View.VISIBLE
                    bannerAdView?.resume()
                    bannerVisible = true
                    val ret = JSObject()
                    ret.put("shown", true)
                    ret.put("heightPx", lastBannerHeightPx)
                    ret.put("heightDp", lastBannerHeightDp)
                    ret.put("statusCode", "SHOWN")
                    call.resolve(ret)
                    return@runOnUiThread
                }

                destroyBannerInternal()

                val adSize = getPortraitAdaptiveAdSize()
                val adView = AdView(act)
                adView.adUnitId = adUnitId
                adView.setAdSize(adSize)

                val container = FrameLayout(act)
                container.setBackgroundColor(Color.TRANSPARENT)
                val containerParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                )
                val adParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                )
                container.addView(adView, adParams)

                val rootContent = act.findViewById<ViewGroup>(android.R.id.content)
                rootContent.addView(container, containerParams)

                bannerContainer = container
                bannerAdView = adView
                bannerVisible = true

                val density = act.resources.displayMetrics.density.coerceAtLeast(1f)
                lastBannerHeightPx = adSize.getHeightInPixels(act)
                lastBannerHeightDp = (lastBannerHeightPx / density).toInt()

                adView.adListener = object : AdListener() {
                    override fun onAdLoaded() {
                        val heightPx = adView.height.takeIf { it > 0 } ?: adSize.getHeightInPixels(act)
                        lastBannerHeightPx = heightPx
                        lastBannerHeightDp = (heightPx / density).toInt()
                        val data = JSObject()
                        data.put("heightPx", lastBannerHeightPx)
                        data.put("heightDp", lastBannerHeightDp)
                        notifyListeners("bannerLoaded", data)
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        Log.w(TAG, "Banner yüklenemedi: ${error.code} - ${error.message}")
                        bannerVisible = false
                        bannerContainer?.visibility = View.GONE
                        val data = JSObject()
                        data.put("code", error.code)
                        data.put("message", error.message)
                        notifyListeners("bannerFailedToLoad", data)
                    }

                    override fun onAdClicked() {
                        notifyListeners("bannerClicked", JSObject())
                    }
                }

                adView.loadAd(buildAdRequest())

                val ret = JSObject()
                ret.put("shown", true)
                ret.put("heightPx", lastBannerHeightPx)
                ret.put("heightDp", lastBannerHeightDp)
                ret.put("statusCode", "LOADING")
                call.resolve(ret)
            } catch (e: Exception) {
                Log.e(TAG, "Banner gösterme hatası", e)
                val ret = JSObject()
                ret.put("shown", false)
                ret.put("statusCode", "BANNER_EXCEPTION")
                ret.put("message", e.message ?: "Banner oluşturulamadı.")
                call.resolve(ret)
            }
        }
    }

    @PluginMethod
    fun hideBanner(call: PluginCall) {
        val act = activity
        if (act == null) {
            call.resolve(JSObject().put("hidden", true))
            return
        }
        act.runOnUiThread {
            bannerContainer?.visibility = View.GONE
            bannerAdView?.pause()
            bannerVisible = false
            call.resolve(JSObject().put("hidden", true))
        }
    }

    @PluginMethod
    fun removeBanner(call: PluginCall) {
        val act = activity
        if (act == null) {
            call.resolve(JSObject().put("removed", true))
            return
        }
        act.runOnUiThread {
            destroyBannerInternal()
            call.resolve(JSObject().put("removed", true))
        }
    }

    private fun destroyBannerInternal() {
        try {
            bannerAdView?.pause()
            bannerAdView?.destroy()
            val parent = bannerContainer?.parent as? ViewGroup
            parent?.removeView(bannerContainer)
        } catch (e: Exception) {
            Log.w(TAG, "Banner temizleme uyarısı", e)
        } finally {
            bannerAdView = null
            bannerContainer = null
            bannerVisible = false
            lastBannerHeightPx = 0
            lastBannerHeightDp = 0
        }
    }

    /**
     * 4) Geçiş Reklamı (Interstitial) önceden yükleme
     */
    @PluginMethod
    fun loadInterstitial(call: PluginCall) {
        val act = activity ?: run {
            call.resolve(JSObject().put("loaded", false).put("statusCode", "ACTIVITY_UNAVAILABLE"))
            return
        }
        val adUnitId = call.getString("adUnitId")?.trim().orEmpty()
        if (adUnitId.isEmpty() || !sdkInitialized.get()) {
            call.resolve(
                JSObject()
                    .put("loaded", false)
                    .put("statusCode", if (adUnitId.isEmpty()) "MISSING_AD_UNIT_ID" else "SDK_NOT_INITIALIZED")
            )
            return
        }

        act.runOnUiThread {
            if (interstitialAd != null) {
                call.resolve(JSObject().put("loaded", true).put("statusCode", "ALREADY_LOADED"))
                return@runOnUiThread
            }
            if (interstitialLoading) {
                call.resolve(JSObject().put("loaded", false).put("statusCode", "ALREADY_LOADING"))
                return@runOnUiThread
            }

            interstitialLoading = true
            InterstitialAd.load(
                act,
                adUnitId,
                buildAdRequest(),
                object : InterstitialAdLoadCallback() {
                    override fun onAdLoaded(ad: InterstitialAd) {
                        interstitialLoading = false
                        interstitialAd = ad
                        notifyListeners("interstitialLoaded", JSObject())
                        call.resolve(JSObject().put("loaded", true).put("statusCode", "LOADED"))
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        interstitialLoading = false
                        interstitialAd = null
                        val errData = JSObject()
                            .put("code", error.code)
                            .put("message", error.message)
                        notifyListeners("interstitialFailedToLoad", errData)
                        call.resolve(
                            JSObject()
                                .put("loaded", false)
                                .put("statusCode", "LOAD_FAILED")
                                .put("code", error.code)
                                .put("message", error.message)
                        )
                    }
                }
            )
        }
    }

    /**
     * Geçiş Reklamını gösterir; reklam kapandığında veya gösterilemediğinde temiz şekilde yanıt döner.
     */
    @PluginMethod
    fun showInterstitial(call: PluginCall) {
        val act = activity ?: run {
            call.resolve(JSObject().put("shown", false).put("statusCode", "ACTIVITY_UNAVAILABLE"))
            return
        }

        act.runOnUiThread {
            val ad = interstitialAd
            if (ad == null) {
                call.resolve(JSObject().put("shown", false).put("statusCode", "NOT_LOADED"))
                return@runOnUiThread
            }

            var resolved = false
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdShowedFullScreenContent() {
                    interstitialAd = null
                    notifyListeners("interstitialOpened", JSObject())
                }

                override fun onAdDismissedFullScreenContent() {
                    notifyListeners("interstitialClosed", JSObject())
                    if (!resolved) {
                        resolved = true
                        call.resolve(JSObject().put("shown", true).put("statusCode", "DISMISSED"))
                    }
                }

                override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                    interstitialAd = null
                    val errData = JSObject()
                        .put("code", adError.code)
                        .put("message", adError.message)
                    notifyListeners("interstitialFailedToShow", errData)
                    if (!resolved) {
                        resolved = true
                        call.resolve(
                            JSObject()
                                .put("shown", false)
                                .put("statusCode", "FAILED_TO_SHOW")
                                .put("message", adError.message)
                        )
                    }
                }
            }

            ad.show(act)
        }
    }

    /**
     * 5) Ödüllü Reklam (Rewarded) önceden yükleme
     */
    @PluginMethod
    fun loadRewarded(call: PluginCall) {
        val act = activity ?: run {
            call.resolve(JSObject().put("loaded", false).put("statusCode", "ACTIVITY_UNAVAILABLE"))
            return
        }
        val adUnitId = call.getString("adUnitId")?.trim().orEmpty()
        if (adUnitId.isEmpty() || !sdkInitialized.get()) {
            call.resolve(
                JSObject()
                    .put("loaded", false)
                    .put("statusCode", if (adUnitId.isEmpty()) "MISSING_AD_UNIT_ID" else "SDK_NOT_INITIALIZED")
            )
            return
        }

        act.runOnUiThread {
            if (rewardedAd != null) {
                call.resolve(JSObject().put("loaded", true).put("statusCode", "ALREADY_LOADED"))
                return@runOnUiThread
            }
            if (rewardedLoading) {
                call.resolve(JSObject().put("loaded", false).put("statusCode", "ALREADY_LOADING"))
                return@runOnUiThread
            }

            rewardedLoading = true
            RewardedAd.load(
                act,
                adUnitId,
                buildAdRequest(),
                object : RewardedAdLoadCallback() {
                    override fun onAdLoaded(ad: RewardedAd) {
                        rewardedLoading = false
                        rewardedAd = ad
                        notifyListeners("rewardedLoaded", JSObject())
                        call.resolve(JSObject().put("loaded", true).put("statusCode", "LOADED"))
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        rewardedLoading = false
                        rewardedAd = null
                        val errData = JSObject()
                            .put("code", error.code)
                            .put("message", error.message)
                        notifyListeners("rewardedFailedToLoad", errData)
                        call.resolve(
                            JSObject()
                                .put("loaded", false)
                                .put("statusCode", "LOAD_FAILED")
                                .put("code", error.code)
                                .put("message", error.message)
                        )
                    }
                }
            )
        }
    }

    /**
     * Ödüllü Reklamı gösterir.
     * KRİTİK: `rewarded = true` YALNIZCA Google AdMob'un gerçek OnUserEarnedRewardListener
     * geri çağrısı tetiklendiğinde döner; reklam yarıda kapatılırsa `rewarded = false` olur.
     */
    @PluginMethod
    fun showRewarded(call: PluginCall) {
        val act = activity ?: run {
            call.resolve(
                JSObject()
                    .put("shown", false)
                    .put("rewarded", false)
                    .put("statusCode", "ACTIVITY_UNAVAILABLE")
            )
            return
        }

        act.runOnUiThread {
            val ad = rewardedAd
            if (ad == null) {
                call.resolve(
                    JSObject()
                        .put("shown", false)
                        .put("rewarded", false)
                        .put("statusCode", "NOT_LOADED")
                )
                return@runOnUiThread
            }

            val grantToken = UUID.randomUUID().toString()
            var earnedReward = false
            var rewardType = ""
            var rewardAmount = 0
            var resolved = false

            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdShowedFullScreenContent() {
                    rewardedAd = null
                    notifyListeners("rewardedOpened", JSObject())
                }

                override fun onAdDismissedFullScreenContent() {
                    notifyListeners(
                        "rewardedClosed",
                        JSObject().put("rewarded", earnedReward).put("grantToken", grantToken)
                    )
                    if (!resolved) {
                        resolved = true
                        val ret = JSObject()
                        ret.put("shown", true)
                        ret.put("rewarded", earnedReward)
                        ret.put("rewardType", rewardType)
                        ret.put("rewardAmount", rewardAmount)
                        ret.put("grantToken", if (earnedReward) grantToken else "")
                        ret.put(
                            "statusCode",
                            if (earnedReward) "REWARD_EARNED" else "DISMISSED_WITHOUT_REWARD"
                        )
                        call.resolve(ret)
                    }
                }

                override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                    rewardedAd = null
                    val errData = JSObject()
                        .put("code", adError.code)
                        .put("message", adError.message)
                    notifyListeners("rewardedFailedToShow", errData)
                    if (!resolved) {
                        resolved = true
                        call.resolve(
                            JSObject()
                                .put("shown", false)
                                .put("rewarded", false)
                                .put("statusCode", "FAILED_TO_SHOW")
                                .put("message", adError.message)
                        )
                    }
                }
            }

            ad.show(act) { rewardItem ->
                earnedReward = true
                rewardType = rewardItem.type
                rewardAmount = rewardItem.amount
                val rewardData = JSObject()
                    .put("type", rewardType)
                    .put("amount", rewardAmount)
                    .put("grantToken", grantToken)
                notifyListeners("rewardedEarned", rewardData)
            }
        }
    }

    override fun handleOnPause() {
        super.handleOnPause()
        activity?.runOnUiThread {
            bannerAdView?.pause()
        }
    }

    override fun handleOnResume() {
        super.handleOnResume()
        activity?.runOnUiThread {
            if (bannerVisible) {
                bannerAdView?.resume()
            }
        }
    }

    override fun handleOnDestroy() {
        activity?.runOnUiThread {
            destroyBannerInternal()
        }
        interstitialAd = null
        rewardedAd = null
        super.handleOnDestroy()
    }

    companion object {
        private const val TAG = "AdMobNativePlugin"
    }
}
