'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const FORMATS = ['Commander', 'Standard', 'Modern', 'Legacy', 'Vintage', 'Pioneer', 'Draft', 'Other'];

const S = {
  page:    { minHeight:'100dvh', background:'var(--bg)', paddingBottom:80 },
  header:  { padding:'env(safe-area-inset-top, 16px) 16px 0', paddingTop:'max(env(safe-area-inset-top), 16px)' },
  hRow:    { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  title:   { fontSize:22, fontWeight:700 },
  grid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'0 16px' },
  card:    { background:'var(--surface)', borderRadius:16, overflow:'hidden', border:'1px solid var(--border)', cursor:'pointer', animation:'fadeIn .3s ease', position:'relative' },
  cardArt: { width:'100%', aspectRatio:'3/2', objectFit:'cover', display:'block', background:'var(--surface2)' },
  cardBody:{ padding:'12px' },
  cardName:{ fontWeight:700, fontSize:15, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  cardMeta:{ color:'var(--muted)', fontSize:12, display:'flex', gap:6, alignItems:'center' },
  badge:   { padding:'2px 6px', borderRadius:4, fontSize:10, fontWeight:700, background:'rgba(124,58,237,0.2)', color:'var(--accent2)', textTransform:'uppercase' },
  fab:     { position:'fixed', bottom:'calc(env(safe-area-inset-bottom, 0px) + 72px)', right:20, width:56, height:56, borderRadius:'50%', background:'var(--accent)', border:'none', color:'#fff', fontSize:28, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(124,58,237,0.5)', zIndex:10 },
  modal:   { position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end' },
  overlay: { position:'absolute', inset:0, background:'rgba(0,0,0,0.6)' },
  sheet:   { position:'relative', width:'100%', background:'var(--surface)', borderRadius:'20px 20px 0 0', padding:'24px 20px', paddingBottom:'calc(env(safe-area-inset-bottom, 0px) + 24px)', animation:'slideUp .3s ease', zIndex:1 },
  shLabel: { fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 },
  shInput: { marginBottom:16 },
  createBtn:{ width:'100%', padding:'14px', background:'var(--accent)', border:'none', color:'#fff', borderRadius:12, fontSize:16, fontWeight:700 },
  emptyWrap:{ padding:'60px 24px', textAlign:'center' },
  emptyIcon:{ fontSize:48, marginBottom:12 },
  emptyText:{ color:'var(--muted)', fontSize:15, lineHeight:1.5 },
  userRow: { display:'flex', alignItems:'center', gap:8, marginBottom:16 },
  avatar:  { width:32, height:32, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700 },
  tierBadge:{ padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:700 },
  signout: { marginLeft:'auto', background:'none', border:'1px solid var(--border)', color:'var(--muted)', padding:'6px 12px', borderRadius:8, fontSize:12 },
};

export default function DecksPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [decks, setDecks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newFormat, setNewFormat] = useState('Commander');

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);

    const [{ data: profile }, { data: decks }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('decks').select(`
        id, name, format, notes, created_at, updated_at,
        deck_cards ( count, is_commander, card_data )
      `).eq('user_id', user.id).order('updated_at', { ascending: false }),
    ]);

    setProfile(profile);
    setDecks(decks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  async function createDeck() {
    if (!newName.trim()) return;
    const { data, error } = await supabase.from('decks').insert({
      user_id: user.id,
      name: newName.trim(),
      format: newFormat,
    }).select().single();
    if (!error) {
      setCreating(false);
      setNewName('');
      router.push(`/decks/${data.id}`);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  function deckCardCount(deck) {
    return deck.deck_cards?.reduce((s, c) => s + (c.count ?? 1), 0) ?? 0;
  }

  function deckCommanderArt(deck) {
    const cmdr = deck.deck_cards?.find(c => c.is_commander);
    return cmdr?.card_data?.image_uris?.art_crop ?? cmdr?.card_data?.card_faces?.[0]?.image_uris?.art_crop ?? null;
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.userRow}>
          <div style={S.avatar}>{initials}</div>
          <div>
            <div style={{fontSize:13, fontWeight:600}}>{user?.email}</div>
            <div style={{...S.tierBadge, background: profile?.tier==='pro' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)', color: profile?.tier==='pro' ? 'var(--gold)' : 'var(--muted)', display:'inline-block', marginTop:2}}>
              {profile?.tier === 'pro' ? '⭐ Pro' : 'Free'}
              {profile?.tier === 'free' && <span style={{marginLeft:4}}> · {profile?.lifetime_scans ?? 0}/50 scans used</span>}
            </div>
          </div>
          {profile?.tier !== 'pro' && (
            <button style={{...S.signout, color:'var(--accent2)', borderColor:'rgba(124,58,237,0.3)'}}
              onClick={() => router.push('/upgrade')}>Upgrade ⭐</button>
          )}
          <button style={S.signout} onClick={signOut}>Sign out</button>
        </div>

        <div style={S.hRow}>
          <div style={S.title}>My Decks</div>
          <div style={{color:'var(--muted)', fontSize:13}}>{decks.length} deck{decks.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {loading ? (
        <div style={{padding:40, textAlign:'center', color:'var(--muted)'}}>
          <div style={{width:32, height:32, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px'}} />
          Loading…
        </div>
      ) : decks.length === 0 ? (
        <div style={S.emptyWrap}>
          <div style={S.emptyIcon}>🃏</div>
          <div style={{fontSize:17, fontWeight:600, marginBottom:8}}>No decks yet</div>
          <div style={S.emptyText}>Tap + to create your first deck, then scan cards to fill it.</div>
        </div>
      ) : (
        <div style={S.grid}>
          {decks.map(deck => {
            const count = deckCardCount(deck);
            const art   = deckCommanderArt(deck);
            return (
              <div key={deck.id} style={S.card} onClick={() => router.push(`/decks/${deck.id}`)}>
                {art ? (
                  <img src={art} alt="" style={S.cardArt} />
                ) : (
                  <div style={{...S.cardArt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32}}>🃏</div>
                )}
                <div style={S.cardBody}>
                  <div style={S.cardName}>{deck.name}</div>
                  <div style={S.cardMeta}>
                    <span style={S.badge}>{deck.format}</span>
                    <span>{count} cards</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button style={S.fab} onClick={() => setCreating(true)}>+</button>

      {creating && (
        <div style={S.modal}>
          <div style={S.overlay} onClick={() => setCreating(false)} />
          <div style={S.sheet}>
            <div style={{fontSize:18, fontWeight:700, marginBottom:20}}>New Deck</div>
            <div style={S.shLabel}>Deck name</div>
            <div style={S.shInput}>
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Dragon Tribal" onKeyDown={e => e.key==='Enter' && createDeck()} />
            </div>
            <div style={S.shLabel}>Format</div>
            <div style={S.shInput}>
              <select value={newFormat} onChange={e => setNewFormat(e.target.value)}>
                {FORMATS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <button style={S.createBtn} onClick={createDeck}>Create Deck →</button>
          </div>
        </div>
      )}

      <BottomNav active="decks" />
    </div>
  );
}

export function BottomNav({ active }) {
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
