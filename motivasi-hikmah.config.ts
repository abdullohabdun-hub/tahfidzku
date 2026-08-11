/**
 * motivasi-hikmah.config.ts
 *
 * Tabel lokal terkurasi untuk Motivation Card di beranda TahfidzKu.
 * Pola sama dengan hijri-kemenag.config.ts: data statis, tidak bergantung API eksternal.
 *
 * !! PENTING - WAJIB DIBACA SEBELUM DIPAKAI DI PRODUCTION !!
 * Teks Arab, harakat, dan terjemahan di bawah ini disusun sebagai DRAFT AWAL.
 * WAJIB ditashih (diverifikasi) oleh ustadz/pihak yang berkompeten di pesantren
 * sebelum dipublikasikan ke santri & ustadz. Kesalahan harakat atau kutipan
 * yang tidak akurat bisa berdampak pada kredibilitas keilmuan platform.
 *
 * Field `derajat` untuk hadits WAJIB diisi agar transparan ke pembaca soal
 * kekuatan riwayatnya (shahih / hasan shahih / hasan, dst). Jangan tampilkan
 * hadits tanpa status derajat yang jelas.
 */

export type JenisKutipan = "quran" | "hadits" | "ulama";

export interface MotivasiHikmah {
  id: string;
  jenis: JenisKutipan;
  teksArab: string;
  terjemahan: string;
  sumber: string;
  derajat?: string; // wajib diisi khusus untuk jenis "hadits"
}

