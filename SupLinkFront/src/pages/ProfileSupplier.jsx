import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../Components/NavBar";
import "../styles/Global.css";
import { getMyProfile, getMyPortfolios, upsertMyProfile, getSupplierReviews, getSupplierReviewSummary } from "../api/supplier";

// const NAV_LINKS = ["Marketplace", "My Listings", "Orders", "Analytics"];

/* ─── Tokens ─────────────────────────────────────────────────── */
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

/* ─── Helpers ────────────────────────────────────────────────── */
function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function stars(n) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < n ? C.accent : C.border, fontSize: 13 }}>★</span>
  ));
}

/* ─── Sub-components ─────────────────────────────────────────── */
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
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files[0]; if (f && onUpload) onUpload(f); }} />
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={s.statCard}>
      <span style={s.statValue}>{value}</span>
      <span style={s.statLabel}>{label}</span>
      {sub && <span style={s.statSub}>{sub}</span>}
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

function ToggleRow({ label, desc, defaultOn = true }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={s.toggleRow}>
      <div>
        <div style={s.toggleLabel}>{label}</div>
        <div style={s.toggleDesc}>{desc}</div>
      </div>
      <button style={{ ...s.toggle, background: on ? C.accent : C.border }} onClick={() => setOn(v => !v)}>
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

function StockPill({ status }) {
  const map = {
    "In Stock":  { color: "#7ed321", bg: "rgba(126,211,33,.1)" },
    "Low Stock": { color: "#f5a623", bg: "rgba(245,166,35,.1)" },
    "Pre-Order": { color: C.blue,    bg: "rgba(59,125,216,.1)"  },
  };
  const t = map[status] ?? map["In Stock"];
  return <span style={{ ...s.stockPill, color: t.color, background: t.bg }}>● {status}</span>;
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

/* ─── Page ───────────────────────────────────────────────────── */
export default function SupplierProfilePage() {
  const { user } = useAuth();
  const [supplier, setSupplier]         = useState(null);
  const [portfolios, setPortfolios]     = useState([]);
  const [draft, setDraft]               = useState(null);
  const [activeTab, setActiveTab]       = useState("profile");
  const [editing, setEditing]           = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getMyProfile(), 
      getMyPortfolios(),
      getSupplierReviews(user.id),
      getSupplierReviewSummary(user.id),
    ])
      .then(([profile, portfolioList, reviews, reviewSummary]) => {
        const merged = {
          name:           user.username,
          username:       user.username,
          email:          user.email,
          role:           user.role,
          company:        profile.company_name ?? "",
          location:       profile.address      ?? "",
          bio:            profile.description  ?? "",
          phone:          profile.phone        ?? "",
          website:        "",
          taxId:          "",
          verified:       false,
          memberSince:    "",
          avatar:         null,
          stats: { 
            fulfilled: 0, 
            revenue: "—",
            buyers: 0, 
            rating: reviewSummary.average_rating ?? 0, 
            onTime: "—", 
            responseTime: "—" },
          categories:     [],
          certifications: [],
          listings:       portfolioList,
          reviews:        reviews.map(r => ({
            author: r.vendor_username ?? "Buyer",
            rating: r.rating,
            text: r.comment,
            date: r.created_at,
          })),
        };
        setSupplier(merged);
        setDraft(merged);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div style={{ color: C.text, padding: 40 }}>Loading...</div>;
  if (error)   return <div style={{ color: "#e05353", padding: 40 }}>{error}</div>;

  const display = editing ? draft : supplier;

  function handleChange(e) {
    const { name, value } = e.target;
    setDraft(d => ({ ...d, [name]: value }));
  }

  function logout() {
    // localStorage.removeItem("token");
    localStorage.removeItem("user");
    // optionally clear user state
    window.location.href = "/";
    setUser(null);
  }

  async function handleSave() {
    try {
      await upsertMyProfile({
        company_name:  draft.company,
        description:   draft.bio,
        address:       draft.location,
        phone:         draft.phone,
        business_type: draft.business_type ?? null,
      });
      setSupplier(draft);
      setEditing(false);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2800);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setDraft(supplier);
    setEditing(false);
  }

  function handleAvatarUpload(file) {
    const url = URL.createObjectURL(file);
    setDraft(d => ({ ...d, avatar: url }));
  }

  return (
    <>
      <Navbar />
      <div style={s.root}>
        {/* <style>{CSS}</style> */}
        {/* <Navbar links={NAV_LINKS} /> */}
        <SaveToast show={toastVisible} />

        <div style={s.cover}>
          <div style={s.coverBg} />
          <div style={s.coverGlowLeft} />
          <div style={s.coverGlowRight} />
        </div>

        <main style={s.main}>

          <div style={s.identityStrip}>
            <div style={s.identityLeft}>
              <Avatar user={display} size={88} editable={editing} onUpload={handleAvatarUpload} />
              <div style={s.identityText}>
                <div style={s.identityName}>
                  {display.name}
                  {display.verified && <span style={s.verifiedPill}>✦ Verified</span>}
                </div>
                <div style={s.identityCompany}>{display.company}</div>
                <div style={s.identityMeta}>
                  @{display.username} · 📍 {display.location} · Member since {display.memberSince}
                </div>
              </div>
            </div>
            <div style={s.identityRight}>
              <span style={s.rolePill}>⬡ Supplier</span>
              {!editing && (
                <button style={s.btnEdit} onClick={() => { setEditing(true); setActiveTab("profile"); }}>
                  Edit Profile
                </button>
              )}
              {!editing && (
                <button style={s.btnContact}>✉ Contact</button>
              )}
            </div>
          </div>

          <div style={s.statsRow}>
            <StatCard label="Orders Fulfilled" value={supplier.stats.fulfilled} />
            <StatCard label="Total Revenue"    value={supplier.stats.revenue} />
            <StatCard label="Active Buyers"    value={supplier.stats.buyers} />
            <StatCard label="Seller Rating"    value={`${supplier.stats.rating} ★`} />
            <StatCard label="On-Time Delivery" value={supplier.stats.onTime} />
            <StatCard label="Response Time"    value={supplier.stats.responseTime} />
          </div>

          <div style={s.tabBar}>
            {[
              ["profile",  "Profile"],
              ["listings", "Listings"],
              ["reviews",  "Reviews"],
              ["settings", "Settings"],
            ].map(([id, label]) => (
              <button key={id}
                style={{ ...s.tab, ...(activeTab === id ? s.tabActive : {}) }}
                onClick={() => setActiveTab(id)}
              >
                {label}
                {id === "listings" && <span style={s.tabCount}>{supplier.listings.length}</span>}
                {id === "reviews"  && <span style={s.tabCount}>{supplier.reviews.length}</span>}
              </button>
            ))}
          </div>

          {activeTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={s.card}>
                <div style={s.cardHeader}><span style={s.cardTitle}>About</span></div>
                {editing ? (
                  <div style={s.formGrid}>
                    <Field label="Full Name"    name="name"     value={draft.name}     onChange={handleChange} />
                    <Field label="Username"     name="username" value={draft.username} onChange={handleChange} hint="supplylink.co.th/@username" />
                    <Field label="Company"      name="company"  value={draft.company}  onChange={handleChange} />
                    <Field label="Location"     name="location" value={draft.location} onChange={handleChange} />
                    <Field label="Website"      name="website"  value={draft.website}  onChange={handleChange} />
                    <Field label="Tax ID"       name="taxId"    value={draft.taxId}    onChange={handleChange} hint="13-digit Thai tax ID" />
                    <div style={{ gridColumn: "1 / -1" }}>
                      <Field label="Business Description" name="bio" value={draft.bio} onChange={handleChange}>
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
                    <p style={s.bioText}>{supplier.bio}</p>
                    <div style={s.infoGrid}>
                      <InfoRow icon="✉"  label="Email"    value={supplier.email} />
                      <InfoRow icon="☎"  label="Phone"    value={supplier.phone} />
                      <InfoRow icon="🌐" label="Website"  value={supplier.website} />
                      <InfoRow icon="📍" label="Location" value={supplier.location} />
                      <InfoRow icon="🏢" label="Company"  value={supplier.company} />
                      <InfoRow icon="🪪" label="Tax ID"   value={supplier.taxId} />
                    </div>
                  </div>
                )}
              </div>

              <div style={s.twoCol}>
                <div style={s.card}>
                  <div style={s.cardHeader}><span style={s.cardTitle}>Product Categories</span></div>
                  <div style={s.tagCloud}>
                    {supplier.categories.map((c) => (
                      <span key={c} style={s.categoryTag}>{c}</span>
                    ))}
                  </div>
                </div>
                <div style={s.card}>
                  <div style={s.cardHeader}><span style={s.cardTitle}>Certifications & Trust</span></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {supplier.certifications.map((cert) => (
                      <div key={cert} style={s.certRow}>
                        <span style={s.certIcon}>✦</span>
                        <span style={s.certLabel}>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
      )}

        {activeTab === "listings" && (
          <div style={s.card}>
            <div style={{ ...s.cardHeader, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={s.cardTitle}>Active Listings</span>
              <button style={s.btnSave}>+ Add Listing</button>
            </div>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Product", "Price", "Unit", "Stock", "Orders", ""].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {supplier.listings.map((l) => (
                  <tr key={l.id} className="table-row">
                    <td style={s.td}><span style={s.listingName}>{l.title}</span></td>
                    <td style={{ ...s.td, color: C.accent, fontWeight: 700 }}>—</td>
                    <td style={{ ...s.td, color: C.muted, fontSize: 12 }}>—</td>
                    <td style={s.td}><StockPill status="In Stock" /></td>
                    <td style={{ ...s.td, color: C.muted }}>—</td>
                    <td style={s.td}><button style={s.btnRowEdit}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "reviews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={s.card}>
              <div style={s.reviewSummary}>
                <div style={s.reviewBigRating}>{supplier.stats.rating}</div>
                <div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>{stars(Math.round(supplier.stats.rating))}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>{supplier.reviews.length} reviews · All verified buyers</div>
                </div>
              </div>
            </div>
            {supplier.reviews.map((r, i) => (
              <div key={i} style={s.reviewCard}>
                <div style={s.reviewHeader}>
                  <div style={s.reviewAvatar}>{r.author.slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={s.reviewAuthor}>{r.author}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                      <div style={{ display: "flex", gap: 2 }}>{stars(r.rating)}</div>
                      <span style={{ fontSize: 12, color: C.muted }}>{r.date}</span>
                    </div>
                  </div>
                </div>
                <p style={s.reviewText}>{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={s.card}>
              <div style={s.cardHeader}><span style={s.cardTitle}>Contact Information</span></div>
              <div style={s.formGrid}>
                <Field label="Email Address" name="email" type="email" value={draft.email} onChange={handleChange} />
                <Field label="Phone Number"  name="phone" type="tel"   value={draft.phone} onChange={handleChange} />
                <Field label="Website"       name="website"            value={draft.website} onChange={handleChange} />
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardHeader}><span style={s.cardTitle}>Business Verification</span></div>
              <div style={s.verifyRow}>
                <div>
                  <div style={s.verifyLabel}>ThaiID & DBD Verified</div>
                  <div style={s.verifyDesc}>Your business identity is verified. Verified suppliers receive 2.4× more quote requests.</div>
                </div>
                <span style={s.verifyPill}>✦ Verified</span>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardHeader}><span style={s.cardTitle}>Notifications</span></div>
              <ToggleRow label="New quote requests"  desc="When a buyer sends you an RFQ"            defaultOn={true}  />
              <ToggleRow label="Order confirmations" desc="When a purchase order is placed"          defaultOn={true}  />
              <ToggleRow label="Low stock alerts"    desc="When a listing drops below minimum stock" defaultOn={true}  />
              <ToggleRow label="Buyer messages"      desc="Chat messages from buyers"                defaultOn={true}  />
              <ToggleRow label="Platform updates"    desc="News and product announcements"           defaultOn={false} />
            </div>

            <div style={{ ...s.card, borderColor: "rgba(224,83,83,.28)" }}>
              <div style={s.cardHeader}><span style={{ ...s.cardTitle, color: "#e05353" }}>Danger Zone</span></div>
              <div style={s.dangerRow}>
                <div>
                  <div style={s.dangerLabel}>Deactivate Storefront</div>
                  <div style={s.dangerDesc}>Hides your listings from buyers. Active orders will still be fulfilled.</div>
                </div>
                <button style={s.btnDanger}>Deactivate</button>
                <div>
                  <div style={s.dangerLabel}>Logout</div>
                  <div style={s.dangerDesc}>Hides your listings from buyers. Active orders will still be fulfilled.</div>
                </div>
                <button style={s.btnDanger} onClick={() => logout()}>Logout</button>
              </div>
            </div>

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

/* ─── Styles ─────────────────────────────────────────────────── */
const s = {
  root: { background: C.bg, color: C.text, fontFamily: "'Sora', sans-serif", minHeight: "100vh" },
  cover: { height: 190, position: "relative", overflow: "hidden", marginTop: 0 },
  coverBg: {
    position: "absolute", inset: 0,
    background: "linear-gradient(135deg, #0d1a1f 0%, #0f1c20 50%, #111820 100%)",
    backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
  },
  coverGlowLeft:  { position: "absolute", top: -80,  left: "20%",  width: 400, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,125,216,.14) 0%, transparent 70%)" },
  coverGlowRight: { position: "absolute", top: -120, right: "10%", width: 500, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,106,.1) 0%, transparent 68%)" },
  main: { maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" },
  identityStrip:  { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginTop: -44, marginBottom: 24, position: "relative", zIndex: 2 },
  identityLeft:   { display: "flex", alignItems: "flex-end", gap: 18 },
  identityRight:  { display: "flex", alignItems: "center", gap: 10, paddingBottom: 2 },
  identityText:   { paddingBottom: 4 },
  identityName:   { fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  identityCompany:{ fontSize: 14, color: C.text, fontWeight: 600, marginTop: 4 },
  identityMeta:   { fontSize: 12, color: C.muted, marginTop: 4 },
  verifiedPill:   { fontSize: 11, fontWeight: 700, color: C.accent, background: "rgba(212,175,106,.12)", border: `1px solid rgba(212,175,106,.3)`, padding: "3px 10px", borderRadius: 100, letterSpacing: ".04em" },
  rolePill:       { fontSize: 11, fontWeight: 700, color: C.accent, borderColor: C.accent, background: "rgba(212,175,106,.1)", padding: "4px 12px", borderRadius: 100, border: "1px solid", letterSpacing: ".06em", textTransform: "uppercase" },
  avatarRoot:     { borderRadius: "50%", background: `linear-gradient(135deg, #1a5c8a, ${C.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", border: `3px solid ${C.bg}`, position: "relative", overflow: "hidden", flexShrink: 0 },
  avatarImg:      { width: "100%", height: "100%", objectFit: "cover" },
  avatarOverlay:  { position: "absolute", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .2s", cursor: "pointer", color: "#fff", fontSize: 11 },
  statsRow:  { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 },
  statCard:  { background: C.surface, padding: "18px 0", textAlign: "center" },
  statValue: { display: "block", fontSize: 20, fontWeight: 800, color: C.accent, letterSpacing: "-0.02em" },
  statLabel: { display: "block", fontSize: 10, color: C.muted, marginTop: 4, textTransform: "uppercase", letterSpacing: ".07em" },
  statSub:   { display: "block", fontSize: 10, color: C.muted },
  tabBar:    { display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 16 },
  tab:       { background: "none", border: "none", color: C.muted, fontSize: 14, fontWeight: 600, padding: "10px 20px", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: -1, transition: "color .2s, border-color .2s", fontFamily: "'Sora', sans-serif", display: "flex", alignItems: "center", gap: 7 },
  tabActive: { color: C.accent, borderBottomColor: C.accent },
  tabCount:  { background: C.surface2, color: C.muted, fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 100 },
  card:       { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28 },
  cardHeader: { marginBottom: 20 },
  cardTitle:  { fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: C.muted },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  bioText:  { fontSize: 15, color: C.text, lineHeight: 1.8, marginBottom: 24 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 40px" },
  infoRow:  { display: "flex", alignItems: "flex-start", gap: 12 },
  infoIcon: { fontSize: 15, marginTop: 2, width: 20, textAlign: "center", flexShrink: 0 },
  infoLabel:{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".07em" },
  infoValue:{ fontSize: 14, color: C.text, marginTop: 3, fontWeight: 500 },
  tagCloud:    { display: "flex", flexWrap: "wrap", gap: 8 },
  categoryTag: { fontSize: 12, fontWeight: 600, color: C.blue, background: "rgba(59,125,216,.12)", border: "1px solid rgba(59,125,216,.25)", padding: "5px 12px", borderRadius: 100 },
  certRow:   { display: "flex", alignItems: "center", gap: 10 },
  certIcon:  { color: C.accent, fontSize: 13, flexShrink: 0 },
  certLabel: { fontSize: 14, fontWeight: 600, color: C.text },
  table: { width: "100%", borderCollapse: "collapse" },
  th:    { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${C.border}` },
  td:    { fontSize: 14, color: C.text, padding: "14px 12px", borderBottom: `1px solid ${C.border}` },
  listingName: { fontWeight: 600 },
  stockPill:   { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100 },
  btnRowEdit:  { background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "'Sora', sans-serif" },
  reviewSummary:  { display: "flex", alignItems: "center", gap: 24 },
  reviewBigRating:{ fontSize: 48, fontWeight: 800, color: C.accent, letterSpacing: "-0.04em", lineHeight: 1 },
  reviewCard:     { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 },
  reviewHeader:   { display: "flex", alignItems: "center", gap: 14, marginBottom: 14 },
  reviewAvatar:   { width: 38, height: 38, borderRadius: "50%", background: C.surface2, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.muted, flexShrink: 0 },
  reviewAuthor:   { fontSize: 14, fontWeight: 700 },
  reviewText:     { fontSize: 14, color: C.muted, lineHeight: 1.75 },
  formGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" },
  field:      { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" },
  fieldInput: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, fontFamily: "'Sora', sans-serif", outline: "none", transition: "border-color .2s", width: "100%" },
  fieldHint:  { fontSize: 11, color: C.muted },
  btnEdit:    { background: "transparent", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "'Sora', sans-serif" },
  btnContact: { background: C.accent, color: "#0b0e14", fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'Sora', sans-serif" },
  btnSave:    { background: C.accent, color: "#0b0e14", fontSize: 14, fontWeight: 700, padding: "11px 24px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "'Sora', sans-serif" },
  btnCancel:  { background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 14, fontWeight: 600, padding: "11px 24px", borderRadius: 9, cursor: "pointer", fontFamily: "'Sora', sans-serif" },
  verifyRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  verifyLabel: { fontSize: 15, fontWeight: 700 },
  verifyDesc:  { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 1.6, maxWidth: 480 },
  verifyPill:  { fontSize: 12, fontWeight: 700, color: C.accent, background: "rgba(212,175,106,.12)", border: `1px solid rgba(212,175,106,.3)`, padding: "6px 14px", borderRadius: 100, whiteSpace: "nowrap" },
  toggleRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: `1px solid ${C.border}` },
  toggleLabel: { fontSize: 14, fontWeight: 600 },
  toggleDesc:  { fontSize: 12, color: C.muted, marginTop: 3 },
  toggle:      { width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background .25s", flexShrink: 0 },
  toggleThumb: { position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "transform .25s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" },
  dangerRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  dangerLabel: { fontSize: 14, fontWeight: 700, color: "#e05353" },
  dangerDesc:  { fontSize: 13, color: C.muted, marginTop: 4 },
  btnDanger:   { background: "transparent", border: "1px solid rgba(224,83,83,.4)", color: "#e05353", fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "'Sora', sans-serif", whiteSpace: "nowrap" },
  toast: { position: "fixed", bottom: 32, left: "50%", background: "#1a2635", border: `1px solid ${C.border}`, color: C.accent, fontSize: 14, fontWeight: 600, padding: "12px 28px", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,.5)", zIndex: 300, transition: "opacity .3s, transform .3s", pointerEvents: "none", whiteSpace: "nowrap" },
};
