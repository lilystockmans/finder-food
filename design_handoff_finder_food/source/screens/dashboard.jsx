// Daily dashboard — calories, macros, today's meals
function Dashboard({ profile, log, onAdd, onEditMeal }) {
  const consumed = log.reduce((a, m) => a + m.kcal, 0);
  const macros = log.reduce((a, m) => ({
    p: a.p + (m.macros?.p || 0),
    c: a.c + (m.macros?.c || 0),
    f: a.f + (m.macros?.f || 0),
    fi: a.fi + (m.macros?.fi || 0),
  }), { p: 0, c: 0, f: 0, fi: 0 });

  const targetP = Math.round((profile.target * profile.macroSplit.p / 100) / 4);
  const targetC = Math.round((profile.target * profile.macroSplit.c / 100) / 4);
  const targetF = Math.round((profile.target * profile.macroSplit.f / 100) / 9);
  const targetFi = 30;

  const slots = [
    { key: 'breakfast', label: 'Breakfast', time: '7–10', icon: 'spark' },
    { key: 'lunch',     label: 'Lunch',     time: '12–14', icon: 'flame' },
    { key: 'dinner',    label: 'Dinner',    time: '18–21', icon: 'leaf' },
    { key: 'snack',     label: 'Snacks',    time: 'any', icon: 'bolt' },
  ];

  return (
    <div style={{ background: FF.sage, minHeight: '100%', paddingBottom: 14 }}>
      {/* Greeting */}
      <div style={{ padding: '10px 22px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 1.2, color: FF.muted, fontWeight: 500, textTransform:'uppercase' }}>
            Thursday, May 8
          </div>
          <div style={{ marginTop: 4, fontSize: 26, fontWeight: 500, color: FF.forest, letterSpacing: -0.4 }}>
            Good morning, <span className="serif-i">Lily</span>
          </div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: FF.forest, color: '#fff',
          display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 600 }}>L</div>
      </div>

      {/* Hero ring card */}
      <div style={{ margin: '0 16px', borderRadius: 28, background: '#fff',
        border: `1px solid ${FF.line}`, padding: '24px 18px 20px',
        display:'flex', flexDirection:'column', alignItems:'center', gap: 18 }}>
        <CalorieRing consumed={consumed} target={profile.target} />

        <div style={{ display:'flex', width:'100%', justifyContent:'space-around', borderTop:`1px solid ${FF.line}`,
          paddingTop: 14, marginTop: 4 }}>
          <Stat label="Eaten" value={consumed} unit="kcal" />
          <Stat label="Goal" value={profile.target} unit="kcal" pill />
          <Stat label="Burned" value={312} unit="kcal" />
        </div>
      </div>

      {/* Macro card */}
      <div style={{ margin: '14px 16px 0' }}>
        <Card pad={18}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: FF.forest }}>Macros</span>
            <span style={{ fontSize: 11, color: FF.muted, letterSpacing: 0.3 }}>Updated 2 min ago</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 18 }}>
            <MacroBar label="Protein"  value={macros.p}  target={targetP}  color={FF.ember}/>
            <MacroBar label="Carbs"    value={macros.c}  target={targetC}  color={FF.amber}/>
            <MacroBar label="Fat"      value={macros.f}  target={targetF}  color={FF.forest}/>
            <MacroBar label="Fiber"    value={macros.fi} target={targetFi} color={FF.ice} />
          </div>
        </Card>
      </div>

      {/* Today's meals */}
      <div style={{ margin: '20px 16px 0' }}>
        <SectionLabel right={<span style={{ fontSize: 12, color: FF.muted }}><span className="mono">{log.length}</span> items today</span>}>
          Today's meals
        </SectionLabel>
        <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
          {slots.map(s => {
            const meals = log.filter(m => m.slot === s.key);
            const slotKcal = meals.reduce((a, m) => a + m.kcal, 0);
            return (
              <Card key={s.key} pad={0}>
                <div style={{ padding: '14px 16px', display:'flex', alignItems:'center', gap: 12,
                  borderBottom: meals.length ? `1px solid ${FF.line}` : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10,
                    background: 'rgba(70,78,71,0.07)', color: FF.forest,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name={s.icon} size={17} color={FF.forest}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: FF.forest }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: FF.muted, letterSpacing: 0.2 }}>{s.time} · {meals.length === 0 ? 'nothing yet' : `${meals.length} ${meals.length === 1 ? 'item' : 'items'}`}</div>
                  </div>
                  {meals.length > 0 ? (
                    <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: FF.forest }}>
                      {slotKcal} <span style={{ color: FF.muted }}>kcal</span>
                    </span>
                  ) : (
                    <button onClick={() => onAdd(s.key)} style={{
                      background:'transparent', border:`1px solid ${FF.line}`, borderRadius: 999,
                      padding: '6px 12px', fontSize: 12, color: FF.forest, display:'flex',
                      alignItems:'center', gap: 4,
                    }}>
                      <Icon name="plus-s" size={12}/> Add
                    </button>
                  )}
                </div>
                {meals.map(m => (
                  <button key={m.id} onClick={() => onEditMeal(m)} style={{
                    width:'100%', padding: '10px 16px 10px 60px', display:'flex',
                    justifyContent:'space-between', alignItems:'center', background:'transparent',
                    border: 'none', borderTop: `1px dashed ${FF.line}`, textAlign:'left',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: FF.forest, fontWeight: 500 }}>{m.name}</div>
                      <div style={{ fontSize: 11.5, color: FF.muted, marginTop: 2 }}>
                        {m.serving} · <span className="mono">{m.macros.p}p · {m.macros.c}c · {m.macros.f}f</span>
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: 13, color: FF.forest, fontWeight: 500 }}>
                      {m.kcal} <span style={{ color: FF.muted }}>kcal</span>
                    </span>
                  </button>
                ))}
              </Card>
            );
          })}
        </div>
      </div>

      <div style={{ height: 24 }}/>
    </div>
  );
}

