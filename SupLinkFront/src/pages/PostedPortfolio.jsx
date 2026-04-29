import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../Components/NavBar";
import { getMyPortfolios, getMyProfile } from "../api/supplier";
import CreatePortfolioButton from "../Components/createProtfolio/CreatePortolio";
import CreatePortModal from "../Components/createProtfolio/CreatePortModal";
import POCard from "../Components/Cards";

/* ─── Hooks ───────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

const fadeUp = (visible, delay = 0) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? "none" : "translateY(28px)",
  transition: `opacity .7s ${delay}s ease, transform .7s ${delay}s ease`,
});

/* ─── Color Palette ───────────────────────────────────────────── */
const C = {
  bg: "#0b0e14",
  surface: "#121720",
  border: "#1e2736",
  text: "#e8eaf0",
  muted: "#7a8499",
  accent: "#d4af6a",
  accentDark: "#a07c3a",
  blue: "#3b7dd8",
  green: "#7ed321",
};

export default function PostedPortfolio() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [portfolios, setPortfolios] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [headerRef, headerInView] = useInView(0.1);
  const [gridRef, gridInView] = useInView(0.1);

  const fetchPortfolios = async () => {
    try {
      const data = await getMyPortfolios();
      const profileData = await getMyProfile();
      setPortfolios(data ?? []);
      setProfile(profileData ?? {});
    } catch (err) {
      console.error("Error fetching portfolios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  return (
    <>
      <Navbar />

      {/* ── Header Section ── */}
      <section style={s.headerWrap} ref={headerRef}>
        <div style={s.headerBg}>
          <div style={s.gridLines} />
          <div style={s.headerGlow} />
        </div>

        <div style={s.headerInner}>
          <div style={{ ...s.headerContent, ...fadeUp(headerInView) }}>
            <div style={s.heroBadge}>
              <span style={s.badgeDot} /> Portfolio Manager
            </div>
            <h1 style={s.headerH1}>
              Your <span style={s.headerAccent}>Portfolios</span>
            </h1>
            <p style={s.headerSub}>
              Manage and showcase your work to thousands of potential buyers.
              Keep your portfolios updated for maximum visibility.
            </p>
            <div style={s.headerStats}>
              <div style={s.statBox}>
                <div style={s.statValue}>{portfolios.length}</div>
                <div style={s.statLabel}>Active Portfolios</div>
              </div>
              <div style={s.statBox}>
                <div style={s.statValue}>{profile?.total_views ?? 0}</div>
                <div style={s.statLabel}>Total Views</div>
              </div>
              <div style={s.statBox}>
                <div style={s.statValue}>{profile?.total_inquiries ?? 0}</div>
                <div style={s.statLabel}>Inquiries</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Action Bar ── */}
      <section style={s.actionBar}>
        <div style={s.actionInner}>
          <div style={s.actionLeft}>
            <h2 style={s.actionTitle}>All Portfolios</h2>
            <p style={s.actionSub}>
              {loading ? "Loading your portfolios..." : `${portfolios.length} portfolio${portfolios.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
          <div style={s.actionRight}>
            <CreatePortfolioButton onClick={() => setOpen(!open)} style={s.createBtn} />
          </div>
        </div>
      </section>

      {/* ── Portfolio Grid ── */}
      <section style={s.gridSection} ref={gridRef}>
        <CreatePortModal open={open} onClose={() => setOpen(false)} onSuccess={fetchPortfolios} />

        <div style={s.grid}>
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} style={{ ...s.skeletonCard, ...fadeUp(gridInView, i * 0.1) }} />
            ))
          ) : portfolios.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>📁</div>
              <h3 style={s.emptyTitle}>No portfolios yet</h3>
              <p style={s.emptyDesc}>
                Create your first portfolio to start showcasing your work to potential buyers.
              </p>
              <button style={s.emptyBtn} onClick={() => setOpen(true)}>
                <span style={s.emptyBtnIcon}>+</span> Create Portfolio
              </button>
            </div>
          ) : (
            portfolios.map((portfolio, i) => (
              <div key={portfolio.portfolio_id} style={{ ...s.cardWrap, ...fadeUp(gridInView, i * 0.08) }}>
                <POCard
                  portfolio={portfolio}
                  canDelete
                  onDelete={(deletedID) => setPortfolios((prev) => prev.filter((p) => p.portfolio_id !== deletedID))}
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Tips Section ── */}
      <section style={s.tipsSection}>
        <h2 style={s.tipsTitle}>Tips for Great Portfolios</h2>
        <div style={s.tipsGrid}>
          {TIPS.map((tip, i) => (
            <div key={i} style={s.tipCard}>
              <div style={s.tipIcon}>{tip.icon}</div>
              <h3 style={s.tipTitle}>{tip.title}</h3>
              <p style={s.tipDesc}>{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const TIPS = [
  { icon: "📸", title: "High-Quality Images", desc: "Use clear, professional images that showcase your best work" },
  { icon: "📝", title: "Detailed Descriptions", desc: "Explain your process, materials, and unique value proposition" },
  { icon: "🏆", title: "Highlight Achievements", desc: "Showcase awards, certifications, and notable clients" },
  { icon: "🔄", title: "Keep It Updated", desc: "Regularly add new projects to show active engagement" },
];

/* ─── Styles ──────────────────────────────────────────────────── */
const s = {
  headerWrap: { position: "relative", paddingTop: 80 },
  headerBg: { position: "absolute", inset: 0, zIndex: -1, overflow: "hidden" },
  gridLines: { position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: "60px 60px", opacity: 0.4 },
  headerGlow: { position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 700, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,106,.12) 0%, transparent 70%)" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "100px 24px 60px" },
  headerContent: { textAlign: "center" },
  heroBadge: { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,175,106,.1)", border: `1px solid rgba(212,175,106,.3)`, color: C.accent, padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 28 },
  badgeDot: { width: 6, height: 6, borderRadius: "50%", background: C.accent },
  headerH1: { fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", margin: "0 0 20px" },
  headerAccent: { color: C.accent },
  headerSub: { fontSize: 17, color: C.muted, lineHeight: 1.7, maxWidth: 520, margin: "0 0 40px", marginLeft: "auto", marginRight: "auto" },
  headerStats: { display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" },
  statBox: { textAlign: "center" },
  statValue: { fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 800, color: C.accent, letterSpacing: "-0.03em" },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 6, textTransform: "uppercase", letterSpacing: ".08em" },

  actionBar: { background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` },
  actionInner: { maxWidth: 1200, margin: "0 auto", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 },
  actionLeft: { flex: "1 1 300px" },
  actionTitle: { fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 },
  actionSub: { fontSize: 14, color: C.muted },
  actionRight: { flex: "none" },
  createBtn: { background: C.accent, color: "#0b0e14", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background .2s" },

  gridSection: { maxWidth: 1200, margin: "0 auto", padding: "60px 24px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24 },
  cardWrap: { minWidth: 0 },
  skeletonCard: { height: 420, background: `linear-gradient(90deg, ${C.surface} 25%, ${C.border} 50%, ${C.surface} 75%)`, borderRadius: 16, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" },

  emptyState: { gridColumn: "1 / -1", textAlign: "center", padding: "80px 24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16 },
  emptyIcon: { fontSize: 56, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 12 },
  emptyDesc: { fontSize: 15, color: C.muted, maxWidth: 420, margin: "0 auto 24px" },
  emptyBtn: { display: "inline-flex", alignItems: "center", gap: 10, background: C.accent, color: "#0b0e14", border: "none", padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "background .2s" },
  emptyBtnIcon: { fontSize: 20, lineHeight: 1 },

  tipsSection: { maxWidth: 1200, margin: "0 auto", padding: "60px 24px 80px" },
  tipsTitle: { fontSize: 24, fontWeight: 700, textAlign: "center", marginBottom: 40, color: C.text },
  tipsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 },
  tipCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, textAlign: "center", transition: "border-color .2s" },
  tipIcon: { fontSize: 32, marginBottom: 16 },
  tipTitle: { fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10 },
  tipDesc: { fontSize: 14, color: C.muted, lineHeight: 1.6 },
};
