/**
 * Plant diversity tracking.
 *
 * Counts how many DISTINCT plant foods have been eaten over a rolling window,
 * against a target of 30 per week (the gut-microbiome figure from the American
 * Gut project).
 *
 * Design decisions, all deliberate:
 *
 * 1. COUNTED: vegetables, fruit, legumes, nuts, seeds, wholegrains.
 *    EXCLUDED: herbs, spices, coffee, tea, cocoa. Per explicit user decision.
 *    Potatoes DO count.
 *
 * 2. SPECIES-LEVEL COLLAPSE for staples. Bread, pasta, couscous, bulgur and
 *    baguette are all wheat, so they count once. White, brown, red, black and
 *    sushi rice are all rice. Without this the count inflates dramatically —
 *    real logged data contains 15+ distinct wheat products.
 *
 * 3. CULINARY-LEVEL SPLIT for brassicas. Broccoli, cauliflower, kale, cabbage
 *    and Brussels sprouts are botanically one species (Brassica oleracea) but
 *    are counted separately, because the point of the 30-plants target is
 *    phytochemical variety and popular implementations count them apart.
 *
 * 4. CONSERVATIVE BIAS. An undercount is much better than an inflated one, so
 *    matching demands a whole word or a compound-word suffix, never a loose
 *    substring. See matchPlants for why.
 *
 * KNOWN LIMITATION: ingredient names come from Gemini at dish level, so the
 * onion, garlic and tomato inside "Chicken Curry" are invisible here. Counts
 * derived from history read LOW. Multi-plant names like "Leek and Potato Soup"
 * are recovered, but a plain "Chicken Curry" is not.
 */

export type PlantCategory = 'vegetable' | 'fruit' | 'legume' | 'nut_seed' | 'grain';

export type PlantDef = {
  id: string;
  label: string;
  category: PlantCategory;
  /** Match terms, English and Dutch. Order irrelevant — matching sorts by length. */
  aliases: string[];
};

