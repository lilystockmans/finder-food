// Shared UI primitives for finder food
// Stroke-based iconography drawn with SVG paths only — no decorative SVGs.

const FF = {
  forest: '#464e47',
  forest2: '#2f352f',
  ice: '#b5f8fe',
  ember: '#ff4a1c',
  amber: '#f6ae2d',
  sage: '#e8ede8',
  paper: '#f4f6f3',
  ink: '#1a1f1a',
  muted: '#7a847a',
  line: 'rgba(70,78,71,0.14)',
};

// ─── Icons (24px stroke set) ──────────────────────────────────────
const Icon = ({ name, size = 22, color = 'currentColor', sw = 1.6 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home':       return <svg {...p}><path d="M3.5 11 12 4l8.5 7"/><path d="M5 10v9h5v-6h4v6h5v-9"/></svg>;
    case 'plus':       return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'chart':      return <svg {...p}><path d="M3 20h18"/><path d="M6 16V9M11 16v-3M16 16V6M21 16v-9"/></svg>;
    case 'user':       return <svg {...p}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.5 4-5 7-5s6.2 1.5 7 5"/></svg>;
    case 'arrow-r':    return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-l':    return <svg {...p}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>;
    case 'check':      return <svg {...p}><path d="M5 12.5 10 17l9-10"/></svg>;
    case 'x':          return <svg {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'camera':     return <svg {...p}><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>;
    case 'barcode':    return <svg {...p}><path d="M4 6v12M7 6v12M10 6v12M13 6v12M16 6v12M19 6v12" strokeWidth={sw*0.9}/></svg>;
    case 'search':     return <svg {...p}><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/></svg>;
    case 'bookmark':   return <svg {...p}><path d="M6 4h12v17l-6-4-6 4z"/></svg>;
    case 'clock':      return <svg {...p}><circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.5"/></svg>;
    case 'edit':       return <svg {...p}><path d="m4 20 4-1 11-11-3-3L5 16l-1 4z"/></svg>;
    case 'trash':      return <svg {...p}><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13"/></svg>;
    case 'warn':       return <svg {...p}><path d="M12 4 2 20h20z"/><path d="M12 10v5M12 17.5v.2"/></svg>;
    case 'spark':      return <svg {...p}><path d="M12 4v3M12 17v3M4 12h3M17 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/></svg>;
    case 'flame':      return <svg {...p}><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4-1 3 1 4 2 4 0-3 0-6 1-10z"/></svg>;
    case 'scale':      return <svg {...p}><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M9 6V4h6v2M8 12h8"/></svg>;
    case 'minus':      return <svg {...p}><path d="M6 12h12"/></svg>;
    case 'chev-d':     return <svg {...p}><path d="m6 9 6 6 6-6"/></svg>;
    case 'chev-r':     return <svg {...p}><path d="m9 6 6 6-6 6"/></svg>;
    case 'dot':        return <svg {...p}><circle cx="12" cy="12" r="2.5" fill={color}/></svg>;
    case 'leaf':       return <svg {...p}><path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z"/><path d="M5 19c2-5 5-8 10-10"/></svg>;
    case 'calendar':   return <svg {...p}><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4M16 4v4M4 11h16"/></svg>;
    case 'target':     return <svg {...p}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill={color}/></svg>;
    case 'settings':   return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" strokeWidth={sw*0.7}/></svg>;
    case 'bolt':       return <svg {...p}><path d="M13 3 5 13h6l-1 8 8-10h-6z"/></svg>;
    case 'plus-s':     return <svg {...p} viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" strokeWidth={1.8}/></svg>;
    default: return null;
  }
};

// ─── Status bar (custom for sage bg) ──────────────────────────────
function FFStatusBar({ bg = FF.sage }) {
  return (
    <div style={{
      height: 38, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 18px 0 22px',
      position: 'relative', background: bg, color: FF.ink,
      fontFamily: 'Geist, sans-serif',
    }}>
      <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: 0.2 }}>9:41</span>
      <div style={{
        position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)',
        width: 22, height: 22, borderRadius: 100, background: '#1a1f1a',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="15" height="15" viewBox="0 0 16 16"><path d="M8 13.3L.67 5.97a10.37 10.37 0 0114.66 0L8 13.3z" fill={FF.ink}/></svg>
        <svg width="15" height="15" viewBox="0 0 16 16"><path d="M14.67 14.67V1.33L1.33 14.67h13.34z" fill={FF.ink}/></svg>
        <svg width="22" height="12" viewBox="0 0 22 12"><rect x="0.5" y="0.5" width="18" height="11" rx="2.5" fill="none" stroke={FF.ink}/><rect x="2" y="2" width="13" height="8" rx="1" fill={FF.ink}/><rect x="19.5" y="4" width="2" height="4" rx="0.5" fill={FF.ink}/></svg>
      </div>
    </div>
  );
}

// ─── Gesture nav ─────────────────────────────────────────────────
function FFNavPill({ bg = FF.sage }) {
  return (
    <div style={{ height: 22, display:'flex', alignItems:'center', justifyContent:'center', background: bg }}>
      <div style={{ width: 120, height: 4, borderRadius: 2, background: FF.ink, opacity: 0.55 }} />
    </div>
  );
}

