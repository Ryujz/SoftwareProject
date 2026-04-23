const BASE = "/api/suppliers";
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getMyProfile = async () => {
  const res = await fetch(`${BASE}/profile/me/view`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.supplier;
};

export const getMyPortfolios = async () => {
  const res = await fetch(`${BASE}/portfolio/me/view`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.portfolios;
};

export const upsertMyProfile = async (profileData) => {
  const res = await fetch(`${BASE}/profile/me`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(profileData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};
export const getSupplierReviews = async (supplierId) => {
  const res = await fetch(`/api/reviews/supplier/${supplierId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.reviews;
};

export const getSupplierReviewSummary = async (supplierId) => {
  const res = await fetch(`/api/reviews/supplier/${supplierId}/summary`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.summary;
};