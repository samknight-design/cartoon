import { useState, useMemo, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

// ─── Constants ───────────────────────────────────────────────────────────────

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const C = {
  bg:       "#0a0f1e",
  card:     "#131d35",
  card2:    "#1a2744",
  border:   "#1e3060",
  gold:     "#f59e0b",
  crown:    "#fde68a",
  text:     "#e2e8f0",
  sub:      "#94a3b8",
  muted:    "#64748b",
  green:    "#10b981",
  red:      "#ef4444",
  purple:   "#a855f7",
};

const MANA = {
  W: { bg: "#EDE8C8", fg: "#333", label: "White", emoji: "☀️" },
  U: { bg: "#1469B5", fg: "#fff", label: "Blue",  emoji: "💧" },
  B: { bg: "#2a1f1a", fg: "#ccc", label: "Black", emoji: "💀" },
  R: { bg: "#CC2200", fg: "#fff", label: "Red",   emoji: "🔥" },
  G: { bg: "#006B3C", fg: "#fff", label: "Green", emoji: "🌿" },
};

const TYPE_COLORS = {
  Creature:     "#e74c3c",
  Instant:      "#3b82f6",
  Sorcery:      "#9b59b6",
  Enchantment:  "#10b981",
  Artifact:     "#94a3b8",
  Planeswalker: "#f59e0b",
  Land:         "#92400e",
  Other:        "#64748b",
};

const CURVE_COLORS = [
  "#818cf8","#60a5fa","#22d3ee","#34d399",
  "#a3e635","#fbbf24","#f97316","#ef4444"
];

const BRACKETS = [
  { n: 1, label: "Exhibition",  desc: "Precon-level, minimal synergy",   color: "#94a3b8" },
  { n: 2, label: "Core",        desc: "Upgraded precon, casual fun",     color: "#22d3ee" },
  { n: 3, label: "Upgraded",    desc: "Focused synergies, some staples", color: "#34d399" },
  { n: 4, label: "Optimised",   desc: "High-powered, near-cEDH",        color: "#f59e0b" },
  { n: 5, label: "cEDH",        desc: "Fully optimised, competitive",    color: "#ef4444" },
];

// Basic land names for singleton exemption
const BASIC_LANDS = new Set(["Plains","Island","Swamp","Mountain","Forest","Wastes"]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getImg = (card, size = "small") =>
  card?.image_uris?.[size] ?? card?.card_faces?.[0]?.image_uris?.[size] ?? null;

const getColors = (card) =>
  card?.colors?.length > 0
    ? card.colors
    : card?.card_faces?.[0]?.colors ?? [];

// Color identity for Commander (includes all colors in mana costs/rules text)
const getColorIdentity = (card) => card?.color_identity ?? [];

const getCardType = (typeLine) => {
  if (!typeLine) return "Other";
  if (typeLine.includes("Land"))         return "Land";
  if (typeLine.includes("Creature"))     return "Creature";
  if (typeLine.includes("Planeswalker")) return "Planeswalker";
  if (typeLine.includes("Instant"))      return "Instant";
  if (typeLine.includes("Sorcery"))      return "Sorcery";
  if (typeLine.includes("Enchantment"))  return "Enchantment";
  if (typeLine.includes("Artifact"))     return "Artifact";
  return "Other";
};

const isLegendaryCreature = (card) => {
  const tl = card?.type_line ?? "";
  return tl.includes("Legendary") && (tl.includes("Creature") || tl.includes("Planeswalker"));
};

const isBasicLand = (card) => {
  const tl = card?.type_line ?? "";
  return tl.includes("Basic") && tl.includes("Land");
};

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const apiHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
});

// Base button styles for Android touch (no 300ms delay, no tap flash)
const touchBase = {
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  userSelect: "none",
  cursor: "pointer",
};

// ─── Shared UI primitives ────────────────────────────────────────────────────

const Spinner = ({ size = 20 }) => (
  <div style={{
    width: size, height: size,
    border: `${Math.max(2, size / 8)}px solid rgba(245,158,11,0.2)`,
    borderTopColor: C.gold,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    flexShrink: 0,
  }} />
);

const Panel = ({ children, style = {} }) => (
  <div style={{
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    animation: "fadeIn 0.2s ease",
    ...style,
  }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
    color: C.muted, textTransform: "uppercase", marginBottom: 12,
  }}>
    {children}
  </div>
);

const Tag = ({ children, color = C.muted }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
    color, background: `${color}22`,
    padding: "2px 6px", borderRadius: 4,
    textTransform: "uppercase", flexShrink: 0,
  }}>
    {children}
  </span>
);

const ColorPip = ({ color }) => {
  const m = MANA[color];
  if (!m) return null;
  return (
    <span title={m.label} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 18, height: 18, borderRadius: "50%",
      background: m.bg, color: m.fg,
      fontSize: 10, fontWeight: 700,
      border: "1px solid rgba(255,255,255,0.15)",
      flexShrink: 0,
    }}>
      {m.emoji}
    </span>
  );
};

