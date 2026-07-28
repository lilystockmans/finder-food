import { StyleSheet } from 'react-native';

/**
 * Earthy warm-neutral palette.
 *
 * Key names are deliberately unchanged from the previous scheme so the ~15 files
 * that reference them need no edits — only the values moved. Same approach as the
 * July rebrand.
 *
 * Contrast, all measured, not eyeballed:
 *   ink     on surface 18.08:1  ·  on bg 15.51:1
 *   muted   on surface  5.72:1  ·  on bg  4.90:1   (passes AA at body sizes)
 *   ember   on surface  5.85:1  ·  on bg  5.02:1
 *   support on surface  5.67:1  ·  on bg  4.86:1
 *
 * `muted` was #8A8578, which measured 3.68:1 / 3.16:1 and FAILED AA everywhere it
 * was used — and it carries nearly every secondary label at 11-13px. #6B665A is
 * the lightest value that passes on both surfaces while keeping the warm grey.
 */
export const Colors = {
  forest: '#171614',            // primary ink
  forest2: '#100F0D',           // tab bar / deepest ink
  sage: '#F2EDE4',              // page background (bone)
  paper: '#EDE7DB',             // recessed / pressed surface
  ink: '#171614',
  muted: '#6B665A',             // secondary text — AA on both surfaces
  line: 'rgba(23,22,20,0.10)',  // hairline rules
  track: 'rgba(23,22,20,0.10)', // progress rails, empty ring, empty dots
  ember: '#A6482F',             // accent: FAB, links, active states
  support: '#5F6B4F',           // secondary accent: olive
  warn: '#7E2D1E',              // over-target / destructive, darker than accent
  amber: '#B07D18',             // caution banners, pre-period shading
  ice: '#B07D18',
  white: '#ffffff',             // card surface
  // Macro bars use the validated chart series values so bars and charts agree.
  macroProtein: '#A6482F',
  macroCarbs: '#0076B3',
  macroFat: '#B07D18',
  macroFiber: '#5F6B4F',
  waterBlue: '#0076B3',
} as const;

/**
 * Chart series palette — a fixed categorical order, never cycled.
 *
 * These are NOT the Colors.macro* values. That set fails accessibility validation
 * as a chart palette: macroFat/#f6ae2d sits outside the lightness band (L 0.80),
 * macroCarbs and macroFiber fall under the chroma floor so they read as grey, and
 * two of the four drop below 3:1 contrast on a white card. Fine as thin progress
 * bars with adjacent text labels; not fine as adjacent fills a reader must tell
 * apart.
 *
 * This set passes all five checks against a light surface — lightness band,
 * chroma floor, CVD separation (worst adjacent ΔE 20.2 protan, target ≥ 8),
 * normal-vision floor (25.3), and contrast. Verified with the dataviz
 * validate_palette script; re-run it if any value changes.
 */
export const Series = {
  protein: '#A6482F',
  carbs: '#0076B3',
  fat: '#B07D18',
  fiber: '#6A4A93',
} as const;

/** Fixed assignment order. A 5th series folds into "Other" rather than inventing a hue. */
export const SERIES_ORDER = ['protein', 'carbs', 'fat', 'fiber'] as const;

/**
 * Bricolage Grotesque for everything except charts and the smallest labels, which
 * stay on GeistMono. `geist` / `geistMono` / `instrumentSerif` are kept as aliases
 * pointing at the new faces so existing call sites need no edits.
 *
 * `display` and `displayBold` carry frozen TABULAR figures — use them for any
 * number that changes, or it will jump sideways as the value updates.
 */
export const Typography = {
  sans: 'Bricolage',
  sansMedium: 'Bricolage-Medium',
  sansSemi: 'Bricolage-SemiBold',
  display: 'BricolageDisplay',
  displayBold: 'BricolageDisplay-Bold',
  mono: 'GeistMono',
  monoMedium: 'GeistMono-Medium',

  // Back-compat aliases.
  geist: 'Bricolage',
  geistMono: 'GeistMono',
  instrumentSerif: 'BricolageDisplay-Bold',
} as const;

/**
 * Minimum legible size for secondary text. Both platforms discourage going below
 * this; the previous design had labels at 9.5px.
 */
export const MIN_FONT_SIZE = 11;

/** Minimum touch target on both platforms. */
export const MIN_TOUCH = 44;

/**
 * Hairline rules. StyleSheet.hairlineWidth can round to 0 at some Android
 * densities, which makes rules vanish entirely, so floor it at 1.
 */
export const HAIRLINE = Math.max(1, StyleSheet.hairlineWidth);

export const Radius = {
  pill: 999,
  card: 20,
  sheet: 28,
  input: 12,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
} as const;
