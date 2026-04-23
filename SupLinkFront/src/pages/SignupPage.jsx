import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/Auth.module.css";

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
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Account</h1>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Username</label>
            <input name="username" type="text" required
              value={form.username} onChange={handleChange} placeholder="Username" />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input name="email" type="email" required
              value={form.email} onChange={handleChange} placeholder="Email" />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input name="password" type="password" required
              value={form.password} onChange={handleChange} placeholder="Min. 8 characters" />
          </div>
          <div className={styles.field}>
            <label>Confirm Password</label>
            <input name="confirm" type="password" required
              value={form.confirm} onChange={handleChange} placeholder="Confirm Password" />
          </div>
          <div className={styles.field}>
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange} className={styles.select}>
              <option value="vendor">Vendor</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className={styles.footer}>
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}