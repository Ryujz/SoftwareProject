import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Components/NavBar";
import { useAuth } from "../context/AuthContext";
import {
  getProjectSupplyChainTasks,
  createSupplyChainTask,
  updateSupplyChainTask,
} from "../api/supplyChain";
import { getAllPortfolios } from "../api/supplier";

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
  pending: "#7a8499",
  in_progress: "#d4af6a",
  completed: "#7ed321",
};

export default function SupplyChainManagement() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: "",
    task_name: "",
    task_order: "",
    note: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTasks = async () => {
    try {
      const data = await getProjectSupplyChainTasks(projectId);
      console.log("tasks data:", data);
      setTasks(data);
    } catch (err) {
      console.log("tasks data:", data);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await getAllPortfolios();
      // Extract unique suppliers from portfolios
      const supplierMap = new Map();
      (res.portfolios || []).forEach((p) => {
        if (p.supplier_id && !supplierMap.has(p.supplier_id)) {
          supplierMap.set(p.supplier_id, {
            id: p.supplier_id,
            name: p.company_name || "Unknown Supplier",
          });
        }
      });
      setSuppliers(Array.from(supplierMap.values()));
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchSuppliers();
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingTask) {
        await updateSupplyChainTask(editingTask.id, {
          supplier_id: Number(formData.supplier_id),
          task_name: formData.task_name,
          task_order: Number(formData.task_order),
          note: formData.note,
        });
        setSuccess("Task updated successfully");
      } else {
        await createSupplyChainTask(projectId, {
          supplier_id: Number(formData.supplier_id),
          task_name: formData.task_name,
          task_order: Number(formData.task_order),
          note: formData.note,
        });
        setSuccess("Task created successfully");
      }
      setShowModal(false);
      setFormData({ supplier_id: "", task_name: "", task_order: "", note: "" });
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      supplier_id: String(task.supplier_id),
      task_name: task.task_name,
      task_order: String(task.task_order),
      note: task.note || "",
    });
    setShowModal(true);
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
              <span style={s.badgeDot} /> Supply Chain
            </div>
            <h1 style={s.headerH1}>
              Project <span style={s.headerAccent}>Tasks</span>
            </h1>
            <p style={s.headerSub}>
              Manage and track supplier tasks for your project
            </p>
          </div>
        </div>
      </section>

      {/* ── Action Bar ── */}
      <section style={s.actionBar}>
        <div style={s.actionInner}>
          <div style={s.actionLeft}>
            <h2 style={s.actionTitle}>Supply Chain Tasks</h2>
            <p style={s.actionSub}>
              {loading ? "Loading..." : `${tasks.length} task${tasks.length !== 1 ? "s" : ""} assigned`}
            </p>
          </div>
          <button style={s.createBtn} onClick={() => { setEditingTask(null); setFormData({ supplier_id: "", task_name: "", task_order: "", note: "" }); setShowModal(true); }}>
            <span style={s.createBtnIcon}>+</span> Add Task
          </button>
        </div>
      </section>

      {/* ── Alerts ── */}
      {(error || success) && (
        <div style={s.alertSection}>
          {error && <div style={s.alertError}>{error}</div>}
          {success && <div style={s.alertSuccess}>{success}</div>}
        </div>
      )}

      {/* ── Tasks List ── */}
      <section style={s.gridSection}>
        {loading ? (
          <div style={s.loadingState}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>📋</div>
            <h3 style={s.emptyTitle}>No tasks assigned</h3>
            <p style={s.emptyDesc}>
              Start by assigning tasks to suppliers for this project
            </p>
            <button style={s.emptyBtn} onClick={() => setShowModal(true)}>
              <span style={s.emptyBtnIcon}>+</span> Create First Task
            </button>
          </div>
        ) : (
          <div style={s.tasksList}>
            {tasks.map((task, i) => (
              <div key={task.id} style={{ ...s.taskCard, animationDelay: `${i * 0.05}s` }}>
                <div style={s.taskHeader}>
                  <div style={s.taskOrder}>#{task.task_order}</div>
                  <div style={{ ...s.taskStatusBadge, background: `rgba(${hexToRgb(STATUS_COLORS[task.status] || C.muted)}, 0.15)`, color: STATUS_COLORS[task.status] || C.muted }}>
                    ● {task.status || "pending"}
                  </div>
                </div>
                <h3 style={s.taskTitle}>{task.task_name}</h3>
                <div style={s.taskRow}>
                  <span style={s.taskLabel}>Supplier:</span>
                  <span style={s.taskValue}>{task.supplier_username || `ID: ${task.supplier_id}`}</span>
                </div>
                {task.note && (
                  <div style={s.taskRow}>
                    <span style={s.taskLabel}>Note:</span>
                    <span style={s.taskNote}>{task.note}</span>
                  </div>
                )}
                <div style={s.taskRow}>
                  <span style={s.taskLabel}>Updated:</span>
                  <span style={s.taskValue}>{new Date(task.updated_at).toLocaleDateString()}</span>
                </div>
                <div style={s.taskActions}>
                  <button style={s.editBtn} onClick={() => handleEdit(task)}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Modal ── */}
      {showModal && (
        <div style={s.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{editingTask ? "Edit Task" : "Create New Task"}</h2>
              <button style={s.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={s.modalForm}>
              <div style={s.formField}>
                <label style={s.formLabel}>Task Name</label>
                <input
                  type="text"
                  required
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                  placeholder="e.g., Design Phase, Manufacturing, Delivery"
                  style={s.formInput}
                />
              </div>
              <div style={s.formRow}>
                <div style={s.formField}>
                  <label style={s.formLabel}>Supplier</label>
                  <select
                    required
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    style={s.formInput}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div style={s.formField}>
                  <label style={s.formLabel}>Order</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.task_order}
                    onChange={(e) => setFormData({ ...formData, task_order: e.target.value })}
                    placeholder="1, 2, 3..."
                    style={s.formInput}
                  />
                </div>
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>Note (Optional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Additional instructions for the supplier..."
                  rows={3}
                  style={s.formTextarea}
                />
              </div>
              <div style={s.modalActions}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={s.submitBtn}>
                  {editingTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "122, 132, 153";
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

  actionBar: { background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` },
  actionInner: { maxWidth: 1200, margin: "0 auto", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 },
  actionLeft: { flex: "1 1 300px" },
  actionTitle: { fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 },
  actionSub: { fontSize: 14, color: C.muted },
  createBtn: { display: "inline-flex", alignItems: "center", gap: 8, background: C.accent, color: "#0b0e14", border: "none", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background .2s" },
  createBtnIcon: { fontSize: 18, lineHeight: 1 },

  alertSection: { maxWidth: 1200, margin: "0 auto", padding: "16px 24px 0" },
  alertError: { background: `rgba(224,83,83,0.1)`, border: `1px solid ${C.error}`, color: C.error, padding: "12px 16px", borderRadius: 10, fontSize: 14 },
  alertSuccess: { background: `rgba(126,211,33,0.1)`, border: `1px solid ${C.green}`, color: C.green, padding: "12px 16px", borderRadius: 10, fontSize: 14 },

  gridSection: { maxWidth: 1200, margin: "0 auto", padding: "60px 24px" },
  loadingState: { textAlign: "center", color: C.muted, padding: "60px 24px", fontSize: 16 },
  emptyState: { textAlign: "center", padding: "80px 24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16 },
  emptyIcon: { fontSize: 56, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 12 },
  emptyDesc: { fontSize: 15, color: C.muted, maxWidth: 420, margin: "0 auto 24px" },
  emptyBtn: { display: "inline-flex", alignItems: "center", gap: 10, background: C.accent, color: "#0b0e14", border: "none", padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "background .2s" },
  emptyBtnIcon: { fontSize: 20, lineHeight: 1 },

  tasksList: { display: "grid", gap: 16 },
  taskCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 },
  taskHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  taskOrder: { fontSize: 24, fontWeight: 800, color: C.accent },
  taskStatusBadge: { fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 100, textTransform: "uppercase", letterSpacing: ".05em" },
  taskTitle: { fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 },
  taskRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14 },
  taskLabel: { fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em" },
  taskValue: { fontSize: 14, fontWeight: 600, color: C.text },
  taskNote: { fontSize: 13, color: C.muted, maxWidth: "60%", textAlign: "right" },
  taskActions: { display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 8 },
  editBtn: { background: "transparent", border: `1px solid ${C.accent}`, color: C.accent, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  modal: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", maxHeight: "90vh", overflow: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", borderBottom: `1px solid ${C.border}` },
  modalTitle: { fontSize: 20, fontWeight: 700, color: C.text },
  closeBtn: { background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer", padding: 4 },
  modalForm: { padding: 24 },
  formField: { marginBottom: 20 },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  formLabel: { display: "block", fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 },
  formInput: { width: "100%", padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", fontFamily: "inherit", transition: "border-color .2s" },
  formTextarea: { width: "100%", padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", fontFamily: "inherit", resize: "vertical", transition: "border-color .2s" },
  modalActions: { display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 },
  cancelBtn: { background: "transparent", border: `1px solid ${C.border}`, color: C.muted, padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  submitBtn: { background: C.accent, color: "#0b0e14", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" },
};
