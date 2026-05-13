import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Path, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { Card } from '../../components/Card';
import { Pills } from '../../components/Pills';
import { BottomSheet } from '../../components/BottomSheet';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Colors, Typography, Spacing } from '../../constants/tokens';
import { loadProfile, appendWeightEntry, type Profile } from '../../lib/profile';
import { getMealsForDate, getConsistencyDays } from '../../lib/db';
import { calcTrendWeight } from '../../lib/nutrition';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - Spacing.xl * 2 - 36; // card padding
const CHART_HEIGHT = 140;

type Range = '7 days' | '30 days' | '90 days';

function dateRange(days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

export default function ProgressTab() {
  const [range, setRange] = useState<Range>('7 days');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logWeightSheet, setLogWeightSheet] = useState(false);
  const [weightDraft, setWeightDraft] = useState(70);
  const [weightInput, setWeightInput] = useState('');
  const [chartView, setChartView] = useState<'weight' | 'intake'>('weight');
  const [consistencyData, setConsistencyData] = useState<{ date: string; logged: boolean }[]>([]);

  useFocusEffect(useCallback(() => {
    const p = loadProfile();
    setProfile(p);
    if (p) { setWeightDraft(p.weightKg); setWeightInput(String(p.weightKg)); }
    setConsistencyData(getConsistencyDays(12));
  }, []));

  const days = range === '7 days' ? 7 : range === '30 days' ? 30 : 90;
  const dates = dateRange(days);

  // Build daily intake data
  const intakeData = useMemo(() => {
    return dates.map((date) => {
      const meals = getMealsForDate(date);
      return meals.reduce((s, m) => s + m.totalKcal, 0);
    });
  }, [dates.join(',')]);

  // Weight log entries for range
  const weightData = useMemo(() => {
    if (!profile) return dates.map(() => null as number | null);
    return dates.map((date) => {
      const entry = profile.weightLog.find((e) => e.date === date);
      return entry ? entry.kg : null;
    });
  }, [profile, dates.join(',')]);

  const avgKcal = intakeData.filter(v => v > 0).reduce((s, v, _, a) => s + v / a.length, 0);
  const kcalTarget = profile?.kcalTarget ?? 2000;
  const avgDeficit = kcalTarget - avgKcal;

  const validWeights = weightData.filter((v): v is number => v !== null);
  const latestWeight = validWeights.at(-1) ?? profile?.weightKg ?? 0;

  // Trend weight: pass full log so EMA is warmed up, then filter to chart range
  const trendValues = useMemo(() => {
    if (!profile || profile.weightLog.length < 5) return undefined;
    const trendLog = calcTrendWeight(profile.weightLog);
    const trendMap = new Map(trendLog.map(t => [t.date, t.trend]));
    return dates.map(d => trendMap.get(d) ?? null);
  }, [profile, dates.join(',')]);
  const firstWeight = validWeights[0] ?? latestWeight;
  const weightDelta = latestWeight - firstWeight;

  // Goal projection
  const remainingKg = profile ? Math.abs(latestWeight - profile.goalWeightKg) : 0;
  const weeklyLoss = avgDeficit > 0 ? (avgDeficit * 7) / 7700 : 0;
  const projectedDays = weeklyLoss > 0.01 ? Math.round(remainingKg / weeklyLoss * 7) : null;
  const projectedDate = projectedDays
    ? new Date(Date.now() + projectedDays * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null;

  const weightUnit = profile?.units === 'imperial' ? 'lbs' : 'kg';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Progress</Text>

        <Pills items={['7 days', '30 days', '90 days']} value={range} onChange={(v) => setRange(v as Range)} />

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <TouchableOpacity
            style={[styles.summaryCard, chartView === 'weight' && styles.summaryCardActive]}
            onPress={() => setChartView('weight')}
            activeOpacity={0.85}
          >
            <Text style={styles.summaryLabel}>WEIGHT</Text>
            <Text style={styles.summaryValue}>
              {latestWeight.toFixed(1)}{' '}
              <Text style={styles.summaryUnit}>{weightUnit}</Text>
            </Text>
            <Text style={[styles.summaryDelta, weightDelta > 0 ? { color: Colors.ember } : { color: Colors.forest }]}>
              {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} {weightUnit}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, chartView === 'intake' && styles.summaryCardActive]}
            onPress={() => setChartView('intake')}
            activeOpacity={0.85}
          >
            <Text style={styles.summaryLabel}>AVG INTAKE</Text>
            <Text style={styles.summaryValue}>
              {Math.round(avgKcal)}{' '}
              <Text style={styles.summaryUnit}>kcal</Text>
            </Text>
            <Text style={[styles.summaryDelta, { color: avgDeficit > 0 ? Colors.forest : Colors.ember }]}>
              {avgDeficit > 0 ? `−${Math.round(avgDeficit)}` : `+${Math.round(-avgDeficit)}`} deficit
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weight chart */}
        {chartView === 'weight' && (
          <Card pad={18}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Weight</Text>
              <TouchableOpacity onPress={() => setLogWeightSheet(true)} style={styles.logBtn}>
                <Icon name="plus-s" size={14} color={Colors.forest} />
                <Text style={styles.logBtnText}>Log weight</Text>
              </TouchableOpacity>
            </View>
            {validWeights.length < 2 ? (
              <View style={styles.noData}>
                <Text style={styles.noDataText}>Log weight entries to see your chart</Text>
              </View>
            ) : (
              <WeightChart
                dates={dates}
                values={weightData}
                goalKg={profile?.goalWeightKg}
                trendValues={trendValues}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
              />
            )}
          </Card>
        )}

        {/* Intake chart */}
        {chartView === 'intake' && (
          <Card pad={18}>
            <Text style={styles.chartTitle}>Daily intake</Text>
            <IntakeChart
              dates={dates}
              values={intakeData}
              target={kcalTarget}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
            />
          </Card>
        )}

        {/* Averages strip */}
        <Card pad={18}>
          <Text style={styles.chartTitle}>Averages · {range}</Text>
          <View style={styles.avgRow}>
            <AvgStat label="Avg kcal" value={Math.round(avgKcal)} />
            <AvgStat label="Deficit" value={Math.round(avgDeficit)} suffix="kcal" signed />
            <AvgStat label="Days logged" value={intakeData.filter(v => v > 0).length} suffix={`/${days}`} />
          </View>
        </Card>

        {/* Goal projection */}
        {profile && profile.goalType !== 'maintain' && (
          <Card pad={18}>
            <Text style={styles.chartTitle}>Goal projection</Text>
            {projectedDate ? (
              <Text style={styles.projText}>
                On track to hit{' '}
                <Text style={styles.projAccent}>{profile.goalWeightKg}{weightUnit}</Text>
                {' '}by{' '}
                <Text style={styles.projAccent}>{projectedDate}</Text>
                {' '}at this pace.
              </Text>
            ) : (
              <Text style={[styles.projText, { color: Colors.muted }]}>
                Goal pace has slowed — review your intake?
              </Text>
            )}
          </Card>
        )}

        {/* Consistency calendar */}
        <Card pad={18}>
          <Text style={styles.chartTitle}>Consistency</Text>
          <ConsistencyCalendar data={consistencyData} />
        </Card>
      </ScrollView>

      {/* Log weight sheet */}
      <BottomSheet visible={logWeightSheet} onClose={() => setLogWeightSheet(false)}>
        <Text style={styles.sheetTitle}>Log weight</Text>
        <View style={styles.weightInputRow}>
          <TextInput
            style={styles.weightInput}
            value={weightInput}
            onChangeText={(v) => { setWeightInput(v); const n = parseFloat(v); if (!isNaN(n)) setWeightDraft(n); }}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
            placeholder={String(weightDraft)}
            placeholderTextColor={Colors.muted}
          />
          <Text style={styles.weightUnit}>{weightUnit}</Text>
        </View>
        <Btn
          label="Save"
          kind="primary"
          full
          onPress={() => {
            const val = parseFloat(weightInput);
            if (!isNaN(val) && val > 0) {
              appendWeightEntry(val);
              const p = loadProfile();
              setProfile(p);
            }
            setLogWeightSheet(false);
          }}
          style={{ marginTop: 24 }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

function WeightChart({ dates, values, goalKg, trendValues, width, height }: {
  dates: string[];
  values: (number | null)[];
  goalKg?: number;
  trendValues?: (number | null)[];
  width: number;
  height: number;
}) {
  const nonNull = values.filter((v): v is number => v !== null);
  if (nonNull.length === 0) return null;

  const trendNonNull = trendValues?.filter((v): v is number => v !== null) ?? [];
  const allVals = [...nonNull, ...trendNonNull, goalKg].filter((v): v is number => v !== undefined);

  const minV = Math.min(...allVals) - 1;
  const maxV = Math.max(...allVals) + 1;
  const range = maxV - minV || 1;
  const n = dates.length;
  const xStep = width / (n - 1 || 1);

  const toX = (i: number) => i * xStep;
  const toY = (v: number) => height - ((v - minV) / range) * height;

  let path = '';
  let lastIdx = -1;
  values.forEach((v, i) => {
    if (v === null) return;
    if (lastIdx < 0) { path += `M${toX(i)},${toY(v)}`; }
    else { path += ` L${toX(i)},${toY(v)}`; }
    lastIdx = i;
  });

  let trendPath = '';
  let tLastIdx = -1;
  trendValues?.forEach((v, i) => {
    if (v === null) return;
    if (tLastIdx < 0) { trendPath += `M${toX(i)},${toY(v)}`; }
    else { trendPath += ` L${toX(i)},${toY(v)}`; }
    tLastIdx = i;
  });

  const goalY = goalKg ? toY(goalKg) : null;
  const showTrend = trendValues && trendNonNull.length >= 5;

  return (
    <View>
      <Svg width={width} height={height + 20}>
        {/* Goal line */}
        {goalY != null && (
          <Line x1={0} y1={goalY} x2={width} y2={goalY} stroke={Colors.muted} strokeWidth={1} strokeDasharray="4 3" />
        )}
        {/* Trend line (behind actual) */}
        {showTrend && trendPath && (
          <Path d={trendPath} stroke={Colors.macroCarbs} strokeWidth={1.5} fill="none" strokeDasharray="6 3" strokeLinecap="round" />
        )}
        {/* Actual weight line */}
        {path && <Path d={path} stroke={Colors.forest} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
        {/* Data points */}
        {values.map((v, i) =>
          v != null ? <Circle key={i} cx={toX(i)} cy={toY(v)} r={4} fill={Colors.forest} /> : null
        )}
        <SvgText x={0} y={height + 16} fontSize={10} fontFamily={Typography.geistMono} fill={Colors.muted}>
          {dates[0]?.slice(5)}
        </SvgText>
        <SvgText x={width} y={height + 16} fontSize={10} fontFamily={Typography.geistMono} fill={Colors.muted} textAnchor="end">
          {dates.at(-1)?.slice(5)}
        </SvgText>
      </Svg>
      {/* Legend */}
      {showTrend && (
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: Colors.forest }]} />
            <Text style={styles.legendLabel}>Actual</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDash, { backgroundColor: Colors.macroCarbs }]} />
            <Text style={styles.legendLabel}>Trend</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function IntakeChart({ dates, values, target, width, height }: {
  dates: string[]; values: number[]; target: number; width: number; height: number;
}) {
  const maxV = Math.max(...values, target) * 1.1 || target * 1.1;
  const n = dates.length;
  const barW = Math.max(4, (width / n) - 3);
  const toY = (v: number) => height - (v / maxV) * height;
  const targetY = toY(target);

  return (
    <Svg width={width} height={height + 20}>
      {/* Bars */}
      {values.map((v, i) => {
        if (v === 0) return null;
        const x = (i / n) * width + (width / n - barW) / 2;
        const barH = (v / maxV) * height;
        const barY = height - barH;
        return (
          <Rect
            key={i}
            x={x} y={barY}
            width={barW} height={barH}
            fill={v > target ? Colors.ember : Colors.forest}
            rx={2}
          />
        );
      })}
      {/* Target line */}
      <Line
        x1={0} y1={targetY} x2={width} y2={targetY}
        stroke={Colors.amber} strokeWidth={1.5} strokeDasharray="4 3"
      />
      {/* X axis labels */}
      <SvgText x={0} y={height + 16} fontSize={10} fontFamily={Typography.geistMono} fill={Colors.muted}>
        {dates[0]?.slice(5)}
      </SvgText>
      <SvgText x={width} y={height + 16} fontSize={10} fontFamily={Typography.geistMono} fill={Colors.muted} textAnchor="end">
        {dates.at(-1)?.slice(5)}
      </SvgText>
    </Svg>
  );
}

function ConsistencyCalendar({ data }: { data: { date: string; logged: boolean }[] }) {
  const today = new Date().toISOString().split('T')[0];
  const cellSize = Math.floor((CHART_WIDTH - 6 * 3) / 7);
  const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const logged = data.filter(d => d.logged).length;

  return (
    <View style={{ gap: 6 }}>
      {/* Day of week labels */}
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {DOW.map((d, i) => (
          <View key={i} style={{ width: cellSize, alignItems: 'center' }}>
            <Text style={{ fontFamily: Typography.geistMono, fontSize: 9, color: Colors.muted }}>{d}</Text>
          </View>
        ))}
      </View>
      {/* Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
        {data.map((item, i) => {
          const isToday = item.date === today;
          return (
            <View
              key={i}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 3,
                backgroundColor: item.logged ? Colors.forest : Colors.line,
                borderWidth: isToday ? 1.5 : 0,
                borderColor: Colors.ember,
              }}
            />
          );
        })}
      </View>
      <Text style={{ fontFamily: Typography.geist, fontSize: 12, color: Colors.muted, marginTop: 4 }}>
        {logged} / {data.length} days logged
      </Text>
    </View>
  );
}

function AvgStat({ label, value, suffix = '', signed }: {
  label: string; value: number; suffix?: string; signed?: boolean;
}) {
  return (
    <View style={styles.avgStat}>
      <Text style={styles.avgValue}>
        {signed && value > 0 ? '+' : ''}{value}{suffix}
      </Text>
      <Text style={styles.avgLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.sage },
  content: { padding: Spacing.xl, gap: 16, paddingBottom: 100 },
  screenTitle: { fontFamily: Typography.geist, fontSize: 26, fontWeight: '500', color: Colors.forest, letterSpacing: -0.4, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: Colors.line, gap: 4,
  },
  summaryCardActive: { borderColor: Colors.forest, backgroundColor: Colors.sage },
  summaryLabel: { fontFamily: Typography.geist, fontSize: 10, fontWeight: '600', color: Colors.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  summaryValue: { fontFamily: Typography.geistMono, fontSize: 22, fontWeight: '500', color: Colors.forest },
  summaryUnit: { fontSize: 14, color: Colors.muted },
  summaryDelta: { fontFamily: Typography.geistMono, fontSize: 12 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartTitle: { fontFamily: Typography.geist, fontSize: 15, fontWeight: '500', color: Colors.forest, marginBottom: 12 },
  logBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logBtnText: { fontFamily: Typography.geist, fontSize: 12, color: Colors.forest },
  noData: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  noDataText: { fontFamily: Typography.geist, fontSize: 13, color: Colors.muted },
  avgRow: { flexDirection: 'row', justifyContent: 'space-around' },
  avgStat: { alignItems: 'center', gap: 4 },
  avgValue: { fontFamily: Typography.geistMono, fontSize: 20, fontWeight: '500', color: Colors.forest },
  avgLabel: { fontFamily: Typography.geist, fontSize: 11, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  projText: { fontFamily: Typography.geist, fontSize: 15, color: Colors.forest, lineHeight: 22 },
  projAccent: { fontFamily: Typography.instrumentSerif, fontStyle: 'italic', fontSize: 17 },
  chartLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 16, height: 2, borderRadius: 1 },
  legendDash: { width: 16, height: 1.5, borderRadius: 1, opacity: 0.7 },
  legendLabel: { fontFamily: Typography.geist, fontSize: 11, color: Colors.muted },
  sheetTitle: { fontFamily: Typography.geist, fontSize: 20, fontWeight: '500', color: Colors.forest, marginBottom: 24 },
  weightInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  weightInput: {
    fontFamily: Typography.geistMono, fontSize: 48, fontWeight: '500', color: Colors.forest,
    borderBottomWidth: 2, borderColor: Colors.ember, textAlign: 'center', paddingVertical: 4, minWidth: 120,
  },
  weightUnit: { fontFamily: Typography.geistMono, fontSize: 20, color: Colors.muted, alignSelf: 'flex-end', paddingBottom: 8 },
});
