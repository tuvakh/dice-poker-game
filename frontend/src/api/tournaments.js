import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

export async function getAllTournaments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`${BASE_URL}/tournaments${query ? "?" + query : ""}`);
    return handleResponse(res);
}

export async function getTournament(id) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}`);
    return handleResponse(res);
}

export async function joinTournament(id) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}/join`, {
        method: "POST"
    });
    return handleResponse(res);
}

export async function leaveTournament(id) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}/leave`, {
        method: "DELETE"
    });
    return handleResponse(res);
}

export async function createTournament(data) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments`, {
        method: "POST",
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

export async function updateTournament(id, data) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

export async function deleteTournament(id) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}`, {
        method: "DELETE"
    });
    return handleResponse(res);
}

export async function cancelTournament(id) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}/cancel`, {
        method: "PUT"
    });
    return handleResponse(res);
}

export async function startRound(id) {
    const res = await fetchWithAuth(`${BASE_URL}/tournaments/${id}/nextRound`, {
        method: "PUT"
    });
    return handleResponse(res);
}
