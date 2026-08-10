// Nominal pipe size lookup: US trade size → nominal ID in mm + Hazen-Williams C factor for copper type L
export const PIPE_TABLE: Record<string, { nominalMm: number; hwC: number; label: string }> = {
  "1/2":   { nominalMm: 15,  hwC: 130, label: '½"' },
  "3/4":   { nominalMm: 19,  hwC: 130, label: '¾"' },
  "1":     { nominalMm: 25,  hwC: 130, label: '1"' },
  "1-1/4": { nominalMm: 32,  hwC: 130, label: '1¼"' },
  "1-1/2": { nominalMm: 38,  hwC: 130, label: '1½"' },
  "2":     { nominalMm: 50,  hwC: 130, label: '2"' },
  "3":     { nominalMm: 75,  hwC: 130, label: '3"' },
  "4":     { nominalMm: 100, hwC: 130, label: '4"' },
};

export const PIPE_SIZES_ORDERED = ["1/2","3/4","1","1-1/4","1-1/2","2","3","4"] as const;
