'use client';
import { useRouter } from 'next/navigation';

const features = {
  free: [
    { label:'50 card scans (lifetime)',   ok:true  },
    { label:'Unlimited decks',            ok:true  },
    { label:'Mana curve & stats',         ok:true  },
    { label:'Card search & manual add',   ok:true  },
    { label:'AI deck insights',           ok:false },
    { label:'Daily scanning (30/day)',    ok:false },
  ],
  pro: [
    { label:'50 card scans (lifetime)',   ok:true  },
    { label:'Unlimited decks',            ok:true  },
    { label:'Mana curve & stats',         ok:true  },
    { label:'Card search & manual add',   ok:true  },
    { label:'AI deck insights (2/week)',  ok:true  },
    { label:'Daily scanning (30/day)',    ok:true  },
  ],
};

const S = {
  page:   { minHeight:'100dvh', background:'var(--bg)', padding:'max(env(safe-area-inset-top),20px) 20px 40px' },
  back:   { background:'none', border:'none', color:'var(--muted)', fontSize:22, padding:'0 4px 0 0', marginBottom:16, cursor:'pointer' },
  hero:   { textAlign:'center', marginBottom:32 },
  icon:   { fontSize:48, marginBottom:8 },
  title:  { fontSize:26, fontWeight:800, marginBottom:6 },
  sub:    { color:'var(--muted)', fontSize:15, lineHeight:1.5 },
  grid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28 },
  card:   { background:'var(--surface)', borderRadius:16, padding:'20px 16px', border:'1px solid var(--border)' },
  cardPro:{ background:'rgba(124,58,237,0.12)', borderColor:'rgba(124,58,237,0.4)' },
  tier:   { fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, marginBottom:6 },
  price:  { fontSize:28, fontWeight:800, marginBottom:2 },
  period: { fontSize:12, color:'var(--muted)', marginBottom:16 },
  feat:   { fontSize:12, display:'flex', gap:6, marginBottom:6, alignItems:'flex-start' },
  bullet: { flexShrink:0, width:16 },
  btn:    { display:'block', width:'100%', padding:'16px', background:'var(--accent)', border:'none', color:'#fff', borderRadius:14, fontWeight:700, fontSize:17, textAlign:'center', marginBottom:12, cursor:'pointer' },
  note:   { fontSize:12, color:'var(--muted)', textAlign:'center', lineHeight:1.5 },
  faq:    { marginTop:32 },
  faqQ:   { fontWeight:700, fontSize:14, marginBottom:4, marginTop:20 },
  faqA:   { color:'var(--muted)', fontSize:13, lineHeight:1.5 },
};

export default function UpgradePage() {
  const router = useRouter();

  function checkout() {
    // TODO: replace with Stripe Checkout session creation
    // When Stripe is set up:
    //   1. Create a product in Stripe dashboard: £2.99/month
    //   2. Add STRIPE_SECRET_KEY + STRIPE_PRO_PRICE_ID to Vercel env vars
    //   3. Replace the alert below with a call to /api/checkout which returns
    //      { url } and then: window.location.href = url
    alert('Stripe not yet connected — add STRIPE_SECRET_KEY to Vercel env vars to enable payments.');
  }

  return (
    <div style={S.page}>
      <button style={S.back} onClick={() => router.back()}>← Back</button>

      <div style={S.hero}>
        <div style={S.icon}>⭐</div>
        <div style={S.title}>Upgrade to Pro</div>
        <p style={S.sub}>Unlock AI deck analysis and unlimited daily scanning.</p>
      </div>

      <div style={S.grid}>
        {/* Free */}
        <div style={S.card}>
          <div style={{...S.tier, color:'var(--muted)'}}>Free</div>
          <div style={S.price}>£0</div>
          <div style={S.period}>forever</div>
          {features.free.map((f,i) => (
            <div key={i} style={{...S.feat, color: f.ok ? 'var(--text)' : 'var(--muted)'}}>
              <span style={S.bullet}>{f.ok ? '✓' : '✗'}</span>
              {f.label}
            </div>
          ))}
        </div>

        {/* Pro */}
        <div style={{...S.card, ...S.cardPro}}>
          <div style={{...S.tier, color:'var(--accent2)'}}>Pro</div>
          <div style={S.price}>£2.99</div>
          <div style={S.period}>per month</div>
          {features.pro.map((f,i) => (
            <div key={i} style={{...S.feat, color:'var(--text)'}}>
              <span style={{...S.bullet, color:'var(--green)'}}>✓</span>
              {f.label}
            </div>
          ))}
        </div>
      </div>

      <button style={S.btn} onClick={checkout}>
        Start Pro — £2.99/month
      </button>

      <p style={S.note}>
        Cancel any time. No hidden fees.{'\n'}
        Billed monthly via Stripe. Secure checkout.
      </p>

      <div style={S.faq}>
        <div style={{fontWeight:700, fontSize:16, marginBottom:4}}>FAQ</div>

        <div style={S.faqQ}>What counts as an "insight"?</div>
        <div style={S.faqA}>One AI analysis of your full deck — archetype, bracket estimate (1–5), specific card swap recommendations, mana base assessment, and an overall /10 rating. You get 2 per week on Pro.</div>

        <div style={S.faqQ}>Do free scans roll over?</div>
        <div style={S.faqA}>No. The 50 free scans are a one-time trial to help you decide if the app is for you. Once used, you'll need Pro for more scanning.</div>

        <div style={S.faqQ}>What happens if I cancel Pro?</div>
        <div style={S.faqA}>Your decks and cards are always saved. You just lose access to new insights and the daily scan allowance.</div>

        <div style={S.faqQ}>Is my card data safe?</div>
        <div style={S.faqA}>Your decks are stored in a secure database tied to your Google account. We never share your data.</div>
      </div>
    </div>
  );
}
