import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

// Game categories define the 18 possible game variants
// They are stored in the backend and fetched here so the frontend can build the selector dropdowns

// Fetches all available game categories
export async function getAllGameCategories() {
    const res = await fetchWithAuth(`${BASE_URL}/gamecategories`);
    return handleResponse(res);
}
