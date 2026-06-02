import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

// Fetches a list of matches with optional filters
// signal is an AbortSignal passed from usePolling so the request is cancelled on cleanup
export async function getAllMatches({ status, page, limit, userId, gameCategoryId } = {}, signal) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (userId) params.append("userId", userId);
    if (gameCategoryId) params.append("gameCategoryId", gameCategoryId);

    const res = await fetchWithAuth(`${BASE_URL}/matches?${params}`, { signal });
    return handleResponse(res);
}

// Fetches a single match by its matchId
export async function getMatch(id, signal) {
    const res = await fetchWithAuth(`${BASE_URL}/matches/${id}`, { signal });
    return handleResponse(res);
}

// Creates a new match and returns it 
// data contains gameCategoryId, players, etc.
export async function createMatch(data) {
    const res = await fetchWithAuth(`${BASE_URL}/matches`, {
        method: "POST",
        // JSON.stringify converts the JS object to a string the backend can read
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// Adds the authenticated user to an existing waiting match — userId comes from the JWT cookie server-side
export async function joinMatch(id) {
    const res = await fetchWithAuth(`${BASE_URL}/matches/${id}/join`, {
        method: "POST"
    });
    return handleResponse(res);
}

// Removes the authenticated user from a waiting match — userId comes from the JWT cookie server-side
export async function leaveMatch(id) {
    const res = await fetchWithAuth(`${BASE_URL}/matches/${id}/leave`, {
        method: "DELETE"
    });
    return handleResponse(res);
}

