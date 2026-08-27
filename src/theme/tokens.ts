/**
 * Skydive brand tokens (ADR 0006).
 * Neutrals lead. Accents are spare — charts, highlights, small details.
 * Headlines: Inter Medium until Aeonik is licensed.
 */
export const color = {
  greyDark: '#262523',
  greyMedium: '#ABA8A5',
  greyLight: '#EBEBE9',
  offWhite: '#F7F7F7',
  white: '#FFFFFF',
  accentOrange: '#EB8F4B',
  accentRed: '#E15F60',
  accentGreen: '#569D7B',
  accentPink: '#E597B4',
  accentYellow: '#EFB24A',
  accentBlue: '#6699C4',
} as const;

export const font = {
  family: 'Inter',
  familyMedium: 'Inter-Medium',
  size: {
    caption: 13,
    body: 16,
    title: 22,
    display: 32,
  },
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
} as const;
