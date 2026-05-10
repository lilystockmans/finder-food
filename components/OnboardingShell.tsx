import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing } from '../constants/tokens';
import { Btn } from './Btn';
import { Icon } from './Icon';

interface OnboardingShellProps {
  step: number;
  total?: number;
  canContinue: boolean;
  onContinue: () => void;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function OnboardingShell({
  step,
  total = 8,
  canContinue,
  onContinue,
  children,
  title,
  subtitle,
}: OnboardingShellProps) {
  const canGoBack = step > 1;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          {canGoBack ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Icon name="chev-l" size={22} color={Colors.forest} />
            </TouchableOpacity>
          ) : (
            <View style={styles.back} />
          )}
          <Text style={styles.counter}>
            {step} / {total}
          </Text>
          <View style={styles.back} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>

        <View style={styles.footer}>
          <Btn
            label="Continue"
            kind="primary"
            full
            disabled={!canContinue}
            onPress={onContinue}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    fontFamily: Typography.geistMono,
    fontSize: 13,
    color: Colors.muted,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontFamily: Typography.geist,
    fontSize: 28,
    fontWeight: '500',
    color: Colors.forest,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
  },
  subtitle: {
    fontFamily: Typography.geist,
    fontSize: 14,
    color: Colors.muted,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  body: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.paper,
  },
});