const GoldBtn = ({ children, onClick, disabled, style = {}, variant = "primary" }) => {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...touchBase,
        background: isPrimary ? `linear-gradient(135deg, #f59e0b, #d97706)` : "transparent",
        color: isPrimary ? "#0a0f1e" : C.gold,
        border: isPrimary ? "none" : `1px solid ${C.gold}44`,
        borderRadius: 10,
        padding: "12px 18px",
        fontWeight: 700, fontSize: 14,
        minHeight: 44,
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
};

// Format toggle pill
const FormatToggle = ({ format, onChange }) => (
  <div style={{
    display: "flex",
    background: C.card2,
    border: `1px solid ${C.border}`,
    borderRadius: 20, padding: 3, gap: 2,
  }}>
    {[
      { id: "standard",  label: "60-Card" },
      { id: "commander", label: "Commander" },
    ].map(f => (
      <button
        key={f.id}
        onClick={() => onChange(f.id)}
        style={{
          ...touchBase,
          padding: "5px 10px",
          borderRadius: 16,
          fontSize: 11, fontWeight: 700,
          background: format === f.id
            ? (f.id === "commander" ? `linear-gradient(135deg,#a855f7,#7c3aed)` : `linear-gradient(135deg,${C.gold},#d97706)`)
            : "transparent",
          color: format === f.id ? (f.id === "commander" ? "#fff" : "#0a0f1e") : C.muted,
          border: "none",
          minHeight: 30,
        }}
      >
        {f.id === "commander" ? "👑 " : ""}{f.label}
      </button>
    ))}
  </div>
);

// ─── Commander Hero Card ───────────────────────────────────────────────────────

