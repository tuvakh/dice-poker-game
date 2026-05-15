import { BASE_URL, handleResponse } from "./config.js";

// Fetches all tournaments
export async function getAllTournaments() {
    const res = await fetch(`${BASE_URL}/tournaments`);
    return handleResponse(res);
}

// Fetches a single tournament by ID
export async function getTournament(id) {
    const res = await fetch(`${BASE_URL}/tournaments/${id}`);
    return handleResponse(res);
}

// Registers a user for a tournament
// userId is sent in the request body so the backend knows who is joining
export async function joinTournament(id, userId) {
    const res = await fetch(`${BASE_URL}/tournaments/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
    });
    return handleResponse(res);
}
