import { useState } from "react";
import "./createPortModal.css"
import { AddPortfolio } from "../../api/supplier";
export default function CreatePortModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [imageURL, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    
    const portfolioData = {
      title: name,
      description: desc,
      imageURL: imageURL,
      createdAt: new Date().toISOString()
    }

  try {
    await AddPortfolio(portfolioData);

    //success -> clear fields
    if (onSuccess) {
      onSuccess();
      setName("");
      setDesc("");
      setImageUrl("");
      onClose();
    }
  } catch (err) {
    console.error("Error creating portfolio:", err);
    setError(err.message || "Failed to create portfolio");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className="modalBox"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Create Portfolio</h2>

        <input
          placeholder="Portfolio Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <input 
        placeholder = "Image URL"
        value={imageURL}
        onChange={(e) => setImageUrl(e.target.value)}
        />

        <div className="modalActions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit}>Create</button>
        </div>
      </div>
    </div>
  );
}