export const PLANTS: PlantDef[] = [
  // ---------------------------------------------------------------- vegetables
  { id: 'potato', label: 'Potato', category: 'vegetable', aliases: ['potato', 'potatoes', 'aardappel', 'aardappelen', 'krieltjes', 'fries', 'french fries', 'frieten', 'mashed potato', 'mashed potatoes'] },
  { id: 'sweet_potato', label: 'Sweet potato', category: 'vegetable', aliases: ['sweet potato', 'sweet potatoes', 'zoete aardappel', 'bataat'] },
  { id: 'carrot', label: 'Carrot', category: 'vegetable', aliases: ['carrot', 'carrots', 'wortel', 'wortels', 'worteltjes', 'peen'] },
  { id: 'onion', label: 'Onion', category: 'vegetable', aliases: ['onion', 'onions', 'ui', 'uien', 'red onion', 'rode ui', 'spring onion', 'lente ui'] },
  { id: 'shallot', label: 'Shallot', category: 'vegetable', aliases: ['shallot', 'shallots', 'sjalot', 'sjalotten'] },
  { id: 'garlic', label: 'Garlic', category: 'vegetable', aliases: ['garlic', 'knoflook'] },
  { id: 'leek', label: 'Leek', category: 'vegetable', aliases: ['leek', 'leeks', 'prei'] },
  // Varietal names are listed explicitly so longest-first matching consumes both
  // words. Without 'cherry tomato' here, "Cherry Tomatoes" also scores cherry,
  // and "Grape Tomatoes" would score grape.
  { id: 'tomato', label: 'Tomato', category: 'vegetable', aliases: ['tomato', 'tomatoes', 'tomaat', 'tomaten', 'passata', 'tomato sauce', 'tomatensaus', 'tomatenpuree', 'sun dried tomato', 'sun dried tomatoes', 'cherry tomato', 'cherry tomatoes', 'cherrytomaat', 'cherrytomaatjes', 'plum tomato', 'plum tomatoes', 'grape tomato', 'grape tomatoes',
    // Composite dishes are credited ONLY with their single defining ingredient.
    // A shakshuka is definitionally tomato-based; whether it also had peppers or
    // onion is a guess, and guessing inflates the count.
    'shakshuka', 'gazpacho', 'salsa'] },
  { id: 'cucumber', label: 'Cucumber', category: 'vegetable', aliases: ['cucumber', 'cucumbers', 'komkommer', 'pickle', 'pickles', 'augurk', 'augurken'] },
  { id: 'lettuce', label: 'Lettuce', category: 'vegetable', aliases: ['lettuce', 'iceberg', 'romaine', 'little gem', 'kropsalade', 'ijsbergsalade'] },
  { id: 'mixed_greens', label: 'Mixed greens', category: 'vegetable', aliases: ['mixed greens', 'mixed green salad', 'mesclun', 'gemengde salade'] },
  { id: 'bell_pepper', label: 'Bell pepper', category: 'vegetable', aliases: ['bell pepper', 'bell peppers', 'paprika', 'sweet pepper', 'red pepper', 'roasted pepper'] },
  { id: 'chili', label: 'Chilli pepper', category: 'vegetable', aliases: ['chilli pepper', 'chili pepper', 'jalapeno', 'spaanse peper', 'chilipeper'] },
  { id: 'eggplant', label: 'Aubergine', category: 'vegetable', aliases: ['eggplant', 'aubergine', 'babaganoush', 'baba ganoush'] },
  { id: 'zucchini', label: 'Courgette', category: 'vegetable', aliases: ['zucchini', 'courgette'] },
  { id: 'mushroom', label: 'Mushroom', category: 'vegetable', aliases: ['mushroom', 'mushrooms', 'champignon', 'champignons', 'paddenstoel', 'shiitake', 'oyster mushroom', 'oesterzwam'] },
  { id: 'broccoli', label: 'Broccoli', category: 'vegetable', aliases: ['broccoli'] },
  { id: 'cauliflower', label: 'Cauliflower', category: 'vegetable', aliases: ['cauliflower', 'bloemkool'] },
  { id: 'cabbage', label: 'Cabbage', category: 'vegetable', aliases: ['cabbage', 'witte kool', 'rode kool', 'red cabbage', 'spitskool', 'savooiekool', 'sauerkraut', 'zuurkool'] },
  { id: 'kale', label: 'Kale', category: 'vegetable', aliases: ['kale', 'boerenkool'] },
  { id: 'brussels_sprout', label: 'Brussels sprouts', category: 'vegetable', aliases: ['brussels sprout', 'brussels sprouts', 'spruitjes'] },
  { id: 'spinach', label: 'Spinach', category: 'vegetable', aliases: ['spinach', 'spinazie'] },
  { id: 'rocket', label: 'Rocket', category: 'vegetable', aliases: ['rocket', 'arugula', 'rucola'] },
  { id: 'chicory', label: 'Chicory', category: 'vegetable', aliases: ['chicory', 'witloof', 'witlof', 'belgian endive', 'endive'] },
  { id: 'green_bean', label: 'Green beans', category: 'vegetable', aliases: ['green bean', 'green beans', 'sperziebonen', 'haricots verts', 'boontjes'] },
  { id: 'beetroot', label: 'Beetroot', category: 'vegetable', aliases: ['beet', 'beets', 'beetroot', 'biet', 'bietjes', 'rode biet'] },
  { id: 'celery', label: 'Celery', category: 'vegetable', aliases: ['celery', 'selderij', 'bleekselderij'] },
  { id: 'celeriac', label: 'Celeriac', category: 'vegetable', aliases: ['celeriac', 'knolselderij'] },
  { id: 'fennel', label: 'Fennel', category: 'vegetable', aliases: ['fennel', 'venkel'] },
  { id: 'asparagus', label: 'Asparagus', category: 'vegetable', aliases: ['asparagus', 'asperges'] },
  { id: 'pumpkin', label: 'Pumpkin', category: 'vegetable', aliases: ['pumpkin', 'pompoen', 'butternut', 'butternut squash', 'flespompoen'] },
  { id: 'radish', label: 'Radish', category: 'vegetable', aliases: ['radish', 'radijs', 'daikon', 'rettich'] },
  { id: 'parsnip', label: 'Parsnip', category: 'vegetable', aliases: ['parsnip', 'pastinaak'] },
  { id: 'turnip', label: 'Turnip', category: 'vegetable', aliases: ['turnip', 'meiraap', 'koolraap'] },
  { id: 'kohlrabi', label: 'Kohlrabi', category: 'vegetable', aliases: ['kohlrabi', 'koolrabi'] },
  { id: 'artichoke', label: 'Artichoke', category: 'vegetable', aliases: ['artichoke', 'artisjok'] },
  { id: 'pak_choi', label: 'Pak choi', category: 'vegetable', aliases: ['pak choi', 'paksoi', 'bok choy', 'bok choi'] },
  { id: 'chinese_cabbage', label: 'Chinese cabbage', category: 'vegetable', aliases: ['chinese cabbage', 'chinese kool', 'napa cabbage'] },
  { id: 'sweetcorn', label: 'Sweetcorn', category: 'vegetable', aliases: ['sweetcorn', 'sweet corn', 'corn kernel', 'corn kernels', 'mais', 'polenta', 'popcorn'] },
  { id: 'olive', label: 'Olive', category: 'vegetable', aliases: ['olive', 'olives', 'olijf', 'olijven'] },
  { id: 'avocado', label: 'Avocado', category: 'vegetable', aliases: ['avocado', 'guacamole'] },
  { id: 'caper', label: 'Capers', category: 'vegetable', aliases: ['caper', 'capers', 'kappertjes'] },
  { id: 'seaweed', label: 'Seaweed', category: 'vegetable', aliases: ['seaweed', 'nori', 'wakame', 'zeewier'] },
  { id: 'watercress', label: 'Watercress', category: 'vegetable', aliases: ['watercress', 'waterkers'] },
  { id: 'lambs_lettuce', label: "Lamb's lettuce", category: 'vegetable', aliases: ['lambs lettuce', 'veldsalade', 'mache'] },
  { id: 'winter_melon', label: 'Winter melon', category: 'vegetable', aliases: ['winter melon', 'wintermeloen'] },
  { id: 'taro', label: 'Taro', category: 'vegetable', aliases: ['taro'] },
  { id: 'okra', label: 'Okra', category: 'vegetable', aliases: ['okra'] },

  // --------------------------------------------------------------------- fruit
  { id: 'apple', label: 'Apple', category: 'fruit', aliases: ['apple', 'apples', 'appel', 'appels', 'appelmoes', 'apple sauce'] },
  { id: 'pear', label: 'Pear', category: 'fruit', aliases: ['pear', 'pears', 'peer', 'peren'] },
  { id: 'banana', label: 'Banana', category: 'fruit', aliases: ['banana', 'bananas', 'banaan', 'bananen'] },
  { id: 'orange', label: 'Orange', category: 'fruit', aliases: ['orange', 'oranges', 'sinaasappel', 'appelsien', 'orange juice'] },
  { id: 'mandarin', label: 'Mandarin', category: 'fruit', aliases: ['mandarin', 'mandarijn', 'clementine', 'tangerine'] },
  { id: 'lemon', label: 'Lemon', category: 'fruit', aliases: ['lemon', 'citroen', 'lemon juice'] },
  { id: 'lime', label: 'Lime', category: 'fruit', aliases: ['lime', 'limoen'] },
  { id: 'grapefruit', label: 'Grapefruit', category: 'fruit', aliases: ['grapefruit', 'pompelmoes'] },
  { id: 'strawberry', label: 'Strawberry', category: 'fruit', aliases: ['strawberry', 'strawberries', 'aardbei', 'aardbeien'] },
  { id: 'raspberry', label: 'Raspberry', category: 'fruit', aliases: ['raspberry', 'raspberries', 'framboos', 'frambozen'] },
  { id: 'blueberry', label: 'Blueberry', category: 'fruit', aliases: ['blueberry', 'blueberries', 'bosbes', 'bosbessen'] },
  { id: 'blackberry', label: 'Blackberry', category: 'fruit', aliases: ['blackberry', 'blackberries', 'braam', 'bramen'] },
  { id: 'redcurrant', label: 'Redcurrant', category: 'fruit', aliases: ['redcurrant', 'redcurrants', 'aalbes', 'rode bes'] },
  { id: 'cranberry', label: 'Cranberry', category: 'fruit', aliases: ['cranberry', 'cranberries', 'veenbes'] },
  { id: 'cherry', label: 'Cherry', category: 'fruit', aliases: ['cherry', 'cherries', 'kers', 'kersen'] },
  { id: 'grape', label: 'Grape', category: 'fruit', aliases: ['grape', 'grapes', 'druif', 'druiven', 'raisin', 'raisins', 'rozijn', 'rozijnen'] },
  { id: 'peach', label: 'Peach', category: 'fruit', aliases: ['peach', 'peaches', 'perzik', 'perziken'] },
  { id: 'nectarine', label: 'Nectarine', category: 'fruit', aliases: ['nectarine', 'nectarines'] },
  { id: 'apricot', label: 'Apricot', category: 'fruit', aliases: ['apricot', 'apricots', 'abrikoos', 'abrikozen'] },
  { id: 'plum', label: 'Plum', category: 'fruit', aliases: ['plum', 'plums', 'pruim', 'pruimen', 'prune', 'prunes'] },
  { id: 'mango', label: 'Mango', category: 'fruit', aliases: ['mango', 'mangoes'] },
  { id: 'pineapple', label: 'Pineapple', category: 'fruit', aliases: ['pineapple', 'ananas'] },
  { id: 'kiwi', label: 'Kiwi', category: 'fruit', aliases: ['kiwi'] },
  { id: 'melon', label: 'Melon', category: 'fruit', aliases: ['melon', 'meloen', 'galia', 'cantaloupe'] },
  { id: 'watermelon', label: 'Watermelon', category: 'fruit', aliases: ['watermelon', 'watermeloen'] },
  { id: 'papaya', label: 'Papaya', category: 'fruit', aliases: ['papaya', 'papaja'] },
  { id: 'pomegranate', label: 'Pomegranate', category: 'fruit', aliases: ['pomegranate', 'granaatappel'] },
  { id: 'fig', label: 'Fig', category: 'fruit', aliases: ['fig', 'figs', 'vijg', 'vijgen'] },
  { id: 'date', label: 'Date', category: 'fruit', aliases: ['date', 'dates', 'dadel', 'dadels', 'medjool'] },
  { id: 'passion_fruit', label: 'Passion fruit', category: 'fruit', aliases: ['passion fruit', 'passievrucht', 'maracuja'] },
  { id: 'rhubarb', label: 'Rhubarb', category: 'fruit', aliases: ['rhubarb', 'rabarber'] },
  { id: 'coconut', label: 'Coconut', category: 'fruit', aliases: ['coconut', 'kokos', 'coconut milk', 'kokosmelk'] },

  // ------------------------------------------------------------------ legumes
  { id: 'chickpea', label: 'Chickpea', category: 'legume', aliases: ['chickpea', 'chickpeas', 'kikkererwt', 'kikkererwten', 'hummus', 'houmous', 'falafel'] },
  { id: 'lentil', label: 'Lentil', category: 'legume', aliases: ['lentil', 'lentils', 'linze', 'linzen', 'dal', 'daal'] },
  { id: 'kidney_bean', label: 'Kidney bean', category: 'legume', aliases: ['kidney bean', 'kidney beans', 'kidneybonen', 'rode bonen'] },
  { id: 'black_bean', label: 'Black bean', category: 'legume', aliases: ['black bean', 'black beans', 'zwarte bonen'] },
  { id: 'white_bean', label: 'White bean', category: 'legume', aliases: ['white bean', 'white beans', 'witte bonen', 'cannellini', 'butter bean', 'butter beans'] },
  { id: 'borlotti', label: 'Borlotti bean', category: 'legume', aliases: ['borlotti', 'bruine bonen'] },
  { id: 'broad_bean', label: 'Broad bean', category: 'legume', aliases: ['broad bean', 'broad beans', 'fava', 'tuinboon', 'tuinbonen'] },
  { id: 'pea', label: 'Pea', category: 'legume', aliases: ['pea', 'peas', 'erwt', 'erwten', 'doperwten', 'kapucijners', 'petit pois'] },
  { id: 'soy', label: 'Soy', category: 'legume', aliases: ['soy', 'soya', 'soja', 'tofu', 'tempeh', 'edamame', 'sojaboon'] },
  { id: 'peanut', label: 'Peanut', category: 'legume', aliases: ['peanut', 'peanuts', 'pinda', 'pindas', 'pindakaas', 'peanut butter', 'peanut sauce', 'satesaus'] },
  { id: 'mung_bean', label: 'Mung bean', category: 'legume', aliases: ['mung bean', 'mung beans', 'bean sprout', 'bean sprouts', 'taugé', 'tauge', 'mungboon'] },

  // -------------------------------------------------------------- nuts & seeds
  { id: 'almond', label: 'Almond', category: 'nut_seed', aliases: ['almond', 'almonds', 'amandel', 'amandelen', 'amlou', 'marzipan', 'marsepein'] },
  { id: 'walnut', label: 'Walnut', category: 'nut_seed', aliases: ['walnut', 'walnuts', 'walnoot', 'walnoten'] },
  { id: 'cashew', label: 'Cashew', category: 'nut_seed', aliases: ['cashew', 'cashews', 'cashewnoot', 'cashewnoten'] },
  { id: 'hazelnut', label: 'Hazelnut', category: 'nut_seed', aliases: ['hazelnut', 'hazelnuts', 'hazelnoot', 'hazelnoten'] },
  { id: 'pistachio', label: 'Pistachio', category: 'nut_seed', aliases: ['pistachio', 'pistachios', 'pistache', 'pistachenoten'] },
  { id: 'pecan', label: 'Pecan', category: 'nut_seed', aliases: ['pecan', 'pecans', 'pecannoot'] },
  { id: 'brazil_nut', label: 'Brazil nut', category: 'nut_seed', aliases: ['brazil nut', 'brazil nuts', 'paranoot'] },
  { id: 'macadamia', label: 'Macadamia', category: 'nut_seed', aliases: ['macadamia'] },
  { id: 'pine_nut', label: 'Pine nut', category: 'nut_seed', aliases: ['pine nut', 'pine nuts', 'pijnboomkernen', 'pijnboomzaad'] },
  { id: 'chestnut', label: 'Chestnut', category: 'nut_seed', aliases: ['chestnut', 'chestnuts', 'kastanje', 'kastanjes'] },
  { id: 'sunflower_seed', label: 'Sunflower seed', category: 'nut_seed', aliases: ['sunflower seed', 'sunflower seeds', 'zonnebloemkernen', 'zonnebloemzaad'] },
  { id: 'pumpkin_seed', label: 'Pumpkin seed', category: 'nut_seed', aliases: ['pumpkin seed', 'pumpkin seeds', 'pompoenkernen', 'pompoenzaad'] },
  { id: 'sesame', label: 'Sesame', category: 'nut_seed', aliases: ['sesame', 'sesamzaad', 'tahini', 'tahin'] },
  { id: 'flaxseed', label: 'Flaxseed', category: 'nut_seed', aliases: ['flaxseed', 'flax seed', 'linseed', 'lijnzaad'] },
  { id: 'chia', label: 'Chia seed', category: 'nut_seed', aliases: ['chia', 'chia seed', 'chia seeds', 'chiazaad'] },
  { id: 'hemp_seed', label: 'Hemp seed', category: 'nut_seed', aliases: ['hemp seed', 'hemp seeds', 'hennepzaad'] },

  // ------------------------------------------------------------------- grains
  // Wheat deliberately absorbs every wheat product so it counts ONCE.
  { id: 'wheat', label: 'Wheat', category: 'grain', aliases: [
    'wheat', 'tarwe', 'bread', 'brood', 'toast', 'baguette', 'sourdough', 'zuurdesem',
    'bun', 'roll', 'pistolet', 'pita', 'naan', 'tortilla', 'wrap', 'croissant',
    'pasta', 'spaghetti', 'penne', 'macaroni', 'tagliatelle', 'lasagne', 'noodle', 'noodles',
    'udon', 'couscous', 'bulgur', 'semolina', 'griesmeel', 'harcha', 'msemen',
    'flatbread', 'cracker', 'beschuit', 'peperkoek', 'koffiekoek', 'pastry', 'danish',
    'flour', 'bloem', 'dumpling', 'dumplings', 'seitan',
    'pie', 'tart', 'cake', 'cookie', 'biscuit', 'pancake', 'pancakes', 'waffle',
    'crumble', 'muffin', 'brownie', 'donut', 'doughnut',
  ] },
  { id: 'rice', label: 'Rice', category: 'grain', aliases: ['rice', 'rijst', 'basmati', 'jasmine rice', 'sushi rice', 'risotto', 'rice paper'] },
  { id: 'oats', label: 'Oats', category: 'grain', aliases: ['oat', 'oats', 'oatmeal', 'havermout', 'haver', 'porridge', 'granola', 'muesli'] },
  { id: 'rye', label: 'Rye', category: 'grain', aliases: ['rye', 'rogge', 'roggebrood', 'pumpernickel'] },
  { id: 'spelt', label: 'Spelt', category: 'grain', aliases: ['spelt', 'spelled'] },
  { id: 'barley', label: 'Barley', category: 'grain', aliases: ['barley', 'gerst', 'pearl barley'] },
  { id: 'quinoa', label: 'Quinoa', category: 'grain', aliases: ['quinoa'] },
  { id: 'buckwheat', label: 'Buckwheat', category: 'grain', aliases: ['buckwheat', 'boekweit'] },
  { id: 'millet', label: 'Millet', category: 'grain', aliases: ['millet', 'gierst'] },
];

