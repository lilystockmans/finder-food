import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Card } from '../../components/Card';
import { BottomSheet } from '../../components/BottomSheet';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { getAllSavedMeals, deleteSavedMeal, renameSavedMeal, type SavedMeal } from '../../lib/savedMeals';
import { insertMeal } from '../../lib/db';
import { useAppStore } from '../../store';
import { scaleNutrients } from '../../lib/openfoodfacts';

const MULTIPLIERS = [0.5, 1, 1.5, 2];

export default function SavedTab() {
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [selected, setSelected] = useState<SavedMeal | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [customMult, setCustomMult] = useState('1');
  const [renaming, setRenaming] = useState<SavedMeal | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const { refreshMeals, entrySlot } = useAppStore();

  useFocusEffect(useCallback(() => {
    setMeals(getAllSavedMeals());
  }, []));

  const logSelected = () => {
    if (!selected) return;
    const m = parseFloat(customMult) || multiplier;
    const ingredients = selected.ingredients.map((ing) => {
      const per100 = ing.grams > 0 ? 100 / ing.grams : 1;
      const scaled = scaleNutrients({
        name: ing.name, brand: '',
        kcalPer100g: ing.kcal * per100,
        proteinPer100g: ing.proteinG * per100,
        carbsPer100g: ing.carbsG * per100,
        fatPer100g: ing.fatG * per100,
        fiberPer100g: ing.fiberG * per100,
      }, ing.grams * m);
      return { ...ing, grams: Math.round(ing.grams * m), ...scaled };
    });
    const totals = ingredients.reduce(
      (acc, i) => ({ kcal: acc.kcal + i.kcal, p: acc.p + i.proteinG, c: acc.c + i.carbsG, f: acc.f + i.fatG, fi: acc.fi + i.fiberG }),
      { kcal: 0, p: 0, c: 0, f: 0, fi: 0 }
    );
    insertMeal({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      timestampMs: Date.now(),
      slot: entrySlot,
      method: 'saved',
      mealName: selected.name,
      ingredients,
      totalKcal: totals.kcal,
      totalProteinG: totals.p,
      totalCarbsG: totals.c,
      totalFatG: totals.f,
      totalFiberG: totals.fi,
    });
    refreshMeals();
    setSelected(null);
    router.back();
  };

  const handleDelete = (meal: SavedMeal) => {
    Alert.alert('Delete saved meal?', `"${meal.name}" will be removed from your library.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteSavedMeal(meal.id);
        setMeals(getAllSavedMeals());
      }},
    ]);
  };

  if (meals.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Icon name="bookmark" size={48} color={Colors.muted} />
          <Text style={styles.emptyTitle}>No saved meals yet</Text>
          <Text style={styles.emptySub}>After logging a meal, toggle "Save as meal" to add it here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Saved <Text style={styles.titleAccent}>meals</Text></Text>

        {meals.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            onPress={() => { setSelected(meal); setMultiplier(1); setCustomMult('1'); }}
            activeOpacity={0.85}
          >
            <Card pad={16} style={styles.mealCard}>
              <View style={styles.mealRow}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealMeta}>
                    {meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.mealKcal}>{Math.round(meal.totalKcal)} kcal</Text>
                <TouchableOpacity
                  onPress={() => { setRenaming(meal); setNameDraft(meal.name); }}
                  style={styles.iconBtn}
                >
                  <Icon name="edit" size={16} color={Colors.muted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(meal)} style={styles.iconBtn}>
                  <Icon name="trash" size={16} color={Colors.ember} />
                </TouchableOpacity>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Portion select sheet */}
      <BottomSheet visible={selected !== null} onClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{selected.name}</Text>
            <Text style={styles.sheetMeta}>{Math.round(selected.totalKcal)} kcal · {selected.ingredients.length} ingredients</Text>

            <Text style={styles.sheetLabel}>Portion</Text>
            <View style={styles.multChips}>
              {MULTIPLIERS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { setMultiplier(m); setCustomMult(String(m)); }}
                  style={[styles.chip, multiplier === m && styles.chipActive]}
                >
                  <Text style={[styles.chipText, multiplier === m && styles.chipActiveText]}>{m}×</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.multInput}
              value={customMult}
              onChangeText={(v) => { setCustomMult(v); setMultiplier(parseFloat(v) || 1); }}
              keyboardType="decimal-pad"
              placeholder="Custom multiplier"
              placeholderTextColor={Colors.muted}
            />

            <Text style={styles.scaledKcal}>
              {Math.round(selected.totalKcal * (parseFloat(customMult) || 1))} kcal
            </Text>

            <Btn label="Add to log" kind="primary" full onPress={logSelected} style={{ marginTop: 8 }} />
          </View>
        )}
      </BottomSheet>

      {/* Rename sheet */}
      <BottomSheet visible={renaming !== null} onClose={() => setRenaming(null)}>
        <Text style={styles.sheetTitle}>Rename meal</Text>
        <TextInput
          style={styles.nameInput}
          value={nameDraft}
          onChangeText={setNameDraft}
          autoFocus
          selectTextOnFocus
        />
        <Btn label="Save name" kind="primary" full onPress={() => {
          if (renaming && nameDraft.trim()) {
            renameSavedMeal(renaming.id, nameDraft.trim());
            setMeals(getAllSavedMeals());
            setRenaming(null);
          }
        }} style={{ marginTop: 16 }} />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.sage },
  content: { padding: Spacing.xl, gap: 10, paddingBottom: 100 },
  title: { fontFamily: Typography.geist, fontSize: 26, fontWeight: '500', color: Colors.forest, letterSpacing: -0.4, marginBottom: 4 },
  titleAccent: { fontFamily: Typography.instrumentSerif, fontStyle: 'italic' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontFamily: Typography.geist, fontSize: 18, fontWeight: '500', color: Colors.forest },
  emptySub: { fontFamily: Typography.geist, fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 20 },
  mealCard: {},
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealInfo: { flex: 1 },
  mealName: { fontFamily: Typography.geist, fontSize: 15, fontWeight: '500', color: Colors.forest },
  mealMeta: { fontFamily: Typography.geist, fontSize: 12, color: Colors.muted, marginTop: 2 },
  mealKcal: { fontFamily: Typography.geistMono, fontSize: 14, color: Colors.muted },
  iconBtn: { padding: 4 },

  sheetContent: { gap: 12 },
  sheetTitle: { fontFamily: Typography.geist, fontSize: 20, fontWeight: '500', color: Colors.forest },
  sheetMeta: { fontFamily: Typography.geist, fontSize: 13, color: Colors.muted, marginTop: -4 },
  sheetLabel: { fontFamily: Typography.geist, fontSize: 11, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1.4, marginTop: 8 },
  multChips: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line },
  chipActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  chipText: { fontFamily: Typography.geistMono, fontSize: 14, color: Colors.forest },
  chipActiveText: { color: Colors.white },
  multInput: {
    fontFamily: Typography.geistMono, fontSize: 15, color: Colors.forest,
    borderWidth: 1, borderColor: Colors.line, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.paper,
  },
  scaledKcal: { fontFamily: Typography.geistMono, fontSize: 28, fontWeight: '500', color: Colors.forest, textAlign: 'center' },
  nameInput: {
    fontFamily: Typography.geist, fontSize: 16, color: Colors.forest,
    borderWidth: 1, borderColor: Colors.line, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.paper,
    marginTop: 8,
  },
});
