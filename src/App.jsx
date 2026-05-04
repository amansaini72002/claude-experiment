import { useState } from 'react'
import './App.css'

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}

function Laurel() {
  return (
    <svg width="20" height="34" viewBox="0 0 20 34" fill="none">
      <path d="M10 2 C6 6 2 10 2 16 C2 22 6 26 10 30" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M4 8 C2 10 1 13 2 16" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M3 14 C1 16 1 19 3 21" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M5 20 C3 22 4 25 6 27" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M4 8 C5 6 7 5 9 6" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M3 14 C4 12 7 11 9 12" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M5 20 C6 18 8 18 10 19" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M8 26 C8 24 9 22 10 21" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function GenloopMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M7 11 C7 8.8 8.8 7 11 7 C13.2 7 15 8.8 15 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M11 11 L13 13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

// Splits a hex color into separate R G B integers for use in rgba() CSS vars
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

const DEFAULTS = {
  global: { blur: 50, speed: 26 },
  blobs: [
    // size = vw multiplier (1.4 → 140vw diameter)
    { size: 1.4, top: 76, left: 50, xDrift: 60, yDrift: 40, intensity: 0.97, color: '#bae6fd' },
    { size: 1.1, top: 60, left: 44, xDrift: 50, yDrift: 33, intensity: 0.88, color: '#e0f2fe' },
    { size: 1.0, top: 90, left: 58, xDrift: 43, yDrift: 40, intensity: 0.70, color: '#7dd3fc' },
  ],
  noise: 0.03,
  noiseSize: 1024,
}

function Slider({ label, value, min, max, step, unit, onChange }) {
  const display = typeof value === 'number' && step < 1
    ? value.toFixed(String(step).split('.')[1]?.length ?? 0)
    : value
  return (
    <div className="ctrl-row">
      <span className="ctrl-label">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="ctrl-slider"
      />
      <span className="ctrl-value">{display}{unit}</span>
    </div>
  )
}

export default function App() {
  const [c, setC] = useState(DEFAULTS)
  const [open, setOpen] = useState(true)
  const [activeBlob, setActiveBlob] = useState(0)

  const setGlobal = (key, val) =>
    setC(prev => ({ ...prev, global: { ...prev.global, [key]: val } }))

  const setBlob = (i, key, val) =>
    setC(prev => {
      const blobs = [...prev.blobs]
      blobs[i] = { ...blobs[i], [key]: val }
      return { ...prev, blobs }
    })

  const setVal = (key, val) => setC(prev => ({ ...prev, [key]: val }))
  const reset = () => setC(DEFAULTS)

  // Build CSS custom properties — per-blob vars use --b1-*, --b2-*, --b3-*
  const cssVars = {
    '--blob-blur':     `${c.global.blur}px`,
    '--blob-speed':    `${c.global.speed}s`,
    '--noise-opacity': c.noise,
    '--noise-size':    `${c.noiseSize}px`,
  }
  c.blobs.forEach((b, i) => {
    const n = i + 1
    const [r, g, bv] = hexToRgb(b.color)
    Object.assign(cssVars, {
      [`--b${n}-size`]:      b.size,
      [`--b${n}-top`]:       `${b.top}%`,
      [`--b${n}-left`]:      `${b.left}%`,
      [`--b${n}-x-drift`]:   `${b.xDrift}px`,
      [`--b${n}-y-drift`]:   `${b.yDrift}px`,
      [`--b${n}-intensity`]: b.intensity,
      [`--b${n}-r`]:         r,
      [`--b${n}-g`]:         g,
      [`--b${n}-b`]:         bv,
    })
  })

  const b = c.blobs[activeBlob]

  return (
    <main className="hero" style={cssVars}>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="noise-layer" aria-hidden="true" />

      <nav className="navbar">
        <div className="nav-left">
          <a className="logo" href="#">
            <GenloopMark />
            <span className="logo-text">Genloop</span>
          </a>
          <div className="nav-links">
            <button className="nav-link">Product <ChevronDown /></button>
            <button className="nav-link">Use Cases <ChevronDown /></button>
            <button className="nav-link">Resources <ChevronDown /></button>
            <button className="nav-link">About <ChevronDown /></button>
          </div>
        </div>
        <div className="nav-right">
          <button className="btn-ghost">Free Trial <ChevronRight /></button>
          <button className="btn-outlined">Book a Demo <ChevronRight /></button>
        </div>
      </nav>

      <div className="hero-content">
        <div className="hero-text">
          <h1><span className="highlight">Data Analyst</span> For Every Team</h1>
          <p>Connect all your data. Ask in plain English. Get deep, trustworthy insights and actions.</p>
        </div>

        <div className="search-bar">
          <div className="search-left">
            <div className="orb" />
            <span className="search-placeholder">Ask anything about your data...</span>
          </div>
          <button className="btn-cta">Book a Demo <ChevronRight /></button>
        </div>

        <div className="badges">
          <div className="badge">
            <span className="laurel left"><Laurel /></span>
            <div className="badge-text"><span>No. 1</span><span>Spider Benchmark</span></div>
            <span className="laurel right"><Laurel /></span>
          </div>
          <div className="badge">
            <span className="laurel left"><Laurel /></span>
            <div className="badge-text"><span>Most Innovative</span><span>Product - NetApp</span></div>
            <span className="laurel right"><Laurel /></span>
          </div>
        </div>
      </div>

      {/* ── Control panel ── */}
      <div className="ctrl-panel">
        <div className="ctrl-header">
          <span className="ctrl-title">Controls</span>
          <div className="ctrl-actions">
            <button className="ctrl-btn" onClick={reset}>Reset</button>
            <button className="ctrl-btn" onClick={() => setOpen(o => !o)}>{open ? '▲' : '▼'}</button>
          </div>
        </div>

        {open && (
          <div className="ctrl-body">

            {/* Global */}
            <div className="ctrl-section-label">Global</div>
            <Slider label="Blur"  value={c.global.blur}  min={5}  max={120} step={1} unit="px" onChange={v => setGlobal('blur', v)} />
            <Slider label="Speed" value={c.global.speed} min={4}  max={80}  step={1} unit="s"  onChange={v => setGlobal('speed', v)} />

            {/* Per-blob */}
            <div className="ctrl-section-label">Blobs</div>
            <div className="ctrl-tabs">
              {['Blob 1', 'Blob 2', 'Blob 3'].map((label, i) => (
                <button
                  key={i}
                  className={`ctrl-tab${activeBlob === i ? ' active' : ''}`}
                  onClick={() => setActiveBlob(i)}
                >
                  {label}
                </button>
              ))}
            </div>

            <Slider label="Size"      value={b.size}      min={0.2}  max={3.0}  step={0.05} unit="×"  onChange={v => setBlob(activeBlob, 'size', v)} />
            <Slider label="Top"       value={b.top}       min={0}    max={200}  step={1}    unit="%"   onChange={v => setBlob(activeBlob, 'top', v)} />
            <Slider label="Left"      value={b.left}      min={-50}  max={150}  step={1}    unit="%"   onChange={v => setBlob(activeBlob, 'left', v)} />
            <Slider label="X Drift"   value={b.xDrift}    min={0}    max={300}  step={5}    unit="px"  onChange={v => setBlob(activeBlob, 'xDrift', v)} />
            <Slider label="Y Drift"   value={b.yDrift}    min={0}    max={300}  step={5}    unit="px"  onChange={v => setBlob(activeBlob, 'yDrift', v)} />
            <Slider label="Intensity" value={b.intensity} min={0}    max={1.0}  step={0.01} unit=""    onChange={v => setBlob(activeBlob, 'intensity', v)} />

            <div className="ctrl-row">
              <span className="ctrl-label">Color</span>
              <input
                type="color"
                className="ctrl-color"
                value={b.color}
                onChange={e => setBlob(activeBlob, 'color', e.target.value)}
              />
              <span className="ctrl-value" style={{ fontSize: 10 }}>{b.color}</span>
            </div>

            {/* Noise */}
            <div className="ctrl-section-label">Noise</div>
            <Slider label="Opacity" value={c.noise}     min={0}   max={0.2}  step={0.005} unit=""    onChange={v => setVal('noise', v)} />
            <Slider label="Grain"   value={c.noiseSize} min={50}  max={1024} step={50}    unit="px"  onChange={v => setVal('noiseSize', v)} />

          </div>
        )}
      </div>
    </main>
  )
}
