import { useState } from "react";
import { deleteProject, submitInterest } from "../api/project";
import { startPrivateChat } from "../api/chat";
import { useNavigate } from "react-router-dom";

export default function ProjectCard({ project = {}, onDelete, canDelete = false, canInterest = false }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [showInterest, setShowInterest] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [interestError, setInterestError] = useState("");
  const {
    id,
    title = "Untitled Project",
    description = "No description provided.",
    budget,
    status = "open",
    created_at,
    completed_at,
  } = project;
  const navigate = useNavigate();
const handleChat = async () => {
try {
    const data = await startPrivateChat(project.vendor_id);
    const chatId = data.chat?.id ?? data.chatId;
    navigate(`/chat/${chatId}`, { state: { chatName: project.vendor_name } });
} catch (err) {
    console.error("Failed to start chat:", err.message);
}
};

  const handleInterest = async () => {
    setSubmitting(true);
    setInterestError("");
    try {
      await submitInterest(id, message);
      setSubmitted(true);
      setShowInterest(false);
      setMessage("");
    } catch (err) {
      setInterestError(err.message);
    } finally {
      setSubmitting(false);
    }
  };


  const handleDelete = async () => {
    try {
      await deleteProject(id);
      onDelete?.(id);
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
  };

  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES["open"];

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.dotRed} />
        <div style={s.dotYellow} />
        <div style={s.dotGreen} />
        <span style={s.cardTitle}>Project #{id}</span>
      </div>

      <div style={s.row}>
        <span style={s.label}>Title</span>
        <span style={s.value}>{title}</span>
      </div>

      <div style={s.row}>
        <span style={s.label}>Description</span>
        <span style={{ ...s.value, ...s.desc }}>{description}</span>
      </div>

      <div style={s.row}>
        <span style={s.label}>Budget</span>
        <span style={{ ...s.value, color: "#d4af6a", fontWeight: 700 }}>
          ${Number(budget).toLocaleString()}
        </span>
      </div>

      <div style={s.row}>
        <span style={s.label}>Status</span>
        <span style={{ ...s.pill, ...statusStyle }}>● {status}</span>
      </div>

      <div style={s.row}>
        <span style={s.label}>Created</span>
        <span style={s.value}>
          {created_at ? new Date(created_at).toLocaleDateString() : "—"}
        </span>
      </div>

      <div style={s.row}>
        <span style={s.label}>Completed at</span>
        <span style={{ ...s.value, color: completed_at ? "#7ed321" : "#ff4d4d", fontWeight: "600" }}>
          {completed_at ? new Date(completed_at).toLocaleDateString() : "Not Yet Completed"}
        </span>
      </div>
              {/* Interest + Chat Section */}
      {canInterest && (
        <div style={s.footer}>
          <div style={{ display: "flex", gap: 8, flexDirection: "column", width: "100%" }}>

            {/* Buttons row */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={s.chatBtn} onClick={handleChat}>💬 Chat</button>
              {submitted ? (
                <span style={s.submittedBadge}>✓ Interest Submitted</span>
              ) : (
                <button
                  style={s.interestBtn}
                  onClick={() => setShowInterest((v) => !v)}
                >
                  ★ I'm Interested
                </button>
              )}
            </div>

            {/* Expandable message box */}
            {showInterest && !submitted && (
              <div style={s.interestBox}>
                <textarea
                  style={s.textarea}
                  placeholder="Write a message to the vendor (optional)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
                {interestError && <p style={s.errorText}>{interestError}</p>}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                  <button onClick={() => setShowInterest(false)} style={s.cancelBtn}>Cancel</button>
                  <button onClick={handleInterest} disabled={submitting} style={s.confirmBtn}>
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {canDelete && (
        <div style={s.footer}>
          {!isConfirming ? (
            <button onClick={() => setIsConfirming(true)} style={s.deleteBtn}>
              Delete Project
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
      {/* Interest Section */}
      {canInterest && (
        <div style={s.interestSection}>
          <span style={s.interestLabel}>Interest:</span>
        </div>
      )}
    </div>
  );
}
const STATUS_STYLES = {
  open:       { color: "#4a9eff", background: "rgba(74,158,255,.1)" },
  in_progress:{ color: "#d4af6a", background: "rgba(212,175,106,.1)" },
  completed:  { color: "#7ed321", background: "rgba(126,211,33,.1)"  },
  cancelled:  { color: "#e05353", background: "rgba(224,83,83,.1)"   },
};

const s = {
    interestBtn:    { background: "transparent", border: "1px solid #d4af6a", color: "#d4af6a", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 },
    chatBtn:        { background: "transparent", border: "1px solid #4a9eff", color: "#4a9eff", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 },
    submittedBadge: { fontSize: 12, color: "#7ed321", border: "1px solid #7ed321", padding: "6px 12px", borderRadius: 6 },
    interestBox:    { background: "#1a2332", border: "1px solid #2a3748", borderRadius: 8, padding: 12 },
    textarea:       { width: "100%", background: "#121720", border: "1px solid #2a3748", borderRadius: 6, color: "#e8eaf0", padding: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box" },
    errorText:      { color: "#e05353", fontSize: 12, margin: "4px 0 0" },
  card: {
    background: "#121720",
    border: "1px solid #1e2736",
    borderRadius: 16,
    padding: 24,
  },
  cardHeader: {
    display: "flex", alignItems: "center", gap: 6, marginBottom: 20,
  },
  dotRed:    { width: 10, height: 10, borderRadius: "50%", background: "#e05353" },
  dotYellow: { width: 10, height: 10, borderRadius: "50%", background: "#f5a623" },
  dotGreen:  { width: 10, height: 10, borderRadius: "50%", background: "#7ed321" },
  cardTitle: { fontSize: 12, color: "#7a8499", marginLeft: 8, fontFamily: "monospace" },
  row: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "10px 0", borderBottom: "1px solid #1e2736",
  },
  label: { fontSize: 12, color: "#7a8499", textTransform: "uppercase", letterSpacing: ".06em", flexShrink: 0 },
  value: { fontSize: 14, fontWeight: 600, color: "#e8eaf0", textAlign: "right", maxWidth: "60%" },
  desc:  { fontWeight: 400, fontSize: 13, color: "#a0a8b8", whiteSpace: "pre-wrap" },
  pill:  { fontSize: 12, padding: "3px 10px", borderRadius: 100 },
  footer:       { marginTop: 20, display: "flex", justifyContent: "flex-end" },
  deleteBtn:    { background: "transparent", border: "1px solid #e05353", color: "#e05353", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  confirmGroup: { display: "flex", alignItems: "center", gap: 10 },
  confirmText:  { fontSize: 12, color: "#e05353", fontWeight: "bold" },
  confirmBtn:   { background: "#e05353", border: "none", color: "white", padding: "4px 10px", borderRadius: 4, cursor: "pointer" },
  cancelBtn:    { background: "#1e2736", border: "none", color: "#e8eaf0", padding: "4px 10px", borderRadius: 4, cursor: "pointer" },
};