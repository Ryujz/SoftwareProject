import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getChatMessages } from "../api/chat";
import { useSocket } from "../context/socketContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../Components/NavBar";
import "../styles/chat.css";

export default function ChatPage() {
  const { id: chatId } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const { socket } = useSocket() ?? {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  // Load history
  useEffect(() => {
    if (!chatId) return;
    getChatMessages(chatId).then(setMessages).catch(console.error);
  }, [chatId]);

  // Join room + listen for messages
  useEffect(() => {
    if (!chatId || !socket) return;

    socket.emit("join_private_chat", { chatId: Number(chatId) });
    socket.on("joined_private_chat", (data) => console.log("Joined room:", data));
    socket.on("receive_private_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("socket_error", (err) => console.error("Socket error:", err.message));

    return () => {
      socket.off("joined_private_chat");
      socket.off("receive_private_message");
      socket.off("socket_error");
    };
  }, [chatId, socket]);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit("send_private_message", {
      chatId: Number(chatId),
      message: input.trim(),
    });
    setInput("");
  };

  return (
    <div className="chatPage">
      <Navbar />
      <div style={{ padding: "20px" }}>
        <h1>{state?.chatName ?? "Chat"}</h1>
      </div>

      <div className="chatBody">
        {messages.map((m, i) => {
          const isMe = m.sender_id === user?.id;
          return (
            <div key={i} className={`chatBubble ${isMe ? "user" : "bot"}`}>
              {!isMe && (
                <span style={{ fontSize: 11, color: "#7a8499", display: "block", marginBottom: 2 }}>
                  {m.sender_username}
                </span>
              )}
              {m.message}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

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