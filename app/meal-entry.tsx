import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '../components/Icon';
import { Btn } from '../components/Btn';
import { Card } from '../components/Card';
import { Pills } from '../components/Pills';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { PhotoCapture } from '../components/PhotoCapture';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppStore } from '../store';
import {
  searchFood,
  lookupBarcode,
  scaleNutrients,
  type OFFSearchResult,
  type OFFProduct,
} from '../lib/openfoodfacts';
import {
  getMealsForDate,
  insertMeal,
  getCachedBarcode,
  cacheBarcode,
  type Ingredient,
} from '../lib/db';
import { analysePhoto, analyseMealText, getGeminiKey, type GeminiIngredient } from '../lib/gemini';
import { searchLocalFoods } from '../lib/localfoods';
import { insertSavedMeal, getAllSavedMeals, type SavedMeal } from '../lib/savedMeals';

type Slot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
type Method = 'photo' | 'barcode' | 'manual' | 'saved' | 'describe';


export default function MealEntry() {
  const { entrySlot, closeEntry, refreshMeals } = useAppStore();
  const [slot, setSlot] = useState<Slot>(entrySlot);
  const [method, setMethod] = useState<Method | null>(null);
  const [mealName, setMealName] = useState('');

  // Manual state
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<OFFSearchResult[]>([]);
  const [history, setHistory] = useState<OFFSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Barcode state
  const [barcodeProduct, setBarcodeProduct] = useState<OFFProduct | null>(null);
  const [barcodeCode, setBarcodeCode] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeGrams, setBarcodeGrams] = useState(100);

  // Photo state (M3: real Gemini)
  const [photoCapturing, setPhotoCapturing] = useState(false);
  const [photoAnalysing, setPhotoAnalysing] = useState(false);
  const [photoIngredients, setPhotoIngredients] = useState<Array<Ingredient & { confidence: number; confirmed: boolean }>>([]);
  const [photoCorrection, setPhotoCorrection] = useState('');
  const [photoCorrecting, setPhotoCorrecting] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Describe state
  const [describeText, setDescribeText] = useState('');
  const [describeAnalysing, setDescribeAnalysing] = useState(false);
  const [describeIngredients, setDescribeIngredients] = useState<Array<Ingredient & { confidence: number; confirmed: boolean }>>([]);

  // Save-as-meal toggle
  const [saveAsMeal, setSaveAsMeal] = useState(false);

  // Saved meals flow
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [selectedSaved, setSelectedSaved] = useState<SavedMeal | null>(null);
  const [savedMult, setSavedMult] = useState(1);
  const [savedMultInput, setSavedMultInput] = useState('1');

  useEffect(() => { setSlot(entrySlot); }, [entrySlot]);

  useEffect(() => {
    if (method === 'saved') {
      setSavedMeals(getAllSavedMeals());
      setSelectedSaved(null);
      setSavedMult(1);
      setSavedMultInput('1');
    }
  }, [method]);

  // Load recent history
  useEffect(() => {
    if (method === 'manual') {
      const today = new Date().toISOString().split('T')[0];
      const recentMeals = getMealsForDate(today);
      const seen = new Set<string>();
      const recentIng: OFFSearchResult[] = [];
      for (const meal of recentMeals.slice(-5)) {
        for (const ing of meal.ingredients) {
          if (!seen.has(ing.name)) {
            seen.add(ing.name);
            const per100 = ing.grams > 0 ? 100 / ing.grams : 1;
            recentIng.push({
              id: ing.name, name: ing.name, brand: '',
              kcalPer100g: ing.kcal * per100,
              proteinPer100g: ing.proteinG * per100,
              carbsPer100g: ing.carbsG * per100,
              fatPer100g: ing.fatG * per100,
              fiberPer100g: ing.fiberG * per100,
            });
          }
        }
      }
      setHistory(recentIng);
    }
  }, [method]);

  const startRateLimitCountdown = () => {
    setRateLimitCountdown(30);
    countdownRef.current = setInterval(() => {
      setRateLimitCountdown((c) => {
        if (c <= 1) { clearInterval(countdownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handlePhotoCapture = async (base64: string) => {
    setPhotoCapturing(false);
    setPhotoAnalysing(true);
    setPhotoIngredients([]);
    const startTime = Date.now();
    console.log('[photo] base64 length:', base64.length, 'key present:', !!getGeminiKey());
    try {
      const items = await analysePhoto(base64, getGeminiKey());
      console.log('[photo] items:', JSON.stringify(items));
      // Minimum 1.2s shimmer display
      const elapsed = Date.now() - startTime;
      if (elapsed < 1200) await new Promise(r => setTimeout(r, 1200 - elapsed));
      const mapped = items.map((it: GeminiIngredient) => ({
        name: it.confidence < 0.6 ? 'UNKNOWN' : it.name,
        grams: it.grams,
        kcal: it.kcal,
        proteinG: it.protein_g,
        carbsG: it.carbs_g,
        fatG: it.fat_g,
        fiberG: it.fiber_g,
        confidence: it.confidence,
        confirmed: it.confidence >= 0.6,
      }));
      setPhotoIngredients(mapped);
    } catch (err: any) {
      console.log('[photo] error:', err?.message, 'code:', err?.code, err);
      if (err.code === 429) startRateLimitCountdown();
      else setPhotoIngredients([]);
    } finally {
      setPhotoAnalysing(false);
    }
  };

  const handlePhotoCorrection = async () => {
    if (!photoCorrection.trim()) return;
    setPhotoCorrecting(true);
    try {
      const currentList = photoIngredients.map(p => `${p.name} (${p.grams}g)`).join(', ');
      const prompt = `Current detected ingredients: ${currentList}. Correction: ${photoCorrection}. Return the full updated ingredient list.`;
      const items = await analyseMealText(prompt, getGeminiKey());
      const mapped = items.map((it: GeminiIngredient) => ({
        name: it.confidence < 0.6 ? 'UNKNOWN' : it.name,
        grams: it.grams,
        kcal: it.kcal,
        proteinG: it.protein_g,
        carbsG: it.carbs_g,
        fatG: it.fat_g,
        fiberG: it.fiber_g,
        confidence: it.confidence,
        confirmed: it.confidence >= 0.6,
      }));
      setPhotoIngredients(mapped);
      setPhotoCorrection('');
    } catch (err: any) {
      if (err.code === 429) startRateLimitCountdown();
    } finally {
      setPhotoCorrecting(false);
    }
  };

  const handleDescribeAnalyse = async () => {
    if (!describeText.trim()) return;
    setDescribeAnalysing(true);
    setDescribeIngredients([]);
    try {
      const items = await analyseMealText(describeText, getGeminiKey());
      const mapped = items.map((it: GeminiIngredient) => ({
        name: it.confidence < 0.6 ? 'UNKNOWN' : it.name,
        grams: it.grams,
        kcal: it.kcal,
        proteinG: it.protein_g,
        carbsG: it.carbs_g,
        fatG: it.fat_g,
        fiberG: it.fiber_g,
        confidence: it.confidence,
        confirmed: it.confidence >= 0.6,
      }));
      setDescribeIngredients(mapped);
    } catch (err: any) {
      if (err.code === 429) startRateLimitCountdown();
    } finally {
      setDescribeAnalysing(false);
    }
  };

  // Debounced search (merges local whole foods + Open Food Facts)
  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const local = searchLocalFoods(search);
      const off = await searchFood(search);
      const offDeduped = off.filter((o) => !local.some((l) => l.name.toLowerCase() === o.name.toLowerCase()));
      setResults([...local, ...offDeduped].slice(0, 15));
      setSearching(false);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const addIngredient = (item: OFFSearchResult) => {
    setIngredients((prev) => [
      ...prev,
      {
        name: item.name, grams: 100,
        kcal: Math.round(item.kcalPer100g),
        proteinG: item.proteinPer100g,
        carbsG: item.carbsPer100g,
        fatG: item.fatPer100g,
        fiberG: item.fiberPer100g,
      },
    ]);
  };

  const updateGrams = (index: number, grams: number, list: Ingredient[], setList: (v: Ingredient[]) => void) => {
    setList(list.map((ing, i) => {
      if (i !== index) return ing;
      const per100 = ing.grams > 0 ? 100 / ing.grams : 1;
      const n = { name: ing.name, brand: '', kcalPer100g: ing.kcal * per100, proteinPer100g: ing.proteinG * per100, carbsPer100g: ing.carbsG * per100, fatPer100g: ing.fatG * per100, fiberPer100g: ing.fiberG * per100 };
      const scaled = scaleNutrients(n, grams);
      return { ...ing, grams, ...scaled };
    }));
  };

  const removeIngredient = (index: number) => setIngredients((p) => p.filter((_, i) => i !== index));

  const totalsOf = (list: Ingredient[]) => list.reduce(
    (acc, i) => ({ kcal: acc.kcal + i.kcal, protein: acc.protein + i.proteinG, carbs: acc.carbs + i.carbsG, fat: acc.fat + i.fatG, fiber: acc.fiber + i.fiberG }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const saveIngredients = (list: Ingredient[], nameOverride?: string) => {
    if (list.length === 0) return;
    const t = totalsOf(list);
    const finalName = nameOverride ?? mealName.trim();
    insertMeal({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      timestampMs: Date.now(),
      slot, method: method ?? 'manual',
      mealName: finalName,
      ingredients: list,
      totalKcal: t.kcal, totalProteinG: t.protein, totalCarbsG: t.carbs, totalFatG: t.fat, totalFiberG: t.fiber,
    });
    if (saveAsMeal) {
      insertSavedMeal({
        name: finalName || 'Saved meal',
        ingredients: list,
        totalKcal: t.kcal, totalProteinG: t.protein, totalCarbsG: t.carbs, totalFatG: t.fat, totalFiberG: t.fiber,
      });
    }
    refreshMeals();
    closeEntry();
    router.back();
  };

  const logSavedMeal = (meal: SavedMeal, mult: number) => {
    const ingredients = meal.ingredients.map((ing) => {
      const per100 = ing.grams > 0 ? 100 / ing.grams : 1;
      const scaled = scaleNutrients({
        name: ing.name, brand: '',
        kcalPer100g: ing.kcal * per100,
        proteinPer100g: ing.proteinG * per100,
        carbsPer100g: ing.carbsG * per100,
        fatPer100g: ing.fatG * per100,
        fiberPer100g: ing.fiberG * per100,
      }, ing.grams * mult);
      return { ...ing, grams: Math.round(ing.grams * mult), ...scaled };
    });
    const totals = ingredients.reduce(
      (acc, i) => ({ kcal: acc.kcal + i.kcal, protein: acc.protein + i.proteinG, carbs: acc.carbs + i.carbsG, fat: acc.fat + i.fatG, fiber: acc.fiber + i.fiberG }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
    insertMeal({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      timestampMs: Date.now(),
      slot, method: 'saved',
      mealName: meal.name,
      ingredients,
      totalKcal: totals.kcal, totalProteinG: totals.protein, totalCarbsG: totals.carbs, totalFatG: totals.fat, totalFiberG: totals.fiber,
    });
    refreshMeals();
    closeEntry();
    router.back();
  };

  const handleBarcodeScanned = async (code: string) => {
    setBarcodeCode(code);
    setBarcodeLoading(true);
    setBarcodeProduct(null);

    // Check cache first
    const cached = getCachedBarcode(code);
    if (cached) {
      setBarcodeProduct(cached);
      setBarcodeLoading(false);
      return;
    }

    const product = await lookupBarcode(code);
    if (product) {
      cacheBarcode(code, product);
      setBarcodeProduct(product);
    }
    setBarcodeLoading(false);
  };

  const saveBarcodeItem = () => {
    if (!barcodeProduct) return;
    const scaled = scaleNutrients(barcodeProduct, barcodeGrams);
    saveIngredients([{
      name: barcodeProduct.name, grams: barcodeGrams,
      kcal: scaled.kcal, proteinG: scaled.proteinG, carbsG: scaled.carbsG, fatG: scaled.fatG, fiberG: scaled.fiberG,
    }], barcodeProduct.name);
  };

  const manualTotals = totalsOf(ingredients);
  const photoTotals = totalsOf(photoIngredients);
  const allPhotoConfirmed = photoIngredients.every(p => p.confirmed);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { if (method) { setMethod(null); } else { closeEntry(); router.back(); } }}
          style={styles.closeBtn}
        >
          <Icon name={method ? 'chev-l' : 'x'} size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log meal</Text>
        <Text style={styles.slotLabel}>{slot}</Text>
      </View>

      {/* Slot pills */}
      <View style={styles.slotPills}>
        <Pills items={['Breakfast', 'Lunch', 'Dinner', 'Snack']} value={slot} onChange={(v) => setSlot(v as Slot)} />
      </View>

      {/* === METHOD PICKER === */}
      {!method && (
        <ScrollView contentContainerStyle={styles.methodGrid}>
          <MethodCard icon="camera" title="Photo" desc="Snap a meal · AI detects ingredients" onPress={() => setMethod('photo')} />
          <MethodCard icon="barcode" title="Barcode" desc="Scan packaged food" onPress={() => setMethod('barcode')} />
          <MethodCard icon="bookmark" title="Saved" desc="From your library" onPress={() => setMethod('saved')} />
          <MethodCard icon="search" title="Describe" desc="Tell AI what you ate · it fills in the macros" onPress={() => { setDescribeText(''); setDescribeIngredients([]); setMethod('describe'); }} />
        </ScrollView>
      )}

      {/* === BARCODE FLOW === */}
      {method === 'barcode' && !barcodeProduct && !barcodeLoading && (
        <BarcodeScanner
          onScanned={handleBarcodeScanned}
          onClose={() => setMethod(null)}
        />
      )}

      {method === 'barcode' && barcodeLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.forest} />
          <Text style={styles.loadingText}>Looking up {barcodeCode}…</Text>
        </View>
      )}

      {method === 'barcode' && !barcodeLoading && barcodeProduct && (
        <ScrollView contentContainerStyle={styles.barcodeContent}>
          <View style={styles.productCard}>
            <Text style={styles.productBrand}>{barcodeProduct.brand}</Text>
            <Text style={styles.productName}>{barcodeProduct.name}</Text>
            <Text style={styles.barcodeCode}>{barcodeCode}</Text>
          </View>

          <View style={styles.nutriRow}>
            <NutriChip label="kcal" value={Math.round(scaleNutrients(barcodeProduct, barcodeGrams).kcal)} bold />
            <NutriChip label="P" value={Math.round(scaleNutrients(barcodeProduct, barcodeGrams).proteinG)} color={Colors.macroProtein} />
            <NutriChip label="C" value={Math.round(scaleNutrients(barcodeProduct, barcodeGrams).carbsG)} color={Colors.macroCarbs} />
            <NutriChip label="F" value={Math.round(scaleNutrients(barcodeProduct, barcodeGrams).fatG)} color={Colors.macroFat} />
          </View>

          <Text style={styles.gramsLabel}>Serving size</Text>
          <GramsInput value={barcodeGrams} onChange={setBarcodeGrams} />

          <View style={styles.portionChips}>
            {[50, 100, 150, 200].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setBarcodeGrams(g)}
                style={[styles.portionChip, barcodeGrams === g && styles.portionChipActive]}
              >
                <Text style={[styles.portionChipText, barcodeGrams === g && styles.portionChipActiveText]}>
                  {g}g
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionRow}>
            <Btn label="Scan another" kind="ghost" onPress={() => { setBarcodeProduct(null); setBarcodeCode(''); }} />
            <Btn label="Add to log" kind="primary" onPress={saveBarcodeItem} />
          </View>
        </ScrollView>
      )}

      {method === 'barcode' && !barcodeLoading && !barcodeProduct && barcodeCode && (
        <View style={styles.notFoundBox}>
          <Icon name="warn" size={36} color={Colors.amber} />
          <Text style={styles.notFoundText}>Product not found</Text>
          <Text style={styles.notFoundSub}>Switching to manual search…</Text>
          <Btn label="Search manually" kind="primary" onPress={() => {
            setSearch(barcodeCode);
            setMethod('manual');
          }} style={{ marginTop: 16 }} />
        </View>
      )}

      {/* === PHOTO FLOW (M3: camera + Gemini) === */}
      {method === 'photo' && photoCapturing && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onClose={() => { setPhotoCapturing(false); setMethod(null); }}
        />
      )}

      {method === 'photo' && !photoCapturing && !photoAnalysing && photoIngredients.length === 0 && (
        <View style={styles.comingSoon}>
          {rateLimitCountdown > 0 ? (
            <>
              <Icon name="clock" size={40} color={Colors.amber} />
              <Text style={styles.comingSoonText}>Rate limited</Text>
              <Text style={styles.rateLimitSub}>Retry in {rateLimitCountdown}s</Text>
            </>
          ) : getGeminiKey() ? (
            <>
              <Icon name="camera" size={40} color={Colors.forest} />
              <Text style={styles.comingSoonText}>Take a photo of your meal</Text>
              <Btn label="Open camera" kind="primary" onPress={() => setPhotoCapturing(true)} style={{ marginTop: 8 }} />
            </>
          ) : (
            <>
              <Icon name="warn" size={40} color={Colors.amber} />
              <Text style={styles.comingSoonText}>Gemini key not set</Text>
              <Text style={styles.rateLimitSub}>Add FF_GEMINI_KEY to your .env file</Text>
              <Btn label="Go back" kind="ghost" onPress={() => setMethod(null)} style={{ marginTop: 8 }} />
            </>
          )}
        </View>
      )}

      {method === 'photo' && photoAnalysing && (
        <View style={styles.analysisBox}>
          <View style={styles.shimmerList}>
            {[1, 2, 3].map((i) => <View key={i} style={styles.shimmerRow} />)}
          </View>
          <Text style={styles.analysisLabel}>Analysing photo…</Text>
        </View>
      )}

      {method === 'photo' && !photoAnalysing && photoIngredients.length > 0 && (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.manualContent} keyboardShouldPersistTaps="handled">
            <View style={styles.photoHeader}>
              <Text style={styles.photoFound}>We found {photoIngredients.length} items</Text>
              {photoIngredients.some(p => !p.confirmed) && (
                <View style={styles.warnBanner}>
                  <Icon name="warn" size={14} color={Colors.amber} />
                  <Text style={styles.warnText}>
                    {photoIngredients.filter(p => !p.confirmed).length} item(s) were hard to recognise — tap UNKNOWN to name them.
                  </Text>
                </View>
              )}
            </View>

            {photoIngredients.map((item, i) => (
              <PhotoIngredientRow
                key={i}
                item={item}
                onGramsChange={(g) => {
                  const per100 = item.grams > 0 ? 100 / item.grams : 1;
                  const n = { name: item.name, brand: '', kcalPer100g: item.kcal * per100, proteinPer100g: item.proteinG * per100, carbsPer100g: item.carbsG * per100, fatPer100g: item.fatG * per100, fiberPer100g: item.fiberG * per100 };
                  const scaled = scaleNutrients(n, g);
                  setPhotoIngredients(prev => prev.map((p, j) => j === i ? { ...p, grams: g, ...scaled } : p));
                }}
                onConfirmName={(name) => {
                  setPhotoIngredients(prev => prev.map((p, j) => j === i ? { ...p, name, confirmed: true } : p));
                }}
              />
            ))}

            <View style={corr.box}>
              <Text style={styles.sectionLabel}>Something wrong or missing?</Text>
              <TextInput
                style={corr.input}
                placeholder="e.g. remove the sauce, add 200g rice, replace chicken with tofu"
                placeholderTextColor={Colors.muted}
                value={photoCorrection}
                onChangeText={setPhotoCorrection}
                multiline
                numberOfLines={3}
              />
              <Btn
                label={photoCorrecting ? 'Re-analysing…' : 'Re-analyse'}
                kind="ghost"
                onPress={handlePhotoCorrection}
                disabled={!photoCorrection.trim() || photoCorrecting}
              />
            </View>

            <View style={{ height: 140 }} />
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerTotals}>
              <TotalChip label="kcal" value={Math.round(photoTotals.kcal)} bold />
              <TotalChip label="P" value={Math.round(photoTotals.protein)} color={Colors.macroProtein} />
              <TotalChip label="C" value={Math.round(photoTotals.carbs)} color={Colors.macroCarbs} />
              <TotalChip label="F" value={Math.round(photoTotals.fat)} color={Colors.macroFat} />
            </View>
            {!allPhotoConfirmed ? (
              <>
                <View style={styles.warnBanner}>
                  <Icon name="warn" size={14} color={Colors.amber} />
                  <Text style={styles.warnText}>Name all unknown items before saving</Text>
                </View>
                <Btn label="Confirm & save" kind="primary" full disabled />
              </>
            ) : (
              <Btn label="Add to log" kind="primary" full onPress={() => saveIngredients(photoIngredients)} />
            )}
          </View>
        </KeyboardAvoidingView>
      )}

      {/* === MANUAL FLOW === */}
      {method === 'manual' && (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.flex} contentContainerStyle={styles.manualContent} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.mealNameInput}
              placeholder="Meal name (optional)"
              placeholderTextColor={Colors.muted}
              value={mealName}
              onChangeText={setMealName}
            />
            <View style={styles.searchRow}>
              <Icon name="search" size={16} color={Colors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search food…"
                placeholderTextColor={Colors.muted}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {searching && <ActivityIndicator size="small" color={Colors.muted} />}
            </View>

            {!search && history.length > 0 && (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionLabel}>RECENT</Text>
                {history.map((item) => (
                  <FoodRow key={item.id} item={item} onAdd={() => addIngredient(item)} />
                ))}
              </View>
            )}

            {results.length > 0 && (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionLabel}>DATABASE</Text>
                {results.map((item) => (
                  <FoodRow key={item.id} item={item} onAdd={() => addIngredient(item)} />
                ))}
              </View>
            )}

            {ingredients.length > 0 && (
              <View style={styles.ingredientList}>
                <Text style={styles.sectionLabel}>INGREDIENTS</Text>
                {ingredients.map((ing, i) => (
                  <IngredientRow
                    key={i}
                    ingredient={ing}
                    onGramsChange={(g) => updateGrams(i, g, ingredients, setIngredients)}
                    onRemove={() => removeIngredient(i)}
                  />
                ))}
              </View>
            )}

            <View style={{ height: 160 }} />
          </ScrollView>

          {ingredients.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.footerTotals}>
                <TotalChip label="kcal" value={Math.round(manualTotals.kcal)} bold />
                <TotalChip label="P" value={Math.round(manualTotals.protein)} color={Colors.macroProtein} />
                <TotalChip label="C" value={Math.round(manualTotals.carbs)} color={Colors.macroCarbs} />
                <TotalChip label="F" value={Math.round(manualTotals.fat)} color={Colors.macroFat} />
              </View>
              <View style={styles.saveToggleRow}>
                <Text style={styles.saveToggleLabel}>Save as meal</Text>
                <Switch
                  value={saveAsMeal}
                  onValueChange={setSaveAsMeal}
                  trackColor={{ true: Colors.forest, false: Colors.line }}
                  thumbColor={Colors.white}
                />
              </View>
              <Btn label="Add to log" kind="primary" full onPress={() => saveIngredients(ingredients)} />
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      {/* === SAVED FLOW === */}
      {method === 'saved' && !selectedSaved && (
        savedMeals.length === 0 ? (
          <View style={styles.comingSoon}>
            <Icon name="bookmark" size={40} color={Colors.muted} />
            <Text style={styles.comingSoonText}>No saved meals yet</Text>
            <Text style={[styles.rateLimitSub, { color: Colors.muted, fontSize: 13 }]}>Log a meal and toggle "Save as meal"</Text>
            <Btn label="Go back" kind="ghost" onPress={() => setMethod(null)} style={{ marginTop: 16 }} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.manualContent}>
            <Text style={styles.sectionLabel}>YOUR LIBRARY</Text>
            {savedMeals.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                onPress={() => { setSelectedSaved(meal); setSavedMult(1); setSavedMultInput('1'); }}
                activeOpacity={0.85}
                style={savedRow.row}
              >
                <View style={savedRow.info}>
                  <Text style={savedRow.name}>{meal.name}</Text>
                  <Text style={savedRow.meta}>{meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={savedRow.kcal}>{Math.round(meal.totalKcal)} kcal</Text>
                <Icon name="chev-r" size={18} color={Colors.muted} />
              </TouchableOpacity>
            ))}
            <View style={{ height: 80 }} />
          </ScrollView>
        )
      )}

      {/* === DESCRIBE FLOW === */}
      {method === 'describe' && !describeAnalysing && describeIngredients.length === 0 && (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.manualContent} keyboardShouldPersistTaps="handled">
            {!getGeminiKey() ? (
              <View style={styles.comingSoon}>
                <Icon name="warn" size={40} color={Colors.amber} />
                <Text style={styles.comingSoonText}>Gemini key not set</Text>
                <Text style={styles.rateLimitSub}>Add FF_GEMINI_KEY to your .env file</Text>
                <Btn label="Go back" kind="ghost" onPress={() => setMethod(null)} style={{ marginTop: 8 }} />
              </View>
            ) : rateLimitCountdown > 0 ? (
              <View style={styles.comingSoon}>
                <Icon name="clock" size={40} color={Colors.amber} />
                <Text style={styles.comingSoonText}>Rate limited</Text>
                <Text style={styles.rateLimitSub}>Retry in {rateLimitCountdown}s</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>DESCRIBE YOUR MEAL</Text>
                <TextInput
                  style={describe.input}
                  placeholder={"e.g. 2 scrambled eggs, toast with butter, glass of orange juice"}
                  placeholderTextColor={Colors.muted}
                  value={describeText}
                  onChangeText={setDescribeText}
                  multiline
                  numberOfLines={4}
                  autoFocus
                />
                <Btn label="Analyse meal" kind="primary" full onPress={handleDescribeAnalyse} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {method === 'describe' && describeAnalysing && (
        <View style={styles.analysisBox}>
          <View style={styles.shimmerList}>
            {[1, 2, 3].map((i) => <View key={i} style={styles.shimmerRow} />)}
          </View>
          <Text style={styles.analysisLabel}>Analysing your meal…</Text>
        </View>
      )}

      {method === 'describe' && !describeAnalysing && describeIngredients.length > 0 && (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.manualContent} keyboardShouldPersistTaps="handled">
            <View style={styles.photoHeader}>
              <Text style={styles.photoFound}>Found {describeIngredients.length} items</Text>
              {describeIngredients.some(p => !p.confirmed) && (
                <View style={styles.warnBanner}>
                  <Icon name="warn" size={14} color={Colors.amber} />
                  <Text style={styles.warnText}>
                    {describeIngredients.filter(p => !p.confirmed).length} item(s) were uncertain — tap UNKNOWN to name them.
                  </Text>
                </View>
              )}
            </View>
            {describeIngredients.map((item, i) => (
              <PhotoIngredientRow
                key={i}
                item={item}
                onGramsChange={(g) => {
                  const per100 = item.grams > 0 ? 100 / item.grams : 1;
                  const n = { name: item.name, brand: '', kcalPer100g: item.kcal * per100, proteinPer100g: item.proteinG * per100, carbsPer100g: item.carbsG * per100, fatPer100g: item.fatG * per100, fiberPer100g: item.fiberG * per100 };
                  const scaled = scaleNutrients(n, g);
                  setDescribeIngredients(prev => prev.map((p, j) => j === i ? { ...p, grams: g, ...scaled } : p));
                }}
                onConfirmName={(name) => {
                  setDescribeIngredients(prev => prev.map((p, j) => j === i ? { ...p, name, confirmed: true } : p));
                }}
              />
            ))}
            <View style={{ height: 140 }} />
          </ScrollView>
          <View style={styles.footer}>
            <View style={styles.footerTotals}>
              <TotalChip label="kcal" value={Math.round(totalsOf(describeIngredients).kcal)} bold />
              <TotalChip label="P" value={Math.round(totalsOf(describeIngredients).protein)} color={Colors.macroProtein} />
              <TotalChip label="C" value={Math.round(totalsOf(describeIngredients).carbs)} color={Colors.macroCarbs} />
              <TotalChip label="F" value={Math.round(totalsOf(describeIngredients).fat)} color={Colors.macroFat} />
            </View>
            {!describeIngredients.every(p => p.confirmed) ? (
              <>
                <View style={styles.warnBanner}>
                  <Icon name="warn" size={14} color={Colors.amber} />
                  <Text style={styles.warnText}>Name all unknown items before saving</Text>
                </View>
                <Btn label="Confirm & save" kind="primary" full disabled />
              </>
            ) : (
              <Btn label="Add to log" kind="primary" full onPress={() => saveIngredients(describeIngredients)} />
            )}
          </View>
        </KeyboardAvoidingView>
      )}

      {method === 'saved' && selectedSaved && (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.manualContent}>
            <TouchableOpacity onPress={() => setSelectedSaved(null)} style={savedRow.backBtn}>
              <Icon name="chev-l" size={18} color={Colors.forest} />
              <Text style={savedRow.backText}>Library</Text>
            </TouchableOpacity>
            <Text style={savedRow.mealTitle}>{selectedSaved.name}</Text>
            <Text style={savedRow.mealMeta}>{selectedSaved.ingredients.length} ingredients · base {Math.round(selectedSaved.totalKcal)} kcal</Text>

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>PORTION</Text>
            <View style={savedRow.multChips}>
              {[0.5, 1, 1.5, 2].map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { setSavedMult(m); setSavedMultInput(String(m)); }}
                  style={[savedRow.chip, savedMult === m && savedRow.chipActive]}
                >
                  <Text style={[savedRow.chipText, savedMult === m && savedRow.chipActiveText]}>{m}×</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.mealNameInput}
              value={savedMultInput}
              onChangeText={(v) => { setSavedMultInput(v); const n = parseFloat(v); if (!isNaN(n)) setSavedMult(n); }}
              keyboardType="decimal-pad"
              placeholder="Custom multiplier"
              placeholderTextColor={Colors.muted}
            />
            <Text style={savedRow.scaledKcal}>
              {Math.round(selectedSaved.totalKcal * (parseFloat(savedMultInput) || 1))} kcal
            </Text>
            <View style={{ height: 100 }} />
          </ScrollView>
          <View style={styles.footer}>
            <Btn label="Add to log" kind="primary" full onPress={() => logSavedMeal(selectedSaved, parseFloat(savedMultInput) || savedMult)} />
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// Sub-components

function MethodCard({ icon, title, desc, onPress, comingSoon }: {
  icon: any; title: string; desc: string; onPress: () => void; comingSoon?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[mc.card, comingSoon && mc.disabled]}>
      <Icon name={icon} size={28} color={comingSoon ? Colors.muted : Colors.forest} />
      <Text style={[mc.title, comingSoon && mc.mutedText]}>{title}</Text>
      <Text style={mc.desc}>{desc}</Text>
      {comingSoon && (
        <View style={mc.badge}>
          <Text style={mc.badgeText}>SOON</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function FoodRow({ item, onAdd }: { item: OFFSearchResult; onAdd: () => void }) {
  return (
    <TouchableOpacity onPress={onAdd} activeOpacity={0.8} style={fr.row}>
      <View style={fr.info}>
        <Text style={fr.name} numberOfLines={1}>{item.name}</Text>
        {item.brand ? <Text style={fr.brand}>{item.brand}</Text> : null}
      </View>
      <Text style={fr.kcal}>{Math.round(item.kcalPer100g)} kcal/100g</Text>
      <Icon name="plus" size={18} color={Colors.forest} />
    </TouchableOpacity>
  );
}

function IngredientRow({ ingredient, onGramsChange, onRemove }: {
  ingredient: Ingredient; onGramsChange: (g: number) => void; onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(ingredient.grams));
  return (
    <View style={ir.row}>
      <View style={ir.left}><Text style={ir.name} numberOfLines={1}>{ingredient.name}</Text></View>
      {editing ? (
        <TextInput
          style={ir.grams}
          value={draft}
          onChangeText={setDraft}
          onBlur={() => { onGramsChange(parseInt(draft) || 100); setEditing(false); }}
          onSubmitEditing={() => { onGramsChange(parseInt(draft) || 100); setEditing(false); }}
          keyboardType="number-pad"
          autoFocus
          selectTextOnFocus
        />
      ) : (
        <TouchableOpacity onPress={() => { setDraft(String(ingredient.grams)); setEditing(true); }}>
          <Text style={ir.grams}>{ingredient.grams}g</Text>
        </TouchableOpacity>
      )}
      <Text style={ir.kcal}>{ingredient.kcal} kcal</Text>
      <TouchableOpacity onPress={onRemove}><Icon name="x" size={16} color={Colors.muted} /></TouchableOpacity>
    </View>
  );
}

function PhotoIngredientRow({ item, onGramsChange, onConfirmName }: {
  item: { name: string; grams: number; kcal: number; confidence: number; confirmed: boolean };
  onGramsChange: (g: number) => void;
  onConfirmName: (name: string) => void;
}) {
  const [nameDraft, setNameDraft] = useState('');
  const [editingGrams, setEditingGrams] = useState(false);
  const [gramsDraft, setGramsDraft] = useState(String(item.grams));
  const unknown = !item.confirmed;

  return (
    <View style={[pi.row, unknown && pi.unknownRow]}>
      <View style={pi.top}>
        {unknown ? (
          <TextInput
            style={pi.unknownInput}
            placeholder="name this ingredient…"
            placeholderTextColor={Colors.amber}
            value={nameDraft}
            onChangeText={setNameDraft}
            onSubmitEditing={() => nameDraft.trim() && onConfirmName(nameDraft.trim())}
            returnKeyType="done"
          />
        ) : (
          <Text style={pi.name}>{item.name}</Text>
        )}
        <Text style={pi.kcal}>{item.kcal} kcal</Text>
      </View>
      <View style={pi.bottom}>
        {editingGrams ? (
          <TextInput
            style={pi.gramsInput}
            value={gramsDraft}
            onChangeText={setGramsDraft}
            onBlur={() => { onGramsChange(parseInt(gramsDraft) || 100); setEditingGrams(false); }}
            onSubmitEditing={() => { onGramsChange(parseInt(gramsDraft) || 100); setEditingGrams(false); }}
            keyboardType="number-pad"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={() => { setGramsDraft(String(item.grams)); setEditingGrams(true); }}>
            <Text style={pi.grams}>{item.grams}g</Text>
          </TouchableOpacity>
        )}
        {unknown && nameDraft.trim() && (
          <TouchableOpacity onPress={() => onConfirmName(nameDraft.trim())} style={pi.confirmBtn}>
            <Text style={pi.confirmText}>Confirm</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function GramsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  return editing ? (
    <TextInput
      style={styles.gramsInputLarge}
      value={draft}
      onChangeText={setDraft}
      onBlur={() => { onChange(parseInt(draft) || 100); setEditing(false); }}
      onSubmitEditing={() => { onChange(parseInt(draft) || 100); setEditing(false); }}
      keyboardType="number-pad"
      autoFocus
      selectTextOnFocus
    />
  ) : (
    <TouchableOpacity onPress={() => { setDraft(String(value)); setEditing(true); }}>
      <Text style={styles.gramsInputLarge}>{value}g</Text>
    </TouchableOpacity>
  );
}

function NutriChip({ label, value, bold, color }: { label: string; value: number; bold?: boolean; color?: string }) {
  return (
    <View style={nc.c}>
      <Text style={[nc.v, bold && nc.bold, color ? { color } : {}]}>{value}</Text>
      <Text style={nc.l}>{label}</Text>
    </View>
  );
}

function TotalChip({ label, value, bold, color }: { label: string; value: number; bold?: boolean; color?: string }) {
  return (
    <View style={tc.c}>
      <Text style={[tc.v, bold && tc.bold, color ? { color } : {}]}>{value}</Text>
      <Text style={tc.l}>{label}</Text>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.forest2 },
  flex: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: 12, paddingBottom: 12,
    backgroundColor: Colors.forest2,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Typography.geist, fontSize: 16, fontWeight: '500', color: Colors.white },
  slotLabel: { fontFamily: Typography.geistMono, fontSize: 12, color: Colors.ice },
  slotPills: { backgroundColor: Colors.forest2, paddingHorizontal: Spacing.xl, paddingBottom: 12 },

  methodGrid: {
    flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.xl, gap: 12,
    backgroundColor: Colors.white, flexGrow: 1,
  },

  loadingBox: { flex: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontFamily: Typography.geist, fontSize: 15, color: Colors.muted },

  barcodeContent: { padding: Spacing.xl, gap: 16, backgroundColor: Colors.white },
  productCard: { gap: 4 },
  productBrand: { fontFamily: Typography.geist, fontSize: 12, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  productName: { fontFamily: Typography.geist, fontSize: 20, fontWeight: '500', color: Colors.forest },
  barcodeCode: { fontFamily: Typography.geistMono, fontSize: 12, color: Colors.muted },
  nutriRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.line },
  gramsLabel: { fontFamily: Typography.geist, fontSize: 11, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1.4 },
  gramsInputLarge: {
    fontFamily: Typography.geistMono, fontSize: 36, fontWeight: '500', color: Colors.forest,
    borderBottomWidth: 2, borderColor: Colors.ember, textAlign: 'center', paddingVertical: 4,
  },
  portionChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  portionChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
  },
  portionChipActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  portionChipText: { fontFamily: Typography.geistMono, fontSize: 13, color: Colors.forest },
  portionChipActiveText: { color: Colors.white },
  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginTop: 8 },

  notFoundBox: { flex: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  notFoundText: { fontFamily: Typography.geist, fontSize: 18, fontWeight: '500', color: Colors.forest },
  notFoundSub: { fontFamily: Typography.geist, fontSize: 14, color: Colors.muted },

  analysisBox: { flex: 1, backgroundColor: Colors.white, padding: Spacing.xl, gap: 16 },
  shimmerList: { gap: 12, marginTop: 8 },
  shimmerRow: { height: 52, borderRadius: 10, backgroundColor: Colors.sage },
  analysisLabel: { fontFamily: Typography.geist, fontSize: 14, color: Colors.muted, textAlign: 'center' },
  analysisDemo: { fontFamily: Typography.geist, fontSize: 11, fontWeight: '600', color: Colors.amber, textAlign: 'center', letterSpacing: 1.4 },

  photoHeader: { gap: 8, marginBottom: 8 },
  photoFound: { fontFamily: Typography.geist, fontSize: 16, fontWeight: '500', color: Colors.forest },

  manualContent: { padding: Spacing.xl, gap: 12 },
  mealNameInput: {
    fontFamily: Typography.geist, fontSize: 18, fontWeight: '500', color: Colors.forest,
    borderBottomWidth: 1, borderColor: Colors.line, paddingVertical: 8,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.sage, borderRadius: 12, paddingHorizontal: 12, gap: 8,
  },
  searchInput: { flex: 1, fontFamily: Typography.geist, fontSize: 15, color: Colors.forest, paddingVertical: 12 },
  resultsSection: { gap: 4 },
  sectionLabel: {
    fontFamily: Typography.geist, fontSize: 11, fontWeight: '600', color: Colors.muted,
    letterSpacing: 1.4, textTransform: 'uppercase', paddingVertical: 4,
  },
  ingredientList: { gap: 4 },
  warnBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.amber + '18', borderRadius: 10, padding: 10,
  },
  warnText: { fontFamily: Typography.geist, fontSize: 13, color: Colors.forest, flex: 1, lineHeight: 18 },
  footer: {
    backgroundColor: Colors.white, borderTopWidth: 1, borderColor: Colors.line,
    padding: Spacing.xl, gap: 12,
  },
  footerTotals: { flexDirection: 'row', justifyContent: 'space-around' },
  comingSoon: { flex: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', gap: 12 },
  comingSoonText: { fontFamily: Typography.geist, fontSize: 18, color: Colors.muted },
  rateLimitSub: { fontFamily: Typography.geistMono, fontSize: 14, color: Colors.amber },
  saveToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  saveToggleLabel: { fontFamily: Typography.geist, fontSize: 14, color: Colors.forest },
});

const mc = StyleSheet.create({
  card: { width: '47%', padding: 20, borderRadius: Radius.card, backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line, gap: 6 },
  disabled: { opacity: 0.65 },
  title: { fontFamily: Typography.geist, fontSize: 16, fontWeight: '500', color: Colors.forest },
  mutedText: { color: Colors.muted },
  desc: { fontFamily: Typography.geist, fontSize: 12, color: Colors.muted, lineHeight: 16 },
  badge: { alignSelf: 'flex-start', backgroundColor: Colors.amber + '30', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  badgeText: { fontFamily: Typography.geist, fontSize: 10, fontWeight: '600', color: Colors.amber, letterSpacing: 0.8 },
});

const fr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: Colors.line, gap: 8 },
  info: { flex: 1 },
  name: { fontFamily: Typography.geist, fontSize: 14, color: Colors.forest },
  brand: { fontFamily: Typography.geist, fontSize: 12, color: Colors.muted },
  kcal: { fontFamily: Typography.geistMono, fontSize: 12, color: Colors.muted },
});

const ir = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.line, gap: 8 },
  left: { flex: 1 },
  name: { fontFamily: Typography.geist, fontSize: 14, color: Colors.forest },
  grams: { fontFamily: Typography.geistMono, fontSize: 14, color: Colors.forest, borderBottomWidth: 1, borderColor: Colors.ember, minWidth: 48, textAlign: 'center', paddingVertical: 2 },
  kcal: { fontFamily: Typography.geistMono, fontSize: 13, color: Colors.muted, minWidth: 60, textAlign: 'right' },
});

const pi = StyleSheet.create({
  row: { paddingVertical: 12, borderBottomWidth: 1, borderColor: Colors.line, gap: 6 },
  unknownRow: { backgroundColor: Colors.amber + '12', borderRadius: 10, paddingHorizontal: 10, borderBottomWidth: 0, marginBottom: 4 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontFamily: Typography.geist, fontSize: 14, fontWeight: '500', color: Colors.forest, flex: 1 },
  unknownInput: { fontFamily: Typography.geist, fontSize: 14, color: Colors.amber, flex: 1, borderBottomWidth: 1, borderColor: Colors.amber + '60', paddingVertical: 4 },
  kcal: { fontFamily: Typography.geistMono, fontSize: 13, color: Colors.muted },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grams: { fontFamily: Typography.geistMono, fontSize: 13, color: Colors.forest, borderBottomWidth: 1, borderColor: Colors.line },
  gramsInput: { fontFamily: Typography.geistMono, fontSize: 13, color: Colors.forest, borderBottomWidth: 1, borderColor: Colors.ember, minWidth: 48, textAlign: 'center' },
  confirmBtn: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: Colors.forest, borderRadius: 999 },
  confirmText: { fontFamily: Typography.geist, fontSize: 12, color: Colors.white },
});

