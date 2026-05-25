import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPost, getAllPostSlugs, getAllPosts } from '@/lib/blog'
import { ArrowLeft, Clock, User, Tag, ArrowRight, Flame } from 'lucide-react'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const allPosts = getAllPosts()
  const related = allPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2)

  return (
    <div className="pt-24 pb-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Hero image placeholder */}
        <div className="h-56 bg-gradient-to-br from-arcane-600 to-arcane-700 rounded-2xl flex items-center justify-center mb-8">
          <Flame className="w-16 h-16 text-amber-500/30" />
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-400">{post.category}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {post.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {post.readTime}
          </span>
          <span>{post.date}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight mb-8">
          {post.title}
        </h1>

        {/* Content */}
        <article
          className="prose prose-invert prose-amber max-w-none
            prose-headings:font-display prose-headings:text-white
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-slate-300 prose-p:leading-relaxed
            prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:text-amber-300 prose-code:bg-arcane-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-arcane-700 prose-pre:border prose-pre:border-white/10
            prose-blockquote:border-amber-500 prose-blockquote:text-slate-400
            prose-table:text-sm
            prose-th:text-white prose-th:bg-arcane-600
            prose-td:text-slate-300 prose-td:border-white/10
            prose-li:text-slate-300
            prose-hr:border-white/10"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div className="mt-14 card p-6 bg-gradient-to-br from-amber-900/20 to-arcane-700 text-center">
          <Flame className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h3 className="text-white font-display font-bold text-xl mb-2">Ready to Print?</h3>
          <p className="text-slate-400 text-sm mb-4">Upload your STL or browse our catalogue — printed to order, shipped fast.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/custom-order" className="btn-primary text-sm">Upload STL</Link>
            <Link href="/products" className="btn-secondary text-sm">Browse Catalogue</Link>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-14">
            <h3 className="text-white font-display font-bold text-xl mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="card p-4 group hover:border-amber-500/20 transition-colors">
                  <span className="text-xs text-amber-400 mb-2 block">{p.category}</span>
                  <h4 className="text-white font-semibold text-sm leading-snug group-hover:text-amber-400 transition-colors mb-2">
                    {p.title}
                  </h4>
                  <span className="text-slate-500 text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read article <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
