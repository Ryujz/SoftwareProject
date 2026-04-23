import { useState, useEffect, useRef } from "react";
import Navbar from "./Components/NavBar";
import POCard from "./Components/Cards";

/* ─── Data ────────────────────────────────────────────────────── */
const STATS = [
  { value: "2.4M+", label: "Purchase Orders" },
  { value: "$18B",  label: "Spend Managed"   },
  { value: "97%",   label: "Cost Accuracy"   },
  { value: "340ms", label: "Avg. Approval Time" },
];

const FEATURES = [
  { icon: "◈", title: "Intelligent Sourcing",  tag: "AI-Powered",   desc: "AI-ranked supplier matching against 180,000+ verified vendors. Compare bids in real time with automated compliance checks." },
  { icon: "⬡", title: "Contract Lifecycle",    tag: "End-to-End",   desc: "Draft, negotiate, sign, and track every contract in one auditable workspace. Auto-alerts on renewals and obligations." },
  { icon: "◉", title: "Spend Intelligence",    tag: "Real-Time",    desc: "Granular spend analytics across categories, departments, and geographies. Anomaly detection flags waste before it compounds." },
  { icon: "⬟", title: "Approval Workflows",    tag: "Automated",    desc: "Policy-driven routing with mobile approvals. Finance, legal, and ops collaborate in a single audit trail, no email threads." },
  { icon: "◇", title: "Supplier Portal",       tag: "Self-Service", desc: "Give vendors a self-service hub for invoices, onboarding, and performance scorecards. Reduce back-and-forth by 70%." },
  { icon: "⬘", title: "ERP Integration",       tag: "Pre-Built",    desc: "Native connectors for SAP, Oracle, NetSuite, and Workday. Two-way sync with zero manual re-entry." },
];

const TESTIMONIALS = [
  { quote: "We cut our procurement cycle from 14 days to under 36 hours. The ROI was visible in the first quarter.",           name: "Priya Sundaram", role: "CPO, Nexlane Logistics",           avatar: "PS" },
  { quote: "Finally a platform where compliance isn't an afterthought. Every approval is traceable, every contract versioned.", name: "Marcus Weil",    role: "VP Finance, Orbis Manufacturing",  avatar: "MW" },
  { quote: "Our supplier relationships improved dramatically. The portal alone reduced onboarding time by 60%.",               name: "Chiara Fontana", role: "Head of Procurement, Valeo Retail", avatar: "CF" },
];

const SAMPLE_ORDER = {
  id:       "PO-00812",
  supplier: "Apex Industrial Co.",
  category: "MRO Supplies",
  amount:   "$284,500.00",
  savings:  "↓ 12.4% vs budget",
  delivery: 72,
  status:   "Approved",
};

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

function AnimCounter({ target }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView(0.5);
  const num = parseFloat(target.replace(/[^0-9.]/g, ""));
  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const inc = num / 60;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= num) { setVal(num); clearInterval(t); }
      else setVal(cur);
    }, 20);
    return () => clearInterval(t);
  }, [inView, num]);
  const display = target.includes(".") ? val.toFixed(1) : Math.round(val).toLocaleString();
  return <span ref={ref}>{target.replace(/[0-9.]+/, display)}</span>;
}

/* ─── Helper ──────────────────────────────────────────────────── */
const fadeUp = (visible, delay = 0) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? "none" : "translateY(28px)",
  transition: `opacity .7s ${delay}s ease, transform .7s ${delay}s ease`,
});

