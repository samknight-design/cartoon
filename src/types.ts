export interface Child {
  id: string
  name: string
  avatar: string
  color: string
  coins: number
  gems: number
}

export interface Task {
  id: string
  title: string
  description: string
  icon: string
  coinReward: number
  gemReward: number
  isActive: boolean
}

export interface Reward {
  id: string
  title: string
  description: string
  icon: string
  coinCost: number
  gemCost: number
}

export interface Celebration {
  childName: string
  childColor: string
  icon: string
  title: string
  message: string
  coins: number
  gems: number
  type: 'earn' | 'spend'
}

export type Screen = 'setup' | 'home' | 'tasks' | 'rewards' | 'parent'

export const CHILD_AVATARS = ['👦', '👧', '🧒', '👶', '🦊', '🐺', '🐯', '🦁', '🐸', '🦋', '🌟', '⚡', '🔥', '🌈', '💫', '🚀']
export const CHILD_COLORS = [
  '#FF6B9D', '#4ECDC4', '#FF9500', '#9B59B6',
  '#2ECC71', '#E74C3C', '#3498DB', '#F39C12',
]

export const DEFAULT_TASKS: Omit<Task, 'id'>[] = [
  { title: 'Make Your Bed', description: 'Tidy your bed in the morning', icon: '🛏️', coinReward: 5, gemReward: 0, isActive: true },
  { title: 'Tidy Your Room', description: 'Put everything away neatly', icon: '🧹', coinReward: 10, gemReward: 0, isActive: true },
  { title: 'Help With Dishes', description: 'Wash or dry the dishes after dinner', icon: '🍽️', coinReward: 8, gemReward: 0, isActive: true },
  { title: 'Read for 20 Minutes', description: 'Quiet reading time', icon: '📚', coinReward: 15, gemReward: 1, isActive: true },
  { title: 'Be Extra Kind', description: 'Do something kind for someone', icon: '💝', coinReward: 5, gemReward: 1, isActive: true },
  { title: 'Exercise', description: '20 minutes of exercise or sport', icon: '🏃', coinReward: 10, gemReward: 1, isActive: true },
  { title: 'Eat All Your Dinner', description: 'Finish your plate — yum!', icon: '🥗', coinReward: 5, gemReward: 0, isActive: true },
  { title: 'Go to Bed On Time', description: 'In bed by bedtime, no fuss!', icon: '🌙', coinReward: 10, gemReward: 0, isActive: true },
  { title: 'Homework Done', description: 'Complete all homework neatly', icon: '✏️', coinReward: 15, gemReward: 1, isActive: true },
  { title: 'Brush Teeth Twice', description: 'Morning and night brushing', icon: '🦷', coinReward: 5, gemReward: 0, isActive: true },
]

export const DEFAULT_REWARDS: Omit<Reward, 'id'>[] = [
  { title: 'Extra Screen Time', description: '30 minutes extra screen time', icon: '📱', coinCost: 25, gemCost: 0 },
  { title: 'Ice Cream Treat', description: 'Pick your favourite flavour!', icon: '🍦', coinCost: 30, gemCost: 0 },
  { title: 'Choose Dinner', description: 'You pick what\'s for tea tonight!', icon: '🍕', coinCost: 50, gemCost: 0 },
  { title: 'New Book', description: 'Choose any new book you want', icon: '📖', coinCost: 75, gemCost: 0 },
  { title: 'Takeaway Night', description: 'Takeaway of your choice', icon: '🛵', coinCost: 75, gemCost: 1 },
  { title: 'Small Toy', description: 'Pick a small toy or game', icon: '🧸', coinCost: 100, gemCost: 2 },
  { title: 'New Toy', description: 'A bigger toy or board game', icon: '🎮', coinCost: 150, gemCost: 3 },
  { title: 'Sleepover', description: 'A friend stays over!', icon: '🏕️', coinCost: 200, gemCost: 4 },
  { title: 'Cinema Trip', description: 'A trip to the cinema — popcorn included!', icon: '🎬', coinCost: 200, gemCost: 3 },
  { title: 'Day Out', description: 'A fun day out — you choose where!', icon: '🎡', coinCost: 300, gemCost: 5 },
]