// There is deliberately NO noise-word filter. Matching is positive — it looks for
// known aliases — so filler words like "cooked" or "diced" cannot produce a false
// match and stripping them buys nothing. It actively harms: an earlier version
// stripped "sweet", which turned "Sweet Potato" into plain potato. Modifiers that
// change plant identity (sweet, red, green, white, wild) must survive to matching.

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Lowercase, de-accent, punctuation to spaces, collapse whitespace. */
export function normalise(name: string): string {
  return stripDiacritics(name.toLowerCase())
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Aliases sorted longest-first so "sweet potato" wins over "potato". */
type AliasEntry = { alias: string; plantId: string; re: RegExp };
const ALIAS_INDEX: AliasEntry[] = (() => {
  const entries: AliasEntry[] = [];
  for (const p of PLANTS) {
    for (const raw of p.aliases) {
      const alias = normalise(raw);
      if (!alias) continue;
      // Whole word, or the tail of a compound word when long enough to be safe.
      // Compound tails catch Dutch compounds like "cherrytomaat" and "bloemkool".
      const pattern = alias.length >= 5
        ? `(?:\\b|[a-z])${alias.replace(/ /g, '\\s+')}\\b`
        : `\\b${alias.replace(/ /g, '\\s+')}\\b`;
      entries.push({ alias, plantId: p.id, re: new RegExp(pattern, 'g') });
    }
  }
  return entries.sort((a, b) => b.alias.length - a.alias.length);
})();

const PLANT_BY_ID = new Map(PLANTS.map((p) => [p.id, p]));
export function getPlant(id: string): PlantDef | undefined {
  return PLANT_BY_ID.get(id);
}

/**
 * Find every plant referenced by one ingredient name.
 *
 * Matches longest alias first and blanks out the matched text before trying
 * shorter aliases. That consumption step is what stops "aardappel" (potato)
 * from also scoring "appel" (apple), and "sinaasappel" (orange) from scoring
 * both. Order matters; do not replace this with a plain substring scan.
 */
export function matchPlants(ingredientName: string): string[] {
  let hay = ' ' + normalise(ingredientName) + ' ';
  if (!hay.trim()) return [];

  const found: string[] = [];
  for (const entry of ALIAS_INDEX) {
    if (found.includes(entry.plantId)) continue;
    entry.re.lastIndex = 0;
    const m = entry.re.exec(hay);
    if (!m) continue;
    found.push(entry.plantId);
    // Blank the matched span so shorter aliases cannot re-read the same letters.
    hay = hay.slice(0, m.index) + ' '.repeat(m[0].length) + hay.slice(m.index + m[0].length);
  }
  return found;
}

export type PlantTally = {
  /** Distinct plant ids in the window. */
  ids: string[];
  byCategory: Record<PlantCategory, string[]>;
  /** Plant ids seen in this window but not in the one before it. */
  newThisWindow: string[];
  count: number;
  target: number;
};

export const PLANT_TARGET = 30;

type MealLike = { date: string; ingredients: { name: string }[] };

function tallyRange(meals: MealLike[], from: string, to: string): Set<string> {
  const ids = new Set<string>();
  for (const m of meals) {
    if (m.date < from || m.date > to) continue;
    for (const ing of m.ingredients || []) {
      for (const id of matchPlants(ing.name)) ids.add(id);
    }
  }
  return ids;
}

function shiftDate(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Tally distinct plants over the `windowDays` ending at `endDate` inclusive,
 * plus which of them are new versus the immediately preceding window.
 */
export function tallyPlants(
  meals: MealLike[],
  endDate: string,
  windowDays = 7
): PlantTally {
  const from = shiftDate(endDate, -(windowDays - 1));
  const current = tallyRange(meals, from, endDate);

  const prevTo = shiftDate(from, -1);
  const prevFrom = shiftDate(prevTo, -(windowDays - 1));
  const previous = tallyRange(meals, prevFrom, prevTo);

  const byCategory: Record<PlantCategory, string[]> = {
    vegetable: [], fruit: [], legume: [], nut_seed: [], grain: [],
  };
  for (const id of current) {
    const p = PLANT_BY_ID.get(id);
    if (p) byCategory[p.category].push(id);
  }
  for (const k of Object.keys(byCategory) as PlantCategory[]) {
    byCategory[k].sort((a, b) =>
      (PLANT_BY_ID.get(a)?.label ?? a).localeCompare(PLANT_BY_ID.get(b)?.label ?? b));
  }

  return {
    ids: [...current],
    byCategory,
    newThisWindow: [...current].filter((id) => !previous.has(id)),
    count: current.size,
    target: PLANT_TARGET,
  };
}
