import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Arcane Flame. Questions about orders, bulk pricing, or custom STL printing — we reply within 24 hours.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
