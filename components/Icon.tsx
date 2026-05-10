import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import { Colors } from '../constants/tokens';

type IconName =
  | 'home' | 'plus' | 'chart' | 'user' | 'arrow-r' | 'arrow-l'
  | 'check' | 'x' | 'camera' | 'barcode' | 'search' | 'bookmark'
  | 'clock' | 'edit' | 'trash' | 'warn' | 'spark' | 'flame'
  | 'scale' | 'minus' | 'chev-d' | 'chev-r' | 'chev-l' | 'chev-u'
  | 'dot' | 'leaf' | 'calendar' | 'target' | 'settings' | 'bolt'
  | 'plus-s' | 'save' | 'move' | 'info';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  sw?: number;
}

export function Icon({ name, size = 24, color = Colors.forest, sw = 1.6 }: IconProps) {
  const props = {
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  const paths: Record<IconName, React.ReactNode> = {
    home: <Path {...props} d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />,
    plus: (
      <>
        <Line {...props} x1="12" y1="5" x2="12" y2="19" />
        <Line {...props} x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    chart: (
      <>
        <Path {...props} d="M18 20V10" />
        <Path {...props} d="M12 20V4" />
        <Path {...props} d="M6 20v-6" />
      </>
    ),
    user: (
      <>
        <Circle {...props} cx="12" cy="8" r="4" />
        <Path {...props} d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </>
    ),
    'arrow-r': <Path {...props} d="M5 12h14M13 6l6 6-6 6" />,
    'arrow-l': <Path {...props} d="M19 12H5M11 18l-6-6 6-6" />,
    check: <Path {...props} d="M5 12l5 5L19 7" />,
    x: (
      <>
        <Line {...props} x1="18" y1="6" x2="6" y2="18" />
        <Line {...props} x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    camera: (
      <>
        <Path {...props} d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <Circle {...props} cx="12" cy="13" r="4" />
      </>
    ),
    barcode: (
      <>
        <Path {...props} d="M3 3h2v18H3zM7 3h1v18H7zM11 3h2v18h-2zM15 3h1v18h-1zM18 3h1v18h-1zM21 3h1v18h-1z" />
      </>
    ),
    search: (
      <>
        <Circle {...props} cx="11" cy="11" r="8" />
        <Line {...props} x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    bookmark: (
      <>
        <Path {...props} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </>
    ),
    clock: (
      <>
        <Circle {...props} cx="12" cy="12" r="9" />
        <Path {...props} d="M12 7v5l3 3" />
      </>
    ),
    edit: (
      <>
        <Path {...props} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <Path {...props} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </>
    ),
    trash: (
      <>
        <Polyline {...props} points="3 6 5 6 21 6" />
        <Path {...props} d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <Path {...props} d="M10 11v6M14 11v6" />
        <Path {...props} d="M9 6V4h6v2" />
      </>
    ),
    warn: (
      <>
        <Path {...props} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <Line {...props} x1="12" y1="9" x2="12" y2="13" />
        <Line {...props} x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
    spark: <Path {...props} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
    flame: <Path {...props} d="M12 22c5 0 8-3.5 8-8 0-3-1.5-5.5-4-7 1 3-1 5-3 5 0-2-1-4-3-5 0 4-3 6-3 9 0 3.5 2.5 6 5 6z" />,
    scale: (
      <>
        <Path {...props} d="M12 3v18M3 12h18" />
        <Circle {...props} cx="12" cy="12" r="3" />
      </>
    ),
    minus: <Line {...props} x1="5" y1="12" x2="19" y2="12" />,
    'chev-d': <Path {...props} d="M6 9l6 6 6-6" />,
    'chev-r': <Path {...props} d="M9 18l6-6-6-6" />,
    'chev-l': <Path {...props} d="M15 18l-6-6 6-6" />,
    'chev-u': <Path {...props} d="M18 15l-6-6-6 6" />,
    dot: <Circle {...props} fill={color} cx="12" cy="12" r="3" />,
    leaf: <Path {...props} d="M5 21C5 12 12 3 21 3 21 12 14 21 5 21zM9 15l6-6" />,
    calendar: (
      <>
        <Rect {...props} x="3" y="4" width="18" height="18" rx="2" />
        <Line {...props} x1="16" y1="2" x2="16" y2="6" />
        <Line {...props} x1="8" y1="2" x2="8" y2="6" />
        <Line {...props} x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    target: (
      <>
        <Circle {...props} cx="12" cy="12" r="9" />
        <Circle {...props} cx="12" cy="12" r="5" />
        <Circle {...props} cx="12" cy="12" r="1" />
      </>
    ),
    settings: (
      <>
        <Circle {...props} cx="12" cy="12" r="3" />
        <Path {...props} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </>
    ),
    bolt: <Path {...props} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
    'plus-s': (
      <>
        <Circle {...props} cx="12" cy="12" r="9" />
        <Line {...props} x1="12" y1="8" x2="12" y2="16" />
        <Line {...props} x1="8" y1="12" x2="16" y2="12" />
      </>
    ),
    save: (
      <>
        <Path {...props} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <Polyline {...props} points="17 21 17 13 7 13 7 21" />
        <Polyline {...props} points="7 3 7 8 15 8" />
      </>
    ),
    move: (
      <>
        <Polyline {...props} points="5 9 2 12 5 15" />
        <Polyline {...props} points="9 5 12 2 15 5" />
        <Polyline {...props} points="15 19 12 22 9 19" />
        <Polyline {...props} points="19 9 22 12 19 15" />
        <Line {...props} x1="2" y1="12" x2="22" y2="12" />
        <Line {...props} x1="12" y1="2" x2="12" y2="22" />
      </>
    ),
    info: (
      <>
        <Circle {...props} cx="12" cy="12" r="9" />
        <Line {...props} x1="12" y1="8" x2="12" y2="8" strokeWidth={2.5} />
        <Line {...props} x1="12" y1="12" x2="12" y2="16" />
      </>
    ),
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths[name]}
    </Svg>
  );
}