const CommanderHero = ({ commander, onClear, onPreview }) => {
  if (!commander) return null;
  const img = getImg(commander, "normal");
  const identity = getColorIdentity(commander);

  return (
    <div style={{
      background: `linear-gradient(135deg, #1a0a3a, #2d0a5a)`,
      border: `2px solid #a855f744`,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      animation: "fadeIn 0.3s ease",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow */}
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 120, height: 120, borderRadius: "50%",
        background: "rgba(168,85,247,0.15)",
        pointerEvents: "none",
      }} />

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#a855f7", textTransform: "uppercase", marginBottom: 10 }}>
        👑 Commander
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {img && (
          <div
            onClick={() => onPreview(commander)}
            style={{
              ...touchBase,
              width: 70, borderRadius: 8, overflow: "hidden",
              boxShadow: "0 4px 20px rgba(168,85,247,0.4)",
              border: "2px solid #a855f7",
              flexShrink: 0,
            }}
          >
            <img src={img} alt={commander.name} style={{ width: "100%", display: "block" }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.crown, marginBottom: 4, lineHeight: 1.2 }}>
            {commander.name}
          </div>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 8, lineHeight: 1.4 }}>
            {commander.type_line}
          </div>
          {identity.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: C.muted, marginRight: 2 }}>Identity:</span>
              {identity.map(c => <ColorPip key={c} color={c} />)}
            </div>
          )}
          <button
            onClick={onClear}
            style={{
              ...touchBase,
              fontSize: 11, color: C.muted,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${C.border}`,
              borderRadius: 6, padding: "4px 10px",
              minHeight: 30,
            }}
          >
            Remove commander
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Card Row ─────────────────────────────────────────────────────────────────

const CardRow = ({
  entry, onDelta, onPreview,
  format, commander, onSetCommander,
  singletonViolation,
}) => {
  const { card, count } = entry;
  const type = getCardType(card.type_line);
  const colors = getColors(card);
  const img = getImg(card);
  const isCmd = commander?.id === card.id;
  const canBeCommander = format === "commander" && isLegendaryCreature(card) && !isCmd;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 0",
      borderBottom: `1px solid ${C.border}22`,
      background: isCmd ? "rgba(168,85,247,0.06)" : "transparent",
    }}>
      {/* Commander crown indicator */}
      {isCmd && (
        <div style={{ fontSize: 14, flexShrink: 0 }}>👑</div>
      )}

      {/* Thumbnail */}
      <div
        onClick={() => onPreview(card)}
        style={{
          ...touchBase,
          width: 38, height: 52, borderRadius: 4, overflow: "hidden",
          background: C.card2, flexShrink: 0,
          border: isCmd ? `2px solid #a855f7` : `1px solid ${C.border}`,
        }}
      >
        {img && <img src={img} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: isCmd ? C.crown : C.text,
          marginBottom: 3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {card.name}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          <Tag color={TYPE_COLORS[type]}>{type}</Tag>
          {type !== "Land" && (
            <span style={{ fontSize: 10, color: C.muted }}>CMC {card.cmc ?? 0}</span>
          )}
          {colors.map(c => <ColorPip key={c} color={c} />)}
        </div>
        {singletonViolation && (
          <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>⚠️ Singleton rule</div>
        )}
        {/* Make commander button */}
        {canBeCommander && (
          <button
            onClick={() => onSetCommander(card)}
            style={{
              ...touchBase,
              marginTop: 4,
              fontSize: 10, fontWeight: 700,
              color: "#a855f7",
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.3)",
              borderRadius: 5, padding: "3px 8px",
              minHeight: 24,
            }}
          >
            👑 Make Commander
          </button>
        )}
      </div>

      {/* Count controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <button
          onClick={() => onDelta(card.id, -1)}
          style={{
            ...touchBase,
            width: 34, height: 34, borderRadius: 8,
            background: C.card2, color: C.text,
            fontSize: 18, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${C.border}`,
          }}
        >−</button>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.gold, minWidth: 22, textAlign: "center" }}>
          {count}
        </span>
        <button
          onClick={() => onDelta(card.id, +1)}
          style={{
            ...touchBase,
            width: 34, height: 34, borderRadius: 8,
            background: C.card2, color: C.text,
            fontSize: 18, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${C.border}`,
          }}
        >+</button>
      </div>
    </div>
  );
};

// ─── Scan Tab ─────────────────────────────────────────────────────────────────

const ScanTab = ({ onAdd, onSetCommander, format }) => {
  const [scanState, setScanState] = useState("idle");
  const [preview, setPreview]     = useState(null);
  const [result, setResult]       = useState(null);
  const [errorMsg, setErrorMsg]   = useState("");
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addedMsg, setAddedMsg]   = useState("");

  const cameraRef  = useRef();
  const galleryRef = useRef();

  const flash = (msg) => {
    setAddedMsg(msg);
    setTimeout(() => setAddedMsg(""), 2500);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setScanState("scanning");
    setResult(null);
    setErrorMsg("");

    try {
      if (!API_KEY) throw new Error("No API key — add VITE_ANTHROPIC_API_KEY to .env");
      const b64 = await toBase64(file);
      const mediaType = file.type || "image/jpeg";

      const res = await fetch(ANTHROPIC_API, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 150,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
              { type: "text", text: 'Identify this Magic: The Gathering card. Reply ONLY with valid JSON: {"name":"exact card name"} or {"name":null} if not an MTG card. No other text.' }
            ]
          }]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "API error");
      const rawText = data.content?.[0]?.text?.trim() || "{}";
      const parsed = JSON.parse(rawText.replace(/```[a-z]*/gi, "").replace(/```/g, "").trim());
      if (!parsed.name) throw new Error("Card not recognised — try better lighting or a cleaner angle");

      const sf = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(parsed.name)}`);
      const card = await sf.json();
      if (card.object === "error") throw new Error(`Scryfall: ${card.details}`);

      setResult(card);
      setScanState("found");
    } catch (e) {
      setErrorMsg(e.message);
      setScanState("error");
    }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim() || q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&limit=8&order=name`);
      const data = await res.json();
      setSearchResults(data.data ?? []);
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  };

  const reset = () => { setScanState("idle"); setPreview(null); setResult(null); };

  return (
    <div style={{ padding: "16px 16px 0" }}>
      {/* Camera / Gallery */}
      <Panel>
        <SectionTitle>Scan a Card</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Take Photo",   emoji: "📷", ref: cameraRef,  capture: true  },
            { label: "From Gallery", emoji: "🖼️", ref: galleryRef, capture: false },
          ].map(({ label, emoji, ref, capture }) => (
            <button
              key={label}
              onClick={() => ref.current?.click()}
              style={{
                ...touchBase,
                background: `linear-gradient(135deg, ${C.card2}, #0f1a3a)`,
                border: `1px solid ${C.border}`,
                borderRadius: 12, padding: "20px 12px",
                color: C.text, fontWeight: 700, fontSize: 15,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                minHeight: 90,
              }}
            >
              <span style={{ fontSize: 34 }}>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
        <input ref={cameraRef}  type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        <input ref={galleryRef} type="file" accept="image/*"                       style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
      </Panel>

      {/* Scan result */}
      {preview && (
        <Panel>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <img src={preview} style={{ width: 88, borderRadius: 8, border: `1px solid ${C.border}`, flexShrink: 0 }} alt="Scanned" />
            <div style={{ flex: 1 }}>
              {scanState === "scanning" && (
                <div style={{ display: "flex", gap: 10, alignItems: "center", color: C.sub, fontSize: 13 }}>
                  <Spinner /> Identifying…
                </div>
              )}
              {scanState === "error" && (
                <>
                  <div style={{ color: C.red, fontWeight: 600, marginBottom: 10, fontSize: 13 }}>❌ {errorMsg}</div>
                  <GoldBtn onClick={reset} variant="secondary" style={{ fontSize: 12, padding: "8px 14px" }}>Try again</GoldBtn>
                </>
              )}
              {scanState === "found" && result && (
                <>
                  <div style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>Identified:</div>
                  <div style={{ fontWeight: 700, color: C.text, marginBottom: 2, fontSize: 14 }}>{result.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.4 }}>{result.type_line}</div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <GoldBtn
                      onClick={() => { onAdd(result); flash(`✓ Added: ${result.name}`); reset(); }}
                      style={{ fontSize: 13, padding: "9px 14px" }}
                    >
                      ✓ Add to Deck
                    </GoldBtn>

                    {/* Commander shortcut — shown if Legendary Creature and in commander mode */}
                    {format === "commander" && isLegendaryCreature(result) && (
                      <button
                        onClick={() => {
                          onSetCommander(result);
                          onAdd(result);
                          flash(`👑 Commander set: ${result.name}`);
                          reset();
                        }}
                        style={{
                          ...touchBase,
                          background: `linear-gradient(135deg,#a855f7,#7c3aed)`,
                          color: "#fff", border: "none",
                          borderRadius: 10, padding: "9px 14px",
                          fontWeight: 700, fontSize: 13, minHeight: 44,
                        }}
                      >
                        👑 Set as Commander
                      </button>
                    )}

                    <GoldBtn onClick={reset} variant="secondary" style={{ fontSize: 13, padding: "9px 14px" }}>
                      Discard
                    </GoldBtn>
                  </div>
                </>
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* Flash message */}
      {addedMsg && (
        <div style={{
          background: addedMsg.startsWith("👑") ? "rgba(168,85,247,0.15)" : `${C.green}22`,
          border: `1px solid ${addedMsg.startsWith("👑") ? "#a855f744" : `${C.green}44`}`,
          borderRadius: 10, padding: "10px 14px",
          fontSize: 13, fontWeight: 600,
          color: addedMsg.startsWith("👑") ? "#d8b4fe" : C.green,
          marginBottom: 12, animation: "fadeIn 0.2s ease",
        }}>
          {addedMsg}
        </div>
      )}

      {/* Manual search */}
      <Panel>
        <SectionTitle>Search Manually</SectionTitle>
        <div style={{ position: "relative" }}>
          <input
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Type a card name…"
            style={{
              width: "100%", padding: "12px 14px",
              background: C.card2, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 16,
              outline: "none", minHeight: 44,
            }}
          />
          {searchLoading && (
            <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
              <Spinner size={16} />
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {searchResults.map(card => {
              const legendary = format === "commander" && isLegendaryCreature(card);
              return (
                <div
                  key={card.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 8px",
                    borderBottom: `1px solid ${C.border}22`,
                  }}
                >
                  {getImg(card) && <img src={getImg(card)} alt="" style={{ width: 32, borderRadius: 3, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{card.type_line}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {legendary && (
                      <button
                        onClick={() => {
                          onSetCommander(card);
                          onAdd(card);
                          flash(`👑 Commander set: ${card.name}`);
                          setSearchQuery(""); setSearchResults([]);
                        }}
                        style={{
                          ...touchBase,
                          fontSize: 10, fontWeight: 700, color: "#a855f7",
                          background: "rgba(168,85,247,0.12)",
                          border: "1px solid rgba(168,85,247,0.3)",
                          borderRadius: 6, padding: "5px 8px", minHeight: 32,
                        }}
                      >
                        👑
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onAdd(card);
                        flash(`✓ Added: ${card.name}`);
                        setSearchQuery(""); setSearchResults([]);
                      }}
                      style={{
                        ...touchBase,
                        fontSize: 10, fontWeight: 700, color: C.gold,
                        background: `${C.gold}15`,
                        border: `1px solid ${C.gold}33`,
                        borderRadius: 6, padding: "5px 10px", minHeight: 32,
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
};

// ─── Deck Tab ────────────────────────────────────────────────────────────────

const DeckTab = ({
  deck, deckName, setDeckName,
  onDelta, onClear, onPreview,
  format, commander, onSetCommander, onClearCommander,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const target = format === "commander" ? 100 : 60;
  const total  = deck.reduce((s, d) => s + d.count, 0);
  const progress = Math.min(100, (total / target) * 100);
  const remaining = target - total;

  // Singleton violation detection for commander mode
  const singletonViolations = useMemo(() => {
    if (format !== "commander") return new Set();
    return new Set(
      deck
        .filter(({ card, count }) => count > 1 && !isBasicLand(card))
        .map(({ card }) => card.id)
    );
  }, [deck, format]);

  const sorted = [...deck].sort((a, b) => {
    const isCmd_a = commander?.id === a.card.id;
    const isCmd_b = commander?.id === b.card.id;
    if (isCmd_a) return -1;
    if (isCmd_b) return 1;
    const ta = getCardType(a.card.type_line);
    const tb = getCardType(b.card.type_line);
    if (ta === "Land" && tb !== "Land") return 1;
    if (ta !== "Land" && tb === "Land") return -1;
    return (a.card.cmc ?? 0) - (b.card.cmc ?? 0);
  });

  return (
    <div style={{ padding: "16px 16px 0" }}>
      {/* Deck name + progress */}
      <Panel>
        <input
          value={deckName}
          onChange={e => setDeckName(e.target.value)}
          placeholder="Deck name…"
          style={{
            width: "100%", background: "transparent",
            border: "none", outline: "none",
            fontSize: 20, fontWeight: 700, color: C.gold,
            marginBottom: 12, minHeight: 36,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.sub }}>{total} / {target} cards</span>
          <span style={{ fontSize: 12, color: total >= target ? C.green : C.muted }}>
            {total >= target ? "✓ Full deck!" : `${remaining} to go`}
          </span>
        </div>
        <div style={{ height: 7, background: C.card2, borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: total >= target
              ? `linear-gradient(90deg, ${C.green}, #34d399)`
              : format === "commander"
                ? `linear-gradient(90deg, #a855f7, #7c3aed)`
                : `linear-gradient(90deg, ${C.gold}, #d97706)`,
            borderRadius: 4, transition: "width 0.4s ease",
          }} />
        </div>

        {/* Singleton violations warning */}
        {singletonViolations.size > 0 && (
          <div style={{
            marginTop: 10,
            background: `${C.red}15`, border: `1px solid ${C.red}33`,
            borderRadius: 8, padding: "8px 12px",
            fontSize: 12, color: C.red,
          }}>
            ⚠️ {singletonViolations.size} card{singletonViolations.size > 1 ? "s" : ""} break the singleton rule
          </div>
        )}
      </Panel>

      {/* Commander hero */}
      {format === "commander" && (
        <CommanderHero
          commander={commander}
          onClear={onClearCommander}
          onPreview={onPreview}
        />
      )}

      {/* No commander nudge */}
      {format === "commander" && !commander && deck.length > 0 && (
        <div style={{
          background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)",
          borderRadius: 10, padding: "10px 14px", marginBottom: 12,
          fontSize: 13, color: "#d8b4fe",
        }}>
          👑 Tap <strong>Make Commander</strong> on any Legendary Creature below to set your commander
        </div>
      )}

      {/* Card list */}
      {deck.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: C.muted, fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🃏</div>
          No cards yet — scan some from the Scan tab!
        </div>
      ) : (
        <Panel>
          {sorted.map(entry => (
            <CardRow
              key={entry.card.id}
              entry={entry}
              onDelta={onDelta}
              onPreview={onPreview}
              format={format}
              commander={commander}
              onSetCommander={onSetCommander}
              singletonViolation={singletonViolations.has(entry.card.id)}
            />
          ))}
        </Panel>
      )}

      {/* Clear deck */}
      {deck.length > 0 && (
        <div style={{ textAlign: "center", paddingBottom: 8 }}>
          {confirmClear ? (
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <GoldBtn
                onClick={() => { onClear(); setConfirmClear(false); }}
                style={{ background: `linear-gradient(135deg, ${C.red}, #b91c1c)`, fontSize: 13, padding: "10px 16px" }}
              >
                ⚠️ Yes, clear deck
              </GoldBtn>
              <GoldBtn variant="secondary" onClick={() => setConfirmClear(false)} style={{ fontSize: 13, padding: "10px 16px" }}>
                Cancel
              </GoldBtn>
            </div>
          ) : (
            <GoldBtn variant="secondary" onClick={() => setConfirmClear(true)} style={{ fontSize: 12, color: C.muted }}>
              🗑 Clear deck
            </GoldBtn>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Stats Tab ────────────────────────────────────────────────────────────────

const StatsTab = ({ analytics, deck, format }) => {
  if (!analytics || !deck.length) {
    return (
      <div style={{ textAlign: "center", padding: "48px 16px", color: C.muted }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
        Add cards to see stats
      </div>
    );
  }

  const { total, lands, spells, avgCmc, curveData, colorData, typeData } = analytics;
  const landPct = total ? ((lands / total) * 100).toFixed(0) : 0;
  // Commander: 35-40 lands, Standard: 37-40%
  const [minLand, maxLand] = format === "commander" ? [33, 40] : [37, 40];
  const landWarning = total > 0 && (landPct < minLand || landPct > maxLand);

  return (
    <div style={{ padding: "16px 16px 0" }}>
      <Panel>
        <SectionTitle>Overview</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Total Cards", value: total,   color: C.gold    },
            { label: "Spells",      value: spells,  color: "#3b82f6" },
            { label: "Lands",       value: lands,   color: "#92400e" },
            { label: "Avg CMC",     value: avgCmc,  color: "#a3e635" },
          ].map(s => (
            <div key={s.label} style={{
              background: C.card2, borderRadius: 10, padding: "12px 14px",
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {landWarning && (
          <div style={{
            marginTop: 10,
            background: "#f59e0b22", border: "1px solid #f59e0b44",
            borderRadius: 8, padding: "8px 12px",
            fontSize: 12, color: "#f59e0b",
          }}>
            ⚠️ Lands at {landPct}% — recommended {minLand}–{maxLand}% for {format === "commander" ? "Commander" : "60-card"}
          </div>
        )}
      </Panel>

      {colorData.length > 0 && (
        <Panel>
          <SectionTitle>Colour Distribution</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {colorData.map(([c, n]) => (
              <div key={c} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: `${MANA[c]?.bg ?? "#333"}22`,
                border: `1px solid ${MANA[c]?.bg ?? "#333"}44`,
                borderRadius: 20, padding: "6px 12px",
              }}>
                <span style={{ fontSize: 16 }}>{MANA[c]?.emoji}</span>
                <span style={{ fontWeight: 700, color: C.text }}>{n}</span>
                <span style={{ fontSize: 11, color: C.sub }}>{MANA[c]?.label}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel>
        <SectionTitle>Mana Curve (Non-Lands)</SectionTitle>
        <ResponsiveContainer width="100%" height={165}>
          <BarChart data={curveData} margin={{ top: 4, right: 0, bottom: 0, left: -25 }}>
            <XAxis dataKey="cmc" tick={{ fill: C.sub, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.sub, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#0d1832", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              formatter={(v) => [v, "Cards"]}
              labelFormatter={(l) => `CMC ${l}`}
            />
            <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={40}>
              {curveData.map((_, i) => (
                <Cell key={i} fill={CURVE_COLORS[Math.min(i, CURVE_COLORS.length - 1)]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel>
        <SectionTitle>Card Types</SectionTitle>
        {typeData.map(([type, count]) => (
          <div key={type} style={{ marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: C.sub }}>{type}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{count}</span>
            </div>
            <div style={{ height: 6, background: C.card2, borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, (count / total) * 100)}%`,
                background: TYPE_COLORS[type] ?? C.muted,
                borderRadius: 3, transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
};

// ─── AI Insights Tab ─────────────────────────────────────────────────────────

const renderMarkdown = (text) => {
  return text.split("\n").map((line, i) => {
    if (/^\*\*.*\*\*$/.test(line.trim())) {
      return (
        <div key={i} style={{
          fontWeight: 700, fontSize: 15, color: C.gold,
          marginTop: 16, marginBottom: 6,
          borderBottom: `1px solid ${C.border}`, paddingBottom: 5,
        }}>
          {line.replace(/\*\*/g, "")}
        </div>
      );
    }
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      return (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, fontSize: 13, color: C.text, lineHeight: 1.65 }}>
          <span style={{ color: C.gold, flexShrink: 0 }}>•</span>
          <span dangerouslySetInnerHTML={{ __html: line.replace(/^[-•]\s*/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
        </div>
      );
    }
    if (/\*\*/.test(line)) {
      return (
        <div key={i} style={{ fontSize: 13, color: C.text, marginBottom: 5, lineHeight: 1.65 }}
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong style='color:#e2e8f0'>$1</strong>") }}
        />
      );
    }
    if (!line.trim()) return <div key={i} style={{ height: 7 }} />;
    return <div key={i} style={{ fontSize: 13, color: C.text, marginBottom: 5, lineHeight: 1.65 }}>{line}</div>;
  });
};

const BracketBadge = ({ bracket }) => {
  if (!bracket) return null;
  const b = BRACKETS[bracket - 1];
  if (!b) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: `${b.color}22`, border: `1px solid ${b.color}44`,
      borderRadius: 12, padding: "12px 16px", marginBottom: 14,
    }}>
      <div style={{
        fontSize: 22, fontWeight: 900, color: b.color,
        background: `${b.color}22`, width: 46, height: 46, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${b.color}`, flexShrink: 0,
      }}>
        {bracket}
      </div>
      <div>
        <div style={{ fontWeight: 700, color: b.color, fontSize: 15 }}>Bracket {bracket} — {b.label}</div>
        <div style={{ fontSize: 12, color: C.sub }}>{b.desc}</div>
      </div>
    </div>
  );
};

const InsightsTab = ({ deck, deckName, analytics, format, commander }) => {
  const [status,   setStatus]   = useState("idle");
  const [insights, setInsights] = useState("");
  const [bracket,  setBracket]  = useState(null);
  const [error,    setError]    = useState("");

  const canGenerate = deck.length > 0 && !!API_KEY;
  const isCommander = format === "commander";

  const generate = async () => {
    setStatus("loading");
    setInsights(""); setBracket(null); setError("");

    try {
      const { total, lands, avgCmc } = analytics ?? {};
      const deckList = deck
        .map(d => `${d.count}x ${d.card.name} [${d.card.type_line}] CMC:${d.card.cmc ?? 0}`)
        .join("\n");

      const commanderLine = commander
        ? `Commander: ${commander.name} [${commander.type_line}]`
        : "";

      const prompt = `You are an expert Magic: The Gathering deckbuilder and strategist.

Format: ${isCommander ? "Commander / EDH (100-card singleton)" : "60-card constructed"}
Deck: "${deckName || "Unnamed Deck"}"
${commanderLine}
Stats: Total:${total ?? 0}, Lands:${lands ?? 0}, AvgCMC:${avgCmc ?? 0}

Decklist:
${deckList}

Analyse this deck thoroughly. Structure your response EXACTLY as follows:

**🎯 Archetype & Strategy**
Describe the deck's primary strategy in 2-3 sentences.${isCommander ? " Reference the commander's role." : ""}

**🏆 Bracket Estimate**
${isCommander
  ? `State the Commander bracket (1–5). Format: "Bracket X — Label"
1=Exhibition (precon), 2=Core (casual), 3=Upgraded (synergy-focused), 4=Optimised (near-cEDH), 5=cEDH`
  : `Rate the deck's power level (1–5). Format: "Bracket X — Label"
1=Budget kitchen table, 2=Casual FNM, 3=Local competitive, 4=PTQS/Regional, 5=Pro Tour level`}

**💪 Key Strengths**
- List 3-4 specific strengths, naming actual cards and synergies

**⚠️ Weaknesses & Risks**
- List 3-4 specific weaknesses or vulnerabilities the deck faces

**💡 Recommended Changes**
- Name specific cards to ADD and exactly why they improve the deck
- Name specific cards to CUT and why they underperform
- Give at least 4 concrete swap suggestions

**🏔️ Mana Base Assessment**
Evaluate land count, colour fixing, and ramp. For Commander, comment on whether 35-40 lands is appropriate.

**⭐ Overall Rating**
Score X/10 with a one-paragraph summary of quality and potential.

Be specific and practical. Reference real card interactions.`;

      const res = await fetch(ANTHROPIC_API, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 1600,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "API error");
      const text = data.content?.[0]?.text ?? "";
      setInsights(text);
      const m = text.match(/Bracket\s+([1-5])/i);
      if (m) setBracket(parseInt(m[1]));
      setStatus("done");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  };

  return (
    <div style={{ padding: "16px 16px 0" }}>
      <Panel>
        <SectionTitle>AI Deck Analysis</SectionTitle>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 14, lineHeight: 1.65 }}>
          {isCommander
            ? "Get an archetype breakdown, Commander bracket rating, and card-specific advice for your EDH build."
            : "Get an archetype breakdown, power level, and specific card recommendations."}
        </div>

        {!API_KEY && (
          <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}33`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: C.red, marginBottom: 12 }}>
            ⚠️ Add <strong>VITE_ANTHROPIC_API_KEY</strong> to your .env to enable AI insights
          </div>
        )}
        {deck.length === 0 && (
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>Add cards to your deck first</div>
        )}

        <GoldBtn
          onClick={generate}
          disabled={!canGenerate || status === "loading"}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          {status === "loading" ? <><Spinner size={16} /> Analysing…</> :
           status === "done"    ? "🔄 Regenerate Insights" :
                                  "✨ Generate Insights"}
        </GoldBtn>
      </Panel>

      {status === "error" && (
        <Panel style={{ borderColor: `${C.red}44` }}>
          <div style={{ color: C.red, fontSize: 13 }}>❌ {error}</div>
        </Panel>
      )}

      {status === "done" && insights && (
        <Panel style={{ animation: "fadeIn 0.3s ease" }}>
          <BracketBadge bracket={bracket} />
          {renderMarkdown(insights)}
        </Panel>
      )}
    </div>
  );
};

// ─── Card Preview Modal ───────────────────────────────────────────────────────

const CardModal = ({ card, onClose }) => {
  if (!card) return null;
  const fullImg = getImg(card, "normal");
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, animation: "fadeIn 0.15s ease",
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 340, width: "100%" }}>
        {fullImg && (
          <img src={fullImg} alt={card.name}
            style={{ width: "100%", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
          />
        )}
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{card.name}</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{card.set_name}</div>
          <button
            onClick={onClose}
            style={{
              ...touchBase,
              marginTop: 16, color: C.sub, fontSize: 14,
              padding: "10px 28px", minHeight: 44,
              border: `1px solid ${C.border}`, borderRadius: 10, background: C.card2,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "scan",  label: "Scan",  emoji: "📷" },
  { id: "deck",  label: "Deck",  emoji: "🃏" },
  { id: "stats", label: "Stats", emoji: "📊" },
  { id: "ai",    label: "AI",    emoji: "✨" },
];

export default function DeckScanner() {
  const [tab,         setTab]         = useState("scan");
  const [deck,        setDeck]        = useState([]);
  const [deckName,    setDeckName]    = useState("My Deck");
  const [format,      setFormat]      = useState("standard"); // "standard" | "commander"
  const [commander,   setCommander]   = useState(null);
  const [previewCard, setPreviewCard] = useState(null);

  const addCard = useCallback((card) => {
    setDeck(prev => {
      const existing = prev.find(d => d.card.id === card.id);
      return existing
        ? prev.map(d => d.card.id === card.id ? { ...d, count: d.count + 1 } : d)
        : [...prev, { card, count: 1 }];
    });
  }, []);

  const updateCount = useCallback((id, delta) => {
    setDeck(prev =>
      prev.map(d => d.card.id === id ? { ...d, count: Math.max(0, d.count + delta) } : d)
          .filter(d => d.count > 0)
    );
  }, []);

  const clearDeck = useCallback(() => {
    setDeck([]);
    setCommander(null);
  }, []);

  const handleSetCommander = useCallback((card) => {
    setCommander(card);
  }, []);

  const handleClearCommander = useCallback(() => {
    setCommander(null);
  }, []);

  const handleFormatChange = useCallback((newFormat) => {
    setFormat(newFormat);
    if (newFormat === "standard") setCommander(null);
  }, []);

  const analytics = useMemo(() => {
    if (!deck.length) return null;
    const total = deck.reduce((s, d) => s + d.count, 0);
    const curve = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, "7+":0 };
    const colorCounts = { W:0, U:0, B:0, R:0, G:0 };
    const typeCounts  = {};
    let lands = 0, totalCmc = 0, spells = 0;

    deck.forEach(({ card, count }) => {
      const type = getCardType(card.type_line);
      typeCounts[type] = (typeCounts[type] || 0) + count;
      if (type === "Land") { lands += count; return; }
      const cmc = card.cmc || 0;
      const key = cmc >= 7 ? "7+" : String(Math.floor(cmc));
      curve[key] += count;
      totalCmc += cmc * count;
      spells += count;
      getColors(card).forEach(c => { if (colorCounts[c] !== undefined) colorCounts[c] += count; });
    });

    return {
      total, lands, spells,
      avgCmc: spells ? (totalCmc / spells).toFixed(1) : "0.0",
      curveData:  Object.entries(curve).map(([cmc, count]) => ({ cmc, count })),
      colorData:  Object.entries(colorCounts).filter(([, n]) => n > 0).sort((a,b) => b[1]-a[1]),
      typeData:   Object.entries(typeCounts).sort((a, b) => b[1] - a[1]),
    };
  }, [deck]);

  const totalCards = deck.reduce((s, d) => s + d.count, 0);
  const target = format === "commander" ? 100 : 60;

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto",
      minHeight: "100dvh",
      background: C.bg,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 200,
        background: `${C.card}f0`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.gold, letterSpacing: -0.3, lineHeight: 1.2 }}>
            ⚔️ MTG Companion
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
            {deckName} · {totalCards}/{target}
          </div>
        </div>
        <FormatToggle format={format} onChange={handleFormatChange} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>
        {tab === "scan" && (
          <ScanTab
            onAdd={addCard}
            onSetCommander={handleSetCommander}
            format={format}
          />
        )}
        {tab === "deck" && (
          <DeckTab
            deck={deck}
            deckName={deckName}
            setDeckName={setDeckName}
            onDelta={updateCount}
            onClear={clearDeck}
            onPreview={setPreviewCard}
            format={format}
            commander={commander}
            onSetCommander={handleSetCommander}
            onClearCommander={handleClearCommander}
          />
        )}
        {tab === "stats" && (
          <StatsTab analytics={analytics} deck={deck} format={format} />
        )}
        {tab === "ai" && (
          <InsightsTab
            deck={deck}
            deckName={deckName}
            analytics={analytics}
            format={format}
            commander={commander}
          />
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: `${C.card}fa`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: `1px solid ${C.border}`,
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        zIndex: 100,
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)",
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                ...touchBase,
                padding: "10px 4px 8px",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3,
                color: active ? C.gold : C.muted,
                background: "none", border: "none",
                position: "relative",
                minHeight: 56,
              }}
            >
              {active && (
                <div style={{
                  position: "absolute", top: 0, left: "22%", right: "22%",
                  height: 2, background: C.gold, borderRadius: "0 0 3px 3px",
                }} />
              )}
              <span style={{ fontSize: 22 }}>{t.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: 0.3 }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {previewCard && <CardModal card={previewCard} onClose={() => setPreviewCard(null)} />}
    </div>
  );
}
