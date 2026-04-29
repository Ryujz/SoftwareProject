import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getGroupMessages } from "../api/groupChat";
import { useSocket } from "../context/socketContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../Components/NavBar";
import "../styles/chat.css"; // reuse same styles

export default function GroupChatPage() {
  const { id: groupChatId } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const { socket } = useSocket() ?? {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  // Load history
  useEffect(() => {
    if (!groupChatId) return;
    getGroupMessages(groupChatId).then(setMessages).catch(console.error);
  }, [groupChatId]);

  // Join room + listen
  useEffect(() => {
    if (!groupChatId || !socket) return;

    socket.emit("join_group_chat", { groupChatId: Number(groupChatId) });
    socket.on("joined_group_chat", (data) => console.log("Joined group room:", data));
    socket.on("receive_group_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("socket_error", (err) => console.error("Socket error:", err.message));

    return () => {
      socket.off("joined_group_chat");
      socket.off("receive_group_message");
      socket.off("socket_error");
    };
  }, [groupChatId, socket]);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit("send_group_message", {
      groupChatId: Number(groupChatId),
      message: input.trim(),
    });
    setInput("");
  };

  return (
    <div className="chatPage">
      <Navbar />
      <div style={{ padding: "20px" }}>
        <h1>{state?.groupName ?? "Group Chat"}</h1>
        {state?.projectTitle && (
          <p style={{ margin: 0, color: "#7a8499", fontSize: 13 }}>
            Project: {state.projectTitle}
          </p>
        )}
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