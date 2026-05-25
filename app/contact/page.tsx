'use client'

import { useState } from 'react'
import { Mail, MapPin, Clock, MessageSquare, Loader2, CheckCircle } from 'lucide-react'

const SUBJECTS = [
  'General enquiry',
  'Bulk / army order quote',
  'Custom STL question',
  'Order issue',
  'Partnership / wholesale',
  'Other',
]

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSending(false)
    setSent(true)
  }

  return (
    <div className="pt-24 pb-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-14">
          <div className="divider" />
          <h1 className="section-title">Get in Touch</h1>
          <p className="section-subtitle">
            Questions about an order, a bulk quote, or just want to talk about tabletop? We reply within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact info */}
          <div className="space-y-4">
            <div className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">Email</h3>
                <p className="text-slate-400 text-sm">hello@arcane-flame.com</p>
                <p className="text-slate-500 text-xs mt-1">We aim to respond within 24 hours</p>
              </div>
            </div>

            <div className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">Location</h3>
                <p className="text-slate-400 text-sm">United Kingdom</p>
                <p className="text-slate-500 text-xs mt-1">Shipping UK-wide + international</p>
              </div>
            </div>

            <div className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">Hours</h3>
                <p className="text-slate-400 text-sm">Mon–Fri, 9am–6pm GMT</p>
                <p className="text-slate-500 text-xs mt-1">We print 7 days a week</p>
              </div>
            </div>

            <div className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">Discord</h3>
                <p className="text-slate-400 text-sm">Join our community server</p>
                <a href="#" className="text-amber-400 text-xs hover:underline">discord.gg/arcaneflame</a>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 card p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
                <h3 className="text-white font-display font-bold text-2xl mb-2">Message Sent!</h3>
                <p className="text-slate-400">
                  Thanks for reaching out. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">First Name *</label>
                    <input type="text" required className="input-field" placeholder="Gandalf" />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">Last Name *</label>
                    <input type="text" required className="input-field" placeholder="the Grey" />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium mb-2 block">Email *</label>
                  <input type="email" required className="input-field" placeholder="you@example.com" />
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium mb-2 block">Subject</label>
                  <select className="input-field">
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium mb-2 block">Order Number (if applicable)</label>
                  <input type="text" className="input-field" placeholder="AF-12345" />
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium mb-2 block">Message *</label>
                  <textarea
                    required
                    rows={5}
                    className="input-field resize-none"
                    placeholder="Tell us how we can help. The more detail the better!"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary w-full justify-center py-3 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
