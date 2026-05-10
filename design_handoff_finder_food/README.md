# Handoff: finder food — calorie & macro tracker (Android)

## Overview
**finder food** is a high-fidelity Android prototype for a calorie- and macro-tracking app. It covers the full first-run experience (onboarding) and the four core day-to-day surfaces: **Daily Dashboard**, **Meal Entry** (4 input methods), **Progress**, and **Profile**. The design's defining moves are a calm forest-and-sage palette with a single fiery accent (Ember `#ff4a1c`) reserved for the primary log action and over-target alerts; restrained typography mixing **Geist** (UI), **Geist Mono** (numerics), and **Instrument Serif italic** (display accents); and a circular calorie ring as the screen's emotional anchor.

The prototype lives inside an Android device frame at **412 × 892** logical px and uses the React UMD + Babel-standalone "JSX in the browser" setup — purely as a design medium.

## About the design files
The files in `source/` are **design references created in HTML** — interactive prototypes that demonstrate intended look, feel, and behavior. **They are not production code to copy directly.**

The implementation task is to **recreate these designs in the target codebase's existing environment** (Android native / Jetpack Compose, React Native, Flutter, etc.) using its established components, navigation, theming, and state-management patterns. If no environment exists yet, choose the most appropriate framework for an Android-first product and implement there.

Use this README as the source of truth for spec; use the JSX files to disambiguate any visual or interaction question.

## Fidelity
**High-fidelity (hifi).** All colors, type, spacing, radii, animation timings, and icon strokes in the prototype are intentional. Numeric values shown in the prototype (e.g. macro splits, sample meals) are mock data — replace with real data sources — but the **visual treatment** of those numbers (mono digits, color, weight, alignment) is final.

---

## Information architecture

```
First launch
└─ Onboarding (8 steps, gated — must complete to enter app)
   └─ Calculates initial kcal target via Mifflin-St Jeor + activity factor

Main app (bottom nav, 4 tabs + center FAB)
├─ Home  (Dashboard)
├─ Progress
├─ [+]   ← center FAB → Meal Entry modal
├─ Saved (library of saved meals)
└─ Profile

Meal Entry (full-screen modal over any tab)
├─ Method picker
├─ Photo flow      (AI-detected ingredients, low-confidence handling)
├─ Barcode flow    (scanner → product card)
├─ Manual flow     (multi-ingredient builder)
└─ Saved flow      (re-log with portion multiplier)

Bottom sheets (over Profile / Dashboard)
├─ Meal edit sheet     (tap any logged meal)
├─ Profile target sheet
├─ Profile macros sheet
├─ Profile goal sheet
└─ Profile settings sheet
```

---

## Design tokens

### Colors
| Token | Hex | Role |
|---|---|---|
| `forest` | `#464e47` | Primary ink, secondary buttons, ring foreground |
| `forest2` | `#2f352f` | Bottom nav background, deep forest surfaces |
| `sage` | `#e8ede8` | App background (most screens) |
| `paper` | `#f4f6f3` | Card/surface alt background |
| `ink` | `#1a1f1a` | True-black text only when needed (status bar glyphs) |
| `muted` | `#7a847a` | Secondary text, axis labels, placeholders |
| `line` | `rgba(70,78,71,0.14)` | Hairline borders, divider lines |
| `ember` | `#ff4a1c` | **Reserved.** Primary action FAB, over-target ring, destructive |
| `amber` | `#f6ae2d` | Goal indicator dot on ring, warnings, fat macro |
| `ice` | `#b5f8fe` | Active bottom-nav tint, data highlights, "ice" buttons |

**Macro-specific colors:**
- Protein: `#464e47` (forest)
- Carbs:   `#f6ae2d` (amber)
- Fat:     `#ff4a1c` (ember at 70% opacity for bars; full for callouts)
- Fiber:   `#7a847a` (muted) or sage variant

### Typography
- **Body / UI**: `Geist`, weights 300/400/500/600/700
- **Numerics**: `Geist Mono`, weights 400/500/600 (ALWAYS for kcal, grams, weights, dates, %, durations — anywhere digits change frequently or align in columns). CSS: `font-family: 'Geist Mono'; font-feature-settings: 'tnum' 1;`
- **Display accent**: `Instrument Serif`, italic 400 only — used **sparingly** on a single italic word per heading (e.g. "Good morning, *Lily*", "Saved *meals*", "What's your *goal*?"). Never for body, never two italic words back-to-back.

