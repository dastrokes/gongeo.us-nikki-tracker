import type { BannerData } from '~/types/banner'

/* 
 Banner Types: 
 1 - Permanent
 2 - Limited 5★ with 4★
 3 - Limited 4★
*/

export const BANNER_DATA: BannerData = {
  1: {
    bannerId: 1,
    bannerType: 1,
    outfit4StarId: ['S0056', 'S0058', 'S0084', 'S0092'],
    outfit5StarId: ['S0033', 'S0093', 'S0145', 'S0165'],
    runs: [
      {
        version: '1.0.0',
        start: '2024-12-05',
        end: new Date().toISOString().split('T')[0] ?? '',
      },
    ],
  },
  2: {
    bannerId: 2,
    bannerType: 2,
    outfit4StarId: ['S0164'],
    outfit5StarId: ['S0126'],
    runs: [
      {
        version: '1.0.1',
        start: '2024-12-05',
        end: '2024-12-18',
      },
      {
        version: '1.6.3',
        start: '2025-06-23',
        end: '2025-07-07',
      },
    ],
  },
  3: {
    bannerId: 3,
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
    bannerType: 3,
    outfit4StarId: ['S0153'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.0.2',
        start: '2024-12-18',
        end: '2024-12-29',
      },
      {
        version: '1.5.2',
        start: '2025-05-20',
        end: '2025-06-12',
      },
    ],
  },
  5: {
    bannerId: 5,
    bannerType: 3,
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
    bannerType: 2,
    outfit4StarId: ['S0166'],
    outfit5StarId: ['S0129'],
    runs: [
      {
        version: '1.1.1',
        start: '2024-12-29',
        end: '2025-01-23',
      },
    ],
  },
  7: {
    bannerId: 7,
    bannerType: 3,
    outfit4StarId: ['S0179'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.1.2',
        start: '2025-01-12',
        end: '2025-01-23',
      },
    ],
  },
  8: {
    bannerId: 8,
    bannerType: 3,
    outfit4StarId: ['S0181'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.1.2',
        start: '2025-01-12',
        end: '2025-01-23',
      },
    ],
  },
  9: {
    bannerId: 9,
    bannerType: 2,
    outfit4StarId: ['S0096'],
    outfit5StarId: ['S0117'],
    runs: [
      {
        version: '1.2.1',
        start: '2025-01-23',
        end: '2025-02-25',
      },
    ],
  },
  10: {
    bannerId: 10,
    bannerType: 2,
    outfit4StarId: ['S0097'],
    outfit5StarId: ['S0001'],
    runs: [
      {
        version: '1.2.1',
        start: '2025-01-23',
        end: '2025-02-25',
      },
    ],
  },
  11: {
    bannerId: 11,
    bannerType: 3,
    outfit4StarId: ['S0227'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.2.2',
        start: '2025-02-13',
        end: '2025-02-25',
      },
    ],
  },
  12: {
    bannerId: 12,
    bannerType: 3,
    outfit4StarId: ['S0228'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.2.2',
        start: '2025-02-13',
        end: '2025-02-25',
      },
    ],
  },
  13: {
    bannerId: 13,
    bannerType: 2,
    outfit4StarId: ['S0197'],
    outfit5StarId: ['S0183'],
    runs: [
      {
        version: '1.3.1',
        start: '2025-02-25',
        end: '2025-03-25',
      },
    ],
  },
  14: {
    bannerId: 14,
    bannerType: 3,
    outfit4StarId: ['S0123'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.3.2',
        start: '2025-03-11',
        end: '2025-03-25',
      },
    ],
  },
  15: {
    bannerId: 15,
    bannerType: 3,
    outfit4StarId: ['S0132'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.3.2',
        start: '2025-03-11',
        end: '2025-03-25',
      },
    ],
  },
  16: {
    bannerId: 16,
    bannerType: 2,
    outfit4StarId: ['S0226'],
    outfit5StarId: ['S0223'],
    runs: [
      {
        version: '1.4.1',
        start: '2025-03-25',
        end: '2025-04-28',
      },
    ],
  },
  17: {
    bannerId: 17,
    bannerType: 3,
    outfit4StarId: ['S0114'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.4.2',
        start: '2025-04-08',
        end: '2025-04-28',
      },
    ],
  },
  18: {
    bannerId: 18,
    bannerType: 3,
    outfit4StarId: ['S0105'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.4.2',
        start: '2025-04-08',
        end: '2025-04-28',
      },
    ],
  },
  19: {
    bannerId: 19,
    bannerType: 2,
    outfit4StarId: ['S0208'],
    outfit5StarId: ['S0162'],
    runs: [
      {
        version: '1.5.1',
        start: '2025-04-28',
        end: '2025-06-12',
      },
    ],
  },
  20: {
    bannerId: 20,
    bannerType: 2,
    outfit4StarId: ['S0113'],
    outfit5StarId: ['S0178'],
    runs: [
      {
        version: '1.5.1',
        start: '2025-04-28',
        end: '2025-06-12',
      },
    ],
  },
  21: {
    bannerId: 21,
    bannerType: 3,
    outfit4StarId: ['S0143'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.5.2',
        start: '2025-05-20',
        end: '2025-06-12',
      },
    ],
  },
  22: {
    bannerId: 22,
    bannerType: 3,
    outfit4StarId: ['S0167'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.5.2',
        start: '2025-05-20',
        end: '2025-06-12',
      },
    ],
  },
  23: {
    bannerId: 23,
    bannerType: 2,
    outfit4StarId: ['S0216'],
    outfit5StarId: ['S0154'],
    runs: [
      {
        version: '1.6.1',
        start: '2025-06-12',
        end: '2025-07-07',
      },
    ],
  },
  24: {
    bannerId: 24,
    bannerType: 3,
    outfit4StarId: ['S0198'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.6.2',
        start: '2025-06-23',
        end: '2025-07-07',
      },
    ],
  },
  25: {
    bannerId: 25,
    bannerType: 3,
    outfit4StarId: ['S0238'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.6.2',
        start: '2025-06-23',
        end: '2025-07-07',
      },
    ],
  },
  26: {
    bannerId: 26,
    bannerType: 2,
    outfit4StarId: ['S0232'],
    outfit5StarId: ['S0231'],
    runs: [
      {
        version: '1.7.1',
        start: '2025-07-07',
        end: '2025-07-29',
      },
    ],
  },
  27: {
    bannerId: 27,
    bannerType: 3,
    outfit4StarId: ['S0192'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.7.2',
        start: '2025-07-17',
        end: '2025-07-29',
      },
    ],
  },
  28: {
    bannerId: 28,
    bannerType: 3,
    outfit4StarId: ['S0175'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.7.2',
        start: '2025-07-17',
        end: '2025-07-29',
      },
    ],
  },
  29: {
    bannerId: 29,
    bannerType: 2,
    outfit4StarId: ['S0176'],
    outfit5StarId: ['S0330'],
    runs: [
      {
        version: '1.8.1',
        start: '2025-07-29',
        end: '2025-09-01',
      },
    ],
  },
  30: {
    bannerId: 30,
    bannerType: 2,
    outfit4StarId: ['S0173'],
    outfit5StarId: ['S0331'],
    runs: [
      {
        version: '1.8.1',
        start: '2025-07-29',
        end: '2025-09-01',
      },
    ],
  },
  31: {
    bannerId: 31,
    bannerType: 3,
    outfit4StarId: ['S0204'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.8.2',
        start: '2025-08-19',
        end: '2025-09-01',
      },
    ],
  },
  32: {
    bannerId: 32,
    bannerType: 3,
    outfit4StarId: ['S0333'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.8.2',
        start: '2025-08-19',
        end: '2025-09-01',
      },
    ],
  },
}