const Stat = ({ label, value, unit, pill }) => (
  <div style={{ textAlign:'center' }}>
    <div style={{ fontSize: 10.5, letterSpacing: 1.2, textTransform:'uppercase', color: FF.muted, fontWeight: 600 }}>{label}</div>
    <div style={{ marginTop: 4, display:'inline-flex', alignItems:'baseline', gap: 4,
      padding: pill ? '2px 10px' : 0, borderRadius: pill ? 999 : 0, background: pill ? 'rgba(246,174,45,0.18)' : 'transparent' }}>
      <span className="mono" style={{ fontSize: 16, fontWeight: 500, color: FF.forest }}>{value.toLocaleString()}</span>
      <span style={{ fontSize: 11, color: FF.muted }}>{unit}</span>
    </div>
  </div>
);

// Edit/delete sheet for a logged meal
function MealEditSheet({ meal, onClose, onDelete }) {
  if (!meal) return null;
  return (
    <div style={{ position:'absolute', inset: 0, zIndex: 50 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }}/>
      <div style={{ position:'absolute', left:0, right:0, bottom: 0, background: FF.paper,
        borderRadius: '24px 24px 0 0', padding: '12px 20px 28px',
        boxShadow:'0 -8px 30px rgba(0,0,0,0.2)', animation:'slideUp .25s ease-out' }}>
        <div style={{ width: 40, height: 4, background:'rgba(0,0,0,0.15)', borderRadius: 2,
          margin:'4px auto 14px' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>{meal.slot}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: FF.forest, marginTop: 2, letterSpacing: -0.3 }}>{meal.name}</div>
            <div style={{ fontSize: 13, color: FF.muted, marginTop: 4 }}>{meal.serving}</div>
          </div>
          <span className="mono" style={{ fontSize: 22, fontWeight: 500, color: FF.forest }}>{meal.kcal}<span style={{ fontSize: 12, color: FF.muted, marginLeft: 4 }}>kcal</span></span>
        </div>
        <div style={{ marginTop: 18, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 8 }}>
          {[['Protein', meal.macros.p, FF.ember],['Carbs', meal.macros.c, FF.amber],['Fat', meal.macros.f, FF.forest],['Fiber', meal.macros.fi, FF.ice]]
            .map(([l, v, c]) => (
            <div key={l} style={{ background:'#fff', borderRadius: 12, padding: 10, border:`1px solid ${FF.line}` }}>
              <div style={{ height: 4, borderRadius: 2, background: c, width: 24, marginBottom: 8 }}/>
              <div className="mono" style={{ fontSize: 14, fontWeight: 500, color: FF.forest }}>{v}<span style={{ fontSize: 10, color: FF.muted }}>g</span></div>
              <div style={{ fontSize: 10.5, color: FF.muted, letterSpacing: 0.3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, display:'flex', gap: 10 }}>
          <Btn kind="ghost" full icon="edit" onClick={onClose}>Edit</Btn>
          <Btn kind="ghost" full icon="trash" onClick={() => { onDelete(meal.id); onClose(); }} style={{ color: FF.ember, borderColor: 'rgba(255,74,28,0.3)' }}>Delete</Btn>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40%); opacity:0 } to { transform: none; opacity:1 } }`}</style>
    </div>
  );
}

Object.assign(window, { Dashboard, MealEditSheet });
