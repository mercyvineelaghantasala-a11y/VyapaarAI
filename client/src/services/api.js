export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function getLeads() {
  const response = await fetch(`${API_URL}/leads`);

  if (!response.ok) {
    throw new Error("Failed to fetch leads");
  }

  return response.json();
}

export async function addLead(lead) {
  const response = await fetch(`${API_URL}/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lead),
  });

  if (!response.ok) {
    throw new Error("Failed to add lead");
  }

  return response.json();
}
export async function markLeadAsContacted(id, contacted) {
  const response = await fetch(`${API_URL}/leads/${id}/contacted`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contacted }),
  });

  if (!response.ok) {
    throw new Error("Failed to mark lead as contacted");
  }

  return response.json();
}