const nc = StyleSheet.create({
  c: { alignItems: 'center', gap: 2 },
  v: { fontFamily: Typography.geistMono, fontSize: 18, fontWeight: '500', color: Colors.forest },
  bold: { fontSize: 20 },
  l: { fontFamily: Typography.geist, fontSize: 11, color: Colors.muted },
});

const tc = StyleSheet.create({
  c: { alignItems: 'center', gap: 2 },
  v: { fontFamily: Typography.geistMono, fontSize: 16, fontWeight: '500', color: Colors.forest },
  bold: { fontSize: 18 },
  l: { fontFamily: Typography.geist, fontSize: 11, color: Colors.muted },
});

const describe = StyleSheet.create({
  input: {
    fontFamily: Typography.geist, fontSize: 15, color: Colors.forest,
    backgroundColor: Colors.sage, borderRadius: 12, padding: 16,
    minHeight: 120, textAlignVertical: 'top', lineHeight: 22,
  },
});

const corr = StyleSheet.create({
  box: { marginTop: 16, gap: 8, padding: 14, backgroundColor: Colors.sage, borderRadius: 12 },
  input: {
    fontFamily: Typography.geist, fontSize: 14, color: Colors.forest,
    backgroundColor: Colors.white, borderRadius: 8, padding: 12,
    minHeight: 72, textAlignVertical: 'top', lineHeight: 20,
  },
});

const savedRow = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: Colors.line, gap: 8 },
  info: { flex: 1 },
  name: { fontFamily: Typography.geist, fontSize: 15, fontWeight: '500', color: Colors.forest },
  meta: { fontFamily: Typography.geist, fontSize: 12, color: Colors.muted, marginTop: 2 },
  kcal: { fontFamily: Typography.geistMono, fontSize: 13, color: Colors.muted },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 12 },
  backText: { fontFamily: Typography.geist, fontSize: 14, color: Colors.forest },
  mealTitle: { fontFamily: Typography.geist, fontSize: 20, fontWeight: '500', color: Colors.forest },
  mealMeta: { fontFamily: Typography.geist, fontSize: 13, color: Colors.muted, marginTop: 2 },
  multChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line },
  chipActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  chipText: { fontFamily: Typography.geistMono, fontSize: 14, color: Colors.forest },
  chipActiveText: { color: Colors.white },
  scaledKcal: { fontFamily: Typography.geistMono, fontSize: 32, fontWeight: '500', color: Colors.forest, textAlign: 'center', marginTop: 12 },
});
