import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import BottomNav from '../components/BottomNav'
import PinModal from '../components/PinModal'

export default function ChildScreen() {
  const {
    children, tasks, rewards,
    selectedChildId, activeTab, setActiveTab,
    goToHome, goToParent, verifyPin,
    completeTask, redeemReward,
  } = useAppStore()

  const child = children.find(c => c.id === selectedChildId)
  const [showParentPin, setShowParentPin] = useState(false)
  const [prevCoins, setPrevCoins] = useState(child?.coins ?? 0)
  const [prevGems, setPrevGems] = useState(child?.gems ?? 0)
  const [coinAnim, setCoinAnim] = useState(false)
  const [gemAnim, setGemAnim] = useState(false)

  useEffect(() => {
    if (!child) return
    if (child.coins !== prevCoins) {
      setCoinAnim(true)
      setTimeout(() => setCoinAnim(false), 400)
      setPrevCoins(child.coins)
    }
    if (child.gems !== prevGems) {
      setGemAnim(true)
      setTimeout(() => setGemAnim(false), 400)
      setPrevGems(child.gems)
    }
  }, [child?.coins, child?.gems])

  if (!child) return null

  const activeTasks = tasks.filter(t => t.isActive)
  const affordableRewards = rewards.filter(r => r.coinCost <= child.coins && r.gemCost <= child.gems)

  return (
    <div className="screen-container relative" style={{ background: `radial-gradient(ellipse at top, ${child.color}15, #0A0818 60%)` }}>

      {/* Header */}
      <div className="flex-none px-5 pt-2">
        <div className="flex items-center gap-3 py-3">
          <button onClick={goToHome} className="text-white/50 active:text-white p-1 -ml-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-none"
            style={{ backgroundColor: child.color + '30', border: `2px solid ${child.color}60` }}
          >
            {child.avatar}
          </div>

          <div className="flex-1">
            <h1 className="font-display text-2xl text-white leading-none">{child.name}</h1>
            <p className="text-white/40 text-xs font-body">Keep up the great work!</p>
          </div>
        </div>

        {/* Balance bar */}
        <div
          className="flex gap-3 mb-4 p-4 rounded-2xl"
          style={{ background: `linear-gradient(135deg, ${child.color}15, ${child.color}08)`, border: `1px solid ${child.color}30` }}
        >
          <motion.div
            animate={coinAnim ? { scale: [1, 1.3, 1] } : {}}
            className="flex-1 flex items-center gap-3"
          >
            <motion.span
              className="text-4xl leading-none"
              animate={{ rotate: coinAnim ? [0, 360] : 0 }}
              transition={{ duration: 0.5 }}
            >
              🪙
            </motion.span>
            <div>
              <motion.div
                key={child.coins}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-display text-3xl text-coin leading-none"
              >
                {child.coins.toLocaleString()}
              </motion.div>
              <div className="text-white/40 text-xs font-body">coins</div>
            </div>
          </motion.div>

          <div className="w-px bg-white/10" />

          <motion.div
            animate={gemAnim ? { scale: [1, 1.3, 1] } : {}}
            className="flex-1 flex items-center gap-3"
          >
            <motion.span
              className="text-4xl leading-none"
              animate={{ scale: gemAnim ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              💎
            </motion.span>
            <div>
              <motion.div
                key={child.gems}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-display text-3xl text-gem-light leading-none"
              >
                {child.gems}
              </motion.div>
              <div className="text-white/40 text-xs font-body">gems</div>
            </div>
          </motion.div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-space-800 rounded-2xl p-1 mb-1">
          {[
            { id: 'tasks' as const, label: '✅ Tasks', count: activeTasks.length },
            { id: 'rewards' as const, label: '🎁 Rewards', count: rewards.length, badge: affordableRewards.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 py-2 rounded-xl font-body font-bold text-sm transition-all duration-200 active:scale-95"
              style={activeTab === tab.id ? {
                background: `linear-gradient(135deg, ${child.color}30, ${child.color}15)`,
                color: 'white',
                border: `1px solid ${child.color}40`,
              } : { color: 'rgba(255,255,255,0.4)' }}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-gem text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-display">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="scrollable-content px-5 py-3">
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {activeTasks.length === 0 && (
                <div className="text-center py-12 text-white/30 font-body">
                  No tasks yet — ask a parent to add some! ✨
                </div>
              )}
              {activeTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-card p-4 flex items-center gap-4"
                  style={{ borderColor: child.color + '20' }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-none"
                    style={{ backgroundColor: child.color + '20' }}
                  >
                    {task.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg text-white leading-tight">{task.title}</h3>
                    <p className="text-white/50 text-xs font-body truncate">{task.description}</p>
                    <div className="flex gap-3 mt-1">
                      {task.coinReward > 0 && (
                        <span className="text-coin font-body font-bold text-sm">🪙 +{task.coinReward}</span>
                      )}
                      {task.gemReward > 0 && (
                        <span className="text-gem-light font-body font-bold text-sm">💎 +{task.gemReward}</span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => completeTask(task.id, child.id)}
                    className="flex-none w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold active:brightness-110 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${child.color}, ${child.color}80)`,
                      boxShadow: `0 4px 15px ${child.color}40`,
                    }}
                  >
                    ✓
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {rewards.length === 0 && (
                <div className="text-center py-12 text-white/30 font-body">
                  No rewards yet — ask a parent to add some! 🎁
                </div>
              )}
              {rewards.map((reward, i) => {
                const canAfford = child.coins >= reward.coinCost && child.gems >= reward.gemCost
                return (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="glass-card p-4 flex items-center gap-4"
                    style={{
                      borderColor: canAfford ? '#FFD70040' : 'rgba(255,255,255,0.08)',
                      opacity: canAfford ? 1 : 0.6,
                    }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-none bg-white/5">
                      {reward.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg text-white leading-tight">{reward.title}</h3>
                      <p className="text-white/50 text-xs font-body truncate">{reward.description}</p>
                      <div className="flex gap-3 mt-1">
                        {reward.coinCost > 0 && (
                          <span className={`font-body font-bold text-sm ${child.coins >= reward.coinCost ? 'text-coin' : 'text-red-400'}`}>
                            🪙 {reward.coinCost}
                          </span>
                        )}
                        {reward.gemCost > 0 && (
                          <span className={`font-body font-bold text-sm ${child.gems >= reward.gemCost ? 'text-gem-light' : 'text-red-400'}`}>
                            💎 {reward.gemCost}
                          </span>
                        )}
                      </div>
                    </div>
                    {canAfford ? (
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => redeemReward(reward.id, child.id)}
                        className="flex-none px-3 py-2 rounded-xl font-display text-sm text-space-900 font-bold active:brightness-90 transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #FFE566, #FFD700)',
                          boxShadow: '0 4px 12px #FFD70040',
                        }}
                      >
                        Redeem!
                      </motion.button>
                    ) : (
                      <div className="flex-none px-3 py-2 rounded-xl bg-white/5 text-white/30 font-display text-sm">
                        🔒
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav onParentPress={() => setShowParentPin(true)} />

      <PinModal
        isOpen={showParentPin}
        title="Parent Access"
        subtitle="Enter your PIN"
        verifyPin={verifyPin}
        onSuccess={() => { setShowParentPin(false); goToParent() }}
        onCancel={() => setShowParentPin(false)}
      />
    </div>
  )
}
