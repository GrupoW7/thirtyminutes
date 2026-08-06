/**
 * Design tokens for 30minutes.
 * A calm, "put the phone down and live" palette: deep night-blue base,
 * a fresh mint/green as the primary (growth, life, balance) and a warm
 * amber accent for the gamified activities world.
 */

export const colors = {
  // Brand
  primary: '#3DDC97', // mint green — the "live your life" energy
  primaryDark: '#25B37A',
  accent: '#FFB454', // warm amber — activities / gamification
  accentDark: '#E8963A',

  // Backgrounds (dark-first, this is a nighttime "less screen" app)
  bg: '#0F1B2D',
  bgElevated: '#16263D',
  surface: '#1C2E49',
  surfaceAlt: '#223655',

  // Text
  text: '#F4F7FB',
  textMuted: '#9DB0C9',
  textFaint: '#5E739A',

  // Feedback
  danger: '#FF6B6B',
  warning: '#FFC864',
  success: '#3DDC97',

  // Lines
  border: '#2A3E5E',
  borderStrong: '#38517A',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
  pill: 999,
} as const;

export const font = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
