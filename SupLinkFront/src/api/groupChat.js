const BASE = "/api/group-chat";
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getMyGroupChats = async () => {
  const res = await fetch(`${BASE}/my-groups/list`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.groups;
};

export const getGroupMessages = async (groupChatId) => {
  const res = await fetch(`${BASE}/${groupChatId}/messages`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.messages;
};