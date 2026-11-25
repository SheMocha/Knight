#!/usr/bin/env python3
"""
Generates 30 unique, crisp 512x512 RGBA PNG achievement icons for
"The Black Knight: Orta Çağ Altın Avı" and packages the official
Google Play Console Achievements bulk-import ZIP archive.
Uses only Python 3 standard library (math, struct, zlib, csv, json, zipfile).
"""

import csv
import json
import math
import os
import struct
import zlib
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(ROOT, "public", "achievements", "icons")
CONSOLE_DIR = os.path.join(ROOT, "google-play-console")
ZIP_PATH = os.path.join(CONSOLE_DIR, "achievements-import.zip")

os.makedirs(ICONS_DIR, exist_ok=True)
os.makedirs(CONSOLE_DIR, exist_ok=True)

ACHIEVEMENTS = [
    # BÖLÜM BAŞARIMLARI (8)
    {
        "key": "ach_level_1", "order": 1, "category": "level",
        "name_tr": "İlk Adım", "desc_tr": "İlk bölümü tamamla.",
        "name_en": "First Step", "desc_en": "Complete the first level.",
        "incremental": False, "steps": 0, "points": 10,
        "emblem": "boot", "tier": "bronze", "num": "1"
    },
    {
        "key": "ach_level_5", "order": 2, "category": "level",
        "name_tr": "Köyün Kahramanı", "desc_tr": "5 bölüm tamamla.",
        "name_en": "Village Hero", "desc_en": "Complete 5 levels.",
        "incremental": True, "steps": 5, "points": 20,
        "emblem": "shield", "tier": "bronze", "num": "5"
    },
    {
        "key": "ach_level_10", "order": 3, "category": "level",
        "name_tr": "Tecrübeli Şövalye", "desc_tr": "10 bölüm tamamla.",
        "name_en": "Seasoned Knight", "desc_en": "Complete 10 levels.",
        "incremental": True, "steps": 10, "points": 25,
        "emblem": "helm", "tier": "silver", "num": "10"
    },
    {
        "key": "ach_level_20", "order": 4, "category": "level",
        "name_tr": "Orta Çağ Efsanesi", "desc_tr": "20 bölüm tamamla.",
        "name_en": "Medieval Legend", "desc_en": "Complete 20 levels.",
        "incremental": True, "steps": 20, "points": 30,
        "emblem": "banner", "tier": "silver", "num": "20"
    },
    {
        "key": "ach_level_30", "order": 5, "category": "level",
        "name_tr": "Krallığın Koruyucusu", "desc_tr": "30 bölüm tamamla.",
        "name_en": "Kingdom Protector", "desc_en": "Complete 30 levels.",
        "incremental": True, "steps": 30, "points": 35,
        "emblem": "tower", "tier": "gold", "num": "30"
    },
    {
        "key": "ach_level_40", "order": 6, "category": "level",
        "name_tr": "Efsanevi Savaşçı", "desc_tr": "40 bölüm tamamla.",
        "name_en": "Legendary Warrior", "desc_en": "Complete 40 levels.",
        "incremental": True, "steps": 40, "points": 40,
        "emblem": "crossed_swords", "tier": "gold", "num": "40"
    },
    {
        "key": "ach_level_50", "order": 7, "category": "level",
        "name_tr": "Karanlığın Fatihi", "desc_tr": "50 bölüm tamamla.",
        "name_en": "Conqueror of Darkness", "desc_en": "Complete 50 levels.",
        "incremental": True, "steps": 50, "points": 45,
        "emblem": "moon_blade", "tier": "mythic", "num": "50"
    },
    {
        "key": "ach_level_60", "order": 8, "category": "level",
        "name_tr": "Krallığın Kurtarıcısı", "desc_tr": "60 bölümün tamamını bitir.",
        "name_en": "Savior of the Realm", "desc_en": "Complete all 60 levels.",
        "incremental": True, "steps": 60, "points": 50,
        "emblem": "crown", "tier": "mythic", "num": "60"
    },

    # SAVAŞ BAŞARIMLARI (7)
    {
        "key": "ach_enemy_1", "order": 9, "category": "combat",
        "name_tr": "İlk Kan", "desc_tr": "İlk düşmanı etkisiz hale getir.",
        "name_en": "First Blood", "desc_en": "Defeat your first enemy.",
        "incremental": False, "steps": 0, "points": 10,
        "emblem": "sword", "tier": "bronze", "num": "1"
    },
    {
        "key": "ach_enemy_100", "order": 10, "category": "combat",
        "name_tr": "Yüzlük Kulüp", "desc_tr": "100 düşmanı etkisiz hale getir.",
        "name_en": "Century Club", "desc_en": "Defeat 100 enemies.",
        "incremental": True, "steps": 100, "points": 25,
        "emblem": "axe", "tier": "silver", "num": "100"
    },
    {
        "key": "ach_enemy_1000", "order": 11, "category": "combat",
        "name_tr": "Bin Savaş", "desc_tr": "1.000 düşmanı etkisiz hale getir.",
        "name_en": "Thousand Battles", "desc_en": "Defeat 1,000 enemies.",
        "incremental": True, "steps": 1000, "points": 45,
        "emblem": "mace", "tier": "gold", "num": "1K"
    },
    {
        "key": "ach_enemy_5000", "order": 12, "category": "combat",
        "name_tr": "Durdurulamaz", "desc_tr": "5.000 düşmanı etkisiz hale getir.",
        "name_en": "Unstoppable", "desc_en": "Defeat 5,000 enemies.",
        "incremental": True, "steps": 5000, "points": 50,
        "emblem": "flame_sword", "tier": "mythic", "num": "5K"
    },
    {
        "key": "ach_combo_10", "order": 13, "category": "combat",
        "name_tr": "Kombo Ustası", "desc_tr": "Arka arkaya x10 kombo yap.",
        "name_en": "Combo Master", "desc_en": "Reach a x10 combo streak.",
        "incremental": False, "steps": 0, "points": 25,
        "emblem": "lightning", "tier": "silver", "num": "x10"
    },
    {
        "key": "ach_combo_25", "order": 14, "category": "combat",
        "name_tr": "Kombo Efsanesi", "desc_tr": "Arka arkaya x25 kombo yap.",
        "name_en": "Combo Legend", "desc_en": "Reach a x25 combo streak.",
        "incremental": False, "steps": 0, "points": 45,
        "emblem": "double_lightning", "tier": "mythic", "num": "x25"
    },
    {
        "key": "ach_accuracy_master", "order": 15, "category": "combat",
        "name_tr": "Kusursuz Zamanlama", "desc_tr": "Bir bölümü en az 10 vuruş ve %90 üzeri isabetle tamamla.",
        "name_en": "Flawless Timing", "desc_en": "Complete a level with at least 10 swings and 90%+ accuracy.",
        "incremental": False, "steps": 0, "points": 30,
        "emblem": "bullseye", "tier": "gold", "num": "90%"
    },

    # EKONOMİ BAŞARIMLARI (5)
    {
        "key": "ach_gold_1", "order": 16, "category": "economy",
        "name_tr": "İlk Altın", "desc_tr": "İlk altınını kazan.",
        "name_en": "First Gold", "desc_en": "Earn your first gold coin.",
        "incremental": False, "steps": 0, "points": 10,
        "emblem": "coin", "tier": "bronze", "num": "1"
    },
    {
        "key": "ach_gold_100", "order": 17, "category": "economy",
        "name_tr": "Küçük Servet", "desc_tr": "Toplam 100 altın kazan.",
        "name_en": "Small Fortune", "desc_en": "Earn 100 total gold.",
        "incremental": True, "steps": 100, "points": 20,
        "emblem": "coin_stack", "tier": "bronze", "num": "100"
    },
    {
        "key": "ach_gold_1000", "order": 18, "category": "economy",
        "name_tr": "Altın Avcısı", "desc_tr": "Toplam 1.000 altın kazan.",
        "name_en": "Gold Hunter", "desc_en": "Earn 1,000 total gold.",
        "incremental": True, "steps": 1000, "points": 35,
        "emblem": "gold_bag", "tier": "gold", "num": "1K"
    },
    {
        "key": "ach_gold_10000", "order": 19, "category": "economy",
        "name_tr": "Kralın Hazinesi", "desc_tr": "Toplam 10.000 altın kazan.",
        "name_en": "King's Treasury", "desc_en": "Earn 10,000 total gold.",
        "incremental": True, "steps": 10000, "points": 50,
        "emblem": "chest", "tier": "mythic", "num": "10K"
    },
    {
        "key": "ach_breakable_100", "order": 20, "category": "economy",
        "name_tr": "Kırıcı", "desc_tr": "100 kırılabilir çevre nesnesi parçala.",
        "name_en": "Wrecker", "desc_en": "Smash 100 breakable environment objects.",
        "incremental": True, "steps": 100, "points": 30,
        "emblem": "barrel", "tier": "silver", "num": "100"
    },

    # ÖZEL BAŞARIMLAR (10)
    {
        "key": "ach_tnt_master", "order": 21, "category": "special",
        "name_tr": "Patlama Ustası", "desc_tr": "TNT sandığıyla aynı anda birden fazla hedefi parçala.",
        "name_en": "Blast Master", "desc_en": "Destroy multiple targets with a single TNT crate.",
        "incremental": False, "steps": 0, "points": 25,
        "emblem": "bomb", "tier": "gold", "num": "TNT"
    },
    {
        "key": "ach_special_rewards_50", "order": 22, "category": "special",
        "name_tr": "Hazine Avcısı", "desc_tr": "50 özel ödül, bonus veya ganimet kesesi kazan.",
        "name_en": "Treasure Hunter", "desc_en": "Collect 50 special rewards, bonuses, or loot bags.",
        "incremental": True, "steps": 50, "points": 35,
        "emblem": "gem", "tier": "gold", "num": "50"
    },
    {
        "key": "ach_boss_1", "order": 23, "category": "special",
        "name_tr": "Boss Avcısı", "desc_tr": "İlk bölüm sonu boss'unu yen.",
        "name_en": "Boss Hunter", "desc_en": "Defeat your first boss.",
        "incremental": False, "steps": 0, "points": 30,
        "emblem": "skull", "tier": "silver", "num": "1"
    },
    {
        "key": "ach_boss_6", "order": 24, "category": "special",
        "name_tr": "Boss Efsanesi", "desc_tr": "6 özel boss'un tamamını yen.",
        "name_en": "Boss Legend", "desc_en": "Defeat all 6 bosses.",
        "incremental": True, "steps": 6, "points": 50,
        "emblem": "dragon_skull", "tier": "mythic", "num": "6/6"
    },
    {
        "key": "ach_flawless_victory", "order": 25, "category": "special",
        "name_tr": "Kusursuz Zafer", "desc_tr": "Hiç ıska, lanet veya hasar yaşamadan bir bölümü tamamla.",
        "name_en": "Flawless Victory", "desc_en": "Finish a level without a single miss, curse, or hit taken.",
        "incremental": False, "steps": 0, "points": 35,
        "emblem": "star_shield", "tier": "gold", "num": "★"
    },
    {
        "key": "ach_princess_guard", "order": 26, "category": "special",
        "name_tr": "Prensesin Koruyucusu", "desc_tr": "Prensesin çıktığı bir bölümü ona vurmadan tamamla.",
        "name_en": "Princess's Guardian", "desc_en": "Complete a level featuring the Princess without harming her.",
        "incremental": False, "steps": 0, "points": 25,
        "emblem": "tiara", "tier": "silver", "num": "♥"
    },
    {
        "key": "ach_royal_guard", "order": 27, "category": "special",
        "name_tr": "Kraliyet Muhafızı", "desc_tr": "Kralın çıktığı bir bölümü ona vurmadan tamamla.",
        "name_en": "Royal Guard", "desc_en": "Complete a level featuring the King without harming him.",
        "incremental": False, "steps": 0, "points": 25,
        "emblem": "royal_crown", "tier": "gold", "num": "♔"
    },
    {
        "key": "ach_patient_knight", "order": 28, "category": "special",
        "name_tr": "Sabırlı Şövalye", "desc_tr": "15 saniye boyunca kombo kaybetmeden hedefleri vur.",
        "name_en": "Patient Knight", "desc_en": "Keep an active combo alive for 15 straight seconds.",
        "incremental": False, "steps": 0, "points": 30,
        "emblem": "hourglass", "tier": "silver", "num": "15s"
    },
    {
        "key": "ach_big_hunt", "order": 29, "category": "special",
        "name_tr": "Büyük Av", "desc_tr": "Tek bölümde 10.000 veya üzeri skor topla.",
        "name_en": "The Big Hunt", "desc_en": "Score 10,000 or more points in a single level.",
        "incremental": False, "steps": 0, "points": 35,
        "emblem": "trophy", "tier": "gold", "num": "10K"
    },
    {
        "key": "ach_true_legend", "order": 30, "category": "special",
        "name_tr": "Gerçek Efsane", "desc_tr": "60. bölümü tamamlayarak Kızıl Ejderha'yı yen ve oyunu bitir.",
        "name_en": "True Legend", "desc_en": "Defeat the Crimson Dragon on Level 60 and finish the game.",
        "incremental": False, "steps": 0, "points": 80,
        "emblem": "dragon", "tier": "mythic", "num": "60"
    },
]

