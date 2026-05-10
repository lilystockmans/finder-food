// Onboarding flow — multi-step
function Onboarding({ onDone }) {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    units: 'metric',
    sex: null,
    age: 28,
    heightCm: 173,
    weightKg: 78,
    goalKg: 72,
    activity: null,
  });
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const steps = ['welcome','sex','age','height','weight','goal','activity','summary'];
  const stepIdx = step;
  const isLast = step === steps.length - 1;

  // BMR (Mifflin–St Jeor) + activity
  const bmr = data.sex === 'female'
    ? 10*data.weightKg + 6.25*data.heightCm - 5*data.age - 161
    : 10*data.weightKg + 6.25*data.heightCm - 5*data.age + 5;
  const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  const tdee = bmr * (factors[data.activity] || 1.4);
  const deficit = data.goalKg < data.weightKg ? -500 : data.goalKg > data.weightKg ? 300 : 0;
  const target = Math.round((tdee + deficit) / 10) * 10;

  const [macroSplit, setMacroSplit] = React.useState({ p: 30, c: 40, f: 30 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: FF.sage }}>
      {/* progress + back */}
      <div style={{ padding: '12px 20px 6px', display:'flex', alignItems:'center', gap: 12 }}>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : null} style={{
          background:'transparent', border:'none', padding: 6, opacity: step > 0 ? 1 : 0.3,
          color: FF.forest,
        }}>
          <Icon name="arrow-l" size={22}/>
        </button>
        <div style={{ flex: 1, height: 4, background: 'rgba(70,78,71,0.12)', borderRadius: 2, overflow:'hidden' }}>
          <div style={{ width: `${((stepIdx+1)/steps.length)*100}%`, height: '100%',
            background: FF.forest, transition: 'width .35s' }}/>
        </div>
        <span className="mono" style={{ fontSize: 12, color: FF.muted, minWidth: 28, textAlign:'right' }}>
          {String(stepIdx+1).padStart(2,'0')}/{steps.length}
        </span>
      </div>

      <div style={{ flex: 1, padding: '8px 24px 24px', overflow:'auto' }} className="scroll">
        {step === 0 && <Welcome data={data} set={set} />}
        {step === 1 && <SexStep data={data} set={set} />}
        {step === 2 && <AgeStep data={data} set={set} />}
        {step === 3 && <HeightStep data={data} set={set} />}
        {step === 4 && <WeightStep data={data} set={set} field="weightKg" title="Current weight" subtitle="Where are you today?" />}
        {step === 5 && <WeightStep data={data} set={set} field="goalKg" title="Goal weight" subtitle="Where you'd like to land." />}
        {step === 6 && <ActivityStep data={data} set={set} />}
        {step === 7 && <SummaryStep data={data} target={target} macroSplit={macroSplit} setMacroSplit={setMacroSplit}/>}
      </div>

      <div style={{ padding: '12px 24px 20px', background: FF.sage }}>
        <Btn kind={isLast ? 'primary' : 'forest'} full
          onClick={() => isLast ? onDone({ ...data, target, macroSplit }) : setStep(s => s + 1)}
          disabled={ (step === 1 && !data.sex) || (step === 6 && !data.activity) }
          icon={isLast ? 'check' : null}>
          {isLast ? 'Start tracking' : 'Continue'}
        </Btn>
      </div>
      <FFNavPill bg={FF.sage}/>
    </div>
  );
}

const StepHeader = ({ kicker, title, sub }) => (
  <div style={{ marginTop: 14, marginBottom: 28 }}>
    {kicker && <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform:'uppercase', color: FF.muted, fontWeight: 600, marginBottom: 12 }}>{kicker}</div>}
    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 500, lineHeight: 1.1, color: FF.forest, letterSpacing: -0.5 }}>{title}</h1>
    {sub && <p style={{ margin: '12px 0 0', color: FF.muted, fontSize: 15, lineHeight: 1.45 }}>{sub}</p>}
  </div>
);

