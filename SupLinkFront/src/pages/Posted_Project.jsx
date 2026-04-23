import { useState, useEffect, useRef } from "react";
import Navbar from "../Components/NavBar";
import "../styles/Global.css";
import CreateProjectButton from "../Components/createProject/CreateProject";
import CreateProjectModal from "../Components/createProject/CreateProjectModal";

export default function PostedProject() {
  const [open, setOpen] = useState(false);

    return (
        <>
            <Navbar />
            <CreateProjectButton onClick={() => setOpen(!open)} />

            <CreateProjectModal open={open} onClose={() => setOpen(false)} />
            <div style={{ padding: "20px" }}>
                <h1>Posted Project</h1>
            </div>
        </>
    );
}