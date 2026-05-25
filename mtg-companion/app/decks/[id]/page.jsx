'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ── constants ────────────────────────────────────────────────
const CATEGORIES = [
  { id:'commander', label:'👑 Commanders',     match: c => c.is_commander },
  { id:'creatures', label:'🐉 Creatures',       match: c => !c.is_commander && c.card_data.type_line?.includes('Creature') },
  { id:'instants',  label:'⚡ Instants',        match: c => c.card_data.type_line?.includes('Instant') },
  { id:'sorceries', label:'🌀 Sorceries',       match: c => c.card_data.type_line?.includes('Sorcery') },
  { id:'artifacts', label:'⚙️ Artifacts',       match: c => c.card_data.type_line?.includes('Artifact') && !c.card_data.type_line?.includes('Creature') },
  { id:'enchants',  label:'✨ Enchantments',    match: c => c.card_data.type_line?.includes('Enchantment') && !c.card_data.type_line?.includes('Creature') },
  { id:'planes',    label:'🌟 Planeswalkers',   match: c => c.card_data.type_line?.includes('Planeswalker') },
  { id:'lands',     label:'🏔️ Lands',           match: c => c.card_data.type_line?.includes('Land') },
  { id:'other',     label:'🎴 Other',            match: () => true },
];

const COLOR_MAP = { W:'#f8fafc', U:'#3b82f6', B:'#6b21a8', R:'#ef4444', G:'#22c55e', C:'#94a3b8' };
const COLOR_LABELS = { W:'White', U:'Blue', B:'Black', R:'Red', G:'Green', C:'Colourless' };

