import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { AddPortfolio } from "../../api/supplier";
import "./CreatePortfolio.css";
export default function CreatePortfolioButton({ onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(); // custom logic if provided
    } else {
      navigate("/create-portfolio"); // default route
    }
  };

  return (
    <button className="createPortfolioBtn" onClick={handleClick}>
      <span className="plus">＋</span>
      Create Portfolio
    </button>
  );
}