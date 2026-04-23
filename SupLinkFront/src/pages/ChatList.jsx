import { useNavigate } from "react-router-dom";
import "../styles/chatList.css";
import Navbar from "../Components/NavBar";

const chats = [
  { id: 1, name: "Apex Industrial", last: "Invoice received", time: "2m" },
  { id: 2, name: "Global Supplies", last: "Sent quotation", time: "10m" },
  { id: 3, name: "Nexlane Logistics", last: "Approved PO", time: "1h" },
];

export default function ChatListPage() {
  const navigate = useNavigate();

  return (
    <div className="chatListPage">
      <h2 className="chatListTitle" style = {{padding: "20px"}}>Messages</h2>
      <Navbar />

      <div className="chatList">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="chatItem"
            onClick={() => navigate(`/chat/${chat.id}`)}
          >
            <div className="chatAvatar">
              {chat.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="chatInfo">
              <div className="chatTop">
                <span className="chatName">{chat.name}</span>
                <span className="chatTime">{chat.time}</span>
              </div>
              <div className="chatLast">{chat.last}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}