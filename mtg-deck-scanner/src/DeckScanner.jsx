import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── Constants ───────────────────────────────────────────────────────────────

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const C = {
  bg: "#0a0f1e", card: "#131d35", card2: "#1a2744", border: "#1e3060",
  gold: "#f59e0b", crown: "#fde68a", text: "#e2e8f0", sub: "#94a3b8",
  muted: "#64748b", green: "#10b981", red: "#ef4444", purple: "#a855f7",
};

const MANA = {
  W: { bg: "#EDE8C8", fg: "#333", label: "White", emoji: "☀️" },
  U: { bg: "#1469B5", fg: "#fff", label: "Blue",  emoji: "💧" },
  B: { bg: "#2a1f1a", fg: "#ccc", label: "Black", emoji: "💀" },
  R: { bg: "#CC2200", fg: "#fff", label: "Red",   emoji: "🔥" },
  G: { bg: "#006B3C", fg: "#fff", label: "Green", emoji: "🌿" },
};

const TYPE_COLORS = {
  Creature: "#e74c3c", Instant: "#3b82f6", Sorcery: "#9b59b6",
  Enchantment: "#10b981", Artifact: "#94a3b8", Planeswalker: "#f59e0b",
  Land: "#92400e", Other: "#64748b",
};

const CURVE_COLORS = ["#818cf8","#60a5fa","#22d3ee","#34d399","#a3e635","#fbbf24","#f97316","#ef4444"];

const BRACKETS = [
  { n:1, label:"Exhibition",  desc:"Precon-level, minimal synergy",   color:"#94a3b8" },
  { n:2, label:"Core",        desc:"Upgraded precon, casual fun",     color:"#22d3ee" },
  { n:3, label:"Upgraded",    desc:"Focused synergies, some staples", color:"#34d399" },
  { n:4, label:"Optimised",   desc:"High-powered, near-cEDH",        color:"#f59e0b" },
  { n:5, label:"cEDH",        desc:"Fully optimised, competitive",    color:"#ef4444" },
];

const CARD_CATEGORIES = [
  { id:"creature",     label:"🧝 Creatures",    color:"#e74c3c" },
  { id:"instant",      label:"⚡ Instants",      color:"#3b82f6" },
  { id:"sorcery",      label:"🌀 Sorceries",     color:"#9b59b6" },
  { id:"enchantment",  label:"✨ Enchantments",  color:"#10b981" },
  { id:"artifact",     label:"⚙️ Artifacts",     color:"#94a3b8" },
  { id:"planeswalker", label:"🌟 Planeswalkers", color:"#f59e0b" },
  { id:"land",         label:"🌍 Lands",         color:"#92400e" },
  { id:"other",        label:"❓ Other",          color:"#64748b" },
];

const BASIC_LANDS = new Set(["Plains","Island","Swamp","Mountain","Forest","Wastes"]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2);
const getImg = (card, size="small") =>
  card?.image_uris?.[size] ?? card?.card_faces?.[0]?.image_uris?.[size] ?? null;
const getColors = (card) =>
  card?.colors?.length > 0 ? card.colors : card?.card_faces?.[0]?.colors ?? [];
const getColorIdentity = (card) => card?.color_identity ?? [];

const getCardType = (tl) => {
  if (!tl) return "Other";
  if (tl.includes("Land")) return "Land";
  if (tl.includes("Creature")) return "Creature";
  if (tl.includes("Planeswalker")) return "Planeswalker";
  if (tl.includes("Instant")) return "Instant";
  if (tl.includes("Sorcery")) return "Sorcery";
  if (tl.includes("Enchantment")) return "Enchantment";
  if (tl.includes("Artifact")) return "Artifact";
  return "Other";
};
const getCatId = (card) => getCardType(card?.type_line).toLowerCase();
const isLegendary = (card) => {
  const tl = card?.type_line ?? "";
  return tl.includes("Legendary") && (tl.includes("Creature") || tl.includes("Planeswalker"));
};
const isBasicLand = (card) => (card?.type_line ?? "").includes("Basic") && (card?.type_line ?? "").includes("Land");

const toBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result.split(",")[1]);
  r.onerror = rej;
  r.readAsDataURL(file);
});
const apiHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
});
const touch = { touchAction:"manipulation", WebkitTapHighlightColor:"transparent", userSelect:"none", cursor:"pointer" };

// ─── Deck factory ─────────────────────────────────────────────────────────────

const newDeck = (name = "New Deck") => ({
  id: uid(), name, notes: "", format: "standard",
  commanders: [], cards: [], createdAt: Date.now(),
});

// ─── localStorage persistence ─────────────────────────────────────────────────

const loadDecks = () => {
  try { const s = localStorage.getItem("mtg-decks"); return s ? JSON.parse(s) : [newDeck("My First Deck")]; }
  catch { return [newDeck("My First Deck")]; }
};
const loadActiveId = (decks) => {
  try { return localStorage.getItem("mtg-active") ?? decks[0]?.id; }
  catch { return decks[0]?.id; }
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Spinner = ({ size=20 }) => (
  <div style={{ width:size, height:size, border:`${Math.max(2,size/8)}px solid rgba(245,158,11,.2)`, borderTopColor:C.gold, borderRadius:"50%", animation:"spin .8s linear infinite", flexShrink:0 }} />
);

const Panel = ({ children, style={} }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:12, animation:"fadeIn .2s ease", ...style }}>
    {children}
  </div>
);

const SecTitle = ({ children }) => (
  <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.muted, textTransform:"uppercase", marginBottom:10 }}>{children}</div>
);

const Tag = ({ children, color=C.muted }) => (
  <span style={{ fontSize:10, fontWeight:700, letterSpacing:.8, color, background:`${color}22`, padding:"2px 6px", borderRadius:4, textTransform:"uppercase", flexShrink:0 }}>{children}</span>
);

const ColorPip = ({ color }) => {
  const m = MANA[color]; if (!m) return null;
  return <span title={m.label} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:18, height:18, borderRadius:"50%", background:m.bg, color:m.fg, fontSize:10, fontWeight:700, border:"1px solid rgba(255,255,255,.15)", flexShrink:0 }}>{m.emoji}</span>;
};

const Btn = ({ children, onClick, disabled, style={}, variant="primary" }) => (
  <button onClick={onClick} disabled={disabled} style={{
    ...touch, minHeight:44, borderRadius:10, padding:"10px 16px", fontWeight:700, fontSize:14,
    background: variant==="primary" ? "linear-gradient(135deg,#f59e0b,#d97706)" : variant==="danger" ? "linear-gradient(135deg,#ef4444,#b91c1c)" : "transparent",
    color: variant==="primary" ? "#0a0f1e" : variant==="danger" ? "#fff" : C.gold,
    border: variant==="secondary" ? `1px solid ${C.gold}44` : "none",
    opacity: disabled ? .4 : 1, ...style,
  }}>{children}</button>
);

