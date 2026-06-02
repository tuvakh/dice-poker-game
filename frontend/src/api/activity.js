import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

// Fetches the global activity feed (recent events across the platform)
export async function getActivity() {
    const res = await fetchWithAuth(`${BASE_URL}/activities`);
    return handleResponse(res);
}