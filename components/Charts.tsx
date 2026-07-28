import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, GestureResponderEvent } from 'react-native';
import Svg, { Line, Path, Rect, Circle, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Series } from '../constants/tokens';

export const Y_AXIS_WIDTH = 34;
const AXIS_LABEL_SIZE = 9;
const LINE_WIDTH = 2;
const POINT_R = 4;          // 8px diameter — the minimum legible marker
const SEGMENT_GAP = 2;      // surface gap between stacked fills
const BAR_RADIUS = 4;
/**
 * Headroom above the highest gridline. Without it the top tick sits at y=0 and
 * its label ascends out of the viewport — the value is silently clipped. Caught
 * by screenshotting the charts, not by any type or palette check.
 */
const PLOT_TOP = 10;

/** Bar width that never exceeds its slot. At 90 days a slot is ~3px, so a fixed
 *  minimum of 4px would make neighbouring bars overlap. */
function barWidth(slot: number): number {
  return Math.max(1, slot > 6 ? slot - 3 : slot * 0.7);
}

// ---------------------------------------------------------------- shared parts

/** Recessive horizontal gridlines with right-aligned value labels. */
function YAxis({ ticks, toY, width, format }: {
  ticks: number[];
  toY: (v: number) => number;
  width: number;
  format: (v: number) => string;
}) {
  return (
    <>
      {ticks.map((v, i) => (
        <React.Fragment key={i}>
          <Line
            x1={Y_AXIS_WIDTH} y1={toY(v)} x2={width} y2={toY(v)}
            stroke={Colors.line} strokeWidth={1}
          />
          <SvgText
            x={Y_AXIS_WIDTH - 6} y={toY(v) + 3}
            fontSize={AXIS_LABEL_SIZE} fontFamily={Typography.geistMono}
            fill={Colors.muted} textAnchor="end"
          >
            {format(v)}
          </SvgText>
        </React.Fragment>
      ))}
    </>
  );
}

function XEnds({ dates, width, height }: { dates: string[]; width: number; height: number }) {
  return (
    <>
      <SvgText x={Y_AXIS_WIDTH} y={height + 16} fontSize={10} fontFamily={Typography.geistMono} fill={Colors.muted}>
        {dates[0]?.slice(5)}
      </SvgText>
      <SvgText x={width} y={height + 16} fontSize={10} fontFamily={Typography.geistMono} fill={Colors.muted} textAnchor="end">
        {dates[dates.length - 1]?.slice(5)}
      </SvgText>
    </>
  );
}

/**
 * Touch-scrub layer. Reports the index under the finger, or null when released.
 *
 * Deliberately does NOT claim the gesture on vertical movement, and grants
 * termination requests, so the parent ScrollView can still scroll the page when
 * the finger starts on a chart. Horizontal drags scrub; a tap reads one value.
 */
function useScrub(count: number, plotLeft: number, plotWidth: number) {
  const [index, setIndex] = useState<number | null>(null);
  const idxFromEvent = (e: GestureResponderEvent) => {
    if (count <= 0) return null;
    const x = e.nativeEvent.locationX - plotLeft;
    const step = plotWidth / count;
    const i = Math.floor(x / step);
    return i < 0 ? 0 : i >= count ? count - 1 : i;
  };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => true,
      onPanResponderGrant: (e) => setIndex(idxFromEvent(e)),
      onPanResponderMove: (e) => setIndex(idxFromEvent(e)),
      onPanResponderRelease: () => setIndex(null),
      onPanResponderTerminate: () => setIndex(null),
    })
  ).current;
  return { index, responder };
}

function ScrubReadout({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readout}>
      <Text style={styles.readoutLabel}>{label}</Text>
      <Text style={styles.readoutValue}>{value}</Text>
    </View>
  );
}

