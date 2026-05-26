import { BASE_URL, handleResponse, getAuthHeaders } from "./config.js";

// Fetches all tournaments, optionally filtered by status
export async function getAllTournaments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/tournaments${query ? "?" + query : ""}`);
    return handleResponse(res);
}

// Fetches a single tournament by ID
export async function getTournament(id) {
    const res = await fetch(`${BASE_URL}/tournaments/${id}`);
    return handleResponse(res);
}

// Registers a user for a tournament
// userId is sent in the request body so the backend knows who is joining
// getAuthHeaders() adds X-User-Role so the requireUser middleware lets the request through
export async function joinTournament(id, userId) {
    const res = await fetch(`${BASE_URL}/tournaments/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId })
    });
    return handleResponse(res);
}
