'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Upload, FileCheck, AlertCircle, ChevronDown, Info,
  Loader2, ArrowRight, Package, Zap
} from 'lucide-react'

type Material = 'resin-standard' | 'resin-ultra' | 'fdm-pla' | 'fdm-abs'
type Scale = '50' | '75' | '100' | '125' | '150' | '200'
type Infill = '15' | '25' | '50' | '80'
type Finish = 'raw' | 'sanded' | 'primed'

interface Quote {
  base: number
  material: number
  rush: number
  total: number
}

const MATERIALS: { id: Material; label: string; desc: string; multiplier: number; badge?: string }[] = [
  { id: 'resin-standard', label: 'Standard Resin', desc: '0.05mm layer height — great for miniatures', multiplier: 1.0, badge: 'Popular' },
  { id: 'resin-ultra', label: 'Ultra-Detail Resin', desc: '0.025mm layer height — museum quality', multiplier: 1.6, badge: 'Best' },
  { id: 'fdm-pla', label: 'FDM PLA', desc: 'Best for terrain, props, and large models', multiplier: 0.6 },
  { id: 'fdm-abs', label: 'FDM ABS', desc: 'Heat resistant, great for functional parts', multiplier: 0.65 },
]

const FINISH_OPTIONS: { id: Finish; label: string; addCost: number; desc: string }[] = [
  { id: 'raw', label: 'Raw Print', addCost: 0, desc: 'As-printed, ready for your own prep' },
  { id: 'sanded', label: 'Sanded & Cleaned', addCost: 3.5, desc: 'Layer lines removed, support marks cleaned' },
  { id: 'primed', label: 'Primed', addCost: 6.0, desc: 'Sanded, cleaned, and grey-primed, paint-ready' },
]

const BASE_PRICE = 7.5 // base per model
const SCALE_MULTIPLIERS: Record<Scale, number> = {
  '50': 0.5, '75': 0.75, '100': 1.0, '125': 1.35, '150': 1.8, '200': 3.0,
}

function calcQuote(
  material: Material,
  scale: Scale,
  quantity: number,
  finish: Finish,
  rush: boolean
): Quote {
  const mat = MATERIALS.find((m) => m.id === material)!
  const scaleMul = SCALE_MULTIPLIERS[scale]
  const finishCost = FINISH_OPTIONS.find((f) => f.id === finish)!.addCost
  const base = BASE_PRICE * scaleMul * quantity
  const materialCost = base * (mat.multiplier - 1)
  const rushCost = rush ? base * 0.3 : 0
  const total = base + materialCost + finishCost * quantity + rushCost
  return { base, material: materialCost, rush: rushCost, total }
}

