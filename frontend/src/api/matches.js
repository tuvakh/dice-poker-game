import { BASE_URL, handleResponse, getAuthHeaders } from "./config.js";

// Fetches a list of matches with optional filters
export async function getAllMatches({ status, page, limit, userId, gameCategoryId } = {}) {
    // URLSearchParams builds the query string cleanly without manual string concatenation
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (userId) params.append("userId", userId);
    if (gameCategoryId) params.append("gameCategoryId", gameCategoryId);

    const res = await fetch(`${BASE_URL}/matches?${params}`);
    return handleResponse(res);
}

// Fetches a single match by its matchId
export async function getMatch(id) {
    const res = await fetch(`${BASE_URL}/matches/${id}`);
    return handleResponse(res);
}

// Creates a new match and returns it 
// data contains gameCategoryId, players, etc.
export async function createMatch(data) {
    const res = await fetch(`${BASE_URL}/matches`, {
        method: "POST",
        // JSON.stringify converts the JS object to a string the backend can read
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// Adds a player to an existing waiting match
// userId is required. Anonymous users cannot join matches
export async function joinMatch(id, userId) {
    const res = await fetch(`${BASE_URL}/matches/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId })
    });
    return handleResponse(res);
}

// Joins the matchmaking queue for a given game category
// Returns { status: "matched", match } immediately if an opponent is found, otherwise { status: "waiting" }
export async function joinQueue(userId, gameCategoryId) {
    const res = await fetch(`${BASE_URL}/matches/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId, gameCategoryId })
    });
    return handleResponse(res);
}

// Removes the user from the matchmaking queue
export async function leaveQueue(userId) {
    const res = await fetch(`${BASE_URL}/matches/queue`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId })
    });
    return handleResponse(res);
}

export async function leaveMatch(id, userId) {
    const res = await fetch(`${BASE_URL}/matches/${id}/leave`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId })
    });
    return handleResponse(res);
}

