import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

export async function getActivity() {
    const res = await fetchWithAuth(`${BASE_URL}/activities`);
    return handleResponse(res);
}