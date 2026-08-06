/**
 * Design tokens for 30minutes — "Atmospheric Logic".
 * Modern Corporate, light-first: airy white/grey surfaces, a signature
 * primary blue, tonal elevation instead of heavy shadows, high roundedness.
 */

export const colors = {
  // Brand
  primary: '#0058bd', // signature blue
  primaryDark: '#004494',
  primaryTint: '#e5eefb', // light blue — active pills, secondary buttons
  accent: '#F59E0B', // warm amber — activities / gamification
  accentDark: '#B45309',

  // Backgrounds (light, tonal elevation)
  bg: '#f8f9fa', // base background
  bgElevated: '#ffffff', // headers / tab bar
  surface: '#ffffff', // cards — white sheets on the grey base
  surfaceAlt: '#eef0f2', // subtle container (avatars, tracks)

  // Text
  text: '#191c1d',
  textMuted: '#424753',
  textFaint: '#727785',

  // Feedback (semantic only)
  danger: '#ba1a1a',
  warning: '#f2a600',
  success: '#34A853',

  // Lines
  border: '#e1e3e4',
  borderStrong: '#c2c6d5',

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
  // Soft ambient elevation for floating elements (menus, FABs).
  card: {
    shadowColor: '#0b1f3a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;
