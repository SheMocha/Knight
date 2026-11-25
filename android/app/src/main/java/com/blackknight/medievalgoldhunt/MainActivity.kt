package com.blackknight.medievalgoldhunt

import android.os.Bundle
import com.getcapacitor.BridgeActivity

/**
 * Capacitor ana Activity sınıfı.
 * Resmi Google Play Games Services v2 (PlayGamesV2Plugin) ve
 * Google Mobile Ads / UMP (AdMobNativePlugin) native eklentilerini kaydeder.
 */
class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(PlayGamesV2Plugin::class.java)
        registerPlugin(AdMobNativePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
