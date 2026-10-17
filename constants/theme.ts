// Shared design tokens for the whole app. Use these instead of raw hex values in screens.

export const colors = {
  background: '#0A0F0C',
  surface: '#121915',
  surfaceRaised: '#19221D',
  border: '#24302A',
  borderStrong: '#33433A',

  text: '#F1F5F2',
  textMuted: '#9AA8A0',
  textFaint: '#6B7A72',

  primary: '#34D399',
  primaryPressed: '#22B583',
  primarySoft: 'rgba(52, 211, 153, 0.12)',
  onPrimary: '#04261A',

  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.12)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.12)',

  scrim: 'rgba(0, 0, 0, 0.6)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const type = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5, color: colors.text },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.text },
  heading: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 16, lineHeight: 24, color: colors.text },
  bodyMuted: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
  caption: { fontSize: 12, color: colors.textFaint },
};

// Max content width so screens don't stretch edge to edge on web / tablets.
export const contentMaxWidth = 720;

// Web only: hide the browser's focus outline on inputs that show focus another way.
export const noWebOutline = { outlineStyle: 'none' } as any;
