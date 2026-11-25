package com.blackknight.medievalgoldhunt

import android.util.Log
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.games.GamesClientStatusCodes
import com.google.android.gms.games.PlayGames
import com.google.android.gms.games.achievement.Achievement

/**
 * GERÇEK GOOGLE PLAY GAMES SERVICES V2 CAPACITOR NATIVE EKLENTİSİ
 * ================================================================
 * - Sahte oturum veya yerel taklit başarım döndürmez.
 * - Doğrudan Google Play Games Services SDK v2 (GamesSignInClient, PlayersClient, AchievementsClient) kullanır.
 * - Artımlı başarımlar için idempotent `setStepsImmediate` kullanır (çift sayımı engeller).
 * - Google Play Services yoksa, ağ kesikse veya Project ID ayarlanmamışsa oyunu çökertmeden yapılandırılmış durum kodu döndürür.
 */
@CapacitorPlugin(name = "PlayGamesV2")
class PlayGamesV2Plugin : Plugin() {

    private fun isProjectIdConfigured(): Boolean {
        return try {
            val id = context.getString(R.string.game_services_project_id).trim()
            id.isNotEmpty() && !id.startsWith("REPLACE_WITH_") && id.all { it.isDigit() }
        } catch (_: Exception) {
            false
        }
    }

