package com.blackknight.medievalgoldhunt

import android.app.Application
import android.util.Log
import com.google.android.gms.games.PlayGamesSdk

/**
 * Resmi Google Play Games Services v2 SDK başlatıcısı.
 * Google dokümantasyonuna göre PlayGamesSdk.initialize(this) çağrısı
 * Application.onCreate() içinde yapılmalıdır.
 */
class BlackKnightApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        try {
            val projectId = getString(R.string.game_services_project_id).trim()
            if (projectId.isNotEmpty() && !projectId.startsWith("REPLACE_WITH_")) {
                PlayGamesSdk.initialize(this)
            } else {
                Log.w(
                    TAG,
                    "PlayGamesSdk başlatılmadı: res/values/games-ids.xml içindeki game_services_project_id henüz gerçek Google Play Console Project ID ile değiştirilmemiş."
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "PlayGamesSdk.initialize sırasında beklenmeyen hata (oyun çökmeden devam eder)", e)
        }
    }

    companion object {
        private const val TAG = "BlackKnightApp"
    }
}