assert sum(a["points"] for a in ACHIEVEMENTS) == 1000, f"Total XP should be 1000, got {sum(a['points'] for a in ACHIEVEMENTS)}"

# Category & tier palettes (R, G, B)
CAT_BG = {
    "level":   ((22, 34, 62), (10, 14, 28), (56, 189, 248)),
    "combat":  ((66, 18, 28), (24, 8, 14),  (251, 113, 133)),
    "economy": ((64, 44, 12), (24, 16, 6),  (250, 204, 21)),
    "special": ((48, 20, 68), (18, 8, 28),  (192, 132, 252)),
}

TIER_RIM = {
    "bronze": ((217, 140, 74), (132, 72, 32)),
    "silver": ((226, 232, 240), (100, 116, 139)),
    "gold":   ((254, 224, 112), (186, 120, 18)),
    "mythic": ((254, 240, 138), (225, 29, 72)),
}


def clamp(v, lo=0.0, hi=1.0):
    return lo if v < lo else (hi if v > hi else v)


def smoothstep(e0, e1, x):
    t = clamp((x - e0) / (e1 - e0))
    return t * t * (3.0 - 2.0 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def sd_circle(px, py, cx, cy, r):
    return math.hypot(px - cx, py - cy) - r


def sd_box(px, py, cx, cy, hw, hh):
    dx = abs(px - cx) - hw
    dy = abs(py - cy) - hh
    return math.hypot(max(dx, 0.0), max(dy, 0.0)) + min(max(dx, dy), 0.0)


def sd_segment(px, py, ax, ay, bx, by, r):
    pax, pay = px - ax, py - ay
    bax, bay = bx - ax, by - ay
    denom = bax * bax + bay * bay
    h = clamp((pax * bax + pay * bay) / denom) if denom > 1e-9 else 0.0
    return math.hypot(pax - bax * h, pay - bay * h) - r


def sd_triangle(px, py, ax, ay, bx, by, cx, cy):
    # Signed distance to triangle (approximate via segments + winding)
    d0 = sd_segment(px, py, ax, ay, bx, by, 0.0)
    d1 = sd_segment(px, py, bx, by, cx, cy, 0.0)
    d2 = sd_segment(px, py, cx, cy, ax, ay, 0.0)
    d = min(d0, d1, d2)
    def sign(x1, y1, x2, y2, x3, y3):
        return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3)
    b1 = sign(px, py, ax, ay, bx, by) < 0.0
    b2 = sign(px, py, bx, by, cx, cy) < 0.0
    b3 = sign(px, py, cx, cy, ax, ay) < 0.0
    inside = (b1 == b2) and (b2 == b3)
    return -d if inside else d


