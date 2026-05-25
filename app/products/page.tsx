import type { Metadata } from 'next'
import Link from 'next/link'
import { Flame, Filter, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse our catalogue of D&D miniatures, Warhammer models, terrain, and scenery. All printed to order in high-detail resin or FDM.',
}

const categories = [
  { id: 'all', label: 'All Products' },
  { id: 'dnd', label: 'D&D & Fantasy' },
  { id: 'warhammer', label: 'Warhammer' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'accessories', label: 'Accessories' },
]

const products = [
  {
    id: 1, category: 'dnd',
    name: 'Dragonborn Paladin (28mm)',
    desc: 'Heroic-scale Dragonborn warrior in full plate armour, posed mid-battle. Perfect for D&D or Pathfinder.',
    price: 8.99,
    material: 'Resin',
    detail: 'Ultra Detail',
    icon: '🐉',
    badge: 'Best Seller',
  },
  {
    id: 2, category: 'dnd',
    name: 'Ancient Red Dragon',
    desc: 'Massive 120mm wingspan dragon with intricate scale detail. The ultimate boss monster for your campaign.',
    price: 34.99,
    material: 'Resin',
    detail: 'Ultra Detail',
    icon: '🐲',
    badge: 'Featured',
  },
  {
    id: 3, category: 'dnd',
    name: 'Dungeon Adventurer Pack (x5)',
    desc: 'Five adventurers: Fighter, Rogue, Wizard, Cleric, and Ranger. Start your party today.',
    price: 29.99,
    material: 'Resin',
    detail: 'Standard',
    icon: '⚔️',
    badge: 'Value Pack',
  },
  {
    id: 4, category: 'dnd',
    name: 'Beholder Eye Tyrant',
    desc: 'Iconic D&D monster with 10 articulated eye stalks. A campaign centrepiece.',
    price: 19.99,
    material: 'Resin',
    detail: 'Ultra Detail',
    icon: '👁️',
    badge: null,
  },
  {
    id: 5, category: 'warhammer',
    name: 'Space Marine Tactical Squad (x10)',
    desc: 'Full 10-man tactical squad in Mk VII armour. Compatible with GW basing.',
    price: 49.99,
    material: 'Resin',
    detail: 'Ultra Detail',
    icon: '🔱',
    badge: 'Popular',
  },
  {
    id: 6, category: 'warhammer',
    name: 'Chaos Space Marine Warband (x5)',
    desc: 'Corrupted Astartes with spikes, mutations and detailed chaos iconography.',
    price: 27.99,
    material: 'Resin',
    detail: 'Ultra Detail',
    icon: '💀',
    badge: null,
  },
  {
    id: 7, category: 'warhammer',
    name: 'Necron Warrior Squad (x10)',
    desc: 'Skeletal metallic warriors with gauss flayers. Every rivet and circuit rendered perfectly.',
    price: 39.99,
    material: 'Resin',
    detail: 'Standard',
    icon: '🤖',
    badge: 'New',
  },
  {
    id: 8, category: 'warhammer',
    name: 'Age of Sigmar: Stormcast Eternal',
    desc: 'Celestial warrior hero with lightning effects. Ideal centre-piece model.',
    price: 14.99,
    material: 'Resin',
    detail: 'Ultra Detail',
    icon: '⚡',
    badge: null,
  },
  {
    id: 9, category: 'terrain',
    name: 'Modular Dungeon Tile Set (20 pieces)',
    desc: '20 interlocking 50mm dungeon floor tiles. Build infinite dungeon layouts.',
    price: 24.99,
    material: 'FDM',
    detail: 'Standard',
    icon: '🏚️',
    badge: 'Best Seller',
  },
  {
    id: 10, category: 'terrain',
    name: 'Gothic Cathedral Ruins',
    desc: 'Large-scale ruined cathedral with detailed stonework and stained-glass window frames.',
    price: 54.99,
    material: 'FDM',
    detail: 'Standard',
    icon: '🏰',
    badge: 'Featured',
  },
  {
    id: 11, category: 'terrain',
    name: 'Fantasy Tavern Interior Set',
    desc: 'Tables, bar counter, barrels, stools and fireplace. Everything for the perfect tavern scene.',
    price: 39.99,
    material: 'FDM',
    detail: 'Standard',
    icon: '🍺',
    badge: null,
  },
  {
    id: 12, category: 'accessories',
    name: 'Magnetic Round Base Set (x50)',
    desc: '25mm and 32mm magnetic bases for easy storage and transport of your collection.',
    price: 12.99,
    material: 'FDM',
    detail: 'Standard',
    icon: '⭕',
    badge: null,
  },
]

const materialColors: Record<string, string> = {
  Resin: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  FDM: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
}

const badgeColors: Record<string, string> = {
  'Best Seller': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Featured: 'bg-flame-500/20 text-flame-400 border-flame-500/30',
  'Value Pack': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Popular: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  New: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

export default function ProductsPage() {
  return (
    <div className="pt-24 pb-24 min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <div className="divider" />
        <h1 className="section-title">Our Catalogue</h1>
        <p className="section-subtitle">
          Hundreds of models available to order. All printed fresh for your order — no warehouse stock, maximum quality.
        </p>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`/products${cat.id !== 'all' ? `?category=${cat.id}` : ''}`}
              className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:border-amber-500/40 hover:text-amber-400 text-sm font-medium transition-colors"
            >
              {cat.label}
            </a>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card group hover:border-amber-500/20 transition-all duration-200 hover:scale-[1.02] flex flex-col">
              {/* Image placeholder */}
              <div className="h-48 bg-gradient-to-br from-arcane-600 to-arcane-700 rounded-t-xl flex items-center justify-center relative">
                <span className="text-5xl">{product.icon}</span>
                {product.badge && (
                  <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-md border font-medium ${badgeColors[product.badge] || 'bg-white/10 text-slate-300'}`}>
                    {product.badge}
                  </span>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${materialColors[product.material]}`}>
                    {product.material}
                  </span>
                  <span className="text-xs text-slate-500">{product.detail}</span>
                </div>

                <h3 className="text-white font-semibold text-sm leading-snug mb-2 group-hover:text-amber-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed flex-1 mb-4">
                  {product.desc}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-amber-400 font-bold text-lg">£{product.price.toFixed(2)}</span>
                  <Link
                    href={`/custom-order?product=${product.id}`}
                    className="text-sm btn-primary py-2 px-4"
                  >
                    Order
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom order CTA */}
        <div className="mt-16 card p-8 text-center bg-gradient-to-br from-amber-900/20 to-arcane-700">
          <Flame className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Don't See What You Need?</h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            Upload any STL file and we'll print it for you. Our instant quote tool gives you a price in seconds.
          </p>
          <Link href="/custom-order" className="btn-primary">
            Upload Your Own STL <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
