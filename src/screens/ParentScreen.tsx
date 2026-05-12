import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { CHILD_AVATARS, CHILD_COLORS } from '../types'

type ParentTab = 'children' | 'tasks' | 'rewards'

export default function ParentScreen() {
  const {
    children, tasks, rewards,
    goToHome,
    addChild, updateChild, deleteChild, adjustBalance,
    addTask, updateTask, deleteTask,
    addReward, updateReward, deleteReward,
    pin, changePin,
  } = useAppStore()

  const [tab, setTab] = useState<ParentTab>('children')

  // Child form
  const [childForm, setChildForm] = useState({ name: '', avatar: CHILD_AVATARS[0], color: CHILD_COLORS[0] })
  const [editingChildId, setEditingChildId] = useState<string | null>(null)

  // Task form
  const [taskForm, setTaskForm] = useState({ title: '', description: '', icon: '⭐', coinReward: 10, gemReward: 0 })
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)

  // Reward form
  const [rewardForm, setRewardForm] = useState({ title: '', description: '', icon: '🎁', coinCost: 50, gemCost: 0 })
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null)
  const [showRewardForm, setShowRewardForm] = useState(false)

  // Balance adjust
  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [adjustCoins, setAdjustCoins] = useState(0)
  const [adjustGems, setAdjustGems] = useState(0)

  // PIN change
  const [showPinChange, setShowPinChange] = useState(false)
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState('')

  const handleSaveTask = () => {
    if (!taskForm.title.trim()) return
    if (editingTaskId) {
      updateTask(editingTaskId, { ...taskForm, isActive: true })
      setEditingTaskId(null)
    } else {
      addTask({ ...taskForm, isActive: true })
    }
    setTaskForm({ title: '', description: '', icon: '⭐', coinReward: 10, gemReward: 0 })
    setShowTaskForm(false)
  }

  const handleEditTask = (id: string) => {
    const t = tasks.find(t => t.id === id)!
    setTaskForm({ title: t.title, description: t.description, icon: t.icon, coinReward: t.coinReward, gemReward: t.gemReward })
    setEditingTaskId(id)
    setShowTaskForm(true)
  }

  const handleSaveReward = () => {
    if (!rewardForm.title.trim()) return
    if (editingRewardId) {
      updateReward(editingRewardId, rewardForm)
      setEditingRewardId(null)
    } else {
      addReward(rewardForm)
    }
    setRewardForm({ title: '', description: '', icon: '🎁', coinCost: 50, gemCost: 0 })
    setShowRewardForm(false)
  }

  const handleEditReward = (id: string) => {
    const r = rewards.find(r => r.id === id)!
    setRewardForm({ title: r.title, description: r.description, icon: r.icon, coinCost: r.coinCost, gemCost: r.gemCost })
    setEditingRewardId(id)
    setShowRewardForm(true)
  }

  const handlePinChange = () => {
    if (newPin.length < 4) { setPinError('PIN must be 4 digits'); return }
    if (changePin(oldPin, newPin)) {
      setShowPinChange(false)
      setOldPin('')
      setNewPin('')
      setPinError('')
    } else {
      setPinError('Incorrect current PIN')
    }
  }

  const TASK_ICONS = ['⭐', '🛏️', '🧹', '🍽️', '📚', '💝', '🏃', '🥗', '🌙', '✏️', '🦷', '🐕', '🧺', '🏡', '🎨', '🎵', '🌱', '🍳', '🧸', '⚽']
  const REWARD_ICONS = ['🎁', '📱', '🍦', '🍕', '📖', '🛵', '🧸', '🎮', '🏕️', '🎬', '🎡', '🎠', '🎪', '🏖️', '🎢', '🍰', '🎭', '🎨', '🎯', '🎲']

  const tabs: { id: ParentTab; label: string; icon: string }[] = [
    { id: 'children', label: 'Children', icon: '👨‍👩‍👧‍👦' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' },
  ]

  return (
    <div className="screen-container bg-space-900">
      <div className="absolute inset-0 bg-gradient-to-b from-space-800 to-space-950 pointer-events-none" />

      {/* Header */}
      <div className="flex-none px-5 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <button onClick={goToHome} className="text-white/50 active:text-white flex items-center gap-1 -ml-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="font-display text-2xl text-white">Parent Panel</h1>
          <button onClick={() => setShowPinChange(!showPinChange)} className="text-white/40 text-sm active:text-white/70">
            🔑
          </button>
        </div>

        {/* PIN change panel */}
        <AnimatePresence>
          {showPinChange && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 glass-card space-y-2">
                <p className="text-white/70 text-sm font-body font-bold mb-2">Change PIN</p>
                <input
                  type="number"
                  placeholder="Current PIN"
                  value={oldPin}
                  onChange={e => setOldPin(e.target.value.slice(0, 4))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-body text-sm outline-none"
                />
                <input
                  type="number"
                  placeholder="New 4-digit PIN"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.slice(0, 4))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-body text-sm outline-none"
                />
                {pinError && <p className="text-red-400 text-xs font-body">{pinError}</p>}
                <button onClick={handlePinChange} className="btn-primary bg-gem/30 text-white w-full text-sm py-2">
                  Update PIN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex bg-space-800 rounded-2xl p-1 mt-3">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl font-body font-bold text-xs transition-all ${
                tab === t.id ? 'bg-white/15 text-white' : 'text-white/40'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="scrollable-content px-5 pb-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* ===== CHILDREN ===== */}
          {tab === 'children' && (
            <motion.div key="children" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {children.map(child => (
                <div key={child.id} className="glass-card p-4" style={{ borderColor: child.color + '30' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: child.color + '25' }}
                    >
                      {child.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-lg text-white">{child.name}</p>
                      <div className="flex gap-3 text-sm font-body">
                        <span className="text-coin font-bold">🪙 {child.coins}</span>
                        <span className="text-gem-light font-bold">💎 {child.gems}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteChild(child.id)} className="text-red-400/60 active:text-red-400 text-lg p-1">
                      🗑️
                    </button>
                  </div>

                  {/* Balance adjust */}
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-white/40 text-xs font-body mb-2">Adjust balance</p>
                    {adjustId === child.id ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <label className="text-coin text-xs font-body w-16">Coins±</label>
                          <input
                            type="number"
                            value={adjustCoins}
                            onChange={e => setAdjustCoins(Number(e.target.value))}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm outline-none font-body"
                          />
                        </div>
                        <div className="flex gap-2">
                          <label className="text-gem-light text-xs font-body w-16">Gems±</label>
                          <input
                            type="number"
                            value={adjustGems}
                            onChange={e => setAdjustGems(Number(e.target.value))}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm outline-none font-body"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              adjustBalance(child.id, adjustCoins, adjustGems)
                              setAdjustId(null)
                              setAdjustCoins(0)
                              setAdjustGems(0)
                            }}
                            className="flex-1 py-1.5 bg-gem/30 text-white text-sm font-body font-bold rounded-lg"
                          >
                            Apply
                          </button>
                          <button onClick={() => setAdjustId(null)} className="flex-1 py-1.5 bg-white/10 text-white/50 text-sm font-body rounded-lg">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAdjustId(child.id); setAdjustCoins(0); setAdjustGems(0) }}
                        className="w-full py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 text-sm font-body active:bg-white/10"
                      >
                        + Adjust Balance
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add child */}
              <div className="glass-card p-4">
                <p className="font-display text-lg text-white mb-3">Add Child</p>
                <input
                  type="text"
                  placeholder="Name..."
                  value={childForm.name}
                  onChange={e => setChildForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-body text-sm outline-none mb-3 placeholder-white/30"
                  maxLength={20}
                />
                <p className="text-white/40 text-xs mb-2 font-body">Avatar</p>
                <div className="grid grid-cols-8 gap-2 mb-3">
                  {CHILD_AVATARS.map(av => (
                    <button key={av} onClick={() => setChildForm(f => ({ ...f, avatar: av }))}
                      className={`text-xl h-9 rounded-lg flex items-center justify-center ${childForm.avatar === av ? 'bg-white/20' : 'bg-white/5'}`}>
                      {av}
                    </button>
                  ))}
                </div>
                <p className="text-white/40 text-xs mb-2 font-body">Colour</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {CHILD_COLORS.map(color => (
                    <button key={color} onClick={() => setChildForm(f => ({ ...f, color }))}
                      className={`w-8 h-8 rounded-full transition-transform ${childForm.color === color ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-space-800' : ''}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
                <button
                  disabled={!childForm.name.trim()}
                  onClick={() => {
                    if (!childForm.name.trim()) return
                    addChild({ name: childForm.name.trim(), avatar: childForm.avatar, color: childForm.color, coins: 0, gems: 0 })
                    setChildForm({ name: '', avatar: CHILD_AVATARS[0], color: CHILD_COLORS[0] })
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-gem-dark to-gem text-white font-display rounded-xl disabled:opacity-40"
                >
                  Add Child
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== TASKS ===== */}
          {tab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <button
                onClick={() => { setShowTaskForm(true); setEditingTaskId(null); setTaskForm({ title: '', description: '', icon: '⭐', coinReward: 10, gemReward: 0 }) }}
                className="w-full py-3 bg-gradient-to-r from-gem-dark to-gem text-white font-display text-base rounded-2xl active:scale-95 transition-transform mb-2"
              >
                + Add New Task
              </button>

              {/* Task form */}
              <AnimatePresence>
                {showTaskForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-card p-4 space-y-3 mb-2">
                      <p className="font-display text-lg text-white">{editingTaskId ? 'Edit Task' : 'New Task'}</p>
                      <input
                        type="text" placeholder="Task title..." value={taskForm.title}
                        onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-body text-sm outline-none placeholder-white/30"
                      />
                      <input
                        type="text" placeholder="Description (optional)..." value={taskForm.description}
                        onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-body text-sm outline-none placeholder-white/30"
                      />
                      <div>
                        <p className="text-white/40 text-xs mb-2 font-body">Icon</p>
                        <div className="grid grid-cols-10 gap-1">
                          {TASK_ICONS.map(ic => (
                            <button key={ic} onClick={() => setTaskForm(f => ({ ...f, icon: ic }))}
                              className={`text-xl h-9 rounded-lg flex items-center justify-center ${taskForm.icon === ic ? 'bg-white/20' : 'bg-white/5'}`}>
                              {ic}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-coin text-xs font-body mb-1">🪙 Coin reward</p>
                          <input type="number" min="0" max="999" value={taskForm.coinReward}
                            onChange={e => setTaskForm(f => ({ ...f, coinReward: Math.max(0, Number(e.target.value)) }))}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-body text-sm outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-gem-light text-xs font-body mb-1">💎 Gem reward</p>
                          <input type="number" min="0" max="99" value={taskForm.gemReward}
                            onChange={e => setTaskForm(f => ({ ...f, gemReward: Math.max(0, Number(e.target.value)) }))}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-body text-sm outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveTask} className="flex-1 py-2.5 bg-gradient-to-r from-coin-dark to-coin text-space-900 font-display rounded-xl">
                          {editingTaskId ? 'Save Changes' : 'Add Task'}
                        </button>
                        <button onClick={() => { setShowTaskForm(false); setEditingTaskId(null) }} className="flex-1 py-2.5 bg-white/10 text-white/60 font-body rounded-xl">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {tasks.map(task => (
                <div key={task.id} className="glass-card p-3 flex items-center gap-3">
                  <span className="text-2xl">{task.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-bold text-white text-sm truncate">{task.title}</p>
                    <div className="flex gap-2 text-xs">
                      {task.coinReward > 0 && <span className="text-coin">🪙 +{task.coinReward}</span>}
                      {task.gemReward > 0 && <span className="text-gem-light">💎 +{task.gemReward}</span>}
                    </div>
                  </div>
                  <button onClick={() => updateTask(task.id, { isActive: !task.isActive })}
                    className={`text-xs px-2 py-1 rounded-lg font-body ${task.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                    {task.isActive ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => handleEditTask(task.id)} className="text-white/40 active:text-white/80 p-1">✏️</button>
                  <button onClick={() => deleteTask(task.id)} className="text-red-400/50 active:text-red-400 p-1">🗑️</button>
                </div>
              ))}
            </motion.div>
          )}

          {/* ===== REWARDS ===== */}
          {tab === 'rewards' && (
            <motion.div key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <button
                onClick={() => { setShowRewardForm(true); setEditingRewardId(null); setRewardForm({ title: '', description: '', icon: '🎁', coinCost: 50, gemCost: 0 }) }}
                className="w-full py-3 bg-gradient-to-r from-coin-dark to-coin text-space-900 font-display text-base rounded-2xl active:scale-95 transition-transform mb-2"
              >
                + Add New Reward
              </button>

              <AnimatePresence>
                {showRewardForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-card p-4 space-y-3 mb-2">
                      <p className="font-display text-lg text-white">{editingRewardId ? 'Edit Reward' : 'New Reward'}</p>
                      <input
                        type="text" placeholder="Reward title..." value={rewardForm.title}
                        onChange={e => setRewardForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-body text-sm outline-none placeholder-white/30"
                      />
                      <input
                        type="text" placeholder="Description..." value={rewardForm.description}
                        onChange={e => setRewardForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-body text-sm outline-none placeholder-white/30"
                      />
                      <div>
                        <p className="text-white/40 text-xs mb-2 font-body">Icon</p>
                        <div className="grid grid-cols-10 gap-1">
                          {REWARD_ICONS.map(ic => (
                            <button key={ic} onClick={() => setRewardForm(f => ({ ...f, icon: ic }))}
                              className={`text-xl h-9 rounded-lg flex items-center justify-center ${rewardForm.icon === ic ? 'bg-white/20' : 'bg-white/5'}`}>
                              {ic}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-coin text-xs font-body mb-1">🪙 Coin cost</p>
                          <input type="number" min="0" value={rewardForm.coinCost}
                            onChange={e => setRewardForm(f => ({ ...f, coinCost: Math.max(0, Number(e.target.value)) }))}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-body text-sm outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-gem-light text-xs font-body mb-1">💎 Gem cost</p>
                          <input type="number" min="0" value={rewardForm.gemCost}
                            onChange={e => setRewardForm(f => ({ ...f, gemCost: Math.max(0, Number(e.target.value)) }))}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-body text-sm outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveReward} className="flex-1 py-2.5 bg-gradient-to-r from-gem-dark to-gem text-white font-display rounded-xl">
                          {editingRewardId ? 'Save Changes' : 'Add Reward'}
                        </button>
                        <button onClick={() => { setShowRewardForm(false); setEditingRewardId(null) }} className="flex-1 py-2.5 bg-white/10 text-white/60 font-body rounded-xl">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {rewards.map(reward => (
                <div key={reward.id} className="glass-card p-3 flex items-center gap-3">
                  <span className="text-2xl">{reward.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-bold text-white text-sm truncate">{reward.title}</p>
                    <div className="flex gap-2 text-xs">
                      {reward.coinCost > 0 && <span className="text-coin">🪙 {reward.coinCost}</span>}
                      {reward.gemCost > 0 && <span className="text-gem-light">💎 {reward.gemCost}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleEditReward(reward.id)} className="text-white/40 active:text-white/80 p-1">✏️</button>
                  <button onClick={() => deleteReward(reward.id)} className="text-red-400/50 active:text-red-400 p-1">🗑️</button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
