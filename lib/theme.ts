/**
 * Twirl design tokens — derived from the UI mocks.
 * Warm ivory canvas, raspberry-crimson primary, wine serif headings.
 * Restyle the whole app from here.
 */

export const colors = {
  // Surfaces
  background: "#FBF6F0", // warm ivory app canvas
  surface: "#FFFFFF", // cards
  surfaceAlt: "#F6EDE6", // inset / banner tint
  overlay: "rgba(40, 28, 24, 0.45)", // modal scrim

  // Brand
  primary: "#B8254A", // raspberry-crimson (buttons, active, links)
  primaryDark: "#9C1C3D", // pressed
  primarySoft: "#FBE9EE", // tinted fill behind primary content
  wine: "#5A2533", // serif wordmark / display headings

  // Text
  text: "#2B2422", // primary near-black warm
  textMuted: "#8C8079", // secondary
  textFaint: "#B6ABA3", // tertiary / placeholders

  // Lines & states
  border: "#ECE2DA", // hairlines / input borders
  borderStrong: "#DCCFC5",
  success: "#3F7D58",
  danger: "#C0392B",
  star: "#C9974A", // rating gold

  white: "#FFFFFF",
  black: "#000000",
} as const;

export const fonts = {
  // Loaded in app/_layout.tsx via @expo-google-fonts/playfair-display.
  serif: "PlayfairDisplay_500Medium",
  serifSemibold: "PlayfairDisplay_600SemiBold",
  serifBold: "PlayfairDisplay_700Bold",
  // Body uses the platform system font for crisp legibility.
  body: undefined as string | undefined,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  caption: 12,
  small: 13,
  body: 15,
  base: 16,
  lg: 18,
  xl: 22,
  display: 28,
  hero: 34,
} as const;

export const shadow = {
  card: {
    shadowColor: "#5A2533",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: "#5A2533",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

/** Horizontal padding used by most screens. */
export const SCREEN_PADDING = spacing.xl;

export const theme = { colors, fonts, spacing, radius, fontSize, shadow };
export type Theme = typeof theme;
