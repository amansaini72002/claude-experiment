import { useState, useEffect, useRef } from 'react'
import './App.css'

// ─── WebGL domain-warp shader ─────────────────────────────────────────── v2 ─
const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2  u_res;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i),            f),
        dot(hash2(i+vec2(1,0)),  f-vec2(1,0)), u.x),
    mix(dot(hash2(i+vec2(0,1)),  f-vec2(0,1)),
        dot(hash2(i+vec2(1,1)),  f-vec2(1,1)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * 0.050;

  // Single warp pass — softer, cloudier movement (less ribbon-like)
  vec2 q = vec2(fbm(uv + t),
                fbm(uv + vec2(3.1, 1.7) + t * 0.9));
  float f = fbm(uv + 2.2 * q + t * 0.6) * 0.5 + 0.5;

  // All-light palette: primary sky blue → white
  // No dark areas — the floor is the brand blue, clouds go up to white
  vec3 base  = vec3(0.055, 0.647, 0.914); // #0ea5e9  primary
  vec3 mid   = vec3(0.490, 0.827, 0.988); // #7dd3fc  light blue
  vec3 light = vec3(0.812, 0.937, 0.996); // #cff0fe  very light
  vec3 white = vec3(1.0,   1.0,   1.0);   // #ffffff

  vec3 col = base;
  col = mix(col, mid,   smoothstep(0.25, 0.50, f));
  col = mix(col, light, smoothstep(0.50, 0.72, f));
  col = mix(col, white, smoothstep(0.72, 0.95, f));

  gl_FragColor = vec4(col, 1.0);
}
`

function ShaderCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const gl = canvas.getContext('webgl')
    if (!gl) return

    const mkShader = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const prog = gl.createProgram()
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes  = gl.getUniformLocation(prog, 'u_res')

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    let raf
    const t0 = performance.now()
    const tick = () => {
      gl.uniform1f(uTime, (performance.now() - t0) / 1000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return <canvas ref={ref} className="shader-canvas" />
}

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
  speed: 3,     // global animation speed (3–20s)

  // Blob 1 — linear gradient circle
  blob1: {
    size:    105,   // vw
    x:        47,   // % (left)
    y:       109,   // % (top — center pushed below viewport for the arch look)
    from:   '#ffffff',
    to:     '#ffffff',
    angle:   166,   // deg
    blur:    155,   // px
    xDrift:   60,   // px animation range
    yDrift:   40,   // px animation range
    scale:  0.08,   // scale delta (animates 1.0 → 1+scale)
  },

  // Blob 2 — solid colour + blur
  blob2: {
    size:    50,
    x:       50,
    y:      176,
    color:  '#7dd3fc',
    blur:   200,
    xDrift:  50,
    yDrift:  50,
    scale:  0.08,   // scale delta (animates 1.0 → 1-scale)
  },

  noise:     0.03,
  noiseSize: 1024,
}

function Slider({ label, value, min, max, step, unit, onChange }) {
  const decimals = step < 1 ? String(step).split('.')[1]?.length ?? 0 : 0
  return (
    <div className="ctrl-row">
      <span className="ctrl-label">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="ctrl-slider"
      />
      <span className="ctrl-value">{Number(value).toFixed(decimals)}{unit}</span>
    </div>
  )
}

function ColorRow({ label, value, onChange }) {
  return (
    <div className="ctrl-row">
      <span className="ctrl-label">{label}</span>
      <input type="color" className="ctrl-color" value={value}
        onChange={e => onChange(e.target.value)} />
      <span className="ctrl-value" style={{ fontSize: 10 }}>{value}</span>
    </div>
  )
}

export default function App() {
  const [c, setC] = useState(DEFAULTS)
  const [open, setOpen] = useState(true)

  const set  = (key, val) => setC(p => ({ ...p, [key]: val }))
  const set1 = (key, val) => setC(p => ({ ...p, blob1: { ...p.blob1, [key]: val } }))
  const set2 = (key, val) => setC(p => ({ ...p, blob2: { ...p.blob2, [key]: val } }))
  const reset = () => setC(DEFAULTS)

  const cssVars = {
    '--speed':         `${c.speed}s`,
    '--noise-opacity': c.noise,
    '--noise-size':    `${c.noiseSize}px`,
    // Blob 1
    '--b1-size':    `${c.blob1.size}vw`,
    '--b1-x':       `${c.blob1.x}%`,
    '--b1-y':       `${c.blob1.y}%`,
    '--b1-from':     c.blob1.from,
    '--b1-to':       c.blob1.to,
    '--b1-angle':   `${c.blob1.angle}deg`,
    '--b1-blur':    `${c.blob1.blur}px`,
    '--b1-xdrift':  `${c.blob1.xDrift}px`,
    '--b1-ydrift':  `${c.blob1.yDrift}px`,
    '--b1-scale':    c.blob1.scale,
    // Blob 2
    '--b2-size':    `${c.blob2.size}vw`,
    '--b2-x':       `${c.blob2.x}%`,
    '--b2-y':       `${c.blob2.y}%`,
    '--b2-color':    c.blob2.color,
    '--b2-blur':    `${c.blob2.blur}px`,
    '--b2-xdrift':  `${c.blob2.xDrift}px`,
    '--b2-ydrift':  `${c.blob2.yDrift}px`,
    '--b2-scale':    c.blob2.scale,
  }

  return (
    <main className="hero" style={cssVars}>
      <ShaderCanvas />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
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

            <div className="ctrl-section-label">Global</div>
            <Slider label="Speed" value={c.speed} min={3} max={20} step={0.5} unit="s" onChange={v => set('speed', v)} />

            <div className="ctrl-section-label">Blob 1 — Linear Gradient</div>
            <Slider    label="Size"    value={c.blob1.size}   min={40}  max={220} step={5}    unit="vw"  onChange={v => set1('size', v)} />
            <Slider    label="X"       value={c.blob1.x}      min={-50} max={150} step={1}    unit="%"   onChange={v => set1('x', v)} />
            <Slider    label="Y"       value={c.blob1.y}      min={0}   max={200} step={1}    unit="%"   onChange={v => set1('y', v)} />
            <Slider    label="Angle"   value={c.blob1.angle}  min={0}   max={360} step={1}    unit="°"   onChange={v => set1('angle', v)} />
            <ColorRow  label="From"    value={c.blob1.from}   onChange={v => set1('from', v)} />
            <ColorRow  label="To"      value={c.blob1.to}     onChange={v => set1('to', v)} />
            <Slider    label="Blur"    value={c.blob1.blur}   min={0}   max={200} step={5}    unit="px"  onChange={v => set1('blur', v)} />
            <Slider    label="X Drift" value={c.blob1.xDrift} min={0}   max={500} step={5}    unit="px"  onChange={v => set1('xDrift', v)} />
            <Slider    label="Y Drift" value={c.blob1.yDrift} min={0}   max={500} step={5}    unit="px"  onChange={v => set1('yDrift', v)} />
            <Slider    label="Scale"   value={c.blob1.scale}  min={0}   max={0.5} step={0.01} unit=""    onChange={v => set1('scale', v)} />

            <div className="ctrl-section-label">Blob 2 — Solid + Blur</div>
            <Slider    label="Size"    value={c.blob2.size}   min={20}  max={200} step={5}    unit="vw"  onChange={v => set2('size', v)} />
            <Slider    label="X"       value={c.blob2.x}      min={-50} max={150} step={1}    unit="%"   onChange={v => set2('x', v)} />
            <Slider    label="Y"       value={c.blob2.y}      min={0}   max={200} step={1}    unit="%"   onChange={v => set2('y', v)} />
            <ColorRow  label="Color"   value={c.blob2.color}  onChange={v => set2('color', v)} />
            <Slider    label="Blur"    value={c.blob2.blur}   min={0}   max={200} step={5}    unit="px"  onChange={v => set2('blur', v)} />
            <Slider    label="X Drift" value={c.blob2.xDrift} min={0}   max={500} step={5}    unit="px"  onChange={v => set2('xDrift', v)} />
            <Slider    label="Y Drift" value={c.blob2.yDrift} min={0}   max={500} step={5}    unit="px"  onChange={v => set2('yDrift', v)} />
            <Slider    label="Scale"   value={c.blob2.scale}  min={0}   max={0.5} step={0.01} unit=""    onChange={v => set2('scale', v)} />

            <div className="ctrl-section-label">Noise</div>
            <Slider label="Opacity" value={c.noise}     min={0}  max={0.2}  step={0.005} unit=""    onChange={v => set('noise', v)} />
            <Slider label="Grain"   value={c.noiseSize} min={50} max={1024} step={50}    unit="px"  onChange={v => set('noiseSize', v)} />

          </div>
        )}
      </div>
    </main>
  )
}