def sd_shield(px, py, scale=1.0):
    x = px / scale
    y = py / scale
    top = -0.34 - y
    sides = abs(x) - (0.31 - max(0.0, y + 0.05) * 0.42)
    bottom = (y - 0.14) + abs(x) * 0.85 - 0.27
    return max(top, sides, bottom) * scale


def emblem_sdf(emblem, x, y):
    """Returns signed distance (<0 inside) for each unique medieval emblem in normalized [-1, 1] coords."""
    if emblem in ("sword", "flame_sword"):
        blade = min(
            sd_segment(x, y, -0.28, 0.28, 0.30, -0.30, 0.055),
            sd_triangle(x, y, 0.24, -0.34, 0.38, -0.38, 0.34, -0.24),
        )
        guard = sd_segment(x, y, -0.24, 0.04, -0.04, 0.24, 0.04)
        hilt = sd_segment(x, y, -0.14, 0.14, -0.32, 0.32, 0.036)
        pommel = sd_circle(x, y, -0.35, 0.35, 0.06)
        d = min(blade, guard, hilt, pommel)
        if emblem == "flame_sword":
            aura = min(
                sd_circle(x, y, 0.04, -0.18, 0.12),
                sd_circle(x, y, 0.18, -0.02, 0.10),
                sd_circle(x, y, -0.10, -0.06, 0.09),
            )
            d = min(d, aura)
        return d

    if emblem == "crossed_swords":
        s1 = min(
            sd_segment(x, y, -0.30, 0.30, 0.30, -0.30, 0.045),
            sd_segment(x, y, -0.26, 0.10, -0.10, 0.26, 0.035),
        )
        s2 = min(
            sd_segment(x, y, 0.30, 0.30, -0.30, -0.30, 0.045),
            sd_segment(x, y, 0.26, 0.10, 0.10, 0.26, 0.035),
        )
        return min(s1, s2)

    if emblem in ("shield", "star_shield"):
        d = sd_shield(x, y, 1.05)
        if emblem == "star_shield":
            # Carve glowing star look by adding raised star rim
            r = math.hypot(x, y + 0.02)
            ang = math.atan2(y + 0.02, x)
            star_r = 0.17 + 0.07 * math.cos(5 * (ang + math.pi / 2))
            star = r - star_r
            return min(d, star)
        return d

    if emblem == "boot":
        leg = sd_box(x, y, -0.08, -0.08, 0.11, 0.22)
        foot = sd_box(x, y, 0.08, 0.18, 0.22, 0.10)
        heel = sd_circle(x, y, 0.26, 0.18, 0.09)
        cuff = sd_box(x, y, -0.08, -0.28, 0.14, 0.05)
        return min(leg, foot, heel, cuff)

    if emblem == "helm":
        dome = sd_circle(x, y, 0.0, -0.08, 0.28)
        face = sd_box(x, y, 0.0, 0.10, 0.23, 0.20)
        plume = sd_circle(x, y, 0.0, -0.34, 0.12)
        visor_cut = sd_box(x, y, 0.0, 0.02, 0.18, 0.032)
        slit_cut = sd_box(x, y, 0.0, 0.14, 0.026, 0.12)
        return max(min(dome, face, plume), -min(visor_cut, slit_cut))

    if emblem == "banner":
        pole = sd_segment(x, y, -0.24, -0.36, -0.24, 0.38, 0.03)
        bar = sd_segment(x, y, -0.26, -0.28, 0.28, -0.28, 0.028)
        cloth = sd_box(x, y, 0.02, -0.02, 0.22, 0.26)
        notch = sd_triangle(x, y, -0.10, 0.25, 0.14, 0.25, 0.02, 0.10)
        return min(pole, bar, max(cloth, -notch))

    if emblem == "tower":
        body = sd_box(x, y, 0.0, 0.08, 0.20, 0.26)
        top = sd_box(x, y, 0.0, -0.20, 0.25, 0.07)
        c1 = sd_box(x, y, -0.18, -0.30, 0.055, 0.06)
        c2 = sd_box(x, y, 0.0, -0.30, 0.055, 0.06)
        c3 = sd_box(x, y, 0.18, -0.30, 0.055, 0.06)
        gate = min(sd_box(x, y, 0.0, 0.24, 0.08, 0.10), sd_circle(x, y, 0.0, 0.14, 0.08))
        return max(min(body, top, c1, c2, c3), -gate)

    if emblem == "moon_blade":
        outer = sd_circle(x, y, -0.04, 0.0, 0.34)
        inner = sd_circle(x, y, 0.10, -0.05, 0.28)
        crescent = max(outer, -inner)
        star = sd_circle(x, y, 0.16, -0.08, 0.07)
        return min(crescent, star)

    if emblem in ("crown", "royal_crown", "tiara"):
        base = sd_box(x, y, 0.0, 0.18, 0.30, 0.08)
        p1 = sd_triangle(x, y, -0.30, 0.14, -0.34, -0.18, -0.08, 0.10)
        p2 = sd_triangle(x, y, -0.14, 0.14, 0.0, -0.28, 0.14, 0.14)
        p3 = sd_triangle(x, y, 0.08, 0.10, 0.34, -0.18, 0.30, 0.14)
        j1 = sd_circle(x, y, 0.0, -0.29, 0.055)
        j2 = sd_circle(x, y, -0.33, -0.19, 0.045)
        j3 = sd_circle(x, y, 0.33, -0.19, 0.045)
        return min(base, p1, p2, p3, j1, j2, j3)

    if emblem == "axe":
        handle = sd_segment(x, y, -0.18, 0.34, 0.18, -0.32, 0.04)
        head1 = max(sd_circle(x, y, 0.18, -0.14, 0.22), sd_box(x, y, 0.04, -0.14, 0.10, 0.25))
        head2 = max(sd_circle(x, y, -0.04, -0.22, 0.18), -sd_circle(x, y, -0.14, -0.22, 0.12))
        blade = sd_box(x, y, 0.14, -0.14, 0.19, 0.14)
        return min(handle, blade, head1, head2)

    if emblem == "mace":
        handle = sd_segment(x, y, -0.26, 0.32, 0.10, -0.08, 0.042)
        ball = sd_circle(x, y, 0.14, -0.14, 0.18)
        spikes = 999.0
        for k in range(8):
            ang = k * math.pi / 4.0
            sx = 0.14 + math.cos(ang) * 0.26
            sy = -0.14 + math.sin(ang) * 0.26
            spikes = min(spikes, sd_segment(x, y, 0.14, -0.14, sx, sy, 0.032))
        return min(handle, ball, spikes)

    if emblem in ("lightning", "double_lightning"):
        b1 = min(
            sd_segment(x, y, 0.10, -0.36, -0.14, 0.02, 0.06),
            sd_segment(x, y, -0.14, 0.02, 0.10, 0.02, 0.055),
            sd_segment(x, y, 0.10, 0.02, -0.12, 0.36, 0.06),
        )
        if emblem == "double_lightning":
            b2 = min(
                sd_segment(x, y, 0.30, -0.28, 0.10, 0.06, 0.045),
                sd_segment(x, y, 0.10, 0.06, 0.28, 0.06, 0.042),
                sd_segment(x, y, 0.28, 0.06, 0.10, 0.34, 0.045),
            )
            return min(b1, b2)
        return b1

    if emblem == "bullseye":
        r1 = abs(sd_circle(x, y, 0.0, 0.0, 0.32)) - 0.045
        r2 = abs(sd_circle(x, y, 0.0, 0.0, 0.18)) - 0.042
        c0 = sd_circle(x, y, 0.0, 0.0, 0.075)
        arrow = sd_segment(x, y, 0.04, -0.04, 0.36, -0.36, 0.028)
        return min(r1, r2, c0, arrow)

    if emblem == "coin":
        outer = sd_circle(x, y, 0.0, 0.0, 0.33)
        ring = abs(sd_circle(x, y, 0.0, 0.0, 0.24)) - 0.025
        star_bar = min(sd_box(x, y, 0.0, 0.0, 0.05, 0.15), sd_box(x, y, 0.0, 0.0, 0.12, 0.045))
        return max(outer, -ring) if abs(ring) < 0.01 else min(max(outer, -ring), star_bar)

    if emblem == "coin_stack":
        c1 = sd_box(x, y, -0.10, 0.20, 0.22, 0.06)
        c2 = sd_box(x, y, -0.06, 0.07, 0.22, 0.06)
        c3 = sd_box(x, y, -0.10, -0.06, 0.22, 0.06)
        c4 = sd_circle(x, y, 0.18, -0.14, 0.16)
        return min(c1, c2, c3, c4)

    if emblem == "gold_bag":
        body = sd_circle(x, y, 0.0, 0.10, 0.27)
        neck = sd_box(x, y, 0.0, -0.16, 0.11, 0.06)
        top = sd_triangle(x, y, -0.18, -0.32, 0.18, -0.32, 0.0, -0.10)
        return min(body, neck, top)

    if emblem == "chest":
        base = sd_box(x, y, 0.0, 0.12, 0.31, 0.18)
        lid = sd_box(x, y, 0.0, -0.14, 0.32, 0.10)
        clasp = sd_box(x, y, 0.0, -0.02, 0.065, 0.09)
        seam = sd_box(x, y, 0.0, -0.03, 0.33, 0.018)
        return min(max(min(base, lid), -seam), clasp)

    if emblem == "barrel":
        body = max(sd_box(x, y, 0.0, 0.0, 0.24, 0.31), sd_circle(x, y, 0.0, 0.0, 0.34))
        band1 = sd_box(x, y, 0.0, -0.16, 0.26, 0.035)
        band2 = sd_box(x, y, 0.0, 0.16, 0.26, 0.035)
        crack = sd_segment(x, y, -0.08, -0.12, 0.08, 0.10, 0.022)
        return max(min(body, band1, band2), -crack)

    if emblem == "bomb":
        body = sd_circle(x, y, -0.04, 0.08, 0.26)
        cap = sd_box(x, y, 0.02, -0.19, 0.08, 0.05)
        fuse = sd_segment(x, y, 0.04, -0.22, 0.22, -0.34, 0.025)
        spark = min(
            sd_circle(x, y, 0.26, -0.34, 0.075),
            sd_segment(x, y, 0.18, -0.34, 0.34, -0.34, 0.02),
            sd_segment(x, y, 0.26, -0.42, 0.26, -0.26, 0.02),
        )
        return min(body, cap, fuse, spark)

    if emblem == "gem":
        top = sd_triangle(x, y, -0.30, -0.08, 0.30, -0.08, 0.0, -0.34)
        mid = sd_box(x, y, 0.0, -0.12, 0.22, 0.06)
        bot = sd_triangle(x, y, -0.30, -0.08, 0.30, -0.08, 0.0, 0.35)
        return min(top, mid, bot)

    if emblem in ("skull", "dragon_skull"):
        cranium = sd_circle(x, y, 0.0, -0.08, 0.26)
        jaw = sd_box(x, y, 0.0, 0.18, 0.15, 0.11)
        eye_l = sd_circle(x, y, -0.10, -0.06, 0.065)
        eye_r = sd_circle(x, y, 0.10, -0.06, 0.065)
        nose = sd_triangle(x, y, -0.04, 0.08, 0.04, 0.08, 0.0, 0.01)
        d = max(min(cranium, jaw), -min(eye_l, eye_r, nose))
        if emblem == "dragon_skull":
            h1 = sd_segment(x, y, -0.20, -0.20, -0.36, -0.38, 0.048)
            h2 = sd_segment(x, y, 0.20, -0.20, 0.36, -0.38, 0.048)
            d = min(d, h1, h2)
        return d

    if emblem == "hourglass":
        top_bar = sd_box(x, y, 0.0, -0.32, 0.26, 0.045)
        bot_bar = sd_box(x, y, 0.0, 0.32, 0.26, 0.045)
        upper = sd_triangle(x, y, -0.22, -0.28, 0.22, -0.28, 0.0, 0.02)
        lower = sd_triangle(x, y, -0.22, 0.28, 0.22, 0.28, 0.0, -0.02)
        return min(top_bar, bot_bar, upper, lower)

    if emblem == "trophy":
        cup = min(sd_box(x, y, 0.0, -0.10, 0.21, 0.16), sd_circle(x, y, 0.0, -0.02, 0.21))
        stem = sd_box(x, y, 0.0, 0.18, 0.055, 0.12)
        base = sd_box(x, y, 0.0, 0.31, 0.20, 0.055)
        hl = abs(sd_circle(x, y, -0.24, -0.10, 0.09)) - 0.032
        hr = abs(sd_circle(x, y, 0.24, -0.10, 0.09)) - 0.032
        return min(cup, stem, base, hl, hr)

    if emblem == "dragon":
        # Stylized winged dragon crest
        body = sd_circle(x, y, 0.0, 0.02, 0.17)
        neck = sd_segment(x, y, 0.0, -0.06, 0.12, -0.28, 0.075)
        head = sd_triangle(x, y, 0.06, -0.34, 0.30, -0.26, 0.10, -0.18)
        wing_l = sd_triangle(x, y, -0.06, -0.04, -0.40, -0.26, -0.28, 0.18)
        wing_r = sd_triangle(x, y, 0.08, 0.00, 0.38, -0.14, 0.28, 0.22)
        tail = sd_segment(x, y, -0.02, 0.14, -0.26, 0.36, 0.045)
        return min(body, neck, head, wing_l, wing_r, tail)

    return sd_circle(x, y, 0.0, 0.0, 0.28)


