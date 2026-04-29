import { useState, useRef } from "react";
import Navbar from "../Components/Navbar";

/* ─── Mock user data (swap with real API / context) ───────────── */
const INITIAL_USER = {
  name: "Somchai Wiratchai",
  username: "somchai.w",
  email: "somchai@company.co.th",
  phone: "+66 81 234 5678",
  company: "Wiratchai Trading Co., Ltd.",
  role: "buyer",          // "buyer" | "supplier"
  location: "Bangkok, Thailand",
  bio: "Industrial procurement specialist with 8+ years sourcing MRO supplies and packaging materials across Southeast Asia.",
  verified: true,
  memberSince: "March 2023",
  avatar: null,           // null = initials fallback
  stats: { orders: 142, spend: "฿4.2M", suppliers: 38, rating: 4.9 },
};

// const NAV_LINKS = ["Marketplace", "My Orders", "Messages", "Analytics"];

/* ─── Helpers ─────────────────────────────────────────────────── */
function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

/* ─── Sub-components ──────────────────────────────────────────── */
function Avatar({ user, size = 88, editable = false, onUpload }) {
  const inputRef = useRef();
  return (
    <div
      className="avatar-root"
      style={{ ...s.avatarRoot, width: size, height: size, fontSize: size * 0.33 }}
      onClick={() => editable && inputRef.current?.click()}
    >
      {user.avatar
        ? <img src={user.avatar} alt={user.name} style={s.avatarImg} />
        : <span>{initials(user.name)}</span>
      }
      {editable && (
        <>
          <div className="avatar-overlay" style={s.avatarOverlay}>
            <span style={{ fontSize: 18 }}>⬆</span>
            <span style={{ fontSize: 10, marginTop: 2 }}>Change</span>
          </div>
          <input
            ref={inputRef} type="file" accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files[0]; if (f && onUpload) onUpload(f); }}
          />
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={s.statCard}>
      <span style={s.statValue}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  );
}

function Field({ label, name, value, type = "text", onChange, hint, children }) {
  return (
    <div style={s.field}>
      <label style={s.fieldLabel}>{label}</label>
      {children ?? (
        <input type={type} name={name} value={value} onChange={onChange}
          style={s.fieldInput} autoComplete="off" />
      )}
      {hint && <span style={s.fieldHint}>{hint}</span>}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoIcon}>{icon}</span>
      <div>
        <div style={s.infoLabel}>{label}</div>
        <div style={s.infoValue}>{value}</div>
      </div>
    </div>
  );
}

function SettingsSection({ title, children, danger }) {
  return (
    <div style={{ ...s.card, ...(danger ? { borderColor: "rgba(224,83,83,.28)" } : {}) }}>
      <div style={s.cardHeader}>
        <span style={{ ...s.cardTitle, ...(danger ? { color: "#e05353" } : {}) }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, defaultOn = true }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={s.toggleRow}>
      <div>
        <div style={s.toggleLabel}>{label}</div>
        <div style={s.toggleDesc}>{desc}</div>
      </div>
      <button
        style={{ ...s.toggle, background: on ? C.accent : C.border }}
        onClick={() => setOn((v) => !v)}
      >
        <span style={{ ...s.toggleThumb, transform: on ? "translateX(18px)" : "translateX(2px)" }} />
      </button>
    </div>
  );
}

