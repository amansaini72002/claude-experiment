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

const DEFAULTS = {
  size:      1.0,   // blob scale multiplier
  blur:      50,    // px
  drift:     60,    // px — horizontal travel per cycle
  yOffset:   40,    // px — vertical travel per cycle
  speed:     26,    // s — base animation duration
  intensity: 0.97,  // white opacity at the gradient core
}

function Slider({ label, value, min, max, step, unit, onChange }) {
  return (
    <div className="ctrl-row">
      <span className="ctrl-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="ctrl-slider"
      />
      <span className="ctrl-value">{value}{unit}</span>
    </div>
  )
}

export default function App() {
  const [c, setC] = useState(DEFAULTS)
  const [open, setOpen] = useState(true)

  const set = (key, val) => setC(prev => ({ ...prev, [key]: val }))
  const reset = () => setC(DEFAULTS)

  const cssVars = {
    '--blob-size':      c.size,
    '--blob-blur':      `${c.blur}px`,
    '--blob-drift':     `${c.drift}px`,
    '--blob-y-offset':  `${c.yOffset}px`,
    '--blob-speed':     `${c.speed}s`,
    '--blob-intensity': c.intensity,
  }

  return (
    <main className="hero" style={cssVars}>
      {/* Cloud blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Navbar */}
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

      {/* Hero content */}
      <div className="hero-content">
        <div className="hero-text">
          <h1>
            <span className="highlight">Data Analyst</span> For Every Team
          </h1>
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
            <div className="badge-text">
              <span>No. 1</span>
              <span>Spider Benchmark</span>
            </div>
            <span className="laurel right"><Laurel /></span>
          </div>
          <div className="badge">
            <span className="laurel left"><Laurel /></span>
            <div className="badge-text">
              <span>Most Innovative</span>
              <span>Product - NetApp</span>
            </div>
            <span className="laurel right"><Laurel /></span>
          </div>
        </div>
      </div>

      {/* Live controls */}
      <div className="ctrl-panel">
        <div className="ctrl-header">
          <span className="ctrl-title">Cloud Controls</span>
          <div className="ctrl-actions">
            <button className="ctrl-btn" onClick={reset}>Reset</button>
            <button className="ctrl-btn ctrl-toggle" onClick={() => setOpen(o => !o)}>
              {open ? '▲' : '▼'}
            </button>
          </div>
        </div>
        {open && (
          <div className="ctrl-body">
            <Slider label="Size"      value={c.size}      min={0.5}  max={3.0}  step={0.05} unit="×"  onChange={v => set('size', v)} />
            <Slider label="Softness"  value={c.blur}      min={5}    max={120}  step={1}    unit="px" onChange={v => set('blur', v)} />
            <Slider label="X Drift"   value={c.drift}     min={10}   max={300}  step={5}    unit="px" onChange={v => set('drift', v)} />
            <Slider label="Y Offset"  value={c.yOffset}   min={10}   max={300}  step={5}    unit="px" onChange={v => set('yOffset', v)} />
            <Slider label="Speed"     value={c.speed}     min={4}    max={80}   step={1}    unit="s"  onChange={v => set('speed', v)} />
            <Slider label="Intensity" value={c.intensity} min={0.3}  max={1.0}  step={0.01} unit=""   onChange={v => set('intensity', v)} />
          </div>
        )}
      </div>
    </main>
  )
}
