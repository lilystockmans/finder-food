import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { CalorieRing } from '../../components/CalorieRing';
import { MacroBar } from '../../components/MacroBar';
import { Card } from '../../components/Card';
import { BottomSheet } from '../../components/BottomSheet';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Colors, Typography, Spacing } from '../../constants/tokens';
import { getMealsForDate, deleteMeal, updateMealSlot, updateMealServing, type MealEntry, type Ingredient } from '../../lib/db';
import { loadProfile, type Profile } from '../../lib/profile';
import { insertSavedMeal } from '../../lib/savedMeals';
import { calcMacroGrams } from '../../lib/nutrition';
import { useAppStore } from '../../store';

type Slot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
const SLOTS: Slot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [editMeal, setEditMeal] = useState<MealEntry | null>(null);
  const { openEntry, viewDate, mealsRefreshKey, refreshMeals } = useAppStore();

  const load = useCallback(() => {
    const p = loadProfile();
    setProfile(p);
    if (p) {
      setMeals(getMealsForDate(viewDate));
    }
  }, [viewDate, mealsRefreshKey]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => { load(); }, [viewDate, mealsRefreshKey]);

  const totals = meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.totalKcal,
      protein: acc.protein + m.totalProteinG,
      carbs: acc.carbs + m.totalCarbsG,
      fat: acc.fat + m.totalFatG,
      fiber: acc.fiber + m.totalFiberG,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const macroTargets = profile
    ? calcMacroGrams(profile.kcalTarget, profile.macroP, profile.macroC, profile.macroF)
    : { proteinG: 150, carbsG: 200, fatG: 65 };

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const isToday = viewDate === new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View style={styles.greetLeft}>
            <Text style={styles.dateLabel}>
              {new Date(viewDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }).toUpperCase()}
            </Text>
            <Text style={styles.greetText}>
              {greeting},{' '}
              <Text style={styles.greetName}>{profile?.firstName ?? 'there'}</Text>
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.firstName ?? 'U')[0].toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Hero card */}
        <Card pad={22} style={styles.heroCard}>
          <CalorieRing
            consumed={Math.round(totals.kcal)}
            target={profile?.kcalTarget ?? 2000}
          />
          <View style={styles.macroGrid}>
            <MacroBar label="Protein" value={Math.round(totals.protein)} target={macroTargets.proteinG} color={Colors.macroProtein} />
            <MacroBar label="Carbs" value={Math.round(totals.carbs)} target={macroTargets.carbsG} color={Colors.macroCarbs} />
            <MacroBar label="Fat" value={Math.round(totals.fat)} target={macroTargets.fatG} color={Colors.macroFat} />
            <MacroBar label="Fiber" value={Math.round(totals.fiber)} target={profile?.fiberTargetG ?? 30} color={Colors.macroFiber} />
          </View>
        </Card>

        {/* Meals by slot */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>TODAY</Text>
            <Text style={styles.sectionDate}>
              {new Date(viewDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
            </Text>
          </View>

          {SLOTS.map((slot) => {
            const slotMeals = meals.filter((m) => m.slot === slot);
            const slotKcal = slotMeals.reduce((s, m) => s + m.totalKcal, 0);
            return (
              <View key={slot} style={styles.slotBlock}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotName}>{slot}</Text>
                  {slotKcal > 0 && (
                    <Text style={styles.slotKcal}>{Math.round(slotKcal)} kcal</Text>
                  )}
                </View>
                {slotMeals.length === 0 ? (
                  isToday && (
                    <TouchableOpacity
                      onPress={() => { openEntry(slot); router.push('/meal-entry'); }}
                      style={styles.emptySlot}
                    >
                      <Icon name="plus-s" size={14} color={Colors.muted} />
                      <Text style={styles.emptySlotText}>add {slot.toLowerCase()}</Text>
                    </TouchableOpacity>
                  )
                ) : (
                  slotMeals.map((meal) => (
                    <TouchableOpacity
                      key={meal.id}
                      onPress={() => setEditMeal(meal)}
                      activeOpacity={0.85}
                    >
                      <Card pad={14} style={styles.mealRow}>
                        <View style={styles.mealLeft}>
                          <Text style={styles.mealName} numberOfLines={1}>
                            {meal.mealName || meal.ingredients[0]?.name || 'Meal'}
                          </Text>
                          <Text style={styles.mealSub}>
                            {meal.ingredients.reduce((s, i) => s + i.grams, 0)}g
                          </Text>
                        </View>
                        <View style={styles.mealRight}>
                          <Text style={styles.mealKcal}>{Math.round(meal.totalKcal)}</Text>
                          <View style={styles.mealChips}>
                            <Chip label={`P ${Math.round(meal.totalProteinG)}`} color={Colors.macroProtein} />
                            <Chip label={`C ${Math.round(meal.totalCarbsG)}`} color={Colors.macroCarbs} />
                            <Chip label={`F ${Math.round(meal.totalFatG)}`} color={Colors.macroFat} />
                          </View>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Meal edit sheet */}
      <BottomSheet visible={editMeal !== null} onClose={() => setEditMeal(null)}>
        {editMeal && (
          <MealEditSheet
            meal={editMeal}
            onClose={() => setEditMeal(null)}
            onDelete={() => {
              deleteMeal(editMeal.id);
              refreshMeals();
              setEditMeal(null);
            }}
            onMove={(slot: Slot) => {
              updateMealSlot(editMeal.id, slot);
              refreshMeals();
              setEditMeal(null);
            }}
            onUpdate={(ingredients) => {
              const totals = ingredients.reduce(
                (acc, i) => ({ totalKcal: acc.totalKcal + i.kcal, totalProteinG: acc.totalProteinG + i.proteinG, totalCarbsG: acc.totalCarbsG + i.carbsG, totalFatG: acc.totalFatG + i.fatG, totalFiberG: acc.totalFiberG + i.fiberG }),
                { totalKcal: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0, totalFiberG: 0 }
              );
              updateMealServing(editMeal.id, ingredients, totals);
              refreshMeals();
              setEditMeal(null);
            }}
          />
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[chipStyle.chip, { borderColor: color + '40' }]}>
      <Text style={[chipStyle.text, { color }]}>{label}</Text>
    </View>
  );
}

function MealEditSheet({ meal, onClose, onDelete, onMove, onUpdate }: {
  meal: MealEntry;
  onClose: () => void;
  onDelete: () => void;
  onMove: (slot: Slot) => void;
  onUpdate: (ingredients: Ingredient[]) => void;
}) {
  const [view, setView] = useState<'actions' | 'move' | 'edit'>('actions');
  const [draftIngredients, setDraftIngredients] = useState<Ingredient[]>([]);
  const [savedConfirm, setSavedConfirm] = useState(false);

  const startEdit = () => {
    setDraftIngredients(meal.ingredients.map(i => ({ ...i })));
    setView('edit');
  };

  const saveEdit = () => {
    onUpdate(draftIngredients);
    setView('actions');
  };

  const saveToLibrary = () => {
    insertSavedMeal({
      name: meal.mealName || meal.ingredients[0]?.name || 'Saved meal',
      ingredients: meal.ingredients,
      totalKcal: meal.totalKcal,
      totalProteinG: meal.totalProteinG,
      totalCarbsG: meal.totalCarbsG,
      totalFatG: meal.totalFatG,
      totalFiberG: meal.totalFiberG,
    });
    setSavedConfirm(true);
    setTimeout(() => { setSavedConfirm(false); onClose(); }, 1200);
  };

  const updateIngredientGrams = (index: number, grams: number) => {
    setDraftIngredients(prev => prev.map((ing, i) => {
      if (i !== index) return ing;
      const per100 = ing.grams > 0 ? 100 / ing.grams : 1;
      return {
        ...ing, grams,
        kcal: Math.round(ing.kcal * per100 * grams / 100),
        proteinG: ing.proteinG * per100 * grams / 100,
        carbsG: ing.carbsG * per100 * grams / 100,
        fatG: ing.fatG * per100 * grams / 100,
        fiberG: ing.fiberG * per100 * grams / 100,
      };
    }));
  };

  return (
    <View style={sheet.container}>
      <Text style={sheet.title}>{meal.mealName || meal.ingredients[0]?.name || 'Meal'}</Text>
      <Text style={sheet.sub}>{Math.round(meal.totalKcal)} kcal · {meal.slot}</Text>

      {savedConfirm && (
        <View style={sheet.confirm}>
          <Text style={sheet.confirmText}>Saved to library ✓</Text>
        </View>
      )}

      {view === 'move' && (
        <View style={sheet.slots}>
          {SLOTS.map((s) => (
            <TouchableOpacity key={s} onPress={() => onMove(s)} style={sheet.slotBtn}>
              <Text style={sheet.slotBtnText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {view === 'edit' && (
        <View style={sheet.editSection}>
          {draftIngredients.map((ing, i) => (
            <EditIngredientRow
              key={i}
              ingredient={ing}
              onGramsChange={(g) => updateIngredientGrams(i, g)}
            />
          ))}
          <TouchableOpacity style={[sheet.action, { marginTop: 8 }]} onPress={saveEdit}>
            <Icon name="check" size={18} color={Colors.forest} />
            <Text style={sheet.actionText}>Save changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sheet.action} onPress={() => setView('actions')}>
            <Icon name="x" size={18} color={Colors.muted} />
            <Text style={[sheet.actionText, { color: Colors.muted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {view === 'actions' && !savedConfirm && (
        <View style={sheet.actions}>
          <TouchableOpacity style={sheet.action} onPress={startEdit}>
            <Icon name="edit" size={18} color={Colors.forest} />
            <Text style={sheet.actionText}>Edit serving size</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sheet.action} onPress={() => setView('move')}>
            <Icon name="move" size={18} color={Colors.forest} />
            <Text style={sheet.actionText}>Move to…</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sheet.action} onPress={saveToLibrary}>
            <Icon name="bookmark" size={18} color={Colors.forest} />
            <Text style={sheet.actionText}>Save to library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sheet.action} onPress={onDelete}>
            <Icon name="trash" size={18} color={Colors.ember} />
            <Text style={[sheet.actionText, { color: Colors.ember }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function EditIngredientRow({ ingredient, onGramsChange }: {
  ingredient: Ingredient; onGramsChange: (g: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(ingredient.grams));

  useEffect(() => { setDraft(String(ingredient.grams)); }, [ingredient.grams]);

  return (
    <View style={sheet.editRow}>
      <Text style={sheet.editName} numberOfLines={1}>{ingredient.name}</Text>
      {editing ? (
        <TextInput
          style={sheet.editGrams}
          value={draft}
          onChangeText={setDraft}
          onBlur={() => { onGramsChange(parseInt(draft) || ingredient.grams); setEditing(false); }}
          onSubmitEditing={() => { onGramsChange(parseInt(draft) || ingredient.grams); setEditing(false); }}
          keyboardType="number-pad"
          autoFocus
          selectTextOnFocus
        />
      ) : (
        <TouchableOpacity onPress={() => { setDraft(String(ingredient.grams)); setEditing(true); }}>
          <Text style={sheet.editGrams}>{ingredient.grams}g</Text>
        </TouchableOpacity>
      )}
      <Text style={sheet.editKcal}>{ingredient.kcal} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.sage },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 120, gap: 18, paddingTop: 8 },
  greeting: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
  },
  greetLeft: { flex: 1 },
  dateLabel: {
    fontFamily: Typography.geist,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 1.4,
  },
  greetText: {
    fontFamily: Typography.geist,
    fontSize: 26,
    fontWeight: '500',
    color: Colors.forest,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  greetName: {
    fontFamily: Typography.instrumentSerif,
    fontStyle: 'italic',
    fontSize: 26,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  avatarText: {
    fontFamily: Typography.geist,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  heroCard: { gap: 20 },
  macroGrid: { gap: 12 },
  section: { gap: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sectionLabel: {
    fontFamily: Typography.geist,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionDate: {
    fontFamily: Typography.geistMono,
    fontSize: 11,
    color: Colors.muted,
  },
  slotBlock: { marginBottom: 12, gap: 6 },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  slotName: {
    fontFamily: Typography.geist,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.forest,
  },
  slotKcal: {
    fontFamily: Typography.geistMono,
    fontSize: 13,
    color: Colors.muted,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  emptySlotText: {
    fontFamily: Typography.geist,
    fontSize: 13,
    color: Colors.muted,
  },
  mealRow: { marginBottom: 6 },
  mealLeft: { flex: 1 },
  mealName: {
    fontFamily: Typography.geist,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.forest,
  },
  mealSub: {
    fontFamily: Typography.geist,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  mealRight: { alignItems: 'flex-end', gap: 4 },
  mealKcal: {
    fontFamily: Typography.geistMono,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.forest,
  },
  mealChips: { flexDirection: 'row', gap: 4 },
});

const chipStyle = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  text: {
    fontFamily: Typography.geistMono,
    fontSize: 10,
    fontWeight: '500',
  },
});

const sheet = StyleSheet.create({
  container: { gap: 16 },
  title: {
    fontFamily: Typography.geist,
    fontSize: 18,
    fontWeight: '500',
    color: Colors.forest,
  },
  sub: {
    fontFamily: Typography.geist,
    fontSize: 13,
    color: Colors.muted,
    marginTop: -8,
  },
  actions: { gap: 8, marginTop: 8 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: Colors.line,
  },
  actionText: {
    fontFamily: Typography.geist,
    fontSize: 15,
    color: Colors.forest,
  },
  slots: { gap: 8, marginTop: 8 },
  slotBtn: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: Colors.line,
  },
  slotBtnText: {
    fontFamily: Typography.geist,
    fontSize: 15,
    color: Colors.forest,
  },
  confirm: {
    backgroundColor: Colors.forest + '18',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: Typography.geist,
    fontSize: 14,
    color: Colors.forest,
  },
  editSection: { gap: 4 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.line,
    gap: 8,
  },
  editName: {
    fontFamily: Typography.geist,
    fontSize: 14,
    color: Colors.forest,
    flex: 1,
  },
  editGrams: {
    fontFamily: Typography.geistMono,
    fontSize: 14,
    color: Colors.forest,
    borderBottomWidth: 1,
    borderColor: Colors.ember,
    minWidth: 50,
    textAlign: 'center',
    paddingVertical: 2,
  },
  editKcal: {
    fontFamily: Typography.geistMono,
    fontSize: 12,
    color: Colors.muted,
    minWidth: 58,
    textAlign: 'right',
  },
});
