// Meal entry — method picker → photo / barcode / manual / saved
function MealEntry({ defaultSlot, onClose, onLog }) {
  const [method, setMethod] = React.useState(null); // null | 'photo' | 'barcode' | 'manual' | 'saved'
  const [slot, setSlot] = React.useState(defaultSlot || timeBasedSlot());

  return (
    <div style={{ background: FF.sage, minHeight: '100%', display:'flex', flexDirection:'column' }}>
      {/* sub-header w/ slot picker */}
      <div style={{ padding: '10px 16px 12px', display:'flex', alignItems:'center', gap: 10 }}>
        <button onClick={() => method ? setMethod(null) : onClose()} style={{
          width: 40, height: 40, borderRadius:'50%', border:'none', background:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <Icon name={method ? 'arrow-l' : 'x'} size={20}/>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>Add to</div>
          <SlotSelector value={slot} onChange={setSlot}/>
        </div>
      </div>

      <div style={{ flex: 1, overflow:'auto' }} className="scroll">
        {method === null  && <MethodPicker onPick={setMethod}/>}
        {method === 'photo'   && <PhotoFlow slot={slot} onLog={onLog}/>}
        {method === 'barcode' && <BarcodeFlow slot={slot} onLog={onLog}/>}
        {method === 'manual'  && <ManualFlow slot={slot} onLog={onLog}/>}
        {method === 'saved'   && <SavedFlow slot={slot} onLog={onLog}/>}
      </div>
    </div>
  );
}

function timeBasedSlot() {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

function SlotSelector({ value, onChange }) {
  const slots = ['breakfast','lunch','dinner','snack'];
  const labels = { breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner', snack:'Snack' };
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position:'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background:'transparent', border:'none', display:'flex', alignItems:'center', gap: 6,
        color: FF.forest, fontSize: 19, fontWeight: 500, padding: 0, marginTop: 1,
      }}>
        {labels[value]} <Icon name="chev-d" size={18}/>
      </button>
      {open && (
        <div style={{ position:'absolute', top: 32, left: 0, zIndex: 10,
          background:'#fff', borderRadius: 14, padding: 6, boxShadow:'0 6px 20px rgba(0,0,0,0.14)',
          border:`1px solid ${FF.line}`, minWidth: 160 }}>
          {slots.map(s => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }} style={{
              width:'100%', textAlign:'left', padding:'10px 12px', border:'none', borderRadius: 10,
              background: value === s ? 'rgba(70,78,71,0.08)' : 'transparent', color: FF.forest, fontSize: 14,
            }}>{labels[s]}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function MethodPicker({ onPick }) {
  const tiles = [
    { k: 'photo',   l: 'Photo',     d: 'Snap a plate', icon: 'camera', tone: FF.ember, pill: 'AI' },
    { k: 'barcode', l: 'Barcode',   d: 'Scan a label', icon: 'barcode', tone: FF.forest },
    { k: 'manual',  l: 'Search',    d: 'Database & history', icon: 'search', tone: FF.forest },
    { k: 'saved',   l: 'Saved',     d: 'Re-log a meal', icon: 'bookmark', tone: FF.forest },
  ];
  const recents = [
    { name: 'Greek yogurt + berries', kcal: 180, slot: 'breakfast' },
    { name: 'Chicken caesar wrap',    kcal: 510, slot: 'lunch' },
    { name: 'Cold brew (oat)',        kcal: 110, slot: 'snack' },
  ];
  return (
    <div style={{ padding: '10px 16px 24px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
        {tiles.map(t => (
          <button key={t.k} onClick={() => onPick(t.k)} style={{
            position:'relative', padding: '20px 18px', borderRadius: 22,
            background: t.k === 'photo' ? FF.forest : '#fff',
            color: t.k === 'photo' ? '#fff' : FF.forest,
            border: t.k === 'photo' ? 'none' : `1px solid ${FF.line}`,
            textAlign:'left', display:'flex', flexDirection:'column', gap: 18,
            minHeight: 140,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12,
                background: t.k === 'photo' ? FF.ember : 'rgba(70,78,71,0.06)',
                color: t.k === 'photo' ? '#fff' : FF.forest,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name={t.icon} size={20}/>
              </div>
              {t.pill && <span style={{ fontSize: 9.5, letterSpacing: 1, fontWeight: 700,
                padding: '3px 8px', borderRadius: 999, background: FF.ice, color: FF.forest2 }}>{t.pill}</span>}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.2 }}>{t.l}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{t.d}</div>
            </div>
          </button>
        ))}
      </div>

      <SectionLabel right={<span style={{ fontSize: 12, color: FF.muted }}>This week</span>}>
        <div style={{ marginTop: 22 }}>Quick log</div>
      </SectionLabel>
      <Card pad={0}>
        {recents.map((r, i) => (
          <div key={i} style={{ padding: '12px 16px', display:'flex', alignItems:'center', gap: 12,
            borderBottom: i < recents.length-1 ? `1px solid ${FF.line}` : 'none' }}>
            <Icon name="clock" size={16} color={FF.muted}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize: 14, color: FF.forest, fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: 11.5, color: FF.muted, textTransform:'capitalize' }}>{r.slot}</div>
            </div>
            <span className="mono" style={{ fontSize: 13, color: FF.forest }}>{r.kcal}<span style={{ color: FF.muted, marginLeft: 2 }}>kcal</span></span>
            <button style={{ width: 32, height: 32, borderRadius:'50%', border:`1px solid ${FF.line}`,
              background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name="plus-s" size={14}/>
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Photo flow ──────────────────────────────────────────────────
// Tiny lookup of kcal per 100g for common items — when user types
// an uncertain item's name, we recompute kcal from this if we know it.
const KCAL_PER_100G = {
  'olive oil': 880, 'butter': 720, 'mayonnaise': 680, 'mayo': 680,
  'tahini': 590, 'peanut butter': 590, 'almond butter': 600,
  'sesame dressing': 530, 'caesar dressing': 540, 'ranch dressing': 480,
  'vinaigrette': 360, 'soy sauce': 60, 'ketchup': 100, 'sriracha': 95,
  'hummus': 175, 'guacamole': 155, 'salsa': 30, 'pesto': 460,
  'rice': 130, 'brown rice': 122, 'quinoa': 120, 'pasta': 158, 'noodles': 138,
  'bread': 270, 'sourdough': 250, 'tortilla': 305, 'pita': 265,
  'chicken': 165, 'salmon': 200, 'tuna': 130, 'beef': 250, 'tofu': 76,
  'broccoli': 35, 'spinach': 23, 'kale': 49, 'avocado': 160, 'tomato': 18,
  'cucumber': 16, 'lettuce': 15, 'carrot': 41, 'pepper': 20, 'onion': 40,
  'cheese': 400, 'feta': 264, 'parmesan': 431, 'mozzarella': 280,
  'egg': 155, 'yogurt': 60, 'milk': 60, 'cream': 340,
  'apple': 52, 'banana': 89, 'berries': 50, 'orange': 47, 'mango': 60,
};
function lookupKcal(name) {
  const q = name.toLowerCase().trim();
  if (KCAL_PER_100G[q]) return KCAL_PER_100G[q];
  // fuzzy-ish: longest matching key
  let best = null;
  for (const k of Object.keys(KCAL_PER_100G)) {
    if (q.includes(k) && (!best || k.length > best.length)) best = k;
  }
  return best ? KCAL_PER_100G[best] : null;
}

function PhotoFlow({ slot, onLog }) {
  const [items, setItems] = React.useState([
    { id: 1, name: 'Grilled salmon',     grams: 140, kcal: 280, conf: 0.94 },
    { id: 2, name: 'Brown rice',         grams: 180, kcal: 222, conf: 0.91 },
    { id: 3, name: 'Roasted broccoli',   grams: 90,  kcal: 65,  conf: 0.88 },
    { id: 4, name: '',                   grams: 18,  kcal: 0,   conf: 0.42, suggested: 'Sesame dressing?' },
  ]);
  const [editingId, setEditingId] = React.useState(null);

  const total = items.reduce((a, i) => a + i.kcal, 0);
  const lowConf = items.some(i => i.conf < 0.7);

  const updateGrams = (id, g) => setItems(xs => xs.map(x => {
    if (x.id !== id) return x;
    if (!x.grams || !x.kcal) {
      // recompute from lookup if available
      const per100 = lookupKcal(x.name);
      return { ...x, grams: g, kcal: per100 ? Math.round(per100 * g / 100) : x.kcal };
    }
    return { ...x, grams: g, kcal: Math.round(x.kcal * (g / x.grams)) };
  }));

  const renameItem = (id, name) => setItems(xs => xs.map(x => {
    if (x.id !== id) return x;
    const per100 = lookupKcal(name);
    return {
      ...x,
      name,
      conf: name ? 1.0 : x.conf,
      kcal: per100 ? Math.round(per100 * x.grams / 100) : x.kcal,
    };
  }));

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {/* photo placeholder */}
      <div style={{ borderRadius: 22, overflow: 'hidden', position:'relative', height: 220,
        background: `repeating-linear-gradient(135deg, #d8ddd6 0 12px, #cdd2cb 12px 24px)`,
        border: `1px solid ${FF.line}` }}>
        <div style={{ position:'absolute', inset: 0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span className="mono" style={{ fontSize: 11, color: FF.muted, letterSpacing: 1 }}>[ user-snapped meal photo ]</span>
        </div>
        <div style={{ position:'absolute', top: 12, left: 12, padding: '5px 10px', borderRadius: 999,
          background: 'rgba(70,78,71,0.85)', color:'#fff', fontSize: 11, letterSpacing: 0.6,
          display:'flex', alignItems:'center', gap: 6 }}>
          <Icon name="spark" size={12} color="#fff"/> AI detected · 4 items
        </div>
      </div>

      {lowConf && (
        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 14,
          background: 'rgba(246,174,45,0.18)', border: `1px solid rgba(246,174,45,0.4)`,
          display:'flex', gap: 10, alignItems:'flex-start' }}>
          <Icon name="warn" size={18} color={FF.amber}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: FF.forest }}>1 item couldn't be identified</div>
            <div style={{ fontSize: 12, color: FF.forest, opacity: 0.8, marginTop: 2 }}>
              Type what it is and we'll calculate calories from our database.
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <SectionLabel right={<span className="mono" style={{ fontSize: 12, color: FF.forest }}>{total} kcal</span>}>Detected items</SectionLabel>
        <Card pad={0}>
          {items.map((it, i) => {
            const isLow = it.conf < 0.7;
            const isEditing = editingId === it.id || (isLow && !it.name);
            return (
              <div key={it.id} style={{ padding: '14px 16px',
                borderBottom: i < items.length-1 ? `1px solid ${FF.line}` : 'none',
                background: isLow ? 'rgba(246,174,45,0.08)' : 'transparent' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 10, flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <input autoFocus value={it.name}
                        onChange={e => renameItem(it.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={e => { if (e.key === 'Enter') setEditingId(null); }}
                        placeholder={it.suggested || 'Type item name…'}
                        style={{
                          flex: 1, fontSize: 14, fontWeight: 500, color: FF.forest,
                          padding: '6px 10px', borderRadius: 8,
                          border: `1.5px solid ${FF.amber}`, background: '#fff', outline: 'none',
                          fontFamily: 'inherit', minWidth: 0,
                        }}/>
                    ) : (
                      <button onClick={() => setEditingId(it.id)} style={{
                        background:'transparent', border:'none', padding: 0, textAlign:'left',
                        display:'flex', alignItems:'center', gap: 8, color: FF.forest, flex: 1, minWidth: 0,
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: it.name ? FF.forest : FF.muted,
                          fontStyle: it.name ? 'normal' : 'italic',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {it.name || (it.suggested || 'tap to identify')}
                        </span>
                        {isLow && <Icon name="edit" size={13} color={FF.amber}/>}
                      </button>
                    )}
                    {isLow && it.name && !isEditing && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999,
                        background: 'rgba(246,174,45,0.25)', color: FF.forest2, fontWeight: 600,
                        letterSpacing: 0.3, flexShrink: 0 }}>{Math.round(it.conf*100)}%</span>
                    )}
                    {isLow && !it.name && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999,
                        background: FF.amber, color: FF.forest2, fontWeight: 700,
                        letterSpacing: 0.3, flexShrink: 0 }}>UNKNOWN</span>
                    )}
                  </div>
                  <span className="mono" style={{ fontSize: 13, color: it.kcal ? FF.forest : FF.muted, flexShrink: 0 }}>
                    {it.kcal || '—'}<span style={{ color: FF.muted }}> kcal</span>
                  </span>
                </div>
                <div style={{ marginTop: 10, display:'flex', alignItems:'center', gap: 10 }}>
                  <span className="mono" style={{ fontSize: 11, color: FF.muted, minWidth: 32 }}>{it.grams}g</span>
                  <Slider value={it.grams} onChange={v => updateGrams(it.id, v)} min={10} max={400} thin/>
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ marginTop: 22 }}>
        <Btn kind="primary" full icon="check" onClick={() => onLog({
          slot, name: 'Salmon plate', serving: items.length + ' items',
          kcal: total, macros: { p: 38, c: 52, f: 18, fi: 6 }
        })}>Save to {slot}</Btn>
      </div>
    </div>
  );
}

// ── Barcode flow ──────────────────────────────────────────────
function BarcodeFlow({ slot, onLog }) {
  const [scanned, setScanned] = React.useState(false);
  const [grams, setGrams] = React.useState(40);
  const [serving, setServing] = React.useState('grams'); // grams | servings
  const [servings, setServings] = React.useState(1);

  const product = {
    brand: 'KIND', name: 'Dark Chocolate Nuts & Sea Salt',
    per100: { kcal: 480, p: 14, c: 32, f: 32, fi: 7 },
    servingG: 40,
  };
  const k100 = product.per100.kcal;
  const totalG = serving === 'grams' ? grams : servings * product.servingG;
  const kcal = Math.round(k100 * totalG / 100);

  React.useEffect(() => {
    const t = setTimeout(() => setScanned(true), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ padding:'0 16px 24px' }}>
      {/* viewfinder */}
      <div style={{ position:'relative', height: 220, borderRadius: 22, overflow:'hidden',
        background: '#1a1f1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:'72%', height: 110, border:`2px solid ${scanned ? FF.ice : '#fff'}`,
          borderRadius: 14, position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="barcode" size={70} color={scanned ? FF.ice : 'rgba(255,255,255,0.5)'}/>
          {!scanned && <div style={{ position:'absolute', left: 0, right: 0, top: '50%',
            height: 2, background: FF.ember, boxShadow:`0 0 12px ${FF.ember}`, animation:'scan 1.4s linear infinite' }}/>}
        </div>
        <span style={{ position:'absolute', bottom: 14, color:'#fff', fontSize: 11.5, letterSpacing: 0.6 }}>
          {scanned ? 'Found · 0 41789 31528 4' : 'Aligning barcode…'}
        </span>
      </div>

      {scanned && (
        <>
          <Card pad={18} style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>{product.brand}</div>
            <div style={{ fontSize: 19, fontWeight: 600, color: FF.forest, marginTop: 2, letterSpacing: -0.2 }}>{product.name}</div>
            <div style={{ marginTop: 12, display:'flex', gap: 10 }}>
              <Pills full value={serving} onChange={setServing} items={[
                { value:'grams', label:'Grams' },{ value:'servings', label:'Servings' }
              ]}/>
            </div>
            {serving === 'grams' ? (
              <div style={{ marginTop: 18 }}>
                <BigNumber value={grams} onChange={setGrams} unit="g" min={5} max={400} step={5}/>
              </div>
            ) : (
              <div style={{ marginTop: 18 }}>
                <BigNumber value={servings} onChange={v => setServings(Math.max(0.25, Math.round(v*4)/4))} unit={`× ${product.servingG}g serving`} min={0.25} max={6} step={0.25}/>
              </div>
            )}
            <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: FF.paper,
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize: 13, color: FF.forest, fontWeight: 500 }}>This portion</span>
              <span className="mono" style={{ fontSize: 22, color: FF.forest, fontWeight: 500 }}>
                {kcal}<span style={{ fontSize: 12, color: FF.muted, marginLeft: 4 }}>kcal</span>
              </span>
            </div>
          </Card>
          <div style={{ marginTop: 18 }}>
            <Btn kind="primary" full icon="check" onClick={() => onLog({
              slot, name: product.name, serving: `${totalG}g`, kcal,
              macros: {
                p: Math.round(product.per100.p * totalG / 100),
                c: Math.round(product.per100.c * totalG / 100),
                f: Math.round(product.per100.f * totalG / 100),
                fi: Math.round(product.per100.fi * totalG / 100),
              }
            })}>Add to {slot}</Btn>
          </div>
        </>
      )}
      <style>{`@keyframes scan { 0% { top: 6%; } 50% { top: 92%; } 100% { top: 6%; } }`}</style>
    </div>
  );
}

// ── Manual search flow w/ multi-ingredient ──────────────────────
function ManualFlow({ slot, onLog }) {
  const [q, setQ] = React.useState('');
  const [picked, setPicked] = React.useState([]);
  const [savable, setSavable] = React.useState(false);

  const history = [
    { name: 'Greek yogurt 5%', brand: 'Fage',  kcal: 130, per: '170g', macros:{ p: 18, c: 7, f: 4, fi: 0 } },
    { name: 'Sourdough slice',  brand: 'Local bakery', kcal: 120, per: '40g', macros:{ p: 4, c: 22, f: 1, fi: 1 } },
    { name: 'Almonds, raw',     brand: '', kcal: 165, per: '28g', macros:{ p: 6, c: 6, f: 14, fi: 3 } },
  ];
  const database = [
    { name: 'Banana, medium',   brand: 'USDA',    kcal: 105, per: '118g', macros:{ p: 1, c: 27, f: 0.4, fi: 3 } },
    { name: 'Olive oil',        brand: 'USDA',    kcal: 119, per: '14g', macros:{ p: 0, c: 0, f: 14, fi: 0 } },
    { name: 'Egg, scrambled',   brand: 'USDA',    kcal: 91,  per: '1 large', macros:{ p: 6, c: 1, f: 7, fi: 0 } },
  ];
  const filterFn = it => !q || (it.name + it.brand).toLowerCase().includes(q.toLowerCase());

  const total = picked.reduce((a, p) => ({
    kcal: a.kcal + p.kcal,
    p: a.p + p.macros.p, c: a.c + p.macros.c,
    f: a.f + p.macros.f, fi: a.fi + p.macros.fi,
  }), { kcal: 0, p: 0, c: 0, f: 0, fi: 0 });

  return (
    <div style={{ padding:'0 16px 24px' }}>
      <div style={{ position:'relative' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search foods, brands, recipes…"
          style={{
            width:'100%', padding:'14px 16px 14px 44px', borderRadius: 16, fontSize: 14,
            background:'#fff', border: `1px solid ${FF.line}`, outline:'none', color: FF.forest,
          }}/>
        <span style={{ position:'absolute', left: 14, top: '50%', transform:'translateY(-50%)', color: FF.muted }}>
          <Icon name="search" size={18}/>
        </span>
      </div>

      {picked.length > 0 && (
        <Card pad={14} style={{ marginTop: 14, background: FF.forest, color:'#fff', border:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 1.2, opacity: 0.6, textTransform:'uppercase', fontWeight: 600 }}>Building meal · {picked.length} items</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 500, marginTop: 2 }}>{total.kcal}<span style={{ fontSize: 12, opacity: 0.6, marginLeft: 4 }}>kcal</span></div>
            </div>
            <div style={{ textAlign:'right', fontSize: 11, opacity: 0.85, lineHeight: 1.6 }}>
              <span className="mono">{total.p}g</span> protein<br/>
              <span className="mono">{total.c}g</span> carbs · <span className="mono">{total.f}g</span> fat
            </div>
          </div>
          <div style={{ marginTop: 12, display:'flex', flexDirection:'column', gap: 6 }}>
            {picked.map((p, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize: 13,
                paddingTop: 8, borderTop: i ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                <span>{p.name}</span>
                <span className="mono" style={{ opacity: 0.85 }}>{p.kcal} kcal</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display:'flex', alignItems:'center', gap: 10 }}>
            <label style={{ display:'flex', alignItems:'center', gap: 6, fontSize: 12, opacity: 0.85 }}>
              <input type="checkbox" checked={savable} onChange={e => setSavable(e.target.checked)} /> Save as meal
            </label>
            <div style={{ flex: 1 }}/>
            <Btn kind="ice" icon="check" onClick={() => onLog({
              slot, name: savable ? 'My custom meal' : picked.map(p => p.name).join(' + '),
              serving: `${picked.length} items`, kcal: total.kcal,
              macros: { p: total.p, c: total.c, f: total.f, fi: total.fi }
            })}>Add</Btn>
          </div>
        </Card>
      )}

      <div style={{ marginTop: 18 }}>
        <SectionLabel>Your recents</SectionLabel>
        <SearchList items={history.filter(filterFn)} onAdd={x => setPicked(p => [...p, x])}/>
      </div>
      <div style={{ marginTop: 14 }}>
        <SectionLabel>Database</SectionLabel>
        <SearchList items={database.filter(filterFn)} onAdd={x => setPicked(p => [...p, x])}/>
      </div>
    </div>
  );
}

const SearchList = ({ items, onAdd }) => (
  <Card pad={0}>
    {items.length === 0 && (
      <div style={{ padding: 16, fontSize: 13, color: FF.muted, textAlign:'center' }}>No results</div>
    )}
    {items.map((it, i) => (
      <div key={i} style={{ padding: '12px 14px', display:'flex', alignItems:'center', gap: 12,
        borderBottom: i < items.length-1 ? `1px solid ${FF.line}` : 'none' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: FF.forest, fontWeight: 500 }}>{it.name}</div>
          <div style={{ fontSize: 11.5, color: FF.muted, marginTop: 2 }}>
            {it.brand && `${it.brand} · `}{it.per} · <span className="mono">{it.kcal} kcal</span>
          </div>
        </div>
        <button onClick={() => onAdd(it)} style={{
          width: 34, height: 34, borderRadius: '50%', border: `1px solid ${FF.line}`,
          background:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon name="plus-s" size={14}/>
        </button>
      </div>
    ))}
  </Card>
);

// ── Saved meals ────────────────────────────────────────────────
function SavedFlow({ slot, onLog }) {
  const meals = [
    { name: 'Overnight oats',         tag: 'Breakfast', kcal: 380, macros: { p: 14, c: 56, f: 10, fi: 8 }, mult: 1 },
    { name: 'Protein smoothie',       tag: 'Anytime',   kcal: 290, macros: { p: 32, c: 28, f: 6,  fi: 4 }, mult: 1 },
    { name: 'Rice & chicken bowl',    tag: 'Lunch',     kcal: 620, macros: { p: 45, c: 65, f: 14, fi: 5 }, mult: 1 },
    { name: 'Sheet-pan salmon',       tag: 'Dinner',    kcal: 540, macros: { p: 38, c: 38, f: 22, fi: 7 }, mult: 1 },
  ];
  const [state, setState] = React.useState(meals);
  const setMult = (i, v) => setState(ms => ms.map((m, j) => j === i ? { ...m, mult: Math.max(0.25, Math.round(v*4)/4) } : m));

  return (
    <div style={{ padding:'0 16px 24px' }}>
      <SectionLabel>Saved meals · 4</SectionLabel>
      <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
        {state.map((m, i) => {
          const k = Math.round(m.kcal * m.mult);
          return (
            <Card key={i} pad={16}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>{m.tag}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: FF.forest, marginTop: 2 }}>{m.name}</div>
                </div>
                <span className="mono" style={{ fontSize: 20, color: FF.forest, fontWeight: 500 }}>{k}<span style={{ fontSize: 11, color: FF.muted, marginLeft: 3 }}>kcal</span></span>
              </div>
              <div style={{ marginTop: 14, display:'flex', alignItems:'center', gap: 14 }}>
                <span style={{ fontSize: 12, color: FF.muted }}>Portion</span>
                <button onClick={() => setMult(i, m.mult - 0.25)} style={smallBtn}><Icon name="minus" size={14}/></button>
                <span className="mono" style={{ minWidth: 38, textAlign:'center', fontSize: 16, fontWeight: 500, color: FF.forest }}>
                  {m.mult}×
                </span>
                <button onClick={() => setMult(i, m.mult + 0.25)} style={smallBtn}><Icon name="plus-s" size={14}/></button>
                <div style={{ flex: 1 }}/>
                <Btn kind="forest" style={{ height: 38, padding: '0 16px', fontSize: 13 }}
                  onClick={() => onLog({
                    slot, name: m.name, serving: `${m.mult}× saved`,
                    kcal: k,
                    macros: {
                      p: Math.round(m.macros.p * m.mult),
                      c: Math.round(m.macros.c * m.mult),
                      f: Math.round(m.macros.f * m.mult),
                      fi: Math.round(m.macros.fi * m.mult),
                    }
                  })}
                >Log</Btn>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
const smallBtn = {
  width: 32, height: 32, borderRadius:'50%', border:`1px solid ${FF.line}`, background:'#fff',
  display:'flex', alignItems:'center', justifyContent:'center', color: FF.forest,
};

Object.assign(window, { MealEntry });
