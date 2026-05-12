import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { CHILD_AVATARS, CHILD_COLORS } from '../types'
import PinModal from '../components/PinModal'

export default function HomeScreen() {
  const { children, goToChild, goToParent, verifyPin, addChild } = useAppStore()
  const [showParentPin, setShowParentPin] = useState(false)
  const [showAddChild, setShowAddChild] = useState(false)
  const [childName, setChildName] = useState('')
  const [childAvatar, setChildAvatar] = useState(CHILD_AVATARS[0])
  const [childColor, setChildColor] = useState(CHILD_COLORS[0])

  const handleAddChild = () => {
    if (!childName.trim()) return
    addChild({ name: childName.trim(), avatar: childAvatar, color: childColor, coins: 0, gems: 0 })
    setChildName('')
    setChildAvatar(CHILD_AVATARS[0])
    setChildColor(CHILD_COLORS[0])
    setShowAddChild(false)
  }

  return (
    <div className="screen-container bg-space-900 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-gem-dark/10 to-space-950 pointer-events-none" />

      {/* Header */}
      <div className="flex-none px-5 pt-safe-top">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="font-display text-3xl text-white">Reward Quest</h1>
            <p className="text-white/50 font-body text-sm">Who's playing today?</p>
          </div>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="text-5xl"
          >
            ⭐
          </motion.div>
        </div>
      </div>

      <div className="scrollable-content px-5 pb-4 relative z-10">
        {/* Children grid */}
        {children.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="text-7xl mb-4">👨‍👩‍👧‍👦</div>
            <p className="text-white/60 font-body text-lg mb-6">No children added yet!</p>
            <button
              onClick={() => setShowParentPin(true)}
              className="btn-primary bg-gradient-to-r from-gem-dark to-gem text-white"
            >
              Open Parent Panel
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 py-2">
            {children.map((child, i) => (
              <motion.button
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => goToChild(child.id)}
                className="glass-card-hover p-5 flex items-center gap-4 relative overflow-hidden text-left"
                style={{ borderColor: child.color + '40' }}
              >
                {/* Color accent */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ backgroundColor: child.color }}
                />

                {/* Avatar */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-none"
                  style={{ backgroundColor: child.color + '25', border: `2px solid ${child.color}50` }}
                >
                  {child.avatar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-2xl text-white">{child.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-coin font-body font-bold">
                      🪙 <span>{child.coins.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center gap-1 text-gem-light font-body font-bold">
                      💎 <span>{child.gems}</span>
                    </span>
                  </div>
                </div>

                <div className="text-white/30 text-2xl">›</div>
              </motion.button>
            ))}

            {/* Add child card */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: children.length * 0.08 + 0.1 }}
              onClick={() => setShowParentPin(true)}
              className="glass-card border-dashed border-white/20 p-5 flex items-center justify-center gap-3 text-white/40 active:scale-95 transition-transform"
            >
              <span className="text-2xl">＋</span>
              <span className="font-body text-base">Add another child</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Parent button */}
      <div className="flex-none px-5 pb-4 relative z-10">
        <button
          onClick={() => setShowParentPin(true)}
          className="w-full py-3 glass-card flex items-center justify-center gap-2 text-white/50 active:text-white/80 active:scale-95 transition-all"
        >
          <span>⚙️</span>
          <span className="font-body text-sm">Parent Panel</span>
          <span className="text-xs">🔒</span>
        </button>
      </div>

      <PinModal
        isOpen={showParentPin}
        title="Parent Access"
        subtitle="Enter your PIN to continue"
        verifyPin={verifyPin}
        onSuccess={() => { setShowParentPin(false); goToParent() }}
        onCancel={() => setShowParentPin(false)}
      />
    </div>
  )
}