/* ─── Page ────────────────────────────────────────────────────── */
export default function ProcureHome() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [heroRef, heroInView] = useInView(0.1);
  const [featRef, featInView] = useInView(0.1);
  const [statsRef, statsInView] = useInView(0.2);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={s.root}>
      <style>{CSS}</style>

      {/* ── Navbar component ── */}
      <Navbar />
      <div style={{ padding: "20px" }}>
          <h1>Home</h1>
      </div>
      {/* ── Hero ── */}
      <section style={s.heroWrap}>
        <div style={s.heroBg}>
          <div style={s.gridLines} />
          <div style={s.heroGlow1} />
          <div style={s.heroGlow2} />
        </div>

        <div style={s.heroInner} ref={heroRef}>
          {/* Copy */}
          <div style={{ ...s.heroContent, ...fadeUp(heroInView) }}>
            <div style={s.heroBadge}>
              <span style={s.badgeDot} /> Enterprise Procurement Platform
            </div>
            <h1 style={s.heroH1}>
              Source smarter.<br />
              <span style={s.heroAccent}>Spend less.</span><br />
              Close faster.
            </h1>
            <p style={s.heroSub}>
              ProcurementOS unifies sourcing, contracts, and supplier management
              so procurement teams move at the speed of business—not bureaucracy.
            </p>
            <div style={s.heroCta}>
              <a href="#" style={s.btnPrimary}>Start Free Trial</a>
              <a href="#" style={s.btnOutline}>
                <span style={s.playIcon}>▶</span> Watch 3-min demo
              </a>
            </div>
            <p style={s.heroNote}>No credit card required · SOC 2 Type II certified</p>
          </div>

          {/* POCard component */}
          <POCard order={SAMPLE_ORDER} visible={heroInView} />
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={s.stats} ref={statsRef}>
        {STATS.map((st, i) => (
          <div key={i} style={{ ...s.statItem, ...fadeUp(statsInView, i * 0.12) }}>
            <div style={s.statValue}><AnimCounter target={st.value} /></div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section style={s.features} ref={featRef}>
        <div style={s.sectionTag}>Platform Capabilities</div>
        <h2 style={s.sectionH2}>
          Everything procurement needs.<br />
          <span style={s.heroAccent}>Nothing it doesn't.</span>
        </h2>
        <p style={s.sectionSub}>
          Six integrated modules replace a patchwork of spreadsheets, emails, and legacy tools.
        </p>
        <div style={s.featureGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feat-card" style={{ ...s.featCard, ...fadeUp(featInView, i * 0.1) }}>
              <div style={s.featIcon}>{f.icon}</div>
              <div style={s.featTag}>{f.tag}</div>
              <h3 style={s.featTitle}>{f.title}</h3>
              <p style={s.featDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={s.testimonials}>
        <div style={s.sectionTag}>Customer Stories</div>
        <h2 style={s.sectionH2}>
          Trusted by procurement<br />
          <span style={s.heroAccent}>leaders worldwide.</span>
        </h2>
        <div style={s.testimonialWrap}>
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              style={{
                ...s.testimonialCard,
                opacity: i === activeTestimonial ? 1 : 0,
                transform: i === activeTestimonial ? "translateY(0)" : "translateY(12px)",
                transition: "opacity .5s ease, transform .5s ease",
                pointerEvents: i === activeTestimonial ? "auto" : "none",
                position: i === 0 ? "relative" : "absolute",
                top: 0, left: 0, right: 0,
              }}
            >
              <p style={s.quoteText}>"{t.quote}"</p>
              <div style={s.quoteAuthor}>
                <div style={s.avatar}>{t.avatar}</div>
                <div>
                  <div style={s.authorName}>{t.name}</div>
                  <div style={s.authorRole}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={s.dots}>
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              style={{ ...s.dot, ...(i === activeTestimonial ? s.dotActive : {}) }}
              onClick={() => setActiveTestimonial(i)}
            />
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={s.ctaBanner}>
        <div style={s.ctaBannerGlow} />
        <h2 style={s.ctaH2}>Ready to modernize procurement?</h2>
        <p style={s.ctaSub}>Join 1,200+ companies that replaced fragmented tools with ProcurementOS.</p>
        <div style={s.heroCta}>
          <a href="#" style={s.btnPrimary}>Start Free Trial</a>
          <a href="#" style={s.btnOutline}>Talk to Sales</a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerTop}>
          <div style={s.logo}>
            <span style={s.logoMark}>⬡</span>
            <span style={s.logoText}>Procurement<b>OS</b></span>
          </div>
          <div style={s.footerLinks}>
            {["Product", "Pricing", "Security", "Blog", "Careers", "Status", "Privacy", "Terms"].map((l) => (
              <a key={l} href="#" style={s.footerLink}>{l}</a>
            ))}
          </div>
        </div>
        <div style={s.footerBottom}>
          <span>© 2026 ProcurementOS Inc. All rights reserved.</span>
          <span>SOC 2 · ISO 27001 · GDPR Ready</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const C = {
  bg:         "#0b0e14",
  surface:    "#121720",
  border:     "#1e2736",
  text:       "#e8eaf0",
  muted:      "#7a8499",
  accent:     "#d4af6a",
  accentDark: "#a07c3a",
  blue:       "#3b7dd8",
};

const s = {
  root: { background: C.bg, color: C.text, fontFamily: "'Sora', sans-serif", minHeight: "100vh", overflowX: "hidden" },

  // Hero
  heroWrap:    { position: "relative" },
  heroBg:      { position: "fixed", inset: 0, zIndex: -1, overflow: "hidden" },
  gridLines:   { position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: "60px 60px", opacity: .4 },
  heroGlow1:   { position: "absolute", top: -200, left: "30%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,106,.12) 0%, transparent 70%)" },
  heroGlow2:   { position: "absolute", bottom: 0, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,125,216,.1) 0%, transparent 70%)" },
  heroInner:   { maxWidth: 1200, margin: "0 auto", padding: "120px 24px 80px", display: "flex", alignItems: "center", gap: 60, minHeight: "100vh" },
  heroContent: { flex: "1 1 500px", minWidth: 0 },
  heroBadge:   { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,175,106,.1)", border: `1px solid rgba(212,175,106,.3)`, color: C.accent, padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 28 },
  badgeDot:    { width: 6, height: 6, borderRadius: "50%", background: C.accent },
  heroH1:      { fontSize: "clamp(40px, 5.5vw, 72px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", margin: "0 0 24px" },
  heroAccent:  { color: C.accent },
  heroSub:     { fontSize: 18, color: C.muted, lineHeight: 1.7, maxWidth: 480, margin: "0 0 36px" },
  heroCta:     { display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" },
  btnPrimary:  { background: C.accent, color: "#0b0e14", fontWeight: 700, fontSize: 15, padding: "14px 28px", borderRadius: 10, textDecoration: "none", display: "inline-block" },
  btnOutline:  { color: C.text, border: `1px solid ${C.border}`, fontWeight: 600, fontSize: 15, padding: "14px 24px", borderRadius: 10, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.03)" },
  playIcon:    { fontSize: 11, background: C.accent, color: "#0b0e14", width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  heroNote:    { fontSize: 12, color: C.muted, marginTop: 20 },

  // Stats
  stats:     { display: "flex", justifyContent: "center", background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` },
  statItem:  { flex: "1 1 200px", padding: "40px 32px", textAlign: "center", borderRight: `1px solid ${C.border}` },
  statValue: { fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", color: C.accent },
  statLabel: { fontSize: 13, color: C.muted, marginTop: 6, textTransform: "uppercase", letterSpacing: ".08em" },

  // Features
  features:    { maxWidth: 1200, margin: "0 auto", padding: "100px 24px" },
  sectionTag:  { display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.accent, marginBottom: 18 },
  sectionH2:   { fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.025em", margin: "0 0 18px" },
  sectionSub:  { fontSize: 17, color: C.muted, maxWidth: 540, lineHeight: 1.7, margin: "0 0 60px" },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" },
  featCard:    { background: C.surface, padding: "36px 32px", cursor: "default", transition: "background .25s" },
  featIcon:    { fontSize: 28, marginBottom: 12, color: C.accent },
  featTag:     { display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: C.blue, background: "rgba(59,125,216,.12)", padding: "3px 10px", borderRadius: 100, marginBottom: 14 },
  featTitle:   { fontSize: 18, fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.01em" },
  featDesc:    { fontSize: 14, color: C.muted, lineHeight: 1.7 },

  // Testimonials
  testimonials:    { background: C.surface, borderTop: `1px solid ${C.border}`, padding: "100px 24px", textAlign: "center" },
  testimonialWrap: { position: "relative", maxWidth: 680, margin: "48px auto 0" },
  testimonialCard: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "40px 48px", textAlign: "left" },
  quoteText:       { fontSize: 20, lineHeight: 1.65, fontStyle: "italic", color: C.text, margin: "0 0 28px" },
  quoteAuthor:     { display: "flex", alignItems: "center", gap: 16 },
  avatar:          { width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accentDark}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#0b0e14", flex: "none" },
  authorName:      { fontWeight: 700, fontSize: 15 },
  authorRole:      { fontSize: 13, color: C.muted },
  dots:            { display: "flex", justifyContent: "center", gap: 8, marginTop: 32 },
  dot:             { width: 8, height: 8, borderRadius: "50%", background: C.border, border: "none", cursor: "pointer", transition: "background .3s, width .3s" },
  dotActive:       { background: C.accent, width: 24, borderRadius: 4 },

  // CTA Banner
  ctaBanner:     { position: "relative", padding: "100px 24px", textAlign: "center", overflow: "hidden" },
  ctaBannerGlow: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,106,.1) 0%, transparent 70%)", pointerEvents: "none" },
  ctaH2:         { fontSize: "clamp(28px, 4vw, 50px)", fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 18px" },
  ctaSub:        { fontSize: 17, color: C.muted, margin: "0 0 40px" },

  // Footer
  footer:       { background: C.surface, borderTop: `1px solid ${C.border}`, padding: "48px 24px 32px" },
  footerTop:    { maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24, paddingBottom: 32, borderBottom: `1px solid ${C.border}` },
  logo:         { display: "flex", alignItems: "center", gap: 10 },
  logoMark:     { fontSize: 22, color: C.accent },
  logoText:     { fontSize: 18, color: C.text, letterSpacing: "-0.02em" },
  footerLinks:  { display: "flex", flexWrap: "wrap", gap: "8px 24px" },
  footerLink:   { color: C.muted, textDecoration: "none", fontSize: 13 },
  footerBottom: { maxWidth: 1200, margin: "24px auto 0", display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, flexWrap: "wrap", gap: 8 },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #0b0e14; }
  a:hover { opacity: .8; }
  .feat-card:hover { background: #161d2b !important; }
  @media (max-width: 700px) {
    [style*="flex: 0 0 340"] { display: none; }
  }
`;