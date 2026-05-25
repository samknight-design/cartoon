import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Arcane Flame | Premium 3D Printing for Tabletop Games',
    template: '%s | Arcane Flame',
  },
  description:
    'Professional 3D printing for D&D, Warhammer, and tabletop gaming. Custom miniatures, terrain, and scenery printed to perfection. Upload your STL and order today.',
  keywords: ['3d printing', 'dnd miniatures', 'warhammer printing', 'tabletop terrain', 'custom miniatures', 'stl printing service'],
  openGraph: {
    siteName: 'Arcane Flame',
    type: 'website',
    locale: 'en_GB',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
