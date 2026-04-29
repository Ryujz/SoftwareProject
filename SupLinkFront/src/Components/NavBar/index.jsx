import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = (role) => {
  const common = [
    {name: "Browse Supplies", path: "/marketplace"},
    {name: "Browse Projects", path: "/browse-projects"}
  ];
  const supplier = [
    {name: "My Portfolio", path: "/posted-portfolio"},
    {name: "My Tasks", path: "/my-tasks"},
  ]
  const vendor = [
    {name: "Posted Projects", path: "/posted-projects"},
  ]

  if (role === "supplier") {
    return [
      ...common,
      ...supplier
    ];
  }
  if (role === "vendor") {
    return [
      ...common,
      ...vendor
    ];
  }

  return common;
};
/**
 * Navbar
 * Props:
 *   links?: string[]   — override default nav links
 */
export default function Navbar({ links }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const navLinks = links || NAV_LINKS(user?.role);

  const getProfilePath = () => {
    if (!user) return "/login";
    if (user.role === "supplier") return "/SupplierProfile";
    if (user.role === "vendor") return "/VendorProfile";
    return "/profile";
  }
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
      <div style={s.navInner}>
        {/* Logo */}
        <div style={s.logo}>
          <span style={s.logoMark}>⬡</span>
          <Link to="/" style={s.logoText}>SupplyLink+</Link>
        </div>

        {/* Desktop links */}
        <div style={s.navLinks}>
          {navLinks.map((l) => (
            <Link key={l.name} to={l.path} style={s.navLink}>
              {l.name}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div style={s.navActions}>
          <Link to="/Chat" style={s.btnGhost}>
            Chat
          </Link>
          <Link to={getProfilePath(user)} style={s.btnSolid}>
            {user ? "My Profile" : "Login / Signup"}
          </Link>
        </div>

        {/* Hamburger */}
        <button style={s.hamburger} onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={s.mobileMenu}>
          {navLinks.map((l) => (
            <Link key={l.name} to={l.path} style={s.mobileLink}>
              {l.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const C = {
  bg: "#0b0e14",
  surface: "#121720",
  border: "#1e2736",
  text: "#e8eaf0",
  muted: "#7a8499",
  accent: "#d4af6a",
};

const s = {
  nav: {
    position: "fixed",
    top: 0, left: 0, right: 0,
    zIndex: 100,
    transition: "background .3s, border-bottom .3s, backdrop-filter .3s",
  },
  navScrolled: {
    background: "rgba(11,14,20,.92)",
    backdropFilter: "blur(14px)",
    borderBottom: `1px solid ${C.border}`,
  },
  navInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    height: 68,
    display: "flex",
    alignItems: "center",
    gap: 32,
  },
  logo: {
    display: "flex", alignItems: "center", gap: 10,
    textDecoration: "none", flex: "none",
  },
  logoMark: { fontSize: 22, color: C.accent },
  logoText: { fontSize: 18, color: C.text, letterSpacing: "-0.02em" },
  navLinks: { display: "flex", gap: 28, flex: 1 },
  navLink: {
    color: C.muted, textDecoration: "none",
    fontSize: 14, fontWeight: 500,
    letterSpacing: ".01em", transition: "color .2s",
  },
  navActions: { display: "flex", gap: 12, alignItems: "center" },
  btnGhost: {
    color: C.muted, textDecoration: "none",
    fontSize: 14, padding: "8px 16px",
    borderRadius: 8, transition: "color .2s",
  },
  btnSolid: {
    background: C.accent, color: "#0b0e14",
    fontSize: 14, fontWeight: 700,
    padding: "8px 20px", borderRadius: 8,
    textDecoration: "none", transition: "background .2s",
    display: "inline-block",
  },
  hamburger: {
    display: "none",          // shown via media query in global CSS
    background: "none", border: "none",
    color: C.text, fontSize: 22, cursor: "pointer",
  },
  mobileMenu: {
    display: "flex", flexDirection: "column",
    padding: "16px 24px 24px",
    background: C.surface,
    borderTop: `1px solid ${C.border}`,
  },
  mobileLink: {
    color: C.muted, textDecoration: "none",
    padding: "12px 0",
    borderBottom: `1px solid ${C.border}`,
    fontSize: 15,
  },
};