// ─── Ring chart for calories ─────────────────────────────────────
function CalorieRing({ consumed, target, size = 196, stroke = 14 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(consumed / target, 1.05);
  const remaining = Math.max(target - consumed, 0);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(70,78,71,0.10)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={pct > 1 ? FF.ember : FF.forest} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c*pct} ${c}`}/>
        {/* tick at goal */}
        <circle cx={size/2 + r} cy={size/2} r={3} fill={FF.amber} transform={`rotate(0 ${size/2} ${size/2})`} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', textAlign:'center' }}>
        <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform:'uppercase', color: FF.muted, fontWeight: 500 }}>remaining</div>
        <div className="mono" style={{ fontSize: 44, fontWeight: 500, color: FF.forest, lineHeight: 1, marginTop: 4 }}>
          {remaining.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: FF.muted, marginTop: 6 }}>
          <span className="mono">{consumed.toLocaleString()}</span> of <span className="mono">{target.toLocaleString()}</span> kcal
        </div>
      </div>
    </div>
  );
}

// ─── Macro bar ───────────────────────────────────────────────────
function MacroBar({ label, value, target, color, unit = 'g' }) {
  const pct = Math.min(value / target, 1);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: FF.forest, letterSpacing: 0.2 }}>{label}</span>
        <span className="mono" style={{ fontSize: 12, color: FF.muted }}>
          <span style={{ color: FF.forest, fontWeight: 500 }}>{value}</span>/{target}{unit}
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(70,78,71,0.10)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct*100}%`, height: '100%', background: color, borderRadius: 6, transition: 'width .4s' }}/>
      </div>
    </div>
  );
}

// ─── Button ──────────────────────────────────────────────────────
function Btn({ kind = 'primary', children, onClick, icon, full, disabled, style = {} }) {
  const base = {
    height: 52, padding: '0 22px', borderRadius: 999, border: 'none',
    fontSize: 15, fontWeight: 500, letterSpacing: 0.1,
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
    width: full ? '100%' : 'auto', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform .06s, background .15s',
    opacity: disabled ? 0.4 : 1,
  };
  const variants = {
    primary: { background: FF.ember, color: '#fff' },
    forest:  { background: FF.forest, color: '#fff' },
    ghost:   { background: 'transparent', color: FF.forest, border: `1px solid ${FF.line}` },
    ice:     { background: FF.ice, color: FF.forest2 },
    text:    { background: 'transparent', color: FF.forest, padding: '0 12px', height: 40 },
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{ ...base, ...variants[kind], ...style }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(.98)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      onMouseLeave={e => e.currentTarget.style.transform = ''}>
      {icon && <Icon name={icon} size={18}/>}
      {children}
    </button>
  );
}

// ─── Card ────────────────────────────────────────────────────────
function Card({ children, style = {}, pad = 18, bg = '#fff', onClick }) {
  return (
    <div onClick={onClick} style={{
      background: bg, borderRadius: 20, padding: pad,
      border: `1px solid ${FF.line}`,
      ...style,
    }}>{children}</div>
  );
}

// ─── Tab pill row ────────────────────────────────────────────────
function Pills({ items, value, onChange, full }) {
  return (
    <div style={{
      display: 'inline-flex', background: 'rgba(70,78,71,0.08)',
      borderRadius: 999, padding: 4, gap: 2, width: full ? '100%' : 'auto',
    }}>
      {items.map(it => (
        <button key={it.value} onClick={() => onChange(it.value)} style={{
          flex: full ? 1 : 'initial',
          padding: '8px 16px', border: 'none', borderRadius: 999,
          background: value === it.value ? FF.forest : 'transparent',
          color: value === it.value ? '#fff' : FF.forest,
          fontSize: 13, fontWeight: 500, letterSpacing: 0.2,
          transition: 'background .15s, color .15s',
        }}>{it.label}</button>
      ))}
    </div>
  );
}

// ─── Bottom navigation (Forest filled bar) ───────────────────────
function BottomNav({ tab, setTab, onAdd }) {
  const item = (key, label, iconName) => {
    const active = tab === key;
    return (
      <button onClick={() => setTab(key)} style={{
        flex: 1, background: 'transparent', border:'none', display:'flex',
        flexDirection:'column', alignItems:'center', gap: 3, padding: '6px 0',
        color: active ? FF.ice : 'rgba(255,255,255,0.6)',
      }}>
        <Icon name={iconName} size={22} sw={active ? 1.9 : 1.5}/>
        <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 400, letterSpacing: 0.4 }}>{label}</span>
      </button>
    );
  };
  return (
    <div style={{
      position: 'relative', background: FF.forest2, color:'#fff',
      padding: '10px 14px 12px', display:'flex', alignItems:'center', gap: 6,
    }}>
      {item('home', 'Home', 'home')}
      {item('progress', 'Progress', 'chart')}
      <div style={{ width: 64, position:'relative' }}>
        <button onClick={onAdd} style={{
          position:'absolute', left: '50%', top: -34, transform:'translateX(-50%)',
          width: 60, height: 60, borderRadius: '50%', border:'4px solid #2f352f',
          background: FF.ember, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: '0 8px 22px -4px rgba(255,74,28,0.55)',
        }}>
          <Icon name="plus" size={28} sw={2.2}/>
        </button>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', textAlign:'center', marginTop: 30, letterSpacing: 0.4 }}>Log</div>
      </div>
      {item('saved', 'Saved', 'bookmark')}
      {item('me', 'Profile', 'user')}
    </div>
  );
}

// ─── Section header (small uppercase) ────────────────────────────
function SectionLabel({ children, right }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline',
      padding: '0 4px', marginBottom: 10 }}>
      <span style={{ fontSize: 11, letterSpacing: 1.4, textTransform:'uppercase',
        color: FF.muted, fontWeight: 600 }}>{children}</span>
      {right}
    </div>
  );
}

Object.assign(window, {
  FF, Icon, FFStatusBar, FFNavPill,
  CalorieRing, MacroBar, Btn, Card, Pills, BottomNav, SectionLabel,
});