// Welcome / units
function Welcome({ data, set }) {
  return (
    <div>
      <div style={{ marginTop: 18, display:'flex', alignItems:'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: FF.forest, color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="leaf" size={20}/>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: FF.forest, letterSpacing: 0.5 }}>finder food</div>
          <div style={{ fontSize: 11, color: FF.muted }}>v 1.0</div>
        </div>
      </div>
      <StepHeader title={<>Find your food.<br/><span className="serif-i" style={{ color: FF.ember }}>then own it.</span></>}
        sub="A few quick questions to set your daily target. Takes about 30 seconds."/>
      <SectionLabel>Units</SectionLabel>
      <div style={{ display:'flex', gap: 10 }}>
        {[['metric','Metric','kg · cm'], ['imperial','Imperial','lb · ft']].map(([v,l,d]) => (
          <button key={v} onClick={() => set('units', v)} style={{
            flex: 1, padding: '18px 16px', borderRadius: 18, textAlign:'left',
            border: `1.5px solid ${data.units === v ? FF.forest : FF.line}`,
            background: data.units === v ? '#fff' : 'transparent', color: FF.forest,
          }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: 12, color: FF.muted, marginTop: 2 }}>{d}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SexStep({ data, set }) {
  const opts = [
    { v: 'female', l: 'Female' },
    { v: 'male',   l: 'Male' },
    { v: 'other',  l: 'Prefer not to say' },
  ];
  return (
    <div>
      <StepHeader kicker="01 · Biology" title="Tell us your sex" sub="Used to estimate your basal metabolic rate. We don't share this." />
      <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
        {opts.map(o => {
          const sel = data.sex === o.v;
          return (
            <button key={o.v} onClick={() => set('sex', o.v)} style={{
              padding: '20px 22px', borderRadius: 18,
              border: `1.5px solid ${sel ? FF.forest : FF.line}`,
              background: sel ? FF.forest : 'transparent',
              color: sel ? '#fff' : FF.forest, fontSize: 16, fontWeight: 500, textAlign:'left',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>{o.l}{sel && <Icon name="check" size={20} color="#fff"/>}</button>
          );
        })}
      </div>
    </div>
  );
}

function AgeStep({ data, set }) {
  return (
    <div>
      <StepHeader kicker="02 · Age" title="How old are you?" sub="Affects your daily calorie needs."/>
      <BigNumber value={data.age} onChange={v => set('age', Math.max(13, Math.min(99, v)))} unit="years" min={13} max={99}/>
    </div>
  );
}

function HeightStep({ data, set }) {
  return (
    <div>
      <StepHeader kicker="03 · Height" title="Stand up, please" />
      <BigNumber value={data.heightCm} onChange={v => set('heightCm', v)} unit={data.units === 'metric' ? 'cm' : 'cm'} min={120} max={220}/>
      <div style={{ marginTop: 24 }}>
        <Slider value={data.heightCm} onChange={v => set('heightCm', v)} min={140} max={210}/>
      </div>
    </div>
  );
}

function WeightStep({ data, set, field, title, subtitle }) {
  return (
    <div>
      <StepHeader kicker={field === 'weightKg' ? '04 · Current' : '05 · Goal'} title={title} sub={subtitle}/>
      <BigNumber value={data[field]} onChange={v => set(field, v)} unit="kg" min={35} max={200} step={0.5}/>
      <div style={{ marginTop: 24 }}>
        <Slider value={data[field]} onChange={v => set(field, v)} min={45} max={140} step={0.5}/>
      </div>
      {field === 'goalKg' && (
        <div style={{ marginTop: 22, padding: '14px 16px', background: 'rgba(181,248,254,0.4)',
          border: `1px solid ${FF.line}`, borderRadius: 14, display:'flex', alignItems:'center', gap: 12 }}>
          <Icon name="target" size={20} color={FF.forest}/>
          <div style={{ fontSize: 13, color: FF.forest }}>
            {data.goalKg < data.weightKg ? `Lose ${(data.weightKg - data.goalKg).toFixed(1)} kg` :
             data.goalKg > data.weightKg ? `Gain ${(data.goalKg - data.weightKg).toFixed(1)} kg` :
             'Maintain weight'}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityStep({ data, set }) {
  const opts = [
    { v: 'sedentary', l: 'Sedentary',     d: 'Desk job, little exercise' },
    { v: 'light',     l: 'Lightly active', d: 'Walks · 1–3 workouts / week' },
    { v: 'moderate',  l: 'Active',        d: '3–5 workouts / week' },
    { v: 'active',    l: 'Very active',   d: 'Daily training or physical job' },
  ];
  return (
    <div>
      <StepHeader kicker="06 · Activity" title="How active are you?" sub="Average across a normal week."/>
      <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
        {opts.map(o => {
          const sel = data.activity === o.v;
          return (
            <button key={o.v} onClick={() => set('activity', o.v)} style={{
              padding: '16px 20px', borderRadius: 18,
              border: `1.5px solid ${sel ? FF.forest : FF.line}`,
              background: sel ? '#fff' : 'transparent',
              textAlign:'left', display:'flex', alignItems:'center', gap: 14,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%',
                background: sel ? FF.ember : 'rgba(70,78,71,0.2)', flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: FF.forest }}>{o.l}</div>
                <div style={{ fontSize: 12.5, color: FF.muted, marginTop: 2 }}>{o.d}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryStep({ data, target, macroSplit, setMacroSplit }) {
  const proteinG = Math.round((target * macroSplit.p / 100) / 4);
  const carbG    = Math.round((target * macroSplit.c / 100) / 4);
  const fatG     = Math.round((target * macroSplit.f / 100) / 9);

  // adjust split — drag a macro up, others rebalance proportionally
  const adjust = (key, val) => {
    val = Math.max(10, Math.min(60, val));
    const rest = 100 - val;
    const others = Object.keys(macroSplit).filter(k => k !== key);
    const sumOthers = others.reduce((a, k) => a + macroSplit[k], 0) || 1;
    const next = { [key]: val };
    others.forEach(k => { next[k] = Math.round(rest * (macroSplit[k] / sumOthers)); });
    // fix rounding
    const total = Object.values(next).reduce((a,b)=>a+b,0);
    next[others[0]] += 100 - total;
    setMacroSplit(next);
  };

  const macros = [
    { k: 'p', l: 'Protein', g: proteinG, color: FF.ember },
    { k: 'c', l: 'Carbs',   g: carbG,    color: FF.amber },
    { k: 'f', l: 'Fat',     g: fatG,     color: FF.forest },
  ];

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform:'uppercase', color: FF.muted, fontWeight: 600, marginTop: 14 }}>Your daily plan</div>
      <h1 style={{ margin: '12px 0 0', fontSize: 28, fontWeight: 500, color: FF.forest, lineHeight: 1.15, letterSpacing: -0.4 }}>
        Eat <span className="serif-i" style={{ color: FF.ember }}>around</span><br/>
        <span className="mono" style={{ fontSize: 56, fontWeight: 500, lineHeight: 1, letterSpacing: -2 }}>{target.toLocaleString()}</span>
        <span style={{ fontSize: 22, color: FF.muted, marginLeft: 8 }}>kcal / day</span>
      </h1>

      {/* split bar */}
      <div style={{ marginTop: 26, height: 18, borderRadius: 999, overflow:'hidden', display:'flex',
        border: `1px solid ${FF.line}` }}>
        {macros.map(m => (
          <div key={m.k} style={{ flex: macroSplit[m.k], background: m.color, transition: 'flex .3s' }}/>
        ))}
      </div>

      <div style={{ marginTop: 18, display:'flex', flexDirection:'column', gap: 14 }}>
        {macros.map(m => (
          <div key={m.k} style={{ background:'#fff', border:`1px solid ${FF.line}`, borderRadius: 16, padding: '12px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: m.color }}/>
                <span style={{ fontSize: 14, fontWeight: 500, color: FF.forest }}>{m.l}</span>
              </div>
              <div className="mono" style={{ fontSize: 13, color: FF.forest }}>
                <strong style={{ fontWeight: 600 }}>{macroSplit[m.k]}%</strong>
                <span style={{ color: FF.muted }}> · {m.g} g</span>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <Slider value={macroSplit[m.k]} onChange={v => adjust(m.k, v)} min={10} max={60} thin/>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, display:'flex', alignItems:'center', gap: 10, color: FF.muted, fontSize: 12 }}>
        <Icon name="spark" size={16} color={FF.muted}/>
        <span>You can change all of this later in Settings.</span>
      </div>
    </div>
  );
}

// ─── reusable sub-controls ─────────────────────────────────────
function BigNumber({ value, onChange, unit, min = 0, max = 999, step = 1 }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const inputRef = React.useRef(null);

  const begin = () => {
    setDraft(String(Number.isInteger(value) ? value : value.toFixed(2).replace(/\.?0+$/,'')));
    setEditing(true);
  };
  React.useEffect(() => { if (editing) inputRef.current?.focus(); inputRef.current?.select(); }, [editing]);
  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
    setEditing(false);
  };
  const display = Number.isInteger(value) ? value : value.toFixed(1);

  // dynamic font size so long numbers don't overflow
  const fontSize = String(display).length >= 5 ? 56 : String(display).length === 4 ? 64 : 76;

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: 12,
      padding: '20px 0' }}>
      <button onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min}
        style={circleBtn}><Icon name="minus" size={22}/></button>
      <div onClick={begin} style={{ display:'flex', alignItems:'baseline', gap: 8, cursor:'text',
        position: 'relative', borderBottom: editing ? `2px solid ${FF.ember}` : '2px solid transparent',
        paddingBottom: 2 }}>
        {editing ? (
          <input ref={inputRef} className="mono" inputMode="decimal" type="number"
            value={draft} onChange={e => setDraft(e.target.value)}
            onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            style={{
              width: `${Math.max(2, draft.length) * 0.62}em`, minWidth: 80,
              fontSize, fontWeight: 500, color: FF.forest, lineHeight: 1, letterSpacing: -3,
              border: 'none', outline: 'none', background: 'transparent', padding: 0,
              fontFamily: 'Geist Mono, monospace', textAlign: 'center',
            }}/>
        ) : (
          <span className="mono" style={{ fontSize, fontWeight: 500, color: FF.forest, lineHeight: 1, letterSpacing: -3 }}>
            {display}
          </span>
        )}
        <span style={{ fontSize: 16, color: FF.muted }}>{unit}</span>
      </div>
      <button onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max}
        style={circleBtn}><Icon name="plus" size={22}/></button>
    </div>
  );
}
const circleBtn = {
  width: 48, height: 48, borderRadius: '50%', border:`1.5px solid ${FF.line}`,
  background:'#fff', color: FF.forest, display:'flex', alignItems:'center', justifyContent:'center',
};

function Slider({ value, onChange, min = 0, max = 100, step = 1, thin }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position:'relative', height: thin ? 18 : 28 }}>
      <div style={{ position:'absolute', left: 0, right: 0, top: '50%', height: thin ? 4 : 6,
        marginTop: thin ? -2 : -3, background:'rgba(70,78,71,0.12)', borderRadius: 4 }}/>
      <div style={{ position:'absolute', left: 0, top:'50%', height: thin ? 4 : 6,
        marginTop: thin ? -2 : -3, width: `${pct}%`, background: FF.forest, borderRadius: 4 }}/>
      <div style={{ position:'absolute', left: `calc(${pct}% - ${thin?8:11}px)`, top:'50%',
        marginTop: thin ? -8 : -11, width: thin ? 16 : 22, height: thin ? 16 : 22,
        borderRadius:'50%', background:'#fff', border:`2px solid ${FF.forest}`,
        boxShadow:'0 2px 6px rgba(0,0,0,0.1)' }}/>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ position:'absolute', inset: 0, opacity: 0, width:'100%', height:'100%', cursor:'pointer' }}/>
    </div>
  );
}

Object.assign(window, { Onboarding });
