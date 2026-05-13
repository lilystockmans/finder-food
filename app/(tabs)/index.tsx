import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
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
import {
  getMealsForDate, insertMeal, deleteMeal, updateMealSlot, updateMealServing,
  getLoggingStreak, getRecentMeals,
  type MealEntry, type Ingredient, type RecentMeal,
} from '../../lib/db';
import { loadProfile, saveProfile, getKv, setKv, type Profile } from '../../lib/profile';
import { insertSavedMeal } from '../../lib/savedMeals';
import { calcMacroGrams, calcWeeklyAdaptation, type AdaptationResult } from '../../lib/nutrition';
import { getTodayWater, setTodayWater } from '../../lib/water';
import { useAppStore } from '../../store';

type Slot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
const SLOTS: Slot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

function getMondayStr(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [editMeal, setEditMeal] = useState<MealEntry | null>(null);
  const [streak, setStreak] = useState(0);
  const [waterCups, setWaterCups] = useState(0);
  const [recentMeals, setRecentMeals] = useState<RecentMeal[]>([]);
  const [adaptResult, setAdaptResult] = useState<AdaptationResult | null>(null);
  const [showAdaptCard, setShowAdaptCard] = useState(false);
  const [reLogMeal, setReLogMeal] = useState<{ meal: RecentMeal; slot: Slot } | null>(null);
  const [reLogMultiplier, setReLogMultiplier] = useState(1);
  const [reLogCustom, setReLogCustom] = useState('');
  const { openEntry, viewDate, mealsRefreshKey, refreshMeals } = useAppStore();

  const today = new Date().toISOString().split('T')[0];
  const isToday = viewDate === today;

  const load = useCallback(() => {
    const p = loadProfile();
    setProfile(p);
    if (p) {
      setMeals(getMealsForDate(viewDate));
    }
    if (isToday) {
      setStreak(getLoggingStreak());
      setWaterCups(getTodayWater(today));
      setRecentMeals(getRecentMeals(7, 6));

      if (p && p.weightLog.length >= 14) {
        const result = calcWeeklyAdaptation(p, p.weightLog);
        setAdaptResult(result);
        const thisMonday = getMondayStr(today);
        const dismissed = getKv('ff:adaptation_dismissed');
        setShowAdaptCard(dismissed !== thisMonday);
      }
    }
  }, [viewDate, mealsRefreshKey, isToday]);

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

  const handleWaterTap = (n: number) => {
    if (!isToday) return;
    const next = waterCups === n ? n - 1 : n;
    const clamped = Math.max(0, next);
    setWaterCups(clamped);
    setTodayWater(today, clamped);
  };

  const handleAdaptApply = () => {
    if (!profile || !adaptResult) return;
    const updated = { ...profile, kcalTarget: profile.kcalTarget + adaptResult.delta };
    saveProfile(updated);
    setProfile(updated);
    const thisMonday = getMondayStr(today);
    setKv('ff:adaptation_dismissed', thisMonday);
    setShowAdaptCard(false);
  };

  const handleAdaptDismiss = () => {
    const thisMonday = getMondayStr(today);
    setKv('ff:adaptation_dismissed', thisMonday);
    setShowAdaptCard(false);
  };

  const handleReLog = (meal: RecentMeal, slot: Slot) => {
    setReLogMeal({ meal, slot });
    setReLogMultiplier(1);
    setReLogCustom('');
  };

  const confirmReLog = () => {
    if (!reLogMeal) return;
    const m = parseFloat(reLogCustom) || reLogMultiplier;
    const { meal, slot } = reLogMeal;
    const scaledIngredients: Ingredient[] = meal.ingredients.map(ing => {
      const per100 = ing.grams > 0 ? 100 / ing.grams : 1;
      return {
        ...ing,
        grams: Math.round(ing.grams * m),
        kcal: Math.round(ing.kcal * per100 * (ing.grams * m) / 100),
        proteinG: ing.proteinG * per100 * (ing.grams * m) / 100,
        carbsG: ing.carbsG * per100 * (ing.grams * m) / 100,
        fatG: ing.fatG * per100 * (ing.grams * m) / 100,
        fiberG: ing.fiberG * per100 * (ing.grams * m) / 100,
      };
    });
    insertMeal({
      id: Date.now().toString(),
      date: viewDate,
      timestampMs: Date.now(),
      slot,
      method: 'saved',
      mealName: meal.mealName,
      ingredients: scaledIngredients,
      totalKcal: meal.totalKcal * m,
      totalProteinG: meal.totalProteinG * m,
      totalCarbsG: meal.totalCarbsG * m,
      totalFatG: meal.totalFatG * m,
      totalFiberG: meal.totalFiberG * m,
    });
    setReLogMeal(null);
    refreshMeals();
  };

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
                weekday: 'short', month: 'short', day: 'numeric',
              }).toUpperCase()}
            </Text>
            <Text style={styles.greetText}>
              {greeting},{' '}
              <Text style={styles.greetName}>{profile?.firstName ?? 'there'}</Text>
            </Text>
          </View>
          <View style={styles.greetRight}>
            {streak >= 2 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakFlame}>🔥</Text>
                <Text style={styles.streakCount}>{streak}</Text>
              </View>
            )}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.firstName ?? 'U')[0].toUpperCase()}
              </Text>
            </View>
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

          {/* Water row */}
          <WaterRow cups={waterCups} isToday={isToday} onTap={handleWaterTap} />
        </Card>

        {/* Weekly adaptation card */}
        {isToday && showAdaptCard && adaptResult && adaptResult.suggestion !== null && (
          <AdaptationCard
            result={adaptResult}
            onApply={handleAdaptApply}
            onDismiss={handleAdaptDismiss}
          />
        )}

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
            const slotRecent = recentMeals.slice(0, 3);
            return (
              <View key={slot} style={styles.slotBlock}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotName}>{slot}</Text>
                  {slotKcal > 0 && (
                    <Text style={styles.slotKcal}>{Math.round(slotKcal)} kcal</Text>
                  )}
                </View>
                {slotMeals.length === 0 ? (
                  <>
                    {isToday && slotRecent.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.recentScroll}
                        contentContainerStyle={styles.recentChips}
                      >
                        {slotRecent.map((meal, i) => (
                          <TouchableOpacity
                            key={i}
                            style={styles.recentChip}
                            onPress={() => handleReLog(meal, slot)}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.recentChipName} numberOfLines={1}>{meal.mealName}</Text>
                            <Text style={styles.recentChipKcal}>{Math.round(meal.totalKcal)} kcal</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                    {isToday && (
                      <TouchableOpacity
                        onPress={() => { openEntry(slot); router.push('/meal-entry'); }}
                        style={styles.emptySlot}
                      >
                        <Icon name="plus-s" size={14} color={Colors.muted} />
                        <Text style={styles.emptySlotText}>add {slot.toLowerCase()}</Text>
                      </TouchableOpacity>
                    )}
                  </>
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
            onDelete={() => { deleteMeal(editMeal.id); refreshMeals(); setEditMeal(null); }}
            onMove={(slot: Slot) => { updateMealSlot(editMeal.id, slot); refreshMeals(); setEditMeal(null); }}
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

      {/* Re-log sheet */}
      <BottomSheet visible={reLogMeal !== null} onClose={() => setReLogMeal(null)}>
        {reLogMeal && (
          <ReLogSheet
            meal={reLogMeal.meal}
            multiplier={reLogMultiplier}
            custom={reLogCustom}
            onMultiplier={setReLogMultiplier}
            onCustom={setReLogCustom}
            onConfirm={confirmReLog}
            onClose={() => setReLogMeal(null)}
          />
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

function WaterRow({ cups, isToday, onTap }: { cups: number; isToday: boolean; onTap: (n: number) => void }) {
  return (
    <View style={water.container}>
      <View style={water.header}>
        <Text style={water.label}>WATER</Text>
        <Text style={water.count}>{cups} / 8</Text>
      </View>
      <View style={water.cups}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
          <TouchableOpacity
            key={n}
            onPress={() => isToday && onTap(n)}
            activeOpacity={isToday ? 0.7 : 1}
            style={water.cupBtn}
          >
            <View style={[water.cup, n <= cups ? water.cupFilled : water.cupEmpty]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function AdaptationCard({ result, onApply, onDismiss }: {
  result: AdaptationResult;
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <View style={adapt.card}>
      <View style={adapt.header}>
        <View style={adapt.titleRow}>
          <Text style={adapt.icon}>⚡</Text>
          <Text style={adapt.title}>Weekly check-in</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Icon name="x" size={14} color={Colors.muted} />
        </TouchableOpacity>
      </View>
      <Text style={adapt.message}>{result.message}</Text>
      {result.suggestion !== 'maintain' && (
        <View style={adapt.footer}>
          <Text style={adapt.delta}>
            {result.delta > 0 ? '+' : ''}{result.delta} kcal suggested
          </Text>
          <TouchableOpacity style={adapt.applyBtn} onPress={onApply}>
            <Text style={adapt.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ReLogSheet({ meal, multiplier, custom, onMultiplier, onCustom, onConfirm, onClose }: {
  meal: RecentMeal;
  multiplier: number;
  custom: string;
  onMultiplier: (m: number) => void;
  onCustom: (s: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const effectiveM = parseFloat(custom) || multiplier;
  const scaledKcal = Math.round(meal.totalKcal * effectiveM);
  const presets = [0.5, 1, 1.5, 2];

  return (
    <View style={relog.container}>
      <Text style={relog.title}>{meal.mealName}</Text>
      <Text style={relog.kcal}>{scaledKcal} kcal</Text>
      <View style={relog.presets}>
        {presets.map(p => (
          <TouchableOpacity
            key={p}
            style={[relog.preset, multiplier === p && !custom && relog.presetActive]}
            onPress={() => { onMultiplier(p); onCustom(''); }}
          >
            <Text style={[relog.presetText, multiplier === p && !custom && relog.presetTextActive]}>
              {p}×
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={relog.input}
        value={custom}
        onChangeText={onCustom}
        placeholder="Custom multiplier"
        placeholderTextColor={Colors.muted}
        keyboardType="decimal-pad"
      />
      <Btn label="Add to log" kind="primary" full onPress={onConfirm} style={{ marginTop: 16 }} />
    </View>
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
  greetRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.ember + '18',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  streakFlame: { fontSize: 13 },
  streakCount: {
    fontFamily: Typography.geistMono,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ember,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionDate: { fontFamily: Typography.geistMono, fontSize: 11, color: Colors.muted },
  slotBlock: { marginBottom: 12, gap: 6 },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  slotName: { fontFamily: Typography.geist, fontSize: 14, fontWeight: '600', color: Colors.forest },
  slotKcal: { fontFamily: Typography.geistMono, fontSize: 13, color: Colors.muted },
  recentScroll: { marginBottom: 4 },
  recentChips: { paddingVertical: 4, gap: 8, flexDirection: 'row' },
  recentChip: {
    backgroundColor: Colors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 150,
  },
  recentChipName: {
    fontFamily: Typography.geist,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.forest,
  },
  recentChipKcal: {
    fontFamily: Typography.geistMono,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  emptySlotText: { fontFamily: Typography.geist, fontSize: 13, color: Colors.muted },
  mealRow: { marginBottom: 6 },
  mealLeft: { flex: 1 },
  mealName: { fontFamily: Typography.geist, fontSize: 15, fontWeight: '500', color: Colors.forest },
  mealSub: { fontFamily: Typography.geist, fontSize: 12, color: Colors.muted, marginTop: 2 },
  mealRight: { alignItems: 'flex-end', gap: 4 },
  mealKcal: { fontFamily: Typography.geistMono, fontSize: 15, fontWeight: '500', color: Colors.forest },
  mealChips: { flexDirection: 'row', gap: 4 },
});

const water = StyleSheet.create({
  container: { gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    fontFamily: Typography.geist,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 1.2,
  },
  count: { fontFamily: Typography.geistMono, fontSize: 12, color: Colors.muted },
  cups: { flexDirection: 'row', gap: 6 },
  cupBtn: { flex: 1, alignItems: 'center' },
  cup: { width: '100%', aspectRatio: 0.75, borderRadius: 4, maxWidth: 28 },
  cupFilled: { backgroundColor: Colors.waterBlue },
  cupEmpty: { backgroundColor: Colors.line, borderWidth: 1, borderColor: Colors.muted + '30' },
});

const adapt = StyleSheet.create({
  card: {
    backgroundColor: Colors.amber + '15',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.amber + '50',
    padding: 18,
    gap: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 14 },
  title: { fontFamily: Typography.geist, fontSize: 13, fontWeight: '600', color: Colors.forest },
  message: { fontFamily: Typography.geist, fontSize: 14, color: Colors.forest, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  delta: { fontFamily: Typography.geistMono, fontSize: 13, color: Colors.forest },
  applyBtn: {
    backgroundColor: Colors.forest,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  applyText: { fontFamily: Typography.geist, fontSize: 13, fontWeight: '600', color: Colors.white },
});

const relog = StyleSheet.create({
  container: { gap: 12 },
  title: { fontFamily: Typography.geist, fontSize: 18, fontWeight: '500', color: Colors.forest },
  kcal: { fontFamily: Typography.geistMono, fontSize: 28, fontWeight: '500', color: Colors.forest },
  presets: { flexDirection: 'row', gap: 8 },
  preset: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.line,
    backgroundColor: Colors.white, alignItems: 'center',
  },
  presetActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  presetText: { fontFamily: Typography.geistMono, fontSize: 14, color: Colors.forest },
  presetTextActive: { color: Colors.white },
  input: {
    borderWidth: 1, borderColor: Colors.line, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: Typography.geistMono, fontSize: 16, color: Colors.forest,
  },
});

const chipStyle = StyleSheet.create({
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  text: { fontFamily: Typography.geistMono, fontSize: 10, fontWeight: '500' },
});

const sheet = StyleSheet.create({
  container: { gap: 16 },
  title: { fontFamily: Typography.geist, fontSize: 18, fontWeight: '500', color: Colors.forest },
  sub: { fontFamily: Typography.geist, fontSize: 13, color: Colors.muted, marginTop: -8 },
  actions: { gap: 8, marginTop: 8 },
  action: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderColor: Colors.line,
  },
  actionText: { fontFamily: Typography.geist, fontSize: 15, color: Colors.forest },
  slots: { gap: 8, marginTop: 8 },
  slotBtn: { paddingVertical: 14, borderBottomWidth: 1, borderColor: Colors.line },
  slotBtnText: { fontFamily: Typography.geist, fontSize: 15, color: Colors.forest },
  confirm: { backgroundColor: Colors.forest + '18', borderRadius: 10, padding: 12, alignItems: 'center' },
  confirmText: { fontFamily: Typography.geist, fontSize: 14, color: Colors.forest },
  editSection: { gap: 4 },
  editRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.line, gap: 8,
  },
  editName: { fontFamily: Typography.geist, fontSize: 14, color: Colors.forest, flex: 1 },
  editGrams: {
    fontFamily: Typography.geistMono, fontSize: 14, color: Colors.forest,
    borderBottomWidth: 1, borderColor: Colors.ember,
    minWidth: 50, textAlign: 'center', paddingVertical: 2,
  },
  editKcal: { fontFamily: Typography.geistMono, fontSize: 12, color: Colors.muted, minWidth: 58, textAlign: 'right' },
});
