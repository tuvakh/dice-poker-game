// Chanya
import { BASE_URL, handleResponse, getAuthHeaders } from "./config.js";

// Fetches all tournaments, optionally filtered by status
export async function getAllTournaments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/tournaments${query ? "?" + query : ""}`);
    return handleResponse(res);
}

// Fetches a single tournament by its public tournamentId
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

// Removes a user from a tournament — allowed at any point until the tournament is finished/cancelled
export async function leaveTournament(id, userId) {
    const res = await fetch(`${BASE_URL}/tournaments/${id}/leave`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId })
    });
    return handleResponse(res);
}

// Creates a tournament (admin only)
export async function createTournament(data) {
    const res = await fetch(`${BASE_URL}/tournaments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// Updates a tournament's editable fields (admin only)
export async function updateTournament(id, data) {
    const res = await fetch(`${BASE_URL}/tournaments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// Permanently deletes a tournament (admin only)
export async function deleteTournament(id) {
    const res = await fetch(`${BASE_URL}/tournaments/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() }
    });
    return handleResponse(res);
}

// Marks a tournament as cancelled without deleting it (admin only)
export async function cancelTournament(id) {
    const res = await fetch(`${BASE_URL}/tournaments/${id}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() }
    });
    return handleResponse(res);
}

// Starts the next round of a tournament (admin only) — creates matches and transitions to ongoing
export async function startRound(id) {
    const res = await fetch(`${BASE_URL}/tournaments/${id}/knockoutRounds`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() }
    });
    return handleResponse(res);
}
