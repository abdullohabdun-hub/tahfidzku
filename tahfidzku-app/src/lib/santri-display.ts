export function getSantriDisplayMode(profil: { tahapSantri?: string | null }) {
  return profil.tahapSantri === 'iqra' ? 'iqra' : 'tahfidz'
}