**Type scale (used in prototype):**
| Use | Family | Size | Weight | Letter-spacing |
|---|---|---|---|---|
| Display H1 | Geist | 32 | 500 | -0.6 |
| Screen title (H1) | Geist | 26 | 500 | -0.4 |
| Section title (H2) | Geist | 18–20 | 500 | -0.2 |
| Body | Geist | 14–15 | 400 | 0 |
| Meta / muted | Geist | 12–13 | 400 | 0.2 |
| Section label (small caps) | Geist | 11 | 600 | 1.4, uppercase |
| Mono large (ring center) | Geist Mono | 44 | 500 | 0 |
| Mono medium (counts) | Geist Mono | 16–22 | 500 | 0 |
| Mono small (units) | Geist Mono | 11–13 | 400 | 0 |

### Spacing
- Base grid: **4px**. Common steps 4 / 8 / 12 / 16 / 18 / 22 / 28 / 36.
- Screen gutter: **22px** left/right on most screens (some use 18 or 24).
- Card internal padding: **18px** default (`Card pad={18}`); reduce to 14 for dense lists, 22 for hero cards.
- Vertical rhythm between cards/sections: **14–18px**.

### Radii
- Buttons / pills / chips: **999px** (fully round)
- Cards: **20px**
- Bottom sheets: **28px** top corners only
- Phone frame: **44px** outer, **8px** bezel
- Small inputs / toggles: **12–14px**
- Bars (macro, progress): **6px** track height, fully rounded

### Shadows
- Cards: none (use 1px hairline `--line` instead)
- Bottom sheets: `0 -10px 40px rgba(0,0,0,0.18)` cast upward
- FAB (center +): `0 8px 22px -4px rgba(255,74,28,0.55)` with a `4px solid #2f352f` ring
- Phone frame (preview only): `0 30px 70px rgba(0,0,0,0.28), 0 4px 14px rgba(0,0,0,0.18)`

### Iconography
- **Stroke icons only**, drawn as SVG paths in `ui.jsx` (`<Icon name="...">`).
- 24×24 viewBox, **strokeWidth: 1.6** (inactive) / **1.9** (active in nav), `linecap: round`, `linejoin: round`, `fill: none`.
- Set: home, plus, chart, user, arrow-r/l, check, x, camera, barcode, search, bookmark, clock, edit, trash, warn, spark, flame, scale, minus, chev-d/r, dot, leaf, calendar, target, settings, bolt, plus-s.
- **No emoji**. **No filled icons.** **No decorative SVG illustrations.**

### Animation
- Press scale: `transform: scale(0.98)` on `mousedown`, reset on `mouseup`/`mouseleave`
- Bar/progress fill: `transition: width .4s`
- Ring sweep on initial mount: 600ms ease-out
- Bottom sheet enter: 220ms cubic-bezier(0.2, 0.8, 0.2, 1) translateY
- Tab/pill toggle: 150ms color + background

---

## Shared components (see `source/ui.jsx`)

| Component | Purpose | Key props |
|---|---|---|
| `<Icon name size color sw>` | Single source of truth for all iconography | `name` (string), `sw` (stroke width override) |
| `<FFStatusBar bg>` | Custom status bar tinted to match screen background | `bg` |
| `<FFNavPill bg>` | Android gesture nav pill | `bg` |
| `<CalorieRing consumed target size stroke>` | Hero ring on dashboard. Turns ember when over target. Amber dot at goal mark. | numeric |
| `<MacroBar label value target color unit>` | Single horizontal macro bar w/ mono-digit `value/target` readout | |
| `<Btn kind icon full disabled>` | Buttons. Variants: `primary` (ember), `forest`, `ghost` (line border), `ice` (mint), `text` | 52px height, 999 radius |
| `<Card pad bg>` | Default surface: white, 20 radius, 1px hairline border, no shadow | |
| `<Pills items value onChange full>` | Segmented control. Selected pill = forest fill + white text | |
| `<BottomNav tab setTab onAdd>` | Forest-2 bar with 4 tabs + center 60px ember FAB punching above the bar | |
| `<SectionLabel right>` | Small uppercase 11px/600 muted label with optional right-aligned action | |