function SaveToast({ show }) {
  return (
    <div style={{ ...s.toast, opacity: show ? 1 : 0, transform: show ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(10px)" }}>
      ✓ Changes saved
    </div>
  );
}

function logout() {
  // localStorage.removeItem("token");
  localStorage.removeItem("user");
  // optionally clear user state
  window.location.href = "/";
  setUser(null);
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const [user, setUser]               = useState(INITIAL_USER);
  const [draft, setDraft]             = useState(INITIAL_USER);
  const [activeTab, setActiveTab]     = useState("profile");
  const [editing, setEditing]         = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  }

  function handleSave() {
    setUser(draft);
    setEditing(false);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }

  function handleCancel() {
    setDraft(user);
    setEditing(false);
  }

  function handleAvatarUpload(file) {
    const url = URL.createObjectURL(file);
    setDraft((d) => ({ ...d, avatar: url }));
  }

  const display = editing ? draft : user;

  return (
    <>
    <Navbar />
    <div style={s.root}>
      <style>{CSS}</style>
      <SaveToast show={toastVisible} />

      {/* ── Cover banner ── */}
      <div style={s.cover}>
        <div style={s.coverBg} />
        <div style={s.coverGlow} />
      </div>

      <main style={s.main}>

        {/* ── Identity strip ── */}
        <div style={s.identityStrip}>
          <div style={s.identityLeft}>
            <Avatar user={display} size={88} editable={editing} onUpload={handleAvatarUpload} />
            <div style={s.identityText}>
              <div style={s.identityName}>
                {display.name}
                {display.verified && (
                  <span style={s.verifiedPill}>✦ Verified</span>
                )}
              </div>
              <div style={s.identityMeta}>@{display.username} · {display.company}</div>
              <div style={s.identityMeta}>📍 {display.location} · Member since {display.memberSince}</div>
            </div>
          </div>
          <div style={s.identityRight}>
            <span style={{ ...s.rolePill, ...(display.role === "buyer" ? s.roleBuyer : s.roleSupplier) }}>
              {display.role === "buyer" ? "◈ Buyer" : "⬡ Supplier"}
            </span>
            {!editing && (
              <button style={s.btnEdit} onClick={() => { setEditing(true); setActiveTab("profile"); }}>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={s.statsRow}>
          <StatCard label="Orders"         value={user.stats.orders} />
          <StatCard label="Total Spend"    value={user.stats.spend} />
          <StatCard label="Suppliers Used" value={user.stats.suppliers} />
          <StatCard label="Buyer Rating"   value={`${user.stats.rating} ★`} />
        </div>

        {/* ── Tabs ── */}
        <div style={s.tabBar}>
          {[["profile", "Profile"], ["settings", "Account Settings"]].map(([id, label]) => (
            <button
              key={id}
              style={{ ...s.tab, ...(activeTab === id ? s.tabActive : {}) }}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
        {activeTab === "profile" && (
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>About</span>
            </div>

            {editing ? (
              <div style={s.formGrid}>
                <Field label="Full Name"    name="name"     value={draft.name}     onChange={handleChange} />
                <Field label="Username"     name="username" value={draft.username} onChange={handleChange} hint="supplylink.co.th/@username" />
                <Field label="Company"      name="company"  value={draft.company}  onChange={handleChange} />
                <Field label="Location"     name="location" value={draft.location} onChange={handleChange} />
                <Field label="Account Type" name="role"     value={draft.role}     onChange={handleChange}>
                  <select name="role" value={draft.role} onChange={handleChange} style={s.fieldInput}>
                    <option value="buyer">Buyer</option>
                    <option value="supplier">Supplier</option>
                  </select>
                </Field>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Bio" name="bio" value={draft.bio} onChange={handleChange}>
                    <textarea name="bio" value={draft.bio} onChange={handleChange}
                      rows={3} style={{ ...s.fieldInput, resize: "vertical", lineHeight: 1.65 }} />
                  </Field>
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, marginTop: 4 }}>
                  <button style={s.btnSave}   onClick={handleSave}>Save Changes</button>
                  <button style={s.btnCancel} onClick={handleCancel}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <p style={s.bioText}>
                  {user.bio || <span style={{ color: C.muted, fontStyle: "italic" }}>No bio yet.</span>}
                </p>
                <div style={s.infoGrid}>
                  <InfoRow icon="✉"  label="Email"    value={user.email} />
                  <InfoRow icon="☎"  label="Phone"    value={user.phone} />
                  <InfoRow icon="🏢" label="Company"  value={user.company} />
                  <InfoRow icon="📍" label="Location" value={user.location} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Settings tab ── */}
        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <SettingsSection title="Contact Information">
              <div style={s.formGrid}>
                <Field label="Email Address" name="email" type="email" value={draft.email} onChange={handleChange} />
                <Field label="Phone Number"  name="phone" type="tel"   value={draft.phone} onChange={handleChange} />
              </div>
            </SettingsSection>

            <SettingsSection title="Identity Verification">
              <div style={s.verifyRow}>
                <div>
                  <div style={s.verifyLabel}>ThaiID Verification</div>
                  <div style={s.verifyDesc}>Your national ID has been verified. This badge builds trust with suppliers and buyers.</div>
                </div>
                <span style={s.verifyPill}>✦ Verified</span>
              </div>
            </SettingsSection>

            <SettingsSection title="Notifications">
              <ToggleRow label="Order updates"          desc="Status changes on your purchase orders"  defaultOn={true}  />
              <ToggleRow label="New messages"           desc="Chat messages from suppliers"             defaultOn={true}  />
              <ToggleRow label="Price alerts"           desc="When tracked items change price"          defaultOn={false} />
              <ToggleRow label="Platform announcements" desc="Product updates and platform news"        defaultOn={true}  />
            </SettingsSection>

            <SettingsSection title="Danger Zone" danger>
              <div style={s.dangerRow}>
                <div>
                  <div style={s.dangerLabel}>Deactivate Account</div>
                  <div style={s.dangerDesc}>Temporarily disable your account. You can reactivate anytime.</div>
                </div>
                <button style={s.btnDanger}>Deactivate</button>
              </div>
              <div style={s.dangerRow}>
                <div>
                  <div style={s.dangerLabel}>Logout</div>
                  <div style={s.dangerDesc}>Sign out of your account on this device.</div>
                </div>
                <button style={s.btnDanger} onClick={logout}>
                  Logout
                </button>
              </div>
            </SettingsSection>

            <div style={{ display: "flex", gap: 12 }}>
              <button style={s.btnSave}   onClick={handleSave}>Save Settings</button>
              <button style={s.btnCancel} onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        )}

      </main>
    </div>
    </>
  );
}

/* ─── Tokens ──────────────────────────────────────────────────── */
const C = {
  bg:         "#0b0e14",
  surface:    "#121720",
  surface2:   "#161d2b",
  border:     "#1e2736",
  text:       "#e8eaf0",
  muted:      "#7a8499",
  accent:     "#d4af6a",
  accentDark: "#a07c3a",
  blue:       "#3b7dd8",
};

const s = {
  root: { background: C.bg, color: C.text, fontFamily: "'Sora', sans-serif", minHeight: "100vh" },

  // Cover
  cover: { height: 190, position: "relative", overflow: "hidden", marginTop: 68 },
  coverBg: {
    position: "absolute", inset: 0,
    background: `linear-gradient(135deg, #0f1520 0%, #161d2b 100%)`,
    backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
  },
  coverGlow: {
    position: "absolute", top: -100, left: "35%",
    width: 550, height: 340, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(212,175,106,.14) 0%, transparent 68%)",
  },

  // Main layout
  main: { maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" },

  // Identity strip
  identityStrip: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-end", flexWrap: "wrap", gap: 16,
    marginTop: -44, marginBottom: 24, position: "relative", zIndex: 2,
  },
  identityLeft:  { display: "flex", alignItems: "flex-end", gap: 18 },
  identityRight: { display: "flex", alignItems: "center", gap: 12, paddingBottom: 2 },
  identityText:  { paddingBottom: 4 },
  identityName:  { fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  verifiedPill:  { fontSize: 11, fontWeight: 700, color: C.accent, background: "rgba(212,175,106,.12)", border: `1px solid rgba(212,175,106,.3)`, padding: "3px 10px", borderRadius: 100, letterSpacing: ".04em" },
  identityMeta:  { fontSize: 12, color: C.muted, marginTop: 4 },
  rolePill:      { fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100, border: "1px solid", letterSpacing: ".06em", textTransform: "uppercase" },
  roleBuyer:     { color: C.blue, borderColor: C.blue, background: "rgba(59,125,216,.12)" },
  roleSupplier:  { color: C.accent, borderColor: C.accent, background: "rgba(212,175,106,.1)" },

  // Avatar
  avatarRoot: {
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${C.accentDark}, ${C.accent})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, color: "#0b0e14",
    border: `3px solid ${C.bg}`,
    position: "relative", overflow: "hidden",
    flexShrink: 0,
  },
  avatarImg:     { width: "100%", height: "100%", objectFit: "cover" },
  avatarOverlay: {
    position: "absolute", inset: 0,
    background: "rgba(0,0,0,.65)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    opacity: 0, transition: "opacity .2s",
    cursor: "pointer", color: "#fff", fontSize: 11,
  },

  // Stats
  statsRow:  { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 },
  statCard:  { background: C.surface, padding: "20px 0", textAlign: "center" },
  statValue: { display: "block", fontSize: 22, fontWeight: 800, color: C.accent, letterSpacing: "-0.02em" },
  statLabel: { display: "block", fontSize: 10, color: C.muted, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" },

  // Tabs
  tabBar:    { display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 16 },
  tab:       { background: "none", border: "none", color: C.muted, fontSize: 14, fontWeight: 600, padding: "10px 20px", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: -1, transition: "color .2s, border-color .2s", fontFamily: "'Sora', sans-serif" },
  tabActive: { color: C.accent, borderBottomColor: C.accent },

  // Card
  card:       { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28 },
  cardHeader: { marginBottom: 22 },
  cardTitle:  { fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: C.muted },

  // Profile view
  bioText: { fontSize: 15, color: C.text, lineHeight: 1.8, marginBottom: 24 },
  infoGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 40px" },
  infoRow:   { display: "flex", alignItems: "flex-start", gap: 12 },
  infoIcon:  { fontSize: 15, marginTop: 2, width: 20, textAlign: "center", flexShrink: 0 },
  infoLabel: { fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".07em" },
  infoValue: { fontSize: 14, color: C.text, marginTop: 3, fontWeight: 500 },

  // Form
  formGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" },
  field:      { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" },
  fieldInput: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, fontFamily: "'Sora', sans-serif", outline: "none", transition: "border-color .2s", width: "100%" },
  fieldHint:  { fontSize: 11, color: C.muted },

  // Buttons
  btnEdit:   { background: "transparent", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "'Sora', sans-serif" },
  btnSave:   { background: C.accent, color: "#0b0e14", fontSize: 14, fontWeight: 700, padding: "11px 24px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "'Sora', sans-serif" },
  btnCancel: { background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 14, fontWeight: 600, padding: "11px 24px", borderRadius: 9, cursor: "pointer", fontFamily: "'Sora', sans-serif" },

  // Settings sections
  verifyRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  verifyLabel: { fontSize: 15, fontWeight: 700 },
  verifyDesc:  { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 1.6, maxWidth: 480 },
  verifyPill:  { fontSize: 12, fontWeight: 700, color: C.accent, background: "rgba(212,175,106,.12)", border: `1px solid rgba(212,175,106,.3)`, padding: "6px 14px", borderRadius: 100, whiteSpace: "nowrap" },

  // Toggles
  toggleRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: `1px solid ${C.border}` },
  toggleLabel: { fontSize: 14, fontWeight: 600 },
  toggleDesc:  { fontSize: 12, color: C.muted, marginTop: 3 },
  toggle:      { width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background .25s", flexShrink: 0 },
  toggleThumb: { position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "transform .25s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" },

  // Danger
  dangerRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  dangerLabel: { fontSize: 14, fontWeight: 700, color: "#e05353" },
  dangerDesc:  { fontSize: 13, color: C.muted, marginTop: 4 },
  btnDanger:   { background: "transparent", border: "1px solid rgba(224,83,83,.4)", color: "#e05353", fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "'Sora', sans-serif", whiteSpace: "nowrap" },

  // Toast
  toast: {
    position: "fixed", bottom: 32, left: "50%",
    background: "#1a2635", border: `1px solid ${C.border}`,
    color: C.accent, fontSize: 14, fontWeight: 600,
    padding: "12px 28px", borderRadius: 10,
    boxShadow: "0 8px 32px rgba(0,0,0,.5)",
    zIndex: 300, transition: "opacity .3s, transform .3s",
    pointerEvents: "none", whiteSpace: "nowrap",
  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0b0e14; }
  input:focus, select:focus, textarea:focus { border-color: #d4af6a !important; outline: none; }
  input, select, textarea { color-scheme: dark; }
  .avatar-root:hover .avatar-overlay { opacity: 1 !important; }
  button:hover { opacity: .88; }
  @media (max-width: 640px) {
    [style*="repeat(4, 1fr)"]  { grid-template-columns: repeat(2, 1fr) !important; }
    [style*="1fr 1fr"]         { grid-template-columns: 1fr !important; }
    [style*="flex-end"][style*="space-between"] { flex-direction: column; align-items: flex-start !important; }
  }
`;