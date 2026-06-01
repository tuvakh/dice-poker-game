// Chanya
import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

// Fetches all tournaments, optionally filtered by status
export async function getAllTournaments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`${BASE_URL}/tournaments${query ? "?" + query : ""}`);
    return handleResponse(res);
}

// Fetches a single tournament by its public tournamentId
export async function getTournament(id) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}`);
    return handleResponse(res);
}

// Registers a user for a tournament
// userId is sent in the request body so the backend knows who is joining
export async function joinTournament(id, userId) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}/join`, {
        method: "POST",
        body: JSON.stringify({ userId })
    });
    return handleResponse(res);
}

// Removes a user from a tournament — allowed at any point until the tournament is finished/cancelled
export async function leaveTournament(id, userId) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}/leave`, {
        method: "DELETE",
        body: JSON.stringify({ userId })
    });
    return handleResponse(res);
}

// Creates a tournament (admin only)
export async function createTournament(data) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments`, {
        method: "POST",
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// Permanently deletes a tournament (admin only)
export async function deleteTournament(id) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}`, {
        method: "DELETE"
    });
    return handleResponse(res);
}

// Marks a tournament as cancelled without deleting it (admin only)
export async function cancelTournament(id) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}/cancel`, {
        method: "PUT"
    });
    return handleResponse(res);
}
