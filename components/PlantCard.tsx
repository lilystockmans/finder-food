import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Colors, Typography, Spacing, Radius, MIN_FONT_SIZE } from '../constants/tokens';
import { getPlant, type PlantTally, type PlantCategory } from '../lib/plants';

const CATEGORY_LABEL: Record<PlantCategory, string> = {
  vegetable: 'Vegetables',
  fruit: 'Fruit',
  legume: 'Legumes',
  nut_seed: 'Nuts & seeds',
  grain: 'Wholegrains',
};

const CATEGORY_ORDER: PlantCategory[] = ['vegetable', 'fruit', 'legume', 'nut_seed', 'grain'];

/**
 * A 30-dot grid, one dot per plant toward the target. Countable at a glance,
 * which a percentage bar is not — the whole point is "how many different plants".
 */
function DotGrid({ filled, total }: { filled: number; total: number }) {
  const dots = [];
  for (let i = 0; i < total; i++) {
    dots.push(
      <View
        key={i}
        style={[styles.dot, i < filled ? styles.dotFilled : styles.dotEmpty]}
      />
    );
  }
  // Any plants beyond the target get their own row of accent dots.
  const extra = Math.max(0, filled - total);
  return (
    <View>
      <View style={styles.dotGrid}>{dots}</View>
      {extra > 0 && (
        <Text style={styles.extraNote}>+{extra} beyond target</Text>
      )}
    </View>
  );
}

export function PlantCard({ tally, compact = false }: { tally: PlantTally; compact?: boolean }) {
  const { count, target, byCategory, newThisWindow } = tally;
  const hasAny = count > 0;

  const names = CATEGORY_ORDER.flatMap((c) => byCategory[c])
    .map((id) => getPlant(id)?.label ?? id);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.label}>PLANTS THIS WEEK</Text>
        <Text style={styles.count}>
          {count}
          <Text style={styles.countTarget}> / {target}</Text>
        </Text>
      </View>

      <DotGrid filled={Math.min(count, target)} total={target} />

      {!hasAny && (
        <Text style={styles.empty}>
          No plants counted yet this week. They are picked up from the ingredients
          you log.
        </Text>
      )}

      {hasAny && compact && (
        <Text style={styles.namesInline} numberOfLines={3}>
          {names.join(' · ')}
        </Text>
      )}

      {hasAny && !compact && (
        <View style={styles.breakdown}>
          {CATEGORY_ORDER.map((cat) => {
            const ids = byCategory[cat];
            if (!ids.length) return null;
            return (
              <View key={cat} style={styles.catRow}>
                <View style={styles.catHead}>
                  <Text style={styles.catLabel}>{CATEGORY_LABEL[cat]}</Text>
                  <Text style={styles.catCount}>{ids.length}</Text>
                </View>
                <View style={styles.chips}>
                  {ids.map((id) => {
                    const isNew = newThisWindow.includes(id);
                    return (
                      <View key={id} style={[styles.chip, isNew && styles.chipNew]}>
                        <Text style={[styles.chipText, isNew && styles.chipTextNew]}>
                          {getPlant(id)?.label ?? id}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {newThisWindow.length > 0 && (
            <Text style={styles.newNote}>
              {newThisWindow.length} new compared with last week, highlighted above.
            </Text>
          )}
        </View>
      )}

      {/* Honesty note: dish-level ingredient names hide their constituents, so
          this number is a floor, not a precise count. Say so rather than let a
          low number look like a failure. */}
      <Text style={styles.caveat}>
        Counted from logged ingredients, so mixed dishes may add fewer than they
        contain.
      </Text>
    </Card>
  );
}

const DOT = 9;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  label: {
    fontFamily: Typography.mono,
    fontSize: MIN_FONT_SIZE,
    color: Colors.muted,
    letterSpacing: 1.3,
  },
  count: {
    // Display face for tabular figures — the count changes as meals are logged.
    fontFamily: Typography.display,
    fontSize: 42,
    letterSpacing: -1.2,
    color: Colors.forest,
  },
  countTarget: {
    fontFamily: Typography.mono,
    fontSize: 13,
    color: Colors.muted,
  },
  dotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  dotFilled: { backgroundColor: Colors.support },
  dotEmpty: { backgroundColor: Colors.track },
  extraNote: {
    fontFamily: Typography.mono,
    fontSize: MIN_FONT_SIZE,
    color: Colors.ember,
    marginTop: 6,
  },
  empty: {
    fontFamily: Typography.geist,
    fontSize: 13,
    color: Colors.muted,
    marginTop: 12,
    lineHeight: 19,
  },
  namesInline: {
    fontFamily: Typography.sans,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 12,
    lineHeight: 18,
  },
  breakdown: { marginTop: 16, gap: 14 },
  catRow: { gap: 7 },
  catHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catLabel: {
    fontFamily: Typography.geist,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.forest,
  },
  catCount: {
    fontFamily: Typography.mono,
    fontSize: MIN_FONT_SIZE,
    color: Colors.muted,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.paper,
  },
  chipNew: { backgroundColor: Colors.ember + '20' },
  chipText: {
    fontFamily: Typography.geist,
    fontSize: 11,
    color: Colors.forest,
  },
  chipTextNew: { color: Colors.ember, fontWeight: '600' },
  newNote: {
    fontFamily: Typography.sans,
    fontSize: MIN_FONT_SIZE,
    color: Colors.muted,
    fontStyle: 'italic',
  },
  caveat: {
    fontFamily: Typography.sans,
    fontSize: MIN_FONT_SIZE,
    color: Colors.muted,
    marginTop: 14,
    lineHeight: 16,
  },
});
