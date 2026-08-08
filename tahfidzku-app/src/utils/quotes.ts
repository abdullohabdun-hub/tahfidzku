export const DAILY_QUOTES = [
  { text: "Sesungguhnya bersama kesulitan ada kemudahan.", source: "Al-Insyirah: 6" },
  { text: "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya.", source: "HR. Bukhari" },
  { text: "Bacalah Al-Qur'an, karena ia akan datang pada hari kiamat memberikan syafaat bagi pembacanya.", source: "HR. Muslim" },
  { text: "Barangsiapa yang membaca satu huruf dari kitab Allah (Al-Qur'an), maka ia mendapat satu kebaikan.", source: "HR. Tirmidzi" },
  { text: "Dan bersabarlah (Muhammad) menunggu ketetapan Tuhanmu, karena sesungguhnya engkau berada dalam pengawasan Kami.", source: "At-Tur: 48" },
  { text: "Cukuplah Allah menjadi Penolong kami dan Allah adalah sebaik-baik Pelindung.", source: "Ali 'Imran: 173" },
  { text: "Barangsiapa bertakwa kepada Allah niscaya Dia akan membukakan jalan keluar baginya.", source: "At-Talaq: 2" },
  { text: "Wahai orang-orang yang beriman! Mohonlah pertolongan (kepada Allah) dengan sabar dan salat.", source: "Al-Baqarah: 153" },
  { text: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.", source: "Al-Baqarah: 286" },
  { text: "Maka nikmat Tuhan kamu yang manakah yang kamu dustakan?", source: "Ar-Rahman: 13" },
  { text: "Sesungguhnya Allah tidak akan mengubah keadaan suatu kaum sebelum mereka mengubah keadaan mereka sendiri.", source: "Ar-Ra'd: 11" },
  { text: "Perumpamaan orang yang membaca Al-Qur'an dan ia menghafalnya adalah bersama para malaikat yang mulia.", source: "HR. Bukhari" },
  { text: "Hati yang paling kosong dari kebaikan adalah hati yang tidak ada sedikitpun hafalan Al-Qur'annya.", source: "HR. Tirmidzi" },
  { text: "Ikatlah ilmu dengan menulisnya.", source: "Ali bin Abi Thalib" },
  { text: "Barangsiapa menempuh suatu jalan untuk menuntut ilmu, maka Allah memudahkan baginya jalan menuju surga.", source: "HR. Muslim" },
  { text: "Doa adalah senjata orang mukmin, tiang agama, dan cahaya langit dan bumi.", source: "HR. Al-Hakim" },
  { text: "Sesungguhnya amal yang paling dicintai Allah adalah amal yang dilakukan secara terus menerus walaupun sedikit.", source: "HR. Bukhari & Muslim" },
  { text: "Tidaklah suatu kaum berkumpul di salah satu rumah Allah untuk membaca Al-Qur'an... melainkan ketenangan akan turun kepada mereka.", source: "HR. Muslim" },
  { text: "Bertaqwalah kepada Allah di manapun kamu berada.", source: "HR. Tirmidzi" },
  { text: "Dan Rabbmu berfirman: Berdoalah kepada-Ku, niscaya akan Kuperkenankan bagimu.", source: "Ghafir: 60" },
  { text: "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.", source: "HR. Ahmad" },
  { text: "Ridho Allah bergantung pada ridho kedua orang tua.", source: "HR. Tirmidzi" },
  { text: "Janganlah kamu bersedih, sesungguhnya Allah bersama kita.", source: "At-Taubah: 40" },
  { text: "Barangsiapa bersungguh-sungguh, niscaya ia akan berhasil.", source: "Mahfudzot" },
  { text: "Kebersihan itu sebagian dari iman.", source: "HR. Muslim" },
  { text: "Senyummu di hadapan saudaramu adalah sedekah.", source: "HR. Tirmidzi" },
  { text: "Sesungguhnya pendengaran, penglihatan dan hati, semuanya itu akan diminta pertanggungjawabannya.", source: "Al-Isra': 36" },
  { text: "Waktu itu ibarat pedang, jika engkau tidak memotongnya maka ia akan memotongmu.", source: "Mahfudzot" },
  { text: "Tidak ada kemudahan kecuali apa yang Engkau jadikan mudah.", source: "Doa Nabi" },
  { text: "Orang yang mahir membaca Al-Qur'an kelak akan bersama para malaikat utusan yang mulia lagi taat.", source: "HR. Bukhari & Muslim" }
]

export function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
  const index = dayOfYear % DAILY_QUOTES.length
  return DAILY_QUOTES[index]
}
