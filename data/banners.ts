import type { BannerData } from '~/types/banner'

/* 
 Banner Types: 
 1 - Permanent
 2 - Limited 5* with 4*
 3 - Limited 4*
*/

export const BANNER_DATA: BannerData = {
  1: {
    bannerId: 1,
    bannerName: 'Distant Sea',
    bannerType: 1,
    outfit4StarId: [],
    outfit5StarId: ['S0145', 'S0165', 'S0093', 'S0033'],
    runs: [
      {
        version: '1.0.0',
        start: '2024-12-05',
        end: '9999-12-31',
      },
    ],
  },
  2: {
    bannerId: 2,
    bannerName: 'Butterfly Dream',
    bannerType: 2,
    outfit4StarId: ['S0164'],
    outfit5StarId: ['S0126'],
    runs: [
      {
        version: '1.0.1',
        start: '2024-12-05',
        end: '2024-12-18',
      },
    ],
  },
  3: {
    bannerId: 3,
    bannerName: 'Blooming Fantasy',
    bannerType: 2,
    outfit4StarId: ['S0163'],
    outfit5StarId: ['S0161'],
    runs: [
      {
        version: '1.0.1',
        start: '2024-12-05',
        end: '2024-12-18',
      },
    ],
  },
  4: {
    bannerId: 4,
    bannerName: "Croaker's Whisper",
    bannerType: 3,
    outfit4StarId: ['S0153'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.0.2',
        start: '2024-12-18',
        end: '2024-12-29',
      },
    ],
  },
  5: {
    bannerId: 5,
    bannerName: 'Bubbling Affections',
    bannerType: 2,
    outfit4StarId: ['S0107'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.0.2',
        start: '2024-12-18',
        end: '2024-12-29',
      },
    ],
  },
  6: {
    bannerId: 6,
    bannerName: 'Celestial Wishes',
    bannerType: 2,
    outfit4StarId: ['S0166'],
    outfit5StarId: ['S0129'],
    runs: [
      {
        version: '1.2.1',
        start: '2024-12-29',
        end: '2025-01-23',
      },
    ],
  },
  7: {
    bannerId: 7,
    bannerName: 'Ribbon Reverie',
    bannerType: 3,
    outfit4StarId: ['S0179'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.2.2',
        start: '2025-01-12',
        end: '2025-01-23',
      },
    ],
  },
  8: {
    bannerId: 8,
    bannerName: 'Starlit Wishfin',
    bannerType: 3,
    outfit4StarId: ['S0181'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.2.2',
        start: '2025-01-12',
        end: '2025-01-23',
      },
    ],
  },
  9: {
    bannerId: 9,
    bannerName: 'Skyward Bouquets',
    bannerType: 2,
    outfit4StarId: ['S0096'],
    outfit5StarId: ['S0117'],
    runs: [
      {
        version: '1.3.1',
        start: '2025-01-24',
        end: '2025-02-25',
      },
    ],
  },
  10: {
    bannerId: 10,
    bannerName: 'Fireworks Prelude',
    bannerType: 2,
    outfit4StarId: ['S0097'],
    outfit5StarId: ['S0001'],
    runs: [
      {
        version: '1.3.1',
        start: '2025-01-24',
        end: '2025-02-25',
      },
    ],
  },
  11: {
    bannerId: 11,
    bannerName: 'Blossom Silhouettes',
    bannerType: 3,
    outfit4StarId: ['S0227'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.3.2',
        start: '2025-02-13',
        end: '2025-02-25',
      },
    ],
  },
  12: {
    bannerId: 12,
    bannerName: 'Breezy Melodies',
    bannerType: 3,
    outfit4StarId: ['S0228'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.3.2',
        start: '2025-02-13',
        end: '2025-02-25',
      },
    ],
  },
  13: {
    bannerId: 13,
    bannerName: 'Lingering Finale',
    bannerType: 2,
    outfit4StarId: ['S0197'],
    outfit5StarId: ['S0183'],
    runs: [
      {
        version: '1.4.1',
        start: '2025-02-25',
        end: '2025-03-25',
      },
    ],
  },
  14: {
    bannerId: 14,
    bannerName: 'Time of Serenity',
    bannerType: 3,
    outfit4StarId: ['S0123'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.4.2',
        start: '2025-03-11',
        end: '2025-03-25',
      },
    ],
  },
  15: {
    bannerId: 15,
    bannerName: 'Journey on Wind',
    bannerType: 3,
    outfit4StarId: ['S0132'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.4.2',
        start: '2025-03-11',
        end: '2025-03-25',
      },
    ],
  },
  16: {
    bannerId: 16,
    bannerName: 'Into the Illusion',
    bannerType: 2,
    outfit4StarId: ['S0226'],
    outfit5StarId: ['S0223'],
    runs: [
      {
        version: '1.5.1',
        start: '2025-03-25',
        end: '2025-04-28',
      },
    ],
  },
  17: {
    bannerId: 17,
    bannerName: 'Dancing Shepherdess',
    bannerType: 3,
    outfit4StarId: ['S0114'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.5.2',
        start: '2025-04-08',
        end: '2025-04-28',
      },
    ],
  },
  18: {
    bannerId: 18,
    bannerName: 'Magical Scribbles',
    bannerType: 3,
    outfit4StarId: ['S0105'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.5.2',
        start: '2025-04-08',
        end: '2025-04-28',
      },
    ],
  },
}
