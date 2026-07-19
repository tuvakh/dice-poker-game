import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

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

export async function getMatch(id, signal) {
    const res = await fetchWithAuth(`${BASE_URL}/matches/${id}`, { signal });
    return handleResponse(res);
}

export async function createMatch(data) {
    const res = await fetchWithAuth(`${BASE_URL}/matches`, {
        method: "POST",
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

export async function joinMatch(id) {
    const res = await fetchWithAuth(`${BASE_URL}/matches/${id}/join`, {
        method: "POST"
    });
    return handleResponse(res);
}

export async function leaveMatch(id) {
    const res = await fetchWithAuth(`${BASE_URL}/matches/${id}/leave`, {
        method: "DELETE"
    });
    return handleResponse(res);
}

