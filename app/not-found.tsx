import Link from 'next/link'
import { Flame } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <Flame className="w-16 h-16 text-amber-500/30 mb-6" />
      <h1 className="text-6xl font-display font-bold gradient-text mb-4">404</h1>
      <h2 className="text-2xl font-display font-bold text-white mb-3">Page Not Found</h2>
      <p className="text-slate-400 mb-8 max-w-md">
        Looks like this scroll has been lost to the dungeon. Let's get you back on the map.
      </p>
      <div className="flex gap-4">
        <Link href="/" className="btn-primary">Back to Home</Link>
        <Link href="/products" className="btn-secondary">Browse Products</Link>
      </div>
    </div>
  )
}
