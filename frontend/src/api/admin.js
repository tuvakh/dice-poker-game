import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

export async function getAdminStats() {
    const res = await fetchWithAuth(`${BASE_URL}/admin/stats`);
    return handleResponse(res);
}

export default { getAdminStats };
