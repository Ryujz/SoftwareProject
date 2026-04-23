import { useNavigate } from "react-router-dom";
import "./CreateProject.css";
export default function CreateProjectButton({ onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(); // custom logic if provided
    } else {
      navigate("/create-project"); // default route
    }
  };

  return (
    <button className="createProjectBtn" onClick={handleClick}>
      <span className="plus">＋</span>
      Create Project
    </button>
  );
}