---

## Screens

### 1. Onboarding (`screens/onboarding.jsx`)
Gated 8-step flow. Background **paper** with sage status bar. Single column, 22px gutters. Top-left back chevron + step counter ("3/8") in mono; bottom-pinned Continue button (ember `<Btn kind="primary" full>`). Disabled if step is incomplete.

**Steps:**
1. **Units** — Pills: `metric (kg / cm)` vs `imperial (lb / ft)`
2. **Sex** — 2-up tappable cards (`female` / `male`), large title above
3. **Age** — Big-number scrubber (44pt mono, ± buttons, **typeable on tap** — Enter commits, Esc cancels)
4. **Height** — Same scrubber pattern; unit (cm / ft+in) follows step 1 choice
5. **Current weight** — Same scrubber
6. **Goal** — 3-up cards: `lose`, `maintain`, `gain`. Below: goal-weight number scrubber + rate slider (kg/week, 0.25–1.0, snaps at 0.25/0.5/0.75/1.0). Maintain hides the weight + rate.
7. **Activity** — 5 vertical cards: sedentary / light / moderate / active / very active. Each shows a multiplier (mono) on the right.
8. **Summary** — Computed kcal target as a giant mono number; below it three editable macro sliders (P/C/F %) that **rebalance proportionally** so the total stays at 100%. Confirm button writes profile to `localStorage` and enters the app.

**Math:**
- BMR: Mifflin-St Jeor — `10*kg + 6.25*cm − 5*age + (sex==='male' ? 5 : -161)`
- TDEE: BMR × activity factor (1.2 / 1.375 / 1.55 / 1.725 / 1.9)
- Target: TDEE − 500/day for `lose 0.5kg/wk`, etc. (7700 kcal per kg of body fat is the conversion used)
- Default macros: 30 P / 40 C / 30 F (% of kcal). Protein g = (kcal × P%) / 4, Carbs g = / 4, Fat g = / 9.

### 2. Dashboard (`screens/dashboard.jsx`)
Sage background. Scroll container with bottom padding for nav.

**Layout, top to bottom:**
1. **Greeting block** (22px gutter, 22px top): small uppercase date label + "Good morning, *Lily*" (Instrument Serif italic on name, 26pt). Avatar circle 40×40 forest fill, white "L" centered, 600 weight — top-right.
2. **Hero card (CalorieRing + macros)** — White card, 20 radius, 22 padding. Ring 196px centered. Ring center reads "REMAINING" (label) / "1,420" (44pt mono) / "580 of 2,000 kcal" (12pt muted, mono digits). Below the ring, a 4-bar grid of `<MacroBar>`: Protein, Carbs, Fat, Fiber.
3. **"Today" section** — `<SectionLabel>TODAY` with small mono date (e.g. `MAR 14`) on the right. Meals grouped by slot in this order: **Breakfast, Lunch, Dinner, Snack**. Each slot shows a row title (slot name + slot total kcal in mono on right), then meal rows. Empty slots show a 14px ghost button "+ add breakfast" that opens entry pre-filtered to that slot.
4. **Meal row**: 56px tall, white card, no border between rows of the same slot (only top/bottom radii on first/last). Left: meal name (15pt 500), serving (12pt muted). Right: kcal (mono 15pt 500) above 3 macro chips (P/C/F in mono 11pt). Tapping opens the **meal edit sheet**.
5. **Quick add row** at bottom: ghost-style button "+ Quick add custom" — opens manual entry.

**Meal edit sheet (bottom sheet):**
- Mini meal summary at top.
- Buttons: `Edit serving`, `Move to…` (slot picker), `Delete` (text-color ember).
- Drag handle at top, dismiss on backdrop tap.

### 3. Meal Entry (`screens/meal-entry.jsx`)
Full-screen modal with its own status bar + own gesture pill. Forest-2 close (`x`) icon top-left, "Log meal" title, mono slot label top-right (tappable to change slot).

