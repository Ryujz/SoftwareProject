const BASE = "/api/supply-chain";
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ─────────────────────────────────────────────────────────────
// VENDOR APIs
// ─────────────────────────────────────────────────────────────

// Vendor creates a task in project
export const createSupplyChainTask = async (projectId, taskData) => {
  const res = await fetch(`${BASE}/${projectId}/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(taskData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

// Vendor views all tasks in a project
export const getProjectSupplyChainTasks = async (projectId) => {
  const res = await fetch(`${BASE}/${projectId}/tasks`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.tasks;
};

// Vendor edits a supply chain task
export const updateSupplyChainTask = async (taskId, taskData) => {
  const res = await fetch(`${BASE}/tasks/${taskId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(taskData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

// ─────────────────────────────────────────────────────────────
// SUPPLIER APIs
// ─────────────────────────────────────────────────────────────

// Supplier views tasks assigned to them
export const getMySupplyChainTasks = async () => {
  const res = await fetch(`${BASE}/my-tasks/list`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.tasks;
};

// Supplier updates own task status
export const updateTaskStatus = async (taskId, status, note = null) => {
  const res = await fetch(`${BASE}/tasks/${taskId}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status, note }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

// Supplier views all tasks in a project they are involved in
export const getProjectSupplyChainOverview = async (projectId) => {
  const res = await fetch(`${BASE}/project/${projectId}/overview`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.tasks;
};
