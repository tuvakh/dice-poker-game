import { BASE_URL, handleResponse } from "./config.js";

export async function getAdminStats() {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { "X-User-Role": "admin" }
    });
    return handleResponse(res);
}

export default { getAdminStats };
