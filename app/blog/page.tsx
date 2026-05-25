import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { Flame, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog — From the Forge',
  description: 'Expert guides on 3D printing, painting miniatures, terrain building, and tabletop gaming tips from the Arcane Flame team.',
}

const CATEGORIES = ['All', 'Printing Tips', 'Painting Guide', 'Terrain', 'News']

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="pt-24 pb-24 min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-14">
        <div className="divider" />
        <h1 className="section-title">From the Forge</h1>
        <p className="section-subtitle">
          Guides, tutorials, and news for D&amp;D players, Warhammer hobbyists, and terrain builders.
        </p>
      </div>

      {/* Category tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:border-amber-500/40 hover:text-amber-400 cursor-pointer text-sm font-medium transition-colors"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {posts.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <Flame className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No posts yet — check back soon.</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            <Link
              href={`/blog/${posts[0].slug}`}
              className="card group mb-8 grid grid-cols-1 md:grid-cols-2 overflow-hidden hover:border-amber-500/20 transition-colors"
            >
              <div className="h-56 md:h-auto bg-gradient-to-br from-arcane-600 to-arcane-700 flex items-center justify-center">
                <Flame className="w-16 h-16 text-amber-500/30" />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded">
                    {posts[0].category}
                  </span>
                  <span className="text-slate-500 text-xs">Featured</span>
                </div>
                <h2 className="text-white font-display font-bold text-2xl mb-3 group-hover:text-amber-400 transition-colors leading-snug">
                  {posts[0].title}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {posts[0].excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-slate-500 text-xs">
                    {posts[0].author} · {posts[0].date} · {posts[0].readTime}
                  </div>
                  <span className="text-amber-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>

            {/* Rest of posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.slice(1).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="card group hover:border-amber-500/20 transition-colors flex flex-col"
                >
                  <div className="h-44 bg-gradient-to-br from-arcane-600 to-arcane-700 rounded-t-xl flex items-center justify-center">
                    <Flame className="w-12 h-12 text-amber-500/30" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs text-amber-400 font-medium mb-2">{post.category}</span>
                    <h3 className="text-white font-display font-semibold text-base leading-snug mb-2 group-hover:text-amber-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-white/5">
                      <span>{post.date}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Newsletter CTA */}
        <div className="mt-16 card p-8 text-center bg-gradient-to-br from-arcane-700 to-arcane-600">
          <h2 className="text-2xl font-display font-bold text-white mb-2">Get Articles by Email</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">
            New guides every week. No spam — just useful content for tabletop hobbyists.
          </p>
          <div className="flex gap-3 max-w-sm mx-auto">
            <input type="email" placeholder="you@example.com" className="input-field flex-1" />
            <button className="btn-primary whitespace-nowrap">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  )
}
