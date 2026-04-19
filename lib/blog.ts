import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const postsDir = path.join(process.cwd(), 'content/blog')

export interface PostMeta {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  readTime: string
  image?: string
}

export interface Post extends PostMeta {
  content: string
}

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(postsDir)) return []
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
}

export function getAllPosts(): PostMeta[] {
  const slugs = getAllPostSlugs()
  return slugs
    .map((slug) => {
      const filePath = path.join(postsDir, `${slug}.md`)
      const raw = fs.readFileSync(filePath, 'utf8')
      const { data } = matter(raw)
      return {
        slug,
        title: data.title ?? '',
        excerpt: data.excerpt ?? '',
        date: data.date ?? '',
        author: data.author ?? 'Arcane Flame Team',
        category: data.category ?? 'General',
        readTime: data.readTime ?? '5 min read',
        image: data.image,
      } as PostMeta
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function getPost(slug: string): Promise<Post | null> {
  const filePath = path.join(postsDir, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content: mdContent } = matter(raw)
  const processed = await remark().use(html).process(mdContent)
  return {
    slug,
    title: data.title ?? '',
    excerpt: data.excerpt ?? '',
    date: data.date ?? '',
    author: data.author ?? 'Arcane Flame Team',
    category: data.category ?? 'General',
    readTime: data.readTime ?? '5 min read',
    image: data.image,
    content: processed.toString(),
  }
}
