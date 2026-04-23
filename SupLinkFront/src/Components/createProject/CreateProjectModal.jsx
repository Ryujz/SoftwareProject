import { useState } from "react";
import "./createProjectModal.css"
export default function CreateProjectModal({ open, onClose }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    console.log({ name, desc });
    onClose();
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className="modalBox"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Create Project</h2>

        <input
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <div className="modalActions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit}>Create</button>
        </div>
      </div>
    </div>
  );
}