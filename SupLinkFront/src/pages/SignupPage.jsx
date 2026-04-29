import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ─── Color Palette ───────────────────────────────────────────── */
const C = {
  bg: "#0b0e14",
  surface: "#121720",
  border: "#1e2736",
  text: "#e8eaf0",
  muted: "#7a8499",
  accent: "#d4af6a",
  accentDark: "#a07c3a",
  error: "#e05353",
  blue: "#3b7dd8",
};

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    role: "vendor"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm)
      return setError("Passwords do not match");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters");
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Background Effects */}
      <div style={s.bgGradient} />
      <div style={s.gridLines} />
      <div style={s.glowLeft} />
      <div style={s.glowRight} />

      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.logoMark}>⬡</div>
          <h1 style={s.title}>Create Account</h1>
          <p style={s.subtitle}>Join thousands of professionals on SupplyLink+</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={s.error}>
            <span style={s.errorIcon}>!</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Username</label>
            <input
              name="username"
              type="text"
              required
              value={form.username}
              onChange={handleChange}
              placeholder="Choose a username"
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Confirm Password</label>
            <input
              name="confirm"
              type="password"
              required
              value={form.confirm}
              onChange={handleChange}
              placeholder="Re-enter password"
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Account Type</label>
            <div style={s.roleSelector}>
              <button
                type="button"
                style={{ ...s.roleBtn, ...(form.role === "vendor" ? s.roleBtnActive : {}) }}
                onClick={() => setForm((f) => ({ ...f, role: "vendor" }))}
              >
                <span style={s.roleIcon}>🏪</span>
                <span style={s.roleLabel}>Vendor</span>
                <span style={s.roleDesc}>Post projects & hire</span>
              </button>
              <button
                type="button"
                style={{ ...s.roleBtn, ...(form.role === "supplier" ? s.roleBtnActive : {}) }}
                onClick={() => setForm((f) => ({ ...f, role: "supplier" }))}
              >
                <span style={s.roleIcon}>📦</span>
                <span style={s.roleLabel}>Supplier</span>
                <span style={s.roleDesc}>Showcase & bid</span>
              </button>
            </div>
          </div>

          <button type="submit" style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }} disabled={loading}>
            {loading ? (
              <span style={s.btnContent}>
                <span style={s.spinner} /> Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <p style={s.footer}>
          Already have an account?{" "}
          <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const s = {
  page: {
    minheight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: C.bg,
    position: "relative",
    overflow: "hidden",
    padding: "24px",
  },
  bgGradient: {
    position: "absolute",
    inset: 0,
    background: `linear-gradient(180deg, ${C.bg} 0%, #0f1218 100%)`,
    zIndex: -3,
  },
  gridLines: {
    position: "absolute",
    inset: 0,
    backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
    backgroundSize: "60px 60px",
    opacity: 0.3,
    zIndex: -2,
  },
  glowLeft: {
    position: "absolute",
    top: "-20%",
    left: "-10%",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: `radial-gradient(circle, rgba(212,175,106,.08) 0%, transparent 70%)`,
    zIndex: -1,
  },
  glowRight: {
    position: "absolute",
    bottom: "-20%",
    right: "-10%",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: `radial-gradient(circle, rgba(59,125,216,.06) 0%, transparent 70%)`,
    zIndex: -1,
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    padding: "48px 40px",
    borderRadius: 20,
    width: "100%",
    maxWidth: 460,
    boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
    position: "relative",
    zIndex: 1,
  },
  header: { textAlign: "center", marginBottom: 32 },
  logoMark: {
    fontSize: 32,
    color: C.accent,
    marginBottom: 16,
    display: "block",
  },
  title: {
    fontSize: "clamp(24px, 3vw, 28px)",
    fontWeight: 800,
    color: C.text,
    marginBottom: 8,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: 14,
    color: C.muted,
    lineHeight: 1.5,
  },
  error: {
    background: `rgba(224,83,83,0.1)`,
    border: `1px solid ${C.error}`,
    color: C.error,
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  errorIcon: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: C.error,
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: ".06em",
  },
  input: {
    padding: "14px 16px",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    fontSize: 15,
    color: C.text,
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
    fontFamily: "inherit",
  },
  roleSelector: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  roleBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "16px 12px",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    cursor: "pointer",
    transition: "all .2s",
    textAlign: "center",
  },
  roleBtnActive: {
    borderColor: C.accent,
    background: `rgba(212,175,106,0.08)`,
    boxShadow: `0 0 0 1px ${C.accent}`,
  },
  roleIcon: { fontSize: 24 },
  roleLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: C.text,
  },
  roleDesc: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  btn: {
    marginTop: 8,
    padding: "14px 24px",
    background: C.accent,
    color: "#0b0e14",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background .2s, transform .1s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    background: C.border,
    color: C.muted,
    cursor: "not-allowed",
  },
  btnContent: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  spinner: {
    width: 16,
    height: 16,
    border: `2px solid rgba(11,14,20,0.3)`,
    borderTopColor: "#0b0e14",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  footer: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 14,
    color: C.muted,
  },
  link: {
    color: C.accent,
    fontWeight: 600,
    textDecoration: "none",
    transition: "opacity .2s",
  },
};
