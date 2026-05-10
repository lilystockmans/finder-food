// Top-level app shell — onboarding → tabs (home / progress / saved / profile)

const SAMPLE_LOG = [
  { id: 'a', slot: 'breakfast', name: 'Greek yogurt + blueberries', serving: '170g + 80g', kcal: 230, macros: { p: 18, c: 26, f: 4, fi: 3 } },
  { id: 'b', slot: 'breakfast', name: 'Sourdough toast, butter',     serving: '40g',        kcal: 165, macros: { p: 4, c: 22, f: 6, fi: 1 } },
  { id: 'c', slot: 'lunch',     name: 'Chicken caesar wrap',          serving: '1 wrap',     kcal: 510, macros: { p: 32, c: 42, f: 22, fi: 3 } },
  { id: 'd', slot: 'snack',     name: 'Almonds, raw',                 serving: '28g',        kcal: 165, macros: { p: 6, c: 6, f: 14, fi: 3 } },
];

function App() {
  const [profile, setProfile] = React.useState(null);
  const [tab, setTab] = React.useState('home');
  const [log, setLog] = React.useState(SAMPLE_LOG);
  const [entryOpen, setEntryOpen] = React.useState(false);
  const [entrySlot, setEntrySlot] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [profileSheet, setProfileSheet] = React.useState(null); // 'target'|'macros'|'goal'|'settings'|null

  // Skippable onboarding — shown if no profile saved
  React.useEffect(() => {
    const saved = localStorage.getItem('ff:profile');
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch {}
    }
  }, []);

  const finishOnboarding = (data) => {
    setProfile(data);
    localStorage.setItem('ff:profile', JSON.stringify(data));
  };

  const addMeal = (m) => {
    setLog(l => [...l, { ...m, id: 'm' + Date.now() }]);
    setEntryOpen(false);
  };

  const deleteMeal = (id) => setLog(l => l.filter(m => m.id !== id));

  const phoneW = 412, phoneH = 892;

  let main = null;
  if (!profile) {
    main = <Onboarding onDone={finishOnboarding}/>;
  } else if (entryOpen) {
    main = <MealEntry defaultSlot={entrySlot} onClose={() => setEntryOpen(false)} onLog={addMeal}/>;
  } else {
    main = (
      <div style={{ position:'relative', height:'100%', display:'flex', flexDirection:'column' }}>
        <div style={{ flex: 1, overflow:'auto', background: FF.sage }} className="scroll">
          {tab === 'home'     && <Dashboard profile={profile} log={log}
            onAdd={(s) => { setEntrySlot(s); setEntryOpen(true); }}
            onEditMeal={setEditing}/>}
          {tab === 'progress' && <Progress profile={profile}/>}
          {tab === 'saved'    && <SavedTab/>}
          {tab === 'me'       && <ProfileTab profile={profile}
            onOpenSheet={setProfileSheet}
            onReset={() => { localStorage.removeItem('ff:profile'); setProfile(null); }}/>}
        </div>
        <BottomNav tab={tab} setTab={setTab} onAdd={() => { setEntrySlot(null); setEntryOpen(true); }}/>
        <MealEditSheet meal={editing} onClose={() => setEditing(null)} onDelete={deleteMeal}/>
        <ProfileSheet open={profileSheet} profile={profile}
          onClose={() => setProfileSheet(null)}
          onSave={(patch) => {
            const next = { ...profile, ...patch };
            setProfile(next);
            localStorage.setItem('ff:profile', JSON.stringify(next));
            setProfileSheet(null);
          }}/>
      </div>
    );
  }

  return (
    <div style={{
      width: phoneW, height: phoneH, borderRadius: 44, overflow:'hidden',
      background: FF.sage, border: `8px solid #2a302a`,
      boxShadow: '0 30px 70px rgba(0,0,0,0.28), 0 4px 14px rgba(0,0,0,0.18)',
      display:'flex', flexDirection:'column', position:'relative',
    }}>
      <FFStatusBar bg={FF.sage}/>
      <div style={{ flex: 1, overflow:'hidden', position:'relative' }}>
        {main}
      </div>
      {!entryOpen && profile && <FFNavPill bg={FF.forest2}/>}
      {(entryOpen || !profile) && null /* onboarding/entry render their own pill */}
    </div>
  );
}

// Saved tab — minimal placeholder pointing at meals manager
function SavedTab() {
  return (
    <div style={{ padding: '10px 22px 24px' }}>
      <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>Library</div>
      <h1 style={{ margin:'4px 0 18px', fontSize: 26, fontWeight: 500, color: FF.forest, letterSpacing: -0.4 }}>
        Saved <span className="serif-i">meals</span>
      </h1>
      <SavedFlow slot="lunch" onLog={() => {}}/>
    </div>
  );
}