**Method picker (initial state):** 4 large cards in a 2×2 grid:
- 📷 **Photo** — "Snap a meal · AI detects ingredients"
- |||| **Barcode** — "Scan packaged food"
- ✎ **Manual** — "Type ingredients & grams"
- ★ **Saved** — "From your library"

(Use stroke icons not emoji — emoji shown above for clarity only.)

#### 3a. Photo flow
1. **Capture state**: full-bleed dark camera preview placeholder, ember shutter button at bottom, "Tap to retake" affordance.
2. **Analysis**: skeleton shimmer of an ingredient list for ~1.2s.
3. **Result card**: header "We found 4 items" + a low-confidence warning banner if any item has confidence < 0.6:
   > ⚠ One item was hard to recognize — tap **UNKNOWN** to name it.
4. **Ingredient list**: each row has a per-item gram slider (range 0–500 in 5g steps), name, kcal contribution (mono). High-confidence rows are forest. Low-confidence rows: amber background tint, name replaced with "**UNKNOWN**" in caps as an editable input with placeholder "name this ingredient…". Typing a name triggers a per-100g lookup (use the dictionary table embedded in `meal-entry.jsx` as a starting reference) and recomputes kcal; the row turns from amber to confirmed. Running total at bottom updates live.
5. Bottom: ember `Add to log` button.

#### 3b. Barcode flow
1. **Scanner**: dark camera background, animated horizontal scanline (1.4s loop top → bottom), corner brackets in ice. Mono "0123456789012" appears on scan success.
2. **Product card**: brand + product name, serving size dropdown (e.g. "1 bottle (330ml)" / "100g" / "custom grams"). Per-serving kcal/macros displayed; **portion multiplier scrubber** (typeable, 0.25 step). Add to log.

#### 3c. Manual flow
- Live ingredient builder. Top: meal name input ("e.g. Sunday chili"). Below: search field with magnifier; **history shown ABOVE the database** when search is empty (recently logged ingredients in muted small caps "RECENT", then "DATABASE" section).
- Tapping an item adds it to a list with a default 100g; each line has an inline gram input (typeable) and shows live kcal. Total kcal & macros appear in a sticky footer above the Add button.
- **"Save as meal" toggle** at the bottom of the list — when on, this composite meal is added to the Saved library on log.

#### 3d. Saved flow
- List of saved composite meals (name, total kcal, ingredient count). Tap to open a confirm card with a **portion multiplier** scrubber (0.5 / 1× / 1.5× / 2× quick chips + typeable). Add to log.

### 4. Progress (`screens/progress.jsx`)
Sage background. Two stacked panels.

1. **Range pills** at top: `7 days` / `30 days` (segmented `<Pills>` — no calendar / custom range).
2. **Weight chart card**: line chart (forest stroke, 2px, no fill), data points as 4px circles, x-axis dates in mono, y-axis hidden (use min/max pinned at top-right of card). Manual "Log weight" entry chip top-right opens a number-scrubber sheet.
3. **Intake bar chart card**: vertical bars one per day in range, forest color, 6px width, 2px gap. Y-axis: target line (dashed amber, 1.5px) at user's kcal target. Bars over target turn ember.
4. **Averages strip**: 3-up mono numbers — avg kcal, avg protein g, avg deficit kcal/day.
5. **Goal projection card**: "On track to hit **65 kg** by **April 28** at this pace" — italic *bold* on date and weight (Instrument Serif italic). If trend reverses, copy turns muted with a different sentence ("Goal pace has slowed — review your intake?"). Calculation: avg deficit × days remaining ÷ 7700 kcal/kg.

### 5. Profile (in `app.jsx`)
- Top: avatar circle (40×40, forest, white "L", 22pt 600) + name "Lily" + meta line (`{age} · {heightCm}cm · {weightKg}kg`) in muted 12pt.
- 4 settings rows, each a tappable list item with chevron-right, that open a bottom sheet:
  1. **Daily target** → number scrubber (kcal, typeable)
  2. **Macros** → 3 balanced sliders (P/C/F %) — adjusting one rebalances the others proportionally
  3. **Goal weight** → number scrubber (kg or lb)
  4. **Settings** → segmented controls for `Units` (metric / imperial), `Theme` (auto / light / dark — placeholder)
