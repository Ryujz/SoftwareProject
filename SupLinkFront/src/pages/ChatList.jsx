import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyPrivateChats } from "../api/chat";
import { getMyGroupChats } from "../api/groupChat";
import { useAuth } from "../context/AuthContext";
import Navbar from "../Components/NavBar";
import "../styles/chatList.css";

export default function ChatListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyPrivateChats(), getMyGroupChats()])
      .then(([privateChats, groupChats]) => {
        const normalized = [
          ...privateChats.map((c) => ({
            id: c.id,
            type: "private",
            name: c.other_username,
            sub: c.other_email,
            raw: c,
          })),
          ...groupChats.map((g) => ({
            id: g.id,
            type: "group",
            name: g.group_name,
            sub: g.project_title,
            isArchived: g.is_archived,
            raw: g,
          })),
        ];
        setChats(normalized);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (chat) => {
    if (chat.type === "private") {
      navigate(`/chat/${chat.id}`, { state: { chatName: chat.name } });
    } else {
      navigate(`/group-chat/${chat.id}`, {
        state: { groupName: chat.name, projectTitle: chat.sub },
      });
    }
  };

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
              key={`${chat.type}-${chat.id}`}
              className="chatItem"
              onClick={() => handleClick(chat)}
            >
              <div className="chatAvatar">
                {chat.type === "group" && (
                  <span className="groupBadge">G</span>
                )}
                {chat.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="chatInfo">
                <div className="chatTop">
                  <span className="chatName">{chat.name}</span>
                  {chat.isArchived && (
                    <span style={{ fontSize: 11, color: "#aaa", marginLeft: 6 }}>
                      Archived
                    </span>
                  )}
                </div>
                <div className="chatLast">{chat.sub}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}