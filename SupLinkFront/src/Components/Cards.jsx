import { useState } from "react";
import { deletePortfolio } from "../api/supplier";

// Added "onDelete" prop to handle the logic in the parent component
export default function POCard({ portfolio = {}, onDelete , canDelete = false}) {
  const [isConfirming, setIsConfirming] = useState(false);

  const {
    id: portfolio_id,
    title = "Untitled",
    description = "No description provided.",
    company_name = "Unknown Supplier",
    image_url,
    created_at,
  } = portfolio;

  const handleDelete = async () => {
  try {
    await deletePortfolio(portfolio_id);
    onDelete?.(portfolio_id);
  } catch (err) {
    console.error("Delete failed:", err.message);
    // optionally show an error toast/message
  }
};

  return (
    <div style={s.card}>
      {/* Image */}
      {image_url ? (
        <img src={image_url} alt={title} style={s.image} />
      ) : (
        <div style={s.imagePlaceholder}>No Image</div>
      )}

      {/* Content */}
      <div style={s.content}>
        <div style={s.cardHeader}>
          <div style={s.dotRed} />
          <div style={s.dotYellow} />
          <div style={s.dotGreen} />
          <span style={s.cardId}>Portfolio #{portfolio_id}</span>
        </div>

        <Row label="Title"       value={title} />
        <Row label="Description" value={<span style={s.desc}>{description}</span>} />
        <Row label="Supplier"    value={company_name} />
        <Row label="Posted"      value={created_at ? new Date(created_at).toLocaleDateString() : "—"} />

          {/* Delete Section */}
          {canDelete && (
            <div style={s.footer}>
          {!isConfirming ? (
            <button 
              onClick={() => setIsConfirming(true)} 
              style={s.deleteBtn}
            >
              Delete Portfolio
            </button>
          ) : (
            <div style={s.confirmGroup}>
              <span style={s.confirmText}>Are you sure?</span>
              <button onClick={handleDelete} style={s.confirmBtn}>Yes</button>
              <button onClick={() => setIsConfirming(false)} style={s.cancelBtn}>No</button>
            </div>
          )}
        </div>

        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <span style={s.value}>{value}</span>
    </div>
  );
}

const C = {
  surface: "#121720",
  border:  "#1e2736",
  text:    "#e8eaf0",
  muted:   "#7a8499",
  accent:  "#d4af6a",
};

const s = {
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    display: "block",
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    background: "#1e2736",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: C.muted,
    fontSize: 14,
  },
  content: { padding: 24 },
  cardHeader: {
    display: "flex", alignItems: "center", gap: 6, marginBottom: 16,
  },
  dotRed:    { width: 10, height: 10, borderRadius: "50%", background: "#e05353" },
  dotYellow: { width: 10, height: 10, borderRadius: "50%", background: "#f5a623" },
  dotGreen:  { width: 10, height: 10, borderRadius: "50%", background: "#7ed321" },
  cardId:    { fontSize: 12, color: C.muted, marginLeft: 8, fontFamily: "monospace" },
  row: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "10px 0", borderBottom: `1px solid ${C.border}`,
  },
  label: {
    fontSize: 12, color: C.muted,
    textTransform: "uppercase", letterSpacing: ".06em",
    flexShrink: 0,
  },
  value: {
    fontSize: 14, fontWeight: 600, color: C.text,
    textAlign: "right", maxWidth: "65%",
  },
  desc: {
    fontSize: 13, fontWeight: 400, color: "#a0a8b8",
    whiteSpace: "pre-wrap",
  },
  footer: {
    marginTop: 20,
    display: "flex",
    justifyContent: "flex-end",
  },
  deleteBtn: {
    background: "transparent",
    border: `1px solid #e05353`,
    color: "#e05353",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    transition: "all 0.2s",
  },
  confirmGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  confirmText: {
    fontSize: 12,
    color: "#e05353",
    fontWeight: "bold",
  },
  confirmBtn: {
    background: "#e05353",
    border: "none",
    color: "white",
    padding: "4px 10px",
    borderRadius: 4,
    cursor: "pointer",
  },
  cancelBtn: {
    background: C.border,
    border: "none",
    color: C.text,
    padding: "4px 10px",
    borderRadius: 4,
    cursor: "pointer",
  }
};