const FormatPill = ({ format, onChange }) => (
  <div style={{ display:"flex", background:C.card2, border:`1px solid ${C.border}`, borderRadius:20, padding:3, gap:2 }}>
    {[{id:"standard",label:"60-Card"},{id:"commander",label:"👑 Cmdr"}].map(f => (
      <button key={f.id} onClick={() => onChange(f.id)} style={{
        ...touch, padding:"4px 10px", borderRadius:16, fontSize:11, fontWeight:700, border:"none", minHeight:28,
        background: format===f.id ? (f.id==="commander" ? "linear-gradient(135deg,#a855f7,#7c3aed)" : "linear-gradient(135deg,#f59e0b,#d97706)") : "transparent",
        color: format===f.id ? (f.id==="commander" ? "#fff" : "#0a0f1e") : C.muted,
      }}>{f.label}</button>
    ))}
  </div>
);

// ─── Deck Switcher Panel ──────────────────────────────────────────────────────

const DeckPanel = ({ decks, activeId, onSwitch, onCreate, onRename, onDelete, onNotes, onClose }) => {
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [notesId, setNotesId] = useState(null);
  const [notesVal, setNotesVal] = useState("");

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,.7)", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.card, borderRadius:"20px 20px 0 0", padding:20, maxHeight:"75vh", overflowY:"auto", paddingBottom:"max(env(safe-area-inset-bottom,0px),20px)" }}>
        <div style={{ width:36, height:4, background:C.border, borderRadius:2, margin:"0 auto 16px" }} />
        <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:14 }}>🃏 My Decks</div>

        {decks.map(deck => (
          <div key={deck.id} style={{ marginBottom:8 }}>
            {editId === deck.id ? (
              <div style={{ display:"flex", gap:8 }}>
                <input value={editVal} onChange={e => setEditVal(e.target.value)}
                  autoFocus
                  style={{ flex:1, background:C.card2, border:`1px solid ${C.gold}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:14, outline:"none" }}
                />
                <Btn style={{ padding:"8px 12px", fontSize:12 }} onClick={() => { onRename(deck.id, editVal); setEditId(null); }}>Save</Btn>
              </div>
            ) : notesId === deck.id ? (
              <div>
                <textarea value={notesVal} onChange={e => setNotesVal(e.target.value)}
                  placeholder="Add notes about this deck…"
                  style={{ width:"100%", minHeight:80, background:C.card2, border:`1px solid ${C.gold}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:13, outline:"none", resize:"none", boxSizing:"border-box" }}
                />
                <div style={{ display:"flex", gap:8, marginTop:6 }}>
                  <Btn style={{ padding:"8px 12px", fontSize:12 }} onClick={() => { onNotes(deck.id, notesVal); setNotesId(null); }}>Save notes</Btn>
                  <Btn variant="secondary" style={{ padding:"8px 12px", fontSize:12 }} onClick={() => setNotesId(null)}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div
                onClick={() => { onSwitch(deck.id); onClose(); }}
                style={{
                  background: deck.id===activeId ? `${C.gold}15` : C.card2,
                  border: `1px solid ${deck.id===activeId ? C.gold+"44" : C.border}`,
                  borderRadius:10, padding:"12px 14px",
                  display:"flex", alignItems:"center", gap:10, ...touch,
                }}
              >
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color: deck.id===activeId ? C.gold : C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {deck.id===activeId ? "✓ " : ""}{deck.name}
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                    {deck.cards.reduce((s,d)=>s+d.count,0)} cards · {deck.format==="commander"?"👑 Commander":"60-Card"}
                    {deck.notes ? " · 📝" : ""}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setNotesId(deck.id); setNotesVal(deck.notes||""); }}
                    style={{ ...touch, fontSize:16, padding:"4px 6px", background:"transparent", border:"none", opacity:.6 }}>📝</button>
                  <button onClick={() => { setEditId(deck.id); setEditVal(deck.name); }}
                    style={{ ...touch, fontSize:16, padding:"4px 6px", background:"transparent", border:"none", opacity:.6 }}>✏️</button>
                  {decks.length > 1 && (
                    <button onClick={() => onDelete(deck.id)}
                      style={{ ...touch, fontSize:16, padding:"4px 6px", background:"transparent", border:"none", opacity:.6 }}>🗑</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={onCreate} style={{
          ...touch, width:"100%", marginTop:6,
          background:"transparent", border:`1px dashed ${C.border}`,
          borderRadius:10, padding:"12px", color:C.muted, fontSize:14, fontWeight:600,
        }}>
          + New Deck
        </button>
      </div>
    </div>
  );
};

// ─── Commander Heroes ─────────────────────────────────────────────────────────

const CommanderHeroes = ({ commanders, onRemove, onPreview, canAddSecond, onPickSecond }) => {
  if (!commanders.length) return null;
  return (
    <div style={{ marginBottom:12 }}>
      {commanders.map((cmdr, idx) => {
        const img = getImg(cmdr, "normal");
        const identity = getColorIdentity(cmdr);
        return (
          <div key={cmdr.id} style={{
            background:"linear-gradient(135deg,#1a0a3a,#2d0a5a)",
            border:"2px solid #a855f744", borderRadius:14, padding:14, marginBottom:8,
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(168,85,247,.12)", pointerEvents:"none" }} />
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:"#a855f7", textTransform:"uppercase", marginBottom:8 }}>
              👑 {commanders.length > 1 ? `Commander ${idx+1}` : "Commander"}
            </div>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              {img && (
                <div onClick={() => onPreview(cmdr)} style={{ ...touch, width:65, borderRadius:8, overflow:"hidden", boxShadow:"0 4px 20px rgba(168,85,247,.4)", border:"2px solid #a855f7", flexShrink:0 }}>
                  <img src={img} alt={cmdr.name} style={{ width:"100%", display:"block" }} />
                </div>
              )}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:800, color:C.crown, marginBottom:3, lineHeight:1.2 }}>{cmdr.name}</div>
                <div style={{ fontSize:11, color:C.sub, marginBottom:6, lineHeight:1.4 }}>{cmdr.type_line}</div>
                {identity.length > 0 && (
                  <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                    <span style={{ fontSize:10, color:C.muted, marginRight:2 }}>Identity:</span>
                    {identity.map(c => <ColorPip key={c} color={c} />)}
                  </div>
                )}
                <button onClick={() => onRemove(idx)} style={{ ...touch, fontSize:11, color:C.muted, background:"rgba(255,255,255,.05)", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 10px", minHeight:28 }}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {canAddSecond && (
        <button onClick={onPickSecond} style={{
          ...touch, width:"100%", background:"rgba(168,85,247,.08)",
          border:"1px dashed rgba(168,85,247,.4)", borderRadius:10,
          padding:"10px", color:"#a855f7", fontSize:13, fontWeight:600, minHeight:44,
        }}>
          + Add Partner Commander
        </button>
      )}
    </div>
  );
};

// ─── Live Scan (continuous getUserMedia) ───────────────────────────────────────

const LiveScan = ({ onAdd, format, onSetCommander, active, onStop }) => {
  const videoRef   = useRef();
  const canvasRef  = useRef();
  const activeRef  = useRef(false);
  const processingRef = useRef(false);
  const cooldownRef   = useRef(false);
  const streamRef     = useRef(null);
  const timerRef      = useRef(null);

  const [status,      setStatus]      = useState("idle"); // idle|starting|scanning|found|error
  const [lastCard,    setLastCard]    = useState(null);
  const [errMsg,      setErrMsg]      = useState("");
  const [scanCount,   setScanCount]   = useState(0);

  const captureAndID = useCallback(async () => {
    if (!activeRef.current || processingRef.current || cooldownRef.current) {
      if (activeRef.current) timerRef.current = setTimeout(captureAndID, 500);
      return;
    }
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      timerRef.current = setTimeout(captureAndID, 500);
      return;
    }
    processingRef.current = true;
    setStatus("scanning");
    try {
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d").drawImage(video, 0, 0);
      const b64 = canvas.toDataURL("image/jpeg", 0.72).split(",")[1];

      const res = await fetch(ANTHROPIC_API, {
        method: "POST", headers: apiHeaders(),
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 80,
          messages: [{ role:"user", content: [
            { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:b64 } },
            { type:"text",  text:'MTG card scan. Is an MTG card clearly centred and readable? Reply ONLY JSON: {"name":"exact card name"} or {"name":null}.' }
          ]}]
        })
      });
      const data = await res.json();
      const txt  = data.content?.[0]?.text?.trim() || "{}";
      const parsed = JSON.parse(txt.replace(/```[a-z]*/gi,"").replace(/```/g,"").trim());

      if (parsed.name && !cooldownRef.current) {
        const sf = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(parsed.name)}`);
        const card = await sf.json();
        if (card.object !== "error") {
          navigator.vibrate?.(60);
          onAdd(card);
          setScanCount(n => n+1);
          setLastCard(card);
          setStatus("found");
          cooldownRef.current = true;
          setTimeout(() => {
            cooldownRef.current = false;
            setLastCard(null);
            setStatus("scanning");
          }, 2500);
        }
      } else {
        setStatus("scanning");
      }
    } catch { setStatus("scanning"); }

    processingRef.current = false;
    if (activeRef.current) timerRef.current = setTimeout(captureAndID, 1200);
  }, [onAdd]);

  const startStream = useCallback(async () => {
    if (!API_KEY) { setErrMsg("No API key set"); setStatus("error"); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setErrMsg("Camera not supported in this browser"); setStatus("error"); return; }
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment", width:{ ideal:1280 } } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      activeRef.current = true;
      timerRef.current = setTimeout(captureAndID, 800);
      setStatus("scanning");
    } catch(e) {
      setErrMsg(e.name === "NotAllowedError" ? "Camera permission denied — tap Allow when prompted" : e.message);
      setStatus("error");
    }
  }, [captureAndID]);

  const stopStream = useCallback(() => {
    activeRef.current = false;
    clearTimeout(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStatus("idle");
    onStop?.();
  }, [onStop]);

  useEffect(() => {
    if (active) startStream();
    return () => { activeRef.current = false; clearTimeout(timerRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [active, startStream]);

  return (
    <div style={{ position:"relative" }}>
      <canvas ref={canvasRef} style={{ display:"none" }} />

      {/* Video viewfinder */}
      <div style={{ position:"relative", borderRadius:12, overflow:"hidden", background:"#000", aspectRatio:"4/3" }}>
        <video ref={videoRef} playsInline muted style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />

        {/* Scanning frame overlay */}
        <div style={{
          position:"absolute", inset:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          pointerEvents:"none",
        }}>
          <div style={{
            width:"72%", aspectRatio:"63/88",
            border: status==="found" ? "2px solid #10b981" : "2px solid rgba(245,158,11,.7)",
            borderRadius:8,
            boxShadow: status==="found" ? "0 0 20px rgba(16,185,129,.4)" : "0 0 20px rgba(245,158,11,.2)",
            transition:"border-color .3s, box-shadow .3s",
          }} />
        </div>

        {/* Status overlay */}
        <div style={{
          position:"absolute", bottom:0, left:0, right:0,
          background:"linear-gradient(transparent,rgba(0,0,0,.8))",
          padding:"24px 14px 12px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {status==="scanning" && <Spinner size={14} />}
            {status==="found" && <span style={{ fontSize:16 }}>✅</span>}
            {status==="starting" && <Spinner size={14} />}
            <span style={{ fontSize:12, color: status==="found" ? "#34d399" : C.sub }}>
              {status==="starting" ? "Starting camera…" :
               status==="scanning" ? "Hold card in frame…" :
               status==="found" && lastCard ? `✓ Added: ${lastCard.name}` :
               status==="error" ? errMsg : ""}
            </span>
          </div>
          {scanCount > 0 && (
            <div style={{ background:`${C.gold}22`, border:`1px solid ${C.gold}44`, borderRadius:12, padding:"2px 8px", fontSize:11, fontWeight:700, color:C.gold }}>
              {scanCount} added
            </div>
          )}
        </div>
      </div>

      {/* Last card thumbnail */}
      {lastCard && getImg(lastCard) && (
        <div style={{
          position:"absolute", top:8, right:8,
          background:C.card, border:`2px solid #10b981`,
          borderRadius:8, padding:3,
          animation:"fadeIn .2s ease",
          boxShadow:"0 4px 16px rgba(0,0,0,.6)",
        }}>
          <img src={getImg(lastCard)} alt="" style={{ width:48, borderRadius:5 }} />
        </div>
      )}

      {status==="error" && (
        <div style={{ marginTop:10, background:`${C.red}15`, border:`1px solid ${C.red}33`, borderRadius:8, padding:"10px 12px", fontSize:12, color:C.red }}>
          ❌ {errMsg}
        </div>
      )}

      <button onClick={stopStream} style={{ ...touch, marginTop:10, width:"100%", background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px", color:C.sub, fontSize:13, minHeight:44 }}>
        ■ Stop Live Scan
      </button>

      <div style={{ marginTop:8, fontSize:11, color:C.muted, textAlign:"center", lineHeight:1.5 }}>
        Hold each card steady in the frame — it'll auto-add and vibrate.<br />Then show the next card.
      </div>
    </div>
  );
};

// ─── Scan Tab ─────────────────────────────────────────────────────────────────

const ScanTab = ({ onAdd, onSetCommander, format }) => {
  const [mode, setMode]         = useState("live"); // live | photo | search
  const [liveActive, setLive]   = useState(false);
  const [preview, setPreview]   = useState(null);
  const [scanState, setScanState] = useState("idle");
  const [result, setResult]     = useState(null);
  const [errMsg, setErrMsg]     = useState("");
  const [query, setQuery]       = useState("");
  const [searchRes, setSearchRes] = useState([]);
  const [searching, setSearching] = useState(false);
  const [flash, setFlash]       = useState("");
  const cameraRef = useRef(); const galleryRef = useRef();

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(""), 2500); };

  const handleFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setScanState("scanning"); setResult(null); setErrMsg("");
    try {
      if (!API_KEY) throw new Error("No API key");
      const b64 = await toBase64(file);
      const res = await fetch(ANTHROPIC_API, {
        method:"POST", headers:apiHeaders(),
        body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:100,
          messages:[{ role:"user", content:[
            { type:"image", source:{ type:"base64", media_type:file.type||"image/jpeg", data:b64 } },
            { type:"text",  text:'Identify this MTG card. Reply ONLY JSON: {"name":"exact card name"} or {"name":null}.' }
          ]}]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "API error");
      const parsed = JSON.parse((data.content?.[0]?.text||"{}").replace(/```[a-z]*/gi,"").replace(/```/g,"").trim());
      if (!parsed.name) throw new Error("Card not recognised — try better lighting");
      const sf = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(parsed.name)}`);
      const card = await sf.json();
      if (card.object==="error") throw new Error(`Scryfall: ${card.details}`);
      setResult(card); setScanState("found");
    } catch(e) { setErrMsg(e.message); setScanState("error"); }
  };

  const handleSearch = async (q) => {
    setQuery(q);
    if (!q.trim() || q.length < 2) { setSearchRes([]); return; }
    setSearching(true);
    try {
      const r = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&limit=8&order=name`);
      const d = await r.json();
      setSearchRes(d.data ?? []);
    } catch { setSearchRes([]); }
    setSearching(false);
  };

  const reset = () => { setScanState("idle"); setPreview(null); setResult(null); };

  return (
    <div style={{ padding:"16px 16px 0" }}>
      {/* Mode tabs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:12 }}>
        {[{id:"live",emoji:"🔴",label:"Live Scan"},{id:"photo",emoji:"📷",label:"Photo"},{id:"search",emoji:"🔍",label:"Search"}].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); if(m.id!=="live") setLive(false); }}
            style={{ ...touch, padding:"10px 4px", borderRadius:10, border:`1px solid ${mode===m.id ? C.gold+"66" : C.border}`,
              background: mode===m.id ? `${C.gold}15` : C.card2,
              color: mode===m.id ? C.gold : C.muted,
              fontWeight:700, fontSize:12, display:"flex", flexDirection:"column", alignItems:"center", gap:3, minHeight:54,
            }}>
            <span style={{ fontSize:18 }}>{m.emoji}</span>{m.label}
          </button>
        ))}
      </div>

      {/* Flash */}
      {flash && (
        <div style={{ background:flash.startsWith("👑") ? "rgba(168,85,247,.15)" : `${C.green}22`, border:`1px solid ${flash.startsWith("👑") ? "#a855f744" : `${C.green}44`}`, borderRadius:10, padding:"10px 14px", fontSize:13, fontWeight:600, color:flash.startsWith("👑") ? "#d8b4fe" : C.green, marginBottom:12, animation:"fadeIn .2s ease" }}>
          {flash}
        </div>
      )}

      {/* Live scan */}
      {mode==="live" && (
        <Panel>
          <SecTitle>Live Scanning</SecTitle>
          {!liveActive ? (
            <>
              <div style={{ fontSize:13, color:C.sub, marginBottom:12, lineHeight:1.6 }}>
                Point your camera at a card — it'll auto-detect and add it. Hold steady for ~1 second, then swap to the next card.
              </div>
              <Btn onClick={() => setLive(true)} style={{ width:"100%", justifyContent:"center", display:"flex" }}>
                🔴 Start Live Scanning
              </Btn>
            </>
          ) : (
            <LiveScan onAdd={c => { onAdd(c); showFlash(`✓ ${c.name}`); }} format={format} onSetCommander={onSetCommander} active={liveActive} onStop={() => setLive(false)} />
          )}
        </Panel>
      )}

      {/* Single photo */}
      {mode==="photo" && (
        <Panel>
          <SecTitle>Scan Single Card</SecTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom: preview ? 12 : 0 }}>
            {[{label:"Take Photo",emoji:"📷",ref:cameraRef,cap:true},{label:"From Gallery",emoji:"🖼️",ref:galleryRef,cap:false}].map(({label,emoji,ref,cap}) => (
              <button key={label} onClick={() => ref.current?.click()} style={{ ...touch, background:`linear-gradient(135deg,${C.card2},#0f1a3a)`, border:`1px solid ${C.border}`, borderRadius:12, padding:"18px 12px", color:C.text, fontWeight:700, fontSize:14, display:"flex", flexDirection:"column", alignItems:"center", gap:8, minHeight:90 }}>
                <span style={{ fontSize:32 }}>{emoji}</span>{label}
              </button>
            ))}
          </div>
          <input ref={cameraRef}  type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />
          <input ref={galleryRef} type="file" accept="image/*"                       style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />

          {preview && (
            <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginTop:12 }}>
              <img src={preview} style={{ width:86, borderRadius:8, border:`1px solid ${C.border}`, flexShrink:0 }} alt="Preview" />
              <div style={{ flex:1 }}>
                {scanState==="scanning" && <div style={{ display:"flex", gap:10, alignItems:"center", color:C.sub, fontSize:13 }}><Spinner /> Identifying…</div>}
                {scanState==="error"    && <><div style={{ color:C.red, fontWeight:600, marginBottom:10, fontSize:13 }}>❌ {errMsg}</div><Btn onClick={reset} variant="secondary" style={{ fontSize:12, padding:"8px 12px" }}>Try again</Btn></>}
                {scanState==="found" && result && (
                  <>
                    <div style={{ fontSize:11, color:C.sub, marginBottom:2 }}>Identified:</div>
                    <div style={{ fontWeight:700, color:C.text, marginBottom:2, fontSize:14 }}>{result.name}</div>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:10, lineHeight:1.4 }}>{result.type_line}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      <Btn onClick={() => { onAdd(result); showFlash(`✓ ${result.name}`); reset(); }} style={{ fontSize:13, padding:"9px 14px" }}>✓ Add to Deck</Btn>
                      {format==="commander" && isLegendary(result) && (
                        <button onClick={() => { onSetCommander(result); onAdd(result); showFlash(`👑 Commander: ${result.name}`); reset(); }}
                          style={{ ...touch, background:"linear-gradient(135deg,#a855f7,#7c3aed)", color:"#fff", border:"none", borderRadius:10, padding:"9px 14px", fontWeight:700, fontSize:13, minHeight:44 }}>
                          👑 Set as Commander
                        </button>
                      )}
                      <Btn onClick={reset} variant="secondary" style={{ fontSize:13, padding:"9px 14px" }}>Discard</Btn>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* Search */}
      {mode==="search" && (
        <Panel>
          <SecTitle>Search by Name</SecTitle>
          <div style={{ position:"relative" }}>
            <input value={query} onChange={e=>handleSearch(e.target.value)} placeholder="Type a card name…"
              style={{ width:"100%", padding:"12px 14px", background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:16, outline:"none", minHeight:44, boxSizing:"border-box" }} />
            {searching && <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}><Spinner size={16} /></div>}
          </div>
          {searchRes.length > 0 && (
            <div style={{ marginTop:8 }}>
              {searchRes.map(card => (
                <div key={card.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 6px", borderBottom:`1px solid ${C.border}22` }}>
                  {getImg(card) && <img src={getImg(card)} alt="" style={{ width:32, borderRadius:3, flexShrink:0 }} />}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{card.name}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{card.type_line}</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {format==="commander" && isLegendary(card) && (
                      <button onClick={() => { onSetCommander(card); onAdd(card); showFlash(`👑 Commander: ${card.name}`); setQuery(""); setSearchRes([]); }}
                        style={{ ...touch, fontSize:10, fontWeight:700, color:"#a855f7", background:"rgba(168,85,247,.12)", border:"1px solid rgba(168,85,247,.3)", borderRadius:6, padding:"5px 8px", minHeight:32 }}>👑</button>
                    )}
                    <button onClick={() => { onAdd(card); showFlash(`✓ ${card.name}`); setQuery(""); setSearchRes([]); }}
                      style={{ ...touch, fontSize:10, fontWeight:700, color:C.gold, background:`${C.gold}15`, border:`1px solid ${C.gold}33`, borderRadius:6, padding:"5px 10px", minHeight:32 }}>+ Add</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
};

// ─── Card Row / Card Thumb ────────────────────────────────────────────────────

const CardRow = ({ entry, onDelta, onPreview, format, commanders, onSetCommander, violation }) => {
  const { card, count } = entry;
  const type = getCardType(card.type_line);
  const colors = getColors(card);
  const img = getImg(card);
  const isCmd = commanders.some(c => c.id === card.id);
  const canCmd = format==="commander" && isLegendary(card) && !isCmd && commanders.length < 2;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:`1px solid ${C.border}22`, background:isCmd?"rgba(168,85,247,.05)":"transparent" }}>
      {isCmd && <span style={{ fontSize:13 }}>👑</span>}
      <div onClick={() => onPreview(card)} style={{ ...touch, width:38, height:52, borderRadius:4, overflow:"hidden", background:C.card2, flexShrink:0, border:isCmd?"2px solid #a855f7":`1px solid ${C.border}` }}>
        {img && <img src={img} alt={card.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:isCmd?C.crown:C.text, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{card.name}</div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
          <Tag color={TYPE_COLORS[type]}>{type}</Tag>
          {type!=="Land" && <span style={{ fontSize:10, color:C.muted }}>CMC {card.cmc??0}</span>}
          {colors.map(c => <ColorPip key={c} color={c} />)}
        </div>
        {violation && <div style={{ fontSize:10, color:C.red, marginTop:2 }}>⚠️ Singleton</div>}
        {canCmd && (
          <button onClick={() => onSetCommander(card)} style={{ ...touch, marginTop:4, fontSize:10, fontWeight:700, color:"#a855f7", background:"rgba(168,85,247,.12)", border:"1px solid rgba(168,85,247,.3)", borderRadius:5, padding:"3px 8px", minHeight:24 }}>
            👑 Make Commander
          </button>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
        <button onClick={() => onDelta(card.id,-1)} style={{ ...touch, width:34, height:34, borderRadius:8, background:C.card2, color:C.text, fontSize:18, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${C.border}` }}>−</button>
        <span style={{ fontSize:15, fontWeight:700, color:C.gold, minWidth:22, textAlign:"center" }}>{count}</span>
        <button onClick={() => onDelta(card.id,+1)} style={{ ...touch, width:34, height:34, borderRadius:8, background:C.card2, color:C.text, fontSize:18, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${C.border}` }}>+</button>
      </div>
    </div>
  );
};

const CardThumb = ({ entry, onPreview, onDelta }) => {
  const { card, count } = entry;
  const img = getImg(card);
  return (
    <div style={{ position:"relative" }}>
      <div onClick={() => onPreview(card)} style={{ ...touch, borderRadius:8, overflow:"hidden", background:C.card2, border:`1px solid ${C.border}`, aspectRatio:"63/88" }}>
        {img ? <img src={img} alt={card.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:10, padding:4, textAlign:"center" }}>{card.name}</div>}
      </div>
      {count > 1 && (
        <div style={{ position:"absolute", top:4, right:4, background:C.gold, color:"#0a0f1e", borderRadius:10, minWidth:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, padding:"0 4px" }}>
          {count}
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:4 }}>
        <button onClick={() => onDelta(card.id,-1)} style={{ ...touch, width:26, height:26, borderRadius:6, background:C.card2, color:C.text, fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${C.border}` }}>−</button>
        <button onClick={() => onDelta(card.id,+1)} style={{ ...touch, width:26, height:26, borderRadius:6, background:C.card2, color:C.text, fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${C.border}` }}>+</button>
      </div>
    </div>
  );
};

// ─── Deck Tab ─────────────────────────────────────────────────────────────────

const DeckTab = ({ deck, onUpdate, onPreview }) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // list | grid
  const [collapsed, setCollapsed] = useState({});

  const cards = deck.cards;
  const commanders = deck.commanders;
  const format = deck.format;
  const target = format==="commander" ? 100 : 60;
  const total  = cards.reduce((s,d) => s+d.count, 0);
  const progress = Math.min(100, (total/target)*100);

  const violations = useMemo(() => {
    if (format!=="commander") return new Set();
    return new Set(cards.filter(({card,count}) => count>1 && !isBasicLand(card)).map(({card})=>card.id));
  }, [cards, format]);

  const grouped = useMemo(() => {
    const map = {};
    CARD_CATEGORIES.forEach(c => map[c.id] = []);
    cards.forEach(entry => {
      const cat = getCatId(entry.card);
      if (map[cat]) map[cat].push(entry);
      else map["other"].push(entry);
    });
    CARD_CATEGORIES.forEach(c => map[c.id].sort((a,b) => (a.card.cmc??0)-(b.card.cmc??0)));
    return map;
  }, [cards]);

  const updateCount = (id, delta) =>
    onUpdate(d => ({ ...d, cards: d.cards.map(e => e.card.id===id ? {...e, count:Math.max(0,e.count+delta)} : e).filter(e=>e.count>0) }));

  const setCommander = (card) =>
    onUpdate(d => ({ ...d, commanders: d.commanders.length >= 2 ? [...d.commanders.slice(0,1), card] : [...d.commanders.filter(c=>c.id!==card.id), card] }));

  const removeCommander = (idx) =>
    onUpdate(d => ({ ...d, commanders: d.commanders.filter((_,i)=>i!==idx) }));

  return (
    <div style={{ padding:"16px 16px 0" }}>
      {/* Progress + name */}
      <Panel>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, gap:10 }}>
          <div style={{ fontSize:13, color:C.sub }}>{total}/{target} cards</div>
          <div style={{ display:"flex", gap:6 }}>
            {["list","grid"].map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{ ...touch, padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:700, background:viewMode===v?`${C.gold}20`:"transparent", color:viewMode===v?C.gold:C.muted, border:`1px solid ${viewMode===v?C.gold+"44":C.border}`, minHeight:30 }}>
                {v==="list" ? "☰ List" : "⊞ Grid"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height:7, background:C.card2, borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${progress}%`, background: total>=target ? `linear-gradient(90deg,${C.green},#34d399)` : format==="commander" ? "linear-gradient(90deg,#a855f7,#7c3aed)" : `linear-gradient(90deg,${C.gold},#d97706)`, borderRadius:4, transition:"width .4s ease" }} />
        </div>
        {violations.size > 0 && (
          <div style={{ marginTop:8, background:`${C.red}15`, border:`1px solid ${C.red}33`, borderRadius:8, padding:"7px 10px", fontSize:12, color:C.red }}>
            ⚠️ {violations.size} singleton violation{violations.size>1?"s":""} in this deck
          </div>
        )}
      </Panel>

      {/* Commander(s) */}
      {format==="commander" && (
        <CommanderHeroes
          commanders={commanders}
          onRemove={removeCommander}
          onPreview={onPreview}
          canAddSecond={commanders.length===1}
          onPickSecond={() => {}}
        />
      )}

      {format==="commander" && !commanders.length && cards.length > 0 && (
        <div style={{ background:"rgba(168,85,247,.1)", border:"1px solid rgba(168,85,247,.3)", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:13, color:"#d8b4fe" }}>
          👑 Tap <strong>Make Commander</strong> on any Legendary Creature below
        </div>
      )}

      {/* Card list */}
      {cards.length === 0 ? (
        <div style={{ textAlign:"center", padding:"48px 0", color:C.muted, fontSize:14 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🃏</div>
          No cards yet — use the Scan tab to add cards!
        </div>
      ) : viewMode==="grid" ? (
        <Panel>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {[...cards].sort((a,b) => {
              const ta=getCardType(a.card.type_line), tb=getCardType(b.card.type_line);
              if(ta==="Land"&&tb!=="Land") return 1;
              if(ta!=="Land"&&tb==="Land") return -1;
              return (a.card.cmc??0)-(b.card.cmc??0);
            }).map(entry => (
              <CardThumb key={entry.card.id} entry={entry} onPreview={onPreview} onDelta={updateCount} />
            ))}
          </div>
        </Panel>
      ) : (
        CARD_CATEGORIES.map(cat => {
          const entries = grouped[cat.id];
          if (!entries?.length) return null;
          const catTotal = entries.reduce((s,e)=>s+e.count,0);
          const open = !collapsed[cat.id];
          return (
            <div key={cat.id} style={{ marginBottom:8 }}>
              <button onClick={() => setCollapsed(p=>({...p,[cat.id]:!p[cat.id]}))}
                style={{ ...touch, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:C.card, border:`1px solid ${C.border}`, borderRadius:open?"12px 12px 0 0":12, padding:"10px 14px", minHeight:44 }}>
                <span style={{ fontSize:13, fontWeight:700, color:cat.color }}>{cat.label}</span>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:12, color:C.muted }}>{catTotal} cards</span>
                  <span style={{ color:C.muted, fontSize:12 }}>{open?"▲":"▼"}</span>
                </div>
              </button>
              {open && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:"none", borderRadius:"0 0 12px 12px", padding:"0 14px" }}>
                  {entries.map(entry => (
                    <CardRow key={entry.card.id} entry={entry} onDelta={updateCount} onPreview={onPreview}
                      format={format} commanders={commanders} onSetCommander={setCommander}
                      violation={violations.has(entry.card.id)} />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Clear */}
      {cards.length > 0 && (
        <div style={{ textAlign:"center", paddingBottom:8, marginTop:4 }}>
          {confirmClear ? (
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <Btn variant="danger" onClick={() => { onUpdate(d=>({...d,cards:[],commanders:[]})); setConfirmClear(false); }} style={{ fontSize:13, padding:"10px 16px" }}>⚠️ Yes, clear</Btn>
              <Btn variant="secondary" onClick={() => setConfirmClear(false)} style={{ fontSize:13, padding:"10px 16px" }}>Cancel</Btn>
            </div>
          ) : (
            <Btn variant="secondary" onClick={() => setConfirmClear(true)} style={{ fontSize:12, color:C.muted }}>🗑 Clear deck</Btn>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Stats Tab ────────────────────────────────────────────────────────────────

const StatsTab = ({ analytics, deck }) => {
  if (!analytics || !deck.cards.length) return (
    <div style={{ textAlign:"center", padding:"48px 16px", color:C.muted }}>
      <div style={{ fontSize:48, marginBottom:12 }}>📊</div>Add cards to see stats
    </div>
  );
  const { total, lands, spells, avgCmc, curveData, colorData, typeData } = analytics;
  const landPct = total ? ((lands/total)*100).toFixed(0) : 0;
  const [minL,maxL] = deck.format==="commander" ? [33,40] : [37,40];
  const landWarn = total>0 && (landPct<minL || landPct>maxL);

  return (
    <div style={{ padding:"16px 16px 0" }}>
      <Panel>
        <SecTitle>Overview</SecTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[{label:"Total Cards",value:total,color:C.gold},{label:"Spells",value:spells,color:"#3b82f6"},{label:"Lands",value:lands,color:"#92400e"},{label:"Avg CMC",value:avgCmc,color:"#a3e635"}].map(s => (
            <div key={s.label} style={{ background:C.card2, borderRadius:10, padding:"12px 14px", border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {landWarn && <div style={{ marginTop:10, background:"#f59e0b22", border:"1px solid #f59e0b44", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#f59e0b" }}>⚠️ Lands at {landPct}% — recommended {minL}–{maxL}% for {deck.format==="commander"?"Commander":"60-card"}</div>}
      </Panel>
      {colorData.length>0 && (
        <Panel>
          <SecTitle>Colour Distribution</SecTitle>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {colorData.map(([c,n]) => (
              <div key={c} style={{ display:"flex", alignItems:"center", gap:6, background:`${MANA[c]?.bg??"#333"}22`, border:`1px solid ${MANA[c]?.bg??"#333"}44`, borderRadius:20, padding:"6px 12px" }}>
                <span style={{ fontSize:16 }}>{MANA[c]?.emoji}</span>
                <span style={{ fontWeight:700, color:C.text }}>{n}</span>
                <span style={{ fontSize:11, color:C.sub }}>{MANA[c]?.label}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
      <Panel>
        <SecTitle>Mana Curve (Non-Lands)</SecTitle>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={curveData} margin={{ top:4, right:0, bottom:0, left:-25 }}>
            <XAxis dataKey="cmc" tick={{ fill:C.sub, fontSize:12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:C.sub, fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background:"#0d1832", border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:12 }} cursor={{ fill:"rgba(255,255,255,.04)" }} formatter={v=>[v,"Cards"]} labelFormatter={l=>`CMC ${l}`} />
            <Bar dataKey="count" radius={[5,5,0,0]} maxBarSize={40}>
              {curveData.map((_,i) => <Cell key={i} fill={CURVE_COLORS[Math.min(i,CURVE_COLORS.length-1)]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel>
        <SecTitle>Card Types</SecTitle>
        {typeData.map(([type,count]) => (
          <div key={type} style={{ marginBottom:9 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:12, color:C.sub }}>{type}</span>
              <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{count}</span>
            </div>
            <div style={{ height:6, background:C.card2, borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min(100,(count/total)*100)}%`, background:TYPE_COLORS[type]??C.muted, borderRadius:3, transition:"width .4s ease" }} />
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
};

// ─── AI Insights ─────────────────────────────────────────────────────────────

const renderMd = (text) => text.split("\n").map((line,i) => {
  if (/^\*\*.*\*\*$/.test(line.trim())) return <div key={i} style={{ fontWeight:700, fontSize:15, color:C.gold, marginTop:16, marginBottom:6, borderBottom:`1px solid ${C.border}`, paddingBottom:5 }}>{line.replace(/\*\*/g,"")}</div>;
  if (/^[-•]\s/.test(line.trim())) return <div key={i} style={{ display:"flex", gap:8, marginBottom:5, fontSize:13, color:C.text, lineHeight:1.65 }}><span style={{ color:C.gold, flexShrink:0 }}>•</span><span dangerouslySetInnerHTML={{ __html:line.replace(/^[-•]\s*/,"").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>") }} /></div>;
  if (/\*\*/.test(line)) return <div key={i} style={{ fontSize:13, color:C.text, marginBottom:5, lineHeight:1.65 }} dangerouslySetInnerHTML={{ __html:line.replace(/\*\*(.+?)\*\*/g,"<strong style='color:#e2e8f0'>$1</strong>") }} />;
  if (!line.trim()) return <div key={i} style={{ height:7 }} />;
  return <div key={i} style={{ fontSize:13, color:C.text, marginBottom:5, lineHeight:1.65 }}>{line}</div>;
});

const BracketBadge = ({ bracket }) => {
  if (!bracket) return null;
  const b = BRACKETS[bracket-1]; if (!b) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, background:`${b.color}22`, border:`1px solid ${b.color}44`, borderRadius:12, padding:"12px 16px", marginBottom:14 }}>
      <div style={{ fontSize:22, fontWeight:900, color:b.color, background:`${b.color}22`, width:46, height:46, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${b.color}`, flexShrink:0 }}>{bracket}</div>
      <div>
        <div style={{ fontWeight:700, color:b.color, fontSize:15 }}>Bracket {bracket} — {b.label}</div>
        <div style={{ fontSize:12, color:C.sub }}>{b.desc}</div>
      </div>
    </div>
  );
};

const InsightsTab = ({ deck, analytics }) => {
  const [status,   setStatus]   = useState("idle");
  const [insights, setInsights] = useState("");
  const [bracket,  setBracket]  = useState(null);
  const [error,    setError]    = useState("");
  const isCmd = deck.format === "commander";
  const canGen = deck.cards.length > 0 && !!API_KEY;

  const generate = async () => {
    setStatus("loading"); setInsights(""); setBracket(null); setError("");
    try {
      const { total, lands, avgCmc } = analytics ?? {};
      const deckList = deck.cards.map(d=>`${d.count}x ${d.card.name} [${d.card.type_line}] CMC:${d.card.cmc??0}`).join("\n");
      const cmdLine  = deck.commanders.map(c=>`Commander: ${c.name} [${c.type_line}]`).join("\n");

      const prompt = `You are an expert MTG deckbuilder and strategist.

Format: ${isCmd?"Commander / EDH (100-card singleton)":"60-card constructed"}
Deck: "${deck.name||"Unnamed"}"
${cmdLine}
Stats: Total:${total??0}, Lands:${lands??0}, AvgCMC:${avgCmc??0}

Decklist:
${deckList}

**🎯 Archetype & Strategy**
2-3 sentences.${isCmd?" Reference the commander.":""}

**🏆 Bracket Estimate**
${isCmd?`Bracket 1–5. Format: "Bracket X — Label"\n1=Exhibition,2=Core,3=Upgraded,4=Optimised,5=cEDH`:`Power 1–5. Format: "Bracket X — Label"\n1=Budget,2=Casual,3=Competitive local,4=PTQS,5=Pro Tour`}

**💪 Key Strengths**
- 3-4 strengths, name cards

**⚠️ Weaknesses & Risks**
- 3-4 vulnerabilities

**💡 Recommended Changes**
- Specific ADD/CUT suggestions (at least 4)

**🏔️ Mana Base Assessment**
Land count, colour fixing, ramp quality.

**⭐ Overall Rating**
X/10 with paragraph summary.`;

      const res = await fetch(ANTHROPIC_API, { method:"POST", headers:apiHeaders(), body:JSON.stringify({ model:"claude-opus-4-5", max_tokens:1600, messages:[{ role:"user", content:prompt }] }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message||"API error");
      const text = data.content?.[0]?.text ?? "";
      setInsights(text);
      const m = text.match(/Bracket\s+([1-5])/i);
      if (m) setBracket(parseInt(m[1]));
      setStatus("done");
    } catch(e) { setError(e.message); setStatus("error"); }
  };

  return (
    <div style={{ padding:"16px 16px 0" }}>
      <Panel>
        <SecTitle>AI Deck Analysis</SecTitle>
        <div style={{ fontSize:13, color:C.sub, marginBottom:14, lineHeight:1.65 }}>
          {isCmd ? "Archetype, bracket estimate, and card-specific advice for your EDH build." : "Archetype, power level, and specific card recommendations."}
        </div>
        {!API_KEY && <div style={{ background:`${C.red}15`, border:`1px solid ${C.red}33`, borderRadius:8, padding:"10px 12px", fontSize:12, color:C.red, marginBottom:12 }}>⚠️ Add VITE_ANTHROPIC_API_KEY to .env</div>}
        {deck.cards.length===0 && <div style={{ color:C.muted, fontSize:13, marginBottom:12 }}>Add cards first</div>}
        <Btn onClick={generate} disabled={!canGen||status==="loading"} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {status==="loading" ? <><Spinner size={16} /> Analysing…</> : status==="done" ? "🔄 Regenerate" : "✨ Generate Insights"}
        </Btn>
      </Panel>
      {status==="error" && <Panel style={{ borderColor:`${C.red}44` }}><div style={{ color:C.red, fontSize:13 }}>❌ {error}</div></Panel>}
      {status==="done" && insights && <Panel style={{ animation:"fadeIn .3s ease" }}><BracketBadge bracket={bracket} />{renderMd(insights)}</Panel>}
    </div>
  );
};

// ─── Card Modal ───────────────────────────────────────────────────────────────

const CardModal = ({ card, onClose }) => {
  if (!card) return null;
  const img = getImg(card,"normal");
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,.88)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, animation:"fadeIn .15s ease" }}>
      <div onClick={e=>e.stopPropagation()} style={{ maxWidth:340, width:"100%" }}>
        {img && <img src={img} alt={card.name} style={{ width:"100%", borderRadius:18, boxShadow:"0 20px 60px rgba(0,0,0,.8)" }} />}
        <div style={{ textAlign:"center", marginTop:14 }}>
          <div style={{ color:C.text, fontWeight:700, fontSize:15 }}>{card.name}</div>
          <div style={{ color:C.muted, fontSize:12, marginTop:4 }}>{card.set_name}</div>
          <button onClick={onClose} style={{ ...touch, marginTop:16, color:C.sub, fontSize:14, padding:"10px 28px", minHeight:44, border:`1px solid ${C.border}`, borderRadius:10, background:C.card2 }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

const TABS = [
  { id:"scan",  label:"Scan",  emoji:"📷" },
  { id:"deck",  label:"Deck",  emoji:"🃏" },
  { id:"stats", label:"Stats", emoji:"📊" },
  { id:"ai",    label:"AI",    emoji:"✨" },
];

export default function DeckScanner() {
  const [decks,    setDecks]    = useState(loadDecks);
  const [activeId, setActiveId] = useState(() => loadActiveId(loadDecks()));
  const [tab,      setTab]      = useState("scan");
  const [preview,  setPreview]  = useState(null);
  const [showPanel,setPanel]    = useState(false);

  // Persist to localStorage
  useEffect(() => { try { localStorage.setItem("mtg-decks", JSON.stringify(decks)); } catch {} }, [decks]);
  useEffect(() => { try { localStorage.setItem("mtg-active", activeId); } catch {} }, [activeId]);

  const activeDeck = decks.find(d => d.id===activeId) ?? decks[0];

  const updateDeck = useCallback((updater) => {
    setDecks(prev => prev.map(d => d.id===activeId ? (typeof updater==="function" ? updater(d) : {...d,...updater}) : d));
  }, [activeId]);

  const addCard = useCallback((card) => {
    updateDeck(d => {
      const ex = d.cards.find(e => e.card.id===card.id);
      return { ...d, cards: ex ? d.cards.map(e => e.card.id===card.id ? {...e,count:e.count+1} : e) : [...d.cards, {card,count:1}] };
    });
  }, [updateDeck]);

  const setCommander = useCallback((card) => {
    updateDeck(d => ({ ...d, commanders: d.commanders.length>=2 ? [...d.commanders.slice(0,1),card] : [...d.commanders.filter(c=>c.id!==card.id),card] }));
  }, [updateDeck]);

  const setFormat = useCallback((fmt) => {
    updateDeck(d => ({ ...d, format:fmt, commanders: fmt==="standard" ? [] : d.commanders }));
  }, [updateDeck]);

  const createDeck = useCallback(() => {
    const d = newDeck(`Deck ${decks.length+1}`);
    setDecks(prev => [...prev, d]);
    setActiveId(d.id);
    setPanel(false);
  }, [decks.length]);

  const renameDeck = useCallback((id, name) => {
    setDecks(prev => prev.map(d => d.id===id ? {...d,name} : d));
  }, []);

  const deleteDeck = useCallback((id) => {
    setDecks(prev => {
      const next = prev.filter(d => d.id!==id);
      if (activeId===id) setActiveId(next[0]?.id);
      return next;
    });
  }, [activeId]);

  const setNotes = useCallback((id, notes) => {
    setDecks(prev => prev.map(d => d.id===id ? {...d,notes} : d));
  }, []);

  const analytics = useMemo(() => {
    const cards = activeDeck?.cards ?? [];
    if (!cards.length) return null;
    const total = cards.reduce((s,d)=>s+d.count,0);
    const curve = {0:0,1:0,2:0,3:0,4:0,5:0,6:0,"7+":0};
    const cc = {W:0,U:0,B:0,R:0,G:0};
    const tc = {};
    let lands=0, totalCmc=0, spells=0;
    cards.forEach(({card,count}) => {
      const type = getCardType(card.type_line);
      tc[type] = (tc[type]||0)+count;
      if (type==="Land") { lands+=count; return; }
      const cmc = card.cmc||0;
      const key = cmc>=7?"7+":String(Math.floor(cmc));
      curve[key]+=count; totalCmc+=cmc*count; spells+=count;
      getColors(card).forEach(c => { if(cc[c]!==undefined) cc[c]+=count; });
    });
    return { total, lands, spells, avgCmc:spells?(totalCmc/spells).toFixed(1):"0.0", curveData:Object.entries(curve).map(([cmc,count])=>({cmc,count})), colorData:Object.entries(cc).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]), typeData:Object.entries(tc).sort((a,b)=>b[1]-a[1]) };
  }, [activeDeck?.cards]);

  if (!activeDeck) return null;
  const total  = activeDeck.cards.reduce((s,d)=>s+d.count,0);
  const target = activeDeck.format==="commander" ? 100 : 60;

  return (
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:200, background:`${C.card}f0`, backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", borderBottom:`1px solid ${C.border}`, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={() => setPanel(true)} style={{ ...touch, flex:1, minWidth:0, textAlign:"left", background:"none", border:"none", padding:0 }}>
          <div style={{ fontSize:17, fontWeight:800, color:C.gold, letterSpacing:-.3, lineHeight:1.2 }}>⚔️ MTG Companion</div>
          <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{activeDeck.name} · {total}/{target} · {decks.length} deck{decks.length>1?"s":""} ▾</div>
        </button>
        <FormatPill format={activeDeck.format} onChange={setFormat} />
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", paddingBottom:72 }}>
        {tab==="scan"  && <ScanTab onAdd={addCard} onSetCommander={setCommander} format={activeDeck.format} />}
        {tab==="deck"  && <DeckTab deck={activeDeck} onUpdate={updateDeck} onPreview={setPreview} />}
        {tab==="stats" && <StatsTab analytics={analytics} deck={activeDeck} />}
        {tab==="ai"    && <InsightsTab deck={activeDeck} analytics={analytics} />}
      </div>

      {/* Tab bar */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:`${C.card}fa`, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderTop:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"repeat(4,1fr)", zIndex:100, paddingBottom:"max(env(safe-area-inset-bottom,0px),4px)" }}>
        {TABS.map(t => {
          const active = tab===t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...touch, padding:"10px 4px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:3, color:active?C.gold:C.muted, background:"none", border:"none", position:"relative", minHeight:56 }}>
              {active && <div style={{ position:"absolute", top:0, left:"22%", right:"22%", height:2, background:C.gold, borderRadius:"0 0 3px 3px" }} />}
              <span style={{ fontSize:22 }}>{t.emoji}</span>
              <span style={{ fontSize:10, fontWeight:active?700:400, letterSpacing:.3 }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {showPanel && (
        <DeckPanel decks={decks} activeId={activeId} onSwitch={setActiveId} onCreate={createDeck} onRename={renameDeck} onDelete={deleteDeck} onNotes={setNotes} onClose={() => setPanel(false)} />
      )}
      {preview && <CardModal card={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
