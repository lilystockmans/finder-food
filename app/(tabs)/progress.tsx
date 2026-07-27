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
import { loadProfile, appendWeightEntry, addPeriodEntry, type Profile } from '../../lib/profile';
import { getMealsForDate } from '../../lib/db';
import { calcTrendWeight, calcMacroGrams } from '../../lib/nutrition';
import { analyseWeek, getGeminiKey, type WeekAnalysis } from '../../lib/gemini';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - Spacing.xl * 2 - 36; // card padding
const CHART_HEIGHT = 140;
const Y_AXIS_WIDTH = 34;

function predictPeriod(periodLog: string[]): { avgCycleDays: number; nextDate: string; daysUntil: number } | null {
  if (periodLog.length < 2) return null;
  const sorted = [...periodLog].sort();
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
    gaps.push(diff);
  }
  const avgCycleDays = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  const lastDate = new Date(sorted[sorted.length - 1]);
  const next = new Date(lastDate.getTime() + avgCycleDays * 86400000);
  const today = new Date(new Date().toISOString().split('T')[0]);
  const daysUntil = Math.round((next.getTime() - today.getTime()) / 86400000);
  return { avgCycleDays, nextDate: next.toISOString().split('T')[0], daysUntil };
}

function preperiodWindowDates(prediction: ReturnType<typeof predictPeriod>): Set<string> {
  const set = new Set<string>();
  if (!prediction) return set;
  const next = new Date(prediction.nextDate);
  for (let i = 1; i <= 5; i++) {
    const d = new Date(next.getTime() - i * 86400000);
    set.add(d.toISOString().split('T')[0]);
  }
  return set;
}

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
  const [weekAnalysis, setWeekAnalysis] = useState<WeekAnalysis | null>(null);
  const [weekAnalysisLoading, setWeekAnalysisLoading] = useState(false);
  const [weekAnalysisError, setWeekAnalysisError] = useState('');

  useFocusEffect(useCallback(() => {
    const p = loadProfile();
    setProfile(p);
    if (p) { setWeightDraft(p.weightKg); setWeightInput(String(p.weightKg)); }
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

  // Period tracking
  const todayStr = new Date().toISOString().split('T')[0];
  const periodPrediction = useMemo(() => predictPeriod(profile?.periodLog ?? []), [profile?.periodLog?.join(',')]);
  const preperiodDates = useMemo(() => preperiodWindowDates(periodPrediction), [periodPrediction?.nextDate]);
  const loggedPeriodToday = profile?.periodLog.includes(todayStr) ?? false;
  const [logPeriodSheet, setLogPeriodSheet] = useState(false);
  const [periodDateInput, setPeriodDateInput] = useState(todayStr);

  const handleLogPeriod = (date: string) => {
    addPeriodEntry(date);
    setProfile(loadProfile());
    setLogPeriodSheet(false);
  };

  // Weekly analysis — fixed last 7 calendar days, independent of the range toggle above
  const weekDates = useMemo(() => dateRange(7), []);
  const weekStats = useMemo(() => {
    if (!profile) return null;
    const macroTargets = calcMacroGrams(profile.kcalTarget, profile.macroP, profile.macroC, profile.macroF);
    const dayTotals = weekDates.map((d) => {
      const meals = getMealsForDate(d);
      return meals.reduce((acc, m) => ({
        kcal: acc.kcal + m.totalKcal,
        protein: acc.protein + m.totalProteinG,
        carbs: acc.carbs + m.totalCarbsG,
        fat: acc.fat + m.totalFatG,
        fiber: acc.fiber + m.totalFiberG,
      }), { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    });
    const loggedDays = dayTotals.filter(d => d.kcal > 0);
    const n = loggedDays.length || 1;
    const avg = (key: keyof typeof dayTotals[0]) => loggedDays.reduce((s, d) => s + d[key], 0) / n;

    const weekWeights = weekDates
      .map(d => profile.weightLog.find(e => e.date === d)?.kg)
      .filter((v): v is number => v !== undefined);
    const weightChangeKg = weekWeights.length >= 2 ? weekWeights.at(-1)! - weekWeights[0] : null;
    const overlapsPreperiod = weekDates.some(d => preperiodDates.has(d));

    return {
      avgKcal: Math.round(avg('kcal')), kcalTarget: profile.kcalTarget,
      avgProtein: Math.round(avg('protein')), proteinTarget: Math.round(macroTargets.proteinG),
      avgCarbs: Math.round(avg('carbs')), carbsTarget: Math.round(macroTargets.carbsG),
      avgFat: Math.round(avg('fat')), fatTarget: Math.round(macroTargets.fatG),
      avgFiber: Math.round(avg('fiber')), fiberTarget: profile.fiberTargetG,
      weightChangeKg, daysLogged: loggedDays.length, overlapsPreperiod,
    };
  }, [profile, weekDates.join(','), preperiodDates]);

  const weeklySummaryText = useMemo(() => {
    if (!weekStats) return '';
    const weightText = weekStats.weightChangeKg !== null
      ? `${weekStats.weightChangeKg.toFixed(1)}kg change this week`
      : 'not enough weight entries this week to see a trend';
    return [
      `Avg kcal: ${weekStats.avgKcal} vs target ${weekStats.kcalTarget}`,
      `Avg protein: ${weekStats.avgProtein}g vs target ${weekStats.proteinTarget}g`,
      `Avg carbs: ${weekStats.avgCarbs}g vs target ${weekStats.carbsTarget}g`,
      `Avg fat: ${weekStats.avgFat}g vs target ${weekStats.fatTarget}g`,
      `Avg fiber: ${weekStats.avgFiber}g vs target ${weekStats.fiberTarget}g`,
      `Weight: ${weightText}`,
      `Days logged: ${weekStats.daysLogged}/7`,
      `Overlaps predicted pre-period window: ${weekStats.overlapsPreperiod ? 'yes' : 'no'}`,
    ].join('\n');
  }, [weekStats]);

  const handleAnalyseWeek = async () => {
    setWeekAnalysisLoading(true);
    setWeekAnalysisError('');
    setWeekAnalysis(null);
    try {
      const result = await analyseWeek(weeklySummaryText, getGeminiKey());
      setWeekAnalysis(result);
    } catch (err: any) {
      setWeekAnalysisError("Couldn't generate insights — try again");
    } finally {
      setWeekAnalysisLoading(false);
    }
  };

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
            <Text style={[styles.summaryDelta, weightDelta > 0 ? { color: Colors.warn } : { color: Colors.forest }]}>
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
            <Text style={[styles.summaryDelta, { color: avgDeficit > 0 ? Colors.forest : Colors.warn }]}>
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
              preperiodDates={preperiodDates}
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

        {/* Period tracking */}
        <Card pad={18}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Period</Text>
            <TouchableOpacity
              onPress={() => { setPeriodDateInput(todayStr); setLogPeriodSheet(true); }}
              style={styles.logBtn}
            >
              <Icon name="plus-s" size={14} color={Colors.forest} />
              <Text style={styles.logBtnText}>
                {loggedPeriodToday ? 'Edit period log' : 'Log period start'}
              </Text>
            </TouchableOpacity>
          </View>
          {profile && profile.periodLog.length > 0 ? (
            <>
              <Text style={styles.periodDates}>
                {[...profile.periodLog].reverse().slice(0, 3).join('  ·  ')}
              </Text>
              {periodPrediction ? (
                <Text style={[styles.projText, { marginTop: 8 }]}>
                  Avg cycle <Text style={styles.projAccent}>{periodPrediction.avgCycleDays} days</Text>.
                  {' '}Next expected{' '}
                  <Text style={styles.projAccent}>{periodPrediction.nextDate}</Text>
                  {periodPrediction.daysUntil >= 0 && periodPrediction.daysUntil <= 7 ? ' — cravings may already be ramping up.' : '.'}
                </Text>
              ) : (
                <Text style={[styles.projText, { color: Colors.muted, marginTop: 8 }]}>
                  Log one more cycle to see a prediction.
                </Text>
              )}
            </>
          ) : (
            <Text style={[styles.projText, { color: Colors.muted, marginTop: 4 }]}>
              Log your period start date to track cycle length and see cravings context on your intake chart.
            </Text>
          )}
        </Card>

        {/* Weekly analysis */}
        {weekStats && (
          <Card pad={18}>
            <Text style={styles.chartTitle}>This week</Text>
            <View style={styles.weekStatsGrid}>
              <WeekStat label="Kcal" value={`${weekStats.avgKcal}`} target={`/ ${weekStats.kcalTarget}`} />
              <WeekStat label="Protein" value={`${weekStats.avgProtein}g`} target={`/ ${weekStats.proteinTarget}g`} />
              <WeekStat label="Carbs" value={`${weekStats.avgCarbs}g`} target={`/ ${weekStats.carbsTarget}g`} />
              <WeekStat label="Fat" value={`${weekStats.avgFat}g`} target={`/ ${weekStats.fatTarget}g`} />
              <WeekStat label="Fiber" value={`${weekStats.avgFiber}g`} target={`/ ${weekStats.fiberTarget}g`} />
              <WeekStat label="Days logged" value={`${weekStats.daysLogged}`} target="/ 7" />
            </View>
            {weekStats.weightChangeKg !== null && (
              <Text style={[styles.projText, { marginTop: 8 }]}>
                Weight {weekStats.weightChangeKg > 0 ? '+' : ''}{weekStats.weightChangeKg.toFixed(1)}{weightUnit} this week.
              </Text>
            )}
            {weekStats.overlapsPreperiod && (
              <Text style={[styles.projText, { color: Colors.muted, marginTop: 4 }]}>
                This week overlaps your predicted pre-period window.
              </Text>
            )}

            {weekAnalysis ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                {weekAnalysis.doingWell.length > 0 && (
                  <View>
                    <Text style={styles.weekSectionLabel}>DOING WELL</Text>
                    {weekAnalysis.doingWell.map((line, i) => (
                      <Text key={i} style={styles.weekLine}>• {line}</Text>
                    ))}
                  </View>
                )}
                {weekAnalysis.improve.length > 0 && (
                  <View>
                    <Text style={styles.weekSectionLabel}>COULD IMPROVE</Text>
                    {weekAnalysis.improve.map((line, i) => (
                      <Text key={i} style={styles.weekLine}>• {line}</Text>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                <Btn
                  label={weekAnalysisLoading ? 'Thinking…' : 'Get this week\'s insights'}
                  kind="ghost"
                  onPress={handleAnalyseWeek}
                  disabled={weekAnalysisLoading}
                />
                {weekAnalysisError ? (
                  <View style={styles.warnBanner}>
                    <Icon name="warn" size={14} color={Colors.amber} />
                    <Text style={styles.warnText}>{weekAnalysisError}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </Card>
        )}

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

      {/* Log period sheet */}
      <BottomSheet visible={logPeriodSheet} onClose={() => setLogPeriodSheet(false)}>
        <Text style={styles.sheetTitle}>Log period start</Text>
        <View style={styles.dayChipsRow}>
          {[0, 1, 2, 3, 4, 5].map((daysAgo) => {
            const d = new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0];
            const label = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
            return (
              <TouchableOpacity
                key={daysAgo}
                onPress={() => setPeriodDateInput(d)}
                style={[styles.dayChip, periodDateInput === d && styles.dayChipActive]}
              >
                <Text style={[styles.dayChipText, periodDateInput === d && styles.dayChipActiveText]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>OR ENTER A DATE</Text>
        <TextInput
          style={styles.dateInput}
          value={periodDateInput}
          onChangeText={setPeriodDateInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.muted}
        />
        <Btn
          label="Save"
          kind="primary"
          full
          onPress={() => handleLogPeriod(periodDateInput)}
          disabled={!/^\d{4}-\d{2}-\d{2}$/.test(periodDateInput)}
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
  const midV = (minV + maxV) / 2;
  const range = maxV - minV || 1;
  const n = dates.length;
  const plotWidth = width - Y_AXIS_WIDTH;
  const xStep = plotWidth / (n - 1 || 1);

  const toX = (i: number) => Y_AXIS_WIDTH + i * xStep;
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
        {/* Y axis gridlines + labels */}
        {[maxV, midV, minV].map((v, i) => (
          <React.Fragment key={i}>
            <Line x1={Y_AXIS_WIDTH} y1={toY(v)} x2={width} y2={toY(v)} stroke={Colors.line} strokeWidth={1} />
            <SvgText x={Y_AXIS_WIDTH - 6} y={toY(v) + 3} fontSize={9} fontFamily={Typography.geistMono} fill={Colors.muted} textAnchor="end">
              {v.toFixed(1)}
            </SvgText>
          </React.Fragment>
        ))}
        {/* Goal line */}
        {goalY != null && (
          <Line x1={Y_AXIS_WIDTH} y1={goalY} x2={width} y2={goalY} stroke={Colors.muted} strokeWidth={1} strokeDasharray="4 3" />
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
        <SvgText x={Y_AXIS_WIDTH} y={height + 16} fontSize={10} fontFamily={Typography.geistMono} fill={Colors.muted}>
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

function IntakeChart({ dates, values, target, width, height, preperiodDates }: {
  dates: string[]; values: number[]; target: number; width: number; height: number;
  preperiodDates?: Set<string>;
}) {
  const maxV = Math.max(...values, target) * 1.1 || target * 1.1;
  const n = dates.length;
  const plotWidth = width - Y_AXIS_WIDTH;
  const barW = Math.max(4, (plotWidth / n) - 3);
  const toY = (v: number) => height - (v / maxV) * height;
  const targetY = toY(target);

  return (
    <Svg width={width} height={height + 20}>
      {/* Y axis gridlines + labels */}
      {[maxV, maxV / 2, 0].map((v, i) => (
        <React.Fragment key={i}>
          <Line x1={Y_AXIS_WIDTH} y1={toY(v)} x2={width} y2={toY(v)} stroke={Colors.line} strokeWidth={1} />
          <SvgText x={Y_AXIS_WIDTH - 6} y={toY(v) + 3} fontSize={9} fontFamily={Typography.geistMono} fill={Colors.muted} textAnchor="end">
            {Math.round(v)}
          </SvgText>
        </React.Fragment>
      ))}
      {/* Pre-period shading */}
      {preperiodDates && values.map((_, i) => {
        if (!preperiodDates.has(dates[i])) return null;
        const x = Y_AXIS_WIDTH + (i / n) * plotWidth;
        return <Rect key={`pre-${i}`} x={x} y={0} width={plotWidth / n} height={height} fill={Colors.amber} opacity={0.12} />;
      })}
      {/* Bars */}
      {values.map((v, i) => {
        if (v === 0) return null;
        const x = Y_AXIS_WIDTH + (i / n) * plotWidth + (plotWidth / n - barW) / 2;
        const barH = (v / maxV) * height;
        const barY = height - barH;
        return (
          <Rect
            key={i}
            x={x} y={barY}
            width={barW} height={barH}
            fill={v > target ? Colors.warn : Colors.forest}
            rx={2}
          />
        );
      })}
      {/* Target line */}
      <Line
        x1={Y_AXIS_WIDTH} y1={targetY} x2={width} y2={targetY}
        stroke={Colors.amber} strokeWidth={1.5} strokeDasharray="4 3"
      />
      <SvgText x={width} y={targetY - 4} fontSize={9} fontFamily={Typography.geistMono} fill={Colors.amber} textAnchor="end">
        target {Math.round(target)}
      </SvgText>
      {/* X axis labels */}
      <SvgText x={Y_AXIS_WIDTH} y={height + 16} fontSize={10} fontFamily={Typography.geistMono} fill={Colors.muted}>
        {dates[0]?.slice(5)}
      </SvgText>
      <SvgText x={width} y={height + 16} fontSize={10} fontFamily={Typography.geistMono} fill={Colors.muted} textAnchor="end">
        {dates.at(-1)?.slice(5)}
      </SvgText>
    </Svg>
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

function WeekStat({ label, value, target }: { label: string; value: string; target: string }) {
  return (
    <View style={styles.weekStat}>
      <Text style={styles.weekStatValue}>{value} <Text style={styles.weekStatTarget}>{target}</Text></Text>
      <Text style={styles.weekStatLabel}>{label}</Text>
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
  periodDates: { fontFamily: Typography.geistMono, fontSize: 13, color: Colors.muted },
  weekStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  weekStat: { width: '30%', gap: 2 },
  weekStatValue: { fontFamily: Typography.geistMono, fontSize: 16, fontWeight: '500', color: Colors.forest },
  weekStatTarget: { fontFamily: Typography.geistMono, fontSize: 11, color: Colors.muted },
  weekStatLabel: { fontFamily: Typography.geist, fontSize: 10, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  weekSectionLabel: { fontFamily: Typography.geist, fontSize: 10, fontWeight: '600', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  weekLine: { fontFamily: Typography.geist, fontSize: 14, color: Colors.forest, lineHeight: 20 },
  warnBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  warnText: { fontFamily: Typography.geist, fontSize: 12, color: Colors.amber, flex: 1 },
  sectionLabel: { fontFamily: Typography.geist, fontSize: 11, fontWeight: '600', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase' },
  dayChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line },
  dayChipActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  dayChipText: { fontFamily: Typography.geistMono, fontSize: 13, color: Colors.forest },
  dayChipActiveText: { color: Colors.white },
  dateInput: {
    fontFamily: Typography.geistMono, fontSize: 16, color: Colors.forest,
    borderWidth: 1, borderColor: Colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8,
  },
});
