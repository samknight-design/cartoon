import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store/useAppStore'
import Starfield from './components/Starfield'
import CelebrationOverlay from './components/CelebrationOverlay'
import SetupScreen from './screens/SetupScreen'
import HomeScreen from './screens/HomeScreen'
import ChildScreen from './screens/ChildScreen'
import ParentScreen from './screens/ParentScreen'

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
}

export default function App() {
  const { screen, isSetup } = useAppStore()

  const currentScreen = !isSetup ? 'setup' : screen

  const screenOrder = ['setup', 'home', 'tasks', 'parent']
  const screenIndex = screenOrder.indexOf(currentScreen)

  return (
    <div className="relative w-full h-full overflow-hidden bg-space-900">
      <Starfield />

      <AnimatePresence mode="wait" custom={screenIndex}>
        <motion.div
          key={currentScreen}
          custom={screenIndex}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          className="absolute inset-0"
        >
          {currentScreen === 'setup' && <SetupScreen />}
          {currentScreen === 'home' && <HomeScreen />}
          {(currentScreen === 'tasks' || currentScreen === 'rewards') && <ChildScreen />}
          {currentScreen === 'parent' && <ParentScreen />}
        </motion.div>
      </AnimatePresence>

      <CelebrationOverlay />
    </div>
  )
}
