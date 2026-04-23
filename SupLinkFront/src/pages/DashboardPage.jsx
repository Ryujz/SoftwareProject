import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Dashboard.module.css";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Welcome, {user?.username} 👋</h1>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
        <button onClick={handleLogout} className={styles.btn}>Log Out</button>
      </div>
    </div>
  );
}