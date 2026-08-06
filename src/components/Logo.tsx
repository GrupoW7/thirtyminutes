import React from 'react';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

/**
 * The 30minutes brand mark — a circular progress ring (grey track + blue arc)
 * orbited by five activity icon-badges (read · grow · recharge · love · move),
 * with an optional "30" in the center. Faithfully reproduces the design canvas
 * "30minutes Logo" (variant 11b / 12c).
 */

const NAVY = '#1E2B4A';
const BLUE = '#4285F4';
const GREEN = '#34A853';
const YELLOW = '#FBBC05';
const RED = '#EA4335';
const TRACK = '#c2c6d5';

function IconBadge({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <G x={x} y={y}>
      <Rect width={46} height={46} rx={14} fill={NAVY} />
      {children}
    </G>
  );
}

export function LogoMark({ size = 64, showNumber = true }: { size?: number; showNumber?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 260 260">
      {/* Progress ring */}
      <Circle cx={130} cy={130} r={82} fill="none" stroke={TRACK} strokeWidth={28} />
      <Circle
        cx={130}
        cy={130}
        r={82}
        fill="none"
        stroke={BLUE}
        strokeWidth={28}
        strokeLinecap="round"
        strokeDasharray="229 516"
        transform="rotate(-80 130 130)"
      />

      {showNumber ? (
        <SvgText
          x={130}
          y={156}
          textAnchor="middle"
          fontSize={76}
          fontWeight="800"
          fill={NAVY}
        >
          30
        </SvgText>
      ) : null}

      {/* Read (book) */}
      <IconBadge x={75} y={8}>
        <Rect x={12} y={13} width={22} height={20} rx={3} fill="none" stroke={GREEN} strokeWidth={3} />
        <Line x1={19} y1={13} x2={19} y2={33} stroke={GREEN} strokeWidth={3} />
        <Line x1={26} y1={13} x2={26} y2={33} stroke={GREEN} strokeWidth={3} />
      </IconBadge>

      {/* Grow (chart) */}
      <IconBadge x={191} y={46}>
        <Path d="M18 31 V15 L32 12 V28" fill="none" stroke={BLUE} strokeWidth={3} strokeLinejoin="round" />
        <Circle cx={15} cy={31} r={4} fill={BLUE} />
        <Circle cx={29} cy={28} r={4} fill={BLUE} />
      </IconBadge>

      {/* Recharge (coffee) */}
      <IconBadge x={3} y={107}>
        <Path d="M13 20 h18 v10 a7 7 0 0 1 -7 7 h-4 a7 7 0 0 1 -7 -7 z" fill="none" stroke={YELLOW} strokeWidth={3} />
        <Path d="M31 22 h4 a4 4 0 0 1 0 8 h-4" fill="none" stroke={YELLOW} strokeWidth={3} />
        <Line x1={19} y1={11} x2={19} y2={15} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
        <Line x1={25} y1={11} x2={25} y2={15} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
      </IconBadge>

      {/* Love (heart) */}
      <IconBadge x={191} y={168}>
        <Path d="M23 34 C15 27 10 22 12 17 C14 12 21 12 23 17 C25 12 32 12 34 17 C36 22 31 27 23 34 Z" fill={RED} />
      </IconBadge>

      {/* Move (active person) */}
      <IconBadge x={75} y={206}>
        <Circle cx={27} cy={13} r={4} fill={GREEN} />
        <Path
          d="M16 20 L25 21 L22 28 L17 36 M25 21 L27 29 L29 36 M25 21 L24 28"
          fill="none"
          stroke={GREEN}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </IconBadge>
    </Svg>
  );
}

/** Brand colors exported for the wordmark and any logo-adjacent UI. */
export const logoColors = { navy: NAVY, blue: BLUE, green: GREEN, yellow: YELLOW, red: RED } as const;
