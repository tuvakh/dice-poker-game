import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

// Fetches aggregate platform statistics for the admin dashboard (user counts, match stats, etc.)
export async function getAdminStats() {
    const res = await fetchWithAuth(`${BASE_URL}/admin/stats`);
    return handleResponse(res);
}
