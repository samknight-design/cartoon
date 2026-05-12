import { useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useAppStore } from '../store/useAppStore'

const CONFETTI_COLORS = ['#FFD700', '#9333EA', '#06B6D4', '#FF6B9D', '#4ECDC4', '#FF9500', '#ffffff']

export default function CelebrationOverlay() {
  const { celebration, dismissCelebration } = useAppStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!celebration) return

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...opts,
        origin: { y: 0.5 },
        particleCount: Math.floor(200 * particleRatio),
        colors: CONFETTI_COLORS,
        disableForReducedMotion: true,
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })

    timerRef.current = setTimeout(dismissCelebration, 3500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [celebration, dismissCelebration])

  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.5 + Math.random() * 1.5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 8,
      rot: Math.random() * 720,
      isEmoji: i < 8,
      emoji: ['⭐', '💰', '💎', '🌟', '✨', '🎉', '🎊', '🏆'][i % 8],
    })), [])

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={dismissCelebration}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

          {/* Falling particles */}
          {particles.map(p => (
            <div
              key={p.id}
              className="confetti-particle pointer-events-none"
              style={{
                left: `${p.x}%`,
                '--dur': `${p.duration}s`,
                '--delay': `${p.delay}s`,
                '--rot': `${p.rot}deg`,
                width: p.isEmoji ? undefined : p.size,
                height: p.isEmoji ? undefined : p.size,
                backgroundColor: p.isEmoji ? undefined : p.color,
                fontSize: p.isEmoji ? '24px' : undefined,
              } as React.CSSProperties}
            >
              {p.isEmoji ? p.emoji : null}
            </div>
          ))}

          {/* Main card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="relative z-10 text-center px-8 py-10 mx-6"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${celebration.childColor}30, #0A081880)`,
              border: `2px solid ${celebration.childColor}60`,
              borderRadius: '2rem',
              backdropFilter: 'blur(12px)',
              boxShadow: `0 0 60px ${celebration.childColor}40`,
            }}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-8xl mb-4 leading-none"
            >
              {celebration.icon}
            </motion.div>

            {/* Child name */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-xl mb-1"
              style={{ color: celebration.childColor }}
            >
              {celebration.childName}
            </motion.p>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="font-display text-3xl text-white mb-2"
            >
              {celebration.title}
            </motion.h2>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/70 font-body text-base mb-6"
            >
              {celebration.message}
            </motion.p>

            {/* Rewards earned/spent */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, type: 'spring' }}
              className="flex justify-center gap-6"
            >
              {celebration.coins > 0 && (
                <div className="flex items-center gap-2 bg-coin/20 px-4 py-2 rounded-2xl border border-coin/40">
                  <span className="text-2xl">🪙</span>
                  <span className="font-display text-2xl text-coin">
                    {celebration.type === 'earn' ? '+' : '-'}{celebration.coins}
                  </span>
                </div>
              )}
              {celebration.gems > 0 && (
                <div className="flex items-center gap-2 bg-gem/20 px-4 py-2 rounded-2xl border border-gem/40">
                  <span className="text-2xl">💎</span>
                  <span className="font-display text-2xl text-gem-light">
                    {celebration.type === 'earn' ? '+' : '-'}{celebration.gems}
                  </span>
                </div>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-white/30 text-sm mt-6 font-body"
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
