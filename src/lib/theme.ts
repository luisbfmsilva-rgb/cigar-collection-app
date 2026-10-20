export const colors = {
  bg: '#17120E',
  bgDeep: '#120E0B',
  surface: '#241C16',
  surfaceAlt: '#2E2219',
  chip: '#3A2A1E',
  border: '#3A2E25',
  borderStrong: '#5A4636',
  text: '#F4EBDD',
  textBody: '#E6DACA',
  textMuted: '#BFAE96',
  accent: '#E3964A',
  accentSoft: '#F2B577',
  onAccent: '#1A120C',
  gold: '#E3C9A0',
  success: '#2F4A3A',
  onSuccess: '#D7F0DF',
  warning: '#4A3A22',
  onWarning: '#F2D9A8',
  danger: '#B5584A',
  onDanger: '#FFFFFF',
  avatar: ['#5B3A22', '#2F4A3A', '#3B3A5C', '#4A2F3A', '#2F3F4A'],
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const fonts = {
  display: 'DMSerifDisplay',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
};

export const type = {
  display: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  heading: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.textBody, lineHeight: 21 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  caption: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  overline: {
    fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted,
    textTransform: 'uppercase' as const, letterSpacing: 1.2,
  },
};

/** Minimum touch target (Apple HIG / Material). */
export const TOUCH = 44;