export default function OrderForm() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [material, setMaterial] = useState<Material>('resin-standard')
  const [scale, setScale] = useState<Scale>('100')
  const [infill, setInfill] = useState<Infill>('25')
  const [finish, setFinish] = useState<Finish>('raw')
  const [quantity, setQuantity] = useState(1)
  const [rush, setRush] = useState(false)
  const [notes, setNotes] = useState('')
  const [step, setStep] = useState<'upload' | 'configure' | 'checkout'>('upload')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quote = calcQuote(material, scale, quantity, finish, rush)

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['stl', 'obj', '3mf'].includes(ext ?? '')) {
      setError('Only .stl, .obj, and .3mf files are supported.')
      return
    }
    if (f.size > 200 * 1024 * 1024) {
      setError('File must be under 200 MB.')
      return
    }
    setError(null)
    setFile(f)
    setStep('configure')
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const handleCheckout = async () => {
    setSubmitting(true)
    setError(null)
    try {
      // In production, this calls your /api/checkout endpoint which creates a Stripe session
      await new Promise((r) => setTimeout(r, 1200))
      // Redirect to Stripe Checkout here
      alert('🔥 Stripe integration: connect your STRIPE_SECRET_KEY in .env.local and implement /api/checkout to go live!')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main form */}
      <div className="lg:col-span-2 space-y-6">

        {/* Step 1: Upload */}
        <div className="card p-6">
          <h2 className="text-white font-display font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">1</span>
            Upload Your File
          </h2>

          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                dragging
                  ? 'border-amber-500/60 bg-amber-500/5'
                  : 'border-white/10 hover:border-amber-500/30 hover:bg-amber-500/5'
              }`}
            >
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 font-medium mb-1">
                Drag & drop your STL, OBJ or 3MF file here
              </p>
              <p className="text-slate-500 text-sm mb-4">or click to browse · max 200 MB</p>
              <button type="button" className="btn-secondary text-sm">
                Choose File
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".stl,.obj,.3mf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <FileCheck className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{file.name}</p>
                <p className="text-slate-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={() => { setFile(null); setStep('upload') }}
                className="text-slate-400 hover:text-white text-xs underline"
              >
                Change
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Step 2: Configure */}
        <div className={`card p-6 transition-opacity ${step === 'upload' ? 'opacity-40 pointer-events-none' : ''}`}>
          <h2 className="text-white font-display font-bold text-lg mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">2</span>
            Configure Your Print
          </h2>

          {/* Material */}
          <div className="mb-6">
            <label className="text-slate-300 text-sm font-medium mb-3 block">Material &amp; Quality</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMaterial(m.id)}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    material === m.id
                      ? 'border-amber-500/60 bg-amber-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">{m.label}</span>
                    {m.badge && (
                      <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-xs">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scale & Quantity */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Scale</label>
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value as Scale)}
                className="input-field"
              >
                <option value="50">50% — Half Size</option>
                <option value="75">75% — Small</option>
                <option value="100">100% — Standard</option>
                <option value="125">125% — Large</option>
                <option value="150">150% — Hero Scale</option>
                <option value="200">200% — Display Size</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Quantity</label>
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field"
              />
            </div>
          </div>

          {/* Infill */}
          <div className="mb-6">
            <label className="text-slate-300 text-sm font-medium mb-2 block flex items-center gap-1">
              Infill Density
              <Info className="w-3.5 h-3.5 text-slate-500" />
            </label>
            <div className="flex gap-2">
              {(['15', '25', '50', '80'] as Infill[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setInfill(v)}
                  className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                    infill === v
                      ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                      : 'border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-2">15% for miniatures · 25% standard · 50%+ for functional parts</p>
          </div>

          {/* Finish */}
          <div className="mb-6">
            <label className="text-slate-300 text-sm font-medium mb-3 block">Finishing</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FINISH_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFinish(f.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    finish === f.id
                      ? 'border-amber-500/60 bg-amber-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-white text-sm font-medium mb-1">{f.label}</div>
                  <div className="text-slate-400 text-xs">{f.desc}</div>
                  {f.addCost > 0 && (
                    <div className="text-amber-400 text-xs mt-1">+£{f.addCost.toFixed(2)}/model</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Rush */}
          <label className="flex items-center gap-3 cursor-pointer mb-6">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={rush}
                onChange={(e) => setRush(e.target.checked)}
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${rush ? 'bg-amber-500' : 'bg-white/10'}`} />
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${rush ? 'translate-x-4' : ''}`} />
            </div>
            <div>
              <span className="text-white text-sm font-medium">Rush Order (+30%)</span>
              <p className="text-slate-400 text-xs">Delivered within 48 hours</p>
            </div>
          </label>

          {/* Notes */}
          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Special Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Colour preferences, orientation notes, support requests…"
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Step 3: Personal details */}
        <div className={`card p-6 transition-opacity ${step === 'upload' ? 'opacity-40 pointer-events-none' : ''}`}>
          <h2 className="text-white font-display font-bold text-lg mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">3</span>
            Your Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">First Name</label>
              <input type="text" className="input-field" placeholder="Aragorn" />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Last Name</label>
              <input type="text" className="input-field" placeholder="Elessar" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-slate-300 text-sm font-medium mb-2 block">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-slate-300 text-sm font-medium mb-2 block">Delivery Address</label>
              <input type="text" className="input-field" placeholder="Street address" />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">City</label>
              <input type="text" className="input-field" placeholder="London" />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Postcode</label>
              <input type="text" className="input-field" placeholder="EC1A 1BB" />
            </div>
          </div>
        </div>
      </div>

      {/* Quote sidebar */}
      <div className="lg:col-span-1">
        <div className="card p-6 sticky top-24">
          <h3 className="text-white font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            Your Quote
          </h3>

          {file ? (
            <>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Base ({quantity}× {scale}% scale)</span>
                  <span>£{quote.base.toFixed(2)}</span>
                </div>
                {quote.material !== 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Material upgrade</span>
                    <span>£{quote.material.toFixed(2)}</span>
                  </div>
                )}
                {quote.rush > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Rush fee</span>
                    <span>£{quote.rush.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 flex justify-between text-white font-bold text-base">
                  <span>Total</span>
                  <span className="gradient-text">£{quote.total.toFixed(2)}</span>
                </div>
                <p className="text-slate-500 text-xs">Shipping calculated at checkout · VAT included</p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={submitting || !file}
                className="btn-primary w-full justify-center text-base py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Pay £{quote.total.toFixed(2)}
                  </>
                )}
              </button>

              <p className="text-center text-slate-500 text-xs mt-3 flex items-center justify-center gap-1">
                🔒 Secured by Stripe · No account needed
              </p>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Upload className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Upload a file to see your instant quote</p>
            </div>
          )}

          {/* Delivery estimate */}
          {file && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <h4 className="text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">Estimated Delivery</h4>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Standard</span>
                <span className="text-white">3–5 working days</span>
              </div>
              {rush && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-400">Rush</span>
                  <span className="text-white">48 hours</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
