import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Child, Task, Reward, Screen, Celebration, DEFAULT_TASKS, DEFAULT_REWARDS } from '../types'

let nextId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36)

interface AppState {
  // Setup
  isSetup: boolean
  pin: string

  // Data
  children: Child[]
  tasks: Task[]
  rewards: Reward[]

  // Navigation
  screen: Screen
  selectedChildId: string | null
  activeTab: 'tasks' | 'rewards'

  // UI
  celebration: Celebration | null

  // Actions
  setupApp: (pin: string) => void
  verifyPin: (pin: string) => boolean
  changePin: (oldPin: string, newPin: string) => boolean

  addChild: (child: Omit<Child, 'id'>) => string
  updateChild: (id: string, updates: Partial<Child>) => void
  deleteChild: (id: string) => void

  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (taskId: string, childId: string) => void

  addReward: (reward: Omit<Reward, 'id'>) => void
  updateReward: (id: string, updates: Partial<Reward>) => void
  deleteReward: (id: string) => void
  redeemReward: (rewardId: string, childId: string) => boolean

  adjustBalance: (childId: string, coins: number, gems: number) => void

  // Navigation
  goToHome: () => void
  goToChild: (childId: string) => void
  goToParent: () => void
  setActiveTab: (tab: 'tasks' | 'rewards') => void
  dismissCelebration: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isSetup: false,
      pin: '',
      children: [],
      tasks: [],
      rewards: [],
      screen: 'setup',
      selectedChildId: null,
      activeTab: 'tasks',
      celebration: null,

      setupApp: (pin) => {
        const tasks = DEFAULT_TASKS.map(t => ({ ...t, id: nextId() }))
        const rewards = DEFAULT_REWARDS.map(r => ({ ...r, id: nextId() }))
        set({ isSetup: true, pin, tasks, rewards, screen: 'home' })
      },

      verifyPin: (pin) => get().pin === pin,

      changePin: (oldPin, newPin) => {
        if (get().pin !== oldPin) return false
        set({ pin: newPin })
        return true
      },

      addChild: (child) => {
        const id = nextId()
        set(s => ({ children: [...s.children, { ...child, id }] }))
        return id
      },

      updateChild: (id, updates) =>
        set(s => ({ children: s.children.map(c => c.id === id ? { ...c, ...updates } : c) })),

      deleteChild: (id) =>
        set(s => ({ children: s.children.filter(c => c.id !== id) })),

      addTask: (task) =>
        set(s => ({ tasks: [...s.tasks, { ...task, id: nextId() }] })),

      updateTask: (id, updates) =>
        set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t) })),

      deleteTask: (id) =>
        set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),

      completeTask: (taskId, childId) => {
        const { tasks, children } = get()
        const task = tasks.find(t => t.id === taskId)
        const child = children.find(c => c.id === childId)
        if (!task || !child) return

        set(s => ({
          children: s.children.map(c =>
            c.id === childId
              ? { ...c, coins: c.coins + task.coinReward, gems: c.gems + task.gemReward }
              : c
          ),
          celebration: {
            childName: child.name,
            childColor: child.color,
            icon: task.icon,
            title: task.title,
            message: 'Great job! You earned:',
            coins: task.coinReward,
            gems: task.gemReward,
            type: 'earn',
          },
        }))
      },

      addReward: (reward) =>
        set(s => ({ rewards: [...s.rewards, { ...reward, id: nextId() }] })),

      updateReward: (id, updates) =>
        set(s => ({ rewards: s.rewards.map(r => r.id === id ? { ...r, ...updates } : r) })),

      deleteReward: (id) =>
        set(s => ({ rewards: s.rewards.filter(r => r.id !== id) })),

      redeemReward: (rewardId, childId) => {
        const { rewards, children } = get()
        const reward = rewards.find(r => r.id === rewardId)
        const child = children.find(c => c.id === childId)
        if (!reward || !child) return false
        if (child.coins < reward.coinCost || child.gems < reward.gemCost) return false

        set(s => ({
          children: s.children.map(c =>
            c.id === childId
              ? { ...c, coins: c.coins - reward.coinCost, gems: c.gems - reward.gemCost }
              : c
          ),
          celebration: {
            childName: child.name,
            childColor: child.color,
            icon: reward.icon,
            title: reward.title,
            message: 'Enjoy your reward!',
            coins: reward.coinCost,
            gems: reward.gemCost,
            type: 'spend',
          },
        }))
        return true
      },

      adjustBalance: (childId, coins, gems) =>
        set(s => ({
          children: s.children.map(c =>
            c.id === childId
              ? { ...c, coins: Math.max(0, c.coins + coins), gems: Math.max(0, c.gems + gems) }
              : c
          ),
        })),

      goToHome: () => set({ screen: 'home', selectedChildId: null }),
      goToChild: (childId) => set({ screen: 'tasks', selectedChildId: childId, activeTab: 'tasks' }),
      goToParent: () => set({ screen: 'parent' }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      dismissCelebration: () => set({ celebration: null }),
    }),
    {
      name: 'reward-quest-data',
    }
  )
)
