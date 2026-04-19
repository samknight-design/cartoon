import Link from 'next/link'
import {
  Flame, Shield, Zap, Package, Star, ArrowRight, Upload,
  Clock, Award, Truck, Users, ChevronRight
} from 'lucide-react'

const features = [
  {
    icon: Award,
    title: 'Resin & FDM Printing',
    desc: 'Ultra-detail resin for miniatures, durable FDM for large terrain pieces. We choose the right process for your model.',
  },
  {
    icon: Clock,
    title: '3–5 Day Turnaround',
    desc: 'Fast production without cutting corners. Rush orders available for your next gaming session.',
  },
  {
    icon: Shield,
    title: 'Print Guarantee',
    desc: 'If your print fails quality inspection, we reprint it free. No arguments, no hassle.',
  },
  {
    icon: Truck,
    title: 'UK-Wide Delivery',
    desc: 'Secure tracked shipping in protective packaging. International orders welcome.',
  },
]

const categories = [
  {
    title: 'D&D Miniatures',
    desc: 'Heroes, monsters, NPCs and more. Every class, every race.',
    color: 'from-violet-600/30 to-violet-900/10',
    border: 'border-violet-500/20',
    icon: '⚔️',
    href: '/products?category=dnd',
  },
  {
    title: 'Warhammer Models',
    desc: 'Space Marines, Age of Sigmar, Necrons and full army printing.',
    color: 'from-red-700/30 to-red-900/10',
    border: 'border-red-500/20',
    icon: '🔱',
    href: '/products?category=warhammer',
  },
  {
    title: 'Terrain & Scenery',
    desc: 'Dungeons, ruins, forests, and modular dungeon tiles.',
    color: 'from-emerald-700/30 to-emerald-900/10',
    border: 'border-emerald-500/20',
    icon: '🏰',
    href: '/products?category=terrain',
  },
  {
    title: 'Custom STL Upload',
    desc: 'Your design, our printers. Upload any STL and get an instant quote.',
    color: 'from-amber-700/30 to-amber-900/10',
    border: 'border-amber-500/20',
    icon: '🔥',
    href: '/custom-order',
  },
]

const testimonials = [
  {
    name: 'Marcus T.',
    role: 'DM of 8 years',
    quote: 'The resin quality is extraordinary. My players were stunned by the detail on the dragon boss. Worth every penny.',
    stars: 5,
  },
  {
    name: 'Sarah K.',
    role: 'Warhammer 40K player',
    quote: 'Ordered a full Space Marine squad. Perfect detail, fast shipping, and they even fixed a slightly warped base for free.',
    stars: 5,
  },
  {
    name: 'James O.',
    role: 'Board game designer',
    quote: 'Used Arcane Flame for prototype pieces. The STL upload process was seamless and the results exceeded expectations.',
    stars: 5,
  },
]

const stats = [
  { value: '10,000+', label: 'Models Printed' },
  { value: '98%', label: 'Print Success Rate' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '48h', label: 'Avg. Production Time' },
]