export const motivasiHikmahList: MotivasiHikmah[] = [
  // ===== AYAT AL-QURAN =====
  {
    id: "quran-01",
    jenis: "quran",
    teksArab: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    terjemahan:
      "Dan sungguh, telah Kami mudahkan Al-Qur'an untuk peringatan, maka adakah orang yang mau mengambil pelajaran?",
    sumber: "QS. Al-Qamar: 17",
  },
  {
    id: "quran-02",
    jenis: "quran",
    teksArab: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    terjemahan:
      "(Yaitu) orang-orang yang beriman dan hati mereka menjadi tenteram dengan mengingat Allah. Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.",
    sumber: "QS. Ar-Ra'd: 28",
  },
  {
    id: "quran-03",
    jenis: "quran",
    teksArab: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    terjemahan: "Maka sesungguhnya bersama kesulitan ada kemudahan. Sesungguhnya bersama kesulitan ada kemudahan.",
    sumber: "QS. Al-Insyirah: 5-6",
  },
  {
    id: "quran-04",
    jenis: "quran",
    teksArab: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    terjemahan: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.",
    sumber: "QS. Al-Baqarah: 286",
  },
  {
    id: "quran-05",
    jenis: "quran",
    teksArab: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    terjemahan: "Dan katakanlah: Ya Tuhanku, tambahkanlah ilmu kepadaku.",
    sumber: "QS. Thaha: 114",
  },
  {
    id: "quran-06",
    jenis: "quran",
    teksArab: "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ",
    terjemahan:
      "Allah akan mengangkat (derajat) orang-orang yang beriman di antaramu dan orang-orang yang diberi ilmu beberapa derajat.",
    sumber: "QS. Al-Mujadalah: 11",
  },
  {
    id: "quran-07",
    jenis: "quran",
    teksArab: "قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ",
    terjemahan: "Katakanlah: Apakah sama orang-orang yang mengetahui dengan orang-orang yang tidak mengetahui?",
    sumber: "QS. Az-Zumar: 9",
  },
  {
    id: "quran-08",
    jenis: "quran",
    teksArab: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ",
    terjemahan: "Dan bersabarlah, dan kesabaranmu itu hanya dengan pertolongan Allah.",
    sumber: "QS. An-Nahl: 127",
  },
  {
    id: "quran-09",
    jenis: "quran",
    teksArab: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    terjemahan: "Sesungguhnya Allah beserta orang-orang yang sabar.",
    sumber: "QS. Al-Anfal: 46",
  },
  {
    id: "quran-10",
    jenis: "quran",
    teksArab: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
    terjemahan: "Barangsiapa bertakwa kepada Allah, niscaya Dia akan menjadikan jalan keluar baginya.",
    sumber: "QS. At-Talaq: 2",
  },
  {
    id: "quran-11",
    jenis: "quran",
    teksArab: "إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ",
    terjemahan: "Sesungguhnya perbuatan-perbuatan yang baik itu menghapuskan (dosa) perbuatan-perbuatan yang buruk.",
    sumber: "QS. Hud: 114",
  },

  // ===== HADITS =====
  {
    id: "hadits-01",
    jenis: "hadits",
    teksArab: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    terjemahan: "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya.",
    sumber: "HR. Bukhari, no. 5027",
    derajat: "shahih",
  },
  {
    id: "hadits-02",
    jenis: "hadits",
    teksArab: "اقْرَءُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ",
    terjemahan:
      "Bacalah Al-Qur'an, karena sesungguhnya ia akan datang pada hari kiamat sebagai pemberi syafaat bagi orang-orang yang membacanya.",
    sumber: "HR. Muslim, no. 804",
    derajat: "shahih",
  },
  {
    id: "hadits-03",
    jenis: "hadits",
    teksArab:
      "يُقَالُ لِصَاحِبِ الْقُرْآنِ اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا فَإِنَّ مَنْزِلَتَكَ عِنْدَ آخِرِ آيَةٍ تَقْرَؤُهَا",
    terjemahan:
      "Dikatakan kepada shahibul Qur'an (penghafal Al-Qur'an): 'Bacalah dan naiklah (derajatmu di surga), serta bacalah dengan tartil sebagaimana engkau membacanya dengan tartil di dunia. Karena kedudukanmu ada pada ayat terakhir yang engkau baca.'",
    sumber: "HR. Abu Dawud no. 1464, At-Tirmidzi no. 2914",
    derajat: "hasan shahih (Tirmidzi), dishahihkan Al-Albani",
  },
  {
    id: "hadits-04",
    jenis: "hadits",
    teksArab: "إِنَّ الَّذِي لَيْسَ فِي جَوْفِهِ شَيْءٌ مِنَ الْقُرْآنِ كَالْبَيْتِ الْخَرِبِ",
    terjemahan: "Sesungguhnya orang yang di dalam dadanya tidak ada sedikit pun hafalan Al-Qur'an, ibarat rumah yang runtuh.",
    sumber: "HR. At-Tirmidzi, no. 2913",
    derajat: "hasan shahih",
  },
  {
    id: "hadits-05",
    jenis: "hadits",
    teksArab:
      "الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ وَالَّذِي يَقْرَأُ الْقُرْآنَ وَيَتَتَعْتَعُ فِيهِ وَهُوَ عَلَيْهِ شَاقٌّ لَهُ أَجْرَانِ",
    terjemahan:
      "Orang yang mahir membaca Al-Qur'an akan bersama para malaikat yang mulia lagi taat. Sedangkan orang yang membaca Al-Qur'an dengan terbata-bata dan merasa berat, ia mendapat dua pahala.",
    sumber: "HR. Bukhari dan Muslim",
    derajat: "shahih (muttafaq 'alaih)",
  },
  {
    id: "hadits-06",
    jenis: "hadits",
    teksArab: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    terjemahan: "Sesungguhnya setiap amal tergantung niatnya, dan setiap orang akan mendapatkan (balasan) sesuai apa yang ia niatkan.",
    sumber: "HR. Bukhari no. 1, Muslim no. 1907",
    derajat: "shahih (muttafaq 'alaih)",
  },
  {
    id: "hadits-07",
    jenis: "hadits",
    teksArab:
      "عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ وَلَيْسَ ذَاكَ لِأَحَدٍ إِلَّا لِلْمُؤْمِنِ إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ فَكَانَ خَيْرًا لَهُ وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ",
    terjemahan:
      "Sungguh menakjubkan perkara seorang mukmin. Semua urusannya adalah baik, dan itu tidak dimiliki siapa pun kecuali seorang mukmin. Jika mendapat kesenangan ia bersyukur, maka itu baik baginya. Jika ditimpa kesusahan ia bersabar, maka itu juga baik baginya.",
    sumber: "HR. Muslim, no. 2999",
    derajat: "shahih",
  },
  {
    id: "hadits-08",
    jenis: "hadits",
    teksArab: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    terjemahan: "Barangsiapa menempuh suatu jalan untuk mencari ilmu, Allah akan mudahkan baginya jalan menuju surga.",
    sumber: "HR. Muslim, no. 2699",
    derajat: "shahih",
  },
  {
    id: "hadits-09",
    jenis: "hadits",
    teksArab: "يَا أَهْلَ الْقُرْآنِ، أَوْتِرُوا؛ فَإِنَّ اللَّهَ وِتْرٌ يُحِبُّ الْوِتْرَ",
    terjemahan: "Wahai ahli Al-Qur'an (para penghafal/pembaca Al-Qur'an), kerjakanlah shalat witir. Sesungguhnya Allah itu witir (Esa) dan menyukai yang witir (ganjil).",
    sumber: "HR. Abu Dawud no. 1416, At-Tirmidzi no. 453, An-Nasa'i no. 1675, Ibnu Majah no. 1169",
    derajat: "shahih (dishahihkan Al-Albani), shahih li ghairihi (Syu'aib Al-Arnauth)",
  },

  // ===== UCAPAN ULAMA =====
  {
    id: "ulama-01",
    jenis: "ulama",
    teksArab: "مَنْ لَمْ يَذُقْ مُرَّ التَّعَلُّمِ سَاعَةً، تَجَرَّعَ ذُلَّ الْجَهْلِ طُولَ حَيَاتِهِ",
    terjemahan: "Barangsiapa tidak merasakan pahitnya belajar walau sesaat, ia akan menelan hinanya kebodohan sepanjang hidupnya.",
    sumber: "Imam Asy-Syafi'i",
  },
  {
    id: "ulama-02",
    jenis: "ulama",
    teksArab: "إِضَاعَةُ الْوَقْتِ أَشَدُّ مِنَ الْمَوْتِ؛ لِأَنَّ إِضَاعَةَ الْوَقْتِ تَقْطَعُكَ عَنِ اللَّهِ وَالدَّارِ الْآخِرَةِ، وَالْمَوْتُ يَقْطَعُكَ عَنِ الدُّنْيَا وَأَهْلِهَا",
    terjemahan:
      "Menyia-nyiakan waktu itu lebih dahsyat daripada kematian. Karena menyia-nyiakan waktu memutusmu dari Allah dan negeri akhirat, sedangkan kematian hanya memutusmu dari dunia dan penghuninya.",
    sumber: "Ibnul Qayyim Al-Jauziyyah, kitab Al-Fawa'id",
  },
  {
    id: "ulama-04",
    jenis: "ulama",
    teksArab: "شَكَوْتُ إِلَى وَكِيعٍ سُوءَ حِفْظِي، فَأَرْشَدَنِي إِلَى تَرْكِ الْمَعَاصِي",
    terjemahan:
      "Aku mengadukan kepada Waki' tentang buruknya hafalanku, maka beliau membimbingku untuk meninggalkan maksiat.",
    sumber: "Imam Asy-Syafi'i (bait syair masyhur tentang hafalan)",
  },
];

/**
 * Utility: ambil satu kutipan secara random.
 * Untuk mode sequential, cukup iterasi array-nya langsung berdasarkan index slide.
 */
export function getRandomMotivasi(): MotivasiHikmah {
  const index = Math.floor(Math.random() * motivasiHikmahList.length);
  return motivasiHikmahList[index];
}
