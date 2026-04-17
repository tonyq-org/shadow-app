export const colors = {
  brand: {
    brass: '#E8C97A',
    brass15: 'rgba(232,201,122,0.15)',
    brass25: 'rgba(232,201,122,0.25)',
    brass33: 'rgba(232,201,122,0.33)',
    brass55: 'rgba(232,201,122,0.55)',
    brass66: 'rgba(232,201,122,0.66)',
    ink: '#0A0B10',
    ivory: '#F6F1E3',
    ivory3: 'rgba(246,241,227,0.03)',
    ivory4: 'rgba(246,241,227,0.04)',
    ivory8: 'rgba(246,241,227,0.08)',
    ivory15: 'rgba(246,241,227,0.15)',
    ivory20: 'rgba(246,241,227,0.2)',
  },
  surface: {
    bg: '#08090D',
    surface: '#11131B',
    surface2: '#181B25',
    line: 'rgba(246,241,227,0.08)',
  },
  text: {
    primary: '#F6F1E3',
    dim: 'rgba(246,241,227,0.55)',
    mute: 'rgba(246,241,227,0.32)',
  },
  status: {
    verified: '#E8C97A',
    warning: '#E8B574',
    danger: '#E88A8A',
    danger25: 'rgba(232,138,138,0.25)',
  },
  cardTone: {
    midnight: {start: '#141829', end: '#0A0D18'},
    graphite: {start: '#222226', end: '#131315'},
    ink: {start: '#142148', end: '#070C1E'},
  },
} as const;

export const radii = {sm: 8, md: 12, lg: 16, xl: 18, xxl: 24} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
} as const;

export const type = {
  serif: 'InstrumentSerif-Regular',
  serifTC: 'NotoSerifTC-Black',
  sans: 'Inter-Regular',
  sansMedium: 'Inter-Medium',
  sansSemiBold: 'Inter-SemiBold',
  mono: 'IBMPlexMono-Regular',
  monoMedium: 'IBMPlexMono-Medium',
} as const;

export const typography = {
  largeTitle: {fontSize: 34, letterSpacing: -0.4, lineHeight: 36},
  cardTitle: {fontSize: 22, letterSpacing: -0.3},
  chineseTitle: {fontSize: 32, letterSpacing: 0},
  body: {fontSize: 14, letterSpacing: 0},
  cardLabel: {fontSize: 13, letterSpacing: 0},
  microLabel: {fontSize: 10, letterSpacing: 2},
  monoId: {fontSize: 12, letterSpacing: 0.5},
} as const;
