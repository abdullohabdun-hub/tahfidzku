
/* ==========================================================================
 * UI — Form Input Setoran (Ziyadah / Sabqi / Manzil)
 * Demo interaktif memakai data & fungsi quranMapper di atas.
 * ========================================================================== */

import React, { useState, useMemo } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Settings2,
  RotateCcw,
  Sparkles,
  BookOpen,
} from "lucide-react";


/* ============================= quranMapper (inline) ============================= */
// quranMapper.js
// Sumber data: Mushaf Madinah (Mujamma\' Malik Fahd, 15 baris/halaman) - 604 halaman
// Diverifikasi terhadap mushaf fisik Madrasah Safinatun Najah pada titik:
// Juz 15 (halaman 282-301), Juz 21 (awal halaman 402), Juz 30 (halaman 582-604)
//
// PENTING - Catatan Arsitektur:
// Distribusi halaman per-juz TIDAK seragam 20 halaman/juz. Rumus matematis sederhana
// (juz-1)*20+2 SALAH untuk Juz 1 (21h), Juz 4 (19h), Juz 25 (21h), Juz 26 (19h), Juz 30 (23h).
// Karena itu file ini menyimpan TABEL EKSPLISIT dari data riil, bukan rumus.

const JUZ_TABLE = [
  {
    "juz": 1,
    "halamanAwal": 1,
    "halamanAkhir": 21
  },
  {
    "juz": 2,
    "halamanAwal": 22,
    "halamanAkhir": 41
  },
  {
    "juz": 3,
    "halamanAwal": 42,
    "halamanAkhir": 62
  },
  {
    "juz": 4,
    "halamanAwal": 63,
    "halamanAkhir": 81
  },
  {
    "juz": 5,
    "halamanAwal": 82,
    "halamanAkhir": 101
  },
  {
    "juz": 6,
    "halamanAwal": 102,
    "halamanAkhir": 121
  },
  {
    "juz": 7,
    "halamanAwal": 122,
    "halamanAkhir": 141
  },
  {
    "juz": 8,
    "halamanAwal": 142,
    "halamanAkhir": 161
  },
  {
    "juz": 9,
    "halamanAwal": 162,
    "halamanAkhir": 181
  },
  {
    "juz": 10,
    "halamanAwal": 182,
    "halamanAkhir": 201
  },
  {
    "juz": 11,
    "halamanAwal": 202,
    "halamanAkhir": 221
  },
  {
    "juz": 12,
    "halamanAwal": 222,
    "halamanAkhir": 241
  },
  {
    "juz": 13,
    "halamanAwal": 242,
    "halamanAkhir": 261
  },
  {
    "juz": 14,
    "halamanAwal": 262,
    "halamanAkhir": 281
  },
  {
    "juz": 15,
    "halamanAwal": 282,
    "halamanAkhir": 301
  },
  {
    "juz": 16,
    "halamanAwal": 302,
    "halamanAkhir": 321
  },
  {
    "juz": 17,
    "halamanAwal": 322,
    "halamanAkhir": 341
  },
  {
    "juz": 18,
    "halamanAwal": 342,
    "halamanAkhir": 361
  },
  {
    "juz": 19,
    "halamanAwal": 362,
    "halamanAkhir": 381
  },
  {
    "juz": 20,
    "halamanAwal": 382,
    "halamanAkhir": 401
  },
  {
    "juz": 21,
    "halamanAwal": 402,
    "halamanAkhir": 421
  },
  {
    "juz": 22,
    "halamanAwal": 422,
    "halamanAkhir": 441
  },
  {
    "juz": 23,
    "halamanAwal": 442,
    "halamanAkhir": 461
  },
  {
    "juz": 24,
    "halamanAwal": 462,
    "halamanAkhir": 481
  },
  {
    "juz": 25,
    "halamanAwal": 482,
    "halamanAkhir": 502
  },
  {
    "juz": 26,
    "halamanAwal": 503,
    "halamanAkhir": 521
  },
  {
    "juz": 27,
    "halamanAwal": 522,
    "halamanAkhir": 541
  },
  {
    "juz": 28,
    "halamanAwal": 542,
    "halamanAkhir": 561
  },
  {
    "juz": 29,
    "halamanAwal": 562,
    "halamanAkhir": 581
  },
  {
    "juz": 30,
    "halamanAwal": 582,
    "halamanAkhir": 604
  }
];

// Daftar 114 surah dengan total ayat masing-masing (untuk keperluan label & validasi)
const SURAH_LIST = [
  {
    "nomor": 1,
    "nama": "Al-Fatiha",
    "totalAyat": 7
  },
  {
    "nomor": 2,
    "nama": "Al-Baqara",
    "totalAyat": 286
  },
  {
    "nomor": 3,
    "nama": "Aal-Imran",
    "totalAyat": 200
  },
  {
    "nomor": 4,
    "nama": "An-Nisaa'",
    "totalAyat": 176
  },
  {
    "nomor": 5,
    "nama": "Al-Ma'ida",
    "totalAyat": 120
  },
  {
    "nomor": 6,
    "nama": "Al-An'am",
    "totalAyat": 165
  },
  {
    "nomor": 7,
    "nama": "Al-A'raf",
    "totalAyat": 206
  },
  {
    "nomor": 8,
    "nama": "Al-Anfal",
    "totalAyat": 75
  },
  {
    "nomor": 9,
    "nama": "Al-Tawba",
    "totalAyat": 129
  },
  {
    "nomor": 10,
    "nama": "Yunus",
    "totalAyat": 109
  },
  {
    "nomor": 11,
    "nama": "Hud",
    "totalAyat": 123
  },
  {
    "nomor": 12,
    "nama": "Yusuf",
    "totalAyat": 111
  },
  {
    "nomor": 13,
    "nama": "Ar-Ra'd",
    "totalAyat": 43
  },
  {
    "nomor": 14,
    "nama": "Ibrahim",
    "totalAyat": 52
  },
  {
    "nomor": 15,
    "nama": "Al-Hijr",
    "totalAyat": 99
  },
  {
    "nomor": 16,
    "nama": "An-Nahl",
    "totalAyat": 128
  },
  {
    "nomor": 17,
    "nama": "Al-Israa",
    "totalAyat": 111
  },
  {
    "nomor": 18,
    "nama": "Al-Kahf",
    "totalAyat": 110
  },
  {
    "nomor": 19,
    "nama": "Maryam",
    "totalAyat": 98
  },
  {
    "nomor": 20,
    "nama": "Ta-Ha",
    "totalAyat": 135
  },
  {
    "nomor": 21,
    "nama": "Al-Anbiya",
    "totalAyat": 112
  },
  {
    "nomor": 22,
    "nama": "Al-Hajj",
    "totalAyat": 78
  },
  {
    "nomor": 23,
    "nama": "Al-Muminun",
    "totalAyat": 118
  },
  {
    "nomor": 24,
    "nama": "An-Nur",
    "totalAyat": 64
  },
  {
    "nomor": 25,
    "nama": "Al-Furqan",
    "totalAyat": 77
  },
  {
    "nomor": 26,
    "nama": "Ash-Shuara",
    "totalAyat": 227
  },
  {
    "nomor": 27,
    "nama": "An-Naml",
    "totalAyat": 93
  },
  {
    "nomor": 28,
    "nama": "Al-Qasas",
    "totalAyat": 88
  },
  {
    "nomor": 29,
    "nama": "Al-Ankabut",
    "totalAyat": 69
  },
  {
    "nomor": 30,
    "nama": "Ar-Rum",
    "totalAyat": 60
  },
  {
    "nomor": 31,
    "nama": "Luqman",
    "totalAyat": 34
  },
  {
    "nomor": 32,
    "nama": "As-Sajdah",
    "totalAyat": 30
  },
  {
    "nomor": 33,
    "nama": "Al-Ahzab",
    "totalAyat": 73
  },
  {
    "nomor": 34,
    "nama": "Saba",
    "totalAyat": 54
  },
  {
    "nomor": 35,
    "nama": "Fatir",
    "totalAyat": 45
  },
  {
    "nomor": 36,
    "nama": "Yasin",
    "totalAyat": 83
  },
  {
    "nomor": 37,
    "nama": "As-Saffat",
    "totalAyat": 182
  },
  {
    "nomor": 38,
    "nama": "Sad",
    "totalAyat": 88
  },
  {
    "nomor": 39,
    "nama": "Az-Zumar",
    "totalAyat": 75
  },
  {
    "nomor": 40,
    "nama": "Ghafir",
    "totalAyat": 85
  },
  {
    "nomor": 41,
    "nama": "Fussilat",
    "totalAyat": 54
  },
  {
    "nomor": 42,
    "nama": "Ash-Shura",
    "totalAyat": 53
  },
  {
    "nomor": 43,
    "nama": "Az-Zukhruf",
    "totalAyat": 89
  },
  {
    "nomor": 44,
    "nama": "Ad-Dukhan",
    "totalAyat": 59
  },
  {
    "nomor": 45,
    "nama": "Al-Jathiya",
    "totalAyat": 37
  },
  {
    "nomor": 46,
    "nama": "Al-Ahqaf",
    "totalAyat": 35
  },
  {
    "nomor": 47,
    "nama": "Muhammad",
    "totalAyat": 38
  },
  {
    "nomor": 48,
    "nama": "Al-Fath",
    "totalAyat": 29
  },
  {
    "nomor": 49,
    "nama": "Al-Hujurat",
    "totalAyat": 18
  },
  {
    "nomor": 50,
    "nama": "Qaf",
    "totalAyat": 45
  },
  {
    "nomor": 51,
    "nama": "Az-Zariyat",
    "totalAyat": 60
  },
  {
    "nomor": 52,
    "nama": "At-Tur",
    "totalAyat": 49
  },
  {
    "nomor": 53,
    "nama": "An-Najm",
    "totalAyat": 62
  },
  {
    "nomor": 54,
    "nama": "Al-Qamar",
    "totalAyat": 55
  },
  {
    "nomor": 55,
    "nama": "Ar-Rahman",
    "totalAyat": 78
  },
  {
    "nomor": 56,
    "nama": "Al-Waqia",
    "totalAyat": 96
  },
  {
    "nomor": 57,
    "nama": "Al-Hadid",
    "totalAyat": 29
  },
  {
    "nomor": 58,
    "nama": "Al-Mujadilah",
    "totalAyat": 22
  },
  {
    "nomor": 59,
    "nama": "Al-Hashr",
    "totalAyat": 24
  },
  {
    "nomor": 60,
    "nama": "Al-Mumtahinah",
    "totalAyat": 13
  },
  {
    "nomor": 61,
    "nama": "As-Saff",
    "totalAyat": 14
  },
  {
    "nomor": 62,
    "nama": "Al-Jumu'ah",
    "totalAyat": 11
  },
  {
    "nomor": 63,
    "nama": "Al-Munafiqun",
    "totalAyat": 11
  },
  {
    "nomor": 64,
    "nama": "At-Taghabun",
    "totalAyat": 18
  },
  {
    "nomor": 65,
    "nama": "At-Talaq",
    "totalAyat": 12
  },
  {
    "nomor": 66,
    "nama": "At-Tahrim",
    "totalAyat": 12
  },
  {
    "nomor": 67,
    "nama": "Al-Mulk",
    "totalAyat": 30
  },
  {
    "nomor": 68,
    "nama": "Al-Qalam",
    "totalAyat": 52
  },
  {
    "nomor": 69,
    "nama": "Al-Haqqah",
    "totalAyat": 52
  },
  {
    "nomor": 70,
    "nama": "Al-Ma'arij",
    "totalAyat": 44
  },
  {
    "nomor": 71,
    "nama": "Nuh",
    "totalAyat": 28
  },
  {
    "nomor": 72,
    "nama": "Al-Jinn",
    "totalAyat": 28
  },
  {
    "nomor": 73,
    "nama": "Al-Muzzammil",
    "totalAyat": 20
  },
  {
    "nomor": 74,
    "nama": "Al-Muddaththir",
    "totalAyat": 56
  },
  {
    "nomor": 75,
    "nama": "Al-Qiyamah",
    "totalAyat": 40
  },
  {
    "nomor": 76,
    "nama": "Al-Insan",
    "totalAyat": 31
  },
  {
    "nomor": 77,
    "nama": "Al-Mursalat",
    "totalAyat": 50
  },
  {
    "nomor": 78,
    "nama": "An-Naba",
    "totalAyat": 40
  },
  {
    "nomor": 79,
    "nama": "An-Naziat",
    "totalAyat": 46
  },
  {
    "nomor": 80,
    "nama": "Abasa",
    "totalAyat": 42
  },
  {
    "nomor": 81,
    "nama": "At-Takwir",
    "totalAyat": 29
  },
  {
    "nomor": 82,
    "nama": "Al-Infitar",
    "totalAyat": 19
  },
  {
    "nomor": 83,
    "nama": "Al-Mutaffifin",
    "totalAyat": 36
  },
  {
    "nomor": 84,
    "nama": "Al-Inshiqaq",
    "totalAyat": 25
  },
  {
    "nomor": 85,
    "nama": "Al-Buruj",
    "totalAyat": 22
  },
  {
    "nomor": 86,
    "nama": "At-Tariq",
    "totalAyat": 17
  },
  {
    "nomor": 87,
    "nama": "Al-Ala",
    "totalAyat": 19
  },
  {
    "nomor": 88,
    "nama": "Al-Ghashiyah",
    "totalAyat": 26
  },
  {
    "nomor": 89,
    "nama": "Al-Fajr",
    "totalAyat": 30
  },
  {
    "nomor": 90,
    "nama": "Al-Balad",
    "totalAyat": 20
  },
  {
    "nomor": 91,
    "nama": "Ash-Shams",
    "totalAyat": 15
  },
  {
    "nomor": 92,
    "nama": "Al-Lail",
    "totalAyat": 21
  },
  {
    "nomor": 93,
    "nama": "Ad-Duha",
    "totalAyat": 11
  },
  {
    "nomor": 94,
    "nama": "Ash-Sharh",
    "totalAyat": 8
  },
  {
    "nomor": 95,
    "nama": "At-Tin",
    "totalAyat": 8
  },
  {
    "nomor": 96,
    "nama": "Al-Alaq",
    "totalAyat": 19
  },
  {
    "nomor": 97,
    "nama": "Al-Qadr",
    "totalAyat": 5
  },
  {
    "nomor": 98,
    "nama": "Al-Bayinah",
    "totalAyat": 8
  },
  {
    "nomor": 99,
    "nama": "Az-Zalzalah",
    "totalAyat": 8
  },
  {
    "nomor": 100,
    "nama": "Al-Adiyat",
    "totalAyat": 11
  },
  {
    "nomor": 101,
    "nama": "Al-Qariah",
    "totalAyat": 11
  },
  {
    "nomor": 102,
    "nama": "Al-Takathur",
    "totalAyat": 8
  },
  {
    "nomor": 103,
    "nama": "Al-Asr",
    "totalAyat": 3
  },
  {
    "nomor": 104,
    "nama": "Al-Humazah",
    "totalAyat": 9
  },
  {
    "nomor": 105,
    "nama": "Al-Fil",
    "totalAyat": 5
  },
  {
    "nomor": 106,
    "nama": "Quraish",
    "totalAyat": 4
  },
  {
    "nomor": 107,
    "nama": "Al-Ma'un",
    "totalAyat": 7
  },
  {
    "nomor": 108,
    "nama": "Al-Kauthar",
    "totalAyat": 3
  },
  {
    "nomor": 109,
    "nama": "Al-Kafirun",
    "totalAyat": 6
  },
  {
    "nomor": 110,
    "nama": "An-Nasr",
    "totalAyat": 3
  },
  {
    "nomor": 111,
    "nama": "Al-Masad",
    "totalAyat": 5
  },
  {
    "nomor": 112,
    "nama": "Al-Ikhlas",
    "totalAyat": 4
  },
  {
    "nomor": 113,
    "nama": "Al-Falaq",
    "totalAyat": 5
  },
  {
    "nomor": 114,
    "nama": "An-Nas",
    "totalAyat": 6
  }
];

