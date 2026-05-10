import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { useOnboarding } from '../../store/onboarding';
import { Colors, Typography } from '../../constants/tokens';

export default function Step3() {
  const { age, set } = useOnboarding();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(age));

  const commit = (raw: string) => {
    const n = parseInt(raw);
    if (!isNaN(n) && n >= 13 && n <= 99) set({ age: n });
    setEditing(false);
  };

  return (
    <OnboardingShell
      step={3}
      title="How old are you?"
      canContinue={age >= 13 && age <= 99}
      onContinue={() => router.push('/onboarding/step-4')}
    >
      <View style={styles.container}>
        {editing ? (
          <TextInput
            style={styles.value}
            value={draft}
            onChangeText={setDraft}
            onBlur={() => commit(draft)}
            onSubmitEditing={() => commit(draft)}
            keyboardType="number-pad"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={() => { setDraft(String(age)); setEditing(true); }}>
            <Text style={styles.value}>
              {age} <Text style={styles.suffix}>years</Text>
            </Text>
          </TouchableOpacity>
        )}
        <Slider
          style={styles.slider}
          minimumValue={13}
          maximumValue={99}
          step={1}
          value={age}
          onValueChange={(v) => { set({ age: Math.round(v) }); setDraft(String(Math.round(v))); }}
          minimumTrackTintColor={Colors.forest}
          maximumTrackTintColor={Colors.line}
          thumbTintColor={Colors.forest}
        />
        <View style={styles.labels}>
          <Text style={styles.label}>13</Text>
          <Text style={styles.label}>99</Text>
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, width: '100%' },
  value: {
    fontFamily: Typography.geistMono,
    fontSize: 56,
    fontWeight: '500',
    color: Colors.forest,
    textAlign: 'center',
  },
  suffix: { fontFamily: Typography.geistMono, fontSize: 22, color: Colors.muted },
  slider: { width: '100%', height: 40 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 4 },
  label: { fontFamily: Typography.geistMono, fontSize: 12, color: Colors.muted },
});
