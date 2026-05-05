import { useState, useEffect, useRef } from 'react'
import './App.css'

// ─── Value noise (2D, output [0,1]) ───────────────────────────────────────────
function _h(n) { const x = Math.sin(n) * 43758.5453; return x - Math.floor(x) }
function noise2d(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
  const a = _h(ix + iy * 57), b = _h(ix + 1 + iy * 57)
  const c = _h(ix + (iy + 1) * 57), d = _h(ix + 1 + (iy + 1) * 57)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

// ─── WebGL domain-warp shader ─────────────────────────────────────────────────
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
    mix(dot(hash2(i),           f),           dot(hash2(i+vec2(1,0)), f-vec2(1,0)), u.x),
    mix(dot(hash2(i+vec2(0,1)), f-vec2(0,1)), dot(hash2(i+vec2(1,1)), f-vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * 0.050;
  vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(3.1, 1.7) + t * 0.9));
  float f = fbm(uv + 2.2 * q + t * 0.6) * 0.5 + 0.5;
  vec3 base  = vec3(0.055, 0.647, 0.914);
  vec3 mid   = vec3(0.490, 0.827, 0.988);
  vec3 light = vec3(0.812, 0.937, 0.996);
  vec3 white = vec3(1.0, 1.0, 1.0);
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
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog); gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes  = gl.getUniformLocation(prog, 'u_res')
    const resize = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize()
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

// ─── Boundary blob canvas ─────────────────────────────────────────────────────
function makeBlobs(count) {
  return Array.from({ length: count }, (_, i) => ({
    baseAngle:    -Math.PI * 0.95 + (i / Math.max(count - 1, 1)) * Math.PI * 0.9,
    noiseOffsetX: Math.random() * 10,
    noiseOffsetY: Math.random() * 10,
    sizeMult:     0.75 + Math.random() * 0.55,
  }))
}

