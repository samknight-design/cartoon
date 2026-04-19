import type { Metadata } from 'next'
import OrderForm from './OrderForm'

export const metadata: Metadata = {
  title: 'Custom Order — Upload Your STL',
  description: 'Upload your STL file and get an instant 3D printing quote. Choose material, quality and scale then pay securely with Stripe.',
}

export default function CustomOrderPage() {
  return (
    <div className="pt-24 pb-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="divider" />
          <h1 className="section-title">Upload &amp; Print</h1>
          <p className="section-subtitle">
            Upload your STL, configure your print settings, and get an instant price. We'll have it on your doorstep in 3–5 days.
          </p>
        </div>

        {/* Trust bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {[
            { icon: '🔒', label: 'Secure checkout' },
            { icon: '🖨️', label: 'Resin & FDM' },
            { icon: '🚚', label: 'UK tracked post' },
            { icon: '✅', label: 'Free reprint guarantee' },
          ].map((item) => (
            <div key={item.label} className="card px-3 py-3 flex items-center gap-2 text-sm text-slate-300">
              <span className="text-base">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        <OrderForm />
      </div>
    </div>
  )
}
