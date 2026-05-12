import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { CHILD_AVATARS, CHILD_COLORS } from '../types'

const PIN_PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']

export default function SetupScreen() {
  const setupApp = useAppStore(s => s.setupApp)
  const addChild = useAppStore(s => s.addChild)

  const [step, setStep] = useState<'welcome' | 'pin' | 'confirm' | 'child'>('welcome')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinEntry, setPinEntry] = useState('')
  const [shake, setShake] = useState(false)
  const [childName, setChildName] = useState('')
  const [childAvatar, setChildAvatar] = useState(CHILD_AVATARS[0])
  const [childColor, setChildColor] = useState(CHILD_COLORS[0])
  const [savedPin, setSavedPin] = useState('')

  const handlePinKey = (key: string, currentPin: string, setFn: (v: string) => void, onComplete: (p: string) => void) => {
    if (key === '⌫') {
      setFn(currentPin.slice(0, -1))
    } else if (key === '✓') {
      if (currentPin.length === 4) onComplete(currentPin)
    } else if (currentPin.length < 4) {
      const next = currentPin + key
      setFn(next)
      if (next.length === 4) setTimeout(() => onComplete(next), 300)
    }
  }

  const handleSetPin = (p: string) => {
    setSavedPin(p)
    setPin(p)
    setStep('confirm')
  }

  const handleConfirmPin = (p: string) => {
    if (p === savedPin) {
      setStep('child')
    } else {
      setShake(true)
      setConfirmPin('')
      setTimeout(() => setShake(false), 600)
    }
  }

  const handleFinish = () => {
    setupApp(savedPin)
    if (childName.trim()) {
      addChild({ name: childName.trim(), avatar: childAvatar, color: childColor, coins: 0, gems: 0 })
    }
  }

  return (
    <div className="screen-container bg-space-900 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gem-dark/20 via-space-900 to-coin/10 pointer-events-none" />

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center relative"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="text-9xl mb-8 leading-none"
            >
              ⭐
            </motion.div>
            <h1 className="font-display text-5xl text-white mb-3">Reward Quest</h1>
            <p className="text-white/60 font-body text-lg mb-10 max-w-xs">
              Earn coins and gems by completing tasks, then spend them on amazing rewards!
            </p>
            <button
              onClick={() => setStep('pin')}
              className="btn-primary bg-gradient-to-r from-gem-dark to-gem text-white w-full max-w-xs shadow-lg shadow-gem/30"
            >
              Let's Get Started! 🚀
            </button>
          </motion.div>
        )}

        {(step === 'pin' || step === 'confirm') && (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col items-center justify-center px-6 relative"
          >
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="font-display text-3xl text-white mb-2">
              {step === 'pin' ? 'Create Your PIN' : 'Confirm PIN'}
            </h2>
            <p className="text-white/50 font-body text-base mb-8 text-center">
              {step === 'pin'
                ? 'Only parents can access the settings'
                : 'Enter your PIN again to confirm'}
            </p>

            {/* Dots */}
            <motion.div
              animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-4 mb-10"
            >
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`pin-dot ${i < (step === 'pin' ? pin : confirmPin).length ? 'filled' : ''}`}
                />
              ))}
            </motion.div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              {PIN_PAD.map(key => (
                <button
                  key={key}
                  onClick={() => {
                    if (step === 'pin') {
                      handlePinKey(key, pin, setPin, handleSetPin)
                    } else {
                      handlePinKey(key, confirmPin, setConfirmPin, handleConfirmPin)
                    }
                  }}
                  className={`
                    h-14 rounded-2xl font-display text-xl font-bold
                    active:scale-90 transition-transform duration-100 select-none
                    ${key === '✓' ? 'bg-gem/30 text-gem-light border border-gem/40'
                      : key === '⌫' ? 'bg-white/5 text-white/60 border border-white/10'
                      : 'bg-white/8 text-white border border-white/10 active:bg-white/15'}
                  `}
                >
                  {key}
                </button>
              ))}
            </div>

            {step === 'confirm' && (
              <button onClick={() => { setStep('pin'); setPin(''); setConfirmPin('') }} className="mt-6 text-white/40 text-sm">
                ← Back
              </button>
            )}
          </motion.div>
        )}

        {step === 'child' && (
          <motion.div
            key="child"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col px-6 py-8 relative overflow-y-auto"
          >
            <h2 className="font-display text-3xl text-white mb-2 text-center">Add Your First Child</h2>
            <p className="text-white/50 text-base text-center mb-6 font-body">You can add more children later</p>

            {/* Avatar preview */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 border-4"
              style={{ backgroundColor: childColor + '30', borderColor: childColor }}
            >
              {childAvatar}
            </div>

            {/* Name */}
            <input
              type="text"
              placeholder="Child's name..."
              value={childName}
              onChange={e => setChildName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white font-body text-lg placeholder-white/30 mb-4 outline-none focus:border-gem/60"
              maxLength={20}
            />

            {/* Avatar picker */}
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-body">Pick an avatar</p>
            <div className="grid grid-cols-8 gap-2 mb-4">
              {CHILD_AVATARS.map(av => (
                <button
                  key={av}
                  onClick={() => setChildAvatar(av)}
                  className={`text-2xl h-10 rounded-xl flex items-center justify-center transition-all ${childAvatar === av ? 'bg-white/20 scale-110' : 'bg-white/5 active:scale-95'}`}
                >
                  {av}
                </button>
              ))}
            </div>

            {/* Color picker */}
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-body">Pick a colour</p>
            <div className="flex gap-3 flex-wrap mb-8">
              {CHILD_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setChildColor(color)}
                  className={`w-10 h-10 rounded-full transition-all ${childColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-space-900' : 'active:scale-95'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <button
              onClick={handleFinish}
              disabled={!childName.trim()}
              className="btn-primary bg-gradient-to-r from-coin-dark to-coin text-space-900 w-full disabled:opacity-40 disabled:scale-100"
            >
              Start Quest! ⭐
            </button>

            <button onClick={handleFinish} className="mt-3 text-white/30 text-sm text-center w-full py-2">
              Skip — add children later
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