function BlobCanvas({ c }) {
  const ref    = useRef(null)
  const cRef   = useRef(c)
  const blobs  = useRef(makeBlobs(c.blobCount))
  const tRef   = useRef(0)

  useEffect(() => { cRef.current = c }, [c])

  useEffect(() => {
    blobs.current = makeBlobs(c.blobCount)
  }, [c.blobCount])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize()

    let raf
    const tick = () => {
      const p = cRef.current
      tRef.current += p.speed
      const t = tRef.current
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const cx = W * 0.5, cy = H * p.CY
      const rx = W * p.RX, ry = H * p.RY

      // 5-layer stacked ellipse (outermost → innermost)
      const layers = [
        { srx: 1.14, sry: 1.10, blur: p.outerBlur,        alpha: 0.36 },
        { srx: 1.07, sry: 1.05, blur: p.outerBlur * 0.63, alpha: 0.58 },
        { srx: 1.02, sry: 1.01, blur: p.outerBlur * 0.33, alpha: 0.80 },
        { srx: 0.98, sry: 0.98, blur: p.coreBlur,         alpha: 0.97 },
        { srx: 0.92, sry: 0.92, blur: 0,                  alpha: 1.00 },
      ]
      for (const l of layers) {
        ctx.save()
        if (l.blur > 0) ctx.filter = `blur(${l.blur}px)`
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx * l.srx, ry * l.sry, 0, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(248,253,255,${l.alpha})`
        ctx.fill()
        ctx.restore()
      }

      // Boundary blobs
      for (const blob of blobs.current) {
        const drift  = (noise2d(blob.noiseOffsetX + t, blob.noiseOffsetY) * 2 - 1) * p.driftRange
        const angle  = blob.baseAngle + drift
        const px     = cx + Math.cos(angle) * rx
        const py     = cy + Math.sin(angle) * ry

        const radial = (noise2d(blob.noiseOffsetX + t * 0.8, blob.noiseOffsetY + 3.0) * 2 - 1) * 0.07
        const nx = Math.cos(angle), ny = Math.sin(angle) * (ry / rx)
        const nl = Math.sqrt(nx * nx + ny * ny)
        const fx = px + (nx / nl) * rx * radial
        const fy = py + (ny / nl) * ry * radial

        const breath = 1 + (noise2d(blob.noiseOffsetX + t * 0.6, blob.noiseOffsetY + 7.0) * 2 - 1) * 0.28
        const radius = W * p.blobSize * blob.sizeMult * breath

        ctx.save()
        ctx.filter = `blur(${radius * p.blobBlur}px)`
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, radius)
        g.addColorStop(0,   `rgba(255,255,255,${p.blobOpacity})`)
        g.addColorStop(0.5, `rgba(245,252,255,${(p.blobOpacity * 0.65).toFixed(3)})`)
        g.addColorStop(1,   'rgba(225,245,255,0)')
        ctx.beginPath()
        ctx.arc(fx, fy, radius, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
        ctx.restore()
      }

      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return <canvas ref={ref} className="blob-canvas" />
}

// ─── SVG icons ────────────────────────────────────────────────────────────────
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
      <path d="M4 8 C2 10 1 13 2 16"  stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M3 14 C1 16 1 19 3 21" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M5 20 C3 22 4 25 6 27" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M4 8 C5 6 7 5 9 6"    stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M3 14 C4 12 7 11 9 12" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M5 20 C6 18 8 18 10 19"stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M8 26 C8 24 9 22 10 21"stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
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

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULTS = {
  // Big background blobs (CSS animated circles, behind BlobCanvas ellipse)
  blob1: {                    // white→light-blue gradient (node 1029:14103)
    radius:  110,             // vw
    x:        50, y: 112,     // % — center below viewport → only arch visible
    from:   '#ffffff',
    to:     '#bae6fd',
    angle:   160,
    blur:     60,             // px — lower default so radius changes are visible
    opacity: 0.9,
  },
  blob2: {                    // teal solid blob (node 1029:14102)
    radius:   90,
    x:        54, y: 108,     // slightly offset so teal peeks around white
    color:  '#00bcd4',
    blur:     80,
    opacity: 0.75,
  },
  // Ellipse geometry
  CY: 0.72, RX: 0.75, RY: 0.85,
  outerBlur: 60, coreBlur: 8,
  // Boundary blobs
  blobCount:   12,
  blobSize:    0.07,
  blobBlur:    0.42,
  blobOpacity: 0.95,
  speed:       0.00025,
  driftRange:  0.10,
  // Noise overlay
  noise:     0.03,
  noiseSize: 1024,
}

// ─── Control components ───────────────────────────────────────────────────────
function Slider({ label, value, min, max, step, unit, onChange }) {
  const decimals = step < 1 ? String(step).split('.')[1]?.length ?? 0 : 0
  return (
    <div className="ctrl-row">
      <span className="ctrl-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="ctrl-slider" />
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

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [c, setC] = useState(DEFAULTS)
  const [open, setOpen] = useState(true)
  const set  = (key, val) => setC(p => ({ ...p, [key]: val }))
  const set1 = (key, val) => setC(p => ({ ...p, blob1: { ...p.blob1, [key]: val } }))
  const set2 = (key, val) => setC(p => ({ ...p, blob2: { ...p.blob2, [key]: val } }))
  const reset = () => setC(DEFAULTS)

  const cssVars = {
    '--noise-opacity': c.noise,
    '--noise-size':    `${c.noiseSize}px`,
    '--b1-r':      `${c.blob1.radius}vw`,
    '--b1-x':      `${c.blob1.x}%`,
    '--b1-y':      `${c.blob1.y}%`,
    '--b1-from':    c.blob1.from,
    '--b1-to':      c.blob1.to,
    '--b1-angle':  `${c.blob1.angle}deg`,
    '--b1-blur':    `${c.blob1.blur}px`,
    '--b1-opacity':  c.blob1.opacity,
    '--b2-r':       `${c.blob2.radius}vw`,
    '--b2-x':      `${c.blob2.x}%`,
    '--b2-y':      `${c.blob2.y}%`,
    '--b2-color':    c.blob2.color,
    '--b2-blur':    `${c.blob2.blur}px`,
    '--b2-opacity':  c.blob2.opacity,
  }

  return (
    <main className="hero" style={cssVars}>
      <ShaderCanvas />
      <div className="big-blob big-blob-2" />
      <div className="big-blob big-blob-1" />
      <BlobCanvas c={c} />
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

            <div className="ctrl-section-label">Blob 1 — White Gradient</div>
            <Slider   label="Radius"  value={c.blob1.radius} min={40}  max={200} step={5}   unit="vw"  onChange={v => set1('radius', v)} />
            <Slider   label="X"       value={c.blob1.x}      min={-50} max={150} step={1}   unit="%"   onChange={v => set1('x', v)} />
            <Slider   label="Y"       value={c.blob1.y}      min={0}   max={200} step={1}   unit="%"   onChange={v => set1('y', v)} />
            <Slider   label="Blur"    value={c.blob1.blur}    min={0}   max={300} step={5}    unit="px"  onChange={v => set1('blur', v)} />
            <Slider   label="Opacity" value={c.blob1.opacity} min={0}   max={1.0} step={0.05} unit=""    onChange={v => set1('opacity', v)} />
            <Slider   label="Angle"   value={c.blob1.angle}   min={0}   max={360} step={1}    unit="°"   onChange={v => set1('angle', v)} />
            <ColorRow label="From"    value={c.blob1.from}    onChange={v => set1('from', v)} />
            <ColorRow label="To"      value={c.blob1.to}      onChange={v => set1('to', v)} />

            <div className="ctrl-section-label">Blob 2 — Teal</div>
            <Slider   label="Radius"  value={c.blob2.radius} min={20}  max={200} step={5}   unit="vw"  onChange={v => set2('radius', v)} />
            <Slider   label="X"       value={c.blob2.x}      min={-50} max={150} step={1}   unit="%"   onChange={v => set2('x', v)} />
            <Slider   label="Y"       value={c.blob2.y}      min={0}   max={200} step={1}   unit="%"   onChange={v => set2('y', v)} />
            <Slider   label="Blur"    value={c.blob2.blur}    min={0}   max={300} step={5}    unit="px"  onChange={v => set2('blur', v)} />
            <Slider   label="Opacity" value={c.blob2.opacity} min={0}   max={1.0} step={0.05} unit=""    onChange={v => set2('opacity', v)} />
            <ColorRow label="Color"   value={c.blob2.color}   onChange={v => set2('color', v)} />

            <div className="ctrl-section-label">Ellipse</div>
            <Slider label="Dome Y"      value={c.CY}        min={0.55} max={0.95} step={0.01} unit=""   onChange={v => set('CY', v)} />
            <Slider label="Width rx"    value={c.RX}        min={0.45} max={0.95} step={0.01} unit=""   onChange={v => set('RX', v)} />
            <Slider label="Height ry"   value={c.RY}        min={0.40} max={1.30} step={0.01} unit=""   onChange={v => set('RY', v)} />
            <Slider label="Outer blur"  value={c.outerBlur} min={10}   max={100}  step={1}    unit="px" onChange={v => set('outerBlur', v)} />
            <Slider label="Core blur"   value={c.coreBlur}  min={0}    max={30}   step={1}    unit="px" onChange={v => set('coreBlur', v)} />

            <div className="ctrl-section-label">Boundary Blobs</div>
            <Slider label="Count"    value={c.blobCount}   min={4}      max={30}    step={1}      unit=""  onChange={v => set('blobCount', v)} />
            <Slider label="Size"     value={c.blobSize}    min={0.02}   max={0.16}  step={0.005}  unit=""  onChange={v => set('blobSize', v)} />
            <Slider label="Blur ×"   value={c.blobBlur}    min={0.2}    max={0.8}   step={0.01}   unit=""  onChange={v => set('blobBlur', v)} />
            <Slider label="Opacity"  value={c.blobOpacity} min={0.3}    max={1.0}   step={0.05}   unit=""  onChange={v => set('blobOpacity', v)} />
            <Slider label="Speed"    value={c.speed}       min={0.0001} max={0.003} step={0.0001} unit=""  onChange={v => set('speed', v)} />
            <Slider label="Drift"    value={c.driftRange}  min={0.02}   max={0.25}  step={0.01}   unit="r" onChange={v => set('driftRange', v)} />

            <div className="ctrl-section-label">Noise</div>
            <Slider label="Opacity" value={c.noise}     min={0}  max={0.2}  step={0.005} unit=""   onChange={v => set('noise', v)} />
            <Slider label="Grain"   value={c.noiseSize} min={50} max={1024} step={50}    unit="px" onChange={v => set('noiseSize', v)} />

          </div>
        )}
      </div>
    </main>
  )
}
