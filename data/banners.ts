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
        version: '1.6.2',
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
      {
        version: '1.7.2',
        start: '2025-07-17',
        end: '2025-07-29',
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
    rewardIds: ['1021720020', '1021920009', '1021900003'],
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
    rewardIds: ['1021730011', '1021740006', '1021780004'],
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
    rewardIds: ['1021730005', '1021710007', '1020300072'],
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
    rewardIds: ['1021750009', '1021740002', '1021940004'],
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
    rewardIds: ['1021730006', '1021980005', '1021940002'],
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
    rewardIds: ['1029740008', '1021770006', '1020200073'],
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
    rewardIds: ['1020730072', '1020760072', '1021410010'],
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
    rewardIds: ['1020770072', '1020500072', '1020780115'],
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
    rewardIds: ['1020760100', '1020100072', '1029780052'],
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
    rewardIds: ['1029730052', '1020740086', '1020410072'],
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
    rewardIds: ['1029930008', '1029720008', '1020900080'],
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
    rewardIds: ['1029730008', '1029500008', '1021780017'],
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
    rewardIds: ['1020740087', '1020600273', '1021941001'],
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
    rewardIds: ['1029730004', '1029720004', '1021900014'],
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
    rewardIds: ['1021980002', '1029720053', '1020780087'],
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
    rewardIds: ['1029730007', '1021750006', '1029410007'],
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
    rewardIds: ['1020730087', '1020770102', '1021300041'],
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
    rewardIds: ['1029740004', '1021970002', '1021940007'],
  },
  33: {
    bannerId: 33,
    bannerType: 2,
    outfit4StarId: ['S0085'],
    outfit5StarId: ['S0239'],
    runs: [
      {
        version: '1.9.1',
        start: '2025-09-01',
        end: '2025-09-28',
      },
    ],
  },
  34: {
    bannerId: 34,
    bannerType: 3,
    outfit4StarId: ['S0332'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.9.2',
        start: '2025-09-16',
        end: '2025-09-28',
      },
    ],
    rewardIds: ['1021500032', '1020720102', '1021410015'],
  },
  35: {
    bannerId: 35,
    bannerType: 3,
    outfit4StarId: ['S0313'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.9.2',
        start: '2025-09-16',
        end: '2025-09-28',
      },
    ],
    rewardIds: ['1020740277', '1029600007', '1021410045'],
  },
  36: {
    bannerId: 36,
    bannerType: 2,
    outfit4StarId: ['S0252'],
    outfit5StarId: ['S0250'],
    runs: [
      {
        version: '1.10.1',
        start: '2025-09-28',
        end: '2025-10-27',
      },
    ],
  },
  37: {
    bannerId: 37,
    bannerType: 3,
    outfit4StarId: ['S0258'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.10.2',
        start: '2025-10-14',
        end: '2025-10-27',
      },
    ],
    rewardIds: ['1020730103', '1020740260', '1021900009'],
  },
  38: {
    bannerId: 38,
    bannerType: 3,
    outfit4StarId: ['S0251'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.10.2',
        start: '2025-10-14',
        end: '2025-10-27',
      },
    ],
    rewardIds: ['1029750019', '1021710017', '1021410012'],
  },
  39: {
    bannerId: 39,
    bannerType: 2,
    outfit4StarId: ['S0279'],
    outfit5StarId: ['S0289'],
    runs: [
      {
        version: '1.11.1',
        start: '2025-10-27',
        end: '2025-11-25',
      },
    ],
  },
  40: {
    bannerId: 40,
    bannerType: 3,
    outfit4StarId: ['S0049'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.11.2',
        start: '2025-11-12',
        end: '2025-11-25',
      },
    ],
  },
  41: {
    bannerId: 41,
    bannerType: 3,
    outfit4StarId: ['S0234'],
    outfit5StarId: [],
    runs: [
      {
        version: '1.11.2',
        start: '2025-11-12',
        end: '2025-11-25',
      },
    ],
  },
}
