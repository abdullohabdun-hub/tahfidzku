import { describe, it, expect } from 'vitest';
import { 
  parseHalamanPecahan, 
  posisiHafalanBerikutnya, 
  labelRentangAyatZiyadah, 
  urutanJuzStandar,
  hitungProgresHalaman,
  hitungJumlahHalamanDibaca,
  bangunUrutanHafalan
} from './quranMapper';

describe('quranMapper', () => {
  describe('parseHalamanPecahan', () => {
    it('harus membaca angka bulat', () => {
      expect(parseHalamanPecahan(3)).toEqual({ halaman: 3, pecahan: 0 });
      expect(parseHalamanPecahan("3")).toEqual({ halaman: 3, pecahan: 0 });
    });

    it('harus membaca koma dengan benar', () => {
      expect(parseHalamanPecahan("1,5")).toEqual({ halaman: 1, pecahan: 0.5 });
      expect(parseHalamanPecahan("1,25")).toEqual({ halaman: 1, pecahan: 0.25 });
    });

    it('harus membaca titik dengan benar', () => {
      expect(parseHalamanPecahan("1.5")).toEqual({ halaman: 1, pecahan: 0.5 });
      expect(parseHalamanPecahan("1.75")).toEqual({ halaman: 1, pecahan: 0.75 });
    });

    it('harus melempar error untuk format acak', () => {
      expect(() => parseHalamanPecahan("")).toThrowError();
      expect(() => parseHalamanPecahan("abc")).toThrowError();
      expect(() => parseHalamanPecahan("1,33")).toThrowError(); // Bukan pecahan standar (0.25, 0.5, 0.75)
    });
  });

  describe('posisiHafalanBerikutnya', () => {
    it('harus berpindah dengan tepat (2 juz selesai -> mulai dari juz ke-3 di urutan hafalan)', () => {
      const urutan = urutanJuzStandar();
      // Asumsikan sedang berada di akhir juz 2 (Surah Al-Baqarah ayat 252)
      // Juz 3 dimulai dari Al-Baqarah ayat 253
      const next = posisiHafalanBerikutnya(2, 252, urutan);
      expect(next).toEqual({
        surahNomor: 2,
        ayat: 253,
        juz: 3
      });
    });
    
    it('harus melompat antar surat (Al-Mulk ke Al-Qalam)', () => {
       const urutan = urutanJuzStandar();
       const next = posisiHafalanBerikutnya(67, 30, urutan);
       expect(next).toEqual({
           surahNomor: 68,
           ayat: 1,
           juz: 29
       })
    });
  });

  describe('labelRentangAyatZiyadah', () => {
    it('harus memproses arah maju (lintas surat) dengan sukses', () => {
      // Al-Falaq (113) ayat 2 -> An-Nas (114) ayat 3
      const label = labelRentangAyatZiyadah(113, 2, 114, 3);
      expect(label).toBe('Al-Falaq 2-5 - An-Nas 1-3');
    });

    it('harus melempar error jika arahnya mundur', () => {
      // An-Nas (114) -> Al-Falaq (113)
      expect(() => labelRentangAyatZiyadah(114, 2, 113, 1)).toThrowError('Ayat selesai harus berada setelah ayat mulai di dalam mushaf.');
    });
    
    it('harus memproses dalam surat yang sama', () => {
        expect(labelRentangAyatZiyadah(1, 1, 1, 7)).toBe('Al-Fatiha ayat 1-7')
    })
  });

  describe('hitungJumlahHalamanDibaca', () => {
    it('harus menghitung selisih halaman utuh', () => {
      expect(hitungJumlahHalamanDibaca({halaman: 1, pecahan: 0}, {halaman: 2, pecahan: 0})).toBe(2);
    });
    it('harus menghitung pecahan dengan benar', () => {
      expect(hitungJumlahHalamanDibaca({halaman: 1, pecahan: 0.5}, {halaman: 1, pecahan: 0.75})).toBe(0.25);
      expect(hitungJumlahHalamanDibaca({halaman: 1, pecahan: 0.5}, {halaman: 2, pecahan: 0.5})).toBe(1);
    });
  });

  describe('bangunUrutanHafalan', () => {
    it('harus membuat urutan dari juz progres kosong (default 30 ke bawah)', () => {
      const result = bangunUrutanHafalan([]);
      expect(result[0]).toBe(30);
      expect(result[result.length - 1]).toBe(1);
    });
    
    it('harus mendeteksi urutan maju', () => {
      const result = bangunUrutanHafalan([1, 2]);
      expect(result.slice(0, 2)).toEqual([1, 2]);
      expect(result[2]).toBe(3);
      expect(result[result.length - 1]).toBe(30);
    });

    it('harus mendeteksi urutan mundur (non-standar)', () => {
      const result = bangunUrutanHafalan([30, 28]);
      expect(result.slice(0, 2)).toEqual([30, 28]);
      expect(result[2]).toBe(29);
      expect(result[3]).toBe(27);
    });
  });

  describe('hitungProgresHalaman', () => {
    it('harus mengembalikan 0 jika posisi terakhir belum ada', () => {
      const urutan = bangunUrutanHafalan([]);
      const result = hitungProgresHalaman(urutan, null);
      expect(result.halamanTertempuh).toBe(0);
      expect(result.persen).toBe(0);
    });

    it('harus menghitung tepat +1 saat berganti halaman (awal juz 30)', () => {
      const urutan = bangunUrutanHafalan([]);
      // Juz 30 dimulai dari halaman 582, ayat pertama An-Naba
      const result = hitungProgresHalaman(urutan, { surahNomor: 78, ayat: 1 });
      // Baru halaman pertama di Juz 30
      expect(result.halamanTertempuh).toBe(1);
    });
  });
});