def write_png_rgba(path, width, height, rgba_bytes):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)  # Filter type 0 (None)
        raw.extend(rgba_bytes[y * stride : (y + 1) * stride])
    idat = zlib.compress(bytes(raw), level=6)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", idat))
        f.write(chunk(b"IEND", b""))


def render_icon_512(ach, out_path):
    """Renders a crisp 512x512 RGBA medieval medallion PNG (renders 256x256 and upscales 2x with smooth AA)."""
    # Compute 512x512 directly with fast pure-math loop? 512x512 = 262k px * 30 = 7.8M px in Python (~8s).
    # Computing at 256x256 and bilinear-upscaling to 512x512 is 4x faster (~1.8s total) while super smooth!
    w_small = 256
    bg_top, bg_bot, accent = CAT_BG[ach["category"]]
    rim_hi, rim_lo = TIER_RIM[ach["tier"]]
    emblem = ach["emblem"]
    seed_angle = (ach["order"] * 0.6180339887) * math.tau

    small = bytearray(w_small * w_small * 4)
    inv_half = 2.0 / (w_small - 1)

    for py in range(w_small):
        ny = py * inv_half - 1.0
        row_off = py * w_small * 4
        for px in range(w_small):
            nx = px * inv_half - 1.0
            r = math.hypot(nx, ny)
            ang = math.atan2(ny, nx)

            # Rounded square badge SDF (full 512x512 fill with subtle medieval chamfered border)
            bd = sd_box(nx, ny, 0.0, 0.0, 0.86, 0.86) - 0.12

            # Background gradient + subtle radial sunburst rays
            gy = clamp((ny + 1.0) * 0.5)
            ray = 0.5 + 0.5 * math.cos(12.0 * ang + seed_angle)
            glow = math.exp(-r * r * 2.4)
            br = lerp(bg_top[0], bg_bot[0], gy) + accent[0] * (0.24 * glow + 0.07 * ray * glow)
            bg = lerp(bg_top[1], bg_bot[1], gy) + accent[1] * (0.24 * glow + 0.07 * ray * glow)
            bb = lerp(bg_top[2], bg_bot[2], gy) + accent[2] * (0.24 * glow + 0.07 * ray * glow)

            # Inner recessed dark medallion circle
            inner_d = r - 0.72
            if inner_d < 0.02:
                m_t = smoothstep(0.02, -0.02, inner_d)
                # Subtle radial vignette inside medallion
                mr = br * (0.76 + 0.38 * glow)
                mg = bg * (0.76 + 0.38 * glow)
                mb = bb * (0.76 + 0.38 * glow)
                br = lerp(br, mr, m_t)
                bg = lerp(bg, mg, m_t)
                bb = lerp(bb, mb, m_t)

            # Metallic outer circular rim & bevel
            rim_d = abs(r - 0.76) - 0.055
            if rim_d < 0.025:
                rim_a = smoothstep(0.025, -0.015, rim_d)
                # Metallic specular based on diagonal lighting
                lit = clamp(0.55 - 0.45 * (nx * 0.65 + ny * 0.76) + 0.15 * math.sin(ang * 4.0))
                rr = lerp(rim_lo[0], rim_hi[0], lit)
                rg = lerp(rim_lo[1], rim_hi[1], lit)
                rb = lerp(rim_lo[2], rim_hi[2], lit)
                br = lerp(br, rr, rim_a)
                bg = lerp(bg, rg, rim_a)
                bb = lerp(bb, rb, rim_a)

            # Outer square frame border
            frame_d = abs(bd + 0.03) - 0.035
            if frame_d < 0.02:
                fa = smoothstep(0.02, -0.012, frame_d)
                lit = clamp(0.5 - 0.5 * (nx * 0.5 + ny * 0.85))
                br = lerp(br, lerp(rim_lo[0], rim_hi[0], lit), fa)
                bg = lerp(bg, lerp(rim_lo[1], rim_hi[1], lit), fa)
                bb = lerp(bb, lerp(rim_lo[2], rim_hi[2], lit), fa)

            # 4 metallic corner rivets
            for rx_c, ry_c in ((-0.78, -0.78), (0.78, -0.78), (-0.78, 0.78), (0.78, 0.78)):
                rd = sd_circle(nx, ny, rx_c, ry_c, 0.055)
                if rd < 0.02:
                    ra = smoothstep(0.02, -0.01, rd)
                    br = lerp(br, rim_hi[0], ra)
                    bg = lerp(bg, rim_hi[1], ra)
                    bb = lerp(bb, rim_hi[2], ra)

            # Centerpiece Emblem (scaled to fit cleanly inside r < 0.62)
            ex, ey = nx * 1.18, ny * 1.18
            ed = emblem_sdf(emblem, ex, ey)

            # Soft drop shadow behind emblem
            ed_sh = emblem_sdf(emblem, ex - 0.04, ey - 0.05)
            if ed_sh < 0.09:
                sh_a = smoothstep(0.09, -0.02, ed_sh) * 0.55
                br *= (1.0 - sh_a)
                bg *= (1.0 - sh_a)
                bb *= (1.0 - sh_a)

            # Glowing accent halo around emblem
            if ed < 0.12 and ed > -0.02:
                ha = smoothstep(0.12, 0.0, ed) * 0.45
                br = lerp(br, accent[0], ha)
                bg = lerp(bg, accent[1], ha)
                bb = lerp(bb, accent[2], ha)

            # Crisp metallic / golden emblem fill + dark outline
            if ed < 0.04:
                out_a = smoothstep(0.04, 0.015, ed)
                br = lerp(br, 18.0, out_a * 0.92)
                bg = lerp(bg, 14.0, out_a * 0.92)
                bb = lerp(bb, 24.0, out_a * 0.92)
            if ed < 0.01:
                fill_a = smoothstep(0.01, -0.018, ed)
                bevel = clamp(0.65 - 0.55 * (ex * 0.6 + ey * 0.8) + clamp(-ed * 3.0) * 0.25)
                er = lerp(rim_lo[0] * 0.6 + accent[0] * 0.4, min(255.0, rim_hi[0] * 1.05), bevel)
                eg = lerp(rim_lo[1] * 0.6 + accent[1] * 0.4, min(255.0, rim_hi[1] * 1.05), bevel)
                eb = lerp(rim_lo[2] * 0.6 + accent[2] * 0.4, min(255.0, rim_hi[2] * 1.05), bevel)
                br = lerp(br, er, fill_a)
                bg = lerp(bg, eg, fill_a)
                bb = lerp(bb, eb, fill_a)

            # Mask outside rounded icon corners to transparent
            alpha = smoothstep(0.02, -0.015, bd)
            idx = row_off + px * 4
            small[idx] = int(clamp(br / 255.0) * 255)
            small[idx + 1] = int(clamp(bg / 255.0) * 255)
            small[idx + 2] = int(clamp(bb / 255.0) * 255)
            small[idx + 3] = int(alpha * 255)

    # Bilinear 2x upscale to 512x512 RGBA
    w = 512
    full = bytearray(w * w * 4)
    for y in range(w):
        sy = min(w_small - 1.001, y * 0.5)
        y0 = int(sy)
        y1 = min(w_small - 1, y0 + 1)
        fy = sy - y0
        r0 = y0 * w_small * 4
        r1 = y1 * w_small * 4
        out_row = y * w * 4
        for x in range(w):
            sx = min(w_small - 1.001, x * 0.5)
            x0 = int(sx)
            x1 = min(w_small - 1, x0 + 1)
            fx = sx - x0
            i00 = r0 + x0 * 4
            i10 = r0 + x1 * 4
            i01 = r1 + x0 * 4
            i11 = r1 + x1 * 4
            oi = out_row + x * 4
            for c in range(4):
                top_v = small[i00 + c] * (1.0 - fx) + small[i10 + c] * fx
                bot_v = small[i01 + c] * (1.0 - fx) + small[i11 + c] * fx
                full[oi + c] = int(top_v * (1.0 - fy) + bot_v * fy)

    write_png_rgba(out_path, w, w, full)


