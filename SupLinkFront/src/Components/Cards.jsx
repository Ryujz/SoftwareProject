/**
 * POCard — Floating purchase order preview card.
 *
 * Props:
 *   order?: {
 *     id?:        string   — PO number, e.g. "PO-00812"
 *     supplier?:  string
 *     category?:  string
 *     amount?:    string   — formatted string, e.g. "$284,500.00"
 *     savings?:   string   — e.g. "↓ 12.4% vs budget"
 *     delivery?:  number   — 0–100 percent complete
 *     status?:    "Approved" | "Pending" | "Rejected"
 *   }
 *   style?: React.CSSProperties  — override wrapper styles (position, etc.)
 *   visible?: boolean            — fade/slide in when true (default true)
 */
export default function POCard({ order = {}, style = {}, visible = true }) {
  const {
    id = "PO-00812",
    supplier = "Apex Industrial Co.",
    category = "MRO Supplies",
    amount = "$284,500.00",
    savings = "↓ 12.4% vs budget",
    delivery = 72,
    status = "Approved",
  } = order;

  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES["Approved"];

  return (
    <div
      style={{
        ...s.card,
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(40px) rotate(2deg)",
        transition: "opacity 1s .3s ease, transform 1s .3s ease",
        ...style,
      }}
    >
      {/* Window chrome dots */}
      <div style={s.cardHeader}>
        <div style={s.dotRed} />
        <div style={s.dotYellow} />
        <div style={s.dotGreen} />
        <span style={s.cardTitle}>Purchase Order #{id}</span>
      </div>

      <Row label="Supplier"  value={supplier} />
      <Row label="Category"  value={category} />
      <Row label="Amount"    value={<span style={s.amountVal}>{amount}</span>} />

      {/* Status pill */}
      <div style={s.row}>
        <span style={s.label}>Approval</span>
        <span style={{ ...s.pill, ...statusStyle }}>● {status}</span>
      </div>

      <Row label="Savings" value={<span style={s.savingsVal}>{savings}</span>} />

      {/* Delivery progress */}
      <div style={s.progressWrap}>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${Math.min(100, Math.max(0, delivery))}%` }} />
        </div>
        <span style={s.progressLabel}>Delivery: {delivery}% complete</span>
      </div>
    </div>
  );
}

/* ─── Sub-component ───────────────────────────────────────────── */
function Row({ label, value }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <span style={s.value}>{value}</span>
    </div>
  );
}

/* ─── Constants ───────────────────────────────────────────────── */
const STATUS_STYLES = {
  Approved: { color: "#7ed321", background: "rgba(126,211,33,.1)" },
  Pending:  { color: "#f5a623", background: "rgba(245,166,35,.1)" },
  Rejected: { color: "#e05353", background: "rgba(224,83,83,.1)"  },
};

/* ─── Styles ──────────────────────────────────────────────────── */
const C = {
  surface: "#121720",
  border: "#1e2736",
  text: "#e8eaf0",
  muted: "#7a8499",
  accent: "#d4af6a",
  accentDark: "#a07c3a",
};

const s = {
  card: {
    flex: "0 0 340px",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 24px 60px rgba(0,0,0,.5)",
    position: "relative",
  },

  // Header chrome
  cardHeader: { display: "flex", alignItems: "center", gap: 6, marginBottom: 20 },
  dotRed:    { width: 10, height: 10, borderRadius: "50%", background: "#e05353" },
  dotYellow: { width: 10, height: 10, borderRadius: "50%", background: "#f5a623" },
  dotGreen:  { width: 10, height: 10, borderRadius: "50%", background: "#7ed321" },
  cardTitle: { fontSize: 12, color: C.muted, marginLeft: 8, fontFamily: "monospace" },

  // Rows
  row: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: `1px solid ${C.border}`,
  },
  label: { fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em" },
  value: { fontSize: 14, fontWeight: 600, color: C.text },

  // Special value styles
  amountVal:  { fontSize: 14, fontWeight: 700, color: C.accent },
  savingsVal: { fontSize: 14, fontWeight: 600, color: "#7ed321" },

  // Status pill
  pill: { fontSize: 12, padding: "3px 10px", borderRadius: 100 },

  // Progress bar
  progressWrap:  { marginTop: 16 },
  progressTrack: { height: 4, background: C.border, borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressFill:  {
    height: "100%",
    background: `linear-gradient(90deg, ${C.accentDark}, ${C.accent})`,
    borderRadius: 4,
    transition: "width .6s ease",
  },
  progressLabel: { fontSize: 12, color: C.muted },
};