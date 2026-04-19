import Link from 'next/link'
import { Flame, Mail, MapPin, Phone, Twitter, Instagram, Youtube } from 'lucide-react'

const footerLinks = {
  Services: [
    { label: 'Custom Miniatures', href: '/products#miniatures' },
    { label: 'Terrain & Scenery', href: '/products#terrain' },
    { label: 'Warhammer Printing', href: '/products#warhammer' },
    { label: 'D&D Models', href: '/products#dnd' },
    { label: 'Upload Your STL', href: '/custom-order' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQ', href: '/about#faq' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refunds' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-arcane-800 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-flame-600 flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-white">
                Arcane <span className="text-amber-400">Flame</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
              Premium resin and FDM 3D printing for tabletop adventurers. From heroic D&D miniatures
              to epic Warhammer armies — forged in flame, built to impress.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Twitter" className="text-slate-500 hover:text-amber-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="text-slate-500 hover:text-amber-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="YouTube" className="text-slate-500 hover:text-amber-400 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-amber-400 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500" />
              hello@arcane-flame.com
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              United Kingdom
            </span>
          </div>
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Arcane Flame. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
