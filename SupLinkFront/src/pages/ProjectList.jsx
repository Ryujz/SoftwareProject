import { useState, useEffect, useRef } from "react";
import Navbar from "../Components/NavBar";
import ProjectCard from "../Components/ProjectCards";
import { getAllProjects } from "../api/project";
import { useAuth } from "../context/AuthContext";

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
};

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [heroRef, heroInView] = useInView(0.1);
  const [gridRef, gridInView] = useInView(0.1);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllProjects();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProjects = projects.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Navbar />

      {/* ── Hero Section ── */}
      <section style={s.heroWrap}>
        <div style={s.heroBg}>
          <div style={s.gridLines} />
          <div style={s.heroGlow1} />
          <div style={s.heroGlow2} />
        </div>

        <div style={s.heroInner} ref={heroRef}>
          <div style={{ ...s.heroContent, ...fadeUp(heroInView) }}>
            <div style={s.heroBadge}>
              <span style={s.badgeDot} /> Marketplace
            </div>
            <h1 style={s.heroH1}>
              Find the Right Project,<br />
              <span style={s.heroAccent}>Faster Than Ever</span>
            </h1>
            <p style={s.heroSub}>
              Connect with verified buyers, submit competitive quotes,
              and discover opportunities that match your expertise.
            </p>
            <div style={s.searchBox}>
              <input
                type="text"
                placeholder="Search for products, projects, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={s.searchInput}
              />
              <span style={s.searchIcon}>🔍</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section style={s.stats}>
        <div style={s.statItem}>
          <div style={s.statValue}>{projects.length}+</div>
          <div style={s.statLabel}>Active Projects</div>
        </div>
        <div style={s.statItem}>
          <div style={s.statValue}>$2.4B+</div>
          <div style={s.statLabel}>Project Value</div>
        </div>
        <div style={s.statItem}>
          <div style={s.statValue}>97%</div>
          <div style={s.statLabel}>Success Rate</div>
        </div>
      </section>

      {/* ── Projects Grid ── */}
      <section style={s.gridSection} ref={gridRef}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionH2}>
            {searchQuery ? `Search Results (${filteredProjects.length})` : "Available Projects"}
          </h2>
          <p style={s.sectionSub}>
            {searchQuery
              ? `Found ${filteredProjects.length} projects matching your search`
              : "Browse open RFPs, RFQs, and sourcing requests from verified buyers"}
          </p>
        </div>

        <div style={s.grid}>
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ ...s.skeletonCard, ...fadeUp(gridInView, i * 0.1) }} />
            ))
          ) : filteredProjects.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>📭</div>
              <h3 style={s.emptyTitle}>No projects found</h3>
              <p style={s.emptyDesc}>
                {searchQuery
                  ? `Try adjusting your search for "${searchQuery}"`
                  : "Check back soon for new opportunities"}
              </p>
            </div>
          ) : (
            filteredProjects.map((project, i) => (
              <div key={project.id} style={{ ...s.cardWrap, ...fadeUp(gridInView, i * 0.08) }}>
                <ProjectCard
                  project={project}
                  canInterest={user?.role === "supplier"}
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={s.ctaBanner}>
        <div style={s.ctaBannerGlow} />
        <h2 style={s.ctaH2}>Have a project to share?</h2>
        <p style={s.ctaSub}>Post your requirements and connect with qualified suppliers instantly</p>
        <div style={s.heroCta}>
          <a href="#" style={s.btnPrimary}>Post a Project</a>
          <a href="#" style={s.btnOutline}>View Pricing</a>
        </div>
      </section>
    </>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const s = {
  heroWrap: { position: "relative", paddingTop: 80 },
  heroBg: { position: "absolute", inset: 0, zIndex: -1, overflow: "hidden" },
  gridLines: { position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: "60px 60px", opacity: 0.4 },
  heroGlow1: { position: "absolute", top: -200, left: "30%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,106,.12) 0%, transparent 70%)" },
  heroGlow2: { position: "absolute", bottom: 0, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,125,216,.1) 0%, transparent 70%)" },
  heroInner: { maxWidth: 1200, margin: "0 auto", padding: "120px 24px 80px", display: "flex", alignItems: "center", gap: 60, minHeight: "80vh" },
  heroContent: { flex: "1 1 500px", minWidth: 0, textAlign: "center", marginLeft: "auto", marginRight: "auto" },
  heroBadge: { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,175,106,.1)", border: `1px solid rgba(212,175,106,.3)`, color: C.accent, padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 28 },
  badgeDot: { width: 6, height: 6, borderRadius: "50%", background: C.accent },
  heroH1: { fontSize: "clamp(40px, 5.5vw, 64px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", margin: "0 0 24px" },
  heroAccent: { color: C.accent },
  heroSub: { fontSize: 18, color: C.muted, lineHeight: 1.7, maxWidth: 540, margin: "0 0 36px", marginLeft: "auto", marginRight: "auto" },
  searchBox: { position: "relative", maxWidth: 580, margin: "0 auto" },
  searchInput: { width: "100%", padding: "18px 56px 18px 24px", fontSize: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, color: C.text, fontFamily: "'Sora', sans-serif", outline: "none", transition: "border-color .2s, box-shadow .2s" },
  searchIcon: { position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", fontSize: 18 },

  stats: { display: "flex", justifyContent: "center", background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "32px 24px", gap: 80, flexWrap: "wrap" },
  statItem: { flex: "1 1 180px", textAlign: "center" },
  statValue: { fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", color: C.accent },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 8, textTransform: "uppercase", letterSpacing: ".08em" },

  gridSection: { maxWidth: 1200, margin: "0 auto", padding: "80px 24px" },
  sectionHeader: { textAlign: "center", marginBottom: 48 },
  sectionH2: { fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.025em", margin: "0 0 16px", color: C.text },
  sectionSub: { fontSize: 16, color: C.muted, maxWidth: 500, lineHeight: 1.6, margin: "0 auto" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24 },
  cardWrap: { minWidth: 0 },
  skeletonCard: { height: 480, background: `linear-gradient(90deg, ${C.surface} 25%, ${C.border} 50%, ${C.surface} 75%)`, borderRadius: 16, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" },

  emptyState: { gridColumn: "1 / -1", textAlign: "center", padding: "80px 24px" },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: C.muted, maxWidth: 400, margin: "0 auto" },

  ctaBanner: { position: "relative", padding: "80px 24px", textAlign: "center", overflow: "hidden", background: C.surface, borderTop: `1px solid ${C.border}` },
  ctaBannerGlow: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,106,.1) 0%, transparent 70%)", pointerEvents: "none" },
  ctaH2: { fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 16px", position: "relative" },
  ctaSub: { fontSize: 16, color: C.muted, margin: "0 0 32px", position: "relative" },
  heroCta: { display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "center", position: "relative" },
  btnPrimary: { background: C.accent, color: "#0b0e14", fontWeight: 700, fontSize: 15, padding: "14px 28px", borderRadius: 10, textDecoration: "none", display: "inline-block", transition: "background .2s" },
  btnOutline: { color: C.text, border: `1px solid ${C.border}`, fontWeight: 600, fontSize: 15, padding: "14px 24px", borderRadius: 10, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.03)", transition: "background .2s" },
};