// Data inti: per-halaman (1-604), juz, dan daftar surah+rentang ayat yang muncul di halaman itu
const PAGES_DATA = [{"halaman": 1, "juz": 1, "surahs": [{"nomor": 1, "nama": "Al-Fatiha", "ayatAwal": 1, "ayatAkhir": 7}]}, {"halaman": 2, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 3, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 6, "ayatAkhir": 16}]}, {"halaman": 4, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 17, "ayatAkhir": 24}]}, {"halaman": 5, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 25, "ayatAkhir": 29}]}, {"halaman": 6, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 30, "ayatAkhir": 37}]}, {"halaman": 7, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 38, "ayatAkhir": 48}]}, {"halaman": 8, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 49, "ayatAkhir": 57}]}, {"halaman": 9, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 58, "ayatAkhir": 61}]}, {"halaman": 10, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 62, "ayatAkhir": 69}]}, {"halaman": 11, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 70, "ayatAkhir": 76}]}, {"halaman": 12, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 77, "ayatAkhir": 83}]}, {"halaman": 13, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 84, "ayatAkhir": 88}]}, {"halaman": 14, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 89, "ayatAkhir": 93}]}, {"halaman": 15, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 94, "ayatAkhir": 101}]}, {"halaman": 16, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 102, "ayatAkhir": 105}]}, {"halaman": 17, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 106, "ayatAkhir": 112}]}, {"halaman": 18, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 113, "ayatAkhir": 119}]}, {"halaman": 19, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 120, "ayatAkhir": 126}]}, {"halaman": 20, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 127, "ayatAkhir": 134}]}, {"halaman": 21, "juz": 1, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 135, "ayatAkhir": 141}]}, {"halaman": 22, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 142, "ayatAkhir": 145}]}, {"halaman": 23, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 146, "ayatAkhir": 153}]}, {"halaman": 24, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 154, "ayatAkhir": 163}]}, {"halaman": 25, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 164, "ayatAkhir": 169}]}, {"halaman": 26, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 170, "ayatAkhir": 176}]}, {"halaman": 27, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 177, "ayatAkhir": 181}]}, {"halaman": 28, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 182, "ayatAkhir": 186}]}, {"halaman": 29, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 187, "ayatAkhir": 190}]}, {"halaman": 30, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 191, "ayatAkhir": 196}]}, {"halaman": 31, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 197, "ayatAkhir": 202}]}, {"halaman": 32, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 203, "ayatAkhir": 210}]}, {"halaman": 33, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 211, "ayatAkhir": 215}]}, {"halaman": 34, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 216, "ayatAkhir": 219}]}, {"halaman": 35, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 220, "ayatAkhir": 224}]}, {"halaman": 36, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 225, "ayatAkhir": 230}]}, {"halaman": 37, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 231, "ayatAkhir": 233}]}, {"halaman": 38, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 234, "ayatAkhir": 237}]}, {"halaman": 39, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 238, "ayatAkhir": 245}]}, {"halaman": 40, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 246, "ayatAkhir": 248}]}, {"halaman": 41, "juz": 2, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 249, "ayatAkhir": 252}]}, {"halaman": 42, "juz": 3, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 253, "ayatAkhir": 256}]}, {"halaman": 43, "juz": 3, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 257, "ayatAkhir": 259}]}, {"halaman": 44, "juz": 3, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 260, "ayatAkhir": 264}]}, {"halaman": 45, "juz": 3, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 265, "ayatAkhir": 269}]}, {"halaman": 46, "juz": 3, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 270, "ayatAkhir": 274}]}, {"halaman": 47, "juz": 3, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 275, "ayatAkhir": 281}]}, {"halaman": 48, "juz": 3, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 282, "ayatAkhir": 282}]}, {"halaman": 49, "juz": 3, "surahs": [{"nomor": 2, "nama": "Al-Baqara", "ayatAwal": 283, "ayatAkhir": 286}]}, {"halaman": 50, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 1, "ayatAkhir": 9}]}, {"halaman": 51, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 10, "ayatAkhir": 15}]}, {"halaman": 52, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 16, "ayatAkhir": 22}]}, {"halaman": 53, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 23, "ayatAkhir": 29}]}, {"halaman": 54, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 30, "ayatAkhir": 37}]}, {"halaman": 55, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 38, "ayatAkhir": 45}]}, {"halaman": 56, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 46, "ayatAkhir": 52}]}, {"halaman": 57, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 53, "ayatAkhir": 61}]}, {"halaman": 58, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 62, "ayatAkhir": 70}]}, {"halaman": 59, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 71, "ayatAkhir": 77}]}, {"halaman": 60, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 78, "ayatAkhir": 83}]}, {"halaman": 61, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 84, "ayatAkhir": 91}]}, {"halaman": 62, "juz": 3, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 92, "ayatAkhir": 100}]}, {"halaman": 63, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 101, "ayatAkhir": 108}]}, {"halaman": 64, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 109, "ayatAkhir": 115}]}, {"halaman": 65, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 116, "ayatAkhir": 121}]}, {"halaman": 66, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 122, "ayatAkhir": 132}]}, {"halaman": 67, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 133, "ayatAkhir": 140}]}, {"halaman": 68, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 141, "ayatAkhir": 148}]}, {"halaman": 69, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 149, "ayatAkhir": 153}]}, {"halaman": 70, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 154, "ayatAkhir": 157}]}, {"halaman": 71, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 158, "ayatAkhir": 165}]}, {"halaman": 72, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 166, "ayatAkhir": 173}]}, {"halaman": 73, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 174, "ayatAkhir": 180}]}, {"halaman": 74, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 181, "ayatAkhir": 186}]}, {"halaman": 75, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 187, "ayatAkhir": 194}]}, {"halaman": 76, "juz": 4, "surahs": [{"nomor": 3, "nama": "Aal-Imran", "ayatAwal": 195, "ayatAkhir": 200}]}, {"halaman": 77, "juz": 4, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 1, "ayatAkhir": 6}]}, {"halaman": 78, "juz": 4, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 7, "ayatAkhir": 11}]}, {"halaman": 79, "juz": 4, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 12, "ayatAkhir": 14}]}, {"halaman": 80, "juz": 4, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 15, "ayatAkhir": 19}]}, {"halaman": 81, "juz": 4, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 20, "ayatAkhir": 23}]}, {"halaman": 82, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 24, "ayatAkhir": 26}]}, {"halaman": 83, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 27, "ayatAkhir": 33}]}, {"halaman": 84, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 34, "ayatAkhir": 37}]}, {"halaman": 85, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 38, "ayatAkhir": 44}]}, {"halaman": 86, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 45, "ayatAkhir": 51}]}, {"halaman": 87, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 52, "ayatAkhir": 59}]}, {"halaman": 88, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 60, "ayatAkhir": 65}]}, {"halaman": 89, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 66, "ayatAkhir": 74}]}, {"halaman": 90, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 75, "ayatAkhir": 79}]}, {"halaman": 91, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 80, "ayatAkhir": 86}]}, {"halaman": 92, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 87, "ayatAkhir": 91}]}, {"halaman": 93, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 92, "ayatAkhir": 94}]}, {"halaman": 94, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 95, "ayatAkhir": 101}]}, {"halaman": 95, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 102, "ayatAkhir": 105}]}, {"halaman": 96, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 106, "ayatAkhir": 113}]}, {"halaman": 97, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 114, "ayatAkhir": 121}]}, {"halaman": 98, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 122, "ayatAkhir": 127}]}, {"halaman": 99, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 128, "ayatAkhir": 134}]}, {"halaman": 100, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 135, "ayatAkhir": 140}]}, {"halaman": 101, "juz": 5, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 141, "ayatAkhir": 147}]}, {"halaman": 102, "juz": 6, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 148, "ayatAkhir": 154}]}, {"halaman": 103, "juz": 6, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 155, "ayatAkhir": 162}]}, {"halaman": 104, "juz": 6, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 163, "ayatAkhir": 170}]}, {"halaman": 105, "juz": 6, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 171, "ayatAkhir": 175}]}, {"halaman": 106, "juz": 6, "surahs": [{"nomor": 4, "nama": "An-Nisaa'", "ayatAwal": 176, "ayatAkhir": 176}, {"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 1, "ayatAkhir": 2}]}, {"halaman": 107, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 3, "ayatAkhir": 5}]}, {"halaman": 108, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 6, "ayatAkhir": 9}]}, {"halaman": 109, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 10, "ayatAkhir": 13}]}, {"halaman": 110, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 14, "ayatAkhir": 17}]}, {"halaman": 111, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 18, "ayatAkhir": 23}]}, {"halaman": 112, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 24, "ayatAkhir": 31}]}, {"halaman": 113, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 32, "ayatAkhir": 36}]}, {"halaman": 114, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 37, "ayatAkhir": 41}]}, {"halaman": 115, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 42, "ayatAkhir": 45}]}, {"halaman": 116, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 46, "ayatAkhir": 50}]}, {"halaman": 117, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 51, "ayatAkhir": 57}]}, {"halaman": 118, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 58, "ayatAkhir": 64}]}, {"halaman": 119, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 65, "ayatAkhir": 70}]}, {"halaman": 120, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 71, "ayatAkhir": 76}]}, {"halaman": 121, "juz": 6, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 77, "ayatAkhir": 82}]}, {"halaman": 122, "juz": 7, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 83, "ayatAkhir": 89}]}, {"halaman": 123, "juz": 7, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 90, "ayatAkhir": 95}]}, {"halaman": 124, "juz": 7, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 96, "ayatAkhir": 103}]}, {"halaman": 125, "juz": 7, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 104, "ayatAkhir": 108}]}, {"halaman": 126, "juz": 7, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 109, "ayatAkhir": 113}]}, {"halaman": 127, "juz": 7, "surahs": [{"nomor": 5, "nama": "Al-Ma'ida", "ayatAwal": 114, "ayatAkhir": 120}]}, {"halaman": 128, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 1, "ayatAkhir": 8}]}, {"halaman": 129, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 9, "ayatAkhir": 18}]}, {"halaman": 130, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 19, "ayatAkhir": 27}]}, {"halaman": 131, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 28, "ayatAkhir": 35}]}, {"halaman": 132, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 36, "ayatAkhir": 44}]}, {"halaman": 133, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 45, "ayatAkhir": 52}]}, {"halaman": 134, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 53, "ayatAkhir": 59}]}, {"halaman": 135, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 60, "ayatAkhir": 68}]}, {"halaman": 136, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 69, "ayatAkhir": 73}]}, {"halaman": 137, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 74, "ayatAkhir": 81}]}, {"halaman": 138, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 82, "ayatAkhir": 90}]}, {"halaman": 139, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 91, "ayatAkhir": 94}]}, {"halaman": 140, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 95, "ayatAkhir": 101}]}, {"halaman": 141, "juz": 7, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 102, "ayatAkhir": 110}]}, {"halaman": 142, "juz": 8, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 111, "ayatAkhir": 118}]}, {"halaman": 143, "juz": 8, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 119, "ayatAkhir": 124}]}, {"halaman": 144, "juz": 8, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 125, "ayatAkhir": 131}]}, {"halaman": 145, "juz": 8, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 132, "ayatAkhir": 137}]}, {"halaman": 146, "juz": 8, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 138, "ayatAkhir": 142}]}, {"halaman": 147, "juz": 8, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 143, "ayatAkhir": 146}]}, {"halaman": 148, "juz": 8, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 147, "ayatAkhir": 151}]}, {"halaman": 149, "juz": 8, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 152, "ayatAkhir": 157}]}, {"halaman": 150, "juz": 8, "surahs": [{"nomor": 6, "nama": "Al-An'am", "ayatAwal": 158, "ayatAkhir": 165}]}, {"halaman": 151, "juz": 8, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 1, "ayatAkhir": 11}]}, {"halaman": 152, "juz": 8, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 12, "ayatAkhir": 22}]}, {"halaman": 153, "juz": 8, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 23, "ayatAkhir": 30}]}, {"halaman": 154, "juz": 8, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 31, "ayatAkhir": 37}]}, {"halaman": 155, "juz": 8, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 38, "ayatAkhir": 43}]}, {"halaman": 156, "juz": 8, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 44, "ayatAkhir": 51}]}, {"halaman": 157, "juz": 8, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 52, "ayatAkhir": 57}]}, {"halaman": 158, "juz": 8, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 58, "ayatAkhir": 67}]}, {"halaman": 159, "juz": 8, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 68, "ayatAkhir": 73}]}, {"halaman": 160, "juz": 8, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 74, "ayatAkhir": 81}]}, {"halaman": 161, "juz": 8, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 82, "ayatAkhir": 87}]}, {"halaman": 162, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 88, "ayatAkhir": 95}]}, {"halaman": 163, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 96, "ayatAkhir": 104}]}, {"halaman": 164, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 105, "ayatAkhir": 120}]}, {"halaman": 165, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 121, "ayatAkhir": 130}]}, {"halaman": 166, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 131, "ayatAkhir": 137}]}, {"halaman": 167, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 138, "ayatAkhir": 143}]}, {"halaman": 168, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 144, "ayatAkhir": 149}]}, {"halaman": 169, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 150, "ayatAkhir": 155}]}, {"halaman": 170, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 156, "ayatAkhir": 159}]}, {"halaman": 171, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 160, "ayatAkhir": 163}]}, {"halaman": 172, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 164, "ayatAkhir": 170}]}, {"halaman": 173, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 171, "ayatAkhir": 178}]}, {"halaman": 174, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 179, "ayatAkhir": 187}]}, {"halaman": 175, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 188, "ayatAkhir": 195}]}, {"halaman": 176, "juz": 9, "surahs": [{"nomor": 7, "nama": "Al-A'raf", "ayatAwal": 196, "ayatAkhir": 206}]}, {"halaman": 177, "juz": 9, "surahs": [{"nomor": 8, "nama": "Al-Anfal", "ayatAwal": 1, "ayatAkhir": 8}]}, {"halaman": 178, "juz": 9, "surahs": [{"nomor": 8, "nama": "Al-Anfal", "ayatAwal": 9, "ayatAkhir": 16}]}, {"halaman": 179, "juz": 9, "surahs": [{"nomor": 8, "nama": "Al-Anfal", "ayatAwal": 17, "ayatAkhir": 25}]}, {"halaman": 180, "juz": 9, "surahs": [{"nomor": 8, "nama": "Al-Anfal", "ayatAwal": 26, "ayatAkhir": 33}]}, {"halaman": 181, "juz": 9, "surahs": [{"nomor": 8, "nama": "Al-Anfal", "ayatAwal": 34, "ayatAkhir": 40}]}, {"halaman": 182, "juz": 10, "surahs": [{"nomor": 8, "nama": "Al-Anfal", "ayatAwal": 41, "ayatAkhir": 45}]}, {"halaman": 183, "juz": 10, "surahs": [{"nomor": 8, "nama": "Al-Anfal", "ayatAwal": 46, "ayatAkhir": 52}]}, {"halaman": 184, "juz": 10, "surahs": [{"nomor": 8, "nama": "Al-Anfal", "ayatAwal": 53, "ayatAkhir": 61}]}, {"halaman": 185, "juz": 10, "surahs": [{"nomor": 8, "nama": "Al-Anfal", "ayatAwal": 62, "ayatAkhir": 69}]}, {"halaman": 186, "juz": 10, "surahs": [{"nomor": 8, "nama": "Al-Anfal", "ayatAwal": 70, "ayatAkhir": 75}]}, {"halaman": 187, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 1, "ayatAkhir": 6}]}, {"halaman": 188, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 7, "ayatAkhir": 13}]}, {"halaman": 189, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 14, "ayatAkhir": 20}]}, {"halaman": 190, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 21, "ayatAkhir": 26}]}, {"halaman": 191, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 27, "ayatAkhir": 31}]}, {"halaman": 192, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 32, "ayatAkhir": 36}]}, {"halaman": 193, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 37, "ayatAkhir": 40}]}, {"halaman": 194, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 41, "ayatAkhir": 47}]}, {"halaman": 195, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 48, "ayatAkhir": 54}]}, {"halaman": 196, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 55, "ayatAkhir": 61}]}, {"halaman": 197, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 62, "ayatAkhir": 68}]}, {"halaman": 198, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 69, "ayatAkhir": 72}]}, {"halaman": 199, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 73, "ayatAkhir": 79}]}, {"halaman": 200, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 80, "ayatAkhir": 86}]}, {"halaman": 201, "juz": 10, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 87, "ayatAkhir": 93}]}, {"halaman": 202, "juz": 11, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 94, "ayatAkhir": 99}]}, {"halaman": 203, "juz": 11, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 100, "ayatAkhir": 106}]}, {"halaman": 204, "juz": 11, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 107, "ayatAkhir": 111}]}, {"halaman": 205, "juz": 11, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 112, "ayatAkhir": 117}]}, {"halaman": 206, "juz": 11, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 118, "ayatAkhir": 122}]}, {"halaman": 207, "juz": 11, "surahs": [{"nomor": 9, "nama": "Al-Tawba", "ayatAwal": 123, "ayatAkhir": 129}]}, {"halaman": 208, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 1, "ayatAkhir": 6}]}, {"halaman": 209, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 7, "ayatAkhir": 14}]}, {"halaman": 210, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 15, "ayatAkhir": 20}]}, {"halaman": 211, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 21, "ayatAkhir": 25}]}, {"halaman": 212, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 26, "ayatAkhir": 33}]}, {"halaman": 213, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 34, "ayatAkhir": 42}]}, {"halaman": 214, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 43, "ayatAkhir": 53}]}, {"halaman": 215, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 54, "ayatAkhir": 61}]}, {"halaman": 216, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 62, "ayatAkhir": 70}]}, {"halaman": 217, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 71, "ayatAkhir": 78}]}, {"halaman": 218, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 79, "ayatAkhir": 88}]}, {"halaman": 219, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 89, "ayatAkhir": 97}]}, {"halaman": 220, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 98, "ayatAkhir": 106}]}, {"halaman": 221, "juz": 11, "surahs": [{"nomor": 10, "nama": "Yunus", "ayatAwal": 107, "ayatAkhir": 109}, {"nomor": 11, "nama": "Hud", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 222, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 6, "ayatAkhir": 12}]}, {"halaman": 223, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 13, "ayatAkhir": 19}]}, {"halaman": 224, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 20, "ayatAkhir": 28}]}, {"halaman": 225, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 29, "ayatAkhir": 37}]}, {"halaman": 226, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 38, "ayatAkhir": 45}]}, {"halaman": 227, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 46, "ayatAkhir": 53}]}, {"halaman": 228, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 54, "ayatAkhir": 62}]}, {"halaman": 229, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 63, "ayatAkhir": 71}]}, {"halaman": 230, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 72, "ayatAkhir": 81}]}, {"halaman": 231, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 82, "ayatAkhir": 88}]}, {"halaman": 232, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 89, "ayatAkhir": 97}]}, {"halaman": 233, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 98, "ayatAkhir": 108}]}, {"halaman": 234, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 109, "ayatAkhir": 117}]}, {"halaman": 235, "juz": 12, "surahs": [{"nomor": 11, "nama": "Hud", "ayatAwal": 118, "ayatAkhir": 123}, {"nomor": 12, "nama": "Yusuf", "ayatAwal": 1, "ayatAkhir": 4}]}, {"halaman": 236, "juz": 12, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 5, "ayatAkhir": 14}]}, {"halaman": 237, "juz": 12, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 15, "ayatAkhir": 22}]}, {"halaman": 238, "juz": 12, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 23, "ayatAkhir": 30}]}, {"halaman": 239, "juz": 12, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 31, "ayatAkhir": 37}]}, {"halaman": 240, "juz": 12, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 38, "ayatAkhir": 43}]}, {"halaman": 241, "juz": 12, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 44, "ayatAkhir": 52}]}, {"halaman": 242, "juz": 13, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 53, "ayatAkhir": 63}]}, {"halaman": 243, "juz": 13, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 64, "ayatAkhir": 69}]}, {"halaman": 244, "juz": 13, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 70, "ayatAkhir": 78}]}, {"halaman": 245, "juz": 13, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 79, "ayatAkhir": 86}]}, {"halaman": 246, "juz": 13, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 87, "ayatAkhir": 95}]}, {"halaman": 247, "juz": 13, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 96, "ayatAkhir": 103}]}, {"halaman": 248, "juz": 13, "surahs": [{"nomor": 12, "nama": "Yusuf", "ayatAwal": 104, "ayatAkhir": 111}]}, {"halaman": 249, "juz": 13, "surahs": [{"nomor": 13, "nama": "Ar-Ra'd", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 250, "juz": 13, "surahs": [{"nomor": 13, "nama": "Ar-Ra'd", "ayatAwal": 6, "ayatAkhir": 13}]}, {"halaman": 251, "juz": 13, "surahs": [{"nomor": 13, "nama": "Ar-Ra'd", "ayatAwal": 14, "ayatAkhir": 18}]}, {"halaman": 252, "juz": 13, "surahs": [{"nomor": 13, "nama": "Ar-Ra'd", "ayatAwal": 19, "ayatAkhir": 28}]}, {"halaman": 253, "juz": 13, "surahs": [{"nomor": 13, "nama": "Ar-Ra'd", "ayatAwal": 29, "ayatAkhir": 34}]}, {"halaman": 254, "juz": 13, "surahs": [{"nomor": 13, "nama": "Ar-Ra'd", "ayatAwal": 35, "ayatAkhir": 42}]}, {"halaman": 255, "juz": 13, "surahs": [{"nomor": 13, "nama": "Ar-Ra'd", "ayatAwal": 43, "ayatAkhir": 43}, {"nomor": 14, "nama": "Ibrahim", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 256, "juz": 13, "surahs": [{"nomor": 14, "nama": "Ibrahim", "ayatAwal": 6, "ayatAkhir": 10}]}, {"halaman": 257, "juz": 13, "surahs": [{"nomor": 14, "nama": "Ibrahim", "ayatAwal": 11, "ayatAkhir": 18}]}, {"halaman": 258, "juz": 13, "surahs": [{"nomor": 14, "nama": "Ibrahim", "ayatAwal": 19, "ayatAkhir": 24}]}, {"halaman": 259, "juz": 13, "surahs": [{"nomor": 14, "nama": "Ibrahim", "ayatAwal": 25, "ayatAkhir": 33}]}, {"halaman": 260, "juz": 13, "surahs": [{"nomor": 14, "nama": "Ibrahim", "ayatAwal": 34, "ayatAkhir": 42}]}, {"halaman": 261, "juz": 13, "surahs": [{"nomor": 14, "nama": "Ibrahim", "ayatAwal": 43, "ayatAkhir": 52}]}, {"halaman": 262, "juz": 14, "surahs": [{"nomor": 15, "nama": "Al-Hijr", "ayatAwal": 1, "ayatAkhir": 15}]}, {"halaman": 263, "juz": 14, "surahs": [{"nomor": 15, "nama": "Al-Hijr", "ayatAwal": 16, "ayatAkhir": 31}]}, {"halaman": 264, "juz": 14, "surahs": [{"nomor": 15, "nama": "Al-Hijr", "ayatAwal": 32, "ayatAkhir": 51}]}, {"halaman": 265, "juz": 14, "surahs": [{"nomor": 15, "nama": "Al-Hijr", "ayatAwal": 52, "ayatAkhir": 70}]}, {"halaman": 266, "juz": 14, "surahs": [{"nomor": 15, "nama": "Al-Hijr", "ayatAwal": 71, "ayatAkhir": 90}]}, {"halaman": 267, "juz": 14, "surahs": [{"nomor": 15, "nama": "Al-Hijr", "ayatAwal": 91, "ayatAkhir": 99}, {"nomor": 16, "nama": "An-Nahl", "ayatAwal": 1, "ayatAkhir": 6}]}, {"halaman": 268, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 7, "ayatAkhir": 14}]}, {"halaman": 269, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 15, "ayatAkhir": 26}]}, {"halaman": 270, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 27, "ayatAkhir": 34}]}, {"halaman": 271, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 35, "ayatAkhir": 42}]}, {"halaman": 272, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 43, "ayatAkhir": 54}]}, {"halaman": 273, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 55, "ayatAkhir": 64}]}, {"halaman": 274, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 65, "ayatAkhir": 72}]}, {"halaman": 275, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 73, "ayatAkhir": 79}]}, {"halaman": 276, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 80, "ayatAkhir": 87}]}, {"halaman": 277, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 88, "ayatAkhir": 93}]}, {"halaman": 278, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 94, "ayatAkhir": 102}]}, {"halaman": 279, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 103, "ayatAkhir": 110}]}, {"halaman": 280, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 111, "ayatAkhir": 118}]}, {"halaman": 281, "juz": 14, "surahs": [{"nomor": 16, "nama": "An-Nahl", "ayatAwal": 119, "ayatAkhir": 128}]}, {"halaman": 282, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 1, "ayatAkhir": 7}]}, {"halaman": 283, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 8, "ayatAkhir": 17}]}, {"halaman": 284, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 18, "ayatAkhir": 27}]}, {"halaman": 285, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 28, "ayatAkhir": 38}]}, {"halaman": 286, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 39, "ayatAkhir": 49}]}, {"halaman": 287, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 50, "ayatAkhir": 58}]}, {"halaman": 288, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 59, "ayatAkhir": 66}]}, {"halaman": 289, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 67, "ayatAkhir": 75}]}, {"halaman": 290, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 76, "ayatAkhir": 86}]}, {"halaman": 291, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 87, "ayatAkhir": 96}]}, {"halaman": 292, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 97, "ayatAkhir": 104}]}, {"halaman": 293, "juz": 15, "surahs": [{"nomor": 17, "nama": "Al-Israa", "ayatAwal": 105, "ayatAkhir": 111}, {"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 1, "ayatAkhir": 4}]}, {"halaman": 294, "juz": 15, "surahs": [{"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 5, "ayatAkhir": 15}]}, {"halaman": 295, "juz": 15, "surahs": [{"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 16, "ayatAkhir": 20}]}, {"halaman": 296, "juz": 15, "surahs": [{"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 21, "ayatAkhir": 27}]}, {"halaman": 297, "juz": 15, "surahs": [{"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 28, "ayatAkhir": 34}]}, {"halaman": 298, "juz": 15, "surahs": [{"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 35, "ayatAkhir": 45}]}, {"halaman": 299, "juz": 15, "surahs": [{"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 46, "ayatAkhir": 53}]}, {"halaman": 300, "juz": 15, "surahs": [{"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 54, "ayatAkhir": 61}]}, {"halaman": 301, "juz": 15, "surahs": [{"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 62, "ayatAkhir": 74}]}, {"halaman": 302, "juz": 16, "surahs": [{"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 75, "ayatAkhir": 83}]}, {"halaman": 303, "juz": 16, "surahs": [{"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 84, "ayatAkhir": 97}]}, {"halaman": 304, "juz": 16, "surahs": [{"nomor": 18, "nama": "Al-Kahf", "ayatAwal": 98, "ayatAkhir": 110}]}, {"halaman": 305, "juz": 16, "surahs": [{"nomor": 19, "nama": "Maryam", "ayatAwal": 1, "ayatAkhir": 11}]}, {"halaman": 306, "juz": 16, "surahs": [{"nomor": 19, "nama": "Maryam", "ayatAwal": 12, "ayatAkhir": 25}]}, {"halaman": 307, "juz": 16, "surahs": [{"nomor": 19, "nama": "Maryam", "ayatAwal": 26, "ayatAkhir": 38}]}, {"halaman": 308, "juz": 16, "surahs": [{"nomor": 19, "nama": "Maryam", "ayatAwal": 39, "ayatAkhir": 51}]}, {"halaman": 309, "juz": 16, "surahs": [{"nomor": 19, "nama": "Maryam", "ayatAwal": 52, "ayatAkhir": 64}]}, {"halaman": 310, "juz": 16, "surahs": [{"nomor": 19, "nama": "Maryam", "ayatAwal": 65, "ayatAkhir": 76}]}, {"halaman": 311, "juz": 16, "surahs": [{"nomor": 19, "nama": "Maryam", "ayatAwal": 77, "ayatAkhir": 95}]}, {"halaman": 312, "juz": 16, "surahs": [{"nomor": 19, "nama": "Maryam", "ayatAwal": 96, "ayatAkhir": 98}, {"nomor": 20, "nama": "Ta-Ha", "ayatAwal": 1, "ayatAkhir": 12}]}, {"halaman": 313, "juz": 16, "surahs": [{"nomor": 20, "nama": "Ta-Ha", "ayatAwal": 13, "ayatAkhir": 37}]}, {"halaman": 314, "juz": 16, "surahs": [{"nomor": 20, "nama": "Ta-Ha", "ayatAwal": 38, "ayatAkhir": 51}]}, {"halaman": 315, "juz": 16, "surahs": [{"nomor": 20, "nama": "Ta-Ha", "ayatAwal": 52, "ayatAkhir": 64}]}, {"halaman": 316, "juz": 16, "surahs": [{"nomor": 20, "nama": "Ta-Ha", "ayatAwal": 65, "ayatAkhir": 76}]}, {"halaman": 317, "juz": 16, "surahs": [{"nomor": 20, "nama": "Ta-Ha", "ayatAwal": 77, "ayatAkhir": 87}]}, {"halaman": 318, "juz": 16, "surahs": [{"nomor": 20, "nama": "Ta-Ha", "ayatAwal": 88, "ayatAkhir": 98}]}, {"halaman": 319, "juz": 16, "surahs": [{"nomor": 20, "nama": "Ta-Ha", "ayatAwal": 99, "ayatAkhir": 113}]}, {"halaman": 320, "juz": 16, "surahs": [{"nomor": 20, "nama": "Ta-Ha", "ayatAwal": 114, "ayatAkhir": 125}]}, {"halaman": 321, "juz": 16, "surahs": [{"nomor": 20, "nama": "Ta-Ha", "ayatAwal": 126, "ayatAkhir": 135}]}, {"halaman": 322, "juz": 17, "surahs": [{"nomor": 21, "nama": "Al-Anbiya", "ayatAwal": 1, "ayatAkhir": 10}]}, {"halaman": 323, "juz": 17, "surahs": [{"nomor": 21, "nama": "Al-Anbiya", "ayatAwal": 11, "ayatAkhir": 24}]}, {"halaman": 324, "juz": 17, "surahs": [{"nomor": 21, "nama": "Al-Anbiya", "ayatAwal": 25, "ayatAkhir": 35}]}, {"halaman": 325, "juz": 17, "surahs": [{"nomor": 21, "nama": "Al-Anbiya", "ayatAwal": 36, "ayatAkhir": 44}]}, {"halaman": 326, "juz": 17, "surahs": [{"nomor": 21, "nama": "Al-Anbiya", "ayatAwal": 45, "ayatAkhir": 57}]}, {"halaman": 327, "juz": 17, "surahs": [{"nomor": 21, "nama": "Al-Anbiya", "ayatAwal": 58, "ayatAkhir": 72}]}, {"halaman": 328, "juz": 17, "surahs": [{"nomor": 21, "nama": "Al-Anbiya", "ayatAwal": 73, "ayatAkhir": 81}]}, {"halaman": 329, "juz": 17, "surahs": [{"nomor": 21, "nama": "Al-Anbiya", "ayatAwal": 82, "ayatAkhir": 90}]}, {"halaman": 330, "juz": 17, "surahs": [{"nomor": 21, "nama": "Al-Anbiya", "ayatAwal": 91, "ayatAkhir": 101}]}, {"halaman": 331, "juz": 17, "surahs": [{"nomor": 21, "nama": "Al-Anbiya", "ayatAwal": 102, "ayatAkhir": 112}]}, {"halaman": 332, "juz": 17, "surahs": [{"nomor": 22, "nama": "Al-Hajj", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 333, "juz": 17, "surahs": [{"nomor": 22, "nama": "Al-Hajj", "ayatAwal": 6, "ayatAkhir": 15}]}, {"halaman": 334, "juz": 17, "surahs": [{"nomor": 22, "nama": "Al-Hajj", "ayatAwal": 16, "ayatAkhir": 23}]}, {"halaman": 335, "juz": 17, "surahs": [{"nomor": 22, "nama": "Al-Hajj", "ayatAwal": 24, "ayatAkhir": 30}]}, {"halaman": 336, "juz": 17, "surahs": [{"nomor": 22, "nama": "Al-Hajj", "ayatAwal": 31, "ayatAkhir": 38}]}, {"halaman": 337, "juz": 17, "surahs": [{"nomor": 22, "nama": "Al-Hajj", "ayatAwal": 39, "ayatAkhir": 46}]}, {"halaman": 338, "juz": 17, "surahs": [{"nomor": 22, "nama": "Al-Hajj", "ayatAwal": 47, "ayatAkhir": 55}]}, {"halaman": 339, "juz": 17, "surahs": [{"nomor": 22, "nama": "Al-Hajj", "ayatAwal": 56, "ayatAkhir": 64}]}, {"halaman": 340, "juz": 17, "surahs": [{"nomor": 22, "nama": "Al-Hajj", "ayatAwal": 65, "ayatAkhir": 72}]}, {"halaman": 341, "juz": 17, "surahs": [{"nomor": 22, "nama": "Al-Hajj", "ayatAwal": 73, "ayatAkhir": 78}]}, {"halaman": 342, "juz": 18, "surahs": [{"nomor": 23, "nama": "Al-Muminun", "ayatAwal": 1, "ayatAkhir": 17}]}, {"halaman": 343, "juz": 18, "surahs": [{"nomor": 23, "nama": "Al-Muminun", "ayatAwal": 18, "ayatAkhir": 27}]}, {"halaman": 344, "juz": 18, "surahs": [{"nomor": 23, "nama": "Al-Muminun", "ayatAwal": 28, "ayatAkhir": 42}]}, {"halaman": 345, "juz": 18, "surahs": [{"nomor": 23, "nama": "Al-Muminun", "ayatAwal": 43, "ayatAkhir": 59}]}, {"halaman": 346, "juz": 18, "surahs": [{"nomor": 23, "nama": "Al-Muminun", "ayatAwal": 60, "ayatAkhir": 74}]}, {"halaman": 347, "juz": 18, "surahs": [{"nomor": 23, "nama": "Al-Muminun", "ayatAwal": 75, "ayatAkhir": 89}]}, {"halaman": 348, "juz": 18, "surahs": [{"nomor": 23, "nama": "Al-Muminun", "ayatAwal": 90, "ayatAkhir": 104}]}, {"halaman": 349, "juz": 18, "surahs": [{"nomor": 23, "nama": "Al-Muminun", "ayatAwal": 105, "ayatAkhir": 118}]}, {"halaman": 350, "juz": 18, "surahs": [{"nomor": 24, "nama": "An-Nur", "ayatAwal": 1, "ayatAkhir": 10}]}, {"halaman": 351, "juz": 18, "surahs": [{"nomor": 24, "nama": "An-Nur", "ayatAwal": 11, "ayatAkhir": 20}]}, {"halaman": 352, "juz": 18, "surahs": [{"nomor": 24, "nama": "An-Nur", "ayatAwal": 21, "ayatAkhir": 27}]}, {"halaman": 353, "juz": 18, "surahs": [{"nomor": 24, "nama": "An-Nur", "ayatAwal": 28, "ayatAkhir": 31}]}, {"halaman": 354, "juz": 18, "surahs": [{"nomor": 24, "nama": "An-Nur", "ayatAwal": 32, "ayatAkhir": 36}]}, {"halaman": 355, "juz": 18, "surahs": [{"nomor": 24, "nama": "An-Nur", "ayatAwal": 37, "ayatAkhir": 43}]}, {"halaman": 356, "juz": 18, "surahs": [{"nomor": 24, "nama": "An-Nur", "ayatAwal": 44, "ayatAkhir": 53}]}, {"halaman": 357, "juz": 18, "surahs": [{"nomor": 24, "nama": "An-Nur", "ayatAwal": 54, "ayatAkhir": 58}]}, {"halaman": 358, "juz": 18, "surahs": [{"nomor": 24, "nama": "An-Nur", "ayatAwal": 59, "ayatAkhir": 61}]}, {"halaman": 359, "juz": 18, "surahs": [{"nomor": 24, "nama": "An-Nur", "ayatAwal": 62, "ayatAkhir": 64}, {"nomor": 25, "nama": "Al-Furqan", "ayatAwal": 1, "ayatAkhir": 2}]}, {"halaman": 360, "juz": 18, "surahs": [{"nomor": 25, "nama": "Al-Furqan", "ayatAwal": 3, "ayatAkhir": 11}]}, {"halaman": 361, "juz": 18, "surahs": [{"nomor": 25, "nama": "Al-Furqan", "ayatAwal": 12, "ayatAkhir": 20}]}, {"halaman": 362, "juz": 19, "surahs": [{"nomor": 25, "nama": "Al-Furqan", "ayatAwal": 21, "ayatAkhir": 32}]}, {"halaman": 363, "juz": 19, "surahs": [{"nomor": 25, "nama": "Al-Furqan", "ayatAwal": 33, "ayatAkhir": 43}]}, {"halaman": 364, "juz": 19, "surahs": [{"nomor": 25, "nama": "Al-Furqan", "ayatAwal": 44, "ayatAkhir": 55}]}, {"halaman": 365, "juz": 19, "surahs": [{"nomor": 25, "nama": "Al-Furqan", "ayatAwal": 56, "ayatAkhir": 67}]}, {"halaman": 366, "juz": 19, "surahs": [{"nomor": 25, "nama": "Al-Furqan", "ayatAwal": 68, "ayatAkhir": 77}]}, {"halaman": 367, "juz": 19, "surahs": [{"nomor": 26, "nama": "Ash-Shuara", "ayatAwal": 1, "ayatAkhir": 19}]}, {"halaman": 368, "juz": 19, "surahs": [{"nomor": 26, "nama": "Ash-Shuara", "ayatAwal": 20, "ayatAkhir": 39}]}, {"halaman": 369, "juz": 19, "surahs": [{"nomor": 26, "nama": "Ash-Shuara", "ayatAwal": 40, "ayatAkhir": 60}]}, {"halaman": 370, "juz": 19, "surahs": [{"nomor": 26, "nama": "Ash-Shuara", "ayatAwal": 61, "ayatAkhir": 83}]}, {"halaman": 371, "juz": 19, "surahs": [{"nomor": 26, "nama": "Ash-Shuara", "ayatAwal": 84, "ayatAkhir": 111}]}, {"halaman": 372, "juz": 19, "surahs": [{"nomor": 26, "nama": "Ash-Shuara", "ayatAwal": 112, "ayatAkhir": 136}]}, {"halaman": 373, "juz": 19, "surahs": [{"nomor": 26, "nama": "Ash-Shuara", "ayatAwal": 137, "ayatAkhir": 159}]}, {"halaman": 374, "juz": 19, "surahs": [{"nomor": 26, "nama": "Ash-Shuara", "ayatAwal": 160, "ayatAkhir": 183}]}, {"halaman": 375, "juz": 19, "surahs": [{"nomor": 26, "nama": "Ash-Shuara", "ayatAwal": 184, "ayatAkhir": 206}]}, {"halaman": 376, "juz": 19, "surahs": [{"nomor": 26, "nama": "Ash-Shuara", "ayatAwal": 207, "ayatAkhir": 227}]}, {"halaman": 377, "juz": 19, "surahs": [{"nomor": 27, "nama": "An-Naml", "ayatAwal": 1, "ayatAkhir": 13}]}, {"halaman": 378, "juz": 19, "surahs": [{"nomor": 27, "nama": "An-Naml", "ayatAwal": 14, "ayatAkhir": 22}]}, {"halaman": 379, "juz": 19, "surahs": [{"nomor": 27, "nama": "An-Naml", "ayatAwal": 23, "ayatAkhir": 35}]}, {"halaman": 380, "juz": 19, "surahs": [{"nomor": 27, "nama": "An-Naml", "ayatAwal": 36, "ayatAkhir": 44}]}, {"halaman": 381, "juz": 19, "surahs": [{"nomor": 27, "nama": "An-Naml", "ayatAwal": 45, "ayatAkhir": 55}]}, {"halaman": 382, "juz": 20, "surahs": [{"nomor": 27, "nama": "An-Naml", "ayatAwal": 56, "ayatAkhir": 63}]}, {"halaman": 383, "juz": 20, "surahs": [{"nomor": 27, "nama": "An-Naml", "ayatAwal": 64, "ayatAkhir": 76}]}, {"halaman": 384, "juz": 20, "surahs": [{"nomor": 27, "nama": "An-Naml", "ayatAwal": 77, "ayatAkhir": 88}]}, {"halaman": 385, "juz": 20, "surahs": [{"nomor": 27, "nama": "An-Naml", "ayatAwal": 89, "ayatAkhir": 93}, {"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 386, "juz": 20, "surahs": [{"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 6, "ayatAkhir": 13}]}, {"halaman": 387, "juz": 20, "surahs": [{"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 14, "ayatAkhir": 21}]}, {"halaman": 388, "juz": 20, "surahs": [{"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 22, "ayatAkhir": 28}]}, {"halaman": 389, "juz": 20, "surahs": [{"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 29, "ayatAkhir": 35}]}, {"halaman": 390, "juz": 20, "surahs": [{"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 36, "ayatAkhir": 43}]}, {"halaman": 391, "juz": 20, "surahs": [{"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 44, "ayatAkhir": 50}]}, {"halaman": 392, "juz": 20, "surahs": [{"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 51, "ayatAkhir": 59}]}, {"halaman": 393, "juz": 20, "surahs": [{"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 60, "ayatAkhir": 70}]}, {"halaman": 394, "juz": 20, "surahs": [{"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 71, "ayatAkhir": 77}]}, {"halaman": 395, "juz": 20, "surahs": [{"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 78, "ayatAkhir": 84}]}, {"halaman": 396, "juz": 20, "surahs": [{"nomor": 28, "nama": "Al-Qasas", "ayatAwal": 85, "ayatAkhir": 88}, {"nomor": 29, "nama": "Al-Ankabut", "ayatAwal": 1, "ayatAkhir": 6}]}, {"halaman": 397, "juz": 20, "surahs": [{"nomor": 29, "nama": "Al-Ankabut", "ayatAwal": 7, "ayatAkhir": 14}]}, {"halaman": 398, "juz": 20, "surahs": [{"nomor": 29, "nama": "Al-Ankabut", "ayatAwal": 15, "ayatAkhir": 23}]}, {"halaman": 399, "juz": 20, "surahs": [{"nomor": 29, "nama": "Al-Ankabut", "ayatAwal": 24, "ayatAkhir": 30}]}, {"halaman": 400, "juz": 20, "surahs": [{"nomor": 29, "nama": "Al-Ankabut", "ayatAwal": 31, "ayatAkhir": 38}]}, {"halaman": 401, "juz": 20, "surahs": [{"nomor": 29, "nama": "Al-Ankabut", "ayatAwal": 39, "ayatAkhir": 45}]}, {"halaman": 402, "juz": 21, "surahs": [{"nomor": 29, "nama": "Al-Ankabut", "ayatAwal": 46, "ayatAkhir": 52}]}, {"halaman": 403, "juz": 21, "surahs": [{"nomor": 29, "nama": "Al-Ankabut", "ayatAwal": 53, "ayatAkhir": 63}]}, {"halaman": 404, "juz": 21, "surahs": [{"nomor": 29, "nama": "Al-Ankabut", "ayatAwal": 64, "ayatAkhir": 69}, {"nomor": 30, "nama": "Ar-Rum", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 405, "juz": 21, "surahs": [{"nomor": 30, "nama": "Ar-Rum", "ayatAwal": 6, "ayatAkhir": 15}]}, {"halaman": 406, "juz": 21, "surahs": [{"nomor": 30, "nama": "Ar-Rum", "ayatAwal": 16, "ayatAkhir": 24}]}, {"halaman": 407, "juz": 21, "surahs": [{"nomor": 30, "nama": "Ar-Rum", "ayatAwal": 25, "ayatAkhir": 32}]}, {"halaman": 408, "juz": 21, "surahs": [{"nomor": 30, "nama": "Ar-Rum", "ayatAwal": 33, "ayatAkhir": 41}]}, {"halaman": 409, "juz": 21, "surahs": [{"nomor": 30, "nama": "Ar-Rum", "ayatAwal": 42, "ayatAkhir": 50}]}, {"halaman": 410, "juz": 21, "surahs": [{"nomor": 30, "nama": "Ar-Rum", "ayatAwal": 51, "ayatAkhir": 60}]}, {"halaman": 411, "juz": 21, "surahs": [{"nomor": 31, "nama": "Luqman", "ayatAwal": 1, "ayatAkhir": 11}]}, {"halaman": 412, "juz": 21, "surahs": [{"nomor": 31, "nama": "Luqman", "ayatAwal": 12, "ayatAkhir": 19}]}, {"halaman": 413, "juz": 21, "surahs": [{"nomor": 31, "nama": "Luqman", "ayatAwal": 20, "ayatAkhir": 28}]}, {"halaman": 414, "juz": 21, "surahs": [{"nomor": 31, "nama": "Luqman", "ayatAwal": 29, "ayatAkhir": 34}]}, {"halaman": 415, "juz": 21, "surahs": [{"nomor": 32, "nama": "As-Sajdah", "ayatAwal": 1, "ayatAkhir": 11}]}, {"halaman": 416, "juz": 21, "surahs": [{"nomor": 32, "nama": "As-Sajdah", "ayatAwal": 12, "ayatAkhir": 20}]}, {"halaman": 417, "juz": 21, "surahs": [{"nomor": 32, "nama": "As-Sajdah", "ayatAwal": 21, "ayatAkhir": 30}]}, {"halaman": 418, "juz": 21, "surahs": [{"nomor": 33, "nama": "Al-Ahzab", "ayatAwal": 1, "ayatAkhir": 6}]}, {"halaman": 419, "juz": 21, "surahs": [{"nomor": 33, "nama": "Al-Ahzab", "ayatAwal": 7, "ayatAkhir": 15}]}, {"halaman": 420, "juz": 21, "surahs": [{"nomor": 33, "nama": "Al-Ahzab", "ayatAwal": 16, "ayatAkhir": 22}]}, {"halaman": 421, "juz": 21, "surahs": [{"nomor": 33, "nama": "Al-Ahzab", "ayatAwal": 23, "ayatAkhir": 30}]}, {"halaman": 422, "juz": 22, "surahs": [{"nomor": 33, "nama": "Al-Ahzab", "ayatAwal": 31, "ayatAkhir": 35}]}, {"halaman": 423, "juz": 22, "surahs": [{"nomor": 33, "nama": "Al-Ahzab", "ayatAwal": 36, "ayatAkhir": 43}]}, {"halaman": 424, "juz": 22, "surahs": [{"nomor": 33, "nama": "Al-Ahzab", "ayatAwal": 44, "ayatAkhir": 50}]}, {"halaman": 425, "juz": 22, "surahs": [{"nomor": 33, "nama": "Al-Ahzab", "ayatAwal": 51, "ayatAkhir": 54}]}, {"halaman": 426, "juz": 22, "surahs": [{"nomor": 33, "nama": "Al-Ahzab", "ayatAwal": 55, "ayatAkhir": 62}]}, {"halaman": 427, "juz": 22, "surahs": [{"nomor": 33, "nama": "Al-Ahzab", "ayatAwal": 63, "ayatAkhir": 73}]}, {"halaman": 428, "juz": 22, "surahs": [{"nomor": 34, "nama": "Saba", "ayatAwal": 1, "ayatAkhir": 7}]}, {"halaman": 429, "juz": 22, "surahs": [{"nomor": 34, "nama": "Saba", "ayatAwal": 8, "ayatAkhir": 14}]}, {"halaman": 430, "juz": 22, "surahs": [{"nomor": 34, "nama": "Saba", "ayatAwal": 15, "ayatAkhir": 22}]}, {"halaman": 431, "juz": 22, "surahs": [{"nomor": 34, "nama": "Saba", "ayatAwal": 23, "ayatAkhir": 31}]}, {"halaman": 432, "juz": 22, "surahs": [{"nomor": 34, "nama": "Saba", "ayatAwal": 32, "ayatAkhir": 39}]}, {"halaman": 433, "juz": 22, "surahs": [{"nomor": 34, "nama": "Saba", "ayatAwal": 40, "ayatAkhir": 48}]}, {"halaman": 434, "juz": 22, "surahs": [{"nomor": 34, "nama": "Saba", "ayatAwal": 49, "ayatAkhir": 54}, {"nomor": 35, "nama": "Fatir", "ayatAwal": 1, "ayatAkhir": 3}]}, {"halaman": 435, "juz": 22, "surahs": [{"nomor": 35, "nama": "Fatir", "ayatAwal": 4, "ayatAkhir": 11}]}, {"halaman": 436, "juz": 22, "surahs": [{"nomor": 35, "nama": "Fatir", "ayatAwal": 12, "ayatAkhir": 18}]}, {"halaman": 437, "juz": 22, "surahs": [{"nomor": 35, "nama": "Fatir", "ayatAwal": 19, "ayatAkhir": 30}]}, {"halaman": 438, "juz": 22, "surahs": [{"nomor": 35, "nama": "Fatir", "ayatAwal": 31, "ayatAkhir": 38}]}, {"halaman": 439, "juz": 22, "surahs": [{"nomor": 35, "nama": "Fatir", "ayatAwal": 39, "ayatAkhir": 44}]}, {"halaman": 440, "juz": 22, "surahs": [{"nomor": 35, "nama": "Fatir", "ayatAwal": 45, "ayatAkhir": 45}, {"nomor": 36, "nama": "Yasin", "ayatAwal": 1, "ayatAkhir": 12}]}, {"halaman": 441, "juz": 22, "surahs": [{"nomor": 36, "nama": "Yasin", "ayatAwal": 13, "ayatAkhir": 27}]}, {"halaman": 442, "juz": 23, "surahs": [{"nomor": 36, "nama": "Yasin", "ayatAwal": 28, "ayatAkhir": 40}]}, {"halaman": 443, "juz": 23, "surahs": [{"nomor": 36, "nama": "Yasin", "ayatAwal": 41, "ayatAkhir": 54}]}, {"halaman": 444, "juz": 23, "surahs": [{"nomor": 36, "nama": "Yasin", "ayatAwal": 55, "ayatAkhir": 70}]}, {"halaman": 445, "juz": 23, "surahs": [{"nomor": 36, "nama": "Yasin", "ayatAwal": 71, "ayatAkhir": 83}]}, {"halaman": 446, "juz": 23, "surahs": [{"nomor": 37, "nama": "As-Saffat", "ayatAwal": 1, "ayatAkhir": 24}]}, {"halaman": 447, "juz": 23, "surahs": [{"nomor": 37, "nama": "As-Saffat", "ayatAwal": 25, "ayatAkhir": 51}]}, {"halaman": 448, "juz": 23, "surahs": [{"nomor": 37, "nama": "As-Saffat", "ayatAwal": 52, "ayatAkhir": 76}]}, {"halaman": 449, "juz": 23, "surahs": [{"nomor": 37, "nama": "As-Saffat", "ayatAwal": 77, "ayatAkhir": 102}]}, {"halaman": 450, "juz": 23, "surahs": [{"nomor": 37, "nama": "As-Saffat", "ayatAwal": 103, "ayatAkhir": 126}]}, {"halaman": 451, "juz": 23, "surahs": [{"nomor": 37, "nama": "As-Saffat", "ayatAwal": 127, "ayatAkhir": 153}]}, {"halaman": 452, "juz": 23, "surahs": [{"nomor": 37, "nama": "As-Saffat", "ayatAwal": 154, "ayatAkhir": 182}]}, {"halaman": 453, "juz": 23, "surahs": [{"nomor": 38, "nama": "Sad", "ayatAwal": 1, "ayatAkhir": 16}]}, {"halaman": 454, "juz": 23, "surahs": [{"nomor": 38, "nama": "Sad", "ayatAwal": 17, "ayatAkhir": 26}]}, {"halaman": 455, "juz": 23, "surahs": [{"nomor": 38, "nama": "Sad", "ayatAwal": 27, "ayatAkhir": 42}]}, {"halaman": 456, "juz": 23, "surahs": [{"nomor": 38, "nama": "Sad", "ayatAwal": 43, "ayatAkhir": 61}]}, {"halaman": 457, "juz": 23, "surahs": [{"nomor": 38, "nama": "Sad", "ayatAwal": 62, "ayatAkhir": 83}]}, {"halaman": 458, "juz": 23, "surahs": [{"nomor": 38, "nama": "Sad", "ayatAwal": 84, "ayatAkhir": 88}, {"nomor": 39, "nama": "Az-Zumar", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 459, "juz": 23, "surahs": [{"nomor": 39, "nama": "Az-Zumar", "ayatAwal": 6, "ayatAkhir": 10}]}, {"halaman": 460, "juz": 23, "surahs": [{"nomor": 39, "nama": "Az-Zumar", "ayatAwal": 11, "ayatAkhir": 21}]}, {"halaman": 461, "juz": 23, "surahs": [{"nomor": 39, "nama": "Az-Zumar", "ayatAwal": 22, "ayatAkhir": 31}]}, {"halaman": 462, "juz": 24, "surahs": [{"nomor": 39, "nama": "Az-Zumar", "ayatAwal": 32, "ayatAkhir": 40}]}, {"halaman": 463, "juz": 24, "surahs": [{"nomor": 39, "nama": "Az-Zumar", "ayatAwal": 41, "ayatAkhir": 47}]}, {"halaman": 464, "juz": 24, "surahs": [{"nomor": 39, "nama": "Az-Zumar", "ayatAwal": 48, "ayatAkhir": 56}]}, {"halaman": 465, "juz": 24, "surahs": [{"nomor": 39, "nama": "Az-Zumar", "ayatAwal": 57, "ayatAkhir": 67}]}, {"halaman": 466, "juz": 24, "surahs": [{"nomor": 39, "nama": "Az-Zumar", "ayatAwal": 68, "ayatAkhir": 74}]}, {"halaman": 467, "juz": 24, "surahs": [{"nomor": 39, "nama": "Az-Zumar", "ayatAwal": 75, "ayatAkhir": 75}, {"nomor": 40, "nama": "Ghafir", "ayatAwal": 1, "ayatAkhir": 7}]}, {"halaman": 468, "juz": 24, "surahs": [{"nomor": 40, "nama": "Ghafir", "ayatAwal": 8, "ayatAkhir": 16}]}, {"halaman": 469, "juz": 24, "surahs": [{"nomor": 40, "nama": "Ghafir", "ayatAwal": 17, "ayatAkhir": 25}]}, {"halaman": 470, "juz": 24, "surahs": [{"nomor": 40, "nama": "Ghafir", "ayatAwal": 26, "ayatAkhir": 33}]}, {"halaman": 471, "juz": 24, "surahs": [{"nomor": 40, "nama": "Ghafir", "ayatAwal": 34, "ayatAkhir": 40}]}, {"halaman": 472, "juz": 24, "surahs": [{"nomor": 40, "nama": "Ghafir", "ayatAwal": 41, "ayatAkhir": 49}]}, {"halaman": 473, "juz": 24, "surahs": [{"nomor": 40, "nama": "Ghafir", "ayatAwal": 50, "ayatAkhir": 58}]}, {"halaman": 474, "juz": 24, "surahs": [{"nomor": 40, "nama": "Ghafir", "ayatAwal": 59, "ayatAkhir": 66}]}, {"halaman": 475, "juz": 24, "surahs": [{"nomor": 40, "nama": "Ghafir", "ayatAwal": 67, "ayatAkhir": 77}]}, {"halaman": 476, "juz": 24, "surahs": [{"nomor": 40, "nama": "Ghafir", "ayatAwal": 78, "ayatAkhir": 85}]}, {"halaman": 477, "juz": 24, "surahs": [{"nomor": 41, "nama": "Fussilat", "ayatAwal": 1, "ayatAkhir": 11}]}, {"halaman": 478, "juz": 24, "surahs": [{"nomor": 41, "nama": "Fussilat", "ayatAwal": 12, "ayatAkhir": 20}]}, {"halaman": 479, "juz": 24, "surahs": [{"nomor": 41, "nama": "Fussilat", "ayatAwal": 21, "ayatAkhir": 29}]}, {"halaman": 480, "juz": 24, "surahs": [{"nomor": 41, "nama": "Fussilat", "ayatAwal": 30, "ayatAkhir": 38}]}, {"halaman": 481, "juz": 24, "surahs": [{"nomor": 41, "nama": "Fussilat", "ayatAwal": 39, "ayatAkhir": 46}]}, {"halaman": 482, "juz": 25, "surahs": [{"nomor": 41, "nama": "Fussilat", "ayatAwal": 47, "ayatAkhir": 54}]}, {"halaman": 483, "juz": 25, "surahs": [{"nomor": 42, "nama": "Ash-Shura", "ayatAwal": 1, "ayatAkhir": 10}]}, {"halaman": 484, "juz": 25, "surahs": [{"nomor": 42, "nama": "Ash-Shura", "ayatAwal": 11, "ayatAkhir": 15}]}, {"halaman": 485, "juz": 25, "surahs": [{"nomor": 42, "nama": "Ash-Shura", "ayatAwal": 16, "ayatAkhir": 22}]}, {"halaman": 486, "juz": 25, "surahs": [{"nomor": 42, "nama": "Ash-Shura", "ayatAwal": 23, "ayatAkhir": 31}]}, {"halaman": 487, "juz": 25, "surahs": [{"nomor": 42, "nama": "Ash-Shura", "ayatAwal": 32, "ayatAkhir": 44}]}, {"halaman": 488, "juz": 25, "surahs": [{"nomor": 42, "nama": "Ash-Shura", "ayatAwal": 45, "ayatAkhir": 51}]}, {"halaman": 489, "juz": 25, "surahs": [{"nomor": 42, "nama": "Ash-Shura", "ayatAwal": 52, "ayatAkhir": 53}, {"nomor": 43, "nama": "Az-Zukhruf", "ayatAwal": 1, "ayatAkhir": 10}]}, {"halaman": 490, "juz": 25, "surahs": [{"nomor": 43, "nama": "Az-Zukhruf", "ayatAwal": 11, "ayatAkhir": 22}]}, {"halaman": 491, "juz": 25, "surahs": [{"nomor": 43, "nama": "Az-Zukhruf", "ayatAwal": 23, "ayatAkhir": 33}]}, {"halaman": 492, "juz": 25, "surahs": [{"nomor": 43, "nama": "Az-Zukhruf", "ayatAwal": 34, "ayatAkhir": 47}]}, {"halaman": 493, "juz": 25, "surahs": [{"nomor": 43, "nama": "Az-Zukhruf", "ayatAwal": 48, "ayatAkhir": 60}]}, {"halaman": 494, "juz": 25, "surahs": [{"nomor": 43, "nama": "Az-Zukhruf", "ayatAwal": 61, "ayatAkhir": 73}]}, {"halaman": 495, "juz": 25, "surahs": [{"nomor": 43, "nama": "Az-Zukhruf", "ayatAwal": 74, "ayatAkhir": 89}]}, {"halaman": 496, "juz": 25, "surahs": [{"nomor": 44, "nama": "Ad-Dukhan", "ayatAwal": 1, "ayatAkhir": 18}]}, {"halaman": 497, "juz": 25, "surahs": [{"nomor": 44, "nama": "Ad-Dukhan", "ayatAwal": 19, "ayatAkhir": 39}]}, {"halaman": 498, "juz": 25, "surahs": [{"nomor": 44, "nama": "Ad-Dukhan", "ayatAwal": 40, "ayatAkhir": 59}]}, {"halaman": 499, "juz": 25, "surahs": [{"nomor": 45, "nama": "Al-Jathiya", "ayatAwal": 1, "ayatAkhir": 13}]}, {"halaman": 500, "juz": 25, "surahs": [{"nomor": 45, "nama": "Al-Jathiya", "ayatAwal": 14, "ayatAkhir": 22}]}, {"halaman": 501, "juz": 25, "surahs": [{"nomor": 45, "nama": "Al-Jathiya", "ayatAwal": 23, "ayatAkhir": 32}]}, {"halaman": 502, "juz": 25, "surahs": [{"nomor": 45, "nama": "Al-Jathiya", "ayatAwal": 33, "ayatAkhir": 37}, {"nomor": 46, "nama": "Al-Ahqaf", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 503, "juz": 26, "surahs": [{"nomor": 46, "nama": "Al-Ahqaf", "ayatAwal": 6, "ayatAkhir": 14}]}, {"halaman": 504, "juz": 26, "surahs": [{"nomor": 46, "nama": "Al-Ahqaf", "ayatAwal": 15, "ayatAkhir": 20}]}, {"halaman": 505, "juz": 26, "surahs": [{"nomor": 46, "nama": "Al-Ahqaf", "ayatAwal": 21, "ayatAkhir": 28}]}, {"halaman": 506, "juz": 26, "surahs": [{"nomor": 46, "nama": "Al-Ahqaf", "ayatAwal": 29, "ayatAkhir": 35}]}, {"halaman": 507, "juz": 26, "surahs": [{"nomor": 47, "nama": "Muhammad", "ayatAwal": 1, "ayatAkhir": 11}]}, {"halaman": 508, "juz": 26, "surahs": [{"nomor": 47, "nama": "Muhammad", "ayatAwal": 12, "ayatAkhir": 19}]}, {"halaman": 509, "juz": 26, "surahs": [{"nomor": 47, "nama": "Muhammad", "ayatAwal": 20, "ayatAkhir": 29}]}, {"halaman": 510, "juz": 26, "surahs": [{"nomor": 47, "nama": "Muhammad", "ayatAwal": 30, "ayatAkhir": 38}]}, {"halaman": 511, "juz": 26, "surahs": [{"nomor": 48, "nama": "Al-Fath", "ayatAwal": 1, "ayatAkhir": 9}]}, {"halaman": 512, "juz": 26, "surahs": [{"nomor": 48, "nama": "Al-Fath", "ayatAwal": 10, "ayatAkhir": 15}]}, {"halaman": 513, "juz": 26, "surahs": [{"nomor": 48, "nama": "Al-Fath", "ayatAwal": 16, "ayatAkhir": 23}]}, {"halaman": 514, "juz": 26, "surahs": [{"nomor": 48, "nama": "Al-Fath", "ayatAwal": 24, "ayatAkhir": 28}]}, {"halaman": 515, "juz": 26, "surahs": [{"nomor": 48, "nama": "Al-Fath", "ayatAwal": 29, "ayatAkhir": 29}, {"nomor": 49, "nama": "Al-Hujurat", "ayatAwal": 1, "ayatAkhir": 4}]}, {"halaman": 516, "juz": 26, "surahs": [{"nomor": 49, "nama": "Al-Hujurat", "ayatAwal": 5, "ayatAkhir": 11}]}, {"halaman": 517, "juz": 26, "surahs": [{"nomor": 49, "nama": "Al-Hujurat", "ayatAwal": 12, "ayatAkhir": 18}]}, {"halaman": 518, "juz": 26, "surahs": [{"nomor": 50, "nama": "Qaf", "ayatAwal": 1, "ayatAkhir": 15}]}, {"halaman": 519, "juz": 26, "surahs": [{"nomor": 50, "nama": "Qaf", "ayatAwal": 16, "ayatAkhir": 35}]}, {"halaman": 520, "juz": 26, "surahs": [{"nomor": 50, "nama": "Qaf", "ayatAwal": 36, "ayatAkhir": 45}, {"nomor": 51, "nama": "Az-Zariyat", "ayatAwal": 1, "ayatAkhir": 6}]}, {"halaman": 521, "juz": 26, "surahs": [{"nomor": 51, "nama": "Az-Zariyat", "ayatAwal": 7, "ayatAkhir": 30}]}, {"halaman": 522, "juz": 27, "surahs": [{"nomor": 51, "nama": "Az-Zariyat", "ayatAwal": 31, "ayatAkhir": 51}]}, {"halaman": 523, "juz": 27, "surahs": [{"nomor": 51, "nama": "Az-Zariyat", "ayatAwal": 52, "ayatAkhir": 60}, {"nomor": 52, "nama": "At-Tur", "ayatAwal": 1, "ayatAkhir": 14}]}, {"halaman": 524, "juz": 27, "surahs": [{"nomor": 52, "nama": "At-Tur", "ayatAwal": 15, "ayatAkhir": 31}]}, {"halaman": 525, "juz": 27, "surahs": [{"nomor": 52, "nama": "At-Tur", "ayatAwal": 32, "ayatAkhir": 49}]}, {"halaman": 526, "juz": 27, "surahs": [{"nomor": 53, "nama": "An-Najm", "ayatAwal": 1, "ayatAkhir": 26}]}, {"halaman": 527, "juz": 27, "surahs": [{"nomor": 53, "nama": "An-Najm", "ayatAwal": 27, "ayatAkhir": 44}]}, {"halaman": 528, "juz": 27, "surahs": [{"nomor": 53, "nama": "An-Najm", "ayatAwal": 45, "ayatAkhir": 62}, {"nomor": 54, "nama": "Al-Qamar", "ayatAwal": 1, "ayatAkhir": 6}]}, {"halaman": 529, "juz": 27, "surahs": [{"nomor": 54, "nama": "Al-Qamar", "ayatAwal": 7, "ayatAkhir": 27}]}, {"halaman": 530, "juz": 27, "surahs": [{"nomor": 54, "nama": "Al-Qamar", "ayatAwal": 28, "ayatAkhir": 49}]}, {"halaman": 531, "juz": 27, "surahs": [{"nomor": 54, "nama": "Al-Qamar", "ayatAwal": 50, "ayatAkhir": 55}, {"nomor": 55, "nama": "Ar-Rahman", "ayatAwal": 1, "ayatAkhir": 16}]}, {"halaman": 532, "juz": 27, "surahs": [{"nomor": 55, "nama": "Ar-Rahman", "ayatAwal": 17, "ayatAkhir": 40}]}, {"halaman": 533, "juz": 27, "surahs": [{"nomor": 55, "nama": "Ar-Rahman", "ayatAwal": 41, "ayatAkhir": 67}]}, {"halaman": 534, "juz": 27, "surahs": [{"nomor": 55, "nama": "Ar-Rahman", "ayatAwal": 68, "ayatAkhir": 78}, {"nomor": 56, "nama": "Al-Waqia", "ayatAwal": 1, "ayatAkhir": 16}]}, {"halaman": 535, "juz": 27, "surahs": [{"nomor": 56, "nama": "Al-Waqia", "ayatAwal": 17, "ayatAkhir": 50}]}, {"halaman": 536, "juz": 27, "surahs": [{"nomor": 56, "nama": "Al-Waqia", "ayatAwal": 51, "ayatAkhir": 76}]}, {"halaman": 537, "juz": 27, "surahs": [{"nomor": 56, "nama": "Al-Waqia", "ayatAwal": 77, "ayatAkhir": 96}, {"nomor": 57, "nama": "Al-Hadid", "ayatAwal": 1, "ayatAkhir": 3}]}, {"halaman": 538, "juz": 27, "surahs": [{"nomor": 57, "nama": "Al-Hadid", "ayatAwal": 4, "ayatAkhir": 11}]}, {"halaman": 539, "juz": 27, "surahs": [{"nomor": 57, "nama": "Al-Hadid", "ayatAwal": 12, "ayatAkhir": 18}]}, {"halaman": 540, "juz": 27, "surahs": [{"nomor": 57, "nama": "Al-Hadid", "ayatAwal": 19, "ayatAkhir": 24}]}, {"halaman": 541, "juz": 27, "surahs": [{"nomor": 57, "nama": "Al-Hadid", "ayatAwal": 25, "ayatAkhir": 29}]}, {"halaman": 542, "juz": 28, "surahs": [{"nomor": 58, "nama": "Al-Mujadilah", "ayatAwal": 1, "ayatAkhir": 6}]}, {"halaman": 543, "juz": 28, "surahs": [{"nomor": 58, "nama": "Al-Mujadilah", "ayatAwal": 7, "ayatAkhir": 11}]}, {"halaman": 544, "juz": 28, "surahs": [{"nomor": 58, "nama": "Al-Mujadilah", "ayatAwal": 12, "ayatAkhir": 21}]}, {"halaman": 545, "juz": 28, "surahs": [{"nomor": 58, "nama": "Al-Mujadilah", "ayatAwal": 22, "ayatAkhir": 22}, {"nomor": 59, "nama": "Al-Hashr", "ayatAwal": 1, "ayatAkhir": 3}]}, {"halaman": 546, "juz": 28, "surahs": [{"nomor": 59, "nama": "Al-Hashr", "ayatAwal": 4, "ayatAkhir": 9}]}, {"halaman": 547, "juz": 28, "surahs": [{"nomor": 59, "nama": "Al-Hashr", "ayatAwal": 10, "ayatAkhir": 16}]}, {"halaman": 548, "juz": 28, "surahs": [{"nomor": 59, "nama": "Al-Hashr", "ayatAwal": 17, "ayatAkhir": 24}]}, {"halaman": 549, "juz": 28, "surahs": [{"nomor": 60, "nama": "Al-Mumtahinah", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 550, "juz": 28, "surahs": [{"nomor": 60, "nama": "Al-Mumtahinah", "ayatAwal": 6, "ayatAkhir": 11}]}, {"halaman": 551, "juz": 28, "surahs": [{"nomor": 60, "nama": "Al-Mumtahinah", "ayatAwal": 12, "ayatAkhir": 13}, {"nomor": 61, "nama": "As-Saff", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 552, "juz": 28, "surahs": [{"nomor": 61, "nama": "As-Saff", "ayatAwal": 6, "ayatAkhir": 14}]}, {"halaman": 553, "juz": 28, "surahs": [{"nomor": 62, "nama": "Al-Jumu'ah", "ayatAwal": 1, "ayatAkhir": 8}]}, {"halaman": 554, "juz": 28, "surahs": [{"nomor": 62, "nama": "Al-Jumu'ah", "ayatAwal": 9, "ayatAkhir": 11}, {"nomor": 63, "nama": "Al-Munafiqun", "ayatAwal": 1, "ayatAkhir": 4}]}, {"halaman": 555, "juz": 28, "surahs": [{"nomor": 63, "nama": "Al-Munafiqun", "ayatAwal": 5, "ayatAkhir": 11}]}, {"halaman": 556, "juz": 28, "surahs": [{"nomor": 64, "nama": "At-Taghabun", "ayatAwal": 1, "ayatAkhir": 9}]}, {"halaman": 557, "juz": 28, "surahs": [{"nomor": 64, "nama": "At-Taghabun", "ayatAwal": 10, "ayatAkhir": 18}]}, {"halaman": 558, "juz": 28, "surahs": [{"nomor": 65, "nama": "At-Talaq", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 559, "juz": 28, "surahs": [{"nomor": 65, "nama": "At-Talaq", "ayatAwal": 6, "ayatAkhir": 12}]}, {"halaman": 560, "juz": 28, "surahs": [{"nomor": 66, "nama": "At-Tahrim", "ayatAwal": 1, "ayatAkhir": 7}]}, {"halaman": 561, "juz": 28, "surahs": [{"nomor": 66, "nama": "At-Tahrim", "ayatAwal": 8, "ayatAkhir": 12}]}, {"halaman": 562, "juz": 29, "surahs": [{"nomor": 67, "nama": "Al-Mulk", "ayatAwal": 1, "ayatAkhir": 12}]}, {"halaman": 563, "juz": 29, "surahs": [{"nomor": 67, "nama": "Al-Mulk", "ayatAwal": 13, "ayatAkhir": 26}]}, {"halaman": 564, "juz": 29, "surahs": [{"nomor": 67, "nama": "Al-Mulk", "ayatAwal": 27, "ayatAkhir": 30}, {"nomor": 68, "nama": "Al-Qalam", "ayatAwal": 1, "ayatAkhir": 15}]}, {"halaman": 565, "juz": 29, "surahs": [{"nomor": 68, "nama": "Al-Qalam", "ayatAwal": 16, "ayatAkhir": 42}]}, {"halaman": 566, "juz": 29, "surahs": [{"nomor": 68, "nama": "Al-Qalam", "ayatAwal": 43, "ayatAkhir": 52}, {"nomor": 69, "nama": "Al-Haqqah", "ayatAwal": 1, "ayatAkhir": 8}]}, {"halaman": 567, "juz": 29, "surahs": [{"nomor": 69, "nama": "Al-Haqqah", "ayatAwal": 9, "ayatAkhir": 34}]}, {"halaman": 568, "juz": 29, "surahs": [{"nomor": 69, "nama": "Al-Haqqah", "ayatAwal": 35, "ayatAkhir": 52}, {"nomor": 70, "nama": "Al-Ma'arij", "ayatAwal": 1, "ayatAkhir": 10}]}, {"halaman": 569, "juz": 29, "surahs": [{"nomor": 70, "nama": "Al-Ma'arij", "ayatAwal": 11, "ayatAkhir": 39}]}, {"halaman": 570, "juz": 29, "surahs": [{"nomor": 70, "nama": "Al-Ma'arij", "ayatAwal": 40, "ayatAkhir": 44}, {"nomor": 71, "nama": "Nuh", "ayatAwal": 1, "ayatAkhir": 10}]}, {"halaman": 571, "juz": 29, "surahs": [{"nomor": 71, "nama": "Nuh", "ayatAwal": 11, "ayatAkhir": 28}]}, {"halaman": 572, "juz": 29, "surahs": [{"nomor": 72, "nama": "Al-Jinn", "ayatAwal": 1, "ayatAkhir": 13}]}, {"halaman": 573, "juz": 29, "surahs": [{"nomor": 72, "nama": "Al-Jinn", "ayatAwal": 14, "ayatAkhir": 28}]}, {"halaman": 574, "juz": 29, "surahs": [{"nomor": 73, "nama": "Al-Muzzammil", "ayatAwal": 1, "ayatAkhir": 19}]}, {"halaman": 575, "juz": 29, "surahs": [{"nomor": 73, "nama": "Al-Muzzammil", "ayatAwal": 20, "ayatAkhir": 20}, {"nomor": 74, "nama": "Al-Muddaththir", "ayatAwal": 1, "ayatAkhir": 17}]}, {"halaman": 576, "juz": 29, "surahs": [{"nomor": 74, "nama": "Al-Muddaththir", "ayatAwal": 18, "ayatAkhir": 47}]}, {"halaman": 577, "juz": 29, "surahs": [{"nomor": 74, "nama": "Al-Muddaththir", "ayatAwal": 48, "ayatAkhir": 56}, {"nomor": 75, "nama": "Al-Qiyamah", "ayatAwal": 1, "ayatAkhir": 19}]}, {"halaman": 578, "juz": 29, "surahs": [{"nomor": 75, "nama": "Al-Qiyamah", "ayatAwal": 20, "ayatAkhir": 40}, {"nomor": 76, "nama": "Al-Insan", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 579, "juz": 29, "surahs": [{"nomor": 76, "nama": "Al-Insan", "ayatAwal": 6, "ayatAkhir": 25}]}, {"halaman": 580, "juz": 29, "surahs": [{"nomor": 76, "nama": "Al-Insan", "ayatAwal": 26, "ayatAkhir": 31}, {"nomor": 77, "nama": "Al-Mursalat", "ayatAwal": 1, "ayatAkhir": 19}]}, {"halaman": 581, "juz": 29, "surahs": [{"nomor": 77, "nama": "Al-Mursalat", "ayatAwal": 20, "ayatAkhir": 50}]}, {"halaman": 582, "juz": 30, "surahs": [{"nomor": 78, "nama": "An-Naba", "ayatAwal": 1, "ayatAkhir": 30}]}, {"halaman": 583, "juz": 30, "surahs": [{"nomor": 78, "nama": "An-Naba", "ayatAwal": 31, "ayatAkhir": 40}, {"nomor": 79, "nama": "An-Naziat", "ayatAwal": 1, "ayatAkhir": 15}]}, {"halaman": 584, "juz": 30, "surahs": [{"nomor": 79, "nama": "An-Naziat", "ayatAwal": 16, "ayatAkhir": 46}]}, {"halaman": 585, "juz": 30, "surahs": [{"nomor": 80, "nama": "Abasa", "ayatAwal": 1, "ayatAkhir": 42}]}, {"halaman": 586, "juz": 30, "surahs": [{"nomor": 81, "nama": "At-Takwir", "ayatAwal": 1, "ayatAkhir": 29}]}, {"halaman": 587, "juz": 30, "surahs": [{"nomor": 82, "nama": "Al-Infitar", "ayatAwal": 1, "ayatAkhir": 19}, {"nomor": 83, "nama": "Al-Mutaffifin", "ayatAwal": 1, "ayatAkhir": 6}]}, {"halaman": 588, "juz": 30, "surahs": [{"nomor": 83, "nama": "Al-Mutaffifin", "ayatAwal": 7, "ayatAkhir": 34}]}, {"halaman": 589, "juz": 30, "surahs": [{"nomor": 83, "nama": "Al-Mutaffifin", "ayatAwal": 35, "ayatAkhir": 36}, {"nomor": 84, "nama": "Al-Inshiqaq", "ayatAwal": 1, "ayatAkhir": 25}]}, {"halaman": 590, "juz": 30, "surahs": [{"nomor": 85, "nama": "Al-Buruj", "ayatAwal": 1, "ayatAkhir": 22}]}, {"halaman": 591, "juz": 30, "surahs": [{"nomor": 86, "nama": "At-Tariq", "ayatAwal": 1, "ayatAkhir": 17}, {"nomor": 87, "nama": "Al-Ala", "ayatAwal": 1, "ayatAkhir": 15}]}, {"halaman": 592, "juz": 30, "surahs": [{"nomor": 87, "nama": "Al-Ala", "ayatAwal": 16, "ayatAkhir": 19}, {"nomor": 88, "nama": "Al-Ghashiyah", "ayatAwal": 1, "ayatAkhir": 26}]}, {"halaman": 593, "juz": 30, "surahs": [{"nomor": 89, "nama": "Al-Fajr", "ayatAwal": 1, "ayatAkhir": 23}]}, {"halaman": 594, "juz": 30, "surahs": [{"nomor": 89, "nama": "Al-Fajr", "ayatAwal": 24, "ayatAkhir": 30}, {"nomor": 90, "nama": "Al-Balad", "ayatAwal": 1, "ayatAkhir": 20}]}, {"halaman": 595, "juz": 30, "surahs": [{"nomor": 91, "nama": "Ash-Shams", "ayatAwal": 1, "ayatAkhir": 15}, {"nomor": 92, "nama": "Al-Lail", "ayatAwal": 1, "ayatAkhir": 14}]}, {"halaman": 596, "juz": 30, "surahs": [{"nomor": 92, "nama": "Al-Lail", "ayatAwal": 15, "ayatAkhir": 21}, {"nomor": 93, "nama": "Ad-Duha", "ayatAwal": 1, "ayatAkhir": 11}, {"nomor": 94, "nama": "Ash-Sharh", "ayatAwal": 1, "ayatAkhir": 8}]}, {"halaman": 597, "juz": 30, "surahs": [{"nomor": 95, "nama": "At-Tin", "ayatAwal": 1, "ayatAkhir": 8}, {"nomor": 96, "nama": "Al-Alaq", "ayatAwal": 1, "ayatAkhir": 19}]}, {"halaman": 598, "juz": 30, "surahs": [{"nomor": 97, "nama": "Al-Qadr", "ayatAwal": 1, "ayatAkhir": 5}, {"nomor": 98, "nama": "Al-Bayinah", "ayatAwal": 1, "ayatAkhir": 7}]}, {"halaman": 599, "juz": 30, "surahs": [{"nomor": 98, "nama": "Al-Bayinah", "ayatAwal": 8, "ayatAkhir": 8}, {"nomor": 99, "nama": "Az-Zalzalah", "ayatAwal": 1, "ayatAkhir": 8}, {"nomor": 100, "nama": "Al-Adiyat", "ayatAwal": 1, "ayatAkhir": 9}]}, {"halaman": 600, "juz": 30, "surahs": [{"nomor": 100, "nama": "Al-Adiyat", "ayatAwal": 10, "ayatAkhir": 11}, {"nomor": 101, "nama": "Al-Qariah", "ayatAwal": 1, "ayatAkhir": 11}, {"nomor": 102, "nama": "Al-Takathur", "ayatAwal": 1, "ayatAkhir": 8}]}, {"halaman": 601, "juz": 30, "surahs": [{"nomor": 103, "nama": "Al-Asr", "ayatAwal": 1, "ayatAkhir": 3}, {"nomor": 104, "nama": "Al-Humazah", "ayatAwal": 1, "ayatAkhir": 9}, {"nomor": 105, "nama": "Al-Fil", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 602, "juz": 30, "surahs": [{"nomor": 106, "nama": "Quraish", "ayatAwal": 1, "ayatAkhir": 4}, {"nomor": 107, "nama": "Al-Ma'un", "ayatAwal": 1, "ayatAkhir": 7}, {"nomor": 108, "nama": "Al-Kauthar", "ayatAwal": 1, "ayatAkhir": 3}]}, {"halaman": 603, "juz": 30, "surahs": [{"nomor": 109, "nama": "Al-Kafirun", "ayatAwal": 1, "ayatAkhir": 6}, {"nomor": 110, "nama": "An-Nasr", "ayatAwal": 1, "ayatAkhir": 3}, {"nomor": 111, "nama": "Al-Masad", "ayatAwal": 1, "ayatAkhir": 5}]}, {"halaman": 604, "juz": 30, "surahs": [{"nomor": 112, "nama": "Al-Ikhlas", "ayatAwal": 1, "ayatAkhir": 4}, {"nomor": 113, "nama": "Al-Falaq", "ayatAwal": 1, "ayatAkhir": 5}, {"nomor": 114, "nama": "An-Nas", "ayatAwal": 1, "ayatAkhir": 6}]}];

const surahByNomor = Object.fromEntries(SURAH_LIST.map((s) => [s.nomor, s]));

/**
 * Mengembalikan { halamanAwal, halamanAkhir } untuk juz tertentu (1-30).
 */
function getRentangHalamanJuz(juz) {
  const entry = JUZ_TABLE.find((j) => j.juz === juz);
  if (!entry) throw new Error(`Juz tidak valid: ${juz}`);
  return { halamanAwal: entry.halamanAwal, halamanAkhir: entry.halamanAkhir };
}

/**
 * Jumlah halaman relatif maksimal untuk juz tertentu.
 * Dipakai UI untuk membatasi input halaman (mis. 1-20, atau 1-23 untuk Juz 30).
 */
function getMaksimalHalamanRelatif(juz) {
  const { halamanAwal, halamanAkhir } = getRentangHalamanJuz(juz);
  return halamanAkhir - halamanAwal + 1;
}

/**
 * Mengonversi (juz, halamanRelatif) -> halaman absolut (1-604).
 * halamanRelatif dimulai dari 1. Mengembalikan null jika melebihi batas juz ini
 * (sinyal bagi UI untuk memicu alur "Tambah Setoran Lanjutan").
 */
function halamanRelatifKeAbsolut(juz, halamanRelatif) {
  const { halamanAwal, halamanAkhir } = getRentangHalamanJuz(juz);
  const absolut = halamanAwal + halamanRelatif - 1;
  return absolut > halamanAkhir ? null : absolut;
}

/**
 * Mengonversi halaman absolut -> { juz, halamanRelatif, maksimalHalamanRelatif }.
 */
function halamanAbsolutKeRelatif(halamanAbsolut) {
  const entry = JUZ_TABLE.find(
    (j) => halamanAbsolut >= j.halamanAwal && halamanAbsolut <= j.halamanAkhir
  );
  if (!entry) throw new Error(`Halaman absolut tidak valid: ${halamanAbsolut}`);
  return {
    juz: entry.juz,
    halamanRelatif: halamanAbsolut - entry.halamanAwal + 1,
    maksimalHalamanRelatif: entry.halamanAkhir - entry.halamanAwal + 1,
  };
}

/**
 * Daftar surah (dengan rentang ayat pada halaman tsb) yang muncul di satu halaman absolut.
 * Satu halaman bisa berisi 1 atau lebih surah (umum terjadi di Juz 30).
 */
function getSurahDiHalaman(halamanAbsolut) {
  const page = PAGES_DATA.find((p) => p.halaman === halamanAbsolut);
  if (!page) throw new Error(`Halaman tidak ditemukan: ${halamanAbsolut}`);
  return page.surahs;
}

/**
 * Validasi nilai pecahan halaman. Hanya menerima bagian desimal 0, 0.25, 0.5, 0.75
 * (selaras dengan notasi ¼ ½ ¾ di UI). Mencegah typo seperti 12.3 tersimpan sebagai data valid.
 */
function isPecahanHalamanValid(nilai) {
  const desimal = Math.round((nilai % 1) * 100) / 100;
  return [0, 0.25, 0.5, 0.75].includes(desimal);
}

/**
 * Fungsi utama quranMapper: dari (juz, halamanRelatifMulai, halamanRelatifSelesai)
 * menghasilkan data lengkap untuk disimpan sebagai field `surahMeta` pada dokumen setoran.
 * Mengembalikan null jika halamanRelatifSelesai melebihi batas juz (caller menangani via
 * alur "Tambah Setoran Lanjutan", bukan menampilkan error keras ke Musyrifah).
 */
function buatSurahMeta(juz, halamanRelatifMulai, halamanRelatifSelesai) {
  const absolutMulai = halamanRelatifKeAbsolut(juz, halamanRelatifMulai);
  const absolutSelesai = halamanRelatifKeAbsolut(juz, halamanRelatifSelesai);
  if (absolutMulai === null || absolutSelesai === null) return null;

  return _surahMetaDariAbsolut(absolutMulai, absolutSelesai);
}

/**
 * ==========================================================================
 * EKSTENSI: rekam-jejak Ziyadah, presisi ayat, dan setoran lintas-juz
 * ==========================================================================
 */

/**
 * Inti pembacaan surah dari rentang halaman ABSOLUT (1-604), lepas dari
 * konsep "relatif per-juz". Dipakai bersama oleh buatSurahMeta() (dalam-juz)
 * dan buatSurahMetaLintasJuz() (lintas-juz) supaya labelnya selalu konsisten.
 */
function _surahMetaDariAbsolut(absolutMulai, absolutSelesai) {
  if (absolutMulai > absolutSelesai) {
    throw new Error("Halaman mulai tidak boleh lebih besar dari halaman selesai");
  }

  const surahMulai = getSurahDiHalaman(absolutMulai)[0];
  const surahSelesaiList = getSurahDiHalaman(absolutSelesai);
  const surahSelesai = surahSelesaiList[surahSelesaiList.length - 1];

  const ayatAwal = surahMulai.ayatAwal;
  const ayatAkhir = surahSelesai.ayatAkhir;

  let label;
  if (surahMulai.nomor === surahSelesai.nomor) {
    // Kasus umum: satu surah saja. Contoh: "An-Naba 1-30"
    label = `${surahMulai.nama} ${ayatAwal}-${ayatAkhir}`;
  } else {
    // Kasus lintas-surah dalam satu entri (mis. Juz 30 yang surahnya banyak & pendek,
    // atau setoran lintas-juz yang otomatis lintas-surah juga).
    const totalAyatSurahMulai = surahByNomor[surahMulai.nomor]?.totalAyat ?? ayatAwal;
    label = `${surahMulai.nama} ${ayatAwal}-${totalAyatSurahMulai} - ${surahSelesai.nama} 1-${ayatAkhir}`;
  }

  return {
    halamanAbsolutMulai: absolutMulai,
    halamanAbsolutSelesai: absolutSelesai,
    surahMulai: { nomor: surahMulai.nomor, nama: surahMulai.nama, ayat: ayatAwal },
    surahSelesai: { nomor: surahSelesai.nomor, nama: surahSelesai.nama, ayat: ayatAkhir },
    label,
  };
}

/**
 * (1) ZIYADAH — rekam jejak setoran kemarin.
 * Mengembalikan posisi ayat SETELAH (surahNomor, ayat), melompat otomatis
 * ke surah berikutnya bila ayat sudah di ayat terakhir surah tsb.
 * Mengembalikan null jika (surahNomor, ayat) sudah An-Nas 6 (khatam 30 juz).
 */
function ayatBerikutnya(surahNomor, ayat) {
  const surah = surahByNomor[surahNomor];
  if (!surah) throw new Error(`Surah tidak valid: ${surahNomor}`);
  if (ayat < 1 || ayat > surah.totalAyat) {
    throw new Error(`Ayat ${ayat} di luar rentang surah ${surah.nama} (1-${surah.totalAyat})`);
  }
  if (ayat < surah.totalAyat) {
    return { surahNomor, ayat: ayat + 1 };
  }
  const surahBerikut = surahByNomor[surahNomor + 1];
  return surahBerikut ? { surahNomor: surahBerikut.nomor, ayat: 1 } : null;
}

/**
 * (Prefill Ziyadah versi lengkap, memperhitungkan urutanHafalan custom,
 * didefinisikan lebih bawah sebagai prefillZiyadahBerikutnya().)
 */

/**
 * (2C/2D) SABQI & MANZIL — versi buatSurahMeta() yang mendukung rentang
 * LINTAS JUZ, mis. juz 29 halaman 18 s.d. juz 30 halaman 2. Menerima
 * (juz, halamanRelatif) di kedua ujung rentang secara independen, sehingga
 * otomatis juga menangani surah yang menyeberang batas juz (2D) karena
 * pembacaannya memakai getSurahDiHalaman() di ruang halaman absolut.
 */
function buatSurahMetaLintasJuz(juzMulai, halamanRelatifMulai, juzSelesai, halamanRelatifSelesai) {
  const absolutMulai = halamanRelatifKeAbsolut(juzMulai, halamanRelatifMulai);
  const absolutSelesai = halamanRelatifKeAbsolut(juzSelesai, halamanRelatifSelesai);
  if (absolutMulai === null || absolutSelesai === null) return null;

  const meta = _surahMetaDariAbsolut(absolutMulai, absolutSelesai);
  return { ...meta, juzMulai, juzSelesai, lintasJuz: juzMulai !== juzSelesai };
}

/**
 * Pembungkus praktis untuk form Sabqi/Manzil: otomatis memilih antara
 * buatSurahMeta (dalam-juz) dan buatSurahMetaLintasJuz (lintas-juz),
 * supaya UI cukup panggil satu fungsi ini tanpa perlu tahu kasus mana yang
 * sedang terjadi. Selalu mengembalikan field `lintasJuz` untuk ditampilkan.
 */
function buatSurahMetaOtomatis(juzMulai, halamanRelatifMulai, juzSelesai, halamanRelatifSelesai) {
  if (juzMulai === juzSelesai) {
    const hasil = buatSurahMeta(juzMulai, halamanRelatifMulai, halamanRelatifSelesai);
    if (hasil !== null) return { ...hasil, juzMulai, juzSelesai, lintasJuz: false };
    // halamanRelatifSelesai melebihi batas juzMulai -> jatuhkan ke jalur lintas-juz
  }
  return buatSurahMetaLintasJuz(juzMulai, halamanRelatifMulai, juzSelesai, halamanRelatifSelesai);
}

/**
 * (2B) Presisi ¼/½/¾ halaman — menerapkan override ayat manual (opsional)
 * dari ustadz di atas hasil auto-deteksi berbasis batas halaman penuh.
 * Dipakai saat setoran berhenti di TENGAH halaman, bukan di ujungnya, jadi
 * ayat hasil auto-deteksi (dari batas halaman) perlu dikoreksi manual.
 * Halaman & pecahan halaman tetap dipakai apa adanya sebagai metrik jumlah
 * bacaan; hanya label & rentang ayat presisi yang dikoreksi di sini.
 *
 * meta          : hasil dari buatSurahMeta / buatSurahMetaLintasJuz / buatSurahMetaOtomatis
 * overrideAwal  : { surahNomor, ayat } | null  (biarkan null jika tidak dikoreksi)
 * overrideAkhir : { surahNomor, ayat } | null
 */
function terapkanOverrideAyat(meta, overrideAwal, overrideAkhir) {
  if (!meta) return meta;

  const surahMulai = overrideAwal
    ? { nomor: overrideAwal.surahNomor, nama: surahByNomor[overrideAwal.surahNomor].nama, ayat: overrideAwal.ayat }
    : meta.surahMulai;
  const surahSelesai = overrideAkhir
    ? { nomor: overrideAkhir.surahNomor, nama: surahByNomor[overrideAkhir.surahNomor].nama, ayat: overrideAkhir.ayat }
    : meta.surahSelesai;

  let label;
  if (surahMulai.nomor === surahSelesai.nomor) {
    label = `${surahMulai.nama} ${surahMulai.ayat}-${surahSelesai.ayat}`;
  } else {
    const totalAyatSurahMulai = surahByNomor[surahMulai.nomor]?.totalAyat ?? surahMulai.ayat;
    label = `${surahMulai.nama} ${surahMulai.ayat}-${totalAyatSurahMulai} - ${surahSelesai.nama} 1-${surahSelesai.ayat}`;
  }

  return {
    ...meta,
    surahMulai,
    surahSelesai,
    label,
    presisiManual: Boolean(overrideAwal || overrideAkhir),
  };
}

/**
 * ==========================================================================
 * PERBAIKAN: santri dengan hafalan sebelumnya + urutan hafalan custom
 *            (mis. mulai dari Juz 30 mundur), dan ziyadah lintas-surat.
 * ==========================================================================
 */

/**
 * Mencari juz yang memuat sebuah posisi ayat. Diperlukan karena urutan
 * hafalan santri bisa TIDAK linear (surah 1->114), mis. santri mulai dari
 * Juz 30 lalu mundur ke Juz 29, 28, dst.
 */
function cariJuzUntukAyat(surahNomor, ayat) {
  for (const halaman of PAGES_DATA) {
    for (const seg of halaman.surahs) {
      if (seg.nomor === surahNomor && ayat >= seg.ayatAwal && ayat <= seg.ayatAkhir) {
        return halaman.juz;
      }
    }
  }
  throw new Error(`Posisi tidak ditemukan: surah ${surahNomor} ayat ${ayat}`);
}

/** Ayat pertama pada sebuah juz (surah & nomor ayat di halaman pertama juz itu). */
function getAyatPertamaJuz(juz) {
  const { halamanAwal } = getRentangHalamanJuz(juz);
  const seg = getSurahDiHalaman(halamanAwal)[0];
  return { surahNomor: seg.nomor, ayat: seg.ayatAwal };
}

/** Ayat terakhir pada sebuah juz (surah & nomor ayat di halaman terakhir juz itu). */
function getAyatTerakhirJuz(juz) {
  const { halamanAkhir } = getRentangHalamanJuz(juz);
  const segList = getSurahDiHalaman(halamanAkhir);
  const seg = segList[segList.length - 1];
  return { surahNomor: seg.nomor, ayat: seg.ayatAkhir };
}

/** Preset: urutan standar Juz 1 -> 30 (default untuk santri baru). */
function urutanJuzStandar() {
  return Array.from({ length: 30 }, (_, i) => i + 1);
}

/** Preset: urutan mundur Juz 30 -> 1 (pola umum di lapangan: mulai dari surat pendek). */
function urutanJuzMundurDari30() {
  return Array.from({ length: 30 }, (_, i) => 30 - i);
}

/**
 * (1) ZIYADAH — posisi berikutnya yang MENGERTI urutan hafalan santri.
 * urutanHafalan: array 30 nomor juz sesuai urutan yang dijalani santri,
 * mis. urutanJuzStandar() atau urutanJuzMundurDari30() atau susunan custom
 * apa pun (mis. [30, 29, 26, 27, 28, 25, ...]) yang diatur admin/ustadz.
 *
 * Selama posisi belum di ayat TERAKHIR juz saat ini, tetap maju normal
 * dalam mushaf (bisa lintas surat, lihat ayatBerikutnya). Begitu posisi
 * sudah di ayat terakhir juz saat ini, lompat ke ayat PERTAMA juz
 * berikutnya sesuai urutanHafalan -- baik itu nomor juz lebih besar
 * maupun lebih kecil.
 */
function posisiHafalanBerikutnya(surahNomor, ayat, urutanHafalan) {
  const juzSekarang = cariJuzUntukAyat(surahNomor, ayat);
  const akhirJuz = getAyatTerakhirJuz(juzSekarang);
  const sudahDiAkhirJuz = akhirJuz.surahNomor === surahNomor && akhirJuz.ayat === ayat;

  if (!sudahDiAkhirJuz) {
    const next = ayatBerikutnya(surahNomor, ayat);
    return next ? { ...next, juz: juzSekarang } : null;
  }

  const idx = urutanHafalan.indexOf(juzSekarang);
  const juzBerikutnya = idx >= 0 && idx < urutanHafalan.length - 1 ? urutanHafalan[idx + 1] : null;
  if (juzBerikutnya === null) return null; // sudah menuntaskan seluruh urutan hafalan

  const awal = getAyatPertamaJuz(juzBerikutnya);
  return { surahNomor: awal.surahNomor, ayat: awal.ayat, juz: juzBerikutnya };
}

/**
 * Versi baru prefillZiyadahBerikutnya() yang menerima urutanHafalan.
 * posisiTerakhir null -> mulai dari ayat pertama juz PERTAMA di urutanHafalan
 * (bukan selalu Al-Fatiha -- kalau urutanHafalan dimulai dari Juz 30, maka
 * santri baru pun mulai dari An-Naba ayat 1).
 */
function prefillZiyadahBerikutnya(posisiTerakhir, urutanHafalan = urutanJuzStandar()) {
  if (!posisiTerakhir) {
    const awal = getAyatPertamaJuz(urutanHafalan[0]);
    return { surahNomor: awal.surahNomor, namaSurah: surahByNomor[awal.surahNomor].nama, ayat: awal.ayat };
  }
  const next = posisiHafalanBerikutnya(posisiTerakhir.surahNomor, posisiTerakhir.ayat, urutanHafalan);
  if (!next) return null;
  return { surahNomor: next.surahNomor, namaSurah: surahByNomor[next.surahNomor].nama, ayat: next.ayat };
}

/**
 * Untuk ONBOARDING santri yang sudah punya hafalan sebelumnya (mis. sudah
 * hafal 2 juz: Juz 30 dan Juz 29). Admin cukup memasukkan BERAPA JUZ
 * PERTAMA dari urutanHafalan yang sudah tuntas -- fungsi ini menghitung
 * posisiTerakhir yang tepat, siap dipakai prefillZiyadahBerikutnya().
 * Untuk kasus juz belum tuntas penuh / urutan tidak berurutan, admin bisa
 * set posisiTerakhir secara manual (surah+ayat) tanpa lewat fungsi ini.
 */
function posisiTerakhirDariJumlahJuzSelesai(urutanHafalan, jumlahJuzSelesai) {
  if (jumlahJuzSelesai <= 0) return null;
  const juzTerakhirSelesai = urutanHafalan[jumlahJuzSelesai - 1];
  return getAyatTerakhirJuz(juzTerakhirSelesai);
}

/**
 * (2) ZIYADAH LINTAS-SURAT — label untuk rentang ayat yang bisa melewati
 * lebih dari satu surat dalam SATU entri setoran (mis. santri menghabiskan
 * An-Nas lalu lanjut beberapa ayat Al-Falaq dalam setoran yang sama).
 * Dalam satu entri, arah baca selalu maju di dalam mushaf, jadi
 * surahSelesaiNomor harus >= surahMulaiNomor.
 */
function labelRentangAyatZiyadah(surahMulaiNomor, ayatMulai, surahSelesaiNomor, ayatSelesai) {
  if (surahSelesaiNomor < surahMulaiNomor || (surahSelesaiNomor === surahMulaiNomor && ayatSelesai < ayatMulai)) {
    throw new Error("Ayat selesai harus berada setelah ayat mulai di dalam mushaf.");
  }
  const sMulai = surahByNomor[surahMulaiNomor];
  const sSelesai = surahByNomor[surahSelesaiNomor];

  if (surahMulaiNomor === surahSelesaiNomor) {
    return ayatMulai === ayatSelesai
      ? `${sMulai.nama} ayat ${ayatMulai}`
      : `${sMulai.nama} ayat ${ayatMulai}-${ayatSelesai}`;
  }

  const bagian = [`${sMulai.nama} ${ayatMulai}-${sMulai.totalAyat}`];
  for (let n = surahMulaiNomor + 1; n < surahSelesaiNomor; n++) {
    bagian.push(`${surahByNomor[n].nama} (utuh)`);
  }
  bagian.push(`${sSelesai.nama} 1-${ayatSelesai}`);
  return bagian.join(" - ");
}

/**
 * ==========================================================================
 * PERBAIKAN: parsing input halaman dengan pecahan (bug "1,5" tidak terbaca)
 * ==========================================================================
 */

/**
 * Parser toleran untuk field "Halaman" yang mendukung notasi pecahan ala
 * Indonesia (koma) maupun titik -- mis. "1,5", "1.5", "1,25", atau "12"
 * biasa. Mengembalikan { halaman, pecahan }:
 *   - halaman  : nomor halaman relatif BULAT yang sedang dibaca
 *   - pecahan  : seberapa jauh halaman itu terbaca (0 = penuh/utuh,
 *                0.25 / 0.5 / 0.75 = seperempat / setengah / tigaperempat)
 * Melempar Error dengan pesan jelas kalau formatnya tidak dikenali, supaya
 * UI bisa menampilkan alasan gagal-nya alih-alih diam-diam menampilkan
 * "lengkapi input" seperti sebelumnya.
 */
function parseHalamanPecahan(input) {
  if (input === null || input === undefined || String(input).trim() === "") {
    throw new Error("Halaman belum diisi.");
  }
  const dibersihkan = String(input).trim().replace(",", ".");
  const nilai = Number(dibersihkan);
  if (Number.isNaN(nilai)) {
    throw new Error(`"${input}" bukan format halaman yang dikenali. Contoh: 3 atau 3,5`);
  }
  if (nilai < 1) {
    throw new Error("Nomor halaman minimal 1.");
  }
  const halaman = Math.floor(nilai);
  const pecahan = Math.round((nilai - halaman) * 100) / 100;
  if (![0, 0.25, 0.5, 0.75].includes(pecahan)) {
    throw new Error(`Pecahan ",${String(pecahan).split(".")[1] || "0"}" tidak dikenali. Gunakan ,25 / ,5 / ,75 atau tanpa pecahan.`);
  }
  return { halaman, pecahan };
}

const ACCENTS = {
  emerald: {
    text: "text-emerald-700",
    solidBg: "bg-emerald-600",
    solidBgHover: "hover:bg-emerald-700",
    softBg: "bg-emerald-50",
    border: "border-emerald-200",
    ring: "focus:ring-emerald-500 focus:border-emerald-500",
    dot: "bg-emerald-500",
    chipBg: "bg-emerald-100",
    chipText: "text-emerald-800",
  },
  amber: {
    text: "text-amber-700",
    solidBg: "bg-amber-600",
    solidBgHover: "hover:bg-amber-700",
    softBg: "bg-amber-50",
    border: "border-amber-200",
    ring: "focus:ring-amber-500 focus:border-amber-500",
    dot: "bg-amber-500",
    chipBg: "bg-amber-100",
    chipText: "text-amber-800",
  },
  indigo: {
    text: "text-indigo-700",
    solidBg: "bg-indigo-600",
    solidBgHover: "hover:bg-indigo-700",
    softBg: "bg-indigo-50",
    border: "border-indigo-200",
    ring: "focus:ring-indigo-500 focus:border-indigo-500",
    dot: "bg-indigo-500",
    chipBg: "bg-indigo-100",
    chipText: "text-indigo-800",
  },
};

const SANTRI_AWAL = {
  nama: "Ahmad Zaki",
  urutanHafalan: urutanJuzStandar(),
  posisiTerakhir: { surahNomor: 67, ayat: 5 },
};

/* -------------------------- komponen kecil bersama -------------------------- */

function Card({ accent, children }) {
  const a = ACCENTS[accent];
  return (
    <div className={`bg-white rounded-2xl border ${a.border} shadow-sm shadow-slate-100 p-5 sm:p-7`}>
      {children}
    </div>
  );
}

function SectionLabel({ accent, children }) {
  const a = ACCENTS[accent];
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{children}</p>
    </div>
  );
}

function FieldChip({ label, value, accent }) {
  const a = ACCENTS[accent];
  return (
    <div className="flex-1">
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      <div className={`rounded-lg ${a.chipBg} ${a.chipText} px-4 py-3 font-medium text-lg flex items-center justify-between`}>
        {value}
        <span className="text-[10px] font-normal uppercase tracking-wide opacity-60">Otomatis</span>
      </div>
    </div>
  );
}

function PreviewBox({ accent, meta, note }) {
  const a = ACCENTS[accent];
  if (!meta) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-400">
        Lengkapi input di atas untuk melihat pratinjau surat &amp; ayat.
      </div>
    );
  }
  return (
    <div className={`mt-5 rounded-xl ${a.softBg} border ${a.border} px-4 py-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-1">Terbaca sistem</p>
          <p className={`text-lg font-serif font-semibold ${a.text}`}>{meta.label}</p>
        </div>
        {meta.presisiManual && (
          <span className={`shrink-0 text-[10px] font-medium ${a.chipBg} ${a.chipText} rounded-full px-2 py-1`}>
            Presisi manual
          </span>
        )}
      </div>
      {(meta.lintasJuz || note) && (
        <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200/70">
          {meta.lintasJuz ? `Lintas juz ${meta.juzMulai} → ${meta.juzSelesai}. ` : ""}
          {note}
        </p>
      )}
    </div>
  );
}

function SubmitButton({ accent, onClick, label, disabled }) {
  const a = ACCENTS[accent];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`mt-6 w-full rounded-lg ${a.solidBg} ${a.solidBgHover} disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 flex items-center justify-center gap-2 transition-colors`}
    >
      <Check className="h-4 w-4" />
      {label}
    </button>
  );
}

function NumberField({ label, value, onChange, min, max, accent }) {
  const a = ACCENTS[accent];
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${a.ring}`}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, accent }) {
  const a = ACCENTS[accent];
  return (
    <div className="relative">
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 ${a.ring}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-3 bottom-3 pointer-events-none" />
    </div>
  );
}

function SurahSelect({ label, value, onChange, accent, optionsOverride }) {
  const a = ACCENTS[accent];
  const daftar = optionsOverride || SURAH_LIST;
  return (
    <div className="relative">
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 ${a.ring}`}
      >
        {daftar.map((s) => (
          <option key={s.nomor} value={s.nomor}>
            {s.nomor}. {s.nama}
          </option>
        ))}
      </select>
      <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-3 bottom-3 pointer-events-none" />
    </div>
  );
}

function ToggleSwitch({ checked, onChange, accent, label }) {
  const a = ACCENTS[accent];
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 select-none"
    >
      <span
        className={`h-5 w-9 rounded-full transition-colors relative shrink-0 ${checked ? a.solidBg : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </span>
      <span className="text-sm text-slate-600">{label}</span>
    </button>
  );
}

/* -------------------- elemen tanda tangan: strip 604 halaman -------------------- */

function JuzStrip({ juzMulai, juzSelesai, accent }) {
  const a = ACCENTS[accent];
  const lo = Math.min(juzMulai, juzSelesai);
  const hi = Math.max(juzMulai, juzSelesai);
  return (
    <div className="mb-6">
      <div className="flex gap-[2px] h-3 rounded-full overflow-hidden">
        {JUZ_TABLE.map((j) => {
          const halaman = j.halamanAkhir - j.halamanAwal + 1;
          const aktif = j.juz >= lo && j.juz <= hi;
          return (
            <div
              key={j.juz}
              title={`Juz ${j.juz} · ${halaman} halaman`}
              style={{ flexGrow: halaman }}
              className={`transition-colors ${aktif ? a.solidBg : "bg-slate-200"}`}
            />
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5">
        604 halaman mushaf Madinah · Juz {lo}
        {hi !== lo ? `–${hi}` : ""} disorot &middot; lebar tiap ruas sesuai jumlah halaman aslinya
      </p>
    </div>
  );
}

/* ------------------------------- Panel Ziyadah ------------------------------- */

function ZiyadahPanel({ santri, setSantri }) {
  const prefill = prefillZiyadahBerikutnya(santri.posisiTerakhir, santri.urutanHafalan);
  const [surahSelesaiNomor, setSurahSelesaiNomor] = useState(prefill ? prefill.surahNomor : 1);
  const [ayatSelesai, setAyatSelesai] = useState(prefill ? prefill.ayat : 1);
  const [tersimpan, setTersimpan] = useState(false);

  if (!prefill) {
    return (
      <Card accent="emerald">
        <p className="text-sm text-slate-500">
          {santri.nama} sudah menuntaskan seluruh urutan hafalannya — tidak ada kelanjutan ziyadah.
        </p>
      </Card>
    );
  }

  const surahSelesai = surahByNomor[surahSelesaiNomor];
  const ayatValid =
    surahSelesaiNomor > prefill.surahNomor ||
    (surahSelesaiNomor === prefill.surahNomor && ayatSelesai >= prefill.ayat);
  const ayatDalamRentang = ayatSelesai >= 1 && ayatSelesai <= surahSelesai.totalAyat;

  let label = null;
  if (ayatValid && ayatDalamRentang) {
    try {
      label = labelRentangAyatZiyadah(prefill.surahNomor, prefill.ayat, surahSelesaiNomor, ayatSelesai);
    } catch {
      label = null;
    }
  }

  // Surat pilihan untuk "selesai": surat mulai, dan beberapa surat sesudahnya (jaga-jaga
  // lintas beberapa surat pendek sekaligus, umum terjadi di Juz 30).
  const opsiSurahSelesai = SURAH_LIST.filter(
    (s) => s.nomor >= prefill.surahNomor && s.nomor <= prefill.surahNomor + 5
  );

  function simpan() {
    if (!label) return;
    setSantri((s) => ({
      ...s,
      posisiTerakhir: { surahNomor: surahSelesaiNomor, ayat: ayatSelesai },
    }));
    setTersimpan(true);
    setTimeout(() => setTersimpan(false), 2200);
  }

  const posisiBerikutnya = label
    ? posisiHafalanBerikutnya(surahSelesaiNomor, ayatSelesai, santri.urutanHafalan)
    : null;

  return (
    <Card accent="emerald">
      <SectionLabel accent="emerald">Lanjutan otomatis dari setoran terakhir</SectionLabel>

      <div className="flex gap-3 mb-6">
        <FieldChip accent="emerald" label="Surat mulai" value={prefill.namaSurah} />
        <FieldChip accent="emerald" label="Ayat mulai" value={prefill.ayat} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SurahSelect
          accent="emerald"
          label="Surat selesai"
          value={surahSelesaiNomor}
          onChange={(v) => {
            setSurahSelesaiNomor(v);
            setAyatSelesai(v === prefill.surahNomor ? prefill.ayat : 1);
          }}
          optionsOverride={opsiSurahSelesai}
        />
        <NumberField
          accent="emerald"
          label="Ayat selesai"
          min={surahSelesaiNomor === prefill.surahNomor ? prefill.ayat : 1}
          max={surahSelesai.totalAyat}
          value={ayatSelesai}
          onChange={setAyatSelesai}
        />
      </div>
      {surahSelesaiNomor !== prefill.surahNomor && (
        <p className="text-xs text-emerald-600 mt-2">
          Setoran ini melewati lebih dari satu surat — akan tercatat lengkap di pratinjau.
        </p>
      )}
      {!ayatValid && (
        <p className="text-xs text-red-500 mt-2">Ayat selesai tidak boleh sebelum ayat mulai.</p>
      )}

      <PreviewBox
        accent="emerald"
        meta={label ? { label } : null}
        note={
          posisiBerikutnya
            ? `Setoran berikutnya otomatis dibuka mulai dari ${surahByNomor[posisiBerikutnya.surahNomor].nama} ayat ${posisiBerikutnya.ayat}${posisiBerikutnya.juz !== cariJuzSantriSaatIni(surahSelesaiNomor, ayatSelesai, santri) ? " (pindah juz sesuai urutan hafalan santri)" : ""}.`
            : "Ini akan menjadi ayat terakhir dalam urutan hafalan santri."
        }
      />

      <SubmitButton
        accent="emerald"
        disabled={!label}
        onClick={simpan}
        label={tersimpan ? "Tersimpan!" : "Simpan setoran ziyadah"}
      />
    </Card>
  );
}

// Helper kecil khusus UI: dipakai untuk memutuskan kalimat catatan pindah-juz di atas.
// (Pembungkus tipis di atas fungsi cariJuzUntukAyat yang bersifat privat di quranMapper.)
function cariJuzSantriSaatIni(surahNomor, ayat, santri) {
  try {
    const halaman = PAGES_DATA.find((p) => p.surahs.some((s) => s.nomor === surahNomor && ayat >= s.ayatAwal && ayat <= s.ayatAkhir));
    return halaman ? halaman.juz : null;
  } catch {
    return null;
  }
}

/* ------------------------- Panel Admin: Posisi Hafalan ------------------------- */

function AdminPosisiPanel({ santri, setSantri }) {
  const [mode, setMode] = useState(santri.urutanHafalan.join(",") === urutanJuzStandar().join(",") ? "standar" : "mundur");
  const [jumlahJuzSelesai, setJumlahJuzSelesai] = useState(0);
  const [terapkan, setTerapkan] = useState(false);

  const urutanDipilih = mode === "standar" ? urutanJuzStandar() : urutanJuzMundurDari30();
  const preview =
    jumlahJuzSelesai > 0 ? posisiTerakhirDariJumlahJuzSelesai(urutanDipilih, jumlahJuzSelesai) : null;

  function terapkanKeSantri() {
    setSantri((s) => ({
      ...s,
      urutanHafalan: urutanDipilih,
      posisiTerakhir: preview,
    }));
    setTerapkan(true);
    setTimeout(() => setTerapkan(false), 2200);
  }

  return (
    <details className="mb-5 group">
      <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1.5 select-none">
        <Settings2 className="h-3.5 w-3.5" />
        Admin: atur posisi &amp; urutan hafalan santri (untuk santri lama / pindahan)
      </summary>
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-500 mb-3">
          Dipakai sekali di awal saat mendaftarkan santri yang sudah punya hafalan. Sistem akan menghitung
          posisi mulai ziyadah berikutnya dari sini.
        </p>
        <label className="block text-xs text-slate-400 mb-1.5">Pola urutan hafalan santri</label>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("standar")}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${mode === "standar" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-500"}`}
          >
            Maju: Juz 1 → 30
          </button>
          <button
            onClick={() => setMode("mundur")}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${mode === "mundur" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-500"}`}
          >
            Mundur: Juz 30 → 1
          </button>
        </div>

        <JuzStrip juzMulai={urutanDipilih[0]} juzSelesai={urutanDipilih[Math.max(jumlahJuzSelesai - 1, 0)]} accent="emerald" />

        <NumberField
          accent="emerald"
          label={`Sudah hafal berapa juz PERTAMA dari urutan di atas? (mis. 2 = ${urutanDipilih.slice(0, 2).join(" & Juz ")})`}
          min={0}
          max={30}
          value={jumlahJuzSelesai}
          onChange={setJumlahJuzSelesai}
        />

        {preview && (
          <p className="text-xs text-slate-500 mt-3">
            → Posisi ziyadah berikutnya akan dihitung mulai dari{" "}
            <span className="font-medium text-emerald-700">
              {surahByNomor[prefillZiyadahBerikutnya(preview, urutanDipilih)?.surahNomor]?.nama}{" "}
              ayat {prefillZiyadahBerikutnya(preview, urutanDipilih)?.ayat}
            </span>
            .
          </p>
        )}

        <SubmitButton
          accent="emerald"
          onClick={terapkanKeSantri}
          label={terapkan ? "Diterapkan!" : "Terapkan ke santri ini"}
        />
      </div>
    </details>
  );
}

/* --------------------------- Panel Sabqi / Manzil --------------------------- */

function TextHalamanField({ label, value, onChange, accent, error }) {
  const a = ACCENTS[accent];
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        placeholder="mis. 3 atau 3,5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${a.ring} ${
          error ? "border-red-300" : "border-slate-300"
        }`}
      />
      {error ? (
        <p className="text-[11px] text-red-500 mt-1">{error}</p>
      ) : (
        <p className="text-[11px] text-slate-400 mt-1">Boleh pakai koma untuk pecahan, mis. 3,5 atau 3,25</p>
      )}
    </div>
  );
}

function SabqiManzilPanel({ jenis }) {
  const accent = jenis === "sabqi" ? "amber" : "indigo";
  const labelJenis = jenis === "sabqi" ? "Sabqi" : "Manzil";

  const [juzMulai, setJuzMulai] = useState(29);
  const [halMulaiInput, setHalMulaiInput] = useState("1");
  const [lintasJuz, setLintasJuz] = useState(false);
  const [juzSelesai, setJuzSelesai] = useState(30);
  const [halSelesaiInput, setHalSelesaiInput] = useState("1,5");
  const [showPresisi, setShowPresisi] = useState(false);
  const [presisiDisentuhManual, setPresisiDisentuhManual] = useState(false);
  const [overrideAwal, setOverrideAwal] = useState(null);
  const [overrideAkhir, setOverrideAkhir] = useState(null);

  const juzSelesaiEfektif = lintasJuz ? juzSelesai : juzMulai;
  const juzOptions = JUZ_TABLE.map((j) => ({ value: j.juz, label: `Juz ${j.juz}` }));

  // Parsing toleran koma/titik untuk kedua field halaman.
  let mulaiParsed = null,
    mulaiError = null;
  try {
    mulaiParsed = parseHalamanPecahan(halMulaiInput);
  } catch (e) {
    mulaiError = e.message;
  }
  let selesaiParsed = null,
    selesaiError = null;
  try {
    selesaiParsed = parseHalamanPecahan(halSelesaiInput);
  } catch (e) {
    selesaiError = e.message;
  }

  const halamanTidakPenuh = (mulaiParsed && mulaiParsed.pecahan > 0) || (selesaiParsed && selesaiParsed.pecahan > 0);

  const metaAuto = useMemo(() => {
    if (!mulaiParsed || !selesaiParsed) return null;
    try {
      return buatSurahMetaOtomatis(juzMulai, mulaiParsed.halaman, juzSelesaiEfektif, selesaiParsed.halaman);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [juzMulai, juzSelesaiEfektif, mulaiParsed?.halaman, selesaiParsed?.halaman]);

  const metaFinal = metaAuto ? terapkanOverrideAyat(metaAuto, overrideAwal, overrideAkhir) : null;

  // Kalau halaman tidak penuh, auto-buka panel presisi & pre-isi dari hasil auto-deteksi,
  // supaya ustadz tinggal koreksi -- bukan cari-cari tombolnya sendiri.
  React.useEffect(() => {
    if (halamanTidakPenuh && metaAuto && !showPresisi && !presisiDisentuhManual) {
      setOverrideAwal({ surahNomor: metaAuto.surahMulai.nomor, ayat: metaAuto.surahMulai.ayat });
      setOverrideAkhir({ surahNomor: metaAuto.surahSelesai.nomor, ayat: metaAuto.surahSelesai.ayat });
      setShowPresisi(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halamanTidakPenuh, metaAuto]);

  function bukaPresisi() {
    setPresisiDisentuhManual(true);
    if (!showPresisi && metaAuto) {
      setOverrideAwal({ surahNomor: metaAuto.surahMulai.nomor, ayat: metaAuto.surahMulai.ayat });
      setOverrideAkhir({ surahNomor: metaAuto.surahSelesai.nomor, ayat: metaAuto.surahSelesai.ayat });
    }
    setShowPresisi((v) => !v);
  }

  function resetPresisi() {
    setOverrideAwal(null);
    setOverrideAkhir(null);
    setShowPresisi(false);
    setPresisiDisentuhManual(true);
  }

  return (
    <Card accent={accent}>
      <SectionLabel accent={accent}>{labelJenis} · juz &amp; halaman (mushaf Madinah)</SectionLabel>

      <JuzStrip juzMulai={juzMulai} juzSelesai={juzSelesaiEfektif} accent={accent} />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          accent={accent}
          label="Juz mulai"
          value={juzMulai}
          onChange={(v) => {
            setJuzMulai(v);
            setHalMulaiInput("1");
          }}
          options={juzOptions}
        />
        <TextHalamanField accent={accent} label="Halaman mulai" value={halMulaiInput} onChange={setHalMulaiInput} error={mulaiError} />
      </div>

      <div className="mt-4">
        <ToggleSwitch
          accent={accent}
          checked={lintasJuz}
          onChange={(v) => {
            setLintasJuz(v);
            if (!v) setJuzSelesai(juzMulai);
          }}
          label="Setoran ini menyeberang ke juz berikutnya"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {lintasJuz && (
          <SelectField
            accent={accent}
            label="Juz selesai"
            value={juzSelesai}
            onChange={(v) => {
              setJuzSelesai(v);
              setHalSelesaiInput("1");
            }}
            options={juzOptions.filter((o) => o.value >= juzMulai)}
          />
        )}
        <TextHalamanField
          accent={accent}
          label="Halaman selesai"
          value={halSelesaiInput}
          onChange={setHalSelesaiInput}
          error={selesaiError}
        />
      </div>

      <PreviewBox
        accent={accent}
        meta={metaFinal}
        note={
          halamanTidakPenuh
            ? "Halaman terakhir tidak penuh — ayat di bawah ini hasil perkiraan dari batas halaman. Cek & koreksi di panel presisi."
            : undefined
        }
      />

      <button
        onClick={bukaPresisi}
        disabled={!metaAuto}
        className={`mt-4 flex items-center gap-1.5 text-xs font-medium disabled:opacity-40 ${
          halamanTidakPenuh && !showPresisi ? `${ACCENTS[accent].text} font-semibold` : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Settings2 className="h-3.5 w-3.5" />
        {showPresisi
          ? "Sembunyikan presisi ayat"
          : halamanTidakPenuh
          ? "Koreksi presisi ayat — disarankan (halaman tidak penuh)"
          : "Koreksi presisi ayat (opsional)"}
      </button>

      {showPresisi && overrideAwal && overrideAkhir && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">
              Timpa ayat pastinya bila setoran berhenti di tengah halaman, bukan di batas halaman penuh.
            </p>
            <button onClick={resetPresisi} className="text-slate-400 hover:text-slate-600 shrink-0 ml-3">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className={`text-xs font-medium ${ACCENTS[accent].text}`}>Ayat mulai</p>
              <SurahSelect
                accent={accent}
                label="Surat"
                value={overrideAwal.surahNomor}
                onChange={(v) => {
                  setOverrideAwal((o) => ({ ...o, surahNomor: v, ayat: 1 }));
                  setPresisiDisentuhManual(true);
                }}
              />
              <NumberField
                accent={accent}
                label="Ayat"
                min={1}
                max={surahByNomor[overrideAwal.surahNomor].totalAyat}
                value={overrideAwal.ayat}
                onChange={(v) => {
                  setOverrideAwal((o) => ({ ...o, ayat: v }));
                  setPresisiDisentuhManual(true);
                }}
              />
            </div>
            <div className="space-y-3">
              <p className={`text-xs font-medium ${ACCENTS[accent].text}`}>Ayat selesai</p>
              <SurahSelect
                accent={accent}
                label="Surat"
                value={overrideAkhir.surahNomor}
                onChange={(v) => {
                  setOverrideAkhir((o) => ({ ...o, surahNomor: v, ayat: 1 }));
                  setPresisiDisentuhManual(true);
                }}
              />
              <NumberField
                accent={accent}
                label="Ayat"
                min={1}
                max={surahByNomor[overrideAkhir.surahNomor].totalAyat}
                value={overrideAkhir.ayat}
                onChange={(v) => {
                  setOverrideAkhir((o) => ({ ...o, ayat: v }));
                  setPresisiDisentuhManual(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <SubmitButton accent={accent} disabled={!metaFinal} onClick={() => {}} label={`Simpan setoran ${labelJenis.toLowerCase()}`} />
    </Card>
  );
}

/* ----------------------------------- App ----------------------------------- */

const TABS = [
  { key: "ziyadah", label: "Ziyadah", accent: "emerald" },
  { key: "sabqi", label: "Sabqi", accent: "amber" },
  { key: "manzil", label: "Manzil", accent: "indigo" },
];

export default function SetoranForm() {
  const [santri, setSantri] = useState(SANTRI_AWAL);
  const [tab, setTab] = useState("ziyadah");

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-slate-800">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen className="h-5 w-5 text-slate-400" />
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">tahfidzku · Halaman Ustadz</p>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 mb-1">Input Setoran</h1>
        <p className="text-sm text-slate-500 mb-6">
          Santri: <span className="font-medium text-slate-700">{santri.nama}</span>
        </p>

        <div className="flex gap-1.5 mb-5 bg-slate-100 rounded-xl p-1 w-full sm:w-fit">
          {TABS.map((t) => {
            const active = tab === t.key;
            const a = ACCENTS[t.accent];
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? `bg-white ${a.text} shadow-sm` : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "ziyadah" && (
          <>
            <AdminPosisiPanel santri={santri} setSantri={setSantri} />
            <ZiyadahPanel santri={santri} setSantri={setSantri} />
          </>
        )}
        {tab === "sabqi" && <SabqiManzilPanel jenis="sabqi" />}
        {tab === "manzil" && <SabqiManzilPanel jenis="manzil" />}

        <p className="text-[11px] text-slate-400 mt-6 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          Demo interaktif — data berbasis 604 halaman mushaf Madinah dari quranMapper.js
        </p>
      </div>
    </div>
  );
}
