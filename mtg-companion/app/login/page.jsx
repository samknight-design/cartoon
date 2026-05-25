'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const S = {
  page:   { minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', background:'var(--bg)' },
  card:   { width:'100%', maxWidth:380, background:'var(--surface)', borderRadius:20, padding:'40px 32px', border:'1px solid var(--border)', animation:'fadeIn .4s ease' },
  logo:   { fontSize:40, textAlign:'center', marginBottom:8 },
  title:  { fontSize:24, fontWeight:700, textAlign:'center', marginBottom:4 },
  sub:    { color:'var(--muted)', textAlign:'center', fontSize:14, marginBottom:32 },
  btn:    { width:'100%', padding:'14px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:16, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:12 },
  divider:{ display:'flex', alignItems:'center', gap:12, margin:'8px 0 20px', color:'var(--muted)', fontSize:12 },
  line:   { flex:1, height:1, background:'var(--border)' },
  input:  { marginBottom:12 },
  tier:   { marginTop:32, padding:'16px', background:'rgba(124,58,237,0.1)', borderRadius:12, border:'1px solid rgba(124,58,237,0.2)' },
  tierTitle: { fontWeight:700, marginBottom:8, fontSize:14 },
  tierRow:{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--muted)', marginBottom:4 },
  error:  { color:'var(--red)', fontSize:13, textAlign:'center', marginBottom:12, minHeight:18 },
};

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState('');
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  async function signInGoogle() {
    setLoading('google');
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(''); }
  }

  async function signInMagicLink(e) {
    e.preventDefault();
    if (!email) return;
    setLoading('email');
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(''); }
    else setSent(true);
    setLoading('');
  }

  if (sent) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>📬</div>
        <div style={S.title}>Check your email</div>
        <p style={{...S.sub, marginBottom:0}}>We sent a magic link to <strong>{email}</strong>. Tap it to sign in — no password needed.</p>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>⚔️</div>
        <div style={S.title}>MTG Companion</div>
        <p style={S.sub}>Scan cards. Build decks. Get AI insights.</p>

        <button style={S.btn} onClick={signInGoogle} disabled={!!loading}>
          <GoogleIcon />
          {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div style={S.divider}>
          <span style={S.line} /><span>or</span><span style={S.line} />
        </div>

        <form onSubmit={signInMagicLink}>
          <div style={S.input}>
            <input type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={S.error}>{error}</div>
          <button style={{...S.btn, background:'var(--accent)', border:'none', color:'#fff'}}
            type="submit" disabled={!!loading}>
            {loading === 'email' ? 'Sending…' : '✉️  Send magic link'}
          </button>
        </form>

        <div style={S.tier}>
          <div style={S.tierTitle}>Free to start</div>
          <div style={S.tierRow}><span>✓</span> 50 free card scans</div>
          <div style={S.tierRow}><span>✓</span> Unlimited decks</div>
          <div style={S.tierRow}><span>✓</span> Mana curve & stats</div>
          <div style={{...S.tierRow, color:'var(--gold)', marginTop:8}}>
            <span>⭐</span> Pro from £2.99/mo — unlocks AI insights + daily scanning
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
