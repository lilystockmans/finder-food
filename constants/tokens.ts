export const Colors = {
  forest: '#15140F',
  forest2: '#0D0C09',
  sage: '#ECE3D2',
  paper: '#F4EEE2',
  ink: '#15140F',
  muted: '#8A8578',
  line: 'rgba(138,133,120,0.22)',
  ember: '#D6451E',
  warn: '#8C3527',
  amber: '#f6ae2d',
  ice: '#E0AC2E',
  white: '#ffffff',
  macroProtein: '#c96a50',
  macroCarbs: '#7ea8be',
  macroFat: '#f6ae2d',
  macroFiber: '#7a847a',
  waterBlue: '#6db8d4',
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

export const Typography = {
  geist: 'Geist',
  geistMono: 'GeistMono',
  instrumentSerif: 'InstrumentSerif',
} as const;

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