- Bottom destructive link: `Re-run onboarding` — clears `ff:profile` from `localStorage` and returns to step 1.

**Profile bottom sheet** is rendered at the **App level** (not inside the scrolling tab content), capped at 78% phone height with internal scroll. Slides up from above the bottom nav with a backdrop scrim.

---

## State management

**Stored (localStorage):**
- `ff:profile` — the full computed profile object: `{ units, sex, age, heightCm, weightKg, goal: {type, targetKg, ratePerWeek}, activity, kcalTarget, macros: {p, c, f}, weightLog: [{date, kg}] }`

**In-memory only (per session in prototype):**
- `tab` — current bottom-nav tab
- `log` — today's logged meals (array)
- `entryOpen` / `entrySlot` — meal entry modal state
- `editing` — currently-editing meal id
- `profileSheet` — which profile sheet is open

In production, `log` and `weightLog` should obviously persist (per-day records, not session-scoped).

---

## Interactions & behavior

- **All number controls are typeable**: tapping the digit puts it into edit mode (input grows, font auto-shrinks for long values). Enter / blur commits, Esc cancels. Apply this pattern wherever a `<NumberScrubber>`-style control appears (onboarding, weight log, barcode portion, profile sheets).
- **Press feedback**: every actionable element gets the `scale(0.98)` press treatment. Don't ship without it.
- **Empty meal slots** show a sub-row "+ add breakfast" — tapping pre-fills the slot in the entry modal.
- **Over-target**: ring turns ember; remaining number turns ember and prefixes with `−` (minus). Macro bars cap visually at 100% but show the true `value/target` count.
- **Entry modal slides up** from below the bottom nav (220ms). Modal owns its own status bar + gesture pill (forest-2 background) — they replace the app's chrome while open.

---

## Files in this bundle (`source/`)

| File | What's in it |
|---|---|
| `index.html` | Entry point — fonts, CSS variables, script tags. Replaced by your framework's index/root. |
| `ui.jsx` | All shared primitives: tokens (`FF`), `<Icon>`, `<FFStatusBar>`, `<FFNavPill>`, `<CalorieRing>`, `<MacroBar>`, `<Btn>`, `<Card>`, `<Pills>`, `<BottomNav>`, `<SectionLabel>`. Start here. |
| `android-frame.jsx` | Phone bezel & viewport scaler. Discard in production. |
| `app.jsx` | Top-level shell: profile gating, tab routing, entry modal mounting, profile sheets, sample data. |
| `screens/onboarding.jsx` | Full 8-step flow + Mifflin-St Jeor math. |
| `screens/dashboard.jsx` | Greeting, hero ring, macro bars, meal-by-slot list, quick add. |
| `screens/meal-entry.jsx` | Method picker + photo / barcode / manual / saved sub-flows. Includes the per-100g calorie lookup table for the photo "UNKNOWN" rename interaction. |
| `screens/progress.jsx` | Range toggle, weight chart, intake bars, averages, goal projection. |

## Assets
- **Fonts**: Geist, Geist Mono, Instrument Serif — all from Google Fonts. Use the equivalents (system or bundled) in your platform.
- **Icons**: stroke SVG paths in `ui.jsx` `<Icon>`. Lift these directly, or substitute with a stroke-style icon set (Lucide is the closest match in size, weight, and corner treatment) tuned to **stroke 1.6 / round caps**.
- **No raster art, no logo file, no illustrations** — the design is intentionally typographic.

## Open questions / decisions for the implementer

- **Real food database**: prototype uses a tiny embedded lookup table. Wire to Open Food Facts, USDA FDC, or your in-house DB.
- **Barcode scanning**: prototype animates a fake scanline. Use ML Kit (Android) / Vision (iOS) / `expo-barcode-scanner` (RN).
- **Photo AI**: prototype mocks results after a delay. Wire to your vision model; the **low-confidence UNKNOWN-with-rename** pattern is the design contract you must preserve.
- **Theme**: only light theme is designed. If dark is required, ask first — a dark theme isn't a mechanical inversion of these tokens.
- **i18n**: copy is English-only. The Instrument Serif italic accent pattern needs review for non-Latin scripts.
