# Capacitor Native Plugin sınıflarını koru (Play Games Services v2 & AdMob Native)
-keep class com.blackknight.medievalgoldhunt.PlayGamesV2Plugin { *; }
-keep class com.blackknight.medievalgoldhunt.AdMobNativePlugin { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
}

# Google Mobile Ads SDK & UMP SDK
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.mediation.** { *; }
-keep class com.google.android.ump.** { *; }

# Google Play Games Services v2
-keep class com.google.android.gms.games.** { *; }