export function ChartEmpty({ message, height }: { message: string; height: number }) {
  return (
    <View style={[styles.empty, { height: height + 20 }]}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function Legend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <View style={styles.legend}>
      {items.map((it) => (
        <View key={it.label} style={styles.legendItem}>
          <View style={[
            it.dashed ? styles.legendDash : styles.legendLine,
            { backgroundColor: it.color },
          ]} />
          <Text style={styles.legendLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

function niceTicks(min: number, max: number, count = 3): number[] {
  if (max <= min) return [min];
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(max - ((max - min) / (count - 1)) * i);
  return out;
}

// ------------------------------------------------------------------ line chart

export function WeightChart({ dates, values, goalKg, trendValues, width, height }: {
  dates: string[];
  values: (number | null)[];
  goalKg?: number;
  trendValues?: (number | null)[];
  width: number;
  height: number;
}) {
  const nonNull = values.filter((v): v is number => v !== null);
  const plotWidth = width - Y_AXIS_WIDTH;
  const { index, responder } = useScrub(dates.length, Y_AXIS_WIDTH, plotWidth);

  if (nonNull.length === 0) {
    return <ChartEmpty height={height} message="No weight logged in this range. Add one below and the trend appears here." />;
  }

  const trendNonNull = trendValues?.filter((v): v is number => v !== null) ?? [];
  const allVals = [...nonNull, ...trendNonNull, goalKg].filter((v): v is number => v !== undefined);
  const minV = Math.min(...allVals) - 1;
  const maxV = Math.max(...allVals) + 1;
  const range = maxV - minV || 1;
  const n = dates.length;
  const xStep = plotWidth / (n - 1 || 1);
  const toX = (i: number) => Y_AXIS_WIDTH + i * xStep;
  const toY = (v: number) => PLOT_TOP + (1 - (v - minV) / range) * (height - PLOT_TOP);

  const buildPath = (vals: (number | null)[] | undefined) => {
    let d = ''; let started = false;
    vals?.forEach((v, i) => {
      if (v === null) return;
      d += started ? ` L${toX(i)},${toY(v)}` : `M${toX(i)},${toY(v)}`;
      started = true;
    });
    return d;
  };

  const path = buildPath(values);
  const trendPath = buildPath(trendValues);
  const showTrend = !!trendValues && trendNonNull.length >= 5;
  const goalY = goalKg ? toY(goalKg) : null;

  // Nearest logged point at or before the scrubbed index.
  let readIdx = index;
  if (readIdx != null && values[readIdx] == null) {
    for (let i = readIdx; i >= 0; i--) if (values[i] != null) { readIdx = i; break; }
  }
  const readVal = readIdx != null ? values[readIdx] : null;

  return (
    <View>
      {readVal != null && readIdx != null && (
        <ScrubReadout label={dates[readIdx]} value={`${readVal.toFixed(1)} kg`} />
      )}
      <View {...responder.panHandlers}>
        <Svg width={width} height={height + 20}>
          <YAxis ticks={niceTicks(minV, maxV)} toY={toY} width={width} format={(v) => v.toFixed(1)} />
          {/* Reference rules are solid and recessive. Dashing a rule reads as
              noise and competes with the data marks. */}
          {goalY != null && (
            <Line x1={Y_AXIS_WIDTH} y1={goalY} x2={width} y2={goalY} stroke={Colors.forest} strokeWidth={1} opacity={0.4} />
          )}
          {showTrend && trendPath !== '' && (
            <Path d={trendPath} stroke={Series.carbs} strokeWidth={1.5} fill="none" strokeDasharray="6 3" strokeLinecap="round" />
          )}
          {path !== '' && (
            <Path d={path} stroke={Colors.forest} strokeWidth={LINE_WIDTH} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          )}
          {values.map((v, i) => (v != null ? <Circle key={i} cx={toX(i)} cy={toY(v)} r={POINT_R} fill={Colors.forest} /> : null))}
          {readIdx != null && readVal != null && (
            <>
              <Line x1={toX(readIdx)} y1={PLOT_TOP} x2={toX(readIdx)} y2={height} stroke={Colors.forest} strokeWidth={1} opacity={0.35} />
              <Circle cx={toX(readIdx)} cy={toY(readVal)} r={POINT_R + 2} fill={Colors.forest} stroke={Colors.white} strokeWidth={2} />
            </>
          )}
          <XEnds dates={dates} width={width} height={height} />
        </Svg>
      </View>
      {showTrend && (
        <Legend items={[
          { color: Colors.forest, label: 'Actual' },
          { color: Series.carbs, label: 'Trend', dashed: true },
        ]} />
      )}
    </View>
  );
}

// ------------------------------------------------------------------- bar chart

/** Centred rolling mean. Window shrinks at the edges rather than returning null. */
export function rollingMean(values: number[], window: number): (number | null)[] {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    const lo = Math.max(0, i - half);
    const hi = Math.min(values.length - 1, i + half);
    let sum = 0, count = 0;
    for (let j = lo; j <= hi; j++) if (values[j] > 0) { sum += values[j]; count++; }
    return count === 0 ? null : sum / count;
  });
}

export function IntakeChart({ dates, values, target, width, height, preperiodDates, bandPct = 0.1 }: {
  dates: string[]; values: number[]; target: number; width: number; height: number;
  preperiodDates?: Set<string>;
  /** Half-width of the "close enough" band, as a fraction of target. */
  bandPct?: number;
}) {
  const n = dates.length;
  const plotWidth = width - Y_AXIS_WIDTH;
  const { index, responder } = useScrub(n, Y_AXIS_WIDTH, plotWidth);
  const logged = values.filter((v) => v > 0);

  const avg = useMemo(() => rollingMean(values, 7), [values.join(',')]);

  if (logged.length === 0) {
    return <ChartEmpty height={height} message="Nothing logged in this range yet." />;
  }

  const maxV = Math.max(...values, target * (1 + bandPct)) * 1.1;
  const toY = (v: number) => PLOT_TOP + (1 - v / maxV) * (height - PLOT_TOP);
  const slot = plotWidth / n;
  const barW = barWidth(slot);
  const bandTop = toY(target * (1 + bandPct));
  const bandBottom = toY(target * (1 - bandPct));

  let avgPath = ''; let started = false;
  avg.forEach((v, i) => {
    if (v == null) return;
    const x = Y_AXIS_WIDTH + i * slot + slot / 2;
    avgPath += started ? ` L${x},${toY(v)}` : `M${x},${toY(v)}`;
    started = true;
  });

  const readVal = index != null ? values[index] : null;

  return (
    <View>
      {index != null && (
        <ScrubReadout
          label={dates[index]}
          value={readVal && readVal > 0 ? `${Math.round(readVal)} kcal` : 'not logged'}
        />
      )}
      <View {...responder.panHandlers}>
        <Svg width={width} height={height + 20}>
          <YAxis ticks={niceTicks(0, maxV)} toY={toY} width={width} format={(v) => String(Math.round(v))} />

          {/* Target band. A range reads as "close enough is fine"; a bare line
              makes every ordinary day look like a near-miss. */}
          <Rect
            x={Y_AXIS_WIDTH} y={bandTop} width={plotWidth} height={Math.max(1, bandBottom - bandTop)}
            fill={Colors.forest} opacity={0.07}
          />
          <Line x1={Y_AXIS_WIDTH} y1={toY(target)} x2={width} y2={toY(target)}
                stroke={Colors.forest} strokeWidth={1} opacity={0.45} />

          {preperiodDates && values.map((_, i) =>
            preperiodDates.has(dates[i])
              ? <Rect key={`pre-${i}`} x={Y_AXIS_WIDTH + i * slot} y={0} width={slot} height={height} fill={Colors.amber} opacity={0.12} />
              : null
          )}

          {values.map((v, i) => {
            if (v === 0) return null;
            const barH = height - toY(v);
            return (
              <Rect
                key={i}
                x={Y_AXIS_WIDTH + i * slot + (slot - barW) / 2}
                y={height - barH}
                width={barW} height={barH}
                fill={Colors.forest}
                rx={BAR_RADIUS}
              />
            );
          })}

          {avgPath !== '' && (
            <Path d={avgPath} stroke={Series.carbs} strokeWidth={LINE_WIDTH} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {index != null && (
            <Line x1={Y_AXIS_WIDTH + index * slot + slot / 2} y1={PLOT_TOP}
                  x2={Y_AXIS_WIDTH + index * slot + slot / 2} y2={height}
                  stroke={Colors.forest} strokeWidth={1} opacity={0.35} />
          )}
          <XEnds dates={dates} width={width} height={height} />
        </Svg>
      </View>
      <Legend items={[
        { color: Colors.forest, label: 'Daily' },
        { color: Series.carbs, label: '7-day average' },
      ]} />
    </View>
  );
}

// ------------------------------------------------------- stacked composition

export type MacroDay = { protein: number; carbs: number; fat: number; fiber: number };

/**
 * Stacked macro grams per day. Separate chart from intake on purpose — grams and
 * kcal are different scales, and a dual axis is never the answer.
 */
export function MacroCompositionChart({ dates, days, width, height }: {
  dates: string[]; days: MacroDay[]; width: number; height: number;
}) {
  const n = dates.length;
  const plotWidth = width - Y_AXIS_WIDTH;
  const { index, responder } = useScrub(n, Y_AXIS_WIDTH, plotWidth);

  const totals = days.map((d) => d.protein + d.carbs + d.fat + d.fiber);
  if (totals.every((t) => t <= 0)) {
    return <ChartEmpty height={height} message="No macros logged in this range yet." />;
  }

  const maxV = Math.max(...totals) * 1.1 || 1;
  const toY = (v: number) => PLOT_TOP + (1 - v / maxV) * (height - PLOT_TOP);
  const slot = plotWidth / n;
  const barW = barWidth(slot);

  const ORDER: (keyof MacroDay)[] = ['protein', 'carbs', 'fat', 'fiber'];
  const COLOR: Record<keyof MacroDay, string> = {
    protein: Series.protein, carbs: Series.carbs, fat: Series.fat, fiber: Series.fiber,
  };

  const read = index != null ? days[index] : null;

  return (
    <View>
      {index != null && read && (
        <ScrubReadout
          label={dates[index]}
          value={totals[index] > 0
            ? `P${Math.round(read.protein)} C${Math.round(read.carbs)} F${Math.round(read.fat)} Fib${Math.round(read.fiber)}`
            : 'not logged'}
        />
      )}
      <View {...responder.panHandlers}>
        <Svg width={width} height={height + 20}>
          <YAxis ticks={niceTicks(0, maxV)} toY={toY} width={width} format={(v) => `${Math.round(v)}g`} />
          {days.map((d, i) => {
            if (totals[i] <= 0) return null;
            const x = Y_AXIS_WIDTH + i * slot + (slot - barW) / 2;
            let cursor = height;
            return (
              <React.Fragment key={i}>
                {ORDER.map((k) => {
                  const v = d[k];
                  if (v <= 0) return null;
                  const h = ((v / maxV) * (height - PLOT_TOP));
                  // Shrink each segment by the gap so the surface shows between
                  // fills; adjacent fills of similar value otherwise merge. The
                  // gap scales with the segment: a flat 2px on a 3px segment
                  // leaves 1px of fill and the bar fragments into dots at 90 days.
                  const drawH = Math.max(1, h - Math.min(SEGMENT_GAP, h * 0.25));
                  const y = cursor - h;
                  cursor -= h;
                  return <Rect key={k} x={x} y={y} width={barW} height={drawH} fill={COLOR[k]} rx={1} />;
                })}
              </React.Fragment>
            );
          })}
          {index != null && (
            <Line x1={Y_AXIS_WIDTH + index * slot + slot / 2} y1={PLOT_TOP}
                  x2={Y_AXIS_WIDTH + index * slot + slot / 2} y2={height}
                  stroke={Colors.forest} strokeWidth={1} opacity={0.35} />
          )}
          <XEnds dates={dates} width={width} height={height} />
        </Svg>
      </View>
      <Legend items={ORDER.map((k) => ({ color: COLOR[k], label: k[0].toUpperCase() + k.slice(1) }))} />
    </View>
  );
}

// ------------------------------------------------------------- plant trend

/**
 * Distinct plants in the rolling 7 days ending on each date, against the target.
 *
 * `counts` uses null for "no meals logged anywhere in that window", which is not
 * the same as zero plants. Drawing a flat line along zero for dates before the
 * first ever log reads as "ate no plants" when it means "no data" — so the line
 * breaks there instead.
 */
export function PlantTrendChart({ dates, counts, target, width, height }: {
  dates: string[]; counts: (number | null)[]; target: number; width: number; height: number;
}) {
  const n = dates.length;
  const plotWidth = width - Y_AXIS_WIDTH;
  const { index, responder } = useScrub(n, Y_AXIS_WIDTH, plotWidth);

  const real = counts.filter((c): c is number => c != null);
  if (real.length === 0 || real.every((c) => c === 0)) {
    return <ChartEmpty height={height} message="No plants counted in this range yet." />;
  }

  const maxV = Math.max(...real, target) * 1.15;
  const xStep = plotWidth / (n - 1 || 1);
  const toX = (i: number) => Y_AXIS_WIDTH + i * xStep;
  const toY = (v: number) => PLOT_TOP + (1 - v / maxV) * (height - PLOT_TOP);

  let path = ''; let started = false;
  counts.forEach((v, i) => {
    if (v == null) { started = false; return; }
    path += started ? ` L${toX(i)},${toY(v)}` : `M${toX(i)},${toY(v)}`;
    started = true;
  });

  return (
    <View>
      {index != null && (
        <ScrubReadout
          label={dates[index]}
          value={counts[index] == null ? 'not logged' : `${counts[index]} plants`}
        />
      )}
      <View {...responder.panHandlers}>
        <Svg width={width} height={height + 20}>
          <YAxis ticks={niceTicks(0, maxV)} toY={toY} width={width} format={(v) => String(Math.round(v))} />
          <Line x1={Y_AXIS_WIDTH} y1={toY(target)} x2={width} y2={toY(target)}
                stroke={Colors.forest} strokeWidth={1} opacity={0.45} />
          <SvgText x={width} y={toY(target) - 4} fontSize={9} fontFamily={Typography.geistMono}
                   fill={Colors.muted} textAnchor="end">
            target {target}
          </SvgText>
          <Path d={path} stroke={Series.fiber} strokeWidth={LINE_WIDTH} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {index != null && (
            <>
              <Line x1={toX(index)} y1={PLOT_TOP} x2={toX(index)} y2={height} stroke={Colors.forest} strokeWidth={1} opacity={0.35} />
              {counts[index] != null && (
                <Circle cx={toX(index)} cy={toY(counts[index]!)} r={POINT_R + 2} fill={Series.fiber} stroke={Colors.white} strokeWidth={2} />
              )}
            </>
          )}
          <XEnds dates={dates} width={width} height={height} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 14, marginTop: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 14, height: 2, borderRadius: 1 },
  legendDash: { width: 14, height: 2, borderRadius: 1, opacity: 0.75 },
  legendLabel: { fontFamily: Typography.geist, fontSize: 11, color: Colors.muted },
  readout: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    marginBottom: 6,
  },
  readoutLabel: { fontFamily: Typography.geistMono, fontSize: 10, color: Colors.muted },
  readoutValue: { fontFamily: Typography.geistMono, fontSize: 12, color: Colors.forest, fontWeight: '500' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyText: {
    fontFamily: Typography.geist, fontSize: 13, color: Colors.muted,
    textAlign: 'center', lineHeight: 19,
  },
});