// ── styles ───────────────────────────────────────────────────
const S = {
  page:    { minHeight:'100dvh', background:'var(--bg)', paddingBottom:100 },
  header:  { position:'sticky', top:0, zIndex:20, background:'var(--bg)', borderBottom:'1px solid var(--border)', padding:'max(env(safe-area-inset-top),12px) 16px 12px' },
  hRow:    { display:'flex', alignItems:'center', gap:12, marginBottom:8 },
  back:    { background:'none', border:'none', color:'var(--muted)', fontSize:22, padding:'0 4px' },
  deckName:{ fontSize:18, fontWeight:700, flex:1, border:'none', background:'transparent', color:'var(--text)', padding:0, fontFamily:'inherit' },
  badge:   { padding:'3px 8px', borderRadius:5, fontSize:11, fontWeight:700, background:'rgba(124,58,237,0.2)', color:'var(--accent2)', textTransform:'uppercase', whiteSpace:'nowrap' },
  tabs:    { display:'flex', gap:0, borderBottom:'1px solid var(--border)' },
  tab:     { flex:1, padding:'10px 0', background:'none', border:'none', fontSize:13, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.4, borderBottom:'2px solid transparent', transition:'color .2s, border-color .2s' },
  tabA:    { color:'var(--accent2)', borderBottomColor:'var(--accent)' },
  section: { margin:'12px 16px 0' },
  secHead: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', cursor:'pointer', userSelect:'none' },
  secTitle:{ fontSize:14, fontWeight:700 },
  secCount:{ color:'var(--muted)', fontSize:12 },
  card:    { display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' },
  thumb:   { width:36, height:50, borderRadius:4, objectFit:'cover', cursor:'pointer', flexShrink:0 },
  cardName:{ fontSize:14, fontWeight:600, flex:1 },
  cardSub: { fontSize:11, color:'var(--muted)' },
  counter: { display:'flex', alignItems:'center', gap:8 },
  cntBtn:  { width:28, height:28, borderRadius:'50%', background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' },
  cntNum:  { fontSize:15, fontWeight:700, minWidth:18, textAlign:'center' },
  insCard: { background:'var(--surface)', borderRadius:14, border:'1px solid var(--border)', padding:'16px', marginBottom:12, animation:'fadeIn .3s ease' },
  insDate: { fontSize:11, color:'var(--muted)', marginBottom:6 },
  insStale:{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', background:'rgba(245,158,11,0.15)', color:'var(--gold)', borderRadius:6, fontSize:11, fontWeight:600, marginBottom:8 },
  insText: { fontSize:14, lineHeight:1.6, whiteSpace:'pre-wrap' },
  genBtn:  { width:'100%', padding:'14px', background:'var(--accent)', border:'none', color:'#fff', borderRadius:12, fontSize:15, fontWeight:700, marginTop:8 },
  proGate: { background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.25)', borderRadius:14, padding:'24px', textAlign:'center', margin:'0 16px', marginTop:16 },
  cmdrWrap:{ display:'flex', gap:10, padding:'0 16px', marginTop:12, overflowX:'auto' },
  cmdrCard:{ flexShrink:0, width:140, borderRadius:12, overflow:'hidden', position:'relative', cursor:'pointer' },
  cmdrImg: { width:'100%', aspectRatio:'5/7', objectFit:'cover', display:'block' },
  cmdrName:{ position:'absolute', bottom:0, left:0, right:0, padding:'20px 8px 8px', background:'linear-gradient(transparent,rgba(0,0,0,0.85))', fontSize:12, fontWeight:700, lineHeight:1.2 },
  fullImg: { position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  notesArea:{ width:'100%', minHeight:100, marginTop:12, resize:'vertical' },
  delBtn:  { width:'100%', padding:'12px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--red)', borderRadius:12, fontSize:14, fontWeight:600, marginTop:8 },
  statCard:{ background:'var(--surface)', borderRadius:14, padding:'16px', marginBottom:12, border:'1px solid var(--border)' },
  statLabel:{ fontSize:12, color:'var(--muted)', marginBottom:2 },
  statVal: { fontSize:24, fontWeight:700 },
  progBar: { height:6, borderRadius:3, background:'var(--surface2)', overflow:'hidden', marginTop:4 },
  progFill:{ height:'100%', borderRadius:3, transition:'width .4s ease' },
  pip:     { display:'inline-block', width:14, height:14, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.2)', verticalAlign:'middle' },
};

// ── helpers ──────────────────────────────────────────────────
function groupCards(cards) {
  const used = new Set();
  return CATEGORIES.map(cat => {
    const matched = cards.filter(c => !used.has(c.id) && cat.match(c));
    matched.forEach(c => used.add(c.id));
    return { ...cat, cards: matched };
  }).filter(g => g.cards.length > 0);
}

function totalCount(cards) {
  return cards.reduce((s, c) => s + (c.count ?? 1), 0);
}

function manaCurve(cards) {
  const buckets = {};
  for (const entry of cards) {
    if (entry.card_data.type_line?.includes('Land')) continue;
    const cmc = Math.min(entry.card_data.cmc ?? 0, 7);
    const label = cmc >= 7 ? '7+' : String(cmc);
    buckets[label] = (buckets[label] ?? 0) + entry.count;
  }
  return [0,1,2,3,4,5,6,7].map(i => ({ cmc: i < 7 ? String(i) : '7+', count: buckets[i < 7 ? String(i) : '7+'] ?? 0 }));
}

function colorDist(cards) {
  const dist = {};
  for (const entry of cards) {
    for (const c of (entry.card_data.color_identity ?? [])) {
      dist[c] = (dist[c] ?? 0) + entry.count;
    }
    if ((entry.card_data.color_identity ?? []).length === 0) {
      dist['C'] = (dist['C'] ?? 0) + entry.count;
    }
  }
  return Object.entries(dist).sort((a,b) => b[1]-a[1]);
}

// ── main component ───────────────────────────────────────────
export default function DeckDetail() {
  const { id } = useParams();
  const router  = useRouter();
  const supabase = createClient();

  const [deck, setDeck]         = useState(null);
  const [cards, setCards]       = useState([]);
  const [insights, setInsights] = useState([]);
  const [profile, setProfile]   = useState(null);
  const [tab, setTab]           = useState('cards');
  const [view, setView]         = useState('list'); // list | grid
  const [collapsed, setCollapsed] = useState({});
  const [fullImg, setFullImg]   = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal]   = useState('');
  const [saving, setSaving]     = useState(false);
  const nameRef = useRef(null);

  const load = useCallback(async () => {
    const [{ data: deck }, { data: cards }, { data: insights }, { data: { user } }] = await Promise.all([
      supabase.from('decks').select('*').eq('id', id).single(),
      supabase.from('deck_cards').select('*').eq('deck_id', id).order('name'),
      supabase.from('insights').select('*').eq('deck_id', id).order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ]);
    if (!deck) { router.push('/decks'); return; }
    setDeck(deck);
    setNameVal(deck.name);
    setCards(cards ?? []);
    setInsights(insights ?? []);

    if (user) {
      const { data: p } = await supabase.from('profiles').select('tier, lifetime_scans').eq('id', user.id).single();
      setProfile(p);
    }
  }, [id]);

  useEffect(() => { load(); }, [id]);

  // ── card mutations ─────────────────────────────────────────
  async function changeCount(card, delta) {
    const newCount = (card.count ?? 1) + delta;
    if (newCount <= 0) {
      await supabase.from('deck_cards').delete().eq('id', card.id);
      setCards(prev => prev.filter(c => c.id !== card.id));
    } else {
      await supabase.from('deck_cards').update({ count: newCount }).eq('id', card.id);
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, count: newCount } : c));
    }
    await supabase.from('decks').update({ updated_at: new Date().toISOString() }).eq('id', id);
  }

  async function toggleCommander(card) {
    const isLegendary = card.card_data.type_line?.includes('Legendary');
    if (!isLegendary) return;
    const commanders = cards.filter(c => c.is_commander);
    if (!card.is_commander && commanders.length >= 2) return; // max 2
    await supabase.from('deck_cards').update({ is_commander: !card.is_commander }).eq('id', card.id);
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_commander: !c.is_commander } : c));
  }

  // ── deck name editing ──────────────────────────────────────
  async function saveName() {
    if (!nameVal.trim() || nameVal === deck.name) { setEditingName(false); return; }
    setSaving(true);
    await supabase.from('decks').update({ name: nameVal.trim() }).eq('id', id);
    setDeck(d => ({ ...d, name: nameVal.trim() }));
    setSaving(false);
    setEditingName(false);
  }

  async function saveNotes(notes) {
    await supabase.from('decks').update({ notes }).eq('id', id);
  }

  async function deleteDeck() {
    if (!confirm(`Delete "${deck.name}"? This cannot be undone.`)) return;
    await supabase.from('decks').delete().eq('id', id);
    router.push('/decks');
  }

  // ── insights ───────────────────────────────────────────────
  async function generateInsight() {
    if (cards.length < 10) { setGenError('Add at least 10 cards first.'); return; }
    setGenLoading(true);
    setGenError('');
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: id,
          deckName: deck.name,
          format: deck.format,
          cards: cards.map(c => ({
            name: c.name,
            count: c.count,
            type: c.card_data.type_line,
            cmc: c.card_data.cmc,
            colors: c.card_data.colors,
            oracle: c.card_data.oracle_text,
            isCommander: c.is_commander,
          })),
        }),
      });
      const data = await res.json();
      if (data.error === 'pro_required') { router.push('/upgrade'); return; }
      if (data.error === 'weekly_insight_limit') { setGenError('Weekly insight limit reached. Resets Monday.'); return; }
      if (data.error) { setGenError(data.error); return; }
      setInsights(prev => [data.insight, ...prev]);
    } catch (e) {
      setGenError('Something went wrong. Try again.');
    }
    setGenLoading(false);
  }

  // ── render helpers ─────────────────────────────────────────
  if (!deck) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh'}}>
      <div style={{width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 1s linear infinite'}} />
    </div>
  );

  const count    = totalCount(cards);
  const groups   = groupCards(cards);
  const isCommander = deck.format === 'Commander';
  const commanders  = cards.filter(c => c.is_commander);

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.hRow}>
          <button style={S.back} onClick={() => router.push('/decks')}>←</button>
          {editingName ? (
            <input ref={nameRef} value={nameVal} onChange={e => setNameVal(e.target.value)}
              onBlur={saveName} onKeyDown={e => e.key==='Enter' && saveName()}
              style={{...S.deckName, borderBottom:'1px solid var(--accent)'}} autoFocus />
          ) : (
            <div style={{...S.deckName, cursor:'text'}} onClick={() => { setEditingName(true); setTimeout(()=>nameRef.current?.focus(),50); }}>
              {deck.name}
            </div>
          )}
          <span style={S.badge}>{deck.format}</span>
          <span style={{color:'var(--muted)', fontSize:13, flexShrink:0}}>{count}{isCommander ? '/100' : ''}</span>
        </div>

        {/* Commanders */}
        {commanders.length > 0 && (
          <div style={{display:'flex', gap:8, overflowX:'auto', paddingBottom:4}}>
            {commanders.map(c => (
              <div key={c.id} style={{display:'flex', alignItems:'center', gap:6, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, padding:'4px 10px 4px 6px', whiteSpace:'nowrap', flexShrink:0}}>
                <img src={c.card_data.image_uris?.small ?? c.card_data.card_faces?.[0]?.image_uris?.small}
                  style={{width:24, height:34, borderRadius:2, objectFit:'cover'}} onClick={() => setFullImg(c.card_data.image_uris?.large ?? c.card_data.card_faces?.[0]?.image_uris?.large)} />
                <span style={{fontSize:12, fontWeight:700, color:'var(--gold)'}}>{c.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={S.tabs}>
          {['cards','stats','insights','notes'].map(t => (
            <button key={t} style={{...S.tab, ...(tab===t ? S.tabA : {})}}
              onClick={() => setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* ── Cards tab ── */}
      {tab === 'cards' && (
        <>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px 0'}}>
            <button onClick={() => router.push(`/scan?deck=${id}`)}
              style={{padding:'8px 16px', background:'var(--accent)', border:'none', color:'#fff', borderRadius:10, fontSize:13, fontWeight:700}}>
              + Add Cards
            </button>
            <div style={{display:'flex', gap:8}}>
              {['list','grid'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)', background: view===v ? 'var(--accent)' : 'none', color: view===v ? '#fff' : 'var(--muted)', fontSize:12, fontWeight:600}}>
                  {v === 'list' ? '☰' : '⊞'}
                </button>
              ))}
            </div>
          </div>

          {view === 'grid' ? (
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, padding:'12px 16px'}}>
              {cards.map(c => (
                <div key={c.id} style={{position:'relative'}} onClick={() => setFullImg(c.card_data.image_uris?.large ?? c.card_data.card_faces?.[0]?.image_uris?.large)}>
                  <img src={c.card_data.image_uris?.small ?? c.card_data.card_faces?.[0]?.image_uris?.small}
                    style={{width:'100%', aspectRatio:'5/7', objectFit:'cover', borderRadius:6, display:'block'}} />
                  {c.count > 1 && (
                    <div style={{position:'absolute', top:4, right:4, background:'rgba(0,0,0,0.8)', color:'#fff', borderRadius:10, padding:'1px 5px', fontSize:11, fontWeight:700}}>×{c.count}</div>
                  )}
                  {c.is_commander && (
                    <div style={{position:'absolute', top:4, left:4, fontSize:14}}>👑</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            groups.map(group => (
              <div key={group.id} style={S.section}>
                <div style={S.secHead} onClick={() => setCollapsed(p => ({ ...p, [group.id]: !p[group.id] }))}>
                  <span style={S.secTitle}>{group.label}</span>
                  <span style={S.secCount}>{totalCount(group.cards)} · {collapsed[group.id] ? '▶' : '▼'}</span>
                </div>
                {!collapsed[group.id] && group.cards.map(c => (
                  <div key={c.id} style={S.card}>
                    <img src={c.card_data.image_uris?.small ?? c.card_data.card_faces?.[0]?.image_uris?.small}
                      alt="" style={S.thumb} onClick={() => setFullImg(c.card_data.image_uris?.large ?? c.card_data.card_faces?.[0]?.image_uris?.large)} />
                    <div style={{flex:1, minWidth:0}}>
                      <div style={S.cardName}>{c.name}</div>
                      <div style={S.cardSub}>
                        {c.card_data.mana_cost} · {c.card_data.type_line?.split('—')[0].trim()}
                        {c.card_data.type_line?.includes('Legendary') && (
                          <button onClick={() => toggleCommander(c)}
                            style={{marginLeft:6, background:'none', border:'none', cursor:'pointer', fontSize:13, opacity: c.is_commander ? 1 : 0.4}} title="Toggle commander">
                            👑
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={S.counter}>
                      <button style={S.cntBtn} onClick={() => changeCount(c, -1)}>−</button>
                      <span style={S.cntNum}>{c.count}</span>
                      <button style={S.cntBtn} onClick={() => changeCount(c, +1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </>
      )}

      {/* ── Stats tab ── */}
      {tab === 'stats' && (
        <div style={{padding:'16px'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
            <div style={S.statCard}>
              <div style={S.statLabel}>Total cards</div>
              <div style={S.statVal}>{count}</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statLabel}>Avg CMC</div>
              <div style={S.statVal}>
                {cards.length ? (cards.filter(c=>!c.card_data.type_line?.includes('Land')).reduce((s,c) => s + (c.card_data.cmc??0)*c.count, 0) /
                  Math.max(1, cards.filter(c=>!c.card_data.type_line?.includes('Land')).reduce((s,c) => s+c.count, 0))).toFixed(2) : '—'}
              </div>
            </div>
          </div>

          <div style={S.statCard}>
            <div style={{fontWeight:700, marginBottom:12}}>Mana Curve</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={manaCurve(cards)} margin={{top:0,right:0,left:-24,bottom:0}}>
                <XAxis dataKey="cmc" tick={{fill:'var(--muted)',fontSize:11}} />
                <YAxis tick={{fill:'var(--muted)',fontSize:11}} />
                <Tooltip contentStyle={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:12}} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {manaCurve(cards).map((e,i) => <Cell key={i} fill={`hsl(${270 - i*15}, 80%, 65%)`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={S.statCard}>
            <div style={{fontWeight:700, marginBottom:12}}>Colour Distribution</div>
            {colorDist(cards).map(([c, n]) => {
              const total = cards.reduce((s, e) => s + e.count, 0);
              return (
                <div key={c} style={{marginBottom:8}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3}}>
                    <span style={{display:'flex', alignItems:'center', gap:6}}>
                      <span style={{...S.pip, background: COLOR_MAP[c]}} />
                      {COLOR_LABELS[c] ?? c}
                    </span>
                    <span style={{color:'var(--muted)'}}>{n}</span>
                  </div>
                  <div style={S.progBar}>
                    <div style={{...S.progFill, width:`${(n/total*100).toFixed(0)}%`, background: COLOR_MAP[c]}} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Type breakdown */}
          <div style={S.statCard}>
            <div style={{fontWeight:700, marginBottom:12}}>Card Types</div>
            {CATEGORIES.filter(cat => cat.id !== 'other' && cat.id !== 'commander').map(cat => {
              const catCount = totalCount(cards.filter(cat.match));
              if (!catCount) return null;
              const total = totalCount(cards);
              return (
                <div key={cat.id} style={{marginBottom:8}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3}}>
                    <span>{cat.label}</span>
                    <span style={{color:'var(--muted)'}}>{catCount}</span>
                  </div>
                  <div style={S.progBar}>
                    <div style={{...S.progFill, width:`${(catCount/total*100).toFixed(0)}%`, background:'var(--accent)'}} />
                  </div>
                </div>
              );
            })}
          </div>

          {isCommander && (
            <div style={{...S.statCard, background: count === 100 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', borderColor: count === 100 ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}}>
              <div style={{fontWeight:700, color: count === 100 ? 'var(--green)' : 'var(--gold)'}}>
                {count === 100 ? '✓ Deck complete!' : `${100 - count} cards needed`}
              </div>
              <div style={{...S.progBar, marginTop:8}}>
                <div style={{...S.progFill, width:`${Math.min(count,100)}%`, background: count === 100 ? 'var(--green)' : 'var(--gold)'}} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Insights tab ── */}
      {tab === 'insights' && (
        <div style={{padding:'16px'}}>
          {profile?.tier !== 'pro' ? (
            <div style={S.proGate}>
              <div style={{fontSize:32, marginBottom:8}}>✨</div>
              <div style={{fontWeight:700, fontSize:17, marginBottom:8}}>AI Insights are Pro only</div>
              <p style={{color:'var(--muted)', fontSize:14, marginBottom:16, lineHeight:1.5}}>
                Get full deck analysis — archetype, bracket estimate, card swap recommendations, mana base assessment and an overall /10 rating.
              </p>
              <button style={{padding:'12px 28px', background:'var(--gold)', border:'none', color:'#000', borderRadius:12, fontWeight:700, fontSize:15}}
                onClick={() => router.push('/upgrade')}>Upgrade to Pro — £2.99/mo</button>
            </div>
          ) : (
            <>
              <button style={S.genBtn} onClick={generateInsight} disabled={genLoading}>
                {genLoading ? (
                  <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
                    <span style={{width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 1s linear infinite', display:'inline-block'}} />
                    Analysing deck…
                  </span>
                ) : '✨ Generate New Insight'}
              </button>
              {genError && <div style={{color:'var(--red)', fontSize:13, marginTop:8, textAlign:'center'}}>{genError}</div>}

              {insights.length === 0 && !genLoading && (
                <div style={{padding:'32px 0', textAlign:'center', color:'var(--muted)', fontSize:14}}>
                  No insights yet. Tap above to analyse your deck.
                </div>
              )}

              {insights.map(ins => {
                const isStale = deck.updated_at > ins.created_at;
                return (
                  <div key={ins.id} style={S.insCard}>
                    {isStale && (
                      <div style={S.insStale}>⚠️ Deck changed since this insight</div>
                    )}
                    <div style={S.insDate}>{new Date(ins.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })} · {ins.card_count_snapshot} cards</div>
                    <div style={S.insText}>{ins.content}</div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── Notes tab ── */}
      {tab === 'notes' && (
        <div style={{padding:'16px'}}>
          <textarea defaultValue={deck.notes} style={S.notesArea}
            placeholder="Deck notes, strategy, cards to add…"
            onBlur={e => saveNotes(e.target.value)} />
          <button style={S.delBtn} onClick={deleteDeck}>🗑️ Delete this deck</button>
        </div>
      )}

      {/* Full-size card image overlay */}
      {fullImg && (
        <div style={S.fullImg} onClick={() => setFullImg(null)}>
          <img src={fullImg} style={{maxHeight:'85dvh', maxWidth:'90vw', borderRadius:12}} />
        </div>
      )}
    </div>
  );
}
