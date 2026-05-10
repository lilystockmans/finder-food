# finder food
## Requirements & Technical Specification
*React Native · Expo SDK 54 · Expo Go · 100% Free Stack · May 2026*

---

## 1. Overview

finder food is a local-first calorie and macro tracker built with React Native and Expo SDK 54, designed to run entirely inside Expo Go — no build step required during development. Users photograph meals, scan barcodes, or manually enter food to log daily intake. A calorie target is calculated from the user's profile using Mifflin–St Jeor and a configurable deficit. Progress is shown via weight and intake charts. No account, no server, and no paid services are required. The entire stack is free.

> **Expo Go — SDK 54**
> SDK 54 (React Native 0.81) is the current stable version supported by Expo Go on the Android Play Store. SDK 55 is available on Android but pending Apple App Store approval as of May 2026. This spec targets SDK 54 to guarantee Expo Go works on all test devices without any extra setup.

### Milestones

| # | Title | Scope |
|---|-------|-------|
| M1 | Core shell | Onboarding, dashboard, manual meal entry, local persistence. Fully usable without camera or AI. |
| M2 | Camera & barcode | Barcode scanning via expo-camera + Open Food Facts, photo capture UI (AI stub), Progress screen. |
| M3 | AI photo & polish | Food photo AI via Gemini 2.5 Flash (free API tier), saved meals, goal projection, animations. |

---

## 2. Information architecture

First launch gates the user through 8-step onboarding. On completion the main app is shown. Re-running onboarding is available from Profile and resets all stored data.

**Main app — bottom nav, 4 tabs + centre FAB:**
- Home (Dashboard)
- Progress
- [+] FAB → Meal Entry modal (overlays any tab)
- Saved (meal library — M3)
- Profile

---

## 3. Milestone 1 — Core shell

*Goal: working app in Expo Go. Onboarding → dashboard → manual meal log → local persistence.*

### 3.1 Onboarding

