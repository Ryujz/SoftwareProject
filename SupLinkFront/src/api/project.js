const BASE = "/api/projects";
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getAllProjects = async () => {
  const res = await fetch(`${BASE}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.projects;
}

export const getMyProjects = async () => {
  const res = await fetch(`${BASE}/my-projects`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.projects;
}

export const createProject = async (projectData) => {
  const res = await fetch(`${BASE}/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(projectData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.project;
}

export const getProjectById = async (projectId) => {
  const res = await fetch(`${BASE}/${projectId}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.project;
}

export const updateProject = async (projectId, projectData) => {
  const res = await fetch(`${BASE}/${projectId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(projectData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.project;
}

export const deleteProject = async (projectId) => {
  const res = await fetch(`${BASE}/${projectId}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.project;
}

export const submitInterest = async (projectId, message) => {
  const res = await fetch(`${BASE}/${projectId}/interested`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};