def main():
    icon_paths = []
    for idx, ach in enumerate(ACHIEVEMENTS, start=1):
        fname = f"ach_{idx:02d}_{ach['key']}.png"
        out_path = os.path.join(ICONS_DIR, fname)
        render_icon_512(ach, out_path)
        icon_paths.append((fname, out_path, ach))
        print(f"Generated 512x512 PNG: {fname}")

    # 1. Official Google Play Console AchievementsMetadata.csv
    # Official columns: Name,Description,Incremental,Steps Needed,Initial State,Points,List Order
    meta_csv_path = os.path.join(CONSOLE_DIR, "AchievementsMetadata.csv")
    with open(meta_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        for ach in ACHIEVEMENTS:
            writer.writerow([
                ach["name_tr"],
                ach["desc_tr"],
                "TRUE" if ach["incremental"] else "FALSE",
                str(ach["steps"]) if ach["incremental"] else "",
                "Revealed",
                str(ach["points"]),
                str(ach["order"]),
            ])

    # 2. Official Google Play Console AchievementsLocalizations.csv
    # Columns: Name,Localized Name,Localized Description,Locale
    loc_csv_path = os.path.join(CONSOLE_DIR, "AchievementsLocalizations.csv")
    with open(loc_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        for ach in ACHIEVEMENTS:
            writer.writerow([ach["name_tr"], ach["name_tr"], ach["desc_tr"], "tr-TR"])
            writer.writerow([ach["name_tr"], ach["name_en"], ach["desc_en"], "en-US"])

    # 3. Structured manifest JSON for reference & verification
    manifest = {
        "schemaVersion": "google-play-games-v2-achievements-1.0",
        "applicationId": "com.blackknight.medievalgoldhunt",
        "totalAchievements": len(ACHIEVEMENTS),
        "totalXpPoints": sum(a["points"] for a in ACHIEVEMENTS),
        "consoleProjectIdPlaceholder": "REPLACE_WITH_GOOGLE_PLAY_GAMES_PROJECT_ID",
        "achievements": [
            {
                "order": a["order"],
                "key": a["key"],
                "category": a["category"],
                "type": "INCREMENTAL" if a["incremental"] else "STANDARD",
                "targetSteps": a["steps"] if a["incremental"] else 1,
                "points": a["points"],
                "name_tr": a["name_tr"],
                "description_tr": a["desc_tr"],
                "name_en": a["name_en"],
                "description_en": a["desc_en"],
                "iconFile": f"ach_{a['order']:02d}_{a['key']}.png",
                "androidStringResource": f"achievement_{a['key']}",
                "googlePlayAchievementId": f"REPLACE_WITH_PLAY_CONSOLE_ID_{a['key'].upper()}",
            }
            for a in ACHIEVEMENTS
        ],
    }
    manifest_path = os.path.join(CONSOLE_DIR, "achievements-manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    # 4. Official Google Play Console bulk import ZIP
    # Play Console expects AchievementsMetadata.csv + AchievementsLocalizations.csv + AchievementsIconsMapping.csv (optional) + PNG icons at root
    icons_mapping_csv_path = os.path.join(CONSOLE_DIR, "AchievementsIconsMapping.csv")
    with open(icons_mapping_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        for fname, _, ach in icon_paths:
            writer.writerow([ach["name_tr"], fname])

    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(meta_csv_path, "AchievementsMetadata.csv")
        zf.write(loc_csv_path, "AchievementsLocalizations.csv")
        zf.write(icons_mapping_csv_path, "AchievementsIconsMapping.csv")
        for fname, full_path, _ in icon_paths:
            zf.write(full_path, fname)

    print(f"Created Google Play Console ZIP: {ZIP_PATH} ({os.path.getsize(ZIP_PATH)} bytes)")


if __name__ == "__main__":
    main()
