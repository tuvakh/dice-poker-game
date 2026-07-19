import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

export async function getAllGameCategories() {
    const res = await fetchWithAuth(`${BASE_URL}/gamecategories`);
    return handleResponse(res);
}
