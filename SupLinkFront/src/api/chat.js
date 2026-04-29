const BASE = "/api/chat";
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getMyPrivateChats = async () => {
  const res = await fetch(`${BASE}/private`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.chats;
};

export const startPrivateChat = async (otherUserId) => {
  const res = await fetch(`${BASE}/private/start`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ other_user_id: otherUserId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const getChatMessages = async (chatId) => {
  const res = await fetch(`${BASE}/private/${chatId}/messages`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.messages;
};