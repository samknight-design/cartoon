import { useState, useMemo, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

// ─── Constants ───────────────────────────────────────────────────────────────

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const C = {
  bg:     "#0a0f1e",
  card:   "#131d35",
  card2:  "#1a2744",
  border: "#1e3060",
  gold:   "#f59e0b",
  text:   "#e2e8f0",
  sub:    "#94a3b8",
  muted:  "#64748b",
  green:  "#10b981",
  red:    "#ef4444",
};

const MANA = {
  W: { bg: "#EDE8C8", fg: "#333", label: "White",  emoji: "☀️"  },
  U: { bg: "#1469B5", fg: "#fff", label: "Blue",   emoji: "💧"  },
  B: { bg: "#2a1f1a", fg: "#ccc", label: "Black",  emoji: "💀"  },
  R: { bg: "#CC2200", fg: "#fff", label: "Red",    emoji: "🔥"  },
  G: { bg: "#006B3C", fg: "#fff", label: "Green",  emoji: "🌿"  },
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

// Commander brackets (1-5)
const BRACKETS = [
  { n: 1, label: "Exhibition",  desc: "Precon-level, minimal synergy",    color: "#94a3b8" },
  { n: 2, label: "Core",        desc: "Upgraded precon, casual fun",      color: "#22d3ee" },
  { n: 3, label: "Upgraded",    desc: "Focused synergies, some staples",  color: "#34d399" },
  { n: 4, label: "Optimised",   desc: "High-powered, near-cEDH",         color: "#f59e0b" },
  { n: 5, label: "cEDH",        desc: "Fully optimised, competitive",     color: "#ef4444" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getImg = (card, size = "small") =>
  card?.image_uris?.[size] ?? card?.card_faces?.[0]?.image_uris?.[size] ?? null;

const getColors = (card) =>
  card?.colors?.length > 0
    ? card.colors
    : card?.card_faces?.[0]?.colors ?? [];

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

const Tag = ({ children, color = C.muted, bg }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
    color: color,
    background: bg ?? `${color}22`,
    padding: "2px 6px",
    borderRadius: 4,
    textTransform: "uppercase",
    flexShrink: 0,
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
      width: 16, height: 16, borderRadius: "50%",
      background: m.bg, color: m.fg,
      fontSize: 9, fontWeight: 700,
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
        background: isPrimary
          ? `linear-gradient(135deg, #f59e0b, #d97706)`
          : "transparent",
        color: isPrimary ? "#0a0f1e" : C.gold,
        border: isPrimary ? "none" : `1px solid ${C.gold}44`,
        borderRadius: 10,
        padding: "10px 18px",
        fontWeight: 700, fontSize: 14,
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.15s, transform 0.1s",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

// ─── Card Row ─────────────────────────────────────────────────────────────────

const CardRow = ({ entry, onDelta, onPreview }) => {
  const { card, count } = entry;
  const type = getCardType(card.type_line);
  const colors = getColors(card);
  const img = getImg(card);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 0",
      borderBottom: `1px solid ${C.border}22`,
    }}>
      {/* Thumbnail */}
      <div
        onClick={() => onPreview(card)}
        style={{
          width: 36, height: 50, borderRadius: 4, overflow: "hidden",
          background: C.card2, cursor: "pointer", flexShrink: 0,
          border: `1px solid ${C.border}`,
        }}
      >
        {img && <img src={img} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {card.name}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          <Tag color={TYPE_COLORS[type]}>{type}</Tag>
          {type !== "Land" && (
            <span style={{ fontSize: 10, color: C.muted }}>CMC {card.cmc ?? 0}</span>
          )}
          {colors.map(c => <ColorPip key={c} color={c} />)}
        </div>
      </div>

      {/* Count controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onDelta(card.id, -1)}
          style={{
            width: 26, height: 26, borderRadius: 6,
            background: C.card2, color: C.text,
            fontSize: 16, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${C.border}`,
          }}
        >−</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.gold, minWidth: 20, textAlign: "center" }}>
          {count}
        </span>
        <button
          onClick={() => onDelta(card.id, +1)}
          style={{
            width: 26, height: 26, borderRadius: 6,
            background: C.card2, color: C.text,
            fontSize: 16, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${C.border}`,
          }}
        >+</button>
      </div>
    </div>
  );
};

// ─── Scan Tab ─────────────────────────────────────────────────────────────────

const ScanTab = ({ onAdd }) => {
  const [scanState, setScanState] = useState("idle"); // idle | scanning | found | error
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addedCard, setAddedCard] = useState(null);

  const cameraRef = useRef();
  const galleryRef = useRef();

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
              { type: "text", text: 'Identify this Magic: The Gathering card. Reply ONLY with valid JSON: {"name":"exact card name","set":"set name if visible"} or {"name":null} if not an MTG card. No other text.' }
            ]
          }]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "API error");
      const rawText = data.content?.[0]?.text?.trim() || "{}";
      const parsed = JSON.parse(rawText.replace(/```[a-z]*/gi, "").replace(/```/g, "").trim());

      if (!parsed.name) throw new Error("Card not recognised — try better lighting or a cleaner angle");

      // Lookup on Scryfall
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

  const confirmAdd = () => {
    if (!result) return;
    onAdd(result);
    setAddedCard(result);
    setTimeout(() => setAddedCard(null), 2500);
    setScanState("idle");
    setResult(null);
    setPreview(null);
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

  return (
    <div style={{ padding: "16px 16px 0" }}>
      {/* Camera / Gallery buttons */}
      <Panel>
        <SectionTitle>Scan a Card</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            onClick={() => cameraRef.current?.click()}
            style={{
              background: `linear-gradient(135deg, ${C.card2}, #0f1a3a)`,
              border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "18px 12px",
              color: C.text, fontWeight: 700, fontSize: 15,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 32 }}>📷</span>
            Take Photo
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            style={{
              background: `linear-gradient(135deg, ${C.card2}, #0f1a3a)`,
              border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "18px 12px",
              color: C.text, fontWeight: 700, fontSize: 15,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 32 }}>🖼️</span>
            From Gallery
          </button>
        </div>

        <input
          ref={cameraRef} type="file" accept="image/*" capture="environment"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])}
        />
        <input
          ref={galleryRef} type="file" accept="image/*"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])}
        />
      </Panel>

      {/* Preview + result */}
      {preview && (
        <Panel>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <img
              src={preview}
              style={{ width: 90, borderRadius: 8, border: `1px solid ${C.border}` }}
              alt="Scanned"
            />
            <div style={{ flex: 1 }}>
              {scanState === "scanning" && (
                <div style={{ display: "flex", gap: 10, alignItems: "center", color: C.sub }}>
                  <Spinner /> Identifying card…
                </div>
              )}
              {scanState === "error" && (
                <div>
                  <div style={{ color: C.red, fontWeight: 600, marginBottom: 8 }}>❌ {errorMsg}</div>
                  <GoldBtn onClick={() => { setScanState("idle"); setPreview(null); }} variant="secondary" style={{ fontSize: 12 }}>
                    Try again
                  </GoldBtn>
                </div>
              )}
              {scanState === "found" && result && (
                <div>
                  <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>Identified:</div>
                  <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{result.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{result.type_line}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <GoldBtn onClick={confirmAdd} style={{ fontSize: 13, padding: "8px 14px" }}>
                      ✓ Add to Deck
                    </GoldBtn>
                    <GoldBtn
                      onClick={() => { setScanState("idle"); setPreview(null); setResult(null); }}
                      variant="secondary"
                      style={{ fontSize: 13, padding: "8px 14px" }}
                    >
                      Discard
                    </GoldBtn>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* Added confirmation */}
      {addedCard && (
        <div style={{
          background: `${C.green}22`, border: `1px solid ${C.green}44`,
          borderRadius: 10, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 12, animation: "fadeIn 0.2s ease",
        }}>
          {getImg(addedCard) && (
            <img src={getImg(addedCard)} alt="" style={{ width: 36, borderRadius: 4 }} />
          )}
          <div>
            <div style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>✓ Added to deck</div>
            <div style={{ fontSize: 13, color: C.text }}>{addedCard.name}</div>
          </div>
        </div>
      )}

      {/* Manual search */}
      <Panel>
        <SectionTitle>Search Manually</SectionTitle>
        <div style={{ position: "relative" }}>
          <input
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search card name…"
            style={{
              width: "100%", padding: "10px 14px",
              background: C.card2, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 14,
              outline: "none",
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
            {searchResults.map(card => (
              <div
                key={card.id}
                onClick={() => {
                  onAdd(card);
                  setAddedCard(card);
                  setTimeout(() => setAddedCard(null), 2500);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", cursor: "pointer",
                  borderRadius: 8, transition: "background 0.1s",
                  borderBottom: `1px solid ${C.border}22`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.card2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {getImg(card) && (
                  <img src={getImg(card)} alt="" style={{ width: 30, borderRadius: 3 }} />
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{card.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{card.type_line}</div>
                </div>
                <Tag color={C.gold} style={{ marginLeft: "auto" }}>+ Add</Tag>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

// ─── Deck Tab ────────────────────────────────────────────────────────────────

const DeckTab = ({ deck, deckName, setDeckName, onDelta, onClear, onPreview }) => {
  const [confirmClear, setConfirmClear] = useState(false);

  const total = deck.reduce((s, d) => s + d.count, 0);
  const progress = Math.min(100, (total / 60) * 100);

  const sorted = [...deck].sort((a, b) => {
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
            marginBottom: 12,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.sub }}>{total} / 60 cards</span>
          <span style={{ fontSize: 12, color: total === 60 ? C.green : C.muted }}>
            {total === 60 ? "✓ Full deck" : `${60 - total} more to go`}
          </span>
        </div>
        <div style={{ height: 6, background: C.card2, borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: total >= 60
              ? `linear-gradient(90deg, ${C.green}, #34d399)`
              : `linear-gradient(90deg, ${C.gold}, #d97706)`,
            borderRadius: 3, transition: "width 0.4s ease",
          }} />
        </div>
      </Panel>

      {/* Card list */}
      {deck.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 0",
          color: C.muted, fontSize: 14,
        }}>
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
            />
          ))}
        </Panel>
      )}

      {/* Clear */}
      {deck.length > 0 && (
        <div style={{ textAlign: "center", paddingBottom: 8 }}>
          {confirmClear ? (
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <GoldBtn
                onClick={() => { onClear(); setConfirmClear(false); }}
                style={{ background: `linear-gradient(135deg, ${C.red}, #b91c1c)`, fontSize: 13, padding: "8px 16px" }}
              >
                ⚠️ Yes, clear deck
              </GoldBtn>
              <GoldBtn variant="secondary" onClick={() => setConfirmClear(false)} style={{ fontSize: 13, padding: "8px 16px" }}>
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

const StatsTab = ({ analytics, deck }) => {
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
  const landWarning = total > 0 && (landPct < 37 || landPct > 40);

  return (
    <div style={{ padding: "16px 16px 0" }}>
      {/* Stat grid */}
      <Panel>
        <SectionTitle>Overview</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Total Cards",  value: total,   color: C.gold  },
            { label: "Spells",       value: spells,  color: "#3b82f6" },
            { label: "Lands",        value: lands,   color: "#92400e" },
            { label: "Avg CMC",      value: avgCmc,  color: "#a3e635" },
          ].map(s => (
            <div key={s.label} style={{
              background: C.card2, borderRadius: 10, padding: "12px 14px",
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
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
            ⚠️ Land count {landPct}% is outside the recommended 37–40% range
          </div>
        )}
      </Panel>

      {/* Colour distribution */}
      {colorData.length > 0 && (
        <Panel>
          <SectionTitle>Colour Distribution</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {colorData.map(([c, n]) => (
              <div key={c} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: `${MANA[c]?.bg ?? "#333"}22`,
                border: `1px solid ${MANA[c]?.bg ?? "#333"}44`,
                borderRadius: 20, padding: "5px 10px",
              }}>
                <span style={{ fontSize: 14 }}>{MANA[c]?.emoji}</span>
                <span style={{ fontWeight: 700, color: C.text }}>{n}</span>
                <span style={{ fontSize: 11, color: C.sub }}>{MANA[c]?.label}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Mana curve */}
      <Panel>
        <SectionTitle>Mana Curve (Non-Lands)</SectionTitle>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={curveData} margin={{ top: 4, right: 0, bottom: 0, left: -25 }}>
            <XAxis
              dataKey="cmc"
              tick={{ fill: C.sub, fontSize: 12 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: C.sub, fontSize: 11 }}
              axisLine={false} tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0d1832", border: `1px solid ${C.border}`,
                borderRadius: 8, color: C.text, fontSize: 12,
              }}
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

      {/* Type breakdown */}
      <Panel>
        <SectionTitle>Card Types</SectionTitle>
        {typeData.map(([type, count]) => (
          <div key={type} style={{ marginBottom: 8 }}>
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
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold headers **text**
    if (/^\*\*.*\*\*$/.test(line.trim())) {
      return (
        <div key={i} style={{
          fontWeight: 700, fontSize: 15, color: C.gold,
          marginTop: 14, marginBottom: 6,
          borderBottom: `1px solid ${C.border}`,
          paddingBottom: 4,
        }}>
          {line.replace(/\*\*/g, "")}
        </div>
      );
    }
    // Bullet points
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      return (
        <div key={i} style={{
          display: "flex", gap: 8, marginBottom: 4,
          fontSize: 13, color: C.text, lineHeight: 1.6,
        }}>
          <span style={{ color: C.gold, flexShrink: 0 }}>•</span>
          <span dangerouslySetInnerHTML={{
            __html: line.replace(/^[-•]\s*/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          }} />
        </div>
      );
    }
    // Inline bold
    if (/\*\*/.test(line)) {
      return (
        <div key={i} style={{ fontSize: 13, color: C.text, marginBottom: 4, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.+?)\*\*/g, "<strong style='color:#e2e8f0'>$1</strong>")
          }}
        />
      );
    }
    if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
    return (
      <div key={i} style={{ fontSize: 13, color: C.text, marginBottom: 4, lineHeight: 1.6 }}>
        {line}
      </div>
    );
  });
};

const BracketBadge = ({ bracket }) => {
  if (!bracket) return null;
  const b = BRACKETS[bracket - 1];
  if (!b) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: `${b.color}22`, border: `1px solid ${b.color}44`,
      borderRadius: 12, padding: "12px 16px", marginBottom: 12,
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{
        fontSize: 22, fontWeight: 900, color: b.color,
        background: `${b.color}22`, width: 44, height: 44,
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${b.color}`,
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

const InsightsTab = ({ deck, deckName, analytics }) => {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [insights, setInsights] = useState("");
  const [bracket, setBracket] = useState(null);
  const [error, setError] = useState("");

  const canGenerate = deck.length > 0 && !!API_KEY;

  const generate = async () => {
    setStatus("loading");
    setInsights("");
    setBracket(null);
    setError("");

    try {
      const { total, lands, avgCmc } = analytics ?? {};
      const deckList = deck
        .map(d => `${d.count}x ${d.card.name} [${d.card.type_line}] CMC:${d.card.cmc ?? 0}`)
        .join("\n");

      const prompt = `You are an expert Magic: The Gathering deckbuilder and strategist with deep knowledge of all formats.

Deck: "${deckName || "Unnamed Deck"}"
Stats: Total:${total ?? 0}, Lands:${lands ?? 0}, AvgCMC:${avgCmc ?? 0}

Decklist:
${deckList}

Analyse this deck and provide a thorough review. Structure your response EXACTLY as follows:

**🎯 Archetype & Strategy**
Describe the deck's primary strategy and archetype in 2-3 sentences.

**🏆 Bracket Estimate**
State the Commander bracket (1–5) with a brief justification. Format as: "Bracket X — Label"
1=Exhibition (precon-level), 2=Core (casual), 3=Upgraded (focused synergies), 4=Optimised (near-cEDH), 5=cEDH (fully competitive)

**💪 Key Strengths**
- List 3-4 specific strengths, naming actual cards

**⚠️ Weaknesses & Risks**
- List 3-4 specific weaknesses or vulnerabilities

**💡 Recommended Changes**
- Name specific cards to ADD and WHY
- Name specific cards to CUT and WHY
- Give at least 4 concrete suggestions

**🏔️ Mana Base Assessment**
Evaluate the land count, colour fixing, and mana base quality. Be specific.

**⭐ Overall Rating**
Give a score X/10 and a one-paragraph summary of the deck's overall quality and potential.

Be specific, reference real card interactions and synergies, keep advice practical and actionable.`;

      const res = await fetch(ANTHROPIC_API, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "API error");

      const text = data.content?.[0]?.text ?? "";
      setInsights(text);

      // Extract bracket number from the response
      const bracketMatch = text.match(/Bracket\s+([1-5])/i);
      if (bracketMatch) setBracket(parseInt(bracketMatch[1]));

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
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 14, lineHeight: 1.6 }}>
          Get a full archetype breakdown, bracket estimate, and specific card recommendations powered by Claude AI.
        </div>

        {!API_KEY && (
          <div style={{
            background: "#ef444422", border: "1px solid #ef444444",
            borderRadius: 8, padding: "10px 12px",
            fontSize: 12, color: C.red, marginBottom: 12,
          }}>
            ⚠️ Add <strong>VITE_ANTHROPIC_API_KEY</strong> to your .env file to enable AI insights
          </div>
        )}

        {deck.length === 0 && (
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>
            Add cards to your deck first
          </div>
        )}

        <GoldBtn
          onClick={generate}
          disabled={!canGenerate || status === "loading"}
          style={{ width: "100%", justifyContent: "center", display: "flex", gap: 8 }}
        >
          {status === "loading" ? (
            <><Spinner size={16} /> Analysing deck…</>
          ) : status === "done" ? (
            "🔄 Regenerate Insights"
          ) : (
            "✨ Generate Insights"
          )}
        </GoldBtn>
      </Panel>

      {status === "error" && (
        <Panel style={{ borderColor: "#ef444444" }}>
          <div style={{ color: C.red, fontSize: 13 }}>❌ {error}</div>
        </Panel>
      )}

      {status === "done" && insights && (
        <Panel style={{ animation: "fadeIn 0.3s ease" }}>
          <BracketBadge bracket={bracket} />
          <div>{renderMarkdown(insights)}</div>
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
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 340, width: "100%" }}>
        {fullImg && (
          <img
            src={fullImg}
            alt={card.name}
            style={{ width: "100%", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
          />
        )}
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <div style={{ color: C.text, fontWeight: 700 }}>{card.name}</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{card.set_name}</div>
          <button
            onClick={onClose}
            style={{ marginTop: 14, color: C.sub, fontSize: 13, padding: "8px 20px",
              border: `1px solid ${C.border}`, borderRadius: 8, background: C.card2 }}
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
  { id: "scan",    label: "Scan",  emoji: "📷" },
  { id: "deck",    label: "Deck",  emoji: "🃏" },
  { id: "stats",   label: "Stats", emoji: "📊" },
  { id: "ai",      label: "AI",    emoji: "✨" },
];

export default function DeckScanner() {
  const [tab, setTab]           = useState("scan");
  const [deck, setDeck]         = useState([]);
  const [deckName, setDeckName] = useState("My Deck");
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

  const clearDeck = useCallback(() => setDeck([]), []);

  const analytics = useMemo(() => {
    if (!deck.length) return null;
    const total = deck.reduce((s, d) => s + d.count, 0);
    const curve = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, "7+":0 };
    const colorCounts = { W:0, U:0, B:0, R:0, G:0 };
    const typeCounts = {};
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
      curveData: Object.entries(curve).map(([cmc, count]) => ({ cmc, count })),
      colorData: Object.entries(colorCounts).filter(([, n]) => n > 0).sort((a,b) => b[1]-a[1]),
      typeData: Object.entries(typeCounts).sort((a, b) => b[1] - a[1]),
    };
  }, [deck]);

  const totalCards = deck.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto",
      minHeight: "100dvh",
      background: C.bg,
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: `${C.card}f0`,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.gold, letterSpacing: -0.5 }}>
            ⚔️ MTG Companion
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            {deckName} · {totalCards} cards
          </div>
        </div>
        {totalCards > 0 && (
          <div style={{
            background: `${C.gold}22`, border: `1px solid ${C.gold}44`,
            borderRadius: 20, padding: "4px 10px",
            fontSize: 12, fontWeight: 700, color: C.gold,
          }}>
            {totalCards} cards
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {tab === "scan"  && <ScanTab onAdd={addCard} />}
        {tab === "deck"  && (
          <DeckTab
            deck={deck}
            deckName={deckName}
            setDeckName={setDeckName}
            onDelta={updateCount}
            onClear={clearDeck}
            onPreview={setPreviewCard}
          />
        )}
        {tab === "stats" && <StatsTab analytics={analytics} deck={deck} />}
        {tab === "ai"    && (
          <InsightsTab
            deck={deck}
            deckName={deckName}
            analytics={analytics}
          />
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: `${C.card}f8`,
        backdropFilter: "blur(16px)",
        borderTop: `1px solid ${C.border}`,
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 4px 8px",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3,
                color: active ? C.gold : C.muted,
                transition: "color 0.15s",
                background: "none",
                position: "relative",
              }}
            >
              {active && (
                <div style={{
                  position: "absolute", top: 0, left: "20%", right: "20%",
                  height: 2, background: C.gold, borderRadius: "0 0 2px 2px",
                }} />
              )}
              <span style={{ fontSize: 20 }}>{t.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: 0.3 }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Card preview modal */}
      {previewCard && <CardModal card={previewCard} onClose={() => setPreviewCard(null)} />}
    </div>
  );
}
