import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Btn } from './Btn';
import { Colors, Typography, Spacing } from '../constants/tokens';
import { PAUSE_SECONDS } from '../lib/mindfulPause';

/**
 * A body-check before logging a likely second helping.
 *
 * What this component deliberately does NOT do:
 * - It never mentions what the food is, and never implies a wrong choice. The
 *   question is about hunger, not about the plate.
 * - It never blocks logging. "Log it" is always the primary action and always
 *   ends up saving. An unlogged meal corrupts the data everything else relies on,
 *   which is worse than an unexamined one.
 * - It states facts without a verdict: how long ago, how much is already logged.
 *   No "are you sure", no "is this the right choice".
 */
export function MindfulPause({ gapMinutes, slotKcalSoFar, slot, onLog, onWait }: {
  gapMinutes: number;
  slotKcalSoFar: number;
  slot: string;
  onLog: () => void;
  onWait: () => void;
}) {
  const [remaining, setRemaining] = useState(PAUSE_SECONDS);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const ready = remaining <= 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Take a breath</Text>

      <Text style={styles.question}>Still hungry, or is it taste?</Text>

      {/* Neutral context. Numbers, not judgement. */}
      <Text style={styles.context}>
        You logged {slotKcalSoFar} kcal for {slot.toLowerCase()} {gapMinutes} minutes ago.
      </Text>

      <Text style={styles.note}>
        No wrong answer. If you are hungry, eat and log it.
      </Text>

      <Btn
        label={ready ? 'Log it' : `Log it · ${remaining}`}
        kind="primary"
        full
        disabled={!ready}
        onPress={onLog}
        style={{ marginTop: Spacing.lg }}
      />
      <Btn
        label="Give me a minute"
        kind="ghost"
        full
        onPress={onWait}
        style={{ marginTop: Spacing.sm }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: Spacing.sm },
  title: {
    fontFamily: Typography.geist, fontSize: 20, fontWeight: '600',
    color: Colors.forest, marginBottom: Spacing.sm,
  },
  question: {
    fontFamily: Typography.geist, fontSize: 17, color: Colors.forest,
    lineHeight: 24, marginBottom: Spacing.md,
  },
  context: {
    fontFamily: Typography.geistMono, fontSize: 12, color: Colors.muted,
    lineHeight: 18,
  },
  note: {
    fontFamily: Typography.geist, fontSize: 13, color: Colors.muted,
    lineHeight: 19, marginTop: Spacing.md,
  },
});
