import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PinModalProps {
  isOpen: boolean
  title?: string
  subtitle?: string
  onSuccess: () => void
  onCancel: () => void
  verifyPin: (pin: string) => boolean
}

const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']

export default function PinModal({ isOpen, title = 'Enter PIN', subtitle, onSuccess, onCancel, verifyPin }: PinModalProps) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)

  const handleKey = (key: string) => {
    if (key === '⌫') {
      setPin(p => p.slice(0, -1))
    } else if (key === '✓') {
      if (pin.length < 4) return
      if (verifyPin(pin)) {
        setPin('')
        onSuccess()
      } else {
        setShake(true)
        setPin('')
        setTimeout(() => setShake(false), 600)
      }
    } else if (pin.length < 4) {
      const next = pin + key
      setPin(next)
      if (next.length === 4) {
        setTimeout(() => {
          if (verifyPin(next)) {
            setPin('')
            onSuccess()
          } else {
            setShake(true)
            setPin('')
            setTimeout(() => setShake(false), 600)
          }
        }, 200)
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && (setPin(''), onCancel())}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-sm bg-space-800 border border-white/10 rounded-t-3xl p-6 pb-8 safe-bottom"
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

            <h2 className="font-display text-2xl text-white text-center mb-1">{title}</h2>
            {subtitle && <p className="text-white/50 text-sm text-center mb-6">{subtitle}</p>}
            {!subtitle && <div className="mb-6" />}

            {/* Dots */}
            <motion.div
              animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-4 mb-8"
            >
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
              ))}
            </motion.div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {PAD.map(key => (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className={`
                    h-14 rounded-2xl font-display text-xl font-bold
                    active:scale-90 transition-transform duration-100 select-none
                    ${key === '✓'
                      ? 'bg-gem/30 text-gem-light border border-gem/40'
                      : key === '⌫'
                      ? 'bg-white/5 text-white/60 border border-white/10'
                      : 'bg-white/8 text-white border border-white/10 active:bg-white/15'
                    }
                  `}
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setPin(''); onCancel() }}
              className="w-full mt-4 py-3 text-white/40 font-body text-sm active:text-white/70"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
