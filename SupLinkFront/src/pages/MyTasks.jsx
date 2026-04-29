import { useState, useEffect } from "react";
import Navbar from "../Components/NavBar";
import { useAuth } from "../context/AuthContext";
import {
  getMySupplyChainTasks,
  updateTaskStatus,
  getProjectSupplyChainOverview,
} from "../api/supplyChain";

/* ─── Color Palette ───────────────────────────────────────────── */
const C = {
  bg: "#0b0e14",
  surface: "#121720",
  border: "#1e2736",
  text: "#e8eaf0",
  muted: "#7a8499",
  accent: "#d4af6a",
  blue: "#3b7dd8",
  green: "#7ed321",
  error: "#e05353",
};

const STATUS_COLORS = {
  pending: { bg: "rgba(122,132,153,0.15)", color: "#7a8499", dot: "#7a8499" },
  in_progress: { bg: "rgba(212,175,106,0.15)", color: "#d4af6a", dot: "#d4af6a" },
  completed: { bg: "rgba(126,211,33,0.15)", color: "#7ed321", dot: "#7ed321" },
};

export default function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState(null);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [noteUpdates, setNoteUpdates] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await getMySupplyChainTasks();
      setTasks(data);
      // Initialize status map
      const statusMap = {};
      const noteMap = {};
      data.forEach((task) => {
        statusMap[task.id] = task.status || "pending";
        noteMap[task.id] = task.note || "";
      });
      setStatusUpdates(statusMap);
      setNoteUpdates(noteMap);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId) => {
    try {
      await updateTaskStatus(taskId, statusUpdates[taskId], noteUpdates[taskId]);
      setMessage({ type: "success", text: "Task status updated successfully" });
      fetchTasks();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleViewProjectOverview = async (projectId) => {
    try {
      const data = await getProjectSupplyChainOverview(projectId);
      setExpandedTask({ projectId, overview: data });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <>
      <Navbar />

      {/* ── Header ── */}
      <section style={s.headerWrap}>
        <div style={s.headerBg}>
          <div style={s.gridLines} />
          <div style={s.headerGlow} />
        </div>
        <div style={s.headerInner}>
          <div style={s.headerContent}>
            <div style={s.heroBadge}>
              <span style={s.badgeDot} /> Supplier Portal
            </div>
            <h1 style={s.headerH1}>
              My <span style={s.headerAccent}>Tasks</span>
            </h1>
            <p style={s.headerSub}>
              View and update tasks assigned to you by vendors
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section style={s.stats}>
        <div style={s.statItem}>
          <div style={{ ...s.statValue, color: C.text }}>{stats.total}</div>
          <div style={s.statLabel}>Total Tasks</div>
        </div>
        <div style={{ ...s.statItem, borderLeft: `3px solid ${STATUS_COLORS.pending.dot}` }}>
          <div style={{ ...s.statValue, color: STATUS_COLORS.pending.color }}>{stats.pending}</div>
          <div style={s.statLabel}>Pending</div>
        </div>
        <div style={{ ...s.statItem, borderLeft: `3px solid ${STATUS_COLORS.in_progress.dot}` }}>
          <div style={{ ...s.statValue, color: STATUS_COLORS.in_progress.color }}>{stats.inProgress}</div>
          <div style={s.statLabel}>In Progress</div>
        </div>
        <div style={{ ...s.statItem, borderLeft: `3px solid ${STATUS_COLORS.completed.dot}` }}>
          <div style={{ ...s.statValue, color: STATUS_COLORS.completed.color }}>{stats.completed}</div>
          <div style={s.statLabel}>Completed</div>
        </div>
      </section>

      {/* ── Alerts ── */}
      {message.text && (
        <div style={s.alertSection}>
          {message.type === "error" ? (
            <div style={s.alertError}>{message.text}</div>
          ) : (
            <div style={s.alertSuccess}>{message.text}</div>
          )}
        </div>
      )}

      {/* ── Tasks List ── */}
      <section style={s.gridSection}>
        {loading ? (
          <div style={s.loadingState}>Loading your tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>📋</div>
            <h3 style={s.emptyTitle}>No tasks assigned</h3>
            <p style={s.emptyDesc}>
              When vendors assign tasks to you, they will appear here
            </p>
          </div>
        ) : (
          <div style={s.tasksList}>
            {tasks.map((task, i) => (
              <div key={task.id} style={{ ...s.taskCard, animationDelay: `${i * 0.05}s` }}>
                <div style={s.taskHeader}>
                  <div style={s.taskLeft}>
                    <div style={s.taskProject}>{task.project_title || "Project"}</div>
                    <h3 style={s.taskTitle}>{task.task_name}</h3>
                  </div>
                  <div style={{ ...s.taskStatusBadge, background: STATUS_COLORS[task.status]?.bg, color: STATUS_COLORS[task.status]?.color }}>
                    ● {task.status || "pending"}
                  </div>
                </div>

                <div style={s.taskGrid}>
                  <div style={s.taskInfo}>
                    <div style={s.infoLabel}>Order</div>
                    <div style={s.infoValue}>#{task.task_order}</div>
                  </div>
                  <div style={s.taskInfo}>
                    <div style={s.infoLabel}>Assigned</div>
                    <div style={s.infoValue}>{new Date(task.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={s.taskInfo}>
                    <div style={s.infoLabel}>Updated</div>
                    <div style={s.infoValue}>{new Date(task.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>

                {task.note && (
                  <div style={s.taskNote}>
                    <span style={s.noteLabel}>Note:</span> {task.note}
                  </div>
                )}

                <div style={s.taskActions}>
                  <div style={s.actionRow}>
                    <select
                      value={statusUpdates[task.id] || task.status || "pending"}
                      onChange={(e) => setStatusUpdates({ ...statusUpdates, [task.id]: e.target.value })}
                      style={s.statusSelect}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      style={s.updateBtn}
                      onClick={() => handleStatusUpdate(task.id)}
                    >
                      Update Status
                    </button>
                  </div>
                  <button
                    style={s.overviewBtn}
                    onClick={() => handleViewProjectOverview(task.project_id)}
                  >
                    📊 View Project Overview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Project Overview Modal ── */}
      {expandedTask && expandedTask.overview && (
        <div style={s.modalOverlay} onClick={() => setExpandedTask(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Project Overview</h2>
              <button style={s.closeBtn} onClick={() => setExpandedTask(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.overviewList}>
                {expandedTask.overview.map((t, i) => (
                  <div key={t.id} style={s.overviewItem}>
                    <div style={s.overviewOrder}>#{t.task_order}</div>
                    <div style={s.overviewContent}>
                      <div style={s.overviewTaskName}>{t.task_name}</div>
                      <div style={s.overviewSupplier}>{t.supplier_username || `Supplier ${t.supplier_id}`}</div>
                    </div>
                    <div style={{ ...s.overviewStatus, background: STATUS_COLORS[t.status]?.bg, color: STATUS_COLORS[t.status]?.color }}>
                      {t.status || "pending"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const s = {
  headerWrap: { position: "relative", paddingTop: 80 },
  headerBg: { position: "absolute", inset: 0, zIndex: -1, overflow: "hidden" },
  gridLines: { position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: "60px 60px", opacity: 0.3 },
  headerGlow: { position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 700, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,106,.12) 0%, transparent 70%)" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "100px 24px 60px" },
  headerContent: { textAlign: "center" },
  heroBadge: { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,175,106,.1)", border: `1px solid rgba(212,175,106,.3)`, color: C.accent, padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 28 },
  badgeDot: { width: 6, height: 6, borderRadius: "50%", background: C.accent },
  headerH1: { fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", margin: "0 0 16px" },
  headerAccent: { color: C.accent },
  headerSub: { fontSize: 16, color: C.muted, lineHeight: 1.6, maxWidth: 480, margin: "0 auto" },

  stats: { display: "flex", justifyContent: "center", background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "24px", gap: 24, flexWrap: "wrap" },
  statItem: { flex: "1 1 120px", textAlign: "center", background: C.bg, border: `1px solid ${C.border}`, padding: "20px 16px", borderRadius: 12 },
  statValue: { fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em" },
  statLabel: { fontSize: 11, color: C.muted, marginTop: 6, textTransform: "uppercase", letterSpacing: ".08em" },

  alertSection: { maxWidth: 1200, margin: "0 auto", padding: "16px 24px 0" },
  alertError: { background: `rgba(224,83,83,0.1)`, border: `1px solid ${C.error}`, color: C.error, padding: "12px 16px", borderRadius: 10, fontSize: 14 },
  alertSuccess: { background: `rgba(126,211,33,0.1)`, border: `1px solid ${C.green}`, color: C.green, padding: "12px 16px", borderRadius: 10, fontSize: 14 },

  gridSection: { maxWidth: 1200, margin: "0 auto", padding: "60px 24px" },
  loadingState: { textAlign: "center", color: C.muted, padding: "60px 24px", fontSize: 16 },
  emptyState: { textAlign: "center", padding: "80px 24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16 },
  emptyIcon: { fontSize: 56, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 12 },
  emptyDesc: { fontSize: 15, color: C.muted, maxWidth: 420, margin: "0 auto" },

  tasksList: { display: "grid", gap: 16 },
  taskCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, animation: "fadeIn 0.4s ease forwards", opacity: 1 },
  taskHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  taskLeft: { flex: 1 },
  taskProject: { fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 },
  taskTitle: { fontSize: 18, fontWeight: 700, color: C.text },
  taskStatusBadge: { fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 100, textTransform: "uppercase", letterSpacing: ".05em" },

  taskGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: "16px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, marginBottom: 16 },
  taskInfo: { textAlign: "center" },
  infoLabel: { fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 },
  infoValue: { fontSize: 14, fontWeight: 700, color: C.text },

  taskNote: { fontSize: 13, color: C.muted, background: `rgba(212,175,106,0.05)`, border: `1px solid rgba(212,175,106,0.2)`, padding: "12px 16px", borderRadius: 10, marginBottom: 16 },
  noteLabel: { fontWeight: 600, color: C.accent, marginRight: 6 },

  taskActions: { display: "flex", flexDirection: "column", gap: 12 },
  actionRow: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  statusSelect: { flex: 1, minWidth: 150, padding: "10px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", cursor: "pointer" },
  updateBtn: { background: C.accent, color: "#0b0e14", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background .2s" },
  overviewBtn: { background: "transparent", border: `1px solid ${C.blue}`, color: C.blue, padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s", textAlign: "center" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  modal: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", maxHeight: "80vh", overflow: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", borderBottom: `1px solid ${C.border}` },
  modalTitle: { fontSize: 20, fontWeight: 700, color: C.text },
  closeBtn: { background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer", padding: 4 },
  modalBody: { padding: 24 },
  overviewList: { display: "flex", flexDirection: "column", gap: 12 },
  overviewItem: { display: "flex", alignItems: "center", gap: 16, padding: "16px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12 },
  overviewOrder: { fontSize: 20, fontWeight: 800, color: C.accent, minWidth: 40 },
  overviewContent: { flex: 1 },
  overviewTaskName: { fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 },
  overviewSupplier: { fontSize: 13, color: C.muted },
  overviewStatus: { fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, textTransform: "uppercase", letterSpacing: ".05em" },
};