function ProfileTab({ profile, onReset, onOpenSheet }) {
  const rows = [
    { k: 'target',  i: 'target',  l: 'Daily target', v: `${profile.target.toLocaleString()} kcal` },
    { k: 'macros',  i: 'leaf',    l: 'Macros',       v: `${profile.macroSplit.p} / ${profile.macroSplit.c} / ${profile.macroSplit.f}` },
    { k: 'goal',    i: 'scale',   l: 'Goal weight',  v: `${profile.goalKg} kg` },
    { k: 'settings',i: 'settings',l: 'Settings',     v: profile.units },
  ];

  return (
    <div style={{ padding: '10px 22px 24px', position: 'relative' }}>
      <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>Account</div>
      <h1 style={{ margin:'4px 0 18px', fontSize: 26, fontWeight: 500, color: FF.forest, letterSpacing: -0.4 }}>Profile</h1>
      <Card pad={18}>
        <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius:'50%', background: FF.forest, color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize: 22, fontWeight: 600 }}>L</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: FF.forest }}>Lily</div>
            <div style={{ fontSize: 12, color: FF.muted, marginTop: 2 }}>{profile.age} · {profile.heightCm}cm · {profile.weightKg}kg</div>
          </div>
        </div>
      </Card>
      <div style={{ marginTop: 18 }}>
        <Card pad={0}>
          {rows.map((row, i) => (
            <button key={row.k} onClick={() => onOpenSheet(row.k)} style={{
              width:'100%', padding: '14px 16px', display:'flex', alignItems:'center', gap: 14,
              borderBottom: i < rows.length-1 ? `1px solid ${FF.line}` : 'none',
              background:'transparent', border:'none', textAlign:'left', textTransform: row.k === 'settings' ? 'capitalize' : 'none',
            }}>
              <Icon name={row.i} size={18} color={FF.forest}/>
              <span style={{ flex:1, fontSize: 14, color: FF.forest }}>{row.l}</span>
              <span className="mono" style={{ fontSize: 12.5, color: FF.muted, textTransform: row.k === 'settings' ? 'capitalize' : 'none' }}>{row.v}</span>
              <Icon name="chev-r" size={16} color={FF.muted}/>
            </button>
          ))}
        </Card>
      </div>
      <div style={{ marginTop: 18 }}>
        <Btn kind="ghost" full onClick={onReset}>Re-run onboarding</Btn>
      </div>
    </div>
  );
}

// Profile sheet — rendered at App level so it sits within the phone frame
// (not inside the scrolling tab content where it would be cut off).
function ProfileSheet({ open, profile, onClose, onSave }) {
  const [draft, setDraft] = React.useState(null);
  React.useEffect(() => {
    if (!open || !profile) { setDraft(null); return; }
    if (open === 'target')   setDraft({ target: profile.target });
    if (open === 'macros')   setDraft({ ...profile.macroSplit });
    if (open === 'goal')     setDraft({ goalKg: profile.goalKg });
    if (open === 'settings') setDraft({ units: profile.units });
  }, [open, profile]);
  if (!open || !draft) return null;

  const save = () => {
    if (open === 'target')   onSave({ target: draft.target });
    if (open === 'macros')   onSave({ macroSplit: draft });
    if (open === 'goal')     onSave({ goalKg: draft.goalKg });
    if (open === 'settings') onSave({ units: draft.units });
  };

  return (
    <div style={{ position:'absolute', inset: 0, zIndex: 90 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }}/>
      <div style={{ position:'absolute', left:0, right:0, bottom: 0, background: FF.paper,
        borderRadius:'24px 24px 0 0', padding:'12px 20px 28px',
        boxShadow:'0 -8px 30px rgba(0,0,0,0.2)', maxHeight: '78%', overflow: 'auto' }} className="scroll">
        <div style={{ width: 40, height: 4, background:'rgba(0,0,0,0.15)', borderRadius: 2, margin:'4px auto 14px' }}/>
        {open === 'target' && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>Daily target</div>
            <BigNumber value={draft.target} onChange={v => setDraft({ target: Math.round(v) })} unit="kcal" min={1000} max={4500} step={50}/>
          </div>
        )}
        {open === 'goal' && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>Goal weight</div>
            <BigNumber value={draft.goalKg} onChange={v => setDraft({ goalKg: v })} unit="kg" min={35} max={200} step={0.5}/>
          </div>
        )}
        {open === 'macros' && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600, marginBottom: 12 }}>Macro split</div>
            {['p','c','f'].map(k => {
              const labels = { p: 'Protein', c: 'Carbs', f: 'Fat' };
              const colors = { p: FF.ember, c: FF.amber, f: FF.forest };
              return (
                <div key={k} style={{ marginBottom: 12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize: 13, color: FF.forest, marginBottom: 6 }}>
                    <span>{labels[k]}</span>
                    <span className="mono">{draft[k]}%</span>
                  </div>
                  <input type="range" min={10} max={60} value={draft[k]} onChange={e => {
                    const v = parseInt(e.target.value);
                    const others = ['p','c','f'].filter(x => x !== k);
                    const sumOthers = others.reduce((a, x) => a + draft[x], 0) || 1;
                    const rest = 100 - v;
                    const next = { ...draft, [k]: v };
                    others.forEach(x => { next[x] = Math.round(rest * (draft[x] / sumOthers)); });
                    const total = next.p + next.c + next.f;
                    next[others[0]] += 100 - total;
                    setDraft(next);
                  }} style={{ width:'100%', accentColor: colors[k] }}/>
                </div>
              );
            })}
          </div>
        )}
        {open === 'settings' && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600, marginBottom: 12 }}>Units</div>
            <div style={{ display:'flex', gap: 10 }}>
              {[['metric','Metric','kg · cm'],['imperial','Imperial','lb · ft']].map(([v,l,d]) => (
                <button key={v} onClick={() => setDraft({ units: v })} style={{
                  flex: 1, padding: '16px', borderRadius: 14, textAlign:'left',
                  border:`1.5px solid ${draft.units === v ? FF.forest : FF.line}`,
                  background: draft.units === v ? '#fff' : 'transparent', color: FF.forest,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{l}</div>
                  <div style={{ fontSize: 12, color: FF.muted, marginTop: 2 }}>{d}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display:'flex', gap: 10, marginTop: 18 }}>
          <Btn kind="ghost" full onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" full icon="check" onClick={save}>Save</Btn>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
