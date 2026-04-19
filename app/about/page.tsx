import type { Metadata } from 'next'
import Link from 'next/link'
import { Flame, Heart, Target, Zap, ChevronDown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Arcane Flame is a UK-based 3D printing studio specialising in tabletop gaming miniatures, terrain, and custom models for D&D and Warhammer.',
}

const team = [
  {
    name: 'Sam Knight',
    role: 'Founder & Lead Printer',
    bio: 'Dungeon Master of 12 years and resin printing obsessive. Started Arcane Flame after failing to find a service that met his own ridiculous detail standards.',
    emoji: '🧙‍♂️',
  },
  {
    name: 'Jess Morgan',
    role: 'Production & Quality Control',
    bio: 'Ex-medical device QA. Applies the same rigour to 28mm miniatures. If a sword tip is 0.1mm off spec, she notices.',
    emoji: '🔬',
  },
  {
    name: 'Tom Clarke',
    role: 'Community & Content',
    bio: 'Warhammer 40K player since 2008, painter, and the voice behind our blog. Probably painting a Space Marine right now.',
    emoji: '🎨',
  },
]

const values = [
  {
    icon: Target,
    title: 'Obsessive Quality',
    desc: 'We reject prints that don\'t meet our standards before you ever see them. The print guarantee exists because we inspect everything.',
  },
  {
    icon: Heart,
    title: 'Community First',
    desc: 'Arcane Flame was built by hobbyists, for hobbyists. We care about the tabletop community — hence the free guides, tutorials, and Discord.',
  },
  {
    icon: Zap,
    title: 'Transparency',
    desc: 'Instant quotes, no hidden fees, no vague "contact us for pricing." You know exactly what you\'re paying before you upload.',
  },
]

const faqs = [
  {
    q: 'What file formats do you accept?',
    a: 'We accept .STL, .OBJ, and .3MF files. STL is the most common format from model marketplaces like MyMiniFactory, Tribes, and Thangs.',
  },
  {
    q: 'How long does printing take?',
    a: 'Standard orders ship within 3–5 working days. Rush orders are prioritised and typically ship within 48 hours. You\'ll receive tracking when your order ships.',
  },
  {
    q: 'Can I send a file I bought from a marketplace?',
    a: 'Yes, as long as you have a valid licence for the file. We print files for personal use. Commercial reproduction of licensed designs is not supported.',
  },
  {
    q: 'What\'s the maximum print size?',
    a: 'Our resin printers support up to 200×125mm build area, and FDM printers up to 300×300×400mm. For larger models, we can print in sections and advise on assembly.',
  },
  {
    q: 'Do you do army-scale bulk orders?',
    a: 'Absolutely. Discounts apply at 10+ units. Contact us with your requirements and we\'ll send a custom quote within 24 hours.',
  },
  {
    q: 'What if my print arrives damaged?',
    a: 'We photograph every order before shipping. If a model is damaged in transit, contact us within 7 days with photos and we\'ll reprint and reship at no cost.',
  },
]

export default function AboutPage() {
  return (
    <div className="pt-24 pb-24 min-h-screen">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-24 text-center">
        <div className="divider mx-auto" />
        <h1 className="section-title">Built for Adventurers,<br />by Adventurers</h1>
        <p className="section-subtitle mx-auto text-center text-lg mt-4">
          Arcane Flame started at a kitchen table in 2019 with one resin printer, a lot of IPA, and
          a DM who couldn't find miniatures detailed enough for his campaign. Now we're one of the UK's
          leading tabletop 3D printing studios.
        </p>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-24">
        <div className="card p-8 md:p-10">
          <Flame className="w-10 h-10 text-amber-400 mb-6" />
          <h2 className="text-2xl font-display font-bold text-white mb-4">Our Story</h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              The first model I ever printed was a dismal failure. Overexposed, warped, support marks
              everywhere. I washed it, primed it, and put it on the table anyway because my players had
              waited six sessions for the Lich boss battle.
            </p>
            <p>
              Three printers, two resin spills, and approximately 400 failed test prints later, I had
              dialled in settings that produced results I was genuinely proud of. Players at my table started
              asking if they could buy the models. Then their friends started asking.
            </p>
            <p>
              Arcane Flame went from "Sam's side project" to a real business in about eight months. We brought in
              Jess to manage quality control (she has a background in medical devices — turns out the
              same rigour that keeps people alive also makes excellent miniatures). Tom joined to build the
              community side and write the guides we wish had existed when we were starting out.
            </p>
            <p>
              Our goal is simple: make professional 3D printing accessible to every tabletop hobbyist,
              regardless of whether they own a printer. Your imagination shouldn't be limited by your
              hardware.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-arcane-800/40 border-y border-white/5 py-20 mb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="divider mx-auto" />
            <h2 className="section-title">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v) => (
              <div key={v.title} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                  <v.icon className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{v.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-24">
        <div className="text-center mb-12">
          <div className="divider mx-auto" />
          <h2 className="section-title">The Team</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member.name} className="card p-6 text-center">
              <div className="text-5xl mb-4">{member.emoji}</div>
              <h3 className="text-white font-display font-bold text-lg mb-1">{member.name}</h3>
              <p className="text-amber-400 text-sm font-medium mb-3">{member.role}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 mb-24">
        <div className="text-center mb-12">
          <div className="divider mx-auto" />
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.q} className="card group">
              <summary className="p-5 cursor-pointer flex items-center justify-between text-white font-medium text-sm list-none hover:text-amber-400 transition-colors">
                {faq.q}
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-3" />
              </summary>
              <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-display font-bold text-white mb-4">Start Your Adventure</h2>
        <p className="text-slate-400 mb-8">
          Browse our catalogue or upload your own STL and get an instant quote.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/products" className="btn-primary">Browse Catalogue</Link>
          <Link href="/contact" className="btn-secondary">Get in Touch</Link>
        </div>
      </section>
    </div>
  )
}
