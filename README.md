# finder food

A personal food & macro tracking app built with React Native (Expo). Log meals four different ways, track your daily macros, and see your progress over time.

---

## Features

**Four ways to log a meal**

| Method | How it works |
|---|---|
| **Photo** | Take a photo of your meal — Gemini AI identifies each ingredient and estimates macros |
| **Describe** | Type what you ate in plain language — AI parses it into structured ingredients with macros |
| **Barcode** | Scan a packaged product — looks up nutrition via Open Food Facts |
| **Manual** | Search for ingredients by name — includes 40+ common whole foods (eggs, chicken, rice, etc.) plus the Open Food Facts database |

**Dashboard**
- Daily macro rings (kcal, protein, carbs, fat)
- Meals grouped by slot (Breakfast / Lunch / Dinner / Snack)
- Tap any meal to see ingredient breakdown

**Progress**
- 7-day and 30-day macro history charts
- Weekly averages

**Saved meals**
- Save any logged meal to a library
- Log it again later at any portion size (0.5× / 1× / 1.5× / 2× or custom)

**Onboarding**
- Sets your daily calorie and macro targets based on your profile (age, weight, height, goal, activity level)

---

## Tech stack

- [Expo](https://expo.dev) SDK 54 / React Native 0.81
- [Expo Router](https://expo.github.io/router) — file-based navigation
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) — local database (meals, barcode cache, saved meals, profile)
- [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) — barcode scanning and photo capture
- [Zustand](https://github.com/pmndrs/zustand) — global state
- [Open Food Facts API](https://world.openfoodfacts.org) — packaged product nutrition data
- [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) — photo and text meal analysis
- React Native SVG, Gesture Handler, Safe Area Context, Screens

---

## Setup

### Prerequisites
- Node.js 18+
- [Expo CLI](https://docs.expo.dev/more/expo-cli/)
- An [EAS account](https://expo.dev) (for building the APK)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)

### Local development (Expo Go)

```bash
git clone https://github.com/your-username/finder-food.git
cd finder-food
npm install
```

Create a `.env` file:
```
FF_GEMINI_KEY=your_gemini_api_key_here
```

Start the dev server:
```bash
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your Android phone.

### Build a standalone APK

```bash
npm install -g eas-cli
eas login
eas env:create preview --name FF_GEMINI_KEY --value your_key --type string --visibility secret
eas build --platform android --profile preview
```

Sideload the resulting `.apk` onto your Android phone.

> **Note:** The `.env` file is for local development only. For APK builds, set the Gemini key as an EAS secret (as shown above) so it gets baked into the build.

---

## Project structure

```
app/
  (tabs)/         # Main tab screens (dashboard, progress, saved meals, profile)
  onboarding/     # 8-step setup flow
  meal-entry.tsx  # Meal logging modal (all 4 methods)
lib/
  db.ts           # SQLite helpers
  gemini.ts       # Gemini API (photo + text analysis)
  openfoodfacts.ts# Open Food Facts search + barcode lookup
  localfoods.ts   # Built-in whole foods database (~40 items)
  nutrition.ts    # Macro calculation utilities
  profile.ts      # User profile read/write
  savedMeals.ts   # Saved meal CRUD
components/       # Shared UI components
constants/        # Design tokens (colors, typography, spacing)
assets/           # Icons, fonts, images
```

---

## Data & privacy

- All meal data is stored locally on-device using SQLite — nothing is sent to any server.
- The Gemini API is called when using the Photo or Describe logging methods. Images and text descriptions are sent to Google's API. See [Google's privacy policy](https://policies.google.com/privacy).
- Open Food Facts is queried for barcode lookups and text searches. No personal data is sent.