8-step linear flow. Paper (#f4f6f3) background. Back chevron, step counter (e.g. "3 / 8"), and a bottom-pinned ember Continue button (disabled until the step is complete).

| ID | Requirement | MS |
|----|-------------|-----|
| OB-01 | Step 1 — Units: metric (kg / cm) or imperial (lb / ft). Choice applies globally throughout the app. | M1 |
| OB-02 | Step 2 — Sex: tappable cards, female or male. Required for BMR calculation. | M1 |
| OB-03 | Step 3 — Age: typeable number scrubber with +/− buttons. Min 13, max 99. | M1 |
| OB-04 | Step 4 — Height: typeable scrubber in cm (metric) or ft + in (imperial). | M1 |
| OB-05 | Step 5 — Current weight: typeable scrubber in kg or lb. | M1 |
| OB-06 | Step 6 — Goal: three cards (lose / maintain / gain). Lose and gain show a goal-weight scrubber and a rate slider (0.25–1.0 kg/week, snapping at 0.25 steps). Maintain hides both. | M1 |
| OB-07 | Step 7 — Activity: five tappable cards (sedentary / lightly active / moderately active / active / very active), each showing the TDEE multiplier (1.2 / 1.375 / 1.55 / 1.725 / 1.9). | M1 |
| OB-08 | Step 8 — Summary: computed daily kcal target shown prominently. Three macro sliders (P / C / F %) that rebalance proportionally so total always stays at 100%. Default split 30 P / 40 C / 30 F. Fiber daily target input (default 30 g, user-editable). Confirm writes profile to expo-sqlite/kv-store and launches the main app. | M1 |

**BMR formula:** `10 × kg + 6.25 × cm − 5 × age + (male ? +5 : −161)`
**TDEE:** BMR × activity multiplier. **Deficit:** 7,700 kcal per kg of body fat, scaled to the chosen weekly rate.

---

### 3.2 Daily dashboard

Home tab. Sage (#e8ede8) background. Scrollable with bottom padding for the nav bar.

| ID | Requirement | MS |
|----|-------------|-----|
| DD-01 | Greeting block: uppercase date label, display greeting with user first name (Instrument Serif italic on the name), avatar circle (initials, forest fill) top-right. | M1 |
| DD-02 | Hero card: calorie ring (196px) showing consumed / remaining / target. Turns ember when over target. Remaining prefixes with − when over. | M1 |
| DD-03 | Four macro bars below the ring: Protein (forest), Carbs (amber), Fat (ember), Fiber (muted). Each shows value / target. Bars cap visually at 100% but show the true count. | M1 |
| DD-04 | Fiber bar target reflects the user-configured fiber goal from onboarding / Profile. | M1 |
| DD-05 | Meals section grouped by slot: Breakfast, Lunch, Dinner, Snack. Each slot shows a header row with the slot's total kcal. | M1 |
| DD-06 | Empty slots show a ghost "+ add breakfast" shortcut that opens Meal Entry pre-filtered to that slot. | M1 |
| DD-07 | Meal row: name, serving size, kcal, three macro chips (P / C / F). Tap opens the meal edit bottom sheet. | M1 |
| DD-08 | Meal edit sheet: Edit serving, Move to… (slot picker), Delete. Dismiss on backdrop tap or drag handle. | M1 |
| DD-09 | Date navigation: picker allows viewing any past day's log in read-only mode. | M1 |

---

### 3.3 Meal entry — manual flow

Full-screen modal. Forest-2 (#2f352f) status bar. Close icon top-left. Slot selector top-right defaults by time of day (before 11 = breakfast, 11–14 = lunch, 14–18 = dinner, after 18 = snack).

| ID | Requirement | MS |
|----|-------------|-----|
| ME-01 | Method picker: four cards — Photo, Barcode, Manual, Saved. In M1 only Manual is functional; others show a clear "coming soon" label. | M1 |
| ME-02 | Manual search: user's own log history shown first (RECENT, local), then Open Food Facts text search results (DATABASE) after a short delay or second tap. | M1 |
| ME-03 | Tapping a food adds it to the ingredient list at 100 g default. Each line has a typeable gram input and shows live kcal. | M1 |
| ME-04 | Sticky footer shows running kcal + all macros (including fiber) updating live as ingredients are added or edited. | M1 |
| ME-05 | Optional meal name input at the top. Saved with the log entry. | M1 |
| ME-06 | Add to log writes entry to expo-sqlite, dismisses modal, refreshes dashboard totals. | M1 |

---

### 3.4 Profile tab

Bottom nav tab. Each settings row opens a bottom sheet. Sheets render at app level, sliding up above the nav bar.

| ID | Requirement | MS |
|----|-------------|-----|
| PF-01 | Header: avatar circle + name + meta line (age · height · weight) in muted text. | M1 |
| PF-02 | Daily target: number scrubber to override the calculated kcal target. | M1 |
| PF-03 | Macros: three balanced sliders (P / C / F %). Adjusting one rebalances the others. Total always stays at 100%. | M1 |
| PF-04 | Fiber target: number scrubber in grams (default 30 g). Updates the dashboard fiber bar target immediately on save. | M1 |
| PF-05 | Goal weight: number scrubber in kg or lb. | M1 |
| PF-06 | Settings: unit toggle (metric / imperial). | M1 |
| PF-07 | Re-run onboarding (destructive): clears ff:profile from kv-store and returns to onboarding step 1. | M1 |

---

### 3.5 Local persistence

| ID | Requirement | MS |
|----|-------------|-----|
| DB-01 | Profile stored via expo-sqlite/kv-store as a JSON blob at key `ff:profile`. Fields: units, sex, age, heightCm, weightKg, goalType, goalWeightKg, ratePerWeek, activityFactor, kcalTarget, macroP, macroC, macroF, fiberTargetG, weightLog [{date, kg}]. | M1 |
| DB-02 | Meals in SQLite table `meal_entries`: id TEXT PK, date TEXT, timestampMs INTEGER, slot TEXT, method TEXT, mealName TEXT, ingredientsJson TEXT, totalKcal REAL, totalProteinG REAL, totalCarbsG REAL, totalFatG REAL, totalFiberG REAL. | M1 |
| DB-03 | M1 makes one external network call: Open Food Facts text search (GET /cgi/search.pl). No other external calls in M1. | M1 |

---

## 4. Milestone 2 — Camera & barcode

*Goal: expo-camera barcode scanning, Open Food Facts product lookup, photo capture stub, Progress screen.*

### 4.1 Barcode flow

| ID | Requirement | MS |
|----|-------------|-----|
| BC-01 | Camera permission via `useCameraPermissions()` from expo-camera. If denied, show in-app prompt to open device Settings. | M2 |
| BC-02 | Scanner uses `CameraView` with `barcodeScannerSettings`. Supported types: ean13, ean8, upc_a, upc_e, code128. Animated ice (#b5f8fe) scanline overlay. | M2 |
| BC-03 | On scan, fetch from Open Food Facts: `GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json`. Show product name, brand, and serving options. | M2 |
| BC-04 | User enters grams or selects a predefined serving. Nutrients calculated proportionally from per-100 g values. Portion multiplier scrubber (0.25 step, typeable). | M2 |
| BC-05 | Product not found (status === 0 or nutriments missing): fall through to manual entry with the barcode string pre-filled as the search term. | M2 |
| BC-06 | Cache successful barcode lookups in expo-sqlite (table `barcode_cache`) to avoid repeat network calls. | M2 |

---

### 4.2 Photo capture (stub)

| ID | Requirement | MS |
|----|-------------|-----|
| PH-01 | Photo flow uses `CameraView` to capture a still via `takePictureAsync()`. In M2, AI analysis is a hardcoded stub returning 2–3 sample ingredients, clearly labelled "demo mode" in the UI. | M2 |
| PH-02 | The editable ingredient list, gram sliders, live totals, and Add to log are fully functional with stub data. M3 replaces only the stub call with a live Gemini request. | M2 |

---

### 4.3 Progress screen

| ID | Requirement | MS |
|----|-------------|-----|
| PG-01 | Range selector: 7 days / 30 days segmented pills. Selection persists for the session. | M2 |
| PG-02 | Two summary cards: Weight (latest entry, delta over range) and Avg intake (avg kcal, under/over target label). Tapping a card switches the chart below. | M2 |
| PG-03 | Weight chart: SVG line chart, forest stroke (2px), data points as circles (4px), goal line as dashed amber (1.5px). Day labels on x-axis in Geist Mono. | M2 |
| PG-04 | Intake chart: SVG bar chart. Bars over target are ember, on or under target are forest. Dashed amber target line. | M2 |
| PG-05 | Avg macros card: average daily protein, carbs, fat, fiber for the selected period vs. targets. Fiber uses the user-configured fiber target. | M2 |
| PG-06 | Log weight: ghost button opens a bottom sheet with a typeable weight scrubber. Entry appended to profile weightLog in kv-store. | M2 |

---

## 5. Milestone 3 — AI photo & polish

*Goal: live food photo AI via Gemini (free), saved meals library, goal projection, animations.*

### 5.1 Photo AI — Gemini 2.5 Flash (free tier)

> **Why Gemini 2.5 Flash**
> Gemini 2.5 Flash accepts image + text input and is available free via Google AI Studio (aistudio.google.com) with no credit card required. A free API key is obtained there in under a minute. The free tier is rate-limited but sufficient for personal use. Note: free tier inputs may be used by Google to improve their models — acceptable for a personal app, but worth noting.

| ID | Requirement | MS |
|----|-------------|-----|
| AI-01 | On photo capture, the JPEG is resized to max 1024px on the long edge, base64-encoded, and sent to the Gemini API (model: `gemini-2.5-flash`). System prompt instructs the model to return only a JSON array: `[{name, grams, kcal, protein_g, carbs_g, fat_g, fiber_g, confidence}]`. No other text in the response. | M3 |
| AI-02 | While analysing, show a skeleton shimmer of the ingredient list. Minimum 1.2 s display to avoid flash on fast responses. | M3 |
| AI-03 | Result screen: editable ingredient list. Each row has a gram slider (0–500 g, 5 g steps) and live kcal contribution. | M3 |
| AI-04 | Ingredients with confidence < 0.6 show as "UNKNOWN" with amber background tint. User must type a name; typing triggers an Open Food Facts per-100 g lookup and recomputes kcal. Row turns forest on confirmation. | M3 |
| AI-05 | If any UNKNOWN items remain unsaved, the save button is replaced with "Confirm & save" and a warning banner appears above the list. | M3 |
| AI-06 | Gemini API key stored in `app.config.js` via `process.env`. Never committed. Required env var: `FF_GEMINI_KEY`. Document setup in README. On 429 rate-limit error, show a "try again in a moment" state with a retry button and 30 s countdown. | M3 |

---

### 5.2 Saved meals library

| ID | Requirement | MS |
|----|-------------|-----|
| SV-01 | Any meal entry (any method) can be saved to the library via a "Save as meal" toggle before logging. Stored in `saved_meals` table in expo-sqlite. | M3 |
| SV-02 | Saved tab: list of saved meals with name, total kcal, and ingredient count. | M3 |
| SV-03 | Tapping a saved meal opens a confirm card with a portion multiplier (0.5× / 1× / 1.5× / 2× quick chips + typeable). Nutrients scale proportionally. Add to log. | M3 |
| SV-04 | Saved meals can be renamed or deleted from the Saved tab. | M3 |

---

### 5.3 Goal projection

| ID | Requirement | MS |
|----|-------------|-----|
| GP-01 | Progress screen: goal projection card showing the projected date to reach goal weight based on average daily deficit. | M3 |
| GP-02 | Formula: `avg deficit × days / 7700 = kg lost`. Projected date = today + (remaining kg / weekly loss rate). | M3 |
| GP-03 | If avg deficit is near zero or positive, show "Goal pace has slowed — review your intake?" instead of a date. | M3 |

---

### 5.4 Animations & polish

| ID | Requirement | MS |
|----|-------------|-----|
| AN-01 | Calorie ring sweeps in on mount via react-native-reanimated (included in SDK 54). Duration: 600 ms ease-out. | M3 |
| AN-02 | Macro bars and chart bars animate width on data change: 400 ms. | M3 |
| AN-03 | Bottom sheets slide up: 220 ms cubic-bezier(0.2, 0.8, 0.2, 1). All tappable elements scale to 0.98 on press. | M3 |
| AN-04 | Tab / pill toggle transitions: 150 ms colour + background. | M3 |

---

## 6. Technical specification

### 6.1 Stack — 100% free

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Expo SDK 54 / RN 0.81 | Expo Go compatible. No custom native modules. No build step needed in development. |
| Language | TypeScript | Strict mode throughout. |
| Navigation | Expo Router v3 | File-based routing. Bottom tab layout + modal route for Meal Entry. |
| Local DB | expo-sqlite | Built into SDK 54. Free. Tables: meal_entries, barcode_cache, saved_meals. |
| Key-value store | expo-sqlite/kv-store | Built on SQLite. Used for profile JSON blob at key `ff:profile`. |
| Camera | expo-camera (CameraView) | Built into SDK 54. Free. Handles photo capture and barcode scanning. |
| Barcode | expo-camera barcodeScannerSettings | Built-in to expo-camera. No separate ML Kit dependency needed in Expo Go. |
| Food database | Open Food Facts REST API | Free. No API key. Barcode: `/api/v0/product/{barcode}.json`. Search: `/cgi/search.pl`. |
| Photo AI | Gemini 2.5 Flash (Google AI Studio) | Free tier. No credit card. API key from aistudio.google.com. Multimodal image + text. |
| State | Zustand | Lightweight free state manager for session state (tab, modal open, editing). |
| HTTP | Native fetch | Built-in to React Native. No extra library needed. |
| Charts | react-native-svg | Free. Weight line chart and intake bar chart. |
| Animation | react-native-reanimated v3 | Bundled with Expo SDK 54. Free. |
| Fonts | Geist, Geist Mono, Instrument Serif | Loaded via expo-font (SDK 54). Free via Google Fonts. |

---

### 6.2 Data model

**`ff:profile` (kv-store JSON blob)**
```
units · sex · age · heightCm · weightKg · goalType · goalWeightKg
ratePerWeek · activityFactor · kcalTarget · macroP · macroC · macroF
fiberTargetG · weightLog [{date, kg}]
```

**`meal_entries` (SQLite table)**
```sql
id TEXT PRIMARY KEY
date TEXT
timestampMs INTEGER
slot TEXT
method TEXT
mealName TEXT
ingredientsJson TEXT
totalKcal REAL
totalProteinG REAL
totalCarbsG REAL
totalFatG REAL
totalFiberG REAL
```

**`barcode_cache` (SQLite table)**
```sql
barcode TEXT PRIMARY KEY
productJson TEXT
cachedAt INTEGER
```

**`saved_meals` (SQLite table — M3)**
```sql
id TEXT PRIMARY KEY
name TEXT
ingredientsJson TEXT
totalKcal REAL
totalProteinG REAL
totalCarbsG REAL
totalFatG REAL
createdAt INTEGER
```

---

### 6.3 Gemini API call

- **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=FF_GEMINI_KEY`
- **Image:** resize JPEG to max 1024px long edge, base64-encode, send as `inlineData` with `mimeType: image/jpeg`
- **System prompt:**
  ```
  You are a food recognition assistant. Analyse the meal in this image and
  return ONLY a valid JSON array, no other text. Each item:
  {name: string, grams: number, kcal: number, protein_g: number,
  carbs_g: number, fat_g: number, fiber_g: number, confidence: number 0–1}
  ```
- **Low confidence:** items with `confidence < 0.6` trigger the UNKNOWN flow (see AI-04)
- **Rate limit:** on 429 response, surface a retry button with a 30 s countdown. Do not retry automatically.

---

### 6.4 Design tokens

| Token | Hex | Role |
|-------|-----|------|
| `forest` | `#464e47` | Primary ink, nav background, ring foreground, protein bar |
| `forest2` | `#2f352f` | Bottom nav bg, modal status bar |
| `sage` | `#e8ede8` | App background (most screens) |
| `paper` | `#f4f6f3` | Card surface, onboarding background |
| `ember` | `#ff4a1c` | Primary CTA FAB, over-target ring, fat bar, destructive |
| `amber` | `#f6ae2d` | Goal indicator, warnings, carbs bar, chart target line |
| `ice` | `#b5f8fe` | Active nav tint, scanner overlay, data highlights |
| `muted` | `#7a847a` | Secondary text, axis labels, fiber bar |

**Macro colours:** Protein → forest · Carbs → amber · Fat → ember · Fiber → muted

---

### 6.5 Typography

| Use | Family | Size | Weight | Notes |
|-----|--------|------|--------|-------|
| Display / screen title | Geist | 26–32 | 500 | Letter-spacing −0.4 to −0.6 |
| Section title | Geist | 18–20 | 500 | Letter-spacing −0.2 |
| Body | Geist | 14–15 | 400 | |
| Meta / muted | Geist | 12–13 | 400 | Letter-spacing +0.2 |
| Section label | Geist | 11 | 600 | Uppercase, letter-spacing 1.4 |
| Ring centre (large) | Geist Mono | 44 | 500 | tabular-nums — all changing digits |
| Counts / stats | Geist Mono | 16–22 | 500 | tabular-nums throughout |
| Display accent | Instrument Serif | 26+ | 400 italic | Sparingly — one italic word per heading max |

---

### 6.6 Project structure

```
app/
  (tabs)/
    index.tsx          # Dashboard
    progress.tsx       # Progress
    saved.tsx          # Saved meals (M3)
    profile.tsx        # Profile
  onboarding/
    step-1.tsx … step-8.tsx
  meal-entry.tsx       # Full-screen modal
components/
  CalorieRing.tsx
  MacroBar.tsx
  Btn.tsx
  Card.tsx
  BottomSheet.tsx
  NumberScrubber.tsx
  Pills.tsx
  Icon.tsx
lib/
  db.ts               # expo-sqlite setup, table creation, CRUD helpers
  profile.ts          # kv-store read / write helpers
  nutrition.ts        # BMR / TDEE / macro / deficit calculations
  openfoodfacts.ts    # barcode lookup and text search
  gemini.ts           # photo analysis fetch helper (M3)
store/
  index.ts            # Zustand stores (session state: tab, modal, editing)
constants/
  tokens.ts           # colour and typography tokens
.env                  # FF_GEMINI_KEY=... (never commit)
```

---

### 6.7 Permissions

- `CAMERA` — requested at runtime on first barcode or photo tap (M2+). If denied, show in-app Settings prompt.
- `INTERNET` — declared in `app.json`. Used for Open Food Facts and Gemini API calls.

---

### 6.8 Out of scope for v1

- Cloud sync or user accounts
- Dark theme (light only)
- Notifications or meal reminders
- Exercise / activity logging
- Tablet or landscape layout
- Internationalisation (English only)

---

## 7. Open questions

| # | Question | Default if not resolved |
|---|----------|------------------------|
| 1 | Gemini free tier rate limits are project-specific and subject to change. If limits are hit during M3 testing, the fallback is a 30-second countdown retry UI (see AI-06). Confirm this is acceptable or whether a secondary manual-entry fallback is also needed. | Retry UI only |
| 2 | Open Food Facts data quality varies by region. If a meaningful number of scanned products lack nutrient data, consider supplementing with USDA FoodData Central API (free, US-focused, no key required). Confirm primary user region. | Open Food Facts only for v1 |
| 3 | Progress screen range: 7 d / 30 d only, no custom range. Confirm this is final. | Confirmed — 7 d / 30 d only |

---

*finder food spec v1.1 — May 2026 — React Native · Expo SDK 54 · 100% free stack*
