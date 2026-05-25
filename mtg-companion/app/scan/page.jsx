'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ── Search helper ──────────────────────────────────────────
async function scryfallSearch(name) {
  try {
    const r = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function scryfallQuery(q) {
  try {
    const r = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=name&dir=asc`);
    if (!r.ok) return [];
    const d = await r.json();
    return d.data ?? [];
  } catch { return []; }
}

// ── Styles ─────────────────────────────────────────────────
const S = {
  page:     { minHeight:'100dvh', background:'var(--bg)', display:'flex', flexDirection:'column', paddingBottom:80 },
  camWrap:  { position:'relative', width:'100%', flex:'0 0 auto', background:'#000', overflow:'hidden' },
  video:    { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  frame:    { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-55%)', width:'72%', aspectRatio:'0.714', border:'2px solid rgba(255,255,255,0.75)', borderRadius:12, boxShadow:'0 0 0 9999px rgba(0,0,0,0.4)', pointerEvents:'none', zIndex:2 },
  scanDot:  { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-55%)', width:'72%', aspectRatio:'0.714', zIndex:3, pointerEvents:'none', borderRadius:12, overflow:'hidden' },
  scanLine: { position:'absolute', width:'100%', height:2, background:'linear-gradient(90deg, transparent, rgba(124,58,237,0.8), transparent)', animation:'scanAnim 2s linear infinite' },
  hint:     { position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,0.6)', fontSize:12, whiteSpace:'nowrap', zIndex:4, background:'rgba(0,0,0,0.4)', padding:'4px 12px', borderRadius:20, backdropFilter:'blur(4px)' },
  detected: { position:'absolute', bottom:0, left:0, right:0, zIndex:4, padding:'8px 12px 12px', background:'linear-gradient(transparent, rgba(0,0,0,0.95))', animation:'slideUp .25s ease' },
  detCard:  { display:'flex', alignItems:'center', gap:10, background:'rgba(30,30,40,0.97)', borderRadius:14, padding:'10px 12px', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.1)' },
  detImg:   { width:42, height:59, borderRadius:4, objectFit:'cover', flexShrink:0 },
  addBtn:   { padding:'8px 18px', borderRadius:10, background:'var(--accent)', border:'none', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 },
  skipBtn:  { padding:'8px 14px', borderRadius:10, background:'rgba(255,255,255,0.08)', border:'none', color:'var(--muted)', fontWeight:600, fontSize:13, flexShrink:0 },
  controls: { padding:'12px 16px', flexShrink:0 },
  deckSel:  { width:'100%', marginBottom:12 },
  modeTabs: { display:'flex', gap:8, marginBottom:12 },
  modeBtn:  { flex:1, padding:'9px 0', borderRadius:10, border:'1px solid var(--border)', background:'none', color:'var(--muted)', fontSize:13, fontWeight:600 },
  modeBtnA: { background:'var(--accent)', borderColor:'var(--accent)', color:'#fff' },
  searchRow:{ display:'flex', gap:8 },
  searchIn: { flex:1 },
  searchBtn:{ padding:'10px 16px', borderRadius:10, background:'var(--accent)', border:'none', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 },
  results:  { padding:'0 16px', flex:1, overflowY:'auto' },
  resCard:  { display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' },
  resImg:   { width:36, height:50, borderRadius:4, objectFit:'cover', flexShrink:0 },
  resName:  { fontSize:14, fontWeight:600, marginBottom:2 },
  resSub:   { fontSize:11, color:'var(--muted)' },
  addSmall: { padding:'6px 14px', borderRadius:8, background:'var(--accent)', border:'none', color:'#fff', fontWeight:700, fontSize:12, marginLeft:'auto', flexShrink:0 },
  flash:    { position:'fixed', top:'45%', left:'50%', transform:'translate(-50%,-50%)', background:'rgba(34,197,94,0.93)', color:'#fff', padding:'12px 28px', borderRadius:14, fontWeight:700, fontSize:16, zIndex:50, pointerEvents:'none', animation:'fadeIn .2s ease' },
  camErr:   { padding:'40px 24px', textAlign:'center', color:'var(--muted)' },
  limitWrap:{ padding:'24px 16px', textAlign:'center' },
  limitBox: { background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.3)', borderRadius:16, padding:'24px' },
};

// ── component (inner, uses useSearchParams) ─────────────────
function ScanInner() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultDeckId = params.get('deck') ?? '';
  const supabase = createClient();

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const intervalRef = useRef(null);
  const cooldownRef = useRef(false);

  const [mode, setMode]         = useState('scan'); // scan | search | photo
  const [decks, setDecks]       = useState([]);
  const [targetId, setTargetId] = useState(defaultDeckId);
  const [profile, setProfile]   = useState(null);
  const [cameraErr, setCameraErr] = useState('');
  const [detected, setDetected] = useState(null);
  const [flash, setFlash]       = useState('');
  const [searchQ, setSearchQ]   = useState('');
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  // Load decks & profile
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: decks }, { data: profile }] = await Promise.all([
        supabase.from('decks').select('id, name').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('profiles').select('tier, lifetime_scans').eq('id', user.id).single(),
      ]);
      setDecks(decks ?? []);
      setProfile(profile);
      if (!targetId && decks?.[0]) setTargetId(decks[0].id);
    })();
  }, []);

  // Camera lifecycle
  useEffect(() => {
    if (mode === 'scan') startCamera();
    else stopCamera();
    return stopCamera;
  }, [mode]);

  async function startCamera() {
    setCameraErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      intervalRef.current = setInterval(captureFrame, 1500);
    } catch (e) {
      setCameraErr(e.message || 'Camera not available');
    }
  }

  function stopCamera() {
    clearInterval(intervalRef.current);
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function captureFrame() {
    if (cooldownRef.current || !videoRef.current?.srcObject || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video.videoWidth) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const b64 = canvas.toDataURL('image/jpeg', 0.65).split(',')[1];
    await attemptScan(b64, 'image/jpeg');
  }

  async function attemptScan(b64, mediaType) {
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64, mediaType }),
      });
      const data = await res.json();

      if (data.error === 'free_scan_limit' || data.error === 'pro_daily_scan_limit') {
        setLimitHit(true);
        stopCamera();
        return;
      }
      if (!data.cardName) return;

      cooldownRef.current = true;
      const card = await scryfallSearch(data.cardName);
      if (card) {
        setDetected(card);
        navigator.vibrate?.(50);
      }
    } catch {}
  }

  async function addCard(card) {
    if (!targetId) return;
    const existing = await supabase.from('deck_cards').select('id, count').eq('deck_id', targetId).eq('scryfall_id', card.id).maybeSingle();
    if (existing.data) {
      await supabase.from('deck_cards').update({ count: existing.data.count + 1 }).eq('id', existing.data.id);
    } else {
      await supabase.from('deck_cards').insert({ deck_id: targetId, scryfall_id: card.id, name: card.name, count: 1, card_data: card });
    }
    await supabase.from('decks').update({ updated_at: new Date().toISOString() }).eq('id', targetId);

    const deckName = decks.find(d => d.id === targetId)?.name ?? 'deck';
    setFlash(`${card.name} → ${deckName}`);
    setTimeout(() => setFlash(''), 2200);
    setDetected(null);
    setTimeout(() => { cooldownRef.current = false; }, 2500);
  }

  function dismissDetected() {
    setDetected(null);
    setTimeout(() => { cooldownRef.current = false; }, 800);
  }

  async function doSearch(e) {
    e?.preventDefault();
    if (!searchQ.trim()) return;
    setSearching(true);
    const r = await scryfallQuery(searchQ);
    setResults(r.slice(0, 20));
    setSearching(false);
  }

  const deckSelector = (
    <select style={S.deckSel} value={targetId} onChange={e => setTargetId(e.target.value)}>
      <option value="">— choose deck —</option>
      {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
    </select>
  );

  if (limitHit) return (
    <div style={S.page}>
      <div style={S.limitWrap}>
        <div style={S.limitBox}>
          <div style={{fontSize:36, marginBottom:12}}>📷</div>
          <div style={{fontWeight:700, fontSize:18, marginBottom:8}}>
            {profile?.tier === 'free' ? 'Free scan limit reached' : "Daily scan limit reached"}
          </div>
          <p style={{color:'var(--muted)', fontSize:14, marginBottom:20, lineHeight:1.5}}>
            {profile?.tier === 'free'
              ? `You've used all 50 free scans. Upgrade to Pro for 30 scans/day.`
              : `You've hit today's limit of 30 scans. Resets at midnight UTC.`}
          </p>
          {profile?.tier === 'free' && (
            <button style={{width:'100%', padding:'14px', background:'var(--gold)', border:'none', color:'#000', borderRadius:12, fontWeight:700, fontSize:16, marginBottom:10}}
              onClick={() => router.push('/upgrade')}>Upgrade to Pro — £2.99/mo</button>
          )}
          <button style={{width:'100%', padding:'12px', background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:12, fontWeight:600}}
            onClick={() => { setLimitHit(false); setMode('search'); }}>Search cards manually instead</button>
        </div>
      </div>
      <BottomNav active="scan" />
    </div>
  );

  return (
    <div style={S.page}>
      {/* ── Camera mode ── */}
      {mode === 'scan' && (
        <>
          <div style={{...S.camWrap, height:'calc(100dvh - 230px)'}}>
            {cameraErr ? (
              <div style={S.camErr}>
                <div style={{fontSize:36, marginBottom:8}}>📷</div>
                <div style={{fontWeight:700, marginBottom:6}}>Camera unavailable</div>
                <div style={{fontSize:13}}>{cameraErr}</div>
                <button style={{marginTop:16, padding:'10px 24px', background:'var(--accent)', border:'none', color:'#fff', borderRadius:10, fontWeight:700}}
                  onClick={() => setMode('search')}>Search manually instead</button>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted style={S.video} />
                <div style={S.frame} />
                <div style={S.scanDot}>
                  <div style={{...S.scanLine, top: detected ? '0%' : '50%'}} />
                </div>
                <div style={S.hint}>Hold card within frame</div>
                {detected && (
                  <div style={S.detected}>
                    <div style={S.detCard}>
                      <img src={detected.image_uris?.small ?? detected.card_faces?.[0]?.image_uris?.small} style={S.detImg} />
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{detected.name}</div>
                        <div style={{color:'var(--muted)', fontSize:11}}>{detected.type_line}</div>
                      </div>
                      <button style={S.skipBtn} onClick={dismissDetected}>Skip</button>
                      <button style={{...S.addBtn, opacity: targetId ? 1 : 0.4}} onClick={() => targetId && addCard(detected)}>Add</button>
                    </div>
                  </div>
                )}
              </>
            )}
            <canvas ref={canvasRef} style={{display:'none'}} />
          </div>

          <div style={S.controls}>
            {deckSelector}
            <div style={S.modeTabs}>
              <button style={{...S.modeBtn, ...S.modeBtnA}}>📷 Live Scan</button>
              <button style={S.modeBtn} onClick={() => setMode('search')}>🔍 Search</button>
            </div>
          </div>
        </>
      )}

      {/* ── Search mode ── */}
      {mode === 'search' && (
        <>
          <div style={{...S.controls, paddingTop:'max(env(safe-area-inset-top), 16px)'}}>
            {deckSelector}
            <div style={S.modeTabs}>
              <button style={S.modeBtn} onClick={() => setMode('scan')}>📷 Live Scan</button>
              <button style={{...S.modeBtn, ...S.modeBtnA}}>🔍 Search</button>
            </div>
            <form onSubmit={doSearch} style={S.searchRow}>
              <div style={S.searchIn}>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search card name…" autoFocus />
              </div>
              <button type="submit" style={S.searchBtn} disabled={searching}>
                {searching ? '…' : 'Go'}
              </button>
            </form>
          </div>

          <div style={S.results}>
            {results.map(card => (
              <div key={card.id} style={S.resCard}>
                <img src={card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small}
                  alt="" style={S.resImg} />
                <div style={{flex:1, minWidth:0}}>
                  <div style={S.resName}>{card.name}</div>
                  <div style={S.resSub}>{card.mana_cost} · {card.type_line?.split('—')[0].trim()}</div>
                </div>
                <button style={{...S.addSmall, opacity: targetId ? 1 : 0.4}}
                  onClick={() => targetId && addCard(card)}>+ Add</button>
              </div>
            ))}
          </div>
        </>
      )}

      {flash && <div style={S.flash}>✓ {flash}</div>}

      <BottomNav active="scan" />
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function ScanPage() {
  return (
    <Suspense>
      <ScanInner />
    </Suspense>
  );
}

function BottomNav({ active }) {
  const router = useRouter();
  const tabs = [
    { id:'scan',  label:'Scan',  icon:'📷', href:'/scan' },
    { id:'decks', label:'Decks', icon:'🃏', href:'/decks' },
  ];
  return (
    <nav style={{position:'fixed', bottom:0, left:0, right:0, background:'var(--surface)', borderTop:'1px solid var(--border)', display:'flex', paddingBottom:'env(safe-area-inset-bottom)', zIndex:40}}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => router.push(t.href)}
          style={{flex:1, padding:'10px 0 8px', background:'none', border:'none', color: active===t.id ? 'var(--accent2)' : 'var(--muted)', display:'flex', flexDirection:'column', alignItems:'center', gap:2, fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:.5}}>
          <span style={{fontSize:22}}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
