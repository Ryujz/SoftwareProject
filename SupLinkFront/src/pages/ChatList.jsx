import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyPrivateChats } from "../api/chat";
import { useAuth } from "../context/AuthContext";
import Navbar from "../Components/NavBar";
import "../styles/chatList.css";

export default function ChatListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPrivateChats()
      .then(setChats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="chatListPage">
      <Navbar />
      <h2 className="chatListTitle" style={{ padding: "20px" }}>Messages</h2>

      <div className="chatList">
        {loading ? (
          <p style={{ padding: "20px" }}>Loading chats...</p>
        ) : chats.length === 0 ? (
          <p style={{ padding: "20px", color: "#7a8499" }}>No chats yet.</p>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className="chatItem"
              onClick={() => navigate(`/chat/${chat.id}`, { state: { chatName: chat.other_username } })}
            >
              <div className="chatAvatar">
                {chat.other_username?.slice(0, 2).toUpperCase()}
              </div>
              <div className="chatInfo">
                <div className="chatTop">
                  <span className="chatName">{chat.other_username}</span>
                </div>
                <div className="chatLast">{chat.other_email}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}