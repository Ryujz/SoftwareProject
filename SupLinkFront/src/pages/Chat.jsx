import { useState, useRef, useEffect } from "react";
import "../styles/chat.css";
import Navbar from "../Components/NavBar";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Welcome to SupplyLink chat." }
  ]);
  const [input, setInput] = useState("");

  const endRef = useRef(null);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);

    // fake bot reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Got it. Processing your request..." }
      ]);
    }, 800);

    setInput("");
  };

  // auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chatPage">
      <Navbar />
    <div style={{ padding: "20px" }}>
        <h1>Marketplace</h1>
    </div>
      {/* Messages */}
      <div className="chatBody">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chatBubble ${m.sender === "user" ? "user" : "bot"}`}
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="chatInputWrap">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}