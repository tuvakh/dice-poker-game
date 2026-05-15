import { BASE_URL, handleResponse } from "./config.js";

// Game categories define the 18 possible game variants
// They are stored in the backend and fetched here so the frontend can build the selector dropdowns

// Fetches all available game categories
export async function getAllGameCategories() {
    const res = await fetch(`${BASE_URL}/gamecategories`);
    return handleResponse(res);
}

// Fetches a single game category by ID 
export async function getGameCategory(id) {
    const res = await fetch(`${BASE_URL}/gamecategories/${id}`);
    return handleResponse(res);
}
