/**
 * Cultivation — Merkezi modül renk sabitleri.
 * Tüm ekranlar, takvim noktaları ve kartlar bu dosyadan renk alır.
 *
 * Solid  → gerçekleşen kayıt (dolu nokta / tam arka plan)
 * Ghost  → planlanan hedef  (soluk nokta / kesik çizgili kart)
 * Accent → kenarlık ve ikon vurgusu (solid rengin koyulaştırılmış tonu)
 * Text   → kart içi metin, rozet rengi
 */

export const ModuleColors = {
  /** Regl — Soft Pastel Pembe */
  period: {
    solid:  '#FFB7B2',
    ghost:  '#FFB7B260',   // %38 alpha — planlanan ghost dot
    accent: '#e06870',     // kenarlık/ikon vurgusu
    text:   '#7a2028',
  },

  /** Spor — Soft Pastel Turuncu */
  sport: {
    solid:  '#FFD8B1',
    ghost:  '#FFD8B160',
    accent: '#c99050',
    text:   '#7a4500',
  },

  /** Ders — Soft Pastel Mavi */
  study: {
    solid:  '#C7CEEA',
    ghost:  '#C7CEEA60',
    accent: '#6b7bbf',
    text:   '#2c3a7a',
  },

  /** Beslenme — Soft Mint Yeşili */
  nutrition: {
    solid:  '#B5EAD7',
    ghost:  '#B5EAD760',
    accent: '#4db896',
    text:   '#1a5c40',
  },

  /** Bütçe — Soft Lavanta/Mor */
  budget: {
    solid:  '#E2CBEB',
    ghost:  '#E2CBEB60',
    accent: '#9b6db5',
    text:   '#4a2070',
  },

  /** Uyku — Soft Gümüş/Mavi-Gri */
  sleep: {
    solid:  '#CFD8DC',
    ghost:  '#CFD8DC60',
    accent: '#78909c',
    text:   '#2c4a5a',
  },

  /** Günlük — Soft Lavanta Lila (mevcut; değişmedi) */
  journal: {
    solid:  '#DDA0DD',
    ghost:  '#DDA0DD60',
    accent: '#b87ab8',
    text:   '#5c2d5c',
  },
} as const;

export type ModuleKey = keyof typeof ModuleColors;
