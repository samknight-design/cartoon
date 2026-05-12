import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

interface BottomNavProps {
  onParentPress: () => void
}

export default function BottomNav({ onParentPress }: BottomNavProps) {
  const { activeTab, setActiveTab } = useAppStore()

  const tabs = [
    { id: 'tasks' as const, icon: '✅', label: 'Tasks' },
    { id: 'rewards' as const, icon: '🎁', label: 'Rewards' },
  ]

  return (
    <div className="flex-none bg-space-900/90 border-t border-white/10 backdrop-blur-sm safe-bottom">
      <div className="flex items-center h-16">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center h-full gap-1 active:scale-90 transition-transform"
          >
            <span className="text-2xl leading-none">{tab.icon}</span>
            <span className={`text-xs font-body font-bold ${activeTab === tab.id ? 'text-white' : 'text-white/40'}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 w-12 h-0.5 bg-coin rounded-full"
              />
            )}
          </button>
        ))}

        {/* Parent button */}
        <button
          onClick={onParentPress}
          className="flex-none px-4 flex flex-col items-center justify-center h-full gap-1 active:scale-90 transition-transform"
        >
          <span className="text-2xl leading-none">⚙️</span>
          <span className="text-xs font-body font-bold text-white/40">Parent</span>
        </button>
      </div>
    </div>
  )
}