const recentPosts = [
  {
    slug: 'best-resin-settings-dnd-miniatures',
    title: 'The Best Resin Settings for D&D Miniatures in 2024',
    excerpt: 'Getting crisp details on 28mm heroic-scale miniatures requires dialling in your resin exposure times perfectly. Here\'s our tested workflow.',
    date: 'Dec 10, 2024',
    readTime: '6 min read',
    category: 'Printing Tips',
  },
  {
    slug: 'painting-3d-printed-warhammer',
    title: 'How to Paint 3D Printed Warhammer Models Like a Pro',
    excerpt: 'Resin prints need specific prep before paint takes hold. We walk through priming, base coating, and washes for tournament-ready results.',
    date: 'Dec 3, 2024',
    readTime: '8 min read',
    category: 'Painting Guide',
  },
  {
    slug: 'terrain-building-guide-2024',
    title: 'Building Epic D&D Terrain on a Budget',
    excerpt: 'You don\'t need to spend a fortune on terrain. Our modular dungeon tile system lets you build infinite layouts for under £40.',
    date: 'Nov 28, 2024',
    readTime: '5 min read',
    category: 'Terrain',
  },
]

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-4 pt-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-arcane-900 via-arcane-800 to-arcane-900" />
        {/* Flame glow orbs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-flame-600/8 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-8">
            <Flame className="w-4 h-4" />
            Premium Tabletop 3D Printing · UK Based
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white leading-tight mb-6">
            Forge Your{' '}
            <span className="gradient-text">Legend</span>
            <br />
            in Every Detail
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Professional 3D printing for D&amp;D, Warhammer, and tabletop gaming.
            Upload your STL or choose from our catalogue — printed in ultra-detail resin
            and shipped across the UK.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/custom-order" className="btn-primary text-lg px-8 py-4">
              <Upload className="w-5 h-5" />
              Upload Your STL
            </Link>
            <Link href="/products" className="btn-secondary text-lg px-8 py-4">
              Browse Catalogue
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-6 text-slate-400 text-sm">
            {['✓ No minimum order', '✓ Free reprint guarantee', '✓ UK tracked shipping', '✓ Resin & FDM available'].map((b) => (
              <span key={b} className="text-slate-300">{b}</span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 text-xs animate-bounce">
          <span>Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-white/5 bg-arcane-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-display font-bold gradient-text mb-1">{s.value}</div>
              <div className="text-slate-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="divider mx-auto" />
          <h2 className="section-title">What We Print</h2>
          <p className="section-subtitle mx-auto text-center">
            From fearsome dragons to sprawling dungeons, every model is printed with obsessive attention to detail.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className={`card p-6 bg-gradient-to-br ${cat.color} border ${cat.border} hover:scale-[1.03] transition-transform duration-200 group`}
            >
              <div className="text-4xl mb-4">{cat.icon}</div>
              <h3 className="text-white font-display font-bold text-lg mb-2 group-hover:text-amber-400 transition-colors">
                {cat.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{cat.desc}</p>
              <span className="text-amber-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Shop now <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-arcane-800/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="divider mx-auto" />
            <h2 className="section-title">Why Adventurers Choose Arcane Flame</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f) => (
              <div key={f.title} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                  <f.icon className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="divider mx-auto" />
          <h2 className="section-title">Your Order in 4 Steps</h2>
          <p className="section-subtitle mx-auto text-center">
            From STL file to your doorstep in days, not weeks.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {[
            { step: '01', title: 'Upload Your STL', desc: 'Drag and drop your file. We accept .stl, .obj, and .3mf formats.' },
            { step: '02', title: 'Configure & Quote', desc: 'Choose material, quality, scale and infill. Get an instant price.' },
            { step: '03', title: 'Pay Securely', desc: 'Checkout with Stripe. Cards, Apple Pay, Google Pay all accepted.' },
            { step: '04', title: 'Receive & Play', desc: 'Printed, quality-checked, and shipped to your door in 3–5 days.' },
          ].map((item, i) => (
            <div key={item.step} className="relative">
              <div className="card p-6 h-full">
                <div className="text-5xl font-display font-bold text-amber-500/20 mb-3 leading-none">
                  {item.step}
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
              {i < 3 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-amber-500/30 z-10" />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/custom-order" className="btn-primary">
            <Upload className="w-5 h-5" />
            Start Your Order
          </Link>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-arcane-800/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="divider mx-auto" />
            <h2 className="section-title">Loved by Adventurers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-slate-300 text-sm leading-relaxed mb-4 italic">
                  "{t.quote}"
                </blockquote>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog Preview ── */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="divider" />
            <h2 className="section-title">From the Forge</h2>
            <p className="section-subtitle">Tips, guides, and news for tabletop enthusiasts.</p>
          </div>
          <Link href="/blog" className="btn-secondary text-sm whitespace-nowrap">
            All Articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="card group hover:border-amber-500/20 transition-colors">
              {/* Placeholder image area */}
              <div className="h-44 bg-gradient-to-br from-arcane-600 to-arcane-700 rounded-t-xl flex items-center justify-center">
                <Flame className="w-12 h-12 text-amber-500/40" />
              </div>
              <div className="p-5">
                <span className="text-xs text-amber-400 font-medium">{post.category}</span>
                <h3 className="text-white font-display font-semibold mt-1 mb-2 group-hover:text-amber-400 transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-slate-500 text-xs">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-arcane-800 to-flame-900/20" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <Flame className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Ready to Forge Your Army?
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Upload your STL today and get an instant quote. No account needed.
          </p>
          <Link href="/custom-order" className="btn-primary text-lg px-10 py-4">
            <Upload className="w-5 h-5" />
            Get Instant Quote
          </Link>
        </div>
      </section>
    </div>
  )
}
