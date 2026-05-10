// Progress screen — weight chart, intake bars, projected goal
function Progress({ profile }) {
  const [view, setView] = React.useState('weight'); // weight | intake
  const [range, setRange] = React.useState('30d');
  const [weightEntryOpen, setWeightEntryOpen] = React.useState(false);

  // sample data — 30 daily points
  const weightSeries = React.useMemo(() => {
    const start = profile.weightKg + 1.2;
    const end = profile.weightKg - 1.4;
    const n = 30;
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      const noise = Math.sin(i * 0.7) * 0.4 + (i % 5 === 0 ? 0.2 : 0);
      return +(start + (end - start) * t + noise).toFixed(1);
    });
  }, [profile.weightKg]);

  const intakeSeries = React.useMemo(() => (
    Array.from({ length: 30 }, (_, i) => {
      const variance = Math.sin(i * 0.9) * 200 + Math.cos(i * 1.3) * 120;
      return Math.round(profile.target + variance + (i % 7 === 6 ? 350 : 0));
    })
  ), [profile.target]);

  const days = range === '7d' ? 7 : 30;
  const weightSlice = weightSeries.slice(-days);
  const intakeSlice = intakeSeries.slice(-days);

  const avgIntake = Math.round(intakeSlice.reduce((a, b) => a + b, 0) / intakeSlice.length);
  const deficit = profile.target - avgIntake;
  const weeklyDelta = -deficit * 7 / 7700; // kg/week
  const weeksToGoal = (profile.weightKg - profile.goalKg) / Math.max(0.05, -weeklyDelta);
  const projDate = new Date(Date.now() + weeksToGoal * 7 * 86400000);

  return (
    <div style={{ background: FF.sage, minHeight: '100%', paddingBottom: 14 }}>
      <div style={{ padding: '8px 22px 14px' }}>
        <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>Last {days} days</div>
        <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 500, color: FF.forest, letterSpacing: -0.4 }}>Your progress</h1>
      </div>

      {/* range pills */}
      <div style={{ padding:'0 16px 12px' }}>
        <Pills full value={range} onChange={setRange} items={[
          { value:'7d', label:'7 days' }, { value:'30d', label:'30 days' }
        ]}/>
      </div>

      {/* segmented: weight / intake */}
      <div style={{ padding:'0 16px 14px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
          <button onClick={() => setView('weight')} style={tabCardStyle(view === 'weight')}>
            <span style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>Weight</span>
            <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: FF.forest, marginTop: 4 }}>
              {weightSlice[weightSlice.length-1]}<span style={{ fontSize: 12, color: FF.muted, marginLeft: 3 }}>kg</span>
            </div>
            <div style={{ fontSize: 11.5, marginTop: 2,
              color: weightSlice[weightSlice.length-1] < weightSlice[0] ? FF.forest : FF.ember }}>
              {(weightSlice[weightSlice.length-1] - weightSlice[0]).toFixed(1)} kg in {days} d
            </div>
          </button>
          <button onClick={() => setView('intake')} style={tabCardStyle(view === 'intake')}>
            <span style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>Avg intake</span>
            <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: FF.forest, marginTop: 4 }}>
              {avgIntake.toLocaleString()}<span style={{ fontSize: 12, color: FF.muted, marginLeft: 3 }}>kcal</span>
            </div>
            <div style={{ fontSize: 11.5, marginTop: 2, color: deficit > 0 ? FF.forest : FF.ember }}>
              {deficit > 0 ? `${deficit} under target` : `${-deficit} over target`}
            </div>
          </button>
        </div>
      </div>

      {/* chart */}
      <div style={{ padding:'0 16px' }}>
        <Card pad={16}>
          {view === 'weight' ? (
            <WeightChart series={weightSlice} target={profile.goalKg}/>
          ) : (
            <IntakeChart series={intakeSlice} target={profile.target}/>
          )}
        </Card>
      </div>

      {/* avg macros */}
      <div style={{ padding:'18px 16px 0' }}>
        <SectionLabel>Average macros · {days} d</SectionLabel>
        <Card pad={16}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
            <MacroBar label="Protein" value={118} target={profile.macroSplit ? Math.round(profile.target*profile.macroSplit.p/100/4) : 130} color={FF.ember}/>
            <MacroBar label="Carbs"   value={224} target={profile.macroSplit ? Math.round(profile.target*profile.macroSplit.c/100/4) : 230} color={FF.amber}/>
            <MacroBar label="Fat"     value={62}  target={profile.macroSplit ? Math.round(profile.target*profile.macroSplit.f/100/9) : 70}  color={FF.forest}/>
            <MacroBar label="Fiber"   value={24}  target={30} color={FF.ice}/>
          </div>
        </Card>
      </div>

      {/* projected goal */}
      <div style={{ padding:'18px 16px 0' }}>
        <Card pad={18} style={{ background: FF.forest, color:'#fff', border:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 1.2, opacity: 0.6, textTransform:'uppercase', fontWeight: 600 }}>Projected goal</div>
              <div style={{ marginTop: 6, fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>
                <span className="serif-i" style={{ color: FF.ice }}>around</span>{' '}
                {Number.isFinite(weeksToGoal) && weeksToGoal > 0
                  ? projDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Adjust targets'}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                At your current avg deficit of <span className="mono">{Math.round(Math.max(0, deficit))} kcal/day</span>
                {Number.isFinite(weeksToGoal) && weeksToGoal > 0 && (
                  <> · {(-weeklyDelta).toFixed(2)} kg / week</>
                )}
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(181,248,254,0.18)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name="target" size={22} color={FF.ice}/>
            </div>
          </div>
        </Card>
      </div>

      {/* manual weight entry */}
      <div style={{ padding:'14px 16px 24px' }}>
        <Btn kind="ghost" full icon="scale" onClick={() => setWeightEntryOpen(true)}>Log today's weight</Btn>
      </div>

      {weightEntryOpen && <WeightEntrySheet profile={profile} onClose={() => setWeightEntryOpen(false)}/>}
    </div>
  );
}

function WeightEntrySheet({ profile, onClose }) {
  const [w, setW] = React.useState(profile.weightKg);
  return (
    <div style={{ position:'absolute', inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }}/>
      <div style={{ position:'absolute', left:0, right:0, bottom: 0, background: FF.paper,
        borderRadius: '24px 24px 0 0', padding: '12px 20px 28px',
        boxShadow:'0 -8px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ width: 40, height: 4, background:'rgba(0,0,0,0.15)', borderRadius: 2, margin:'4px auto 14px' }}/>
        <div style={{ fontSize: 11, letterSpacing: 1.2, color: FF.muted, textTransform:'uppercase', fontWeight: 600 }}>Today's weight</div>
        <div style={{ marginTop: 8 }}>
          <BigNumber value={w} onChange={setW} unit="kg" min={35} max={200} step={0.1}/>
        </div>
        <div style={{ display:'flex', gap: 10, marginTop: 16 }}>
          <Btn kind="ghost" full onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" full icon="check" onClick={onClose}>Save</Btn>
        </div>
      </div>
    </div>
  );
}

const tabCardStyle = (active) => ({
  padding: '14px 16px', borderRadius: 18, textAlign:'left',
  background: active ? '#fff' : 'transparent',
  border: `1.5px solid ${active ? FF.forest : FF.line}`,
  cursor: 'pointer',
});

// Line chart — weight
function WeightChart({ series, target }) {
  const w = 320, h = 160, pad = { l: 8, r: 8, t: 16, b: 22 };
  const min = Math.min(...series, target) - 0.5;
  const max = Math.max(...series, target) + 0.5;
  const x = i => pad.l + (i / (series.length - 1)) * (w - pad.l - pad.r);
  const y = v => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const path = series.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const area = `${path} L ${x(series.length-1)} ${h - pad.b} L ${x(0)} ${h - pad.b} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display:'block' }}>
        {/* horizontal grid */}
        {[0, 0.5, 1].map(t => {
          const yy = pad.t + t * (h - pad.t - pad.b);
          return <line key={t} x1={pad.l} x2={w-pad.r} y1={yy} y2={yy} stroke={FF.line} strokeDasharray="2 4"/>;
        })}
        {/* goal line */}
        <line x1={pad.l} x2={w-pad.r} y1={y(target)} y2={y(target)} stroke={FF.amber} strokeDasharray="3 3" strokeWidth="1.5"/>
        <text x={w-pad.r} y={y(target) - 4} fontSize="9" fill={FF.amber} textAnchor="end" fontFamily="Geist Mono">goal {target}</text>

        {/* area */}
        <path d={area} fill="rgba(70,78,71,0.07)"/>
        <path d={path} fill="none" stroke={FF.forest} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        {/* end dot */}
        <circle cx={x(series.length-1)} cy={y(series[series.length-1])} r="4.5" fill={FF.ember} stroke="#fff" strokeWidth="2"/>

        {/* x labels */}
        {[0, Math.floor(series.length/2), series.length-1].map(i => (
          <text key={i} x={x(i)} y={h - 6} fontSize="9" fill={FF.muted} textAnchor="middle" fontFamily="Geist Mono">
            {`d-${series.length - 1 - i}`}
          </text>
        ))}
      </svg>
    </div>
  );
}

// Bar chart — daily intake vs target
function IntakeChart({ series, target }) {
  const w = 320, h = 160, pad = { l: 8, r: 8, t: 14, b: 22 };
  const max = Math.max(...series, target) * 1.05;
  const bw = (w - pad.l - pad.r) / series.length;
  const y = v => pad.t + (1 - v / max) * (h - pad.t - pad.b);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display:'block' }}>
      {series.map((v, i) => {
        const over = v > target;
        const bx = pad.l + i * bw + 1;
        return (
          <rect key={i} x={bx} y={y(v)} width={bw - 2} height={h - pad.b - y(v)}
            rx="2" fill={over ? FF.ember : FF.forest} opacity={over ? 1 : 0.85}/>
        );
      })}
      {/* target line */}
      <line x1={pad.l} x2={w-pad.r} y1={y(target)} y2={y(target)} stroke={FF.amber} strokeDasharray="3 3" strokeWidth="1.5"/>
      <text x={w-pad.r} y={y(target) - 4} fontSize="9" fill={FF.amber} textAnchor="end" fontFamily="Geist Mono">target {target}</text>

      {[0, Math.floor(series.length/2), series.length-1].map(i => (
        <text key={i} x={pad.l + i*bw + bw/2} y={h - 6} fontSize="9" fill={FF.muted} textAnchor="middle" fontFamily="Geist Mono">
          {`d-${series.length - 1 - i}`}
        </text>
      ))}
    </svg>
  );
}

Object.assign(window, { Progress });