    private fun isGooglePlayServicesAvailable(): Boolean {
        return try {
            val status = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context)
            status == ConnectionResult.SUCCESS
        } catch (_: Exception) {
            false
        }
    }

    private fun resolveAchievementId(call: PluginCall): String? {
        val rawId = call.getString("achievementId")?.trim().orEmpty()
        if (rawId.isNotEmpty() && !rawId.startsWith("REPLACE_WITH_")) {
            return rawId
        }
        // Fallback: Android res/values/games-ids.xml içindeki `achievement_<key>` kaynağından oku
        val key = call.getString("achievementKey")?.trim().orEmpty()
        if (key.isNotEmpty()) {
            val resId = context.resources.getIdentifier("achievement_$key", "string", context.packageName)
            if (resId != 0) {
                val xmlVal = context.getString(resId).trim()
                if (xmlVal.isNotEmpty() && !xmlVal.startsWith("REPLACE_WITH_")) {
                    return xmlVal
                }
            }
        }
        return null
    }

    private fun buildBaseStatus(isAuthenticated: Boolean, statusCode: String, message: String? = null): JSObject {
        val ret = JSObject()
        ret.put("isAuthenticated", isAuthenticated)
        ret.put("statusCode", statusCode)
        ret.put("playServicesAvailable", isGooglePlayServicesAvailable())
        ret.put("projectIdConfigured", isProjectIdConfigured())
        if (message != null) ret.put("message", message)
        return ret
    }

    private fun fetchCurrentPlayerAndResolve(call: PluginCall) {
        val act = activity ?: run {
            call.resolve(buildBaseStatus(false, "ACTIVITY_UNAVAILABLE", "Android Activity erişilemiyor."))
            return
        }
        PlayGames.getPlayersClient(act).currentPlayer
            .addOnCompleteListener { playerTask ->
                val ret = buildBaseStatus(true, "AUTHENTICATED")
                if (playerTask.isSuccessful && playerTask.result != null) {
                    val player = playerTask.result
                    ret.put("playerId", player.playerId)
                    ret.put("displayName", player.displayName)
                    ret.put("title", player.title ?: "")
                    ret.put("avatarImageUri", player.iconImageUri?.toString() ?: "")
                }
                call.resolve(ret)
            }
    }

    /**
     * Uygulama açılışında Google Play Games Services v2 otomatik kimlik doğrulama durumunu kontrol eder.
     */
    @PluginMethod
    fun isAuthenticated(call: PluginCall) {
        if (!isProjectIdConfigured()) {
            call.resolve(
                buildBaseStatus(
                    false,
                    "PROJECT_NOT_CONFIGURED",
                    "Google Play Games Project ID henüz android/app/src/main/res/values/games-ids.xml dosyasına girilmemiş."
                )
            )
            return
        }
        if (!isGooglePlayServicesAvailable()) {
            call.resolve(
                buildBaseStatus(
                    false,
                    "PLAY_SERVICES_UNAVAILABLE",
                    "Bu cihazda Google Play Hizmetleri kullanılamıyor veya güncel değil."
                )
            )
            return
        }

        val act = activity ?: run {
            call.resolve(buildBaseStatus(false, "ACTIVITY_UNAVAILABLE", "Android Activity bulunamadı."))
            return
        }

        try {
            PlayGames.getGamesSignInClient(act).isAuthenticated
                .addOnCompleteListener { task ->
                    if (task.isSuccessful && task.result.isAuthenticated) {
                        fetchCurrentPlayerAndResolve(call)
                    } else {
                        val errMsg = task.exception?.localizedMessage
                        call.resolve(
                            buildBaseStatus(
                                false,
                                "NOT_SIGNED_IN",
                                errMsg ?: "Google Play Games hesabına giriş yapılmadı."
                            )
                        )
                    }
                }
        } catch (e: Exception) {
            Log.e(TAG, "isAuthenticated hatası", e)
            call.resolve(buildBaseStatus(false, "SERVER_ERROR", e.localizedMessage ?: "Kimlik doğrulama hatası."))
        }
    }

    /**
     * Kullanıcı manuel "Google Play'e Bağlan" butonuna bastığında gerçek Play Games v2 oturumunu başlatır.
     */
    @PluginMethod
    fun signIn(call: PluginCall) {
        if (!isProjectIdConfigured()) {
            call.resolve(
                buildBaseStatus(
                    false,
                    "PROJECT_NOT_CONFIGURED",
                    "Google Play Games Project ID yapılandırılmamış."
                )
            )
            return
        }
        if (!isGooglePlayServicesAvailable()) {
            call.resolve(
                buildBaseStatus(
                    false,
                    "PLAY_SERVICES_UNAVAILABLE",
                    "Google Play Hizmetleri bu cihazda kullanılamıyor."
                )
            )
            return
        }

        val act = activity ?: run {
            call.resolve(buildBaseStatus(false, "ACTIVITY_UNAVAILABLE", "Android Activity bulunamadı."))
            return
        }

        try {
            PlayGames.getGamesSignInClient(act).signIn()
                .addOnCompleteListener { task ->
                    if (task.isSuccessful && task.result.isAuthenticated) {
                        fetchCurrentPlayerAndResolve(call)
                    } else {
                        val errMsg = task.exception?.localizedMessage
                        call.resolve(
                            buildBaseStatus(
                                false,
                                "NOT_SIGNED_IN",
                                errMsg ?: "Google Play Games girişi tamamlanamadı."
                            )
                        )
                    }
                }
        } catch (e: Exception) {
            Log.e(TAG, "signIn hatası", e)
            call.resolve(buildBaseStatus(false, "SERVER_ERROR", e.localizedMessage ?: "Giriş sırasında hata."))
        }
    }

    /**
     * Google Play sunucularından oyuncunun gerçek başarım durumlarını yükler.
     */
    @PluginMethod
    fun loadAchievements(call: PluginCall) {
        if (!isProjectIdConfigured() || !isGooglePlayServicesAvailable()) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("statusCode", if (!isProjectIdConfigured()) "PROJECT_NOT_CONFIGURED" else "PLAY_SERVICES_UNAVAILABLE")
            ret.put("achievements", JSArray())
            call.resolve(ret)
            return
        }

        val act = activity ?: run {
            call.reject("Activity unavailable")
            return
        }

        val forceReload = call.getBoolean("forceReload", false) ?: false

        try {
            PlayGames.getAchievementsClient(act).load(forceReload)
                .addOnSuccessListener { annotatedData ->
                    val list = JSArray()
                    val buffer = annotatedData.get()
                    if (buffer != null) {
                        try {
                            for (ach in buffer) {
                                val item = JSObject()
                                item.put("id", ach.achievementId)
                                item.put("name", ach.name)
                                item.put("description", ach.description)
                                item.put(
                                    "state",
                                    when (ach.state) {
                                        Achievement.STATE_UNLOCKED -> "UNLOCKED"
                                        Achievement.STATE_HIDDEN -> "HIDDEN"
                                        else -> "REVEALED"
                                    }
                                )
                                val isInc = ach.type == Achievement.TYPE_INCREMENTAL
                                item.put("type", if (isInc) "INCREMENTAL" else "STANDARD")
                                item.put("currentSteps", if (isInc) ach.currentSteps else if (ach.state == Achievement.STATE_UNLOCKED) 1 else 0)
                                item.put("totalSteps", if (isInc) ach.totalSteps else 1)
                                item.put("lastUpdatedTimestamp", ach.lastUpdatedTimestamp)
                                list.put(item)
                            }
                        } finally {
                            buffer.release()
                        }
                    }
                    val ret = JSObject()
                    ret.put("success", true)
                    ret.put("statusCode", "OK")
                    ret.put("isStale", annotatedData.isStale)
                    ret.put("achievements", list)
                    call.resolve(ret)
                }
                .addOnFailureListener { e ->
                    Log.w(TAG, "loadAchievements başarısız", e)
                    val ret = JSObject()
                    ret.put("success", false)
                    ret.put("statusCode", mapApiErrorCode(e))
                    ret.put("message", e.localizedMessage ?: "Başarımlar Google Play sunucusundan yüklenemedi.")
                    ret.put("achievements", JSArray())
                    call.resolve(ret)
                }
        } catch (e: Exception) {
            Log.e(TAG, "loadAchievements istisnası", e)
            val ret = JSObject()
            ret.put("success", false)
            ret.put("statusCode", "SERVER_ERROR")
            ret.put("message", e.localizedMessage ?: "Sunucu hatası.")
            ret.put("achievements", JSArray())
            call.resolve(ret)
        }
    }

    /**
     * Tek seferlik (Standard) başarımı Google Play sunucularında kalıcı olarak açar.
     */
    @PluginMethod
    fun unlockAchievement(call: PluginCall) {
        val achId = resolveAchievementId(call)
        if (achId == null) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("statusCode", "MISSING_CONSOLE_ID")
            ret.put("message", "Bu başarım için gerçek Google Play Console Achievement ID tanımlanmamış.")
            call.resolve(ret)
            return
        }
        val act = activity ?: run {
            call.reject("Activity unavailable")
            return
        }

        try {
            PlayGames.getAchievementsClient(act).unlockImmediate(achId)
                .addOnSuccessListener {
                    val ret = JSObject()
                    ret.put("success", true)
                    ret.put("statusCode", "UNLOCKED")
                    ret.put("achievementId", achId)
                    call.resolve(ret)
                }
                .addOnFailureListener { e ->
                    val alreadyUnlocked = e is ApiException &&
                        e.statusCode == GamesClientStatusCodes.ACHIEVEMENT_UNLOCKED
                    val ret = JSObject()
                    ret.put("success", alreadyUnlocked)
                    ret.put("alreadyUnlocked", alreadyUnlocked)
                    ret.put("statusCode", if (alreadyUnlocked) "ALREADY_UNLOCKED" else mapApiErrorCode(e))
                    ret.put("achievementId", achId)
                    ret.put("message", e.localizedMessage ?: "")
                    call.resolve(ret)
                }
        } catch (e: Exception) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("statusCode", "SERVER_ERROR")
            ret.put("message", e.localizedMessage ?: "Başarım açma hatası.")
            call.resolve(ret)
        }
    }

    /**
     * Artımlı (Incremental) başarımın gerçek toplam adım değerini Google Play sunucusuna yazar.
     * `setStepsImmediate` idempotent olduğu için yeniden senkronizasyonda çift sayım oluşmaz.
     */
    @PluginMethod
    fun setStepsAchievement(call: PluginCall) {
        val achId = resolveAchievementId(call)
        if (achId == null) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("statusCode", "MISSING_CONSOLE_ID")
            ret.put("message", "Bu artımlı başarım için gerçek Google Play Console Achievement ID tanımlanmamış.")
            call.resolve(ret)
            return
        }
        val numSteps = call.getInt("numSteps", 0) ?: 0
        if (numSteps <= 0) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("statusCode", "INVALID_STEPS")
            ret.put("message", "Adım sayısı 1 veya daha büyük olmalıdır.")
            call.resolve(ret)
            return
        }
        val act = activity ?: run {
            call.reject("Activity unavailable")
            return
        }

        try {
            PlayGames.getAchievementsClient(act).setStepsImmediate(achId, numSteps)
                .addOnSuccessListener { unlocked ->
                    val ret = JSObject()
                    ret.put("success", true)
                    ret.put("unlocked", unlocked)
                    ret.put("statusCode", if (unlocked) "UNLOCKED" else "PROGRESS_UPDATED")
                    ret.put("achievementId", achId)
                    ret.put("steps", numSteps)
                    call.resolve(ret)
                }
                .addOnFailureListener { e ->
                    val alreadyUnlocked = e is ApiException &&
                        e.statusCode == GamesClientStatusCodes.ACHIEVEMENT_UNLOCKED
                    val ret = JSObject()
                    ret.put("success", alreadyUnlocked)
                    ret.put("unlocked", alreadyUnlocked)
                    ret.put("alreadyUnlocked", alreadyUnlocked)
                    ret.put("statusCode", if (alreadyUnlocked) "ALREADY_UNLOCKED" else mapApiErrorCode(e))
                    ret.put("achievementId", achId)
                    ret.put("message", e.localizedMessage ?: "")
                    call.resolve(ret)
                }
        } catch (e: Exception) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("statusCode", "SERVER_ERROR")
            ret.put("message", e.localizedMessage ?: "Adım güncelleme hatası.")
            call.resolve(ret)
        }
    }

    /**
     * Google Play Games'in resmi native Başarımlar ekranını açar.
     */
    @PluginMethod
    fun showAchievementsUi(call: PluginCall) {
        if (!isProjectIdConfigured() || !isGooglePlayServicesAvailable()) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("statusCode", if (!isProjectIdConfigured()) "PROJECT_NOT_CONFIGURED" else "PLAY_SERVICES_UNAVAILABLE")
            ret.put("message", "Google Play Games başarımlar ekranı açılamıyor: yapılandırma veya Play Hizmetleri eksik.")
            call.resolve(ret)
            return
        }
        val act = activity ?: run {
            call.reject("Activity unavailable")
            return
        }

        try {
            PlayGames.getAchievementsClient(act).achievementsIntent
                .addOnSuccessListener { intent ->
                    startActivityForResult(call, intent, "handleAchievementsUiResult")
                }
                .addOnFailureListener { e ->
                    val ret = JSObject()
                    ret.put("success", false)
                    ret.put("statusCode", mapApiErrorCode(e))
                    ret.put("message", e.localizedMessage ?: "Google Play başarımlar ekranı açılamadı.")
                    call.resolve(ret)
                }
        } catch (e: Exception) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("statusCode", "SERVER_ERROR")
            ret.put("message", e.localizedMessage ?: "Başarımlar arayüzü başlatılamadı.")
            call.resolve(ret)
        }
    }

    @ActivityCallback
    private fun handleAchievementsUiResult(call: PluginCall?, _result: ActivityResult) {
        if (call == null) return
        val ret = JSObject()
        ret.put("success", true)
        ret.put("statusCode", "CLOSED")
        call.resolve(ret)
    }

    private fun mapApiErrorCode(e: Exception): String {
        if (e is ApiException) {
            return when (e.statusCode) {
                GamesClientStatusCodes.NETWORK_ERROR_OPERATION_FAILED,
                GamesClientStatusCodes.NETWORK_ERROR_NO_DATA,
                GamesClientStatusCodes.NETWORK_ERROR_STALE_DATA -> "OFFLINE"
                GamesClientStatusCodes.SIGN_IN_REQUIRED,
                GamesClientStatusCodes.AUTH_ERROR_API_ACCESS_DENIED -> "NOT_SIGNED_IN"
                GamesClientStatusCodes.ACHIEVEMENT_UNLOCKED -> "ALREADY_UNLOCKED"
                else -> "SERVER_ERROR_${e.statusCode}"
            }
        }
        return "SERVER_ERROR"
    }

    companion object {
        private const val TAG = "PlayGamesV2Plugin"
    }
}
